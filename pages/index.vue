<template>
  <div class="relative bg-white dark:bg-gray-900">
    <ClientOnly>
      <noscript>
        <div class="bg-yellow-50 dark:bg-yellow-950/30 border-b border-yellow-200 dark:border-yellow-800 p-4 text-center">
          <p class="text-yellow-900 dark:text-yellow-100 font-semibold">
            ⚠️ JavaScript Required
          </p>
          <p class="text-yellow-800 dark:text-yellow-200 text-sm mt-1">
            This web application requires JavaScript to be enabled in your browser to function. Please enable JavaScript and reload the page.
          </p>
        </div>
      </noscript>
    </ClientOnly>

    <div class="fixed top-4 right-4 z-50">
      <DarkModeToggle />
    </div>

    <WakeLockControl auto-acquire>
      <template #extra-content>
        <FloatingWindowCTA
          :has-active-pip-window="wakeLock.hasActivePipWindow"
          :is-pip-mode="wakeLock.isPipMode"
          :is-supported="wakeLock.isSupported"
          :is-pip-supported="documentPip.isPipSupported.value"
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
                {{ Number(index) + 1 }}
              </span>
              <p class="text-gray-700 dark:text-gray-300 text-lg">{{ $rt(step) }}</p>
            </li>
          </ol>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center italic">
            {{ $t('sections.howToUse.note') }}
          </p>
        </div>
      </section>

      <section class="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">{{ $t('sections.problems.title') }}</h2>
        <p class="text-center text-gray-600 dark:text-gray-400">{{ $t('sections.problems.subtitle') }}</p>
        <div class="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div
            v-for="(_, index) in $tm('sections.problems.items')"
            :key="index"
            class="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start space-x-3">
              <span class="text-2xl">{{ $t(`sections.problems.items[${index}].emoji`) }}</span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">{{ $t(`sections.problems.items[${index}].title`) }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t(`sections.problems.items[${index}].description`) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">{{ $t('sections.alternatives.title') }}</h2>
        <p class="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{{ $t('sections.alternatives.subtitle') }}</p>
        <div class="max-w-3xl mx-auto">
          <ul class="space-y-3">
            <li v-for="(feature, index) in $tm('sections.alternatives.features')" :key="index" class="flex items-start space-x-3">
              <span class="text-green-600 dark:text-green-400 text-xl font-bold">✓</span>
              <span class="text-gray-700 dark:text-gray-300">{{ $rt(feature) }}</span>
            </li>
          </ul>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center italic border-t border-green-200 dark:border-green-800 pt-4">
            <span class="font-semibold">Compare to:</span>
            {{ $t('sections.alternatives.vsCaffeine') }},
            {{ $t('sections.alternatives.vsAmphetamine') }},
            {{ $t('sections.alternatives.vsInsomniaX') }},
            {{ $t('sections.alternatives.vsPowerPlant') }}
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            {{ $t('sections.alternatives.comparisonNote') }}
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
import { useEventListener } from '@vueuse/core'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const wakeLock = useWakeLock()
const documentPip = useDocumentPiP()
const colorMode = useColorMode()
const pipIframe = ref<HTMLIFrameElement | null>(null)

const { trackEvent } = useAnalytics()

const handleExternalLinkClick = () => {
  trackEvent('external_link_click_blog')
}

watch(() => colorMode.preference, (newMode) => {
  if (!wakeLock.hasActivePipWindow || !wakeLock.pipWindowRef) return
  try {
    const pipFrame = wakeLock.pipWindowRef.frames[0]
    if (pipFrame) {
      pipFrame.postMessage({ type: 'color-mode-sync', mode: newMode }, window.location.origin)
    }
  } catch (e) {
    console.warn('Could not sync color mode to PiP:', e)
  }
})

useEventListener(pipIframe, 'error', () => {
  console.error('Failed to load PiP iframe')
  trackEvent('pip_iframe_load_failed')
  wakeLock.pipWindowRef = null
})

useEventListener(pipIframe, 'load', async () => {
  await delay(500)

  if (pipIframe.value?.contentWindow) {
    wakeLock.transferStateToPip(pipIframe.value.contentWindow)
    await wakeLock.forceReleaseParent()
  } else {
    console.error('Unable to access iframe.contentWindow')
    trackEvent('pip_iframe_contentWindow_unavailable')
  }
})

useEventListener(() => wakeLock.pipWindowRef, 'pagehide', () => {
  pipIframe.value = null
  wakeLock.handlePipClosed({
    isActive: wakeLock.isActive,
    timerActive: wakeLock.timerActive,
    remainingTime: wakeLock.remainingTime
  })
})

const setupPipIframe = (pipWin: Window, iframe: HTMLIFrameElement) => {
  pipIframe.value = iframe

  iframe.style.cssText = 'width:100%;height:100%;border:none;margin:0;padding:0'

  const baseUrl = window.location.origin
  iframe.src = `${baseUrl}/pip?pip=1&colorMode=${colorMode.preference}`

  pipWin.document.documentElement.style.cssText = 'width:100%;height:100%;margin:0;padding:0'
  pipWin.document.body.style.cssText = 'width:100%;height:100%;margin:0;padding:0;overflow:hidden'
  pipWin.document.body.appendChild(iframe)
}

const openDocumentPiP = async () => {
  try {
    const pipWin = await documentPip.openPipWindow(240, 240)

    if (!pipWin) {
      console.warn('Failed to open Document PiP window')
      trackEvent('pip_window_open_returned_null')
      return false
    }

    const iframe = pipWin.document.createElement('iframe')
    setupPipIframe(pipWin, iframe)

    wakeLock.pipWindowRef = pipWin

    documentPip.setupMessageRelay(pipWin)

    trackEvent('pip_window_opened_from_cta')
    return true
  } catch (error) {
    pipIframe.value = null
    console.error('Failed to open Document PiP:', error)
    trackEvent('pip_window_open_exception')
    return false
  }
}

const isPipWindowOpen = () => {
  try {
    return wakeLock.pipWindowRef && !wakeLock.pipWindowRef.closed
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
  if (wakeLock.hasActivePipWindow && isPipWindowOpen()) {
    try {
      wakeLock.pipWindowRef!.focus()
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
