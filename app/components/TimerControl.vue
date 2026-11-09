<template>
  <div class="space-y-3">
    <!-- Active Timer Display -->
    <div v-if="timerActive" class="text-center space-y-2">
      <div class="font-mono text-xl sm:text-2xl font-bold text-primary">
        {{ formatTime(remainingTime) }}
      </div>
      <div class="flex items-center justify-center gap-1">
        <UButton
          color="error"
          size="xs"
          :label="$t('button.cancel')"
          @click="$emit('cancel')"
        />
        <UTooltip :text="$t('timer.chime')">
          <UButton v-bind="chimeButton" size="xs" @click="toggleChime" />
        </UTooltip>
      </div>
    </div>

    <!-- Timer Setup -->
    <div v-else class="space-y-2">
      <!-- Preset chips -->
      <div class="flex flex-wrap justify-center gap-1.5">
        <UButton
          v-for="preset in presets"
          :key="preset.value"
          size="sm"
          class="rounded-full transition-colors duration-150"
          :color="selectedPreset === preset.value ? 'primary' : 'neutral'"
          :variant="selectedPreset === preset.value ? 'solid' : 'soft'"
          :label="preset.label"
          @click="() => { selectedPreset = preset.value }"
        />
      </div>

      <!-- Custom Slider (shown when Custom is selected) -->
      <div v-if="selectedPreset === 'custom'" class="space-y-2 bg-elevated/50 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-muted">{{ $t('timer.customDuration') }}</label>
          <span class="text-xs font-bold text-highlighted">{{ formatDuration(customMinutes) }}</span>
        </div>
        <USlider v-model="customMinutes" :min="MIN_MINUTES" :max="MAX_MINUTES" :step="1" />
        <div class="flex justify-between text-xs text-dimmed">
          <span>{{ formatDuration(MIN_MINUTES) }}</span>
          <span>{{ formatDuration(MAX_MINUTES) }}</span>
        </div>
      </div>

      <!-- End time (shown when Until is selected) -->
      <div v-if="selectedPreset === 'until'" class="flex items-center justify-between gap-2 bg-elevated/50 rounded-lg p-3">
        <label for="timer-until" class="text-xs font-medium text-muted">{{ $t('timer.untilTime') }}</label>
        <UInput id="timer-until" v-model="untilTime" type="time" size="sm" />
      </div>

      <!-- Start Button -->
      <div class="flex items-center gap-1">
        <UButton
          ref="startButton"
          class="scroll-mb-2"
          :disabled="selectedMinutes < MIN_MINUTES"
          block
          color="primary"
          :label="$t('timer.startWithDuration', { duration: formatDuration(selectedMinutes) })"
          @click="$emit('start', minutesFor(selectedPreset, new Date()), selectedPreset)"
        />
        <UTooltip :text="$t('timer.chime')">
          <UButton v-bind="chimeButton" @click="toggleChime" />
        </UTooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNow } from '@vueuse/core'

type TimerPreset = '60' | '240' | '480' | 'custom' | 'until'

defineProps<{
  timerActive: boolean
  remainingTime: number
}>()

defineEmits<{
  start: [minutes: number, preset: TimerPreset]
  cancel: []
}>()

const MIN_MINUTES = 1
const MAX_MINUTES = 720

const { t } = useI18n()
const { trackEvent } = useAnalytics()

// Read on mount, not during setup: storage is client-only and would mismatch the prerender
const chimeEnabled = ref(false)
onMounted(() => { chimeEnabled.value = getTimerChimePreference() })

const chimeButton = computed(() => ({
  'icon': chimeEnabled.value ? 'i-lucide-volume-2' : 'i-lucide-volume-x',
  'color': chimeEnabled.value ? 'primary' : 'neutral',
  'variant': 'ghost',
  'aria-label': t('timer.chime'),
  'aria-pressed': chimeEnabled.value
}) as const)

function toggleChime() {
  const enabled = !chimeEnabled.value
  chimeEnabled.value = enabled
  setTimerChimePreference(enabled)
  trackEvent('timer_chime_toggled', { enabled }, { posthog: false })
  if (!enabled) {
    stopChime()
    return
  }
  // The click unlocks audio in this window, and the preview shows how loud it will be
  void primeChime().then(playChime)
}

const selectedPreset = ref<TimerPreset>('60')
const customMinutes = ref(60)
const untilTime = ref('18:00')

const presets = computed<{ value: TimerPreset, label: string }[]>(() => [
  { value: '60', label: '1 ' + t('timer.hour') },
  { value: '240', label: '4 ' + t('timer.hours') },
  { value: '480', label: '8 ' + t('timer.hours') },
  { value: 'custom', label: t('timer.custom') },
  { value: 'until', label: t('timer.until') }
])

// Ticks the "until" label while the panel sits open. The click reads the clock itself, so the
// timer is exact even when the label is up to a minute behind.
const now = useNow({ interval: 60_000 })

function minutesFor(preset: TimerPreset, at: Date) {
  if (preset === 'custom') return customMinutes.value
  if (preset === 'until') return minutesUntil(untilTime.value, at)
  return Number(preset)
}

const selectedMinutes = computed(() => minutesFor(selectedPreset.value, now.value))

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return t('timer.durationMinutes', { minutes })
  if (minutes === 0) return t('timer.durationHours', { hours })
  return t('timer.durationHoursMinutes', { hours, minutes })
}

// The custom slider and end time push the start button below the fold in the small PiP window
const startButton = useTemplateRef<{ $el: HTMLElement }>('startButton')
watch(selectedPreset, async (preset) => {
  if (preset !== 'custom' && preset !== 'until') return
  await nextTick()
  startButton.value?.$el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})
</script>
