<template>
  <div class="relative bg-white dark:bg-gray-900">
    <div class="fixed top-4 right-4 z-50">
      <DarkModeToggle />
    </div>

    <WakeLockControl auto-acquire>
      <template #extra-content>
        <FloatingWindowCTA
          :has-active-pip-window="wakeLock.hasActivePipWindow.value"
          :is-pip-mode="wakeLock.isPipMode.value"
          :is-supported="wakeLock.isSupported.value"
          :is-pip-supported="documentPip.isPipSupported.value"
          :is-mobile="$device.isMobile"
          @open-window="openFloatingWindow"
        />
      </template>
    </WakeLockControl>

    <div class="max-w-4xl mx-auto mt-8 px-4 space-y-12">
      <section class="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">{{ $t('sections.howToUse.title') }}
        </h2>
        <div class="max-w-2xl mx-auto">
          <ol class="space-y-4">
            <li v-for="(step, index) in $tm('sections.howToUse.steps')" :key="index" class="flex items-start space-x-3">
              <span
                class="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold"
              >
                {{ index + 1 }}
              </span>
              <p class="text-gray-700 dark:text-gray-300 text-lg">{{ $rt(step) }}</p>
            </li>
          </ol>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center italic">
            {{ $t('sections.howToUse.note') }}
          </p>
        </div>
      </section>

      <section class="space-y-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">{{ $t('sections.faq.title') }}</h2>

        <div class="grid gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{
              $t('sections.faq.useCases.question') }}
            </h3>
            <ul class="text-gray-600 dark:text-gray-400 space-y-2">
              <li v-for="(answer, index) in $tm('sections.faq.useCases.answers')" :key="index">• {{ $rt(answer) }}</li>
            </ul>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{
              $t('sections.faq.howItWorks.question') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">{{ $t('sections.faq.howItWorks.answer') }}</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{
              $t('sections.faq.safety.question') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('sections.faq.safety.answer') }}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{
              $t('sections.faq.browserSupport.question') }}
            </h3>
            <div class="text-gray-600 dark:text-gray-400">
              <p class="mb-2"><strong>{{ $t('sections.faq.browserSupport.nativeApiTitle') }}</strong></p>
              <ul class="space-y-1 mb-4">
                <li v-for="(browser, index) in $tm('sections.faq.browserSupport.nativeApiBrowsers')" :key="index">• {{
                  $rt(browser) }}
                </li>
              </ul>
              <p class="mb-2"><strong>{{ $t('sections.faq.browserSupport.fallbackTitle') }}</strong></p>
              <ul class="space-y-1">
                <li v-for="(browser, index) in $tm('sections.faq.browserSupport.fallbackBrowsers')" :key="index">• {{
                  $rt(browser) }}
                </li>
              </ul>
              <p class="text-sm mt-2 italic">{{ $t('sections.faq.browserSupport.note') }}</p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{
              $t('sections.faq.timerFeature.question') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('sections.faq.timerFeature.answer') }}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{
              $t('sections.faq.properUsage.question') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('sections.faq.properUsage.answer') }}
            </p>
          </div>
        </div>
      </section>

      <section class="text-center space-y-4 border-t border-gray-200 dark:border-gray-700 pt-12 pb-16">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('sections.about.title') }}</h2>
        <p class="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          {{ $t('sections.about.description') }}
        </p>
        <a
          href="https://blog.williamchong.cloud"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="handleExternalLinkClick"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          {{ $t('sections.about.visitBlog') }}
        </a>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const wakeLock = useWakeLock()
const documentPip = useDocumentPiP()

const { $device } = useNuxtApp()

const { trackEvent } = useAnalytics()

const handleExternalLinkClick = () => {
  trackEvent('external_link_click_blog')
}

const handleWindowClosed = async (wasActive: boolean) => {
  wakeLock.pipWindowRef.value = null
  trackEvent('pip_window_closed')

  await nextTick()

  if (wasActive) {
    await wakeLock.acquire()
  }
}

const setupPipIframe = (pipWin: Window, iframe: HTMLIFrameElement) => {
  // Attach event listeners BEFORE setting src to avoid race condition with cached loads
  iframe.addEventListener('error', () => {
    console.error('Failed to load PiP iframe')
    trackEvent('pip_iframe_load_failed')
    wakeLock.pipWindowRef.value = null
  })

  iframe.addEventListener('load', async () => {
    // Wait 500ms before sending initial sync to ensure iframe is fully ready
    await delay(500)

    if (iframe.contentWindow) {
      wakeLock.initialSyncToPip()
      await wakeLock.forceReleaseParent()
    } else {
      console.error('Unable to access iframe.contentWindow to send wake-lock-initial-sync message')
      trackEvent('pip_iframe_contentWindow_unavailable')
    }
  })

  iframe.style.cssText = 'width:100%;height:100%;border:none;margin:0;padding:0'

  const baseUrl = window.location.origin
  iframe.src = `${baseUrl}/pip?pip=1`

  pipWin.document.documentElement.style.cssText = 'width:100%;height:100%;margin:0;padding:0'
  pipWin.document.body.style.cssText = 'width:100%;height:100%;margin:0;padding:0;overflow:hidden'
  pipWin.document.body.appendChild(iframe)
}

const openDocumentPiP = async () => {
  try {
    const pipWin = await documentPip.openPipWindow(350, 650)

    if (!pipWin) {
      console.warn('Failed to open Document PiP window')
      trackEvent('pip_window_open_returned_null')
      return false
    }

    const iframe = pipWin.document.createElement('iframe')
    setupPipIframe(pipWin, iframe)

    wakeLock.pipWindowRef.value = pipWin

    documentPip.setupMessageRelay(pipWin)

    pipWin.addEventListener('pagehide', () => {
      handleWindowClosed(wakeLock.isActive.value)
    })

    trackEvent('pip_window_opened_from_cta')
    return true
  } catch (error) {
    console.error('Failed to open Document PiP:', error)
    trackEvent('pip_window_open_exception')
    return false
  }
}

const isPipWindowOpen = () => {
  try {
    return wakeLock.pipWindowRef.value && !wakeLock.pipWindowRef.value.closed
  } catch (e) {
    console.warn('Could not access PiP window:', e)
    return false
  }
}

const openFloatingWindow = async () => {
  // If PiP is not supported, do nothing
  if (!documentPip.isPipSupported.value) {
    console.warn('Document Picture-in-Picture is not supported in this browser')
    return
  }

  // If PiP window is already open, just focus it
  if (wakeLock.hasActivePipWindow.value && isPipWindowOpen()) {
    try {
      wakeLock.pipWindowRef.value!.focus()
      trackEvent('pip_focus_from_cta_button')
      return
    } catch (e) {
      console.warn('Could not focus PiP window:', e)
    }
  }

  // Open Document PiP window
  await openDocumentPiP()
}
</script>
