<template>
  <div class="space-y-3">
    <!-- Active Timer Display -->
    <div v-if="timerActive" class="text-center space-y-2">
      <div class="font-mono text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
        {{ formatTime(remainingTime) }}
      </div>
      <button
        v-if="!disabled"
        class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
        @click="handleCancel"
      >
        {{ $t('button.cancel') }}
      </button>
    </div>

    <!-- Timer Setup -->
    <div v-else-if="!disabled" class="space-y-2">
      <!-- Tab/Chip Interface - Smaller -->
      <div class="flex flex-wrap justify-center gap-1.5">
        <button
          v-for="preset in presets"
          :key="preset.value"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-300 dark:focus:ring-blue-600"
          :class="selectedPreset === preset.value ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          @click="handlePresetSelect(preset.value)"
        >
          {{ preset.label }}
        </button>
      </div>

      <!-- Custom Slider (shown when Custom is selected) -->
      <div v-if="selectedPreset === 'custom'" class="space-y-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('timer.customDuration') }}</label>
          <span class="text-xs font-bold text-gray-900 dark:text-gray-100">{{ customMinutes }} {{ $t('timer.minutes') }}</span>
        </div>
        <input
          v-model.number="customMinutes"
          type="range"
          min="1"
          max="480"
          step="1"
          class="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider slider-blue"
          @change="handleSliderChange"
        >
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>1 min</span>
          <span>480 min</span>
        </div>
      </div>

      <!-- Start Button - Smaller and less prominent -->
      <button
        :disabled="!canStart"
        class="w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white"
        @click="handleStart"
      >
        {{ startButtonText }}
      </button>
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
const { trackEvent } = useAnalytics()

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
  trackEvent('timer_tab_selected')
}

const handleSliderChange = () => {
  trackEvent('timer_custom_slider_used')
}

const handleStart = () => {
  const minutes = selectedPreset.value === 'custom' ? customMinutes.value : parseInt(selectedPreset.value)
  emit('start', minutes)
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
/* Custom slider styles */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  background: #3b82f6;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  background: #3b82f6;
}
</style>
