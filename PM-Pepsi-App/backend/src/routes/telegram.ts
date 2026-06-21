import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { voidAudit } from '../lib/audit-mutation.js'
import { getTelegramWebhookSecret } from '../lib/telegram-bot.js'
import { createRequireApiAuth } from '../middleware/require-api-auth.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  telegramLinkStatusSchema,
  telegramLinkTokenResponseSchema,
  telegramUnlinkResponseSchema,
  telegramWebhookOkSchema,
} from '../schemas/telegram-link.js'
import {
  createTelegramLinkToken,
  getTelegramLinkStatusForIdwkctr,
  isTelegramLinkSchemaMissing,
  unlinkTelegramForIdwkctr,
} from '../services/telegram-link.js'
import { handleTelegramUpdate, type TelegramUpdate } from '../services/telegram-webhook.js'

const SCHEMA_HINT = 'รัน migration 099 + 100 ก่อนใช้งาน Telegram link'

function actorId(req: Request): string {
  const u = req.authUser
  if (!u) return 'unknown'
  return (u.username ?? u.wkctr ?? u.idwkctr ?? u.fullnameTh ?? 'unknown').trim() || 'unknown'
}

function verifyWebhookSecret(req: Request, res: Response): boolean {
  const expected = getTelegramWebhookSecret()
  if (!expected) return true
  const header = req.headers['x-telegram-bot-api-secret-token']
  const got = typeof header === 'string' ? header : ''
  if (got !== expected) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid webhook secret' })
    return false
  }
  return true
}

export function registerTelegramRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireAuth = createRequireApiAuth(sessionSecret)
  const requireUsersWrite = createRequirePermission(pool, sessionSecret)('admin.users.write')

  app.post('/api/v1/telegram/webhook', async (req: Request, res: Response) => {
    if (!verifyWebhookSecret(req, res)) return
    try {
      const update = req.body as TelegramUpdate
      if (update?.update_id != null) {
        await handleTelegramUpdate(pool, update)
      }
      res.json(telegramWebhookOkSchema.parse({ ok: true }))
    } catch (err) {
      if (isTelegramLinkSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      console.error('[telegram/webhook]', err)
      res.json(telegramWebhookOkSchema.parse({ ok: true }))
    }
  })

  app.get('/api/v1/personnel/me/telegram', requireAuth, async (req: Request, res: Response) => {
    const user = req.authUser!
    if (user.accountType === 'member' || !user.idwkctr) {
      res.status(400).json({ error: 'NOT_WORKCENTER', message: 'เฉพาะบัญชีช่าง (workcenter)' })
      return
    }
    try {
      const status = await getTelegramLinkStatusForIdwkctr(pool, user.idwkctr)
      if (!status) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json(telegramLinkStatusSchema.parse(status))
    } catch (err) {
      if (isTelegramLinkSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post('/api/v1/personnel/me/telegram/link', requireAuth, async (req: Request, res: Response) => {
    const user = req.authUser!
    if (user.accountType === 'member' || !user.idwkctr) {
      res.status(400).json({ error: 'NOT_WORKCENTER' })
      return
    }
    try {
      const out = await createTelegramLinkToken(pool, user.idwkctr, actorId(req))
      voidAudit(pool, req, {
        action: 'telegram.link.invite',
        resource: 'tbworkcenter',
        resourceId: user.idwkctr,
        status: 'ok',
      })
      res.status(201).json(telegramLinkTokenResponseSchema.parse(out))
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      if (isTelegramLinkSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.delete('/api/v1/personnel/me/telegram/link', requireAuth, async (req: Request, res: Response) => {
    const user = req.authUser!
    if (user.accountType === 'member' || !user.idwkctr) {
      res.status(400).json({ error: 'NOT_WORKCENTER' })
      return
    }
    try {
      const ok = await unlinkTelegramForIdwkctr(pool, user.idwkctr)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      voidAudit(pool, req, {
        action: 'telegram.link.unlink',
        resource: 'tbworkcenter',
        resourceId: user.idwkctr,
        status: 'ok',
      })
      res.json(telegramUnlinkResponseSchema.parse({ ok: true, idwkctr: user.idwkctr }))
    } catch (err) {
      if (isTelegramLinkSchemaMissing(err)) {
        res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
        return
      }
      throw err
    }
  })

  app.post(
    '/api/v1/admin/users/:id/telegram/link',
    ...requireUsersWrite,
    async (req: Request, res: Response) => {
      const accountType = String(req.query.accountType ?? 'workcenter')
      if (accountType !== 'workcenter') {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'workcenter only' })
        return
      }
      const idwkctr = String(req.params.id ?? '').trim()
      if (!idwkctr) {
        res.status(400).json({ error: 'VALIDATION_ERROR' })
        return
      }
      try {
        const out = await createTelegramLinkToken(pool, idwkctr, actorId(req))
        voidAudit(pool, req, {
          action: 'admin.telegram.link.invite',
          resource: 'tbworkcenter',
          resourceId: idwkctr,
          status: 'ok',
        })
        res.status(201).json(telegramLinkTokenResponseSchema.parse(out))
      } catch (err) {
        if (err instanceof Error && err.message === 'NOT_FOUND') {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        if (isTelegramLinkSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/admin/users/:id/telegram/link',
    ...requireUsersWrite,
    async (req: Request, res: Response) => {
      const accountType = String(req.query.accountType ?? 'workcenter')
      if (accountType !== 'workcenter') {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'workcenter only' })
        return
      }
      const idwkctr = String(req.params.id ?? '').trim()
      try {
        const ok = await unlinkTelegramForIdwkctr(pool, idwkctr)
        if (!ok) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        voidAudit(pool, req, {
          action: 'admin.telegram.link.unlink',
          resource: 'tbworkcenter',
          resourceId: idwkctr,
          status: 'ok',
        })
        res.json(telegramUnlinkResponseSchema.parse({ ok: true, idwkctr }))
      } catch (err) {
        if (isTelegramLinkSchemaMissing(err)) {
          res.status(503).json({ error: 'SCHEMA_MISSING', message: SCHEMA_HINT })
          return
        }
        throw err
      }
    },
  )
}
