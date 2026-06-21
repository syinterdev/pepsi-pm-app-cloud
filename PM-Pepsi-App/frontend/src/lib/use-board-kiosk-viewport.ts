import { useCallback, useEffect, useState } from 'react'

const ROOT_CLASS = 'board-kiosk-root'

/** ล็อก viewport สำหรับ /board — ไม่ scroll ทั้งหน้าแอป */
export function useBoardKioskViewport() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenElement),
  )

  useEffect(() => {
    document.documentElement.classList.add(ROOT_CLASS)
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      document.documentElement.classList.remove(ROOT_CLASS)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      /* บางเบราว์เซอร์ต้องกด F11 เอง */
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}
