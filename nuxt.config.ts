// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxt/test-utils/module'],

  devtools: { enabled: true },

  compatibilityDate: '2025-07-15',

  typescript: {
    strict: true,
    typeCheck: true,
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
