import { useWakeLock, useEventListener, useIntervalFn, useTimeoutFn, tryOnMounted, tryOnUnmounted } from '@vueuse/core'
import type { UseWakeLockReturn } from '@vueuse/core'

interface WakeLockState {
  isActive: boolean
  timerActive: boolean
  remainingTime: number
}

interface WakeLockMessage {
  type: 'wake-lock-sync' | 'pip-closed' | 'pip-ready'
  state?: WakeLockState
}

/** How long the parent waits for the PiP iframe to confirm it adopted the handed-off state. */
const PIP_HANDOFF_TIMEOUT_MS = 3000

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

/** Snapshot handed to the PiP iframe, held until it confirms it adopted the state. */
let pendingHandoff: WakeLockState | null = null

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
  if (remainingTime.value > 0) {
    syncWakeLockState()
    return
  }
  // Stop ticking here rather than leaving it to release(), which bails early while acquiring
  // and while a PiP window owns the lock — a live interval would re-fire expiry every second.
  // Only the interval is paused; timerActive still reads true for endSession's had_timer.
  pauseTimer()
  trackEvent('timer_expired', { duration_minutes: timerDuration.value })
  void release('timer_expired')
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

const { start: startHandoffTimeout, stop: stopHandoffTimeout } = useTimeoutFn(() => {
  pendingHandoff = null
  trackEvent('client_error', { kind: 'pip_handoff_timeout' })
}, PIP_HANDOFF_TIMEOUT_MS, { immediate: false })

/**
 * Hand the current state to the PiP iframe. Nothing is torn down here — the parent keeps its
 * wake lock and timer until the iframe confirms it adopted the state (completePipHandoff).
 */
function transferStateToPip(targetWindow: Window) {
  pendingHandoff = snapshotState()
  const message: WakeLockMessage = { type: 'wake-lock-sync', state: pendingHandoff }
  targetWindow.postMessage(message, window.location.origin)
  startHandoffTimeout()
}

function adoptState(state: WakeLockState) {
  isActive.value = state.isActive
  timerActive.value = state.timerActive
  remainingTime.value = state.remainingTime
}

/**
 * The iframe's first sync back after a transfer. Only once it reports back the same active
 * state does the parent give up its wake lock; a mismatch leaves the parent fully intact, so
 * the user recovers by closing the PiP window rather than ending up with no lock anywhere.
 */
function completePipHandoff(expected: WakeLockState, childState: WakeLockState) {
  pendingHandoff = null
  stopHandoffTimeout()

  if (childState.isActive !== expected.isActive) {
    trackEvent('client_error', { kind: 'pip_handoff_rejected' })
    return
  }

  endSession('pip_transfer')
  // Only the interval stops — the mirrored countdown below is the iframe's to drive now.
  pauseTimer()
  timerDuration.value = 0
  void forceReleaseParent()
  adoptState(childState)
}

/** The iframe has mounted and is listening — safe to hand over now. */
function handlePipReady() {
  if (isIframePip.value) return
  const frame = pipWindowRef.value?.frames[0]
  if (!frame) return
  transferStateToPip(frame)
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
  } else if (pendingHandoff) {
    completePipHandoff(pendingHandoff, state)
  } else {
    adoptState(state)
  }
}

async function handlePipClosed(finalState?: WakeLockState) {
  if (!pipWindowRef.value) return
  pipWindowRef.value = null

  // Disarm any in-flight handoff: a sync posted just before the window closed can still land,
  // and would otherwise be read as an ack and release the lock we are about to reacquire.
  pendingHandoff = null
  stopHandoffTimeout()

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

  if (type === 'pip-ready') {
    handlePipReady()
    return
  }

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
  pendingHandoff = null
  stopHandoffTimeout()
  // Drop the PiP reference first, or release() bails on isParentWithActivePip and the sentinel
  // is discarded below without ever being released.
  pipWindowRef.value = null
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
  handlePipClosed,
  cleanup
})

// Both sides of the PiP handoff. Production drives these through the message listener; they
// are exported so tests can exercise the exchange without two real windows.
export { transferStateToPip, handleWakeLockSync }

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
      // Tell the parent we are listening. Safe to send before the listener above is attached:
      // useEventListener flushes 'post' (a microtask), while any reply arrives as a task.
      const ready: WakeLockMessage = { type: 'pip-ready' }
      window.parent.postMessage(ready, window.location.origin)
    }

    isLoading.value = false
  })

  tryOnUnmounted(() => {
    cleanup()
  })

  return wakeLockState
}
