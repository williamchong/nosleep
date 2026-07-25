<template>
  <div class="space-y-3">
    <!-- Active Timer Display -->
    <div v-if="timerActive" class="text-center space-y-2">
      <div class="font-mono text-xl sm:text-2xl font-bold text-primary">
        {{ formatTime(remainingTime) }}
      </div>
      <UButton
        color="error"
        size="xs"
        :label="$t('button.cancel')"
        @click="$emit('cancel')"
      />
    </div>

    <!-- Timer Setup -->
    <div v-else class="space-y-2">
      <!-- Preset chips -->
      <div class="flex flex-wrap justify-center gap-1.5">
        <UButton
          v-for="preset in presets"
          :key="preset.value"
          size="sm"
          class="rounded-full"
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
          <span class="text-xs font-bold text-highlighted">{{ customMinutes }} {{ $t('timer.minutes') }}</span>
        </div>
        <USlider v-model="customMinutes" :min="MIN_MINUTES" :max="MAX_MINUTES" :step="1" />
        <div class="flex justify-between text-xs text-dimmed">
          <span>{{ MIN_MINUTES }} min</span>
          <span>{{ MAX_MINUTES }} min</span>
        </div>
      </div>

      <!-- Start Button -->
      <UButton
        :disabled="selectedMinutes < MIN_MINUTES"
        block
        color="primary"
        :label="$t('timer.startWithDuration', { minutes: selectedMinutes })"
        @click="$emit('start', selectedMinutes, selectedPreset)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
type TimerPreset = '15' | '60' | '240' | 'custom'

defineProps<{
  timerActive: boolean
  remainingTime: number
}>()

defineEmits<{
  start: [minutes: number, preset: TimerPreset]
  cancel: []
}>()

const MIN_MINUTES = 1
const MAX_MINUTES = 480

const { t } = useI18n()

const selectedPreset = ref<TimerPreset>('60')
const customMinutes = ref(60)

const presets = computed<{ value: TimerPreset, label: string }[]>(() => [
  { value: '15', label: '15 ' + t('timer.minutes') },
  { value: '60', label: '1 ' + t('timer.hour') },
  { value: '240', label: '4 ' + t('timer.hours') },
  { value: 'custom', label: t('timer.custom') }
])

const selectedMinutes = computed(() =>
  selectedPreset.value === 'custom' ? customMinutes.value : Number(selectedPreset.value)
)
</script>
