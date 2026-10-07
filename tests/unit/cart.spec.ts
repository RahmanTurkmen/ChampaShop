import { describe, expect, it } from 'vitest'
import {
  MAX_CART_LINES,
  checkQuantity,
  countItems,
  parseCartCookie,
  toPromotionLines,
  upsertLine,
} from '../../app/utils/cart'

describe('parseCartCookie', () => {
  it('rejette tout ce qui n’est pas un tableau', () => {
    expect(parseCartCookie(null)).toEqual([])
    expect(parseCartCookie('abc')).toEqual([])
    expect(parseCartCookie({ id: 1 })).toEqual([])
  })

  it('ne garde que les lignes valides', () => {
    expect(
      parseCartCookie([{ id: 1, qty: 2 }, { id: 'x', qty: 1 }, { id: 2, qty: 0 }, null, { id: 3 }, { id: 4, qty: 1.5 }]),
    ).toEqual([{ id: 1, qty: 2 }])
  })

  it('limite le nombre de lignes (taille du cookie)', () => {
    const many = Array.from({ length: MAX_CART_LINES + 10 }, (_, index) => ({ id: index + 1, qty: 1 }))
    expect(parseCartCookie(many)).toHaveLength(MAX_CART_LINES)
  })
})

describe('checkQuantity', () => {
  it('accepte une quantité dans le stock', () => {
    expect(checkQuantity(2, 5, 'Crème')).toEqual({ ok: true, quantity: 2 })
  })

  it('ramène au stock avec un message', () => {
    const result = checkQuantity(8, 5, 'Crème')
    expect(result.ok).toBe(false)
    expect(result.quantity).toBe(5)
  })

  it('refuse un produit en rupture', () => {
    expect(checkQuantity(1, 0, 'Crème')).toMatchObject({ ok: false, quantity: 0 })
  })
})

describe('upsertLine et countItems', () => {
  it('ajoute, modifie et supprime', () => {
    let lines = upsertLine([], 1, 2)
    lines = upsertLine(lines, 2, 1)
    lines = upsertLine(lines, 1, 3)
    expect(lines).toEqual([{ id: 1, qty: 3 }, { id: 2, qty: 1 }])
    expect(countItems(lines)).toBe(4)
    expect(upsertLine(lines, 1, 0)).toEqual([{ id: 2, qty: 1 }])
  })
})

describe('toPromotionLines', () => {
  it('convertit en centimes et ignore les produits non chargés', () => {
    const products = { 1: { id: 1, title: 'Crème', price: 9.99, category: 'beauty', stock: 3, thumbnail: '' } }
    expect(toPromotionLines([{ id: 1, qty: 2 }, { id: 2, qty: 1 }], products)).toEqual([
      { productId: 1, category: 'beauty', unitPriceCents: 999, quantity: 2 },
    ])
  })
})
