import { describe, expect, it } from 'vitest'
import { formatIw37nDuplicateMessage } from './iw37n-import-messages'

describe('iw37n-import-messages', () => {
  it('formats duplicate message with batch ref', () => {
    expect(formatIw37nDuplicateMessage('12')).toContain('batch #12')
    expect(formatIw37nDuplicateMessage('12')).toContain('SHA256')
  })

  it('formats duplicate message without batch ref', () => {
    expect(formatIw37nDuplicateMessage(null)).not.toContain('batch #')
  })
})
