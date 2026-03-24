export const PIP_RESTORED_WIDTH = 240
export const PIP_RESTORED_HEIGHT = 280
export const PIP_MINIMIZED_WIDTH = 240
export const PIP_MINIMIZED_HEIGHT = 52

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
