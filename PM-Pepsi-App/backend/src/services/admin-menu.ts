import type { Pool } from 'pg'
import type { AdminMenuRow } from '../schemas/admin-menu.js'

type MenuDbRow = {
  idmenu: number
  idmenusub: string
  menuon: number
  menu_kind: string
  menuright: string
  menuicon: string | null
  menutitle: string
  menulink: string | null
  react_route: string | null
  menuname: string | null
  menulavel: number
  end_exact: boolean
}

function mapRow(row: MenuDbRow): AdminMenuRow {
  return {
    idmenu: row.idmenu,
    idmenusub: row.idmenusub,
    menuon: row.menuon,
    menuKind: row.menu_kind === 'heading' ? 'heading' : 'item',
    menuright: row.menuright,
    menuicon: row.menuicon,
    menutitle: row.menutitle,
    menulink: row.menulink,
    reactRoute: row.react_route,
    menuname: row.menuname,
    menulavel: row.menulavel,
    endExact: row.end_exact,
  }
}

const SELECT_MENU = `
  SELECT idmenu, idmenusub, menuon, menu_kind, menuright, menuicon, menutitle,
         menulink, react_route, menuname, menulavel, end_exact
  FROM app.tbmenu
`

export async function listAdminMenu(pool: Pool): Promise<AdminMenuRow[]> {
  const { rows } = await pool.query<MenuDbRow>(
    `${SELECT_MENU} ORDER BY menuon ASC, idmenu ASC`,
  )
  return rows.map(mapRow)
}

async function nextMenuon(pool: Pool): Promise<number> {
  const { rows } = await pool.query<{ max: string | null }>(
    `SELECT MAX(menuon)::text AS max FROM app.tbmenu`,
  )
  const max = Number(rows[0]?.max ?? 0)
  return max + 10
}

export async function createMenu(
  pool: Pool,
  input: {
    menuKind: 'heading' | 'item'
    menutitle: string
    menuright: string
    menuicon?: string | null
    menulink?: string | null
    reactRoute?: string | null
    menuname?: string | null
    idmenusub?: string
    menulavel?: number
    endExact?: boolean
    menuon?: number
  },
): Promise<AdminMenuRow> {
  const menuon = input.menuon ?? (await nextMenuon(pool))
  const { rows } = await pool.query<MenuDbRow>(
    `INSERT INTO app.tbmenu (
       idmenusub, menuon, menu_kind, menuright, menuicon, menutitle,
       menulink, react_route, menuname, menulavel, end_exact
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING idmenu, idmenusub, menuon, menu_kind, menuright, menuicon, menutitle,
               menulink, react_route, menuname, menulavel, end_exact`,
    [
      input.idmenusub ?? '0',
      menuon,
      input.menuKind,
      input.menuright,
      input.menuicon ?? null,
      input.menutitle,
      input.menulink ?? null,
      input.reactRoute ?? null,
      input.menuname ?? null,
      input.menulavel ?? 1,
      input.endExact ?? false,
    ],
  )
  return mapRow(rows[0]!)
}

export async function updateMenu(
  pool: Pool,
  idmenu: number,
  input: Partial<{
    menuKind: 'heading' | 'item'
    menutitle: string
    menuright: string
    menuicon: string | null
    menulink: string | null
    reactRoute: string | null
    menuname: string | null
    idmenusub: string
    menulavel: number
    endExact: boolean
    menuon: number
  }>,
): Promise<AdminMenuRow> {
  const existing = await getMenu(pool, idmenu)
  if (!existing) throw new Error('NOT_FOUND')

  const { rows } = await pool.query<MenuDbRow>(
    `UPDATE app.tbmenu SET
       idmenusub = COALESCE($2, idmenusub),
       menuon = COALESCE($3, menuon),
       menu_kind = COALESCE($4, menu_kind),
       menuright = COALESCE($5, menuright),
       menuicon = COALESCE($6, menuicon),
       menutitle = COALESCE($7, menutitle),
       menulink = COALESCE($8, menulink),
       react_route = COALESCE($9, react_route),
       menuname = COALESCE($10, menuname),
       menulavel = COALESCE($11, menulavel),
       end_exact = COALESCE($12, end_exact)
     WHERE idmenu = $1
     RETURNING idmenu, idmenusub, menuon, menu_kind, menuright, menuicon, menutitle,
               menulink, react_route, menuname, menulavel, end_exact`,
    [
      idmenu,
      input.idmenusub ?? null,
      input.menuon ?? null,
      input.menuKind ?? null,
      input.menuright ?? null,
      input.menuicon !== undefined ? input.menuicon : null,
      input.menutitle ?? null,
      input.menulink !== undefined ? input.menulink : null,
      input.reactRoute !== undefined ? input.reactRoute : null,
      input.menuname !== undefined ? input.menuname : null,
      input.menulavel ?? null,
      input.endExact ?? null,
    ],
  )
  if (!rows[0]) throw new Error('NOT_FOUND')
  return mapRow(rows[0])
}

export async function getMenu(pool: Pool, idmenu: number): Promise<AdminMenuRow | null> {
  const { rows } = await pool.query<MenuDbRow>(`${SELECT_MENU} WHERE idmenu = $1`, [idmenu])
  return rows[0] ? mapRow(rows[0]) : null
}

export async function deleteMenu(pool: Pool, idmenu: number): Promise<void> {
  const { rowCount } = await pool.query(`DELETE FROM app.tbmenu WHERE idmenu = $1`, [idmenu])
  if (!rowCount) throw new Error('NOT_FOUND')
}

export async function reorderMenu(
  pool: Pool,
  items: { idmenu: number; menuon: number }[],
): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const item of items) {
      await client.query(`UPDATE app.tbmenu SET menuon = $2 WHERE idmenu = $1`, [
        item.idmenu,
        item.menuon,
      ])
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
