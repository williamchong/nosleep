export const useWakeLock = () => {
  const isSupported = ref(false)
  const isActive = ref(false)
  const wakeLock = ref<WakeLockSentinel | null>(null)

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
    acquire,
    release,
    toggle
  }
}