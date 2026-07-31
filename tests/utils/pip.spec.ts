import { describe, it, expect } from 'vitest'
import { isPipHandshakeMessage, PIP_HANDSHAKE_TYPES } from '~/utils/pip'

describe('isPipHandshakeMessage', () => {
  it('accepts every type in the handshake vocabulary', () => {
    for (const type of PIP_HANDSHAKE_TYPES) {
      expect(isPipHandshakeMessage({ type })).toBe(true)
    }
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
    expect(isPipHandshakeMessage(data)).toBe(false)
  })

  // These now travel the MessagePort, which is point-to-point and needs no guard. Letting them
  // back onto the window bus would reintroduce the ambient-noise problem the guard exists for.
  it.each([['wake-lock-sync'], ['color-mode-sync'], ['pip-closed']])(
    'keeps %s off the window bus', (type) => {
      expect(isPipHandshakeMessage({ type })).toBe(false)
    })
})
