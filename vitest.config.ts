import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Tests unitaires des fonctions pures (utils/), sans Vue ni Nuxt.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['app/utils/**/*.ts'],
      reporter: ['text', 'html'],
    },
  },
})
