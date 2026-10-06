// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@sentry/nuxt/module',
    '@vite-pwa/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  // Embed used lucide icons in the client bundle so they render offline (PWA)
  // and inside the Document PiP iframe without a runtime fetch.
  icon: {
    clientBundle: {
      scan: true,
    },
  },

  site: {
    url: 'https://nosleep.williamchong.cloud',
    name: 'NoSleep',
    // Static hosting serves /zh as a 301 to /zh/, so canonical, hreflang and sitemap URLs
    // must carry the slash or they all point at redirects.
    trailingSlash: true,
  },

  sitemap: {
    // /en duplicates / (prefix_and_default) and /pip is the floating-window surface.
    exclude: ['/en', '/en/**', '/pip', '/pip/**', '/*/pip', '/*/pip/**'],
  },

  scripts: {
    privacy: false,
    registry: {
      googleAnalytics: {
        id: 'G-RCQBVKVP25',
        bundle: false,
        proxy: false,
        trigger: 'onNuxtReady',
      },
    },
  },

  i18n: {
    baseUrl: 'https://nosleep.williamchong.cloud',
    locales: [
      {
        code: 'en',
        name: 'English',
        language: 'en-US',
        file: 'en-US.json'
      },
      {
        code: 'zh',
        name: '中文',
        language: 'zh-HK',
        file: 'zh-HK.json'
      },
      {
        code: 'ja',
        name: '日本語',
        language: 'ja-JP',
        file: 'ja-JP.json'
      },
      {
        code: 'pt',
        name: 'Português',
        language: 'pt-BR',
        file: 'pt-BR.json'
      },
      {
        code: 'es',
        name: 'Español',
        language: 'es',
        file: 'es.json'
      },
    ],
    strategy: 'prefix_and_default',
    trailingSlash: true,
    defaultLocale: 'en',
  },

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  colorMode: {
    classSuffix: '', // Use 'dark' class instead of 'dark-mode'
    preference: 'system', // Default to system preference
    fallback: 'light', // Fallback color mode
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
      // Strip the colorMode query so /pip?colorMode=dark matches the precached /pip entry.
      ignoreURLParametersMatching: [/^colorMode$/],
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