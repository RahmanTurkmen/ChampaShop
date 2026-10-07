import { useAuthStore } from '~/stores/auth'

/**
 * Charge l'utilisateur connecté PENDANT le rendu serveur (GET /auth/me).
 * L'état Pinia est ensuite transmis au navigateur : pas de « flash » déconnecté au rechargement.
 */
export default defineNuxtPlugin({
  name: 'auth',
  async setup() {
    if (import.meta.server) {
      await useAuthStore().fetchUser()
    }
  },
})
