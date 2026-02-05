import { defineStore } from 'pinia'

interface WakeLockState {
  isActive: boolean
  timerActive: boolean
  remainingTime: number
}

interface WakeLockMessage {
  type: 'sync' | 'closed'
  state?: WakeLockState
}

export const useWakeLockStore = defineStore('wakeLock', () => {
  const route = useRoute()
  const { trackEvent } = useAnalytics()

  const isLoading = ref(true)
  const isSupported = ref(false)
  const isActive = ref(false)
  const wakeLock = ref<WakeLockSentinel | null>(null)

  const isIframePip = ref(false)
  const isPipMode = ref(false)
  const pipWindowRef = ref<Window | null>(null)

  const timerActive = ref(false)
  const timerDuration = ref(0)
  const remainingTime = ref(0)
  const timerInterval = ref<NodeJS.Timeout | null>(null)

  const isAcquiring = ref(false)

  const hasActivePipWindow = computed(() => pipWindowRef.value !== null && !pipWindowRef.value.closed)

  const isParentWithActivePip = computed(() =>
    !isIframePip.value && hasActivePipWindow.value
  )

  const shouldSyncState = computed(() => isIframePip.value || !hasActivePipWindow.value)

  async function checkSupport() {
    isLoading.value = true
    if (route.query.fallback === '1') {
      isSupported.value = false
      isLoading.value = false
      return
    }

    isSupported.value = 'wakeLock' in navigator
    isLoading.value = false
  }

  function createTimerInterval() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    timerInterval.value = setInterval(() => {
      remainingTime.value--

      if (remainingTime.value <= 0) {
        trackEvent('timer_expired_auto_release')
        release()
      }
    }, 1000)
  }

  async function establishNativeWakeLock() {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
      wakeLock.value.addEventListener('release', () => {
        const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
        trackEvent(`wake_lock_auto_released_${timerStatus}`)

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
      trackEvent('wake_lock_acquire_failed')
      return false
    }
  }

  async function acquire() {
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
        return false
      }
    } finally {
      isAcquiring.value = false
    }
  }

  async function release() {
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

  async function forceReleaseParent() {
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

  async function toggle() {
    if (isActive.value) {
      await release()
    } else {
      await acquire()
    }
  }

  async function startTimer(minutes: number) {
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

  function stopTimer() {
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

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  function createSyncMessage(): WakeLockMessage {
    return {
      type: 'sync',
      state: {
        isActive: isActive.value,
        timerActive: timerActive.value,
        remainingTime: remainingTime.value
      }
    }
  }

  function syncWakeLockState() {
    const message = createSyncMessage()

    if (isIframePip.value && window.parent !== window) {
      try {
        window.parent.postMessage(message, window.location.origin)
      } catch (e) {
        console.warn('Could not send to window.parent:', e)
      }
    }

    if (!isIframePip.value && pipWindowRef.value && !pipWindowRef.value.closed) {
      try {
        pipWindowRef.value.postMessage(message, window.location.origin)
      } catch (e) {
        console.warn('Could not send to PiP window:', e)
      }
    }
  }

  function initialSyncToPip() {
    if (pipWindowRef.value && !pipWindowRef.value.closed) {
      try {
        pipWindowRef.value.postMessage(createSyncMessage(), window.location.origin)
      } catch (e) {
        console.warn('Could not send initial sync to PiP window:', e)
      }
    }
  }

  function handleSync(state: WakeLockState) {
    if (isIframePip.value) {
      if (timerInterval.value && state.timerActive && remainingTime.value === state.remainingTime) {
        return
      }

      remainingTime.value = state.remainingTime
      timerActive.value = state.timerActive

      if (state.timerActive && state.remainingTime > 0 && !timerInterval.value) {
        createTimerInterval()
      }

      if (state.isActive && !isActive.value) {
        acquire()
      } else if (!state.isActive && isActive.value) {
        release()
      }
    } else {
      isActive.value = state.isActive
      timerActive.value = state.timerActive
      remainingTime.value = state.remainingTime
    }
  }

  async function handlePipClosed() {
    const wasActive = isActive.value
    pipWindowRef.value = null
    const activeStatus = wasActive ? 'was_active' : 'was_inactive'
    const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
    trackEvent(`pip_closed_${activeStatus}_${timerStatus}`)

    await nextTick()

    if (wasActive) {
      const reacquireSuccess = await acquire()

      const result = reacquireSuccess ? 'success' : 'failed'
      trackEvent(`wake_lock_reacquire_${result}`)

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

  function handleMessage(event: MessageEvent<WakeLockMessage>) {
    if (event.origin !== window.location.origin) {
      trackEvent('cross_window_message_origin_mismatch')
      return
    }

    const { type, state } = event.data

    if (type === 'sync' && state) {
      handleSync(state)
      return
    }

    if (type === 'closed' && !isIframePip.value) {
      handlePipClosed()
    }
  }

  async function initialize() {
    if (typeof window !== 'undefined') {
      isPipMode.value = route.query.pip === '1'
      isIframePip.value = isPipMode.value && window.parent !== window

      window.addEventListener('message', handleMessage)

      if (isIframePip.value) {
        window.addEventListener('beforeunload', () => {
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'closed' }, window.location.origin)
            }
          } catch (e) {
            console.warn('Could not send pip-closed message to parent:', e)
          }
        })
      }
    }

    await checkSupport()
  }

  function cleanup() {
    release()

    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage)
    }
  }

  return {
    isLoading,
    isSupported,
    isActive,
    timerActive,
    timerDuration,
    remainingTime,
    isIframePip,
    isPipMode,
    pipWindowRef,
    hasActivePipWindow,
    isParentWithActivePip,
    shouldSyncState,
    checkSupport,
    acquire,
    release,
    toggle,
    startTimer,
    stopTimer,
    formatTime,
    syncWakeLockState,
    initialSyncToPip,
    forceReleaseParent,
    initialize,
    cleanup
  }
})
