import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CATALOG_QUERY,
  clampPage,
  filterProducts,
  needsLocalFiltering,
  pageCount,
  paginate,
  parseCatalogQuery,
  sortProducts,
  toRouteQuery,
  visiblePages,
} from '../../app/utils/catalog'

const products = [
  { id: 1, title: 'Banane', price: 2, rating: 4.1, category: 'groceries' },
  { id: 2, title: 'Aspirateur', price: 150, rating: 3.2, category: 'home' },
  { id: 3, title: 'Crème', price: 12.5, rating: 4.8, category: 'beauty' },
]

describe('parseCatalogQuery', () => {
  it('renvoie les valeurs par défaut pour une URL vide', () => {
    expect(parseCatalogQuery({})).toEqual(DEFAULT_CATALOG_QUERY)
  })

  it('lit tous les paramètres', () => {
    expect(
      parseCatalogQuery({
        page: '3',
        q: ' phone ',
        category: 'smartphones',
        sortBy: 'price',
        order: 'desc',
        minPrice: '10',
        maxPrice: '99,5',
      }),
    ).toEqual({
      page: 3,
      q: 'phone',
      category: 'smartphones',
      sortBy: 'price',
      order: 'desc',
      minPrice: 10,
      maxPrice: 99.5,
    })
  })

  it('ignore les valeurs invalides', () => {
    const state = parseCatalogQuery({ page: '-2', sortBy: 'hack', order: 'up', minPrice: 'abc', maxPrice: '-5' })
    expect(state.page).toBe(1)
    expect(state.sortBy).toBeNull()
    expect(state.order).toBe('asc')
    expect(state.minPrice).toBeNull()
    expect(state.maxPrice).toBeNull()
  })

  it('prend la première valeur si un paramètre est répété', () => {
    expect(parseCatalogQuery({ q: ['a', 'b'] }).q).toBe('a')
  })

  it('inverse min et max s’ils sont dans le mauvais ordre', () => {
    const state = parseCatalogQuery({ minPrice: '100', maxPrice: '10' })
    expect(state.minPrice).toBe(10)
    expect(state.maxPrice).toBe(100)
  })
})

describe('toRouteQuery', () => {
  it('omet les valeurs par défaut', () => {
    expect(toRouteQuery(DEFAULT_CATALOG_QUERY)).toEqual({})
  })

  it('aller-retour URL → état → URL', () => {
    const query = { q: 'mascara', category: 'beauty', sortBy: 'rating', order: 'desc', minPrice: '5', maxPrice: '50', page: '2' }
    expect(toRouteQuery(parseCatalogQuery(query))).toEqual(query)
  })
})

describe('stratégie de chargement', () => {
  it('délègue à l’API sans filtre prix', () => {
    expect(needsLocalFiltering({ ...DEFAULT_CATALOG_QUERY, q: 'phone' })).toBe(false)
    expect(needsLocalFiltering({ ...DEFAULT_CATALOG_QUERY, category: 'beauty' })).toBe(false)
  })

  it('filtre localement avec un prix, ou recherche + catégorie', () => {
    expect(needsLocalFiltering({ ...DEFAULT_CATALOG_QUERY, minPrice: 10 })).toBe(true)
    expect(needsLocalFiltering({ ...DEFAULT_CATALOG_QUERY, maxPrice: 10 })).toBe(true)
    expect(needsLocalFiltering({ ...DEFAULT_CATALOG_QUERY, q: 'a', category: 'beauty' })).toBe(true)
  })
})

describe('filtres, tri et pagination', () => {
  it('filtre par prix (bornes incluses) et catégorie', () => {
    expect(filterProducts(products, { category: '', minPrice: 2, maxPrice: 12.5 }).map((p) => p.id)).toEqual([1, 3])
    expect(filterProducts(products, { category: 'home', minPrice: null, maxPrice: null }).map((p) => p.id)).toEqual([2])
  })

  it('trie par prix, note ou titre sans modifier le tableau d’origine', () => {
    expect(sortProducts(products, 'price', 'desc').map((p) => p.id)).toEqual([2, 3, 1])
    expect(sortProducts(products, 'rating', 'asc').map((p) => p.id)).toEqual([2, 1, 3])
    expect(sortProducts(products, 'title', 'asc').map((p) => p.id)).toEqual([2, 1, 3])
    expect(sortProducts(products, null, 'asc').map((p) => p.id)).toEqual([1, 2, 3])
    expect(products[0]?.id).toBe(1)
  })

  it('pagine par 12', () => {
    const items = Array.from({ length: 30 }, (_, index) => index + 1)
    expect(paginate(items, 1)).toHaveLength(12)
    expect(paginate(items, 3)).toEqual([25, 26, 27, 28, 29, 30])
    expect(pageCount(30)).toBe(3)
    expect(pageCount(0)).toBe(1)
  })

  it('ramène une page hors limites sur une page valide', () => {
    expect(clampPage(999, 3)).toBe(3)
    expect(clampPage(2, 3)).toBe(2)
    expect(clampPage(0, 3)).toBe(1)
    expect(clampPage(5, 0)).toBe(1)
  })

  it('affiche des ellipses dans la pagination', () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3])
    expect(visiblePages(5, 10)).toEqual([1, null, 4, 5, 6, null, 10])
  })
})
