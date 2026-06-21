import type { Pool } from 'pg'
import { readPackageVersion } from '../lib/read-package-version.js'
import type { AdminAboutResponse } from '../schemas/admin-about.js'
import { formatPlatformLabel, resolveAboutLicense } from './admin-about-license.js'
import { getAdminHealth } from './admin-health.js'
import { fetchSettings, isSettingTableMissing } from './setting-store.js'

const VENDOR = 'S.Y. Interactive Development Limited'
const CLIENT = 'บริษัท เป๊ปซี่โคล่า (ไทย) เทรดดิ้ง จำกัด'

async function loadLicense(pool: Pool) {
  try {
    const settings = await fetchSettings(pool, ['app.license_key'])
    return resolveAboutLicense(settings, {
      status: process.env.LICENSE_STATUS,
      expires: process.env.LICENSE_EXPIRES,
    })
  } catch (err) {
    if (isSettingTableMissing(err)) {
      return resolveAboutLicense(new Map(), {
        status: process.env.LICENSE_STATUS,
        expires: process.env.LICENSE_EXPIRES,
      })
    }
    throw err
  }
}

export async function getAdminAbout(pool: Pool): Promise<AdminAboutResponse> {
  const apiVersion = readPackageVersion('../package.json')
  const webVersion = readPackageVersion('../../../frontend/package.json')
  const [health, license] = await Promise.all([
    getAdminHealth(pool, { version: apiVersion }),
    loadLicense(pool),
  ])

  return {
    time: new Date().toISOString(),
    apiVersion,
    webVersion,
    buildCommit: process.env.BUILD_COMMIT?.trim() || null,
    buildTime: process.env.BUILD_TIME?.trim() || null,
    vendor: VENDOR,
    client: CLIENT,
    license,
    server: {
      platform: health.process.platform,
      platformLabel: formatPlatformLabel(health.process.platform),
      nodeVersion: health.process.nodeVersion,
      uptimeSec: health.process.uptimeSec,
      disk: health.disk,
    },
    migration: {
      status: health.migration.status,
      totalFiles: health.migration.totalFiles,
      appliedCount: health.migration.appliedCount,
      pendingCount: health.migration.pendingCount,
      unverifiedCount: health.migration.unverifiedCount,
      latestAppliedId: health.migration.latestAppliedId,
      latestFile: health.migration.latestFile,
    },
  }
}
