/**
 * Shared UI logic for wake lock controls
 * Used by both main page and PiP window content
 */
export const useWakeLockUI = (wakeLockState: ReturnType<typeof useWakeLockState>, options: {
  isPipMode?: boolean
  hasActivePipWindow?: Ref<boolean> | ComputedRef<boolean>
} = {}) => {
  const { t } = useI18n()
  const { trackEvent } = useAnalytics()
  const { isPipMode = false, hasActivePipWindow = ref(false) } = options

  const statusText = computed(() =>
    wakeLockState.isActive ? t('status.deviceAwake') : t('status.deviceSleeping')
  )

  // Hero toggle color by state: primary = focus-to-popup action, success = awake, error = ready to activate.
  const buttonColor = computed<'primary' | 'success' | 'error'>(() => {
    if (hasActivePipWindow.value && !isPipMode) return 'primary'
    if (wakeLockState.isActive) return 'success'
    return 'error'
  })

  const buttonText = computed(() => {
    // Show "Focus to Popup" only on main page when PiP window is active
    if (hasActivePipWindow.value && !isPipMode) {
      return t('button.focusToPopup')
    }

    if (wakeLockState.isActive) {
      return t('button.deviceAwake')
    }
    return t('button.clickToKeepAwake')
  })

  const handleToggle = async () => {
    // If parent has active PiP window, focus to it instead
    if (hasActivePipWindow.value && !isPipMode && wakeLockState.pipWindowRef) {
      try {
        if (!wakeLockState.pipWindowRef.closed) {
          wakeLockState.pipWindowRef.focus()
          trackEvent('pip_focus', { source: 'main_button' })
          return
        }
      } catch (e) {
        // Handle cross-origin exception - treat as closed
        console.warn('Could not access PiP window:', e)
      }
    }

    try {
      await wakeLockState.toggle()
      const action = wakeLockState.isActive ? 'activate' : 'deactivate'
      trackEvent('wake_lock_toggled', { surface: wakeLockState.surface, action })
    } catch (error) {
      console.error('Failed to toggle wake lock:', error)
      trackEvent('client_error', {
        kind: 'wake_lock_toggle_failed',
        surface: wakeLockState.surface,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const handleTimerStart = async (minutes: number, preset?: string) => {
    try {
      const success = await wakeLockState.startTimer(minutes)
      if (success) {
        trackEvent('timer_started', {
          surface: wakeLockState.surface,
          duration_minutes: minutes,
          preset: preset ?? 'unknown'
        })
      }
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleTimerCancel = () => {
    const timeRemaining = wakeLockState.remainingTime
    wakeLockState.stopTimer()
    trackEvent('timer_cancelled', { surface: wakeLockState.surface, time_remaining_seconds: timeRemaining })
  }

  return {
    statusText,
    buttonColor,
    buttonText,
    handleToggle,
    handleTimerStart,
    handleTimerCancel
  }
}
