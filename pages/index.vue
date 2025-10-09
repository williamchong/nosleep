<template>
  <div class="relative bg-white dark:bg-gray-900">
    <!-- Dark Mode Toggle - Fixed in top right -->
    <div class="fixed top-4 right-4 z-50">
      <DarkModeToggle />
    </div>

    <!-- Smooth gradient background that transitions to white/dark - only in hero section -->
    <div
      class="absolute inset-x-0 top-0 h-[100vh] transition-all duration-700 pointer-events-none"
      :class="gradientBackgroundClasses"
    />

    <div class="relative min-h-[80vh] flex items-center justify-center p-4">
      <div class="max-w-2xl w-full text-center space-y-8">
        <div>
          <h1 class="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">{{ $t('header.title') }}</h1>
          <p class="text-lg text-gray-600 dark:text-gray-400">{{ $t('header.subtitle') }}</p>
        </div>

        <!-- Status Animation (Sun/Moon) - Interactive -->
        <StatusAnimation
          :is-active="wakeLock.isActive.value"
          @toggle="handleWakeLockToggle"
        />

        <!-- Main Toggle Button -->
        <button
          class="w-full py-8 px-8 rounded-2xl text-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4"
          :class="buttonClasses"
          @click="handleWakeLockToggle"
        >
          {{ buttonText }}
        </button>

        <!-- Status Text -->
        <div class="text-sm text-gray-700 dark:text-gray-300">
          {{ actionStatement }}
        </div>

        <!-- Video Fallback Notice -->
        <div v-if="!wakeLock.isSupported.value && wakeLock.isActive.value" class="text-amber-600 dark:text-amber-400 text-sm">
          {{ $t('status.notSupported') }}
        </div>

        <!-- Timer Section - Subtle, Secondary Control -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors inline-flex items-center space-x-1 mb-3"
            @click="toggleTimerSection"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
            </svg>
            <span>{{ wakeLock.timerActive.value ? $t('timer.label') : (showTimerSection ? $t('timer.labelExpanded') : $t('timer.label')) }}</span>
            <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showTimerSection }" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>

          <!-- Timer Control Component - Collapsible -->
          <div v-if="showTimerSection || wakeLock.timerActive.value">
            <TimerControl
              :timer-active="wakeLock.timerActive.value"
              :remaining-time="wakeLock.remainingTime.value"
              :format-time="wakeLock.formatTime"
              @start="handleTimerStart"
              @cancel="handleTimerCancel"
            />
          </div>
        </div>

        <!-- Floating Window CTA -->
        <FloatingWindowCTA
          :has-active-popup="wakeLock.hasActivePopup.value"
          :is-popup="wakeLock.isPopup.value"
          :is-supported="wakeLock.isSupported.value"
          :is-mobile="$device.isMobile"
          @open-window="openPopup"
        />
      </div>
    </div>

    <!-- Description Section -->
    <div v-if="!wakeLock.isPopup.value" class="max-w-4xl mx-auto mt-8 px-4 space-y-12">
      <!-- How to Use Section -->
      <section class="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">{{ $t('sections.howToUse.title') }}</h2>
        <div class="max-w-2xl mx-auto">
          <ol class="space-y-4">
            <li v-for="(step, index) in $tm('sections.howToUse.steps')" :key="index" class="flex items-start space-x-3">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">{{ index + 1 }}</span>
              <p class="text-gray-700 dark:text-gray-300 text-lg">{{ $rt(step) }}</p>
            </li>
          </ol>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center italic">{{ $t('sections.howToUse.note') }}</p>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="space-y-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">{{ $t('sections.faq.title') }}</h2>

        <div class="grid gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ $t('sections.faq.useCases.question') }}</h3>
            <ul class="text-gray-600 dark:text-gray-400 space-y-2">
              <li v-for="(answer, index) in $tm('sections.faq.useCases.answers')" :key="index">• {{ $rt(answer) }}</li>
            </ul>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ $t('sections.faq.howItWorks.question') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">{{ $t('sections.faq.howItWorks.answer') }}</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ $t('sections.faq.safety.question') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('sections.faq.safety.answer') }}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ $t('sections.faq.browserSupport.question') }}</h3>
            <div class="text-gray-600 dark:text-gray-400">
              <p class="mb-2"><strong>{{ $t('sections.faq.browserSupport.nativeApiTitle') }}</strong></p>
              <ul class="space-y-1 mb-4">
                <li v-for="(browser, index) in $tm('sections.faq.browserSupport.nativeApiBrowsers')" :key="index">• {{ $rt(browser) }}</li>
              </ul>
              <p class="mb-2"><strong>{{ $t('sections.faq.browserSupport.fallbackTitle') }}</strong></p>
              <ul class="space-y-1">
                <li v-for="(browser, index) in $tm('sections.faq.browserSupport.fallbackBrowsers')" :key="index">• {{ $rt(browser) }}</li>
              </ul>
              <p class="text-sm mt-2 italic">{{ $t('sections.faq.browserSupport.note') }}</p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ $t('sections.faq.timerFeature.question') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('sections.faq.timerFeature.answer') }}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ $t('sections.faq.properUsage.question') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('sections.faq.properUsage.answer') }}
            </p>
          </div>
        </div>
      </section>

      <!-- About Section -->
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
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {{ $t('sections.about.visitBlog') }}
        </a>
      </section>
    </div>
  </div>
</template>

<script setup>
const wakeLock = useWakeLock()
const showTimerSection = ref(false)

// Device detection using @nuxtjs/device
const { $device } = useNuxtApp()

const { t } = useI18n()
const { trackEvent } = useAnalytics()

// Background gradient classes with smooth transition to white/dark
const gradientBackgroundClasses = computed(() => {
  if (wakeLock.isActive.value) {
    // Awake state: warm orange/amber gradient transitioning to white/dark
    return 'bg-gradient-to-b from-orange-100 via-amber-50/50 to-white dark:from-orange-950/40 dark:via-yellow-950/20 dark:to-gray-900'
  }
  // Sleep state: subtle cool gradient (softer blue) in light mode
  return 'bg-gradient-to-b from-blue-100 via-blue-50 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-gray-900'
})


// Action statement text
const actionStatement = computed(() => {
  if (wakeLock.isActive.value) {
    return t('status.deviceAwake')
  }
  return t('status.deviceSleeping')
})

// Button classes (reusing from old design)
const buttonClasses = computed(() => {
  // Focus to popup button - use blue to indicate action
  if (wakeLock.hasActivePopup.value && !wakeLock.isPopup.value) {
    return 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 focus:ring-blue-300'
  }

  if (wakeLock.isActive.value) {
    if (wakeLock.usingVideoFallback.value) {
      return 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 focus:ring-amber-300'
    }
    return 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 focus:ring-green-300'
  }

  // Inactive state - use red to show "ready to activate"
  return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-300'
})

const buttonText = computed(() => {
  if (wakeLock.hasActivePopup.value && !wakeLock.isPopup.value) {
    return t('button.focusToPopup')
  }

  if (wakeLock.isActive.value) {
    return t('button.deviceAwake')
  }
  // Both supported and unsupported browsers show same inactive text
  return t('button.clickToKeepAwake')
})

// GA4 Event handlers
const handleWakeLockToggle = async () => {
  // If parent has active popup, focus to popup instead
  if (wakeLock.hasActivePopup.value && !wakeLock.isPopup.value) {
    if (wakeLock.popupRef.value && !wakeLock.popupRef.value.closed) {
      wakeLock.popupRef.value.focus()
      trackEvent('popup_focus_from_main_button')
    }
    return
  }

  await wakeLock.toggle()

  // Track the wake lock toggle event
  const action = wakeLock.isActive.value ? 'activate' : 'deactivate'
  const method = wakeLock.usingVideoFallback.value ? 'video_fallback' : 'native_api'
  const iconType = wakeLock.isActive.value ? 'sun' : 'moon'
  trackEvent(`${iconType}_click_${action}_${method}`)
}

const handleTimerStart = async (minutes) => {
  const success = await wakeLock.startTimer(minutes)
  if (success) {
    trackEvent('timer_start_preset')
  }
}

const handleTimerCancel = () => {
  wakeLock.stopTimer()
  trackEvent('timer_cancel')
}

const toggleTimerSection = () => {
  showTimerSection.value = !showTimerSection.value
  const action = showTimerSection.value ? 'expand' : 'collapse'
  trackEvent(`timer_section_${action}`)
}

const handleExternalLinkClick = () => {
  trackEvent('external_link_click_blog')
}

const openPopup = () => {
  // If popup already exists, focus to it instead
  if (wakeLock.hasActivePopup.value && wakeLock.popupRef.value && !wakeLock.popupRef.value.closed) {
    wakeLock.popupRef.value.focus()
    trackEvent('popup_focus_from_cta_button')
    return
  }

  const currentUrl = window.location.href
  const popup = window.open(
    currentUrl,
    'nosleep-popup',
    'width=400,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
  )

  if (popup) {
    popup.focus()

    // Store popup reference for syncing
    wakeLock.popupRef.value = popup

    // Initial sync to popup (one-time only)
    setTimeout(() => {
      wakeLock.initialSyncToPopup()

      // Always release parent lock after syncing state to popup
      // Popup will take over all wake lock management
      setTimeout(async () => {
        await wakeLock.forceReleaseParent()
      }, 100)
    }, 1000)

    // Track popup open event
    trackEvent('floating_window_cta_clicked')
  } else {
    // Popup blocked, show instructions
    alert('Popup blocked. Please allow popups for this site and try again.')
    trackEvent('popup_blocked_by_browser')
  }
}

onMounted(async () => {
  let autoAcquireSuccess = false

  // Try to auto-start wake lock (native or fallback)
  try {
    autoAcquireSuccess = await wakeLock.acquire()
  } catch (error) {
    console.error('Auto-acquire error:', error)

    // Track auto-acquire failure
    const eventName = wakeLock.isSupported.value ? 'auto_acquire_failed_native_api' : 'auto_acquire_failed_video_fallback'
    trackEvent(eventName)

    // Auto-start failed, user will need to click manually
    console.log('Auto-start failed, user interaction required')
  }

  // Track app initialization
  const supportStatus = wakeLock.isSupported.value ? 'supported' : 'unsupported'
  const acquireStatus = autoAcquireSuccess ? 'success' : 'failed'
  trackEvent(`app_init_${supportStatus}_auto_${acquireStatus}`)
})
</script>
