<template>
  <div
    class="relative w-64 h-64 mx-auto cursor-pointer transition-all duration-500"
    :class="containerClasses"
    tabindex="0"
    role="button"
    :aria-label="ariaLabel"
    @click="$emit('toggle')"
    @keydown.enter="$emit('toggle')"
    @keydown.space.prevent="$emit('toggle')"
  >
    <div
      v-if="!prefersReducedMotion"
      ref="lottieContainer"
      class="w-full h-full"
    />
    <!-- Static fallback for reduced motion -->
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-9xl" :class="{ 'animate-pulse': isActive }">
        {{ isActive ? '☀️' : '🌙' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import lottie from 'lottie-web'

const props = defineProps({
  isActive: {
    type: Boolean,
    required: true
  }
})

defineEmits(['toggle'])

const lottieContainer = ref(null)
const animationInstance = ref(null)
const prefersReducedMotion = ref(false)

const { t } = useI18n()

const containerClasses = computed(() => {
  const base = 'hover:scale-105'
  return props.isActive ? `${base} filter drop-shadow-2xl` : base
})

const ariaLabel = computed(() => {
  if (props.isActive) {
    return t('status.ariaLabelAwake')
  }
  return t('status.ariaLabelSleep')
})

const currentAnimationPath = computed(() => {
  return props.isActive ? '/animations/sun.json' : '/animations/moon.json'
})

const loadAnimation = (path) => {
  if (!lottieContainer.value || prefersReducedMotion.value) return

  // Destroy previous animation if it exists
  if (animationInstance.value) {
    animationInstance.value.destroy()
  }

  // Load new animation
  animationInstance.value = lottie.loadAnimation({
    container: lottieContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path
  })
}

// Watch for state changes and reload animation
watch(() => props.isActive, () => {
  loadAnimation(currentAnimationPath.value)
})

onMounted(() => {
  // Check for reduced motion preference
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      prefersReducedMotion.value = e.matches
      if (!e.matches) {
        // Re-enable animation
        nextTick(() => {
          loadAnimation(currentAnimationPath.value)
        })
      } else {
        // Disable animation
        if (animationInstance.value) {
          animationInstance.value.destroy()
          animationInstance.value = null
        }
      }
    })
  }

  // Initial animation load
  if (!prefersReducedMotion.value) {
    loadAnimation(currentAnimationPath.value)
  }
})

onUnmounted(() => {
  if (animationInstance.value) {
    animationInstance.value.destroy()
  }
})
</script>

<style scoped>
/* Focus styles for accessibility */
div[role="button"]:focus {
  outline: 3px solid rgba(59, 130, 246, 0.5);
  outline-offset: 4px;
  border-radius: 50%;
}
</style>
