import { describe, expect, it } from 'vitest'
import {
  MAX_COMPARE,
  canonicalCompareQuery,
  compareLink,
  compareQueryNeedsNormalization,
  parseCompareIds,
  parseCompareQuery,
  sameCompareSelection,
  toggleCompare,
} from '../../app/utils/compare'

describe('parseCompareIds', () => {
  it('lit une chaîne "3,17,42" en conservant l’ordre', () => {
    expect(parseCompareIds('3,17,42')).toEqual([3, 17, 42])
    expect(parseCompareIds('42,3,17')).toEqual([42, 3, 17])
  })

  it('lit un tableau de nombres ou de chaînes (cookie JSON, ?ids=1&ids=2)', () => {
    expect(parseCompareIds([3, 17])).toEqual([3, 17])
    expect(parseCompareIds(['3', ' 17 '])).toEqual([3, 17])
  })

  it('accepte un nombre seul (cookie "5" décodé par useCookie)', () => {
    expect(parseCompareIds(5)).toEqual([5])
    expect(parseCompareIds(0)).toEqual([])
  })

  it('supprime les doublons en gardant le premier', () => {
    expect(parseCompareIds('5,5,5')).toEqual([5])
    expect(parseCompareIds('3,17,3,42')).toEqual([3, 17, 42])
    expect(parseCompareIds([17, '17', 3])).toEqual([17, 3])
  })

  it('tronque au maximum (3 par défaut)', () => {
    expect(MAX_COMPARE).toBe(3)
    expect(parseCompareIds('1,2,3,4,5')).toEqual([1, 2, 3])
    expect(parseCompareIds('1,2,3,4,5', 2)).toEqual([1, 2])
  })

  it('compte le maximum après avoir ignoré les doublons et les valeurs invalides', () => {
    expect(parseCompareIds('1,1,abc,2,3,4')).toEqual([1, 2, 3])
  })

  it('ignore les entrées invalides', () => {
    expect(parseCompareIds('abc')).toEqual([])
    expect(parseCompareIds('1,,2')).toEqual([1, 2])
    expect(parseCompareIds([])).toEqual([])
    expect(parseCompareIds(null)).toEqual([])
    expect(parseCompareIds(undefined)).toEqual([])
    expect(parseCompareIds('')).toEqual([])
    expect(parseCompareIds({ ids: [1] })).toEqual([])
  })

  it('ignore les valeurs non entières ou ≤ 0', () => {
    expect(parseCompareIds('0,-3,1.5,2')).toEqual([2])
    expect(parseCompareIds([0, -1, 2.5, Number.NaN, Infinity, 4])).toEqual([4])
    expect(parseCompareIds('3abc,0x10,1e2,7')).toEqual([7])
    expect(parseCompareIds([null, true, [1], { id: 1 }, 8])).toEqual([8])
  })
})

describe('toggleCompare', () => {
  it('ajoute un produit absent à la fin', () => {
    expect(toggleCompare([], 3)).toEqual({ ids: [3], rejected: false })
    expect(toggleCompare([3, 17], 42)).toEqual({ ids: [3, 17, 42], rejected: false })
  })

  it('retire un produit présent en conservant l’ordre des autres', () => {
    expect(toggleCompare([3, 17, 42], 17)).toEqual({ ids: [3, 42], rejected: false })
  })

  it('retire un produit même quand le comparateur est plein', () => {
    expect(toggleCompare([3, 17, 42], 3)).toEqual({ ids: [17, 42], rejected: false })
  })

  it('refuse le 4e produit sans rien changer', () => {
    expect(toggleCompare([3, 17, 42], 99)).toEqual({ ids: [3, 17, 42], rejected: true })
  })

  it('respecte un maximum personnalisé', () => {
    expect(toggleCompare([1], 2, 1)).toEqual({ ids: [1], rejected: true })
  })

  it('ignore un identifiant invalide', () => {
    expect(toggleCompare([3], 0)).toEqual({ ids: [3], rejected: false })
    expect(toggleCompare([3], 1.5)).toEqual({ ids: [3], rejected: false })
  })

  it('ne modifie pas le tableau reçu (fonction pure)', () => {
    const ids = [3, 17]
    const added = toggleCompare(ids, 42)
    const removed = toggleCompare(ids, 3)
    expect(ids).toEqual([3, 17])
    expect(added.ids).not.toBe(ids)
    expect(removed.ids).not.toBe(ids)
  })
})

describe('compareLink', () => {
  it('construit le lien vers /comparer', () => {
    expect(compareLink([3, 17, 42])).toBe('/comparer?ids=3,17,42')
  })
})

describe('parseCompareQuery', () => {
  it('lit ?ids=3,17,42', () => {
    expect(parseCompareQuery('3,17,42')).toEqual([3, 17, 42])
  })

  it('réunit plusieurs paramètres ?ids=3,17&ids=42 avant de valider', () => {
    expect(parseCompareQuery(['3,17', '42'])).toEqual([3, 17, 42])
    expect(parseCompareQuery(['3', '3', '1,2,4'])).toEqual([3, 1, 2])
  })

  it('ignore les morceaux qui ne sont pas des chaînes (?ids sans valeur donne null)', () => {
    expect(parseCompareQuery([null, '5'])).toEqual([5])
    expect(parseCompareQuery(null)).toEqual([])
    expect(parseCompareQuery(undefined)).toEqual([])
  })

  it('applique les mêmes règles que le cookie : abc,1,1,999 donne [1, 999]', () => {
    expect(parseCompareQuery('abc,1,1,999')).toEqual([1, 999])
    expect(parseCompareQuery('1,2,3,4')).toEqual([1, 2, 3])
  })
})

describe('canonicalCompareQuery', () => {
  it('écrit la liste sous la forme "3,17,42"', () => {
    expect(canonicalCompareQuery([3, 17, 42])).toBe('3,17,42')
  })

  it('renvoie undefined pour une liste vide (paramètre retiré de l’URL)', () => {
    expect(canonicalCompareQuery([])).toBeUndefined()
  })
})

describe('compareQueryNeedsNormalization', () => {
  it('ne réécrit pas une URL déjà canonique', () => {
    expect(compareQueryNeedsNormalization('3,17,42', [3, 17, 42])).toBe(false)
    expect(compareQueryNeedsNormalization(undefined, [])).toBe(false)
  })

  it('réécrit une URL contenant des identifiants ignorés', () => {
    expect(compareQueryNeedsNormalization('abc,1,1,999', [1, 999])).toBe(true)
    expect(compareQueryNeedsNormalization('1,2,3,4', [1, 2, 3])).toBe(true)
    // 999 n'existe pas : retiré après le chargement
    expect(compareQueryNeedsNormalization('1,999', [1])).toBe(true)
  })

  it('réécrit une URL mal formée mais valide (espaces, plusieurs paramètres)', () => {
    expect(compareQueryNeedsNormalization(' 3, 17', [3, 17])).toBe(true)
    expect(compareQueryNeedsNormalization(['3', '17'], [3, 17])).toBe(true)
  })

  it('retire le paramètre quand il ne reste aucun identifiant', () => {
    expect(compareQueryNeedsNormalization('abc', [])).toBe(true)
    expect(compareQueryNeedsNormalization('', [])).toBe(true)
    expect(compareQueryNeedsNormalization(null, [])).toBe(true)
  })
})

describe('sameCompareSelection', () => {
  it('compare sans tenir compte de l’ordre', () => {
    expect(sameCompareSelection([3, 17, 42], [42, 3, 17])).toBe(true)
    expect(sameCompareSelection([], [])).toBe(true)
  })

  it('détecte une sélection différente', () => {
    expect(sameCompareSelection([3, 17], [3, 17, 42])).toBe(false)
    expect(sameCompareSelection([3, 17, 42], [3, 17])).toBe(false)
    expect(sameCompareSelection([3, 17], [3, 42])).toBe(false)
    expect(sameCompareSelection([], [3])).toBe(false)
  })
})
