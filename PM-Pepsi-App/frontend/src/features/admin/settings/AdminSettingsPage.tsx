import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { AdminPageRoot } from '@/components/admin/AdminPageRoot'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminSettings, PatchAdminSettingsBody, SettingsResetSection } from '@/api/schemas'
import {
  fetchAdminSecretSettings,
  fetchAdminSettings,
  patchAdminSettings,
  resetAdminSettings,
  resetAdminSettingsSection,
} from '@/lib/admin-settings-api'
import { idbClear } from '@/lib/idb-cache'
import { usePermission } from '@/lib/use-permission'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BoardKioskCard } from '@/features/admin/settings/BoardKioskCard'
import { AlertCircle, Calendar, Flag, RefreshCcw, RotateCcw, Save, Settings2, ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const selectClass =
  'h-10 min-w-[12rem] flex-1 rounded-button border border-app bg-[var(--app-surface)] px-3 text-body-sm leading-normal text-app focus-app-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

/** แถว label + control — จัดกึ่งกลางแนวตั้งกับ dropdown */
const settingsFieldRowClass = 'flex flex-wrap items-center gap-x-4 gap-y-2'

const settingsFieldLabelClass =
  'w-full min-w-[10.5rem] max-w-[13rem] shrink-0 leading-normal sm:w-auto sm:text-right'

const TIMEZONES = [
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Jakarta',
  'Asia/Ho_Chi_Minh',
  'Asia/Tokyo',
  'UTC',
  'Europe/London',
  'America/New_York',
] as const

function invalidateSettingsCaches(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
  void qc.invalidateQueries({ queryKey: ['settings', 'public'] })
}

function SectionResetButton({
  section,
  label,
  disabled,
  onRequestReset,
}: {
  section: SettingsResetSection
  label: string
  disabled?: boolean
  onRequestReset: (section: SettingsResetSection, label: string) => void
}) {
  const { t } = useTranslation('admin')
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-app-muted"
      disabled={disabled}
      onClick={() => onRequestReset(section, label)}
    >
      <RotateCcw className="mr-1 size-3.5" aria-hidden />
      {t('settings.resetSectionBtn')}
    </Button>
  )
}

function FlagToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  const { t } = useTranslation('admin')
  return (
    <div className="flex items-start justify-between gap-4 rounded-card border border-app p-3">
      <div>
        <p className="text-body-sm font-medium text-app">{label}</p>
        {description ? <p className="mt-1 text-xs text-app-muted">{description}</p> : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant={checked ? 'default' : 'outline'}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        {checked ? t('settings.on') : t('settings.off')}
      </Button>
    </div>
  )
}

export function AdminSettingsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const canRead = usePermission('admin.settings.read')
  const canWrite = usePermission('admin.settings.write')

  const q = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: fetchAdminSettings,
    enabled: canRead || canWrite,
    placeholderData: keepPreviousData,
  })

  const secretsQ = useQuery({
    queryKey: ['admin', 'settings', 'secrets'],
    queryFn: fetchAdminSecretSettings,
    enabled: canRead || canWrite,
    placeholderData: keepPreviousData,
  })

  const [form, setForm] = useState<AdminSettings | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [clearCacheOpen, setClearCacheOpen] = useState(false)
  const [sectionResetTarget, setSectionResetTarget] = useState<{
    section: SettingsResetSection
    label: string
  } | null>(null)

  useEffect(() => {
    if (q.data) setForm(q.data)
  }, [q.data])

  const saveMut = useMutation({
    mutationFn: (body: PatchAdminSettingsBody) => patchAdminSettings(body),
    onSuccess: (data) => {
      setForm(data)
      invalidateSettingsCaches(qc)
      toast.success(t('settings.saved'))
    },
    onError: (e: Error) => toast.error(e.message || t('settings.saveFailed')),
  })

  const resetMut = useMutation({
    mutationFn: resetAdminSettings,
    onSuccess: (data) => {
      setForm(data)
      invalidateSettingsCaches(qc)
      toast.success(t('settings.resetAll'))
    },
    onError: (e: Error) => toast.error(e.message || t('settings.resetFailed')),
  })

  const sectionResetMut = useMutation({
    mutationFn: resetAdminSettingsSection,
    onSuccess: (data) => {
      setForm(data)
      invalidateSettingsCaches(qc)
      toast.success(t('settings.resetSection'))
    },
    onError: (e: Error) => toast.error(e.message || t('settings.resetFailed')),
  })

  const clearCacheMut = useMutation({
    mutationFn: async () => {
      await idbClear()
    },
    onSuccess: () => {
      toast.success(t('settings.cacheCleared'))
    },
    onError: () => toast.error(t('settings.cacheClearFailed')),
  })

  const dirty =
    form &&
    q.data &&
    JSON.stringify(form) !== JSON.stringify(q.data)

  const onSave = () => {
    if (!form || !q.data) return
    const body: PatchAdminSettingsBody = {}
    const keys = [
      'locale',
      'timezone',
      'yearFormat',
      'dateFormat',
      'uploadMaxMb',
      'sessionTtlMin',
      'passwordMinLength',
      'maxLoginAttempts',
      'featureIndexeddbOffline',
      'featureDashboardCharts',
      'maintenanceEnabled',
      'maintenanceMessage',
    ] as const
    for (const key of keys) {
      if (form[key] !== q.data[key]) {
        ;(body as Record<string, unknown>)[key] = form[key]
      }
    }
    if (Object.keys(body).length === 0) {
      toast.message(t('settings.noChanges'))
      return
    }
    saveMut.mutate(body)
  }

  if (!canRead && !canWrite) {
    return (
      <AdminPageRoot tourTarget="admin-settings">
        <AdminAccessDenied permission="admin.settings.read" />
      </AdminPageRoot>
    )
  }

  return (
    <AdminPageShell
      tourTarget="admin-settings"
      title={t('settings.title')}
      description={t('settings.description')}
      hints={['Timezone', 'Feature flags', 'Maintenance', 'Upload limit']}
      headerActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="admin-toolbar-btn"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />{t('shared.refresh')}</Button>
          {canWrite ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="admin-toolbar-btn"
                disabled={resetMut.isPending}
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="mr-2 size-4" aria-hidden />
                {t('settings.resetStandard')}
              </Button>
              <Button
                type="button"
                className="admin-toolbar-btn"
                disabled={!dirty || saveMut.isPending}
                onClick={onSave}
              >
                <Save className="mr-2 size-4" aria-hidden />
                {t('settings.saveBtn')}
              </Button>
            </>
          ) : null}
        </>
      }
    >
        {q.isLoading && !form ? (
          <Skeleton className="h-64 w-full rounded-card" />
        ) : q.isError ? (
          <EmptyState
            icon={AlertCircle}
            title={t('settings.loadFailed')}
            description={(q.error as Error).message}
            action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
          />
        ) : form ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="admin-card lg:col-span-2">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="size-5" aria-hidden />
                    {t('settings.sectionLocale')}
                  </CardTitle>
                  <CardDescription>{t('settings.sectionLocaleDesc')}</CardDescription>
                </div>
                {canWrite ? (
                  <SectionResetButton
                    section="locale"
                    label={t('settings.sectionLocale')}
                    disabled={sectionResetMut.isPending}
                    onRequestReset={(s, label) => setSectionResetTarget({ section: s, label })}
                  />
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className={settingsFieldRowClass}>
                  <Label htmlFor="locale" className={settingsFieldLabelClass}>
                    {t('settings.localeLabel')}
                  </Label>
                  <select
                    id="locale"
                    className={selectClass}
                    disabled={!canWrite}
                    value={form.locale}
                    onChange={(e) =>
                      setForm({ ...form, locale: e.target.value as AdminSettings['locale'] })
                    }
                  >
                    <option value="en-US">English (en-US)</option>
                    <option value="th-TH">{t('settings.localeTh')}</option>
                  </select>
                </div>
                <div className={settingsFieldRowClass}>
                  <Label htmlFor="timezone" className={settingsFieldLabelClass}>
                    {t('settings.timezoneLabel')}
                  </Label>
                  <select
                    id="timezone"
                    className={selectClass}
                    disabled={!canWrite}
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={settingsFieldRowClass}>
                  <Label className={settingsFieldLabelClass}>{t('settings.yearDisplayLabel')}</Label>
                  <div className="flex min-h-10 flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={form.yearFormat === 'BE' ? 'default' : 'outline'}
                      disabled={!canWrite}
                      onClick={() => setForm({ ...form, yearFormat: 'BE' })}
                    >
                      {t('settings.yearBe')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={form.yearFormat === 'AD' ? 'default' : 'outline'}
                      disabled={!canWrite}
                      onClick={() => setForm({ ...form, yearFormat: 'AD' })}
                    >
                      {t('settings.yearAd')}
                    </Button>
                  </div>
                </div>
                <div className={settingsFieldRowClass}>
                  <Label htmlFor="dateFormat" className={settingsFieldLabelClass}>
                    {t('settings.dateFormat')}
                  </Label>
                  <select
                    id="dateFormat"
                    className={selectClass}
                    disabled={!canWrite}
                    value={form.dateFormat}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dateFormat: e.target.value as AdminSettings['dateFormat'],
                      })
                    }
                  >
                    <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                    <option value="dd-MM-yyyy">dd-MM-yyyy</option>
                    <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings2 className="size-5" aria-hidden />
                  {t('settings.sectionLimits')}
                </CardTitle>
                {canWrite ? (
                  <SectionResetButton
                    section="limits"
                    label={t('settings.sectionLimits')}
                    disabled={sectionResetMut.isPending}
                    onRequestReset={(s, label) => setSectionResetTarget({ section: s, label })}
                  />
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uploadMaxMb">{t('settings.maxUploadMb')}</Label>
                  <Input
                    id="uploadMaxMb"
                    type="number"
                    min={1}
                    max={500}
                    disabled={!canWrite}
                    value={form.uploadMaxMb}
                    onChange={(e) =>
                      setForm({ ...form, uploadMaxMb: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTtlMin">{t('settings.sessionTtlMin')}</Label>
                  <Input
                    id="sessionTtlMin"
                    type="number"
                    min={15}
                    max={1440}
                    disabled={!canWrite}
                    value={form.sessionTtlMin}
                    onChange={(e) =>
                      setForm({ ...form, sessionTtlMin: Number(e.target.value) || 15 })
                    }
                  />
                  <p className="text-xs text-app-muted">{t('settings.sessionTtlHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">{t('settings.passwordMinLength')}</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min={8}
                    max={128}
                    disabled={!canWrite}
                    value={form.passwordMinLength}
                    onChange={(e) =>
                      setForm({ ...form, passwordMinLength: Number(e.target.value) || 8 })
                    }
                  />
                  <p className="text-xs text-app-muted">{t('settings.passwordMinHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">{t('settings.maxLoginAttempts')}</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min={3}
                    max={50}
                    disabled={!canWrite}
                    value={form.maxLoginAttempts}
                    onChange={(e) =>
                      setForm({ ...form, maxLoginAttempts: Number(e.target.value) || 3 })
                    }
                  />
                  <p className="text-xs text-app-muted">{t('settings.maxLoginAttemptsHint')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flag className="size-5" aria-hidden />
                    Feature flags
                  </CardTitle>
                  <CardDescription>{t('settings.featureFlagsNote')}</CardDescription>
                </div>
                {canWrite ? (
                  <SectionResetButton
                    section="features"
                    label={t('settings.sectionFeatures')}
                    disabled={sectionResetMut.isPending}
                    onRequestReset={(s, label) => setSectionResetTarget({ section: s, label })}
                  />
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <FlagToggle
                  label={t('settings.featureIndexeddb')}
                  description={t('settings.featureIndexeddbDesc')}
                  checked={form.featureIndexeddbOffline}
                  disabled={!canWrite}
                  onChange={(v) => setForm({ ...form, featureIndexeddbOffline: v })}
                />
                <FlagToggle
                  label={t('settings.featureDashboardCharts')}
                  description={t('settings.featureDashboardChartsDesc')}
                  checked={form.featureDashboardCharts}
                  disabled={!canWrite}
                  onChange={(v) => setForm({ ...form, featureDashboardCharts: v })}
                />
                <div className="rounded-card border border-app p-3">
                  <p className="text-body-sm font-medium text-app">{t('settings.offlineCacheTitle')}</p>
                  <p className="mt-1 text-xs text-app-muted">{t('settings.offlineCacheDesc')}</p>
                  <div className="mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canWrite || clearCacheMut.isPending}
                      onClick={() => setClearCacheOpen(true)}
                    >
                      <Trash2 className="mr-1 size-4" aria-hidden />
                      {t('settings.clearIndexedDb')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="admin-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">{t('settings.secretsTitle')}</CardTitle>
                <CardDescription>{t('settings.secretsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {secretsQ.isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (secretsQ.data?.items.length ?? 0) > 0 ? (
                  <ul className="space-y-2 text-body-sm">
                    {secretsQ.data?.items.map((s) => (
                      <li
                        key={s.settingKey}
                        className="flex flex-wrap justify-between gap-2 rounded border border-app px-3 py-2"
                      >
                        <span className="font-mono text-xs">{s.settingKey}</span>
                        <span className="text-app-muted">
                          {s.hasValue ? s.maskedValue : t('settings.secretEmptyValue')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption">{t('settings.secretsEmpty')}</p>
                )}
              </CardContent>
            </Card>

            <Card className="admin-card lg:col-span-2">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldAlert className="size-5" aria-hidden />
                    {t('settings.sectionMaintenance')}
                  </CardTitle>
                  <CardDescription>{t('settings.maintenanceCardDesc')}</CardDescription>
                </div>
                {canWrite ? (
                  <SectionResetButton
                    section="maintenance"
                    label={t('settings.sectionMaintenance')}
                    disabled={sectionResetMut.isPending}
                    onRequestReset={(s, label) => setSectionResetTarget({ section: s, label })}
                  />
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <FlagToggle
                  label={t('settings.maintenanceEnable')}
                  checked={form.maintenanceEnabled}
                  disabled={!canWrite}
                  onChange={(v) => setForm({ ...form, maintenanceEnabled: v })}
                />
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">{t('settings.maintenanceBannerLabel')}</Label>
                  <Input
                    id="maintenanceMessage"
                    disabled={!canWrite || !form.maintenanceEnabled}
                    value={form.maintenanceMessage}
                    placeholder={t('settings.maintenanceBannerPlaceholder')}
                    onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <BoardKioskCard canWrite={canWrite} />
          </div>
        ) : null}

      <AlertDialog
        open={sectionResetTarget != null}
        onOpenChange={(open) => {
          if (!open && !sectionResetMut.isPending) setSectionResetTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.resetSectionBtn')}</AlertDialogTitle>
            <AlertDialogDescription>
              {sectionResetTarget
                ? t('settings.resetSectionConfirm', { label: sectionResetTarget.label })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sectionResetMut.isPending}>{tc('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={sectionResetMut.isPending || !sectionResetTarget}
              onClick={(e) => {
                e.preventDefault()
                if (!sectionResetTarget) return
                sectionResetMut.mutate(sectionResetTarget.section, {
                  onSuccess: () => setSectionResetTarget(null),
                })
              }}
            >
              {t('settings.resetSectionBtn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmPhraseDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        tone="danger"
        title={t('settings.resetAllTitle')}
        description={t('settings.resetAllDescription')}
        phrase={t('settings.resetPhrase')}
        confirmLabel={t('settings.resetStandard')}
        loading={resetMut.isPending}
        onConfirm={() => {
          resetMut.mutate(undefined, {
            onSuccess: () => setResetOpen(false),
          })
        }}
      />

      <ConfirmPhraseDialog
        open={clearCacheOpen}
        onOpenChange={setClearCacheOpen}
        tone="danger"
        title={t('settings.clearCacheTitle')}
        description={t('settings.clearCacheDescription')}
        phrase={t('settings.clearPhrase')}
        confirmLabel={t('settings.clearConfirm')}
        loading={clearCacheMut.isPending}
        onConfirm={() => {
          clearCacheMut.mutate(undefined, {
            onSuccess: () => setClearCacheOpen(false),
          })
        }}
      />
    </AdminPageShell>
  )
}
