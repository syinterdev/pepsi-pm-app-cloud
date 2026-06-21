/**
 * One-off migration: text-[10/11px] and text-sm → typography utilities.
 * Run: node scripts/migrate-typography.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const DRY = process.argv.includes('--dry')

/** Order matters — longer / more specific patterns first */
const REPLACEMENTS = [
  ['text-[11px] text-zinc-500', 'text-caption'],
  ['text-[11px] text-zinc-600', 'text-caption text-zinc-600'],
  ['text-[11px] tabular-nums', 'text-caption tabular-nums'],
  ['text-[10px] leading-tight text-[var(--app-sidebar-fg-muted)]', 'text-sidebar-muted'],
  ['text-[10px] text-[var(--app-sidebar-fg-muted)]', 'text-sidebar-muted'],
  ['text-[10px] font-medium text-[var(--app-text-muted)]', 'text-caption'],
  ['text-[10px] font-semibold uppercase text-zinc-500', 'text-eyebrow text-zinc-500'],
  ['text-[10px] font-medium uppercase tracking-wide text-zinc-500', 'text-eyebrow text-zinc-500'],
  ['text-[length:var(--app-font-size-page-title)]', 'text-heading-page'],
  ['text-[length:var(--app-font-size-base)]', 'text-body'],
  ['text-[length:var(--app-font-size-sm)]', 'text-body-sm'],
  ['text-[11px]', 'text-caption'],
  ['text-[10px]', 'text-badge'],
  ['text-[12px]', 'text-body-sm'],
  ['text-sm text-zinc-500', 'text-caption'],
  ['text-sm text-zinc-600', 'text-caption text-zinc-600'],
  ['text-sm text-red-600', 'text-body-sm text-red-600'],
  ['text-sm text-zinc-800', 'text-body-sm text-zinc-800'],
  ['text-sm text-zinc-900', 'text-body-sm text-zinc-900'],
  ['text-sm text-emerald-950', 'text-body-sm text-emerald-950'],
  ['text-sm text-emerald-900/80', 'text-body-sm text-emerald-900/80'],
  ['text-sm text-amber-900/80', 'text-body-sm text-amber-900/80'],
  ['text-sm text-sky-900', 'text-body-sm text-sky-900'],
  ['text-sm font-medium text-zinc-800', 'text-body-sm font-medium text-zinc-800'],
  ['text-sm font-medium text-zinc-900', 'text-body-sm font-medium text-zinc-900'],
  [' py-1 text-sm ', ' py-1 text-body-sm '],
  [' px-2 py-1 text-sm ', ' px-2 py-1 text-body-sm '],
  [' px-2 text-sm ', ' px-2 text-body-sm '],
  [' px-3 py-2 text-sm ', ' px-3 py-2 text-body-sm '],
  [' h-9 min-w-[5.5rem] rounded-md border border-zinc-300 bg-white px-2 text-sm ', ' h-9 min-w-[5.5rem] rounded-md border border-zinc-300 bg-white px-2 text-body-sm '],
  [' h-9 min-w-[9.5rem] rounded-md border border-zinc-300 bg-white px-2 text-sm ', ' h-9 min-w-[9.5rem] rounded-md border border-zinc-300 bg-white px-2 text-body-sm '],
  ['space-y-2 text-sm', 'space-y-2 text-body-sm'],
  ['space-y-3 text-sm', 'space-y-3 text-body-sm'],
  ['space-y-4 text-sm', 'space-y-4 text-body-sm'],
  ['min-w-full text-sm', 'min-w-full text-body-sm'],
  ['overflow-auto py-1 text-sm ', 'overflow-auto py-1 text-body-sm '],
  ['p-3 text-sm ', 'p-3 text-body-sm '],
  ['cursor-pointer text-sm ', 'cursor-pointer text-body-sm '],
  ['<code className="text-caption">', '<code className="text-code">'],
  ['<code className="text-badge">', '<code className="text-code">'],
  ['text-sm text-amber-900', 'text-body-sm text-amber-900'],
  ['text-sm text-emerald-900', 'text-body-sm text-emerald-900'],
  ['text-sm text-amber-950', 'text-body-sm text-amber-950'],
  ['text-sm text-purple-900', 'text-body-sm text-purple-900'],
  ['text-sm text-blue-900', 'text-body-sm text-blue-900'],
  ['text-sm text-red-700', 'text-body-sm text-red-700'],
  ['text-sm text-blue-600', 'text-body-sm text-blue-600'],
  ['text-sm text-[var(--app-text-muted)]', 'text-caption'],
  ['text-sm font-semibold text-zinc-900', 'text-body-sm font-semibold text-zinc-900'],
  ['text-sm font-medium text-[var(--admin-text)]', 'text-body-sm font-medium text-[var(--admin-text)]'],
  ['TableCell className="text-sm"', 'TableCell className="text-body-sm"'],
  ['TableCell className="font-mono text-sm"', 'TableCell className="font-mono text-body-sm"'],
  ['TableCell className="max-w-[220px] truncate text-sm', 'TableCell className="max-w-[220px] truncate text-body-sm'],
  ['TableCell className="max-w-[16rem] truncate text-sm"', 'TableCell className="max-w-[16rem] truncate text-body-sm"'],
  ['className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm"', 'className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-body-sm"'],
  ['className="h-9 max-w-xs rounded-md border border-zinc-300 px-2 text-sm"', 'className="h-9 max-w-xs rounded-md border border-zinc-300 px-2 text-body-sm"'],
  ['inline-block text-sm text-blue-600', 'inline-block text-body-sm text-blue-600'],
  ['grid gap-2 text-sm ', 'grid gap-2 text-body-sm '],
  ['pt-6 text-sm ', 'pt-6 text-body-sm '],
  ['p-6 text-sm"', 'p-6 text-body-sm"'],
  ['gap-3 text-sm"', 'gap-3 text-body-sm"'],
  ['items-center gap-2 text-sm"', 'items-center gap-2 text-body-sm"'],
  ['label className="flex cursor-pointer items-center gap-2 text-sm', 'label className="flex cursor-pointer items-center gap-2 text-body-sm'],
]

const SKIP_DIRS = new Set(['ui', 'admin-tour'])

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue
      walk(p, files)
    } else if (/\.(tsx|ts|css)$/.test(name)) {
      files.push(p)
    }
  }
  return files
}

let changed = 0
for (const file of walk(ROOT)) {
  if (file.includes(`${path.sep}ui${path.sep}`)) continue
  let src = fs.readFileSync(file, 'utf8')
  const before = src
  for (const [from, to] of REPLACEMENTS) {
    src = src.split(from).join(to)
  }
  // Pass 2: remaining Tailwind text-sm → tokenized body-sm (skip ui primitives)
  if (!file.includes(`${path.sep}ui${path.sep}`)) {
    src = src.replace(/\btext-sm\b/g, 'text-body-sm')
  }

  if (src !== before) {
    changed++
    if (!DRY) fs.writeFileSync(file, src)
    console.log(path.relative(ROOT, file))
  }
}

console.log(DRY ? `[dry] would update ${changed} files` : `updated ${changed} files`)
