import type { MasterPlanChangeItem } from '@/lib/master-plan-api'

export function formatMasterPlanChangeValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return String((value as { value: unknown }).value ?? '')
  }
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function exportMasterPlanChangesCsv(
  items: MasterPlanChangeItem[],
  filename = 'master-plan-changelog.csv',
): void {
  const header = [
    'changedAt',
    'sheet',
    'rowIndex',
    'rowId',
    'field',
    'before',
    'after',
    'changedBy',
    'comment',
  ]
  const lines = items.map((item) =>
    [
      item.changedAt,
      item.sheetName ?? '',
      item.rowIndex ?? '',
      item.rowId,
      item.fieldName ?? '',
      formatMasterPlanChangeValue(item.before),
      formatMasterPlanChangeValue(item.after),
      item.changedBy,
      item.comment ?? '',
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(','),
  )
  const csv = [header.join(','), ...lines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
