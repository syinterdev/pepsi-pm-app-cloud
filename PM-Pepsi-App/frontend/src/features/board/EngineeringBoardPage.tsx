/**
 * Engineering Board — มอนิเตอร์กลางแผนก (ประชุมครั้งที่ 1 §2)
 * เปิดเต็มจอ: `/board` — ไม่บังคับ login (kiosk token หรือ session)
 */
import { PepsiStripe } from '@/components/brand/PepsiStripe'
import { BoardKpiZone } from '@/features/board/BoardKpiZone'
import type { SparklineTone } from '@/components/charts/Sparkline'
import { BoardActivityFeed } from '@/features/board/BoardActivityFeed'
import { BoardPmReadingsPanel } from '@/features/board/BoardPmReadingsPanel'
import { BoardCarouselShell } from '@/features/board/BoardCarouselShell'
import { BoardPeriodSelector } from '@/features/board/BoardPeriodSelector'
import { BoardTeamSelector, type BoardTeamId } from '@/features/board/BoardTeamSelector'
import { BoardThemeToggle } from '@/features/board/BoardThemeToggle'
import { BoardZoneB } from '@/features/board/BoardZoneB'
import { useBoardCarousel } from '@/features/board/use-board-carousel'
import { useBoardPeriod } from '@/features/board/use-board-period'
import { useBoardTheme } from '@/features/board/use-board-theme'
import { isLoggedIn } from '@/features/auth/login-api'
import {
  fetchDashboardSummary,
  fetchKpi,
  fetchSummaryWeekly,
} from '@/lib/api-public'
import { fetchBoardActivity } from '@/lib/board-activity-api'
import { fetchBoardPmReadings } from '@/lib/board-pm-readings-api'
import {
  parseBoardCarouselFromSearchParams,
  readBoardCarouselEnabled,
  writeBoardCarouselEnabled,
} from '@/lib/board-carousel'
import { applyBoardKioskFromSearchParams, getBoardKioskToken } from '@/lib/board-kiosk'
import { useBoardKioskViewport } from '@/lib/use-board-kiosk-viewport'
import { fetchBoardKioskStatus } from '@/lib/board-kiosk-api'
import { AnnouncementBannerRow } from '@/components/layout/AnnouncementBanner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  dismissAnnouncement,
  readDismissedAnnouncements,
} from '@/lib/announcement-dismiss'
import { fetchActiveAnnouncements } from '@/lib/announcements-api'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { usePermission } from '@/lib/use-permission'
import { useQuery } from '@tanstack/react-query'
import { useI18nFormat } from '@/lib/use-i18n-format'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import './engineering-board.css'
import './engineering-board-theme.css'
import './engineering-board-display.css'

const REFRESH_MS = 60_000
const TEAM_IDS: readonly BoardTeamId[] = ['all', 'A', 'B', 'EE', 'UT'] as const

function parseBoardTeamFromSearchParams(sp: URLSearchParams): BoardTeamId {
  const raw = (sp.get('team') || '').trim()
  if (TEAM_IDS.includes(raw as BoardTeamId)) return raw as BoardTeamId
  return 'all'
}


function deltaClass(n: number): string {
  if (n > 0) return 'delta-up'
  if (n < 0) return 'delta-down'
  return ''
}

export function EngineeringBoardPage() {
  const { t } = useTranslation('board')
  const { bcp47 } = useI18nFormat()
  const [searchParams] = useSearchParams()
  const [kioskReady, setKioskReady] = useState(false)
  const loggedIn = isLoggedIn()
  const canReadSession = usePermission('dashboard.read')
  const { settings } = usePublicSettings()
  const appName = settings?.appName?.trim() || 'PM Pepsi'
  const [now, setNow] = useState(() => new Date())
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [dismissedAnn, setDismissedAnn] = useState(() => readDismissedAnnouncements())
  const { isFullscreen, toggleFullscreen } = useBoardKioskViewport()
  const { theme, setTheme, themeClass, kioskDark } = useBoardTheme()
  const { period, range, rangeLabel, setPeriod } = useBoardPeriod()
  const [team, setTeam] = useState<BoardTeamId>(() => parseBoardTeamFromSearchParams(searchParams))
  const [showRcaUtil, setShowRcaUtil] = useState(false)
  const [carouselEnabled, setCarouselEnabled] = useState(() => readBoardCarouselEnabled())
  const carousel = useBoardCarousel({ enabled: carouselEnabled })
  const kioskStatusQ = useQuery({
    queryKey: ['board', 'kiosk-status'],
    queryFn: fetchBoardKioskStatus,
    staleTime: 60_000,
  })

  useEffect(() => {
    applyBoardKioskFromSearchParams(searchParams)
    const fromUrl = parseBoardCarouselFromSearchParams(searchParams)
    if (fromUrl != null) {
      setCarouselEnabled(fromUrl)
      writeBoardCarouselEnabled(fromUrl)
    }
    setTeam(parseBoardTeamFromSearchParams(searchParams))
    setKioskReady(true)
  }, [searchParams])

  const toggleCarousel = () => {
    setCarouselEnabled((prev) => {
      const next = !prev
      writeBoardCarouselEnabled(next)
      return next
    })
  }

  const canFetchData = useMemo(() => {
    if (!kioskReady) return false
    if (loggedIn && canReadSession) return true
    const status = kioskStatusQ.data
    if (!status) return false
    if (!status.enabled) return true
    if (!status.tokenRequired) return true
    return Boolean(getBoardKioskToken())
  }, [kioskReady, loggedIn, canReadSession, kioskStatusQ.data])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const dashQ = useQuery({
    queryKey: ['dashboard', 'board', team],
    queryFn: () => fetchDashboardSummary({ team: team === 'all' ? undefined : team }),
    enabled: canFetchData,
    refetchInterval: REFRESH_MS,
  })

  const kpiQ = useQuery({
    queryKey: ['reports-kpi', 'board', 8, team],
    queryFn: () => fetchKpi({ weeksBack: 8, team: team === 'all' ? undefined : team }),
    enabled: canFetchData,
    refetchInterval: REFRESH_MS,
  })

  const weeklyQ = useQuery({
    queryKey: ['summary-weekly', 'board', period, range.from, range.to, team],
    queryFn: () =>
      fetchSummaryWeekly({ from: range.from, to: range.to, team: team === 'all' ? undefined : team }),
    enabled: canFetchData,
    refetchInterval: REFRESH_MS * 2,
  })

  const activityQ = useQuery({
    queryKey: ['board', 'activity', period, team],
    queryFn: () => fetchBoardActivity({ period, limit: 12, team: team === 'all' ? undefined : team }),
    enabled: canFetchData,
    refetchInterval: REFRESH_MS,
  })

  const pmReadingsQ = useQuery({
    queryKey: ['board', 'pm-readings', period, team],
    queryFn: () =>
      fetchBoardPmReadings({
        period,
        limit: 8,
        team: team === 'all' ? undefined : team,
      }),
    enabled: canFetchData,
    refetchInterval: REFRESH_MS,
  })

  const annQ = useQuery({
    queryKey: ['announcements', 'active', 'board'],
    queryFn: fetchActiveAnnouncements,
    enabled: canFetchData,
    refetchInterval: REFRESH_MS * 2,
  })

  useEffect(() => {
    if (dashQ.dataUpdatedAt) setLastRefresh(new Date(dashQ.dataUpdatedAt))
  }, [dashQ.dataUpdatedAt])

  const trends = dashQ.data?.trends
  const kpis =
    dashQ.data && trends
      ? [
          {
            label: t('kpi.openOrders'),
            value: dashQ.data.openOrders.toLocaleString(bcp47),
            hint: t('kpi.openHint'),
            trend: trends.openDaily,
            tone: 'pepsi-blue' as SparklineTone,
          },
          {
            label: t('kpi.closedMonth'),
            value: dashQ.data.closedThisMonth.toLocaleString(bcp47),
            hint: t('kpi.closedHint'),
            trend: trends.closedDaily,
            tone: 'pepsi-red' as SparklineTone,
          },
          {
            label: t('kpi.pendingPersonnel'),
            value: dashQ.data.pendingPersonnel.toLocaleString(bcp47),
            hint: t('kpi.pendingHint'),
            trend: trends.pendingDaily,
            tone: 'pepsi-orange' as SparklineTone,
          },
          {
            label: t('kpi.iw37nImport'),
            value: dashQ.data.iw37nLastImport
              ? new Date(dashQ.data.iw37nLastImport).toLocaleString(bcp47, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : t('kpi.noImport'),
            hint: t('kpi.iw37nHint'),
            trend: trends.importDaily,
            tone: 'pepsi-blue' as SparklineTone,
            compactValue: true,
          },
        ]
      : []

  const weekRows = kpiQ.data?.weekToWeek ?? []
  const topAnn = (annQ.data?.items ?? []).find((a) => !dismissedAnn.has(a.id))

  const boardRootClass = [
    'engineering-board',
    'engineering-board--kiosk',
    themeClass,
    carouselEnabled ? 'engineering-board--carousel' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (!kioskReady || kioskStatusQ.isLoading) {
    return (
      <div className={`${boardRootClass} flex flex-col items-center justify-center gap-6 p-8`}>
        <p className="text-lg font-medium opacity-90">{t('preparing')}</p>
        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-card opacity-60" />
          <Skeleton className="h-28 rounded-card opacity-60" />
          <Skeleton className="h-28 rounded-card opacity-60" />
        </div>
      </div>
    )
  }

  if (!canFetchData) {
    const needToken = kioskStatusQ.data?.tokenRequired
    return (
      <div className={`${boardRootClass} engineering-board--gate flex flex-col items-center justify-center p-8`}>
        <div className="engineering-board--gate-panel">
          <h1 className="text-2xl font-semibold">{t('kioskTitle')}</h1>
          {needToken ? (
            <p className="max-w-lg text-base opacity-80">
              {t('kioskTokenHint')}{' '}
              <code className="rounded bg-white/10 px-1">?token=…</code>
            </p>
          ) : (
            <p className="max-w-lg text-base opacity-80">
              {t('kioskLoginHint')}{' '}
              <Link to="/login" className="engineering-board__footer-link underline">
                {t('signIn')}
              </Link>
            </p>
          )}
          <BoardThemeToggle value={theme} onChange={setTheme} />
          <Link to="/login" className="engineering-board__footer-link underline">
            {t('fullAppLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={boardRootClass}>
      <div className="engineering-board__ambient" aria-hidden>
        <span className="engineering-board__orb engineering-board__orb--1" />
        <span className="engineering-board__orb engineering-board__orb--2" />
        <span className="engineering-board__orb engineering-board__orb--3" />
      </div>
      <div className="engineering-board__viewport">
        <div className="engineering-board__main">
          <header className="engineering-board__header">
            <div className="engineering-board__header-brand">
              <p className="engineering-board__eyebrow">
                {t('header.eyebrow')}
                <span className="engineering-board__eyebrow-dot" aria-hidden>
                  ·
                </span>
                {loggedIn ? t('header.signedIn') : t('header.kiosk')}
              </p>
              <h1 className="engineering-board__title">{appName}</h1>
              <p className="engineering-board__meta">
                {now.toLocaleDateString(bcp47, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="engineering-board__header-tools">
              <BoardThemeToggle value={theme} onChange={setTheme} />
              <BoardPeriodSelector value={period} onChange={setPeriod} />
              <BoardTeamSelector value={team} onChange={setTeam} />
              <div className="engineering-board__clock-block">
                <div className="engineering-board__clock">
                  {now.toLocaleTimeString(bcp47, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
                <p className="engineering-board__refresh-meta">
                  {lastRefresh
                    ? t('header.updatedAt', {
                        time: lastRefresh.toLocaleTimeString(bcp47),
                      })
                    : t('header.loading')}
                  {dashQ.isFetching ||
                  weeklyQ.isFetching ||
                  activityQ.isFetching ||
                  pmReadingsQ.isFetching
                    ? t('header.refreshing')
                    : ''}
                </p>
              </div>
            </div>
          </header>

          <div className="engineering-board__body">
            {topAnn ? (
              <AnnouncementBannerRow
                item={topAnn}
                onDismiss={(id) => setDismissedAnn(dismissAnnouncement(id))}
                className="engineering-board__announce mx-0 rounded-none border-x-0"
              />
            ) : null}

            {dashQ.isError ? (
              <p className="engineering-board__error">{(dashQ.error as Error).message}</p>
            ) : (
              <BoardCarouselShell
                enabled={carouselEnabled}
                slide={carousel.slide}
                paused={carousel.paused}
                onPauseChange={carousel.setPaused}
                onGoTo={carousel.goTo}
                zoneA={
                  <BoardKpiZone
                    items={kpis}
                    loading={dashQ.isLoading && !dashQ.data}
                    carousel={carouselEnabled}
                  />
                }
                zoneB={
                  <BoardZoneB
                    rangeLabel={rangeLabel}
                    showRca={showRcaUtil}
                    onShowRcaChange={setShowRcaUtil}
                    weeklyRows={weeklyQ.data?.rows}
                    weeklyLoading={weeklyQ.isLoading}
                    weeklyError={weeklyQ.isError ? (weeklyQ.error as Error) : null}
                    weekRows={weekRows}
                    deltaClass={deltaClass}
                    carousel={carouselEnabled}
                    kioskDark={kioskDark}
                  />
                }
                zoneC={
                  <div className="engineering-board__zone-c-stack">
                    <BoardPmReadingsPanel
                      data={pmReadingsQ.data}
                      loading={pmReadingsQ.isLoading}
                      error={pmReadingsQ.isError ? (pmReadingsQ.error as Error) : null}
                      carousel={carouselEnabled}
                      rangeLabel={rangeLabel}
                    />
                    <BoardActivityFeed
                      items={activityQ.data?.items ?? []}
                      loading={activityQ.isLoading}
                      error={activityQ.isError ? (activityQ.error as Error) : null}
                      carousel={carouselEnabled}
                    />
                  </div>
                }
              />
            )}
          </div>

          <footer className="engineering-board__footer">
            <span className="engineering-board__live">
              <span className="engineering-board__live-dot" />
              {t('footer.live', { seconds: REFRESH_MS / 1000 })}
            </span>
            <span>
              {loggedIn ? (
                <>
                  <Link to="/" className="engineering-board__footer-link">
                    {t('footer.backApp')}
                  </Link>
                  {' · '}
                  <Link to="/summary-weekly" className="engineering-board__footer-link">
                    {t('footer.engUtilDetail')}
                  </Link>
                </>
              ) : (
                <Link to="/login" className="engineering-board__footer-link">
                  {t('signIn')}
                </Link>
              )}
              {' · '}
              <button
                type="button"
                className="engineering-board__footer-link border-0 bg-transparent p-0 cursor-pointer"
                onClick={toggleCarousel}
              >
                {carouselEnabled ? t('carousel.showAll') : t('carousel.slideZones')}
              </button>
              {' · '}
              <button
                type="button"
                className="engineering-board__footer-link border-0 bg-transparent p-0 cursor-pointer"
                onClick={() => void toggleFullscreen()}
              >
                {isFullscreen ? t('kioskNav.exitFullscreen') : t('kioskNav.fullscreen')}
              </button>
              <span className="opacity-60"> (F11)</span>
            </span>
          </footer>
        </div>

        <PepsiStripe className="engineering-board__stripe h-1.5" />
      </div>
    </div>
  )
}
