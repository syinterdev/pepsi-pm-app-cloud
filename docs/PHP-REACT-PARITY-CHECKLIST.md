# ข้อกำหนดและ Checklist — Parity หน้า PHP (`sap`) → React (`PM-Pepsi-App/frontend`)

เอกสารนี้ใช้เป็น **ข้อกำหนดขั้นต่ำ** และ **checklist ติดตามความคืบหน้า** ว่าแต่ละหน้า/โมดูลจากระบบเก่า (`index.php` / `index2.php` + `?module=...` → `sap/pages/*.php`) ได้ถูกวิเคราะห์/ออกแบบ/พอร์ตไปยังแอป React แล้วหรือยัง

**อ้างอิงโครงสร้างเก่า:** [`sap/STRUCTURE.md`](../sap/STRUCTURE.md) และ [`sap-legacy-STRUCTURE.md`](../sap-legacy-STRUCTURE.md)

---

## 1) วิธีใช้ checklist

1. **ทำทีละหน้า (หรือทีละกลุ่มที่มีความหมายเดียวกัน)** — เมื่อเริ่มงานให้เปลี่ยนสถานะจาก `ยังไม่ทำ` เป็น `กำลังทำ` และเมื่อครบเกณฑ์ในข้อ 3 ให้เปลี่ยนเป็น `เสร็จ`
2. **บันทึกในแต่ละแถว:** วันที่, route ใน React (ถ้ามี), ลิงก์ PR/commit, หมายเหตุสั้นๆ
3. **ไฟล์ `*_bk*`, `Test_*`, `test_*`, `import_test`** — ถือเป็นไฟล์สำรอง/ทดสอบ: ระบุว่า **ข้าม** หรือ **รวมความต้องการ** จากไฟล์หลักที่ใช้ production แทน
4. **`navbar.php`, `left_menu.php`, `footer.php`** — ไม่ใช่หน้า `module` โดยตรง แต่เป็นส่วน shell; ตรวจ parity ร่วมกับ layout React (`AppShell` / sidebar) — **เมนู sidebar** อยู่ที่ [`nav-config.ts`](../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) + กรอง `menuright` ตาม `UserST` ([`nav-rbac.ts`](../PM-Pepsi-App/frontend/src/lib/nav-rbac.ts)); รอ sync รายการจาก `tbmenu` ใน PG/API
5. **สัญญา API + MSW** — endpoint ใหม่: ล็อกด้วย Zod ใน [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) + handler ใน [`handlers.ts`](../PM-Pepsi-App/frontend/src/mocks/handlers.ts); **ห้าม** ใส่ business logic หนักใน mock — ดูหัวข้อ **“สัญญา API และ MSW”** ใน [`skills.md`](../skills.md)

รูปแบบสถานะที่แนะนำในตาราง: `ยังไม่ทำ` | `กำลังทำ` | `เสร็จ` | `ข้าม`

### 1.1) เอกสารงานค้างแยกตามลำดับพัฒนา (1–8)

รายการ **ที่ยังไม่ครบ** แยกเป็นไฟล์ `.md` ใน [`docs/parity-pending/`](parity-pending/README.md) — **อัปเดตคู่กับเอกสารนี้ทุกครั้ง** ที่ปิดงาน:

| ลำดับ | ไฟล์งานค้าง |
|------|----------------|
| — | [`parity-pending/00-cross-cutting.md`](parity-pending/00-cross-cutting.md) |
| 1 | [`parity-pending/01-auth.md`](parity-pending/01-auth.md) |
| 2 | [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 3 | [`parity-pending/03-line-calendar.md`](parity-pending/03-line-calendar.md) |
| 4 | [`parity-pending/04-work-calendar.md`](parity-pending/04-work-calendar.md) |
| 5 | [`parity-pending/05-backlog.md`](parity-pending/05-backlog.md) |
| 6 | [`parity-pending/06-work-orders-master-filters.md`](parity-pending/06-work-orders-master-filters.md) |
| 7 | [`parity-pending/07-iw37n.md`](parity-pending/07-iw37n.md) |
| 8 | [`parity-pending/08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) |
| 9 | [`parity-pending/09-confirmation.md`](parity-pending/09-confirmation.md) |
| 10 | [`parity-pending/10-personnel.md`](parity-pending/10-personnel.md) |
| 11 | [`parity-pending/11-manhours-worktime.md`](parity-pending/11-manhours-worktime.md) |
| 12 | [`parity-pending/12-reports-summary.md`](parity-pending/12-reports-summary.md) |
| 13 | [`parity-pending/13-deploy-offline.md`](parity-pending/13-deploy-offline.md) |
| **14** | [**`parity-pending/14-administrator.md`**](parity-pending/14-administrator.md) — **ออกแบบ scope แล้ว** (Admin Console + RBAC matrix + Branding + Audit + Backup) |
| — | [`parity-pending/COMPLETION-MATRIX.md`](parity-pending/COMPLETION-MATRIX.md) — ตารางสรุปทุกลำดับ |

**วิธีซิงค์:** ติ๊ก `[x]` ในไฟล์ลำดับนั้น → แก้สถานะแถว PHP ใน §4/§5 ด้านล่าง → เพิ่มบรรทัด §7 — ดูขั้นตอนใน [`parity-pending/README.md`](parity-pending/README.md)

---

## 2) แมปกลุ่มงาน → Route ใน React (ปัจจุบัน)

ใช้เป็นแนวทางว่า checklist แต่ละกลุ่มจะไปลงที่ route ไหนใน `PM-Pepsi-App/frontend` (ปรับตามที่ทีมตั้งชื่อจริง)

| กลุ่มงานหลัก (PHP) | Route / หน้า React (แนวทาง) |
|---------------------|------------------------------|
| ปฏิทินงาน / **`calendar.php`** (Work scheduling + `M_filter_iw37`), `W_calendar*` | **`/calendar`** — FullCalendar + filter form (POST) + modal รายละเอียด + ลากย้ายแผน → **`GET /api/v1/calendar/events`**, **`GET /api/v1/calendar/filter-options`**, **`POST /api/v1/calendar/events`** (PG `view_order`) |
| ปฏิทินตาม WC / **`calendar_wkctr.php`** (`view_confrim`, ลิงก์จาก `user.php`) | **`/calendar?wkctr=`** หรือ **`/calendar/wc/:code`** — prefill ตัวกรอง `wkctr` แล้วใช้ `POST /api/v1/calendar/events` (กรอง `wkctr` จะอ่านจาก `app.view_confrim`) |
| ปฏิทินเส้น / `line_calendar.php` (**ค่าเริ่มต้น** `index.php` เมื่อไม่ส่ง `module`) | **`/line-calendar`** — FullCalendar รายเดือน + modal create/edit + drag & drop → **`GET /api/v1/line-calendar/events`** (PG `app.tblineschdul`) + `POST/PUT /api/v1/master-data/lineschdul` |
| Backlog / `backlog.php` (view_order CRTD+REL + FullCalendar เดิม) | **`/backlog`** — ฟิลเตอร์ + **`GET /backlog/filter-options`**, **`POST /backlog/events`** (PG `view_order`); รายละเอียด WO ยัง MSW |
| รับรอง / `M_confirmation` (admin) หรือ flow ช่างจาก `W_planwork_view` | **`/confirmation`** — Search WO + autocomplete (`GET /api/v1/work-orders/suggestions`) + Tab Confirmation (add/del ช่าง+เวลา) + Import Confirm (`POST /api/v1/confirmation/import`) + Export Confirm Excel (`GET /api/v1/confirmation/export.xlsx`) + Tabs `confirmTab1/2/3/4`: Work Order + PM Task List (`work-orders/:id/modal-detail`), Images upload/list/preview/delete (`confirmation/images*`), Planning read-only + Admin assign/delete (`work-orders/:id/planning`) — ผ่าน §3 ขอบเขตแกน |
| ดู worktime / `W_worktime_view` + `worktime_manhours` | **`/worktime`** — แท็บมอบหมาย (`/worktime/planning`) + แท็บชั่วโมง HR (`/worktime/me`) |
| Manhour HR / `W_manhours_hr.php` | **`/manhours-hr`** — `GET /api/v1/manhours/hr` (กรอง `wkctr`, Summary/W + OT net) |
| สรุปรายสัปดาห์ / `W_summary_weekly*.php` | **`/summary-weekly`** — `GET /api/v1/reports/summary-weekly` + Chart.js |
| ใบงาน / `workorder`, `W_*` ที่เกี่ยว work order | `/work-orders` |
| IW37N / `M_iw37n*`, `iw37n*` | **`/iw37n`** — multipart import + `GET /iw37n/batches` (PG) |
| ข้อมูลหลัก / `M_*`, `tb*`, master ต่างๆ | `/master-data` (แท็บย่อยตาม entity) |
| แผนงาน / `M_planwork*`, `view_planwork` | **`/planning`** — `GET /api/v1/planning/orders?status=open|closed` จาก `app.view_planwork` (open = `CRTD/REL`, closed = not `CRTD/REL` ตาม WC login; ต้องมี `view_planwork.idwkctr = authUser.idwkctr`) + Admin Assign dialog (`POST /api/v1/planning/assign` → upsert `tbplangingwork`: `idiw37`/`wkctr`/`wkctrpw`/`pwcomment`/`pwteam`) + ปุ่มบันทึก/ดูปิดงานเปิด `WorkOrderDetailDialog` แท็บ Confirm (Close Work / Close Detail / Close Images); เลข WO ลิงก์ไป `/work-orders/:id` เพื่อเปิดรายละเอียดตรง ไม่ใช่รายการรวม; verify ด้วย `database/scripts/verify_app_schema.sql` section Planning visibility; ไม่ clone jQuery/DataTables เดิม |
| Manhour / `M_manhour*`, `worktime_*` | **`/manhours`** (chart), **`/manhours/admin`** (CRUD/import), **`/worktime`**, **`/manhours-hr`** |
| บุคลากร / `M_personel*`, `member*` | `/personnel` |
| รายงาน / กราฟ KPI (ไม่รวม `charts.php` เทมเพลต demo) | **`/reports`** — `GET /api/v1/reports/kpi` |
| หน้าแรก / shell `content.php` (ค่าเริ่มต้น `index2.php` เมื่อไม่ส่ง `module`) | **`/`** (`HomePage`) — `GET /api/v1/dashboard/summary` (PG); sidebar “Dashboard / หน้าแรก” เปิดให้ `A:U:W`; การ์ด “รอจ่ายงาน” = WO เปิด (`CRTD`/`REL`) ที่ยังไม่มี `tbplangingwork`; การ์ดสรุปลิงก์ไป `/work-orders`, `/planning`, `/iw37n`; `content.php` เป็น SB Admin demo จึงไม่เพิ่ม KPI ใหม่จากหน้าแรกเดิม; KPI รายงานจริง (`W_summary_weekly*`) อยู่ phase `/reports`; ไม่พอร์ตเทมเพลต SB Admin |
| ตั้งค่า / user, register | `/settings` |
| Login / logout | **`/login`** · **`RequireAuth`** + **`GET /auth/me`** (JWT) · RBAC เมนู (`menuright`) · redirect → **`/line-calendar`** · logout + API |

---

## 3) เกณฑ์ขั้นต่ำว่า “เสร็จ” ต่อหนึ่งหน้า/โมดูล

- [ ] **UI:** ครบตาม **ข้อ 3.1** ด้านล่าง (ฟอร์ม / ตาราง / ปุ่มหลักตาม use case หน้า PHP — ยอมตัด skin เดิม แต่ฟังก์ชันต้องเทียบได้)
- [ ] **ข้อมูล:** ครบตาม **ข้อ 3.2** (ฟิลด์/โครงสร้างจาก query & ฟอร์ม PHP สะท้อนใน React + schema/mock/API)
- [ ] **กฎธุรกิจ:** ครบตาม **ข้อ 3.3** (validation + สิทธิ์เมนู `tbmenu` / session — มีแผนหรือ implement ในแอปใหม่)
- [ ] **Modal / แท็บย่อย:** ครบตาม **ข้อ 3.4** (ถ้า PHP เรียก `modalPages/*` ให้มีรายการใน checklist ส่วน modal และทำหรือข้ามพร้อมเหตุผล)
- [ ] **ทดสอบ:** ครบตาม **ข้อ 3.5** (mock MSW หรือ API จริงตามที่โปรเจกต์ใช้)

### 3.6 สรุป §3 — โมดูล Auth (ลำดับที่ 1) — เสร็จ 2026-05-16

โมดูล Auth/Shell ถือว่าผ่านเกณฑ์ §3 สำหรับ **ขอบเขตแกน** (login, logout, เมนู DB, footer, โปรไฟล์อ่าน) — รายละเอียดใน [`parity-pending/01-auth.md`](parity-pending/01-auth.md)

- [x] **3.1 UI** — Login (WC+member), `/logout`, sidebar จาก `tbmenu`, footer, แท็บโปรไฟล์ `/settings`
- [x] **3.2 ข้อมูล** — Zod `authUser` / `userProfile`; PG `tbworkcenter`, `tbl_member`, `tbmenu`
- [x] **3.3 กฎธุรกิจ** — `menuright`, bcrypt, `tbworkcenter_userlog` / `tbl_system_userlog`
- [x] **3.4 Modal** — ไม่มี modal auth บังคับใน PHP หลัก (N/A)
- [x] **3.5 ทดสอบ** — MSW + ทดสอบกับ PG (`009` seed, import MySQL)

### 3.1 UI — ฟอร์ม / ตาราง / ปุ่ม (เทียบ use case หน้า PHP)

**คำจำกัดความ “เทียบได้”:** ผู้ใช้ทำ **งานหลักชุดเดียวกับของเดิม** บนหน้า PHP ได้จบบน React (หรือ flow ที่ลูกค้า/ทีมอนุมัติให้ทดแทน — ต้องบันทึกในหมายเหตุ checklist)

**ไม่ต้อง parity:** สกิน Bootstrap/jQuery/DataTables แบบ pixel-perfect, ธีม SB Admin เดิม — ใช้ Shadcn + Tailwind ตาม [`skills.md`](../skills.md) ได้

#### ก่อนติ๊ก UI — สแกนหน้า PHP อย่างรวดเร็ว

| แหล่งในไฟล์ PHP | ดูอะไร |
|-----------------|--------|
| HTML ฟอร์ม | `input` / `select` / `textarea` / `name=` / ปุ่ม submit |
| ตาราง | `<table>`, class DataTables, จำนวนคอลัมน์, ปุ่มต่อแถว |
| ลิงก์ / ปุ่ม | `href`, `onclick`, `$.ajax` / `fetch`, URL ไป `modalPages/` |
| PHP ด้านบน | `$_POST` / `$_GET` / `$_REQUEST` ว่ามีพารามิเตอร์อะไรบ้าง |

#### Checklist UI แยกตามประเภท (ติ๊กเฉพาะข้อที่หน้านั้นมีจริง)

**ก) ฟอร์ม (ค้นหา / เพิ่ม / แก้ / import ฯลฯ)**

- [ ] ฟิลด์ที่ส่งต่อ backend (ชื่อ + ความหมาย) **ครบ** สำหรับ action หลักของหน้า — เทียบจากฟอร์ม HTML + ตัวแปร `$_POST`/`$_GET` ใน PHP
- [ ] ป้ายชื่อ (label) / placeholder / หน่วย — ไม่จำเป็นต้องถ้อยคำเดิมทุกตัว แต่ผู้ใช้ต้องเข้าใจฟิลด์เดียวกัน
- [ ] ปุ่มหลักครบ: เช่น บันทึก / ยกเลิก / ล้างค่า / นำเข้า — เทียบปุ่มและผลลัพธ์กับ PHP
- [ ] สถานะโหลดขณะ submit และกัน double-submit (disabled หรือ spinner)
- [ ] แสดงข้อความ error จาก validation/API ในจุดที่มองเห็น (อาจใช้ toast ตาม stack โปรเจกต์)

**ข) ตาราง / รายการข้อมูล**

- [ ] คอลัมน์ที่ใช้ตัดสินใจงาน **ยังมีครบ** (ลำดับคอลัมน์ปรับ UX ได้ถ้าไม่ทำให้ขาดข้อมูลสำคัญ)
- [ ] การค้นหา / กรอง / เรียงลำดับ / แบ่งหน้า — ถ้ามีใน PHP ให้มีใน React **หรือ** ระบุใน checklist ว่า “phase 2” พร้อมเหตุผล
- [ ] การกระทำต่อแถว: ดู / แก้ / ลบ / เปิด modal — เทียบพฤติกรรม PHP
- [ ] Empty state เมื่อไม่มีข้อมูล

**ค) ปุ่มและ flow รอบหน้า**

- [ ] ปุ่มรองรับ use case: export, import, พิมพ์, sync, ฯลฯ — ถ้ามีใน PHP ต้องมีแผนหรือปุ่มจริงบน React
- [ ] การกลับไปรายการ / ปิดฟอร์ม — flow ไม่ค้าง

**ง) โครงสร้างหน้าซับซ้อน**

- [ ] แท็บ / wizard / partial ที่ `include` ใน PHP — แมปเป็น `Tabs` / หลาย route / sub-component ใน React
- [ ] จุดที่โหลด `modalPages/*.php` — แมปเป็น `Dialog` / `Sheet` / หน้าย่อย + ติ๊กใน checklist ส่วน modal

**จ) ความเหมาะสมกับการใช้งานจริง**

- [ ] ใช้งานได้บนขนาดจอที่โรงงานใช้ (เดสก์ท็อปเป็นหลัก; responsive ตาม [`skills.md`](../skills.md))

#### หลักฐานแนะนำตอนปิดงาน (แนบใน PR หรือหมายเหตุแถว checklist)

1. รายการ **use case** แบบ bullet (จาก PHP) เทียบว่า React รองรับครบ
2. **Route** + ชื่อ component/หน้าหลักที่เกี่ยวข้อง
3. (ถ้ามี) สครีนช็อต 1–2 ภาพ หรือลิงก์ไฟล์ออกแบบสั้นๆ

### 3.2 ข้อมูล — ฟิลด์ / โครงสร้าง / contract กับ API

**หลักการ:** ฝั่ง UI แสดงและส่งข้อมูล **สอดคล้อง** กับที่ PHP อ่าน/เขียนจริง (ชื่อฟิลด์อาจเปลี่ยนเป็น camelCase ใน JSON ได้ แต่ต้องมี **ตารางแมป** หรือคอมเมนต์ใน schema)

#### ก่อนติ๊กข้อมูล — สแกน PHP

| แหล่ง | ดูอะไร |
|--------|--------|
| `SELECT` / `mysqli_query` / `fetch_assoc` | ชื่อคอลัมน์ที่แสดงและที่ใช้บันทึก |
| `INSERT` / `UPDATE` | ฟิลด์บังคับ, default, ค่าที่ derive ใน PHP |
| ฟอร์ม + `$_POST` | ชื่อพารามิเตอร์ที่รับจริง |
| ไฟล์อัปโหลด | ชนิดไฟล์, ขนาด, การเก็บ path — เทียบ SRS / [`skills.md`](../skills.md) |

#### Checklist ข้อมูล (ติ๊กเฉพาะข้อที่เกี่ยวกับหน้านั้น)

- [ ] รายการ **ฟิลด์สำคัญ** (แสดง + บันทึก) ตรงกับ query/ฟอร์ม PHP — ไม่หลุดฟิลด์ที่ผู้ใช้เคยกรอกหรือเคยเห็นในตาราง
- [ ] **ชนิดข้อมูล** สมเหตุสมผล (วันที่, ตัวเลข, enum, null) — ลด bug แปลงจาก PHP string/number
- [ ] มี **TypeScript type** และถ้าโปรเจกต์ใช้ — **Zod schema** (หรือเทียบเท่า) คู่กับฟอร์ม/response ที่เกี่ยวข้อง
- [ ] **Request/Response** ของ API ที่หน้าเรียก มีเอกสารหรือ type ชัด — path, method, body ตรงกับที่ออกแบบแทน PHP
- [ ] ช่วง **mock (MSW)** (`handlers.ts` ฯลฯ) คืนข้อมูลโครงสร้างเดียวกับที่ UI คาด (หรือระบุว่า dev ใช้ API จริงแทน)
- [ ] กรณี **แบ่งหน้า / กรอง / sort** — พารามิเตอร์ query ตรงกับ backend ใหม่ (ไม่ทิ้ง logic จาก PHP แบบเงียบๆ)

### 3.3 กฎธุรกิจ — validation และสิทธิ์ (เมนู / session)

**หลักการ:** ตาม [`skills.md`](../skills.md) — **ฝั่งเซิร์ฟเวอร์เป็นที่สุด**; ฝั่ง React ทำเพื่อ UX และลดคำขอผิดรูปแบบ

#### Validation

- [ ] กฎที่ผู้ใช้เห็นใน PHP (HTML5 `required`, `maxlength`, JS alert, ข้อความ error ภาษาไทย) มี **อย่างน้อยหนึ่งชั้น** บน React (RHF + Zod ตาม stack)
- [ ] กฎที่ซับซ้อน / ความปลอดภัย — **ซ้ำหรือเข้มกว่า** บน API (Express + Zod ตามแผน backend)
- [ ] ข้อความ error ใกล้ฟิลด์หรือ toast — ผู้ใช้แก้รายการได้โดยไม่งง

#### สิทธิ์และเมนู (`tbmenu`, `$_SESSION`)

- [ ] รู้ว่าเมนู/ปุ่มในหน้า PHP ถูกซ่อน/แสดงจากสิทธิ์ใด (เทียบ `left_menu.php` / logic ในแต่ละหน้า)
- [ ] ใน React มี **แผน** route guard / ซ่อนปุ่ม / disabled ตาม role — หรือ implement แล้วถ้า auth/RBAC พร้อม
- [ ] ไม่มีฟีเจอร์ที่ “ซ่อนบน UI แต่ยังเรียก API ได้” โดยไม่ตั้งใจ (ลดช่องโหว่)

### 3.4 Modal / แท็บย่อย — เทียบ `modalPages/` และ fragment ใน `pages/`

- [ ] สร้าง **รายการไฟล์** `modalPages/*.php` ที่หน้านี้โหลด (ajax, include, iframe)
- [ ] แต่ละไฟล์: กำหนดว่าเป็น **Dialog / Sheet / แท็บในหน้า / route ย่อย** ใน React และติ๊กใน **ตาราง checklist `sap/modalPages/` (ข้อ 5 ด้านล่าง)** ว่า **เสร็จ / กำลังทำ / ข้าม + เหตุผล**
- [ ] **Payload** ที่ส่งระหว่าง parent ↔ modal (เทียบ `$_GET`/`$_POST` / JSON ใน ajax เดิม) ถูกแมปใน API หรือ state ใหม่
- [ ] ปิด modal / ยกเลิก — state ไม่รั่ว (ข้อมูลค้าง, list ไม่รีเฟรชเมื่อต้องรีเฟรช)

### 3.5 ทดสอบ — MSW และ/หรือ API จริง

- [ ] **Happy path:** การกระทำหลักของหน้า (โหลด, ค้นหา, บันทึก, นำเข้า ฯลฯ) ผ่านบน environment ที่ตั้งค่าไว้ (dev + mock หรือ staging + API)
- [ ] **กรณีผิดพลาด:** อย่างน้อยหนึ่ง scenario ต่อหมวดที่สำคัญ — เช่น 401/403/500, validation error, network ล้ม (ตามที่โปรเจกต์รองรับ — อาจใช้หน้า `/error/:code` ที่ frontend)
- [ ] **Regression สั้นๆ:** บันทึกใน PR ว่า “ทดสอบอะไรแล้ว” (bullet 3–6 ข้อ)

---


## 4) Checklist — `sap/pages/` (เรียงตามชื่อไฟล์)

อัปเดตคอลัมน์ **สถานะ** และ **หมายเหตุ** เมื่อทำงานแต่ละไฟล์

| สถานะ | ไฟล์ PHP | หมายเหตุ / Route React |
|--------|----------|-------------------------|
| ข้าม | `aa.php` | เนื้อหาไฟล์มีแค่ข้อความ `aa` ไม่มี PHP/HTML — ไม่พบ `module=aa` ใน `sap/` — ไม่ต้องพอร์ต React |
| ข้าม | `autocomplete.php` | **หน้า `pages/`** — ตัวอย่าง autocomplete (โหลด `wkorder` ทั้งหมดจาก `tbiw37n` เป็น array ใน JS) ฟอร์มส่งไป `/action_page.php` — ไม่พบการลิงก์ `module=autocomplete` — ไม่ต้องมี route แยก; ฟังก์ชันจริงใช้ `modalPages/autocomplete.php` |
| เสร็จ | `backlog.php` | **Route:** `/backlog` — **BE:** `GET /api/v1/backlog/filter-options` + `POST /api/v1/backlog/events` + `POST /api/v1/scheduling/move-plan` + **`GET /api/v1/work-orders/:id`** (PG) — **React:** [`BacklogPage`](../PM-Pepsi-App/frontend/src/features/backlog/BacklogPage.tsx) + FullCalendar month/week/day + tooltip + select ช่วงวัน + drag&drop เปิด `MovePlanDialog` |
| ข้าม | `blankpage_bk17052563.php` | **สำรอง** — ไฟล์เป็น fragment เทมเพลต SB Admin “Blank Page” (ไม่มี `<?php` ไม่มี logic) — **ไม่พบ** `module=blankpage_bk17052563` ในโค้ดที่ใช้งาน (มีแค่ `module=blankpage` ใน `left_menu_bk09052563.php` ซึ่งเป็นเมนูสำรอง) — ไม่ต้องพอร์ต React |
| ข้าม | `calc_birthday.php` | **ไม่ใช่หน้า module** — ส่วน include แสดง “ปัจจุบันอายุ” จาก `$_SESSION['birthday']` + `timespan()` ใน [`include/function_calc_birthday.php`](../sap/include/function_calc_birthday.php); ใน `navbar.php` **ถูกคอมเมนต์** (`include('calc_birthday.php')`) — ไม่ต้องมี route แยก; พอร์ตเมื่อทำ **โปรไฟล์ผู้ใช้ / header** ให้คำนวณอายุแบบเดียวกับ `timespan` (เทียบ `index2.php` + `function_calc_birthday.php`) |
| ข้าม | `calc_worktime.php` | **ไม่ใช่หน้า module** — fragment include แสดง “อายุการทำงาน” จาก `$_SESSION['startwork']` + `timespan($startwork, $today)` ใน [`include/function_calc_birthday.php`](../sap/include/function_calc_birthday.php) (ฟังก์ชัน `timespan` ใช้ร่วมกับ `calc_birthday.php`); **ไม่พบ**การอ้างชื่อไฟล์ใน repo อื่น — ไม่ต้องมี route แยก; พอร์ตคู่กับ **โปรไฟล์ผู้ใช้ / header** เมื่อมีวันที่เริ่มงานจาก API |
| เสร็จ | `calendar.php` | **`index.php?module=calendar`** — FullCalendar + `M_filter_iw37.php` + `view_order` + สี `tbwkstatus` / ย้ายแผน — **React/BE:** [`004_tbiw37n_calendar.sql`](../database/migrations/004_tbiw37n_calendar.sql) + `GET /api/v1/calendar/events` + `GET /api/v1/calendar/filter-options` + `POST /api/v1/calendar/events` + [`CalendarPage`](../PM-Pepsi-App/frontend/src/features/calendar/CalendarPage.tsx) — **Parity:** filter form (Activity/Type/Status/Resources/Team/Product Line/Equipment/ช่วงวันที่) + modal รายละเอียด + drag เปิด MovePlanDialog |
| ข้าม | `calendar_bk170563.php` | สำรองของ `calendar.php` (bootstrap-select แบบ local แทน CDN) — ไม่พอร์ตแยก |
| เสร็จ | `calendar_wkctr.php` | **`index.php?module=calendar_wkctr&wkctr=`** — PDO อ่าน `view_confrim WHERE wkctr=…` + FullCalendar; ถูกเรียกจาก `user.php` — **React:** รองรับ `/calendar?wkctr=` และ `/calendar/wc/:code` (prefill `wkctr`) และ backend เลือกอ่าน `app.view_confrim` เมื่อมี filter `wkctr` (migration `028_view_confrim.sql`) |
| ข้าม | `charts.php` | **เทมเพลต SB Admin** — กราฟ Chart.js ตัวอย่าง (Area/Bar/Pie) **ไม่เชื่อม DB**; พบลิงก์ใน [`left_menu_bk09052563.php`](../sap/pages/left_menu_bk09052563.php) เป็น `index2.php?module=charts` เท่านั้น — ไม่พอร์ตเป็นหน้าแยก; รายงาน/KPI จริงให้ไป **`/reports`** |
| ข้าม | `Confirmation.php` | **ไม่ใช่เมนู production** — เมนูที่ใช้ชี้ไป **`M_confirmation.php`** (`index2.php?module=M_confirmation`); ไฟล์นี้โหลด `SELECT * FROM confirmation` แต่ปุ่ม/ลิงก์ส่วนใหญ่เป็น **`member_form.php` / `member_edit.php`** (คัดลอกจากโมดูลสมาชิก) — ถือเป็น dead/wrong template — **ไม่พอร์ต**; รวมความต้องการ “รับรองงาน” กับ **`/confirmation`** + `M_confirmation.php` / `W_confirmation.php` |
| ข้าม | `content.php` | **เทมเพลต SB Admin “Dashboard”** — การ์ดสี + กราฟตัวอย่าง + DataTable ข้อมูลสมมติ (พนักงาน Tiger Nixon ฯลฯ) **ไม่มี logic ระบบ** — ค่าเริ่มต้น [`index2.php`](../sap/index2.php) เมื่อไม่ส่ง `module` (`$module` = `content`) — ไม่พอร์ต clone ไฟล์นี้; หน้าแรก React ใช้ **`/`** (`HomePage`) แทน |
| ข้าม | `count_worktime.php` | **ไม่ใช่หน้า module** — fragment ~10 บรรทัด: query `tb_iw37n` แถวแรกที่ `workctr = $_SESSION['username']` แล้ว `echo` ค่า `worktime` เท่านั้น (ไม่มี HTML); ใน [`user.php`](../sap/pages/user.php) มี **`//include('count_worktime.php');`** ถูกคอมเมนต์ — ไม่พอร์ต route แยก; ถ้าต้องการแสดงเวลางานให้รวมเมื่อพอร์ต **โปรไฟล์ / `user.php`** + API |
| ข้าม | `datepicker.php` | **ตัวอย่าง jQuery UI แยกไฟล์** — เอกสาร HTML เต็ม (`<!doctype>` …) + `#datepicker` (`dateFormat: 'dd.mm.yy'`) **ไม่ถูก include** ใน shell หลัก; การเลือกวันที่จริงใช้ `$.datepicker` ในหน้าอื่น (`calendar.php`, `M_filter_iw37.php`, modal ฯลฯ) — ไม่พอร์ตไฟล์นี้; ใน React ใช้ date picker ของชุด UI (เช่น Shadcn Calendar) ตามหน้าที่พอร์ต |
| เสร็จ | `footer.php` | **React:** [`AppFooter.tsx`](../PM-Pepsi-App/frontend/src/components/layout/AppFooter.tsx) ใน `AppShell` — Copyright / Privacy / 7151 & Lays Lamphun — 2026-05-16 |
| ข้าม | `import_test.php` | **ทดสอบ / dev** — ฟอร์มอัปโหลด CSV + บล็อก `if ($action == "updata")` อ่าน `file_upload/*` แล้ว `INSERT` ลง `tb_equipment` (สคริปต์มีข้อผิดพลาด SQL `value` แทน `VALUES` และไม่มีเมนูอ้าง `module=import_test` ใน repo) — **ไม่พอร์ต**; นำเข้าข้อมูลจริงให้ไป flow **`M_*` / IW37N** + API ตาม [`skills.md`](../skills.md) |
| ข้าม | `info.php` | **เทมเพลต SB Admin** — หน้า “info” เนื้อหาเดียวกับ [`charts.php`](../sap/pages/charts.php) (Chart.js ตัวอย่าง ไม่เชื่อม DB); ใน [`login.php`](../sap/pages/login.php) / [`login-bk.php`](../sap/pages/login-bk.php) มี redirect ไป `?module=info` **ถูกคอมเมนต์** — ไม่พอร์ต route แยก; รายงาน/KPI ไป **`/reports`** |
| ข้าม | `iw37n.php` | **Legacy CRUD บน `tbiw37n`** — รายการ DataTable + `op=save`/`op=del` (SQL ต่อสตริงจาก `$_REQUEST`); ปุ่มนำเข้าชี้ `?module=iw37n_imports` แต่ใน repo **ไม่มี** `iw37n_imports.php` (มีแค่ [`M_iw37n_imports.php`](../sap/pages/M_iw37n_imports.php)) — **ไม่พบ** `module=iw37n` ในเมนูที่ใช้งาน; เมนูจริงใช้ **`index2.php?module=M_iw37n`** — **ไม่พอร์ต**; parity IW37N ไปที่ **`/iw37n`** + แถว checklist **`M_iw37n*.php`** |
| ข้าม | `iw37n_form.php` | **ฟอร์ม modal คู่ `iw37n.php`** — POST กลับ `?module=iw37n` ฟิลด์ 21 คอลัมน์ `tbiw37n` (ลูป `$filed[2..21]`); โหลดใน `#ajaxLargeModal` — ใช้คู่กับไฟล์ legacy ด้านบน — **ข้าม**; ฟอร์ม/นำเข้าจริงใช้ **`M_iw37n_form.php`** / **`M_iw37n_imports.php`** |
| เสร็จ | `left_menu.php` | **`GET /api/v1/nav/menu`** + import สคริปต์ [`import-auth-from-mysql.ps1`](../database/scripts/import-auth-from-mysql.ps1) — 2026-05-16 (แกน §3.6) |
| ข้าม | `left_menu_bk09052563.php` | **สำรอง** — เมนูคงที่ (calendar, backlog, line_calendar, M_iw37n, …) — ใช้เป็น **อ้างอิง parity** เท่านั้น — ไม่พอร์ตแยก |
| ข้าม | `left_menu_bk17052563.php` | **สำรอง** — เมนูคงที่ + เงื่อนไข `UserST` บางส่วน — **อ้างอิง parity** ใน checklist / sidebar — ไม่พอร์ตแยก |
| เสร็จ | `line_calendar.php` | **`index.php?module=line_calendar`** — PDO **`view_lineschdul`** / `tblineschdul` + สี `#408a63` / `#bfbfbf` — **React/BE:** migration [`003_tblineschdul.sql`](../database/migrations/003_tblineschdul.sql) + unique index [`023_tblineschdul_unique.sql`](../database/migrations/023_tblineschdul_unique.sql) + view [`027_view_lineschdul.sql`](../database/migrations/027_view_lineschdul.sql) + `GET /api/v1/line-calendar/events` + [`LineCalendarPage`](../PM-Pepsi-App/frontend/src/features/line-calendar/LineCalendarPage.tsx) — **Parity:** FullCalendar + สี `#408a63`/`#bfbfbf` + modal คลิกวัน(สร้าง)/คลิกกิจกรรม(แก้ไข) + drag & drop (เรียก `POST/PUT /api/v1/master-data/lineschdul`) |
| เสร็จ | `login.php` | Work center + member tabs, bcrypt, seed `009`, profile API — §3.6 — 2026-05-16 |
| ข้าม | `login-bk.php` | **สำรอง** — ล็อกอิน **`tbl_member`** + `last_login` + `tbl_system_userlog`; meta refresh ไป **`?module=info`** — ไม่ใช่ flow หลักของ `login.php` (`tbworkcenter`) — **ไม่พอร์ต** |
| เสร็จ | `logout.php` | `/logout` + API + userlog — §3.6 — 2026-05-16 |
| เสร็จ | `M_activitytype.php` | **PHP:** `tbactivitytype` + Excel/CRUD — **React/BE:** [`002_tbactivitytype.sql`](../database/migrations/002_tbactivitytype.sql) + CRUD/import API + [`ActivityTypePanel`](../PM-Pepsi-App/frontend/src/features/master-data/ActivityTypePanel.tsx) — **Parity:** import รองรับ `.csv/.xls/.xlsx/.xlsm/.xlsb` + skip 2 แถวแรกสำหรับ Excel; ฟอร์ม modal add/edit/delete (English-first validation+errors) |
| เสร็จ | `M_activitytype_form.php` | รวมกับ **`M_activitytype.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_activitytype_imports.php` | รวมกับ **`M_activitytype.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_Confirm.php` | **PHP:** import Excel `Confirm.xlsx` ลง `tbcofirm` (skip 2 แถวแรก; validate Row `0/3/6/7/8/10/11/14/15/16/17`; แปลง `H→Min`; dedup `(confirmation, wkorder, timeclose, wkctr)`) — **React/BE:** migration [`032_tbcofirm_import_uniq.sql`](../database/migrations/032_tbcofirm_import_uniq.sql) เปลี่ยน unique index เป็น `(idiw37, wkctr, confirmation, timeclose)`; service [`confirmation-import.ts`](../PM-Pepsi-App/backend/src/services/confirmation-import.ts) (parser + validation) + [`importConfirmFile`](../PM-Pepsi-App/backend/src/services/confirmation.ts) (lookup `idiw37`, transaction upsert, per-row result); route `POST /api/v1/confirmation/import` (Admin only `userst === 'A'`, multer memory 15 MB, รับ `.xls/.xlsx/.csv`); UI `/confirmation` กล่อง Import + ปุ่ม Upload Excel + ตารางผลลัพธ์ Row/Status/Confirm/Order/WkCtr/Start/Finish/Message (เทียบ table ใน PHP) — 2026-05-19 |
| เสร็จ | `M_Confirm_form.php` | **PHP:** modal edit/del 1 แถว `tbcofirm` — **React:** flow หลักย้ายไป Import + ตาราง [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) (Confirmation Tab) สำหรับเพิ่ม/ลบ; การแก้ค่า import ใช้ Re-import (upsert ตาม unique key) — 2026-05-19 |
| เสร็จ | `M_Confirm_imports.php` | **PHP:** modal เลือก `.xls/.xlsx` — **React:** Hidden `<input type=file>` + ปุ่ม Upload Excel ใน [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) (Admin only) — 2026-05-19 |
| เสร็จ | `M_confirmation.php` | **React:** `/confirmation` — ค้นหา WO + autocomplete (`GET /api/v1/work-orders/suggestions`) + tabs: Work Order + PM Task List (`confirmTab1.php`), Confirmation (`confirmTab2.php`), Images (`confirmTab3.php`), Planning (`confirmTab4.php`) + Import (`M_Confirm.php`) + Export (`M_Export_confirm*`) — ผ่าน §3 ขอบเขตแกน 2026-05-19 |
| เสร็จ | `M_confirmation_form.php` | รวมกับ `M_confirmation.php` — หน้า `/confirmation` ใช้ search WO + tabs แทน modal form เดิม; close work ใช้ `POST /api/v1/confirmation/:idiw37/close` + image/planning tabs + export/import |
| เสร็จ | `M_department.php` | **PHP:** `tbdepartment` CRUD — **React/BE:** migration [`011_tbdepartment.sql`](../database/migrations/011_tbdepartment.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/department` + แท็บ `department` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_department_form.php` | รวมกับ **`M_department.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_equipment.php` | **PHP:** `tbequipment` + Excel import/CRUD — **React/BE:** migration [`012_tbequipment.sql`](../database/migrations/012_tbequipment.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/equipment` + `POST /api/v1/master-data/equipment/import` + แท็บ `equipment` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete + import file, English-first validation+errors; Excel skip 2 rows) |
| เสร็จ | `M_equipment_form.php` | รวมกับ **`M_equipment.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_equipment_imports.php` | รวมกับ **`M_equipment.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_Export_confirm.php` | **React:** หน้า `/confirmation/export` ([`ConfirmationExportParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx)) — preview ตาราง 14 คอลัมน์เทียบ PHP, badge สิทธิ์ ALL (PAC007/PRO005) / OWN (`wkctr` ตนเอง), ปุ่ม `Download Excel` + `รีเฟรช`; API `GET /api/v1/confirmation/export` (JSON) คู่กับ `.xlsx`; ลิงก์เข้าจาก `/confirmation` ปุ่ม `Preview Export` |
| เสร็จ | `M_Export_confirm_excel.php` | **BE:** migration [`033_view_exportconfirm.sql`](../database/migrations/033_view_exportconfirm.sql) + `GET /api/v1/confirmation/export.xlsx` สร้าง `Export_Confirm.xlsx` ด้วย column เดิม: `Comfirmation`, `Order`, `Operation`, `SubO`, `Ca..`, `Split`, `Wrk Ctr`, `Act.Work`, `unit`, `Start/End date Exe.`, `Start/End Execute`; `PAC007`/`PRO005` export ได้ทุกใบ, user อื่นกรอง `cwkctr = authUser.wkctr` |
| เสร็จ | `M_filter_iw37.php` | รวมใน **`/calendar`** ([`CalendarPage`](../PM-Pepsi-App/frontend/src/features/calendar/CalendarPage.tsx)) + **`/work-orders`** — filter-options/search; ไม่พอร์ต include แยก |
| เสร็จ | `M_functional.php` | **PHP:** `tbfunctional` + Excel import/CRUD — **React/BE:** ใช้ migration [`005_tbwkzb_tbfunctional.sql`](../database/migrations/005_tbwkzb_tbfunctional.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/functional` + `POST /api/v1/master-data/functional/import` + แท็บ `functional` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete + import file, English-first validation+errors; Excel skip 2 rows) |
| เสร็จ | `M_functional_form.php` | รวมกับ **`M_functional.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_functional_imports.php` | รวมกับ **`M_functional.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_Group.php` | **PHP:** `tbwkctrgroup` CRUD — **React/BE:** migration [`021_tbwkctrgroup.sql`](../database/migrations/021_tbwkctrgroup.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/group` + แท็บ `group` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_group_form.php` | รวมกับ **`M_Group.php`** — modal ฟอร์มใน React: create/edit/delete |
| ข้าม | `M_importConfrim.php` | ชื่อผิด (Confrim) — โค้ด = **`M_iw37n`** import `iw37n.xlsx` → **`/iw37n`** + `POST /api/v1/iw37n/import` ([`07-iw37n.md`](parity-pending/07-iw37n.md)); ไม่สับกับ Confirm import (`M_Confirm.php` → `POST /confirmation/import`) |
| เสร็จ | `M_iw37n.php` | **PHP:** Excel → `tbiw37n` (upsert wkorder+opac) — **React/BE:** [`006_tbiw37n_import_batch.sql`](../database/migrations/006_tbiw37n_import_batch.sql) + [`030_tbiw37n_import_row.sql`](../database/migrations/030_tbiw37n_import_row.sql) + `POST /api/v1/iw37n/import` (multipart; คืน `batch` + `rows[]`; **รองรับ duplicate SHA256**: allow upload แต่ไม่ upsert และลิงก์ไป batch เดิม) + `GET /api/v1/iw37n/batches/:id/rows` + `GET /api/v1/iw37n/batches/:id/export.csv` (export) + [`Iw37nPage`](../PM-Pepsi-App/frontend/src/features/iw37n/Iw37nPage.tsx) (download CSV/XLSX) — **คู่มือคอลัมน์:** ดู [`parity-pending/07-iw37n.md`](parity-pending/07-iw37n.md) (ต้องมี: `wkorder`, `opac`, `operationshorttext`, `equipment`, `functionalloc`) |
| เสร็จ | `M_iw37n_form.php` | **React/BE:** เพิ่ม list + edit dialog ในหน้า [`Iw37nPage`](../PM-Pepsi-App/frontend/src/features/iw37n/Iw37nPage.tsx) — **API:** `GET /api/v1/iw37n/items`, `GET /api/v1/iw37n/items/:id`, `PUT /api/v1/iw37n/items/:id` (แก้ 1 แถวใน `tbiw37n`, กันคีย์ซ้ำ wkorder+opac) |
| เสร็จ | `M_iw37n_imports.php` | รวมกับ **`M_iw37n.php`** — modal upload ใน React |
| เสร็จ | `M_level.php` | **PHP:** `tbwklevel` CRUD — **React/BE:** migration [`019_tbwklevel.sql`](../database/migrations/019_tbwklevel.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/level` + แท็บ `level` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_level_form.php` | รวมกับ **`M_level.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_lineproduct.php` | **PHP:** `tbproductline` + Excel import/CRUD — **React/BE:** migration [`015_tbproductline.sql`](../database/migrations/015_tbproductline.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/lineproduct` + `POST /api/v1/master-data/lineproduct/import` + แท็บ `lineproduct` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete + import file; Excel skip 2 rows) |
| เสร็จ | `M_lineproduct_form.php` | รวมกับ **`M_lineproduct.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_lineproduct_imports.php` | รวมกับ **`M_lineproduct.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_lineschdul.php` | **PHP:** `tblineschdul` + Excel import/CRUD — **React/BE:** migration [`003_tblineschdul.sql`](../database/migrations/003_tblineschdul.sql) + unique index [`023_tblineschdul_unique.sql`](../database/migrations/023_tblineschdul_unique.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/lineschdul` + `POST /api/v1/master-data/lineschdul/import` + แท็บ `lineschdul` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete + import file; Excel skip 2 rows; รองรับ CSV ด้วย) |
| เสร็จ | `M_lineschdul_form.php` | รวมกับ **`M_lineschdul.php`** — modal ฟอร์มใน React: create/edit/delete |
| เสร็จ | `M_lineschdul_imports.php` | รวมกับ **`M_lineschdul.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_machine.php` | **PHP:** `tbmainteanance` + Excel import/CRUD (map Zone/Type) — **React/BE:** migrations [`016_tbzone.sql`](../database/migrations/016_tbzone.sql), [`017_tbmainteanance.sql`](../database/migrations/017_tbmainteanance.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/machine` + `POST /api/v1/master-data/machine/import` + แท็บ `machine` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete + import file; Excel skip 2 rows) |
| เสร็จ | `M_machine_form.php` | รวมกับ **`M_machine.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_machine_imports.php` | รวมกับ **`M_machine.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_manhour.php` | **React:** `/manhours/admin` — ตาราง + ค้นหา + นำเข้า/สร้างใหม่ — **API:** `GET/POST/PUT/DELETE /api/v1/manhours` |
| เสร็จ | `M_manhour_chart.php` | **React:** `/manhours` — ช่วงวันที่ + โหลด Performance (เทียบ AJAX ไป `_performance`) |
| เสร็จ | `M_manhour_chart_performance.php` | **React:** แท็บ Performance ใน `/manhours` — `GET /api/v1/manhours/chart/performance` |
| เสร็จ | `M_manhour_chart_show.php` | **React:** แท็บ HR vs Confirm (Pie) — `GET /api/v1/manhours/chart/breakdown` |
| เสร็จ | `M_manhour_form.php` | **React:** modal ใน `/manhours/admin` — **API:** upsert |
| เสร็จ | `M_manhour_imports.php` | **React:** นำเข้า Excel ใน `/manhours/admin` — **API:** `POST /api/v1/manhours/import` |
| เสร็จ | `M_material.php` | **PHP:** `tbmaterial` + Excel import/CRUD — **React/BE:** migration [`018_tbmaterial.sql`](../database/migrations/018_tbmaterial.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/material` + `POST /api/v1/master-data/material/import` + แท็บ `material` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete + import file; Excel skip 2 rows; เก็บ `date` ใน PG) |
| เสร็จ | `M_material_form.php` | รวมกับ **`M_material.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_material_imports.php` | รวมกับ **`M_material.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_personel.php` | **React:** `/personnel` = Personal Dashboard; `/personnel/admin` ([`PersonnelAdminPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx), Admin only) = ตาราง `tbworkcenter` ทั้งหมด + search + ปุ่ม Import + Add. **Backend:** migration [`035_tbworkcenter_full_personnel_columns.sql`](../database/migrations/035_tbworkcenter_full_personnel_columns.sql), service [`personnel-admin.ts`](../PM-Pepsi-App/backend/src/services/personnel-admin.ts), route `GET/POST/PUT/DELETE /api/v1/personnel/admin*` + `POST .../import` + `POST .../:id/image` (แปลง WebP) — 2026-05-19 |
| เสร็จ | `M_personel_confirm.php` | **React:** `/personnel/confirm` ([`PersonnelConfirmPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelConfirmPage.tsx), Admin only) — summary 4 การ์ด + filter status (`all`/`not_started`/`in_progress`/`done`) + search; Progress bar % คำนวณจาก `view_countpersonelclose` (planned_count, countwkctr, percent_close). **Backend:** migration [`036_view_countpersonelclose.sql`](../database/migrations/036_view_countpersonelclose.sql) สร้าง view + [`037_personnel_confirm_menu.sql`](../database/migrations/037_personnel_confirm_menu.sql) เพิ่มเมนู; service [`personnel-confirm.ts`](../PM-Pepsi-App/backend/src/services/personnel-confirm.ts) + route `GET /api/v1/personnel/admin/confirm` — 2026-05-19 |
| เสร็จ | `M_personel_confirm_form.php` | รวมกับ **`M_personel_confirm.php`** — ปุ่ม Confirm ในตารางเปิด `WorkOrderDetailDialog` ด้วย `initialTab="confirm"` (เทียบ legacy modal 4 แท็บ `confirmTab1/2/3/4.php`); ปิด modal แล้ว refetch รายการอัตโนมัติ — 2026-05-19 |
| เสร็จ | `M_personel_form.php` | รวมกับ **`M_personel.php`** — modal 4 แท็บใน [`PersonnelAdminPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) (`personel_form_tab1/2/3` + แท็บรูป WebP); password hash ด้วย bcrypt ถ้าไม่ใช่ bcrypt hash อยู่แล้ว — 2026-05-19 |
| เสร็จ | `M_personel_imports.php` | Service [`personnel-import.ts`](../PM-Pepsi-App/backend/src/services/personnel-import.ts) + route `POST /api/v1/personnel/admin/import` — skip 2 rows แรก, แปลง พ.ศ. → ค.ศ., lookup `position`/`wkctrgroup`/`wkctrtype`/`wklevel` ตามชื่อ → id (เทียบ `ShowDetail()`), transactional + per-row result; UI แสดงผลทีละแถวใน `PersonnelAdminPage` — 2026-05-19 |
| เสร็จ | `M_plan_calendar.php` | **React:** `/plan-calendar` + `GET /api/v1/plan-calendar/events` · login WC → `/plan-calendar` · [`PlanCalendarPage`](../PM-Pepsi-App/frontend/src/features/plan-calendar/PlanCalendarPage.tsx) |
| เสร็จ | `M_planwork_close.php` | **React:** `/planning` toggle “งานปิดแล้ว” → `GET /api/v1/planning/orders?status=closed` (`syst NOT IN ('CRTD','REL')`) + แสดง `Plan Close` จาก `actfinish`; ปุ่ม `ดูปิดงาน` เปิด [`WorkOrderDetailDialog`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) ที่แท็บ Confirm |
| เสร็จ (แกน) | `M_planwork_view.php` | React **`/planning`** + `007_tbplangingwork_view_planwork.sql` + `GET /api/v1/planning/orders?status=open|closed` + Assign dialog (Admin) ใน [`PlanningPage`](../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) + ปุ่มบันทึก/ดูปิดงานเปิด `WorkOrderDetailDialog` Confirm tab + เลข WO ลิงก์ `/work-orders/:id`; data visibility ต้อง map `tbiw37n.wkctr`/`tbplangingwork.wkctr` → `tbworkcenter.idwkctr` ของ user login (มี query ตรวจใน [`verify_app_schema.sql`](../database/scripts/verify_app_schema.sql)); เหลือทดสอบบนข้อมูลจริงครบทุกสถานะ |
| เสร็จ | `M_planwork_view_form.php` | **แกนเสร็จ:** Assign dialog ใน [`PlanningPage`](../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) — เลือก WC ปลายทาง (`fetchWorkcenters`) / Team `P`/`G` / `pwcomment` + shortcut “จ่ายให้ฉัน” → **API:** `POST /api/v1/planning/assign` ใน [`routes/planning.ts`](../PM-Pepsi-App/backend/src/routes/planning.ts) (Admin-only 403, zod 400, 404 ถ้าไม่อยู่ใน CRTD/REL, 503 ถ้ายังไม่รัน `007_*`) + service [`assignPlanningWork`](../PM-Pepsi-App/backend/src/services/planning.ts) upsert `tbplangingwork` ตาม `idiw37`; 4 tabs ฟอร์มเดิมรวมกับ `WorkOrderDetailDialog` (§5 `plan_confirmTab*`) |
| เสร็จ | `M_planwork_view_form_close.php` | **React:** `WorkOrderDetailDialog` รองรับ `initialTab="confirm"` จาก `/planning` — เทียบ close form: Close Work (`POST/DELETE /api/v1/confirmation/...close`), Close Detail comments, Close Images upload/list/delete/view |
| เสร็จ | `M_position.php` | **PHP:** `tbposition` CRUD — **React/BE:** migration [`020_tbposition.sql`](../database/migrations/020_tbposition.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/position` + แท็บ `position` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_position_form.php` | รวมกับ **`M_position.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_reason.php` | **PHP:** `tbreason` CRUD — **React/BE:** ใช้ migration [`009_tbreason.sql`](../database/migrations/009_tbreason.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/reason` + แท็บ `reason` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_reason_form.php` | รวมกับ **`M_reason.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_tasklist.php` | **PHP:** `tbtasklist` + Excel import/CRUD — **React/BE:** migration [`022_tbtasklist.sql`](../database/migrations/022_tbtasklist.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/tasklist` + `POST /api/v1/master-data/tasklist/import` + แท็บ `tasklist` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete + import file; Excel skip 2 rows; รองรับ CSV ด้วย) |
| เสร็จ | `M_tasklist_form.php` | รวมกับ **`M_tasklist.php`** — modal ฟอร์มใน React: create/edit/delete |
| เสร็จ | `M_tasklist_imports.php` | รวมกับ **`M_tasklist.php`** — modal import file ใน React (file upload เป็นหลัก + CSV paste สำรอง) |
| เสร็จ | `M_UserLog.php` | **React:** `/user-log` — **BE:** `GET /api/v1/user-log` (filter ตามผู้ใช้ที่ล็อกอิน; limit 50) |
| เสร็จ | `M_workstatus.php` | **PHP:** `tbwkstatus` CRUD — **React/BE:** migration [`013_tbwkstatus_add_wkstreason.sql`](../database/migrations/013_tbwkstatus_add_wkstreason.sql) (เพิ่ม `wkstreason`) + `GET/POST/PUT/DELETE /api/v1/master-data/workstatus` + แท็บ `workstatus` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_workstatus_form.php` | รวมกับ **`M_workstatus.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_worktype.php` | **PHP:** `tbwkctrtype` CRUD — **React/BE:** migration [`014_tbwkctrtype.sql`](../database/migrations/014_tbwkctrtype.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/worktype` + แท็บ `worktype` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_worktype_form.php` | รวมกับ **`M_worktype.php`** — modal ฟอร์มใน React: create/edit/delete โหมดเดียวกับ PHP |
| เสร็จ | `M_zb.php` | **PHP:** `tbwkzb` CRUD — **React/BE:** ใช้ migration [`005_tbwkzb_tbfunctional.sql`](../database/migrations/005_tbwkzb_tbfunctional.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/zb` + แท็บ `zb` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (modal create/edit/delete, English-first validation+errors) |
| เสร็จ | `M_zb_form.php` | รวมกับ **`M_zb.php`** — modal ฟอร์มใน React: create/edit/delete |
| เสร็จ | `M_zone.php` | **Dependency สำหรับ Machine:** migration [`016_tbzone.sql`](../database/migrations/016_tbzone.sql) + `GET/POST/PUT/DELETE /api/v1/master-data/zone` + แท็บ `zone` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) |
| เสร็จ | `M_zone_form.php` | รวมกับ **`M_zone.php`** — modal ฟอร์มใน React: create/edit/delete |
| เสร็จ | `M_zone_imports.php` | **PHP:** Excel import `tbzone` (skip 2 rows; map `productline` → `idproductline`) — **React/BE:** migration [`016_tbzone.sql`](../database/migrations/016_tbzone.sql) + extend [`024_tbzone_extend.sql`](../database/migrations/024_tbzone_extend.sql) + `POST /api/v1/master-data/zone/import` + แท็บ `zone` ใน [`MasterDataPage`](../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) (import file รองรับ CSV/Excel + skip 2 rows; เพิ่มฟิลด์ `zonedescrip` + `idproductline`) |
| ข้าม | `member.php` | Legacy `pages/member*` → **`/personnel`**, **`/admin/users`** (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 2026-05-21) |
| เสร็จ | `member_change_password.php` | `/settings` → โปรไฟล์ + [`ChangePasswordForm`](../../PM-Pepsi-App/frontend/src/features/settings/ChangePasswordForm.tsx) |
| เสร็จ | `member_change_password_process.php` | `POST /api/v1/auth/change-password` (WC + member) |
| ข้าม | `member_chk_password.php` | Legacy `pages/member*` → **`/personnel`**, **`/admin/users`** (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `member_edit.php` | Legacy `pages/member*` → **`/personnel`**, **`/admin/users`** (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `member_export.php` | Legacy `pages/member*` → **`/personnel`**, **`/admin/users`** (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `member_form.php` | Legacy `pages/member*` → **`/personnel`**, **`/admin/users`** (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `member_import.php` | Legacy `pages/member*` → **`/personnel`**, **`/admin/users`** (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `member_import_process.php` | Legacy `pages/member*` → **`/personnel`**, **`/admin/users`** (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `navbar.php` | **React:** `AppShell` / `AppNavShell` — ไม่พอร์ตไฟล์แยก |
| ข้าม | `password.php` | SB Admin template (`password.html` / `password.pug`) — ฟอร์ม email + ปุ่มลิงก์ `login.html` ไม่มี backend; ไม่ถูกเรียกจากเมนู production (`login.php` คอมเมนต์ Forgot Password) — **ไม่พอร์ต**; เปลี่ยนรหัสจริง → `member_change_password.php` → **`/settings`** |
| ข้าม | `personel_form_tab1.php` | รวมใน **`/personnel`** + `M_personel*` (ไม่พอร์ต `pages/personel_*` แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `personel_form_tab2.php` | รวมใน **`/personnel`** + `M_personel*` (ไม่พอร์ต `pages/personel_*` แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `personel_form_tab3.php` | รวมใน **`/personnel`** + `M_personel*` (ไม่พอร์ต `pages/personel_*` แยก — ขั้นที่ 1 2026-05-21) |
| ข้าม | `register.php` | ไม่ใช่ flow production |
| ข้าม | `Scheduing.php` | สะกดผิด/ไม่ใช้เมนูหลัก |
| ข้าม | `select_equipment.php` | UI helper เก่า — ไม่พอร์ต (ฟิลเตอร์ equipment อยู่ใน `/calendar`, `/work-orders`) |
| ข้าม | `selectMunti.php` | typo / multi-select demo — ไม่พอร์ต |
| ข้าม | `show_form.php` | template form — ไม่พอร์ต |
| ข้าม | `slectall.php` | typo / select-all helper — ไม่พอร์ต |
| ข้าม | `tables.php` | demo tables — ไม่พอร์ต |
| ข้าม | `tabs.php` | demo tabs — ไม่พอร์ต |
| ข้าม | `tb_confirm.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_delete.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_export.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_exports.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_form_process.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_import.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_import_process.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_imports.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment_imports_process.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_equipment-bk.php` | สำรอง — Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_functional.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_functional_delete.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_functional_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_ip19.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_ip19_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_iw37n.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_iw37n_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_machine.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_machine_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_manhour_imports.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_mc_work.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_mc_work_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_mntplan.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_mntplan_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_striped_product.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_striped_product_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_workcentre.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_workcentre_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_workcentretype.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_workcentretype_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_zone.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tb_zone_form.php` | Legacy `pages/tb_*` → **`/master-data`** + `M_*` API (ไม่พอร์ตไฟล์แยก — ขั้นที่ 1 เอกสาร 2026-05-21) |
| ข้าม | `tbdepartment.php` | Legacy `pages/tb_*` → แท็บ **department** ใน **`/master-data`** (`M_department`) |
| ข้าม | `tbdepartment_form.php` | รวมใน **`/master-data`** |
| ข้าม | `tbposition.php` | แท็บ **position** ใน **`/master-data`** (`M_position`) |
| ข้าม | `tbposition_form.php` | รวมใน **`/master-data`** |
| ข้าม | `tbwkctrgroup.php` | แท็บ **group** ใน **`/master-data`** (`M_wkctrgroup`) |
| ข้าม | `tbwkctrgroup_form.php` | รวมใน **`/master-data`** |
| ข้าม | `tbwkctrtype.php` | แท็บ **work type** ใน **`/master-data`** (`M_wkctrtype`) |
| ข้าม | `tbwkctrtype_form.php` | รวมใน **`/master-data`** |
| ข้าม | `test_date.php` | ทดสอบ — ไม่พอร์ต |
| ข้าม | `test_date3.php` | ทดสอบ — ไม่พอร์ต |
| ข้าม | `Test_fileinput.php` | ทดสอบ — ไม่พอร์ต |
| ข้าม | `user.php` | Legacy profile tabs → **`/settings`** (เทียบ `PLAN.md` P2) |
| ข้าม | `user_form.php` | รวมใน **`/settings`** |
| ข้าม | `user_form_tab1.php` | รวมใน **`/settings`** |
| ข้าม | `user_form_tab2.php` | รวมใน **`/settings`** |
| ข้าม | `user_form_tab4.php` | รวมใน **`/settings`** |
| ข้าม | `user_form-bk.php` | สำรอง — ไม่พอร์ต |
| ข้าม | `user_profile.php` | รวมใน **`/settings`** |
| ข้าม | `view_confirm.php` | นิยาม SQL view — ข้อมูลผ่าน API (`view_confirmation`, `/confirmation`, `/personnel`) |
| ข้าม | `view_planwork.php` | นิยาม SQL view — ข้อมูลผ่าน API (`view_planwork`, `/planning`, `/plan-calendar`) |
| ข้าม | `W_add_image.php` | รวมใน Confirm images (`WorkOrderDetailDialog` + `POST confirmation/.../images`) |
| ข้าม | `W_add_image_upload.php` | รวมใน Confirm images upload handler |
| ข้าม | `W_calc_birthday.php` | calc helper เก่า — ไม่พอร์ต |
| ข้าม | `W_calc_birthday_worktime.php` | รวมใน **`/worktime`** / manhour calc |
| ข้าม | `W_calc_worktime.php` | รวมใน **`/worktime`** |
| ข้าม | `W_calendar.php` | Worker FullCalendar ซ้ำ → **`/plan-calendar`** + **`/calendar`** + dialog |
| ข้าม | `W_calendar_wkctr.php` | Worker calendar ตาม `wkctr` → **`/calendar/wc/:code`** + dialog |
| เสร็จ | `W_confirm_form.php` | **React:** แท็บ `Confirm` ใน `WorkOrderDetailDialog` รวม 3 แท็บ (Close Images/Close Detail/Close Work) |
| เสร็จ | `W_confirm_formcom.php` | **React:** Close Detail (comment) — API: `GET/POST/PUT/DELETE /api/v1/confirmation/...comments...` (migration `029_confirmation_comments_images.sql`) |
| เสร็จ | `W_confirm_formcom_edit.php` | **React:** edit comment ใน Close Detail |
| เสร็จ | `W_confirm_formimg.php` | **React:** Close Images (upload/list/delete/view) — API: `GET/POST/DELETE /api/v1/confirmation/...images...` + `GET /api/v1/confirmation/images/:idcimg/data` |
| เสร็จ | `W_confirm_formimg2.php` | **React:** Close Images (รองรับ JPEG) |
| เสร็จ | `W_confirm_workclose.php` | **React:** Close Work Confirm — API: `GET /api/v1/confirmation/by-wkorder/:wkorder` + `POST /api/v1/confirmation/:idiw37/close` + `DELETE /api/v1/confirmation/close/:idclose` |
| เสร็จ | `W_confirmation.php` | **React:** รายละเอียด WO → Confirm tab (รวม flow confirmation) |
| เสร็จ | `W_confirmation_form.php` | **React:** ฟอร์มปิดงานใน Confirm tab |
| เสร็จ | `W_manhours_hr.php` | **React:** `/manhours-hr` — `GET /api/v1/manhours/hr` + ตาราง HR (position, Summary/W, OT net) — §3 แกน 2026-05-19 |
| เสร็จ | `W_planwork_view.php` | **React:** `/planning` toggle “งานเปิด” → `GET /api/v1/planning/orders?status=open` (`CRTD/REL` ตาม `idwkctr` ของ user login); ปุ่ม `บันทึกปิดงาน` เปิด `WorkOrderDetailDialog` แท็บ Confirm เพื่อ close work (`W_confirm_form` flow) |
| เสร็จ | `W_planwork_view_close.php` | **React:** `/planning` toggle “งานปิดแล้ว” → `GET /api/v1/planning/orders?status=closed` + `Plan Close`; ปุ่ม `ดูปิดงาน` เปิด Confirm tab เพื่อดู close/images/comments |
| เสร็จ (แกน) | `W_summary_weekly.php` | **React:** `/summary-weekly` ตาราง PM/Reactive/RCA + % |
| เสร็จ (แกน) | `W_summary_weekly_chart.php` | รวมใน `/summary-weekly` (Technician Utilizations) |
| เสร็จ (แกน) | `W_summary_weekly_chart.php` | รวมใน `/summary-weekly` + fullscreen `?variant=chart` |
| เสร็จ (แกน) | `W_summary_weekly_chart_full.php` | **React:** `/summary-weekly/chart/full?variant=chart` |
| เสร็จ (แกน) | `W_summary_weekly_chart2.php` | **React:** bar chart ใน `/summary-weekly` |
| เสร็จ (แกน) | `W_summary_weekly_chart2_full.php` | **React:** `/summary-weekly/chart/full?variant=chart2` |
| ข้าม | `W_worktime_count.php` | เนื้อหาเดียวกับ `worktime_count.php` (ไฟล์ซ้ำ) — ไม่พอร์ตแยก |
| เสร็จ | `W_worktime_view.php` | **React:** `/worktime` แท็บ "มอบหมายงาน" — `GET /api/v1/worktime/planning` (tbplangingwork + tbiw37n) |
| เสร็จ | `Work_Order_Status.php` | **React:** `/work-orders` แสดงตาราง status จาก `app.tbwkstatus` (syst/wkstreason/wkstcolor) |
| เสร็จ | `workorder.php` | **React:** `/work-orders` ฟิลเตอร์แบบ `M_filter_iw37` + ตารางรายการจาก `app.view_order` + เลือก Team A/B/P ต่อแถว (API: `GET /api/v1/work-orders/filter-options`, `POST /api/v1/work-orders/search`, `PUT /api/v1/work-orders/:id/team`) |
| ข้าม | `worktime_count.php` | fragment — `SUM(wh+ot1+ot15+ot1hol+ot2+ot3)` จาก `tbmanhours` ตาม `idwkctr`; เคย `include` ใน `navbar.php` → แทนด้วย `getWorktimeTotal` → `worktimeTotalHours` ใน `GET /auth/me` + `worktime` ใน `GET /personnel/me/dashboard` |
| เสร็จ | `worktime_manhours.php` | **React:** `/worktime` — `GET /api/v1/worktime/me` รายวัน + สรุปชั่วโมง — §3 แกน 2026-05-19 |
| ข้าม | `worktime_view.php` | ร่าง/ซ้ำ `W_worktime_view` (join `tbplangingwork`+`view_workcenter` แต่แสดงฟิลด์ `tbiw37n` ผิด) — ไม่มีเมนู `module=worktime_view`; production = **`W_worktime_view`** → **`/worktime`** |

---

## 5) Checklist — `sap/modalPages/` (fragment / modal / AJAX)

| สถานะ | ไฟล์ PHP | หมายเหตุ |
|--------|----------|---------|
| เสร็จ | `AddClose.php` | `WorkOrderDetailDialog` แท็บ Confirm → Close Work + `POST /api/v1/confirmation/:idiw37/close` |
| เสร็จ | `AddClosePersonel.php` | แท็บ Personnel Close + `POST/DELETE /api/v1/confirmation/.../personnel-close` (`073_tbwrkclose.sql`) |
| เสร็จ (แกน) | `AddPlan.php` | **React:** `POST /api/v1/planning/assign` + `PUT/DELETE /api/v1/work-orders/:id/planning` |
| เสร็จ | `AddTeam.php` | **React:** `PUT /api/v1/work-orders/:id/team` — ตาราง [`/work-orders`](../../PM-Pepsi-App/frontend/src/features/work-orders/WorkOrdersPage.tsx) (radio A/B/P) + แท็บ Work Order ใน [`WorkOrderDetailDialog`](../../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) (เทียบ `workorder.php` → `AddTeam.php`) |
| เสร็จ | `autocomplete.php` | **React/BE:** แทนด้วย [`WorkOrderAutocomplete`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderAutocomplete.tsx) ใน `/confirmation` เรียก `GET /api/v1/work-orders/suggestions?q=` (จำกัด 50 แถวจาก `view_order`, แสดง `wkorder` / `wktype` / `operationshorttext`) |
| เสร็จ | `ChackStatus.php` | **React:** [`WorkOrderWorkflowSteps`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderWorkflowSteps.tsx) ใน `WorkOrderDetailDialog` + suffix ใน title ปฏิทิน (`/calendar`, `/backlog`, `/plan-calendar`) — **API:** `workflow` ใน `GET /api/v1/work-orders/:id` + [`work-order-workflow.ts`](../PM-Pepsi-App/backend/src/services/work-order-workflow.ts) |
| เสร็จ | `confirmTab1.php` | รวมใน [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) แท็บ Work Order + Tasklist — แสดง WO detail จาก `GET /api/v1/work-orders/:id` และ PM Task List จาก `GET /api/v1/work-orders/:id/modal-detail` (`taskList.summary/items`) เทียบ `view_tarklist` |
| เสร็จ | `confirmTab2.php` | รวมใน [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) แท็บ Confirmation — เพิ่ม/ลบช่าง+เวลา ผ่าน `POST /api/v1/confirmation/:idiw37/close`, `GET /api/v1/confirmation/by-wkorder/:wkorder`, `DELETE /api/v1/confirmation/close/:idclose` |
| เสร็จ | `confirmTab3.php` | รวมใน [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) แท็บ Images — JPEG upload/list/preview/delete ผ่าน `confirmation/images*` API + `tbconfirmimg` จาก migration `029_confirmation_comments_images.sql` |
| เสร็จ | `confirmTab4.php` | รวมใน [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) แท็บ Planning — แสดงผู้รับผิดชอบจาก `GET /api/v1/work-orders/:id/modal-detail` (`planning.assigned`) เทียบ `view_planwork`; Admin assign/delete ผ่าน `PUT/DELETE /api/v1/work-orders/:id/planning` |
| เสร็จ | `FilterDetail.php` | **React:** `/backlog` แสดง “สรุปตัวกรอง” (WorkOrder + breakdown ตาม `tbwkzb` + completion + Team A/B/P + sum(work)) — **API:** `POST /api/v1/backlog/filter-detail` |
| เสร็จ | `FilterDetail_AddTeam.php` | **React:** Team A/B/P count + Work (Min) — [`/backlog`](../../PM-Pepsi-App/frontend/src/features/backlog/BacklogPage.tsx) `POST /api/v1/backlog/filter-detail` + [`/work-orders`](../../PM-Pepsi-App/frontend/src/features/work-orders/WorkOrdersPage.tsx) `POST /api/v1/work-orders/filter-detail` · [`FilterDetailSummary`](../../PM-Pepsi-App/frontend/src/components/scheduling/FilterDetailSummary.tsx) |
| เสร็จ | `ModalMHshow.php` | **React:** `/backlog` manhour dialog (เลือกช่วงวันจาก FullCalendar / DatePicker) → **API:** `POST /api/v1/backlog/manhour-summary` (รวม plan/action, breakdown ตาม `tbwkzb`, completion, ตารางรายการจาก `view_order`) |
| เสร็จ | `ModalOrderDetail.php` | **React:** `WorkOrderDetailDialog` (แท็บ Work Order / Task List / Machine / Planning / Material / Confirm) — **API:** `GET /api/v1/work-orders/:id/modal-detail` + **Planning:** `PUT/DELETE /api/v1/work-orders/:id/planning` |
| ข้าม | `ModalOrderDetailXXX.php` | ไม่ใช้ production — ใช้ `ModalOrderDetail.php` → `WorkOrderDetailDialog` |
| เสร็จ | `MovePlant.php` | **React:** [`MovePlanDialog`](../PM-Pepsi-App/frontend/src/components/scheduling/MovePlanDialog.tsx) ใน `/calendar`, `/backlog`, `WorkOrderDetailDialog` — `POST /api/v1/scheduling/move-plan` |
| เสร็จ | `plan_confirmTab1.php` | รวมใน `WorkOrderDetailDialog` แท็บ Work Order / Task List — แสดง WO detail + task list จาก `GET /api/v1/work-orders/:id` และ `GET /api/v1/work-orders/:id/modal-detail` |
| เสร็จ | `plan_confirmTab1_close.php` | รวมใน `WorkOrderDetailDialog` แท็บ Work Order / Task List สำหรับ flow ปิดงาน |
| เสร็จ | `plan_confirmTab2.php` | รวมใน `WorkOrderDetailDialog` แท็บ Confirm → Close Work — `POST /api/v1/confirmation/:idiw37/close` + `GET /api/v1/confirmation/by-wkorder/:wkorder` |
| เสร็จ | `plan_confirmTab2_close.php` | รวมใน `WorkOrderDetailDialog` แท็บ Confirm → Close Work สำหรับดู/จัดการประวัติปิดงาน |
| เสร็จ | `plan_confirmTab3.php` | รวมใน `WorkOrderDetailDialog` แท็บ Confirm → Close Images — upload/list/delete/view ผ่าน `confirmation/images*` API |
| เสร็จ | `plan_confirmTab3_close.php` | รวมใน `WorkOrderDetailDialog` แท็บ Confirm → Close Images สำหรับ flow ปิดงาน |
| เสร็จ | `plan_ShowClose_close.php` | รวมใน `WorkOrderDetailDialog` แท็บ Confirm → Close Work list (`confirmation/by-wkorder`) |
| เสร็จ | `plan_ShowImgUpload_close.php` | รวมใน `WorkOrderDetailDialog` แท็บ Confirm → Close Images list/view (`confirmation/images*`) |
| เสร็จ | `plan_submit_upload_file.php` | แทนด้วย `POST /api/v1/confirmation/:idiw37/images`, `DELETE /api/v1/confirmation/images/:idcimg`, `GET /api/v1/confirmation/images/:idcimg/data` |
| เสร็จ | `ShowClose.php` | fragment ใน `confirmTab2.php` → [`WorkOrderDetailDialog`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) แท็บ Confirm → Close Work (`GET /api/v1/confirmation/by-wkorder/:wkorder`, `DELETE .../close/:idclose`) |
| เสร็จ | `ShowImgUpload.php` | fragment ใน `confirmTab3.php` → แท็บ Confirm → Images (`POST/GET/DELETE confirmation/images*`) — เทียบ `plan_ShowImgUpload_close` |
| เสร็จ | `ShowPlan.php` | `WorkOrderDetailDialog` แท็บ Planning — ตารางผู้รับผิดชอบรายบุคคล (wkctr, ชื่อ, กลุ่มงาน, ตำแหน่ง) |
| เสร็จ | `ShowPlan_Close.php` | รวมใน `WorkOrderDetailDialog` แท็บ Planning — แสดงผู้รับผิดชอบจาก `tbplangingwork` ผ่าน `work-orders/:id/modal-detail` |
| เสร็จ | `ShowPlanGroup.php` | ตารางผู้รับผิดชอบรายกลุ่ม (`pwteam=G`) ในแท็บ Planning เดียวกัน |
| เสร็จ | `ShowWorkClose.php` | รายการใน Confirm → Personnel Close (`view_personelclose`) |
| เสร็จ | `submit_upload_file.php` | รวมใน `confirmTab3` + `POST /api/v1/confirmation/:idiw37/images` (เทียบ `plan_submit_upload_file.php`) |
| เสร็จ | `TabMachine.php` | รวมใน `WorkOrderDetailDialog` |
| เสร็จ | `TabMaterial.php` | รวมใน `WorkOrderDetailDialog` |
| เสร็จ | `TabPlanning.php` | รวมใน `WorkOrderDetailDialog` |
| เสร็จ | `TabTarkList.php` | รวมใน `WorkOrderDetailDialog` |
| เสร็จ | `TabWorkOrder.php` | รวมใน `WorkOrderDetailDialog` |

### 5.1) utility §5 — `sap/pages/` helper (ข้ามทั้งกลุ่ม)

ไฟล์เหล่านี้อยู่ **`pages/`** ไม่ใช่ `modalPages/` — ไม่พอร์ต route แยก; ฟังก์ชันรวมใน route หลักแล้ว (ดูตารางขยายใน [`parity-pending/PLAN.md`](parity-pending/PLAN.md) §4 P1)

| สถานะ | กลุ่ม | ไฟล์ | React แทน |
|--------|--------|------|-----------|
| ข้าม | UI helper | `select_equipment`, `selectMunti`, `show_form`, `slectall`, `tables`, `tabs` | `/calendar`, `/work-orders`, Shadcn |
| ข้าม | SQL view | `view_confirm`, `view_planwork` | API ใช้ `view_confirmation` / `view_planwork` |
| ข้าม | รูป | `W_add_image`, `W_add_image_upload` | Confirm images ใน `WorkOrderDetailDialog` |
| ข้าม | calc | `W_calc_birthday*`, `W_calc_worktime` | `/worktime`, `/manhours`, personnel |
| ข้าม | โปรไฟล์ | `user*`, `user_profile` | `/settings` |
| ข้าม | worktime | `worktime_view`, `worktime_count`, `W_worktime_count` | `/worktime`, personnel dashboard |

---

## 6) สรุปจำนวน (อัปเดตเมื่อมีการข้าม/รวมไฟล์)

| พื้นที่ | จำนวนไฟล์ (ประมาณ) |
|---------|---------------------|
| `sap/pages/*.php` | 204 |
| `sap/modalPages/*.php` | 37 |
| **รวมรายการใน checklist** | 241 |
| **ยังไม่ทำ (§4+§5)** | **0** — กลุ่ม D ข้ามครบ; P1–P3 เสร็จ/ข้าม; เหลือ **UAT ขั้น 5** + track **E** (deploy) |

เมื่อทำงานจริง อาจลดจำนวนแถวโดยรวม `_form` + list หลักเป็น “ชุดเดียว” แต่ **ต้องระบุในหมายเหตุ** ว่ารวมแล้ว — **ขั้นที่ 1 (2026-05-21):** มาร์ก `tb_*`, `member*`, `M_iw37n*`, `M_planwork_view`, `M_filter_iw37`, modal แกนหลัก → **เสร็จ/ข้าม**

---

## 7) ประวัติการอัปเดตเอกสาร

| วันที่ | ผู้แก้ | สรุป |
|--------|--------|------|
| 2026-05-21 | — | **ขั้นที่ 3.1 `ChackStatus`** — workflow 4 ขั้น (Team/Assign/Worktime/Confirm) ใน `WorkOrderDetailDialog` + suffix ปฏิทิน |
| 2026-05-21 | — | **ขั้นที่ 1 เอกสาร** — §4: `M_iw37n*`, `M_planwork_view`, `M_filter_iw37`, `M_plan_calendar` → เสร็จ; legacy `pages/tb_*`, `member*`, `personel_*` → ข้าม (`/master-data`, `/personnel`); §5: `MovePlant`, `confirmTab*`, `plan_confirmTab*`, `Modal*` แกน → เสร็จ; ซิงค์ [`COMPLETION-MATRIX`](parity-pending/COMPLETION-MATRIX.md) ลำดับ 7–8 |
| 2026-05-16 | — | สร้างเอกสารครั้งแรก — เติมรายการครบจาก `sap/pages` และ `sap/modalPages` |
| 2026-05-16 | — | `aa.php` — วิเคราะห์แล้ว: stub ว่าง → สถานะ **ข้าม** (ไม่พอร์ต) |
| 2026-05-16 | — | `pages/autocomplete.php` — ตัวอย่าง/ทดลอง → **ข้าม**; `modalPages/autocomplete.php` — endpoint ค้น work order → พอร์ตแล้วใน `/confirmation` ด้วย `WorkOrderAutocomplete` + `GET /api/v1/work-orders/suggestions` เมื่อ 2026-05-19 |
| 2026-05-16 | — | ขยาย **ข้อ 3.1 UI** — checklist ฟอร์ม/ตาราง/ปุ่ม/โครงสร้างหน้า + วิธีสแกน PHP; แก้ชื่อ layout เป็น `AppShell` |
| 2026-05-16 | — | เพิ่ม **ข้อ 3.2–3.5** (ข้อมูล / กฎธุรกิจ / modal / ทดสอบ) และอัปเดต bullet หลักข้อ 3 ให้อ้างอิงหมวดย่อย |
| 2026-05-16 | — | **Sidebar** — จัดกลุ่มเมนู + เพิ่มลิงก์ parity (`line-calendar`, `confirmation`, `worktime`, `manhours-hr`, `summary-weekly`) อ้างอิง `left_menu.php` / `left_menu_bk17052563.php` |
| 2026-05-16 | — | **`calc_birthday.php`** — fragment navbar + `timespan` → **ข้าม** เป็น route; รวมความต้องการกับโปรไฟล์/ `function_calc_birthday.php` เมื่อทำ auth |
| 2026-05-16 | — | **`blankpage_bk17052563.php`** — fragment เทมเพลตสำรอง → **ข้าม** (ไม่พอร์ต) |
| 2026-05-16 | — | **`calendar.php` / `calendar_bk170563.php` / `calendar_wkctr.php`** — วิเคราะห์: หลัก = FullCalendar+`M_filter_iw37`; bk=ข้าม; wkctr=`view_confrim`+ลิงก์จาก `user.php` → อัปเดต checklist + แมปข้อ 2 |
| 2026-05-16 | — | **`calc_worktime.php`** — fragment “อายุการทำงาน” (`startwork` + `timespan`) → **ข้าม** เป็น route; คู่ `calc_birthday.php` ในโปรไฟล์ |
| 2026-05-16 | — | **`backlog.php` → React** `/backlog` + MSW `filter-options` / `events`; checklist **เสร็จ** (ยังเหลือ MovePlant / DnD เต็มรูปแบบ) |
| 2026-05-16 | — | **`charts.php` / `Confirmation.php` / `content.php`** — วิเคราะห์: เทมเพลตหรือโค้ดค้างที่ไม่สอดคล้องเมนูหลัก → checklist **ข้าม**; แก้แมปข้อ 2 (`/reports` ไม่นับ demo `charts.php`; เพิ่มแถว `content.php` → **`/`**) |
| 2026-05-16 | — | **สัญญา API + MSW** — เพิ่มหัวข้อใน `skills.md`; checklist ข้อ 1 bullet 5; คอมเมนต์อ้างอิงใน `schemas.ts` / `handlers.ts` |
| 2026-05-16 | — | **MSW + Zod** — เพิ่ม `mocks/jsonFromSchema.ts`; handlers หลักใช้ `safeParse` ก่อนคืน JSON; เพิ่ม `healthResponseSchema`, `iw37nBatchItemSchema`, `iw37nImportResponseSchema` ใน `schemas.ts`; อัปเดต `skills.md` |
| 2026-05-16 | — | **`import_test.php` / `info.php`** — วิเคราะห์: ทดสอบ import + เทมเพลต demo — checklist **ข้าม** |
| 2026-05-16 | — | **`iw37n.php` / `iw37n_form.php`** — legacy CRUD `tbiw37n` ไม่มีเมนู; เมนูจริง = `M_iw37n*` — checklist **ข้าม**; parity ที่ **`/iw37n`** + แถว checklist **`M_iw37n*.php`** |
| 2026-05-16 | — | **`left_menu*.php` / `line_calendar.php` / `login.php` / `login-bk.php` / `logout.php`** — วิเคราะห์: เมนู DB + default `line_calendar`; login WC vs backup member; logout + userlog — อัปเดต checklist |
| 2026-05-16 | — | **`M_activitytype.php` (+ `_form` / `_imports`)** — ปิด parity: import รองรับ `.csv/.xls/.xlsx/.xlsm/.xlsb` + skip 2 แถวแรก (Excel), modal ฟอร์ม create/edit/delete, validation+errors ฝั่ง UI (English-first); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_department.php` (+ `_form`)** — ปิด parity: migration `011_tbdepartment.sql`, CRUD API `.../master-data/department`, แท็บ Department ต่อ DB ใน `/master-data` (modal create/edit/delete, English-first validation+errors); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_equipment.php` (+ `_form` / `_imports`)** — ปิด parity: migration `012_tbequipment.sql`, CRUD/import API `.../master-data/equipment`, แท็บ Equipment ต่อ DB ใน `/master-data` (modal create/edit/delete + import file, English-first validation+errors; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_functional.php` (+ `_form` / `_imports`)** — ปิด parity: ใช้ migration `005_tbwkzb_tbfunctional.sql`, CRUD/import API `.../master-data/functional`, แท็บ Functional loc. ต่อ DB ใน `/master-data` (modal create/edit/delete + import file, English-first validation+errors; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_reason.php` (+ `_form`)** — ปิด parity: ใช้ migration `009_tbreason.sql`, CRUD API `.../master-data/reason`, แท็บ Reason ต่อ DB ใน `/master-data` (modal create/edit/delete, English-first validation+errors); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_workstatus.php` (+ `_form`)** — ปิด parity: migration `013_tbwkstatus_add_wkstreason.sql` เพิ่ม `wkstreason`, CRUD API `.../master-data/workstatus`, แท็บ Work status ต่อ DB ใน `/master-data` (modal create/edit/delete, English-first validation+errors); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_worktype.php` (+ `_form`)** — ปิด parity: migration `014_tbwkctrtype.sql`, CRUD API `.../master-data/worktype`, แท็บ Work type ต่อ DB ใน `/master-data` (modal create/edit/delete, English-first validation+errors); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_lineproduct.php` (+ `_form` / `_imports`)** — ปิด parity: migration `015_tbproductline.sql`, CRUD/import API `.../master-data/lineproduct`, แท็บ Line product ต่อ DB ใน `/master-data` (modal create/edit/delete + import file; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_zone.php` (+ `_form`)** — ปิด parity: migration `016_tbzone.sql`, CRUD API `.../master-data/zone`, แท็บ Zone ต่อ DB ใน `/master-data`; อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_machine.php` (+ `_form` / `_imports`)** — ปิด parity: migration `017_tbmainteanance.sql` + dependency `tbzone`/`tbwkctrtype`, CRUD/import API `.../master-data/machine`, แท็บ Machine ต่อ DB ใน `/master-data` (modal create/edit/delete + import file; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **`M_material.php` (+ `_form` / `_imports`)** — ปิด parity: migration `018_tbmaterial.sql`, CRUD/import API `.../master-data/material`, แท็บ Material ต่อ DB ใน `/master-data` (modal create/edit/delete + import file; Excel skip 2 rows; เก็บ date ใน PG); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-16 | — | **Line calendar docs** — อัปเดตแมปข้อ 2 ให้ตรงสถานะจริง (มี FullCalendar/modal/DnD แล้ว) และระบุ dependency `023_tblineschdul_unique.sql` สำหรับ upsert/import |
| 2026-05-16 | — | **PG view_lineschdul** — เพิ่ม migration `027_view_lineschdul.sql` สร้าง `app.view_lineschdul` เพื่อ parity กับ legacy `SELECT * FROM view_lineschdul` |
| 2026-05-16 | — | **Work calendar** — ปิด parity `calendar.php` (ฟิลเตอร์ `M_filter_iw37` บน React) ด้วย `GET /calendar/filter-options` + `POST /calendar/events`; อัปเดต [`parity-pending/04-work-calendar.md`](parity-pending/04-work-calendar.md) |
| 2026-05-16 | — | **calendar_wkctr route** — เพิ่ม route `/calendar/wc/:code` และรองรับ query `/calendar?wkctr=` เพื่อ prefill ตัวกรอง `wkctr` (ยังไม่ต่อ `view_confrim`) |
| 2026-05-16 | — | **PG view_confrim** — เพิ่ม migration `028_view_confrim.sql` สร้าง `app.view_confrim` และให้ calendar ใช้ view นี้เมื่อกรอง `wkctr` |
| 2026-05-16 | — | **IW37N import รายแถว** — เพิ่ม migration `030_tbiw37n_import_row.sql`; `POST /api/v1/iw37n/import` คืน `rows[]`; เพิ่ม `GET /api/v1/iw37n/batches/:id/rows`; หน้า [`Iw37nPage`](../PM-Pepsi-App/frontend/src/features/iw37n/Iw37nPage.tsx) แสดงผลรายแถวทันที + ดูย้อนหลังจาก batch |
| 2026-05-16 | — | **IW37N duplicate SHA256** — allow upload แต่ไม่ upsert ลง `tbiw37n`; UI ติดป้าย DUPLICATE และลิงก์ไป batch เดิม |
| 2026-05-16 | — | **IW37N export report** — ดาวน์โหลดรายงาน import เป็น CSV (`GET /api/v1/iw37n/batches/:id/export.csv`) และ XLSX (จากหน้า IW37N) |
| 2026-05-16 | — | **IW37N single-row edit** — เพิ่ม list + edit dialog (เทียบ `M_iw37n_form.php`) และ API `GET/PUT/DELETE /api/v1/iw37n/items*` |
| 2026-05-16 | — | **IW37N sample + columns** — เพิ่มไฟล์ตัวอย่าง [`IW37N.xlsx`](../IW37N.xlsx) และคู่มือคอลัมน์ใน [`07-iw37n.md`](parity-pending/07-iw37n.md) |
| 2026-05-18 | — | **`M_equipment.php` (+ `_form` / `_imports`)** — ปิด parity: migration `012_tbequipment.sql`, CRUD/import API `.../master-data/equipment`, แท็บ Equipment ต่อ DB ใน `/master-data` (modal create/edit/delete + import file, English-first validation+errors; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_functional.php` (+ `_form` / `_imports`)** — ปิด parity: ใช้ migration `005_tbwkzb_tbfunctional.sql`, CRUD/import API `.../master-data/functional`, แท็บ Functional loc. ต่อ DB ใน `/master-data` (modal create/edit/delete + import file, English-first validation+errors; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_reason.php` (+ `_form`)** — ปิด parity: ใช้ migration `009_tbreason.sql`, CRUD API `.../master-data/reason`, แท็บ Reason ต่อ DB ใน `/master-data` (modal create/edit/delete, English-first validation+errors); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_workstatus.php` (+ `_form`)** — ปิด parity: migration `013_tbwkstatus_add_wkstreason.sql` เพิ่ม `wkstreason`, CRUD API `.../master-data/workstatus`, แท็บ Work status ต่อ DB ใน `/master-data` (modal create/edit/delete, English-first validation+errors); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_worktype.php` (+ `_form`)** — ปิด parity: migration `014_tbwkctrtype.sql`, CRUD API `.../master-data/worktype`, แท็บ Work type ต่อ DB ใน `/master-data` (modal create/edit/delete, English-first validation+errors); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_lineproduct.php` (+ `_form` / `_imports`)** — ปิด parity: migration `015_tbproductline.sql`, CRUD/import API `.../master-data/lineproduct`, แท็บ Line product ต่อ DB ใน `/master-data` (modal create/edit/delete + import file; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_zone.php` (+ `_form`)** — ปิด parity: migration `016_tbzone.sql`, CRUD API `.../master-data/zone`, แท็บ Zone ต่อ DB ใน `/master-data`; อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_machine.php` (+ `_form` / `_imports`)** — ปิด parity: migration `017_tbmainteanance.sql` + dependency `tbzone`/`tbwkctrtype`, CRUD/import API `.../master-data/machine`, แท็บ Machine ต่อ DB ใน `/master-data` (modal create/edit/delete + import file; Excel skip 2 rows); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **`M_material.php` (+ `_form` / `_imports`)** — ปิด parity: migration `018_tbmaterial.sql`, CRUD/import API `.../master-data/material`, แท็บ Material ต่อ DB ใน `/master-data` (modal create/edit/delete + import file; Excel skip 2 rows; เก็บ date ใน PG); อัปเดต [`parity-pending/02-master-data.md`](parity-pending/02-master-data.md) |
| 2026-05-18 | — | **Line calendar docs** — อัปเดตแมปข้อ 2 ให้ตรงสถานะจริง (มี FullCalendar/modal/DnD แล้ว) และระบุ dependency `023_tblineschdul_unique.sql` สำหรับ upsert/import |
| 2026-05-18 | — | **PG view_lineschdul** — เพิ่ม migration `027_view_lineschdul.sql` สร้าง `app.view_lineschdul` เพื่อ parity กับ legacy `SELECT * FROM view_lineschdul` |
| 2026-05-18 | — | **Work calendar** — ปิด parity `calendar.php` (ฟิลเตอร์ `M_filter_iw37` บน React) ด้วย `GET /calendar/filter-options` + `POST /calendar/events`; อัปเดต [`parity-pending/04-work-calendar.md`](parity-pending/04-work-calendar.md) |
| 2026-05-18 | — | **calendar_wkctr route** — เพิ่ม route `/calendar/wc/:code` และรองรับ query `/calendar?wkctr=` เพื่อ prefill ตัวกรอง `wkctr` (ยังไม่ต่อ `view_confrim`) |
| 2026-05-18 | — | **PG view_confrim** — เพิ่ม migration `028_view_confrim.sql` สร้าง `app.view_confrim` และให้ calendar ใช้ view นี้เมื่อกรอง `wkctr` |
| 2026-05-18 | — | **IW37N import รายแถว** — เพิ่ม migration `030_tbiw37n_import_row.sql`; `POST /api/v1/iw37n/import` คืน `rows[]`; เพิ่ม `GET /api/v1/iw37n/batches/:id/rows`; หน้า [`Iw37nPage`](../PM-Pepsi-App/frontend/src/features/iw37n/Iw37nPage.tsx) แสดงผลรายแถวทันที + ดูย้อนหลังจาก batch |
| 2026-05-18 | — | **IW37N duplicate SHA256** — allow upload แต่ไม่ upsert ลง `tbiw37n`; UI ติดป้าย DUPLICATE และลิงก์ไป batch เดิม |
| 2026-05-18 | — | **IW37N export report** — ดาวน์โหลดรายงาน import เป็น CSV (`GET /api/v1/iw37n/batches/:id/export.csv`) และ XLSX (จากหน้า IW37N) |
| 2026-05-18 | — | **IW37N single-row edit** — เพิ่ม list + edit dialog (เทียบ `M_iw37n_form.php`) และ API `GET/PUT/DELETE /api/v1/iw37n/items*` |
| 2026-05-18 | — | **IW37N sample + columns** — เพิ่มไฟล์ตัวอย่าง [`IW37N.xlsx`](../IW37N.xlsx) และคู่มือคอลัมน์ใน [`07-iw37n.md`](parity-pending/07-iw37n.md) |
| 2026-05-19 | — | **Dashboard + Planning ลำดับที่ 8** — เพิ่มลิงก์จากการ์ดสรุปใน [`HomePage`](../PM-Pepsi-App/frontend/src/features/home/HomePage.tsx) ไป `/work-orders`, `/planning`, `/iw37n`; อัปเดต [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) |
| 2026-05-19 | — | **Dashboard sidebar** — เพิ่ม/แก้เมนู “Dashboard / หน้าแรก” (`/`) ให้เห็นทุกสิทธิ์ `A:U:W` ทั้ง fallback nav, seed `008`, และ migration `031_dashboard_menu_all_roles.sql`; อัปเดต [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) |
| 2026-05-19 | — | **Dashboard KPI phase 2** — ตรวจ `index2.php`/`content.php` แล้วเป็น SB Admin demo ไม่มี business KPI; candidate ที่พบคือ Technician Utilizations / Summary Weekly จาก `W_summary_weekly*` ให้ติดตามใน `/reports` phase 2; อัปเดต [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) |
| 2026-05-19 | — | **`M_planwork_view_form.php` แกน assign** — register route handler `POST /api/v1/planning/assign` ที่หายไปใน [`routes/planning.ts`](../PM-Pepsi-App/backend/src/routes/planning.ts) (auth + Admin-only 403 + zod 400 + 404 ถ้า WO ไม่อยู่ใน CRTD/REL + 503 ถ้ายังไม่รัน `007_tbplangingwork_view_planwork.sql`) คู่กับ service [`assignPlanningWork`](../PM-Pepsi-App/backend/src/services/planning.ts) ที่ upsert `tbplangingwork` ตาม `idiw37`; ยกระดับ UI ใน [`PlanningPage`](../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) จากปุ่ม “จ่ายให้ฉัน” เป็น Assign dialog (เลือก WC ปลายทาง จาก `/api/v1/workcenters` / Team `P`/`G` / `pwcomment` + shortcut “จ่ายให้ฉัน”); อัปเดต [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) ติ๊กแกน assign และระบุงานค้าง (close + 4 tabs `plan_confirmTab*`) |
| 2026-05-19 | — | **Planwork open/close + `plan_confirmTab*`** — เพิ่ม `GET /api/v1/planning/orders?status=open|closed` สำหรับ `M_planwork_close.php`, `W_planwork_view.php`, `W_planwork_view_close.php`; หน้า [`PlanningPage`](../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) สลับ “งานเปิด/งานปิดแล้ว”, แสดง `Plan Close`, และเปิด [`WorkOrderDetailDialog`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) ด้วย `initialTab="confirm"` สำหรับบันทึก/ดูปิดงาน; อัปเดต §5 `plan_confirmTab1-3`, `plan_ShowClose_close`, `plan_ShowImgUpload_close`, `plan_submit_upload_file`, `ShowPlan_Close` เป็นรวมใน `WorkOrderDetailDialog`; อัปเดต [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) |
| 2026-05-19 | — | **Planning WO detail link** — เลข WO ใน [`PlanningPage`](../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) ลิงก์ไป `/work-orders/:id` แทน `/work-orders`; route มีใน [`App.tsx`](../PM-Pepsi-App/frontend/src/App.tsx) และ [`WorkOrdersPage`](../PM-Pepsi-App/frontend/src/features/work-orders/WorkOrdersPage.tsx) เปิด dialog รายละเอียดจาก route param; อัปเดต [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) |
| 2026-05-19 | — | **Planning data visibility** — ระบุเงื่อนไขข้อมูลของ `/planning` ว่าต้องมี `view_planwork.idwkctr = authUser.idwkctr` (มาจาก `tbiw37n.wkctr` หรือ `tbplangingwork.wkctr` ที่ map กับ `tbworkcenter`); เพิ่มข้อความ debug `idwkctr/wkctr` ใน [`PlanningPage`](../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) และเพิ่ม query ตรวจ Planning visibility / unmapped `wkctr` ใน [`verify_app_schema.sql`](../database/scripts/verify_app_schema.sql); อัปเดต [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) |
| 2026-05-19 | — | **ปิดลำดับ 8 ระดับแกน** — ปรับ `สถานะรวม` ใน [`08-dashboard-planning.md`](parity-pending/08-dashboard-planning.md) เป็น “เสร็จ (แกน) — 2026-05-19”, อัปเดต [`COMPLETION-MATRIX.md`](parity-pending/COMPLETION-MATRIX.md) แถวลำดับ 8 (แกน/parity บางส่วน), เพิ่มรายการ stack เต็มที่ยังขาดใน [`00-stack-target.md`](parity-pending/00-stack-target.md) (FullCalendar DnD Planning, charts KPI Dashboard, IndexedDB, Docker compose, audit/RBAC test) |
| 2026-05-19 | — | **Import Confirm (`M_Confirm.php` + `_form` + `_imports`)** — เพิ่ม migration [`032_tbcofirm_import_uniq.sql`](../database/migrations/032_tbcofirm_import_uniq.sql) เปลี่ยน unique index ของ `app.tbcofirm` เป็น `(idiw37, wkctr, confirmation, timeclose)` ให้ตรง dedup `M_Confirm.php` บรรทัด 130 (เก่า `(idiw37, wkctr)` ตายตัวเกินไป); เพิ่ม service [`confirmation-import.ts`](../PM-Pepsi-App/backend/src/services/confirmation-import.ts) parser .xls/.xlsx/.csv ที่ skip 2 แถวแรก (เทียบ `if ($n > 2)`) + validate Row `0/3/6/7/8/10/11/14/15/16/17` + แปลงวันที่ `dd.mm.yyyy` + เวลา `HH:MM[:SS]` + หน่วย `H→Min` (×60); เพิ่ม [`importConfirmFile`](../PM-Pepsi-App/backend/src/services/confirmation.ts) ที่ lookup `idiw37` จาก `wkorder` ใน `tbiw37n` + upsert ใน transaction + คืน per-row result (`inserted/updated/skipped/error`); ปรับ [`addConfirmationClose`](../PM-Pepsi-App/backend/src/services/confirmation.ts) ให้ ON CONFLICT ตรง unique key ใหม่; เพิ่ม route `POST /api/v1/confirmation/import` (Admin only `userst === 'A'`, multer memory 15 MB, รับ `.xls/.xlsx/.csv`) ใน [`routes/work-orders.ts`](../PM-Pepsi-App/backend/src/routes/work-orders.ts); เพิ่ม schema [`confirmationImportResponseSchema`](../PM-Pepsi-App/backend/src/schemas/work-orders.ts) และฝั่ง frontend [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) + [`postConfirmationImport`](../PM-Pepsi-App/frontend/src/lib/api-public.ts); ปรับ [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) เพิ่มกล่อง “Import Confirm (M_Confirm.php)” (Admin only) + ปุ่ม Upload Excel + ตารางผลรายแถว (Row/Status/Confirm/Order/WkCtr/Start/Finish/Message) + Badge สรุป `inserted/updated/skipped/errors`; อัปเดต [`09-confirmation.md`](parity-pending/09-confirmation.md) ติ๊ก Import + ระบุงานที่เหลือ (`confirmTab1/3/4`, Export) |
| 2026-05-19 | — | **Confirmation tabs (`confirmTab1/3/4`)** — เติม [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) ให้แท็บ Work Order + Tasklist แสดง WO detail + PM Task List จาก `GET /api/v1/work-orders/:id` และ `GET /api/v1/work-orders/:id/modal-detail`; แท็บ Images upload/list/preview/delete JPEG ผ่าน `GET/POST/DELETE /api/v1/confirmation/:idiw37/images*` และ `GET /api/v1/confirmation/images/:idcimg/data`; แท็บ Planning แสดงผู้รับผิดชอบจาก `modal-detail.planning.assigned` และให้ Admin จ่าย/ยกเลิกงานผ่าน `PUT/DELETE /api/v1/work-orders/:id/planning`; อัปเดต [`09-confirmation.md`](parity-pending/09-confirmation.md) ติ๊ก `confirmTab1.php`, `confirmTab3.php`, `confirmTab4.php` และเหลือ Export + เกณฑ์ §3 |
| 2026-05-19 | — | **Confirmation Export + §3** — เพิ่ม [`033_view_exportconfirm.sql`](../database/migrations/033_view_exportconfirm.sql) สร้าง `app.view_exportconfirm`; เพิ่ม `GET /api/v1/confirmation/export.xlsx` ใน [`routes/work-orders.ts`](../PM-Pepsi-App/backend/src/routes/work-orders.ts) สร้าง `Export_Confirm.xlsx` ด้วย columns เดิมและ business rule `syst in CRTD/REL`, `PAC007/PRO005` export ทุกใบ, user อื่นกรอง `cwkctr`; เพิ่ม [`fetchConfirmationExportXlsx`](../PM-Pepsi-App/frontend/src/lib/api-public.ts) + ปุ่ม `Export Confirm Excel` ใน [`ConfirmationParityPage`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx); เปลี่ยนช่องค้น WO เป็น [`WorkOrderAutocomplete`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderAutocomplete.tsx) แทน `modalPages/autocomplete.php`; ปิด [`09-confirmation.md`](parity-pending/09-confirmation.md) เป็น **เสร็จ (แกน)** และติ๊ก §3 ขอบเขตแกน |
| 2026-05-19 | — | **Confirmation Export preview page** — เพิ่ม route `/confirmation/export` + component `ConfirmationExportParityPage` ใน [`SidebarParityPages.tsx`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) เพื่อเก็บ UX แบบ `M_Export_confirm.php` (preview ตาราง 14 คอลัมน์ก่อนดาวน์โหลด); เพิ่ม API `GET /api/v1/confirmation/export` (JSON) ใน [`routes/work-orders.ts`](../PM-Pepsi-App/backend/src/routes/work-orders.ts) คู่กับ `.xlsx` (ใช้ service `listConfirmationExportRows` ตัวเดียวกัน), schema [`confirmationExportResponseSchema`](../PM-Pepsi-App/backend/src/schemas/work-orders.ts) คืน `scope`/`actorWkctr`/`totalRows`/`items[]`; เพิ่ม [`fetchConfirmationExport`](../PM-Pepsi-App/frontend/src/lib/api-public.ts) + zod schema ฝั่ง [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts); ปุ่ม `Preview Export` เข้าหน้าใหม่ + ปุ่ม `Download Excel` ใน preview; เพิ่ม Badge variant `destructive` ใน [`badge.tsx`](../PM-Pepsi-App/frontend/src/components/ui/badge.tsx) เพื่อ unblock tsc; อัปเดต [`09-confirmation.md`](parity-pending/09-confirmation.md) ติ๊ก preview page เป็น `[x]` |
| 2026-05-19 | — | **Personal Dashboard ลำดับที่ 10** — เพิ่ม [`schemas/personnel.ts`](../PM-Pepsi-App/backend/src/schemas/personnel.ts) (`personnelDashboardResponseSchema`), [`services/personnel.ts`](../PM-Pepsi-App/backend/src/services/personnel.ts) (`getPersonnelDashboard` รวมข้อมูลจาก `tbworkcenter` + lookup + `view_planwork` + `tbcofirm` + `getWorktimeTotal` เทียบ `worktime_count.php`), route `GET /api/v1/personnel/me/dashboard` ใน [`routes/personnel.ts`](../PM-Pepsi-App/backend/src/routes/personnel.ts) (auth + 503 SCHEMA_NOT_READY ถ้ายังไม่รัน 007/026); เพิ่ม zod schema + `fetchPersonnelDashboard` ฝั่ง frontend และเขียน [`PersonnelPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx) ใหม่เป็น Personal Dashboard (profile card + 4 stat card งานเปิด/งานปิด/Confirmation/ชั่วโมงรวม + ตารางงานเปิดล่าสุด + ตาราง Confirmation ล่าสุด — เทียบ navbar/profile + M_personel_form_tab + M_personel_confirm + worktime_count); ปลด menuright `/personnel` เป็น `A:U:W` ใน [`nav-config.ts`](../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) และเพิ่ม migration [`034_personnel_menu_personal_dashboard.sql`](../database/migrations/034_personnel_menu_personal_dashboard.sql); อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) ติ๊ก Personal Dashboard เสร็จและสถานะรวมเป็น “กำลังทำ — Personal Dashboard เสร็จ 2026-05-19” |
| 2026-05-19 | — | **Personnel Admin CRUD + WebP image storage** — เพิ่ม migration [`035_tbworkcenter_full_personnel_columns.sql`](../database/migrations/035_tbworkcenter_full_personnel_columns.sql) ขยาย `app.tbworkcenter` ให้ครบฟิลด์ `M_personel.php` (`cat`, `resp`, `idwklevel`, `wkctrtel`, `wkctrmail`, `labourcost`, `updated_at`) และเปลี่ยน policy ภาพประจำตัว: เก็บ **WebP ใน BYTEA** (`imgmember_data` + `imgmember_mime` + `imgmember_bytes`) แทน filesystem เพื่อประหยัด storage และง่ายต่อ backup; ติดตั้ง `sharp` และเพิ่ม service [`personnel-image.ts`](../PM-Pepsi-App/backend/src/services/personnel-image.ts) (`convertImageToWebp` — `rotate()` ตาม EXIF, resize กว้างสูงสุด 600px `withoutEnlargement`, encode WebP quality 80) — รับภาพ JPEG/PNG/WebP/GIF/AVIF/HEIF ทั้งหมดและแปลงเป็น WebP เสมอ; เพิ่ม parser [`personnel-import.ts`](../PM-Pepsi-App/backend/src/services/personnel-import.ts) ทำตาม `M_personel.php` (skip 2 rows, แปลง พ.ศ. → ค.ศ., lookup `position/wkctrgroup/wkctrtype/wklevel` ตามชื่อ → id เทียบ `ShowDetail()`); main service [`personnel-admin.ts`](../PM-Pepsi-App/backend/src/services/personnel-admin.ts) (`listPersonnelAdmin`, `getPersonnelAdminOne`, `upsertPersonnelAdmin` ที่ bcrypt-hash password อัตโนมัติถ้าไม่ใช่ hash อยู่แล้ว, `deletePersonnelAdmin`, `importPersonnelFile` transactional + per-row, `setPersonnelImage`/`getPersonnelImage`/`clearPersonnelImage`); schema [`personnel-admin.ts`](../PM-Pepsi-App/backend/src/schemas/personnel-admin.ts); routes ใน [`routes/personnel.ts`](../PM-Pepsi-App/backend/src/routes/personnel.ts) `GET/POST/PUT/DELETE /api/v1/personnel/admin/*` + `POST .../import` (multer 15MB) + `POST/DELETE .../:id/image` (multer 8MB, แปลง WebP) + `GET /api/v1/personnel/:id/image` (serve binary ให้ `<img>` ทุก authed user); ฝั่ง frontend เพิ่ม zod schema + api client (`fetchPersonnelAdminList`, `upsertPersonnelAdmin`, `deletePersonnelAdmin`, `postPersonnelAdminImport`, `postPersonnelAdminImage`, `deletePersonnelAdminImage`, `personnelImageUrl`) และเขียนหน้า [`PersonnelAdminPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) ใหม่ — toolbar (search + Import + Add), ตารางรวมรูป-รหัส-ชื่อ-WC-ตำแหน่ง-หน่วยงาน-สถานะ-action, modal 4 แท็บ (ข้อมูลส่วนตัว/ข้อมูลงาน/ผู้ใช้+รหัสผ่าน/รูป WebP), Import result panel ทีละแถว; ปุ่ม "จัดการบุคลากร (Admin)" บน `/personnel` เห็นเฉพาะ `userst === 'A'`; แสดงรูปใน Profile card ของ Personal Dashboard ผ่าน `<img src=/api/v1/personnel/:id/image>` ด้วย; อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) ติ๊ก Admin CRUD + `_form` + `_imports` เสร็จ |
| 2026-05-19 | — | **Personnel Confirmation (`M_personel_confirm.php` + `_form`)** — เพิ่ม migration [`036_view_countpersonelclose.sql`](../database/migrations/036_view_countpersonelclose.sql) สร้าง view `app.view_countpersonelclose` รวม `tbiw37n` + `tbwkstatus` + `tbmoveplan` + agg `tbplangingwork` (planned_count) + agg `tbcofirm` (countwkctr / has_confirm) + คำนวณ `percent_close` (ปัดเป็นเลขเต็ม 0–100); เพิ่ม [`037_personnel_confirm_menu.sql`](../database/migrations/037_personnel_confirm_menu.sql) แทรกเมนู `app.tbmenu` Admin only; schema/service ฝั่ง backend ([`personnel-confirm.ts`](../PM-Pepsi-App/backend/src/services/personnel-confirm.ts) — search `q` + filter `status` `all/not_started/in_progress/done` + `syst` รายการ + summary count); route `GET /api/v1/personnel/admin/confirm` ใน [`routes/personnel.ts`](../PM-Pepsi-App/backend/src/routes/personnel.ts) วางก่อน `:idwkctr` กัน Express match พลาด; ฝั่ง frontend เพิ่ม zod schema (`personnelConfirmListResponseSchema`) + `fetchPersonnelConfirm` ใน [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) / [`api-public.ts`](../PM-Pepsi-App/frontend/src/lib/api-public.ts); สร้างหน้า [`PersonnelConfirmPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelConfirmPage.tsx) (route `/personnel/confirm`, Admin only) — summary 4 การ์ด + ค้นหา + filter status 4 ปุ่ม + ตาราง 8 คอลัมน์พร้อม Progress bar ระบายสีตามช่วง (`amber<60`, `blue<100`, `emerald=100`) + แสดง `closedCount/plannedCount คน`; ปุ่ม Confirm เปิด `WorkOrderDetailDialog` ด้วย `initialTab="confirm"` แทน `M_personel_confirm_form.php` (modal 4 แท็บ); เพิ่มเมนู Sidebar `Personnel Confirmation` (`menuright='A'`) ใน [`nav-config.ts`](../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) + ปุ่มลัดบน `/personnel` และ `/personnel/admin`; อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) ติ๊ก `M_personel_confirm*` เสร็จ |
| 2026-05-19 | — | **ออกแบบ scope ลำดับ 14 — Administrator** — สร้าง [`parity-pending/14-administrator.md`](parity-pending/14-administrator.md) ครอบคลุม 12 หน้าย่อย (`/admin`, `/admin/users`, `/admin/roles`, `/admin/menu`, `/admin/branding`, `/admin/settings`, `/admin/master`, `/admin/audit`, `/admin/backup`, `/admin/health`, `/admin/announcements`, `/admin/security`, `/admin/about`) + 8 ตาราง PostgreSQL ใหม่ใน schema `app` (`tbl_role`, `tbl_permission`, `tbl_role_permission`, `tbl_setting`, `tbl_audit_log`, `tbl_backup_history`, `tbl_announcement`, `tbl_user_pref`) + ~40 endpoint backend + middleware `requirePermission(code)` แทน `requireAdmin` + helper `auditLog()`. UI design ตาม [`skills.md`](../skills.md) §Theme (Liquid Glass + Pepsi red/white/blue, system color palette light/dark) + §Logo customize (บรรทัด 52: upload PNG/SVG/JPEG/WebP → WebP via sharp → BYTEA ใน `tbl_setting.app.logo_bytes` + endpoint public + reset default), Shadcn + DnD-kit (menu/role reorder) + React Joyride admin tour 12 จุด + Sonner toasts + cmdk ⌘K palette + Chart.js (security/health) + IndexedDB cache (audit/backup readonly). Backup integration sก ับ skills.md §1.3 (D: bind mount `{PROJECT_ROOT}/backup`) + §4 (`docker save`, auto cron + retention 30d + sha256 + restore confirm + maintenance mode auto-toggle) + §3 (RBAC ทุก route + Audit trail ทุก write + Helmet/rate limit + secret mask + Impersonate banner + force-change-password). แบ่ง implement เป็น 6 phase (A: RBAC engine → B: Settings & Branding → C: Audit & Health → D: Users & Menu → E: Backup & Operations → F: UX polish). อัปเดต [`parity-pending/README.md`](parity-pending/README.md) + [`parity-pending/COMPLETION-MATRIX.md`](parity-pending/COMPLETION-MATRIX.md) เพิ่มแถวลำดับ 14 พร้อมหมายเหตุ "เป้าหมาย stack เต็มรูปแบบ — admin จะเป็นโมดูลแรกที่ผ่านเกณฑ์ skills.md §2–§4" |
| 2026-05-19 | — | **Sidebar menu sync — `/personnel/admin`** — เพิ่ม entry ใน [`nav-config.ts`](../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) (icon `UserCog` จาก lucide, menuright `A`, label "จัดการบุคลากร (Admin)") + migration [`040_personnel_admin_menu.sql`](../database/migrations/040_personnel_admin_menu.sql) แทรก `app.tbmenu` (idmenusub=0, menuon=232 — วางระหว่าง `/personnel`=230 และ `/personnel/confirm`=231, menuicon='fa-user-cog', menulink='index2.php?module=M_personel&op=admin', react_route='/personnel/admin'); UPDATE กัน drift ตอนรันซ้ำ. เดิม route + component พร้อมตั้งแต่ migration 035 แต่ยังไม่ปรากฏใน sidebar — ทำให้ admin ต้องคลิกผ่านปุ่มใน Personal Dashboard เท่านั้น |
| 2026-05-19 | — | **Personnel Admin — Workstatus lookup + filter** — เพิ่ม migration [`039_tbwkctrstatus.sql`](../database/migrations/039_tbwkctrstatus.sql) สร้าง lookup `app.tbwkctrstatus(workstatus, wkstatusdes, wkstcolor, is_active, sort_order)` เทียบ legacy MySQL `tbwkctrstatus` (JOIN ใน `user.php` / `M_personel.php` filed24); seed 6 ค่ามาตรฐาน — `ACTIVE`/`INACTIVE`/`LEAVE` (`is_active=true`) + `RESIGNED`/`RETIRED`/`TERMINATED` (`is_active=false`) พร้อมสีแยก; index `idx_tbworkcenter_workstatus` เพื่อ filter เร็ว. Backend [`services/personnel-admin.ts`](../PM-Pepsi-App/backend/src/services/personnel-admin.ts) ขยาย `listPersonnelAdmin({status})` รองรับ 4 mode (`all`/`active`/`inactive`/`<code>`); `active` รวม row ที่ `workstatus IS NULL OR ''` กัน data เก่าก่อน 039 หาย; เพิ่ม `listPersonnelWorkstatuses(pool)`. Schema [`personnel-admin.ts`](../PM-Pepsi-App/backend/src/schemas/personnel-admin.ts) + [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) เพิ่ม `personnelWorkstatusOption(s)Schema`. Route [`routes/personnel.ts`](../PM-Pepsi-App/backend/src/routes/personnel.ts) ขยาย `GET /api/v1/personnel/admin?status=...` + เพิ่ม `GET /api/v1/personnel/admin/workstatus-options` (วางก่อน `:idwkctr` กัน Express match พลาด) + 503 SCHEMA_NOT_READY เมื่อยังไม่ migrate 039. API client [`api-public.ts`](../PM-Pepsi-App/frontend/src/lib/api-public.ts) ขยาย `fetchPersonnelAdminList({status})` + เพิ่ม `fetchPersonnelWorkstatusOptions()` (`staleTime: 10 นาที`). UI [`PersonnelAdminPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) — toolbar เติม **3 chips** (`ใช้งาน`/`ไม่ใช้งาน`/`ทั้งหมด`, default `active`) + `<select>` เจาะจง code, ฟอร์ม `workstatus` เปลี่ยน `<Input>` → `LookupSelect` (เทียบ pattern 5 ฟิลด์ master), เพิ่มคอลัมน์ "สถานะใช้งาน" + component `WorkstatusBadge` (10% bg + ring 1px + dot indicator + tooltip), เปลี่ยนคอลัมน์ "สถานะ" เดิมเป็น "บทบาท" (userst) เพื่อให้ตรงความหมาย. อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) ติ๊ก checklist พร้อมหมายเหตุ edge case |
| 2026-05-19 | — | **Personnel Admin form — Master-data dropdown (5 ฟิลด์)** — เพิ่ม helper [`fetchPersonnelLookups`](../PM-Pepsi-App/frontend/src/lib/api-public.ts) ดึง `department`/`position`/`group`/`worktype`/`level` คู่ขนานด้วย `Promise.all` จาก endpoint `GET /api/v1/master-data/:entity` ที่มีอยู่เดิม ([`routes/master-data.ts`](../PM-Pepsi-App/backend/src/routes/master-data.ts)) — ไม่มี route ใหม่; map เป็น `{value, label: 'id — name'}`. เพิ่ม component `LookupSelect` (native `<select>` + fallback option เมื่อ value ปัจจุบันไม่อยู่ใน master, สถานะ loading, styling เทียบ `<Input>`) ใน [`PersonnelAdminPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) แทน 5 `<Input>` ใต้แท็บ "ข้อมูลงาน" ของ modal เพิ่ม/แก้ (`iddepartment`/`idposition`/`idwkctrgroup`/`idwkctrtype`/`idwklevel`); cache 5 นาทีต่อ session ด้วย `useQuery(['personnel','admin','lookups'])`. อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) ติ๊ก checklist + อัปเดตสถานะรวมเป็น "เสร็จ (... + Lookup dropdown)" |
| 2026-05-19 | — | **Planning multi-assign UI — "เพิ่ม assignee" หลายคนในคลิกเดียว** — backend service [`assignWorkOrderPlanningBatch`](../PM-Pepsi-App/backend/src/services/work-orders.ts) (dedupe ฝั่ง server + ตรวจ `tbworkcenter` กัน wkctr ไม่มีจริง + `INSERT … SELECT FROM UNNEST(...) ON CONFLICT (idiw37, wkctr) DO NOTHING` 1-query หลายแถว → คืน `assigned/skipped/notFound`) + schema [`work-orders.ts`](../PM-Pepsi-App/backend/src/schemas/work-orders.ts) `workOrderPlanningBatch{Body,Response}Schema` + route `POST /api/v1/work-orders/:id/planning/batch` (Admin only, วางก่อน `DELETE :wkctr`). Frontend มิเรอร์ schema ใน [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) + เพิ่ม `postWorkOrderPlanningBatch(id, body)` ใน [`api-public.ts`](../PM-Pepsi-App/frontend/src/lib/api-public.ts). สร้าง component ใช้ร่วม [`PlanningMultiAssign.tsx`](../PM-Pepsi-App/frontend/src/components/scheduling/PlanningMultiAssign.tsx) — search (filter wkctr+displayName, case-insensitive) + checkbox list (รายชื่อที่จ่ายแล้ว disabled + แสดง badge "จ่ายแล้ว") + chips ของรายชื่อที่เลือกพร้อม × ดึงออก + ปุ่ม "เลือกทั้งหมดในมุมมอง"/"ล้างการเลือก" + counter "X เลือก" + footer สถิติ (total/จ่ายแล้ว/ว่าง) + submit "เพิ่ม Assignee (N)" + result summary (`assigned`/`skipped`/`notFound`) + รองรับ controlled comment ผ่าน prop (กัน input ซ้ำ). สอดเข้า [`WorkOrderDetailDialog`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) tab "planning" เป็น primary path; ปุ่มรายบุคคลเดิม (1-click) ย้ายลง `<details>` collapse "Quick assign — คลิก 1 ครั้ง/คน" เพื่อ back-compat. สอดเข้า [`SidebarParityPages.tsx`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) `ConfirmationParityPage` tab "planning" แบบ controlled — mutation `batchAssign` ยิง toast 3 ระดับ (`success` "Assigned N คน" / `info` "ทั้งหมดจ่ายไปแล้ว" / `warning` "ไม่พบ wkctr: …"). Group-assign (`mode='G'`) ยังคงไว้แยกในตารางกลุ่ม (legacy logic). อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) ติ๊ก multi-assign UI |
| 2026-05-19 | — | **Personnel explicit role enum — `tbworkcenter.userrole`** — เพิ่ม migration [`041_tbworkcenter_userrole.sql`](../database/migrations/041_tbworkcenter_userrole.sql) สร้าง column `userrole` (`admin/manager/planner/technician`, default `planner`, `NOT NULL`, index `idx_tbworkcenter_userrole`) และขยาย legacy `userst` check เป็น `A/H/U/W`; backfill role จาก `userst` ก่อน (`A→admin`, `H→manager`, `W→technician`) แล้ว fallback จาก `tbposition.position` ด้วย keyword manager/chief/supervisor/หัวหน้า/ผู้จัดการ/ช่าง. Backend [`lib/user-role.ts`](../PM-Pepsi-App/backend/src/lib/user-role.ts) เพิ่ม `normalizeUserRole()` + `resolveUserRole(userrole, userst, position)` ให้ `userrole` เป็น source of truth ก่อน heuristic; [`services/personnel.ts`](../PM-Pepsi-App/backend/src/services/personnel.ts) SELECT `wc.userrole`, derive `role/roleLabel/roleData` จาก explicit role และส่ง `profile.userRole`. Admin CRUD schema/service/import เพิ่ม `userrole` — [`personnel-admin.ts`](../PM-Pepsi-App/backend/src/schemas/personnel-admin.ts) รองรับ `userst=A/H/U/W` + `userrole` enum, [`services/personnel-admin.ts`](../PM-Pepsi-App/backend/src/services/personnel-admin.ts) บันทึก insert/update และ import `Personel.xlsx` รองรับ optional Row[23] `userrole` (ถ้าไม่มี resolve จาก `userst + positionName`). Frontend [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) เพิ่ม `userrole/profile.userRole`; [`PersonnelAdminPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) เพิ่ม dropdown "บทบาท Dashboard/RBAC (userrole)" แยกจาก "สิทธิ์ระบบ (userst)", ตารางแสดง badge role + legacy UserST; [`PersonnelPage`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx) แสดง role ใหม่ใน Profile card. อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) ติ๊กรายการ role enum |
| 2026-05-19 | — | **Multi-assign `tbplangingwork` + Role-based Personal Dashboard** — เพิ่ม migration [`038_tbplangingwork_multi_assign.sql`](../database/migrations/038_tbplangingwork_multi_assign.sql) เปลี่ยน unique จาก `(idiw37)` → `(idiw37, wkctr)` (เพิ่ม idx wkctr ด้วย) ทำให้ 1 WO มอบหมายช่างหลายคนได้จริงเหมือน legacy `AddPlan.php`; ปรับ [`services/planning.ts`](../PM-Pepsi-App/backend/src/services/planning.ts) → `assignPlanningWork` รองรับ mode `G` expand เป็นช่างทั้งกลุ่มจาก `tbworkcenter.idwkctrgroup` + `ON CONFLICT (idiw37, wkctr) DO NOTHING`; เพิ่ม `removePlanningAssignment(idiw37, wkctr)` และ `removePlanningAssignmentByIdplanw`. ปรับ [`services/work-orders.ts`](../PM-Pepsi-App/backend/src/services/work-orders.ts) → `getWorkOrderModalDetail` คืน `assignees[]` (ใหม่ พร้อม `idplanw`) + คง `assigned` เป็น first ของ array สำหรับ back-compat; `upsertWorkOrderPlanning`/`deleteWorkOrderPlanning(id, wkctr?)` รองรับ multi-assign; เพิ่ม route `DELETE /api/v1/work-orders/:id/planning/:wkctr` (Admin only) เทียบ `AddPlan.php` `st=Del`. Schema [`work-orders.ts`](../PM-Pepsi-App/backend/src/schemas/work-orders.ts) + [`api/schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) เพิ่ม `idplanw` + ฟิลด์ `assignees: array`. UI [`WorkOrderDetailDialog`](../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) + [`SidebarParityPages.tsx`](../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) เปลี่ยนจาก single → list of assignees พร้อมปุ่ม **ลบ** รายตัว (Admin only) + ปุ่ม **ยกเลิกทั้งหมด** + badge `GROUP`. API client เพิ่ม `deleteWorkOrderPlanningAssignee` ใน [`api-public.ts`](../PM-Pepsi-App/frontend/src/lib/api-public.ts). เพิ่ม helper [`lib/user-role.ts`](../PM-Pepsi-App/backend/src/lib/user-role.ts) `deriveUserRole(userst, position)` → 4 role (`admin`/`manager`/`planner`/`technician`) — map legacy `A`/`H`/`U`/`W` + heuristic จากชื่อ position (Manager/หัวหน้า, Planner/Engineer/วิศวกร, ช่าง) สำหรับ `U`; ขยาย `personnelDashboardResponseSchema` ([`personnel.ts`](../PM-Pepsi-App/backend/src/schemas/personnel.ts)) ด้วย `role`/`roleLabel`/`roleData` (`team` สำหรับ manager — สมาชิกใน `idwkctrgroup` เดียวกัน, `unassigned` + `global` สำหรับ admin/planner); ปรับ [`services/personnel.ts`](../PM-Pepsi-App/backend/src/services/personnel.ts) `loadRoleData` query ตาม role; ปรับ [`PersonnelPage.tsx`](../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx) แสดง `RoleBadge` สีต่างกัน + section แบบมีเงื่อนไข (Global cards + Unassigned WO 10 ใบ สำหรับ admin/planner; ตารางสมาชิกในทีม สำหรับ manager; stat cards เดิม สำหรับ technician); ปุ่ม "หน้าจ่ายงาน Planning" เด่นเฉพาะ planner. อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) สถานะเป็น "เสร็จ (แกน + Multi-assign + Role-based)" |


| 2026-05-19 | — | **Personnel §3 complete — UI/Data/Business rules/Modal-Tabs/Tests** — เพิ่ม Vitest harness ทั้ง backend/frontend (`npm test`) และ dependencies ที่จำเป็น (`vitest`; frontend เพิ่ม `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`). Backend tests: [`user-role.test.ts`](../PM-Pepsi-App/backend/src/lib/user-role.test.ts) ตรวจ explicit `userrole` priority + legacy/position fallback, [`personnel-admin.test.ts`](../PM-Pepsi-App/backend/src/schemas/personnel-admin.test.ts) ตรวจ Admin CRUD schema (`userst=A/H/U/W`, `userrole` enum/default/reject invalid/list item contract), [`work-orders.batch.test.ts`](../PM-Pepsi-App/backend/src/services/work-orders.batch.test.ts) ตรวจ batch multi-assign business rules (dedupe, skip assigned, `notFound`, `ON CONFLICT`, WO missing → null). Frontend tests: [`PlanningMultiAssign.test.tsx`](../PM-Pepsi-App/frontend/src/components/scheduling/PlanningMultiAssign.test.tsx) ตรวจ UI interaction (search, disabled assigned, select-all-in-view, submit selected codes, result summary, uncontrolled comment), [`personnel-schemas.test.ts`](../PM-Pepsi-App/frontend/src/features/personnel/personnel-schemas.test.ts) ตรวจ contract `userrole`/`profile.userRole`. ผลรัน: backend 3 files / 10 tests ผ่าน, frontend 2 files / 4 tests ผ่าน. อัปเดต [`10-personnel.md`](parity-pending/10-personnel.md) + [`COMPLETION-MATRIX.md`](parity-pending/COMPLETION-MATRIX.md) เป็นมี tests แล้ว |

| 2026-05-19 | — | **Manhours/Worktime — Migration + API manhour จริง** — เพิ่ม migration [`042_tbmanhours_full_api.sql`](../database/migrations/042_tbmanhours_full_api.sql) ขยาย `app.tbmanhours` ให้ครบ legacy `M_manhour*` (`stworkday`, `updated_at`, unique `(idwkctr, stworkday, workday)`, indexes ช่วงวันที่) และ backfill `stworkday = workday` สำหรับข้อมูลจาก migration 010. Backend schema [`manhours.ts`](../PM-Pepsi-App/backend/src/schemas/manhours.ts) เพิ่ม `manhourItem/list/upsert/import/worktimeMe`; service [`manhours.ts`](../PM-Pepsi-App/backend/src/services/manhours.ts) เพิ่ม list/get/upsert/delete/import Excel (`ManHours.xlsx`, skip 2 rows, columns `idwkctr, StartDate, EndDate, WH, OT1, OT15, OT1HOL, OT2, OT3`, `ON CONFLICT DO UPDATE`) + `listWorktimeDaily`; route [`routes/manhours.ts`](../PM-Pepsi-App/backend/src/routes/manhours.ts) เพิ่ม `GET /api/v1/manhours`, `GET /api/v1/manhours/:idmanhour`, `POST/PUT/DELETE /api/v1/manhours`, `POST /api/v1/manhours/import`, `GET /api/v1/worktime/me`, และขยาย `/api/v1/manhours/summary?idwkctr=&daysBack=`. Frontend contract [`schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts) + API client [`api-public.ts`](../PM-Pepsi-App/frontend/src/lib/api-public.ts) เพิ่ม functions สำหรับ CRUD/import/worktime. เพิ่ม backend test [`manhours.test.ts`](../PM-Pepsi-App/backend/src/schemas/manhours.test.ts). อัปเดต [`11-manhours-worktime.md`](parity-pending/11-manhours-worktime.md) + [`COMPLETION-MATRIX.md`](parity-pending/COMPLETION-MATRIX.md) |
| 2026-05-19 | — | **Manhours/Worktime §3 ครบ (แกน)** — UI `/manhours`, `/worktime`, `/manhours-hr`, `ManhourSummaryDialog` (backlog/calendar); helper [`manhour-minutes.ts`](../PM-Pepsi-App/backend/src/lib/manhour-minutes.ts) (H→MIN, Summary/W, OT net, single-day SQL); Vitest backend 6 files/21 tests + frontend 5 files/13 tests (`manhours-schemas.test.ts`, `ManhourSummaryDialog.test.tsx`, `backlog-manhour.test.ts`, …). สถานะโมดูล 11 → **เสร็จ (แกน)** |
| 2026-05-19 | — | **Manhours Admin UI (`M_manhour*`)** — [`ManhourAdminPage.tsx`](../PM-Pepsi-App/frontend/src/features/manhours/ManhourAdminPage.tsx) ที่ `/manhours/admin` (ตาราง/ค้นหา/modal CRUD/นำเข้า Excel); nav-config + migration [`043_manhour_admin_menu.sql`](../database/migrations/043_manhour_admin_menu.sql); โมดูล 11 → **เสร็จ** |
| 2026-05-19 | — | **Manhours chart (`M_manhour_chart*`)** — service [`manhour-chart.ts`](../PM-Pepsi-App/backend/src/services/manhour-chart.ts) + routes `GET /api/v1/manhours/chart/performance|breakdown`; [`ManhoursPage.tsx`](../PM-Pepsi-App/frontend/src/features/manhours/ManhoursPage.tsx) แท็บ Performance / HR vs Confirm (Pie) / รายสัปดาห์ |
| 2026-05-19 | — | **W_worktime_view** — [`worktime-planning.ts`](../PM-Pepsi-App/backend/src/services/worktime-planning.ts) + `GET /api/v1/worktime/planning`; [`WorktimePage.tsx`](../PM-Pepsi-App/frontend/src/features/manhours/WorktimePage.tsx) แยกแท็บมอบหมายงาน vs ชั่วโมง HR — โมดูล 11 ครบ |
| 2026-05-19 | — | **Reports/KPI (โมดูล 12)** — [`reports.ts`](../PM-Pepsi-App/backend/src/services/reports.ts) + routes `GET /api/v1/reports/kpi`, `GET /api/v1/reports/summary-weekly`; [`ReportsPage.tsx`](../PM-Pepsi-App/frontend/src/features/reports/ReportsPage.tsx), [`SummaryWeeklyPage.tsx`](../PM-Pepsi-App/frontend/src/features/reports/SummaryWeeklyPage.tsx) Chart.js ต่อ DB |
| 2026-05-19 | — | **Reports §3 ครบ (แกน)** — `from`/`to` query + `range` ใน response ([`reports-range.ts`](../PM-Pepsi-App/backend/src/lib/reports-range.ts)); [`ReportsDateFilter.tsx`](../PM-Pepsi-App/frontend/src/features/reports/ReportsDateFilter.tsx) บน `/reports`, `/summary-weekly`, fullscreen; Vitest backend `reports-range.test.ts` + frontend filter/chart tests — โมดูล 12 → **เสร็จ (แกน + §3)** |