#!/usr/bin/env node
/**
 * Backfill WorkCntr (wkctr) — แก้ข้อมูล legacy ที่ใส่ผิดคอลัมน์
 *
 *   cd PM-Pepsi-App/backend
 *   node scripts/apply-eng-technician-codes.mjs
 */
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENG_PATTERN = /^(PAC|PRO|UTI)[0-9]{3}$/

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL ไม่พบ — ตั้งใน PM-Pepsi-App/backend/.env')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: url })

async function runStep(label, sql, params = []) {
  const r = await pool.query(sql, params)
  console.log(`${label}: ${r.rowCount} แถว`)
  return r.rowCount
}

await runStep(
  '1) wkctr ← surnamewkctr (import ผิดคอลัมน์)',
  `UPDATE app.tbworkcenter
   SET wkctr = upper(trim(surnamewkctr))
   WHERE coalesce(trim(wkctr), '') = ''
     AND trim(surnamewkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$'`,
)

await runStep(
  '2) wkctr ← idwkctr (เมื่อ id เป็นรหัสช่างจริง)',
  `UPDATE app.tbworkcenter
   SET wkctr = upper(trim(idwkctr))
   WHERE coalesce(trim(wkctr), '') = ''
     AND trim(idwkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$'`,
)

await runStep(
  '3) ล้าง wkctr ที่เป็นรหัส HR ผิด',
  `UPDATE app.tbworkcenter
   SET wkctr = ''
   WHERE coalesce(trim(wkctr), '') <> ''
     AND NOT (trim(wkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$')
     AND wkctr = idwkctr`,
)

const migration086 = path.join(__dirname, '../../../database/migrations/086_backfill_wkctr.sql')
if (fs.existsSync(migration086)) {
  const sql = fs.readFileSync(migration086, 'utf8')
  const nameUpdates = sql
    .split('\n')
    .filter((line) => line.includes("SET wkctr = '") && line.includes('namewkctr'))
  for (const line of nameUpdates) {
    await pool.query(line.replace(/;\s*$/, ''))
  }
  console.log(`4) จับคู่ชื่อไทย: ${nameUpdates.length} คำสั่ง`)
}

const total = await pool.query('SELECT COUNT(*)::int AS n FROM app.tbworkcenter')
const eng = await pool.query(
  "SELECT COUNT(*)::int AS n FROM app.tbworkcenter WHERE trim(wkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$'",
)
const sample = await pool.query(
  `SELECT idwkctr, wkctr, namewkctr, surnamewkctr FROM app.tbworkcenter
   WHERE trim(wkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$'
   ORDER BY wkctr LIMIT 15`,
)

console.log('\n--- สรุป ---')
console.log(`tbworkcenter ทั้งหมด: ${total.rows[0].n}`)
console.log(`มี WorkCntr (wkctr) ถูกต้อง: ${eng.rows[0].n}`)
console.log('\nตัวอย่าง:')
console.table(sample.rows)

await pool.end()
