import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Repo: docs/customer-requirements/screenshots/ */
export const UAT_SCREENSHOT_ROOT = join(
  frontendRoot,
  '..',
  '..',
  'docs',
  'customer-requirements',
  'screenshots',
)

export function uatShot(...segments: string[]): string {
  const file = join(UAT_SCREENSHOT_ROOT, ...segments)
  mkdirSync(dirname(file), { recursive: true })
  return file
}
