import type { Pool } from 'pg'
import { personnelIsActiveSql } from '../lib/personnel-active-sql.js'
import type { UsersListResponse } from '../schemas/users.js'

/** รายชื่อ work center สำหรับหน้าตั้งค่า — ไม่ใช่ admin CRUD เต็ม */
export async function listSettingsUsers(pool: Pool): Promise<UsersListResponse> {
  const activeSql = personnelIsActiveSql('wc')
  const { rows } = await pool.query<{
    id: number
    username: string
    role: string
    active: boolean
  }>(
    `SELECT
      ROW_NUMBER() OVER (ORDER BY wc.idwkctr)::int AS id,
      wc.idwkctr AS username,
      COALESCE(wc.userrole::text, wc.userst, 'U') AS role,
      (${activeSql}) AS active
    FROM app.tbworkcenter wc
    ORDER BY wc.idwkctr
    LIMIT 500`,
  )
  return { items: rows }
}
