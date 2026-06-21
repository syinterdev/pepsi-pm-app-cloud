import { Badge } from '@/components/ui/badge'
import { hintsFromT } from '@/lib/i18n-hints'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppPageShell } from '@/components/layout/AppPageShell'
import { MasterPlanDisciplineView } from '@/features/master-plan/MasterPlanDisciplineView'
import { MasterPlanActionsBar } from '@/features/master-plan/MasterPlanActionsBar'
import {
  fetchMasterPlanWorkbook,
  type MasterPlanDiscipline,
} from '@/lib/master-plan-api'
import { useMasterDataPermissions } from '@/lib/master-data-permissions'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

const DISCIPLINES: MasterPlanDiscipline[] = ['EE', 'ME', 'PK']

const TAB_ID: Record<MasterPlanDiscipline, string> = {
  EE: 'pm-master-ee',
  ME: 'pm-master-me',
  PK: 'pm-master-pk',
}

function parseDiscipline(raw: string | null): MasterPlanDiscipline {
  const value = (raw ?? 'EE').trim().toUpperCase()
  if (value === 'ME' || value === 'PK') return value
  return 'EE'
}

export function MasterPlanPage() {
  const { t } = useTranslation('masterData')
  const { canRead } = useMasterDataPermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const discipline = parseDiscipline(searchParams.get('discipline'))

  const workbookQ = useQuery({
    queryKey: ['master-plan', 'workbook', discipline],
    queryFn: () => fetchMasterPlanWorkbook(discipline),
    enabled: canRead,
  })

  const setDiscipline = useCallback(
    (next: MasterPlanDiscipline) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.set('discipline', next)
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const pageHints = hintsFromT(t, 'masterPlanPage.hints')

  if (!canRead) {
    return (
      <AppPageShell
        title={t('masterPlanPage.title')}
        description={t('masterPlanPage.description')}
        hints={pageHints}
      >
        <EmptyState
          icon={AlertCircle}
          title={t('page.noAccess')}
          description={
            <>
              {t('page.noAccessDesc')}{' '}
              <code className="text-xs">master-data.read</code>
            </>
          }
        />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell
      title={t('masterPlanPage.title')}
      hints={pageHints}
      headerActions={
        <div className="flex flex-col items-end gap-2">
          <MasterPlanActionsBar discipline={discipline} />
          {workbookQ.data ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="secondary" className="text-xs tabular-nums">
                {t('masterPlanPage.planYear', { year: workbookQ.data.planYear })}
              </Badge>
              <span
                className="max-w-[min(100%,14rem)] truncate text-xs text-app-muted sm:max-w-xs"
                title={workbookQ.data.sourceFilename}
              >
                {workbookQ.data.sourceFilename}
              </span>
            </div>
          ) : null}
        </div>
      }
      stack={false}
    >
      <Tabs value={discipline} onValueChange={(v) => setDiscipline(v as MasterPlanDiscipline)}>
        <TabsList className="mb-3 flex h-auto max-w-full flex-wrap justify-start gap-1 rounded-lg border border-[#2f5597]/30 bg-[#dae3f3]/30 p-1">
          {DISCIPLINES.map((d) => (
            <TabsTrigger
              key={d}
              value={d}
              className="text-xs data-[state=active]:bg-[#2f5597] data-[state=active]:text-white sm:text-body-sm"
            >
              {t(`tabs.${TAB_ID[d]}` as 'tabs.pm-master-ee')}
            </TabsTrigger>
          ))}
        </TabsList>
        {DISCIPLINES.map((d) => (
          <TabsContent key={d} value={d} className="mt-0 space-y-0">
            {discipline === d ? (
              <MasterPlanDisciplineView discipline={d} hideWorkbookSummary />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </AppPageShell>
  )
}
