import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AUTH_CHANGED_EVENT } from '@/features/auth/login-api'
import { changePasswordResponseSchema } from '@/api/schemas'
import { fetchApi } from '@/lib/fetch-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function applySession(token: string, user: unknown) {
  sessionStorage.setItem('pm_auth_token', token)
  sessionStorage.setItem('pm_auth_user', JSON.stringify(user))
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function ChangePasswordForm() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)

  const mut = useMutation({
    mutationFn: async () => {
      const json = await fetchApi<unknown>('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      return changePasswordResponseSchema.parse(json)
    },
    onSuccess: (data) => {
      applySession(data.token, data.user)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(true)
    },
  })

  return (
    <div className="app-card app-card-pad space-y-4">
      <div>
        <h3 className="text-body-sm font-semibold text-app">{t('settings.password.title')}</h3>
        <p className="mt-1 text-xs text-app-muted">{t('settings.password.hint')}</p>
      </div>

      {success ? (
        <p className="app-tone-success-panel rounded-card border px-3 py-2 text-body-sm">
          {t('settings.password.success')}
        </p>
      ) : null}

      <div className="grid max-w-md gap-3">
        <div className="space-y-1">
          <Label htmlFor="pwd-current">{t('settings.password.current')}</Label>
          <Input
            id="pwd-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setSuccess(false)
              setCurrentPassword(e.target.value)
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pwd-new">{t('settings.password.new')}</Label>
          <Input
            id="pwd-new"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setSuccess(false)
              setNewPassword(e.target.value)
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pwd-confirm">{t('settings.password.confirm')}</Label>
          <Input
            id="pwd-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setSuccess(false)
              setConfirmPassword(e.target.value)
            }}
          />
        </div>
      </div>

      {mut.isError ? (
        <p className="text-body-sm text-form-error">{(mut.error as Error).message}</p>
      ) : null}

      <Button
        type="button"
        onClick={() => mut.mutate()}
        disabled={
          !currentPassword ||
          !newPassword ||
          !confirmPassword ||
          mut.isPending
        }
      >
        {t('settings.password.submit')}
      </Button>
    </div>
  )
}
