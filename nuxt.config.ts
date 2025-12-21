// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    'nuxt-gtag',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/device',
    '@sentry/nuxt/module',
    '@nuxt/scripts',
    '@nuxtjs/color-mode',
    '@pinia/nuxt'
  ],

  scripts: {
    registry: {
      clarity: {
        id: 'tkuamds40i'
      }
    }
  },

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
  }
})