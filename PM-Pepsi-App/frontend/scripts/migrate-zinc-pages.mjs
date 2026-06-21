/**
 * Replace zinc-* with app/admin token utilities, one module at a time.
 *
 *   node scripts/migrate-zinc-pages.mjs              # list modules
 *   node scripts/migrate-zinc-pages.mjs scheduling   # one module
 *   node scripts/migrate-zinc-pages.mjs all          # every module in order
 *   node scripts/migrate-zinc-pages.mjs all --dry
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const DRY = process.argv.includes('--dry')
const arg = process.argv.find((a) => !a.startsWith('-') && a !== process.argv[1] && a !== process.argv[0])
const target = arg ?? 'list'

/** Already migrated — kept for re-runs */
const DONE_MODULES = {
  integration: ['features/integration'],
  iw37n: ['features/iw37n', 'components/iw37n'],
  'master-data': ['features/master-data'],
  personnel: ['features/personnel'],
  'work-orders': ['features/work-orders'],
  parity: ['features/parity'],
  admin: ['features/admin'],
}

/** Remaining modules (run in this order) */
const MODULES = {
  scheduling: ['components/scheduling'],
  ui: ['components/ui'],
  confirmation: ['components/confirmation', 'features/confirmation'],
  calendar: ['features/calendar', 'features/plan-calendar', 'features/planning'],
  manhours: ['features/manhours'],
  reports: ['features/reports'],
  settings: ['features/settings', 'components/profile'],
  auth: ['features/auth'],
  backlog: ['features/backlog'],
  layout: ['components/layout', 'components/command-palette', 'components/admin'],
  errors: ['features/errors'],
}

const ALL_MODULES = { ...DONE_MODULES, ...MODULES }

/** Order: longer / compound patterns first */
const REPLACEMENTS = [
  [
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
    'focus-app-ring focus-visible:outline-none',
  ],
  [
    "default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800'",
    "default: 'bg-[var(--app-text)] text-[var(--app-surface)] hover:opacity-90'",
  ],
  [
    "'border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-800'",
    "'border-transparent bg-[var(--app-text)] text-[var(--app-surface)] hover:opacity-90'",
  ],
  [
    "'border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200'",
    "'border-transparent bg-app-muted text-app hover:bg-app-subtle'",
  ],
  [
    'inline-flex h-10 items-center justify-center rounded-button bg-zinc-900 px-4 text-body-sm font-medium text-white hover:bg-zinc-800',
    'inline-flex h-10 items-center justify-center rounded-button bg-[var(--app-text)] px-4 text-body-sm font-medium text-[var(--app-surface)] hover:opacity-90',
  ],
  [
    'macos-popover-glass z-50 w-auto rounded-md border border-zinc-200 bg-white p-0 text-zinc-900 shadow-md outline-none',
    'macos-popover-glass z-50 w-auto rounded-md border border-app bg-[var(--app-surface)] p-0 text-app shadow-md outline-none',
  ],
  [
    'macos-dialog-glass fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-dialog border border-zinc-200 bg-white p-6 shadow-app-dialog',
    'macos-dialog-glass fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-dialog border border-app bg-[var(--app-surface)] p-6 shadow-app-dialog',
  ],
  [
    'flex h-10 w-full rounded-button border border-zinc-300 bg-white px-3 py-2 text-body-sm text-zinc-900 ring-offset-white file:border-0 file:bg-transparent file:text-body-sm file:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
    'flex h-10 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm text-app ring-offset-[var(--app-surface)] file:border-0 file:bg-transparent file:text-body-sm file:font-medium placeholder:text-app-muted focus-app-ring focus-visible:outline-none',
  ],
  [
    'flex min-h-[80px] w-full rounded-button border border-zinc-300 bg-white px-3 py-2 text-body-sm text-zinc-900 ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
    'flex min-h-[80px] w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm text-app ring-offset-[var(--app-surface)] placeholder:text-app-muted focus-app-ring focus-visible:outline-none',
  ],
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-body-sm font-medium shadow-app-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-body-sm font-medium shadow-app-button transition-colors focus-app-ring focus-visible:outline-none',
  ],
  [
    'inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2',
    'inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-app-ring',
  ],
  [
    'flex h-10 w-full rounded-button border border-zinc-300 bg-white px-3 py-2 text-body-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
    'flex h-10 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm text-app focus-app-ring focus-visible:outline-none',
  ],
  [
    'absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-button border border-zinc-200 bg-white py-1 text-body-sm shadow-md',
    'absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-button border border-app bg-[var(--app-surface)] py-1 text-body-sm shadow-md',
  ],
  ['border border-zinc-300 bg-white text-zinc-900 shadow-app-button hover:bg-zinc-50', 'border border-app bg-[var(--app-surface)] text-app shadow-app-button hover:bg-app-subtle'],
  ['text-zinc-900 hover:bg-zinc-100', 'text-app hover:bg-app-muted'],
  ['inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-600', 'inline-flex h-10 items-center justify-center rounded-md bg-app-muted p-1 text-app-muted'],
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-2 text-body-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm',
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-2 text-body-sm font-medium ring-offset-[var(--app-surface)] transition-all focus-app-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--app-surface)] data-[state=active]:text-app data-[state=active]:shadow-sm',
  ],
  ['mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2', 'mt-4 ring-offset-[var(--app-surface)] focus-app-ring focus-visible:outline-none'],
  ['rounded-card border border-zinc-200 bg-white text-zinc-950 shadow-app-card', 'rounded-card border border-app bg-[var(--app-surface)] text-app shadow-app-card'],
  ['border-b border-zinc-200 transition-colors hover:bg-zinc-50/80 data-[state=selected]:bg-zinc-100', 'border-b border-app transition-colors hover:bg-app-subtle/80 data-[state=selected]:bg-app-muted'],
  ['rounded-card border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700', 'rounded-card border border-app bg-app-subtle px-3 py-2 text-xs text-app'],
  ['rounded-card border border-zinc-200 bg-white p-3 shadow-sm', 'rounded-card border border-app bg-[var(--app-surface)] p-3 shadow-sm'],
  ['border border-zinc-300 bg-white px-3 py-2 text-body-sm shadow-sm', 'border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm shadow-sm'],
  ['block w-full px-3 py-2 text-left hover:bg-zinc-100', 'block w-full px-3 py-2 text-left hover:bg-app-muted'],
  ['divide-y divide-zinc-100', 'divide-y divide-[var(--app-border)]'],
  ['border-zinc-200 bg-zinc-50 text-zinc-600', 'border-app bg-app-subtle text-app-muted'],
  ['bg-zinc-300 text-zinc-700', 'bg-app-muted text-app'],
  ['bg-zinc-50 text-zinc-700', 'bg-app-subtle text-app'],
  ['thead className="bg-zinc-50 text-zinc-700"', 'thead className="bg-app-subtle text-app"'],
  ['bg-zinc-800 hover:bg-zinc-800', 'bg-[var(--app-text)] hover:bg-[var(--app-text)]'],
  ['inline-flex h-10 items-center justify-center rounded-button bg-zinc-900 px-4 text-body-sm font-medium text-white hover:bg-zinc-800', 'inline-flex h-10 items-center justify-center rounded-button bg-[var(--admin-primary)] px-4 text-body-sm font-medium text-white hover:opacity-90'],
  ['bg-zinc-900', 'bg-[var(--app-text)]'],
  ['hover:bg-zinc-800', 'hover:opacity-90'],
  ['text-zinc-100', 'text-[var(--app-surface)]'],
  ['focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2', 'focus-app-ring'],
  ['focus-visible:ring-2 focus-visible:ring-zinc-400', 'focus-app-ring'],
  ['focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2', 'focus-app-ring'],
  ['focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2', 'focus-app-ring focus:outline-none'],
  ['ring-2 ring-zinc-300', 'ring-2 ring-[var(--admin-primary)]'],
  ['accent-zinc-800', 'accent-[var(--admin-primary)]'],
  ['border-t border-zinc-100', 'border-t border-app'],
  ['border border-zinc-100', 'border border-app'],
  ['from-zinc-100', 'from-app-subtle'],
  ['to-zinc-100', 'to-app-subtle'],
  ['via-zinc-100', 'via-app-subtle'],
  ['bg-zinc-950', 'bg-[var(--app-text)]'],
  ['bg-zinc-800', 'bg-[var(--app-text)]'],
  ['shadow-zinc-200/50', 'shadow-app-card/50'],
  ['hover:border-zinc-300', 'hover:border-[var(--app-border)]'],
  ['divide-zinc-200', 'divide-[var(--app-border)]'],
  ['hover:bg-zinc-100', 'hover:bg-app-muted'],
  ['hover:bg-zinc-50/80', 'hover:bg-app-subtle/80'],
  ['hover:bg-zinc-50', 'hover:bg-app-subtle'],
  ['data-[state=selected]:bg-zinc-100', 'data-[state=selected]:bg-app-muted'],
  ['border border-app bg-white', 'border border-app bg-[var(--app-surface)]'],
  ['border border-zinc-200 bg-white', 'border border-app bg-[var(--app-surface)]'],
  ['border border-zinc-200 bg-zinc-50', 'border border-app bg-app-subtle'],
  ['rounded-card border border-zinc-200 bg-zinc-50', 'rounded-card border border-app bg-app-subtle'],
  ['rounded border border-zinc-200 bg-white', 'rounded border border-app bg-[var(--app-surface)]'],
  ['rounded-button border border-zinc-200 bg-white', 'rounded-button border border-app bg-[var(--app-surface)]'],
  ['overflow-x-auto rounded-card border border-zinc-200', 'overflow-x-auto rounded-card border border-app'],
  ['grid gap-3 rounded-card border border-zinc-200 bg-zinc-50', 'grid gap-3 rounded-card border border-app bg-app-subtle'],
  ['rounded bg-zinc-200', 'rounded bg-app-muted'],
  ['animate-pulse rounded-md bg-zinc-200', 'animate-pulse rounded-md bg-app-muted'],
  ['shrink-0 bg-zinc-200', 'shrink-0 bg-app-muted'],
  ['ring-zinc-200', 'ring-app'],
  ['ring-2 ring-zinc-200', 'ring-2 ring-app'],
  ['ring-1 ring-zinc-200', 'ring-1 ring-app'],
  ['rounded border-zinc-300', 'rounded border-app'],
  ['border-zinc-300', 'border-app'],
  ['border-zinc-200', 'border-app'],
  ['border-dashed border-zinc-200', 'border-dashed border-app'],
  ['bg-zinc-50/80', 'bg-app-subtle'],
  ['bg-zinc-50/60', 'bg-app-subtle'],
  ['bg-zinc-50', 'bg-app-subtle'],
  ['bg-zinc-200', 'bg-app-muted'],
  ['bg-zinc-100', 'bg-app-muted'],
  ['bg-zinc-300', 'bg-[var(--app-border)]'],
  ["same: 'bg-zinc-50'", "same: 'bg-app-subtle'"],
  ['placeholder:text-zinc-400', 'placeholder:text-app-muted'],
  ['ring-offset-white', 'ring-offset-[var(--app-surface)]'],
  ['text-zinc-950', 'text-app'],
  ['text-zinc-900', 'text-app'],
  ['text-zinc-800', 'text-app'],
  ['text-zinc-700', 'text-app'],
  ['text-zinc-600', 'text-app-muted'],
  ['text-zinc-500', 'text-app-muted'],
  ['text-zinc-400', 'text-app-muted'],
  ['text-zinc-300', 'text-app-muted'],
  ['text-zinc-200', 'text-[color-mix(in_srgb,var(--app-surface)_88%,transparent)]'],
  ['text-zinc-50', 'text-[var(--app-surface)]'],
  ['outline: \'text-zinc-900 border-zinc-300\'', 'outline: \'text-app border-app\''],
  ['text-caption text-app-muted', 'text-caption'],
  ['text-app-muted text-caption', 'text-caption'],
]

function collectFiles(dirs) {
  const out = new Set()
  function walk(relDir) {
    const abs = path.join(ROOT, relDir)
    if (!fs.existsSync(abs)) return
    for (const name of fs.readdirSync(abs)) {
      const rel = path.join(relDir, name).replace(/\\/g, '/')
      const absPath = path.join(ROOT, rel)
      if (fs.statSync(absPath).isDirectory()) walk(rel)
      else if (/\.tsx?$/.test(name) && !/\.test\.(tsx?)$/.test(name)) out.add(rel)
    }
  }
  for (const d of dirs) walk(d)
  return [...out].sort()
}

function migrateModule(name) {
  const dirs = ALL_MODULES[name]
  if (!dirs) {
    console.error(`Unknown module: ${name}`)
    process.exit(1)
  }
  let changed = 0
  const files = collectFiles(dirs)
  for (const rel of files) {
    const file = path.join(ROOT, rel)
    let src = fs.readFileSync(file, 'utf8')
    const before = src
    for (const [from, to] of REPLACEMENTS) {
      src = src.split(from).join(to)
    }
    if (src !== before) {
      changed++
      if (!DRY) fs.writeFileSync(file, src)
      console.log(`  ${rel}`)
    }
  }
  const remaining = files.filter((rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').includes('zinc-'))
  console.log(`[${name}] ${DRY ? 'would update' : 'updated'} ${changed} files, zinc left: ${remaining.length}`)
  if (remaining.length) remaining.forEach((r) => console.log(`  ! ${r}`))
  return { changed, remaining: remaining.length }
}

if (target === 'list') {
  console.log('Modules (done + pending):')
  for (const [k, dirs] of Object.entries(ALL_MODULES)) {
    const n = collectFiles(dirs).filter((r) => fs.readFileSync(path.join(ROOT, r), 'utf8').includes('zinc-')).length
    console.log(`  ${k.padEnd(14)} ${dirs.join(', ')}${n ? ` — ${n} files with zinc` : ' — clean'}`)
  }
  console.log('\nUsage: node scripts/migrate-zinc-pages.mjs <module|all> [--dry]')
  process.exit(0)
}

const names = target === 'all' ? Object.keys(MODULES) : [target]
let totalLeft = 0
for (const name of names) {
  console.log(`\n=== ${name} ===`)
  const { remaining } = migrateModule(name)
  totalLeft += remaining
}
if (target === 'all') {
  console.log(`\nTotal files still containing zinc-* in pending modules: ${totalLeft}`)
}
