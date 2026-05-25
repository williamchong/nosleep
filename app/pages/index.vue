<template>
  <div class="relative bg-default">
    <div class="fixed top-4 right-4 z-50">
      <DarkModeToggle />
    </div>

    <WakeLockControl :wake-lock="wakeLock" auto-acquire>
      <template #extra-content>
        <ClientOnly>
          <FloatingWindowCTA
            :has-active-pip-window="wakeLock.hasActivePipWindow"
            :is-pip-mode="wakeLock.isPipMode"
            :is-supported="wakeLock.isSupported"
            :is-pip-supported="documentPip.isPipSupported.value"
            @open-window="openFloatingWindow"
          />
        </ClientOnly>
      </template>
    </WakeLockControl>

    <div class="max-w-4xl mx-auto mt-8 px-4 space-y-12">
      <section class="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-highlighted text-center">{{ $t('sections.howToUse.title') }}
        </h2>
        <div class="max-w-2xl mx-auto">
          <ol class="space-y-4">
            <li v-for="(step, index) in $tm('sections.howToUse.steps')" :key="index" class="flex items-start space-x-3">
              <span
                class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold"
              >
                {{ Number(index) + 1 }}
              </span>
              <p class="text-toned text-lg">{{ $rt(step) }}</p>
            </li>
          </ol>
          <p class="text-sm text-muted mt-4 text-center italic">
            {{ $t('sections.howToUse.note') }}
          </p>
        </div>
      </section>

      <section class="bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-highlighted text-center">{{ $t('sections.problems.title') }}</h2>
        <p class="text-center text-muted">{{ $t('sections.problems.subtitle') }}</p>
        <div class="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div
            v-for="(_, index) in $tm('sections.problems.items')"
            :key="index"
            class="bg-default rounded-lg p-5 shadow-sm border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start space-x-3">
              <span class="text-2xl">{{ $t(`sections.problems.items[${index}].emoji`) }}</span>
              <div>
                <h3 class="font-semibold text-highlighted mb-1">{{ $t(`sections.problems.items[${index}].title`) }}</h3>
                <p class="text-sm text-muted">{{ $t(`sections.problems.items[${index}].description`) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-highlighted text-center">{{ $t('sections.alternatives.title') }}</h2>
        <p class="text-center text-muted max-w-2xl mx-auto">{{ $t('sections.alternatives.subtitle') }}</p>
        <div class="max-w-3xl mx-auto">
          <ul class="space-y-3">
            <li v-for="(feature, index) in $tm('sections.alternatives.features')" :key="index" class="flex items-start space-x-3">
              <UIcon name="i-lucide-check" class="text-success text-xl shrink-0 mt-0.5" />
              <span class="text-toned">{{ $rt(feature) }}</span>
            </li>
          </ul>
          <p class="text-sm text-muted mt-6 text-center italic border-t border-green-200 dark:border-green-800 pt-4">
            <span class="font-semibold">{{ $t('sections.alternatives.compareTo') }}</span>
            {{ $t('sections.alternatives.vsCaffeine') }},
            {{ $t('sections.alternatives.vsAmphetamine') }},
            {{ $t('sections.alternatives.vsInsomniaX') }},
            {{ $t('sections.alternatives.vsPowerPlant') }}
          </p>
          <p class="text-xs text-dimmed mt-2 text-center">
            {{ $t('sections.alternatives.comparisonNote') }}
          </p>
        </div>
      </section>

      <section class="space-y-8">
        <h2 class="text-3xl font-bold text-highlighted text-center">{{ $t('sections.faq.title') }}</h2>

        <UAccordion :items="faqItems" type="multiple" :unmount-on-hide="false">
          <template #useCases-body>
            <ul class="space-y-2 text-muted">
              <li v-for="(answer, index) in $tm('sections.faq.useCases.answers')" :key="index">• {{ $rt(answer) }}</li>
            </ul>
          </template>

          <template #browserSupport-body>
            <div class="text-muted">
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
          </template>
        </UAccordion>
      </section>

      <section class="text-center space-y-4 border-t border-default pt-12 pb-16">
        <h2 class="text-2xl font-bold text-highlighted">{{ $t('sections.about.title') }}</h2>
        <p class="text-muted max-w-xl mx-auto">
          {{ $t('sections.about.description') }}
        </p>
        <UButton
          :to="blogUrl"
          target="_blank"
          rel="noopener noreferrer"
          external
          color="primary"
          size="lg"
          icon="i-lucide-badge-check"
          :label="$t('sections.about.visitBlog')"
          @click="handleExternalLinkClick"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const { t } = useI18n()
const wakeLock = useWakeLockState()
const documentPip = useDocumentPiP()
const colorMode = useColorMode()

const blogUrl = 'https://blog.williamchong.cloud/?utm_source=nosleep&utm_medium=referral&utm_campaign=about'

const faqItems = computed(() => [
  { label: t('sections.faq.useCases.question'), slot: 'useCases' as const },
  { label: t('sections.faq.howItWorks.question'), content: t('sections.faq.howItWorks.answer') },
  { label: t('sections.faq.safety.question'), content: t('sections.faq.safety.answer') },
  { label: t('sections.faq.browserSupport.question'), slot: 'browserSupport' as const },
  { label: t('sections.faq.timerFeature.question'), content: t('sections.faq.timerFeature.answer') },
  { label: t('sections.faq.properUsage.question'), content: t('sections.faq.properUsage.answer') },
])

useHead({
  title: computed(() => {
    const base = t('site.title')
    return wakeLock.isEffectivelyActive ? `☀️ ${base}` : `🌙 ${base}`
  })
})
const pipIframe = ref<HTMLIFrameElement | null>(null)

const { trackEvent } = useAnalytics()

const handleExternalLinkClick = () => {
  trackEvent('external_link_click', { destination: 'blog' })
}

watch(() => colorMode.value, (newMode) => {
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

useEventListener(window, 'appinstalled', () => {
  trackEvent('pwa_app_installed')
})

useEventListener(pipIframe, 'error', () => {
  console.error('Failed to load PiP iframe')
  trackEvent('client_error', { kind: 'pip_iframe_load_failed' })
  wakeLock.pipWindowRef = null
})

useEventListener(pipIframe, 'load', async () => {
  await delay(500)

  if (pipIframe.value?.contentWindow) {
    wakeLock.transferStateToPip(pipIframe.value.contentWindow)
    await wakeLock.forceReleaseParent()
  } else {
    console.error('Unable to access iframe.contentWindow')
    trackEvent('client_error', { kind: 'pip_iframe_content_window_unavailable' })
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
  // PiP mode is identified by the /pip path itself; only the initial theme is passed as a query.
  iframe.src = `${baseUrl}${PIP_PATH}?colorMode=${colorMode.value}`

  pipWin.document.documentElement.style.cssText = 'width:100%;height:100%;margin:0;padding:0'
  pipWin.document.body.style.cssText = 'width:100%;height:100%;margin:0;padding:0;overflow:hidden'
  pipWin.document.body.appendChild(iframe)
}

const openDocumentPiP = async () => {
  try {
    const preferMinimized = getPipSizePreference() === 'minimized'
    const { window: pipWin, status } = await documentPip.openPipWindow(
      PIP_RESTORED_WIDTH,
      preferMinimized ? PIP_MINIMIZED_HEIGHT : PIP_RESTORED_HEIGHT
    )

    trackEvent('pip_window_open', { result: status, source: 'cta' })

    if (!pipWin) return false

    const iframe = pipWin.document.createElement('iframe')
    setupPipIframe(pipWin, iframe)
    wakeLock.pipWindowRef = pipWin
    documentPip.setupMessageRelay(pipWin)
    return true
  } catch (error) {
    pipIframe.value = null
    console.error('Failed to open Document PiP:', error)
    trackEvent('pip_window_open', { result: 'exception', source: 'cta' })
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
  if (wakeLock.hasActivePipWindow) {
    try {
      wakeLock.pipWindowRef!.focus()
      trackEvent('pip_focus', { source: 'cta_button' })
      return
    } catch (e) {
      console.warn('Could not focus PiP window:', e)
    }
  }

  // Open Document PiP window
  await openDocumentPiP()
}
</script>
