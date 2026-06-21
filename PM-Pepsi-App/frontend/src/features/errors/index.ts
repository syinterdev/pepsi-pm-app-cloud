export { AppErrorBoundary } from '@/features/errors/AppErrorBoundary'
export { ErrorPageShell } from '@/features/errors/ErrorPageShell'
export {
  getHttpErrorMeta,
  KNOWN_HTTP_ERROR_CODES,
  parseHttpErrorCode,
} from '@/features/errors/http-error-catalog'
export type { HttpErrorMeta } from '@/features/errors/http-error-catalog'
export { HttpErrorPage } from '@/features/errors/HttpErrorPage'
export { UnexpectedErrorPage } from '@/features/errors/UnexpectedErrorPage'
