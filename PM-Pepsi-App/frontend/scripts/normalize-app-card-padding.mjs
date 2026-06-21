/**
 * Replace ad-hoc `app-card p-*` with token utilities.
 * Run: node scripts/normalize-app-card-padding.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const DRY = process.argv.includes('--dry')

const REPLACEMENTS = [
  ['app-card space-y-4 p-6', 'app-card app-card-pad space-y-4'],
  ['app-card p-6', 'app-card app-card-pad'],
  ['app-card space-y-4 p-4', 'app-card app-card-pad-compact space-y-4'],
  ['app-card space-y-3 p-4', 'app-card app-card-pad-compact space-y-3'],
  ['app-card p-4 space-y-3', 'app-card app-card-pad-compact space-y-3'],
  ['app-card p-4', 'app-card app-card-pad-compact'],
  ['app-card p-3', 'app-card app-card-pad-compact'],
]

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name)
    if (fs.statSync(abs).isDirectory()) walk(abs, out)
    else if (/\.tsx?$/.test(name) && !/\.test\.(tsx?)$/.test(name)) out.push(abs)
  }
  return out
}

let n = 0
for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, 'utf8')
  if (!src.includes('app-card')) continue
  const before = src
  for (const [from, to] of REPLACEMENTS) src = src.split(from).join(to)
  if (src !== before) {
    n++
    if (!DRY) fs.writeFileSync(file, src)
    console.log(path.relative(ROOT, file).replace(/\\/g, '/'))
  }
}
console.log(DRY ? `[dry] ${n} files` : `updated ${n} files`)
