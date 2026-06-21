export type PmMeasurementKind = 'current_3phase' | 'vibration_dst_db' | 'none'

const VIBRATION_RE =
  /vibrat|สั่น|dst|distort|\bdb\b|\blev\b|mm\/s|rms|แกน\s*[xyz]|velocity|acceleration|ความเร็วสั่น/i
/** กระแสไฟฟ้า 3 เฟส R/S/T (A) — เอกสาร WO ลูกค้า · ไม่ใช่แกน X/Y/Z */
const CURRENT_RE =
  /กระแส|ไฟฟ้า|ampere|\bamp\b|\ba\b|เฟส|phase|\br\/s\/t\b|3\s*เฟส|3\s*phase|current|motor\s*current/i

export function inferPmMeasurementKind(input: {
  pmlist?: string | null
  mpoint?: string | null
  ment?: string | null
}): PmMeasurementKind {
  const blob = [input.pmlist, input.mpoint, input.ment]
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join(' ')

  if (!blob) return 'none'
  // กระแส 3 เฟสเป็นความต้องการหลัก PM ZB02 — ตรวจก่อน vibration
  if (CURRENT_RE.test(blob)) return 'current_3phase'
  if (VIBRATION_RE.test(blob)) return 'vibration_dst_db'
  return 'none'
}

export function pmMeasurementMeta(kind: PmMeasurementKind): {
  unit: string
  labels: [string, string, string]
  title: string
  subtitle?: string
} | null {
  if (kind === 'current_3phase') {
    return {
      unit: 'A',
      labels: ['เฟส R (A)', 'เฟส S (A)', 'เฟส T (A)'],
      title: 'กระแสไฟฟ้า 3 เฟส',
      subtitle: 'แนวโน้มค่ากระแสไฟฟ้าแต่ละเฟสตามเวลา (หน่วย Ampere)',
    }
  }
  if (kind === 'vibration_dst_db') {
    return {
      unit: '',
      labels: ['Dst (Distortion)', 'dB', ''],
      title: 'Vibration — Dst / dB',
      subtitle: 'Distortion (Dst) และ dB ตามเวลา',
    }
  }
  return null
}
