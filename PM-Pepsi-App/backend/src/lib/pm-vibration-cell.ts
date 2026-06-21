/** Parse customer vibration cells: `Dst 08 dB 45` · `Dst:07 dB Lev:37` */
export function parseDstDbCell(raw: unknown): { dst: number; db: number } | null {
  const s = String(raw ?? '').trim()
  if (!s) return null

  const m =
    /dst\s*:?\s*(\d+(?:\.\d+)?)\s+d\s*b\s*(?:lev\s*:?\s*)?(\d+(?:\.\d+)?)/i.exec(s) ??
    /dst\s*:?\s*(\d+(?:\.\d+)?)\s+lev\s*:?\s*(\d+(?:\.\d+)?)/i.exec(s)
  if (!m) return null

  const dst = Number(m[1])
  const db = Number(m[2])
  if (!Number.isFinite(dst) || !Number.isFinite(db)) return null
  return { dst, db }
}
