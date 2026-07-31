import { useSupported } from '@vueuse/core'

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

  // The browser already tracks the single PiP window per document, so read it rather than
  // shadowing it in a ref — a local copy drifts the moment a window opens or closes by any
  // route this composable didn't drive.
  const currentPipWindow = () => window.documentPictureInPicture?.window ?? null

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

      const existing = docPip.window
      if (existing) {
        existing.focus()
        return { window: existing, status: 'focused_existing' }
      }

      return { window: await docPip.requestWindow({ width, height }), status: 'opened' }
    } catch (error) {
      console.error('Failed to open Document PiP window:', error)
      return { window: null, status: 'failed' }
    }
  }

  const closePipWindow = () => {
    const pipWin = currentPipWindow()
    if (pipWin && !pipWin.closed) {
      pipWin.close()
      trackEvent('pip_window_closed', { method: 'programmatic' })
    }
  }

  onUnmounted(() => {
    closePipWindow()
  })

  return {
    isPipSupported: readonly(isPipSupported),
    openPipWindow,
    closePipWindow
  }
}
