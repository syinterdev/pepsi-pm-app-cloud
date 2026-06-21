import type { Pool } from 'pg'
import { getMaxLoginAttempts } from './security-settings.js'

const WINDOW_MS = 15 * 60 * 1000

type Entry = { count: number; windowStart: number }

const attempts = new Map<string, Entry>()

function key(ip: string, username: string): string {
  return `${ip}:${username.trim().toLowerCase()}`
}

function prune(entry: Entry, now: number): Entry | null {
  if (now - entry.windowStart > WINDOW_MS) return null
  return entry
}

export async function isLoginLocked(
  pool: Pool,
  ip: string,
  username: string,
): Promise<{ locked: boolean; message?: string }> {
  const max = await getMaxLoginAttempts(pool)
  const k = key(ip, username)
  const now = Date.now()
  const entry = attempts.get(k)
  if (!entry) return { locked: false }
  const active = prune(entry, now)
  if (!active) {
    attempts.delete(k)
    return { locked: false }
  }
  if (active.count >= max) {
    return {
      locked: true,
      message: `เข้าสู่ระบบผิดพลาดเกิน ${max} ครั้ง — ลองใหม่ใน 15 นาที`,
    }
  }
  return { locked: false }
}

export function recordFailedLogin(ip: string, username: string): void {
  const k = key(ip, username)
  const now = Date.now()
  const prev = attempts.get(k)
  const active = prev ? prune(prev, now) : null
  if (!active) {
    attempts.set(k, { count: 1, windowStart: now })
    return
  }
  active.count += 1
  attempts.set(k, active)
}

export function clearLoginAttempts(ip: string, username: string): void {
  attempts.delete(key(ip, username))
}

/** Test helper */
export function resetLoginLockoutState(): void {
  attempts.clear()
}
