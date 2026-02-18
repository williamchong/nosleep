<template>
  <div class="relative bg-white dark:bg-gray-900 overflow-auto">
    <WakeLockControl />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const route = useRoute()
const colorMode = useColorMode()

onMounted(() => {
  const initialMode = route.query.colorMode as string
  if (initialMode) {
    colorMode.preference = initialMode
  }
})

useEventListener('message', (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return
  if (event.data?.type === 'color-mode-sync' && event.data.mode) {
    colorMode.preference = event.data.mode
  }
})
</script>
