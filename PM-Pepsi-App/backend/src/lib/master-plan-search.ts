import { extractMasterPlanLinkKeys } from './master-plan-row-links.js'

export function buildMasterPlanSearchLabel(
  columnHeaders: string[],
  cells: Record<string, string>,
  display: Record<string, string>,
): string {
  const keys = extractMasterPlanLinkKeys(columnHeaders, cells, display)
  const parts = [
    keys.mntplan.trim(),
    keys.tasklist.trim(),
    keys.machine.trim(),
    keys.pmlist.trim(),
  ].filter(Boolean)
  if (parts.length > 0) return parts.slice(0, 2).join(' · ')
  for (const v of Object.values(display)) {
    const t = v?.trim()
    if (t) return t.length > 80 ? `${t.slice(0, 77)}…` : t
  }
  for (const v of Object.values(cells)) {
    const t = v?.trim()
    if (t) return t.length > 80 ? `${t.slice(0, 77)}…` : t
  }
  return ''
}

export function escapeIlikePattern(query: string): string {
  return query.replace(/[%_\\]/g, '\\$&')
}
