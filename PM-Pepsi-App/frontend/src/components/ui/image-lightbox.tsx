import { Button } from '@/components/ui/button'
import { Dialog, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useGesture } from '@use-gesture/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minus, Plus, X, ZoomIn } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

const MIN_SCALE = 1
const MAX_SCALE = 5
const ZOOM_STEP = 0.35

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

export type ImageLightboxProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  subtitle?: string
  src: string | null
  alt?: string
  loading?: boolean
  error?: string | null
  /** Gallery navigation — ArrowLeft / ArrowRight when provided */
  onPrevious?: () => void
  onNext?: () => void
  canPrevious?: boolean
  canNext?: boolean
  positionLabel?: string
}

export function ImageLightbox({
  open,
  onOpenChange,
  title,
  subtitle,
  src,
  alt = '',
  loading = false,
  error = null,
  onPrevious,
  onNext,
  canPrevious = false,
  canNext = false,
  positionLabel,
}: ImageLightboxProps) {
  const { t } = useTranslation('common')
  const resolvedTitle = title ?? t('imageLightbox.title')
  const closeRef = useRef<HTMLButtonElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const scaleRef = useRef(scale)
  const positionRef = useRef(position)
  scaleRef.current = scale
  positionRef.current = position

  const showGalleryNav = Boolean(onPrevious || onNext)

  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (open) resetView()
  }, [open, src, resetView])

  const zoomBy = useCallback((delta: number, origin?: { x: number; y: number }) => {
    setScale((prev) => {
      const next = clampScale(Number((prev + delta).toFixed(2)))
      if (next <= 1) {
        setPosition({ x: 0, y: 0 })
        return next
      }
      if (origin && viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect()
        const cx = origin.x - rect.left - rect.width / 2
        const cy = origin.y - rect.top - rect.height / 2
        const ratio = next / prev
        setPosition((pos) => ({
          x: cx - (cx - pos.x) * ratio,
          y: cy - (cy - pos.y) * ratio,
        }))
      }
      return next
    })
  }, [])

  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y], pinching, cancel }) => {
        if (pinching || scaleRef.current <= 1) {
          cancel()
          return
        }
        setPosition({ x, y })
      },
      onPinch: ({ offset: [s], memo = scaleRef.current }) => {
        const next = clampScale(s)
        setScale(next)
        if (next <= 1) setPosition({ x: 0, y: 0 })
        return memo
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault()
        const direction = dy > 0 ? -1 : 1
        zoomBy(direction * 0.12, { x: event.clientX, y: event.clientY })
      },
      onDoubleClick: ({ event }) => {
        event.preventDefault()
        if (scaleRef.current > 1.05) {
          resetView()
        } else {
          zoomBy(1.5, { x: event.clientX, y: event.clientY })
        }
      },
    },
    {
      drag: {
        from: () => [positionRef.current.x, positionRef.current.y],
        filterTaps: true,
      },
      pinch: {
        from: () => [scaleRef.current, 0],
        scaleBounds: { min: MIN_SCALE, max: MAX_SCALE },
        rubberband: true,
      },
      wheel: { eventOptions: { passive: false } },
    },
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft' && canPrevious && onPrevious) {
        e.preventDefault()
        onPrevious()
        return
      }
      if (e.key === 'ArrowRight' && canNext && onNext) {
        e.preventDefault()
        onNext()
      }
    },
    [canNext, canPrevious, onNext, onPrevious],
  )

  const zoomPercent = Math.round(scale * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogPortal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={handleKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            closeRef.current?.focus()
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-[121] flex max-h-[min(96vh,900px)] w-[min(96vw,1100px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden p-0',
            'rounded-2xl border border-neutral-800/80 bg-neutral-950 text-white shadow-2xl outline-none',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-neutral-900/90 px-3 py-2.5 backdrop-blur-md sm:px-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm font-semibold text-white sm:text-base">
                {resolvedTitle}
              </DialogTitle>
              {subtitle ? (
                <p className="truncate text-[11px] text-white/60 sm:text-xs">{subtitle}</p>
              ) : null}
              {positionLabel ? (
                <p className="mt-0.5 text-[11px] tabular-nums text-white/50">{positionLabel}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 p-0.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 text-white/90 hover:bg-white/10 hover:text-white"
                onClick={() => zoomBy(-ZOOM_STEP)}
                disabled={scale <= MIN_SCALE || loading || !src}
                aria-label={t('imageLightbox.zoomOut')}
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-[3rem] px-1 text-center text-xs tabular-nums text-white/80">
                {zoomPercent}%
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 text-white/90 hover:bg-white/10 hover:text-white"
                onClick={() => zoomBy(ZOOM_STEP)}
                disabled={scale >= MAX_SCALE || loading || !src}
                aria-label={t('imageLightbox.zoomIn')}
              >
                <Plus className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 text-white/90 hover:bg-white/10 hover:text-white"
                onClick={resetView}
                disabled={
                  loading || !src || (scale === 1 && position.x === 0 && position.y === 0)
                }
                aria-label={t('imageLightbox.fitScreen')}
              >
                <Maximize2 className="size-3.5" />
              </Button>
            </div>

            <Button
              ref={closeRef}
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 text-white/90 hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
              aria-label={t('imageLightbox.close')}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div
            ref={viewportRef}
            {...bind()}
            className={cn(
              'relative flex min-h-[min(62vh,640px)] flex-1 touch-none select-none items-center justify-center overflow-hidden',
              'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_0%,transparent_55%),linear-gradient(180deg,#171717_0%,#0a0a0a_100%)]',
              scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
            )}
          >
            {showGalleryNav && canPrevious ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute left-2 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 text-white hover:bg-black/60"
                onClick={onPrevious}
                aria-label={t('imageLightbox.prevImage')}
              >
                <ChevronLeft className="size-5" />
              </Button>
            ) : null}
            {showGalleryNav && canNext ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 text-white hover:bg-black/60"
                onClick={onNext}
                aria-label={t('imageLightbox.nextImage')}
              >
                <ChevronRight className="size-5" />
              </Button>
            ) : null}

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 text-white/70"
                >
                  <Loader2 className="size-8 animate-spin" aria-hidden />
                  <span className="text-sm">{t('imageLightbox.loading')}</span>
                </motion.div>
              ) : error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 text-center text-sm text-form-error"
                >
                  {error}
                </motion.p>
              ) : src ? (
                <motion.img
                  key={src}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  alt={alt}
                  draggable={false}
                  className="max-h-[min(62vh,640px)] max-w-full origin-center will-change-transform"
                  style={{
                    transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                  }}
                  src={src}
                />
              ) : (
                <Skeleton key="empty" className="h-64 w-64 rounded-xl bg-white/10" />
              )}
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-neutral-900/90 px-3 py-2 text-[11px] text-white/55 backdrop-blur-md sm:px-4 sm:text-xs">
            <span className="flex items-center gap-1.5">
              <ZoomIn className="size-3.5 shrink-0 opacity-70" aria-hidden />
              {t('imageLightbox.help')}
            </span>
            <span className="hidden text-right sm:inline">
              {showGalleryNav && (canPrevious || canNext)
                ? t('imageLightbox.keyboardNav')
                : t('imageLightbox.escClose')}
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
