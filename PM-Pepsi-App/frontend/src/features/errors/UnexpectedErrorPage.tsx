import { Button } from '@/components/ui/button'
import { ErrorPageShell } from '@/features/errors/ErrorPageShell'
import { Bug, Home, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export type UnexpectedErrorPageProps = {
  error: Error
  componentStack?: string | null
  onReset: () => void
}

export function UnexpectedErrorPage({ error, componentStack, onReset }: UnexpectedErrorPageProps) {
  const { t } = useTranslation('errors')
  const showStack = import.meta.env.DEV

  const detail = (
    <details className="error-page__stack">
      <summary className="cursor-pointer text-caption font-medium text-app">
        {error.name}: {error.message}
      </summary>
      {componentStack ? (
        <pre className="mt-2 max-h-32 overflow-auto rounded-button bg-[var(--app-subtle)] p-3 text-caption leading-relaxed text-app-muted">
          {componentStack}
        </pre>
      ) : null}
      {showStack && error.stack ? (
        <pre className="mt-2 max-h-40 overflow-auto rounded-button bg-[var(--app-text)] p-3 text-caption leading-relaxed text-[var(--app-surface)]">
          {error.stack}
        </pre>
      ) : null}
    </details>
  )

  return (
    <ErrorPageShell
      codeDisplay="!"
      title={t('unexpected.title')}
      description={t('unexpected.description')}
      icon={Bug}
      tone="crash"
      detail={detail}
    >
      <Button type="button" className="gap-2" onClick={onReset}>
        <RefreshCw className="size-4" aria-hidden />
        {t('shell.retryRender')}
      </Button>
      <Button type="button" variant="outline" className="gap-2" asChild>
        <Link to="/">
          <Home className="size-4" aria-hidden />
          {t('shell.home')}
        </Link>
      </Button>
    </ErrorPageShell>
  )
}
