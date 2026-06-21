import type { Page } from '@playwright/test'

export type ConsoleIssue = {
  kind: 'console' | 'pageerror'
  text: string
  url: string
  source?: string
}

const IGNORE_PATTERNS: RegExp[] = [
  /favicon/i,
  /ResizeObserver loop/i,
  /Failed to load resource:.*favicon/i,
  /net::ERR_BLOCKED_BY_CLIENT/i,
]

export function isIgnoredConsoleError(text: string): boolean {
  return IGNORE_PATTERNS.some((re) => re.test(text))
}

export function attachConsoleCollector(page: Page): ConsoleIssue[] {
  const issues: ConsoleIssue[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (isIgnoredConsoleError(text)) return
    const loc = msg.location()
    issues.push({
      kind: 'console',
      text,
      url: page.url(),
      source: loc.url || undefined,
    })
  })
  page.on('pageerror', (err) => {
    const text = err.message
    if (isIgnoredConsoleError(text)) return
    issues.push({ kind: 'pageerror', text, url: page.url() })
  })
  return issues
}

export function formatConsoleIssues(label: string, issues: ConsoleIssue[]): string {
  if (issues.length === 0) return ''
  const lines = issues.map((i) => {
    const where = i.source ? ` @ ${i.source}` : ''
    return `  [${i.kind}] ${i.text} (page: ${i.url})${where}`
  })
  return `${label}:\n${lines.join('\n')}`
}
