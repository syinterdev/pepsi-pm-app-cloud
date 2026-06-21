/** ดึงฟิลด์ Line / WO / ทรัพยากร / เวลา / รายละเอียดงาน จาก audit JSON */
const LINE_KEYS = ['productline', 'productLine', 'line', 'product_line', 'lineday', 'functionalloc'] as const
const WO_KEYS = ['wkorder', 'workOrder', 'order'] as const
const RESOURCE_KEYS = ['wkctr', 'code', 'wkctrgroup', 'idwkctr', 'team'] as const
const JOB_KEYS = ['operationshorttext', 'shortText', 'equdescrip', 'note', 'description'] as const
const START_DATE_KEYS = ['startD', 'startDate', 'stdate', 'bscstart'] as const
const START_TIME_KEYS = ['startT', 'startTime', 'startExecute'] as const
const END_DATE_KEYS = ['endD', 'endDate', 'endate', 'actfinish'] as const
const END_TIME_KEYS = ['endT', 'endTime', 'endExecute'] as const

const RESOURCE_TABLE_LABELS: Record<string, string> = {
  tbiw37n: 'WO',
  tbcofirm: 'Confirm',
  tbwrkclose: 'เวลาช่าง',
  tbconfirm_image: 'รูป Confirm',
  tbconfirm_comment: 'ความคิดเห็น',
  tbplangingwork: 'แผนงาน',
  tbwo_pm_note_entry: 'PM comment',
  tbwo_pm_note: 'PM note (legacy)',
  tbwo_pm_reading: 'ค่าวัด PM',
  tbworkcenter_userlog: 'Login',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function pickString(obj: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return null
}

function pickFromPayload(
  before: unknown,
  after: unknown,
  keys: readonly string[],
): string | null {
  for (const raw of [after, before]) {
    const obj = asRecord(raw)
    if (!obj) continue
    const value = pickString(obj, keys)
    if (value) return value
  }
  return null
}

export function extractLineFromPayload(before: unknown, after: unknown): string | null {
  return pickFromPayload(before, after, LINE_KEYS)
}

export function extractWorkOrderFromPayload(before: unknown, after: unknown): string | null {
  return pickFromPayload(before, after, WO_KEYS)
}

export function extractResourceFromPayload(before: unknown, after: unknown): string | null {
  return pickFromPayload(before, after, RESOURCE_KEYS)
}

export function extractJobDetailFromPayload(before: unknown, after: unknown): string | null {
  return pickFromPayload(before, after, JOB_KEYS)
}

export function formatActivityDateTime(
  datePart: string | null | undefined,
  timePart: string | null | undefined,
): string | null {
  const d = datePart?.trim()
  if (!d) return null
  const t = timePart?.trim()
  return t ? `${d} ${t}` : d
}

export function extractTimeRangeFromPayload(
  before: unknown,
  after: unknown,
): { startedAt: string | null; endedAt: string | null } {
  for (const raw of [after, before]) {
    const obj = asRecord(raw)
    if (!obj) continue
    const startD = pickString(obj, START_DATE_KEYS)
    const startT = pickString(obj, START_TIME_KEYS)
    const endD = pickString(obj, END_DATE_KEYS)
    const endT = pickString(obj, END_TIME_KEYS)
    if (startD || endD) {
      return {
        startedAt: formatActivityDateTime(startD, startT),
        endedAt: formatActivityDateTime(endD, endT),
      }
    }
  }
  return { startedAt: null, endedAt: null }
}

export function formatActivityResourceLabel(
  resource: string | null | undefined,
  resourceId: string | null | undefined,
  payloadResource: string | null | undefined,
  woWkctr: string | null | undefined,
): string | null {
  const fromPayload = payloadResource?.trim() || woWkctr?.trim()
  if (fromPayload) return fromPayload
  const table = resource?.trim()
  const id = resourceId?.trim()
  if (table && id) {
    const label = RESOURCE_TABLE_LABELS[table] ?? table
    return `${label} · ${id}`
  }
  if (table) return RESOURCE_TABLE_LABELS[table] ?? table
  return id || null
}

/** ป้าย action สั้นภาษาไทยสำหรับตาราง activity */
export function activityActionLabel(action: string): string {
  const map: Record<string, string> = {
    'auth.login': 'เข้าสู่ระบบ',
    'auth.logout': 'ออกจากระบบ',
    'iw37n.import': 'นำเข้า IW37N',
    'confirmation.import': 'นำเข้า Confirm',
    'confirmation.close': 'ปิดงาน Confirm',
    'confirmation.mass_close': 'ปิดงานหลายใบ',
    'work-orders.team.batch': 'ตั้งทีมหลาย WO',
    'planning.assign': 'จ่ายงานช่าง',
    'planning.write': 'ย้ายวันแผน',
    'integration.iw37n.in': 'Integration IW37N',
    'integration.confirm.in': 'Integration Confirm IN',
  }
  if (map[action]) return map[action]
  if (action.startsWith('confirmation.qc')) return 'QC รับรองงาน'
  if (action.startsWith('planning.')) return 'แผนงาน'
  if (action.startsWith('work-orders.')) return 'ใบงาน'
  return action
}
