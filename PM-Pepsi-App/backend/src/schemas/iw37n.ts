import { z } from 'zod'

export const iw37nBatchItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  importedAt: z.string(),
  rows: z.number(),
  sha256: z.string(),
  status: z.enum(['OK', 'PARTIAL', 'ERR']),
  isDuplicate: z.boolean(),
  duplicateOfBatchId: z.string().nullable(),
})

export const iw37nBatchesResponseSchema = z.object({
  items: z.array(iw37nBatchItemSchema),
})

const iw37nImportRowSchema = z.object({
  rowNo: z.number(),
  action: z.enum(['inserted', 'updated', 'skipped', 'error']),
  wkorder: z.string(),
  opac: z.string(),
  mntplan: z.string(),
  wktype: z.string(),
  mat: z.string(),
  syst: z.string(),
  message: z.string(),
})

export const iw37nImportSummarySchema = z.object({
  fileName: z.string(),
  sha256: z.string(),
  totalRows: z.number(),
  inserted: z.number(),
  updated: z.number(),
  skipped: z.number(),
  errors: z.number(),
  isDuplicate: z.boolean(),
  duplicateOfBatchId: z.string().nullable(),
  wouldStatus: z.enum(['OK', 'PARTIAL', 'ERR']),
  errorGroups: z.array(z.object({ message: z.string(), count: z.number() })),
})

export const iw37nImportPreviewResponseSchema = z.object({
  preview: z.literal(true),
  summary: iw37nImportSummarySchema,
  rows: z.array(iw37nImportRowSchema),
})

export const iw37nImportResponseSchema = z.object({
  batch: iw37nBatchItemSchema,
  rows: z.array(iw37nImportRowSchema),
})

export const iw37nBatchRowsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export const iw37nBatchRowsResponseSchema = z.object({
  batchId: z.string(),
  items: z.array(
    z.object({
      rowNo: z.number(),
      action: z.enum(['inserted', 'updated', 'skipped', 'error']),
      wkorder: z.string(),
      opac: z.string(),
      mntplan: z.string(),
      wktype: z.string(),
      mat: z.string(),
      syst: z.string(),
      message: z.string(),
      createdAt: z.string(),
    }),
  ),
})

export const iw37nItemSchema = z.object({
  idiw37: z.number(),
  mntplan: z.string(),
  wkorder: z.string(),
  wktype: z.string(),
  mat: z.string(),
  bscstart: z.number().nullable(),
  actfinish: z.number().nullable(),
  systemstatus: z.string(),
  syst: z.string(),
  opac: z.string(),
  operationshorttext: z.string(),
  ostdescription: z.string(),
  cknow: z.string(),
  wkctr: z.string(),
  work: z.number().nullable(),
  actwork: z.number().nullable(),
  untime: z.number().nullable(),
  equipment: z.string(),
  equdescrip: z.string(),
  functionalloc: z.string(),
  funcdescrip: z.string(),
  team: z.string().nullable(),
})

export const iw37nItemsQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export const iw37nItemsResponseSchema = z.object({
  items: z.array(iw37nItemSchema),
})

export const iw37nItemResponseSchema = z.object({
  item: iw37nItemSchema,
})

export const iw37nUpdateItemBodySchema = z.object({
  mntplan: z.string(),
  wkorder: z.string(),
  wktype: z.string(),
  mat: z.string(),
  bscstart: z.union([z.number(), z.string()]).nullable(),
  actfinish: z.union([z.number(), z.string()]).nullable(),
  systemstatus: z.string(),
  opac: z.string(),
  operationshorttext: z.string(),
  ostdescription: z.string(),
  cknow: z.string(),
  wkctr: z.string(),
  work: z.union([z.number(), z.string()]).nullable(),
  actwork: z.union([z.number(), z.string()]).nullable(),
  untime: z.union([z.number(), z.string()]).nullable(),
  equipment: z.string(),
  equdescrip: z.string(),
  functionalloc: z.string(),
  funcdescrip: z.string(),
  team: z.string().nullable().optional(),
})

export const iw37nOkResponseSchema = z.object({
  ok: z.boolean(),
})
