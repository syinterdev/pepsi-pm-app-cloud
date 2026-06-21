import { settingAsString } from './setting-store.js'

export type AboutLicenseInfo = {
  status: string
  expiresAt: string | null
}

/** License for About — env overrides; else infer from masked `app.license_key` in tbl_setting. */
export function resolveAboutLicense(
  settings: Map<string, unknown>,
  env: { status?: string; expires?: string },
): AboutLicenseInfo {
  const expiresAt = env.expires?.trim() || null
  const envStatus = env.status?.trim()
  if (envStatus) {
    return { status: envStatus, expiresAt }
  }

  const key = settingAsString(settings.get('app.license_key'))
  if (key && key.trim() && key !== 'null') {
    if (expiresAt) {
      const exp = new Date(expiresAt)
      if (!Number.isNaN(exp.getTime()) && exp < new Date()) {
        return { status: 'expired', expiresAt }
      }
      return { status: 'active', expiresAt }
    }
    return { status: 'configured', expiresAt: null }
  }

  return { status: 'not_configured', expiresAt: null }
}

export function formatPlatformLabel(platform: string): string {
  if (platform === 'win32') return 'Windows Server (win32)'
  if (platform === 'linux') return 'Linux'
  if (platform === 'darwin') return 'macOS'
  return platform
}
