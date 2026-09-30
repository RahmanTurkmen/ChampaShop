/**
 * Fonctions pures de manipulation des montants.
 * Tous les calculs se font en centimes (entiers) pour éviter les erreurs d'arrondi des flottants.
 */

/** Convertit un prix DummyJSON (ex. : 9.99) en centimes (999). */
export function toCents(price: number): number {
  return Math.round(price * 100)
}

/**
 * Calcule `percent` % d'un montant en centimes, arrondi au centime
 * avec l'arrondi commercial (demi vers le haut).
 * Calcul entier : round(a × p / 100) = floor((2 × a × p + 100) / 200)
 */
export function percentOfCents(amountCents: number, percent: number): number {
  return Math.floor((2 * amountCents * percent + 100) / 200)
}

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** Formate un montant en centimes : 1234 → « 12,34 € » */
export function formatCents(cents: number): string {
  return euroFormatter.format(cents / 100)
}

/** Formate un prix DummyJSON (en unités) : 12.5 → « 12,50 € » */
export function formatPrice(price: number): string {
  return formatCents(toCents(price))
}
