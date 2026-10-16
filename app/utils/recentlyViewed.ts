/**
 * Logique pure de l'historique « vus récemment » (F7) : lecture du cookie et mise à jour.
 *
 * Le cookie « recently_viewed » ne stocke que des identifiants (pas les produits), et son
 * contenu est `unknown` : il peut avoir été modifié ou corrompu à la main.
 */

import { isValidId, toId } from './ids'

export const MAX_RECENTLY_VIEWED = 10

/**
 * Lit l'historique : tableau (cookie JSON) ou chaîne "3,17,42".
 * Toute entrée qui n'est ni un tableau ni une chaîne ni un nombre (JSON invalide, objet
 * inattendu…) est traitée comme un historique vide plutôt que de faire planter la page.
 * Ignore les valeurs invalides, supprime les doublons (le premier gardé) et tronque au maximum.
 */
export function parseRecentlyViewedCookie(raw: unknown, max = MAX_RECENTLY_VIEWED): number[] {
  let candidates: unknown[] = []
  if (Array.isArray(raw)) {
    candidates = raw
  } else if (typeof raw === 'string') {
    candidates = raw.split(',')
  } else if (typeof raw === 'number') {
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
 * Place `id` en tête de l'historique (remonté s'il y était déjà présent), tronqué à `max`
 * (le plus ancien sort). Ne modifie jamais le tableau reçu.
 */
export function pushRecentlyViewed(ids: number[], id: number, max = MAX_RECENTLY_VIEWED): number[] {
  if (!isValidId(id)) {
    return [...ids]
  }
  const withoutId = ids.filter((current) => current !== id)
  return [id, ...withoutId].slice(0, max)
}
