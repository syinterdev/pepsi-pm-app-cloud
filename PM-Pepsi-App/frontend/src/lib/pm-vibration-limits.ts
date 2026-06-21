/** Optional dB thresholds for vibration (Dst/dB) — stored on each reading row. */

export function parseOptionalDbLimit(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function resolveVibrationDbLimits(
  formWarning: string,
  formAlarm: string,
  saved: { warningLimit?: number | null; alarmLimit?: number | null } | undefined,
): { warning: number | null; alarm: number | null } {
  if (formWarning.trim() || formAlarm.trim()) {
    return {
      warning: parseOptionalDbLimit(formWarning),
      alarm: parseOptionalDbLimit(formAlarm),
    }
  }
  return {
    warning: saved?.warningLimit ?? null,
    alarm: saved?.alarmLimit ?? null,
  }
}

export function limitsFromLastReading(
  readings: { warningLimit?: number | null; alarmLimit?: number | null }[],
): { warning: string; alarm: string } {
  const last = readings[readings.length - 1]
  return {
    warning: last?.warningLimit != null ? String(last.warningLimit) : '',
    alarm: last?.alarmLimit != null ? String(last.alarmLimit) : '',
  }
}
