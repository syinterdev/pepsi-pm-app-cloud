import type { Pool } from 'pg'
import type { AdminRole } from '../schemas/admin-roles.js'
import { clearPermissionCache } from '../lib/has-permission.js'
import { listPermissionsForUserst } from '../lib/has-permission.js'
import { isVisibleRoleCode } from '../lib/primary-roles.js'

export { isRbacSchemaMissing } from '../lib/has-permission.js'

type RoleRow = {
  role_code: string
  role_name: string
  role_name_en: string
  role_color: string
  is_system: boolean
  description: string | null
  user_count: string
  perm_count: string
}

function mapRole(row: RoleRow): AdminRole {
  const roleNameEn = row.role_name_en?.trim() || row.role_name
  return {
    roleCode: row.role_code,
    roleName: row.role_name,
    roleNameEn,
    roleColor: row.role_color,
    isSystem: row.is_system,
    description: row.description,
    userCount: Number(row.user_count) || 0,
    permissionCount: Number(row.perm_count) || 0,
  }
}

const ROLE_SELECT = `
  SELECT r.role_code, r.role_name, r.role_name_en, r.role_color, r.is_system, r.description,
         (SELECT COUNT(*)::int FROM app.tbworkcenter wc WHERE UPPER(TRIM(wc.userst)) = r.role_code) AS user_count,
         (SELECT COUNT(*)::int FROM app.tbl_role_permission rp WHERE rp.role_code = r.role_code AND rp.granted = true) AS perm_count
  FROM app.tbl_role r
`

export async function listRoles(pool: Pool): Promise<AdminRole[]> {
  const { rows } = await pool.query<RoleRow>(
    `${ROLE_SELECT} ORDER BY r.is_system DESC, r.role_code ASC`,
  )
  return rows.map(mapRole).filter((r) => isVisibleRoleCode(r.roleCode))
}

export async function getRole(pool: Pool, roleCode: string): Promise<AdminRole | null> {
  const { rows } = await pool.query<RoleRow>(`${ROLE_SELECT} WHERE r.role_code = $1`, [
    roleCode.toUpperCase(),
  ])
  return rows[0] ? mapRole(rows[0]) : null
}

export async function getRoleMatrix(pool: Pool) {
  const roles = await listRoles(pool)
  const { rows: permRows } = await pool.query<{
    perm_code: string
    perm_group: string
    perm_name: string
    description: string | null
  }>(
    `SELECT perm_code, perm_group, perm_name, description
     FROM app.tbl_permission
     ORDER BY perm_group ASC, perm_code ASC`,
  )

  const { rows: grantRows } = await pool.query<{ role_code: string; perm_code: string }>(
    `SELECT role_code, perm_code FROM app.tbl_role_permission WHERE granted = true`,
  )

  const grantMap = new Map<string, Set<string>>()
  for (const g of grantRows) {
    let set = grantMap.get(g.role_code)
    if (!set) {
      set = new Set()
      grantMap.set(g.role_code, set)
    }
    set.add(g.perm_code)
  }

  const groupMap = new Map<
    string,
    Array<{
      permCode: string
      permGroup: string
      permName: string
      description: string | null
      grants: Record<string, boolean>
    }>
  >()

  for (const p of permRows) {
    const grants: Record<string, boolean> = {}
    for (const role of roles) {
      grants[role.roleCode] = grantMap.get(role.roleCode)?.has(p.perm_code) ?? false
    }
    const entry = {
      permCode: p.perm_code,
      permGroup: p.perm_group,
      permName: p.perm_name,
      description: p.description,
      grants,
    }
    const list = groupMap.get(p.perm_group) ?? []
    list.push(entry)
    groupMap.set(p.perm_group, list)
  }

  const groups = [...groupMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, permissions]) => ({ group, permissions }))

  return { roles, groups }
}

export async function listPermissionsGrouped(pool: Pool) {
  const matrix = await getRoleMatrix(pool)
  return { groups: matrix.groups.map((g) => ({
    group: g.group,
    permissions: g.permissions.map(({ permCode, permGroup, permName, description }) => ({
      permCode,
      permGroup,
      permName,
      description,
    })),
  })) }
}

export async function createRole(
  pool: Pool,
  input: {
    roleCode: string
    roleName: string
    roleNameEn: string
    roleColor: string
    description?: string | null
  },
): Promise<AdminRole> {
  const code = input.roleCode.toUpperCase()
  const existing = await getRole(pool, code)
  if (existing) throw new Error('ROLE_EXISTS')

  await pool.query(
    `INSERT INTO app.tbl_role (role_code, role_name, role_name_en, role_color, is_system, description)
     VALUES ($1, $2, $3, $4, false, $5)`,
    [code, input.roleName, input.roleNameEn, input.roleColor, input.description ?? null],
  )
  clearPermissionCache()
  const role = await getRole(pool, code)
  if (!role) throw new Error('CREATE_FAILED')
  return role
}

export async function updateRole(
  pool: Pool,
  roleCode: string,
  input: {
    roleName?: string
    roleNameEn?: string
    roleColor?: string
    description?: string | null
  },
): Promise<AdminRole> {
  const code = roleCode.toUpperCase()
  const role = await getRole(pool, code)
  if (!role) throw new Error('NOT_FOUND')

  await pool.query(
    `UPDATE app.tbl_role SET
       role_name = COALESCE($2, role_name),
       role_name_en = COALESCE($3, role_name_en),
       role_color = COALESCE($4, role_color),
       description = COALESCE($5, description),
       updated_at = now()
     WHERE role_code = $1`,
    [
      code,
      input.roleName ?? null,
      input.roleNameEn ?? null,
      input.roleColor ?? null,
      input.description !== undefined ? input.description : null,
    ],
  )
  const updated = await getRole(pool, code)
  if (!updated) throw new Error('NOT_FOUND')
  return updated
}

export async function deleteRole(pool: Pool, roleCode: string): Promise<void> {
  const code = roleCode.toUpperCase()
  const role = await getRole(pool, code)
  if (!role) throw new Error('NOT_FOUND')
  if (role.isSystem) throw new Error('SYSTEM_ROLE')
  if (role.userCount > 0) throw new Error('ROLE_IN_USE')

  await pool.query(`DELETE FROM app.tbl_role WHERE role_code = $1 AND is_system = false`, [code])
  clearPermissionCache()
}

export async function setRolePermissions(
  pool: Pool,
  roleCode: string,
  grants: Record<string, boolean>,
): Promise<{ updated: number }> {
  const code = roleCode.toUpperCase()
  const role = await getRole(pool, code)
  if (!role) throw new Error('NOT_FOUND')

  const client = await pool.connect()
  let updated = 0
  try {
    await client.query('BEGIN')
    for (const [permCode, granted] of Object.entries(grants)) {
      const { rowCount } = await client.query(
        `INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
         VALUES ($1, $2, $3)
         ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted`,
        [code, permCode, granted === true],
      )
      updated += rowCount ?? 0
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
  clearPermissionCache(code)
  return { updated }
}

export async function simulateRolePermissions(
  pool: Pool,
  roleCode: string,
): Promise<string[]> {
  return listPermissionsForUserst(pool, roleCode)
}
