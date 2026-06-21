import { CanPermission } from '@/components/auth/CanPermission'
import { ConfirmationExportTablePanel } from '@/components/confirmation/ConfirmationExportTablePanel'
import {
  ConfirmationReviewDialog,
  type ConfirmationReviewTarget,
} from '@/components/confirmation/ConfirmationReviewDialog'
import {
  ConfirmationSapTable,
  confirmationRowMatchesSearch,
} from '@/components/confirmation/ConfirmationSapTable'
import { FilterSearchField } from '@/components/scheduling/SchedulingFilterLayout'
import { AppPageContent } from '@/components/layout/AppPageContent'
import {
  SchedulingCalendarPanel,
  SchedulingPageHeader,
  SchedulingPageSection,
  SchedulingPageStack,
  schedulingHeroLinkBtnClass,
  schedulingHeroLinkIconClass,
} from '@/components/scheduling/SchedulingPageLayout'
import { MassConfirmSearchCard } from '@/features/confirmation/MassConfirmSearchCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ConfirmationExportRow, ConfirmationPreviewRow } from '@/api/schemas'
import { getStoredAuthUser } from '@/features/auth/login-api'
import {
  fetchConfirmationExport,
  fetchConfirmationPreview,
  type ConfirmationPreviewStatus,
} from '@/lib/api-public'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, BadgeCheck, ClipboardCheck, Eye, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

type ReviewTab = 'all' | 'pending' | 'approved' | 'rejected'

function previewStatusForTab(tab: ReviewTab): ConfirmationPreviewStatus | null {
  if (tab === 'all') return 'all'
  if (tab === 'pending') return 'pending'
  if (tab === 'rejected') return 'rejected'
  return null
}

function rowToReviewTarget(row: ConfirmationExportRow & { idiw37?: number }): ConfirmationReviewTarget {
  return {
    idiw37: 'idiw37' in row && typeof row.idiw37 === 'number' ? row.idiw37 : 0,
    wkorder: row.wkorder,
  }
}

export function ConfirmationPage() {
  const { t } = useTranslation('confirmation')
  const qc = useQueryClient()
  const authUser = getStoredAuthUser()
  const isAdmin = (authUser?.userst ?? '').trim() === 'A'
  const canRead = usePermission('confirmation.read')
  const canExport =
    usePermission('confirmation.export') ||
    usePermission('confirmation.import') ||
    isAdmin
  const canMassConfirm = usePermission('confirmation.write') || isAdmin

  const [activeTab, setActiveTab] = useState<ReviewTab>('pending')
  const [search, setSearch] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<ConfirmationReviewTarget | null>(null)

  const previewStatus = previewStatusForTab(activeTab)

  const previewQ = useQuery({
    queryKey: ['confirmation', 'preview', previewStatus],
    queryFn: () => fetchConfirmationPreview(previewStatus!),
    enabled: canRead && previewStatus != null,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })

  const approvedQ = useQuery({
    queryKey: ['confirmation', 'export', 'approved-tab'],
    queryFn: fetchConfirmationExport,
    enabled: canRead && activeTab === 'approved',
    placeholderData: keepPreviousData,
  })

  const tableRows: ConfirmationExportRow[] = useMemo(() => {
    if (activeTab === 'approved') return approvedQ.data?.items ?? []
    return previewQ.data?.items ?? []
  }, [activeTab, approvedQ.data?.items, previewQ.data?.items])

  const filteredRows = useMemo(
    () => tableRows.filter((row) => confirmationRowMatchesSearch(row, search)),
    [tableRows, search],
  )

  const openReview = (row: ConfirmationPreviewRow | ConfirmationExportRow) => {
    const target =
      'idiw37' in row && typeof row.idiw37 === 'number'
        ? { idiw37: row.idiw37, wkorder: row.wkorder }
        : rowToReviewTarget(row)
    if (!target.idiw37) return
    setReviewTarget(target)
    setReviewOpen(true)
  }

  const invalidateReviewData = async () => {
    await qc.invalidateQueries({ queryKey: ['confirmation', 'preview'] })
    await qc.invalidateQueries({ queryKey: ['confirmation', 'export'] })
  }

  const pageHints = [
    t('page.hintReviewQueue'),
    t('page.hintExportSap'),
    t('page.hintConfirmReject'),
  ]

  if (!canRead) {
    return (
      <>
        <SchedulingPageHeader title={t('page.title')} icon={BadgeCheck} hints={pageHints} />
        <AppPageContent>
          <EmptyState
            icon={AlertCircle}
            title={t('page.noAccessTitle')}
            description={
              <>
                {t('page.noAccessDesc')} <code className="text-xs">confirmation.read</code>
              </>
            }
          />
        </AppPageContent>
      </>
    )
  }

  const isLoading =
    activeTab === 'approved'
      ? approvedQ.isLoading && !approvedQ.data
      : previewQ.isLoading && !previewQ.data
  const isError = activeTab === 'approved' ? approvedQ.isError : previewQ.isError
  const queryError = activeTab === 'approved' ? approvedQ.error : previewQ.error
  const refetch = () => (activeTab === 'approved' ? approvedQ.refetch() : previewQ.refetch())
  const isFetching = activeTab === 'approved' ? approvedQ.isFetching : previewQ.isFetching

  const showReviewActions = activeTab !== 'approved'

  return (
    <>
      <SchedulingPageHeader title={t('page.title')} icon={BadgeCheck} hints={pageHints}>
        <CanPermission permission="work-orders.read">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={schedulingHeroLinkBtnClass}
            asChild
          >
            <Link to="/work-orders">
              <ClipboardCheck className={schedulingHeroLinkIconClass} aria-hidden />
              {t('page.woConfirmationLink')}
            </Link>
          </Button>
        </CanPermission>
      </SchedulingPageHeader>

      <AppPageContent className="scheduling-page pb-8">
        <SchedulingPageStack>
          <SchedulingPageSection index={0}>
            <SchedulingCalendarPanel
              title={t('review.title')}
              eventCount={filteredRows.length}
              isRefreshing={isFetching && !isLoading}
            >
              <div className="space-y-4">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v as ReviewTab)
                    setSearch('')
                  }}
                >
                  <TabsList className="h-auto flex-wrap gap-1 bg-app-subtle/50 p-1">
                    <TabsTrigger value="all">{t('review.tabAll')}</TabsTrigger>
                    <TabsTrigger value="pending">{t('review.tabPending')}</TabsTrigger>
                    <TabsTrigger value="approved">{t('review.tabApproved')}</TabsTrigger>
                    <TabsTrigger value="rejected">{t('review.tabRejected')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-4 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="w-full sm:max-w-sm">
                        <FilterSearchField
                          id="confirmation-review-search"
                          label={t('export.search')}
                          value={search}
                          onChange={setSearch}
                          placeholder={t('export.searchPlaceholder')}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={isFetching}
                        onClick={() => void refetch()}
                      >
                        <RotateCcw className="size-3.5" aria-hidden />
                        {t('export.refresh')}
                      </Button>
                    </div>

                    {isLoading ? (
                      <p className="py-8 text-center text-sm text-app-muted">{t('review.loading')}</p>
                    ) : isError ? (
                      <QueryLoadErrorState
                        title={t('review.loadFailed')}
                        error={queryError}
                        action={{ label: t('export.refresh'), onClick: () => void refetch() }}
                      />
                    ) : filteredRows.length === 0 ? (
                      <EmptyState
                        icon={ClipboardCheck}
                        title={t('review.empty')}
                        description={t(`review.emptyHint.${activeTab}`)}
                      />
                    ) : (
                      <ConfirmationSapTable
                        rows={filteredRows}
                        emptyMessage={t('export.noResults')}
                        onRowClick={
                          showReviewActions
                            ? (row) => openReview(row as ConfirmationPreviewRow)
                            : undefined
                        }
                        renderAction={
                          showReviewActions
                            ? (row) => (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openReview(row as ConfirmationPreviewRow)
                                  }}
                                >
                                  <Eye className="size-3.5" aria-hidden />
                                  {t('review.openReview')}
                                </Button>
                              )
                            : undefined
                        }
                      />
                    )}

                    {activeTab === 'approved' && filteredRows.length > 0 ? (
                      <p className="text-xs text-app-muted">{t('review.approvedExportHint')}</p>
                    ) : null}
                  </TabsContent>
                </Tabs>
              </div>
            </SchedulingCalendarPanel>
          </SchedulingPageSection>

          <ConfirmationExportTablePanel
            enabled={canRead}
            canExport={canExport}
            sectionIndex={1}
          />

          {canMassConfirm ? (
            <SchedulingPageSection index={2}>
              <MassConfirmSearchCard collapsible defaultOpen={false} />
            </SchedulingPageSection>
          ) : null}
        </SchedulingPageStack>
      </AppPageContent>

      <ConfirmationReviewDialog
        target={reviewTarget}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onQcChange={() => void invalidateReviewData()}
      />
    </>
  )
}
