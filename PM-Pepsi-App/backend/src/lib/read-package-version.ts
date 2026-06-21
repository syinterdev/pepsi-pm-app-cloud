import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function readPackageVersion(relativeToBackendSrc: string): string {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url))
    const pkgPath = path.resolve(here, relativeToBackendSrc)
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}
