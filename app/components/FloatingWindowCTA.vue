<template>
  <div
    v-if="shouldShow"
    class="bg-linear-to-br from-indigo-50 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl p-6 shadow-xl space-y-4"
  >
    <UButton
      block
      size="xl"
      color="primary"
      icon="i-lucide-picture-in-picture-2"
      :label="hasActivePipWindow ? $t('floatingWindow.focusButton') : $t('floatingWindow.openButton')"
      @click="$emit('open-window')"
    />

    <p class="text-xs text-center text-indigo-600 dark:text-indigo-400 italic">
      {{ $t('floatingWindow.alternative') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  hasActivePipWindow: boolean
  isPipMode: boolean
  isSupported: boolean
  isPipSupported: boolean
}>()

defineEmits<{ 'open-window': [] }>()

const shouldShow = computed(() => {
  // Only show when PiP is supported, wake lock is supported, and not in PiP mode
  // isPipSupported already excludes mobile browsers (no mobile browser supports Document PiP)
  return props.isPipSupported && props.isSupported && !props.isPipMode
})
</script>
