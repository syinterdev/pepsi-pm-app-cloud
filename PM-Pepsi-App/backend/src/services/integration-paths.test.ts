import { describe, expect, it } from 'vitest'
import {
  archiveInboundMonthDir,
  getIntegrationDirs,
  isIw37nInboundFileName,
  listConfirmInboundFileNames,
} from './integration-paths.js'

describe('integration-paths', () => {
  it('detects IW37N inbound extensions', () => {
    expect(isIw37nInboundFileName('IW37N_20260521.csv')).toBe(true)
    expect(isIw37nInboundFileName('iw37n.xlsx')).toBe(true)
    expect(isIw37nInboundFileName('.hidden.csv')).toBe(false)
    expect(isIw37nInboundFileName('readme.txt')).toBe(false)
  })

  it('lists confirm inbound same rules as iw37n', () => {
    expect(listConfirmInboundFileNames('/nonexistent-dir-xyz')).toEqual([])
  })

  it('builds archive month folder', () => {
    const dirs = getIntegrationDirs('/tmp/pm-integration-test')
    expect(archiveInboundMonthDir(dirs, new Date('2026-05-21T12:00:00Z'))).toMatch(
      /archive[/\\]inbound[/\\]2026-05$/,
    )
  })
})
