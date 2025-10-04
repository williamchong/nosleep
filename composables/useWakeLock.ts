export const useWakeLock = () => {
  const route = useRoute()
  const { trackEvent } = useAnalytics()
  const isSupported = ref(false)
  const isActive = ref(false)
  const wakeLock = ref<WakeLockSentinel | null>(null)

  // Video fallback for unsupported browsers
  const videoElement = ref<HTMLVideoElement | null>(null)
  const usingVideoFallback = ref(false)

  // Cross-window communication
  const isPopup = ref(false)
  const popupRef = ref<Window | null>(null)
  const hasActivePopup = computed(() => popupRef.value !== null && !popupRef.value.closed)

  // Timer functionality
  const timerActive = ref(false)
  const timerDuration = ref(0) // in minutes
  const remainingTime = ref(0) // in seconds
  const timerInterval = ref<NodeJS.Timeout | null>(null)

  const checkSupport = () => {
    // Check for debug query parameter to force video fallback
    if (route.query.fallback === '1') {
      isSupported.value = false
      return
    }

    isSupported.value = 'wakeLock' in navigator
  }

  const createDummyVideo = () => {
    if (typeof document === 'undefined') return null

    const video = document.createElement('video')
    video.setAttribute('loop', '')
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
        trackEvent('video_fallback_method_activated')

        return true
      } catch (error) {
        console.error('Failed to start video fallback:', error)

        // Track video fallback error
        trackEvent('video_fallback_activation_failed')

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

  // Helper function to establish native wake lock
  const establishNativeWakeLock = async () => {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
      wakeLock.value.addEventListener('release', () => {
        // Track wake lock automatic release
        const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
        trackEvent(`wakelock_auto_released_${timerStatus}`)

        wakeLock.value = null
        isActive.value = false
      })
      return true
    } catch (error) {
      console.error('Failed to establish wake lock:', error)

      // Track native wake lock acquisition failure
      trackEvent('wake_lock_acquire_failed_native_api')

      return false
    }
  }

  const acquire = async () => {
    // Don't allow parent to change state when popup is active
    if (!isPopup.value && hasActivePopup.value) {
      return false
    }

    // Popup windows only use native wake lock, no video fallback
    if (isPopup.value && !isSupported.value) {
      return false
    }

    if (isSupported.value) {
      // Stop video fallback if it's running since we're using native wake lock
      if (usingVideoFallback.value) {
        stopVideoFallback()
      }

      const success = await establishNativeWakeLock()
      if (success) {
        isActive.value = true

        // Only sync if we're in popup or parent has no active popup
        if (isPopup.value || !hasActivePopup.value) {
          syncWakeLockState()
        }
        return true
      } else {
        // Track wake lock error
        trackEvent('wake_lock_establish_failed_native_api')
        return false
      }
    } else {
      // Fallback to video method for unsupported browsers (parent window only)
      const result = await startVideoFallback()
      if (result && (isPopup.value || !hasActivePopup.value)) {
        syncWakeLockState()
      }
      return result
    }
  }

  const release = async () => {
    // Don't allow parent to change state when popup is active
    if (!isPopup.value && hasActivePopup.value) {
      return
    }

    if (wakeLock.value) {
      try {
        await wakeLock.value.release()
        wakeLock.value = null
        isActive.value = false
      } catch (error) {
        console.error('Failed to release wake lock:', error)
      }
    }

    // Only handle video fallback in parent windows
    if (!isPopup.value && usingVideoFallback.value) {
      stopVideoFallback()
      isActive.value = false
    }

    stopTimer()

    // Only sync if we're in popup or parent has no active popup
    if (isPopup.value || !hasActivePopup.value) {
      syncWakeLockState()
    }
  }

  // Force release parent lock when popup opens (bypasses popup active check)
  const forceReleaseParent = async () => {
    if (isPopup.value) return // Only for parent windows

    if (wakeLock.value) {
      try {
        await wakeLock.value.release()
        wakeLock.value = null
      } catch (error) {
        console.error('Failed to release parent wake lock:', error)
      }
    }

    if (usingVideoFallback.value) {
      stopVideoFallback()
    }
  }

  const startTimer = async (minutes: number) => {
    if (minutes <= 0) return false

    // Don't allow parent to change state when popup is active
    if (!isPopup.value && hasActivePopup.value) {
      return false
    }

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

      // Only sync timer updates if we're in popup or parent has no active popup
      if (isPopup.value || !hasActivePopup.value) {
        syncWakeLockState()
      }

      if (remainingTime.value <= 0) {
        // Track timer completion
        trackEvent('timer_expired_auto_release')

        release()
      }
    }, 1000)

    // Initial sync after starting timer
    syncWakeLockState()
    return true
  }

  const stopTimer = () => {
    // Don't allow parent to change state when popup is active
    if (!isPopup.value && hasActivePopup.value) {
      return
    }

    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    timerActive.value = false
    remainingTime.value = 0

    // Sync timer stop across windows
    syncWakeLockState()
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

    // Sync with popup or parent
    syncWakeLockState()
  }

  // Cross-window state synchronization
  const syncWakeLockState = () => {
    const message = {
      type: 'wake-lock-sync',
      isActive: isActive.value,
      usingVideoFallback: isPopup.value ? false : usingVideoFallback.value, // Popup never uses video fallback
      timerActive: timerActive.value,
      remainingTime: remainingTime.value
    }

    // If this is a popup, always send to parent
    if (isPopup.value && window.opener && !window.opener.closed) {
      window.opener.postMessage(message, window.location.origin)
    }
  }

  // Initial sync from parent to popup only
  const initialSyncToPopup = () => {
    if (popupRef.value && !popupRef.value.closed) {
      const message = {
        type: 'wake-lock-initial-sync',
        isActive: isActive.value,
        usingVideoFallback: false, // Popup never uses video fallback
        timerActive: timerActive.value,
        remainingTime: remainingTime.value
      }
      popupRef.value.postMessage(message, window.location.origin)
    }
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      // Track potential security issue - message from wrong origin
      trackEvent('cross_window_message_origin_mismatch')
      return
    }

    // Handle initial sync from parent to popup
    if (event.data.type === 'wake-lock-initial-sync' && isPopup.value) {
      isActive.value = event.data.isActive
      // Don't sync usingVideoFallback to popup - popup never uses video fallback
      timerActive.value = event.data.timerActive
      remainingTime.value = event.data.remainingTime
      return
    }

    // Handle sync from popup to parent
    if (event.data.type === 'wake-lock-sync' && !isPopup.value) {
      // Update state from popup (don't sync video fallback state since popup never uses it)
      isActive.value = event.data.isActive
      timerActive.value = event.data.timerActive
      remainingTime.value = event.data.remainingTime

      // Track sync received from popup
      const activeStatus = event.data.isActive ? 'active' : 'inactive'
      const timerStatus = event.data.timerActive ? 'with_timer' : 'without_timer'
      trackEvent(`popup_sync_received_${activeStatus}_${timerStatus}`)

      // Parent doesn't need to maintain its own wake lock while popup is active
      // All wake lock management is handled by the popup
      return
    }

    // Handle popup closed notification
    if (event.data.type === 'popup-closed' && !isPopup.value) {
      const wasActive = isActive.value
      popupRef.value = null

      // Track popup closed event
      const activeStatus = wasActive ? 'was_active' : 'was_inactive'
      const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
      trackEvent(`popup_closed_${activeStatus}_${timerStatus}`)

      // Reacquire wake lock in parent if popup was managing an active lock
      nextTick(async () => {
        if (wasActive) {
          // Popup was keeping device awake, now parent needs to take over
          const reacquireSuccess = await acquire()

          // Track wake lock handoff from popup back to parent
          const method = isSupported.value ? 'native_api' : 'video_fallback'
          const result = reacquireSuccess ? 'success' : 'failed'
          trackEvent(`wakelock_reacquire_${method}_${result}`)
        }

        // Clean up any stale wake lock state
        if (wakeLock.value) {
          try {
            const wakeLockReleased = wakeLock.value.released || false
            if (wakeLockReleased) {
              isActive.value = false
              wakeLock.value = null
            }
          } catch (error) {
            console.error(error)

            // Track wake lock state cleanup error
            trackEvent('wake_lock_state_cleanup_error')

            // If accessing .released fails, clean up
            isActive.value = false
            wakeLock.value = null
          }
        }
      })
    }
  }

  onMounted(() => {
    checkSupport()

    // Set up cross-window communication
    if (typeof window !== 'undefined') {
      // Set isPopup based on window.opener
      isPopup.value = window.opener !== null

      window.addEventListener('message', handleMessage)

      // If this is a popup, notify parent when closing
      if (isPopup.value) {
        window.addEventListener('beforeunload', () => {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'popup-closed' }, window.location.origin)
          }
        })
      }
    }
  })

  onUnmounted(() => {
    release()

    // Clean up event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage)
    }
  })

  return {
    isSupported: readonly(isSupported),
    isActive: readonly(isActive),
    usingVideoFallback: readonly(usingVideoFallback),
    timerActive: readonly(timerActive),
    timerDuration: readonly(timerDuration),
    remainingTime: readonly(remainingTime),
    isPopup: readonly(isPopup),
    popupRef,
    hasActivePopup: readonly(hasActivePopup),
    acquire,
    release,
    toggle,
    startTimer,
    stopTimer,
    formatTime,
    syncWakeLockState,
    initialSyncToPopup,
    forceReleaseParent
  }
}