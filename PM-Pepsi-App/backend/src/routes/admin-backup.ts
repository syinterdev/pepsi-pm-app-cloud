import type { Express, Request, Response } from 'express'
import { createReadStream } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Pool } from 'pg'
import multer from 'multer'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequireAnyPermission, createRequirePermission } from '../middleware/require-permission.js'
import {
  backupDeleteResponseSchema,
  backupListQuerySchema,
  backupListResponseSchema,
  backupScheduleResponseSchema,
  patchBackupScheduleBodySchema,
  restoreBackupResponseSchema,
  restoreConfirmBodySchema,
  startBackupResponseSchema,
} from '../schemas/admin-backup.js'
import { runRestoreFromGzipFile } from '../services/admin-backup-restore.js'
import {
  deleteBackupRecord,
  getBackupById,
  getBackupSettings,
  getLastSuccessfulBackup,
  isBackupTableMissing,
  listBackupHistory,
  patchBackupSettings,
  runBackupJob,
} from '../services/admin-backup.js'
import {
  isPgDumpAvailable,
  isPsqlAvailable,
  resolvePgDumpBin,
  resolvePsqlBin,
} from '../services/pg-dump-backup.js'

const restoreUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      void mkdtemp(path.join(os.tmpdir(), 'pm-restore-'))
        .then((dir) => cb(null, dir))
        .catch((err) => cb(err as Error, ''))
    },
    filename: (_req, _file, cb) => {
      cb(null, 'upload.sql.gz')
    },
  }),
  limits: {
    fileSize: Number(process.env.BACKUP_RESTORE_MAX_BYTES ?? 500 * 1024 * 1024),
  },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase()
    if (name.endsWith('.sql.gz') || name.endsWith('.gz')) {
      cb(null, true)
    } else {
      cb(new Error('Only .sql.gz files are allowed'))
    }
  },
})

const SCHEMA_HINT = 'รัน migration 062_tbl_backup_history.sql ก่อนใช้งาน Backup'

function actorId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.username ?? u.idwkctr ?? u.fullnameTh ?? 'unknown').trim() || 'unknown'
}

export function registerAdminBackupRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
  databaseUrl: string,
) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.backup.read',
  ])
  const requireWrite = createRequirePermission(pool, sessionSecret)('admin.backup.write')
  const requireDelete = createRequirePermission(pool, sessionSecret)('admin.backup.delete')
  const requireRestore = createRequirePermission(pool, sessionSecret)('admin.backup.restore')

  app.get('/api/v1/admin/backup', ...requireRead, async (req: Request, res: Response) => {
    const parsed = backupListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const { items, total } = await listBackupHistory(pool, parsed.data)
      res.json(
        backupListResponseSchema.parse({
          items,
          total,
          limit: parsed.data.limit,
          offset: parsed.data.offset,
        }),
      )
    } catch (err) {
      if (isBackupTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.get('/api/v1/admin/backup/schedule', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const settings = await getBackupSettings(pool)
      const lastSuccess = await getLastSuccessfulBackup(pool)
      res.json(
        backupScheduleResponseSchema.parse({
          ...settings,
          pgDumpAvailable: await isPgDumpAvailable(),
          psqlAvailable: await isPsqlAvailable(),
          pgDumpBin: resolvePgDumpBin(),
          psqlBin: resolvePsqlBin(),
          lastSuccess: lastSuccess ?? null,
        }),
      )
    } catch (err) {
      if (isBackupTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.put('/api/v1/admin/backup/schedule', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = patchBackupScheduleBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      await patchBackupSettings(pool, parsed.data, actorId(req))
      const settings = await getBackupSettings(pool)
      voidAudit(pool, req, {
        action: 'admin.backup.schedule',
        resource: 'tbl_setting',
        resourceId: 'backup',
        status: 'ok',
        after: settings,
      })
      const lastSuccess = await getLastSuccessfulBackup(pool)
      res.json(
        backupScheduleResponseSchema.parse({
          ...settings,
          pgDumpAvailable: await isPgDumpAvailable(),
          psqlAvailable: await isPsqlAvailable(),
          pgDumpBin: resolvePgDumpBin(),
          psqlBin: resolvePsqlBin(),
          lastSuccess: lastSuccess ?? null,
        }),
      )
    } catch (err) {
      if (isBackupTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post('/api/v1/admin/backup', ...requireWrite, async (req: Request, res: Response) => {
    if (!(await isPgDumpAvailable())) {
      res.status(503).json({
        error: 'PG_DUMP_UNAVAILABLE',
        message: 'ไม่พบ pg_dump ใน PATH — ตั้ง PG_DUMP_PATH หรือติดตั้ง PostgreSQL client tools',
      })
      return
    }
    try {
      const item = await runBackupJob(pool, {
        trigger: 'manual',
        startedBy: actorId(req),
        databaseUrl,
      })
      voidAudit(pool, req, {
        action: 'admin.backup.run',
        resource: 'tbl_backup_history',
        resourceId: String(item.id),
        status: item.status === 'success' ? 'ok' : 'error',
        after: { status: item.status, filePath: item.filePath },
      })
      res.status(item.status === 'success' ? 201 : 500).json(startBackupResponseSchema.parse({ item }))
    } catch (err) {
      if (err instanceof Error && err.message === 'BACKUP_ALREADY_RUNNING') {
        res.status(409).json({ error: 'BACKUP_ALREADY_RUNNING', message: 'มีการสำรองข้อมูลอยู่แล้ว' })
        return
      }
      if (isBackupTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/backup/restore',
    ...requireRestore,
    restoreUpload.single('file'),
    async (req: Request, res: Response) => {
      const parsed = restoreConfirmBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const file = req.file
      if (!file?.path) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ต้องแนบไฟล์ .sql.gz' })
        return
      }
      if (!(await isPsqlAvailable())) {
        res.status(503).json({
          error: 'PSQL_UNAVAILABLE',
          message: 'ไม่พบ psql ใน PATH — ตั้ง PSQL_PATH หรือติดตั้ง PostgreSQL client tools',
        })
        return
      }
      try {
        const { durationMs } = await runRestoreFromGzipFile(
          pool,
          databaseUrl,
          file.path,
          actorId(req),
          { deleteFileAfter: true },
        )
        voidAudit(pool, req, {
          action: 'admin.backup.restore',
          resource: 'database',
          status: 'ok',
          message: 'upload',
          after: { durationMs },
        })
        res.json(
          restoreBackupResponseSchema.parse({
            ok: true,
            durationMs,
            source: 'upload',
          }),
        )
      } catch (err) {
        voidAudit(pool, req, {
          action: 'admin.backup.restore',
          resource: 'database',
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        })
        res.status(500).json({
          error: 'RESTORE_FAILED',
          message: err instanceof Error ? err.message : String(err),
        })
      }
    },
  )

  app.post('/api/v1/admin/backup/:id/restore', ...requireRestore, async (req: Request, res: Response) => {
    const parsed = restoreConfirmBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
      return
    }
    if (!(await isPsqlAvailable())) {
      res.status(503).json({
        error: 'PSQL_UNAVAILABLE',
        message: 'ไม่พบ psql ใน PATH — ตั้ง PSQL_PATH หรือติดตั้ง PostgreSQL client tools',
      })
      return
    }
    try {
      const item = await getBackupById(pool, id)
      if (!item?.filePath || item.status !== 'success') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      const { durationMs } = await runRestoreFromGzipFile(
        pool,
        databaseUrl,
        item.filePath,
        actorId(req),
        { deleteFileAfter: false },
      )
      voidAudit(pool, req, {
        action: 'admin.backup.restore',
        resource: 'tbl_backup_history',
        resourceId: String(id),
        status: 'ok',
        after: { durationMs },
      })
      res.json(
        restoreBackupResponseSchema.parse({
          ok: true,
          durationMs,
          source: 'history',
          backupId: id,
        }),
      )
    } catch (err) {
      voidAudit(pool, req, {
        action: 'admin.backup.restore',
        resource: 'tbl_backup_history',
        resourceId: String(req.params.id),
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
      if (isBackupTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      res.status(500).json({
        error: 'RESTORE_FAILED',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  })

  app.get('/api/v1/admin/backup/:id/download', ...requireRead, async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
      return
    }
    try {
      const item = await getBackupById(pool, id)
      if (!item?.filePath || item.status !== 'success') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      const fileName = path.basename(item.filePath)
      res.setHeader('Content-Type', 'application/gzip')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      createReadStream(item.filePath).pipe(res)
    } catch (err) {
      if (isBackupTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.delete('/api/v1/admin/backup/:id', ...requireDelete, async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
      return
    }
    try {
      const ok = await deleteBackupRecord(pool, id)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      voidAudit(pool, req, {
        action: 'admin.backup.delete',
        resource: 'tbl_backup_history',
        resourceId: String(id),
        status: 'ok',
      })
      res.json(backupDeleteResponseSchema.parse({ ok: true, id }))
    } catch (err) {
      if (isBackupTableMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })
}
