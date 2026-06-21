import bcrypt from 'bcryptjs'
import { timingSafeEqual } from 'node:crypto'

const BCRYPT_ROUNDS = 10

export function isBcryptHash(stored: string): boolean {
  return stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

/** รองรับ legacy plain text ใน DB — อัปเกรดเป็น bcrypt หลัง login สำเร็จ */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (isBcryptHash(stored)) {
    const ok = await bcrypt.compare(plain, stored)
    return { ok, needsRehash: false }
  }
  const a = Buffer.from(plain, 'utf8')
  const b = Buffer.from(stored, 'utf8')
  if (a.length !== b.length) return { ok: false, needsRehash: false }
  const ok = timingSafeEqual(a, b)
  return { ok, needsRehash: ok }
}
