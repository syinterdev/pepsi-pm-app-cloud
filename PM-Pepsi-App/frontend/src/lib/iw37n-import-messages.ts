import type { Iw37nBatchItem, Iw37nImportSummary } from '@/api/schemas'

/** ข้อความไทยเมื่อ SHA256 ตรงกับ batch ที่นำเข้าแล้ว */
export function formatIw37nDuplicateMessage(duplicateOfBatchId: string | null): string {
  const ref = duplicateOfBatchId ? ` · อ้างอิง batch #${duplicateOfBatchId}` : ''
  return `ไฟล์ซ้ำ (SHA256 เดิม) — จะไม่ upsert ลง IW37N${ref}`
}

export function isIw37nDuplicateSummary(summary: Pick<Iw37nImportSummary, 'isDuplicate'>): boolean {
  return Boolean(summary.isDuplicate)
}

export function isIw37nDuplicateBatch(batch: Pick<Iw37nBatchItem, 'isDuplicate'>): boolean {
  return Boolean(batch.isDuplicate)
}
