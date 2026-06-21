export type MasterPlanRowFilterable = {
  cells: Record<string, string>
  display: Record<string, string>
}

/** Filter loaded sheet rows by any cell / fill-down display value. */
export function filterMasterPlanRows<T extends MasterPlanRowFilterable>(
  rows: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => {
    const values = new Set<string>()
    for (const v of Object.values(row.cells)) {
      const t = v?.trim()
      if (t) values.add(t.toLowerCase())
    }
    for (const v of Object.values(row.display)) {
      const t = v?.trim()
      if (t) values.add(t.toLowerCase())
    }
    return [...values].some((v) => v.includes(q))
  })
}
