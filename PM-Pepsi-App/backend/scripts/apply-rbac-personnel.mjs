import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const p = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/routes/personnel.ts')
let c = fs.readFileSync(p, 'utf8')
c = c.replace(
  "import { forbidUnlessPermission } from '../lib/has-permission.js'\nimport { createRequireApiAuth } from '../middleware/require-api-auth.js'",
  "import { createRequirePermission } from '../middleware/require-permission.js'",
)
c = c.replace(
  /  const requireAuth = createRequireApiAuth\(sessionSecret\)[\s\S]*?async function requirePersonnelWrite/,
  `  const perm = createRequirePermission(pool, sessionSecret)
  const requirePersonnelRead = perm('personnel.read')
  const requirePersonnelWrite = perm('personnel.write')
  const requirePersonnelImport = perm('personnel.import')
  const requirePersonnelConfirmRead = perm('personnel.confirm.read')

  async function requirePersonnelWriteLegacy`,
)
// Remove legacy helper functions entirely
c = c.replace(
  /  async function requirePersonnelWriteLegacy[\s\S]*?return forbidUnlessPermission\(res, pool, user\.userst, 'personnel\.write'\)\n  \}\n\n  async function requirePersonnelImport[\s\S]*?return forbidUnlessPermission\(res, pool, user\.userst, 'personnel\.import'\)\n  \}\n\n  async function requirePersonnelConfirmRead[\s\S]*?return forbidUnlessPermission\(res, pool, user\.userst, 'personnel\.confirm\.read'\)\n  \}\n\n/,
  '\n',
)
c = c.replaceAll('requireAuth,', '...requirePersonnelWrite,')
c = c.replace(
  "'/api/v1/personnel/me/dashboard',\n    ...requirePersonnelWrite,",
  "'/api/v1/personnel/me/dashboard',\n    ...requirePersonnelRead,",
)
c = c.replace(
  "'/api/v1/personnel/admin/confirm',\n    ...requirePersonnelWrite,",
  "'/api/v1/personnel/admin/confirm',\n    ...requirePersonnelConfirmRead,",
)
c = c.replaceAll(
  /(\/api\/v1\/personnel\/admin\/import[^']*',\n    )\.\.\.requirePersonnelWrite,/g,
  '$1...requirePersonnelImport,',
)
fs.writeFileSync(p, c)
console.log('personnel ok', (c.match(/requireAuth|forbidUnless/g) || []).length)
