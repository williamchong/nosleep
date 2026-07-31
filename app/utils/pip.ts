export const PIP_RESTORED_WIDTH = 240
export const PIP_RESTORED_HEIGHT = 280
export const PIP_MINIMIZED_WIDTH = 240
export const PIP_MINIMIZED_HEIGHT = 52

// The route path hosting the PiP iframe content — the URL the parent loads into the PiP
// window. The page itself flags PiP mode via definePageMeta({ pip: true }).
export const PIP_PATH = '/pip'

/** How long the parent waits for the PiP iframe to confirm it adopted the handed-off state. */
export const PIP_HANDOFF_TIMEOUT_MS = 3000

export interface WakeLockState {
  isActive: boolean
  timerActive: boolean
  remainingTime: number
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

const PIP_SIZE_KEY = 'nosleep-pip-size'
const PIP_SIZE_MINIMIZED = 'minimized'

export function getPipSizePreference(): 'minimized' | 'restored' {
  try {
    return localStorage.getItem(PIP_SIZE_KEY) === PIP_SIZE_MINIMIZED ? 'minimized' : 'restored'
  } catch {
    return 'restored'
  }
}

export function setPipSizePreference(size: 'minimized' | 'restored'): void {
  try {
    localStorage.setItem(PIP_SIZE_KEY, size)
  } catch { /* Private browsing or quota exceeded — ignore */ }
}
