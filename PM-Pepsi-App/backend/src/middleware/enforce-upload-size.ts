import type { NextFunction, Request, Response } from 'express'
import type { Pool } from 'pg'
import { getUploadMaxBytes } from '../lib/upload-settings.js'

const MUTATING = new Set(['POST', 'PUT', 'PATCH'])

/** รูปปิดงาน — ลูกค้ายืนยันไม่จำกัดขนาด (กล้องมือถือรุ่นใหม่) */
const CONFIRM_IMAGE_UPLOAD_PATH = /^\/api\/v1\/confirmation\/\d+\/images$/

/**
 * Rejects oversized uploads using Content-Length vs tbl_setting.app.upload_max_mb.
 */
export function createUploadSizeGuard(pool: Pool) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!MUTATING.has(req.method) || !req.path.startsWith('/api/v1')) {
      next()
      return
    }
    if (CONFIRM_IMAGE_UPLOAD_PATH.test(req.path)) {
      next()
      return
    }
    const len = Number(req.headers['content-length'] ?? 0)
    if (!Number.isFinite(len) || len <= 0) {
      next()
      return
    }
    const maxBytes = await getUploadMaxBytes(pool)
    if (len > maxBytes) {
      const maxMb = Math.round(maxBytes / 1024 / 1024)
      res.status(413).json({
        error: 'UPLOAD_TOO_LARGE',
        message: `ไฟล์ใหญ่เกิน ${maxMb} MB (ตั้งค่าใน System Settings)`,
      })
      return
    }
    next()
  }
}
