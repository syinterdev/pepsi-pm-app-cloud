import { z } from 'zod'
import {
  BRAND_FAVICON_SIZE_MAX,
  BRAND_FAVICON_SIZE_MIN,
  BRAND_LOGO_LOGIN_HEIGHT_MAX,
  BRAND_LOGO_LOGIN_HEIGHT_MIN,
  BRAND_LOGO_NAV_HEIGHT_MAX,
  BRAND_LOGO_NAV_HEIGHT_MIN,
} from '../lib/branding-asset-sizes.js'
import { fontFamilyKeySchema, fontSizePresetSchema } from '../lib/typography.js'
import { themeModeSchema } from './settings.js'

const optionalHexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'สีต้องเป็นรูปแบบ #RRGGBB')
  .nullable()
  .optional()

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'สีต้องเป็นรูปแบบ #RRGGBB')

export const adminBrandingResponseSchema = z.object({
  appName: z.string(),
  footerText: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  successColor: z.string(),
  warningColor: z.string(),
  dangerColor: z.string(),
  infoColor: z.string(),
  themeMode: themeModeSchema,
  logoMime: z.string().nullable(),
  hasLogo: z.boolean(),
  hasFavicon: z.boolean(),
  hasLoginBackground: z.boolean(),
  fontFamily: fontFamilyKeySchema,
  fontSizePreset: fontSizePresetSchema,
  fontSizeBasePx: z.number().int().min(12).max(22).nullable(),
  fontColor: z.string().nullable(),
  fontHeadingColor: z.string().nullable(),
  fontMutedColor: z.string().nullable(),
  logoNavHeightPx: z.number().int().min(BRAND_LOGO_NAV_HEIGHT_MIN).max(BRAND_LOGO_NAV_HEIGHT_MAX),
  logoLoginHeightPx: z.number().int().min(BRAND_LOGO_LOGIN_HEIGHT_MIN).max(BRAND_LOGO_LOGIN_HEIGHT_MAX),
  faviconSizePx: z.number().int().min(BRAND_FAVICON_SIZE_MIN).max(BRAND_FAVICON_SIZE_MAX),
})

export type AdminBrandingResponse = z.infer<typeof adminBrandingResponseSchema>

export const patchAdminBrandingBodySchema = z
  .object({
    appName: z.string().trim().min(1).max(120).optional(),
    footerText: z.string().trim().max(500).optional(),
    primaryColor: hexColorSchema.optional(),
    accentColor: hexColorSchema.optional(),
    successColor: hexColorSchema.optional(),
    warningColor: hexColorSchema.optional(),
    dangerColor: hexColorSchema.optional(),
    infoColor: hexColorSchema.optional(),
    themeMode: themeModeSchema.optional(),
    fontFamily: fontFamilyKeySchema.optional(),
    fontSizePreset: fontSizePresetSchema.optional(),
    fontSizeBasePx: z.number().int().min(12).max(22).nullable().optional(),
    fontColor: optionalHexColor,
    fontHeadingColor: optionalHexColor,
    fontMutedColor: optionalHexColor,
    logoNavHeightPx: z.number().int().min(BRAND_LOGO_NAV_HEIGHT_MIN).max(BRAND_LOGO_NAV_HEIGHT_MAX).optional(),
    logoLoginHeightPx: z
      .number()
      .int()
      .min(BRAND_LOGO_LOGIN_HEIGHT_MIN)
      .max(BRAND_LOGO_LOGIN_HEIGHT_MAX)
      .optional(),
    faviconSizePx: z.number().int().min(BRAND_FAVICON_SIZE_MIN).max(BRAND_FAVICON_SIZE_MAX).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'ต้องระบุอย่างน้อยหนึ่งฟิลด์' })

export const brandingImageUploadResponseSchema = z.object({
  hasLogo: z.boolean().optional(),
  hasFavicon: z.boolean().optional(),
  hasLoginBackground: z.boolean().optional(),
  logoMime: z.string().nullable().optional(),
  mime: z.string().optional(),
  bytes: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const brandingOkSchema = z.object({ ok: z.literal(true) })
