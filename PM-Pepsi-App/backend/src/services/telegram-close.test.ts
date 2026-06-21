import { describe, expect, it } from 'vitest'
import { closeCallbackData, parseCloseCallbackData } from './telegram-close.js'

describe('telegram-close callbacks', () => {
  it('parses close callback idplanw', () => {
    expect(parseCloseCallbackData('c:42')).toBe(42)
    expect(parseCloseCallbackData('a:42')).toBeNull()
    expect(parseCloseCallbackData('c:0')).toBeNull()
  })

  it('builds close callback data', () => {
    expect(closeCallbackData(99)).toBe('c:99')
  })
})
