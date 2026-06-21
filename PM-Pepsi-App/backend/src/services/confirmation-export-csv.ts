import { csvAttachmentBody, escapeCsvCell } from '../lib/csv.js'
import { CONFIRMATION_SAP_HEADERS } from '../lib/confirmation-export-format.js'
import type { ConfirmationExportRow } from './confirmation.js'

/** Column headers aligned with SAP export.xlsx template. */
const SAP_HEADERS = CONFIRMATION_SAP_HEADERS

export function buildConfirmationExportSapCsv(rows: ConfirmationExportRow[]): string {
  const lines: string[] = [SAP_HEADERS.map(escapeCsvCell).join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.no,
        row.confirmation,
        row.wkorder,
        row.opac,
        row.subO,
        row.ca,
        row.split,
        row.wkctr,
        row.timewk,
        row.unitc,
        row.startDateExe,
        row.endDateExe,
        row.startExecute,
        row.endExecute,
      ]
        .map(escapeCsvCell)
        .join(','),
    )
  }
  return csvAttachmentBody(lines)
}

/** `CONFIRM_OUT_YYYYMMDD_HHmmss.csv` — outbound folder naming (doc 15). */
export function confirmationSapCsvFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const h = pad(now.getHours())
  const min = pad(now.getMinutes())
  const s = pad(now.getSeconds())
  return `CONFIRM_OUT_${y}${m}${d}_${h}${min}${s}.csv`
}
