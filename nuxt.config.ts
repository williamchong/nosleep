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
  gtag: {
    id: undefined,
  },
  i18n: {
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en-US.json'
      },
    ],
    defaultLocale: 'en',
    lazy: true,
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
