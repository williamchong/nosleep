import { useEventListener, useSupported } from '@vueuse/core'

/**
 * Type definition for experimental Document Picture-in-Picture API
 */
interface DocumentPictureInPictureAPI extends EventTarget {
  window: Window | null
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>
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

  const isPipSupported = useSupported(() => typeof window !== 'undefined' && 'documentPictureInPicture' in window)
  const pipWindow = ref<Window | null>(null)
  const hasPipWindow = computed(() => pipWindow.value !== null && !pipWindow.value.closed)

  const relayPipWin = ref<Window | null>(null)

  const isWakeLockMessage = (data: unknown) => {
    return data && typeof data === 'object' && 'type' in data &&
      (data.type === 'wake-lock-sync' || data.type === 'pip-closed')
  }

  useEventListener(relayPipWin, 'message', (event: MessageEvent) => {
    if (relayPipWin.value && event.source === relayPipWin.value.frames[0] &&
      event.origin === window.location.origin && isWakeLockMessage(event.data)) {
      window.postMessage(event.data, event.origin)
    }
  })

  const cleanupMessageRelay = () => {
    relayPipWin.value = null
  }

  const setupMessageRelay = (pipWin: Window) => {
    cleanupMessageRelay()
    relayPipWin.value = pipWin
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

  useEventListener(
    () => isPipSupported.value ? window.documentPictureInPicture : undefined,
    'enter',
    (event: Event & { window: Window }) => {
      pipWindow.value = event.window
      trackEvent('pip_enter_event_fired')
    }
  )

  onUnmounted(() => {
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
