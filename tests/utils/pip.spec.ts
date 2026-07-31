import { describe, it, expect } from 'vitest'
import { isWakeLockMessage, WAKE_LOCK_MESSAGE_TYPES } from '~/utils/pip'

describe('isWakeLockMessage', () => {
  it('accepts every type in the shared vocabulary', () => {
    for (const type of WAKE_LOCK_MESSAGE_TYPES) {
      expect(isWakeLockMessage({ type })).toBe(true)
    }
  })

  it('carries the state payload through', () => {
    const message = { type: 'wake-lock-sync', state: { isActive: true, timerActive: false, remainingTime: 0 } }
    expect(isWakeLockMessage(message)).toBe(true)
  })

  // The window listener sees every postMessage in the tab. Anything not ours has to fall
  // through silently rather than be reported as an origin mismatch.
  it.each([
    ['a third-party handshake', { type: 'webpack-hmr' }],
    ['a devtools ping', { source: 'vue-devtools', payload: {} }],
    ['a bare string', 'hello'],
    ['null', null],
    ['undefined', undefined],
    ['an unknown type', { type: 'pip-something-else' }],
  ])('rejects %s', (_label, data) => {
    expect(isWakeLockMessage(data)).toBe(false)
  })
})
