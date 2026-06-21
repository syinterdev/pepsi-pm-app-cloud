/**
 * Register Telegram webhook → POST /api/v1/telegram/webhook
 * Usage:
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... APP_PUBLIC_URL=https://api.example.com \
 *     npx tsx scripts/telegram-set-webhook.ts
 */
import 'dotenv/config'

const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
const publicUrl = process.env.APP_PUBLIC_URL?.trim().replace(/\/$/, '')

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN required')
  process.exit(1)
}
if (!publicUrl) {
  console.error('APP_PUBLIC_URL required (public HTTPS base of API, no trailing slash)')
  process.exit(1)
}

const webhookUrl = `${publicUrl}/api/v1/telegram/webhook`
const body: Record<string, unknown> = { url: webhookUrl }
if (secret) body.secret_token = secret

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
const data = (await res.json()) as { ok?: boolean; description?: string; result?: boolean }

if (!data.ok) {
  console.error('setWebhook failed:', data.description ?? res.status)
  process.exit(1)
}

console.log('[OK] Webhook set:', webhookUrl)
if (secret) console.log('[OK] secret_token configured (X-Telegram-Bot-Api-Secret-Token)')

const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
const info = (await infoRes.json()) as {
  ok?: boolean
  result?: { url?: string; pending_update_count?: number }
}
if (info.ok && info.result) {
  console.log('[INFO] pending_update_count:', info.result.pending_update_count ?? 0)
}
