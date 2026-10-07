import { describe, expect, it, vi } from 'vitest'
import { authFetchWithRetry } from '../../app/utils/authFetch'

const unauthorizedError = { statusCode: 401 }
const serverError = { statusCode: 500 }

describe('authFetchWithRetry', () => {
  it('renvoie directement le résultat quand le token est valide', async () => {
    const request = vi.fn().mockResolvedValue('ok')
    const refresh = vi.fn()

    const result = await authFetchWithRetry({
      getToken: () => 'access-1',
      hasRefreshToken: () => true,
      isUnauthorized: (error) => error === unauthorizedError,
      refresh,
      request,
    })

    expect(result).toBe('ok')
    expect(refresh).not.toHaveBeenCalled()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('rafraîchit une seule fois puis rejoue avec le nouveau token', async () => {
    let token = 'access-expired'
    const request = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(unauthorizedError))
      .mockImplementationOnce(() => Promise.resolve('ok-after-refresh'))
    const refresh = vi.fn().mockImplementation(async () => {
      token = 'access-fresh'
    })

    const result = await authFetchWithRetry({
      getToken: () => token,
      hasRefreshToken: () => true,
      isUnauthorized: (error) => error === unauthorizedError,
      refresh,
      request,
    })

    expect(result).toBe('ok-after-refresh')
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenNthCalledWith(2, 'access-fresh')
  })

  it("ne rafraîchit pas si une autre requête a déjà changé le token entre-temps", async () => {
    let token = 'access-expired'
    const request = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(unauthorizedError))
      .mockImplementationOnce(() => Promise.resolve('ok'))
    const refresh = vi.fn()

    // Le token a déjà été changé par un autre appel avant que celui-ci ne rejoue.
    const result = await authFetchWithRetry({
      getToken: () => {
        const current = token
        token = 'access-fresh'
        return current
      },
      hasRefreshToken: () => true,
      isUnauthorized: (error) => error === unauthorizedError,
      refresh,
      request,
    })

    expect(result).toBe('ok')
    expect(refresh).not.toHaveBeenCalled()
  })

  it("relance l'erreur sans rafraîchir si elle n'est pas 401", async () => {
    const request = vi.fn().mockRejectedValue(serverError)
    const refresh = vi.fn()

    await expect(
      authFetchWithRetry({
        getToken: () => 'access-1',
        hasRefreshToken: () => true,
        isUnauthorized: (error) => error === unauthorizedError,
        refresh,
        request,
      }),
    ).rejects.toBe(serverError)
    expect(refresh).not.toHaveBeenCalled()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it("relance l'erreur 401 sans rafraîchir s'il n'y a pas de refresh token", async () => {
    const request = vi.fn().mockRejectedValue(unauthorizedError)
    const refresh = vi.fn()

    await expect(
      authFetchWithRetry({
        getToken: () => 'access-1',
        hasRefreshToken: () => false,
        isUnauthorized: (error) => error === unauthorizedError,
        refresh,
        request,
      }),
    ).rejects.toBe(unauthorizedError)
    expect(refresh).not.toHaveBeenCalled()
  })
})
