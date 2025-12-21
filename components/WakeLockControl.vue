<template>
  <div>
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

      <div v-if="!wakeLock.isSupported" class="mt-4 p-6 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
        <div class="flex items-start space-x-3">
          <div class="text-3xl">😞</div>
          <div>
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              {{ $t('unsupported.title') }}
            </h3>
            <p class="text-red-700 dark:text-red-300 text-sm mb-2">
              {{ $t('unsupported.message') }}
            </p>
            <p class="text-red-600 dark:text-red-400 text-xs">
              {{ $t('unsupported.suggestion') }}
            </p>
          </div>
        </div>
      </div>

      <template v-else>
        <StatusAnimation :is-active="wakeLock.isActive" @toggle="handleWakeLockToggle" />

        <button
          class="w-full py-8 px-8 rounded-2xl text-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4"
          :class="buttonClasses" @click="handleWakeLockToggle">
          {{ buttonText }}
        </button>

        <div class="text-sm text-gray-700 dark:text-gray-300">
          {{ statusText }}
        </div>

        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            v-if="!wakeLock.hasActivePipWindow"
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors inline-flex items-center space-x-1 mb-3"
            @click="toggleTimerSection">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"
              />
            </svg>
            <span>
              {{ wakeLock.timerActive ? $t('timer.label') : (showTimerSection ? $t('timer.labelExpanded') : $t('timer.label')) }}
            </span>
            <svg
              class="w-3 h-3 transition-transform"
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
