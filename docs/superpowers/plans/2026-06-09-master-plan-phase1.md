# Master Plan Phase 1 — Read-only Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**สถานะ:** ✅ **เสร็จแล้ว** (implement 9 มิ.ย. 2026) · verify script ผ่าน · รอ UAT ลูกค้าเทียบ Excel บนจอ

**Goal:** Persist customer Master Plan workbooks (EE / ME / PK) in PostgreSQL and display them on `/master-data` with exact sheet names, order, per-sheet headers, and fill-down — read-only, no edit/log yet.

**Architecture:** Hybrid model (spec §4C): relational `workbook → sheet → row` with `column_headers_json` per sheet and `cells_json` per row (keyed by header label). Backend parses all sheets (no skip). Seed script loads 3 customer xlsx files. Frontend replaces `PmMasterProcessPanel` with API-driven sheet tabs + grid. Reuse permission `master-data.read`.

**Tech Stack:** PostgreSQL 18 · Express + `pg` + Zod · `xlsx` (backend) · React + TanStack Query · Vitest

**Spec:** [`docs/superpowers/specs/2026-06-09-master-plan-design.md`](../specs/2026-06-09-master-plan-design.md)

---

## สรุปความคืบหน้า (Implementation status)

| Task | สถานะ | หมายเหตุ |
|------|--------|----------|
| 1 Database migration | ✅ | `database/migrations/108_master_plan_tables.sql` |
| 2 Parser (ทุก sheet) | ✅ | `backend/src/lib/master-plan-parse.ts` + tests |
| 3 Fill-down display | ✅ | `backend/src/lib/master-plan-display.ts` + tests |
| 4 Service + Zod | ✅ | `services/master-plan.ts`, `schemas/master-plan.ts` |
| 5 Seed CLI | ✅ | `npm run seed:master-plan` |
| 6 API routes | ✅ | `GET /api/v1/master-plan/:discipline`, `.../sheets/:id/rows` |
| 7 Verify script | ✅ | `npm run verify:master-plan` — EE/ME/PK ผ่าน |
| 8 Frontend API client | ✅ | `frontend/src/lib/master-plan-api.ts` |
| 9 UI sheet grid | ✅ | `MasterPlanDisciplineView`, `MasterPlanSheetGrid` |
| 10 Wire MasterDataPage | ✅ | แทน `PmMasterProcessPanel` · i18n แท็บใหม่ |
| 11 Build & test | ✅ | backend 319 tests · frontend build ผ่าน |
| 12 Docs | ✅ | spec + plan + คู่มือ §6.4 |

**ข้อมูลที่ seed แล้ว (verify ตรงไฟล์ลูกค้า):**

| สาขา | Sheets | แถวใน DB |
|------|--------|----------|
| EE | 15 | 2,746 |
| ME | 16 | 2,379 |
| PK | 37 | 6,316 |

**UI:** `/master-data` → แท็บ **Process · Electrical (EE)** / **Mechanical (ME)** / **Packing (PK)** → แท็บ sheet ตามชื่อ Excel

**ยังไม่ทำ (Phase 2+):** แก้เซลล์ · changelog · import API · publish tasklist · export xlsx · ลิงก์ WO/IW37N

**Dev — รัน seed ครั้งแรกบนเครื่องใหม่:**

```powershell
cd PM-Pepsi-App/backend
npm run seed:master-plan
npm run verify:master-plan
```

---

## File map

| File | Responsibility |
|------|----------------|
| `database/migrations/108_master_plan_tables.sql` | Tables + indexes |
| `PM-Pepsi-App/backend/src/lib/master-plan-parse.ts` | Parse xlsx → structured workbook (all sheets) |
| `PM-Pepsi-App/backend/src/lib/master-plan-parse.test.ts` | Parser unit tests |
| `PM-Pepsi-App/backend/src/lib/master-plan-display.ts` | Fill-down + display row builder |
| `PM-Pepsi-App/backend/src/lib/master-plan-display.test.ts` | Fill-down tests |
| `PM-Pepsi-App/backend/src/schemas/master-plan.ts` | Zod API shapes |
| `PM-Pepsi-App/backend/src/services/master-plan.ts` | DB seed + read queries |
| `PM-Pepsi-App/backend/src/routes/master-plan.ts` | GET endpoints |
| `PM-Pepsi-App/backend/scripts/seed-master-plan.ts` | CLI seed from customer files |
| `PM-Pepsi-App/backend/scripts/verify-master-plan-fidelity.ts` | Golden check vs xlsx |
| `PM-Pepsi-App/frontend/src/lib/master-plan-api.ts` | Fetch helpers |
| `PM-Pepsi-App/frontend/src/features/master-plan/MasterPlanDisciplineView.tsx` | Discipline shell (EE/ME/PK) |
| `PM-Pepsi-App/frontend/src/features/master-plan/MasterPlanSheetGrid.tsx` | Sheet title + dynamic table |
| `PM-Pepsi-App/frontend/src/features/master-plan/master-plan-discipline-view.test.tsx` | Smoke render test *(ยังไม่สร้าง — optional Phase 1)* |
| Modify `PM-Pepsi-App/backend/src/app.ts` | Register routes |
| Modify `PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx` | Wire new views |
| Modify `PM-Pepsi-App/frontend/src/i18n/locales/{en,th}/masterData.json` | Tab labels + copy |

**Out of scope Phase 1:** PATCH rows, changelog, import API, publish to tasklist, export xlsx, flow links.

---

### Task 1: Database migration ✅

**Files:**
- Create: `database/migrations/108_master_plan_tables.sql`

- [x] **Step 1: Add migration**

```sql
-- 108 — Master Plan (EE / ME / PK workbooks)

CREATE TABLE IF NOT EXISTS app.tb_master_plan_workbook (
  id              serial PRIMARY KEY,
  discipline      varchar(2) NOT NULL CHECK (discipline IN ('EE', 'ME', 'PK')),
  plan_year       integer NOT NULL DEFAULT 2026,
  source_filename varchar(255) NOT NULL,
  version_no      integer NOT NULL DEFAULT 1,
  status          varchar(16) NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft', 'published')),
  imported_at     timestamptz NOT NULL DEFAULT now(),
  imported_by     varchar(64),
  UNIQUE (discipline, plan_year, version_no)
);

CREATE TABLE IF NOT EXISTS app.tb_master_plan_sheet (
  id                   serial PRIMARY KEY,
  workbook_id          integer NOT NULL REFERENCES app.tb_master_plan_workbook (id) ON DELETE CASCADE,
  sheet_name           varchar(128) NOT NULL,
  sort_order           integer NOT NULL,
  title_rows_json      jsonb NOT NULL DEFAULT '[]'::jsonb,
  column_headers_json  jsonb NOT NULL DEFAULT '[]'::jsonb,
  header_row_index     integer,
  sheet_kind           varchar(16) NOT NULL DEFAULT 'detail'
                         CHECK (sheet_kind IN ('detail', 'summary', 'legend', 'reference')),
  UNIQUE (workbook_id, sheet_name)
);

CREATE INDEX IF NOT EXISTS idx_master_plan_sheet_workbook
  ON app.tb_master_plan_sheet (workbook_id, sort_order);

CREATE TABLE IF NOT EXISTS app.tb_master_plan_row (
  id           bigserial PRIMARY KEY,
  sheet_id     integer NOT NULL REFERENCES app.tb_master_plan_sheet (id) ON DELETE CASCADE,
  row_index    integer NOT NULL,
  cells_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (sheet_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_master_plan_row_sheet
  ON app.tb_master_plan_row (sheet_id, row_index);
```

- [x] **Step 2: Run migration**

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://pepsipm:pepsipm@127.0.0.1:5432/pepsi_pm" -f database/migrations/108_master_plan_tables.sql
```

Expected: `CREATE TABLE` ×3, `CREATE INDEX` ×2

---

### Task 2: Parser — all sheets, no skip ✅

**Files:**
- Create: `PM-Pepsi-App/backend/src/lib/master-plan-parse.ts`
- Create: `PM-Pepsi-App/backend/src/lib/master-plan-parse.test.ts`

- [x] **Step 1: Write failing tests**

```typescript
// master-plan-parse.test.ts
import { readFileSync } from 'node:fs'
import { parseMasterPlanWorkbook } from './master-plan-parse.js'

const EE = 'docs from customer/01-MASTER PM PROCESS EE 2026.xlsx'

describe('parseMasterPlanWorkbook', () => {
  it('EE has 15 sheets in original order', () => {
    const buf = readFileSync(EE)
    const wb = parseMasterPlanWorkbook(buf, 'EE')
    expect(wb.sheets.map((s) => s.sheetName)).toEqual([
      'SCHAAF#1',
      'SCHAAF#2 (New)',
      'BCP',
      'Frypack',
      'STAX',
      'PC50MZ',
      'PELLET630',
      'PELLET500',
      'RBS',
      'STAX CANISTER',
      'FCP',
      'PC14',
      'SCHAAF#2',
      'Total Master plan',
      'Total Master plan (AM)',
    ])
  })

  it('SCHAAF#1 header includes Zone and PM list', () => {
    const buf = readFileSync(EE)
    const sheet = parseMasterPlanWorkbook(buf, 'EE').sheets.find((s) => s.sheetName === 'SCHAAF#1')!
    expect(sheet.columnHeaders).toContain('Zone')
    expect(sheet.columnHeaders.some((h) => h.toLowerCase().includes('pm list'))).toBe(true)
  })

  it('does not skip Total Master plan sheet', () => {
    const buf = readFileSync(EE)
    const names = parseMasterPlanWorkbook(buf, 'EE').sheets.map((s) => s.sheetName)
    expect(names).toContain('Total Master plan')
  })
})
```

- [x] **Step 2: Run test — expect FAIL**

```powershell
cd PM-Pepsi-App/backend
npm test -- src/lib/master-plan-parse.test.ts
```

- [x] **Step 3: Implement parser**

Core types:

```typescript
export type MasterPlanDiscipline = 'EE' | 'ME' | 'PK'

export type ParsedMasterPlanSheet = {
  sheetName: string
  sortOrder: number
  titleRows: string[][]
  columnHeaders: string[]
  headerRowIndex: number | null
  sheetKind: 'detail' | 'summary' | 'legend' | 'reference'
  rows: { rowIndex: number; cells: Record<string, string> }[]
}

export type ParsedMasterPlanWorkbook = {
  discipline: MasterPlanDiscipline
  sourceFilename: string
  sheets: ParsedMasterPlanSheet[]
}
```

Implementation notes:
- Use `xlsx` `sheet_to_json` header:1
- **Do not** filter sheet names (remove `SKIP_SHEETS` from old frontend logic)
- Detect header row: first row where normalized cells include `zone` AND `pm list` (case-insensitive)
- If no header: `sheetKind = 'summary'` (or `legend` if name matches `/^legend$/i`) — store non-empty rows with keys `col0`, `col1`, … OR raw `cells_json` arrays
- Map data rows: `{ [header]: cellStr(value) }` for each header column index
- Preserve `titleRows` = all rows before header row (or first 2 rows if no header)

- [x] **Step 4: Run tests — expect PASS**

```powershell
npm test -- src/lib/master-plan-parse.test.ts
```

- [x] **Step 5: Add ME + PK sheet count tests**

```typescript
it('ME has 16 sheets', () => {
  const buf = readFileSync('docs from customer/02-MASTER PM PROCESS ME 2026.xlsx')
  expect(parseMasterPlanWorkbook(buf, 'ME').sheets).toHaveLength(16)
})

it('PK has 37 sheets', () => {
  const buf = readFileSync('docs from customer/03-MASTER PM PACKING 2026.xlsx')
  expect(parseMasterPlanWorkbook(buf, 'PK').sheets).toHaveLength(37)
})
```

---

### Task 3: Fill-down display helper ✅

**Files:**
- Create: `PM-Pepsi-App/backend/src/lib/master-plan-display.ts`
- Create: `PM-Pepsi-App/backend/src/lib/master-plan-display.test.ts`

- [x] **Step 1: Test fill-down for Zone and Machine List**

```typescript
import { applyFillDownDisplay } from './master-plan-display.js'

it('fills empty Zone from row above', () => {
  const rows = [
    { cells: { Zone: 'SE0', 'Machine List': 'Batch Mixer' } },
    { cells: { Zone: '', 'Machine List': 'Agitator' } },
  ]
  const out = applyFillDownDisplay(rows, ['Zone', 'Machine List'])
  expect(out[1].display.Zone).toBe('SE0')
  expect(out[1].display['Machine List']).toBe('Agitator')
})
```

- [x] **Step 2: Implement `applyFillDownDisplay`**

Fill columns whose header matches `/^zone$/i` or `/machine list/i` when cell empty.

- [x] **Step 3: Run tests**

```powershell
npm test -- src/lib/master-plan-display.test.ts
```

---

### Task 4: Service — seed and read ✅

**Files:**
- Create: `PM-Pepsi-App/backend/src/schemas/master-plan.ts`
- Create: `PM-Pepsi-App/backend/src/services/master-plan.ts`

- [x] **Step 1: Zod schemas**

```typescript
export const masterPlanSheetSummarySchema = z.object({
  id: z.number().int(),
  sheetName: z.string(),
  sortOrder: z.number().int(),
  sheetKind: z.enum(['detail', 'summary', 'legend', 'reference']),
  rowCount: z.number().int(),
})

export const masterPlanWorkbookSchema = z.object({
  discipline: z.enum(['EE', 'ME', 'PK']),
  planYear: z.number().int(),
  sourceFilename: z.string(),
  versionNo: z.number().int(),
  sheets: z.array(masterPlanSheetSummarySchema),
})
```

- [x] **Step 2: Implement `seedMasterPlanWorkbook(pool, parsed, actorId?)`**

Transaction:
1. Insert workbook (or replace published for discipline+year — delete cascade old rows for idempotent re-seed)
2. Insert sheets with `title_rows_json`, `column_headers_json`, `header_row_index`, `sheet_kind`
3. Bulk insert rows (`cells_json`)

- [x] **Step 3: Implement `getPublishedWorkbook(pool, discipline)`**

Returns workbook + sheet list ordered by `sort_order`.

- [x] **Step 4: Implement `getSheetRows(pool, sheetId, { offset, limit })`**

Returns `{ titleRows, columnHeaders, sheetKind, rows: { rowIndex, cells, display }[] }` with fill-down applied on `display`.

---

### Task 5: Seed CLI ✅

**Files:**
- Create: `PM-Pepsi-App/backend/scripts/seed-master-plan.ts`
- Modify: `PM-Pepsi-App/backend/package.json` — add script `"seed:master-plan": "tsx scripts/seed-master-plan.ts"`

- [x] **Step 1: Script loads 3 files and seeds**

```typescript
const FILES: Record<MasterPlanDiscipline, string> = {
  EE: 'docs from customer/01-MASTER PM PROCESS EE 2026.xlsx',
  ME: 'docs from customer/02-MASTER PM PROCESS ME 2026.xlsx',
  PK: 'docs from customer/03-MASTER PM PACKING 2026.xlsx',
}
```

Run from repo root:

```powershell
cd PM-Pepsi-App/backend
npm run seed:master-plan
```

Expected: 3 workbooks inserted, row counts ~2718 + ~2336 + ~6183 total rows.

---

### Task 6: API routes ✅

**Files:**
- Create: `PM-Pepsi-App/backend/src/routes/master-plan.ts`
- Modify: `PM-Pepsi-App/backend/src/app.ts`

- [x] **Step 1: Routes**

```typescript
// GET /api/v1/master-plan/:discipline  — EE | ME | PK
// GET /api/v1/master-plan/sheets/:sheetId/rows?offset=0&limit=500
```

Both require `master-data.read` via `createRequirePermission`.

- [x] **Step 2: Register in app.ts**

```typescript
import { registerMasterPlanRoutes } from './routes/master-plan.js'
// ...
registerMasterPlanRoutes(app, opts.pool, opts.sessionSecret)
```

- [x] **Step 3: Manual curl**

```powershell
# after login cookie / use dev session
curl -s http://localhost:4000/api/v1/master-plan/EE -H "Cookie: ..."
```

Expected: JSON with 15 sheets, names match Excel.

---

### Task 7: Fidelity verification script ✅

**Files:**
- Create: `PM-Pepsi-App/backend/scripts/verify-master-plan-fidelity.ts`
- Modify: `package.json` — `"verify:master-plan": "tsx scripts/verify-master-plan-fidelity.ts"`

- [x] **Step 1: Script compares DB vs xlsx**

For each discipline:
- Sheet count and names + order match `parseMasterPlanWorkbook`
- Per sheet: `row_count` in DB === parsed row count
- Exit code 1 on any mismatch (for CI/UAT)

```powershell
npm run seed:master-plan
npm run verify:master-plan
```

Expected: `OK EE 15 sheets` · `OK ME 16 sheets` · `OK PK 37 sheets`

---

### Task 8: Frontend API client ✅

**Files:**
- Create: `PM-Pepsi-App/frontend/src/lib/master-plan-api.ts`
- Modify: `PM-Pepsi-App/frontend/src/api/schemas.ts` — add Zod types or import from shared if duplicated

- [x] **Step 1: Implement fetch functions**

```typescript
export async function fetchMasterPlanWorkbook(discipline: 'EE' | 'ME' | 'PK') { ... }
export async function fetchMasterPlanSheetRows(sheetId: number, offset = 0, limit = 500) { ... }
```

Use existing `apiFetch` / auth pattern from `master-data-api.ts`.

---

### Task 9: UI — discipline view + sheet grid ✅

**Files:**
- Create: `PM-Pepsi-App/frontend/src/features/master-plan/MasterPlanDisciplineView.tsx`
- Create: `PM-Pepsi-App/frontend/src/features/master-plan/MasterPlanSheetGrid.tsx`

- [x] **Step 1: `MasterPlanDisciplineView`**

- `useQuery` workbook by discipline
- Horizontal scroll `Tabs` for **every** sheet name (exact string from API)
- Description line from i18n: Process · Electrical / Mechanical / Packing
- On sheet select → load rows query

- [x] **Step 2: `MasterPlanSheetGrid`**

- Render `titleRows` as banner (join cells with spacing)
- `<Table>` with `<TableHead>` from `columnHeaders` (dynamic count per sheet)
- Body: use `display` cells from API (fill-down already applied)
- Virtual scroll optional: if rows > 200, paginate with "Load more" or `@tanstack/react-virtual` (YAGNI: start with limit=500 + pagination controls)

- [x] **Step 3: Loading / empty / error states**

Reuse `MasterDataPanelSkeleton`, `MasterDataPanelError`.

---

### Task 10: Wire into Master Data page ✅

**Files:**
- Modify: `PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx`
- Modify: `PM-Pepsi-App/frontend/src/i18n/locales/en/masterData.json`
- Modify: `PM-Pepsi-App/frontend/src/i18n/locales/th/masterData.json`

- [x] **Step 1: Replace panel imports**

```tsx
// replace PmMasterProcessPanel with:
import { MasterPlanDisciplineView } from '@/features/master-plan/MasterPlanDisciplineView'

if (entity === 'pm-master-ee') return <MasterPlanDisciplineView discipline="EE" />
if (entity === 'pm-master-me') return <MasterPlanDisciplineView discipline="ME" />
if (entity === 'pm-master-pk') return <MasterPlanDisciplineView discipline="PK" />
```

- [x] **Step 2: Update tab labels**

```json
"pm-master-ee": "Process · Electrical (EE)",
"pm-master-me": "Process · Mechanical (ME)",
"pm-master-pk": "Packing (PK)"
```

(TH: ใช้คำอธิบายแผนกตามสเปก)

- [x] **Step 3: Remove file-upload UI from old `PmMasterProcessPanel`** (leave file in repo until Phase 2 confirms unused — or delete if fully replaced)

---

### Task 11: Tests and build ✅

- [ ] **Step 1: Backend**

```powershell
cd PM-Pepsi-App/backend
npm test
npm run build
npm run verify:master-plan
```

- [ ] **Step 2: Frontend**

```powershell
cd PM-Pepsi-App/frontend
npm test -- --run
npx tsc --noEmit
npm run build
```

- [ ] **Step 3: Manual UAT checklist** (spec §10)

| Check | EE | ME | PK |
|-------|----|----|-----|
| Sheet count | 15 | 16 | 37 |
| First sheet name | SCHAAF#1 / Schaaf#1 | PK1 (Production) |
| Total Master plan visible | ✓ | ✓ | ✓ |
| PK1 + PK1 (Production) both present | — | — | ✓ |
| Fill-down on sample row | ✓ | ✓ | ✓ |

Open `http://localhost:5173/master-data` → tabs Process/Packing → compare side-by-side with Excel.

---

### Task 12: Docs touch-up ✅

**Files:**
- Modify: `docs/superpowers/specs/2026-06-09-master-plan-design.md` — mark Phase 1 complete
- Modify: `docs/USER-MANUAL-TH.md` §6.4 — Master Plan read-only

- [x] Update spec + plan + คู่มือผู้ใช้

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Sheet names/order exact | 2, 7, 9, 11 |
| All sheets including Total/legend | 2 |
| Per-sheet headers | 2, 9 |
| Fill-down | 3, 9 |
| EE/ME/PK workbooks separate | 1, 5, 9 |
| Read-only Phase 1 | all (no PATCH) |
| master-data.read permission | 6 |
| Replace upload-temp UI | 10 |

**Phase 2+ not in this plan:** edit, changelog, links, publish, export.

---

## Future phases (reference only)

| Phase | Plan file (to create later) |
|-------|----------------------------|
| 2 Edit + log | `2026-06-XX-master-plan-phase2.md` |
| 3 Flow links | `2026-06-XX-master-plan-phase3.md` |
| 4 Publish + export xlsx | `2026-06-XX-master-plan-phase4.md` |
