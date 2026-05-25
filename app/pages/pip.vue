<template>
  <div class="relative bg-default overflow-auto">
    <WakeLockControl :wake-lock="wakeLock" />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

// Declares this page as the PiP surface. useWakeLockState reads route.meta.pip to enable PiP
// mode — route meta is stable through static prerender/hydration (unlike a URL query).
definePageMeta({ pip: true })

const wakeLock = useWakeLockState()
const route = useRoute()
const colorMode = useColorMode()
const messageTarget = ref<Window>()

// The parent passes the initial theme via ?colorMode=. Watch it rather than reading once:
// on the static prod build the query is stripped during hydration and only reconciled with
// the real URL afterwards, so a one-shot onMounted read would miss it and the PiP window
// would open with the wrong theme. Live changes still arrive via the message listener below.
watch(() => route.query.colorMode, (mode) => {
  if (typeof mode === 'string' && mode) {
    colorMode.preference = mode
  }
}, { immediate: true })

onMounted(() => {
  messageTarget.value = window
})

useEventListener(messageTarget, 'message', (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return
  if (event.data?.type === 'color-mode-sync' && event.data.mode) {
    colorMode.preference = event.data.mode
  }
})
</script>
