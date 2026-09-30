import { describe, expect, it } from 'vitest'
import { discountBadge, stockStatus } from '../../app/utils/stock'

describe('stockStatus', () => {
  it('affiche la rupture, le stock faible et le stock normal', () => {
    expect(stockStatus(0)).toMatchObject({ available: false, label: 'Rupture de stock' })
    expect(stockStatus(4).label).toBe('Plus que 4 en stock')
    expect(stockStatus(5).level).toBe('ok')
  })

  it('badge de remise', () => {
    expect(discountBadge(12.48)).toBe('−12 %')
    expect(discountBadge(0.2)).toBeNull()
  })
})
