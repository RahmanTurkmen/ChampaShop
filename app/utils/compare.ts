/**
 * Logique pure du comparateur (F6) : validation de la sélection et ajout / retrait.
 *
 * La sélection vient du cookie « compare » ou de l'URL (?ids=3,17,42) : son contenu est
 * `unknown` et peut avoir été modifié à la main. On ne garde que des identifiants valides.
 */

/** Nombre maximum de produits comparés */
export const MAX_COMPARE = 3

export interface ToggleCompareResult {
  ids: number[]
  /** true si l'ajout a été refusé parce que le comparateur est plein */
  rejected: boolean
}

/** Identifiant de produit valide : entier strictement positif */
function isValidId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0
}

/**
 * Convertit une valeur en identifiant, ou null si elle n'en est pas un.
 * Les chaînes doivent ne contenir que des chiffres : "1.5", "3abc", "" ou "0x10" sont refusées
 * (Number("") vaut 0 et Number("0x10") vaut 16, d'où le test par expression régulière).
 */
function toId(value: unknown): number | null {
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

/**
 * Lit une sélection : tableau (cookie JSON, ?ids=1&ids=2) ou chaîne "3,17,42".
 * Ignore les valeurs invalides, supprime les doublons (le premier est gardé),
 * conserve l'ordre et tronque à `max`.
 */
export function parseCompareIds(raw: unknown, max = MAX_COMPARE): number[] {
  let candidates: unknown[] = []
  if (Array.isArray(raw)) {
    candidates = raw
  } else if (typeof raw === 'string') {
    candidates = raw.split(',')
  } else if (typeof raw === 'number') {
    // Un cookie "5" est décodé en nombre par useCookie
    candidates = [raw]
  }

  const ids: number[] = []
  for (const candidate of candidates) {
    if (ids.length >= max) break
    const id = toId(candidate)
    if (id !== null && !ids.includes(id)) {
      ids.push(id)
    }
  }
  return ids
}

/**
 * Ajoute ou retire `id` de la sélection.
 * - déjà présent : retiré ;
 * - absent et place disponible : ajouté à la fin ;
 * - absent et comparateur plein : rien ne change et `rejected` vaut true.
 * Ne modifie jamais le tableau reçu.
 */
export function toggleCompare(ids: number[], id: number, max = MAX_COMPARE): ToggleCompareResult {
  if (ids.includes(id)) {
    return { ids: ids.filter((current) => current !== id), rejected: false }
  }
  if (!isValidId(id)) {
    return { ids: [...ids], rejected: false }
  }
  if (ids.length >= max) {
    return { ids: [...ids], rejected: true }
  }
  return { ids: [...ids, id], rejected: false }
}

/** Lien vers la page de comparaison : /comparer?ids=3,17,42 */
export function compareLink(ids: number[]): string {
  return `/comparer?ids=${ids.join(',')}`
}
