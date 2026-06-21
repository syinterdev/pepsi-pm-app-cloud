import { i18n } from '@/i18n'
import { isMaintenanceModeError } from '@/lib/maintenance-error'

export type AuthFeedbackKind =
  | 'success'
  | 'invalid'
  | 'lockout'
  | 'blocked'
  | 'maintenance'
  | 'rate_limit'
  | 'generic'

export type AuthFeedbackState = {
  kind: AuthFeedbackKind
  title: string
  message: string
}

/** Error จาก `fetchApi` พร้อมรหัส security ฝั่ง backend */
export class AuthApiError extends Error {
  readonly code?: string
  readonly httpStatus: number

  constructor(httpStatus: number, code?: string, message?: string) {
    super(message?.trim() || `HTTP ${httpStatus}`)
    this.name = 'AuthApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

export function isAuthApiError(err: unknown): err is AuthApiError {
  return err instanceof AuthApiError
}

const TITLE_KEYS: Record<string, { kind: AuthFeedbackKind; key: string }> = {
  INVALID_CREDENTIALS: { kind: 'invalid', key: 'auth.feedback.invalidTitle' },
  LOGIN_LOCKED: { kind: 'lockout', key: 'auth.feedback.lockoutTitle' },
  IP_BLOCKED: { kind: 'blocked', key: 'auth.feedback.blockedTitle' },
  MAINTENANCE: { kind: 'maintenance', key: 'auth.feedback.maintenanceTitle' },
  RATE_LIMIT: { kind: 'rate_limit', key: 'auth.feedback.rateLimitTitle' },
}

function tAuth(key: string): string {
  return i18n.t(key, { ns: 'common' })
}

/** แปลง error จาก login API → ข้อความ popup */
export function resolveAuthFeedback(err: unknown): AuthFeedbackState {
  if (isMaintenanceModeError(err)) {
    return {
      kind: 'maintenance',
      title: tAuth('auth.feedback.maintenanceTitle'),
      message: err.message,
    }
  }

  if (isAuthApiError(err)) {
    const mapped = err.code ? TITLE_KEYS[err.code] : undefined
    return {
      kind: mapped?.kind ?? (err.httpStatus === 429 ? 'rate_limit' : 'generic'),
      title: mapped ? tAuth(mapped.key) : tAuth('auth.feedback.genericTitle'),
      message: err.message,
    }
  }

  if (err instanceof Error && err.message) {
    try {
      const parsed = JSON.parse(err.message) as { error?: string; message?: string }
      if (parsed.message || parsed.error) {
        return resolveAuthFeedback(
          new AuthApiError(0, parsed.error, parsed.message ?? parsed.error),
        )
      }
    } catch {
      /* plain text */
    }
    if (/network|failed to fetch|load failed/i.test(err.message)) {
      return {
        kind: 'generic',
        title: tAuth('auth.feedback.networkTitle'),
        message: tAuth('auth.feedback.networkMessage'),
      }
    }
    return {
      kind: 'generic',
      title: tAuth('auth.feedback.genericTitle'),
      message: err.message,
    }
  }

  return {
    kind: 'generic',
    title: tAuth('auth.feedback.genericTitle'),
    message: tAuth('auth.feedback.genericMessage'),
  }
}

export function authFeedbackConfirmLabel(kind: AuthFeedbackKind): string {
  return kind === 'success'
    ? tAuth('auth.feedback.confirmContinue')
    : tAuth('auth.feedback.confirmOk')
}
