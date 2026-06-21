# ลำดับที่ 9 — Confirmation / รับรองงาน

**สถานะรวม:** เสร็จ (แกน) — 2026-05-19  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Route:** `/confirmation`  
**Checklist หลัก:** `M_confirmation.php`, `M_Confirm.php`, `W_confirmation.php`, `modalPages/autocomplete.php`, `confirmTab*`

---

## ทำแล้ว

- [x] Route + placeholder ใน sidebar (เมนู `tbmenu` / seed)
- [x] Migration: `026_confirmation_tables.sql` (`tbcofirm`, `view_confirmation`)
- [x] Migration: `032_tbcofirm_import_uniq.sql` — เปลี่ยน unique index เป็น `(idiw37, wkctr, confirmation, timeclose)` ให้ตรง `M_Confirm.php` (PHP บรรทัด 130)
- [x] `GET /api/v1/workcenters` (รายชื่อช่าง)
- [x] `GET /api/v1/confirmation/by-wkorder/:wkorder` (โหลดรายการ close ต่อ WO)
- [x] `POST /api/v1/confirmation/:idiw37/close` (เพิ่ม/แก้ เวลา close ต่อช่าง — ปรับ ON CONFLICT ให้ใช้ unique key ใหม่)
- [x] `DELETE /api/v1/confirmation/close/:idclose` (ลบรายการ close)
- [x] `/confirmation` แทน placeholder → ใช้งานได้ Phase 1 (Work Order + Confirmation)
- [x] **Import confirm (`M_Confirm.php`) + validate แถว (Excel skip 2 rows)** — 2026-05-19
  - Service: `backend/src/services/confirmation-import.ts` — parser .xls/.xlsx/.csv, skip 2 แถวแรก (เทียบ `if ($n > 2)`), validate Row 0/3/6/7/8/10/11/14/15/16/17, แปลงวันที่ `dd.mm.yyyy` + เวลา `HH:MM[:SS]`, แปลงหน่วย `H → Min` (× 60), ตรวจ end ≥ start
  - Service: `importConfirmFile()` ใน `services/confirmation.ts` — lookup `idiw37` จาก `wkorder`, upsert ด้วย dedup `(idiw37, wkctr, confirmation, timeclose)` ใน transaction, คืน per-row result `inserted|updated|skipped|error`
  - API: `POST /api/v1/confirmation/import` (Admin only `userst === 'A'`, multer memory 15 MB, รับ `.xls/.xlsx/.csv`) → คืน `{ fileName, totalRows, inserted, updated, skipped, errors, rows[] }`
  - UI: `/confirmation` (Admin) มีกล่อง "Import Confirm (M_Confirm.php)" + ปุ่ม Upload Excel + ตารางผลลัพธ์ทีละแถว (Row/Status/Confirm/Order/WkCtr/Start/Finish/Message)
- [x] **Tab 1: รายละเอียด WO + tasklist (`confirmTab1.php`)** — 2026-05-19
  - `/confirmation` แท็บ `Work Order + Tasklist` แสดงรายละเอียด WO จาก `GET /api/v1/work-orders/:id` (รองรับค้นด้วย `wkorder`) เช่น WO, status, WC, Functional Location, Equipment, start/end, Activity/Mat, header short text, operation
  - โหลด PM Task List จาก `GET /api/v1/work-orders/:id/modal-detail` (`taskList.summary`, `taskList.items`) เพื่อแทน `view_tarklist` ใน PHP
- [x] **Tab 3: Upload images (`confirmTab3.php`)** — 2026-05-19
  - `/confirmation` แท็บ `Images` ใช้ API เดิม `GET/POST/DELETE /api/v1/confirmation/:idiw37/images*` + `GET /api/v1/confirmation/images/:idcimg/data`
  - รองรับ JPEG upload, list รูป, preview base64, delete; เก็บ record ใน `tbconfirmimg` จาก migration `029_confirmation_comments_images.sql`
- [x] **Tab 4: Planning (`confirmTab4.php`)** — 2026-05-19
  - `/confirmation` แท็บ `Planning` แสดงผู้รับผิดชอบปัจจุบันจาก `GET /api/v1/work-orders/:id/modal-detail` (`planning.assigned`) เทียบ `view_planwork`
  - Admin สามารถจ่ายงานรายบุคคล/กลุ่มและยกเลิกด้วย `PUT/DELETE /api/v1/work-orders/:id/planning`; non-admin เห็นข้อมูล planning แบบ read-only
- [x] **Export Excel (`M_Export_confirm*`)** — 2026-05-19
  - Migration: `033_view_exportconfirm.sql` สร้าง `app.view_exportconfirm` จาก `tbcofirm` + `tbiw37n` ให้มี `wkorder`, `opac`, `wkctr`, `timewk`, `unitc`, `stdate`, `endate`, `syst`, `cwkctr`
  - API: `GET /api/v1/confirmation/export.xlsx` สร้างไฟล์ `Export_Confirm.xlsx` ด้วย `xlsx` ตาม column เดิม (`Comfirmation`, `Order`, `Operation`, `SubO`, `Ca..`, `Split`, `Wrk Ctr`, `Act.Work`, `unit`, `Start/End date Exe.`, `Start/End Execute`)
  - API: `GET /api/v1/confirmation/export` คืน JSON สำหรับ preview (ใช้ schema เดียวกับ Excel) — ฟิลด์ `scope`, `actorWkctr`, `totalRows`, `items[]`
  - Business rule ตรง PHP: export เฉพาะ `syst in ('CRTD','REL')`; `PAC007`/`PRO005` เห็นทุกใบ, user อื่นกรอง `cwkctr = authUser.wkctr`
  - UI: `/confirmation` มีปุ่ม `Export Confirm Excel` (ดาวน์โหลดตรง) และปุ่ม `Preview Export` ไปยังหน้า `/confirmation/export`
- [x] **Export preview page (`M_Export_confirm.php`) — `/confirmation/export`** — 2026-05-19
  - Component: `ConfirmationExportParityPage` ใน `features/parity/SidebarParityPages.tsx` (route `/confirmation/export`)
  - แสดง badge `scope` (ALL สำหรับ PAC007/PRO005, OWN สำหรับช่างอื่น) + `actorWkctr` ก่อน preview เพื่อสะท้อนสิทธิ์ตาม `M_Export_confirm.php`
  - ตาราง preview 14 คอลัมน์ตรงกับ Excel header เดิม พร้อมปุ่ม `Download Excel` (เรียก `fetchConfirmationExportXlsx()`), `รีเฟรช`, และลิงก์กลับ `/confirmation`
- [x] **เกณฑ์ §3 ครบ (ขอบเขตแกน)** — 2026-05-19
  - 3.1 UI: ค้น WO + autocomplete, import, export, tabs Work Order/Confirmation/Images/Planning ครบ use case หลักของ PHP
  - 3.2 ข้อมูล: ใช้ schema/API จริงสำหรับ `work-orders`, `confirmation`, `images`, `planning`, `import`, `export`; เพิ่ม `view_exportconfirm`
  - 3.3 กฎธุรกิจ: auth ทุก API, Admin-only สำหรับ import/assign planning, export scope ตาม `wkctr`
  - 3.4 Modal/แท็บย่อย: `autocomplete.php`, `confirmTab1/2/3/4` รวมใน `/confirmation`
  - 3.5 ทดสอบ: `npm run build` backend และ `npx tsc --noEmit -p .` frontend ผ่าน

---

## ยังไม่ทำ

- _(ไม่เหลือเทียบ PHP เดิมแล้ว — รอ enhancement เช่น filter UI สำหรับ preview, server-side pagination, หรือ export ตามช่วงวันที่)_

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ลำดับ 9 |
| 2026-05-19 | เพิ่ม Import Confirm (M_Confirm.php) — migration 032 (เปลี่ยน unique index), parser + service + route `POST /api/v1/confirmation/import` (Admin only), UI `/confirmation` Import section + per-row result table, อัปเดต `addConfirmationClose` ให้ ON CONFLICT ตรง unique key ใหม่ |
| 2026-05-19 | เพิ่ม `/confirmation` tabs สำหรับ `confirmTab1.php`, `confirmTab3.php`, `confirmTab4.php`: Work Order + PM Task List จาก `work-orders/:id/modal-detail`, Images upload/list/preview/delete ผ่าน `confirmation/images*`, และ Planning read-only + Admin assign/delete ผ่าน `work-orders/:id/planning` |
| 2026-05-19 | เพิ่ม Export Confirm Excel (`M_Export_confirm*`) — migration `033_view_exportconfirm.sql`, route `GET /api/v1/confirmation/export.xlsx`, ปุ่ม `Export Confirm Excel` ใน `/confirmation`, autocomplete WO แทน `modalPages/autocomplete.php`, และปิดเกณฑ์ §3 ขอบเขตแกน |
| 2026-05-19 | เพิ่ม route `/confirmation/export` (`ConfirmationExportParityPage`) — preview table 14 คอลัมน์, badge สิทธิ์ ALL/OWN, ปุ่ม Download Excel + Refresh, API ใหม่ `GET /api/v1/confirmation/export` (JSON) คู่กับ `.xlsx` เดิม; เพิ่ม `Preview Export` button ใน `/confirmation`; เพิ่ม Badge variant `destructive` ใน UI library |
