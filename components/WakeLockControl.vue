<template>
  <div>
    <!-- Shared background gradients -->
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-700 bg-gradient-to-b from-blue-100 via-blue-50 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-gray-900"
      :class="wakeLock.isEffectivelyActive ? 'opacity-0' : 'opacity-100'"
    />
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-700 bg-gradient-to-b from-orange-100 via-amber-50/50 to-white dark:from-orange-950/40 dark:via-yellow-950/20 dark:to-gray-900"
      :class="wakeLock.isEffectivelyActive ? 'opacity-100' : 'opacity-0'"
    />

    <template v-if="isCompactPip">
      <div class="relative flex items-center justify-center h-[100vh] px-3">
        <div class="flex items-center gap-2.5 w-full">
          <button
            class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1"
            :class="wakeLock.isEffectivelyActive
              ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-300 shadow-lg shadow-green-200 dark:shadow-green-900/50'
              : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-300 shadow-lg shadow-red-200 dark:shadow-red-900/50'"
            :aria-label="wakeLock.isEffectivelyActive ? $t('status.ariaLabelAwake') : $t('status.ariaLabelSleep')"
            @click="handleWakeLockToggle"
          >
            <span :class="compactEmojiClass" :style="compactEmojiStyle">{{ compactEmoji }}</span>
          </button>

          <div class="flex-1 min-w-0 text-center">
            <template v-if="wakeLock.timerActive">
              <span class="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                {{ wakeLock.formatTime(wakeLock.remainingTime) }}
              </span>
            </template>
            <template v-else>
              <span
                class="text-xs font-medium truncate block"
                :class="wakeLock.isEffectivelyActive ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'"
              >
                {{ wakeLock.isEffectivelyActive ? $t('pip.statusActive') : $t('pip.statusInactive') }}
              </span>
            </template>
          </div>

          <button
            v-if="wakeLock.timerActive"
            class="flex-shrink-0 w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
            :aria-label="$t('button.cancelTimer')"
            @click="handleTimerCancel"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            :aria-label="$t('pip.restore')"
            @click="togglePipSize"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <template v-else>

    <div
      class="relative flex items-center justify-center p-2 sm:p-4"
      :class="wakeLock.isPipMode ? 'min-h-[100vh]' : 'min-h-screen'"
    >
    <!-- Minimize button in standard PiP layout -->
    <button
      v-if="wakeLock.isPipMode"
      class="absolute top-2 right-2 z-10 w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
      :aria-label="$t('pip.minimize')"
      @click="togglePipSize"
    >
      <!-- Minimize (horizontal line) icon -->
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M5 12h14" />
      </svg>
    </button>

    <div
      class="w-full text-center"
      :class="wakeLock.isPipMode ? 'max-w-sm space-y-3' : 'max-w-2xl space-y-4 sm:space-y-6 lg:space-y-8'"
    >
      <div>
        <h1
          class="font-bold text-gray-900 dark:text-gray-100"
          :class="wakeLock.isPipMode ? 'text-xl mb-1' : 'text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2'"
        >
          {{ $t('header.title') }}
        </h1>
        <p
          v-if="!wakeLock.isPipMode"
          class="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg"
        >
          {{ $t('header.subtitle') }}
        </p>
      </div>

      <div v-if="wakeLock.isLoading" class="mt-2 sm:mt-4 p-8 sm:p-12 lg:p-16">
        <div class="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
          <div class="relative">
            <div class="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full" />
            <div class="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin" />
          </div>
          <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg">
            {{ $t('loading.message') }}
          </p>
        </div>
      </div>

      <div v-else-if="!wakeLock.isSupported" class="mt-2 sm:mt-4 p-3 sm:p-4 lg:p-6 bg-red-50 dark:bg-red-950/30 rounded-lg sm:rounded-xl border border-red-200 dark:border-red-800">
        <div class="flex items-start space-x-2 sm:space-x-3">
          <div class="text-2xl sm:text-3xl">😞</div>
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-red-900 dark:text-red-100 mb-1 sm:mb-2">
              {{ $t('unsupported.title') }}
            </h3>
            <p class="text-red-700 dark:text-red-300 text-xs sm:text-sm mb-1 sm:mb-2">
              {{ $t('unsupported.message') }}
            </p>
            <p class="text-red-600 dark:text-red-400 text-xs">
              {{ $t('unsupported.suggestion') }}
            </p>
          </div>
        </div>
      </div>

      <template v-else>
        <ClientOnly>
          <StatusAnimation :is-active="wakeLock.isEffectivelyActive" :is-pip-mode="wakeLock.isPipMode" @toggle="handleWakeLockToggle" />
        </ClientOnly>

        <template v-if="!wakeLock.isPipMode">
          <button
            class="w-full font-semibold transition-all duration-200 focus:outline-none py-4 px-6 sm:py-6 sm:px-8 lg:py-8 rounded-xl sm:rounded-2xl text-lg sm:text-xl lg:text-2xl focus:ring-2 sm:focus:ring-4"
            :class="buttonClasses"
            @click="handleWakeLockToggle"
          >
            {{ buttonText }}
          </button>

          <div class="text-gray-700 dark:text-gray-300 text-sm">
            {{ statusText }}
          </div>
        </template>

        <div v-if="!wakeLock.hasActivePipWindow" class="pt-2 sm:pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            v-if="!wakeLock.timerActive"
            class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors inline-flex items-center space-x-1 mb-2 sm:mb-3"
            @click="toggleTimerSection">
            <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"
              />
            </svg>
            <span>
              {{ wakeLock.timerActive ? $t('timer.label') : (showTimerSection ? $t('timer.labelExpanded') : $t('timer.label')) }}
            </span>
            <svg
              class="w-2 h-2 sm:w-3 sm:h-3 transition-transform"
              :class="{ 'rotate-180': showTimerSection }"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <div v-if="showTimerSection || wakeLock.timerActive">
            <TimerControl
              :timer-active="wakeLock.timerActive"
              :remaining-time="wakeLock.remainingTime"
              :format-time="wakeLock.formatTime"
              @start="handleTimerStart"
              @cancel="handleTimerCancel" />
          </div>
        </div>
      </template>

      <slot name="extra-content" />
    </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize, useTimeoutFn } from '@vueuse/core'

interface Props {
  wakeLock: ReturnType<typeof useWakeLockState>
  autoAcquire?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoAcquire: false
})

const wakeLock = props.wakeLock
const showTimerSection = ref(false)

const { trackEvent } = useAnalytics()

// Only attach resize listener in PiP mode to avoid overhead on main page
const windowHeight = wakeLock.isPipMode ? useWindowSize().height : ref(Infinity)
const isCompactPip = computed(() => wakeLock.isPipMode && windowHeight.value <= 100)

const emojiForState = (active: boolean) => active ? '☀️' : '🌙'

const compactOpacity = ref(1)
const compactEmoji = ref(emojiForState(wakeLock.isEffectivelyActive))
const isSwapping = ref(false)

const compactEmojiStyle = computed(() => ({
  display: 'inline-block',
  opacity: compactOpacity.value,
  transition: isSwapping.value ? 'opacity 0.5s ease-in-out' : undefined
}))

const compactEmojiClass = computed(() =>
  !isSwapping.value && wakeLock.isEffectivelyActive ? 'compact-spin-active' : ''
)

// Clears isSwapping after opacity transition finishes so spin can resume
const { start: finishSwap } = useTimeoutFn(() => {
  isSwapping.value = false
}, 500, { immediate: false })

const { start: startCompactSwap } = useTimeoutFn(() => {
  compactEmoji.value = emojiForState(wakeLock.isEffectivelyActive)
  compactOpacity.value = 1
  finishSwap()
}, 500, { immediate: false })

if (wakeLock.isPipMode) {
  watch(() => wakeLock.isEffectivelyActive, () => {
    isSwapping.value = true
    compactOpacity.value = 0
    startCompactSwap()
  })
}

const togglePipSize = () => {
  const pipWin = window.parent !== window ? window.parent : window
  if (isCompactPip.value) {
    pipWin.resizeTo(PIP_RESTORED_WIDTH, PIP_RESTORED_HEIGHT)
    setPipSizePreference('restored')
  } else {
    pipWin.resizeTo(PIP_MINIMIZED_WIDTH, PIP_MINIMIZED_HEIGHT)
    setPipSizePreference('minimized')
  }
  trackEvent(isCompactPip.value ? 'pip_restore' : 'pip_minimize')
}

const {
  statusText,
  buttonClasses,
  buttonText,
  handleToggle: handleWakeLockToggle,
  handleTimerStart,
  handleTimerCancel
} = useWakeLockUI(wakeLock, {
  isPipMode: wakeLock.isPipMode,
  hasActivePipWindow: computed(() => wakeLock.hasActivePipWindow)
})

const toggleTimerSection = () => {
  showTimerSection.value = !showTimerSection.value
  const action = showTimerSection.value ? 'expand' : 'collapse'
  trackEvent(`timer_section_${action}`)
}

onMounted(async () => {
  if (!props.autoAcquire) return

  let autoAcquireSuccess = false

  if (wakeLock.isSupported) {
    try {
      autoAcquireSuccess = await wakeLock.acquire()
    } catch (error) {
      console.error('Auto-acquire error:', error)
      trackEvent('wake_lock_auto_acquire_failed')
      console.log('Auto-start failed, user interaction required')
    }

    const acquireStatus = autoAcquireSuccess ? 'success' : 'failed'
    const eventPrefix = wakeLock.isPipMode ? 'pip_init_auto' : 'app_init_supported_auto'
    trackEvent(`${eventPrefix}_${acquireStatus}`)
  } else if (!wakeLock.isPipMode) {
    trackEvent('app_init_unsupported_browser')
  }
})
</script>

<style scoped>
@keyframes compact-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.compact-spin-active {
  animation: compact-spin 20s linear infinite;
}
</style>
