import type { Express, NextFunction, Request, Response } from 'express'
import type { Pool } from 'pg'
import { auditLogFromRequest } from '../lib/audit-log.js'
import { getClientIp } from '../lib/request-ip.js'
import { isBlockedIpTableMissing, isIpBlocked } from '../services/blocked-ip.js'

const BLOCK_MESSAGE = 'IP นี้ถูกระงับการเข้าถึงระบบ'

/** Reject requests from IPs in `app.tbl_blocked_ip` (403). */
export function registerBlockedIpGuard(app: Express, pool: Pool): void {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path.split('?')[0] ?? req.path
    if (!path.startsWith('/api/v1')) {
      next()
      return
    }

    const ip = getClientIp(req)
    if (!ip) {
      next()
      return
    }

    try {
      const blocked = await isIpBlocked(pool, ip)
      if (!blocked) {
        next()
        return
      }

      void auditLogFromRequest(pool, req, {
        action: 'security.blocked_request',
        resource: 'blocked_ip',
        resourceId: ip,
        status: 'denied',
        message: BLOCK_MESSAGE,
      })

      res.status(403).json({
        error: 'IP_BLOCKED',
        message: BLOCK_MESSAGE,
      })
    } catch (err) {
      if (isBlockedIpTableMissing(err)) {
        next()
        return
      }
      throw err
    }
  })
}
