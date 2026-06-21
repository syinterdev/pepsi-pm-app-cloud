import type { WoPmPhase } from './wo-pm-phase.js'

export const PM_PHASE_FILTER_CODES = ['create', 'rel', 'confirm'] as const

export type PmPhaseFilterCode = (typeof PM_PHASE_FILTER_CODES)[number]

export const PM_PHASE_FILTER_OPTIONS: { code: PmPhaseFilterCode; label: string }[] = [
  { code: 'create', label: 'Create (CRTD)' },
  { code: 'rel', label: 'REL' },
  { code: 'confirm', label: 'Confirm' },
]

/** SQL ต่อ phase เดียว — mirror `resolveWoPmPhase` */
export function sqlPmPhaseMatch(code: PmPhaseFilterCode, alias: string): string {
  const syst = `UPPER(TRIM(COALESCE(${alias}.syst, '')))`
  switch (code) {
    case 'create':
      return `${syst} = 'CRTD'`
    case 'rel':
      return `${syst} = 'REL'`
    case 'confirm':
      return `${syst} NOT IN ('CRTD', 'REL')`
    default:
      return 'FALSE'
  }
}

export function appendPmPhaseFilter(
  values: string[] | undefined,
  alias: string,
  _params: unknown[],
): string {
  const codes = (values ?? []).filter((v): v is PmPhaseFilterCode =>
    (PM_PHASE_FILTER_CODES as readonly string[]).includes(v),
  )
  if (codes.length === 0) return ''

  const parts = codes.map((code) => sqlPmPhaseMatch(code, alias))
  return ` AND (${parts.join(' OR ')})`
}

/** ใช้ใน unit test — mirror logic ฝั่ง TS */
export function matchesPmPhaseFilter(code: PmPhaseFilterCode, syst: string | null | undefined): boolean {
  const s = (syst ?? '').trim().toUpperCase()
  if (code === 'create') return s === 'CRTD'
  if (code === 'rel') return s === 'REL'
  return s !== 'CRTD' && s !== 'REL'
}

export function resolvePmPhaseFromSyst(syst: string | null | undefined): WoPmPhase {
  const s = (syst ?? '').trim().toUpperCase()
  if (s === 'CRTD') return 'create'
  if (s === 'REL') return 'rel'
  return 'confirm'
}
