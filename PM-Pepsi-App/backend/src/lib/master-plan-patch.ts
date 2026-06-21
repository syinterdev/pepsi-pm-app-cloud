export type MasterPlanCellChange = {
  fieldName: string
  before: string
  after: string
}

export type MasterPlanPatchValidation =
  | { ok: true; changes: MasterPlanCellChange[] }
  | { ok: false; code: string; message: string }

const READ_ONLY_SHEET_KINDS = new Set(['summary', 'legend', 'reference'])

export function isMasterPlanSheetEditable(sheetKind: string): boolean {
  return !READ_ONLY_SHEET_KINDS.has(sheetKind)
}

/** Allowed cell keys for PATCH — column headers on detail sheets; existing colN on generic. */
export function allowedMasterPlanColumnKeys(
  sheetKind: string,
  columnHeaders: string[],
  currentCells: Record<string, string>,
): Set<string> {
  const headers = columnHeaders.map((h) => h.trim()).filter(Boolean)
  if (headers.length > 0) return new Set(headers)
  if (sheetKind !== 'detail') {
    return new Set(Object.keys(currentCells).filter((k) => /^col\d+$/.test(k)))
  }
  return new Set()
}

export function validateMasterPlanCellPatch(
  sheetKind: string,
  columnHeaders: string[],
  currentCells: Record<string, string>,
  patchCells: Record<string, string>,
): MasterPlanPatchValidation {
  if (!isMasterPlanSheetEditable(sheetKind)) {
    return {
      ok: false,
      code: 'SHEET_READ_ONLY',
      message: 'This sheet is read-only',
    }
  }

  const allowed = allowedMasterPlanColumnKeys(sheetKind, columnHeaders, currentCells)
  if (allowed.size === 0) {
    return {
      ok: false,
      code: 'NO_EDITABLE_COLUMNS',
      message: 'Sheet has no editable column schema',
    }
  }

  const entries = Object.entries(patchCells)
  if (entries.length === 0) {
    return { ok: false, code: 'EMPTY_PATCH', message: 'No cells to update' }
  }

  const changes: MasterPlanCellChange[] = []

  for (const [fieldName, afterRaw] of entries) {
    if (!allowed.has(fieldName)) {
      return {
        ok: false,
        code: 'INVALID_FIELD',
        message: `Column not allowed on this sheet: ${fieldName}`,
      }
    }
    if (typeof afterRaw !== 'string') {
      return {
        ok: false,
        code: 'INVALID_VALUE',
        message: `Value for ${fieldName} must be a string`,
      }
    }
    const before = currentCells[fieldName] ?? ''
    const after = afterRaw
    if (before !== after) {
      changes.push({ fieldName, before, after })
    }
  }

  return { ok: true, changes }
}
