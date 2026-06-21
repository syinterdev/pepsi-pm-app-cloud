import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Clock,
  CloudOff,
  FileQuestion,
  FileWarning,
  FolderLock,
  Gauge,
  KeyRound,
  Link2Off,
  Lock,
  ServerCrash,
  ShieldAlert,
  ShieldOff,
  Unplug,
  WifiOff,
  Wrench,
} from 'lucide-react'
import type { TFunction } from 'i18next'

export type HttpErrorTextKey = `http.${CatalogCode}` | 'generic4xx' | 'generic5xx'

export type HttpErrorMeta = {
  code: number
  icon: LucideIcon
  textKey: HttpErrorTextKey
}

const catalog = {
  400: { icon: AlertTriangle },
  401: { icon: KeyRound },
  402: { icon: Lock },
  403: { icon: ShieldOff },
  404: { icon: FileQuestion },
  405: { icon: Ban },
  408: { icon: Clock },
  409: { icon: ShieldAlert },
  410: { icon: Link2Off },
  413: { icon: FileWarning },
  414: { icon: Link2Off },
  415: { icon: FileWarning },
  422: { icon: AlertTriangle },
  423: { icon: FolderLock },
  429: { icon: Gauge },
  500: { icon: ServerCrash },
  501: { icon: Wrench },
  502: { icon: Unplug },
  503: { icon: CloudOff },
  504: { icon: WifiOff },
} as const satisfies Record<number, { icon: LucideIcon }>

export type CatalogCode = keyof typeof catalog

export const KNOWN_HTTP_ERROR_CODES = Object.keys(catalog).map(Number) as CatalogCode[]

function resolveTextKey(code: number): HttpErrorTextKey {
  if (code in catalog) return `http.${code as CatalogCode}`
  if (code >= 500 && code <= 599) return 'generic5xx'
  if (code >= 400 && code <= 499) return 'generic4xx'
  return 'http.404'
}

export function getHttpErrorMeta(code: number): HttpErrorMeta {
  const textKey = resolveTextKey(code)
  const icon =
    textKey === 'generic5xx'
      ? ServerCrash
      : textKey === 'generic4xx'
        ? AlertCircle
        : catalog[Number(textKey.slice(5)) as CatalogCode].icon
  return { code, icon, textKey }
}

export function getHttpErrorCopy(
  meta: HttpErrorMeta,
  t: TFunction,
): { title: string; description: string } {
  if (meta.textKey.startsWith('http.')) {
    const code = meta.textKey.slice(5)
    return {
      title: t(`http.${code}.title`, { ns: 'errors' }),
      description: t(`http.${code}.description`, { ns: 'errors' }),
    }
  }
  return {
    title: t(`${meta.textKey}.title`, { ns: 'errors' }),
    description: t(`${meta.textKey}.description`, { ns: 'errors' }),
  }
}

export function parseHttpErrorCode(raw: string | undefined): number | null {
  if (raw == null || raw === '') return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 100 || n > 599) return null
  return n
}
