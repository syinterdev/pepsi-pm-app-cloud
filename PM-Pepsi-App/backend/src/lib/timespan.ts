/** Age/work duration helper (timespan) */
export function timespanThai(fromUnixSec: number, toUnixSec: number = Math.floor(Date.now() / 1000)): string {
  if (!Number.isFinite(fromUnixSec) || fromUnixSec <= 0) return '—'
  let seconds = toUnixSec - fromUnixSec
  if (seconds <= 0) seconds = 1

  const parts: string[] = []
  let s = seconds

  const years = Math.floor(s / 31536000)
  if (years > 0) {
    parts.push(`${years} ปี`)
    s -= years * 31536000
  }
  const months = Math.floor(s / 2628000)
  if (years > 0 || months > 0) {
    if (months > 0) parts.push(`${months} เดือน`)
    s -= months * 2628000
  }
  const weeks = Math.floor(s / 604800)
  if (years > 0 || months > 0 || weeks > 0) {
    if (weeks > 0) parts.push(`${weeks} สัปดาห์`)
    s -= weeks * 604800
  }
  const days = Math.floor(s / 86400)
  if (months > 0 || weeks > 0 || days > 0) {
    if (days > 0) parts.push(`${days} วัน`)
  }

  return parts.length > 0 ? parts.join(', ') : '0 วัน'
}
