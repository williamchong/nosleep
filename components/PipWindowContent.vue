<template>
  <div class="pip-container h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900">
    <div class="mb-6">
      <StatusAnimation
        :is-active="wakeLock.isActive"
        @toggle="handleToggle"
      />
    </div>

    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        {{ $t('header.title') }}
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ statusText }}
      </p>
    </div>

    <div v-if="wakeLock.timerActive" class="mb-6 text-center">
      <div class="text-lg font-mono text-gray-700 dark:text-gray-300">
        {{ wakeLock.formatTime(wakeLock.remainingTime) }}
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('timer.remaining') }}
      </p>
    </div>

    <button
      class="w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-4"
      :class="buttonClasses"
      @click="handleToggle"
    >
      {{ buttonText }}
    </button>

    <div v-if="!wakeLock.timerActive" class="mt-4 w-full">
      <button
        class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors inline-flex items-center space-x-1 mb-2"
        @click="showTimerSection = !showTimerSection"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
        </svg>
        <span>{{ showTimerSection ? $t('timer.labelExpanded') : $t('timer.label') }}</span>
        <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showTimerSection }" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>

      <div v-if="showTimerSection">
        <TimerControl
          :timer-active="wakeLock.timerActive"
          :remaining-time="wakeLock.remainingTime"
          :format-time="wakeLock.formatTime"
          @start="handleTimerStart"
          @cancel="handleTimerCancel"
        />
      </div>
    </div>

    <button
      v-else
      class="mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      @click="handleTimerCancel"
    >
      {{ $t('button.cancelTimer') }}
    </button>

    <p class="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
      {{ $t('pip.alwaysOnTop') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const wakeLock = useWakeLock()
const showTimerSection = ref(false)

const {
  statusText,
  buttonClasses,
  buttonText,
  handleToggle,
  handleTimerStart,
  handleTimerCancel
} = useWakeLockUI({ isPipMode: true })
</script>

<style scoped>
.pip-container {
  min-height: 100vh;
  user-select: none;
}
</style>
