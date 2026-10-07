/**
 * Logique pure du panier (F3) : format du cookie et règles de quantité.
 *
 * Le cookie est limité à ~4 Ko : on n'y stocke que { id, qty } par ligne
 * (≈ 20 octets par produit). Titre, prix, catégorie et stock sont rechargés depuis l'API.
 */
import type { Product } from '~/types/dummyjson'
import type { CartLine } from './promotions'
import { toCents } from './money'

/** Ce qui est réellement stocké dans le cookie */
export interface CookieCartLine {
  id: number
  qty: number
}

/** Informations produit nécessaires à l'affichage et au calcul du panier */
export type CartProduct = Pick<Product, 'id' | 'title' | 'price' | 'category' | 'stock' | 'thumbnail'>

export const CART_PRODUCT_FIELDS = ['title', 'price', 'category', 'stock', 'thumbnail'] as const

/** Limite de lignes pour rester très en dessous des 4 Ko du cookie */
export const MAX_CART_LINES = 50

function isCookieCartLine(value: unknown): value is CookieCartLine {
  if (typeof value !== 'object' || value === null) return false
  if (!('id' in value) || !('qty' in value)) return false
  return (
    Number.isInteger(value.id) &&
    Number.isInteger(value.qty) &&
    Number(value.id) > 0 &&
    Number(value.qty) > 0
  )
}

/**
 * Le cookie vient du navigateur : son contenu est `unknown` et peut avoir été modifié.
 * On ne garde que les lignes valides.
 */
export function parseCartCookie(value: unknown): CookieCartLine[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(isCookieCartLine)
    .map((line) => ({ id: line.id, qty: line.qty }))
    .slice(0, MAX_CART_LINES)
}

export type QuantityCheck = { ok: true; quantity: number } | { ok: false; quantity: number; message: string }

/** Vérifie qu'une quantité demandée respecte le stock. Renvoie la quantité autorisée. */
export function checkQuantity(requested: number, stock: number, title: string): QuantityCheck {
  if (stock <= 0) {
    return { ok: false, quantity: 0, message: `« ${title} » est en rupture de stock.` }
  }
  if (requested > stock) {
    return {
      ok: false,
      quantity: stock,
      message: `Seulement ${stock} « ${title} » en stock : quantité ramenée à ${stock}.`,
    }
  }
  return { ok: true, quantity: Math.max(1, Math.floor(requested)) }
}

/** Ajoute ou remplace la quantité d'un produit (lignes immuables) */
export function upsertLine(lines: CookieCartLine[], id: number, qty: number): CookieCartLine[] {
  if (qty <= 0) {
    return lines.filter((line) => line.id !== id)
  }
  const exists = lines.some((line) => line.id === id)
  if (!exists) {
    return [...lines, { id, qty }]
  }
  return lines.map((line) => (line.id === id ? { id, qty } : line))
}

export function countItems(lines: CookieCartLine[]): number {
  return lines.reduce((total, line) => total + line.qty, 0)
}

/** Convertit les lignes du cookie en entrée du moteur de promotions */
export function toPromotionLines(
  lines: CookieCartLine[],
  products: Record<number, CartProduct>,
): CartLine[] {
  return lines.flatMap((line) => {
    const product = products[line.id]
    if (!product) return []
    return [
      {
        productId: line.id,
        category: product.category,
        unitPriceCents: toCents(product.price),
        quantity: line.qty,
      },
    ]
  })
}
