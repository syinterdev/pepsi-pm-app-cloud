import {
  SchedulingPageSection,
  SchedulingSection,
} from '@/components/scheduling/SchedulingPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDeleteAlertDialog } from '@/components/ui/confirm-delete-alert-dialog'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  deleteConfirmationImage,
  fetchConfirmationImageData,
  fetchConfirmationImages,
  postConfirmationImage,
  type ConfirmationImagePhase,
} from '@/lib/api-public'
import { CONFIRM_IMAGE_RECOMMENDED_PER_PHASE } from '@/lib/confirm-image-limits'
import {
  listKpiStaggerCardItemMotion,
  listKpiStaggerItemMotion,
  listKpiStaggerRootMotion,
} from '@/lib/list-kpi-stagger'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Camera,
  Eye,
  ImageIcon,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export { CONFIRM_IMAGE_RECOMMENDED_PER_PHASE } from '@/lib/confirm-image-limits'

const PHASE_META: {
  phase: ConfirmationImagePhase
  titleKey: 'images.phaseAfterTitle'
  hintKey: 'images.phaseAfterHint'
  icon: typeof ImagePlus
  tone: 'after'
}[] = [
  {
    phase: 'after',
    titleKey: 'images.phaseAfterTitle',
    hintKey: 'images.phaseAfterHint',
    icon: ImagePlus,
    tone: 'after',
  },
]

type ConfirmationImageItem = Awaited<ReturnType<typeof fetchConfirmationImages>>[number]

function phaseToneClass(tone: 'before' | 'after') {
  return tone === 'before' ? 'app-tone-warning-section border' : 'app-tone-success-section border'
}

function phaseBadgeClass(tone: 'before' | 'after') {
  return tone === 'before' ? 'app-tone-warning-badge border' : 'app-tone-success-badge border'
}

function ImageThumbnail({
  idcimg,
  alt,
  className,
}: {
  idcimg: number
  alt: string
  className?: string
}) {
  const q = useQuery({
    queryKey: ['confirmation', 'image-data', idcimg],
    queryFn: () => fetchConfirmationImageData(idcimg),
    staleTime: 5 * 60 * 1000,
  })

  if (q.isLoading) {
    return <Skeleton className={cn('size-full', className)} />
  }

  if (q.isError || !q.data) {
    return (
      <div
        className={cn(
          'flex size-full items-center justify-center bg-app-subtle text-app-muted',
          className,
        )}
      >
        <ImageIcon className="size-8 opacity-40" aria-hidden />
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={cn('size-full object-cover', className)}
      src={`data:${q.data.mime};base64,${q.data.base64}`}
      loading="lazy"
    />
  )
}

function ImageGalleryCard({
  img,
  idiw37,
  onView,
  readOnly,
  listItemCount,
}: {
  img: ConfirmationImageItem
  idiw37: number
  onView: (idcimg: number) => void
  readOnly?: boolean
  listItemCount?: number
}) {
  const { t } = useTranslation('confirmation')
  const reduceMotion = useReducedMotion()
  const qc = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const delMut = useMutation({
    mutationFn: () => deleteConfirmationImage(img.idcimg),
    onSuccess: async () => {
      setDeleteOpen(false)
      await qc.invalidateQueries({ queryKey: ['confirmation', 'images', idiw37] })
      await qc.invalidateQueries({ queryKey: ['confirmation-images', idiw37] })
    },
  })

  const label = img.originalName || img.fileName

  return (
    <motion.li
      {...listKpiStaggerCardItemMotion(reduceMotion, listItemCount)}
      className="group overflow-hidden rounded-xl border border-app/70 app-surface-panel shadow-sm transition-shadow hover:shadow-md"
    >
      <button
        type="button"
        className="relative block aspect-[4/3] w-full overflow-hidden bg-app-subtle"
        onClick={() => onView(img.idcimg)}
      >
        <ImageThumbnail idcimg={img.idcimg} alt={label} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
          <Eye className="size-7 text-white drop-shadow" aria-hidden />
        </span>
      </button>
      <div className="space-y-1 p-2.5">
        <p className="truncate text-xs font-medium text-app" title={label}>
          {label}
        </p>
        {img.comment ? (
          <p className="line-clamp-2 text-[11px] leading-snug text-app-muted">{img.comment}</p>
        ) : null}
        <p className="text-[10px] text-app-muted">
          {img.wkctr} · {new Date(img.createdAt).toLocaleString('th-TH')}
        </p>
        <div className="flex gap-1.5 pt-0.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-xs"
            onClick={() => onView(img.idcimg)}
          >
            <Eye className="size-3" aria-hidden />
            {t('images.view')}
          </Button>
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="app-tone-danger-btn-ghost h-7 px-2"
              disabled={delMut.isPending}
              onClick={() => setDeleteOpen(true)}
              aria-label={t('images.deletePhotoAria')}
            >
              {delMut.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
            </Button>
          ) : null}
        </div>
      </div>
      <ConfirmDeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('images.deletePhotoTitle')}
        description={t('images.deletePhotoDescription')}
        loading={delMut.isPending}
        onConfirm={() => delMut.mutate()}
      />
    </motion.li>
  )
}

function UploadDropZone({
  phase,
  files,
  onFilesChange,
  disabled,
}: {
  phase: ConfirmationImagePhase
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}) {
  const { t } = useTranslation('confirmation')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={`img-files-${phase}`}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(e) => onFilesChange(Array.from(e.target.files ?? []))}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'app-tone-success-soft flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          'hover:border-[color-mix(in_srgb,var(--status-success)_45%,var(--app-border))]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className="app-tone-success-card-index flex size-10 items-center justify-center rounded-full shadow-sm ring-1 ring-[color-mix(in_srgb,var(--status-success)_28%,var(--app-border))]">
          <Upload className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-medium text-app">{t('images.pickFromDevice')}</span>
        <span className="max-w-sm text-xs text-app-muted">{t('images.fileTypesHint')}</span>
      </button>
      {files.length > 0 ? (
        <div className="app-tone-success-soft flex flex-wrap gap-1.5 rounded-lg border border-app p-2">
          {files.map((f) => (
            <Badge
              key={`${f.name}-${f.size}`}
              variant="outline"
              className="app-tone-success-badge max-w-full truncate text-[11px] font-normal"
            >
              {f.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

type PhaseUploadBlockProps = {
  phase: ConfirmationImagePhase
  title: string
  hint: string
  icon: typeof Camera
  tone: 'before' | 'after'
  sectionIndex: number
  idiw37: number
  items: ConfirmationImageItem[]
  onView: (idcimg: number) => void
  readOnly?: boolean
}

function PhaseUploadBlock({
  phase,
  title,
  hint,
  icon: Icon,
  tone,
  sectionIndex,
  idiw37,
  items,
  onView,
  readOnly,
}: PhaseUploadBlockProps) {
  const { t } = useTranslation('confirmation')
  const reduceMotion = useReducedMotion()
  const qc = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadMut = useMutation({
    mutationFn: async () => {
      setUploadError(null)
      for (const file of files) {
        await postConfirmationImage(idiw37, file, { phase, caption })
      }
    },
    onSuccess: async () => {
      setFiles([])
      setCaption('')
      await qc.invalidateQueries({ queryKey: ['confirmation', 'images', idiw37] })
      await qc.invalidateQueries({ queryKey: ['confirmation-images', idiw37] })
    },
    onError: (err: Error) => setUploadError(err.message),
  })

  return (
    <SchedulingPageSection index={sectionIndex}>
      <SchedulingSection
        icon={Icon}
        title={title}
        description={hint}
        badge={
          <Badge variant="outline" className={cn('border text-[10px]', phaseBadgeClass(tone))}>
            {t('images.photoCount', { count: items.length })}
          </Badge>
        }
        className={phaseToneClass(tone)}
      >
        <p className="mb-3 text-xs text-app-muted">
          {t('images.recommendedPerPhase', { count: CONFIRM_IMAGE_RECOMMENDED_PER_PHASE })}
        </p>

        {!readOnly ? (
          <div className="app-tone-success-soft mb-4 space-y-3 rounded-xl border border-app app-surface-panel--soft p-3">
            <div className="space-y-1.5">
              <Label htmlFor={`img-caption-${phase}`} className="text-xs font-medium">
                {t('images.captionLabel')}
              </Label>
              <Textarea
                id={`img-caption-${phase}`}
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t('images.captionPlaceholder')}
                maxLength={500}
                className="resize-none bg-[var(--app-surface)]"
              />
            </div>
            <UploadDropZone
              phase={phase}
              files={files}
              onFilesChange={(next) => {
                setUploadError(null)
                setFiles(next)
              }}
              disabled={uploadMut.isPending}
            />
            {uploadError ? <p className="app-tone-danger-text text-xs">{uploadError}</p> : null}
            <Button
              type="button"
              className="app-tone-success-fill w-full sm:w-auto"
              disabled={!files.length || uploadMut.isPending}
              onClick={() => uploadMut.mutate()}
            >
              {uploadMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t('images.uploading')}
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  {files.length > 0
                    ? t('images.uploadCount', { count: files.length })
                    : t('images.upload')}
                </>
              )}
            </Button>
          </div>
        ) : null}

        {items.length > 0 ? (
          <motion.ul
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            {...listKpiStaggerRootMotion(reduceMotion, items.length)}
          >
            {items.map((img) => (
              <ImageGalleryCard
                key={img.idcimg}
                img={img}
                idiw37={idiw37}
                onView={onView}
                readOnly={readOnly}
                listItemCount={items.length}
              />
            ))}
          </motion.ul>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-app/60 bg-app-subtle/50 px-4 py-8 text-center">
            <ImageIcon className="size-8 text-app-muted/50" aria-hidden />
            <p className="mt-2 text-sm text-app-muted">{t('images.noPhotosInPhase')}</p>
          </div>
        )}
      </SchedulingSection>
    </SchedulingPageSection>
  )
}

function ImageViewerLightbox({
  viewImage,
  images,
  onViewImageId,
  onClose,
  enabled,
}: {
  viewImage: ConfirmationImageItem | null
  images: ConfirmationImageItem[]
  onViewImageId: (id: number) => void
  onClose: () => void
  enabled: boolean
}) {
  const { t } = useTranslation('confirmation')
  const { t: tc } = useTranslation('common')
  const imageDataQ = useQuery({
    queryKey: ['confirmation', 'image-data', viewImage?.idcimg],
    queryFn: () => fetchConfirmationImageData(viewImage!.idcimg),
    enabled: enabled && viewImage != null,
  })

  const currentIndex =
    viewImage != null ? images.findIndex((img) => img.idcimg === viewImage.idcimg) : -1
  const canPrevious = currentIndex > 0
  const canNext = currentIndex >= 0 && currentIndex < images.length - 1

  const src = imageDataQ.data
    ? `data:${imageDataQ.data.mime};base64,${imageDataQ.data.base64}`
    : null

  const title = viewImage?.originalName || viewImage?.fileName || t('images.lightboxFallbackTitle')
  const subtitle = viewImage
    ? [
        viewImage.comment || null,
        viewImage.wkctr,
        new Date(viewImage.createdAt).toLocaleString('th-TH'),
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined

  return (
    <ImageLightbox
      open={viewImage != null}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      subtitle={subtitle}
      src={src}
      alt={title}
      loading={imageDataQ.isLoading}
      error={imageDataQ.isError ? (imageDataQ.error as Error).message : null}
      canPrevious={canPrevious}
      canNext={canNext}
      positionLabel={
        currentIndex >= 0 && images.length > 1
          ? tc('imageLightbox.position', { current: currentIndex + 1, total: images.length })
          : undefined
      }
      onPrevious={
        canPrevious
          ? () => onViewImageId(images[currentIndex - 1]!.idcimg)
          : undefined
      }
      onNext={canNext ? () => onViewImageId(images[currentIndex + 1]!.idcimg) : undefined}
    />
  )
}

export type ConfirmationImagesPanelProps = {
  idiw37: number | null | undefined
  enabled?: boolean
  readOnly?: boolean
}

export function ConfirmationImagesPanel({
  idiw37,
  enabled = true,
  readOnly = false,
}: ConfirmationImagesPanelProps) {
  const { t } = useTranslation('confirmation')
  const reduceMotion = useReducedMotion()
  const [viewImageId, setViewImageId] = useState<number | null>(null)
  const ready = enabled && typeof idiw37 === 'number' && Number.isFinite(idiw37)

  const imagesQ = useQuery({
    queryKey: ['confirmation', 'images', idiw37],
    queryFn: () => fetchConfirmationImages(idiw37!),
    enabled: ready,
  })

  const viewImage = useMemo(() => {
    if (viewImageId == null) return null
    return (imagesQ.data ?? []).find((i) => i.idcimg === viewImageId) ?? null
  }, [imagesQ.data, viewImageId])

  const grouped = useMemo(() => {
    const all = imagesQ.data ?? []
    return {
      after: all.filter((i) => i.phase === 'after'),
      legacy: all.filter((i) => i.phase !== 'after'),
    }
  }, [imagesQ.data])

  const totalCount = (imagesQ.data ?? []).length

  if (!ready) {
    return <p className="text-caption">{t('images.selectWoFirst')}</p>
  }

  const id = idiw37 as number

  return (
    <div className="space-y-4">
      <SchedulingPageSection index={0}>
        <motion.div
          layout={!reduceMotion}
          className="app-tone-success-section overflow-hidden rounded-card border p-4 shadow-[var(--app-shadow-card)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="app-tone-success-label flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <Camera className="size-3.5" aria-hidden />
                {t('images.panelTitle')}
              </p>
              <p className="mt-0.5 text-body-sm text-app-muted">{t('images.panelDesc')}</p>
            </div>
            <Badge variant="outline" className="app-tone-success-badge shrink-0">
              {t('images.totalPhotos', { count: totalCount })}
            </Badge>
          </div>
          <p className="app-tone-success-panel mt-3 rounded-button border px-3 py-2 text-xs">
            {t('images.afterOnlyPolicy')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <motion.div
              className="flex min-w-[8rem] flex-1 flex-wrap gap-2"
              {...listKpiStaggerRootMotion(reduceMotion)}
            >
              <motion.div
                {...listKpiStaggerItemMotion(reduceMotion)}
                className="app-tone-success-tile flex min-w-[8rem] flex-1 items-center gap-2 rounded-button border app-surface-panel--soft px-3 py-2"
              >
                <ImagePlus className="app-tone-success-icon size-4 shrink-0" aria-hidden />
                <div>
                  <p className="app-tone-success-label text-[10px] font-semibold uppercase tracking-wide">
                    {t('images.after')}
                  </p>
                  <p className="app-tone-success-strong text-sm font-bold tabular-nums">{grouped.after.length}</p>
                </div>
              </motion.div>
              {grouped.legacy.length > 0 ? (
                <motion.div
                  {...listKpiStaggerItemMotion(reduceMotion)}
                  className="app-tone-warning-tile flex min-w-[8rem] flex-1 items-center gap-2 rounded-button border app-surface-panel--soft px-3 py-2"
                >
                  <ImageIcon className="app-tone-warning-icon size-4 shrink-0" aria-hidden />
                  <div>
                    <p className="app-tone-warning-label text-[10px] font-semibold uppercase tracking-wide">
                      {t('images.legacy')}
                    </p>
                    <p className="app-tone-warning-strong text-sm font-bold tabular-nums">
                      {grouped.legacy.length}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
      </SchedulingPageSection>

      {imagesQ.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      ) : null}

      {imagesQ.isError ? (
        <p className="app-tone-danger-text text-body-sm">{(imagesQ.error as Error).message}</p>
      ) : null}

      {imagesQ.isSuccess ? (
        <>
          {PHASE_META.map(({ phase, titleKey, hintKey, icon, tone }, i) => (
            <PhaseUploadBlock
              key={phase}
              phase={phase}
              title={t(titleKey)}
              hint={t(hintKey)}
              icon={icon}
              tone={tone}
              sectionIndex={i + 1}
              idiw37={id}
              items={grouped.after}
              onView={setViewImageId}
              readOnly={readOnly}
            />
          ))}

          {grouped.legacy.length > 0 ? (
            <SchedulingPageSection index={3}>
              <SchedulingSection
                icon={ImageIcon}
                title={t('images.legacyTitle')}
                description={t('images.legacyDesc')}
                badge={
                  <Badge variant="outline" className="app-tone-warning-badge text-[10px]">
                    {t('images.legacyReadOnlyBadge')}
                  </Badge>
                }
                className="app-tone-warning-section border border-dashed"
              >
                <motion.ul
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  {...listKpiStaggerRootMotion(reduceMotion, grouped.legacy.length)}
                >
                  {grouped.legacy.map((img) => (
                    <ImageGalleryCard
                      key={img.idcimg}
                      img={img}
                      idiw37={id}
                      onView={setViewImageId}
                      readOnly
                      listItemCount={grouped.legacy.length}
                    />
                  ))}
                </motion.ul>
              </SchedulingSection>
            </SchedulingPageSection>
          ) : null}
        </>
      ) : null}

      <ImageViewerLightbox
        viewImage={viewImage}
        images={imagesQ.data ?? []}
        onViewImageId={setViewImageId}
        onClose={() => setViewImageId(null)}
        enabled={ready}
      />
    </div>
  )
}
