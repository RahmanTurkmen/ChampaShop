import { describe, expect, it } from 'vitest'
import { isValidId, toId } from '../../app/utils/ids'

describe('isValidId', () => {
  it('accepte un entier strictement positif', () => {
    expect(isValidId(1)).toBe(true)
    expect(isValidId(42)).toBe(true)
  })

  it('refuse zéro, les négatifs, les décimaux et les valeurs non finies', () => {
    expect(isValidId(0)).toBe(false)
    expect(isValidId(-3)).toBe(false)
    expect(isValidId(1.5)).toBe(false)
    expect(isValidId(Number.NaN)).toBe(false)
    expect(isValidId(Infinity)).toBe(false)
  })
})

describe('toId', () => {
  it('accepte un nombre ou une chaîne de chiffres valides', () => {
    expect(toId(5)).toBe(5)
    expect(toId('5')).toBe(5)
    expect(toId(' 17 ')).toBe(17)
  })

  it('refuse les chaînes non entières, vides, ou en notation non décimale', () => {
    expect(toId('abc')).toBeNull()
    expect(toId('')).toBeNull()
    expect(toId('1.5')).toBeNull()
    expect(toId('3abc')).toBeNull()
    expect(toId('0x10')).toBeNull()
    expect(toId('1e2')).toBeNull()
  })

  it('refuse tout ce qui n’est ni nombre ni chaîne', () => {
    expect(toId(null)).toBeNull()
    expect(toId(undefined)).toBeNull()
    expect(toId(true)).toBeNull()
    expect(toId([1])).toBeNull()
    expect(toId({ id: 1 })).toBeNull()
  })

  it('refuse les nombres invalides (0, négatifs, décimaux)', () => {
    expect(toId(0)).toBeNull()
    expect(toId(-1)).toBeNull()
    expect(toId(2.5)).toBeNull()
  })
})
