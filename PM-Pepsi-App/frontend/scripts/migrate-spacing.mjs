/**
 * Snap spacing classes to U0 scale (4/8/12/16/24/32).
 * @theme in index.css also remaps Tailwind keys; this script normalizes class names.
 * Run: node scripts/migrate-spacing.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const DRY = process.argv.includes('--dry')

const PREFIXES = [
  'gap',
  'space-x',
  'space-y',
  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
  'm',
  'mx',
  'my',
  'mt',
  'mb',
  'ml',
  'mr',
]

const REPLACEMENTS = [
  ['space-y-10', 'space-y-8'],
  ['space-y-1.5', 'space-y-2'],
  ['space-y-0.5', 'space-y-1'],
  ['gap-1.5', 'gap-2'],
  ['gap-0.5', 'gap-1'],
  ['gap-3.5', 'gap-4'],
  ['py-12', 'py-8'],
  ['py-10', 'py-8'],
  ['pb-10', 'pb-8'],
  ['py-2.5', 'py-3'],
  ['py-1.5', 'py-2'],
  ['py-0.5', 'py-1'],
  ['pt-1.5', 'pt-2'],
  ['pb-0.5', 'pb-1'],
  ['px-5', 'px-6'],
  ['p-5', 'p-6'],
  ['px-2.5', 'px-3'],
  ['pl-9', 'pl-8'],
  ['px-1.5', 'px-2'],
  ['mr-1.5', 'mr-2'],
  ['ml-1.5', 'ml-2'],
  ['mt-1.5', 'mt-2'],
  ['mt-0.5', 'mt-1'],
]

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, files)
    else if (/\.(tsx|ts|css)$/.test(name)) files.push(p)
  }
  return files
}

let changed = 0
for (const file of walk(ROOT)) {
  if (file.endsWith('spacing-scale.ts') || file.endsWith('spacing-scale.test.ts')) continue
  let src = fs.readFileSync(file, 'utf8')
  const before = src
  for (const [from, to] of REPLACEMENTS) {
    src = src.split(from).join(to)
  }
  if (src !== before) {
    changed++
    if (!DRY) fs.writeFileSync(file, src)
    console.log(path.relative(ROOT, file))
  }
}

console.log(DRY ? `[dry] would update ${changed} files` : `updated ${changed} files`)
