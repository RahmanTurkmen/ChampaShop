/**
 * Moteur de promotions de ChampaShop (F4).
 *
 * Fonction pure TypeScript : aucune dépendance à Vue, Nuxt ou Pinia.
 * Elle est appelée par le store du panier et testée dans tests/unit/promotions.spec.ts.
 *
 * ⚠️ En production, ce calcul devrait être fait côté serveur (API) :
 * un calcul côté client peut être contourné par l'utilisateur.
 *
 * Règles, appliquées dans cet ordre :
 *  1. Remise beauté : ≥ 3 articles `beauty` → −10 % sur chaque ligne beauty (arrondi ligne par ligne).
 *  2. Code TROYES10 : −10,00 € si le sous-total après remise beauté est > 50,00 €.
 *  3. Plafond : total des remises ≤ 25 % du brut ; c'est le code promo qui est réduit.
 *  4. Livraison : 4,90 €, offerte dès 80,00 € après remises, sauf si le panier contient du `furniture`.
 */
import { formatCents, percentOfCents } from './money'

export interface CartLine {
  productId: number
  category: string
  unitPriceCents: number
  quantity: number
}

export interface AppliedDiscount {
  id: 'BEAUTY_3' | 'TROYES10'
  label: string
  amountCents: number
}

export interface CartSummary {
  grossCents: number
  discounts: AppliedDiscount[]
  shippingCents: number
  totalCents: number
  messages: string[] // ex. : pourquoi un code est refusé
}

export const BEAUTY_CATEGORY = 'beauty'
export const BEAUTY_MIN_ITEMS = 3
export const BEAUTY_PERCENT = 10

export const PROMO_CODE = 'TROYES10'
export const PROMO_AMOUNT_CENTS = 1000
export const PROMO_MIN_SUBTOTAL_CENTS = 5000

export const DISCOUNT_CAP_PERCENT = 25

export const SHIPPING_CENTS = 490
export const FREE_SHIPPING_THRESHOLD_CENTS = 8000
export const NO_FREE_SHIPPING_CATEGORY = 'furniture'

/** Montant d'une ligne en centimes */
function lineTotalCents(line: CartLine): number {
  return line.unitPriceCents * line.quantity
}

function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/** Les lignes à quantité nulle ou négative sont ignorées. */
function keepValidLines(lines: CartLine[]): CartLine[] {
  return lines.filter((line) => line.quantity > 0 && line.unitPriceCents >= 0)
}

/** « troyes10 » → « TROYES10 » : insensible à la casse et aux espaces autour. */
export function normalizePromoCode(code: string | undefined): string {
  return (code ?? '').trim().toUpperCase()
}

/** Règle 1 : remise beauté, arrondie au centime ligne par ligne. */
export function computeBeautyDiscount(lines: CartLine[]): number {
  const beautyLines = lines.filter((line) => line.category === BEAUTY_CATEGORY)
  const beautyItems = sumCents(beautyLines.map((line) => line.quantity))

  if (beautyItems < BEAUTY_MIN_ITEMS) {
    return 0
  }

  return sumCents(beautyLines.map((line) => percentOfCents(lineTotalCents(line), BEAUTY_PERCENT)))
}

type PromoCodeResult = { accepted: true; amountCents: number } | { accepted: false; reason: string }

/** Règle 2 : validation du code promo sur le sous-total après remise beauté. */
export function evaluatePromoCode(code: string, subtotalAfterBeautyCents: number): PromoCodeResult {
  if (code !== PROMO_CODE) {
    return { accepted: false, reason: `Le code « ${code} » n'existe pas.` }
  }

  if (subtotalAfterBeautyCents <= PROMO_MIN_SUBTOTAL_CENTS) {
    return {
      accepted: false,
      reason:
        `Le code ${PROMO_CODE} est réservé aux paniers de plus de ${formatCents(PROMO_MIN_SUBTOTAL_CENTS)} ` +
        `après remises (actuellement ${formatCents(subtotalAfterBeautyCents)}).`,
    }
  }

  return { accepted: true, amountCents: PROMO_AMOUNT_CENTS }
}

/** Règle 4 : frais de livraison. */
export function computeShipping(lines: CartLine[], afterDiscountsCents: number): number {
  if (lines.length === 0) {
    return 0
  }

  const hasFurniture = lines.some((line) => line.category === NO_FREE_SHIPPING_CATEGORY)
  if (!hasFurniture && afterDiscountsCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0
  }

  return SHIPPING_CENTS
}

export function computeCart(lines: CartLine[], promoCode?: string): CartSummary {
  const validLines = keepValidLines(lines)
  const messages: string[] = []
  const discounts: AppliedDiscount[] = []

  const grossCents = sumCents(validLines.map(lineTotalCents))

  // 1. Remise beauté
  const beautyCents = computeBeautyDiscount(validLines)
  if (beautyCents > 0) {
    discounts.push({
      id: 'BEAUTY_3',
      label: `Remise beauté : −${BEAUTY_PERCENT} % dès ${BEAUTY_MIN_ITEMS} articles beauté`,
      amountCents: beautyCents,
    })
  }

  // 2. Code promo
  let codeCents = 0
  const code = normalizePromoCode(promoCode)
  if (code !== '') {
    const result = evaluatePromoCode(code, grossCents - beautyCents)
    if (result.accepted) {
      codeCents = result.amountCents
    } else {
      messages.push(result.reason)
    }
  }

  // 3. Plafond : on réduit le code promo, jamais la remise beauté
  const capCents = percentOfCents(grossCents, DISCOUNT_CAP_PERCENT)
  if (beautyCents + codeCents > capCents) {
    const reducedCodeCents = Math.max(0, capCents - beautyCents)
    messages.push(
      `Le code ${PROMO_CODE} est ramené à ${formatCents(reducedCodeCents)} : ` +
        `les remises ne peuvent pas dépasser ${DISCOUNT_CAP_PERCENT} % du panier (${formatCents(capCents)}).`,
    )
    codeCents = reducedCodeCents
  }

  if (codeCents > 0) {
    discounts.push({
      id: 'TROYES10',
      label: `Code ${PROMO_CODE} : −${formatCents(PROMO_AMOUNT_CENTS)} dès ${formatCents(PROMO_MIN_SUBTOTAL_CENTS)} d'achat`,
      amountCents: codeCents,
    })
  }

  // 4. Livraison
  const afterDiscountsCents = grossCents - beautyCents - codeCents
  const shippingCents = computeShipping(validLines, afterDiscountsCents)

  return {
    grossCents,
    discounts,
    shippingCents,
    totalCents: afterDiscountsCents + shippingCents,
    messages,
  }
}
