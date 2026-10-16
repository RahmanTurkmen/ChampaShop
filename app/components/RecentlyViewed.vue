<script setup lang="ts">
import type { RecentlyViewedProduct } from '~/types/dummyjson'
import { formatPrice } from '~/utils/money'

const props = defineProps<{
  /** Produit courant à exclure de la liste (ex. : sa propre fiche produit) */
  excludeId?: number
}>()

const api = useProductsApi()
const recentlyViewed = useRecentlyViewed()

const visibleIds = computed<number[]>(() =>
  recentlyViewed.ids.filter((id: number) => id !== props.excludeId),
)

/**
 * Chargement en parallèle, résilient : DummyJSON n'a pas d'appel multi-id, donc un appel
 * léger par produit (select réduit). Avec Promise.allSettled, l'échec d'un produit (ex. :
 * supprimé depuis de l'API) n'empêche pas l'affichage des autres ; on les retire simplement.
 */
const { data: products } = await useAsyncData<RecentlyViewedProduct[]>(
  () => `recently-viewed:${visibleIds.value.join(',')}`,
  async (_nuxtApp, { signal }) => {
    if (visibleIds.value.length === 0) return []
    const results = await Promise.allSettled(
      visibleIds.value.map((id) => api.getRecentlyViewedProduct(id, signal)),
    )
    const byId = new Map<number, RecentlyViewedProduct>()
    for (const result of results) {
      if (result.status === 'fulfilled') {
        byId.set(result.value.id, result.value)
      }
    }
    // L'ordre de la liste (plus récent en premier) doit être conservé, Promise.allSettled
    // ne le garantit pas forcément selon les temps de réponse de chaque appel.
    return visibleIds.value.flatMap((id) => {
      const product = byId.get(id)
      return product ? [product] : []
    })
  },
  { default: () => [], watch: [visibleIds] },
)

/** La section disparaît après un effacement : le focus suit le pattern de CompareBar.vue. */
async function handleClear(): Promise<void> {
  recentlyViewed.clear()
  await nextTick()
  document.getElementById('contenu')?.focus()
}
</script>

<template>
  <section v-if="products && products.length > 0" class="recently-viewed" aria-labelledby="recently-viewed-title">
    <div class="recently-viewed__header">
      <h2 id="recently-viewed-title">Vus récemment</h2>
      <button type="button" class="btn btn--secondary" @click="handleClear">
        Effacer l'historique
      </button>
    </div>

    <ul class="recently-viewed__list">
      <li v-for="product in products" :key="product.id">
        <NuxtLink :to="`/produits/${product.id}`" class="recently-viewed__card card">
          <img :src="product.thumbnail" alt="" width="120" height="120" class="recently-viewed__image" >
          <p class="recently-viewed__title">{{ product.title }}</p>
          <p class="recently-viewed__price">{{ formatPrice(product.price) }}</p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recently-viewed {
  margin-top: 40px;
}

.recently-viewed__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.recently-viewed__header h2 {
  margin: 0;
}

.recently-viewed__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}

.recently-viewed__card {
  display: block;
  padding: 12px;
  color: inherit;
  text-decoration: none;
}

.recently-viewed__image {
  width: 100%;
  height: 120px;
  object-fit: contain;
}

.recently-viewed__title {
  margin: 8px 0 4px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recently-viewed__price {
  margin: 0;
  font-weight: 700;
}
</style>
