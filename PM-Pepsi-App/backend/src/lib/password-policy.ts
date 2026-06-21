import { randomInt } from 'node:crypto'

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const DIGITS = '23456789'
const SPECIAL = '!@#$%&*-_+=?'

export const DEFAULT_PASSWORD_MIN_LENGTH = 12

export function validatePasswordMinLength(
  password: string,
  minLength: number = DEFAULT_PASSWORD_MIN_LENGTH,
): { ok: true } | { ok: false; message: string } {
  const min = Math.max(8, Math.min(128, minLength))
  if (password.length < min) {
    return { ok: false, message: `รหัสผ่านต้องมีอย่างน้อย ${min} ตัวอักษร` }
  }
  return { ok: true }
}

/** 12+ chars: 3 upper + 3 lower + 3 digit + 3 special (skills.md §3 / §8 Administrator). */
export function generateTemporaryPassword(length = DEFAULT_PASSWORD_MIN_LENGTH): string {
  const len = Math.max(12, length)
  if (len < 12) {
    throw new Error('Temporary password must be at least 12 characters')
  }
  const buckets = [
    pick(UPPER, 3),
    pick(LOWER, 3),
    pick(DIGITS, 3),
    pick(SPECIAL, 3),
  ]
  const extra = len > 12 ? pick(UPPER + LOWER + DIGITS + SPECIAL, len - 12) : ''
  return shuffle(buckets.join('') + extra)
}

function pick(chars: string, count: number): string {
  let out = ''
  for (let i = 0; i < count; i++) {
    out += chars[randomInt(chars.length)]!
  }
  return out
}

function shuffle(s: string): string {
  const arr = [...s]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr.join('')
}
