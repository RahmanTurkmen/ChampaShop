/**
 * « Single-flight » : tant qu'une exécution de `task` est en cours, tous les appelants
 * reçoivent la MÊME promesse. Utilisé pour le rafraîchissement du token (F5) :
 * si 3 requêtes reçoivent une 401 en même temps, un seul POST /auth/refresh part.
 */
export function createSingleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null

  return () => {
    if (inFlight === null) {
      inFlight = task().finally(() => {
        inFlight = null
      })
    }
    return inFlight
  }
}
