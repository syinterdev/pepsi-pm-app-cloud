/**
 * Replace legacy p-6 permission blocks with AdminPageRoot + AdminAccessDenied.
 * Run: node scripts/migrate-admin-access-denied.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/features/admin')

const FILES = [
  ['about/AdminAboutPage.tsx', 'admin-about', 'admin.about.read'],
  ['announcements/AdminAnnouncementsPage.tsx', 'admin-announcements', 'admin.announcement.read'],
  ['audit/AdminAuditPage.tsx', 'admin-audit', 'admin.audit.read'],
  ['backup/AdminBackupPage.tsx', 'admin-backup', 'admin.backup.read'],
  ['health/AdminHealthPage.tsx', 'admin-health', 'admin.health.read'],
  ['master/AdminMasterHubPage.tsx', 'admin-master', 'master-data.read'],
  ['menu/AdminMenuPage.tsx', 'admin-menu', 'admin.menu.read'],
  ['security/AdminSecurityPage.tsx', 'admin-security', 'admin.security.read'],
]

const IMPORT =
  "import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'\nimport { AdminPageRoot } from '@/components/admin/AdminPageRoot'\n"

for (const [rel, tour, perm] of FILES) {
  const file = path.join(ROOT, rel)
  let src = fs.readFileSync(file, 'utf8')
  const block = `      <div className="p-6">
        <p className="text-caption">
          ไม่มีสิทธิ์ <code className="text-xs">${perm}</code>
        </p>
        <Link to="/" className="mt-2 inline-block text-body-sm text-blue-600 underline">
          กลับหน้าแรก
        </Link>
      </div>`

  const replacement = `      <AdminPageRoot tourTarget="${tour}">
        <AdminAccessDenied
          message={
            <>
              ไม่มีสิทธิ์ <code className="text-xs">${perm}</code>
            </>
          }
        />
      </AdminPageRoot>`

  if (!src.includes(block)) {
    console.warn('skip (no block):', rel)
    continue
  }
  src = src.replace(block, replacement)
  if (!src.includes("AdminAccessDenied")) {
    const anchor = src.includes("import { AdminPageRoot")
      ? "import { AdminPageRoot }"
      : src.includes("import { AdminPageHeader")
        ? "import { AdminPageHeader }"
        : null
    if (anchor) {
      src = src.replace(
        anchor,
        `import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'\n${anchor.includes('AdminPageRoot') ? '' : "import { AdminPageRoot } from '@/components/admin/AdminPageRoot'\n"}${anchor}`,
      )
    } else if (!src.includes(IMPORT.trim())) {
      src = src.replace(/^import /m, IMPORT + 'import ')
    }
  }
  if (!src.includes("from '@/components/admin/AdminPageRoot'")) {
    src = src.replace(
      /import \{ AdminAccessDenied \}[^\n]+\n/,
      "import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'\nimport { AdminPageRoot } from '@/components/admin/AdminPageRoot'\n",
    )
  }
  fs.writeFileSync(file, src)
  console.log('updated', rel)
}
