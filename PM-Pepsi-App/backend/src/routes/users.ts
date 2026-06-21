import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { createRequireAnyPermission } from '../middleware/require-permission.js'
import { usersListResponseSchema } from '../schemas/users.js'
import { listSettingsUsers } from '../services/settings-users.js'

export function registerUsersRoutes(app: Express, pool: Pool, sessionSecret: string) {
  const requireRead = createRequireAnyPermission(pool, sessionSecret)([
    'admin.settings.read',
    'admin.settings.write',
  ])

  app.get('/api/v1/users', ...requireRead, async (_req: Request, res: Response) => {
    try {
      const data = await listSettingsUsers(pool)
      res.json(usersListResponseSchema.parse(data))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('does not exist')) {
        res.status(503).json({ error: 'SCHEMA_NOT_READY', message })
        return
      }
      throw err
    }
  })
}
