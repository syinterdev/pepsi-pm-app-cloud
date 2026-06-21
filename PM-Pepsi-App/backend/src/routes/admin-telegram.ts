import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  createTelegramGroupBodySchema,
  patchTelegramGroupBodySchema,
  telegramGroupDeleteResponseSchema,
  telegramGroupItemSchema,
  telegramGroupListResponseSchema,
  telegramLinkStatusResponseSchema,
  telegramSummaryResponseSchema,
  telegramTestSendBodySchema,
  telegramTestSendResponseSchema,
} from '../schemas/admin-telegram.js'
import {
  createTelegramGroup,
  deleteTelegramGroup,
  getTelegramLinkStatus,
  getTelegramSummary,
  isTelegramSchemaMissing,
  listTelegramGroups,
  telegramLinkStatusWhenSchemaMissing,
  telegramSummaryWhenSchemaMissing,
  patchTelegramGroup,
  testTelegramGroupSend,
} from '../services/admin-telegram.js'

const SCHEMA_HINT = 'รัน migration 099_telegram_notify.sql ก่อนใช้งาน Telegram Admin'

export function registerAdminTelegramRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const requireRead = createRequirePermission(pool, sessionSecret)('admin.telegram.read')
  const requireWrite = createRequirePermission(pool, sessionSecret)('admin.telegram.write')

  app.get('/api/v1/admin/telegram/summary', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const summary = await getTelegramSummary(pool)
      res.json(telegramSummaryResponseSchema.parse(summary))
    } catch (err) {
      if (isTelegramSchemaMissing(err)) {
        res.json(telegramSummaryResponseSchema.parse(telegramSummaryWhenSchemaMissing()))
        return
      }
      throw err
    }
  })

  app.get(
    '/api/v1/admin/telegram/link-status',
    ...requireRead,
    async (_req: Request, res: Response) => {
      try {
        const status = await getTelegramLinkStatus(pool)
        res.json(telegramLinkStatusResponseSchema.parse(status))
      } catch (err) {
        if (isTelegramSchemaMissing(err)) {
          res.json(telegramLinkStatusResponseSchema.parse(telegramLinkStatusWhenSchemaMissing()))
          return
        }
        throw err
      }
    },
  )

  app.get('/api/v1/admin/telegram/groups', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const items = await listTelegramGroups(pool)
      res.json(telegramGroupListResponseSchema.parse({ items }))
    } catch (err) {
      if (isTelegramSchemaMissing(err)) {
        res.json(telegramGroupListResponseSchema.parse({ items: [] }))
        return
      }
      throw err
    }
  })

  app.post('/api/v1/admin/telegram/groups', ...requireWrite, async (req: Request, res: Response) => {
    const parsed = createTelegramGroupBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
      return
    }
    try {
      const item = await createTelegramGroup(pool, parsed.data)
      voidAudit(pool, req, {
        action: 'admin.telegram.group.create',
        resource: 'tbl_telegram_notify_group',
        resourceId: String(item.id),
        status: 'ok',
        after: item,
      })
      res.status(201).json(telegramGroupItemSchema.parse(item))
    } catch (err) {
      if (isTelegramSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('unique') || message.includes('duplicate')) {
        res.status(409).json({ error: 'CONFLICT', message: 'code already exists' })
        return
      }
      throw err
    }
  })

  app.patch(
    '/api/v1/admin/telegram/groups/:id',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = patchTelegramGroupBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
        return
      }
      try {
        const item = await patchTelegramGroup(pool, id, parsed.data)
        if (!item) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'admin.telegram.group.update',
          resource: 'tbl_telegram_notify_group',
          resourceId: String(id),
          status: 'ok',
          after: item,
        })
        res.json(telegramGroupItemSchema.parse(item))
      } catch (err) {
        if (isTelegramSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
          return
        }
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('unique') || message.includes('duplicate')) {
          res.status(409).json({ error: 'CONFLICT', message: 'code already exists' })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/admin/telegram/groups/:id',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
        return
      }
      try {
        const ok = await deleteTelegramGroup(pool, id)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'admin.telegram.group.delete',
          resource: 'tbl_telegram_notify_group',
          resourceId: String(id),
          status: 'ok',
        })
        res.json(telegramGroupDeleteResponseSchema.parse({ ok: true, id }))
      } catch (err) {
        if (isTelegramSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.post(
    '/api/v1/admin/telegram/groups/:id/test',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = telegramTestSendBodySchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid id' })
        return
      }
      try {
        const result = await testTelegramGroupSend(pool, id, parsed.data.message)
        voidAudit(pool, req, {
          action: 'admin.telegram.group.test',
          resource: 'tbl_telegram_notify_group',
          resourceId: String(id),
          status: result.ok ? 'ok' : 'error',
          after: result,
        })
        res.json(telegramTestSendResponseSchema.parse(result))
      } catch (err) {
        if (isTelegramSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )
}
