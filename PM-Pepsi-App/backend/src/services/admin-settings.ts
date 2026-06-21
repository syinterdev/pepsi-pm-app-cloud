import type { Pool } from 'pg'
import {
  adminSettingsResponseSchema,
  type AdminSettingsResponse,
  dateFormatSchema,
  localeSchema,
  patchAdminSettingsBodySchema,
  yearFormatSchema,
} from '../schemas/admin-settings.js'
import { clearSecuritySettingsCache } from '../lib/security-settings.js'
import { clearSessionTtlCache } from '../lib/session-ttl.js'
import { clearUploadLimitCache } from '../lib/upload-settings.js'
import { clearMaintenanceCache } from './maintenance-mode.js'
import type { SettingsResetSection } from '../schemas/admin-settings.js'
import {
  fetchSettings,
  isSettingTableMissing,
  settingAsBoolean,
  settingAsNumber,
  settingAsString,
  upsertSetting,
} from './setting-store.js'

const SYSTEM_KEYS = [
  'app.locale',
  'app.timezone',
  'app.year_format',
  'app.date_format',
  'app.upload_max_mb',
  'app.session_ttl_min',
  'app.password_min_length',
  'security.max_login_attempts',
  'feature.indexeddb_offline',
  'feature.dashboard_charts',
  'maintenance.enabled',
  'maintenance.message',
] as const

export const SETTINGS_DEFAULTS: AdminSettingsResponse = {
  locale: 'en-US',
  timezone: 'Asia/Bangkok',
  yearFormat: 'BE',
  dateFormat: 'dd/MM/yyyy',
  uploadMaxMb: 15,
  sessionTtlMin: 480,
  passwordMinLength: 12,
  maxLoginAttempts: 5,
  featureIndexeddbOffline: false,
  featureDashboardCharts: false,
  maintenanceEnabled: false,
  maintenanceMessage: '',
}

function mapSettings(map: Map<string, unknown>): AdminSettingsResponse {
  const localeRaw = settingAsString(map.get('app.locale')) ?? SETTINGS_DEFAULTS.locale
  const yearRaw = settingAsString(map.get('app.year_format')) ?? SETTINGS_DEFAULTS.yearFormat
  const dateRaw = settingAsString(map.get('app.date_format')) ?? SETTINGS_DEFAULTS.dateFormat

  return adminSettingsResponseSchema.parse({
    locale: localeSchema.safeParse(localeRaw).success
      ? localeSchema.parse(localeRaw)
      : SETTINGS_DEFAULTS.locale,
    timezone: settingAsString(map.get('app.timezone')) ?? SETTINGS_DEFAULTS.timezone,
    yearFormat: yearFormatSchema.safeParse(yearRaw).success
      ? yearFormatSchema.parse(yearRaw)
      : SETTINGS_DEFAULTS.yearFormat,
    dateFormat: dateFormatSchema.safeParse(dateRaw).success
      ? dateFormatSchema.parse(dateRaw)
      : SETTINGS_DEFAULTS.dateFormat,
    uploadMaxMb: settingAsNumber(map.get('app.upload_max_mb'), SETTINGS_DEFAULTS.uploadMaxMb),
    sessionTtlMin: settingAsNumber(map.get('app.session_ttl_min'), SETTINGS_DEFAULTS.sessionTtlMin),
    passwordMinLength: settingAsNumber(
      map.get('app.password_min_length'),
      SETTINGS_DEFAULTS.passwordMinLength,
    ),
    maxLoginAttempts: settingAsNumber(
      map.get('security.max_login_attempts'),
      SETTINGS_DEFAULTS.maxLoginAttempts,
    ),
    featureIndexeddbOffline: settingAsBoolean(
      map.get('feature.indexeddb_offline'),
      SETTINGS_DEFAULTS.featureIndexeddbOffline,
    ),
    featureDashboardCharts: settingAsBoolean(
      map.get('feature.dashboard_charts'),
      SETTINGS_DEFAULTS.featureDashboardCharts,
    ),
    maintenanceEnabled: settingAsBoolean(
      map.get('maintenance.enabled'),
      SETTINGS_DEFAULTS.maintenanceEnabled,
    ),
    maintenanceMessage:
      settingAsString(map.get('maintenance.message')) ?? SETTINGS_DEFAULTS.maintenanceMessage,
  })
}

export async function getAdminSettings(pool: Pool): Promise<AdminSettingsResponse> {
  try {
    const map = await fetchSettings(pool, SYSTEM_KEYS)
    if (!map.size) return { ...SETTINGS_DEFAULTS }
    return mapSettings(map)
  } catch (err) {
    if (isSettingTableMissing(err)) return { ...SETTINGS_DEFAULTS }
    throw err
  }
}

export async function patchAdminSettings(
  pool: Pool,
  body: unknown,
  updatedBy: string,
): Promise<AdminSettingsResponse> {
  const parsed = patchAdminSettingsBodySchema.parse(body)

  if (parsed.locale !== undefined) {
    await upsertSetting(pool, 'app.locale', parsed.locale, 'system', updatedBy)
  }
  if (parsed.timezone !== undefined) {
    await upsertSetting(pool, 'app.timezone', parsed.timezone, 'system', updatedBy)
  }
  if (parsed.yearFormat !== undefined) {
    await upsertSetting(pool, 'app.year_format', parsed.yearFormat, 'system', updatedBy)
  }
  if (parsed.dateFormat !== undefined) {
    await upsertSetting(pool, 'app.date_format', parsed.dateFormat, 'system', updatedBy)
  }
  if (parsed.uploadMaxMb !== undefined) {
    await upsertSetting(pool, 'app.upload_max_mb', parsed.uploadMaxMb, 'system', updatedBy)
    clearUploadLimitCache()
  }
  if (parsed.sessionTtlMin !== undefined) {
    await upsertSetting(pool, 'app.session_ttl_min', parsed.sessionTtlMin, 'system', updatedBy)
    clearSessionTtlCache()
  }
  if (parsed.passwordMinLength !== undefined) {
    await upsertSetting(pool, 'app.password_min_length', parsed.passwordMinLength, 'system', updatedBy)
    clearSecuritySettingsCache()
  }
  if (parsed.maxLoginAttempts !== undefined) {
    await upsertSetting(
      pool,
      'security.max_login_attempts',
      parsed.maxLoginAttempts,
      'system',
      updatedBy,
    )
    clearSecuritySettingsCache()
  }
  if (parsed.featureIndexeddbOffline !== undefined) {
    await upsertSetting(
      pool,
      'feature.indexeddb_offline',
      parsed.featureIndexeddbOffline,
      'feature',
      updatedBy,
    )
  }
  if (parsed.featureDashboardCharts !== undefined) {
    await upsertSetting(
      pool,
      'feature.dashboard_charts',
      parsed.featureDashboardCharts,
      'feature',
      updatedBy,
    )
  }
  if (parsed.maintenanceEnabled !== undefined) {
    await upsertSetting(pool, 'maintenance.enabled', parsed.maintenanceEnabled, 'system', updatedBy)
  }
  if (parsed.maintenanceMessage !== undefined) {
    await upsertSetting(pool, 'maintenance.message', parsed.maintenanceMessage, 'system', updatedBy)
  }

  if (parsed.maintenanceEnabled !== undefined || parsed.maintenanceMessage !== undefined) {
    clearMaintenanceCache()
  }

  return getAdminSettings(pool)
}

export async function resetAdminSettings(pool: Pool, updatedBy: string): Promise<AdminSettingsResponse> {
  const d = SETTINGS_DEFAULTS
  await upsertSetting(pool, 'app.locale', d.locale, 'system', updatedBy)
  await upsertSetting(pool, 'app.timezone', d.timezone, 'system', updatedBy)
  await upsertSetting(pool, 'app.year_format', d.yearFormat, 'system', updatedBy)
  await upsertSetting(pool, 'app.date_format', d.dateFormat, 'system', updatedBy)
  await upsertSetting(pool, 'app.upload_max_mb', d.uploadMaxMb, 'system', updatedBy)
  await upsertSetting(pool, 'app.session_ttl_min', d.sessionTtlMin, 'system', updatedBy)
  await upsertSetting(pool, 'app.password_min_length', d.passwordMinLength, 'system', updatedBy)
  await upsertSetting(pool, 'security.max_login_attempts', d.maxLoginAttempts, 'system', updatedBy)
  await upsertSetting(pool, 'feature.indexeddb_offline', d.featureIndexeddbOffline, 'feature', updatedBy)
  await upsertSetting(pool, 'feature.dashboard_charts', d.featureDashboardCharts, 'feature', updatedBy)
  await upsertSetting(pool, 'maintenance.enabled', d.maintenanceEnabled, 'system', updatedBy)
  await upsertSetting(pool, 'maintenance.message', d.maintenanceMessage, 'system', updatedBy)
  clearUploadLimitCache()
  clearSessionTtlCache()
  clearSecuritySettingsCache()
  clearMaintenanceCache()
  return getAdminSettings(pool)
}

export async function resetAdminSettingsSection(
  pool: Pool,
  section: SettingsResetSection,
  updatedBy: string,
): Promise<AdminSettingsResponse> {
  const d = SETTINGS_DEFAULTS
  switch (section) {
    case 'locale':
      await upsertSetting(pool, 'app.locale', d.locale, 'system', updatedBy)
      await upsertSetting(pool, 'app.timezone', d.timezone, 'system', updatedBy)
      await upsertSetting(pool, 'app.year_format', d.yearFormat, 'system', updatedBy)
      await upsertSetting(pool, 'app.date_format', d.dateFormat, 'system', updatedBy)
      break
    case 'limits':
      await upsertSetting(pool, 'app.upload_max_mb', d.uploadMaxMb, 'system', updatedBy)
      await upsertSetting(pool, 'app.session_ttl_min', d.sessionTtlMin, 'system', updatedBy)
      await upsertSetting(pool, 'app.password_min_length', d.passwordMinLength, 'system', updatedBy)
      await upsertSetting(pool, 'security.max_login_attempts', d.maxLoginAttempts, 'system', updatedBy)
      clearUploadLimitCache()
      clearSessionTtlCache()
      clearSecuritySettingsCache()
      break
    case 'features':
      await upsertSetting(pool, 'feature.indexeddb_offline', d.featureIndexeddbOffline, 'feature', updatedBy)
      await upsertSetting(pool, 'feature.dashboard_charts', d.featureDashboardCharts, 'feature', updatedBy)
      break
    case 'maintenance':
      await upsertSetting(pool, 'maintenance.enabled', d.maintenanceEnabled, 'system', updatedBy)
      await upsertSetting(pool, 'maintenance.message', d.maintenanceMessage, 'system', updatedBy)
      clearMaintenanceCache()
      break
    default: {
      const _exhaustive: never = section
      throw new Error(`Unknown settings section: ${String(_exhaustive)}`)
    }
  }
  return getAdminSettings(pool)
}
