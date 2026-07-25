import { useWakeLock, useEventListener, useIntervalFn, tryOnMounted, tryOnUnmounted } from '@vueuse/core'
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

type WakeLockSurface = 'main' | 'pip'
type SessionEndReason =
  | 'user_toggle'
  | 'timer_expired'
  | 'pip_transfer'
  | 'parent_sync'
  | 'cleanup'

const isLoading = ref(true)
const isSupported = ref(false)
const isActive = ref(false)

const nativeWakeLock = shallowRef<UseWakeLockReturn | null>(null)
const nativeIsActive = computed(() => nativeWakeLock.value?.isActive.value ?? false)

const isIframePip = ref(false)
const isPipMode = ref(false)
const pipWindowRef = shallowRef<Window | null>(null)

const timerActive = ref(false)
const timerDuration = ref(0)
const remainingTime = ref(0)

const isAcquiring = ref(false)

const sessionStartedAt = ref<number | null>(null)

const hasActivePipWindow = computed(() => pipWindowRef.value !== null && !pipWindowRef.value.closed)

const isParentWithActivePip = computed(() =>
  !isIframePip.value && hasActivePipWindow.value
)

const isEffectivelyActive = computed(() =>
  isParentWithActivePip.value ? isActive.value : nativeIsActive.value
)

const surface = computed<WakeLockSurface>(() => isIframePip.value ? 'pip' : 'main')

const _messageTarget = shallowRef<Window>()
const _beforeUnloadTarget = shallowRef<Window>()

// Analytics needs the Nuxt context, so it can only be bound from inside useWakeLockState().
let track: ((eventName: string, props?: Record<string, unknown>) => void) | null = null
const trackEvent = (eventName: string, props?: Record<string, unknown>) => track?.(eventName, props)

function snapshotState(): WakeLockState {
  return {
    isActive: isActive.value,
    timerActive: timerActive.value,
    remainingTime: remainingTime.value
  }
}

function endSession(endedBy: SessionEndReason) {
  if (sessionStartedAt.value === null) return
  const durationSeconds = Math.round((Date.now() - sessionStartedAt.value) / 1000)
  trackEvent('wake_lock_session_ended', {
    duration_seconds: durationSeconds,
    ended_by: endedBy,
    had_timer: timerActive.value,
    surface: surface.value,
  })
  sessionStartedAt.value = null
}

function onTimerTick() {
  remainingTime.value--
  if (remainingTime.value <= 0) {
    trackEvent('timer_expired', { duration_minutes: timerDuration.value })
    release('timer_expired')
  } else if (isIframePip.value) {
    syncWakeLockState()
  }
}

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(onTimerTick, 1000, { immediate: false })

/** Restart the countdown so the next tick is a full second away — resume() clears any running interval. */
function restartTimerInterval() {
  resumeTimer()
}

function resetTimerState() {
  pauseTimer()
  timerActive.value = false
  remainingTime.value = 0
}

async function releaseNativeWakeLock(context: string): Promise<Error | null> {
  const native = nativeWakeLock.value
  if (!native?.sentinel.value) return null
  try {
    await native.release()
    return null
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause))
    console.error(context, error)
    return error
  }
}

function syncWakeLockState() {
  if (!isIframePip.value || window.parent === window) return

  const message: WakeLockMessage = { type: 'wake-lock-sync', state: snapshotState() }
  try {
    window.parent.postMessage(message, window.location.origin)
  } catch (e) {
    console.warn('Could not send to window.parent:', e)
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

    if (!isSupported.value) {
      return false
    }

    const native = nativeWakeLock.value
    if (!native) {
      return false
    }

    try {
      await native.request('screen')
    } catch (error) {
      console.error('Failed to acquire wake lock:', error)
      trackEvent('wake_lock_acquire_failed')
      return false
    }

    isActive.value = true
    sessionStartedAt.value ??= Date.now()

    syncWakeLockState()
    return true
  } finally {
    isAcquiring.value = false
  }
}

async function release(endedBy: SessionEndReason = 'user_toggle') {
  if (isAcquiring.value) {
    return
  }
  isAcquiring.value = true

  try {
    if (isParentWithActivePip.value) {
      return
    }

    await releaseNativeWakeLock('Failed to release wake lock:')

    isActive.value = false
    endSession(endedBy)

    // stopTimer() ends with syncWakeLockState(), which broadcasts the state set above.
    stopTimer()
  } finally {
    isAcquiring.value = false
  }
}

async function forceReleaseParent() {
  if (isIframePip.value) return

  await releaseNativeWakeLock('Failed to release parent wake lock:')
}

async function toggle() {
  if (isActive.value) {
    await release('user_toggle')
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

  restartTimerInterval()

  syncWakeLockState()
  return true
}

function stopTimer() {
  if (isParentWithActivePip.value) {
    return
  }

  resetTimerState()
  syncWakeLockState()
}

function transferStateToPip(targetWindow: Window) {
  const message: WakeLockMessage = { type: 'wake-lock-sync', state: snapshotState() }
  targetWindow.postMessage(message, window.location.origin)

  endSession('pip_transfer')

  resetTimerState()
  timerDuration.value = 0
}

async function handleWakeLockSync(state: WakeLockState) {
  if (isIframePip.value) {
    if (state.isActive && !isActive.value) {
      const success = await acquire()
      if (!success) return
    } else if (!state.isActive && isActive.value) {
      await release('parent_sync')
      return
    }
    if (state.timerActive && state.remainingTime > 0 && !timerActive.value) {
      remainingTime.value = state.remainingTime
      timerDuration.value = Math.ceil(state.remainingTime / 60)
      timerActive.value = true
      restartTimerInterval()
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

  trackEvent('pip_closed', {
    was_active: wasActive,
    had_timer: hadTimer,
    time_remaining_seconds: timeRemaining,
  })

  await nextTick()

  if (wasActive) {
    const reacquireSuccess = await acquire()
    trackEvent('wake_lock_reacquire', { result: reacquireSuccess ? 'success' : 'failed' })

    if (reacquireSuccess) {
      if (hadTimer && timeRemaining > 0) {
        restartTimerInterval()
      }
      return
    }
    isActive.value = false
  } else if (nativeWakeLock.value?.sentinel.value) {
    const error = await releaseNativeWakeLock('Failed to release wake lock on PiP close:')
    if (error) {
      trackEvent('client_error', {
        kind: 'wake_lock_state_cleanup',
        message: error.message,
      })
    }
    isActive.value = false
  }

  resetTimerState()
}

function handleMessage(event: MessageEvent<WakeLockMessage>) {
  if (event.origin !== window.location.origin) {
    trackEvent('client_error', {
      kind: 'cross_window_origin_mismatch',
      origin: event.origin,
      expected: window.location.origin,
    })
    return
  }

  const { type, state } = event.data

  if (type === 'wake-lock-sync' && state) {
    void handleWakeLockSync(state)
    return
  }

  if (type === 'pip-closed' && !isIframePip.value) {
    void handlePipClosed(state)
  }
}

function handleBeforeUnload() {
  try {
    if (window.parent && window.parent !== window) {
      const message: WakeLockMessage = { type: 'pip-closed', state: snapshotState() }
      window.parent.postMessage(message, window.location.origin)
    }
  } catch (e) {
    console.warn('Could not send pip-closed message to parent:', e)
  }
}

function cleanup() {
  // Emit session-end synchronously so callers don't need to await; the
  // subsequent release() sees sessionStartedAt=null and is a no-op for tracking.
  endSession('cleanup')
  // release() is async and bails early while acquiring or when a PiP window owns the lock,
  // so stop the interval here rather than relying on its stopTimer().
  resetTimerState()
  void release('cleanup')
  nativeWakeLock.value = null
  track = null
  _messageTarget.value = undefined
  _beforeUnloadTarget.value = undefined
}

const wakeLockState = reactive({
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
  isEffectivelyActive,
  surface,
  acquire,
  release,
  toggle,
  startTimer,
  stopTimer,
  snapshotState,
  forceReleaseParent,
  transferStateToPip,
  handlePipClosed,
  cleanup
})

export function useWakeLockState(options?: { nativeWakeLock: UseWakeLockReturn }) {
  track = useAnalytics().trackEvent

  function setupNativeWakeLock(wakeLock: UseWakeLockReturn) {
    nativeWakeLock.value = wakeLock
    isSupported.value = wakeLock.isSupported.value
  }

  if (getCurrentInstance()) {
    const route = useRoute()

    useEventListener(_messageTarget, 'message', handleMessage)
    useEventListener(_beforeUnloadTarget, 'beforeunload', handleBeforeUnload)

    // Set up nativeWakeLock synchronously so child components can acquire on mount
    setupNativeWakeLock(useWakeLock())

    // ?fallback=1 forces the unsupported-browser UI (QA). Watched, not read once, because on
    // the static prod build the query is stripped during hydration and only reconciled with
    // the real URL afterwards. Only forces false when present, never overrides real detection.
    watch(() => route.query.fallback, (fallback) => {
      if (fallback === '1') isSupported.value = false
    }, { immediate: true })

    // PiP mode comes from the page's route meta (set via definePageMeta on /pip), not a query
    // flag. Route meta is stable through static prerender and hydration, whereas the query is
    // dropped while a prerendered page hydrates — so a query flag would render the wrong
    // (non-PiP) layout on the prod build. This also bakes the PiP layout straight into the
    // prerendered HTML (no flash).
    isPipMode.value = route.meta.pip === true
  } else if (options?.nativeWakeLock) {
    setupNativeWakeLock(options.nativeWakeLock)
    isLoading.value = false
  }

  // Defer window-dependent parts to onMounted (not available during SSR).
  // Outside a component context, tryOnMounted executes immediately; tryOnUnmounted is a no-op.
  tryOnMounted(() => {
    isIframePip.value = isPipMode.value && window.parent !== window

    _messageTarget.value = window
    if (isIframePip.value) {
      _beforeUnloadTarget.value = window
    }

    isLoading.value = false
  })

  tryOnUnmounted(() => {
    cleanup()
  })

  return wakeLockState
}
