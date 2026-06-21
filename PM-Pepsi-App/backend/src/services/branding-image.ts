import sharp from 'sharp'
import { assertBrandingUploadAllowed } from '../lib/image-magic.js'
import { removeLightBackgroundBuffer } from '../lib/remove-light-background.js'
import { sanitizeSvgMarkup } from '../lib/svg-sanitize.js'

export const BRAND_LOGO_MAX_WIDTH = 256
export const BRAND_LOGO_WEBP_QUALITY = 85
export const BRAND_FAVICON_SIZE = 32
export const BRAND_LOGIN_BG_MAX_WIDTH = 1920
export const BRAND_LOGIN_BG_WEBP_QUALITY = 82
export const BRAND_IMG_MAX_INPUT_BYTES = 4 * 1024 * 1024
/** พื้นหลัง login / wallpaper — อนุญาตไฟล์ต้นทางใหญ่กว่าโลโก้ */
export const BRAND_LOGIN_BG_MAX_INPUT_BYTES = 8 * 1024 * 1024

export type BrandLogoResult = {
  data: Buffer
  mime: 'image/webp'
  bytes: number
  width: number
  height: number
}

export type BrandFaviconResult = {
  data: Buffer
  mime: 'image/png'
  bytes: number
}

export async function convertBrandingLogo(
  inputBuffer: Buffer,
  mimetype?: string,
  options?: { removeBackground?: boolean },
): Promise<BrandLogoResult> {
  if (!inputBuffer?.length) throw new Error('Empty image buffer')
  if (inputBuffer.length > BRAND_IMG_MAX_INPUT_BYTES) {
    throw new Error(`Image too large (max ${BRAND_IMG_MAX_INPUT_BYTES / 1024 / 1024} MB)`)
  }

  const detected = assertBrandingUploadAllowed(inputBuffer, mimetype)
  let raster: Buffer =
    detected.kind === 'svg'
      ? Buffer.from(sanitizeSvgMarkup(detected.markup), 'utf8')
      : inputBuffer

  if (options?.removeBackground && detected.kind !== 'svg') {
    raster = await removeLightBackgroundBuffer(raster)
  }

  const { data, info } = await sharp(raster, { failOn: 'none' })
    .rotate()
    .resize({
      width: BRAND_LOGO_MAX_WIDTH,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: BRAND_LOGO_WEBP_QUALITY, effort: 4, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true })

  return {
    data,
    mime: 'image/webp',
    bytes: data.length,
    width: info.width,
    height: info.height,
  }
}

export async function convertBrandingFavicon(
  inputBuffer: Buffer,
  mimetype?: string,
  sizePx: number = BRAND_FAVICON_SIZE,
  options?: { removeBackground?: boolean },
): Promise<BrandFaviconResult> {
  if (!inputBuffer?.length) throw new Error('Empty image buffer')
  if (inputBuffer.length > BRAND_IMG_MAX_INPUT_BYTES) {
    throw new Error(`Image too large (max ${BRAND_IMG_MAX_INPUT_BYTES / 1024 / 1024} MB)`)
  }

  const detected = assertBrandingUploadAllowed(inputBuffer, mimetype)
  if (detected.kind === 'svg') {
    throw new Error('Favicon ไม่รองรับ SVG — ใช้ PNG หรือ JPEG')
  }

  let raster = inputBuffer
  if (options?.removeBackground) {
    raster = await removeLightBackgroundBuffer(raster)
  }

  const side = Math.max(16, Math.min(48, Math.round(sizePx)))
  const data = await sharp(raster, { failOn: 'none' })
    .rotate()
    .resize(side, side, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toBuffer()

  return { data, mime: 'image/png', bytes: data.length }
}

export type BrandLoginBgResult = {
  data: Buffer
  mime: 'image/webp'
  bytes: number
  width: number
  height: number
}

/** พื้นหลังหน้า login — WebP กว้างสุด 1920px */
export async function convertBrandingLoginBackground(
  inputBuffer: Buffer,
  mimetype?: string,
): Promise<BrandLoginBgResult> {
  if (!inputBuffer?.length) throw new Error('Empty image buffer')
  if (inputBuffer.length > BRAND_LOGIN_BG_MAX_INPUT_BYTES) {
    throw new Error(`Image too large (max ${BRAND_LOGIN_BG_MAX_INPUT_BYTES / 1024 / 1024} MB)`)
  }

  const detected = assertBrandingUploadAllowed(inputBuffer, mimetype)
  const raster =
    detected.kind === 'svg'
      ? Buffer.from(sanitizeSvgMarkup(detected.markup), 'utf8')
      : inputBuffer

  const { data, info } = await sharp(raster, { failOn: 'none' })
    .rotate()
    .resize({
      width: BRAND_LOGIN_BG_MAX_WIDTH,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: BRAND_LOGIN_BG_WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true })

  return {
    data,
    mime: 'image/webp',
    bytes: data.length,
    width: info.width,
    height: info.height,
  }
}
