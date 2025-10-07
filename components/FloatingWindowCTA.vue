<template>
  <div
    v-if="shouldShow"
    class="bg-gradient-to-br from-indigo-50 to-blue-100 border-2 border-indigo-300 rounded-2xl p-6 shadow-xl space-y-4"
  >
    <div class="text-center space-y-2">
      <div class="flex items-center justify-center space-x-2">
        <svg class="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <h3 class="text-xl font-bold text-indigo-900">{{ $t('floatingWindow.title') }}</h3>
      </div>
      <p class="text-sm text-indigo-700">{{ $t('floatingWindow.subtitle') }}</p>
    </div>

    <button
      class="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center space-x-3"
      @click="handleOpenWindow"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
      </svg>
      <span>{{ hasActivePopup ? $t('floatingWindow.focusButton') : $t('floatingWindow.openButton') }}</span>
    </button>

    <p class="text-xs text-center text-indigo-600 italic">
      {{ $t('floatingWindow.alternative') }}
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  hasActivePopup: {
    type: Boolean,
    required: true
  },
  isPopup: {
    type: Boolean,
    required: true
  },
  isSupported: {
    type: Boolean,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-window'])

const shouldShow = computed(() => {
  // Only show for supported browsers, not on mobile, and not in popup
  return props.isSupported && !props.isMobile && !props.isPopup
})

const handleOpenWindow = () => {
  emit('open-window')
}
</script>
