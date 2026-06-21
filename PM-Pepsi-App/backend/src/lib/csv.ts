/** Escape a value for RFC4180-style CSV (comma-separated). */
export function escapeCsvCell(value: unknown): string {
  const raw = value == null ? '' : String(value)
  const needsQuote = /[",\r\n]/.test(raw)
  if (!needsQuote) return raw
  return `"${raw.replaceAll('"', '""')}"`
}

/** UTF-8 BOM + CRLF line endings (Excel / SAP-friendly on Windows). */
export function csvAttachmentBody(lines: string[]): string {
  return `\ufeff${lines.join('\r\n')}\r\n`
}
