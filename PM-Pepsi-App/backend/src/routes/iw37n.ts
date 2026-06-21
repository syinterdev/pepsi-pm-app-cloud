import { getMulterFileSizeLimit } from '../lib/upload-settings.js'
import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import multer from 'multer'
import { voidAudit, sanitizeAuditPayload } from '../lib/audit-mutation.js'
import {
  createRequireAnyPermission,
  createRequirePermission,
} from '../middleware/require-permission.js'
import {
  iw37nBatchRowsQuerySchema,
  iw37nBatchRowsResponseSchema,
  iw37nBatchesResponseSchema,
  iw37nItemResponseSchema,
  iw37nItemsQuerySchema,
  iw37nItemsResponseSchema,
  iw37nImportPreviewResponseSchema,
  iw37nImportResponseSchema,
  iw37nOkResponseSchema,
  iw37nUpdateItemBodySchema,
} from '../schemas/iw37n.js'
import {
  deleteIw37nItem,
  getIw37nItem,
  importIw37nFile,
  previewIw37nFile,
  listIw37nBatchRows,
  listIw37nBatches,
  listIw37nItems,
  updateIw37nItem,
} from '../services/iw37n.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getMulterFileSizeLimit() },
})

function isSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbiw37n_import_batch') ||
    message.includes('tbiw37n_import_row') ||
    message.includes('tbiw37n')
  )
}

export function registerIw37nRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireRead = createRequirePermission(pool, sessionSecret)('iw37n.read')
  const requireWrite = createRequirePermission(pool, sessionSecret)('iw37n.write')
  const requireImport = createRequireAnyPermission(pool, sessionSecret)([
    'iw37n.import',
    'iw37n.write',
  ])

  function escapeCsvCell(value: unknown): string {
    const raw = value == null ? '' : String(value)
    const needsQuote = /[",\r\n]/.test(raw)
    if (!needsQuote) return raw
    return `"${raw.replaceAll('"', '""')}"`
  }

  app.get(
    '/api/v1/iw37n/batches',
    ...requireRead,
    async (_req: Request, res: Response) => {
      try {
        const items = await listIw37nBatches(pool)
        res.json(iw37nBatchesResponseSchema.parse({ items }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 004_tbiw37n_calendar.sql and 006_tbiw37n_import_batch.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/iw37n/batches/:id/export.csv',
    ...requireRead,
    async (req: Request, res: Response) => {
      const batchId = String(req.params.id ?? '')
      const idNum = Number(batchId)
      if (!Number.isFinite(idNum)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid batch id' })
        return
      }
      try {
        const r = await pool.query<{
          row_no: number
          action: string
          wkorder: string | null
          opac: string | null
          mntplan: string | null
          wktype: string | null
          mat: string | null
          syst: string | null
          message: string | null
          created_at: Date
        }>(
          `SELECT row_no, action, wkorder, opac, mntplan, wktype, mat, syst, message, created_at
           FROM app.tbiw37n_import_row
           WHERE batch_id = $1
           ORDER BY row_no ASC`,
          [idNum],
        )

        const lines: string[] = []
        lines.push(
          [
            'rowNo',
            'action',
            'wkorder',
            'opac',
            'mntplan',
            'wktype',
            'mat',
            'syst',
            'message',
            'createdAt',
          ].join(','),
        )
        for (const x of r.rows) {
          lines.push(
            [
              escapeCsvCell(x.row_no),
              escapeCsvCell(x.action),
              escapeCsvCell(x.wkorder ?? ''),
              escapeCsvCell(x.opac ?? ''),
              escapeCsvCell(x.mntplan ?? ''),
              escapeCsvCell(x.wktype ?? ''),
              escapeCsvCell(x.mat ?? ''),
              escapeCsvCell(x.syst ?? ''),
              escapeCsvCell(x.message ?? ''),
              escapeCsvCell(x.created_at.toISOString()),
            ].join(','),
          )
        }
        const bom = '\ufeff'
        const csv = bom + lines.join('\r\n') + '\r\n'
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="iw37n-import-batch-${idNum}.csv"`,
        )
        res.status(200).send(csv)
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 004_tbiw37n_calendar.sql, 006_tbiw37n_import_batch.sql, and 030_tbiw37n_import_row.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/iw37n/batches/:id/rows',
    ...requireRead,
    async (req: Request, res: Response) => {
      const batchId = String(req.params.id ?? '')
      const parsed = iw37nBatchRowsQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid query' })
        return
      }
      try {
        const items = await listIw37nBatchRows(pool, batchId, parsed.data)
        res.json(iw37nBatchRowsResponseSchema.parse({ batchId, items }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 004_tbiw37n_calendar.sql, 006_tbiw37n_import_batch.sql, and 030_tbiw37n_import_row.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/iw37n/items',
    ...requireRead,
    async (req: Request, res: Response) => {
      const parsed = iw37nItemsQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid query' })
        return
      }
      try {
        const items = await listIw37nItems(pool, parsed.data)
        res.json(iw37nItemsResponseSchema.parse({ items }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migrations 004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.get(
    '/api/v1/iw37n/items/:id',
    ...requireRead,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      try {
        const item = await getIw37nItem(pool, id)
        if (!item) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'IW37N item not found' })
          return
        }
        res.json(iw37nItemResponseSchema.parse({ item }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migrations 004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/iw37n/items/:id',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      const parsed = iw37nUpdateItemBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid body' })
        return
      }
      try {
        const out = await updateIw37nItem(pool, id, parsed.data)
        if (out.kind === 'not_found') {
          res.status(404).json({ error: 'NOT_FOUND', message: 'IW37N item not found' })
          return
        }
        if (out.kind === 'validation') {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: out.message })
          return
        }
        if (out.kind === 'duplicate_key') {
          res.status(409).json({ error: 'DUPLICATE_KEY', message: out.message })
          return
        }
        voidAudit(pool, req, {
          action: 'iw37n.write',
          resource: 'tbiw37n',
          resourceId: id,
          after: sanitizeAuditPayload(parsed.data),
        })
        res.json(iw37nItemResponseSchema.parse({ item: out.item }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migrations 004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/iw37n/items/:id',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const id = String(req.params.id ?? '')
      const idNum = Number(id)
      if (!Number.isFinite(idNum)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
        return
      }
      try {
        const ok = await deleteIw37nItem(pool, id)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'IW37N item not found' })
          return
        }
        voidAudit(pool, req, {
          action: 'iw37n.delete',
          resource: 'tbiw37n',
          resourceId: id,
        })
        res.json(iw37nOkResponseSchema.parse({ ok: true }))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message: 'Run migrations 004_tbiw37n_calendar.sql',
          })
          return
        }
        throw err
      }
    },
  )

  const handleImportUpload = (req: Request, res: Response, mode: 'preview' | 'commit') => {
    void (async () => {
      const file = req.file
      if (!file?.buffer?.length) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Multipart field "file" (.xls, .xlsx, .xlsm, .csv) is required',
        })
        return
      }

      const fileName = file.originalname || 'upload.xlsx'
      const lower = fileName.toLowerCase()
      if (
        !lower.endsWith('.xls') &&
        !lower.endsWith('.xlsx') &&
        !lower.endsWith('.xlsm') &&
        !lower.endsWith('.csv')
      ) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Only .xls, .xlsx, .xlsm, or .csv files are allowed',
        })
        return
      }

      try {
        if (mode === 'preview') {
          const result = await previewIw37nFile(pool, fileName, file.buffer)
          res.json(iw37nImportPreviewResponseSchema.parse({ preview: true, ...result }))
          return
        }
        const result = await importIw37nFile(pool, fileName, file.buffer)
        voidAudit(pool, req, {
          action: 'iw37n.import',
          resource: 'tbiw37n',
          after: { fileName, ...result },
        })
        res.json(iw37nImportResponseSchema.parse(result))
      } catch (err) {
        if (isSchemaMissing(err)) {
          res.status(503).json({
            error: 'SCHEMA_NOT_READY',
            message:
              'Run migrations 004_tbiw37n_calendar.sql, 006_tbiw37n_import_batch.sql, and 030_tbiw37n_import_row.sql',
          })
          return
        }
        const message = err instanceof Error ? err.message : 'Import failed'
        res.status(400).json({ error: 'IMPORT_FAILED', message })
      }
    })()
  }

  app.post(
    '/api/v1/iw37n/import/preview',
    ...requireImport,
    upload.single('file'),
    (req, res) => handleImportUpload(req, res, 'preview'),
  )

  app.post(
    '/api/v1/iw37n/import',
    ...requireImport,
    upload.single('file'),
    (req, res) => handleImportUpload(req, res, 'commit'),
  )
}
