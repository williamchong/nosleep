// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    'nuxt-gtag',
    '@nuxt/eslint',
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

  gtag: {
    id: 'G-RCQBVKVP25',
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
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
    },
    devOptions: {
      enabled: false,
    },
  },
})