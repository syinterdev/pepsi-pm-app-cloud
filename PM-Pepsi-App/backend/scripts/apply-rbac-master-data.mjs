import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const p = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/routes/master-data.ts')
let c = fs.readFileSync(p, 'utf8')
c = c.replace(
  "import { createRequireApiAuth } from '../middleware/require-api-auth.js'",
  "import { createRequirePermission } from '../middleware/require-permission.js'",
)
c = c.replace(
  /  const requireAuth = createRequireApiAuth\(sessionSecret\)\n\n  app\.use/,
  `  const perm = createRequirePermission(pool, sessionSecret)
  const requireRead = perm('master-data.read')
  const requireWrite = perm('master-data.write')
  const requireDelete = perm('master-data.delete')
  const requireImport = perm('master-data.import')

  app.use`,
)
c = c.replaceAll('requireAuth,', '...requireWrite,')
c = c.replace(
  "app.get('/api/v1/master-data/:entity', ...requireWrite,",
  "app.get('/api/v1/master-data/:entity', ...requireRead,",
)
c = c.replace(
  "    '/api/v1/master-data/:entity/meta',\n    ...requireWrite,",
  "    '/api/v1/master-data/:entity/meta',\n    ...requireRead,",
)
c = c.replaceAll(
  /(\/api\/v1\/master-data\/[^']+\/import',\n    )\.\.\.requireWrite,/g,
  '$1...requireImport,',
)
c = c.replaceAll(
  /(app\.delete\(\n    '\/api\/v1\/master-data\/[^']+',\n    )\.\.\.requireWrite,/g,
  '$1...requireDelete,',
)
fs.writeFileSync(p, c)
console.log('master-data updated; requireAuth left:', (c.match(/requireAuth/g) || []).length)
