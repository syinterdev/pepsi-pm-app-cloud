import type { Pool } from 'pg'
import {
  inferPmMeasurementKind,
  pmMeasurementMeta,
  type PmMeasurementKind,
} from '../lib/pm-measurement-kind.js'
import { mapPmReadingV3FromDb, normalizePmReadingV3ForWrite } from '../lib/pm-reading-values.js'
import { deriveLatestPmNote, type WoPmNoteEntry } from '../lib/wo-pm-note-entry.js'

export type WoPmReadingRow = {
  idreading: number
  machine: string
  pmlist: string
  kind: 'current_3phase' | 'vibration_dst_db'
  measuredAt: string
  v1: number
  v2: number
  v3: number | null
  unit: string
  warningLimit: number | null
  alarmLimit: number | null
  wkctr: string
}

export type WoPmExecutionPayload = {
  notes: WoPmNoteEntry[]
  note: string
  noteUpdatedAt: string | null
  noteWkctr: string
  canEdit: boolean
  readings: WoPmReadingRow[]
}

type ReadingDbRow = {
  idreading: string
  machine: string
  pmlist: string
  kind: string
  measured_at: Date
  v1: string
  v2: string
  v3: string | null
  unit: string
  warning_limit: string | null
  alarm_limit: string | null
  wkctr: string
}

type NoteEntryDbRow = {
  identry: string
  note: string
  wkctr: string
  created_by: string
  created_at: Date
}

function mapReading(r: ReadingDbRow): WoPmReadingRow {
  return {
    idreading: Number(r.idreading),
    machine: r.machine?.trim() ?? '',
    pmlist: r.pmlist?.trim() ?? '',
    kind: r.kind as WoPmReadingRow['kind'],
    measuredAt: r.measured_at.toISOString(),
    v1: Number(r.v1),
    v2: Number(r.v2),
    v3: mapPmReadingV3FromDb(r.kind as WoPmReadingRow['kind'], r.v3),
    unit: r.unit?.trim() ?? '',
    warningLimit: r.warning_limit != null ? Number(r.warning_limit) : null,
    alarmLimit: r.alarm_limit != null ? Number(r.alarm_limit) : null,
    wkctr: r.wkctr?.trim() ?? '',
  }
}

function mapNoteEntry(r: NoteEntryDbRow): WoPmNoteEntry {
  return {
    identry: Number(r.identry),
    note: r.note?.trim() ?? '',
    wkctr: r.wkctr?.trim() ?? '',
    createdBy: r.created_by?.trim() ?? '',
    createdAt: r.created_at.toISOString(),
  }
}

function isPmExecutionSchemaMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes('tbwo_pm_note_entry') ||
    msg.includes('tbwo_pm_note') ||
    msg.includes('tbwo_pm_reading')
  )
}

export async function loadWoPmExecution(
  pool: Pool,
  idiw37: number,
  canEdit: boolean,
): Promise<WoPmExecutionPayload> {
  try {
    return await loadWoPmExecutionInner(pool, idiw37, canEdit)
  } catch (err) {
    if (isPmExecutionSchemaMissing(err)) {
      return {
        notes: [],
        note: '',
        noteUpdatedAt: null,
        noteWkctr: '',
        canEdit: false,
        readings: [],
      }
    }
    throw err
  }
}

async function loadNoteEntries(pool: Pool, idiw37: number): Promise<WoPmNoteEntry[]> {
  const noteR = await pool.query<NoteEntryDbRow>(
    `SELECT identry, note, wkctr, created_by, created_at
     FROM app.tbwo_pm_note_entry
     WHERE idiw37 = $1
     ORDER BY created_at ASC, identry ASC`,
    [idiw37],
  )
  return noteR.rows.map(mapNoteEntry)
}

async function loadWoPmExecutionInner(
  pool: Pool,
  idiw37: number,
  canEdit: boolean,
): Promise<WoPmExecutionPayload> {
  const notes = await loadNoteEntries(pool, idiw37)
  const latest = deriveLatestPmNote(notes)

  const readR = await pool.query<ReadingDbRow>(
    `SELECT idreading, machine, pmlist, kind, measured_at, v1, v2, v3, unit,
            warning_limit, alarm_limit, wkctr
     FROM app.tbwo_pm_reading
     WHERE idiw37 = $1
     ORDER BY measured_at ASC, idreading ASC`,
    [idiw37],
  )

  return {
    notes,
    note: latest.note,
    noteUpdatedAt: latest.noteUpdatedAt,
    noteWkctr: latest.noteWkctr,
    canEdit,
    readings: readR.rows.map(mapReading),
  }
}

export async function appendWoPmNote(
  pool: Pool,
  idiw37: number,
  note: string,
  wkctr: string,
  createdBy: string,
): Promise<WoPmNoteEntry> {
  const trimmed = note.trim()
  if (!trimmed) {
    throw new Error('EMPTY_PM_NOTE')
  }

  const r = await pool.query<NoteEntryDbRow>(
    `INSERT INTO app.tbwo_pm_note_entry (idiw37, note, wkctr, created_by, created_at)
     VALUES ($1, $2, $3, $4, now())
     RETURNING identry, note, wkctr, created_by, created_at`,
    [idiw37, trimmed, wkctr.trim(), createdBy.trim()],
  )
  return mapNoteEntry(r.rows[0]!)
}

export async function createWoPmReading(
  pool: Pool,
  input: {
    idiw37: number
    machine: string
    pmlist: string
    kind: 'current_3phase' | 'vibration_dst_db'
    measuredAt?: string
    v1: number
    v2: number
    v3?: number | null
    warningLimit?: number | null
    alarmLimit?: number | null
    wkctr: string
  },
): Promise<WoPmReadingRow> {
  const meta = pmMeasurementMeta(input.kind)
  const measuredAt = input.measuredAt?.trim()
    ? new Date(input.measuredAt)
    : new Date()
  if (Number.isNaN(measuredAt.getTime())) {
    throw new Error('INVALID_MEASURED_AT')
  }
  const v3 = normalizePmReadingV3ForWrite(input.kind, input.v3)

  const r = await pool.query<ReadingDbRow>(
    `INSERT INTO app.tbwo_pm_reading
       (idiw37, machine, pmlist, kind, measured_at, v1, v2, v3, unit,
        warning_limit, alarm_limit, wkctr)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING idreading, machine, pmlist, kind, measured_at, v1, v2, v3, unit,
               warning_limit, alarm_limit, wkctr`,
    [
      input.idiw37,
      input.machine.trim(),
      input.pmlist.trim(),
      input.kind,
      measuredAt,
      input.v1,
      input.v2,
      v3,
      meta?.unit ?? '',
      input.warningLimit ?? null,
      input.alarmLimit ?? null,
      input.wkctr.trim(),
    ],
  )
  return mapReading(r.rows[0]!)
}

export function buildTaskMeasurementFields(input: {
  pmlist?: string | null
  mpoint?: string | null
  ment?: string | null
}): {
  measurementKind: PmMeasurementKind
  mpoint: string
  measurementTitle: string
  axisLabels: [string, string, string]
  unit: string
} {
  const kind = inferPmMeasurementKind(input)
  const meta = pmMeasurementMeta(kind)
  return {
    measurementKind: kind,
    mpoint: (input.mpoint ?? '').trim(),
    measurementTitle: meta?.title ?? '',
    axisLabels: meta?.labels ?? ['ค่า 1', 'ค่า 2', 'ค่า 3'],
    unit: meta?.unit ?? '',
  }
}
