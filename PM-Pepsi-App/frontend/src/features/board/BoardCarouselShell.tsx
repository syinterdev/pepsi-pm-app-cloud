import {
  BOARD_CAROUSEL_INTERVAL_MS,
  type BoardCarouselSlide,
} from '@/lib/board-carousel'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  enabled: boolean
  slide: BoardCarouselSlide
  paused: boolean
  onPauseChange: (paused: boolean) => void
  onGoTo: (slide: BoardCarouselSlide) => void
  zoneA: ReactNode
  zoneB: ReactNode
  zoneC: ReactNode
}

const SLIDE_LABEL_KEYS: Record<BoardCarouselSlide, 'carousel.labelA' | 'carousel.labelB' | 'carousel.labelC'> = {
  a: 'carousel.labelA',
  b: 'carousel.labelB',
  c: 'carousel.labelC',
}

export function BoardCarouselShell({
  enabled,
  slide,
  paused,
  onPauseChange,
  onGoTo,
  zoneA,
  zoneB,
  zoneC,
}: Props) {
  const { t } = useTranslation('board')

  if (!enabled) {
    return (
      <>
        {zoneA}
        {zoneB}
        {zoneC}
      </>
    )
  }

  const slides: { id: BoardCarouselSlide; node: ReactNode }[] = [
    { id: 'a', node: zoneA },
    { id: 'b', node: zoneB },
    { id: 'c', node: zoneC },
  ]

  return (
    <div className="engineering-board__carousel" aria-live="polite">
      <nav className="engineering-board__carousel-nav" aria-label={t('carousel.navAria')}>
        <span className="engineering-board__zone-tag">{t('carousel.zoneD')}</span>
        <div className="engineering-board__carousel-dots">
          {slides.map(({ id }) => (
            <button
              key={id}
              type="button"
              className={
                slide === id
                  ? 'engineering-board__carousel-dot engineering-board__carousel-dot--active'
                  : 'engineering-board__carousel-dot'
              }
              aria-current={slide === id ? 'true' : undefined}
              aria-label={t('carousel.zoneSlideAria', {
                zone: id.toUpperCase(),
                label: t(SLIDE_LABEL_KEYS[id]),
              })}
              onClick={() => onGoTo(id)}
            />
          ))}
        </div>
        <span className="engineering-board__carousel-label">
          {t(SLIDE_LABEL_KEYS[slide])} · {slide.toUpperCase()} ·{' '}
          {t('carousel.everySeconds', { seconds: BOARD_CAROUSEL_INTERVAL_MS / 1000 })}
        </span>
        <button
          type="button"
          className="engineering-board__carousel-pause"
          onClick={() => onPauseChange(!paused)}
        >
          {paused ? t('carousel.resume') : t('carousel.pause')}
        </button>
      </nav>

      <div className="engineering-board__carousel-viewport">
        {slides.map(({ id, node }) => (
          <div
            key={id}
            className={
              slide === id
                ? 'engineering-board__carousel-slide engineering-board__carousel-slide--active'
                : 'engineering-board__carousel-slide'
            }
            aria-hidden={slide !== id}
            inert={slide !== id ? true : undefined}
          >
            {node}
          </div>
        ))}
      </div>

      <div className="engineering-board__carousel-progress" aria-hidden key={slide}>
        <div
          className="engineering-board__carousel-progress-bar"
          style={{
            animationDuration: paused ? undefined : `${BOARD_CAROUSEL_INTERVAL_MS}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  )
}
