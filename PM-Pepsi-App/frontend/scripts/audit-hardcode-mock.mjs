/**
 * Audit: hard-coded hex colors, mock labels, pages without API hooks.
 * Run: node scripts/audit-hardcode-mock.mjs
 * Exit 1 when production UI still contains "(mock)" labels.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const hexRe = /#[0-9a-fA-F]{3,8}\b/g
const zincRe = /\b(?:text|bg|border)-zinc-\d+/g
const mockRe = /\(mock\)|ไม่มีข้อมูล \(mock\)|ข้อความ.*\(mock\)/i
const violetRe = /\b(?:text|bg|border)-violet-\d+/g

const allowHexFiles = new Set([
  'features/admin/branding/branding-constants.ts',
  'features/admin/branding/TypographyCard.tsx',
  'features/admin/branding/ColorPickerCard.tsx',
  'features/admin/roles/CreateRoleDialog.tsx',
  'features/settings/settings-schemas.test.ts',
  'features/board/engineering-board.css',
  'features/board/engineering-board-theme.css',
])

/** Dev-only or thin wrappers — not counted as "no API" production gaps */
const pageApiAllowlist = new Set([
  'features/admin/users/AdminUsersPage.tsx',
  'features/dev/UiPlaygroundPage.tsx',
])

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, files)
    else if (/\.(tsx|ts|css)$/.test(name) && !/\.test\.(tsx|ts)$/.test(name)) files.push(p)
  }
  return files
}

function pageHasApi(rel, s) {
  if (pageApiAllowlist.has(rel)) return true
  if (/useQuery|useMutation|fetch[A-Z]|get[A-Z][a-zA-Z]*\(/.test(s)) return true
  if (/<[A-Z][a-zA-Z]*Page[\s/>]/.test(s)) return true
  return false
}

const pages = []
const mockHits = []
const hexHits = []
let zincTotal = 0
let violetTotal = 0

for (const file of walk(path.join(SRC, 'features'))) {
  const rel = path.relative(SRC, file).replace(/\\/g, '/')
  if (rel.startsWith('features/dev/')) continue

  const s = fs.readFileSync(file, 'utf8')

  if (/Page\.tsx$/.test(rel)) {
    const hasApi = pageHasApi(rel, s)
    pages.push({ rel, hasApi })
  }

  const hex = [...new Set(s.match(hexRe) ?? [])]
  if (hex.length && !allowHexFiles.has(rel) && !rel.includes('/branding/')) {
    hexHits.push({ rel, hex })
  }

  if (mockRe.test(s)) mockHits.push(rel)

  zincTotal += (s.match(zincRe) ?? []).length
  violetTotal += (s.match(violetRe) ?? []).length
}

const noApi = pages.filter(
  (p) => !p.hasApi && !/Login|Logout|HttpError|Unexpected/.test(p.rel),
)

console.log('=== Routes audit (see docs/customer-requirements/HARDCODE-MOCK-AUDIT.md) ===\n')
console.log(`Feature files scanned (excl. dev/): ${walk(path.join(SRC, 'features')).filter((f) => !f.includes(`${path.sep}dev${path.sep}`)).length}`)
console.log(`Production pages: ${pages.length} · without obvious API: ${noApi.length}`)
noApi.forEach((p) => console.log('  -', p.rel))
console.log(`\nMock labels in production features: ${mockHits.length}`)
mockHits.forEach((f) => console.log('  -', f))
console.log(`\nHex outside branding allowlist (review, non-blocking): ${hexHits.length}`)
hexHits.forEach((h) => console.log('  -', h.rel, h.hex.join(' ')))
console.log(`\nTailwind zinc-* in features: ${zincTotal}`)
console.log(`Tailwind violet-* (off-brand): ${violetTotal}`)

if (mockHits.length) {
  console.log('\n✗ FAIL: remove "(mock)" from production UI')
  process.exit(1)
}

if (noApi.length) {
  console.log('\n⚠ Some production pages lack obvious API hooks (see list above)')
} else {
  console.log('\n✓ No "(mock)" labels in production features')
}

if (hexHits.length) {
  console.log('⚠ Hex colors remain outside branding allowlist (U2 / theme tokens)')
} else {
  console.log('✓ No stray hex in feature files')
}
