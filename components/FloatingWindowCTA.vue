<template>
  <div
    v-if="shouldShow"
    class="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl p-6 shadow-xl space-y-4"
  >
    <button
      class="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-600 flex items-center justify-center space-x-3"
      @click="handleOpenWindow"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
      </svg>
      <span>{{ hasActivePipWindow ? $t('floatingWindow.focusButton') : $t('floatingWindow.openButton') }}</span>
    </button>

    <p class="text-xs text-center text-indigo-600 dark:text-indigo-400 italic">
      {{ $t('floatingWindow.alternative') }}
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  hasActivePipWindow: {
    type: Boolean,
    required: true
  },
  isPipMode: {
    type: Boolean,
    required: true
  },
  isSupported: {
    type: Boolean,
    required: true
  },
  isPipSupported: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['open-window'])

const shouldShow = computed(() => {
  // Only show when PiP is supported, wake lock is supported, and not in PiP mode
  // isPipSupported already excludes mobile browsers (no mobile browser supports Document PiP)
  return props.isPipSupported && props.isSupported && !props.isPipMode
})

const handleOpenWindow = () => {
  emit('open-window')
}
</script>
