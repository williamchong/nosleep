<template>
  <Transition name="ring-fade">
    <svg
      v-if="active"
      class="absolute pointer-events-none -rotate-90"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        class="stroke-(--ui-border)"
        :stroke-width="strokeWidth"
      />
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        class="stroke-primary"
        :class="{ 'motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-linear': glides }"
        stroke-linecap="round"
        :stroke-width="strokeWidth"
        pathLength="1"
        stroke-dasharray="1"
        :stroke-dashoffset="1 - progress"
      />
    </svg>
  </Transition>
</template>

<script setup lang="ts">
import { clamp } from '@vueuse/core'

/** Countdown ring. The parent supplies `relative` plus the inset that sets how far the ring sits outside its content. */
const props = withDefaults(defineProps<{
  active: boolean
  remainingTime: number
  totalSeconds: number
  strokeWidth?: number
}>(), {
  strokeWidth: 3
})

// Keep the stroke inside the viewBox: the stroke is centred on the path.
const radius = computed(() => 50 - props.strokeWidth / 2)

const progress = computed(() => {
  if (props.totalSeconds <= 0) return 0
  return clamp(props.remainingTime / props.totalSeconds, 0, 1)
})

// Gliding between ticks means Chrome repaints the SVG every frame for as long as the timer
// runs; only worth it when a tick moves the arc far enough to see (a 5 min timer: ~1/300 per s).
const glides = computed(() => props.totalSeconds <= 300)
</script>

<style scoped>
.ring-fade-enter-active,
.ring-fade-leave-active {
  transition: opacity 0.3s ease;
}

.ring-fade-enter-from,
.ring-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ring-fade-enter-active,
  .ring-fade-leave-active {
    transition: none;
  }
}
</style>
