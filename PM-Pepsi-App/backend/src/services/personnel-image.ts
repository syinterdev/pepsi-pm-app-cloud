/**
 * แปลงภาพที่อัปโหลดเข้ามา → WebP (resize กว้าง 600px) ก่อนเก็บลง DB (BYTEA)
 */
import sharp from 'sharp'

export const PERSONNEL_IMG_WIDTH = 600
export const PERSONNEL_IMG_WEBP_QUALITY = 80
export const PERSONNEL_IMG_MAX_INPUT_BYTES = 8 * 1024 * 1024 // 8 MB ก่อนแปลง

export type WebpConversionResult = {
  data: Buffer
  mime: 'image/webp'
  bytes: number
  width: number
  height: number
}

/**
 * รับ buffer ภาพต้นฉบับ (JPEG/PNG/WebP/GIF/AVIF/HEIF) → คืน WebP buffer ที่ resize แล้ว
 * ไม่ขยายภาพเล็กขึ้น (withoutEnlargement) เพื่อรักษาคุณภาพ
 */
export async function convertImageToWebp(
  inputBuffer: Buffer,
): Promise<WebpConversionResult> {
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Empty image buffer')
  }
  if (inputBuffer.length > PERSONNEL_IMG_MAX_INPUT_BYTES) {
    throw new Error(
      `Image too large (max ${Math.round(PERSONNEL_IMG_MAX_INPUT_BYTES / 1024 / 1024)} MB)`,
    )
  }

  const pipeline = sharp(inputBuffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: PERSONNEL_IMG_WIDTH,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: PERSONNEL_IMG_WEBP_QUALITY, effort: 4 })

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

  return {
    data,
    mime: 'image/webp',
    bytes: data.length,
    width: info.width,
    height: info.height,
  }
}
