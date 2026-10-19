/**
 * Logique pure du comparateur (F6) : validation de la sélection et ajout / retrait.
 *
 * La sélection vient du cookie « compare » ou de l'URL (?ids=3,17,42) : son contenu est
 * `unknown` et peut avoir été modifié à la main. On ne garde que des identifiants valides.
 */
import { isValidId, toId } from './ids'

/** Nombre maximum de produits comparés */
export const MAX_COMPARE = 3

export interface ToggleCompareResult {
  ids: number[]
  /** true si l'ajout a été refusé parce que le comparateur est plein */
  rejected: boolean
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

/**
 * Lit `route.query.ids` de la page /comparer : "3,17,42", ou plusieurs paramètres
 * (?ids=3,17&ids=42 donne un tableau), ou absent. Les morceaux sont réunis puis validés
 * comme une seule liste, avec les mêmes règles que le cookie.
 */
export function parseCompareQuery(raw: unknown, max = MAX_COMPARE): number[] {
  if (Array.isArray(raw)) {
    const parts = raw.filter((part): part is string => typeof part === 'string')
    return parseCompareIds(parts.join(','), max)
  }
  return parseCompareIds(raw, max)
}

/** Valeur canonique du paramètre `ids` : "3,17,42", ou undefined (paramètre absent) si vide */
export function canonicalCompareQuery(ids: number[]): string | undefined {
  return ids.length > 0 ? ids.join(',') : undefined
}

/**
 * true si l'URL doit être réécrite : elle contient des identifiants ignorés (invalides,
 * doublons, au-delà du maximum, inexistants) ou n'est pas écrite sous la forme "3,17,42".
 */
export function compareQueryNeedsNormalization(raw: unknown, ids: number[]): boolean {
  const canonical = canonicalCompareQuery(ids)
  if (canonical === undefined) return raw !== undefined
  return raw !== canonical
}

/**
 * Même sélection, quel que soit l'ordre ? (cookie du visiteur et URL d'un lien partagé)
 * L'ordre n'est qu'un choix d'affichage : on ne propose pas de remplacer pour si peu.
 */
export function sameCompareSelection(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id))
}
