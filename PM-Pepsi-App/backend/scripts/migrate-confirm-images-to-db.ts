/**
 * Backfill tbconfirmimg.img_data จากไฟล์ legacy บนดิสก์
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/migrate-confirm-images-to-db.ts
 *   DATABASE_URL=... npx tsx scripts/migrate-confirm-images-to-db.ts --dry-run
 */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createPool } from '../src/db/pool.js'
import { CONFIRM_IMAGE_LEGACY_DIRS } from '../services/confirmation.js'
import { convertConfirmImageToWebp } from '../services/confirm-image.js'

const dryRun = process.argv.includes('--dry-run')

async function readLegacyFile(fileName: string): Promise<Buffer | null> {
 for (const dir of CONFIRM_IMAGE_LEGACY_DIRS) {
    const abs = path.join(dir, fileName)
    try {
      return await fs.readFile(abs)
    } catch {
      /* next */
    }
  }
  return null
}

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const pool = createPool(databaseUrl)

try {
  const pending = await pool.query<{
    idcimg: number
    idiw37: number
    cfilename: string
  }>(
    `SELECT idcimg, idiw37, cfilename
     FROM app.tbconfirmimg
     WHERE img_data IS NULL OR octet_length(img_data) = 0
     ORDER BY idcimg`,
  )

  let migrated = 0
  let missing = 0
  let failed = 0

  for (const row of pending.rows) {
    const raw = await readLegacyFile(row.cfilename)
    if (!raw?.length) {
      missing += 1
      console.warn(`skip idcimg=${row.idcimg}: file not found (${row.cfilename})`)
      continue
    }

    try {
      const webp = await convertConfirmImageToWebp(raw, row.idiw37)
      if (dryRun) {
        console.log(
          `dry-run idcimg=${row.idcimg} -> ${webp.fileName} (${webp.bytes} bytes webp)`,
        )
        migrated += 1
        continue
      }

      await pool.query(
        `UPDATE app.tbconfirmimg
         SET img_data = $2,
             mime = $3,
             bytes = $4,
             cfilename = $5
         WHERE idcimg = $1`,
        [row.idcimg, webp.data, webp.mime, webp.bytes, webp.fileName],
      )
      migrated += 1
      console.log(`migrated idcimg=${row.idcimg} (${webp.bytes} bytes)`)
    } catch (err) {
      failed += 1
      console.error(`failed idcimg=${row.idcimg}:`, err)
    }
  }

  console.log(
    JSON.stringify(
      { dryRun, total: pending.rows.length, migrated, missing, failed },
      null,
      2,
    ),
  )
  process.exit(failed > 0 ? 1 : 0)
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  await pool.end()
}
