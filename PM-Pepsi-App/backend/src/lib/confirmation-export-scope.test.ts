import { describe, expect, it, vi } from 'vitest'
import { resolveConfirmationExportScope } from './confirmation-export-scope.js'

vi.mock('./has-permission.js', () => ({
  hasPermission: vi.fn(),
}))

import { hasPermission } from './has-permission.js'

describe('resolveConfirmationExportScope', () => {
  it('returns ALL when confirmation.export.all is granted', async () => {
    vi.mocked(hasPermission).mockResolvedValue(true)
    const scope = await resolveConfirmationExportScope({} as never, 'H')
    expect(scope).toBe('ALL')
    expect(hasPermission).toHaveBeenCalledWith({}, 'H', 'confirmation.export.all')
  })

  it('returns OWN when permission is denied', async () => {
    vi.mocked(hasPermission).mockResolvedValue(false)
    const scope = await resolveConfirmationExportScope({} as never, 'W')
    expect(scope).toBe('OWN')
  })
})
