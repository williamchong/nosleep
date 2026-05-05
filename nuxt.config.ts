// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@nuxtjs/tailwindcss',
    '@sentry/nuxt/module',
    '@nuxtjs/color-mode',
    '@vite-pwa/nuxt',
  ],

  site: {
    url: 'https://nosleep.williamchong.cloud',
    name: 'NoSleep',
  },

  scripts: {
    privacy: false,
    defaultScriptOptions: {
      bundle: false,
    },
    registry: {
      googleAnalytics: {
        id: 'G-RCQBVKVP25',
        scriptOptions: {
          trigger: 'onNuxtReady',
        },
      },
      posthog: {
        apiKey: 'phc_sNVSnBwyYLmDRxqcESGVNSr8yGdUp2nBwJ6zP45L6Duz',
        region: 'us',
        scriptOptions: {
          trigger: 'onNuxtReady',
        },
      },
    },
  },

  i18n: {
    baseUrl: 'https://nosleep.williamchong.cloud',
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en-US.json'
      },
      {
        code: 'zh',
        language: 'zh-HK',
        file: 'zh-HK.json'
      },
      {
        code: 'ja',
        language: 'ja-JP',
        file: 'ja-JP.json'
      },
    ],
    strategy: 'prefix_and_default',
    defaultLocale: 'en',
    lazy: true,
  },

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  colorMode: {
    classSuffix: '', // Use 'dark' class instead of 'dark-mode'
    preference: 'system', // Default to system preference
    fallback: 'light', // Fallback color mode
  },

  tailwindcss: {
    config: {
      darkMode: 'class', // Enable class-based dark mode
    }
  },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'williamchong',
      project: 'nosleep'
    }
  },

  vite: {
    define: {
      __SENTRY_DEBUG__: false,
      __SENTRY_TRACING__: false,
    },
  },

  sourcemap: {
    client: 'hidden'
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'NoSleep',
      short_name: 'NoSleep',
      description: 'Keep your screen awake — no downloads, no extensions, just one click.',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      // Strip PiP query params so /pip?pip=1&colorMode=dark matches the precached /pip entry.
      ignoreURLParametersMatching: [/^pip$/, /^colorMode$/],
      // Disable @vite-pwa/nuxt's default navigateFallback ('/'), which otherwise registers a
      // catch-all NavigationRoute that serves index.html for any precache miss — hijacking
      // routes like /pip when their URL carries query params.
      navigateFallback: null,
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
})