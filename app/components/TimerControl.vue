<template>
  <div class="space-y-3">
    <!-- Active Timer Display -->
    <div v-if="timerActive" class="text-center space-y-2">
      <div class="font-mono text-xl sm:text-2xl font-bold text-primary">
        {{ formatTime(remainingTime) }}
      </div>
      <UButton
        v-if="!disabled"
        color="error"
        size="xs"
        :label="$t('button.cancel')"
        @click="handleCancel"
      />
    </div>

    <!-- Timer Setup -->
    <div v-else-if="!disabled" class="space-y-2">
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
          @click="handlePresetSelect(preset.value)"
        />
      </div>

      <!-- Custom Slider (shown when Custom is selected) -->
      <div v-if="selectedPreset === 'custom'" class="space-y-2 bg-elevated/50 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-muted">{{ $t('timer.customDuration') }}</label>
          <span class="text-xs font-bold text-highlighted">{{ customMinutes }} {{ $t('timer.minutes') }}</span>
        </div>
        <USlider v-model="customMinutes" :min="1" :max="480" :step="1" />
        <div class="flex justify-between text-xs text-dimmed">
          <span>1 min</span>
          <span>480 min</span>
        </div>
      </div>

      <!-- Start Button -->
      <UButton
        :disabled="!canStart"
        block
        color="primary"
        :label="startButtonText"
        @click="handleStart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  timerActive: {
    type: Boolean,
    required: true
  },
  remainingTime: {
    type: Number,
    required: true
  },
  formatTime: {
    type: Function,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['start', 'cancel'])

const { t } = useI18n()

const selectedPreset = ref('60')
const customMinutes = ref(60)

const presets = computed(() => [
  { value: '15', label: '15 ' + t('timer.minutes') },
  { value: '60', label: '1 ' + t('timer.hour') },
  { value: '240', label: '4 ' + t('timer.hours') },
  { value: 'custom', label: t('timer.custom') }
])

const canStart = computed(() => {
  if (selectedPreset.value === 'custom') return customMinutes.value >= 1
  return true
})

const startButtonText = computed(() => {
  const minutes = selectedPreset.value === 'custom' ? customMinutes.value : parseInt(selectedPreset.value)
  return t('timer.startWithDuration', { minutes })
})

const handlePresetSelect = (value: string) => {
  selectedPreset.value = value
}

const handleStart = () => {
  const minutes = selectedPreset.value === 'custom' ? customMinutes.value : parseInt(selectedPreset.value)
  emit('start', minutes, selectedPreset.value)
}

const handleCancel = () => {
  emit('cancel')
}
</script>
