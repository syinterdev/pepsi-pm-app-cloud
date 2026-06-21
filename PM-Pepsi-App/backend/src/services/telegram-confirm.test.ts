import { describe, expect, it } from 'vitest'
import {
  afterPhotoCallbackData,
  commentModeCallbackData,
  isConfirmCallbackData,
  parseAfterPhotoCallback,
  parseBeforePhotoCallback,
  parseCommentModeCallback,
} from './telegram-confirm.js'

describe('telegram-confirm callbacks', () => {
  it('parses after/comment idplanw', () => {
    expect(parseAfterPhotoCallback('ia:42')).toBe(42)
    expect(parseCommentModeCallback('ic:42')).toBe(42)
    expect(parseAfterPhotoCallback('ic:42')).toBeNull()
    expect(parseCommentModeCallback('c:42')).toBeNull()
  })

  it('still parses deprecated before callback for friendly reply', () => {
    expect(parseBeforePhotoCallback('ib:42')).toBe(42)
  })

  it('builds callback data', () => {
    expect(afterPhotoCallbackData(7)).toBe('ia:7')
    expect(commentModeCallbackData(7)).toBe('ic:7')
  })

  it('detects confirm callback prefix', () => {
    expect(isConfirmCallbackData('ia:1')).toBe(true)
    expect(isConfirmCallbackData('ic:3')).toBe(true)
    expect(isConfirmCallbackData('ib:1')).toBe(true)
    expect(isConfirmCallbackData('a:1')).toBe(false)
    expect(isConfirmCallbackData('c:1')).toBe(false)
  })
})
