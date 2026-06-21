import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Pool } from 'pg'

const SEED_REL = path.join('database', 'seeds', 'generated', 'import_tbmenu_pg.sql')

function resolveMenuSeedPath(): string {
  const fromEnv = process.env.MENU_SYNC_SQL_PATH?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv

  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    path.resolve(here, '../../../../', SEED_REL),
    path.resolve(here, '../../../', SEED_REL),
    path.resolve(process.cwd(), SEED_REL),
    path.resolve(process.cwd(), '..', SEED_REL),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return candidates[0]
}

/** รัน seed SQL จาก PHP/MySQL export — แทน DBeaver manual */
export async function syncMenuFromPhpSeed(pool: Pool): Promise<{
  source: string
  statements: number
}> {
  const source = resolveMenuSeedPath()
  if (!existsSync(source)) {
    throw new Error('SEED_FILE_NOT_FOUND')
  }

  const sql = readFileSync(source, 'utf8')
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  if (statements.length < 1) throw new Error('SEED_EMPTY')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM app.tbmenu')
    for (const stmt of statements) {
      if (/^select\s+setval/i.test(stmt)) {
        await client.query(stmt)
        continue
      }
      if (/^insert\s+into\s+app\.tbmenu/i.test(stmt)) {
        await client.query(stmt)
      }
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  return { source, statements: statements.length }
}
