import sharp from 'sharp'

/** ค่าความสว่างต่ำสุดต่อช่อง RGB ที่ถือว่าเป็นพื้นหลัง (0–255) */
export const LIGHT_BG_THRESHOLD = 235
/** ช่วงไล่ระดับขอบพื้นหลัง */
export const LIGHT_BG_SOFT_RANGE = 18

/**
 * ลบพื้นหลังสว่าง (ขาว/เทาอ่อน) — เหมาะโลโก้บนพื้นขาว ไม่ใช่ AI ตัดวัตถุ
 * คืน PNG พร้อม alpha
 */
export async function removeLightBackgroundBuffer(input: Buffer): Promise<Buffer> {
  if (!input?.length) throw new Error('Empty image buffer')

  const { data, info } = await sharp(input, { failOn: 'none' })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  if (!width || !height || channels < 4) {
    return sharp(input).ensureAlpha().png().toBuffer()
  }

  const pixels = new Uint8Array(data)
  const softStart = LIGHT_BG_THRESHOLD - LIGHT_BG_SOFT_RANGE

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i]!
    const g = pixels[i + 1]!
    const b = pixels[i + 2]!
    const min = Math.min(r, g, b)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    let alpha = pixels[i + 3]!

    if (min >= LIGHT_BG_THRESHOLD) {
      alpha = 0
    } else if (lum >= softStart) {
      const t = Math.min(1, (lum - softStart) / LIGHT_BG_SOFT_RANGE)
      alpha = Math.round(alpha * (1 - t))
    }

    pixels[i + 3] = alpha
  }

  return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

export function parseRemoveBackgroundField(value: unknown): boolean {
  return value === true || value === 'true' || value === '1' || value === 1
}
