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
              <svg v-if="wakeLock.isSupported.value" class="w-8 h-8" :class="{ 'animate-pulse': wakeLock.isActive.value }" fill="currentColor" viewBox="0 0 24 24">
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

    <!-- Description Section -->
    <div class="max-w-4xl mx-auto mt-8 px-4 space-y-12">
      <section class="text-center space-y-4">
        <h2 class="text-3xl font-bold text-gray-900">What Does This Site Do?</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          NoSleep is a web-based tool that lets you disable sleep temporarily on your computer or mobile device,
          preventing screen dimming and screensavers. It uses the browser's Screen Wake Lock API
          to keep your device active without requiring any software installation or system setting changes.
        </p>
      </section>

      <!-- FAQ Section -->
      <section class="space-y-8">
        <h2 class="text-3xl font-bold text-gray-900 text-center">Frequently Asked Questions</h2>

        <div class="grid gap-6">
          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">What are the use cases?</h3>
            <ul class="text-gray-600 space-y-2">
              <li>• Long file downloads or uploads</li>
              <li>• Video/audio rendering and processing</li>
              <li>• Code compilation and builds</li>
              <li>• Data analysis and processing</li>
              <li>• Presentations without interruption</li>
              <li>• Streaming or recording sessions</li>
              <li>• Remote work monitoring tools</li>
            </ul>
          </div>

          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">How does it work?</h3>
            <p class="text-gray-600">
              This website uses the modern <strong>Screen Wake Lock API</strong> built into your browser.
              When activated, it sends a signal to your operating system to prevent sleep mode,
              screen dimming, and screensavers. The wake lock is automatically released when you
              close the tab, navigate away, or click the release button.
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
              <p class="mb-2">Supported browsers include:</p>
              <ul class="space-y-1">
                <li>• Chrome 84+ (Desktop & Mobile)</li>
                <li>• Edge 84+</li>
                <li>• Safari 16.4+</li>
                <li>• Firefox (with polyfill)</li>
                <li>• Most mobile browsers</li>
              </ul>
            </div>
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

// SEO and Open Graph meta tags
useSeoMeta({
  title: 'NoSleep - Keep Your Device Awake',
  description: 'Disable sleep temporarily on your device. Prevent your computer or mobile from going to sleep during downloads, renders, or presentations. No software installation required.',
  keywords: 'no sleep, keep awake, prevent sleep, disable sleep, screen wake lock, device awake, computer awake, mobile awake',
  author: 'William Chong',
  ogTitle: 'NoSleep - Keep Your Device Awake',
  ogDescription: 'Disable sleep temporarily on your device. Perfect for long downloads, renders, or presentations. Uses browser Wake Lock API - no software installation required.',
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
        description: 'A web-based tool that lets you disable sleep temporarily on your computer or mobile device, preventing screen dimming and screensavers.',
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
              text: 'NoSleep is perfect for long file downloads or uploads, video/audio rendering and processing, code compilation and builds, data analysis and processing, presentations without interruption, streaming or recording sessions, and remote work monitoring tools.'
            }
          },
          {
            '@type': 'Question',
            name: 'How does NoSleep work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'This website uses the modern Screen Wake Lock API built into your browser. When activated, it sends a signal to your operating system to prevent sleep mode, screen dimming, and screensavers. The wake lock is automatically released when you close the tab, navigate away, or click the release button.'
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
              text: 'Supported browsers include Chrome 84+ (Desktop & Mobile), Edge 84+, Safari 16.4+, Firefox (with polyfill), and most mobile browsers.'
            }
          }
        ]
      }
    ])
    }
  ]
})

const buttonClasses = computed(() => {
  if (!wakeLock.isSupported.value) {
    return 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }

  if (wakeLock.isActive.value) {
    return 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 focus:ring-green-300'
  }

  return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-300'
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
