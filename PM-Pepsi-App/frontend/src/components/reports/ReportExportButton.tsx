import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Download, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type ReportExportFormat = 'csv' | 'xlsx' | 'excel'

export type ReportExportButtonProps = Omit<ButtonProps, 'children'> & {
  format?: ReportExportFormat
  /** Override label — defaults to i18n by format */
  label?: string
  loading?: boolean
  loadingLabel?: string
}

export function ReportExportButton({
  format,
  label,
  loading = false,
  loadingLabel,
  className,
  disabled,
  variant = 'outline',
  size = 'sm',
  ...props
}: ReportExportButtonProps) {
  const { t } = useTranslation('reports')
  const formatLabel =
    format === 'csv'
      ? t('export.csv')
      : format === 'xlsx' || format === 'excel'
        ? t('export.excel')
        : t('export.default')
  const text = loading
    ? (loadingLabel ?? t('export.loading'))
    : (label ?? formatLabel)

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4 shrink-0" aria-hidden />
      )}
      <span>{text}</span>
    </Button>
  )
}
