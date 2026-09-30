<script setup lang="ts">
import { PAGE_SIZE, parseCatalogQuery, toRouteQuery, type CatalogQuery } from '~/utils/catalog'

const route = useRoute()
const api = useProductsApi()

/** L'URL est la source de vérité : tout l'état du catalogue est dérivé de route.query */
const state = computed<CatalogQuery>(() => parseCatalogQuery(route.query))

const { data: categories } = await useAsyncData(
  'categories',
  (_nuxtApp, { signal }) => api.getCategories(signal),
  { default: () => [] },
)

/**
 * Une clé par combinaison de filtres : la réponse d'une ancienne recherche est rangée sous
 * son ancienne clé et ne peut donc jamais écraser l'affichage de la recherche la plus récente.
 * Le `signal` annule en plus la requête HTTP devenue inutile.
 */
const {
  data: catalog,
  status,
  refresh,
} = await useAsyncData(
  () => `catalog:${JSON.stringify(toRouteQuery(state.value))}`,
  (_nuxtApp, { signal }) => api.getCatalogPage(state.value, signal),
)

const categoryName = computed<string>(
  () => categories.value.find((item) => item.slug === state.value.category)?.name ?? '',
)

useSeoMeta({
  title: () => (categoryName.value ? `Catalogue : ${categoryName.value}` : 'Catalogue'),
  description: 'Parcourez le catalogue ChampaShop : recherche, filtres par catégorie, prix et note.',
  ogTitle: 'Catalogue ChampaShop',
  ogDescription: 'Parcourez le catalogue ChampaShop.',
})

async function updateUrl(patch: Partial<CatalogQuery>, replace = false): Promise<void> {
  const next: CatalogQuery = { ...state.value, ...patch, page: patch.page ?? 1 }
  await navigateTo({ path: '/produits', query: toRouteQuery(next) }, { replace })
}

function linkFor(page: number): { path: string; query: Record<string, string> } {
  return { path: '/produits', query: toRouteQuery({ ...state.value, page }) }
}

const resultLabel = computed<string>(() => {
  const total = catalog.value?.total ?? 0
  return total === 0 ? 'Aucun produit' : `${total} produit${total > 1 ? 's' : ''}`
})
</script>

<template>
  <div>
    <h1 class="page-title">Catalogue</h1>

    <CatalogFilters
      :state="state"
      :categories="categories"
      @search="(q) => updateUrl({ q }, true)"
      @apply="(patch) => updateUrl(patch)"
    />

    <p class="catalog__count muted" role="status" aria-live="polite">
      <template v-if="status === 'pending'">Chargement des produits…</template>
      <template v-else-if="catalog">{{ resultLabel }}</template>
    </p>

    <div v-if="status === 'error'" class="alert alert--error catalog__error" role="alert">
      <p>Impossible de charger les produits. Vérifiez votre connexion.</p>
      <button type="button" class="btn" @click="() => refresh()">Réessayer</button>
    </div>

    <ul v-else-if="status === 'pending' && !catalog" class="catalog__grid" aria-hidden="true">
      <li v-for="index in PAGE_SIZE" :key="index"><ProductCardSkeleton /></li>
    </ul>

    <div v-else-if="catalog && catalog.products.length === 0" class="alert alert--info">
      <p>Aucun produit ne correspond à votre recherche.</p>
      <NuxtLink to="/produits">Voir tous les produits</NuxtLink>
    </div>

    <template v-else-if="catalog">
      <ul class="catalog__grid">
        <li v-for="product in catalog.products" :key="product.id">
          <ProductCard :product="product" />
        </li>
      </ul>

      <CatalogPagination :page="catalog.page" :page-count="catalog.pageCount" :link-for="linkFor" />
    </template>
  </div>
</template>

<style scoped>
.catalog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.catalog__grid > li {
  display: flex;
}

.catalog__grid > li > * {
  flex: 1;
}

.catalog__count {
  min-height: 1.5em;
}

.catalog__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
</style>
