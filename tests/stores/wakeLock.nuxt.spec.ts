import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, shallowRef } from 'vue'
import { useWakeLockStore } from '~/stores/wakeLock'
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

describe('wakeLock store', () => {
  let store: ReturnType<typeof useWakeLockStore>

  beforeEach(() => {
    store = useWakeLockStore()
    store.isActive = false
    mockRelease.mockReset()
    mockRequest.mockReset()
    mockSentinel.value = null
  })

  afterEach(() => {
    store.cleanup()
  })

  describe('formatTime', () => {
    it('formats zero', () => {
      expect(store.formatTime(0)).toBe('0:00')
    })

    it('formats seconds only', () => {
      expect(store.formatTime(45)).toBe('0:45')
    })

    it('formats minutes and seconds', () => {
      expect(store.formatTime(125)).toBe('2:05')
    })

    it('formats hours, minutes, and seconds', () => {
      expect(store.formatTime(3661)).toBe('1:01:01')
    })

    it('formats exact hour', () => {
      expect(store.formatTime(3600)).toBe('1:00:00')
    })
  })

  describe('initialize', () => {
    it('sets isSupported from nativeWakeLock', () => {
      const nativeWakeLock = createMockNativeWakeLock(true)
      store.initialize({ nativeWakeLock })
      expect(store.isSupported).toBe(true)
      expect(store.isLoading).toBe(false)
    })

    it('detects unsupported when nativeWakeLock says false', () => {
      const nativeWakeLock = createMockNativeWakeLock(false)
      store.initialize({ nativeWakeLock })
      expect(store.isSupported).toBe(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('acquire and release', () => {
    beforeEach(() => {
      const nativeWakeLock = createMockNativeWakeLock(true)
      store.initialize({ nativeWakeLock })
    })

    it('acquires wake lock and sets isActive', async () => {
      const result = await store.acquire()
      expect(result).toBe(true)
      expect(store.isActive).toBe(true)
      expect(mockRequest).toHaveBeenCalledWith('screen')
    })

    it('releases wake lock and sets isActive false', async () => {
      await store.acquire()
      expect(store.isActive).toBe(true)

      await store.release()
      expect(store.isActive).toBe(false)
      expect(mockRelease).toHaveBeenCalled()
    })

    it('toggle acquires when inactive', async () => {
      expect(store.isActive).toBe(false)
      await store.toggle()
      expect(store.isActive).toBe(true)
    })

    it('toggle releases when active', async () => {
      await store.acquire()
      expect(store.isActive).toBe(true)
      await store.toggle()
      expect(store.isActive).toBe(false)
    })

    it('returns false when not supported', async () => {
      store.cleanup()
      const nativeWakeLock = createMockNativeWakeLock(false)
      store.initialize({ nativeWakeLock })
      const result = await store.acquire()
      expect(result).toBe(false)
      expect(store.isActive).toBe(false)
    })

    it('returns false when acquire fails', async () => {
      mockRequest.mockRejectedValueOnce(new Error('NotAllowedError'))
      const result = await store.acquire()
      expect(result).toBe(false)
      expect(store.isActive).toBe(false)
    })
  })

  describe('startTimer and stopTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      const nativeWakeLock = createMockNativeWakeLock(true)
      store.initialize({ nativeWakeLock })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('startTimer sets timer state and acquires wake lock', async () => {
      const result = await store.startTimer(5)
      expect(result).toBe(true)
      expect(store.isActive).toBe(true)
      expect(store.timerActive).toBe(true)
      expect(store.timerDuration).toBe(5)
      expect(store.remainingTime).toBe(300)
    })

    it('startTimer rejects zero or negative minutes', async () => {
      expect(await store.startTimer(0)).toBe(false)
      expect(await store.startTimer(-1)).toBe(false)
      expect(store.timerActive).toBe(false)
    })

    it('timer counts down each second', async () => {
      await store.startTimer(1)
      expect(store.remainingTime).toBe(60)

      vi.advanceTimersByTime(10_000)
      expect(store.remainingTime).toBe(50)
    })

    it('stopTimer resets timer state', async () => {
      await store.startTimer(5)
      expect(store.timerActive).toBe(true)

      store.stopTimer()
      expect(store.timerActive).toBe(false)
      expect(store.remainingTime).toBe(0)
    })

    it('stopTimer halts countdown', async () => {
      await store.startTimer(1)
      vi.advanceTimersByTime(5000)
      expect(store.remainingTime).toBe(55)

      store.stopTimer()
      const frozenTime = store.remainingTime

      vi.advanceTimersByTime(10_000)
      expect(store.remainingTime).toBe(frozenTime)
    })

    it('timer auto-releases wake lock when it expires', async () => {
      await store.startTimer(1)
      vi.advanceTimersByTime(60_000)

      expect(store.remainingTime).toBeLessThanOrEqual(0)
      expect(mockRelease).toHaveBeenCalled()
    })
  })
})
