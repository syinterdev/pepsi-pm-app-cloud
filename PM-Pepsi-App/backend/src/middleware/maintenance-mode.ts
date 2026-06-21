import type { NextFunction, Request, Response } from 'express'
import type { Pool } from 'pg'
import { hasAnyPermission } from '../lib/has-permission.js'
import { verifySessionToken } from '../lib/session-token.js'
import { getTokenFromRequest } from './require-api-auth.js'
import {
  getMaintenanceState,
  isMaintenanceExemptPath,
  isMutatingMethod,
  MAINTENANCE_BYPASS_PERMISSIONS,
} from '../services/maintenance-mode.js'

/**
 * Blocks mutating API calls with 503 when maintenance.enabled is true,
 * except for operators with admin.settings.write / backup permissions.
 */
export function createMaintenanceMiddleware(pool: Pool, sessionSecret: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!isMutatingMethod(req.method)) {
      next()
      return
    }

    const path = req.path
    if (!path.startsWith('/api/v1')) {
      next()
      return
    }

    if (isMaintenanceExemptPath(path)) {
      next()
      return
    }

    const { enabled, message } = await getMaintenanceState(pool)
    if (!enabled) {
      next()
      return
    }

    const token = getTokenFromRequest(req)
    if (token) {
      const user = verifySessionToken(token, sessionSecret)
      if (user?.userst) {
        const bypass = await hasAnyPermission(pool, user.userst, MAINTENANCE_BYPASS_PERMISSIONS)
        if (bypass) {
          next()
          return
        }
      }
    }

    res.status(503).json({
      error: 'MAINTENANCE',
      message,
    })
  }
}
