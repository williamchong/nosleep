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

  const createDummyVideo = () => {
    if (typeof document === 'undefined') return null

    const video = document.createElement('video')
    video.setAttribute('loop', '')
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.style.position = 'fixed'
    video.style.top = '-1px'
    video.style.left = '-1px'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'

    // Create a minimal video data URL (1x1 pixel, 1 second duration)
    video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABNG4wG9/bFqHMWyYcAojKGZk+wAAAA='

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
        wakeLock.value = await navigator.wakeLock.request('screen')
        isActive.value = true

        wakeLock.value.addEventListener('release', () => {
          isActive.value = false
          wakeLock.value = null
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
  })

  onUnmounted(() => {
    release()
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