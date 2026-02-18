import { defineStore } from 'pinia'
import type { UseWakeLockReturn } from '@vueuse/core'

interface WakeLockState {
  isActive: boolean
  timerActive: boolean
  remainingTime: number
}

interface WakeLockMessage {
  type: 'wake-lock-sync' | 'pip-closed'
  state?: WakeLockState
}

export const useWakeLockStore = defineStore('wakeLock', () => {
  const route = useRoute()
  const { trackEvent } = useAnalytics()

  const isLoading = ref(true)
  const isSupported = ref(false)
  const isActive = ref(false)

  let nativeWakeLock: UseWakeLockReturn | null = null

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

  function clearTimerInterval() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  function createTimerInterval() {
    clearTimerInterval()

    timerInterval.value = setInterval(() => {
      remainingTime.value--

      if (remainingTime.value <= 0) {
        trackEvent('timer_expired_auto_release')
        release()
      } else if (isIframePip.value) {
        syncWakeLockState()
      }
    }, 1000)
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

      if (!isSupported.value) {
        return false
      }

      if (!nativeWakeLock) {
        return false
      }

      try {
        await nativeWakeLock.request('screen')
      } catch (error) {
        console.error('Failed to acquire wake lock:', error)
        trackEvent('wake_lock_acquire_failed')
        return false
      }

      isActive.value = true

      if (isIframePip.value) {
        syncWakeLockState()
      }
      return true
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

      if (nativeWakeLock?.sentinel.value) {
        try {
          await nativeWakeLock.release()
        } catch (error) {
          console.error('Failed to release wake lock:', error)
        }
      }
      isActive.value = false

      stopTimer()

      if (isIframePip.value) {
        syncWakeLockState()
      }
    } finally {
      isAcquiring.value = false
    }
  }

  async function forceReleaseParent() {
    if (isIframePip.value) return

    if (nativeWakeLock?.sentinel.value) {
      try {
        await nativeWakeLock.release()
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

    clearTimerInterval()
    timerActive.value = false
    remainingTime.value = 0

    syncWakeLockState()
  }

  function transferStateToPip(targetWindow: Window) {
    const message: WakeLockMessage = {
      type: 'wake-lock-sync',
      state: {
        isActive: isActive.value,
        timerActive: timerActive.value,
        remainingTime: remainingTime.value
      }
    }
    targetWindow.postMessage(message, window.location.origin)

    clearTimerInterval()
    timerActive.value = false
    timerDuration.value = 0
    remainingTime.value = 0
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

  function syncWakeLockState() {
    const message: WakeLockMessage = {
      type: 'wake-lock-sync',
      state: {
        isActive: isActive.value,
        timerActive: timerActive.value,
        remainingTime: remainingTime.value
      }
    }

    if (isIframePip.value && window.parent !== window) {
      try {
        window.parent.postMessage(message, window.location.origin)
      } catch (e) {
        console.warn('Could not send to window.parent:', e)
      }
    }
  }

  async function handleWakeLockSync(state: WakeLockState) {
    if (isIframePip.value) {
      if (state.isActive && !isActive.value) {
        const success = await acquire()
        if (!success) return
      } else if (!state.isActive && isActive.value) {
        await release()
        return
      }
      if (state.timerActive && state.remainingTime > 0 && !timerActive.value) {
        remainingTime.value = state.remainingTime
        timerDuration.value = Math.ceil(state.remainingTime / 60)
        timerActive.value = true
        createTimerInterval()
      }
    } else {
      isActive.value = state.isActive
      timerActive.value = state.timerActive
      remainingTime.value = state.remainingTime
    }
  }

  async function handlePipClosed(finalState?: WakeLockState) {
    if (!pipWindowRef.value) return
    pipWindowRef.value = null

    const wasActive = finalState?.isActive ?? isActive.value
    const hadTimer = finalState?.timerActive ?? false
    const timeRemaining = finalState?.remainingTime ?? 0

    timerActive.value = hadTimer
    remainingTime.value = timeRemaining

    const activeStatus = wasActive ? 'was_active' : 'was_inactive'
    const timerStatus = hadTimer ? 'with_timer' : 'without_timer'
    trackEvent(`pip_closed_${activeStatus}_${timerStatus}`)

    await nextTick()

    if (wasActive) {
      const reacquireSuccess = await acquire()
      const result = reacquireSuccess ? 'success' : 'failed'
      trackEvent(`wake_lock_reacquire_${result}`)

      if (reacquireSuccess) {
        if (hadTimer && timeRemaining > 0) {
          createTimerInterval()
        }
      } else {
        isActive.value = false
        clearTimerInterval()
        timerActive.value = false
        remainingTime.value = 0
      }
    } else {
      if (nativeWakeLock?.sentinel.value) {
        try {
          await nativeWakeLock.release()
          isActive.value = false
        } catch (error) {
          console.error(error)
          trackEvent('wake_lock_state_cleanup_error')
          isActive.value = false
        }
      }
      clearTimerInterval()
      timerActive.value = false
      remainingTime.value = 0
    }
  }

  function handleMessage(event: MessageEvent<WakeLockMessage>) {
    if (event.origin !== window.location.origin) {
      trackEvent('cross_window_message_origin_mismatch')
      return
    }

    const { type, state } = event.data

    if (type === 'wake-lock-sync' && state) {
      handleWakeLockSync(state)
      return
    }

    if (type === 'pip-closed' && !isIframePip.value) {
      handlePipClosed(state)
    }
  }

  function initialize(options?: { nativeWakeLock: UseWakeLockReturn }) {
    if (options?.nativeWakeLock) {
      nativeWakeLock = options.nativeWakeLock
      isSupported.value = nativeWakeLock.isSupported.value
    }

    if (typeof window !== 'undefined') {
      if (route.query.fallback === '1') {
        isSupported.value = false
      }

      isPipMode.value = route.query.pip === '1'
      isIframePip.value = isPipMode.value && window.parent !== window

      window.addEventListener('message', handleMessage)

      if (isIframePip.value) {
        window.addEventListener('beforeunload', () => {
          try {
            if (window.parent && window.parent !== window) {
              const message: WakeLockMessage = {
                type: 'pip-closed',
                state: {
                  isActive: isActive.value,
                  timerActive: timerActive.value,
                  remainingTime: remainingTime.value
                }
              }
              window.parent.postMessage(message, window.location.origin)
            }
          } catch (e) {
            console.warn('Could not send pip-closed message to parent:', e)
          }
        })
      }
    }

    isLoading.value = false
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
    acquire,
    release,
    toggle,
    startTimer,
    stopTimer,
    formatTime,
    syncWakeLockState,
    forceReleaseParent,
    transferStateToPip,
    handlePipClosed,
    initialize,
    cleanup
  }
})
