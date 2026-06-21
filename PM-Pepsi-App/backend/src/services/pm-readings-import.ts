import type { Pool } from 'pg'
import { findWorkOrderByWkorder } from './confirmation.js'
import { createWoPmReading } from './wo-pm-execution-data.js'
import type { PmReadingImportRow } from '../lib/pm-readings-import.js'

export type PmReadingBatchItem = {
  wkorder?: string
  idiw37?: number
  machine: string
  pmlist: string
  kind: 'current_3phase' | 'vibration_dst_db'
  measuredAt?: string
  v1: number
  v2: number
  v3: number | null
  warningLimit?: number | null
  alarmLimit?: number | null
}

export type PmReadingImportResult = {
  imported: number
  failed: number
  errors: { rowNo: number; wkorder: string; message: string }[]
}

async function resolveIdiw37(
  pool: Pool,
  input: { wkorder?: string; idiw37?: number },
): Promise<number | null> {
  if (input.idiw37 != null && Number.isFinite(input.idiw37)) return input.idiw37
  const wk = (input.wkorder ?? '').trim()
  if (!wk) return null
  const wo = await findWorkOrderByWkorder(pool, wk)
  return wo ? Number(wo.idiw37) : null
}

export async function importPmReadingRows(
  pool: Pool,
  rows: PmReadingImportRow[],
  wkctr: string,
  preIssues: PmReadingImportResult['errors'] = [],
): Promise<PmReadingImportResult> {
  const errors = [...preIssues]
  let imported = 0

  for (const row of rows) {
    const idiw37 = await resolveIdiw37(pool, { wkorder: row.wkorder })
    if (idiw37 == null) {
      errors.push({ rowNo: row.rowNo, wkorder: row.wkorder, message: 'ไม่พบเลข WO ในระบบ' })
      continue
    }
    if (!row.machine.trim() || !row.pmlist.trim()) {
      errors.push({ rowNo: row.rowNo, wkorder: row.wkorder, message: 'ต้องระบุ เครื่องจักร และ รายการ PM' })
      continue
    }
    try {
      await createWoPmReading(pool, {
        idiw37,
        machine: row.machine,
        pmlist: row.pmlist,
        kind: row.kind,
        measuredAt: row.measuredAt,
        v1: row.v1,
        v2: row.v2,
        v3: row.v3,
        warningLimit: row.warningLimit,
        alarmLimit: row.alarmLimit,
        wkctr,
      })
      imported += 1
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push({ rowNo: row.rowNo, wkorder: row.wkorder, message: msg })
    }
  }

  return { imported, failed: errors.length, errors }
}

export async function batchCreatePmReadings(
  pool: Pool,
  items: PmReadingBatchItem[],
  wkctr: string,
  defaultWkorder?: string,
  defaultIdiw37?: number,
): Promise<PmReadingImportResult> {
  const rows: PmReadingImportRow[] = items.map((item, idx) => ({
    rowNo: idx + 1,
    wkorder: (item.wkorder ?? defaultWkorder ?? '').trim(),
    machine: item.machine,
    pmlist: item.pmlist,
    kind: item.kind,
    measuredAt: item.measuredAt ?? new Date().toISOString(),
    v1: item.v1,
    v2: item.v2,
    v3: item.v3,
    warningLimit: item.warningLimit ?? null,
    alarmLimit: item.alarmLimit ?? null,
  }))

  if (defaultIdiw37 != null) {
    let imported = 0
    const errors: PmReadingImportResult['errors'] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!
      if (!item.machine.trim() || !item.pmlist.trim()) {
        errors.push({ rowNo: i + 1, wkorder: defaultWkorder ?? '', message: 'ต้องระบุ เครื่องจักร และ รายการ PM' })
        continue
      }
      try {
        await createWoPmReading(pool, {
          idiw37: defaultIdiw37,
          machine: item.machine,
          pmlist: item.pmlist,
          kind: item.kind,
          measuredAt: item.measuredAt,
          v1: item.v1,
          v2: item.v2,
          v3: item.v3,
          warningLimit: item.warningLimit ?? null,
          alarmLimit: item.alarmLimit ?? null,
          wkctr,
        })
        imported += 1
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push({ rowNo: i + 1, wkorder: defaultWkorder ?? '', message: msg })
      }
    }
    return { imported, failed: errors.length, errors }
  }

  return importPmReadingRows(pool, rows, wkctr)
}
