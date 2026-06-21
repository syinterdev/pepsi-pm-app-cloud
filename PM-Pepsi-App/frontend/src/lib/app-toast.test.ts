import '@/i18n'
import { describe, expect, it, vi } from 'vitest'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

import { toast } from 'sonner'
import { toastSaved, toastSuccess } from '@/lib/app-toast'

describe('app-toast', () => {
  it('toastSuccess calls sonner success', () => {
    toastSuccess('OK')
    expect(toast.success).toHaveBeenCalledWith('OK', { duration: 4000 })
  })

  it('toastSaved uses locale default (en)', () => {
    toastSaved()
    expect(toast.success).toHaveBeenCalledWith('Saved', { duration: 4000 })
  })
})
