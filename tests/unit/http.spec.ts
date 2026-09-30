import { describe, expect, it } from 'vitest'
import { getHttpStatus, isUnauthorized } from '../../app/utils/http'

describe('getHttpStatus', () => {
  it('lit statusCode ou status sur une erreur inconnue', () => {
    expect(getHttpStatus({ statusCode: 401 })).toBe(401)
    expect(getHttpStatus({ status: 404 })).toBe(404)
    expect(getHttpStatus(new Error('x'))).toBeNull()
    expect(getHttpStatus('oops')).toBeNull()
    expect(isUnauthorized({ statusCode: 401 })).toBe(true)
  })
})
