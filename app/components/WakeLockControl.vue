<template>
  <div>
    <!-- Shared background gradients -->
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-700 bg-linear-to-b from-blue-100 via-blue-50 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-gray-900"
      :class="wakeLock.isEffectivelyActive ? 'opacity-0' : 'opacity-100'"
    />
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-700 bg-linear-to-b from-orange-100 via-amber-50/50 to-white dark:from-orange-950/40 dark:via-yellow-950/20 dark:to-gray-900"
      :class="wakeLock.isEffectivelyActive ? 'opacity-100' : 'opacity-0'"
    />

    <template v-if="isCompactPip">
      <div class="relative flex items-center justify-center h-[100vh] px-3">
        <div class="flex items-center gap-2.5 w-full">
          <button
            class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base transition-[background,box-shadow] duration-500 focus:outline-hidden focus:ring-2 focus:ring-offset-1"
            :class="wakeLock.isEffectivelyActive
              ? 'compact-btn-sun focus:ring-amber-300'
              : 'compact-btn-moon focus:ring-indigo-300'"
            :aria-label="wakeLock.isEffectivelyActive ? $t('status.ariaLabelAwake') : $t('status.ariaLabelSleep')"
            @click="handleWakeLockToggle"
          >
            <span :class="compactEmojiClass" :style="compactEmojiStyle">{{ compactEmoji }}</span>
          </button>

          <div class="flex-1 min-w-0 text-center">
            <template v-if="wakeLock.timerActive">
              <span class="font-mono text-sm font-bold text-primary">
                {{ wakeLock.formatTime(wakeLock.remainingTime) }}
              </span>
            </template>
            <template v-else>
              <span
                class="text-xs font-medium truncate block"
                :class="wakeLock.isEffectivelyActive ? 'text-amber-700 dark:text-amber-300' : 'text-indigo-600 dark:text-indigo-300'"
              >
                {{ wakeLock.isEffectivelyActive ? $t('pip.statusActive') : $t('pip.statusInactive') }}
              </span>
            </template>
          </div>

          <UButton
            v-if="wakeLock.timerActive"
            color="error"
            size="xs"
            square
            icon="i-lucide-x"
            class="flex-shrink-0"
            :aria-label="$t('button.cancelTimer')"
            @click="handleTimerCancel"
          />

          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            square
            icon="i-lucide-maximize-2"
            class="flex-shrink-0"
            :aria-label="$t('pip.restore')"
            @click="togglePipSize"
          />
        </div>
      </div>
    </template>

    <template v-else>

    <div
      class="relative flex items-center justify-center p-2 sm:p-4"
      :class="wakeLock.isPipMode ? 'min-h-[100vh]' : 'min-h-screen'"
    >
    <!-- Minimize button in standard PiP layout -->
    <UButton
      v-if="wakeLock.isPipMode"
      color="neutral"
      variant="ghost"
      size="xs"
      square
      icon="i-lucide-minus"
      class="absolute top-2 right-2 z-10"
      :aria-label="$t('pip.minimize')"
      @click="togglePipSize"
    />

    <div
      class="w-full text-center"
      :class="wakeLock.isPipMode ? 'max-w-sm space-y-3' : 'max-w-2xl space-y-4 sm:space-y-6 lg:space-y-8'"
    >
      <div>
        <h1
          class="font-bold text-highlighted"
          :class="wakeLock.isPipMode ? 'text-xl mb-1' : 'text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2'"
        >
          {{ $t('header.title') }}
        </h1>
        <p
          v-if="!wakeLock.isPipMode"
          class="text-muted text-sm sm:text-base lg:text-lg"
        >
          {{ $t('header.subtitle') }}
        </p>
      </div>

      <div v-if="wakeLock.isLoading" class="mt-2 sm:mt-4 p-8 sm:p-12 lg:p-16">
        <div class="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
          <UIcon name="i-lucide-loader-circle" class="size-12 sm:size-16 animate-spin text-primary" />
          <p class="text-muted text-sm sm:text-base lg:text-lg">
            {{ $t('loading.message') }}
          </p>
        </div>
      </div>

      <UAlert
        v-else-if="!wakeLock.isSupported"
        color="error"
        variant="subtle"
        icon="i-lucide-frown"
        :title="$t('unsupported.title')"
        class="text-left"
      >
        <template #description>
          <p>{{ $t('unsupported.message') }}</p>
          <p class="mt-1 text-xs opacity-80">{{ $t('unsupported.suggestion') }}</p>
        </template>
      </UAlert>

      <template v-else>
        <ClientOnly>
          <StatusAnimation :is-active="wakeLock.isEffectivelyActive" :is-pip-mode="wakeLock.isPipMode" @toggle="handleWakeLockToggle" />
        </ClientOnly>

        <template v-if="!wakeLock.isPipMode">
          <UButton
            block
            size="xl"
            :color="buttonColor"
            :label="buttonText"
            :ui="heroButtonUi"
            @click="handleWakeLockToggle"
          />

          <div class="text-toned text-sm">
            {{ statusText }}
          </div>
        </template>

        <div v-if="!wakeLock.hasActivePipWindow" class="pt-2 sm:pt-3 lg:pt-4 border-t border-default">
          <UButton
            v-if="!wakeLock.timerActive"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-clock"
            :trailing-icon="showTimerSection ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            :label="showTimerSection ? $t('timer.labelExpanded') : $t('timer.label')"
            class="mb-2 sm:mb-3"
            @click="toggleTimerSection"
          />

          <TimerControl
            v-if="showTimerSection || wakeLock.timerActive"
            :timer-active="wakeLock.timerActive"
            :remaining-time="wakeLock.remainingTime"
            :format-time="wakeLock.formatTime"
            @start="handleTimerStart"
            @cancel="handleTimerCancel" />
        </div>
      </template>

      <slot name="extra-content" />
    </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize, useTimeoutFn, useMounted } from '@vueuse/core'

interface Props {
  wakeLock: ReturnType<typeof useWakeLockState>
  autoAcquire?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoAcquire: false
})

const wakeLock = props.wakeLock
const showTimerSection = ref(false)

// :ui.base merges over UButton's size variant via tailwind-merge, letting these oversized utilities win.
const heroButtonUi = {
  base: 'justify-center font-semibold transition-all duration-200 py-4 px-6 sm:py-6 sm:px-8 lg:py-8 rounded-xl sm:rounded-2xl text-lg sm:text-xl lg:text-2xl'
}

const { trackEvent } = useAnalytics()

// Only attach resize listener in PiP mode to avoid overhead on main page
const windowHeight = wakeLock.isPipMode ? useWindowSize().height : ref(Infinity)
// Defer compact layout to after mount so SSR always renders the standard PiP layout,
// avoiding hydration mismatch from window dimensions unavailable during SSR.
const isMounted = useMounted()
const isCompactPip = computed(() => isMounted.value && wakeLock.isPipMode && windowHeight.value <= 100)

const emojiForState = (active: boolean) => active ? '☀️' : '🌙'

const compactOpacity = ref(1)
const compactEmoji = ref(emojiForState(wakeLock.isEffectivelyActive))
const isSwapping = ref(false)

const compactEmojiStyle = computed(() => ({
  display: 'inline-block',
  opacity: compactOpacity.value,
  transition: isSwapping.value ? 'opacity 0.5s ease-in-out' : undefined
}))

const compactEmojiClass = computed(() => {
  if (isSwapping.value) return ''
  return wakeLock.isEffectivelyActive ? 'compact-spin-active' : 'compact-wobble'
})

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
  const restoring = isCompactPip.value
  const [width, height] = restoring
    ? [PIP_RESTORED_WIDTH, PIP_RESTORED_HEIGHT]
    : [PIP_MINIMIZED_WIDTH, PIP_MINIMIZED_HEIGHT]
  pipWin.resizeTo(width, height)
  const newSize = restoring ? 'restored' : 'minimized'
  setPipSizePreference(newSize)
  trackEvent('pip_size_changed', { size: newSize })
}

const {
  statusText,
  buttonColor,
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
  trackEvent('timer_section_toggled', {
    action: showTimerSection.value ? 'expand' : 'collapse',
  })
}

onMounted(async () => {
  if (!props.autoAcquire) return

  if (!wakeLock.isSupported) {
    trackEvent('app_init', { surface: wakeLock.surface, supported: false })
    return
  }

  let autoAcquireSuccess = false
  try {
    autoAcquireSuccess = await wakeLock.acquire()
  } catch (error) {
    console.error('Auto-acquire error:', error)
  }

  trackEvent('app_init', {
    surface: wakeLock.surface,
    supported: true,
    auto_acquire_result: autoAcquireSuccess ? 'success' : 'failed',
  })
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

@keyframes compact-wobble {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-4deg); }
  75% { transform: rotate(4deg); }
}

.compact-wobble {
  animation: compact-wobble 3s ease-in-out infinite;
}

.compact-btn-sun {
  background: radial-gradient(circle at 40% 40%, rgba(253, 230, 138, 0.7), rgba(251, 191, 36, 0.5));
  box-shadow: 0 0 8px 2px rgba(251, 191, 36, 0.25);
}

.compact-btn-sun:hover {
  background: radial-gradient(circle at 40% 40%, rgba(253, 230, 138, 0.8), rgba(251, 191, 36, 0.6));
  box-shadow: 0 0 10px 3px rgba(251, 191, 36, 0.35);
}

:is(.dark) .compact-btn-sun {
  background: radial-gradient(circle at 40% 40%, rgba(253, 230, 138, 0.35), rgba(251, 191, 36, 0.25));
  box-shadow: 0 0 10px 3px rgba(251, 191, 36, 0.3);
}

.compact-btn-moon {
  background: radial-gradient(circle at 60% 40%, rgba(165, 180, 252, 0.65), rgba(99, 102, 241, 0.45));
  box-shadow: 0 0 8px 2px rgba(99, 102, 241, 0.25);
}

.compact-btn-moon:hover {
  background: radial-gradient(circle at 60% 40%, rgba(165, 180, 252, 0.75), rgba(99, 102, 241, 0.55));
  box-shadow: 0 0 10px 3px rgba(99, 102, 241, 0.35);
}

:is(.dark) .compact-btn-moon {
  background: radial-gradient(circle at 60% 40%, rgba(129, 140, 248, 0.35), rgba(79, 70, 229, 0.25));
  box-shadow: 0 0 10px 3px rgba(129, 140, 248, 0.25);
}
</style>
