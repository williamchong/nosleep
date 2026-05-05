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

export type PipOpenStatus = 'opened' | 'focused_existing' | 'unsupported' | 'failed'

export interface PipOpenResult {
  window: Window | null
  status: PipOpenStatus
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
   * Open a Document Picture-in-Picture window. Tracking is the caller's
   * responsibility — the caller knows the `source` (cta, etc.).
   */
  const openPipWindow = async (width: number, height: number): Promise<PipOpenResult> => {
    if (!isPipSupported.value) {
      console.warn('Document Picture-in-Picture API not supported')
      return { window: null, status: 'unsupported' }
    }

    try {
      const docPip = window.documentPictureInPicture
      if (!docPip) return { window: null, status: 'unsupported' }

      if (docPip.window) {
        pipWindow.value = docPip.window
        docPip.window.focus()
        return { window: docPip.window, status: 'focused_existing' }
      }

      const newPipWindow = await docPip.requestWindow({ width, height })
      pipWindow.value = newPipWindow
      return { window: newPipWindow, status: 'opened' }
    } catch (error) {
      console.error('Failed to open Document PiP window:', error)
      return { window: null, status: 'failed' }
    }
  }

  const closePipWindow = () => {
    if (pipWindow.value && !pipWindow.value.closed) {
      pipWindow.value.close()
      pipWindow.value = null
      trackEvent('pip_window_closed', { method: 'programmatic' })
    }
    cleanupMessageRelay()
  }

  useEventListener(
    () => isPipSupported.value ? window.documentPictureInPicture : undefined,
    'enter',
    (event: Event & { window: Window }) => {
      pipWindow.value = event.window
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
