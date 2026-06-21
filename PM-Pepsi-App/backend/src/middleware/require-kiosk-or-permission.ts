import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Pool } from 'pg'
import { voidAuditDenied } from '../lib/audit-mutation.js'
import { forbidUnlessPermission, hasPermission } from '../lib/has-permission.js'
import { verifySessionToken } from '../lib/session-token.js'
import {
  extractBoardKioskTokenFromRequest,
  isBoardKioskRequestAllowed,
} from '../services/board-kiosk.js'
import { getTokenFromRequest } from './require-api-auth.js'

declare module 'express-serve-static-core' {
  interface Request {
    boardKiosk?: boolean
  }
}

/**
 * Session + RBAC permission หรือ Engineering Board kiosk token (อ่านอย่างเดียว)
 */
export function createRequireKioskOrPermission(pool: Pool, sessionSecret: string, perm: string) {
  return [
    async (req: Request, res: Response, next: NextFunction) => {
      const sessionToken = getTokenFromRequest(req)
      if (sessionToken) {
        const user = verifySessionToken(sessionToken, sessionSecret)
        if (user) {
          req.authUser = user
          const ok = await forbidUnlessPermission(res, pool, user.userst, perm)
          if (!ok) {
            voidAuditDenied(pool, req, 'rbac.deny', perm)
            return
          }
          next()
          return
        }
      }

      const kioskToken = extractBoardKioskTokenFromRequest(req)
      const allowed = await isBoardKioskRequestAllowed(pool, kioskToken)
      if (allowed) {
        req.boardKiosk = true
        next()
        return
      }

      res.status(401).json({
        error: 'UNAUTHORIZED',
        message:
          'ต้องเข้าสู่ระบบ หรือเปิด /board?token=… (kiosk) — ตั้งค่า token ที่ Admin → ตั้งค่าระบบ',
      })
    },
  ] satisfies RequestHandler[]
}

/** Kiosk หรือ session ที่มี permission ใดๆ ในรายการ */
export function createRequireKioskOrAnyPermission(
  pool: Pool,
  sessionSecret: string,
  perms: readonly string[],
) {
  return [
    async (req: Request, res: Response, next: NextFunction) => {
      const sessionToken = getTokenFromRequest(req)
      if (sessionToken) {
        const user = verifySessionToken(sessionToken, sessionSecret)
        if (user) {
          req.authUser = user
          for (const perm of perms) {
            if (await hasPermission(pool, user.userst, perm)) {
              next()
              return
            }
          }
          voidAuditDenied(pool, req, 'rbac.deny', perms[0] ?? 'unknown')
          res.status(403).json({
            error: 'FORBIDDEN',
            message: `ไม่มีสิทธิ์ (${perms.join(' หรือ ')})`,
          })
          return
        }
      }

      const kioskToken = extractBoardKioskTokenFromRequest(req)
      if (await isBoardKioskRequestAllowed(pool, kioskToken)) {
        req.boardKiosk = true
        next()
        return
      }

      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'ต้องเข้าสู่ระบบ หรือใช้ลิงก์ kiosk token สำหรับ Engineering Board',
      })
    },
  ] satisfies RequestHandler[]
}
