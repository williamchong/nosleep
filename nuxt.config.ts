// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    'nuxt-gtag',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@nuxtjs/tailwindcss',
  ],
  site: {
    url: 'https://nosleep.williamchong.cloud',
    name: 'NoSleep',
  },
  gtag: {
    id: 'G-RCQBVKVP25',
  },
  i18n: {
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
    ],
    defaultLocale: 'en',
    lazy: true,
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
