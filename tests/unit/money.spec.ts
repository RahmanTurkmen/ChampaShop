import { describe, expect, it } from 'vitest'
import { formatCents, percentOfCents, toCents } from '../../app/utils/money'

describe('money', () => {
  it('convertit et arrondit', () => {
    expect(toCents(19.99)).toBe(1999)
    expect(percentOfCents(2997, 10)).toBe(300)
    expect(percentOfCents(5, 10)).toBe(1)
    expect(formatCents(1234)).toMatch(/12,34/)
  })
})
