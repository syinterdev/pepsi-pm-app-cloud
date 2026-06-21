/** Aligns with backend/src/lib/wktype-zd-mapping.ts — customer meeting #2 */
import { i18n } from '@/i18n'
import { lookupMaintActivityType } from '@/lib/maint-activity-type-zb02-lookup'

export type WktypeZdZbRow = {
  zb: string
  zd: string
}

export const WKTYPE_ZD_ZB_ROWS: readonly WktypeZdZbRow[] = [
  { zb: 'ZB01', zd: 'ZD05' },
  { zb: 'ZB02', zd: 'ZD02' },
  { zb: 'ZB05', zd: 'ZD01' },
] as const

const WKTYPE_FILTER_ORDER = WKTYPE_ZD_ZB_ROWS.map((r) => r.zb)

/** Keep ZB01 → ZB02 → ZB05 first — matches customer filter / CALENDAR-DISPLAY */
export function sortWktypeFilterOptions<T extends { code: string }>(options: readonly T[]): T[] {
  return [...options].sort((a, b) => {
    const ac = a.code.trim().toUpperCase()
    const bc = b.code.trim().toUpperCase()
    const ai = WKTYPE_FILTER_ORDER.indexOf(ac)
    const bi = WKTYPE_FILTER_ORDER.indexOf(bc)
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0) return -1
    if (bi >= 0) return 1
    return ac.localeCompare(bc)
  })
}

const BY_ZB = new Map(WKTYPE_ZD_ZB_ROWS.map((r) => [r.zb.toUpperCase(), r]))

function wktypeZdLabel(zb: string): string {
  return i18n.t(`wktype.zd.${zb}`, { ns: 'scheduling', defaultValue: zb })
}

function wktypeMappingSource(): string {
  return i18n.t('wktype.mappingSource', { ns: 'scheduling' })
}

function lookup(code: string): WktypeZdZbRow | null {
  const c = code.trim().toUpperCase()
  return c ? (BY_ZB.get(c) ?? null) : null
}

export function formatMaintCodeLead(mat: string | null | undefined): {
  code: string
  label: string
} | null {
  const raw = (mat ?? '').trim()
  if (!raw) return null
  const row = lookupMaintActivityType(raw)
  const code = row?.mat ?? (Number.isFinite(Number(raw)) ? String(Number(raw)).padStart(3, '0') : raw)
  const label = row ? `${code} ${row.description}` : code
  return { code, label }
}

export function formatWktypeDisplay(code: string): {
  code: string
  primary: string
  tooltip: string
  zdCode: string | null
} {
  const c = code.trim()
  const row = lookup(c)
  if (row) {
    const zdLabel = wktypeZdLabel(row.zb)
    return {
      code: c,
      primary: `${c} · ${row.zd}`,
      tooltip: `${row.zd} ${zdLabel} — ${wktypeMappingSource()}`,
      zdCode: row.zd,
    }
  }
  return { code: c, primary: c, tooltip: c, zdCode: null }
}

/** Maintenance Code prefix when ZB02 / ZD02 */
export function formatWktypeDisplayWithMat(code: string, mat?: string | null) {
  const base = formatWktypeDisplay(code)
  const wk = code.trim().toUpperCase()
  const maint = formatMaintCodeLead(mat)
  if (maint && (wk === 'ZB02' || base.zdCode === 'ZD02')) {
    return {
      ...base,
      primary: `${maint.code} · ${base.primary}`,
      tooltip: `${maint.label} — ${base.tooltip}`,
    }
  }
  return base
}
