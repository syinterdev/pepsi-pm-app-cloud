export type PlanningShiftTag = 'AA' | 'BB'
export type PlanningCraftTag = 'EE' | 'UT'
export type PlanningCategoryTag = PlanningShiftTag | PlanningCraftTag

export type PlanningWorkcenterTags = {
  shiftTags?: PlanningShiftTag[]
  craftTags?: PlanningCraftTag[]
}

export function matchesPlanningCategoryFilter(
  tags: PlanningWorkcenterTags,
  selected: ReadonlySet<PlanningCategoryTag>,
): boolean {
  if (selected.size === 0) return true

  const shiftTags = tags.shiftTags ?? []
  const craftTags = tags.craftTags ?? []
  const shiftSelected = (['AA', 'BB'] as const).filter((c) => selected.has(c))
  const craftSelected = (['EE', 'UT'] as const).filter((c) => selected.has(c))

  if (shiftSelected.length > 0) {
    const ok = shiftTags.length === 0 || shiftSelected.some((s) => shiftTags.includes(s))
    if (!ok) return false
  }
  if (craftSelected.length > 0) {
    const ok = craftTags.length === 0 || craftSelected.some((c) => craftTags.includes(c))
    if (!ok) return false
  }
  return true
}

export function woTeamToShiftLabel(team: string | null | undefined): PlanningShiftTag | null {
  const t = (team ?? '').trim().toUpperCase()
  if (t === 'A') return 'AA'
  if (t === 'B') return 'BB'
  return null
}
