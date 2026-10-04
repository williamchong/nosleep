export const PIP_RESTORED_WIDTH = 240
export const PIP_RESTORED_HEIGHT = 280
export const PIP_MINIMIZED_WIDTH = 240
export const PIP_MINIMIZED_HEIGHT = 52

// The route path hosting the PiP iframe content — the URL the parent loads into the PiP
// window. The page itself flags PiP mode via definePageMeta({ pip: true }).
export const PIP_PATH = '/pip'

/** How long the parent waits for the PiP iframe to confirm it adopted the handed-off state. */
export const PIP_HANDOFF_TIMEOUT_MS = 3000

/**
 * How long the parent waits for a freshly opened PiP iframe to announce itself at all. Far
 * more generous than the handoff timeout because this one covers hydration (~800ms measured
 * on a cold dev server) — closing a window that was about to work is worse than waiting.
 */
export const PIP_CONNECT_TIMEOUT_MS = 10000

export interface WakeLockState {
  isActive: boolean
  timerActive: boolean
  remainingTime: number
  /** Minutes the timer was started with — the ring countdown needs the whole, not just what is left */
  timerDuration: number
}

// The two messages that set up the MessagePort. These are the only ones that cross the shared
// window bus, where anything on the page can post, so they need a runtime guard. Kept as a
// list so the guard and the type cannot drift apart.
export const PIP_HANDSHAKE_TYPES = ['pip-ready', 'pip-connect'] as const

export interface PipHandshakeMessage {
  type: typeof PIP_HANDSHAKE_TYPES[number]
}

export function isPipHandshakeMessage(data: unknown): data is PipHandshakeMessage {
  return !!data && typeof data === 'object' && 'type' in data
    && (PIP_HANDSHAKE_TYPES as readonly unknown[]).includes(data.type)
}

/**
 * Everything after the handshake travels the port, which is point-to-point — no other script
 * can post to it, so these need no guard, no origin check and no source check.
 */
export type PipMessage =
  | { type: 'wake-lock-sync', state: WakeLockState }
  | { type: 'color-mode-sync', mode: string }
  // Carries no state, so the once-only state handoff is untouched (see focusPipWindow).
  | { type: 'pip-attention' }

/** How long the floating window pulses after the main window asks for attention. */
export const PIP_ATTENTION_MS = 1200

const PIP_SIZE_KEY = 'nosleep-pip-size'
const PIP_SIZE_MINIMIZED = 'minimized'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch { /* Private browsing or quota exceeded — ignore */ }
}

export function getPipSizePreference(): 'minimized' | 'restored' {
  return readStorage(PIP_SIZE_KEY) === PIP_SIZE_MINIMIZED ? 'minimized' : 'restored'
}

export function setPipSizePreference(size: 'minimized' | 'restored'): void {
  writeStorage(PIP_SIZE_KEY, size)
}

/** The hero button, told apart by whether the prompt after a lapsed lock was showing. */
export type PipOpenSource = 'hero' | 'hero_with_notice'

/**
 * How long the main tab has to stay hidden before its lapsed lock is worth a prompt. Shorter
 * gaps are harmless — screens rarely dim that fast — and prompting on them would nag.
 */
export const SUSPENSION_NOTICE_MIN_SECONDS = 60

const SUSPENSION_NOTICE_DISMISSED_KEY = 'nosleep-suspension-notice-dismissed'

export function isSuspensionNoticeDismissed(): boolean {
  return readStorage(SUSPENSION_NOTICE_DISMISSED_KEY) === '1'
}

export function dismissSuspensionNoticeForGood(): void {
  writeStorage(SUSPENSION_NOTICE_DISMISSED_KEY, '1')
}
