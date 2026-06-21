import type { MasterPlanDiscipline } from '@/lib/master-plan-api'

const STORAGE_KEY = 'pm_master_plan_last_sheet'

type LastSheetMap = Partial<Record<MasterPlanDiscipline, number>>

function readMap(): LastSheetMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed == null || typeof parsed !== 'object') return {}
    return parsed as LastSheetMap
  } catch {
    return {}
  }
}

export function readLastMasterPlanSheetId(discipline: MasterPlanDiscipline): number | null {
  const id = readMap()[discipline]
  return typeof id === 'number' && Number.isInteger(id) ? id : null
}

export function writeLastMasterPlanSheetId(
  discipline: MasterPlanDiscipline,
  sheetId: number,
): void {
  try {
    const map = readMap()
    map[discipline] = sheetId
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}
