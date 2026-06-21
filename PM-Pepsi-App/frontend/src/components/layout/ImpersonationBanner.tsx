import { Button } from '@/components/ui/button'
import {
  AUTH_CHANGED_EVENT,
  endImpersonationSession,
  getStoredAuthUser,
  refreshAuthSession,
} from '@/features/auth/login-api'
import { fetchApi } from '@/lib/fetch-api'
import { IMPERSONATION_STARTED_KEY, IMPERSONATION_TTL_MS } from '@/lib/impersonation-session'
import { useCallback, useEffect, useState } from 'react'
import type { AuthUser } from '@/api/schemas'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'

export function ImpersonationBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser())
  const [remainingMin, setRemainingMin] = useState<number | null>(null)

  useEffect(() => {
    const sync = () => setUser(getStoredAuthUser())
    sync()
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync)
  }, [])

  const stopImpersonation = useCallback(async () => {
    try {
      await fetchApi('/api/v1/auth/impersonate/end', { method: 'POST' })
    } catch {
      /* audit best-effort */
    }
    if (endImpersonationSession()) {
      await refreshAuthSession()
      navigate('/admin/users')
    }
  }, [navigate])

  useEffect(() => {
    if (!user?.impersonatedBy) return

    const tick = () => {
      const raw = sessionStorage.getItem(IMPERSONATION_STARTED_KEY)
      const started = raw ? Number(raw) : Date.now()
      const left = IMPERSONATION_TTL_MS - (Date.now() - started)
      if (left <= 0) {
        void stopImpersonation()
        return
      }
      setRemainingMin(Math.ceil(left / 60_000))
    }

    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [user?.impersonatedBy, stopImpersonation])

  if (!user?.impersonatedBy) return null

  const displayName =
    [user.namewkctr, user.surnamewkctr].filter(Boolean).join(' ').trim() || user.username

  return (
    <div className="app-tone-warning-banner flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-body-sm">
      <span>
        <Trans
          i18nKey="impersonation.actingAs"
          values={{ name: displayName }}
          components={{ strong: <strong /> }}
        />
        {remainingMin != null ? (
          <span className="app-tone-warning-banner-muted ml-2">
            {t('impersonation.expiresIn', { min: remainingMin })}
          </span>
        ) : null}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="app-tone-warning-banner-btn"
        onClick={() => void stopImpersonation()}
      >
        {t('impersonation.stop')}
      </Button>
    </div>
  )
}
