import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/app-toast', () => ({
  toastError: vi.fn(),
}))

import { queryErrorMessage } from '@/lib/query-load-error'

describe('queryErrorMessage', () => {
  it('reads Error.message', () => {
    expect(queryErrorMessage(new Error('network'))).toBe('network')
  })

  it('reads string errors', () => {
    expect(queryErrorMessage('timeout')).toBe('timeout')
  })

  it('returns empty for unknown', () => {
    expect(queryErrorMessage({ code: 500 })).toBe('')
  })
})
