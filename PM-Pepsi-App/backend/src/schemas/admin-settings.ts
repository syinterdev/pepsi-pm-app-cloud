import { z } from 'zod'

export const localeSchema = z.enum(['th-TH', 'en-US'])
export const yearFormatSchema = z.enum(['BE', 'AD'])
export const dateFormatSchema = z.enum(['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd'])

export const settingsResetSectionSchema = z.enum(['locale', 'limits', 'features', 'maintenance'])

export type SettingsResetSection = z.infer<typeof settingsResetSectionSchema>

export const adminSettingsResponseSchema = z.object({
  locale: localeSchema,
  timezone: z.string().min(1).max(64),
  yearFormat: yearFormatSchema,
  dateFormat: dateFormatSchema,
  uploadMaxMb: z.number().int().min(1).max(500),
  sessionTtlMin: z.number().int().min(15).max(1440),
  passwordMinLength: z.number().int().min(8).max(128),
  maxLoginAttempts: z.number().int().min(3).max(50),
  featureIndexeddbOffline: z.boolean(),
  featureDashboardCharts: z.boolean(),
  maintenanceEnabled: z.boolean(),
  maintenanceMessage: z.string(),
})

export type AdminSettingsResponse = z.infer<typeof adminSettingsResponseSchema>

export const adminSecretSettingSchema = z.object({
  settingKey: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  hasValue: z.boolean(),
  maskedValue: z.string(),
})

export const adminSecretSettingsResponseSchema = z.object({
  items: z.array(adminSecretSettingSchema),
})

export const patchAdminSettingsBodySchema = z
  .object({
    locale: localeSchema.optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    yearFormat: yearFormatSchema.optional(),
    dateFormat: dateFormatSchema.optional(),
    uploadMaxMb: z.number().int().min(1).max(500).optional(),
    sessionTtlMin: z.number().int().min(15).max(1440).optional(),
    passwordMinLength: z.number().int().min(8).max(128).optional(),
    maxLoginAttempts: z.number().int().min(3).max(50).optional(),
    featureIndexeddbOffline: z.boolean().optional(),
    featureDashboardCharts: z.boolean().optional(),
    maintenanceEnabled: z.boolean().optional(),
    maintenanceMessage: z.string().max(2000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'ต้องระบุอย่างน้อยหนึ่งฟิลด์' })
