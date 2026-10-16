import type { ComputedRef } from 'vue'
import { MAX_RECENTLY_VIEWED, parseRecentlyViewedCookie, pushRecentlyViewed } from '~/utils/recentlyViewed'

const COOKIE_NAME = 'recently_viewed'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export interface RecentlyViewedStore {
  ids: ComputedRef<number[]>
  /** Ajoute un produit en tête de l'historique (à appeler seulement après un chargement réussi). */
  push: (id: number) => void
  clear: () => void
}

/**
 * Historique « vus récemment » (F7).
 * - Persistance : cookie « recently_viewed » (identifiants uniquement), lu dès le rendu
 *   serveur : la liste est donc correcte dans le HTML initial, pas de flash ni d'hydratation ratée.
 * - Store (et non simple composable) : `useCookie()` n'est appelé qu'une seule fois pour tout
 *   le rendu. L'appeler séparément depuis la page et depuis le composant d'affichage créerait
 *   deux instances qui s'écraseraient l'une l'autre en SSR (NUXT_E7006).
 * - Le cookie est lu comme `unknown` puis validé par parseRecentlyViewedCookie (il peut avoir
 *   été modifié ou corrompu à la main) : la page ne plante jamais à cause de ce cookie.
 */
export const useRecentlyViewedStore = defineStore('recentlyViewed', (): RecentlyViewedStore => {
  const cookie = useCookie<unknown>(COOKIE_NAME, {
    default: () => [],
    maxAge: THIRTY_DAYS,
    sameSite: 'lax',
  })

  const ids = computed<number[]>(() => parseRecentlyViewedCookie(cookie.value))

  function push(id: number): void {
    cookie.value = pushRecentlyViewed(ids.value, id, MAX_RECENTLY_VIEWED)
  }

  function clear(): void {
    cookie.value = []
  }

  return { ids, push, clear }
})
