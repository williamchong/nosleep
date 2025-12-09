/**
 * Type definition for experimental Document Picture-in-Picture API
 */
interface DocumentPictureInPictureAPI {
  window: Window | null
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>
  addEventListener: (event: string, handler: (e: Event & { window: Window }) => void) => void
  removeEventListener: (event: string, handler: (e: Event & { window: Window }) => void) => void
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPictureAPI
  }
}

/**
 * Composable for managing Document Picture-in-Picture API
 * Provides always-on-top floating window functionality with fallback to regular popup
 */
export const useDocumentPiP = () => {
  const { trackEvent } = useAnalytics()

  const isPipSupported = ref(false)
  const pipWindow = ref<Window | null>(null)
  const hasPipWindow = computed(() => pipWindow.value !== null && !pipWindow.value.closed)
  const enterEventHandler = ref<((e: Event & { window: Window }) => void) | null>(null)

  const pipToMainListener = ref<((event: MessageEvent) => void) | null>(null)
  const mainToPipListener = ref<((event: MessageEvent) => void) | null>(null)
  const relayTargetWindows = ref<{ pipWin: Window | null; mainWin: Window | null }>({ pipWin: null, mainWin: null })

  const checkPipSupport = () => {
    if (typeof window !== 'undefined') {
      isPipSupported.value = 'documentPictureInPicture' in window
    }
  }

  /**
   * Clean up message relay event listeners
   */
  const cleanupMessageRelay = () => {
    if (pipToMainListener.value && relayTargetWindows.value.pipWin) {
      relayTargetWindows.value.pipWin.removeEventListener('message', pipToMainListener.value)
    }
    if (mainToPipListener.value && relayTargetWindows.value.mainWin) {
      relayTargetWindows.value.mainWin.removeEventListener('message', mainToPipListener.value)
    }
    pipToMainListener.value = null
    mainToPipListener.value = null
    relayTargetWindows.value = { pipWin: null, mainWin: null }
  }

  /**
   * Set up message relay between main window and PiP iframe
   * Forwards wake-lock messages bidirectionally to keep main window and PiP iframe in sync
   */
  const setupMessageRelay = (pipWin: Window, mainWin: Window) => {
    cleanupMessageRelay()
    relayTargetWindows.value = { pipWin, mainWin }

    // Relay messages from iframe to main window
    pipToMainListener.value = (event: MessageEvent) => {
      // Only relay wake-lock messages from the iframe, validate origin
      if (
        event.source === pipWin.frames[0] &&
        event.origin === window.location.origin &&
        event.data?.type &&
        (event.data.type === 'wake-lock-sync' || event.data.type === 'popup-closed')
      ) {
        mainWin.postMessage(event.data, event.origin)
      }
    }
    pipWin.addEventListener('message', pipToMainListener.value)

    // Relay messages from main window to iframe
    mainToPipListener.value = (event: MessageEvent) => {
      // Only relay wake-lock messages to iframe, validate origin and that iframe exists
      if (
        event.source === mainWin &&
        event.origin === window.location.origin &&
        pipWin.frames[0] &&
        event.data?.type &&
        (event.data.type === 'wake-lock-sync' || event.data.type === 'wake-lock-initial-sync')
      ) {
        pipWin.frames[0].postMessage(event.data, event.origin)
      }
    }
    mainWin.addEventListener('message', mainToPipListener.value)
  }

  /**
   * Open a Document Picture-in-Picture window
   * @param width - Window width (default: 350)
   * @param height - Window height (default: 650)
   * @returns The PiP window or null if failed
   */
  const openPipWindow = async (width = 350, height = 650): Promise<Window | null> => {
    if (!isPipSupported.value) {
      console.warn('Document Picture-in-Picture API not supported')
      return null
    }

    try {
      const docPip = window.documentPictureInPicture

      if (!docPip) {
        return null
      }

      if (docPip.window) {
        pipWindow.value = docPip.window
        docPip.window.focus()
        trackEvent('pip_window_focus_existing')
        return docPip.window
      }

      const newPipWindow = await docPip.requestWindow({
        width,
        height
      })

      pipWindow.value = newPipWindow
      trackEvent('pip_window_opened_successfully')
      return newPipWindow
    } catch (error) {
      console.error('Failed to open Document PiP window:', error)
      trackEvent('pip_window_open_failed')
      return null
    }
  }

  const closePipWindow = () => {
    if (pipWindow.value && !pipWindow.value.closed) {
      pipWindow.value.close()
      pipWindow.value = null
      trackEvent('pip_window_closed_programmatically')
    }
    cleanupMessageRelay()
  }

  onMounted(() => {
    checkPipSupport()

    if (isPipSupported.value && window.documentPictureInPicture) {
      enterEventHandler.value = (event) => {
        pipWindow.value = event.window
        trackEvent('pip_enter_event_fired')
      }
      window.documentPictureInPicture.addEventListener('enter', enterEventHandler.value)
    }
  })

  onUnmounted(() => {
    if (enterEventHandler.value && window.documentPictureInPicture) {
      window.documentPictureInPicture.removeEventListener('enter', enterEventHandler.value)
      enterEventHandler.value = null
    }
    closePipWindow()
    cleanupMessageRelay()
  })

  return {
    isPipSupported: readonly(isPipSupported),
    pipWindow: readonly(pipWindow),
    hasPipWindow: readonly(hasPipWindow),
    openPipWindow,
    closePipWindow,
    setupMessageRelay
  }
}
