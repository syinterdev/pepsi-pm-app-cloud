import type { Pool } from 'pg'

/**
 * รายการ wkctr ในสมาชิกกลุ่ม — รองรับทั้ง:
 * - tbworkcenter.idwkctrgroup = id ตัวเลขจาก tbwkctrgroup (นำเข้า Personel.xlsx)
 * - legacy: idwkctrgroup เก็บ wkctrgroup code ตรง ๆ
 * - groupCode = wkctrgroup จาก dropdown (planning dropdown)
 */
export async function loadWorkcenterCodesForPlanningGroup(
  pool: Pool,
  groupCode: string,
): Promise<string[]> {
  const code = groupCode.trim()
  if (!code) return []

  const r = await pool.query<{ wkctr: string }>(
    `SELECT DISTINCT wc.wkctr
     FROM app.tbworkcenter wc
     WHERE COALESCE(TRIM(wc.wkctr), '') <> ''
       AND (
         wc.idwkctrgroup::text = $1
         OR EXISTS (
           SELECT 1 FROM app.tbwkctrgroup g
           WHERE g.wkctrgroup = $1
             AND g.idwkctrgroup::text = wc.idwkctrgroup::text
         )
       )
     ORDER BY wc.wkctr`,
    [code],
  )
  return r.rows.map((row) => row.wkctr.trim()).filter(Boolean)
}
