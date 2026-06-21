import type { Pool } from 'pg'
import type { AuthUser } from '../schemas/auth.js'
import type { PortalModule, PortalModulesResponse } from '../schemas/portal.js'
import { listPermissionsForUserst } from '../lib/has-permission.js'
import { resolvePostLoginPathForUserst } from '../lib/primary-roles.js'

type AppModuleRow = {
  module_code: string
  perm_code: string
  name_th: string
  name_en: string
  description_th: string | null
  description_en: string | null
  icon_key: string
  accent_token: string | null
  base_url: string
  entry_path: string | null
  sort_order: number
  is_active: boolean
  handoff_mode: string
}

function isRbacSchemaMissing(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('tbl_app_module') ||
    message.includes('tbl_permission') ||
    message.includes('does not exist')
  )
}

function fallbackModules(user: AuthUser): PortalModulesResponse {
  const entry = resolvePostLoginPathForUserst(user.userst, '/plan-calendar')
  return {
    modules: [
      {
        code: 'pm',
        nameTh: 'PM Maintenance',
        nameEn: 'PM Maintenance',
        descriptionTh: 'แผนงาน · ใบงาน · Confirm',
        descriptionEn: 'Planning · work orders · confirmation',
        iconKey: 'wrench',
        accentToken: 'brand-pepsi-blue',
        external: false,
        entryUrl: entry,
        ready: true,
        handoff: 'same_origin',
      },
    ],
    autoRedirect: entry,
  }
}

export async function listPortalModulesForUser(
  pool: Pool,
  user: AuthUser,
): Promise<PortalModulesResponse> {
  try {
    const perms = await listPermissionsForUserst(pool, user.userst)
    const permSet = new Set(perms)

    const { rows } = await pool.query<AppModuleRow>(
      `SELECT module_code, perm_code, name_th, name_en, description_th, description_en,
              icon_key, accent_token, base_url, entry_path, sort_order, is_active, handoff_mode
       FROM app.tbl_app_module
       WHERE is_active = true
       ORDER BY sort_order, module_code`,
    )

    const modules: PortalModule[] = rows
      .filter((row) => permSet.has(row.perm_code))
      .map((row) => {
        const externalUrl = row.base_url.trim()
        const isPm = row.module_code === 'pm'
        const usesCodeExchange = row.handoff_mode === 'code_exchange'
        const ready = isPm || externalUrl.length > 0
        const entryUrl = isPm
          ? resolvePostLoginPathForUserst(user.userst, '/plan-calendar')
          : usesCodeExchange
            ? ''
            : externalUrl || row.entry_path || ''
        return {
          code: row.module_code,
          nameTh: row.name_th,
          nameEn: row.name_en,
          descriptionTh: row.description_th ?? '',
          descriptionEn: row.description_en ?? '',
          iconKey: row.icon_key,
          accentToken: row.accent_token,
          external: !isPm && ready,
          entryUrl,
          ready,
          handoff: row.handoff_mode,
        }
      })

    let autoRedirect: string | null = null
    if (modules.length === 1) {
      const only = modules[0]!
      if (only.ready && only.handoff === 'same_origin' && only.entryUrl) {
        autoRedirect = only.entryUrl
      }
    }

    return { modules, autoRedirect }
  } catch (err) {
    if (!isRbacSchemaMissing(err)) throw err
    return fallbackModules(user)
  }
}
