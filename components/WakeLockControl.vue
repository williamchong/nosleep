<template>
  <div>
    <div
      class="absolute inset-x-0 top-0 h-[100vh] transition-all duration-700 pointer-events-none"
      :class="gradientBackgroundClasses"
      />

    <div
      class="relative flex items-center justify-center p-2 sm:p-4"
      :class="wakeLock.isPipMode ? 'min-h-[100vh]' : 'min-h-screen'"
    >
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
          class="text-gray-600 dark:text-gray-400"
          :class="wakeLock.isPipMode ? 'text-xs' : 'text-sm sm:text-base lg:text-lg'"
        >
          {{ $t('header.subtitle') }}
        </p>
      </div>

      <div v-if="!wakeLock.isSupported" class="mt-2 sm:mt-4 p-3 sm:p-4 lg:p-6 bg-red-50 dark:bg-red-950/30 rounded-lg sm:rounded-xl border border-red-200 dark:border-red-800">
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
        <StatusAnimation :is-active="wakeLock.isActive" :is-pip-mode="wakeLock.isPipMode" @toggle="handleWakeLockToggle" />

        <button
          class="w-full font-semibold transition-all duration-200 focus:outline-none"
          :class="[
            buttonClasses,
            wakeLock.isPipMode
              ? 'py-3 px-4 rounded-lg text-base focus:ring-2'
              : 'py-4 px-6 sm:py-6 sm:px-8 lg:py-8 rounded-xl sm:rounded-2xl text-lg sm:text-xl lg:text-2xl focus:ring-2 sm:focus:ring-4'
          ]"
          @click="handleWakeLockToggle"
        >
          {{ buttonText }}
        </button>

        <div
          class="text-gray-700 dark:text-gray-300"
          :class="wakeLock.isPipMode ? 'text-xs' : 'text-sm'"
        >
          {{ statusText }}
        </div>

        <div class="pt-2 sm:pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            v-if="!wakeLock.hasActivePipWindow"
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
              :disabled="wakeLock.hasActivePipWindow"
              @start="handleTimerStart"
              @cancel="handleTimerCancel" />
          </div>
        </div>
      </template>

      <slot name="extra-content" />
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  autoAcquire?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoAcquire: false
})

const wakeLock = useWakeLock()
const showTimerSection = ref(false)

const { trackEvent } = useAnalytics()

const {
  statusText,
  buttonClasses,
  buttonText,
  handleToggle: handleWakeLockToggle,
  handleTimerStart,
  handleTimerCancel
} = useWakeLockUI({
  isPipMode: wakeLock.isPipMode,
  hasActivePipWindow: computed(() => wakeLock.hasActivePipWindow)
})

const gradientBackgroundClasses = computed(() => {
  if (wakeLock.isActive) {
    return 'bg-gradient-to-b from-orange-100 via-amber-50/50 to-white dark:from-orange-950/40 dark:via-yellow-950/20 dark:to-gray-900'
  }
  return 'bg-gradient-to-b from-blue-100 via-blue-50 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-gray-900'
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
      trackEvent('auto_acquire_failed_native_api')
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
