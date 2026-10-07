/**
 * Logique pure du « rejeu après 401 » (F5) : extraite du store pour être testable
 * sans dépendance à Nuxt (useCookie, $fetch, etc. restent côté store).
 */
export interface AuthFetchDeps<T> {
  getToken: () => string | null
  hasRefreshToken: () => boolean
  isUnauthorized: (error: unknown) => boolean
  refresh: () => Promise<void>
  request: (token: string | null) => Promise<T>
}

/**
 * Essaie la requête avec le token courant. Sur 401 : rafraîchit (sauf si un autre appel
 * l'a déjà fait entre-temps) puis rejoue une seule fois avec le nouveau token.
 */
export async function authFetchWithRetry<T>(deps: AuthFetchDeps<T>): Promise<T> {
  const usedToken = deps.getToken()
  try {
    return await deps.request(usedToken)
  } catch (error) {
    if (!deps.isUnauthorized(error) || !deps.hasRefreshToken()) {
      throw error
    }
    // Si une autre requête a déjà obtenu un nouveau token, inutile de rafraîchir à nouveau
    if (deps.getToken() === usedToken) {
      await deps.refresh()
    }
    return await deps.request(deps.getToken())
  }
}
