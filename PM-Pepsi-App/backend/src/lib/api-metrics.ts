/** In-memory request duration samples per normalized route (API process only). */

const MAX_SAMPLES_PER_ROUTE = 400

const samples = new Map<string, number[]>()

export function normalizeApiRoute(path: string): string {
  const base = path.split('?')[0] ?? path
  return base
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
      '/:id',
    )
    .replace(/\/\d+(?=\/|$)/g, '/:id')
}

export function recordApiDuration(path: string, durationMs: number): void {
  if (!path.startsWith('/api/v1')) return
  const key = normalizeApiRoute(path)
  let list = samples.get(key)
  if (!list) {
    list = []
    samples.set(key, list)
  }
  list.push(durationMs)
  if (list.length > MAX_SAMPLES_PER_ROUTE) {
    list.splice(0, list.length - MAX_SAMPLES_PER_ROUTE)
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)] ?? 0
}

export type SlowApiRow = {
  route: string
  count: number
  p50Ms: number
  p95Ms: number
  maxMs: number
}

export function getSlowApiMetrics(opts?: {
  p95ThresholdMs?: number
  limit?: number
}): SlowApiRow[] {
  const threshold = opts?.p95ThresholdMs ?? 1000
  const limit = opts?.limit ?? 20
  const rows: SlowApiRow[] = []

  for (const [route, durations] of samples) {
    if (durations.length === 0) continue
    const sorted = [...durations].sort((a, b) => a - b)
    const p95Ms = Math.round(percentile(sorted, 95))
    if (p95Ms < threshold) continue
    rows.push({
      route,
      count: sorted.length,
      p50Ms: Math.round(percentile(sorted, 50)),
      p95Ms,
      maxMs: Math.round(sorted[sorted.length - 1] ?? 0),
    })
  }

  return rows.sort((a, b) => b.p95Ms - a.p95Ms).slice(0, limit)
}

/** Reset samples (tests only). */
export function clearApiMetrics(): void {
  samples.clear()
}
