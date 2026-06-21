import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchMasterPlanRowLinks } from '@/lib/master-plan-api'
import { buildPmVibrationDeepLink } from '@/lib/pm-vibration-deep-link'
import { useQuery } from '@tanstack/react-query'
import { Activity, Database, Gauge, Link2, ListChecks, Wrench } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

type MasterPlanRowLinksMenuProps = {
  rowId: number
  onOpenWorkOrder: (wkorder: string) => void
}

function PmMeasurementLinkItem({
  label,
  icon: Icon,
  firstWo,
  machine,
  pmlist,
  onNavigate,
}: {
  label: string
  icon: typeof Activity
  firstWo: string | undefined
  machine: string
  pmlist: string
  onNavigate: () => void
}) {
  const navigate = useNavigate()

  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-100"
        onClick={() => {
          if (firstWo) {
            navigate(
              buildPmVibrationDeepLink({
                wkorder: firstWo,
                machine,
                pmlist,
              }),
            )
          } else {
            navigate('/pm-vibration')
          }
          onNavigate()
        }}
      >
        <Icon className="size-3.5 shrink-0 text-[#2f5597]" />
        {label}
      </button>
    </li>
  )
}

export function MasterPlanRowLinksMenu({ rowId, onOpenWorkOrder }: MasterPlanRowLinksMenuProps) {
  const { t } = useTranslation('masterData')
  const [open, setOpen] = useState(false)

  const linksQ = useQuery({
    queryKey: ['master-plan', 'row-links', rowId],
    queryFn: () => fetchMasterPlanRowLinks(rowId),
    enabled: open,
    staleTime: 60_000,
  })

  const links = linksQ.data
  const woCount = links?.workOrders.count ?? 0
  const mntplan = links?.keys.mntplan?.trim() ?? ''
  const firstWo = links?.workOrders.wkOrders[0]
  const machine = links?.keys.machine ?? ''
  const pmlist = links?.keys.pmlist ?? ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="relative h-7 gap-1 px-1.5 text-[10px] text-[#1f3864] hover:bg-[#dae3f3]"
          aria-label={t('masterPlan.rowLinks.open')}
        >
          <Link2 className="size-3.5" />
          {woCount > 0 ? (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 rounded-full bg-[#2f5597] px-1 text-[9px] font-bold text-white"
            >
              {woCount > 99 ? '99+' : woCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[120] w-[min(92vw,18rem)] border-slate-200 bg-white p-2 text-slate-900 [color-scheme:light]"
      >
        <p className="px-2 py-1 text-xs font-semibold text-[#1f3864]">{t('masterPlan.rowLinks.title')}</p>
        {linksQ.isLoading ? (
          <p className="px-2 py-2 text-xs text-slate-500">{t('masterPlan.loadingMore')}</p>
        ) : linksQ.isError ? (
          <p className="px-2 py-2 text-xs text-red-600">{t('masterPlan.rowLinks.loadFailed')}</p>
        ) : links ? (
          <ul className="space-y-0.5">
            {mntplan ? (
              <li>
                <Link
                  to={`/iw37n?q=${encodeURIComponent(mntplan)}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  <Database className="size-3.5 shrink-0 text-[#2f5597]" />
                  <span className="flex-1">{t('masterPlan.rowLinks.iw37n')}</span>
                  {links.iw37n.count > 0 ? (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {links.iw37n.count}
                    </Badge>
                  ) : null}
                </Link>
              </li>
            ) : null}

            {links.workOrders.wkOrders.length > 0 ? (
              <>
                <li className="px-2 pt-2 text-[10px] font-medium text-slate-500">
                  {t('masterPlan.rowLinks.workOrders', { count: links.workOrders.count })}
                </li>
                {links.workOrders.wkOrders.map((wk) => (
                  <li key={wk}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-mono hover:bg-slate-100"
                      onClick={() => {
                        onOpenWorkOrder(wk)
                        setOpen(false)
                      }}
                    >
                      <Wrench className="size-3.5 shrink-0 text-[#2f5597]" />
                      {wk}
                    </button>
                  </li>
                ))}
              </>
            ) : mntplan ? (
              <li className="px-2 py-1.5 text-xs text-slate-500">{t('masterPlan.rowLinks.noWorkOrders')}</li>
            ) : null}

            {links.pmMeasurements.current3Phase.suggested ? (
              <PmMeasurementLinkItem
                label={t('masterPlan.rowLinks.pmCurrent3Phase')}
                icon={Gauge}
                firstWo={firstWo}
                machine={machine}
                pmlist={pmlist}
                onNavigate={() => setOpen(false)}
              />
            ) : null}

            {links.pmMeasurements.vibrationDstDb.suggested ? (
              <PmMeasurementLinkItem
                label={t('masterPlan.rowLinks.pmVibrationDstDb')}
                icon={Activity}
                firstWo={firstWo}
                machine={machine}
                pmlist={pmlist}
                onNavigate={() => setOpen(false)}
              />
            ) : null}

            {links.tasklist.count > 0 || mntplan ? (
              <li>
                <Link
                  to="/master-data?entity=tasklist"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  <ListChecks className="size-3.5 shrink-0 text-[#2f5597]" />
                  <span className="flex-1">{t('masterPlan.rowLinks.tasklist')}</span>
                  {links.tasklist.count > 0 ? (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {links.tasklist.count}
                    </Badge>
                  ) : null}
                </Link>
              </li>
            ) : null}

            {links.equipment.count > 0 ? (
              <li>
                <Link
                  to="/master-data?entity=equipment"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  <Wrench className="size-3.5 shrink-0 text-[#2f5597]" />
                  <span className="flex-1">{t('masterPlan.rowLinks.equipment')}</span>
                  <Badge variant="outline" className="h-5 text-[10px]">
                    {links.equipment.count}
                  </Badge>
                </Link>
              </li>
            ) : null}
          </ul>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
