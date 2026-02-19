import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, shallowRef } from 'vue'
import { useWakeLockState } from '~/composables/useWakeLockState'
import type { UseWakeLockReturn } from '@vueuse/core'

const mockRelease = vi.fn()
const mockRequest = vi.fn()
const mockSentinel = shallowRef<{ release: () => Promise<void> } | null>(null)

function createMockNativeWakeLock(supported = true): UseWakeLockReturn {
  mockSentinel.value = null
  return {
    isSupported: computed(() => supported),
    isActive: computed(() => !!mockSentinel.value),
    sentinel: mockSentinel as UseWakeLockReturn['sentinel'],
    request: mockRequest.mockImplementation(async () => {
      mockSentinel.value = { release: mockRelease }
    }),
    forceRequest: vi.fn(),
    release: mockRelease.mockImplementation(async () => {
      mockSentinel.value = null
    }),
  }
}

describe('wakeLock state', () => {
  let state: ReturnType<typeof useWakeLockState>

  beforeEach(() => {
    state = useWakeLockState()
    state.isActive = false
    mockRelease.mockReset()
    mockRequest.mockReset()
    mockSentinel.value = null
  })

  afterEach(() => {
    state.cleanup()
  })

  describe('formatTime', () => {
    it('formats zero', () => {
      expect(state.formatTime(0)).toBe('0:00')
    })

    it('formats seconds only', () => {
      expect(state.formatTime(45)).toBe('0:45')
    })

    it('formats minutes and seconds', () => {
      expect(state.formatTime(125)).toBe('2:05')
    })

    it('formats hours, minutes, and seconds', () => {
      expect(state.formatTime(3661)).toBe('1:01:01')
    })

    it('formats exact hour', () => {
      expect(state.formatTime(3600)).toBe('1:00:00')
    })
  })

  describe('initialize', () => {
    it('sets isSupported from nativeWakeLock', () => {
      const nativeWakeLock = createMockNativeWakeLock(true)
      state.initialize({ nativeWakeLock })
      expect(state.isSupported).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('detects unsupported when nativeWakeLock says false', () => {
      const nativeWakeLock = createMockNativeWakeLock(false)
      state.initialize({ nativeWakeLock })
      expect(state.isSupported).toBe(false)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('acquire and release', () => {
    beforeEach(() => {
      const nativeWakeLock = createMockNativeWakeLock(true)
      state.initialize({ nativeWakeLock })
    })

    it('acquires wake lock and sets isActive', async () => {
      const result = await state.acquire()
      expect(result).toBe(true)
      expect(state.isActive).toBe(true)
      expect(mockRequest).toHaveBeenCalledWith('screen')
    })

    it('releases wake lock and sets isActive false', async () => {
      await state.acquire()
      expect(state.isActive).toBe(true)

      await state.release()
      expect(state.isActive).toBe(false)
      expect(mockRelease).toHaveBeenCalled()
    })

    it('toggle acquires when inactive', async () => {
      expect(state.isActive).toBe(false)
      await state.toggle()
      expect(state.isActive).toBe(true)
    })

    it('toggle releases when active', async () => {
      await state.acquire()
      expect(state.isActive).toBe(true)
      await state.toggle()
      expect(state.isActive).toBe(false)
    })

    it('returns false when not supported', async () => {
      state.cleanup()
      const nativeWakeLock = createMockNativeWakeLock(false)
      state.initialize({ nativeWakeLock })
      const result = await state.acquire()
      expect(result).toBe(false)
      expect(state.isActive).toBe(false)
    })

    it('returns false when acquire fails', async () => {
      mockRequest.mockRejectedValueOnce(new Error('NotAllowedError'))
      const result = await state.acquire()
      expect(result).toBe(false)
      expect(state.isActive).toBe(false)
    })
  })

  describe('startTimer and stopTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      const nativeWakeLock = createMockNativeWakeLock(true)
      state.initialize({ nativeWakeLock })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('startTimer sets timer state and acquires wake lock', async () => {
      const result = await state.startTimer(5)
      expect(result).toBe(true)
      expect(state.isActive).toBe(true)
      expect(state.timerActive).toBe(true)
      expect(state.timerDuration).toBe(5)
      expect(state.remainingTime).toBe(300)
    })

    it('startTimer rejects zero or negative minutes', async () => {
      expect(await state.startTimer(0)).toBe(false)
      expect(await state.startTimer(-1)).toBe(false)
      expect(state.timerActive).toBe(false)
    })

    it('timer counts down each second', async () => {
      await state.startTimer(1)
      expect(state.remainingTime).toBe(60)

      vi.advanceTimersByTime(10_000)
      expect(state.remainingTime).toBe(50)
    })

    it('stopTimer resets timer state', async () => {
      await state.startTimer(5)
      expect(state.timerActive).toBe(true)

      state.stopTimer()
      expect(state.timerActive).toBe(false)
      expect(state.remainingTime).toBe(0)
    })

    it('stopTimer halts countdown', async () => {
      await state.startTimer(1)
      vi.advanceTimersByTime(5000)
      expect(state.remainingTime).toBe(55)

      state.stopTimer()
      const frozenTime = state.remainingTime

      vi.advanceTimersByTime(10_000)
      expect(state.remainingTime).toBe(frozenTime)
    })

    it('timer auto-releases wake lock when it expires', async () => {
      await state.startTimer(1)
      vi.advanceTimersByTime(60_000)

      expect(state.remainingTime).toBeLessThanOrEqual(0)
      expect(mockRelease).toHaveBeenCalled()
    })
  })
})
