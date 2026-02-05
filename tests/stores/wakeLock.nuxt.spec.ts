import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWakeLockStore } from '~/stores/wakeLock'

// Mock navigator.wakeLock API
const mockRelease = vi.fn()
const mockAddEventListener = vi.fn()
const mockSentinel = {
  release: mockRelease,
  addEventListener: mockAddEventListener,
}

function installWakeLockMock() {
  Object.defineProperty(navigator, 'wakeLock', {
    value: {
      request: vi.fn().mockResolvedValue(mockSentinel),
    },
    writable: true,
    configurable: true,
  })
}

function removeWakeLockMock() {
  if ('wakeLock' in navigator) {
    // @ts-expect-error -- deleting browser API for test
    delete navigator.wakeLock
  }
}

describe('wakeLock store', () => {
  let store: ReturnType<typeof useWakeLockStore>

  beforeEach(() => {
    store = useWakeLockStore()
    mockRelease.mockReset()
    mockAddEventListener.mockReset()
  })

  afterEach(() => {
    store.stopTimer()
    removeWakeLockMock()
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

  describe('checkSupport', () => {
    it('detects wakeLock API support', async () => {
      installWakeLockMock()
      await store.checkSupport()
      expect(store.isSupported).toBe(true)
      expect(store.isLoading).toBe(false)
    })

    it('detects missing wakeLock API', async () => {
      removeWakeLockMock()
      await store.checkSupport()
      expect(store.isSupported).toBe(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('acquire and release', () => {
    beforeEach(() => {
      installWakeLockMock()
      store.isSupported = true
    })

    it('acquires wake lock and sets isActive', async () => {
      const result = await store.acquire()
      expect(result).toBe(true)
      expect(store.isActive).toBe(true)
      expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen')
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
      store.isSupported = false
      const result = await store.acquire()
      expect(result).toBe(false)
      expect(store.isActive).toBe(false)
    })

    it('returns false when acquire fails', async () => {
      ;(navigator.wakeLock.request as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('NotAllowedError'))
      const result = await store.acquire()
      expect(result).toBe(false)
      expect(store.isActive).toBe(false)
    })
  })

  describe('startTimer and stopTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      installWakeLockMock()
      store.isSupported = true
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
