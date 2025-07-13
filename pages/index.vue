<template>
  <div>
    <div class="min-h-[80vh] bg-gray-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full text-center space-y-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">NoSleep</h1>
          <p class="text-gray-600">Keep your device awake</p>
        </div>

        <div class="space-y-4">
          <button
            :disabled="!wakeLock.isSupported.value"
            class="w-full py-8 px-8 rounded-2xl text-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4"
            :class="buttonClasses"
            @click="wakeLock.toggle()"
          >
            <div class="flex items-center justify-center space-x-3">
              <svg v-if="wakeLock.isSupported.value" class="w-8 h-8" :class="{ 'animate-pulse-glow': wakeLock.isActive.value }" fill="currentColor" viewBox="0 0 24 24">
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

          <div v-if="!wakeLock.isSupported.value" class="text-amber-600 text-sm">
            Using video fallback method (Wake Lock API not supported)
          </div>

          <div v-else class="text-sm text-gray-500">
            {{ statusText }}
          </div>
        </div>

        <!-- Timer Section -->
        <div class="space-y-2 text-center">
          <!-- Timer Toggle -->
          <button
            class="text-sm text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center space-x-1"
            @click="showTimer = !showTimer"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
            </svg>
            <span>{{ wakeLock.timerActive.value ? 'Timer' : (showTimer ? 'Timer expires → allow sleep' : 'Timer') }}</span>
            <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showTimer }" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>

          <!-- Minimalist Timer UI -->
          <div v-if="showTimer || wakeLock.timerActive.value" class="bg-gray-50 rounded-lg p-3 space-y-2">
            <!-- Active Timer Display -->
            <div v-if="wakeLock.timerActive.value" class="flex items-center justify-center space-x-4">
              <div class="font-mono text-lg text-blue-600">
                {{ wakeLock.formatTime(wakeLock.remainingTime.value) }}
              </div>
              <button
                class="text-red-600 hover:text-red-800 text-sm"
                @click="wakeLock.stopTimer()"
              >
                Cancel
              </button>
            </div>

            <!-- Timer Setup -->
            <div v-else class="space-y-2">
              <div class="flex items-center justify-center space-x-2">
                <input
                  v-model.number="timerMinutes"
                  type="number"
                  min="1"
                  max="480"
                  placeholder="60"
                  class="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                <span class="text-sm text-gray-600">min</span>
                <button
                  :disabled="!timerMinutes || timerMinutes < 1"
                  class="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded transition-colors"
                  @click="startTimerWithInput"
                >
                  Start
                </button>
              </div>
              <div class="flex justify-center space-x-1">
                <button
                  v-for="increment in [1, 5, 10, 30]"
                  :key="increment"
                  class="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded transition-colors"
                  @click="timerMinutes = (timerMinutes || 0) + increment"
                >
                  +{{ increment }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="text-xs text-gray-400 space-y-2">
          <p>This will prevent your device from going to sleep</p>
          <p>Perfect for long downloads, renders, or presentations</p>
        </div>
      </div>
    </div>

    <!-- Description Section -->
    <div class="max-w-4xl mx-auto mt-8 px-4 space-y-12">
      <section class="text-center space-y-4">
        <h2 class="text-3xl font-bold text-gray-900">What Does This Site Do?</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          NoSleep is a web-based tool that prevents your computer or mobile device from going to sleep.
          Features include customizable auto-sleep timers, animated visual feedback, and universal browser
          compatibility with automatic fallback methods. Keep your device active during long processes
          without changing system settings or installing software.
        </p>
      </section>

      <!-- FAQ Section -->
      <section class="space-y-8">
        <h2 class="text-3xl font-bold text-gray-900 text-center">Frequently Asked Questions</h2>

        <div class="grid gap-6">
          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">What are the use cases?</h3>
            <ul class="text-gray-600 space-y-2">
              <li>• <strong>Timed tasks:</strong> Set 30-60 min timers for downloads/uploads</li>
              <li>• <strong>Long processes:</strong> 2-4 hour timers for video rendering</li>
              <li>• <strong>Development:</strong> 15-30 min timers for code compilation</li>
              <li>• <strong>Presentations:</strong> Keep screen active without interruption</li>
              <li>• <strong>Study sessions:</strong> Focus timers without device sleep</li>
              <li>• <strong>Streaming:</strong> Live sessions and recording</li>
              <li>• <strong>Monitoring:</strong> Dashboards and real-time tools</li>
            </ul>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">How does it work?</h3>
            <p class="text-gray-600">
              This website uses the modern <strong>Screen Wake Lock API</strong> built into your browser.
              For unsupported browsers, it automatically falls back to a video-based method for universal compatibility.
              The auto-sleep timer lets you set custom durations (1-480 minutes) for automatic wake lock release.
              Visual animations indicate when your device is being kept awake.
            </p>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Is it safe to use?</h3>
            <p class="text-gray-600">
              Yes, completely safe! This tool only uses standard web APIs and doesn't access your
              files, camera, microphone, or any personal data. It simply prevents your device from
              sleeping - the same as moving your mouse occasionally. No data is collected or transmitted.
            </p>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Which browsers support this?</h3>
            <div class="text-gray-600">
              <p class="mb-2"><strong>Native Wake Lock API:</strong></p>
              <ul class="space-y-1 mb-4">
                <li>• Chrome 84+ (Desktop & Mobile)</li>
                <li>• Edge 84+</li>
                <li>• Safari 16.4+</li>
                <li>• Firefox (with polyfill)</li>
              </ul>
              <p class="mb-2"><strong>Video Fallback (Universal):</strong></p>
              <ul class="space-y-1">
                <li>• All modern browsers</li>
                <li>• Older browser versions</li>
                <li>• All mobile browsers</li>
              </ul>
              <p class="text-sm mt-2 italic">The app automatically detects your browser and uses the best available method.</p>
            </div>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">How does the timer feature work?</h3>
            <p class="text-gray-600">
              Click the "Timer" option to set a custom duration (1-480 minutes) for automatic sleep.
              Use the number input or quick increment buttons (+1, +5, +10, +30 minutes) to set your time.
              The device will automatically allow sleep when the timer expires, perfect for timed tasks
              like downloads, renders, or study sessions. You can cancel the timer anytime.
            </p>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="text-center space-y-4 border-t pt-12">
        <h2 class="text-2xl font-bold text-gray-900">About</h2>
        <p class="text-gray-600 max-w-xl mx-auto">
          Built by William Chong as a simple, useful web tool.
          Check out more projects and articles on my blog.
        </p>
        <a
          href="https://blog.williamchong.cloud"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Visit My Blog
        </a>
      </section>
    </div>
  </div>
</template>

<script setup>
const wakeLock = useWakeLock()
const timerMinutes = ref(60)
const showTimer = ref(false)

// SEO and Open Graph meta tags
useSeoMeta({
  title: 'NoSleep - Keep Your Device Awake with Timer',
  description: 'Web-based tool to prevent device sleep with customizable auto-sleep timers, animated feedback, and universal browser support. Perfect for downloads, renders, and presentations.',
  keywords: 'no sleep, keep awake, prevent sleep, sleep timer, device awake, screen wake lock, auto sleep, computer awake, mobile awake, wake lock timer',
  author: 'William Chong',
  ogTitle: 'NoSleep - Keep Your Device Awake with Timer',
  ogDescription: 'Prevent device sleep with customizable timers and universal browser support. Features animated feedback and automatic fallback for older browsers.',
  ogType: 'website',
})

// JSON-LD structured data for SEO
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify([
      {
        '@type': 'WebApplication',
        name: 'NoSleep',
        description: 'A web-based tool that prevents your computer or mobile device from going to sleep, featuring customizable auto-sleep timers, animated visual feedback, and universal browser compatibility with automatic fallback methods.',
        url: 'https://nosleep.williamchong.cloud',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web Browser',
        author: {
          '@type': 'Person',
          name: 'William Chong',
          url: 'https://blog.williamchong.cloud'
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What are the use cases for NoSleep?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'NoSleep supports timed tasks like 30-60 min timers for downloads/uploads, 2-4 hour timers for video rendering, 15-30 min timers for code compilation, presentations without interruption, study session focus timers, live streaming and recording, and real-time monitoring dashboards.'
            }
          },
          {
            '@type': 'Question',
            name: 'How does NoSleep work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'This website uses the modern Screen Wake Lock API built into your browser. For unsupported browsers, it automatically falls back to a video-based method for universal compatibility. The auto-sleep timer lets you set custom durations (1-480 minutes) for automatic wake lock release. Visual animations indicate when your device is being kept awake.'
            }
          },
          {
            '@type': 'Question',
            name: 'Is NoSleep safe to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, completely safe! This tool only uses standard web APIs and doesn\'t access your files, camera, microphone, or any personal data. It simply prevents your device from sleeping - the same as moving your mouse occasionally. No data is collected or transmitted.'
            }
          },
          {
            '@type': 'Question',
            name: 'Which browsers support NoSleep?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Native Wake Lock API support includes Chrome 84+, Edge 84+, Safari 16.4+, and Firefox with polyfill. For universal compatibility, the app automatically falls back to a video-based method that works on all modern browsers and older browser versions.'
            }
          },
          {
            '@type': 'Question',
            name: 'How does the timer feature work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Click the Timer option to set a custom duration (1-480 minutes) for automatic sleep. Use the number input or quick increment buttons (+1, +5, +10, +30 minutes) to set your time. The device will automatically allow sleep when the timer expires, perfect for timed tasks like downloads, renders, or study sessions.'
            }
          }
        ]
      }
    ])
    }
  ]
})

const buttonClasses = computed(() => {
  if (wakeLock.isActive.value) {
    if (wakeLock.usingVideoFallback.value) {
      return 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 focus:ring-amber-300'
    }
    return 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 focus:ring-green-300'
  }

  if (!wakeLock.isSupported.value) {
    return 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 focus:ring-amber-300'
  }

  return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-300'
})


const buttonText = computed(() => {
  if (wakeLock.isActive.value) {
    return wakeLock.usingVideoFallback.value ? 'Device Awake (Video)' : 'Device Awake'
  }
  return wakeLock.isSupported.value ? 'Device Sleeping' : 'Keep Awake (Fallback)'
})

const statusText = computed(() => {
  if (wakeLock.isActive.value) {
    return 'Your device will stay awake. Click to allow sleep.'
  }
  return 'Your device can sleep normally. Click to keep awake.'
})

const startTimerWithInput = async () => {
  if (timerMinutes.value && timerMinutes.value > 0) {
    await wakeLock.startTimer(timerMinutes.value)
  }
}

onMounted(async () => {
  if (wakeLock.isSupported.value) {
    await wakeLock.acquire()
  }
})
</script>

<style scoped>
@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 5px currentColor);
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 15px currentColor);
    transform: scale(1.1);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
</style>
