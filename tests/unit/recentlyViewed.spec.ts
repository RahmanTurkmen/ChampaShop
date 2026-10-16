import { describe, expect, it } from 'vitest'
import {
  MAX_RECENTLY_VIEWED,
  parseRecentlyViewedCookie,
  pushRecentlyViewed,
} from '../../app/utils/recentlyViewed'

describe('parseRecentlyViewedCookie', () => {
  it('lit une chaîne "3,17,42" en conservant l’ordre', () => {
    expect(parseRecentlyViewedCookie('3,17,42')).toEqual([3, 17, 42])
  })

  it('lit un tableau de nombres ou de chaînes', () => {
    expect(parseRecentlyViewedCookie([3, 17])).toEqual([3, 17])
    expect(parseRecentlyViewedCookie(['3', ' 17 '])).toEqual([3, 17])
  })

  it('accepte un nombre seul (cookie à une seule valeur décodé par useCookie)', () => {
    expect(parseRecentlyViewedCookie(5)).toEqual([5])
  })

  it('supprime les doublons en gardant le premier', () => {
    expect(parseRecentlyViewedCookie('5,5,5')).toEqual([5])
  })

  it('tronque au maximum (10 par défaut)', () => {
    expect(MAX_RECENTLY_VIEWED).toBe(10)
    expect(parseRecentlyViewedCookie('1,2,3,4,5,6,7,8,9,10,11,12')).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(parseRecentlyViewedCookie('1,2,3,4,5', 2)).toEqual([1, 2])
  })

  it('ignore les entrées invalides sans jamais lever d’erreur', () => {
    expect(parseRecentlyViewedCookie('abc')).toEqual([])
    expect(parseRecentlyViewedCookie('1,,2')).toEqual([1, 2])
    expect(parseRecentlyViewedCookie([])).toEqual([])
    expect(parseRecentlyViewedCookie(null)).toEqual([])
    expect(parseRecentlyViewedCookie(undefined)).toEqual([])
    expect(parseRecentlyViewedCookie('5,5,5')).toEqual([5])
    expect(parseRecentlyViewedCookie('{"broken json')).toEqual([])
    expect(parseRecentlyViewedCookie({ ids: [1] })).toEqual([])
  })

  it('ignore les valeurs non entières ou ≤ 0', () => {
    expect(parseRecentlyViewedCookie('0,-3,1.5,2')).toEqual([2])
    expect(parseRecentlyViewedCookie([0, -1, 2.5, Number.NaN, Infinity, 4])).toEqual([4])
  })

  it("ignore les éléments d'un tableau qui ne sont ni nombre ni chaîne", () => {
    expect(parseRecentlyViewedCookie([null, true, [1], { id: 1 }, 8])).toEqual([8])
  })
})

describe('pushRecentlyViewed', () => {
  it('ajoute un identifiant en tête', () => {
    expect(pushRecentlyViewed([], 3)).toEqual([3])
    expect(pushRecentlyViewed([3, 17], 42)).toEqual([42, 3, 17])
  })

  it('remonte un identifiant déjà présent au lieu de le dupliquer', () => {
    expect(pushRecentlyViewed([3, 17, 42], 17)).toEqual([17, 3, 42])
  })

  it('fait sortir le plus ancien au-delà du maximum', () => {
    const nineIds = [9, 8, 7, 6, 5, 4, 3, 2, 1]
    expect(pushRecentlyViewed(nineIds, 10)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])

    const tenIds = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
    expect(pushRecentlyViewed(tenIds, 11)).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2])

    expect(pushRecentlyViewed([3, 2, 1], 4, 2)).toEqual([4, 3])
  })

  it('ignore un identifiant invalide', () => {
    expect(pushRecentlyViewed([3], 0)).toEqual([3])
    expect(pushRecentlyViewed([3], -1)).toEqual([3])
    expect(pushRecentlyViewed([3], 1.5)).toEqual([3])
  })

  it('ne modifie pas le tableau reçu (fonction pure)', () => {
    const ids = [3, 17]
    const result = pushRecentlyViewed(ids, 42)
    expect(ids).toEqual([3, 17])
    expect(result).not.toBe(ids)
  })
})
