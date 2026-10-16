import { useRecentlyViewedStore } from '~/stores/recentlyViewed'

/**
 * Point d'accès unique à l'historique « vus récemment » (F7).
 * Fine couche au-dessus du store Pinia : le store garantit qu'un seul `useCookie()` est créé
 * pour toute la requête, même utilisé à la fois dans une page et dans `RecentlyViewed.vue`.
 * (`ReturnType<...>` plutôt que l'interface `RecentlyViewedStore` du store : Pinia déballe
 * `ids` en `number[]` simple sur l'instance, ce qui diffère du `ComputedRef<number[]>` déclaré.)
 */
export function useRecentlyViewed(): ReturnType<typeof useRecentlyViewedStore> {
  return useRecentlyViewedStore()
}
