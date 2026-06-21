/**
 * API stress test — hot paths สำหรับ UAT / pre-prod
 *
 * Usage:
 *   npx tsx scripts/stress-api.ts
 *   STRESS_CONCURRENCY=20 STRESS_DURATION_SEC=45 npx tsx scripts/stress-api.ts
 *
 * Env: STRESS_BASE_URL, STRESS_USER, STRESS_PASSWORD, STRESS_CONCURRENCY, STRESS_DURATION_SEC
 */
import 'dotenv/config'

const BASE = (process.env.STRESS_BASE_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '')
const USER = process.env.STRESS_USER ?? 'ADMIN01'
const PASS = process.env.STRESS_PASSWORD ?? 'admin'
const CONCURRENCY = Math.max(1, Number(process.env.STRESS_CONCURRENCY ?? 15) || 15)
const DURATION_SEC = Math.max(5, Number(process.env.STRESS_DURATION_SEC ?? 30) || 30)

type Scenario = {
  name: string
  weight: number
  run: (token: string) => Promise<Response>
}

type Sample = { name: string; ms: number; ok: boolean; status: number }

function now() {
  return performance.now()
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]!
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS, mode: 'workcenter' }),
  })
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${await res.text()}`)
  }
  const body = (await res.json()) as { token?: string }
  if (!body.token) throw new Error('Login response missing token')
  return body.token
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' }
}

function calendarBody() {
  const d = new Date()
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    activity: [],
    wktype: [],
    status: [],
    displayStatus: [],
    pmPhase: [],
    wkctr: [],
    team: [],
    functionalloc: [],
    equipment: [],
    priority: [],
  }
}

function buildScenarios(token: string): Scenario[] {
  const h = authHeaders(token)
  return [
    {
      name: 'health',
      weight: 1,
      run: () => fetch(`${BASE}/api/v1/health`, { headers: h }),
    },
    {
      name: 'calendar/events',
      weight: 4,
      run: () =>
        fetch(`${BASE}/api/v1/calendar/events`, {
          method: 'POST',
          headers: { ...h, 'Content-Type': 'application/json' },
          body: JSON.stringify(calendarBody()),
        }),
    },
    {
      name: 'work-orders',
      weight: 3,
      run: () => fetch(`${BASE}/api/v1/work-orders?limit=100`, { headers: h }),
    },
    {
      name: 'planning/orders',
      weight: 2,
      run: () => fetch(`${BASE}/api/v1/planning/orders?status=open`, { headers: h }),
    },
    {
      name: 'reports/kpi',
      weight: 2,
      run: () => fetch(`${BASE}/api/v1/reports/kpi?weeksBack=8`, { headers: h }),
    },
    {
      name: 'plan-calendar/events',
      weight: 2,
      run: () => {
        const d = new Date()
        return fetch(
          `${BASE}/api/v1/plan-calendar/events?year=${d.getFullYear()}&month=${d.getMonth() + 1}`,
          { headers: h },
        )
      },
    },
  ]
}

function pickScenario(scenarios: Scenario[]): Scenario {
  const total = scenarios.reduce((s, x) => s + x.weight, 0)
  let r = Math.random() * total
  for (const s of scenarios) {
    r -= s.weight
    if (r <= 0) return s
  }
  return scenarios[scenarios.length - 1]!
}

async function main() {
  console.log(`Stress API — ${BASE}`)
  console.log(`Concurrency: ${CONCURRENCY} · Duration: ${DURATION_SEC}s · User: ${USER}`)

  const token = await login()
  const scenarios = buildScenarios(token)
  const samples: Sample[] = []
  const endAt = Date.now() + DURATION_SEC * 1000
  let inFlight = 0
  let done = false

  async function oneRequest() {
    const scenario = pickScenario(scenarios)
    const t0 = now()
    let ok = false
    let status = 0
    try {
      const res = await scenario.run(token)
      status = res.status
      ok = res.ok
      await res.arrayBuffer().catch(() => null)
    } catch {
      ok = false
      status = 0
    }
    samples.push({ name: scenario.name, ms: now() - t0, ok, status })
  }

  async function worker() {
    while (!done) {
      if (Date.now() >= endAt) break
      inFlight += 1
      try {
        await oneRequest()
      } finally {
        inFlight -= 1
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await Promise.all(workers)
  done = true
  while (inFlight > 0) await new Promise((r) => setTimeout(r, 20))

  const total = samples.length
  const errors = samples.filter((s) => !s.ok)
  const allMs = samples.map((s) => s.ms).sort((a, b) => a - b)
  const rps = total / DURATION_SEC

  console.log('\n--- Summary ---')
  console.log(`Requests: ${total} · RPS: ${rps.toFixed(1)} · Errors: ${errors.length} (${((errors.length / Math.max(1, total)) * 100).toFixed(1)}%)`)
  console.log(
    `Latency ms — p50: ${percentile(allMs, 50).toFixed(0)} · p95: ${percentile(allMs, 95).toFixed(0)} · p99: ${percentile(allMs, 99).toFixed(0)} · max: ${(allMs[allMs.length - 1] ?? 0).toFixed(0)}`,
  )

  const byName = new Map<string, Sample[]>()
  for (const s of samples) {
    const arr = byName.get(s.name) ?? []
    arr.push(s)
    byName.set(s.name, arr)
  }

  console.log('\n--- By endpoint ---')
  for (const [name, rows] of [...byName.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const ms = rows.map((r) => r.ms).sort((a, b) => a - b)
    const err = rows.filter((r) => !r.ok).length
    const statuses = [...new Set(rows.filter((r) => !r.ok).map((r) => r.status))].join(',') || '—'
    console.log(
      `${name.padEnd(22)} n=${String(rows.length).padStart(4)} · err=${err} · p95=${percentile(ms, 95).toFixed(0)}ms · statuses=${statuses}`,
    )
  }

  if (errors.length > 0) {
    console.log('\n--- Sample failures (up to 5) ---')
    for (const e of errors.slice(0, 5)) {
      console.log(`  ${e.name} status=${e.status} ${e.ms.toFixed(0)}ms`)
    }
    process.exit(1)
  }

  console.log('\nPASS — no HTTP errors under load')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
