<template>
  <ClientOnly>
    <UButton
      color="neutral"
      variant="soft"
      square
      size="lg"
      :aria-label="ariaLabel"
      @click="toggleDarkMode"
    >
      <UIcon :name="icon" class="size-5" :class="{ 'text-yellow-500': colorMode.preference === 'light' }" />
    </UButton>
  </ClientOnly>
</template>

<script setup>
const colorMode = useColorMode()
const { trackEvent } = useAnalytics()
const { t } = useI18n()

const icon = computed(() => {
  if (colorMode.preference === 'light') return 'i-lucide-sun'
  if (colorMode.preference === 'dark') return 'i-lucide-moon'
  return 'i-lucide-monitor'
})

const ariaLabel = computed(() => {
  const mode = colorMode.preference || 'system'
  return t('darkMode.toggle') + ` (${t(`darkMode.${mode}`)})`
})

const toggleDarkMode = () => {
  // Cycle through: light → dark → system → light
  let newMode
  if (colorMode.preference === 'light') {
    newMode = 'dark'
  } else if (colorMode.preference === 'dark') {
    newMode = 'system'
  } else {
    newMode = 'light'
  }

  colorMode.preference = newMode

  trackEvent('dark_mode_toggled', { mode: newMode })
}
</script>
