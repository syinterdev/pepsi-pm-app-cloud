import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { APP_INTERACTIVE_MOTION } from '@/lib/app-motion'
import { cn } from '@/lib/utils'
import { BookOpen, Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

function CodeBlock({
  label,
  code,
  copyLabel,
  copiedLabel,
}: {
  label: string
  code: string
  copyLabel: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(copiedLabel)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(copyLabel)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-app">{label}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-7 gap-1 px-2 text-xs', APP_INTERACTIVE_MOTION)}
          onClick={() => void onCopy()}
        >
          {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
          {copyLabel}
        </Button>
      </div>
      <pre className="app-tone-info-callout overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed text-app">
        {code}
      </pre>
    </div>
  )
}

type Props = {
  publicUrl: string
}

export function TelegramHelpPanel({ publicUrl }: Props) {
  const { t } = useTranslation('admin')
  const base = publicUrl.replace(/\/$/, '')

  const webhookCommand = useMemo(
    () =>
      [
        `curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \\`,
        `  -d "url=${base}/api/v1/telegram/webhook" \\`,
        `  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"`,
      ].join('\n'),
    [base],
  )

  const envExample = useMemo(
    () =>
      [
        'TELEGRAM_BOT_TOKEN=<from BotFather>',
        'TELEGRAM_WEBHOOK_SECRET=<random secret>',
        'TELEGRAM_NOTIFY_ENABLED=1',
      ].join('\n'),
    [],
  )

  const steps = [
    { title: t('telegram.help.step1Title'), body: t('telegram.help.step1Body') },
    { title: t('telegram.help.step2Title'), body: t('telegram.help.step2Body') },
    { title: t('telegram.help.step3Title'), body: t('telegram.help.step3Body') },
    { title: t('telegram.help.step4Title'), body: t('telegram.help.step4Body') },
  ]

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-[var(--app-accent)]" aria-hidden />
          {t('telegram.helpCardTitle')}
        </CardTitle>
        <CardDescription>{t('telegram.help.intro')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3 text-sm">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--app-accent)_12%,white)] text-xs font-semibold text-[var(--app-accent)]">
                {i + 1}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium text-app">{step.title}</p>
                <p className="text-xs leading-relaxed text-app-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <CodeBlock
          label={t('telegram.help.envLabel')}
          code={envExample}
          copyLabel={t('telegram.help.copy')}
          copiedLabel={t('telegram.help.copied')}
        />

        <CodeBlock
          label={t('telegram.help.webhookLabel')}
          code={webhookCommand}
          copyLabel={t('telegram.help.copy')}
          copiedLabel={t('telegram.help.copied')}
        />
      </CardContent>
    </Card>
  )
}
