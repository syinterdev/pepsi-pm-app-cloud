/** Framer Motion presets — หน้า Portal hub */
export const portalEase = [0.22, 1, 0.36, 1] as const

export const portalHeroMotion = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: portalEase },
  },
}

export const portalGridMotion = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, delay: 0.12, ease: portalEase },
  },
}

export const portalCardMotion = (index: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.08 + index * 0.07, ease: portalEase },
  },
})

export const portalTopbarMotion = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: portalEase } },
}
