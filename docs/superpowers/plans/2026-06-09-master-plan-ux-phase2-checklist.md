# Master Plan — Checklist UX + Phase 2 (Edit / Log / i18n)

> **For agentic workers:** ใช้ checkbox `- [ ]` / `- [x]` อัปเดตเมื่อทำเสร็จ · อ้างอิงสเปก [`2026-06-09-master-plan-design.md`](../specs/2026-06-09-master-plan-design.md) · Phase 1 เสร็จแล้ว [`2026-06-09-master-plan-phase1.md`](2026-06-09-master-plan-phase1.md)

**อัปเดต:** 9 มิ.ย. 2026  
**เป้าหมาย:** ลูกค้าใช้ Master Plan ง่าย (ไม่สับสน filter) · แก้ค่าในเซลล์ได้ · มี log · UI สองภาษา

---

## สรุปสถานะ

| ช่วง | สถานะ | หมายเหตุ |
|------|--------|----------|
| Phase 1 — อ่านอย่างเดียว + fidelity | ✅ | seed / verify / grid พื้นฐาน |
| Phase 1.5 — UX แยกหน้า / ลดแท็บ | ✅ A1–A5 UAT | route `/master-plan` + picker + grid + UAT |
| Phase 1 polish — grid ใกล้ Excel | ✅ A4 เสร็จ | widths, sticky, summary layout |
| Phase 2 — แก้ไข + changelog | 🔶 B + C1 | API + inline edit · รอ C2 changelog UI |
| Phase 3 — ลิงก์ flow | ⏳ | IW37N / WO / equipment |
| Phase 4 — Import / Export / Publish | ⏳ | round-trip xlsx 100% |

---

## A. Phase 1.5 — UX ให้ลูกค้าใช้งานง่าย (ทำก่อน Phase 2)

### A1. แยก Master Plan ออกจากตารางอ้างอิง SAP

- [x] สร้าง route `/master-plan` (หรือ `/master-data/plan`) — แสดงเฉพาะ EE / ME / PK
- [x] หน้า `/master-data` เหลือเฉพาะตารางอ้างอิง (Equipment, Zone, Task list ฯลฯ) — ไม่มีแท็บ pm-master-*
- [x] Redirect `/master-data?entity=pm-master-ee` → `/master-plan?discipline=EE` (backward compatible)
- [x] Sidebar: **Master Plan** → `/master-plan` · รายการ **Master data (SAP)** แยก (หรืออยู่ Admin hub)
- [x] อัปเดต `nav-config.ts`, `nav-route-permissions.ts`, `USER-MANUAL-TH.md` §6.4

### A2. โครงหน้า Master Plan (ตามสเปก §6.1)

- [x] Header: ชื่อ **Master Plan** · ปี 2026 · version / source filename
- [x] แท็บระดับ 1 เท่านั้น: **Process · Electrical (EE)** | **Mechanical (ME)** | **Packing (PK)**
- [x] แท็บระดับ 2: sheet ตาม Excel (ชื่อตรงไฟล์)
- [x] ลบ/ย่อ card ข้อมูล workbook ซ้ำเมื่อ grid มี banner `… MASTER PLAN` แล้ว

### A3. Sheet picker (โดยเฉพาะ PK 37 sheets)

- [x] ถ้า sheet > 16 ตัว (PK 37): dropdown + search · EE/ME ใช้แท็บ scroll
- [x] จำ sheet ล่าสุดต่อ discipline (localStorage หรือ user pref)
- [x] แสดงจำนวนแถวต่อ sheet ในรายการเลือก

### A4. ตารางอ่านง่าย (ต่อจาก polish ล่าสุด)

- [x] Header สีน้ำเงิน + banner ชื่อ sheet
- [x] Fill-down Zone / Machine List / Min / Man / Man hour
- [x] Rowspan คอลัมน์ merge แนวตั้ง
- [x] PM list ไม่ truncate · โหลด 2,000 แถว + ปุ่ม Load more
- [x] ความกว้างคอลัมน์ preset (Zone แคบ, PM list กว้าง)
- [x] Sticky คอลัมน์ Zone + Machine List เมื่อ scroll แนวนอน
- [x] Sheet สรุป (`Total Master plan`) — layout ใกล้ Excel มากขึ้น (ไม่ใช่ col0/col1 เปล่าๆ)

### A5. UAT Phase 1.5

- [x] ลูกค้าเปิด Master Plan แล้วไม่เห็นแท็บ Equipment / Material
- [x] สลับ EE → STAX → BCP ไม่เกิน 3 คลิก (EE 15 sheets = แท็บ · 2 คลิก STAX→BCP)
- [x] PK หา sheet `PK1 (Production)` ได้จาก search

---

## B. Phase 2 — Backend (แก้ไข + log)

### B1. Database

- [x] Migration `110_master_plan_change.sql` — ตาราง `app.tb_master_plan_change` _(109 ใช้ route split แล้ว)_
- [x] คอลัมน์ `row_id` FK → `tb_master_plan_row` · `sheet_id` · `change_type` · `field_name` · `before_json` · `after_json` · `changed_by` · `changed_at` · `comment` (optional)
- [x] Index: `(sheet_id, changed_at)`, `(row_id, changed_at)`

### B2. API

- [x] `PATCH /api/v1/master-plan/rows/:rowId` — แก้ `cells_json` (partial fields) · สิทธิ์ `master-data.write`
- [x] Validate: ห้ามแก้ sheet structure · ห้ามแก้คอลัมน์ที่ไม่อยู่ใน `column_headers_json` ของ sheet
- [x] `GET /api/v1/master-plan/changes?discipline&sheetId&from&to&limit` — log ทั้ง sheet/workbook
- [x] `GET /api/v1/master-plan/rows/:rowId/changes` — log ต่อแถว
- [x] ทุก PATCH → insert `tb_master_plan_change` + `tbl_audit_log` (`action=master-plan.update`)

### B3. กฎแก้ไข (ล็อกสเปก)

- [x] แก้ได้: ค่าในเซลล์ (PM list, days, mntplan, Min, Man, Act Code ฯลฯ) — detail sheet + column ใน schema
- [x] แก้ไม่ได้: เพิ่ม/ลบแถว · เพิ่ม/ลบ sheet · เปลี่ยนชื่อคอลัมน์ — API รับเฉพาะ partial cells ที่มีอยู่แล้ว
- [x] Summary / legend sheet: read-only หรือจำกัดฟิลด์ (ตกลงกับลูกค้า) — `SHEET_READ_ONLY` 403

### B4. Tests & verify

- [x] Unit test service: patch row + changelog record
- [x] Supertest: PATCH 403 without write · 200 with write
- [x] `npm test` backend ผ่าน

---

## C. Phase 2 — Frontend (แก้ไข + ประวัติ)

### C1. Inline edit

- [x] ดouble-click หรือปุ่ม Edit บนเซลล์ที่ editable
- [x] ไม่ให้ edit คอลัมน์ fill-down anchor (Zone / Machine List) ถ้า policy = read-only
- [x] Save / Cancel · optimistic หรือ refetch หลัง save
- [x] `CanPermission` / `master-data.write` — ซ่อนปุ่มแก้ถ้าไม่มีสิทธิ์
- [x] แถว/เซลล์ที่แก้แล้ว — highlight ชั่วคราว

### C2. แผงประวัติการแก้ไข (Changelog)

- [x] ปุ่ม **ประวัติการแก้ไข** / แท็บ **Changelog** ในหน้า Master Plan
- [x] Filter: sheet · ช่วงวันที่ · ผู้แก้ · คอลัมน์
- [x] แสดง before → after ต่อฟิลด์ · ลิงก์ไปแถวใน grid
- [x] Export CSV changelog (optional)

### C3. API client

- [x] `patchMasterPlanRow(rowId, cells, discipline?)`
- [x] `fetchMasterPlanChanges(params)`
- [x] Zod schemas ตรง backend (patch response)

---

## D. i18n (EN / TH)

### D1. UI chrome — ต้องครบทั้ง en + th

- [x] `masterPlan.loadMore` / `loadingMore` — ✅ มีแล้ว
- [x] `masterPlan.editCell`, `save`, `cancel`, `editMode`
- [x] `masterPlan.changelog`, `changelogTitle`, `changedBy`, `changedAt`, `before`, `after`
- [x] `masterPlan.noWritePermission`, `readOnlySheet`, `saveSuccess`, `saveFailed`
- [x] `masterPlan.sheetSearch`, `sheetSearchPlaceholder`
- [x] หน้า `/master-plan`: `masterPlanPage.title`, `masterPlanPage.description` แยกจาก `/master-data` (`referencePage`)

### D2. สิ่งที่ไม่แปล (fidelity)

- [x] เอกสาร/คู่มือ: **ชื่อคอลัมน์ Excel แสดงตามไฟล์ลูกค้า** — ไม่แปลใน DB (`USER-MANUAL-TH` §6.4 · design spec §11)
- [x] ข้อมูล PM list ภาษาไทย — แสดงตามต้นฉบับ (grid ไม่ผ่าน i18n · แถบ `fidelityNote` บนหน้า)

### D3. Tooltip ช่วยอธิบาย (optional แต่ช่วยลูกค้า)

- [x] คีย์ `masterPlan.columnHint.zone`, `machineList`, `mntplan`, `pmlist`, `legacy` ฯลฯ (EN/TH ละเอียด)
- [x] ไอคอน ? ที่ header คอลัมน์หลัก (`MasterPlanColumnHeader` · detail + summary grid)

---

## E. Phase 3 — ลิงก์ flow (หลัง Phase 2)

- [x] `GET /api/v1/master-plan/rows/:rowId/links` — IW37N / WO / equipment
- [x] ปุ่มหรือเมนู context บนแถว: เปิด IW37N filter mntplan · WO modal · PM 3-phase
- [x] Badge จำนวน WO ที่ match

---

## F. Phase 4 — Import / Export / Publish

- [x] `POST /api/v1/master-plan/import` — Excel ใหม่ → version draft + diff
- [x] `GET` export `.xlsx` round-trip 100%
- [x] `POST /api/v1/master-plan/publish` → `tbtasklist`
- [x] UI: Import · Export · Publish · แสดงสถานะ sync / diverged

---

## G. เอกสาร & สื่อสารลูกค้า

- [x] อัปเดต `docs/USER-MANUAL-TH.md` — หน้า Master Plan แยก · วิธีแก้ · ดู log · import/export/publish
- [x] อัปเดต `docs/customer-requirements/UAT-ITEM5-EXCEL-CUSTOMER-FILES.md` — §4.4 Master Plan UAT
- [x] อัปเดตสเปก §สถานะ Phase 1.5 / 2 / 3 / 4 → ✅ code
- [x] ข้อความตอบลูกค้า: สเปก §13 + สรุปด้านล่าง

### ข้อความตอบลูกค้า (สรุปสั้น — copy ได้)

| Phase | สิ่งที่ลูกค้าได้ |
|-------|----------------|
| **1** | อ่านแผน PM EE/ME/PK ตาม Excel ต้นฉบับ (sheet · คอลัมน์ · fill-down) |
| **1.5** | หน้า Master Plan แยกจาก Master Data SAP — ไม่ปน 17 แท็บอ้างอิง |
| **2** | แก้ค่าในเซลล์ + ประวัติการแก้ไข (who / when / before / after) |
| **3** | ลิงก์จากแถวไป IW37N · WO · PM 3-phase |
| **4** | นำเข้า Excel ใหม่ (draft) · ส่งออก · เผยแพร่ไป Task list |

รายละเอียดเต็ม: [`docs/superpowers/specs/2026-06-09-master-plan-design.md`](../specs/2026-06-09-master-plan-design.md) §13

---

## H. Definition of Done (ปิด Phase 1.5 + 2)

| เกณฑ์ | ตรวจ |
|-------|------|
| ลูกค้าเข้า Master Plan ไม่เห็น 17 แท็บ SAP | ☐ |
| แก้ PM list / days / Min แล้ว refresh ยังอยู่ | ☐ |
| ประวัติแสดง who / when / before / after | ☐ |
| ไม่มีสิทธิ์ write → ไม่มีปุ่มแก้ | ☐ |
| UI สลับ EN/TH ได้ (label ปุ่ม/แผง) | ☐ |
| `npm test` + `npm run verify:master-plan` ผ่าน | ☐ |
| UAT ลูกค้า sign-off | ☐ |

---

## ลำดับ implement แนะนำ

1. **A1–A3** — แยก `/master-plan` (ผลเร็ว ลด feedback filter)
2. **A4 ที่เหลือ** — polish grid
3. **B1–B4** — backend Phase 2
4. **C1–C3 + D1** — frontend edit + log + i18n
5. **G + H** — เอกสาร + UAT

---

## ไฟล์ที่คาดว่าจะแตะ (อ้างอิง)

| ช่วง | ไฟล์ |
|------|------|
| 1.5 route | `frontend/src/routes` หรือ router, `MasterPlanPage.tsx` (ใหม่), `MasterDataPage.tsx` |
| Nav | `nav-config.ts`, `nav-route-permissions.ts` |
| Phase 2 DB | `database/migrations/110_master_plan_change.sql` |
| Phase 2 API | `routes/master-plan.ts`, `services/master-plan.ts` |
| Phase 2 UI | `MasterPlanSheetGrid.tsx`, `MasterPlanChangeLogPanel.tsx` (ใหม่) |
| i18n | `i18n/locales/en/th/masterData.json` (+ `masterPlan.json` ถ้าแยก) |
