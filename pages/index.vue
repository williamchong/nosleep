<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center space-y-8">
      <div>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">NoSleep</h1>
        <p class="text-gray-600">Keep your device awake</p>
      </div>

      <div class="space-y-4">
        <button
          @click="wakeLock.toggle()"
          :disabled="!wakeLock.isSupported.value"
          class="w-full py-8 px-8 rounded-2xl text-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4"
          :class="buttonClasses"
        >
          <div class="flex items-center justify-center space-x-3">
            <svg v-if="wakeLock.isSupported.value" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <!-- Awake/Eye Open Icon -->
              <path v-if="wakeLock.isActive.value" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              <!-- Sleeping/Moon Icon -->
              <path v-else d="M20.742 13.045a8.088 8.088 0 0 1-2.077.271c-2.135 0-4.14-.83-5.646-2.336a8.025 8.025 0 0 1-2.064-7.723A1 1 0 0 0 9.73 2.034a10.014 10.014 0 0 0-4.489 2.582c-3.898 3.898-3.898 10.243 0 14.143a9.937 9.937 0 0 0 7.072 2.93 9.93 9.93 0 0 0 7.07-2.929 10.007 10.007 0 0 0 2.583-4.491 1.001 1.001 0 0 0-1.224-1.224z"/>
            </svg>
            <!-- Not Supported Icon -->
            <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>{{ buttonText }}</span>
          </div>
        </button>

        <div v-if="!wakeLock.isSupported.value" class="text-red-600 text-sm">
          Wake Lock API is not supported in this browser
        </div>

        <div v-else class="text-sm text-gray-500">
          {{ statusText }}
        </div>
      </div>

      <div class="text-xs text-gray-400 space-y-2">
        <p>This will prevent your device from going to sleep</p>
        <p>Perfect for long downloads, renders, or presentations</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const wakeLock = useWakeLock()

const buttonClasses = computed(() => {
  if (!wakeLock.isSupported.value) {
    return 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }
  
  if (wakeLock.isActive.value) {
    return 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 focus:ring-green-300'
  }
  
  return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-300'
})

const statusIndicatorClass = computed(() => {
  if (!wakeLock.isSupported.value) {
    return 'bg-gray-400'
  }
  return wakeLock.isActive.value ? 'bg-white' : 'bg-white'
})

const buttonText = computed(() => {
  if (!wakeLock.isSupported.value) {
    return 'Not Supported'
  }
  return wakeLock.isActive.value ? 'Device Awake' : 'Device Sleeping'
})

const statusText = computed(() => {
  if (wakeLock.isActive.value) {
    return 'Your device will stay awake. Click to allow sleep.'
  }
  return 'Your device can sleep normally. Click to keep awake.'
})

onMounted(async () => {
  if (wakeLock.isSupported.value) {
    await wakeLock.acquire()
  }
})
</script>
