import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '..', 'src')

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory() && ent.name !== 'node_modules') walk(p, files)
    else if (ent.isFile() && /\.(tsx?)$/.test(ent.name)) files.push(p)
  }
  return files
}

const patterns = [
  [
    /hints=\{t\('([^']+)',\s*\{\s*returnObjects:\s*true\s*\}\)\s*as\s*string\[\]\}/g,
    "hints={hintsFromT(t, '$1')}",
  ],
  [
    /const hints = t\('([^']+)',\s*\{\s*returnObjects:\s*true\s*\}\)\s*as\s*string\[\]/g,
    "const hints = hintsFromT(t, '$1')",
  ],
  [
    /const pageHints = t\('([^']+)',\s*\{\s*returnObjects:\s*true\s*\}\)\s*as\s*string\[\]/g,
    "const pageHints = hintsFromT(t, '$1')",
  ],
]

let changed = 0
for (const file of walk(src)) {
  let content = fs.readFileSync(file, 'utf8')
  if (!content.includes('returnObjects: true') || !content.includes('as string[]')) continue
  const orig = content
  for (const [re, repl] of patterns) {
    content = content.replace(re, repl)
  }
  if (content === orig) continue
  if (!content.includes("from '@/lib/i18n-hints'")) {
    const importMatch = content.match(/^import .+$/m)
    if (importMatch) {
      const idx = content.indexOf(importMatch[0]) + importMatch[0].length
      content =
        content.slice(0, idx) +
        "\nimport { hintsFromT } from '@/lib/i18n-hints'" +
        content.slice(idx)
    }
  }
  fs.writeFileSync(file, content)
  changed++
  console.log('updated:', path.relative(path.join(__dirname, '..'), file))
}
console.log('Total:', changed)
