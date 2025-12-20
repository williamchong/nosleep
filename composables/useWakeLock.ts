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

  const isIframePip = ref(false)
  const isPipMode = ref(false)
  // Reference to the PiP window (Document Picture-in-Picture)
  const pipWindowRef = ref<Window | null>(null)
  const hasActivePipWindow = computed(() => pipWindowRef.value !== null && !pipWindowRef.value.closed)

  const isParentWithActivePip = computed(() =>
    !isIframePip.value && hasActivePipWindow.value
  )
  const shouldSyncState = computed(() => isIframePip.value || !hasActivePipWindow.value)

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

        // Only update isActive if there's no PiP window managing the wake lock
        // When a PiP window is active, the parent's wake lock is intentionally released
        // and the PiP iframe manages its own wake lock. The parent's isActive state
        // reflects the overall system state (synced from PiP), not just local wake lock.
        if (!hasActivePipWindow.value) {
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
      if (isParentWithActivePip.value) {
        return false
      }

      if (isIframePip.value && !isSupported.value) {
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
      if (isParentWithActivePip.value) {
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

  // Force release parent lock when PiP window opens (bypasses active check)
  const forceReleaseParent = async () => {
    if (isIframePip.value) return

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

    if (isParentWithActivePip.value) {
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
    if (isParentWithActivePip.value) {
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

    // If this is a PiP iframe, send sync to parent window
    if (isIframePip.value && window.parent !== window) {
      try {
        window.parent.postMessage(message, window.location.origin)
      } catch (e) {
        console.warn('Could not send to window.parent:', e)
      }
    }

    // If this is the parent with an active PiP window, send sync to it
    if (!isIframePip.value && pipWindowRef.value) {
      try {
        if (!pipWindowRef.value.closed) {
          pipWindowRef.value.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send to PiP window:', e)
      }
    }
  }

  const initialSyncToPip = () => {
    if (pipWindowRef.value) {
      try {
        if (!pipWindowRef.value.closed) {
          const message = createSyncMessage('wake-lock-initial-sync')
          pipWindowRef.value.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send initial sync to PiP window:', e)
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
    trackEvent(`pip_sync_received_${activeStatus}_${timerStatus}`)
  }

  const handlePipClosed = async () => {
    const wasActive = isActive.value
    pipWindowRef.value = null
    const activeStatus = wasActive ? 'was_active' : 'was_inactive'
    const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
    trackEvent(`pip_closed_${activeStatus}_${timerStatus}`)

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

    if (event.data.type === 'wake-lock-initial-sync' && isIframePip.value) {
      handleInitialSync(event.data)
      return
    }

    if (event.data.type === 'wake-lock-sync' && !isIframePip.value) {
      handleWakeLockSync(event.data)
      return
    }

    if (event.data.type === 'pip-closed' && !isIframePip.value) {
      handlePipClosed()
    }
  }

  onMounted(() => {
    checkSupport()

    if (typeof window !== 'undefined') {
      isPipMode.value = route.query.pip === '1'
      isIframePip.value = isPipMode.value && window.parent !== window

      window.addEventListener('message', handleMessage)

      // When PiP iframe is closing, notify parent window
      if (isIframePip.value) {
        window.addEventListener('beforeunload', () => {
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'pip-closed' }, window.location.origin)
            }
          } catch (e) {
            console.warn('Could not send pip-closed message to parent:', e)
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
    isIframePip: readonly(isIframePip),
    isPipMode: readonly(isPipMode),
    pipWindowRef,
    hasActivePipWindow: readonly(hasActivePipWindow),
    acquire,
    release,
    toggle,
    startTimer,
    stopTimer,
    formatTime,
    syncWakeLockState,
    initialSyncToPip,
    forceReleaseParent
  }
}