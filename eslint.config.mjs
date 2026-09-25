// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Exigence du sujet : aucun `any`. Utiliser `unknown` puis un narrowing.
    '@typescript-eslint/no-explicit-any': 'error',
  },
})
