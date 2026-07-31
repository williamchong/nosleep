import { useWakeLock, useEventListener, useIntervalFn, useTimeoutFn, tryOnMounted, tryOnUnmounted } from '@vueuse/core'
import type { UseWakeLockReturn } from '@vueuse/core'
import type { PipHandshakeMessage, PipMessage, WakeLockState } from '~/utils/pip'

type WakeLockSurface = 'main' | 'pip'
type PipConnectFailureReason = 'connect_timeout' | 'iframe_error'
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

/** When the current PiP window was opened, so a connection failure can report how long it took. */
let connectStartedAt: number | null = null

const hasActivePipWindow = computed(() => pipWindowRef.value !== null && !pipWindowRef.value.closed)

const isParentWithActivePip = computed(() =>
  !isIframePip.value && hasActivePipWindow.value
)

const isEffectivelyActive = computed(() =>
  isParentWithActivePip.value ? isActive.value : nativeIsActive.value
)

const surface = computed<WakeLockSurface>(() => isIframePip.value ? 'pip' : 'main')

/**
 * The live connection between the main window and the PiP iframe. Everything except the
 * two-message handshake that establishes it travels this port.
 */
const pipPort = shallowRef<MessagePort | null>(null)

// Theme arriving from the parent. Applying it needs useColorMode(), which is the page's to
// call, so the port handler parks it here and pip.vue watches — one dispatch point, and the
// transport stays inside this module.
const pipColorMode = ref<string | null>(null)

const _selfWindow = shallowRef<Window>()

/**
 * Where the handshake is heard. The iframe posts 'pip-ready' to window.parent — which is the
 * PiP window, not the main window — so the parent listens there; the main window replies with
 * the port straight into the iframe, so the child listens on itself.
 */
const handshakeTarget = computed(() => isIframePip.value ? _selfWindow.value : pipWindowRef.value)

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

function postToPip(message: PipMessage) {
  pipPort.value?.postMessage(message)
}

function syncWakeLockState() {
  if (!isIframePip.value) return
  postToPip({ type: 'wake-lock-sync', state: snapshotState() })
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

const { start: startConnectTimeout, stop: stopConnectTimeout } = useTimeoutFn(() => {
  failPipConnection('connect_timeout')
}, PIP_CONNECT_TIMEOUT_MS, { immediate: false })

/**
 * The iframe never announced itself, so there is nothing in the floating window to hand over
 * to. An iframe fires 'load' rather than 'error' for HTTP failures, so a missing 'pip-ready'
 * is the only reliable signal that it did not come up.
 *
 * Closing the window is both the recovery and the cleanup: the pagehide listener in index.vue
 * routes it through handlePipClosed, which is the same path a user-initiated close takes.
 */
function failPipConnection(reason: PipConnectFailureReason) {
  const pipWin = pipWindowRef.value
  if (!pipWin) return
  stopConnectTimeout()

  trackEvent('client_error', {
    kind: 'pip_connect_failed',
    reason,
    // Measured, not the constant: an iframe error can land long before the timeout, and the
    // gap between the two is what says whether the timeout is too tight or the load is broken.
    waited_ms: connectStartedAt === null ? null : Date.now() - connectStartedAt,
    online: navigator.onLine,
    visibility: document.visibilityState,
  })

  pipWin.close()
  // A window closed before it ever painted may not fire pagehide, so tear down directly. The
  // guard inside handlePipClosed makes the pagehide path a no-op if it does arrive.
  void handlePipClosed(snapshotState())
}

/** Adopt a freshly opened PiP window and start waiting for it to announce itself. */
function adoptPipWindow(pipWin: Window) {
  pipWindowRef.value = pipWin
  connectStartedAt = Date.now()
  startConnectTimeout()
}

/**
 * Hand the current state to the PiP iframe. Nothing is torn down here — the parent keeps its
 * wake lock and timer until the iframe confirms it adopted the state (completePipHandoff).
 */
function transferStateToPip() {
  pendingHandoff = snapshotState()
  postToPip({ type: 'wake-lock-sync', state: pendingHandoff })
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

function closePipPort() {
  pipPort.value?.close()
  pipPort.value = null
}

function adoptPipPort(port: MessagePort) {
  closePipPort()
  pipPort.value = port
  // Required because the listener is attached with addEventListener rather than onmessage.
  // Anything already queued on the other end is delivered as a task, so the listener that
  // useEventListener attaches on the next microtask is in place first.
  port.start()
}

/** The iframe has mounted and is listening — open the channel and hand the state over. */
function connectToPip() {
  const frame = pipWindowRef.value?.frames[0]
  if (!frame) return
  stopConnectTimeout()

  const channel = new MessageChannel()
  adoptPipPort(channel.port1)
  const connect: PipHandshakeMessage = { type: 'pip-connect' }
  frame.postMessage(connect, window.location.origin, [channel.port2])
  transferStateToPip()
}

/**
 * An inbound state message. The parent's half converges — it mirrors whatever the iframe
 * reports — but the iframe's half is an initializer, not a sync: the parent sends exactly one
 * of these, at handoff, so there is deliberately no branch for a message that would stop a
 * running timer. Send state to the iframe more than once and that branch has to be written.
 */
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
  stopConnectTimeout()
  connectStartedAt = null
  closePipPort()

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

/**
 * The window bus carries only the handshake. It is a shared channel — analytics, extensions
 * and embedded frames all post here — so the message has to be recognised before an origin
 * mismatch is worth reporting, or ambient traffic drowns the signal.
 *
 * No event.source check: each surface listens on a window only its counterpart posts to (see
 * handshakeTarget), and the worst a same-origin impostor achieves is an extra channel that
 * carries nothing, since the state still has to survive completePipHandoff.
 */
function handleHandshake(event: MessageEvent) {
  if (!isPipHandshakeMessage(event.data)) return

  if (event.origin !== window.location.origin) {
    trackEvent('client_error', {
      kind: 'cross_window_origin_mismatch',
      origin: event.origin,
      expected: window.location.origin,
    })
    return
  }

  if (event.data.type === 'pip-ready' && !isIframePip.value) {
    connectToPip()
    return
  }

  const port = event.ports[0]
  if (event.data.type === 'pip-connect' && isIframePip.value && port) {
    adoptPipPort(port)
  }
}

/** Steady-state traffic. The port is point-to-point, so there is nothing to validate. */
function handlePortMessage(event: MessageEvent<PipMessage>) {
  if (event.data.type === 'wake-lock-sync') {
    void handleWakeLockSync(event.data.state)
    return
  }
  if (event.data.type === 'color-mode-sync') {
    pipColorMode.value = event.data.mode
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
  stopConnectTimeout()
  connectStartedAt = null
  // Drop the PiP reference first, or release() bails on isParentWithActivePip and the sentinel
  // is discarded below without ever being released.
  pipWindowRef.value = null
  void release('cleanup')
  closePipPort()
  nativeWakeLock.value = null
  track = null
  _selfWindow.value = undefined
}

const wakeLockState = reactive({
  isLoading,
  isSupported,
  isActive,
  timerActive,
  timerDuration,
  remainingTime,
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
  adoptPipWindow,
  failPipConnection,
  handlePipClosed,
  postToPip,
  pipColorMode,
  cleanup
})

// Both sides of the PiP handoff. Production drives these through the port listener; they are
// exported so tests can exercise the exchange without two real windows.
export { transferStateToPip, handleWakeLockSync }

/**
 * Call this once per window. All the state above is module-level, so a second caller in the
 * same window registers a second handshake listener and every 'pip-ready' is handled twice.
 * That currently self-heals — both sides converge on the last MessageChannel and isAcquiring
 * absorbs the duplicate transfer — but nothing enforces it. Components should take the return
 * value as a prop, the way WakeLockControl does, rather than calling this again.
 */
export function useWakeLockState(options?: { nativeWakeLock: UseWakeLockReturn }) {
  track = useAnalytics().trackEvent

  function setupNativeWakeLock(wakeLock: UseWakeLockReturn) {
    nativeWakeLock.value = wakeLock
    isSupported.value = wakeLock.isSupported.value
  }

  if (getCurrentInstance()) {
    const route = useRoute()

    useEventListener(handshakeTarget, 'message', handleHandshake)
    useEventListener(pipPort, 'message', handlePortMessage)

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

    _selfWindow.value = window
    if (isIframePip.value) {
      // Ask for the port. Safe to send before the listener above is attached: useEventListener
      // flushes 'post' (a microtask), while any reply arrives as a task.
      const ready: PipHandshakeMessage = { type: 'pip-ready' }
      window.parent.postMessage(ready, window.location.origin)
    }

    isLoading.value = false
  })

  tryOnUnmounted(() => {
    cleanup()
  })

  return wakeLockState
}
