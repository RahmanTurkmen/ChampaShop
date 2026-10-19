/**
 * Logique pure du tableau comparatif (F6) : construction des lignes, meilleure valeur
 * et détection des lignes identiques. Le composant CompareTable.vue ne fait qu'afficher.
 */
import type { Dimensions, Product } from '~/types/dummyjson'
import { formatPrice } from './money'
import { discountBadge } from './stock'

export type CompareRowKey =
  | 'price'
  | 'discount'
  | 'rating'
  | 'availability'
  | 'brand'
  | 'category'
  | 'weight'
  | 'dimensions'
  | 'warranty'
  | 'shipping'

export interface CompareCell {
  text: string
  /** true si c'est la meilleure valeur de la ligne (prix le plus bas, etc.) */
  best: boolean
}

export interface CompareRow {
  key: CompareRowKey
  label: string
  cells: CompareCell[]
  /** Libellé texte de la meilleure valeur (« Meilleur prix ») : jamais seulement une couleur */
  bestLabel: string | null
  /** true si toutes les cellules sont identiques (masquée avec « uniquement les différences ») */
  identical: boolean
}

export type BestRule = 'min' | 'max'

/**
 * Indices de la meilleure valeur (plusieurs en cas d'égalité).
 * Aucun gagnant s'il y a moins de 2 valeurs ou si toutes sont égales : mettre en avant
 * « Meilleur prix » sur des prix identiques n'apporterait rien.
 */
export function bestIndexes(values: number[], rule: BestRule): number[] {
  if (values.length < 2) return []
  const best = rule === 'min' ? Math.min(...values) : Math.max(...values)
  const winners = values.flatMap((value, index) => (value === best ? [index] : []))
  return winners.length === values.length ? [] : winners
}

/** true si toutes les valeurs affichées sont identiques (une seule valeur : identique) */
export function isIdentical(texts: string[]): boolean {
  return texts.every((text) => text === texts[0])
}

const AVAILABILITY_LABELS: Record<string, string> = {
  'In Stock': 'En stock',
  'Low Stock': 'Stock faible',
  'Out of Stock': 'Rupture de stock',
}

/** Traduit availabilityStatus de DummyJSON ; une valeur inconnue est affichée telle quelle */
export function availabilityLabel(status: string): string {
  return AVAILABILITY_LABELS[status] ?? status
}

/** Dimensions l × h × p. DummyJSON ne précise pas l'unité : on n'en invente pas. */
export function formatDimensions(dimensions: Dimensions): string {
  return `${dimensions.width} × ${dimensions.height} × ${dimensions.depth}`
}

interface RowDefinition {
  key: CompareRowKey
  label: string
  text: (product: Product) => string
  /** Valeur numérique comparée pour la meilleure valeur, avec la règle et le libellé */
  best?: { value: (product: Product) => number; rule: BestRule; label: string }
}

const ROWS: RowDefinition[] = [
  {
    key: 'price',
    label: 'Prix',
    text: (product) => formatPrice(product.price),
    best: { value: (product) => product.price, rule: 'min', label: 'Meilleur prix' },
  },
  {
    key: 'discount',
    label: 'Remise',
    text: (product) => discountBadge(product.discountPercentage) ?? 'Aucune',
  },
  {
    key: 'rating',
    label: 'Note',
    text: (product) => `${product.rating.toFixed(1)} / 5`,
    best: { value: (product) => product.rating, rule: 'max', label: 'Meilleure note' },
  },
  {
    key: 'availability',
    label: 'Disponibilité',
    text: (product) => `${availabilityLabel(product.availabilityStatus)} (${product.stock} en stock)`,
    best: { value: (product) => product.stock, rule: 'max', label: 'Stock le plus élevé' },
  },
  { key: 'brand', label: 'Marque', text: (product) => product.brand ?? 'Non renseignée' },
  { key: 'category', label: 'Catégorie', text: (product) => product.category },
  { key: 'weight', label: 'Poids', text: (product) => String(product.weight) },
  {
    key: 'dimensions',
    label: 'Dimensions (l × h × p)',
    text: (product) => formatDimensions(product.dimensions),
  },
  { key: 'warranty', label: 'Garantie', text: (product) => product.warrantyInformation },
  { key: 'shipping', label: 'Livraison', text: (product) => product.shippingInformation },
]

/** Construit les lignes du tableau, une cellule par produit, dans l'ordre des produits */
export function buildCompareRows(products: Product[]): CompareRow[] {
  return ROWS.map((row): CompareRow => {
    const texts = products.map(row.text)
    const winners = row.best ? bestIndexes(products.map(row.best.value), row.best.rule) : []
    return {
      key: row.key,
      label: row.label,
      cells: texts.map((text, index) => ({ text, best: winners.includes(index) })),
      bestLabel: winners.length > 0 && row.best ? row.best.label : null,
      identical: isIdentical(texts),
    }
  })
}

/** Lignes à afficher : toutes, ou seulement celles qui diffèrent d'un produit à l'autre */
export function visibleCompareRows(rows: CompareRow[], onlyDifferences: boolean): CompareRow[] {
  return onlyDifferences ? rows.filter((row) => !row.identical) : rows
}
