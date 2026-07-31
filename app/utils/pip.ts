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

// The wake lock messages the relay forwards and handleMessage dispatches. Kept as a runtime
// list so the guard below and the WakeLockMessage type cannot drift apart. 'color-mode-sync'
// is deliberately absent: it goes straight from the main window to the iframe and carries a
// different payload, so it must stay off the relay path.
export const WAKE_LOCK_MESSAGE_TYPES = ['wake-lock-sync', 'pip-closed', 'pip-ready'] as const

export interface WakeLockMessage {
  type: typeof WAKE_LOCK_MESSAGE_TYPES[number]
  state?: WakeLockState
}

export function isWakeLockMessage(data: unknown): data is WakeLockMessage {
  return !!data && typeof data === 'object' && 'type' in data
    && (WAKE_LOCK_MESSAGE_TYPES as readonly unknown[]).includes(data.type)
}

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
