import type { ParsedMasterPlanSheet, ParsedMasterPlanWorkbook } from './master-plan-parse.js'

export type MasterPlanStructureDiff = {
  ok: boolean
  missingSheets: string[]
  extraSheets: string[]
  orderMismatch: boolean
  publishedNames: string[]
  importedNames: string[]
}

export type MasterPlanSheetDiff = {
  sheetName: string
  rowsAdded: number
  rowsRemoved: number
  rowsChanged: number
  publishedRowCount: number
  importedRowCount: number
}

export type MasterPlanCellChangeSample = {
  sheetName: string
  rowIndex: number
  fieldName: string
  before: string
  after: string
}

export type MasterPlanImportDiff = {
  structure: MasterPlanStructureDiff
  sheets: MasterPlanSheetDiff[]
  totalRowsAdded: number
  totalRowsRemoved: number
  totalRowsChanged: number
  sampleChanges: MasterPlanCellChangeSample[]
}

function sheetNames(workbook: ParsedMasterPlanWorkbook): string[] {
  return [...workbook.sheets].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => s.sheetName)
}

export function compareMasterPlanStructure(
  published: ParsedMasterPlanWorkbook | null,
  imported: ParsedMasterPlanWorkbook,
): MasterPlanStructureDiff {
  const publishedNames = published ? sheetNames(published) : []
  const importedNames = sheetNames(imported)
  const publishedSet = new Set(publishedNames)
  const importedSet = new Set(importedNames)

  const missingSheets = publishedNames.filter((n) => !importedSet.has(n))
  const extraSheets = importedNames.filter((n) => !publishedSet.has(n))
  const orderMismatch =
    publishedNames.length > 0 &&
    publishedNames.length === importedNames.length &&
    publishedNames.some((n, i) => n !== importedNames[i])

  const ok = missingSheets.length === 0 && extraSheets.length === 0 && !orderMismatch

  return {
    ok,
    missingSheets,
    extraSheets,
    orderMismatch,
    publishedNames,
    importedNames,
  }
}

function rowSignature(sheet: ParsedMasterPlanSheet, rowIndex: number): string {
  const row = sheet.rows.find((r) => r.rowIndex === rowIndex)
  if (!row) return `idx:${rowIndex}|`
  const keys = Object.keys(row.cells).sort()
  return `idx:${rowIndex}|${keys.map((k) => `${k}=${row.cells[k]}`).join('|')}`
}

function diffDetailSheet(
  published: ParsedMasterPlanSheet,
  imported: ParsedMasterPlanSheet,
  maxSamples: number,
  samples: MasterPlanCellChangeSample[],
): MasterPlanSheetDiff {
  const pubByIndex = new Map(published.rows.map((r) => [r.rowIndex, r]))
  const impByIndex = new Map(imported.rows.map((r) => [r.rowIndex, r]))
  const allIndexes = new Set([...pubByIndex.keys(), ...impByIndex.keys()])

  let rowsAdded = 0
  let rowsRemoved = 0
  let rowsChanged = 0

  for (const idx of allIndexes) {
    const pub = pubByIndex.get(idx)
    const imp = impByIndex.get(idx)
    if (!pub && imp) {
      rowsAdded++
      continue
    }
    if (pub && !imp) {
      rowsRemoved++
      continue
    }
    if (!pub || !imp) continue

    const headers = new Set([...Object.keys(pub.cells), ...Object.keys(imp.cells)])
    let rowChanged = false
    for (const field of headers) {
      const before = pub.cells[field] ?? ''
      const after = imp.cells[field] ?? ''
      if (before !== after) {
        rowChanged = true
        if (samples.length < maxSamples) {
          samples.push({
            sheetName: published.sheetName,
            rowIndex: idx,
            fieldName: field,
            before,
            after,
          })
        }
      }
    }
    if (rowChanged) rowsChanged++
  }

  return {
    sheetName: published.sheetName,
    rowsAdded,
    rowsRemoved,
    rowsChanged,
    publishedRowCount: published.rows.length,
    importedRowCount: imported.rows.length,
  }
}

export function diffMasterPlanWorkbooks(
  published: ParsedMasterPlanWorkbook | null,
  imported: ParsedMasterPlanWorkbook,
  maxSamples = 25,
): MasterPlanImportDiff {
  const structure = compareMasterPlanStructure(published, imported)
  const samples: MasterPlanCellChangeSample[] = []
  const sheets: MasterPlanSheetDiff[] = []

  if (published && structure.ok) {
    for (const pubSheet of published.sheets) {
      const impSheet = imported.sheets.find((s) => s.sheetName === pubSheet.sheetName)
      if (!impSheet) continue
      if (pubSheet.sheetKind === 'detail' && impSheet.sheetKind === 'detail') {
        sheets.push(diffDetailSheet(pubSheet, impSheet, maxSamples, samples))
      } else {
        const pubSig = pubSheet.rows.map((r) => rowSignature(pubSheet, r.rowIndex)).sort()
        const impSig = impSheet.rows.map((r) => rowSignature(impSheet, r.rowIndex)).sort()
        const changed = JSON.stringify(pubSig) !== JSON.stringify(impSig)
        sheets.push({
          sheetName: pubSheet.sheetName,
          rowsAdded: 0,
          rowsRemoved: 0,
          rowsChanged: changed ? 1 : 0,
          publishedRowCount: pubSheet.rows.length,
          importedRowCount: impSheet.rows.length,
        })
      }
    }
  }

  return {
    structure,
    sheets,
    totalRowsAdded: sheets.reduce((n, s) => n + s.rowsAdded, 0),
    totalRowsRemoved: sheets.reduce((n, s) => n + s.rowsRemoved, 0),
    totalRowsChanged: sheets.reduce((n, s) => n + s.rowsChanged, 0),
    sampleChanges: samples,
  }
}
