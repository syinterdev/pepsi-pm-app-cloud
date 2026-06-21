export type DetectedImage =
  | { kind: 'png' | 'jpeg' | 'webp' | 'gif' }
  | { kind: 'svg'; markup: string }

const PNG = [0x89, 0x50, 0x4e, 0x47]
const JPEG = [0xff, 0xd8, 0xff]
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46]
const GIF = [0x47, 0x49, 0x46]

function startsWith(buf: Buffer, bytes: number[]): boolean {
  if (buf.length < bytes.length) return false
  return bytes.every((b, i) => buf[i] === b)
}

export function detectImageBuffer(buf: Buffer): DetectedImage | null {
  if (!buf?.length) return null
  if (startsWith(buf, PNG)) return { kind: 'png' }
  if (startsWith(buf, JPEG)) return { kind: 'jpeg' }
  if (startsWith(buf, WEBP_RIFF) && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    return { kind: 'webp' }
  }
  if (startsWith(buf, GIF)) return { kind: 'gif' }
  const text = buf.toString('utf8', 0, Math.min(buf.length, 4096)).trim()
  if (/<svg[\s>]/i.test(text)) {
    return { kind: 'svg', markup: text }
  }
  return null
}

const ALLOWED_RASTER = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

export function assertBrandingUploadAllowed(buf: Buffer, mimetype: string | undefined): DetectedImage {
  const detected = detectImageBuffer(buf)
  if (!detected) {
    throw new Error('ไม่รู้จักรูปแบบไฟล์ — อนุญาต PNG, JPEG, WebP, GIF, SVG เท่านั้น')
  }
  if (detected.kind === 'svg') {
    if (mimetype && mimetype !== 'image/svg+xml') {
      throw new Error('SVG ต้องมี MIME image/svg+xml')
    }
    return detected
  }
  if (mimetype && !ALLOWED_RASTER.has(mimetype)) {
    throw new Error(`MIME ${mimetype} ไม่รองรับ`)
  }
  return detected
}
