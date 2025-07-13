export const useWakeLock = () => {
  const isSupported = ref(false)
  const isActive = ref(false)
  const wakeLock = ref<WakeLockSentinel | null>(null)
  
  // Timer functionality
  const timerActive = ref(false)
  const timerDuration = ref(0) // in minutes
  const remainingTime = ref(0) // in seconds
  const timerInterval = ref<NodeJS.Timeout | null>(null)

  const checkSupport = () => {
    isSupported.value = 'wakeLock' in navigator
  }

  const acquire = async () => {
    if (!isSupported.value) return false

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
      return false
    }
  }

  const release = async () => {
    if (wakeLock.value) {
      await wakeLock.value.release()
      wakeLock.value = null
      isActive.value = false
    }
    stopTimer()
  }

  const startTimer = async (minutes: number) => {
    if (!isSupported.value || minutes <= 0) return false
    
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