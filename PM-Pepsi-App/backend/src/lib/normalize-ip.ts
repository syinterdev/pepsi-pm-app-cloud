import net from 'node:net'

/** Normalize client IP for storage and lookup (IPv4 / IPv6). */
export function normalizeClientIp(raw: string | null | undefined): string | null {
  if (raw == null) return null
  let s = raw.trim()
  if (!s) return null

  if (s.startsWith('::ffff:')) {
    s = s.slice('::ffff:'.length)
  }

  const version = net.isIP(s)
  if (version === 4 || version === 6) return s
  return null
}
