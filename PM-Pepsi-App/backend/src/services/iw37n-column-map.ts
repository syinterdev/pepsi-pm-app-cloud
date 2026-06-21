/** แมปคอลัมน์จากชื่อ header SAP / legacy (FACTORY-FUNCTIONALLOC-7151.md) */

export type Iw37nColumnMap = {
  mntplan: number
  wkorder: number
  wktype: number
  mat: number
  bscstart: number
  actfinish: number
  systemstatus: number
  opac: number
  operationshorttext: number
  ostdescription: number
  cknow: number
  wkctr: number
  work: number
  actwork: number
  untime: number
  equipment: number
  equdescrip: number
  functionalloc: number
  funcdescrip: number
  /** มีคอลัมน์ Functional loc. (รหัส) จริง */
  hasFunctionalLocCode: boolean
}

function normHeader(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function findCol(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]!
    if (patterns.some((p) => p.test(h))) return i
  }
  return -1
}

function pickCol(headers: string[], patterns: RegExp[], fallback: number): number {
  const i = findCol(headers, patterns)
  return i >= 0 ? i : fallback
}

/** สร้างแมปจากแถว header (Order, OpAc, …) */
export function buildIw37nColumnMap(headerRow: unknown[]): Iw37nColumnMap | null {
  if (!Array.isArray(headerRow) || headerRow.length < 10) return null
  const headers = headerRow.map(normHeader)
  if (!headers.some((h) => h === 'order' || h.includes('order'))) return null

  const functionallocIdx = findCol(headers, [
    /^functional loc\.?$/,
    /^functional location$/,
    /^functloc\.?$/,
    /^funct\.?loc\.?$/,
  ])
  const funcdescripIdx = pickCol(
    headers,
    [/^functlocdescrip\.?$/, /^funct\.?loc\.?descrip/, /^functional loc\.? descrip/],
    18,
  )
  const equdescripIdx = pickCol(
    headers,
    [/^equipment descriptn/, /^equipment description/, /^equip\.? descrip/],
    17,
  )
  const equipmentIdx = findCol(headers, [/^equipment$/, /^equip\.?$/])

  return {
    mntplan: pickCol(headers, [/^mntplan$/, /^maint\.? plan/], 0),
    wkorder: pickCol(headers, [/^order$/], 1),
    wktype: pickCol(headers, [/^type$/], 2),
    mat: pickCol(headers, [/^mat$/], 3),
    bscstart: pickCol(headers, [/^bsc start/, /^basic start/], 4),
    actfinish: pickCol(headers, [/^act\.?finish/, /^actual finish/], 5),
    systemstatus: pickCol(headers, [/^system status/], 6),
    opac: pickCol(headers, [/^opac$/], 7),
    operationshorttext: pickCol(headers, [/^operation short text/], 8),
    ostdescription: pickCol(headers, [/^description$/], 9),
    cknow: pickCol(headers, [/^c$/], 10),
    wkctr: pickCol(headers, [/^op\.?workctr/, /^work ctr/], 11),
    work: pickCol(headers, [/^work$/], 12),
    actwork: pickCol(headers, [/^act\.? work/], 13),
    untime: pickCol(headers, [/^un\.$/, /^unit$/], 14),
    equipment: equipmentIdx,
    equdescrip: equdescripIdx,
    functionalloc: functionallocIdx >= 0 ? functionallocIdx : equdescripIdx,
    funcdescrip: funcdescripIdx,
    hasFunctionalLocCode: functionallocIdx >= 0 && functionallocIdx !== funcdescripIdx,
  }
}

export function cellAt(row: unknown[], col: number): unknown {
  if (col < 0) return ''
  return row[col] ?? ''
}
