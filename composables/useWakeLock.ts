export const useWakeLock = () => {
  const isSupported = ref(false)
  const isActive = ref(false)
  const wakeLock = ref<WakeLockSentinel | null>(null)

  // Video fallback for unsupported browsers
  const videoElement = ref<HTMLVideoElement | null>(null)
  const usingVideoFallback = ref(false)

  // Timer functionality
  const timerActive = ref(false)
  const timerDuration = ref(0) // in minutes
  const remainingTime = ref(0) // in seconds
  const timerInterval = ref<NodeJS.Timeout | null>(null)

  const checkSupport = () => {
    isSupported.value = 'wakeLock' in navigator
  }

  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      // When page becomes visible again, try to re-acquire wake lock if we were active
      if (isActive.value && !wakeLock.value && !usingVideoFallback.value) {
        if (isSupported.value) {
          await acquire()
        } else {
          await startVideoFallback()
        }
      }
    } else {
      // When page becomes hidden, the wake lock will be automatically released
      // We'll fall back to video to maintain some level of wake functionality
      if (isActive.value && wakeLock.value) {
        // Wake lock will be released automatically, but we can start video fallback
        await startVideoFallback()
      }
    }
  }

  const createDummyVideo = () => {
    if (typeof document === 'undefined') return null

    const video = document.createElement('video')
    video.setAttribute('loop', '')
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('autoplay', '')
    video.style.position = 'fixed'
    video.style.top = '-1px'
    video.style.left = '-1px'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'

    // Create a minimal video data URL (1x1 pixel, 1 second duration)
    video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAABOdtZGF0AAACvQYF//+53EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjc5NSBhYWE5YWE4IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9YWJyIG1idHJlZT0xIGJpdHJhdGU9NTAwIHJhdGV0b2w9MS4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAEmWIhAAa//7ugr4FN3ncFEIV4d4CAExhdmM1Ny44OS4xMDAAQjebYIG7fwAQt9QJGQWooJ8V9vw+Zqta5njzO/aqsy2aqSSdnsSofyMfunhGd/t5QLpBxpIPPEHnhGye2vE2p4hHdE8Qwc24OSMrm9nniO8jfELnRc84cAgsXV4H3HVT5Yn4OYUgaJymr+r3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'

    document.body.appendChild(video)
    return video
  }

  const startVideoFallback = async () => {
    if (!videoElement.value) {
      videoElement.value = createDummyVideo()
    }

    if (videoElement.value) {
      try {
        await videoElement.value.play()
        usingVideoFallback.value = true
        isActive.value = true

        // Track fallback method usage
        useTrackEvent('fallback_method_used', {
          browser_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          wake_lock_supported: false
        })

        return true
      } catch (error) {
        console.error('Failed to start video fallback:', error)

        // Track fallback error
        useTrackEvent('wake_lock_error', {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          method: 'video_fallback'
        })

        return false
      }
    }
    return false
  }

  const stopVideoFallback = () => {
    if (videoElement.value) {
      videoElement.value.pause()
      videoElement.value.remove()
      videoElement.value = null
    }
    usingVideoFallback.value = false
  }

  const acquire = async () => {
    if (isSupported.value) {
      try {
        // Stop video fallback if it's running since we're using native wake lock
        if (usingVideoFallback.value) {
          stopVideoFallback()
        }

        wakeLock.value = await navigator.wakeLock.request('screen')
        isActive.value = true

        wakeLock.value.addEventListener('release', async () => {
          wakeLock.value = null
          // If we still want to stay active, fall back to video
          if (isActive.value && document.visibilityState === 'hidden') {
            await startVideoFallback()
          }
        })

        return true
      } catch (error) {
        console.error('Failed to acquire wake lock:', error)

        // Track wake lock error
        useTrackEvent('wake_lock_error', {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          method: 'native_api'
        })

        return false
      }
    } else {
      // Fallback to video method for unsupported browsers
      return await startVideoFallback()
    }
  }

  const release = async () => {
    if (wakeLock.value) {
      await wakeLock.value.release()
      wakeLock.value = null
      isActive.value = false
    }

    if (usingVideoFallback.value) {
      stopVideoFallback()
      isActive.value = false
    }

    stopTimer()
  }

  const startTimer = async (minutes: number) => {
    if (minutes <= 0) return false

    // Start wake lock if not active
    if (!isActive.value) {
      const success = await acquire()
      if (!success) return false
    }

    timerDuration.value = minutes
    remainingTime.value = minutes * 60
    timerActive.value = true

    timerInterval.value = setInterval(() => {
      remainingTime.value--

      if (remainingTime.value <= 0) {
        // Track timer completion
        useTrackEvent('timer_complete')

        release()
      }
    }, 1000)

    return true
  }

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    timerActive.value = false
    remainingTime.value = 0
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const toggle = async () => {
    if (isActive.value) {
      await release()
    } else {
      await acquire()
    }
  }

  onMounted(() => {
    checkSupport()

    // Listen for visibility changes to handle wake lock loss
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  onUnmounted(() => {
    release()

    // Clean up event listener
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  return {
    isSupported: readonly(isSupported),
    isActive: readonly(isActive),
    usingVideoFallback: readonly(usingVideoFallback),
    timerActive: readonly(timerActive),
    timerDuration: readonly(timerDuration),
    remainingTime: readonly(remainingTime),
    acquire,
    release,
    toggle,
    startTimer,
    stopTimer,
    formatTime
  }
}