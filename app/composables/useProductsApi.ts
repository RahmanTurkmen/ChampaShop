import type { Category, Product, ProductSummary, ProductsResponse } from '~/types/dummyjson'
import { PRODUCT_SUMMARY_FIELDS } from '~/types/dummyjson'
import {
  PAGE_SIZE,
  filterProducts,
  needsLocalFiltering,
  pageCount,
  paginate,
  sortProducts,
  type CatalogQuery,
} from '~/utils/catalog'

export interface CatalogPage {
  products: ProductSummary[]
  total: number
  page: number
  pageCount: number
}

type QueryValue = string | number | undefined

export interface ProductsApi {
  getCatalogPage: (state: CatalogQuery, signal?: AbortSignal) => Promise<CatalogPage>
  getCategories: (signal?: AbortSignal) => Promise<Category[]>
  getProduct: (id: number, signal?: AbortSignal) => Promise<Product>
}

/**
 * Accès aux produits DummyJSON.
 * Les pages et stores dépendent de cette interface, pas de `$fetch` directement :
 * l'URL de l'API et la stratégie de chargement sont centralisées ici.
 */
export function useProductsApi(): ProductsApi {
  const { apiBase } = useRuntimeConfig().public

  function get<T>(path: string, query: Record<string, QueryValue> = {}, signal?: AbortSignal) {
    return $fetch<T>(path, { baseURL: apiBase, query, signal })
  }

  /** /products, /products/search?q= ou /products/category/:slug selon les filtres */
  function listEndpoint(state: CatalogQuery): { path: string; query: Record<string, QueryValue> } {
    if (state.q) {
      return { path: '/products/search', query: { q: state.q } }
    }
    if (state.category) {
      return { path: `/products/category/${encodeURIComponent(state.category)}`, query: {} }
    }
    return { path: '/products', query: {} }
  }

  async function getCatalogPage(state: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
    const endpoint = listEndpoint(state)
    const select = PRODUCT_SUMMARY_FIELDS.join(',')

    if (!needsLocalFiltering(state)) {
      // Cas simple : pagination et tri délégués à l'API (12 produits transférés)
      const response = await get<ProductsResponse<ProductSummary>>(
        endpoint.path,
        {
          ...endpoint.query,
          limit: PAGE_SIZE,
          skip: (state.page - 1) * PAGE_SIZE,
          select,
          sortBy: state.sortBy ?? undefined,
          order: state.sortBy ? state.order : undefined,
        },
        signal,
      )
      return {
        products: response.products,
        total: response.total,
        page: state.page,
        pageCount: pageCount(response.total),
      }
    }

    // Filtre prix (ou recherche + catégorie) : un seul appel avec limit=0 et champs réduits,
    // puis filtre, tri et pagination côté Nuxt (rendu serveur).
    // limit=0 renvoie bien tous les produits sur les trois routes (/products, /products/search
    // et /products/category/:slug) : vérifié sur DummyJSON, limit et skip y sont respectés.
    const response = await get<ProductsResponse<ProductSummary>>(
      endpoint.path,
      { ...endpoint.query, limit: 0, select },
      signal,
    )
    const filtered = filterProducts(response.products, {
      // Sans recherche, la catégorie a déjà été filtrée par l'API (/products/category/:slug) :
      // inutile de refiltrer. Avec une recherche, l'API passe par /products/search, qui ignore
      // la catégorie : on la filtre donc ici.
      category: state.q ? state.category : '',
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
    })
    const sorted = sortProducts(filtered, state.sortBy, state.order)
    return {
      products: paginate(sorted, state.page),
      total: sorted.length,
      page: state.page,
      pageCount: pageCount(sorted.length),
    }
  }

  return {
    getCatalogPage,
    getCategories: (signal) => get<Category[]>('/products/categories', {}, signal),
    getProduct: (id, signal) => get<Product>(`/products/${id}`, {}, signal),
  }
}
