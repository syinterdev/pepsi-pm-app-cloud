/** Framer Motion presets — หน้า Login (liquid glass) */
export const loginEase = [0.22, 1, 0.36, 1] as const

export const loginLogoMotion = {
  initial: { opacity: 0, y: -18, scale: 0.92, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: loginEase },
  },
}

export const loginCardMotion = {
  initial: { opacity: 0, y: 32, scale: 0.94, rotateX: 6 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.72, delay: 0.1, ease: loginEase },
  },
}

export const loginToolbarMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, delay: 0.35, ease: loginEase } },
}
