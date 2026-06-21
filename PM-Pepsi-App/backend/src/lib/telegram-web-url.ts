/** URL ฝั่งเว็บสำหรับปุ่ม「เปิดในเว็บ」ใน Telegram (ไม่ใช่ API webhook) */
export function getTelegramWebAppUrl(): string {
  const origin = process.env.CORS_ORIGIN?.trim()
  if (origin) return origin.replace(/\/$/, '')
  const pub = process.env.APP_PUBLIC_URL?.trim()
  if (pub) return pub.replace(/\/$/, '')
  return 'http://localhost:5173'
}
