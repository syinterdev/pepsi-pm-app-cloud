export function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1)
    out[key] = decodeURIComponent(value)
  }
  return out
}

export function serializeCookie(
  name: string,
  value: string,
  opts: { maxAgeSec?: number; httpOnly?: boolean; sameSite?: 'Lax' | 'Strict'; path?: string },
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${opts.path ?? '/'}`]
  if (opts.httpOnly !== false) parts.push('HttpOnly')
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`)
  if (opts.maxAgeSec !== undefined) parts.push(`Max-Age=${opts.maxAgeSec}`)
  return parts.join('; ')
}

export function clearCookieHeader(name: string): string {
  return serializeCookie(name, '', { maxAgeSec: 0, path: '/' })
}
