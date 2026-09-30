// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxt/test-utils/module'],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      titleTemplate: '%s · ChampaShop',
      title: 'Boutique en ligne',
      meta: [
        { name: 'description', content: 'ChampaShop : la boutique en ligne rapide et accessible.' },
        { name: 'theme-color', content: '#0f766e' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  runtimeConfig: {
    public: {
      // URL de l'API DummyJSON (surchargée par NUXT_PUBLIC_API_BASE)
      apiBase: 'https://dummyjson.com',
    },
  },

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
