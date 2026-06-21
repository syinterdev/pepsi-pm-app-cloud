export type PlanningShiftTag = 'AA' | 'BB'
export type PlanningCraftTag = 'EE' | 'UT'
export type PlanningCategoryTag = PlanningShiftTag | PlanningCraftTag

export type PlanningWorkcenterTags = {
  shiftTags: PlanningShiftTag[]
  craftTags: PlanningCraftTag[]
}

export function derivePlanningWorkcenterTags(input: {
  cat?: string | null
  wkctrtype?: string | null
  idwkctrtype?: string | null
}): PlanningWorkcenterTags {
  const shiftTags: PlanningShiftTag[] = []
  const craftTags: PlanningCraftTag[] = []

  const cat = (input.cat ?? '').trim().toUpperCase()
  if (cat === 'A' || cat === 'AA') shiftTags.push('AA')
  if (cat === 'B' || cat === 'BB') shiftTags.push('BB')

  const craftSource = `${input.wkctrtype ?? ''} ${input.idwkctrtype ?? ''}`.trim().toUpperCase()
  if (craftSource.includes('EE')) craftTags.push('EE')
  if (craftSource.includes('UT')) craftTags.push('UT')

  return { shiftTags, craftTags }
}

/** AND filter across selected categories; empty tags pass until master AA/BB binding. */
export function matchesPlanningCategoryFilter(
  tags: PlanningWorkcenterTags,
  selected: ReadonlySet<PlanningCategoryTag>,
): boolean {
  if (selected.size === 0) return true

  const shiftSelected = (['AA', 'BB'] as const).filter((c) => selected.has(c))
  const craftSelected = (['EE', 'UT'] as const).filter((c) => selected.has(c))

  if (shiftSelected.length > 0) {
    const ok =
      tags.shiftTags.length === 0 || shiftSelected.some((s) => tags.shiftTags.includes(s))
    if (!ok) return false
  }
  if (craftSelected.length > 0) {
    const ok =
      tags.craftTags.length === 0 || craftSelected.some((c) => tags.craftTags.includes(c))
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
