import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  buildMasterPlanWorkbookBuffer,
  compareExportRowCounts,
  parsedWorkbookToExportInput,
} from './master-plan-export.js'
import { MASTER_PLAN_FILES, parseMasterPlanWorkbook } from './master-plan-parse.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const customerFile = path.resolve(here, '../../../../docs from customer', MASTER_PLAN_FILES.EE)

describe('master-plan-export', () => {
  it('round-trips EE workbook row counts', async () => {
    const buf = await readFile(customerFile)
    const parsed = parseMasterPlanWorkbook(buf, 'EE', MASTER_PLAN_FILES.EE)
    const exported = buildMasterPlanWorkbookBuffer(parsedWorkbookToExportInput(parsed))
    const check = compareExportRowCounts(parsed, exported, 'EE')
    expect(check.ok, check.mismatches.join('; ')).toBe(true)
  })
})
