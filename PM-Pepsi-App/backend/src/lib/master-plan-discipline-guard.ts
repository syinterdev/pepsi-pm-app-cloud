import {
  MASTER_PLAN_FILES,
  inferDisciplineFromFilename,
  type MasterPlanDiscipline,
  type ParsedMasterPlanWorkbook,
} from './master-plan-parse.js'

export type MasterPlanImportSpec = {
  discipline: MasterPlanDiscipline
  /** Customer reference name — may change; not required for import. */
  referenceFilename: string
  labelEn: string
  labelTh: string
  sampleSheetNames: string[]
}

export const MASTER_PLAN_IMPORT_SPECS: MasterPlanImportSpec[] = [
  {
    discipline: 'EE',
    referenceFilename: MASTER_PLAN_FILES.EE,
    labelEn: 'Electrical (EE)',
    labelTh: 'ไฟฟ้า (EE)',
    sampleSheetNames: ['SCHAAF#1', 'BCP', 'Frypack', 'STAX', 'Total Master plan'],
  },
  {
    discipline: 'ME',
    referenceFilename: MASTER_PLAN_FILES.ME,
    labelEn: 'Mechanics (ME)',
    labelTh: 'เครื่องกล (ME)',
    sampleSheetNames: ['Schaaf#1', 'BCP', 'Stax', 'Frypack', 'Total Master plan'],
  },
  {
    discipline: 'PK',
    referenceFilename: MASTER_PLAN_FILES.PK,
    labelEn: 'Packing (PK)',
    labelTh: 'Packing (PK)',
    sampleSheetNames: ['PK1', 'PK2', 'PACKING HALL', 'Total master plan'],
  },
]

export type MasterPlanWorkbookFamily = 'PK' | 'PROCESS'

function scoreSheetNames(names: readonly string[]): Record<MasterPlanDiscipline, number> {
  const scores: Record<MasterPlanDiscipline, number> = { EE: 0, ME: 0, PK: 0 }
  for (const raw of names) {
    const n = raw.trim().toLowerCase()
    if (/^pk\d(\s|\(|$)|^packing hall|^case zone|^exp$/.test(n)) scores.PK += 3
    if (/transfer conv\.pk/i.test(n)) scores.PK += 1
    if (/schaaf|frypack|^bcp$|^fcp$|pellet|pc50mz|pc14|rbs|stax canister/.test(n)) scores.EE += 3
    if (/^stax$/.test(n)) scores.EE += 2
    if (/^ahu|^boiler|^chiller|^compressor|^cooling tower|^steam/.test(n)) scores.ME += 3
  }
  return scores
}

function isProcessDiscipline(d: MasterPlanDiscipline): boolean {
  return d === 'EE' || d === 'ME'
}

/** PK vs process-line (EE/ME) — the only reliable content split for this customer. */
export function inferWorkbookFamilyFromSheetNames(
  sheetNames: readonly string[],
): MasterPlanWorkbookFamily | null {
  const scores = scoreSheetNames(sheetNames)
  if (scores.PK >= 4 && scores.PK > scores.EE && scores.PK > scores.ME) {
    return 'PK'
  }
  const processScore = Math.max(scores.EE, scores.ME)
  if (processScore >= 4 && processScore > scores.PK) {
    return 'PROCESS'
  }
  return null
}

/** Detect discipline from sheet tab names (PK vs process hints). */
export function inferDisciplineFromSheetNames(sheetNames: readonly string[]): MasterPlanDiscipline | null {
  const family = inferWorkbookFamilyFromSheetNames(sheetNames)
  if (family === 'PK') return 'PK'
  if (family === 'PROCESS') return 'EE'
  return null
}

export type MasterPlanImportWarning = {
  code: 'FILENAME_HINT_MISMATCH' | 'FILENAME_UNKNOWN'
  message: string
  detectedDiscipline?: MasterPlanDiscipline
}

export type MasterPlanImportValidation =
  | { ok: true; warnings: MasterPlanImportWarning[] }
  | {
      ok: false
      code: 'DISCIPLINE_MISMATCH'
      message: string
      detectedDiscipline?: MasterPlanDiscipline
      expectedDiscipline: MasterPlanDiscipline
    }

export function validateMasterPlanImport(
  expectedDiscipline: MasterPlanDiscipline,
  sourceFilename: string,
  sheetNames: readonly string[],
): MasterPlanImportValidation {
  const fromFilename = inferDisciplineFromFilename(sourceFilename)
  const family = inferWorkbookFamilyFromSheetNames(sheetNames)
  const warnings: MasterPlanImportWarning[] = []

  if (isProcessDiscipline(expectedDiscipline) && family === 'PK') {
    return {
      ok: false,
      code: 'DISCIPLINE_MISMATCH',
      expectedDiscipline,
      detectedDiscipline: 'PK',
      message:
        `ไฟล์ "${sourceFilename}" เป็นของ Packing (PK) — นำเข้าที่แท็บ PK เท่านั้น`,
    }
  }

  if (expectedDiscipline === 'PK' && family === 'PROCESS') {
    return {
      ok: false,
      code: 'DISCIPLINE_MISMATCH',
      expectedDiscipline,
      detectedDiscipline: 'EE',
      message:
        `ไฟล์ "${sourceFilename}" เป็น Process (EE/ME) — นำเข้าที่แท็บ Electrical หรือ Mechanics`,
    }
  }

  if (isProcessDiscipline(expectedDiscipline) && fromFilename === 'PK') {
    return {
      ok: false,
      code: 'DISCIPLINE_MISMATCH',
      expectedDiscipline,
      detectedDiscipline: 'PK',
      message:
        `ชื่อไฟล์ "${sourceFilename}" บ่งชี้ Packing (PK) — นำเข้าที่แท็บ PK เท่านั้น`,
    }
  }

  if (expectedDiscipline === 'PK' && fromFilename && isProcessDiscipline(fromFilename)) {
    return {
      ok: false,
      code: 'DISCIPLINE_MISMATCH',
      expectedDiscipline,
      detectedDiscipline: fromFilename,
      message:
        `ชื่อไฟล์ "${sourceFilename}" บ่งชี้ ${fromFilename} — นำเข้าที่แท็บ ${fromFilename} เท่านั้น`,
    }
  }

  if (fromFilename && fromFilename !== expectedDiscipline) {
    warnings.push({
      code: 'FILENAME_HINT_MISMATCH',
      detectedDiscipline: fromFilename,
      message:
        `ชื่อไฟล์บ่งชี้ ${fromFilename} แต่กำลังนำเข้าที่แท็บ ${expectedDiscipline} — ` +
        `ข้อมูลจะถูกบันทึกใน ${expectedDiscipline} ตามแท็บที่เลือก`,
    })
  }

  if (!fromFilename) {
    warnings.push({
      code: 'FILENAME_UNKNOWN',
      message:
        `ไม่รู้จักรูปแบบชื่อไฟล์ — ข้อมูลจะถูกบันทึกใน ${expectedDiscipline} ตามแท็บที่เลือก`,
    })
  }

  return { ok: true, warnings }
}

export function validateParsedMasterPlanImport(
  expectedDiscipline: MasterPlanDiscipline,
  parsed: ParsedMasterPlanWorkbook,
): MasterPlanImportValidation {
  return validateMasterPlanImport(
    expectedDiscipline,
    parsed.sourceFilename,
    parsed.sheets.map((s) => s.sheetName),
  )
}
