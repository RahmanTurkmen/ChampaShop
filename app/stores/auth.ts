import type { ComputedRef, Ref } from 'vue'
import type { AuthTokens, LoginPayload, LoginResponse, User } from '~/types/dummyjson'
import { getHttpStatus, isUnauthorized } from '~/utils/http'
import { createSingleFlight } from '~/utils/singleFlight'

const ACCESS_COOKIE = 'champashop_access_token'
const REFRESH_COOKIE = 'champashop_refresh_token'
const SEVEN_DAYS = 60 * 60 * 24 * 7

export interface AuthFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
}

export interface AuthStore {
  user: Ref<User | null>
  isLoggedIn: ComputedRef<boolean>
  /** Nombre d'appels réellement envoyés à /auth/refresh (pour vérifier le single-flight) */
  refreshCount: Ref<number>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  authFetch: <T>(path: string, options?: AuthFetchOptions) => Promise<T>
}

/**
 * Store d'authentification (F5).
 * - Tokens stockés en cookies → disponibles lors du rendu serveur.
 * - L'utilisateur est chargé côté serveur (plugin auth) → pas de « flash » déconnecté.
 * - `authFetch` rejoue les requêtes après un rafraîchissement « single-flight » du token.
 */
export const useAuthStore = defineStore('auth', (): AuthStore => {
  const config = useRuntimeConfig().public
  const cookieOptions = { maxAge: SEVEN_DAYS, sameSite: 'lax' as const, secure: !import.meta.dev }

  const accessToken = useCookie<string | null>(ACCESS_COOKIE, { ...cookieOptions, default: () => null })
  const refreshToken = useCookie<string | null>(REFRESH_COOKIE, { ...cookieOptions, default: () => null })

  const user = ref<User | null>(null)
  const refreshCount = ref(0)
  const isLoggedIn = computed<boolean>(() => user.value !== null)

  function clearSession(): void {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  /**
   * Un seul POST /auth/refresh à la fois : les appels simultanés partagent la même promesse.
   * La fonction est créée dans le store, donc une instance par requête côté serveur
   * (pas de partage de token entre deux visiteurs).
   */
  const refreshTokens = createSingleFlight(async (): Promise<void> => {
    if (!refreshToken.value) {
      throw createError({ statusCode: 401, statusMessage: 'Session expirée' })
    }
    refreshCount.value++
    try {
      const tokens = await $fetch<AuthTokens>('/auth/refresh', {
        baseURL: config.apiBase,
        method: 'POST',
        body: { refreshToken: refreshToken.value, expiresInMins: config.authExpiresInMins },
      })
      accessToken.value = tokens.accessToken
      refreshToken.value = tokens.refreshToken
    } catch (error) {
      clearSession()
      throw error
    }
  })

  function request<T>(path: string, token: string | null, options: AuthFetchOptions): Promise<T> {
    // Le $fetch de Nuxt type sa réponse d'après la route appelée ; pour une API externe
    // à chemin variable, on indique explicitement que la réponse est de type T.
    return $fetch<T>(path, {
      baseURL: config.apiBase,
      method: options.method ?? 'GET',
      body: options.body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }) as Promise<T>
  }

  /** Requête authentifiée : en cas de 401, rafraîchit le token (une seule fois) puis rejoue. */
  async function authFetch<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
    const usedToken = accessToken.value
    try {
      return await request<T>(path, usedToken, options)
    } catch (error) {
      if (!isUnauthorized(error) || !refreshToken.value) {
        throw error
      }
      // Si une autre requête a déjà obtenu un nouveau token, inutile de rafraîchir à nouveau
      if (accessToken.value === usedToken) {
        await refreshTokens()
      }
      return await request<T>(path, accessToken.value, options)
    }
  }

  async function fetchUser(): Promise<void> {
    if (!accessToken.value && !refreshToken.value) {
      user.value = null
      return
    }
    try {
      user.value = await authFetch<User>('/auth/me')
    } catch (error) {
      // Token invalide ou expiré sans refresh possible : on repart déconnecté
      if (getHttpStatus(error) !== null) {
        clearSession()
      }
      user.value = null
    }
  }

  async function login(username: string, password: string): Promise<void> {
    const payload: LoginPayload = { username, password, expiresInMins: config.authExpiresInMins }
    const response = await $fetch<LoginResponse>('/auth/login', {
      baseURL: config.apiBase,
      method: 'POST',
      body: payload,
    })
    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken
    await fetchUser()
  }

  async function logout(): Promise<void> {
    clearSession()
    await navigateTo('/')
  }

  return { user, isLoggedIn, refreshCount, login, logout, fetchUser, authFetch }
})
