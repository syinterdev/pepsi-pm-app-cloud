import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderBlock } from '@/components/layout/PlaceholderBlock'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Shell({
  title,
  description,
  hint,
}: {
  title: string
  description: string
  hint?: ReactNode
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      {hint ? <PlaceholderBlock title={title}>{hint}</PlaceholderBlock> : null}
    </div>
  )
}

export function SummaryWeeklyParityPage() {
  const { t } = useTranslation()
  return (
    <Shell
      title={t('parity.summaryWeeklyTitle')}
      description={t('parity.summaryWeeklyDesc')}
      hint={
        <Button variant="outline" size="sm" asChild>
          <Link to="/summary-weekly">{t('parity.summaryWeeklyLink')}</Link>
        </Button>
      }
    />
  )
}
