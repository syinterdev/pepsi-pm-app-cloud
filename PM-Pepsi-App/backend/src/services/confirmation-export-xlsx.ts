import * as XLSX from 'xlsx'
import {
  buildConfirmationExportAoa,
  CONFIRMATION_EXPORT_SHEET_NAME,
  type ConfirmationExportRowCore,
} from '../lib/confirmation-export-format.js'

export function buildConfirmationExportXlsxBuffer(rows: ConfirmationExportRowCore[]): Buffer {
  const data = buildConfirmationExportAoa(rows)
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  for (const col of Array.from({ length: 14 }, (_, i) => i)) {
    ws['!cols'] = ws['!cols'] ?? []
    ws['!cols'][col] = { wch: Math.max(10, String(data[0]?.[col] ?? '').length + 2) }
  }
  XLSX.utils.book_append_sheet(wb, ws, CONFIRMATION_EXPORT_SHEET_NAME)
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
}
