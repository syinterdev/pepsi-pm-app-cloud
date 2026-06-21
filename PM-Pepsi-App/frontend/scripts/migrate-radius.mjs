/**
 * Migrate Tailwind radius classes → app tokens (rounded-card / rounded-button / rounded-dialog).
 * Run: node scripts/migrate-radius.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const DRY = process.argv.includes('--dry')

/** Order: larger semantic names first. Dialog shells use rounded-dialog ใน ui/dialog.tsx เท่านั้น */
const REPLACEMENTS = [
  ['rounded-xl', 'rounded-card'],
  ['rounded-2xl', 'rounded-card'],
  ['rounded-lg', 'rounded-button'],
  ['rounded-md', 'rounded-button'],
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
  if (file.includes(`${path.sep}ui${path.sep}`)) continue
  if (file.endsWith('index.css')) continue
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
