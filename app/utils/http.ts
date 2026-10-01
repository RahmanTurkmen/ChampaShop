/**
 * Lecture sûre du code HTTP d'une erreur.
 * Les erreurs sont de type `unknown` : on vérifie leur forme avant de les utiliser.
 */
export function getHttpStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null
  if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode
  if ('status' in error && typeof error.status === 'number') return error.status
  return null
}

export function isUnauthorized(error: unknown): boolean {
  return getHttpStatus(error) === 401
}
