import type { Pool, PoolClient } from 'pg'

export type WorkOrderCloseGuardCounts = {
  commentCount: number
  imageBefore: number
  imageAfter: number
}

export async function countWorkOrderCloseRequirements(
  pool: Pool | PoolClient,
  idiw37: number,
): Promise<WorkOrderCloseGuardCounts> {
  const r = await pool.query<{
    comment_count: string
    image_before: string
    image_after: string
  }>(
    `SELECT
       (SELECT COUNT(*)::text
        FROM app.tbconfirmcom
        WHERE idiw37 = $1 AND TRIM(COALESCE(comdetail, '')) <> '') AS comment_count,
       (SELECT COUNT(*)::text
        FROM app.tbconfirmimg
        WHERE idiw37 = $1 AND COALESCE(img_phase, '') = 'before') AS image_before,
       (SELECT COUNT(*)::text
        FROM app.tbconfirmimg
        WHERE idiw37 = $1 AND COALESCE(img_phase, '') = 'after') AS image_after`,
    [idiw37],
  )
  const row = r.rows[0]
  return {
    commentCount: Number(row?.comment_count ?? 0),
    imageBefore: Number(row?.image_before ?? 0),
    imageAfter: Number(row?.image_after ?? 0),
  }
}

export function workOrderCloseGuardMessage(counts: WorkOrderCloseGuardCounts): string | null {
  if (counts.commentCount < 1) {
    return 'กรุณาบันทึกรายละเอียด (ความคิดเห็น) ก่อนปิดงาน'
  }
  if (counts.imageAfter < 1) {
    return 'กรุณาแนบรูปหลังทำ PM เสร็จก่อนปิดงาน'
  }
  return null
}

export async function assertWorkOrderCloseReady(pool: Pool | PoolClient, idiw37: number): Promise<void> {
  const counts = await countWorkOrderCloseRequirements(pool, idiw37)
  const message = workOrderCloseGuardMessage(counts)
  if (message) throw new Error(message)
}
