import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { hintsFromT } from '@/lib/i18n-hints'
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
import type { AdminBranding, PatchAdminBrandingBody } from '@/api/schemas'
import {
  deleteAdminBrandingFavicon,
  deleteAdminBrandingLoginBackground,
  deleteAdminBrandingLogo,
  fetchAdminBranding,
  patchAdminBranding,
  resetAdminBranding,
  uploadAdminBrandingFavicon,
  uploadAdminBrandingLoginBackground,
  uploadAdminBrandingLogo,
} from '@/lib/admin-branding-api'
import { applyFavicon } from '@/lib/apply-public-settings'
import { applyBrandingAssetCss } from '@/lib/branding-asset-css'
import { applyTypographyToDocument, typographyFromPublicSettings } from '@/lib/typography-tokens'
import { publicFaviconUrl, publicLoginBackgroundUrl, publicLogoUrl } from '@/lib/settings-api'
import { usePermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, RefreshCcw, RotateCcw, Save, Upload } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ColorPickerCard } from './ColorPickerCard'
import { LoginBackgroundCard } from './LoginBackgroundCard'
import { BrandingAssetSizeCard } from './BrandingAssetSizeCard'
import { LogoUploadCard } from './LogoUploadCard'
import { SemanticColorCard } from './SemanticColorCard'
import { ThemePreviewCard } from './ThemePreviewCard'
import { TypographyCard } from './TypographyCard'
import { THEME_MODES } from './branding-constants'

function invalidateBrandingCaches(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin', 'branding'] })
  void qc.invalidateQueries({ queryKey: ['settings', 'public'] })
}

export function AdminBrandingPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const qc = useQueryClient()
  const canRead = usePermission('admin.branding.read')
  const canWrite = usePermission('admin.branding.write')
  const [logoVersion, setLogoVersion] = useState(0)
  const [faviconVersion, setFaviconVersion] = useState(0)
  const [loginBgVersion, setLoginBgVersion] = useState(0)
  const [logoLocalPreview, setLogoLocalPreview] = useState<string | null>(null)
  const [faviconLocalPreview, setFaviconLocalPreview] = useState<string | null>(null)
  const [loginBgLocalPreview, setLoginBgLocalPreview] = useState<string | null>(null)
  const [removeBgOnUpload, setRemoveBgOnUpload] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const q = useQuery({
    queryKey: ['admin', 'branding'],
    queryFn: fetchAdminBranding,
    enabled: canRead || canWrite,
    placeholderData: keepPreviousData,
  })

  const [form, setForm] = useState<AdminBranding | null>(null)

  useEffect(() => {
    if (q.data) setForm(q.data)
  }, [q.data])

  useEffect(() => {
    return () => {
      if (logoLocalPreview) URL.revokeObjectURL(logoLocalPreview)
      if (faviconLocalPreview) URL.revokeObjectURL(faviconLocalPreview)
      if (loginBgLocalPreview) URL.revokeObjectURL(loginBgLocalPreview)
    }
  }, [logoLocalPreview, faviconLocalPreview, loginBgLocalPreview])

  useEffect(() => {
    if (!form) return
    applyTypographyToDocument(typographyFromPublicSettings(form))
  }, [
    form?.fontFamily,
    form?.fontSizePreset,
    form?.fontSizeBasePx,
    form?.fontColor,
    form?.fontHeadingColor,
    form?.fontMutedColor,
  ])

  useEffect(() => {
    if (!form) return
    applyBrandingAssetCss(form)
  }, [form?.logoNavHeightPx, form?.logoLoginHeightPx, form?.faviconSizePx])

  const saveMut = useMutation({
    mutationFn: (body: PatchAdminBrandingBody) => patchAdminBranding(body),
    onSuccess: (data) => {
      setForm(data)
      invalidateBrandingCaches(qc)
      toast.success(t('branding.saved'))
    },
    onError: (e: Error) => toast.error(e.message || t('branding.saveFailed')),
  })

  const resetMut = useMutation({
    mutationFn: resetAdminBranding,
    onSuccess: (data) => {
      setForm(data)
      setLogoVersion((v) => v + 1)
      setFaviconVersion((v) => v + 1)
      setLoginBgVersion((v) => v + 1)
      setResetOpen(false)
      invalidateBrandingCaches(qc)
      toast.success(t('branding.resetOk'))
    },
    onError: (e: Error) => toast.error(e.message || t('branding.resetFailed')),
  })

  const logoUploadMut = useMutation({
    mutationFn: (file: File) =>
      uploadAdminBrandingLogo(file, { removeBackground: removeBgOnUpload }),
    onSuccess: async () => {
      setLogoLocalPreview(null)
      setLogoVersion((v) => v + 1)
      invalidateBrandingCaches(qc)
      const data = await q.refetch()
      if (data.data) setForm(data.data)
      toast.success(t('branding.logoUploaded'))
    },
    onError: (e: Error) => {
      setLogoLocalPreview(null)
      toast.error(e.message || t('branding.logoUploadFailed'))
    },
  })

  const logoDeleteMut = useMutation({
    mutationFn: deleteAdminBrandingLogo,
    onSuccess: () => {
      setLogoVersion((v) => v + 1)
      invalidateBrandingCaches(qc)
      void q.refetch()
      toast.success(t('branding.logoDeleted'))
    },
    onError: (e: Error) => toast.error(e.message || t('branding.logoDeleteFailed')),
  })

  const faviconUploadMut = useMutation({
    mutationFn: (file: File) =>
      uploadAdminBrandingFavicon(file, { removeBackground: removeBgOnUpload }),
    onSuccess: async () => {
      setFaviconLocalPreview(null)
      setFaviconVersion((v) => v + 1)
      invalidateBrandingCaches(qc)
      const data = await q.refetch()
      if (data.data) {
        setForm(data.data)
        applyFavicon(data.data.hasFavicon, {
          cacheKey: Date.now(),
          sizePx: data.data.faviconSizePx,
        })
      }
      toast.success(t('branding.faviconUploaded'))
    },
    onError: (e: Error) => {
      setFaviconLocalPreview(null)
      toast.error(e.message || t('branding.faviconUploadFailed'))
    },
  })

  const faviconDeleteMut = useMutation({
    mutationFn: deleteAdminBrandingFavicon,
    onSuccess: () => {
      setFaviconVersion((v) => v + 1)
      invalidateBrandingCaches(qc)
      void q.refetch()
      toast.success(t('branding.faviconDeleted'))
    },
    onError: (e: Error) => toast.error(e.message || t('branding.faviconDeleteFailed')),
  })

  const loginBgUploadMut = useMutation({
    mutationFn: uploadAdminBrandingLoginBackground,
    onSuccess: async () => {
      setLoginBgVersion((v) => v + 1)
      setForm((f) => (f ? { ...f, hasLoginBackground: true } : f))
      invalidateBrandingCaches(qc)
      try {
        const data = await q.refetch()
        if (data.data) setForm(data.data)
      } catch {
        /* keep optimistic hasLoginBackground if refetch is slow/fails */
      }
      setLoginBgLocalPreview(null)
      toast.success(t('branding.loginBgUploaded'))
    },
    onError: (e: Error) => toast.error(e.message || t('branding.loginBgUploadFailed')),
  })

  const loginBgDeleteMut = useMutation({
    mutationFn: deleteAdminBrandingLoginBackground,
    onSuccess: () => {
      setLoginBgVersion((v) => v + 1)
      setLoginBgLocalPreview(null)
      setForm((f) => (f ? { ...f, hasLoginBackground: false } : f))
      invalidateBrandingCaches(qc)
      void q.refetch()
      toast.success(t('branding.loginBgDeleted'))
    },
    onError: (e: Error) => toast.error(e.message || t('branding.loginBgDeleteFailed')),
  })

  const logoPreviewSrc = useMemo(() => {
    if (logoLocalPreview) return logoLocalPreview
    if (!form?.hasLogo) return null
    return `${publicLogoUrl()}?v=${logoVersion}`
  }, [logoLocalPreview, form?.hasLogo, logoVersion])

  const faviconPreviewSrc = useMemo(() => {
    if (faviconLocalPreview) return faviconLocalPreview
    if (!form?.hasFavicon) return null
    return `${publicFaviconUrl()}?v=${faviconVersion}`
  }, [faviconLocalPreview, form?.hasFavicon, faviconVersion])

  const loginBgPreviewSrc = useMemo(() => {
    if (loginBgLocalPreview) return loginBgLocalPreview
    if (!form?.hasLoginBackground) return null
    return publicLoginBackgroundUrl(loginBgVersion)
  }, [form?.hasLoginBackground, loginBgLocalPreview, loginBgVersion])

  const dirty =
    form &&
    q.data &&
    (form.appName !== q.data.appName ||
      form.footerText !== q.data.footerText ||
      form.primaryColor !== q.data.primaryColor ||
      form.accentColor !== q.data.accentColor ||
      form.successColor !== q.data.successColor ||
      form.warningColor !== q.data.warningColor ||
      form.dangerColor !== q.data.dangerColor ||
      form.infoColor !== q.data.infoColor ||
      form.themeMode !== q.data.themeMode ||
      form.logoNavHeightPx !== q.data.logoNavHeightPx ||
      form.logoLoginHeightPx !== q.data.logoLoginHeightPx ||
      form.faviconSizePx !== q.data.faviconSizePx ||
      form.fontFamily !== q.data.fontFamily ||
      form.fontSizePreset !== q.data.fontSizePreset ||
      form.fontSizeBasePx !== q.data.fontSizeBasePx ||
      form.fontColor !== q.data.fontColor ||
      form.fontHeadingColor !== q.data.fontHeadingColor ||
      form.fontMutedColor !== q.data.fontMutedColor)

  const onSave = () => {
    if (!form || !q.data) return
    const body: PatchAdminBrandingBody = {}
    if (form.appName !== q.data.appName) body.appName = form.appName
    if (form.footerText !== q.data.footerText) body.footerText = form.footerText
    if (form.primaryColor !== q.data.primaryColor) body.primaryColor = form.primaryColor
    if (form.accentColor !== q.data.accentColor) body.accentColor = form.accentColor
    if (form.successColor !== q.data.successColor) body.successColor = form.successColor
    if (form.warningColor !== q.data.warningColor) body.warningColor = form.warningColor
    if (form.dangerColor !== q.data.dangerColor) body.dangerColor = form.dangerColor
    if (form.infoColor !== q.data.infoColor) body.infoColor = form.infoColor
    if (form.themeMode !== q.data.themeMode) body.themeMode = form.themeMode
    if (form.logoNavHeightPx !== q.data.logoNavHeightPx) body.logoNavHeightPx = form.logoNavHeightPx
    if (form.logoLoginHeightPx !== q.data.logoLoginHeightPx) body.logoLoginHeightPx = form.logoLoginHeightPx
    if (form.faviconSizePx !== q.data.faviconSizePx) body.faviconSizePx = form.faviconSizePx
    if (form.fontFamily !== q.data.fontFamily) body.fontFamily = form.fontFamily
    if (form.fontSizePreset !== q.data.fontSizePreset) body.fontSizePreset = form.fontSizePreset
    if (form.fontSizeBasePx !== q.data.fontSizeBasePx) body.fontSizeBasePx = form.fontSizeBasePx
    if (form.fontColor !== q.data.fontColor) body.fontColor = form.fontColor
    if (form.fontHeadingColor !== q.data.fontHeadingColor) body.fontHeadingColor = form.fontHeadingColor
    if (form.fontMutedColor !== q.data.fontMutedColor) body.fontMutedColor = form.fontMutedColor
    if (Object.keys(body).length === 0) {
      toast.message(t('shared.noChanges'))
      return
    }
    saveMut.mutate(body)
  }

  const onLogoFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (logoLocalPreview) URL.revokeObjectURL(logoLocalPreview)
    setLogoLocalPreview(URL.createObjectURL(file))
    setForm((f) => (f ? { ...f, hasLogo: true } : f))
    logoUploadMut.mutate(file)
  }

  const onFaviconFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (faviconLocalPreview) URL.revokeObjectURL(faviconLocalPreview)
    setFaviconLocalPreview(URL.createObjectURL(file))
    setForm((f) => (f ? { ...f, hasFavicon: true } : f))
    faviconUploadMut.mutate(file)
  }

  const onLoginBgFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (loginBgLocalPreview) URL.revokeObjectURL(loginBgLocalPreview)
    setLoginBgLocalPreview(URL.createObjectURL(file))
    loginBgUploadMut.mutate(file)
  }

  if (!canRead && !canWrite) {
    return (
      <AdminPageRoot tourTarget="admin-branding">
        <AdminAccessDenied permission="admin.branding.read" />
      </AdminPageRoot>
    )
  }

  return (
    <AdminPageShell
      tourTarget="admin-branding"
      title={t('branding.title')}
      description={t('branding.description')}
      hints={hintsFromT(t, 'branding.hints')}
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
            <RefreshCcw className={`mr-1 size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} aria-hidden />
            {t('shared.refresh')}
          </Button>
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
                {t('branding.resetStandard')}
              </Button>
              <Button
                type="button"
                className="admin-toolbar-btn"
                disabled={!dirty || saveMut.isPending}
                onClick={onSave}
              >
                <Save className="mr-2 size-4" aria-hidden />
                {tc('actions.save')}
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
            title={t('branding.loadFailed')}
            description={(q.error as Error).message}
            action={{ label: tc('actions.retry'), onClick: () => void q.refetch() }}
          />
        ) : form ? (
          <>
            <ThemePreviewCard form={form} logoPreviewSrc={logoPreviewSrc} />

            <TypographyCard
              form={form}
              disabled={!canWrite}
              onChange={(patch) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('branding.appFooterTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="appName">{t('branding.appName')}</Label>
                    <Input
                      id="appName"
                      value={form.appName}
                      disabled={!canWrite}
                      onChange={(e) => setForm({ ...form, appName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footerText">{t('branding.footerText')}</Label>
                    <Input
                      id="footerText"
                      value={form.footerText}
                      disabled={!canWrite}
                      onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('branding.themeModeTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {THEME_MODES.map((m) => (
                      <Button
                        key={m.value}
                        type="button"
                        size="sm"
                        variant={form.themeMode === m.value ? 'default' : 'outline'}
                        disabled={!canWrite}
                        onClick={() => setForm({ ...form, themeMode: m.value })}
                      >
                        {t(`branding.themeMode.${m.value}`)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ColorPickerCard
                primaryColor={form.primaryColor}
                accentColor={form.accentColor}
                canWrite={canWrite}
                onPrimaryChange={(primaryColor) => setForm({ ...form, primaryColor })}
                onAccentChange={(accentColor) => setForm({ ...form, accentColor })}
                onPreset={(primaryColor, accentColor) => setForm({ ...form, primaryColor, accentColor })}
              />

              <SemanticColorCard
                successColor={form.successColor}
                warningColor={form.warningColor}
                dangerColor={form.dangerColor}
                infoColor={form.infoColor}
                canWrite={canWrite}
                onSuccessChange={(successColor) => setForm({ ...form, successColor })}
                onWarningChange={(warningColor) => setForm({ ...form, warningColor })}
                onDangerChange={(dangerColor) => setForm({ ...form, dangerColor })}
                onInfoChange={(infoColor) => setForm({ ...form, infoColor })}
              />

              <LoginBackgroundCard
                hasLoginBackground={form.hasLoginBackground}
                previewSrc={loginBgPreviewSrc}
                canWrite={canWrite}
                uploadPending={loginBgUploadMut.isPending}
                deletePending={loginBgDeleteMut.isPending}
                onFileSelect={onLoginBgFile}
                onDelete={() => loginBgDeleteMut.mutate()}
              />

              <LogoUploadCard
                hasLogo={form.hasLogo}
                logoPreviewSrc={logoPreviewSrc}
                logoNavHeightPx={form.logoNavHeightPx}
                logoLoginHeightPx={form.logoLoginHeightPx}
                canWrite={canWrite}
                removeBackground={removeBgOnUpload}
                onRemoveBackgroundChange={setRemoveBgOnUpload}
                uploadPending={logoUploadMut.isPending}
                deletePending={logoDeleteMut.isPending}
                onFileSelect={onLogoFile}
                onDelete={() => logoDeleteMut.mutate()}
              />

              <Card>
                <CardHeader>
                  <CardTitle>{t('branding.logoSizeTitle')}</CardTitle>
                  <CardDescription>{t('branding.logoSizeDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <BrandingAssetSizeCard
                    form={form}
                    disabled={!canWrite}
                    onChange={(patch) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('branding.faviconTitle')}</CardTitle>
                  <CardDescription>
                    {t('branding.faviconDesc', { size: form.faviconSizePx })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {faviconPreviewSrc ? (
                      <img
                        src={faviconPreviewSrc}
                        alt=""
                        className="rounded ring-1 ring-app"
                        style={{
                          width: form.faviconSizePx,
                          height: form.faviconSizePx,
                        }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center rounded bg-app-muted text-xs text-app-muted"
                        style={{ width: form.faviconSizePx, height: form.faviconSizePx }}
                      >
                        —
                      </div>
                    )}
                    <div className="text-caption">
                      <p>
                        {faviconPreviewSrc
                          ? faviconUploadMut.isPending
                            ? t('branding.faviconUploading')
                            : t('branding.faviconCustom')
                          : t('branding.faviconDefault')}
                      </p>
                      {form.hasFavicon ? (
                        <p className="mt-1 text-xs text-app-muted">{t('branding.faviconTabHint')}</p>
                      ) : null}
                    </div>
                  </div>
                  {canWrite ? (
                    <label className="flex cursor-pointer items-center gap-2 text-body-sm text-app">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-app"
                        checked={removeBgOnUpload}
                        onChange={(e) => setRemoveBgOnUpload(e.target.checked)}
                      />
                      {t('branding.removeLightBg')}
                    </label>
                  ) : null}
                  {canWrite ? (
                    <div className="flex flex-wrap gap-2">
                      <Label
                        className={cn(
                          'inline-flex cursor-pointer items-center gap-2 rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm font-medium hover:bg-app-subtle',
                          faviconUploadMut.isPending && 'pointer-events-none opacity-60',
                        )}
                      >
                        <Upload className="size-4" aria-hidden />
                        {t('branding.uploadFavicon')}
                        <input
                          type="file"
                          accept="image/*,.ico"
                          className="sr-only"
                          onChange={onFaviconFile}
                        />
                      </Label>
                      {form.hasFavicon ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={faviconDeleteMut.isPending}
                          onClick={() => faviconDeleteMut.mutate()}
                        >
                          {t('branding.deleteFavicon')}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

      <AlertDialog
        open={resetOpen}
        onOpenChange={(open) => {
          if (!open && !resetMut.isPending) setResetOpen(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('branding.resetStandard')}</AlertDialogTitle>
            <AlertDialogDescription>{t('branding.resetConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMut.isPending}>{tc('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={resetMut.isPending}
              onClick={(e) => {
                e.preventDefault()
                resetMut.mutate()
              }}
            >
              {t('branding.resetStandard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  )
}
