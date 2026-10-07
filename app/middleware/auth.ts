import { useAuthStore } from '~/stores/auth'

/**
 * Middleware de route « auth » : protège les pages privées (ex. : /compte).
 * Un visiteur non connecté est envoyé vers /connexion?redirect=<page demandée>.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    return navigateTo({ path: '/connexion', query: { redirect: to.fullPath } })
  }
})
