<template>
  <div
    class="relative mx-auto cursor-pointer transition-all duration-500"
    :class="[containerClasses, sizeClasses]"
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
      :style="rotationStyle"
    />
    <!-- Static fallback for reduced motion -->
    <div v-else class="w-full h-full flex items-center justify-center">
      <div
        :class="[
          { 'animate-pulse': isActive },
          isPipMode ? 'text-5xl' : 'text-6xl sm:text-7xl lg:text-9xl'
        ]"
      >
        {{ isActive ? '☀️' : '🌙' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light'

const props = defineProps({
  isActive: {
    type: Boolean,
    required: true
  },
  isPipMode: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])

const lottieContainer = ref<HTMLElement | null>(null)
const animationInstance = ref<AnimationItem | null>(null)
const prefersReducedMotion = ref(false)
const rotationDegree = ref(0)
const opacity = ref(1)

const { t } = useI18n()

const containerClasses = computed(() => {
  const base = 'hover:scale-105'
  // Make sun shine much brighter in dark mode with stronger glow and brightness boost
  if (props.isActive) {
    return `${base} filter drop-shadow-2xl dark:drop-shadow-[0_0_50px_rgba(251,191,36,0.9)]`
  }
  return base
})

const rotationStyle = computed(() => ({
  transform: `rotate(${rotationDegree.value}deg)`,
  opacity: opacity.value,
  transition: 'transform 1s ease-in-out, opacity 0.5s ease-in-out'
}))

const ariaLabel = computed(() => {
  if (props.isActive) {
    return t('status.ariaLabelAwake')
  }
  return t('status.ariaLabelSleep')
})

const sizeClasses = computed(() => {
  if (props.isPipMode) {
    return 'w-32 h-32'
  }
  return 'w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64'
})

const currentAnimationPath = computed(() => {
  return props.isActive ? '/animations/sun.json' : '/animations/moon.json'
})

// Preload the active animation, prefetch the other
const otherAnimationPath = computed(() => {
  return props.isActive ? '/animations/moon.json' : '/animations/sun.json'
})

useHead({
  link: [
    { rel: 'preload', href: currentAnimationPath, as: 'fetch', crossorigin: 'anonymous' },
    { rel: 'prefetch', href: otherAnimationPath, as: 'fetch', crossorigin: 'anonymous' }
  ]
})

const loadAnimation = (path: string) => {
  if (!lottieContainer.value || prefersReducedMotion.value) return

  // Destroy previous animation if it exists
  if (animationInstance.value) {
    animationInstance.value.destroy()
  }

  // Load new animation (will use preloaded cache from browser)
  animationInstance.value = lottie.loadAnimation({
    container: lottieContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path
  })
}

// Watch for state changes and reload animation with rotation and fade
watch(() => props.isActive, () => {
  // Start fade out
  opacity.value = 0

  // Rotate 360 degrees on every toggle
  rotationDegree.value += 360

  // Swap animation at 180 degrees (halfway through rotation) and fade in
  setTimeout(() => {
    loadAnimation(currentAnimationPath.value)
    opacity.value = 1
  }, 500) // Half of the 1000ms rotation duration
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

  // Initial animation load (will use browser's preloaded cache)
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
