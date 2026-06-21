import { describe, expect, it } from 'vitest'
import { arrayLength, coerceNumberArray, coerceStringArray } from '@/lib/coerce-array'

describe('coerce-array', () => {
  it('coerceStringArray handles undefined and non-arrays', () => {
    expect(coerceStringArray(undefined)).toEqual([])
    expect(coerceStringArray('bad')).toEqual([])
    expect(coerceStringArray(['a', '', 1, 'b'])).toEqual(['a', 'b'])
  })

  it('arrayLength is safe on undefined', () => {
    expect(arrayLength(undefined)).toBe(0)
    expect(arrayLength([1, 2])).toBe(2)
  })

  it('coerceNumberArray filters invalid values', () => {
    expect(coerceNumberArray(undefined)).toEqual([])
    expect(coerceNumberArray([1, NaN, 2, 'x'])).toEqual([1, 2])
  })
})
