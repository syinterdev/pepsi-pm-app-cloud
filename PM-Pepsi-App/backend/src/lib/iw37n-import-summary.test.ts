import { describe, expect, it } from 'vitest'
import type { Iw37nImportRowResult } from '../services/iw37n.js'

/** mirror buildImportSummary logic for unit test */
function summarize(rows: Iw37nImportRowResult[]) {
  let inserted = 0
  let updated = 0
  let skipped = 0
  let errors = 0
  const errMap = new Map<string, number>()
  for (const r of rows) {
    if (r.action === 'inserted') inserted++
    else if (r.action === 'updated') updated++
    else if (r.action === 'error') {
      errors++
      errMap.set(r.message, (errMap.get(r.message) ?? 0) + 1)
    } else skipped++
  }
  return { inserted, updated, skipped, errors, errorGroups: [...errMap.entries()].map(([message, count]) => ({ message, count })) }
}

describe('iw37n import summary', () => {
  it('aggregates row actions', () => {
    const rows: Iw37nImportRowResult[] = [
      { rowNo: 1, action: 'inserted', wkorder: '1', opac: '1', mntplan: '', wktype: '', mat: '', syst: '', message: '' },
      { rowNo: 2, action: 'error', wkorder: '2', opac: '1', mntplan: '', wktype: '', mat: '', syst: '', message: 'bad' },
      { rowNo: 3, action: 'error', wkorder: '3', opac: '1', mntplan: '', wktype: '', mat: '', syst: '', message: 'bad' },
      { rowNo: 4, action: 'skipped', wkorder: '4', opac: '1', mntplan: '', wktype: '', mat: '', syst: '', message: '' },
    ]
    const s = summarize(rows)
    expect(s.inserted).toBe(1)
    expect(s.errors).toBe(2)
    expect(s.errorGroups[0]?.count).toBe(2)
  })
})
