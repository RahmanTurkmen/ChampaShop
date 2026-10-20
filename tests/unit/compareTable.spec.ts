import { describe, expect, it } from 'vitest'
import type { Product } from '../../app/types/dummyjson'
import { formatPrice } from '../../app/utils/money'
import {
  availabilityLabel,
  bestIndexes,
  buildCompareRows,
  formatDimensions,
  isIdentical,
  visibleCompareRows,
  type CompareRow,
  type CompareRowKey,
} from '../../app/utils/compareTable'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Produit',
    description: '',
    category: 'beauty',
    price: 10,
    discountPercentage: 0,
    rating: 4,
    stock: 20,
    tags: [],
    brand: 'Essence',
    sku: 'SKU',
    weight: 2,
    dimensions: { width: 10, height: 20, depth: 5 },
    warrantyInformation: '1 year warranty',
    shippingInformation: 'Ships in 1 week',
    availabilityStatus: 'In Stock',
    reviews: [],
    returnPolicy: '',
    minimumOrderQuantity: 1,
    meta: { createdAt: '', updatedAt: '', barcode: '', qrCode: '' },
    images: [],
    thumbnail: '',
    ...overrides,
  }
}

function row(rows: CompareRow[], key: CompareRowKey): CompareRow {
  const found = rows.find((current) => current.key === key)
  if (!found) throw new Error(`Ligne ${key} absente`)
  return found
}

describe('bestIndexes', () => {
  it('trouve le minimum ou le maximum', () => {
    expect(bestIndexes([30, 10, 20], 'min')).toEqual([1])
    expect(bestIndexes([3.5, 4.8, 4.1], 'max')).toEqual([1])
  })

  it('garde tous les gagnants en cas d’égalité', () => {
    expect(bestIndexes([10, 30, 10], 'min')).toEqual([0, 2])
  })

  it('aucun gagnant si toutes les valeurs sont égales', () => {
    expect(bestIndexes([10, 10, 10], 'min')).toEqual([])
  })

  it('aucun gagnant avec moins de 2 valeurs', () => {
    expect(bestIndexes([10], 'max')).toEqual([])
    expect(bestIndexes([], 'max')).toEqual([])
  })
})

describe('isIdentical', () => {
  it('détecte des valeurs identiques ou différentes', () => {
    expect(isIdentical(['a', 'a', 'a'])).toBe(true)
    expect(isIdentical(['a', 'b', 'a'])).toBe(false)
  })

  it('une seule valeur (ou aucune) est considérée comme identique', () => {
    expect(isIdentical(['a'])).toBe(true)
    expect(isIdentical([])).toBe(true)
  })
})

describe('availabilityLabel et formatDimensions', () => {
  it('traduit les statuts connus et garde les autres tels quels', () => {
    expect(availabilityLabel('In Stock')).toBe('En stock')
    expect(availabilityLabel('Low Stock')).toBe('Stock faible')
    expect(availabilityLabel('Out of Stock')).toBe('Rupture de stock')
    expect(availabilityLabel('Preorder')).toBe('Preorder')
  })

  it('écrit les dimensions l × h × p', () => {
    expect(formatDimensions({ width: 15.14, height: 13.08, depth: 22.99 })).toBe('15.14 × 13.08 × 22.99')
  })
})

describe('buildCompareRows', () => {
  const products = [
    makeProduct({ id: 1, price: 30, rating: 4.5, stock: 5 }),
    makeProduct({ id: 2, price: 10, rating: 3.2, stock: 50, brand: undefined }),
    makeProduct({ id: 3, price: 20, rating: 4.5, stock: 0, availabilityStatus: 'Out of Stock' }),
  ]
  const rows = buildCompareRows(products)

  it('construit toutes les lignes dans l’ordre attendu', () => {
    expect(rows.map((current) => current.key)).toEqual([
      'price',
      'discount',
      'rating',
      'availability',
      'brand',
      'category',
      'weight',
      'dimensions',
      'warranty',
      'shipping',
    ])
  })

  it('une cellule par produit, dans l’ordre des produits', () => {
    expect(row(rows, 'price').cells.map((cell) => cell.text)).toEqual([formatPrice(30), formatPrice(10), formatPrice(20)])
  })

  it('met en avant le prix le plus bas avec un libellé texte', () => {
    const price = row(rows, 'price')
    expect(price.cells.map((cell) => cell.best)).toEqual([false, true, false])
    expect(price.bestLabel).toBe('Meilleur prix')
  })

  it('met en avant la note la plus haute, égalités comprises', () => {
    const rating = row(rows, 'rating')
    expect(rating.cells.map((cell) => cell.best)).toEqual([true, false, true])
    expect(rating.bestLabel).toBe('Meilleure note')
    expect(rating.cells[0]?.text).toBe('4.5 / 5')
  })

  it('met en avant le stock le plus élevé et affiche la disponibilité traduite', () => {
    const availability = row(rows, 'availability')
    expect(availability.cells.map((cell) => cell.best)).toEqual([false, true, false])
    expect(availability.bestLabel).toBe('Stock le plus élevé')
    expect(availability.cells[2]?.text).toBe('Rupture de stock (0 en stock)')
  })

  it('pas de meilleure valeur sur les lignes descriptives', () => {
    expect(row(rows, 'brand').bestLabel).toBeNull()
    expect(row(rows, 'brand').cells.every((cell) => !cell.best)).toBe(true)
  })

  it('affiche les valeurs absentes ou nulles avec un texte', () => {
    expect(row(rows, 'brand').cells[1]?.text).toBe('Non renseignée')
    expect(row(rows, 'discount').cells[0]?.text).toBe('Aucune')
    const discounted = buildCompareRows([makeProduct({ discountPercentage: 12.48 })])
    expect(row(discounted, 'discount').cells[0]?.text).toBe('−12 %')
  })

  it('marque les lignes identiques', () => {
    expect(row(rows, 'category').identical).toBe(true)
    expect(row(rows, 'warranty').identical).toBe(true)
    expect(row(rows, 'price').identical).toBe(false)
    expect(row(rows, 'brand').identical).toBe(false)
  })

  it('aucune meilleure valeur quand toutes les valeurs sont égales', () => {
    const same = buildCompareRows([makeProduct({ id: 1 }), makeProduct({ id: 2 })])
    expect(row(same, 'price').bestLabel).toBeNull()
    expect(row(same, 'price').identical).toBe(true)
  })

  it('renvoie des lignes vides sans produit', () => {
    const empty = buildCompareRows([])
    expect(empty).toHaveLength(10)
    expect(empty.every((current) => current.cells.length === 0)).toBe(true)
  })
})

describe('visibleCompareRows', () => {
  const rows = buildCompareRows([makeProduct({ id: 1, price: 10 }), makeProduct({ id: 2, price: 20 })])

  it('garde toutes les lignes par défaut', () => {
    expect(visibleCompareRows(rows, false)).toHaveLength(rows.length)
  })

  it('masque les lignes identiques avec « uniquement les différences »', () => {
    const visible = visibleCompareRows(rows, true)
    expect(visible.map((current) => current.key)).toEqual(['price'])
  })
})
