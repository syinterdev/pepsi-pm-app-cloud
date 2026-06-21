import { describe, expect, it } from 'vitest'
import { listConfirmationPreviewRows } from './confirmation.js'

function createPreviewPoolMock(rows: Record<string, unknown>[]) {
  return {
    async query(text: string, params?: unknown[]) {
      if (text.includes('to_regclass')) {
        return { rows: [{ reg: 'app.tbwrkclose' }] }
      }
      if (text.includes('preview_rows')) {
        expect(params?.[0]).toEqual(['pending'])
        return { rows }
      }
      return { rows: [] }
    },
  }
}

describe('listConfirmationPreviewRows', () => {
  it('maps personnel + supervisor rows for pending QC', async () => {
    const pool = createPreviewPoolMock([
      {
        idiw37: 220,
        wkorder: '4001560529',
        opac: '0010',
        wkctr: 'PAC001',
        timewk: 60,
        unitc: 'Min',
        stdate: Math.floor(new Date(2026, 4, 27, 15, 0, 0).getTime() / 1000),
        endate: Math.floor(new Date(2026, 4, 27, 16, 0, 0).getTime() / 1000),
        confirm_qc_status: 'pending',
        source: 'personnel',
      },
    ])
    const items = await listConfirmationPreviewRows(pool as never, { status: 'pending' })
    expect(items).toHaveLength(1)
    expect(items[0]!.idiw37).toBe(220)
    expect(items[0]!.confirmQcStatus).toBe('pending')
    expect(items[0]!.source).toBe('personnel')
    expect(items[0]!.wkorder).toBe('4001560529')
    expect(items[0]!.opac).toBe('10')
    expect(items[0]!.timewk).toBe(60)
    expect(items[0]!.startDateExe).toBe('27052026')
  })
})
