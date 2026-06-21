import { resolvePostLoginPath } from '@/features/auth/auth-paths'
import { LoginBackdrop } from '@/features/auth/LoginBackdrop'
import { loginCardMotion, loginLogoMotion, loginToolbarMotion } from '@/features/auth/login-motion'
import { LoginFeedbackDialog } from '@/components/auth/LoginFeedbackDialog'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { usePublicSettings } from '@/providers/SettingsProvider'
import { publicLogoUrl } from '@/lib/settings-api'
import { logoLoginStyle } from '@/lib/branding-asset-css'
import { PepsiBrandMark } from '@/components/brand/PepsiBrandMark'
import { loginWithApi } from '@/features/auth/login-api'
import type { AuthFeedbackState } from '@/lib/auth-api-error'
import { resolveAuthFeedback } from '@/lib/auth-api-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { ExternalLink } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

type LoginForm = { username: string; password: string }

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { settings, brandingCacheKey } = usePublicSettings()
  const appName = settings?.appName?.trim() || 'PM Pepsi'
  const hasLogo = Boolean(settings?.hasLogo)
  const hasLoginBackground = Boolean(settings?.hasLoginBackground)
  const logoSrc = hasLogo ? publicLogoUrl(brandingCacheKey) : null

  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<AuthFeedbackState | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [postLoginPath, setPostLoginPath] = useState<string | null>(null)
  const [cardShake, setCardShake] = useState(false)

  const loginSchema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t('auth.usernameRequired')),
        password: z.string().min(1, t('auth.passwordRequired')),
      }),
    [t],
  )

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const closeFeedback = useCallback(() => {
    setFeedbackOpen(false)
    setFeedback(null)
    setPostLoginPath(null)
  }, [])

  const showFeedback = useCallback((state: AuthFeedbackState) => {
    setFeedback(state)
    setFeedbackOpen(true)
    if (state.kind === 'invalid' || state.kind === 'lockout') {
      setCardShake(true)
      window.setTimeout(() => setCardShake(false), 500)
      form.setFocus('password')
    }
  }, [form])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const data = await loginWithApi(values.username, values.password, 'workcenter')
      const name = data.user.fullnameTh?.trim() || data.user.username
      const from = (location.state as { from?: { pathname?: string } } | null)?.from
      const target = resolvePostLoginPath(from?.pathname, 'workcenter', data.user.userst)
      setPostLoginPath(target)
      showFeedback({
        kind: 'success',
        title: t('auth.loginSuccess'),
        message: t('auth.hello', { name }),
      })
    } catch (err) {
      showFeedback(resolveAuthFeedback(err))
    } finally {
      setSubmitting(false)
    }
  })

  const onFeedbackConfirm = () => {
    if (feedback?.kind === 'success' && postLoginPath) {
      closeFeedback()
      navigate(postLoginPath, { replace: true })
      return
    }
    closeFeedback()
  }

  return (
    <div className="login-page">
      <LoginBackdrop
        hasLoginBackground={hasLoginBackground}
        brandingCacheKey={brandingCacheKey}
      />

      <div className="login-page__glow login-page__glow--accent" aria-hidden />
      <div className="login-page__glow login-page__glow--primary" aria-hidden />

      <motion.div className="login-page__toolbar flex items-center gap-2" {...loginToolbarMotion}>
        <LanguageSwitcher />
        <ThemeToggle />
      </motion.div>

      <div className="login-page__center">
        <motion.div className="login-page__logo-wrap" {...loginLogoMotion}>
          {hasLogo && logoSrc ? (
            <img
              key={logoSrc}
              src={logoSrc}
              alt={appName}
              className="login-page__logo object-contain"
              style={logoLoginStyle(settings?.logoLoginHeightPx)}
            />
          ) : (
            <PepsiBrandMark size="lg" />
          )}
        </motion.div>

        <motion.div
          className={cn('login-page__card', cardShake && 'login-page__card--shake')}
          {...loginCardMotion}
          whileHover={{ y: -4, transition: { duration: 0.35 } }}
        >
          <div className="login-page__card-shine" aria-hidden />
          <div className="login-page__card-inner">
            <div className="login-page__card-header">
              <p className="text-eyebrow">{appName}</p>
              <h1 className="login-page__title text-heading-page font-semibold">
                {t('auth.signInTitle')}
              </h1>
            </div>

            <form onSubmit={onSubmit} className="login-page__form mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="login-page__label">
                  {t('auth.username')}
                </Label>
                <Input
                  id="login-username"
                  className="login-page__input"
                  autoComplete="username"
                  placeholder={t('auth.usernamePlaceholder')}
                  disabled={submitting || feedbackOpen}
                  {...form.register('username')}
                />
                {form.formState.errors.username ? (
                  <p className="text-body-sm text-form-error">{form.formState.errors.username.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="login-page__label">
                  {t('auth.password')}
                </Label>
                <Input
                  id="login-password"
                  className="login-page__input"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  disabled={submitting || feedbackOpen}
                  {...form.register('password')}
                />
                {form.formState.errors.password ? (
                  <p className="text-body-sm text-form-error">{form.formState.errors.password.message}</p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="login-page__submit w-full"
                disabled={submitting || feedbackOpen}
              >
                {submitting ? t('auth.signingIn') : t('actions.login')}
              </Button>
            </form>

            <div className="login-page__footer mt-5 border-t border-[color-mix(in_srgb,var(--app-border)_55%,transparent)] pt-4">
              <Link to="/board" className="login-page__footer-link inline-flex items-center justify-center gap-1.5">
                <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
                {t('auth.openBoard')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <LoginFeedbackDialog
        open={feedbackOpen}
        state={feedback}
        onClose={closeFeedback}
        onConfirm={onFeedbackConfirm}
      />
    </div>
  )
}
