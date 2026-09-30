/**
 * Logique pure du catalogue (F1) : lecture/écriture des query params,
 * filtres, tri et pagination. Aucune dépendance à Vue : testable avec Vitest.
 *
 * L'URL est la source de vérité : l'état du catalogue est toujours dérivé de `route.query`.
 */
import type { ProductSummary } from '~/types/dummyjson'

export const PAGE_SIZE = 12

export const SORT_FIELDS = ['price', 'rating', 'title'] as const
export type SortField = (typeof SORT_FIELDS)[number]

export const SORT_ORDERS = ['asc', 'desc'] as const
export type SortOrder = (typeof SORT_ORDERS)[number]

export interface CatalogQuery {
  page: number
  q: string
  category: string
  sortBy: SortField | null
  order: SortOrder
  minPrice: number | null
  maxPrice: number | null
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  page: 1,
  q: '',
  category: '',
  sortBy: null,
  order: 'asc',
  minPrice: null,
  maxPrice: null,
}

/** Récupère la première valeur texte d'un query param (qui peut être un tableau ou absent). */
export function firstString(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first.trim() : ''
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(firstString(value), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parsePrice(value: unknown): number | null {
  const raw = firstString(value).replace(',', '.')
  if (raw === '') {
    return null
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value)
}

/** route.query → CatalogQuery (valeurs invalides remplacées par les valeurs par défaut) */
export function parseCatalogQuery(query: Record<string, unknown>): CatalogQuery {
  const sortBy = firstString(query.sortBy)
  const order = firstString(query.order)
  let minPrice = parsePrice(query.minPrice)
  let maxPrice = parsePrice(query.maxPrice)

  // min > max : on inverse plutôt que d'afficher une liste vide
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    const swap = minPrice
    minPrice = maxPrice
    maxPrice = swap
  }

  return {
    page: parsePositiveInt(query.page, DEFAULT_CATALOG_QUERY.page),
    q: firstString(query.q),
    category: firstString(query.category),
    sortBy: isOneOf(SORT_FIELDS, sortBy) ? sortBy : null,
    order: isOneOf(SORT_ORDERS, order) ? order : DEFAULT_CATALOG_QUERY.order,
    minPrice,
    maxPrice,
  }
}

/** CatalogQuery → query params. Les valeurs par défaut sont omises pour garder des URL courtes. */
export function toRouteQuery(state: CatalogQuery): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.q) query.q = state.q
  if (state.category) query.category = state.category
  if (state.sortBy) {
    query.sortBy = state.sortBy
    query.order = state.order
  }
  if (state.minPrice !== null) query.minPrice = String(state.minPrice)
  if (state.maxPrice !== null) query.maxPrice = String(state.maxPrice)
  if (state.page > 1) query.page = String(state.page)
  return query
}

/**
 * Stratégie de chargement (voir README) :
 * - « api »   : DummyJSON sait tout faire (pagination, tri) → on lui délègue, 12 produits par appel.
 * - « local » : filtre prix, ou recherche + catégorie combinées → l'API ne sait pas le faire.
 *               On charge en UN appel tous les produits correspondants avec des champs réduits
 *               (`select`), puis on filtre, trie et pagine nous-mêmes.
 */
export function needsLocalFiltering(state: CatalogQuery): boolean {
  const hasPriceFilter = state.minPrice !== null || state.maxPrice !== null
  const hasSearchAndCategory = state.q !== '' && state.category !== ''
  return hasPriceFilter || hasSearchAndCategory
}

export function filterProducts<T extends Pick<ProductSummary, 'price' | 'category'>>(
  products: T[],
  state: Pick<CatalogQuery, 'category' | 'minPrice' | 'maxPrice'>,
): T[] {
  return products.filter((product) => {
    if (state.category && product.category !== state.category) return false
    if (state.minPrice !== null && product.price < state.minPrice) return false
    if (state.maxPrice !== null && product.price > state.maxPrice) return false
    return true
  })
}

export function sortProducts<T extends Pick<ProductSummary, SortField>>(
  products: T[],
  sortBy: SortField | null,
  order: SortOrder,
): T[] {
  if (sortBy === null) {
    return [...products]
  }
  const direction = order === 'asc' ? 1 : -1
  return [...products].sort((a, b) => {
    const left = a[sortBy]
    const right = b[sortBy]
    const comparison =
      typeof left === 'string' && typeof right === 'string'
        ? left.localeCompare(right, 'fr')
        : Number(left) - Number(right)
    return comparison * direction
  })
}

export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/** Ramène une page hors limites (lien partagé obsolète, URL modifiée à la main) dans [1, pageCount] */
export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), Math.max(1, totalPages))
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

/** Numéros de page à afficher : 1 … 4 5 6 … 20 (null = ellipse) */
export function visiblePages(current: number, total: number): (number | null)[] {
  const pages: (number | null)[] = []
  for (let page = 1; page <= total; page++) {
    const isEdge = page === 1 || page === total
    const isNear = Math.abs(page - current) <= 1
    if (isEdge || isNear) {
      pages.push(page)
    } else if (pages[pages.length - 1] !== null) {
      pages.push(null)
    }
  }
  return pages
}
