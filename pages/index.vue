<template>
  <div>
    <div class="min-h-[80vh] bg-gray-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full text-center space-y-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">{{ $t('header.title') }}</h1>
          <p class="text-gray-600">{{ $t('header.subtitle') }}</p>
        </div>

        <div class="space-y-4">
          <button
            :disabled="!wakeLock.isSupported.value"
            class="w-full py-8 px-8 rounded-2xl text-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4"
            :class="buttonClasses"
            @click="handleWakeLockToggle"
          >
            <div class="flex items-center justify-center space-x-3">
              <svg v-if="wakeLock.isSupported.value" class="w-8 h-8" :class="{ 'animate-pulse-glow': wakeLock.isActive.value }" fill="currentColor" viewBox="0 0 24 24">
                <!-- Awake/Eye Open Icon -->
                <path v-if="wakeLock.isActive.value" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                <!-- Sleeping/Moon Icon -->
                <path v-else d="M20.742 13.045a8.088 8.088 0 0 1-2.077.271c-2.135 0-4.14-.83-5.646-2.336a8.025 8.025 0 0 1-2.064-7.723A1 1 0 0 0 9.73 2.034a10.014 10.014 0 0 0-4.489 2.582c-3.898 3.898-3.898 10.243 0 14.143a9.937 9.937 0 0 0 7.072 2.93 9.93 9.93 0 0 0 7.07-2.929 10.007 10.007 0 0 0 2.583-4.491 1.001 1.001 0 0 0-1.224-1.224z"/>
              </svg>
              <!-- Not Supported Icon -->
              <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>{{ buttonText }}</span>
            </div>
          </button>

          <div v-if="!wakeLock.isSupported.value" class="text-amber-600 text-sm">
            {{ $t('status.notSupported') }}
          </div>

          <div v-else class="text-sm text-gray-500">
            {{ statusText }}
          </div>
        </div>

        <!-- Timer Section -->
        <div class="space-y-2 text-center">
          <!-- Timer Toggle -->
          <button
            class="text-sm text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center space-x-1"
            @click="handleTimerToggle"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
            </svg>
            <span>{{ wakeLock.timerActive.value ? $t('timer.label') : (showTimer ? $t('timer.labelExpanded') : $t('timer.label')) }}</span>
            <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showTimer }" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>

          <!-- Minimalist Timer UI -->
          <div v-if="showTimer || wakeLock.timerActive.value" class="bg-gray-50 rounded-lg p-3 space-y-2">
            <!-- Active Timer Display -->
            <div v-if="wakeLock.timerActive.value" class="flex items-center justify-center space-x-4">
              <div class="font-mono text-lg text-blue-600">
                {{ wakeLock.formatTime(wakeLock.remainingTime.value) }}
              </div>
              <button
                class="text-red-600 hover:text-red-800 text-sm"
                @click="handleTimerCancel"
              >
                {{ $t('button.cancel') }}
              </button>
            </div>

            <!-- Timer Setup -->
            <div v-else class="space-y-2">
              <div class="flex items-center justify-center space-x-2">
                <input
                  v-model.number="timerMinutes"
                  type="number"
                  min="1"
                  max="480"
                  placeholder="60"
                  class="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                <span class="text-sm text-gray-600">{{ $t('timer.minutes') }}</span>
                <button
                  :disabled="!timerMinutes || timerMinutes < 1"
                  class="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded transition-colors"
                  @click="handleTimerStart"
                >
                  {{ $t('button.start') }}
                </button>
              </div>
              <div class="flex justify-center space-x-1">
                <button
                  v-for="increment in [1, 5, 10, 30]"
                  :key="increment"
                  class="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded transition-colors"
                  @click="handleTimerIncrement(increment)"
                >
                  +{{ increment }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="text-xs text-gray-400 space-y-2">
          <p>{{ $t('description.tagline') }}</p>
          <p>{{ $t('description.subtitle') }}</p>
        </div>

        <!-- Usage Instructions - only show for supported browsers -->
        <div v-if="wakeLock.isSupported.value && !wakeLock.isPopup.value" class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
          <div class="font-semibold text-blue-900">{{ $t('instructions.title') }}</div>
          <div class="space-y-1">
            <div>• {{ $t('instructions.keepTabFrontmost') }}</div>
            <div>• {{ $t('instructions.avoidBackgrounding') }}</div>
            <div>• {{ $t('instructions.interactionRequired') }}</div>
          </div>
          <button
            class="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            @click="openPopup"
          >
            {{ wakeLock.hasActivePopup.value ? $t('button.focusToPopup') : $t('instructions.openPopup') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Description Section -->
    <div v-if="!wakeLock.isPopup.value" class="max-w-4xl mx-auto mt-8 px-4 space-y-12">
      <section class="text-center space-y-4">
        <h2 class="text-3xl font-bold text-gray-900">{{ $t('sections.whatDoesThisSiteDo.title') }}</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          {{ $t('sections.whatDoesThisSiteDo.description') }}
        </p>
      </section>

      <!-- FAQ Section -->
      <section class="space-y-8">
        <h2 class="text-3xl font-bold text-gray-900 text-center">{{ $t('sections.faq.title') }}</h2>

        <div class="grid gap-6">
          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('sections.faq.useCases.question') }}</h3>
            <ul class="text-gray-600 space-y-2">
              <li v-for="(answer, index) in $tm('sections.faq.useCases.answers')" :key="index">• {{ $rt(answer) }}</li>
            </ul>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('sections.faq.howItWorks.question') }}</h3>
            <p class="text-gray-600">{{ $t('sections.faq.howItWorks.answer') }}</p>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('sections.faq.safety.question') }}</h3>
            <p class="text-gray-600">
              {{ $t('sections.faq.safety.answer') }}
            </p>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('sections.faq.browserSupport.question') }}</h3>
            <div class="text-gray-600">
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

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('sections.faq.timerFeature.question') }}</h3>
            <p class="text-gray-600">
              {{ $t('sections.faq.timerFeature.answer') }}
            </p>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ $t('sections.faq.properUsage.question') }}</h3>
            <p class="text-gray-600">
              {{ $t('sections.faq.properUsage.answer') }}
            </p>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="text-center space-y-4 border-t pt-12">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('sections.about.title') }}</h2>
        <p class="text-gray-600 max-w-xl mx-auto">
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
const timerMinutes = ref(60)
const showTimer = ref(false)

// SEO and Open Graph meta tags
const { t } = useI18n()

useSeoMeta({
  title: t('site.title'),
  description: t('site.description'),
  keywords: t('site.keywords'),
  author: t('site.author'),
  ogTitle: t('meta.ogTitle'),
  ogDescription: t('meta.ogDescription'),
  ogType: 'website',
})

// JSON-LD structured data for SEO
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify([
      {
        '@type': 'WebApplication',
        name: t('site.name'),
        description: t('meta.applicationDescription'),
        url: 'https://nosleep.williamchong.cloud',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web Browser',
        author: {
          '@type': 'Person',
          name: t('site.author'),
          url: 'https://blog.williamchong.cloud'
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: t('structuredData.faq.useCases.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.useCases.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.howItWorks.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.howItWorks.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.safety.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.safety.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.browserSupport.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.browserSupport.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.timerFeature.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.timerFeature.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.properUsage.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.properUsage.answer')
            }
          }
        ]
      }
    ])
    }
  ]
})

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

  if (!wakeLock.isSupported.value) {
    return 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 focus:ring-amber-300'
  }

  return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-300'
})


const buttonText = computed(() => {
  if (wakeLock.hasActivePopup.value && !wakeLock.isPopup.value) {
    return t('button.focusToPopup')
  }
  
  if (wakeLock.isActive.value) {
    return wakeLock.usingVideoFallback.value ? t('button.deviceAwakeVideo') : t('button.deviceAwake')
  }
  return wakeLock.isSupported.value ? t('button.deviceSleeping') : t('button.keepAwakeFallback')
})

const statusText = computed(() => {
  if (wakeLock.isActive.value) {
    return t('status.deviceAwake')
  }
  return t('status.deviceSleeping')
})

// GA4 Event handlers
const handleWakeLockToggle = async () => {
  // If parent has active popup, focus to popup instead
  if (wakeLock.hasActivePopup.value && !wakeLock.isPopup.value) {
    if (wakeLock.popupRef.value && !wakeLock.popupRef.value.closed) {
      wakeLock.popupRef.value.focus()
      useTrackEvent('popup_focus', { method: 'main_button' })
    }
    return
  }
  
  await wakeLock.toggle()

  // Track the wake lock toggle event
  useTrackEvent('wake_lock_toggle', {
    action: wakeLock.isActive.value ? 'activate' : 'deactivate',
    method: wakeLock.usingVideoFallback.value ? 'video_fallback' : 'native_api',
    supported: wakeLock.isSupported.value
  })
}

const handleTimerToggle = () => {
  showTimer.value = !showTimer.value

  // Track timer UI toggle
  useTrackEvent('timer_ui_toggle', {
    action: showTimer.value ? 'expand' : 'collapse'
  })
}

const handleTimerStart = async () => {
  if (timerMinutes.value && timerMinutes.value > 0) {
    const success = await wakeLock.startTimer(timerMinutes.value)

    // Track timer start event
    if (success) {
      useTrackEvent('timer_start', {
        input_method: 'manual_input'
      })
    }
  }
}

const handleTimerCancel = () => {
  wakeLock.stopTimer()

  // Track timer cancel event
  useTrackEvent('timer_cancel')
}

const handleTimerIncrement = (increment) => {
  timerMinutes.value = (timerMinutes.value || 0) + increment

  // Track quick increment usage
  useTrackEvent('timer_quick_increment')
}

const handleExternalLinkClick = () => {
  // Track external link clicks
  useTrackEvent('external_link_click', {
    link_url: 'https://blog.williamchong.cloud',
    link_text: 'Visit My Blog'
  })
}

const openPopup = () => {
  // If popup already exists, focus to it instead
  if (wakeLock.hasActivePopup.value && wakeLock.popupRef.value && !wakeLock.popupRef.value.closed) {
    wakeLock.popupRef.value.focus()
    useTrackEvent('popup_focus', { method: 'popup_button' })
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
    }, 1000)
    
    // Track popup open event
    useTrackEvent('popup_opened', {
      method: 'button_click'
    })
  } else {
    // Popup blocked, show instructions
    alert('Popup blocked. Please allow popups for this site and try again.')
  }
}

onMounted(async () => {
  let autoAcquireSuccess = false

  if (wakeLock.isSupported.value) {
    autoAcquireSuccess = await wakeLock.acquire()
  }

  // Track app initialization
  useTrackEvent('app_initialized', {
    wake_lock_supported: wakeLock.isSupported.value,
    auto_acquire_success: autoAcquireSuccess
  })
})
</script>

<style scoped>
@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 5px currentColor);
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 15px currentColor);
    transform: scale(1.1);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
</style>
