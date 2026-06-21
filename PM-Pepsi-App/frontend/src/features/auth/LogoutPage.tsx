import { loginCardMotion } from '@/features/auth/login-motion'
import { clearStoredAuth, logoutWithApi } from '@/features/auth/login-api'
import { Loader2, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function LogoutPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  useEffect(() => {
    void (async () => {
      try {
        await logoutWithApi()
        toast.success(t('auth.logout.success'))
      } catch {
        clearStoredAuth()
      } finally {
        navigate('/login', { replace: true })
      }
    })()
  }, [navigate, t])

  return (
    <div className="login-page">
      <div className="login-page__glow login-page__glow--accent" aria-hidden />
      <div className="login-page__glow login-page__glow--primary" aria-hidden />

      <div className="login-page__center">
        <motion.div className="login-page__card" {...loginCardMotion}>
          <div className="login-page__card-shine" aria-hidden />
          <div className="login-page__card-inner">
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--app-accent)_16%,var(--app-surface))] text-[var(--app-accent)]">
                <LogOut className="size-6" aria-hidden />
              </div>
              <p className="text-body-sm font-medium text-app">{t('auth.logout.loggingOut')}</p>
              <p className="text-caption text-app-muted">{t('auth.logout.pleaseWait')}</p>
              <Loader2 className="size-8 animate-spin text-[var(--app-accent)]" aria-hidden />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
