/**
 * Validation et parsing d'identifiants de produit, partagés entre le comparateur (F6) et
 * l'historique « vus récemment » (F7) : les deux lisent un cookie `unknown` qui peut avoir
 * été modifié ou corrompu à la main.
 */

/** Identifiant de produit valide : entier strictement positif */
export function isValidId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0
}

/**
 * Convertit une valeur en identifiant, ou null si elle n'en est pas un.
 * Les chaînes doivent ne contenir que des chiffres : "1.5", "3abc", "" ou "0x10" sont refusées
 * (Number("") vaut 0 et Number("0x10") vaut 16, d'où le test par expression régulière).
 */
export function toId(value: unknown): number | null {
  if (typeof value === 'number') {
    return isValidId(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!/^\d+$/.test(trimmed)) return null
    const id = Number(trimmed)
    return isValidId(id) ? id : null
  }
  return null
}
