/** Framer Motion presets — หน้า HTTP / Unexpected error */
export const errorEase = [0.22, 1, 0.36, 1] as const

export const errorPageStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
}

export const errorPageItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: errorEase },
  },
}

export const errorIconMotion = {
  initial: { scale: 0.75, opacity: 0, rotate: -8 },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: { type: 'spring' as const, stiffness: 220, damping: 18, delay: 0.12 },
  },
}

export const errorCardMotion = {
  initial: { opacity: 0, y: 28, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, delay: 0.22, ease: errorEase },
  },
}
