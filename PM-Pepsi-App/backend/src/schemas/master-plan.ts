import { z } from 'zod'

export const masterPlanDisciplineSchema = z.enum(['EE', 'ME', 'PK'])

export const masterPlanSheetSummarySchema = z.object({
  id: z.number().int(),
  sheetName: z.string(),
  sortOrder: z.number().int(),
  sheetKind: z.enum(['detail', 'summary', 'legend', 'reference']),
  rowCount: z.number().int(),
})

export const masterPlanWorkbookResponseSchema = z.object({
  discipline: masterPlanDisciplineSchema,
  planYear: z.number().int(),
  sourceFilename: z.string(),
  versionNo: z.number().int(),
  sheets: z.array(masterPlanSheetSummarySchema),
})

export const masterPlanSheetRowSchema = z.object({
  id: z.number().int(),
  rowIndex: z.number().int(),
  cells: z.record(z.string()),
  display: z.record(z.string()),
})

export const masterPlanSheetRowsResponseSchema = z.object({
  sheetId: z.number().int(),
  sheetName: z.string(),
  sheetKind: z.enum(['detail', 'summary', 'legend', 'reference']),
  titleRows: z.array(z.array(z.string())),
  columnHeaders: z.array(z.string()),
  displayColumns: z.array(z.string()),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  rows: z.array(masterPlanSheetRowSchema),
})

export const masterPlanSearchItemSchema = z.object({
  rowId: z.number().int(),
  rowIndex: z.number().int(),
  sheetId: z.number().int(),
  sheetName: z.string(),
  label: z.string(),
})

export const masterPlanSearchResponseSchema = z.object({
  query: z.string(),
  items: z.array(masterPlanSearchItemSchema),
})

export type MasterPlanSearchResponse = z.infer<typeof masterPlanSearchResponseSchema>

export type MasterPlanWorkbookResponse = z.infer<typeof masterPlanWorkbookResponseSchema>
export type MasterPlanSheetRowsResponse = z.infer<typeof masterPlanSheetRowsResponseSchema>

export const masterPlanPatchRowBodySchema = z.object({
  cells: z.record(z.string()).refine((cells) => Object.keys(cells).length > 0, {
    message: 'At least one cell is required',
  }),
  comment: z.string().max(2000).optional(),
})

export const masterPlanPatchRowResponseSchema = z.object({
  rowId: z.number().int(),
  sheetId: z.number().int(),
  cells: z.record(z.string()),
  changedFields: z.array(z.string()),
})

export const masterPlanChangeItemSchema = z.object({
  id: z.number().int(),
  rowId: z.number().int(),
  sheetId: z.number().int(),
  sheetName: z.string().optional(),
  rowIndex: z.number().int().optional(),
  changeType: z.enum(['create', 'update', 'delete', 'import', 'publish']),
  fieldName: z.string().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  changedBy: z.string(),
  changedAt: z.string(),
  comment: z.string().nullable(),
})

export const masterPlanChangesResponseSchema = z.object({
  items: z.array(masterPlanChangeItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
})

export const masterPlanChangesQuerySchema = z.object({
  discipline: masterPlanDisciplineSchema.optional(),
  sheetId: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  changedBy: z.string().optional(),
  fieldName: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
})

export type MasterPlanPatchRowBody = z.infer<typeof masterPlanPatchRowBodySchema>
export type MasterPlanChangeItem = z.infer<typeof masterPlanChangeItemSchema>

export const masterPlanLinkKeysSchema = z.object({
  zone: z.string(),
  machineList: z.string(),
  mntplan: z.string(),
  tasklist: z.string(),
  legacy: z.string(),
  machine: z.string(),
  pmlist: z.string(),
  mpoint: z.string(),
})

export const masterPlanRowLinksResponseSchema = z.object({
  rowId: z.coerce.number().int(),
  sheetId: z.coerce.number().int(),
  sheetName: z.string(),
  rowIndex: z.coerce.number().int(),
  discipline: masterPlanDisciplineSchema,
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

export type MasterPlanRowLinksResponse = z.infer<typeof masterPlanRowLinksResponseSchema>

const masterPlanStructureDiffSchema = z.object({
  ok: z.boolean(),
  missingSheets: z.array(z.string()),
  extraSheets: z.array(z.string()),
  orderMismatch: z.boolean(),
  publishedNames: z.array(z.string()),
  importedNames: z.array(z.string()),
})

const masterPlanSheetDiffSchema = z.object({
  sheetName: z.string(),
  rowsAdded: z.number().int(),
  rowsRemoved: z.number().int(),
  rowsChanged: z.number().int(),
  publishedRowCount: z.number().int(),
  importedRowCount: z.number().int(),
})

const masterPlanCellChangeSampleSchema = z.object({
  sheetName: z.string(),
  rowIndex: z.number().int(),
  fieldName: z.string(),
  before: z.string(),
  after: z.string(),
})

export const masterPlanImportDiffSchema = z.object({
  structure: masterPlanStructureDiffSchema,
  sheets: z.array(masterPlanSheetDiffSchema),
  totalRowsAdded: z.number().int(),
  totalRowsRemoved: z.number().int(),
  totalRowsChanged: z.number().int(),
  sampleChanges: z.array(masterPlanCellChangeSampleSchema),
})

export const masterPlanImportResponseSchema = z.object({
  workbookId: z.number().int(),
  versionNo: z.number().int(),
  status: z.literal('draft'),
  rowCount: z.number().int(),
  diff: masterPlanImportDiffSchema,
})

export const masterPlanPublishBodySchema = z.object({
  discipline: masterPlanDisciplineSchema,
})

export const masterPlanPublishResponseSchema = z.object({
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

export const masterPlanStatusResponseSchema = z.object({
  discipline: masterPlanDisciplineSchema,
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

export type MasterPlanImportDiff = z.infer<typeof masterPlanImportDiffSchema>
export type MasterPlanStatusResponse = z.infer<typeof masterPlanStatusResponseSchema>

export const masterPlanImportSpecItemSchema = z.object({
  discipline: masterPlanDisciplineSchema,
  referenceFilename: z.string(),
  labelEn: z.string(),
  labelTh: z.string(),
  sampleSheetNames: z.array(z.string()),
})

export const masterPlanImportSpecResponseSchema = z.object({
  items: z.array(masterPlanImportSpecItemSchema),
})

export type MasterPlanImportSpecResponse = z.infer<typeof masterPlanImportSpecResponseSchema>
