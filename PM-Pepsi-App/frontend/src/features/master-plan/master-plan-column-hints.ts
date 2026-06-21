/** Map Excel column header text → i18n key under `masterPlan.columnHint.*` */
const COLUMN_HINT_RULES: ReadonlyArray<{
  key: string
  test: (normalized: string) => boolean
}> = [
  { key: 'zone', test: (h) => h === 'zone' },
  { key: 'machineList', test: (h) => /machine list/.test(h) },
  { key: 'sapCode', test: (h) => /sap code|maintenance plan|^mant$/.test(h) },
  { key: 'mntplan', test: (h) => /mnt\s*plan|mntplan/.test(h) },
  { key: 'tasklist', test: (h) => /task list/.test(h) },
  { key: 'legacy', test: (h) => h === 'legacy' },
  { key: 'machine', test: (h) => h === 'm/c' || h === 'mc' },
  { key: 'pmlist', test: (h) => /pm list/.test(h) },
  { key: 'freqDay', test: (h) => /freq\s*\(day\)|^frequency$/.test(h) },
  { key: 'days', test: (h) => h === 'days' },
  { key: 'min', test: (h) => h === 'min' },
  { key: 'man', test: (h) => h === 'man' || /man hour/.test(h) },
  { key: 'actCode', test: (h) => /act\s*code/.test(h) },
  { key: 'type', test: (h) => h === 'type' },
  { key: 'craft', test: (h) => h === 'craft' },
  { key: 'wh', test: (h) => h === 'wh' },
  { key: 'equipt', test: (h) => /equipt|equipment/.test(h) },
]

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Returns i18n suffix key (e.g. `zone`) or null when no hint is defined. */
export function resolveMasterPlanColumnHintKey(column: string): string | null {
  const normalized = normalizeHeader(column)
  if (!normalized || /^col\d+$/.test(normalized)) return null
  for (const rule of COLUMN_HINT_RULES) {
    if (rule.test(normalized)) return rule.key
  }
  return null
}
