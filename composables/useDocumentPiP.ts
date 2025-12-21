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
 * Provides always-on-top floating window functionality
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
    if (mainToPipListener.value) {
      window.removeEventListener('message', mainToPipListener.value)
    }
    pipToMainListener.value = null
    mainToPipListener.value = null
    relayTargetWindows.value = { pipWin: null, mainWin: null }
  }

  /**
   * Set up message relay between main window and PiP iframe
   * The main window sends to PiP window, but needs to reach the iframe inside it
   * The iframe sends to its parent (PiP window), but needs to reach the main window
   */
  const setupMessageRelay = (pipWin: Window) => {
    cleanupMessageRelay()
    relayTargetWindows.value = { pipWin, mainWin: window }

    const isWakeLockMessage = (data: unknown) => {
      return data && typeof data === 'object' && 'type' in data && 
        (data.type === 'sync' || data.type === 'closed')
    }
    const isValidOrigin = (origin: string) => origin === window.location.origin

    // Forward iframe → main window (for sync and closed messages)
    pipToMainListener.value = (event: MessageEvent) => {
      if (event.source === pipWin.frames[0] && isValidOrigin(event.origin) && isWakeLockMessage(event.data)) {
        window.postMessage(event.data, event.origin)
      }
    }

    // Forward main window → iframe (only sync messages)
    mainToPipListener.value = (event: MessageEvent) => {
      if (event.source === window && isValidOrigin(event.origin) && pipWin.frames[0] && event.data?.type === 'sync') {
        pipWin.frames[0].postMessage(event.data, event.origin)
      }
    }

    pipWin.addEventListener('message', pipToMainListener.value)
    window.addEventListener('message', mainToPipListener.value)
  }

  /**
   * Open a Document Picture-in-Picture window
   * @param width - Window width
   * @param height - Window height
   * @returns The PiP window or null if failed
   */
  const openPipWindow = async (width: number, height: number): Promise<Window | null> => {
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
