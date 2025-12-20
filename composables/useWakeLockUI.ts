/**
 * Shared UI logic for wake lock controls
 * Used by both main page and PiP window content
 */
export const useWakeLockUI = (wakeLock: ReturnType<typeof useWakeLock>, options: {
  isPipMode?: boolean
  hasActivePipWindow?: Ref<boolean> | ComputedRef<boolean>
} = {}) => {
  const { t } = useI18n()
  const { trackEvent } = useAnalytics()
  const { isPipMode = false, hasActivePipWindow = ref(false) } = options

  const statusText = computed(() =>
    wakeLock.isActive.value ? t('status.deviceAwake') : t('status.deviceSleeping')
  )

  const buttonClasses = computed(() => {
    // Focus to PiP button - use blue to indicate action (only on main page)
    if (hasActivePipWindow.value && !isPipMode) {
      return 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 focus:ring-blue-300'
    }

    if (wakeLock.isActive.value) {
      return 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 focus:ring-green-300'
    }

    // Inactive state - use red to show "ready to activate"
    return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-300'
  })

  const buttonText = computed(() => {
    // Show "Focus to Popup" only on main page when PiP window is active
    if (hasActivePipWindow.value && !isPipMode) {
      return t('button.focusToPopup')
    }

    if (wakeLock.isActive.value) {
      return t('button.deviceAwake')
    }
    return t('button.clickToKeepAwake')
  })

  const handleToggle = async () => {
    // If parent has active PiP window, focus to it instead
    if (hasActivePipWindow.value && !isPipMode && wakeLock.pipWindowRef.value) {
      try {
        if (!wakeLock.pipWindowRef.value.closed) {
          wakeLock.pipWindowRef.value.focus()
          trackEvent('pip_focus_from_main_button')
          return
        }
      } catch (e) {
        // Handle cross-origin exception - treat as closed
        console.warn('Could not access PiP window:', e)
      }
    }

    try {
      await wakeLock.toggle()

      const action = wakeLock.isActive.value ? 'activate' : 'deactivate'
      const prefix = isPipMode ? 'pip' : 'main'
      trackEvent(`${prefix}_toggle_${action}_native_api`)
    } catch (error) {
      console.error('Failed to toggle wake lock:', error)
      trackEvent(`${isPipMode ? 'pip' : 'main'}_toggle_failed`)
    }
  }

  const handleTimerStart = async (minutes: number) => {
    try {
      const success = await wakeLock.startTimer(minutes)
      if (success) {
        const prefix = isPipMode ? 'pip' : 'main'
        trackEvent(`${prefix}_timer_start`)
      }
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleTimerCancel = () => {
    wakeLock.stopTimer()
    const prefix = isPipMode ? 'pip' : 'main'
    trackEvent(`${prefix}_timer_cancel`)
  }

  return {
    statusText,
    buttonClasses,
    buttonText,
    handleToggle,
    handleTimerStart,
    handleTimerCancel
  }
}
