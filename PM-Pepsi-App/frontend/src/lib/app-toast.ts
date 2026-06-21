import { i18n } from '@/i18n'
import { toast } from 'sonner'

/** ตรงกับ `AppToaster` duration */
export const APP_TOAST_DURATION_MS = 4000

function toastOpts(description?: string) {
  return description
    ? { description, duration: APP_TOAST_DURATION_MS }
    : { duration: APP_TOAST_DURATION_MS }
}

/** Toast สั้น — ข้อความตาม locale ปัจจุบัน · สี/icon จาก AppToaster */
export function toastSuccess(message: string, description?: string) {
  toast.success(message, toastOpts(description))
}

export function toastError(message: string, description?: string) {
  toast.error(message, toastOpts(description))
}

export function toastWarning(message: string, description?: string) {
  toast.warning(message, toastOpts(description))
}

export function toastInfo(message: string, description?: string) {
  toast.info(message, toastOpts(description))
}

export function toastSaved() {
  toast.success(i18n.t('toast.saved', { ns: 'common' }), toastOpts())
}

export function toastDeleted() {
  toast.success(i18n.t('toast.deleted', { ns: 'common' }), toastOpts())
}

/** Neutral message — uses default sonner styling + AppToaster icons */
export function toastMessage(message: string, description?: string) {
  toast(message, toastOpts(description))
}
