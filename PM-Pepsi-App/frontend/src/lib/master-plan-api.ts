import { fetchApi } from '@/lib/fetch-api'
import { getApiBaseUrl } from '@/lib/api-client'
import { getAuthToken } from '@/features/auth/login-api'
import { z } from 'zod'

export type MasterPlanDiscipline = 'EE' | 'ME' | 'PK'

const masterPlanSheetSummarySchema = z.object({
  id: z.number().int(),
  sheetName: z.string(),
  sortOrder: z.number().int(),
  sheetKind: z.enum(['detail', 'summary', 'legend', 'reference']),
  rowCount: z.number().int(),
})

const masterPlanWorkbookSchema = z.object({
  discipline: z.enum(['EE', 'ME', 'PK']),
  planYear: z.number().int(),
  sourceFilename: z.string(),
  versionNo: z.number().int(),
  sheets: z.array(masterPlanSheetSummarySchema),
})

const masterPlanSheetRowsSchema = z.object({
  sheetId: z.number().int(),
  sheetName: z.string(),
  sheetKind: z.enum(['detail', 'summary', 'legend', 'reference']),
  titleRows: z.array(z.array(z.string())),
  columnHeaders: z.array(z.string()),
  displayColumns: z.array(z.string()),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  rows: z.array(
    z.object({
      id: z.coerce.number().int(),
      rowIndex: z.number().int(),
      cells: z.record(z.string(), z.string()),
      display: z.record(z.string(), z.string()),
    }),
  ),
})

export type MasterPlanWorkbook = z.infer<typeof masterPlanWorkbookSchema>
export type MasterPlanSheetRows = z.infer<typeof masterPlanSheetRowsSchema>

export async function fetchMasterPlanWorkbook(
  discipline: MasterPlanDiscipline,
): Promise<MasterPlanWorkbook> {
  const data = await fetchApi<unknown>(`/api/v1/master-plan/${discipline}`)
  return masterPlanWorkbookSchema.parse(data)
}

export async function fetchMasterPlanSheetRows(
  sheetId: number,
  discipline: MasterPlanDiscipline,
  offset = 0,
  limit = 2000,
): Promise<MasterPlanSheetRows> {
  const qs = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    discipline,
  })
  const data = await fetchApi<unknown>(`/api/v1/master-plan/sheets/${sheetId}/rows?${qs}`)
  return masterPlanSheetRowsSchema.parse(data)
}

const masterPlanSearchItemSchema = z.object({
  rowId: z.number().int(),
  rowIndex: z.number().int(),
  sheetId: z.number().int(),
  sheetName: z.string(),
  label: z.string(),
})

const masterPlanSearchResponseSchema = z.object({
  query: z.string(),
  items: z.array(masterPlanSearchItemSchema),
})

export type MasterPlanSearchItem = z.infer<typeof masterPlanSearchItemSchema>

export async function fetchMasterPlanSearch(
  discipline: MasterPlanDiscipline,
  query: string,
  limit = 50,
): Promise<{ query: string; items: MasterPlanSearchItem[] }> {
  const qs = new URLSearchParams({ q: query, limit: String(limit) })
  const data = await fetchApi<unknown>(`/api/v1/master-plan/${discipline}/search?${qs}`)
  return masterPlanSearchResponseSchema.parse(data)
}

const masterPlanPatchRowResponseSchema = z.object({
  rowId: z.number().int(),
  sheetId: z.number().int(),
  cells: z.record(z.string(), z.string()),
  changedFields: z.array(z.string()),
})

export type MasterPlanPatchRowResponse = z.infer<typeof masterPlanPatchRowResponseSchema>

export async function patchMasterPlanRow(
  rowId: number,
  body: { cells: Record<string, string>; comment?: string },
): Promise<MasterPlanPatchRowResponse> {
  const data = await fetchApi<unknown>(`/api/v1/master-plan/rows/${rowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return masterPlanPatchRowResponseSchema.parse(data)
}

const masterPlanChangeItemSchema = z.object({
  id: z.coerce.number().int(),
  rowId: z.coerce.number().int(),
  sheetId: z.coerce.number().int(),
  sheetName: z.string().optional(),
  rowIndex: z.coerce.number().int().optional(),
  changeType: z.enum(['create', 'update', 'delete', 'import', 'publish']),
  fieldName: z.string().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  changedBy: z.string(),
  changedAt: z.string(),
  comment: z.string().nullable(),
})

const masterPlanChangesResponseSchema = z.object({
  items: z.array(masterPlanChangeItemSchema),
  total: z.coerce.number().int(),
  limit: z.coerce.number().int(),
})

export type MasterPlanChangeItem = z.infer<typeof masterPlanChangeItemSchema>
export type MasterPlanChangesResponse = z.infer<typeof masterPlanChangesResponseSchema>

export type MasterPlanChangesParams = {
  discipline?: MasterPlanDiscipline
  sheetId?: number
  from?: string
  to?: string
  changedBy?: string
  fieldName?: string
  limit?: number
}

export async function fetchMasterPlanChanges(
  params: MasterPlanChangesParams,
): Promise<MasterPlanChangesResponse> {
  const qs = new URLSearchParams()
  if (params.discipline) qs.set('discipline', params.discipline)
  if (params.sheetId != null) qs.set('sheetId', String(params.sheetId))
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  if (params.changedBy) qs.set('changedBy', params.changedBy)
  if (params.fieldName) qs.set('fieldName', params.fieldName)
  qs.set('limit', String(params.limit ?? 200))
  const data = await fetchApi<unknown>(`/api/v1/master-plan/changes?${qs}`)
  return masterPlanChangesResponseSchema.parse(data)
}

const masterPlanLinkKeysSchema = z.object({
  zone: z.string(),
  machineList: z.string(),
  mntplan: z.string(),
  tasklist: z.string(),
  legacy: z.string(),
  pmlist: z.string(),
  machine: z.string(),
  mpoint: z.string(),
})

const masterPlanRowLinksResponseSchema = z.object({
  rowId: z.coerce.number().int(),
  sheetId: z.coerce.number().int(),
  sheetName: z.string(),
  rowIndex: z.coerce.number().int(),
  discipline: z.enum(['EE', 'ME', 'PK']),
  keys: masterPlanLinkKeysSchema,
  iw37n: z.object({
    count: z.coerce.number().int(),
    wkOrders: z.array(z.string()),
  }),
  workOrders: z.object({
    count: z.coerce.number().int(),
    wkOrders: z.array(z.string()),
  }),
  tasklist: z.object({
    count: z.coerce.number().int(),
    mntplan: z.string().optional(),
  }),
  equipment: z.object({
    count: z.coerce.number().int(),
    equipment: z.array(z.string()),
  }),
  zone: z.object({
    count: z.coerce.number().int(),
    zones: z.array(z.string()),
  }),
  pmMeasurements: z.object({
    current3Phase: z.object({
      suggested: z.boolean(),
      pmlist: z.string().optional(),
    }),
    vibrationDstDb: z.object({
      suggested: z.boolean(),
      pmlist: z.string().optional(),
    }),
  }),
})

export type MasterPlanRowLinks = z.infer<typeof masterPlanRowLinksResponseSchema>

export async function fetchMasterPlanRowLinks(rowId: number): Promise<MasterPlanRowLinks> {
  const data = await fetchApi<unknown>(`/api/v1/master-plan/rows/${rowId}/links`)
  return masterPlanRowLinksResponseSchema.parse(data)
}

const masterPlanImportDiffSchema = z.object({
  structure: z.object({
    ok: z.boolean(),
    missingSheets: z.array(z.string()),
    extraSheets: z.array(z.string()),
    orderMismatch: z.boolean(),
    publishedNames: z.array(z.string()),
    importedNames: z.array(z.string()),
  }),
  sheets: z.array(
    z.object({
      sheetName: z.string(),
      rowsAdded: z.number().int(),
      rowsRemoved: z.number().int(),
      rowsChanged: z.number().int(),
      publishedRowCount: z.number().int(),
      importedRowCount: z.number().int(),
    }),
  ),
  totalRowsAdded: z.number().int(),
  totalRowsRemoved: z.number().int(),
  totalRowsChanged: z.number().int(),
  sampleChanges: z.array(
    z.object({
      sheetName: z.string(),
      rowIndex: z.number().int(),
      fieldName: z.string(),
      before: z.string(),
      after: z.string(),
    }),
  ),
})

const masterPlanImportResponseSchema = z.object({
  workbookId: z.number().int(),
  versionNo: z.number().int(),
  status: z.literal('draft'),
  rowCount: z.number().int(),
  diff: masterPlanImportDiffSchema,
})

export type MasterPlanImportResponse = z.infer<typeof masterPlanImportResponseSchema>

const masterPlanStatusSchema = z.object({
  discipline: z.enum(['EE', 'ME', 'PK']),
  planYear: z.number().int(),
  published: z
    .object({
      versionNo: z.number().int(),
      sourceFilename: z.string(),
      importedAt: z.string(),
    })
    .nullable(),
  draft: z
    .object({
      versionNo: z.number().int(),
      sourceFilename: z.string(),
      importedAt: z.string(),
    })
    .nullable(),
  tasklistSync: z.enum(['in_sync', 'diverged', 'never_published', 'unknown']),
  tasklistPublishableRows: z.number().int(),
  tasklistMatchedRows: z.number().int(),
})

export type MasterPlanStatus = z.infer<typeof masterPlanStatusSchema>

const masterPlanPublishResponseSchema = z.object({
  promotedDraft: z.boolean(),
  versionNo: z.number().int(),
  tasklist: z.object({
    inserted: z.number().int(),
    updated: z.number().int(),
    skipped: z.number().int(),
    failed: z.number().int(),
  }),
  publishableRows: z.number().int(),
  skippedRows: z.number().int(),
})

export type MasterPlanPublishResponse = z.infer<typeof masterPlanPublishResponseSchema>

export async function fetchMasterPlanStatus(
  discipline: MasterPlanDiscipline,
): Promise<MasterPlanStatus> {
  const data = await fetchApi<unknown>(`/api/v1/master-plan/${discipline}/status`)
  return masterPlanStatusSchema.parse(data)
}

export async function importMasterPlanExcel(
  discipline: MasterPlanDiscipline,
  file: File,
): Promise<MasterPlanImportResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('discipline', discipline)
  const data = await fetchApi<unknown>('/api/v1/master-plan/import', {
    method: 'POST',
    body: form,
  })
  return masterPlanImportResponseSchema.parse(data)
}

export async function publishMasterPlan(
  discipline: MasterPlanDiscipline,
): Promise<MasterPlanPublishResponse> {
  const data = await fetchApi<unknown>('/api/v1/master-plan/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discipline }),
  })
  return masterPlanPublishResponseSchema.parse(data)
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadMasterPlanExport(
  discipline: MasterPlanDiscipline,
  status: 'published' | 'draft' = 'published',
): Promise<void> {
  const base = getApiBaseUrl()
  const p = `/api/v1/master-plan/${discipline}/export?status=${status}`
  const url = base ? `${base}${p}` : p
  const token = getAuthToken()
  const res = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = /filename="([^"]+)"/i.exec(disposition)
  const fileName = match?.[1] ?? `master-plan-${discipline}.xlsx`
  const blob = await res.blob()
  downloadBlob(blob, fileName)
}
