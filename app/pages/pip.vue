<template>
  <div class="relative bg-default overflow-auto">
    <WakeLockControl :wake-lock="wakeLock" />
  </div>
</template>

<script setup lang="ts">
// Declares this page as the PiP surface. useWakeLockState reads route.meta.pip to enable PiP
// mode — route meta is stable through static prerender/hydration (unlike a URL query).
definePageMeta({ pip: true })

const wakeLock = useWakeLockState()
const route = useRoute()
const colorMode = useColorMode()

// The parent passes the initial theme via ?colorMode= so the first paint is already correct —
// waiting for the port would flash the wrong theme. Watch it rather than reading once: on the
// static prod build the query is stripped during hydration and only reconciled with the real
// URL afterwards, so a one-shot onMounted read would miss it.
watch(() => route.query.colorMode, (mode) => {
  if (typeof mode === 'string' && mode) {
    colorMode.preference = mode
  }
}, { immediate: true })

// Live changes arrive on the port useWakeLockState negotiated, which parks them here.
watch(() => wakeLock.pipColorMode, (mode) => {
  if (mode) colorMode.preference = mode
})
</script>
