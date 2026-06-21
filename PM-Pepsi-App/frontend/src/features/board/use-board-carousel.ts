import {
  BOARD_CAROUSEL_INTERVAL_MS,
  BOARD_CAROUSEL_SLIDES,
  type BoardCarouselSlide,
  nextBoardCarouselSlide,
} from '@/lib/board-carousel'
import { useCallback, useEffect, useState } from 'react'

type Options = {
  enabled: boolean
}

export function useBoardCarousel({ enabled }: Options) {
  const [slide, setSlide] = useState<BoardCarouselSlide>('a')
  const [paused, setPaused] = useState(false)

  const goNext = useCallback(() => {
    setSlide((s) => nextBoardCarouselSlide(s))
  }, [])

  const goTo = useCallback((target: BoardCarouselSlide) => {
    setSlide(target)
  }, [])

  useEffect(() => {
    if (!enabled || paused) return
    const id = window.setInterval(goNext, BOARD_CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled, paused, goNext])

  useEffect(() => {
    if (!enabled) setSlide('a')
  }, [enabled])

  return {
    slide,
    slides: BOARD_CAROUSEL_SLIDES,
    intervalMs: BOARD_CAROUSEL_INTERVAL_MS,
    paused,
    setPaused,
    goNext,
    goTo,
  }
}
