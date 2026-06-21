/**
 * รูปปิดงาน Before/After — แปลงเป็น WebP ก่อนเก็บใน tbconfirmimg.img_data (BYTEA)
 */
import sharp from 'sharp'

export const CONFIRM_IMG_MAX_WIDTH = 1600
export const CONFIRM_IMG_WEBP_QUALITY = 82

export type ConfirmImageWebpResult = {
  data: Buffer
  mime: 'image/webp'
  bytes: number
  width: number
  height: number
  fileName: string
}

export async function convertConfirmImageToWebp(
  inputBuffer: Buffer,
  idiw37: number,
): Promise<ConfirmImageWebpResult> {
  if (!inputBuffer?.length) throw new Error('Empty image buffer')

  const { data, info } = await sharp(inputBuffer, { failOn: 'none', limitInputPixels: false })
    .rotate()
    .resize({
      width: CONFIRM_IMG_MAX_WIDTH,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: CONFIRM_IMG_WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true })

  const stamp = `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
  const fileName = `${idiw37}_${stamp}.webp`

  return {
    data,
    mime: 'image/webp',
    bytes: data.length,
    width: info.width,
    height: info.height,
    fileName,
  }
}
