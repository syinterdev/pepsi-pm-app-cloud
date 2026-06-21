import type { MasterPlanDiscipline } from '@/lib/master-plan-api'

/** Customer reference filenames — names may change over time. */
export const MASTER_PLAN_REFERENCE_FILES: Record<MasterPlanDiscipline, string> = {
  EE: '01-MASTER PM PROCESS EE 2026.xlsx',
  ME: '02-MASTER PM PROCESS ME 2026.xlsx',
  PK: '03-MASTER PM PACKING 2026.xlsx',
}

/** @deprecated use MASTER_PLAN_REFERENCE_FILES */
export const MASTER_PLAN_EXPECTED_FILES = MASTER_PLAN_REFERENCE_FILES

function isProcessDiscipline(d: MasterPlanDiscipline): boolean {
  return d === 'EE' || d === 'ME'
}

/** Soft hint from filename — not authoritative; customer may rename files. */
export function inferMasterPlanDisciplineFromFilename(
  filename: string,
): MasterPlanDiscipline | null {
  const n = filename.trim().toLowerCase().replace(/\\/g, '/')
  const base = n.includes('/') ? (n.split('/').pop() ?? n) : n
  if (/packing|master pm packing|\bpk\b|^03-/.test(base)) return 'PK'
  if (/process me|master pm process me|\bme\b|^02-/.test(base)) return 'ME'
  if (/process ee|master pm process ee|\bee\b|^01-/.test(base)) return 'EE'
  return null
}

export type MasterPlanImportWarningCode = 'FILENAME_HINT_MISMATCH' | 'FILENAME_UNKNOWN'

export type MasterPlanFileCheck =
  | {
      ok: true
      blocked: false
      warnings: MasterPlanImportWarningCode[]
      detectedHint?: MasterPlanDiscipline
    }
  | {
      ok: false
      blocked: true
      reason: 'packingOnProcess' | 'processOnPacking'
      detected?: MasterPlanDiscipline
    }

/**
 * Pre-upload check (filename only). Tab discipline is authoritative;
 * only block unmistakable PK ↔ Process (EE/ME) cross-uploads.
 */
export function assessMasterPlanFileForDiscipline(
  file: File,
  expectedDiscipline: MasterPlanDiscipline,
): MasterPlanFileCheck {
  const detected = inferMasterPlanDisciplineFromFilename(file.name)

  if (isProcessDiscipline(expectedDiscipline) && detected === 'PK') {
    return { ok: false, blocked: true, reason: 'packingOnProcess', detected: 'PK' }
  }

  if (expectedDiscipline === 'PK' && detected && isProcessDiscipline(detected)) {
    return { ok: false, blocked: true, reason: 'processOnPacking', detected }
  }

  const warnings: MasterPlanImportWarningCode[] = []
  if (detected && detected !== expectedDiscipline) {
    warnings.push('FILENAME_HINT_MISMATCH')
  }
  if (!detected) {
    warnings.push('FILENAME_UNKNOWN')
  }

  return {
    ok: true,
    blocked: false,
    warnings,
    detectedHint: detected && detected !== expectedDiscipline ? detected : undefined,
  }
}

/** @deprecated use assessMasterPlanFileForDiscipline */
export function checkMasterPlanFileForDiscipline(
  file: File,
  expectedDiscipline: MasterPlanDiscipline,
): { ok: boolean; messageKey?: 'wrongDiscipline' | 'unknownFile'; detected?: MasterPlanDiscipline } {
  const result = assessMasterPlanFileForDiscipline(file, expectedDiscipline)
  if (!result.ok) {
    return { ok: false, messageKey: 'wrongDiscipline', detected: result.detected }
  }
  if (result.warnings.includes('FILENAME_UNKNOWN')) {
    return { ok: false, messageKey: 'unknownFile' }
  }
  if (result.warnings.includes('FILENAME_HINT_MISMATCH')) {
    return { ok: false, messageKey: 'wrongDiscipline', detected: result.detectedHint }
  }
  return { ok: true }
}
