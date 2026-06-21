import type { Pool } from 'pg'
import type { PatchUserPrefBody, UserPref } from '../schemas/user-pref.js'

export function isUserPrefTableMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_user_pref') ||
    message.includes('does not exist') ||
    message.includes('relation')
  )
}

type PrefRow = {
  user_id: string
  theme_mode: string | null
  language: string | null
  density: string | null
  seen_tours: Record<string, boolean> | null
  updated_at: Date
}

function mapRow(row: PrefRow): UserPref {
  const seen = row.seen_tours && typeof row.seen_tours === 'object' ? row.seen_tours : {}
  return {
    userId: row.user_id,
    themeMode:
      row.theme_mode === 'light' || row.theme_mode === 'dark' || row.theme_mode === 'system'
        ? row.theme_mode
        : null,
    language: row.language,
    density: row.density === 'comfortable' || row.density === 'compact' ? row.density : null,
    seenTours: seen,
    updatedAt: row.updated_at.toISOString(),
  }
}

const defaultPref = (userId: string): UserPref => ({
  userId,
  themeMode: null,
  language: null,
  density: null,
  seenTours: {},
  updatedAt: new Date().toISOString(),
})

export async function getUserPref(pool: Pool, userId: string): Promise<UserPref> {
  const { rows } = await pool.query<PrefRow>(
    `SELECT user_id, theme_mode, language, density, seen_tours, updated_at
     FROM app.tbl_user_pref WHERE user_id = $1`,
    [userId],
  )
  return rows[0] ? mapRow(rows[0]) : defaultPref(userId)
}

export async function patchUserPref(
  pool: Pool,
  userId: string,
  body: PatchUserPrefBody,
): Promise<UserPref> {
  const existing = await getUserPref(pool, userId)
  const next = {
    themeMode: body.themeMode !== undefined ? body.themeMode : existing.themeMode,
    language: body.language !== undefined ? body.language : existing.language,
    density: body.density !== undefined ? body.density : existing.density,
    seenTours: body.seenTours ? { ...existing.seenTours, ...body.seenTours } : existing.seenTours,
  }

  const { rows } = await pool.query<PrefRow>(
    `INSERT INTO app.tbl_user_pref (user_id, theme_mode, language, density, seen_tours, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, now())
     ON CONFLICT (user_id) DO UPDATE SET
       theme_mode = EXCLUDED.theme_mode,
       language = EXCLUDED.language,
       density = EXCLUDED.density,
       seen_tours = EXCLUDED.seen_tours,
       updated_at = now()
     RETURNING user_id, theme_mode, language, density, seen_tours, updated_at`,
    [
      userId,
      next.themeMode,
      next.language,
      next.density,
      JSON.stringify(next.seenTours),
    ],
  )
  return mapRow(rows[0]!)
}

export async function markTourSeen(pool: Pool, userId: string, tourKey: string): Promise<UserPref> {
  return patchUserPref(pool, userId, {
    seenTours: { [tourKey]: true },
  })
}
