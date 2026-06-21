/**
 * `/worktime` — สอง flow แยกกัน:
 * - Summary Over all → รายงานสรุปแนว report ลูกค้า
 */
import { CanPermission } from '@/components/auth/CanPermission'
import { hintsFromT } from '@/lib/i18n-hints'
import { AppCard } from '@/components/layout/AppCard'
import { AppPageSection, AppPageSectionCard, AppPageShell } from '@/components/layout/AppPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAuthToken, getStoredAuthUser } from '@/features/auth/login-api'
import { fetchEngUtilizationDaily, fetchWorktimeSummaryOverall } from '@/lib/api-public'
import { personnelImageUrl } from '@/lib/api-public'
import { defaultHrConfirmMonth, pepsiWeekSelectOptions } from '@/lib/manhour-hr-confirm-period'
import { useAnyPermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import type { ChartData } from 'chart.js'
import { WorktimePmCompletionPanel } from '@/features/manhours/WorktimePmCompletionPanel'
import { AlertCircle, Link as LinkIcon, RefreshCcw, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, Doughnut } from 'react-chartjs-2'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
)

function QueryErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const { t } = useTranslation('manhours')
  const { t: tc } = useTranslation('common')
  return (
    <EmptyState
      icon={AlertCircle}
      title={t('worktime.loadFailed')}
      description={message}
      action={{ label: tc('actions.retry'), onClick: onRetry }}
    />
  )
}

// (removed) WorktimePlanningTab / WorktimeManhoursTab

function SummaryOverallTab() {
  const { t } = useTranslation('manhours')
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [month, setMonth] = useState(defaultHrConfirmMonth())
  const [week, setWeek] = useState(pepsiWeekSelectOptions(1)[0]?.value ?? '')

  const yearOptions = useMemo(() => {
    const out: number[] = []
    for (let y = thisYear + 1; y >= thisYear - 6; y -= 1) out.push(y)
    return out
  }, [thisYear])

  const weekOptions = useMemo(() => pepsiWeekSelectOptions(30), [])
  const q = useQuery({
    queryKey: ['worktime', 'summary-overall', year, month, week],
    queryFn: () =>
      fetchWorktimeSummaryOverall({
        year,
        month: Number(month.slice(5, 7)),
        week,
      }),
    placeholderData: keepPreviousData,
  })

  if (q.isLoading && !q.data) return <Skeleton className="h-80 w-full rounded-card" />
  if (q.isError) {
    return <QueryErrorState message={(q.error as Error).message} onRetry={() => void q.refetch()} />
  }
  if (!q.data) return null

  const hoursYear = q.data.hoursYear
  const zb01 = q.data.zb.find((z) => z.wktype === 'ZB01')
  const zb02 = q.data.zb.find((z) => z.wktype === 'ZB02')
  const zb05 = q.data.zb.find((z) => z.wktype === 'ZB05')

  const donut = (pct: number, color: string) => ({
    labels: [t('worktime.donutDone'), t('worktime.donutRemaining')],
    datasets: [
      {
        data: [pct, Math.max(0, 100 - pct)],
        backgroundColor: [color, 'rgba(228,228,231,0.9)'],
        borderWidth: 0,
      },
    ],
  })

  return (
    <div className="space-y-4">
      <WorktimePmCompletionPanel
        data={q.data}
        year={year}
        month={month}
        week={week}
        yearOptions={yearOptions}
        weekOptions={weekOptions}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onWeekChange={setWeek}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <AppCard pad="compact" className="shadow-[var(--app-shadow-card)]">
          <p className="text-xs text-app-muted">{t('worktime.hoursYearConfirm')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-app">
            {hoursYear.confirmHours.toFixed(1)}
          </p>
        </AppCard>
        <AppCard pad="compact" className="shadow-[var(--app-shadow-card)]">
          <p className="text-xs text-app-muted">{t('worktime.hoursYearHr')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-app">
            {hoursYear.hrHours.toFixed(1)}
          </p>
        </AppCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <AppCard
          pad="compact"
          className="bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_16%,var(--app-surface))] shadow-[var(--app-shadow-card)]"
        >
          <p className="text-xs text-app-muted">{t('worktime.z1Done')}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="size-16">
              <Doughnut
                data={donut(zb01?.percentCompleted ?? 0, 'rgba(34,197,94,0.9)')}
                options={{ plugins: { legend: { display: false } }, cutout: '70%' }}
              />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {(zb01?.percentCompleted ?? 0).toFixed(1)}%
              </p>
              <p className="text-xs text-app-muted tabular-nums">
                {zb01?.completed ?? 0}/{zb01?.planned ?? 0}
              </p>
            </div>
          </div>
        </AppCard>

        <AppCard
          pad="compact"
          className="bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_16%,var(--app-surface))] shadow-[var(--app-shadow-card)]"
        >
          <p className="text-xs text-app-muted">{t('worktime.z2z5Done')}</p>
          <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-3">
            <div className="size-16">
              <Doughnut
                data={donut(zb02?.percentCompleted ?? 0, 'rgba(59,130,246,0.9)')}
                options={{ plugins: { legend: { display: false } }, cutout: '70%' }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold tabular-nums">
                Z2 {(zb02?.percentCompleted ?? 0).toFixed(1)}%{' '}
                <span className="font-normal text-app-muted">
                  ({zb02?.completed ?? 0}/{zb02?.planned ?? 0})
                </span>
              </p>
              <p className="text-sm font-semibold tabular-nums">
                Z5 {(zb05?.percentCompleted ?? 0).toFixed(1)}%{' '}
                <span className="font-normal text-app-muted">
                  ({zb05?.completed ?? 0}/{zb05?.planned ?? 0})
                </span>
              </p>
            </div>
          </div>
        </AppCard>

        <AppCard
          pad="compact"
          className="bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_16%,var(--app-surface))] shadow-[var(--app-shadow-card)]"
        >
          <p className="text-xs text-app-muted">{t('worktime.z2Done')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-app">
            {(zb02?.percentCompleted ?? 0).toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-app-muted tabular-nums">
            {zb02?.completed ?? 0}/{zb02?.planned ?? 0}
          </p>
        </AppCard>
      </div>

      <AppCard
        pad="compact"
        className="bg-gradient-to-b from-[var(--app-surface)] to-[color-mix(in_srgb,var(--app-bg)_16%,var(--app-surface))] shadow-[var(--app-shadow-card)]"
      >
        <EngUtilizationDailyChart />
      </AppCard>
    </div>
  )
}

function EngUtilizationDailyChart() {
  const { t } = useTranslation('manhours')
  const thisYear = new Date().getFullYear()
  const todayIso = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  const [day, setDay] = useState(todayIso)
  const [month, setMonth] = useState(defaultHrConfirmMonth())
  const [week, setWeek] = useState(pepsiWeekSelectOptions(1)[0]?.value ?? '')
  const [year, setYear] = useState(thisYear)

  const weekOptions = useMemo(() => pepsiWeekSelectOptions(30), [])

  const q = useQuery({
    queryKey: ['worktime', 'eng-utilization', 'summary', period, day, week, month, year],
    queryFn: () =>
      fetchEngUtilizationDaily({
        period,
        week,
        month,
        year,
        ...(period === 'daily' ? { from: day, to: day } : {}),
      }),
    placeholderData: keepPreviousData,
  })

  const imgCacheRef = useRef(new Map<string, HTMLImageElement>())
  const [, bumpImgReady] = useState(0)

  const rows = q.data?.rows ?? []
  const labels = rows.map((r) =>
    r.displayName?.trim() ? `${r.wkctr} (${r.displayName})` : r.wkctr,
  )

  // preload personnel photos for chart avatars (authenticated — avoids 401 on <img src>)
  useEffect(() => {
    if (!rows.length) return
    const cache = imgCacheRef.current
    let cancelled = false
    const blobUrls: string[] = []

    for (const r of rows) {
      const idwkctr = r.idwkctr
      if (!idwkctr || !r.hasImage) continue
      if (cache.has(idwkctr)) continue

      void (async () => {
        try {
          const token = getAuthToken()
          const res = await fetch(personnelImageUrl(idwkctr), {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          if (!res.ok || cancelled) return
          const blob = await res.blob()
          if (cancelled) return
          const blobUrl = URL.createObjectURL(blob)
          blobUrls.push(blobUrl)
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => {
            if (img.naturalWidth > 0) bumpImgReady((x) => x + 1)
            else {
              cache.delete(idwkctr)
              URL.revokeObjectURL(blobUrl)
            }
          }
          img.onerror = () => {
            cache.delete(idwkctr)
            URL.revokeObjectURL(blobUrl)
            bumpImgReady((x) => x + 1)
          }
          img.src = blobUrl
          cache.set(idwkctr, img)
        } catch {
          // initials fallback in chart plugin
        }
      })()
    }

    return () => {
      cancelled = true
      for (const url of blobUrls) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  if (q.isLoading && !q.data) return <Skeleton className="h-64 w-full rounded-card" />
  if (q.isError) {
    return (
      <QueryErrorState message={(q.error as Error).message} onRetry={() => void q.refetch()} />
    )
  }
  if (!q.data) return null

  const data: ChartData<'bar' | 'line', number[], string> = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: t('worktime.datasetPm'),
        data: rows.map((r) => Math.max(0, r.pmPercent)),
        backgroundColor: 'rgba(34,197,94,0.85)',
        stack: 'util',
        borderWidth: 0,
      },
      {
        type: 'bar' as const,
        label: t('worktime.datasetReactive'),
        data: rows.map((r) => Math.max(0, r.reactivePercent)),
        backgroundColor: 'rgba(14,165,233,0.90)',
        stack: 'util',
        borderWidth: 0,
      },
      {
        type: 'line' as const,
        label: t('worktime.datasetTotal'),
        data: rows.map((r) => Math.max(0, r.totalPercent)),
        borderColor: 'rgba(236,72,153,0.9)',
        backgroundColor: 'rgba(236,72,153,0.15)',
        pointBackgroundColor: 'rgba(236,72,153,0.95)',
        pointRadius: 3,
        tension: 0.35,
        yAxisID: 'y',
      },
    ],
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-body-sm font-semibold text-app">{t('worktime.chartTitle')}</p>
          <p className="text-xs text-app-muted">
            {(q.data.periodLabel || q.data.dateLabel) ? (q.data.periodLabel || q.data.dateLabel) : 'Daily'} ·{' '}
            {t('worktime.chartAverage', { pct: q.data.averagePercent.toFixed(1) })}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="size-3.5" aria-hidden />
          {t('worktime.badgeSummary')}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Label className="text-xs text-app-muted">{t('worktime.chartPeriod')}</Label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="h-9 rounded-md border border-app/30 bg-[var(--app-surface)] px-3 text-sm text-app"
        >
          <option value="daily">{t('worktime.periodDaily')}</option>
          <option value="weekly">{t('worktime.periodWeekly')}</option>
          <option value="monthly">{t('worktime.periodMonthly')}</option>
          <option value="yearly">{t('worktime.periodYearly')}</option>
        </select>

        {period === 'daily' ? (
          <Input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="h-9 w-[180px]"
          />
        ) : null}

        {period === 'weekly' ? (
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="h-9 rounded-md border border-app/30 bg-[var(--app-surface)] px-3 text-sm text-app"
          >
            {weekOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : null}

        {period === 'monthly' ? (
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 w-[180px]"
          />
        ) : null}

        {period === 'yearly' ? (
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 w-[120px]"
          />
        ) : null}
      </div>

      <div className="mt-3 overflow-x-auto">
        <div
          className="h-[520px]"
          style={{ minWidth: Math.max(920, rows.length * 56) }}
        >
          <Chart
            type="bar"
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            layout: { padding: { top: 116 } },
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { position: 'bottom' as const },
                tooltip: { enabled: true },
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: { maxRotation: 60, minRotation: 30 },
                  grid: { display: false },
                },
                y: {
                  stacked: true,
                  min: 0,
                  max: 100,
                  ticks: { callback: (v) => `${v}%` },
                },
              },
            }}
            plugins={[
            {
              id: 'techPhotos',
              afterDatasetsDraw(chart) {
                const ctx = chart.ctx
                const metaBar = chart.getDatasetMeta(0) // %PM bar (has x positions)
                if (!metaBar?.data?.length) return

                const r = 20
                const y = chart.chartArea.top + r + 10
                for (let i = 0; i < metaBar.data.length; i += 1) {
                  const bar = metaBar.data[i]
                  const row = rows[i]
                  const x = bar.x

                  const img =
                    row?.idwkctr && row.hasImage ? imgCacheRef.current.get(row.idwkctr) : undefined

                  if (img && img.complete && img.naturalWidth > 0) {
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(x, y, r, 0, Math.PI * 2)
                    ctx.closePath()
                    ctx.clip()
                    ctx.drawImage(img, x - r, y - r, r * 2, r * 2)
                    ctx.restore()
                  } else {
                    // fallback: initials
                    const t = String(row?.wkctr ?? '').trim() || String(row?.label ?? '').trim() || '?'
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(x, y, r, 0, Math.PI * 2)
                    ctx.closePath()
                    ctx.fillStyle = 'rgba(148,163,184,0.9)'
                    ctx.fill()
                    ctx.fillStyle = 'rgba(15,23,42,0.95)'
                    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(t.slice(0, 2).toUpperCase(), x, y)
                    ctx.restore()
                  }

                  // ring
                  ctx.save()
                  ctx.beginPath()
                  ctx.arc(x, y, r, 0, Math.PI * 2)
                  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
                  ctx.lineWidth = 4
                  ctx.stroke()
                  ctx.restore()
                }
              },
            },
            {
              id: 'totalBadges',
              afterDatasetsDraw(chart) {
                const ctx = chart.ctx
                const metaLine = chart.getDatasetMeta(2)
                if (!metaLine?.data?.length) return

                ctx.save()
                ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                for (let i = 0; i < metaLine.data.length; i += 1) {
                  const point = metaLine.data[i]
                  const v = rows[i]?.totalPercent ?? 0
                  const text = `${Math.round(v)}%`
                  const x = point.x
                  const y = Math.max(chart.chartArea.top + 28, point.y - 46)

                  const padX = 8
                  const w = ctx.measureText(text).width + padX * 2
                  const h = 18
                  const rx = x - w / 2
                  const ry = y - h / 2

                  // rounded rect
                  const r = 8
                  ctx.beginPath()
                  ctx.moveTo(rx + r, ry)
                  ctx.lineTo(rx + w - r, ry)
                  ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r)
                  ctx.lineTo(rx + w, ry + h - r)
                  ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h)
                  ctx.lineTo(rx + r, ry + h)
                  ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r)
                  ctx.lineTo(rx, ry + r)
                  ctx.quadraticCurveTo(rx, ry, rx + r, ry)
                  ctx.closePath()

                  ctx.fillStyle = 'rgba(236,72,153,0.95)'
                  ctx.fill()
                  ctx.fillStyle = 'white'
                  ctx.fillText(text, x, y)
                }
                ctx.restore()
              },
            },
          ]}
          aria-label={t('worktime.chartAria')}
          />
        </div>
      </div>
    </div>
  )
}

export function WorktimePage() {
  const { t } = useTranslation('manhours')
  const { t: tc } = useTranslation('common')
  const auth = getStoredAuthUser()
  const canRead = useAnyPermission(['manhours.read', 'manhours.admin'])
  const isAdmin = auth?.userst === 'A'
  const [adminIdwkctr, setAdminIdwkctr] = useState('')

  const qc = useQueryClient()

  if (!canRead) {
    return (
      <AppPageShell title={t('worktime.title')} description={t('worktime.description')}>
        <EmptyState
          icon={AlertCircle}
          title={t('worktime.noAccess')}
          description={
            <>
              {tc('rbac.requiresPermission')}{' '}
              <code className="text-xs">manhours.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('worktime.title')}
      description={t('worktime.description')}
      hints={hintsFromT(t, 'worktime.hints')}
      headerActions={
        <>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="size-3.5" aria-hidden />
            {t('worktime.badgeSummary')}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to="/manhours">
              <LinkIcon className="mr-1 size-3.5" aria-hidden />
              {t('worktime.navPerformance')}
            </Link>
          </Button>
          <CanPermission permission="work-orders.read">
            <Button variant="outline" size="sm" asChild>
              <Link to="/work-orders">{t('worktime.navWorkOrders')}</Link>
            </Button>
          </CanPermission>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void qc.invalidateQueries({ queryKey: ['worktime', 'summary-overall'] })
            }}
          >
            <RefreshCcw className="mr-1 size-3.5" aria-hidden />
            {t('worktime.refresh')}
          </Button>
        </>
      }
    >
        {isAdmin ? (
          <AppPageSection index={0}>
          <AppPageSectionCard
            icon={Sparkles}
            title={t('worktime.adminSection')}
            description={t('worktime.adminSectionDesc')}
          >
            <div className="space-y-1">
              <Label htmlFor="wt-idwkctr">{t('worktime.adminHr')}</Label>
              <Input
                id="wt-idwkctr"
                value={adminIdwkctr}
                onChange={(e) => setAdminIdwkctr(e.target.value)}
                placeholder={t('worktime.adminPlaceholder')}
                className="w-48"
              />
            </div>
          </AppPageSectionCard>
          </AppPageSection>
        ) : null}

        <AppPageSection index={isAdmin ? 1 : 0}>
        <Tabs defaultValue="summary">
          <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--app-surface)] p-1">
            <TabsTrigger value="summary">{t('worktime.tabSummary')}</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            <SummaryOverallTab />
          </TabsContent>
        </Tabs>
        </AppPageSection>
    </AppPageShell>
  )
}
