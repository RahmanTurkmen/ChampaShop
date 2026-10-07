/** Affichage du stock sur la fiche produit (F2). */

export const LOW_STOCK_THRESHOLD = 5

export interface StockStatus {
  available: boolean
  label: string
  level: 'out' | 'low' | 'ok'
}

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) {
    return { available: false, label: 'Rupture de stock', level: 'out' }
  }
  if (stock < LOW_STOCK_THRESHOLD) {
    return { available: true, label: `Plus que ${stock} en stock`, level: 'low' }
  }
  return { available: true, label: 'En stock', level: 'ok' }
}

/** Arrondit un pourcentage de remise pour le badge : 12.48 → 12 */
export function discountBadge(discountPercentage: number): string | null {
  const rounded = Math.round(discountPercentage)
  return rounded > 0 ? `−${rounded} %` : null
}
