import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'

export function resolvePgDumpBin(): string {
  const fromEnv = process.env.PG_DUMP_PATH?.trim()
  if (fromEnv) return fromEnv
  return process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump'
}

export function resolvePsqlBin(): string {
  const fromEnv = process.env.PSQL_PATH?.trim()
  if (fromEnv) return fromEnv
  return process.platform === 'win32' ? 'psql.exe' : 'psql'
}

export async function isPsqlAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const bin = resolvePsqlBin()
    const child = spawn(bin, ['--version'], { stdio: 'ignore', windowsHide: true })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

/** ตรวจว่ามี pg_dump ใน PATH (ไม่รัน dump จริง) */
export async function isPgDumpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const bin = resolvePgDumpBin()
    const child = spawn(bin, ['--version'], { stdio: 'ignore', windowsHide: true })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

export function formatBackupFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join('')
  return `backup-${stamp}.sql.gz`
}

export function parseDatabaseUrl(databaseUrl: string): {
  host: string
  port: string
  user: string
  password: string
  database: string
} {
  const url = new URL(databaseUrl)
  const database = url.pathname.replace(/^\//, '')
  if (!database) throw new Error('DATABASE_URL missing database name')
  return {
    host: url.hostname || 'localhost',
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  }
}

export async function sha256File(filePath: string): Promise<string> {
  const { createReadStream: read } = await import('node:fs')
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = read(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

/** รัน pg_dump → gzip ไฟล์เดียว (.sql.gz) */
export async function runPgDumpToGzipFile(
  databaseUrl: string,
  outFilePath: string,
): Promise<void> {
  const conn = parseDatabaseUrl(databaseUrl)
  await mkdir(path.dirname(outFilePath), { recursive: true })

  const args = [
    '-h',
    conn.host,
    '-p',
    conn.port,
    '-U',
    conn.user,
    '-d',
    conn.database,
    '--no-owner',
    '--no-acl',
  ]

  const env = {
    ...process.env,
    PGPASSWORD: conn.password,
  }

  await new Promise<void>((resolve, reject) => {
    const pg = spawn(resolvePgDumpBin(), args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    const gzip = createGzip()
    const out = createWriteStream(outFilePath)
    let stderr = ''

    pg.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    pg.on('error', (err) => {
      reject(new Error(`pg_dump failed to start: ${err.message}`))
    })

    pg.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `pg_dump exited with code ${code}`))
    })

    pipeline(pg.stdout!, gzip, out).catch((err) => {
      pg.kill()
      reject(err instanceof Error ? err : new Error(String(err)))
    })
  })
}

/** รันไฟล์ .sql ผ่าน psql -f */
export async function runPsqlSqlFile(databaseUrl: string, sqlFilePath: string): Promise<void> {
  const conn = parseDatabaseUrl(databaseUrl)
  const args = [
    '-h',
    conn.host,
    '-p',
    conn.port,
    '-U',
    conn.user,
    '-d',
    conn.database,
    '-v',
    'ON_ERROR_STOP=1',
    '--single-transaction',
    '-f',
    sqlFilePath,
  ]

  const env = {
    ...process.env,
    PGPASSWORD: conn.password,
  }

  await new Promise<void>((resolve, reject) => {
    const psql = spawn(resolvePsqlBin(), args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stderr = ''
    psql.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    psql.on('error', (err) => {
      reject(new Error(`psql failed to start: ${err.message}`))
    })

    psql.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `psql exited with code ${code}`))
    })
  })
}

/** รันไฟล์ .sql.gz (plain SQL จาก pg_dump) ผ่าน psql */
export async function runPsqlFromGzipFile(
  databaseUrl: string,
  gzipFilePath: string,
): Promise<void> {
  const conn = parseDatabaseUrl(databaseUrl)
  const { createGunzip } = await import('node:zlib')
  const { createReadStream } = await import('node:fs')

  const args = [
    '-h',
    conn.host,
    '-p',
    conn.port,
    '-U',
    conn.user,
    '-d',
    conn.database,
    '-v',
    'ON_ERROR_STOP=1',
    '--single-transaction',
  ]

  const env = {
    ...process.env,
    PGPASSWORD: conn.password,
  }

  await new Promise<void>((resolve, reject) => {
    const psql = spawn(resolvePsqlBin(), args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stderr = ''
    psql.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    psql.on('error', (err) => {
      reject(new Error(`psql failed to start: ${err.message}`))
    })

    psql.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `psql exited with code ${code}`))
    })

    const input = createReadStream(gzipFilePath)
    const gunzip = createGunzip()
    pipeline(input, gunzip, psql.stdin!)
      .then(() => {
        psql.stdin?.end()
      })
      .catch((err) => {
        psql.kill()
        reject(err instanceof Error ? err : new Error(String(err)))
      })
  })
}

/** cron แบบง่าย: รองรับ "M H * * *" (นาที ชั่วโมง ทุกวัน) */
export function cronMatchesNow(cron: string, now = new Date()): boolean {
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return false
  const [minPart, hourPart] = parts
  if (minPart === '*' || hourPart === '*') return false
  const min = Number(minPart)
  const hour = Number(hourPart)
  if (!Number.isFinite(min) || !Number.isFinite(hour)) return false
  return now.getMinutes() === min && now.getHours() === hour
}
