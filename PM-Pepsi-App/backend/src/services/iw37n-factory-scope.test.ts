import { describe, expect, it } from 'vitest'
import { ensureFactoryScopeFunctionalloc } from './iw37n-factory-scope.js'
import type { Iw37nImportRow } from './iw37n-parser.js'

const base: Iw37nImportRow = {
  mntplan: '1',
  wkorder: '4000113383',
  wktype: 'ZB02',
  mat: '2',
  bscstart: 1,
  actfinish: null,
  systemstatus: 'CLSD',
  syst: 'CLSD',
  opac: '10',
  operationshorttext: 'op',
  ostdescription: '',
  cknow: '',
  wkctr: 'PRO002',
  work: null,
  actwork: null,
  untime: null,
  equipment: '0',
  equdescrip: 'Fryer Zone',
  functionalloc: '',
  funcdescrip: 'FACTORY 1 PC50MZ',
}

describe('ensureFactoryScopeFunctionalloc', () => {
  it('prefixes 7151 for SAP ALV desc-only rows', () => {
    const r = ensureFactoryScopeFunctionalloc(base)
    expect(r.functionalloc).toMatch(/^7151-/)
    expect(r.functionalloc).toContain('FACTORY')
  })

  it('keeps PI-TH-7151 codes unchanged', () => {
    const r = ensureFactoryScopeFunctionalloc({
      ...base,
      functionalloc: 'PI-TH-7151-FA-PK-02',
      funcdescrip: 'PACKING',
    })
    expect(r.functionalloc).toBe('PI-TH-7151-FA-PK-02')
  })
})
