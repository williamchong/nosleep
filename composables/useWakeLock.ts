interface WakeLockMessageData {
  type: string
  isActive: boolean
  usingVideoFallback: boolean
  timerActive: boolean
  remainingTime: number
}

export const useWakeLock = () => {
  const route = useRoute()
  const { trackEvent } = useAnalytics()
  const isSupported = ref(false)
  const isActive = ref(false)
  const wakeLock = ref<WakeLockSentinel | null>(null)

  const videoElement = ref<HTMLVideoElement | null>(null)
  const usingVideoFallback = ref(false)

  const isPopup = ref(false)
  const isIframePip = ref(false)
  const isPipMode = ref(false)
  const popupRef = ref<Window | null>(null)
  const hasActivePopup = computed(() => popupRef.value !== null && !popupRef.value.closed)

  const isParentWithActivePopup = computed(() =>
    !isPopup.value && !isIframePip.value && hasActivePopup.value
  )
  const isChildWindow = computed(() => isPopup.value || isIframePip.value)
  const shouldSyncState = computed(() => isChildWindow.value || !hasActivePopup.value)

  const timerActive = ref(false)
  const timerDuration = ref(0)
  const remainingTime = ref(0)
  const timerInterval = ref<NodeJS.Timeout | null>(null)
  const isAcquiring = ref(false) // Mutex for acquire/release operations

  const checkSupport = () => {
    if (route.query.fallback === '1') {
      isSupported.value = false
      return
    }

    isSupported.value = 'wakeLock' in navigator
  }

  // Helper: Create timer interval (consolidated logic)
  const createTimerInterval = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    timerInterval.value = setInterval(() => {
      remainingTime.value--

      if (shouldSyncState.value) {
        syncWakeLockState()
      }

      if (remainingTime.value <= 0) {
        trackEvent('timer_expired_auto_release')
        release()
      }
    }, 1000)
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

    video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAABOdtZGF0AAACvQYF//+53EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjc5NSBhYWE5YWE4IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9YWJyIG1idHJlZT0xIGJpdHJhdGU9NTAwIHJhdGV0b2w9MS4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAEmWIhAAa//7ugr4FN3ncFEIV4d4CAExhdmM1Ny44OS4xMDAAQjebYIG7fwAQt9QJGQWooJ8V9vw+Zqta5njzO/aqsy2aqSSdnsSofyMfunhGd/t5QLpBxpIPPEHnhGye2vE2p4hHdE8Qwc24OSMrm9nniO8jfELnRc84cAgsXV4H3HVT5Yn4OYUgaJymr+r3BjNskBb9E/Gr7r35PdHI+7sQ7oVWx53z59Z9i3xstw8XziIODPey4waIw+A1DAobmN1QxX9EzbI2cHHmfrOmSZEePZFqvReO89/r9NwRmJX1dQvXjzzqnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnDAwMDAwMDAwMDAwMDAwMDAwMDG7Ru0btG7Ru0btG7Ru0btG7Ru0btG7Ru0btG7SCvsBY2q8Lv71GuauprYFQBKkkj0QlQ8DuSav+GOzTvqGRXPih1e8Hp7jBzvWUMkYXTk5RuOCC22Z2nJxKIPyvzoTAPmv/zas/qU3yP82V9XsLg+p0pk3rUEWbId8QSp3GVyC7x+caLoycdcd+a00D8Hkbp+QsHFo4mCNj+PtGpw9kOvFG5rTmiO3Xx5y5+xZhMx5rYbK9IzHxhpeenS8lMFx5PD/L2BSPNbJi+Q5skCJutX4aSbCaCaCaFywsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLC8AAAATobW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAAC8AAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAit0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAACIAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAOOOQACAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAAiAAAAAAABAAAAAAGjbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAu1AAAAZAVxwAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABTm1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAQ5zdGJsAAAAqnN0c2QAAAAAAAAAAQAAAJphdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAIAAgBIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAANGF2Y0MBZAAU/+EAHGdkABSs2V+IiP/ABAACRAAAAwGQAABdqDxQplgBAAVo6+yyLAAAABBwYXNwAAAAEAAAAAkAAAAYc3R0cwAAAAAAAAABAAAAAQAAAZAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAC1wAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAed0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAAAC8AAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAAvAAAAAAABAAAAAAFfbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABWIgAABAAVxwAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAABCm1pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAAznN0YmwAAABqc3RzZAAAAAAAAAABAAAAWm1wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAABWIgAAAAAANmVzZHMAAAAAA4CAgCUAAgAEgICAF0AVAAAAAAH0AAABXeoFgICABROQVuUABoCAgAECAAAAGHN0dHMAAAAAAAAAAQAAAAEAAAQAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAggAAAABAAAAFHN0Y28AAAAAAAAAAQAAAwcAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU3LjcxLjEwMA=='

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
        trackEvent('video_fallback_method_activated')
        return true
      } catch (error) {
        console.error('Failed to start video fallback:', error)
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

  const establishNativeWakeLock = async () => {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
      wakeLock.value.addEventListener('release', () => {
        const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
        trackEvent(`wakelock_auto_released_${timerStatus}`)

        wakeLock.value = null

        // Only update isActive if there's no popup managing the wake lock
        // When a popup is active, the parent's wake lock is intentionally released
        // and the popup manages its own wake lock. The parent's isActive state
        // reflects the overall system state (synced from popup), not just local wake lock.
        if (!hasActivePopup.value) {
          isActive.value = false
        }
      })
      return true
    } catch (error) {
      console.error('Failed to establish wake lock:', error)
      trackEvent('wake_lock_acquire_failed_native_api')
      return false
    }
  }

  const acquire = async () => {
    // Prevent concurrent acquire/release operations - check and set atomically
    if (isAcquiring.value) {
      return false
    }
    isAcquiring.value = true

    try {
      if (isParentWithActivePopup.value) {
        return false
      }

      if (isChildWindow.value && !isSupported.value) {
        return false
      }

      if (isSupported.value) {
        if (usingVideoFallback.value) {
          stopVideoFallback()
        }

        const success = await establishNativeWakeLock()
        if (success) {
          isActive.value = true

          if (shouldSyncState.value) {
            syncWakeLockState()
          }
          return true
        } else {
          trackEvent('wake_lock_establish_failed_native_api')
          return false
        }
      } else {
        const result = await startVideoFallback()
        if (result && shouldSyncState.value) {
          syncWakeLockState()
        }
        return result
      }
    } finally {
      isAcquiring.value = false
    }
  }

  const release = async () => {
    // Prevent concurrent acquire/release operations - check and set atomically
    if (isAcquiring.value) {
      return
    }
    isAcquiring.value = true

    try {
      if (isParentWithActivePopup.value) {
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

      if (!isChildWindow.value && usingVideoFallback.value) {
        stopVideoFallback()
        isActive.value = false
      }

      stopTimer()

      if (shouldSyncState.value) {
        syncWakeLockState()
      }
    } finally {
      isAcquiring.value = false
    }
  }

  // Force release parent lock when popup opens (bypasses popup active check)
  const forceReleaseParent = async () => {
    if (isChildWindow.value) return

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

    if (isParentWithActivePopup.value) {
      return false
    }

    if (!isActive.value) {
      const success = await acquire()
      if (!success) return false
    }

    timerDuration.value = minutes
    remainingTime.value = minutes * 60
    timerActive.value = true

    createTimerInterval()

    syncWakeLockState()
    return true
  }

  const stopTimer = () => {
    if (isParentWithActivePopup.value) {
      return
    }

    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    timerActive.value = false
    remainingTime.value = 0

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
  }

  const createSyncMessage = (type: 'wake-lock-sync' | 'wake-lock-initial-sync'): WakeLockMessageData => ({
    type,
    isActive: isActive.value,
    usingVideoFallback: isChildWindow.value ? false : usingVideoFallback.value,
    timerActive: timerActive.value,
    remainingTime: remainingTime.value
  })

  const syncWakeLockState = () => {
    const message = createSyncMessage('wake-lock-sync')

    if (isPopup.value && window.opener) {
      try {
        if (!window.opener.closed) {
          window.opener.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send to window.opener:', e)
      }
    }

    if (isIframePip.value && window.parent !== window) {
      try {
        window.parent.postMessage(message, window.location.origin)
      } catch (e) {
        console.warn('Could not send to window.parent:', e)
      }
    }

    if (!isChildWindow.value && popupRef.value) {
      try {
        if (!popupRef.value.closed) {
          popupRef.value.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send to popup:', e)
      }
    }
  }

  const initialSyncToPopup = () => {
    if (popupRef.value) {
      try {
        if (!popupRef.value.closed) {
          const message = createSyncMessage('wake-lock-initial-sync')
          popupRef.value.postMessage(message, window.location.origin)
        }
      } catch (e) {
        console.warn('Could not send initial sync to popup:', e)
      }
    }
  }

  const handleInitialSync = (data: WakeLockMessageData) => {
    // Prevent duplicate syncs if already synced AND time matches
    if (timerInterval.value && data.timerActive && remainingTime.value === data.remainingTime) {
      return
    }

    remainingTime.value = data.remainingTime
    timerActive.value = data.timerActive

    if (data.timerActive && data.remainingTime > 0 && !timerInterval.value) {
      createTimerInterval()
    }

    if (data.isActive && !isActive.value) {
      acquire()
    } else if (!data.isActive && isActive.value) {
      release()
    } else {
      setTimeout(() => {
        syncWakeLockState()
      }, 100)
    }
  }

  const handleWakeLockSync = (data: WakeLockMessageData) => {
    isActive.value = data.isActive
    timerActive.value = data.timerActive
    remainingTime.value = data.remainingTime

    const activeStatus = data.isActive ? 'active' : 'inactive'
    const timerStatus = data.timerActive ? 'with_timer' : 'without_timer'
    trackEvent(`popup_sync_received_${activeStatus}_${timerStatus}`)
  }

  const handlePopupClosed = async () => {
    const wasActive = isActive.value
    popupRef.value = null
    const activeStatus = wasActive ? 'was_active' : 'was_inactive'
    const timerStatus = timerActive.value ? 'with_timer' : 'without_timer'
    trackEvent(`popup_closed_${activeStatus}_${timerStatus}`)

    // Fix: Correct async/await pattern with nextTick
    await nextTick()

    if (wasActive) {
      const reacquireSuccess = await acquire()

      const method = isSupported.value ? 'native_api' : 'video_fallback'
      const result = reacquireSuccess ? 'success' : 'failed'
      trackEvent(`wakelock_reacquire_${method}_${result}`)

      // If reacquire failed, ensure clean state
      if (!reacquireSuccess) {
        isActive.value = false
        wakeLock.value = null
      }
    } else {
      if (wakeLock.value) {
        try {
          await wakeLock.value.release()
          wakeLock.value = null
          isActive.value = false
        } catch (error) {
          console.error(error)
          trackEvent('wake_lock_state_cleanup_error')
          isActive.value = false
          wakeLock.value = null
        }
      }
    }
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      trackEvent('cross_window_message_origin_mismatch')
      return
    }

    if (event.data.type === 'wake-lock-initial-sync' && isChildWindow.value) {
      handleInitialSync(event.data)
      return
    }

    if (event.data.type === 'wake-lock-sync' && !isChildWindow.value) {
      handleWakeLockSync(event.data)
      return
    }

    if (event.data.type === 'popup-closed' && !isChildWindow.value) {
      handlePopupClosed()
    }
  }

  onMounted(() => {
    checkSupport()

    if (typeof window !== 'undefined') {
      isPopup.value = window.opener !== null
      isPipMode.value = route.query.pip === '1'
      isIframePip.value = isPipMode.value && window.parent !== window

      window.addEventListener('message', handleMessage)

      if (isPopup.value) {
        window.addEventListener('beforeunload', () => {
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'popup-closed' }, window.location.origin)
            }
          } catch (e) {
            // Handle cross-origin exception - can't access window.opener.closed
            console.warn('Could not send popup-closed message to opener:', e)
          }
        })
      }

      if (isIframePip.value) {
        window.addEventListener('beforeunload', () => {
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'popup-closed' }, window.location.origin)
            }
          } catch (e) {
            // Handle cross-origin exception - can't access window.parent
            console.warn('Could not send popup-closed message to parent:', e)
          }
        })
      }
    }
  })

  onUnmounted(() => {
    release()

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
    isIframePip: readonly(isIframePip),
    isPipMode: readonly(isPipMode),
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