import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const p = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/routes/work-orders.ts')
let c = fs.readFileSync(p, 'utf8')
c = c.replace(
  "import { forbidUnlessPermission } from '../lib/has-permission.js'\nimport { createRequireApiAuth } from '../middleware/require-api-auth.js'",
  "import { createRequirePermission } from '../middleware/require-permission.js'",
)
c = c.replace(
  /  const requireAuth = createRequireApiAuth\(sessionSecret\)/,
  `  const perm = createRequirePermission(pool, sessionSecret)
  const requireWoRead = perm('work-orders.read')
  const requireWoWrite = perm('work-orders.write')
  const requirePlanningWrite = perm('planning.write')
  const requirePlanningAssign = perm('planning.assign')
  const requirePlanningDelete = perm('planning.delete')
  const requireConfirmRead = perm('confirmation.read')
  const requireConfirmWrite = perm('confirmation.write')
  const requireConfirmImport = perm('confirmation.import')`,
)
c = c.replaceAll('requireAuth,', '...requireWoRead,')

const planningWritePaths = [
  "'/api/v1/work-orders/:id/planning',\n    ...requireWoRead,",
  "'/api/v1/work-orders/:id/team',\n    ...requireWoRead,",
]
for (const old of planningWritePaths) {
  if (c.includes(old)) {
    c = c.replace(old, old.replace('requireWoRead', 'requirePlanningWrite'))
  }
}
c = c.replace(
  "'/api/v1/work-orders/:id/planning/batch',\n    ...requireWoRead,",
  "'/api/v1/work-orders/:id/planning/batch',\n    ...requirePlanningAssign,",
)
c = c.replaceAll(
  /app\.delete\(\n    '\/api\/v1\/work-orders\/:id\/planning[^']*',\n    \.\.\.requireWoRead,/g,
  (m) => m.replace('requireWoRead', 'requirePlanningDelete'),
)

c = c.replaceAll(
  /'\/api\/v1\/confirmation[^']*',\n    \.\.\.requireWoRead,/g,
  (m) => {
    if (m.includes('/import')) return m.replace('requireWoRead', 'requireConfirmImport')
    if (m.includes('export')) return m.replace('requireWoRead', 'requireConfirmRead')
    if (m.includes('/close') || m.includes('/comments') || m.includes('/images')) {
      if (m.includes('app.post') || m.includes('app.put') || m.includes('app.delete')) {
        return m.replace('requireWoRead', 'requireConfirmWrite')
      }
    }
    return m.replace('requireWoRead', 'requireConfirmRead')
  },
)

// Fix POST/PUT/DELETE confirmation mutations missed above
const confirmMutationPatterns = [
  ["app.post(\n    '/api/v1/confirmation/", 'requireConfirmWrite'],
  ["app.put(\n    '/api/v1/confirmation/", 'requireConfirmWrite'],
  ["app.delete(\n    '/api/v1/confirmation/", 'requireConfirmWrite'],
]
for (const [prefix, perm] of confirmMutationPatterns) {
  const re = new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^']*',\\n    \\.\\.\\.requireConfirmRead,`, 'g')
  c = c.replace(re, (m) => m.replace('requireConfirmRead', perm))
}

c = c.replace(
  "app.post(\n    '/api/v1/confirmation/import',\n    ...requireConfirmRead,",
  "app.post(\n    '/api/v1/confirmation/import',\n    ...requireConfirmImport,",
)

// Remove inline forbidUnlessPermission blocks for planning routes
c = c.replace(
  /\n      const user = req\.authUser\n      if \(!user\) \{\n        res\.status\(401\)\.json\(\{ error: 'UNAUTHORIZED' \}\)\n        return\n      \}\n      if \(!\(await forbidUnlessPermission\(res, pool, user\.userst, 'planning\.write'\)\)\) return\n/g,
  '\n',
)
c = c.replace(
  /\n      const user = req\.authUser\n      if \(!user\) \{\n        res\.status\(401\)\.json\(\{ error: 'UNAUTHORIZED' \}\)\n        return\n      \}\n      if \(!\(await forbidUnlessPermission\(res, pool, user\.userst, 'planning\.assign'\)\)\) return\n/g,
  '\n',
)
c = c.replace(
  /\n      const user = req\.authUser\n      if \(!user\) \{\n        res\.status\(401\)\.json\(\{ error: 'UNAUTHORIZED' \}\)\n        return\n      \}\n      if \(!\(await forbidUnlessPermission\(res, pool, user\.userst, 'planning\.delete'\)\)\) return\n/g,
  '\n',
)
c = c.replace(
  /\n      if \(!\(await forbidUnlessPermission\(res, pool, user\.userst, 'confirmation\.import'\)\)\) return\n/g,
  '\n',
)

// team patch -> work-orders.write
c = c.replace(
  "app.put(\n    '/api/v1/work-orders/:id/team',\n    ...requirePlanningWrite,",
  "app.put(\n    '/api/v1/work-orders/:id/team',\n    ...requireWoWrite,",
)

fs.writeFileSync(p, c)
console.log('work-orders updated; forbidUnless left:', (c.match(/forbidUnlessPermission/g) || []).length)
