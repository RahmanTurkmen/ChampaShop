import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from '../../app/utils/redirect'
import { createSingleFlight } from '../../app/utils/singleFlight'

describe('safeRedirectPath', () => {
  it('accepte un chemin interne', () => {
    expect(safeRedirectPath('/compte?onglet=1')).toBe('/compte?onglet=1')
  })

  it('refuse les redirections externes', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/compte')
    expect(safeRedirectPath('//evil.com')).toBe('/compte')
    expect(safeRedirectPath('/\\evil.com')).toBe('/compte')
    expect(safeRedirectPath(undefined)).toBe('/compte')
    expect(safeRedirectPath(['/panier'])).toBe('/panier')
  })
})

describe('createSingleFlight', () => {
  it('un seul appel pour des demandes simultanées', async () => {
    let calls = 0
    const refresh = createSingleFlight(async () => {
      calls++
      await new Promise((resolve) => setTimeout(resolve, 10))
      return 'token'
    })

    const results = await Promise.all([refresh(), refresh(), refresh()])
    expect(results).toEqual(['token', 'token', 'token'])
    expect(calls).toBe(1)

    // Une fois terminé, un nouvel appel relance la tâche
    await refresh()
    expect(calls).toBe(2)
  })

  it('libère le verrou après une erreur', async () => {
    let calls = 0
    const failing = createSingleFlight(async () => {
      calls++
      throw new Error('refresh refusé')
    })
    await expect(failing()).rejects.toThrow()
    await expect(failing()).rejects.toThrow()
    expect(calls).toBe(2)
  })
})
