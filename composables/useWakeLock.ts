interface WakeLockMessageData {
  type: string
  isActive: boolean
  timerActive: boolean
  remainingTime: number
}

export const useWakeLock = () => {
  const route = useRoute()
  const { trackEvent } = useAnalytics()
  const isSupported = ref(false)
  const isActive = ref(false)
  const wakeLock = ref<WakeLockSentinel | null>(null)

  const isPopup = ref(false)
  const isIframePip = ref(false)
  const isPipMode = ref(false)
  const popupRef = ref<Window | null>(null)
  const hasActivePopup = computed(() => popupRef.value !== null && !popupRef.value.closed)

  const isParentWithActivePopup = computed(() =>
    !isPopup.value && !isIframePip.value && hasActivePopup.value
  )
  const isChildWindow = computed(() => isPopup.value || isIframePip.value)
  const shouldSyncState = computed(() => isChildWindow.value || !hasActivePopup.value)

  const timerActive = ref(false)
  const timerDuration = ref(0)
  const remainingTime = ref(0)
  const timerInterval = ref<NodeJS.Timeout | null>(null)
  const isAcquiring = ref(false) // Mutex for acquire/release operations

  const checkSupport = () => {
    if (route.query.fallback === '1') {
      isSupported.value = false
      return
    }

    isSupported.value = 'wakeLock' in navigator
  }

  // Helper: Create timer interval (consolidated logic)
  const createTimerInterval = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    timerInterval.value = setInterval(() => {
      remainingTime.value--

      if (shouldSyncState.value) {
        syncWakeLockState()
      }

      if (remainingTime.value <= 0) {
        trackEvent('timer_expired_auto_release')
        release()
      }
    }, 1000)
  }

  const establishNativeWakeLock = async () => {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
      wakeLock.value.addEventListener('release', () => {
        const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
        trackEvent(`wakelock_auto_released_${timerStatus}`)

        wakeLock.value = null

        // Only update isActive if there's no popup managing the wake lock
        // When a popup is active, the parent's wake lock is intentionally released
        // and the popup manages its own wake lock. The parent's isActive state
        // reflects the overall system state (synced from popup), not just local wake lock.
        if (!hasActivePopup.value) {
          isActive.value = false
        }
      })
      return true
    } catch (error) {
      console.error('Failed to establish wake lock:', error)
      trackEvent('wake_lock_acquire_failed_native_api')
      return false
    }
  }

  const acquire = async () => {
    // Prevent concurrent acquire/release operations - check and set atomically
    if (isAcquiring.value) {
      return false
    }
    isAcquiring.value = true

    try {
      if (isParentWithActivePopup.value) {
        return false
      }

      if (isChildWindow.value && !isSupported.value) {
        return false
      }

      if (!isSupported.value) {
        return false
      }

      const success = await establishNativeWakeLock()
      if (success) {
        isActive.value = true

        if (shouldSyncState.value) {
          syncWakeLockState()
        }
        return true
      } else {
        trackEvent('wake_lock_establish_failed_native_api')
        return false
      }
    } finally {
      isAcquiring.value = false
    }
  }

  const release = async () => {
    // Prevent concurrent acquire/release operations - check and set atomically
    if (isAcquiring.value) {
      return
    }
    isAcquiring.value = true

    try {
      if (isParentWithActivePopup.value) {
        return
      }

      if (wakeLock.value) {
        try {
          await wakeLock.value.release()
          wakeLock.value = null
          isActive.value = false
        } catch (error) {
          console.error('Failed to release wake lock:', error)
        }
      }

      stopTimer()

      if (shouldSyncState.value) {
        syncWakeLockState()
      }
    } finally {
      isAcquiring.value = false
    }
  }

  // Force release parent lock when popup opens (bypasses popup active check)
  const forceReleaseParent = async () => {
    if (isChildWindow.value) return

    if (wakeLock.value) {
      try {
        await wakeLock.value.release()
        wakeLock.value = null
      } catch (error) {
        console.error('Failed to release parent wake lock:', error)
      }
    }
  }

  const startTimer = async (minutes: number) => {
    if (minutes <= 0) return false

    if (isParentWithActivePopup.value) {
      return false
    }

    if (!isActive.value) {
      const success = await acquire()
      if (!success) return false
    }

    timerDuration.value = minutes
    remainingTime.value = minutes * 60
    timerActive.value = true

    createTimerInterval()

    syncWakeLockState()
    return true
  }

  const stopTimer = () => {
    if (isParentWithActivePopup.value) {
      return
    }

    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    timerActive.value = false
    remainingTime.value = 0

    syncWakeLockState()
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const toggle = async () => {
    if (isActive.value) {
      await release()
    } else {
      await acquire()
    }
  }

  const createSyncMessage = (type: 'wake-lock-sync' | 'wake-lock-initial-sync'): WakeLockMessageData => ({
    type,
    isActive: isActive.value,
    timerActive: timerActive.value,
    remainingTime: remainingTime.value
  })

  const syncWakeLockState = () => {
    const message = createSyncMessage('wake-lock-sync')

    if (isPopup.value && window.opener) {
      try {
        if (!window.opener.closed) {
          window.opener.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send to window.opener:', e)
      }
    }

    if (isIframePip.value && window.parent !== window) {
      try {
        window.parent.postMessage(message, window.location.origin)
      } catch (e) {
        console.warn('Could not send to window.parent:', e)
      }
    }

    if (!isChildWindow.value && popupRef.value) {
      try {
        if (!popupRef.value.closed) {
          popupRef.value.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send to popup:', e)
      }
    }
  }

  const initialSyncToPopup = () => {
    if (popupRef.value) {
      try {
        if (!popupRef.value.closed) {
          const message = createSyncMessage('wake-lock-initial-sync')
          popupRef.value.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send initial sync to popup:', e)
      }
    }
  }

  const handleInitialSync = (data: WakeLockMessageData) => {
    // Prevent duplicate syncs if already synced AND time matches
    if (timerInterval.value && data.timerActive && remainingTime.value === data.remainingTime) {
      return
    }

    remainingTime.value = data.remainingTime
    timerActive.value = data.timerActive

    if (data.timerActive && data.remainingTime > 0 && !timerInterval.value) {
      createTimerInterval()
    }

    if (data.isActive && !isActive.value) {
      acquire()
    } else if (!data.isActive && isActive.value) {
      release()
    } else {
      setTimeout(() => {
        syncWakeLockState()
      }, 100)
    }
  }

  const handleWakeLockSync = (data: WakeLockMessageData) => {
    isActive.value = data.isActive
    timerActive.value = data.timerActive
    remainingTime.value = data.remainingTime

    const activeStatus = data.isActive ? 'active' : 'inactive'
    const timerStatus = data.timerActive ? 'with_timer' : 'without_timer'
    trackEvent(`popup_sync_received_${activeStatus}_${timerStatus}`)
  }

  const handlePopupClosed = async () => {
    const wasActive = isActive.value
    popupRef.value = null
    const activeStatus = wasActive ? 'was_active' : 'was_inactive'
    const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
    trackEvent(`popup_closed_${activeStatus}_${timerStatus}`)

    // Fix: Correct async/await pattern with nextTick
    await nextTick()

    if (wasActive) {
      const reacquireSuccess = await acquire()

      const result = reacquireSuccess ? 'success' : 'failed'
      trackEvent(`wakelock_reacquire_native_api_${result}`)

      // If reacquire failed, ensure clean state
      if (!reacquireSuccess) {
        isActive.value = false
        wakeLock.value = null
      }
    } else {
      if (wakeLock.value) {
        try {
          await wakeLock.value.release()
          wakeLock.value = null
          isActive.value = false
        } catch (error) {
          console.error(error)
          trackEvent('wake_lock_state_cleanup_error')
          isActive.value = false
          wakeLock.value = null
        }
      }
    }
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      trackEvent('cross_window_message_origin_mismatch')
      return
    }

    if (event.data.type === 'wake-lock-initial-sync' && isChildWindow.value) {
      handleInitialSync(event.data)
      return
    }

    if (event.data.type === 'wake-lock-sync' && !isChildWindow.value) {
      handleWakeLockSync(event.data)
      return
    }

    if (event.data.type === 'popup-closed' && !isChildWindow.value) {
      handlePopupClosed()
    }
  }

  onMounted(() => {
    checkSupport()

    if (typeof window !== 'undefined') {
      isPopup.value = window.opener !== null
      isPipMode.value = route.query.pip === '1'
      isIframePip.value = isPipMode.value && window.parent !== window

      window.addEventListener('message', handleMessage)

      if (isPopup.value) {
        window.addEventListener('beforeunload', () => {
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'popup-closed' }, window.location.origin)
            }
          } catch (e) {
            // Handle cross-origin exception - can't access window.opener.closed
            console.warn('Could not send popup-closed message to opener:', e)
          }
        })
      }

      if (isIframePip.value) {
        window.addEventListener('beforeunload', () => {
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'popup-closed' }, window.location.origin)
            }
          } catch (e) {
            // Handle cross-origin exception - can't access window.parent
            console.warn('Could not send popup-closed message to parent:', e)
          }
        })
      }
    }
  })

  onUnmounted(() => {
    release()

    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage)
    }
  })

  return {
    isSupported: readonly(isSupported),
    isActive: readonly(isActive),
    timerActive: readonly(timerActive),
    timerDuration: readonly(timerDuration),
    remainingTime: readonly(remainingTime),
    isPopup: readonly(isPopup),
    isIframePip: readonly(isIframePip),
    isPipMode: readonly(isPipMode),
    popupRef,
    hasActivePopup: readonly(hasActivePopup),
    acquire,
    release,
    toggle,
    startTimer,
    stopTimer,
    formatTime,
    syncWakeLockState,
    initialSyncToPopup,
    forceReleaseParent
  }
}