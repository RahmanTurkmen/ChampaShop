import { describe, expect, it } from 'vitest'
import {
  computeBeautyDiscount,
  computeCart,
  computeShipping,
  evaluatePromoCode,
  normalizePromoCode,
  type CartLine,
} from '../../app/utils/promotions'

/** Crée une ligne de panier : line('beauty', 9.99, 3) */
function line(category: string, price: number, quantity: number, productId = 1): CartLine {
  return { productId, category, unitPriceCents: Math.round(price * 100), quantity }
}

function discountOf(summary: ReturnType<typeof computeCart>, id: 'BEAUTY_3' | 'TROYES10'): number {
  return summary.discounts.find((discount) => discount.id === id)?.amountCents ?? 0
}

describe('computeCart : scénarios d’acceptation du sujet', () => {
  it('1. 3 × beauty à 9,99 sans code', () => {
    const summary = computeCart([line('beauty', 9.99, 3)])
    expect(summary.grossCents).toBe(2997)
    expect(discountOf(summary, 'BEAUTY_3')).toBe(300)
    expect(discountOf(summary, 'TROYES10')).toBe(0)
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(3187)
  })

  it('2. 3 × beauty à 19,99 avec TROYES10 : code réduit par le plafond de 25 %', () => {
    const summary = computeCart([line('beauty', 19.99, 3)], 'TROYES10')
    expect(summary.grossCents).toBe(5997)
    expect(discountOf(summary, 'BEAUTY_3')).toBe(600)
    expect(discountOf(summary, 'TROYES10')).toBe(899)
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(4988)
    expect(summary.messages).toHaveLength(1)
    expect(summary.messages[0]).toContain('25 %')
  })

  it('3. 1 × beauty à 39,00 + 1 × groceries à 15,00 avec TROYES10', () => {
    const summary = computeCart(
      [line('beauty', 39, 1, 1), line('groceries', 15, 1, 2)],
      'TROYES10',
    )
    expect(summary.grossCents).toBe(5400)
    expect(discountOf(summary, 'BEAUTY_3')).toBe(0)
    expect(discountOf(summary, 'TROYES10')).toBe(1000)
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(4890)
  })

  it('4. 1 × furniture à 89,99 avec TROYES10 : pas de livraison offerte', () => {
    const summary = computeCart([line('furniture', 89.99, 1)], 'TROYES10')
    expect(summary.grossCents).toBe(8999)
    expect(discountOf(summary, 'TROYES10')).toBe(1000)
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(8489)
  })

  it('5. 2 × laptops à 45,00 avec TROYES10 : livraison offerte à 80,00 € pile', () => {
    const summary = computeCart([line('laptops', 45, 2)], 'TROYES10')
    expect(summary.grossCents).toBe(9000)
    expect(discountOf(summary, 'TROYES10')).toBe(1000)
    expect(summary.shippingCents).toBe(0)
    expect(summary.totalCents).toBe(8000)
  })

  it('6. 4 × beauty à 12,50 avec TROYES10 : code refusé (45,00 € après remise)', () => {
    const summary = computeCart([line('beauty', 12.5, 4)], 'TROYES10')
    expect(summary.grossCents).toBe(5000)
    expect(discountOf(summary, 'BEAUTY_3')).toBe(500)
    expect(discountOf(summary, 'TROYES10')).toBe(0)
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(4990)
    expect(summary.messages).toHaveLength(1)
    expect(summary.messages[0]).toContain('TROYES10')
  })

  it('7. 2 × groceries à 30,00 avec " troyes10 " : casse et espaces ignorés', () => {
    const summary = computeCart([line('groceries', 30, 2)], ' troyes10 ')
    expect(summary.grossCents).toBe(6000)
    expect(discountOf(summary, 'TROYES10')).toBe(1000)
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(5490)
    expect(summary.messages).toEqual([])
  })

  it('8. 1 × groceries à 79,99 sans code', () => {
    const summary = computeCart([line('groceries', 79.99, 1)])
    expect(summary.grossCents).toBe(7999)
    expect(summary.discounts).toEqual([])
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(8489)
  })
})

describe('computeCart : cas limites', () => {
  it('panier vide : tout est à zéro, pas de frais de livraison', () => {
    expect(computeCart([])).toEqual({
      grossCents: 0,
      discounts: [],
      shippingCents: 0,
      totalCents: 0,
      messages: [],
    })
  })

  it('panier vide avec un code : le code est refusé et expliqué', () => {
    const summary = computeCart([], 'TROYES10')
    expect(summary.totalCents).toBe(0)
    expect(summary.messages).toHaveLength(1)
  })

  it('code inconnu : refusé avec un message', () => {
    const summary = computeCart([line('groceries', 60, 1)], 'PROMO50')
    expect(summary.discounts).toEqual([])
    expect(summary.messages).toEqual(['Le code « PROMO50 » n\'existe pas.'])
    expect(summary.totalCents).toBe(6490)
  })

  it('code vide ou composé d’espaces : ignoré sans message', () => {
    expect(computeCart([line('groceries', 60, 1)], '   ').messages).toEqual([])
    expect(computeCart([line('groceries', 60, 1)], '').messages).toEqual([])
  })

  it('quantités à 0 ou négatives : lignes ignorées', () => {
    const summary = computeCart([line('beauty', 10, 0), line('beauty', 10, -2), line('beauty', 10, 1)])
    expect(summary.grossCents).toBe(1000)
    expect(summary.discounts).toEqual([])
  })

  it('panier ne contenant que des quantités à 0 : considéré comme vide', () => {
    expect(computeCart([line('groceries', 10, 0)]).shippingCents).toBe(0)
  })

  it('remise beauté : les quantités sont cumulées sur plusieurs lignes', () => {
    const summary = computeCart([line('beauty', 10, 2, 1), line('beauty', 5, 1, 2)])
    // 10 % de 20,00 = 2,00 et 10 % de 5,00 = 0,50
    expect(discountOf(summary, 'BEAUTY_3')).toBe(250)
  })

  it('remise beauté : seules les lignes beauty sont remisées', () => {
    const summary = computeCart([line('beauty', 10, 3, 1), line('groceries', 20, 1, 2)])
    expect(discountOf(summary, 'BEAUTY_3')).toBe(300)
  })

  it('code TROYES10 : refusé à 50,00 € pile (strictement supérieur exigé)', () => {
    expect(computeCart([line('groceries', 50, 1)], 'TROYES10').messages).toHaveLength(1)
    expect(discountOf(computeCart([line('groceries', 50.01, 1)], 'TROYES10'), 'TROYES10')).toBe(1000)
  })

  it('livraison : offerte à partir de 80,00 € après remises', () => {
    expect(computeCart([line('groceries', 80, 1)]).shippingCents).toBe(0)
    expect(computeCart([line('groceries', 79.99, 1)]).shippingCents).toBe(490)
  })

  it('livraison : jamais offerte si le panier contient du furniture', () => {
    const summary = computeCart([line('furniture', 100, 1, 1), line('groceries', 100, 1, 2)])
    expect(summary.shippingCents).toBe(490)
  })

  it('les libellés de remise expliquent la raison', () => {
    const summary = computeCart([line('beauty', 30, 3)], 'TROYES10')
    expect(summary.discounts.map((discount) => discount.id)).toEqual(['BEAUTY_3', 'TROYES10'])
    for (const discount of summary.discounts) {
      expect(discount.label.length).toBeGreaterThan(0)
    }
  })
})

describe('fonctions internes du moteur', () => {
  it('normalizePromoCode', () => {
    expect(normalizePromoCode(' troyes10 ')).toBe('TROYES10')
    expect(normalizePromoCode(undefined)).toBe('')
  })

  it('computeBeautyDiscount : arrondi commercial ligne par ligne', () => {
    // 10 % de 0,05 = 0,005 → arrondi à 0,01
    expect(computeBeautyDiscount([line('beauty', 0.05, 1, 1), line('beauty', 0.05, 2, 2)])).toBe(2)
    expect(computeBeautyDiscount([line('beauty', 10, 2)])).toBe(0)
  })

  it('evaluatePromoCode', () => {
    expect(evaluatePromoCode('TROYES10', 5001)).toEqual({ accepted: true, amountCents: 1000 })
    expect(evaluatePromoCode('TROYES10', 5000).accepted).toBe(false)
    expect(evaluatePromoCode('AUTRE', 9000).accepted).toBe(false)
  })

  it('computeShipping', () => {
    expect(computeShipping([], 0)).toBe(0)
    expect(computeShipping([line('groceries', 90, 1)], 9000)).toBe(0)
    expect(computeShipping([line('furniture', 90, 1)], 9000)).toBe(490)
  })
})
