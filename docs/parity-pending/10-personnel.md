# ลำดับที่ 10 — Personnel / บุคลากร

**สถานะรวม:** เสร็จ (แกน + Multi-assign + Role-based + Lookup dropdown + Workstatus filter) — Personal Dashboard 4 roles + Admin CRUD + Personnel Confirmation + Multi-assign tbplangingwork + Master-data dropdown + tbwkctrstatus lookup/filter — 2026-05-19 (เหลือ UI batch-assign + tests)  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Route:** `/personnel` (Personal Dashboard) + `/personnel/admin` (Admin CRUD) + `/personnel/confirm` (Personnel Confirmation)  
**Checklist หลัก:** `navbar.php` (profile), `M_personel*.php` (CRUD), `M_personel_confirm*.php` (per-personnel close), `worktime_count.php`

---

## ทำแล้ว

- [x] **Personal Dashboard** — 2026-05-19
  - Schema: [`schemas/personnel.ts`](../../PM-Pepsi-App/backend/src/schemas/personnel.ts) (`personnelDashboardResponseSchema`) — profile + planning summary + confirmation summary + worktime breakdown
  - Service: [`services/personnel.ts`](../../PM-Pepsi-App/backend/src/services/personnel.ts) (`getPersonnelDashboard`) — รวมข้อมูลจาก `tbworkcenter` + lookup (`tbposition`, `tbdepartment`, `tbwkctrgroup`, `tbwkctrtype`, `tbwklevel`), `view_planwork` (open/closed count + 5 รายการล่าสุด), `tbcofirm`/`tbiw37n` (รวมงานปิด/นาที + 10 รายการล่าสุด — match `cwkctr = idwkctr` เทียบ `view_confirm.php` หรือ `wkctr = user.wkctr`), และ `getWorktimeTotal` (เทียบ `worktime_count.php`)
  - Route: [`routes/personnel.ts`](../../PM-Pepsi-App/backend/src/routes/personnel.ts) `GET /api/v1/personnel/me/dashboard` (auth required) — รองรับ 503 SCHEMA_NOT_READY เมื่อยังไม่รัน migration ที่ต้องใช้
  - Frontend schema: [`api/schemas.ts`](../../PM-Pepsi-App/frontend/src/api/schemas.ts) `personnelDashboardResponseSchema` + `fetchPersonnelDashboard()` ใน [`lib/api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts)
  - UI: [`PersonnelPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx) — Profile card (รหัส HR, ชื่อ, WC, Plant, ตำแหน่ง, หน่วยงาน, กลุ่มงาน, ประเภทช่าง, ระดับ, อีเมล/โทร, อายุงาน, อายุปัจจุบัน, วันที่เริ่มงาน, วันเกิด, ล็อกอินล่าสุด) + 4 stat card (งานเปิด, งานปิด, Confirmation, ชั่วโมงรวม) + ตาราง "งานเปิดล่าสุดของฉัน" + ตาราง "Confirmation ล่าสุดของฉัน"
  - Sidebar: เปลี่ยน label เป็น `Personal Dashboard` + ปลด menuright จาก `A` → `A:U:W` ใน [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) และเพิ่ม migration [`034_personnel_menu_personal_dashboard.sql`](../../database/migrations/034_personnel_menu_personal_dashboard.sql) อัปเดต `app.tbmenu`
- [x] **Admin CRUD `M_personel.php` + `_form` + `_imports`** — 2026-05-19
  - Migration [`035_tbworkcenter_full_personnel_columns.sql`](../../database/migrations/035_tbworkcenter_full_personnel_columns.sql): เพิ่ม `cat`, `resp`, `idwklevel`, `wkctrtel`, `wkctrmail`, `labourcost`, `imgmember_data BYTEA`, `imgmember_mime` (default `image/webp`), `imgmember_bytes`, `updated_at`
  - Image policy: **ภาพประจำตัวเก็บใน DB เป็น WebP** (ไม่ใช้ filesystem) — service [`personnel-image.ts`](../../PM-Pepsi-App/backend/src/services/personnel-image.ts) ใช้ `sharp` รับภาพอะไรก็ได้ (JPEG/PNG/WebP/GIF/AVIF/HEIF), `rotate()` ตาม EXIF, resize กว้างสูงสุด 600px (`withoutEnlargement`), แล้ว encode เป็น WebP (`quality 80`) → เขียนลง `imgmember_data` ทุกครั้ง (เทียบ PHP `ImageJPEG` 600px แต่บีบเล็กกว่า ~40-60%)
  - Parser Excel: [`personnel-import.ts`](../../PM-Pepsi-App/backend/src/services/personnel-import.ts) — skip 2 rows แรก (เทียบ PHP `$n > 2`), แมป Row 0..22 ตาม `M_personel.php` (idwkctr, titles, names, eng, startwork, position-name, wkctr, plnt, cat, resp, group-name, type-name, level-name, wkctrdate, tel, mail, labourcost, userst, pass) + แปลงปี พ.ศ. → ค.ศ. + lookup name → id (เทียบ `ShowDetail()`)
  - Service: [`personnel-admin.ts`](../../PM-Pepsi-App/backend/src/services/personnel-admin.ts) — `listPersonnelAdmin` (paginate + search), `getPersonnelAdminOne`, `upsertPersonnelAdmin` (insert/update, password ผ่าน `bcrypt.hash` ถ้าไม่ใช่ hash อยู่แล้ว), `deletePersonnelAdmin`, `importPersonnelFile` (transactional + per-row result), `setPersonnelImage`/`getPersonnelImage`/`clearPersonnelImage`
  - Schema: [`personnel-admin.ts`](../../PM-Pepsi-App/backend/src/schemas/personnel-admin.ts) (`personnelAdminItemSchema`, `personnelAdminUpsertBodySchema`, `personnelImportResponseSchema`, `personnelImageUploadResponseSchema`)
  - Routes (Admin only `userst === 'A'`) ใน [`routes/personnel.ts`](../../PM-Pepsi-App/backend/src/routes/personnel.ts):
    - `GET /api/v1/personnel/admin?q&limit&offset` — list + search
    - `GET /api/v1/personnel/admin/:idwkctr` — detail
    - `POST /api/v1/personnel/admin` — create
    - `PUT /api/v1/personnel/admin/:idwkctr` — update
    - `DELETE /api/v1/personnel/admin/:idwkctr` — delete
    - `POST /api/v1/personnel/admin/import` (multer 15 MB) — Excel import
    - `POST /api/v1/personnel/admin/:idwkctr/image` (multer 8 MB) — upload + convert to WebP
    - `DELETE /api/v1/personnel/admin/:idwkctr/image` — clear image
    - `GET /api/v1/personnel/:idwkctr/image` (authed user ใดก็ได้) — serve binary WebP ตรง ๆ ด้วย `Content-Type: image/webp` เพื่อให้ `<img src=...>` ใช้ได้
  - Frontend: เพิ่ม zod schema + API client (`fetchPersonnelAdminList`, `upsertPersonnelAdmin`, `deletePersonnelAdmin`, `postPersonnelAdminImport`, `postPersonnelAdminImage`, `deletePersonnelAdminImage`, `personnelImageUrl`) ใน [`schemas.ts`](../../PM-Pepsi-App/frontend/src/api/schemas.ts) + [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts)
  - UI: [`PersonnelAdminPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) — route `/personnel/admin`, toolbar (search + Import + Add), ตารางรวมรูป/รหัส/ชื่อ/WC/ตำแหน่ง/หน่วยงาน/สถานะ/action, modal 4 แท็บ (ข้อมูลส่วนตัว / ข้อมูลงาน / ผู้ใช้+รหัสผ่าน / รูป WebP), Import result panel ทีละแถว, รูป preview ใช้ `<img src=/api/v1/personnel/:id/image?v=...>` พร้อม cache busting ตอน upload
  - เข้าใช้งาน: `/personnel` (Personal Dashboard) มีปุ่ม **"จัดการบุคลากร (Admin)"** เห็นเฉพาะ `userst === 'A'`; ภายในหน้า Admin มีลิงก์กลับ Dashboard
  - **Sidebar nav** (เพิ่มภายหลัง — 2026-05-19): เพิ่มรายการใน [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) (`/personnel/admin`, icon `UserCog`, menuright `A`) + migration [`040_personnel_admin_menu.sql`](../../database/migrations/040_personnel_admin_menu.sql) แทรกใน `app.tbmenu` (menuon=232 — ระหว่าง Personal Dashboard (230) กับ Personnel Confirmation (231))
- [x] **`M_personel_confirm*` — Personnel Confirmation Dashboard** — 2026-05-19
  - Migration [`036_view_countpersonelclose.sql`](../../database/migrations/036_view_countpersonelclose.sql): สร้าง view `app.view_countpersonelclose` รวม `tbiw37n` + `tbwkstatus` + `tbmoveplan` + agg `tbplangingwork` (planned_count) + agg `tbcofirm` (countwkctr / has_confirm) + คำนวณ `percent_close = round(countwkctr / NULLIF(planned_count,0) * 100)`
  - Migration [`037_personnel_confirm_menu.sql`](../../database/migrations/037_personnel_confirm_menu.sql): เพิ่ม `app.tbmenu` รายการ Personnel Confirmation (Admin only, `react_route='/personnel/confirm'`)
  - Schema/service ฝั่ง backend: [`personnel-confirm.ts`](../../PM-Pepsi-App/backend/src/schemas/personnel-confirm.ts) + [`services/personnel-confirm.ts`](../../PM-Pepsi-App/backend/src/services/personnel-confirm.ts) — กรอง syst (default CRTD,REL), filter `status` (`all`/`not_started`/`in_progress`/`done`), search `q` (wkorder/mntplan/equdescrip/operationshorttext) + คืน summary count (total/fully closed/in progress/not started)
  - Route Admin-only: `GET /api/v1/personnel/admin/confirm?q&status&syst&limit&offset` (เพิ่มก่อน `:idwkctr` ใน [`routes/personnel.ts`](../../PM-Pepsi-App/backend/src/routes/personnel.ts) เพื่อกัน Express match `:idwkctr=confirm`) — 503 SCHEMA_NOT_READY เมื่อยังไม่ migrate 036
  - Frontend schema + API: เพิ่ม `personnelConfirmListResponseSchema` + `fetchPersonnelConfirm()` ใน [`schemas.ts`](../../PM-Pepsi-App/frontend/src/api/schemas.ts) / [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts)
  - UI: [`PersonnelConfirmPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelConfirmPage.tsx) — route `/personnel/admin` only — summary 4 การ์ด (Open/Fully closed/In progress/Not started) + ค้นหา + filter ปุ่ม 4 สถานะ + ตาราง 8 คอลัมน์ (Close %, Work Order, Maintenance plan, Type, Equipment, Plan, New Plan, Action) — Progress bar `0-100%` ระบายสีตามช่วง (`amber<60`, `blue<100`, `emerald=100`) + แสดง `closedCount/plannedCount คน` ใต้แถบ
  - Confirm flow: ปุ่ม **"Confirm" / "ดู / Confirm"** เปิด `WorkOrderDetailDialog` ด้วย `initialTab="confirm"` (เทียบ legacy modal `confirmTab1/3/4.php`); ปิด modal แล้ว refetch รายการอัตโนมัติ
  - Sidebar nav: เพิ่มเมนู `Personnel Confirmation` (`/personnel/confirm`) สิทธิ์ `A` ใน [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts); บนหน้า Personal Dashboard และหน้า Admin มีปุ่มลัดเข้าสู่หน้านี้สำหรับ Admin

---

- [x] **Multi-assign tbplangingwork** — 2026-05-19
  - Migration [`038_tbplangingwork_multi_assign.sql`](../../database/migrations/038_tbplangingwork_multi_assign.sql): drop `UNIQUE(idiw37)` → `UNIQUE(idiw37, wkctr)` + index `wkctr` (สำหรับ technician filter); ทำให้ progress bar % ของ `view_countpersonelclose` คำนวณตรง legacy
  - Service [`planning.ts`](../../PM-Pepsi-App/backend/src/services/planning.ts): `assignPlanningWork` รองรับ `mode='G'` → expand เป็นช่างทั้งกลุ่ม (อ่าน `tbworkcenter.idwkctrgroup`) เทียบ `AddPlan.php $sqlG` + `ON CONFLICT (idiw37, wkctr) DO NOTHING` (ไม่ทับ comment); เพิ่ม `removePlanningAssignment(idiw37, wkctr)` และ `removePlanningAssignmentByIdplanw`
  - Service [`work-orders.ts`](../../PM-Pepsi-App/backend/src/services/work-orders.ts): `getWorkOrderModalDetail` คืน `assignees[]` ทุกช่างของ WO (ใหม่) + คง `assigned` เป็นช่างคนแรกเพื่อ back-compat; `upsertWorkOrderPlanning` ใช้ insert + `ON CONFLICT DO NOTHING`; `deleteWorkOrderPlanning(id, wkctr?)` รองรับลบเฉพาะคน หรือทั้งหมด
  - Route: เพิ่ม `DELETE /api/v1/work-orders/:id/planning/:wkctr` (Admin only) สำหรับลบ assignee รายตัว — เทียบ `AddPlan.php` `st=Del`; `DELETE /api/v1/work-orders/:id/planning` (เดิม) ยังลบทั้งหมด
  - Schema: เพิ่ม `idplanw` ใน `workOrderPlanningAssignedSchema` + ฟิลด์ `assignees: array` ใน `workOrderPlanningSchema` (frontend + backend)
  - UI: [`WorkOrderDetailDialog`](../../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) + [`ConfirmationParityPage` (`SidebarParityPages.tsx`)](../../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) — แสดงรายชื่อช่างเป็น list + ปุ่ม **ลบ** รายตัว (Admin only) + ปุ่ม **ยกเลิกทั้งหมด** + badge `GROUP` เมื่อ `pwteam='G'`
  - API client: เพิ่ม `deleteWorkOrderPlanningAssignee(id, wkctr)` ใน [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts)
- [x] **Role-based Personal Dashboard (admin/manager/planner/technician)** — 2026-05-19
  - Helper [`lib/user-role.ts`](../../PM-Pepsi-App/backend/src/lib/user-role.ts): `deriveUserRole(userst, position)` → `'admin' | 'manager' | 'planner' | 'technician'` — แมปจาก legacy enum (`A`/`H`/`U`/`W`) + heuristic จากชื่อ `position` (Manager/หัวหน้า, Planner/Engineer/วิศวกร, ช่าง) สำหรับ `U` ที่ legacy ไม่ได้แยกชัดเจน
  - Schema: ขยาย `personnelDashboardResponseSchema` ให้มี `role`, `roleLabel`, `roleData` (team สำหรับ manager / unassigned + global สำหรับ admin & planner)
  - Service [`personnel.ts`](../../PM-Pepsi-App/backend/src/services/personnel.ts) `loadRoleData`:
    - **admin / planner** → `global` (open total, assigned total, close today) + `unassigned` (10 ใบ WO ที่ยังไม่มี tbplangingwork)
    - **manager** → `team` (สมาชิกใน `idwkctrgroup` เดียวกัน + open/closed count + total minutes ต่อคน)
    - **technician** → ไม่มี roleData เพิ่ม (ใช้ stat cards เดิม)
  - UI [`PersonnelPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx):
    - `RoleBadge` แสดงสีต่างกัน + icon (admin=ShieldCheck/rose, manager=Users/purple, planner=Layers/blue, technician=Wrench/emerald)
    - **admin & planner**: เพิ่มการ์ดสรุปโรงงาน (WO เปิดทั้งหมด / จ่ายงานแล้ว / ปิดวันนี้ / รอจ่าย) + ตาราง WO รอจ่ายงาน 10 ใบ + ปุ่ม "ไปจ่ายงาน"
    - **manager**: เพิ่มตารางสมาชิกในทีม (`idwkctrgroup`) + รวมเปิด/ปิด/ชั่วโมง
    - **technician**: ใช้ stat cards + recent planning + recent confirmation เดิม
    - ปุ่ม "หน้าจ่ายงาน Planning" โผล่เฉพาะ planner
- [x] **Dropdown lookup ในฟอร์ม Admin (iddepartment/idposition/idwkctrgroup/idwkctrtype/idwklevel)** — 2026-05-19
  - API client: เพิ่ม `fetchPersonnelLookups()` ใน [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts) — รวม 5 master-data (`department`, `position`, `group`, `worktype`, `level`) ยิงคู่ขนานครั้งเดียวด้วย `Promise.all` แล้ว map เป็น `{value, label}` พร้อม label รวม `id — name` (สำหรับ group ใช้ `wkctrgroup — wkctrdescription`); คืนเป็น type `PersonnelLookups` ใช้กับ TanStack Query ได้ตรง
  - Endpoint backend ที่ใช้คือ `GET /api/v1/master-data/:entity` เดิม (ใน [`routes/master-data.ts`](../../PM-Pepsi-App/backend/src/routes/master-data.ts)) ที่ pull จาก `app.tbdepartment`, `app.tbposition`, `app.tbwkctrgroup`, `app.tbwkctrtype`, `app.tbwklevel` — **ไม่ต้องสร้าง route ใหม่**
  - UI: เพิ่ม component `LookupSelect` (native `<select>`) ใน [`PersonnelAdminPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) — แทนที่ 5 `<Input>` เดิมในแท็บ "ข้อมูลงาน" ของ modal เพิ่ม/แก้ — รองรับ placeholder "— เลือก —", สถานะ `กำลังโหลด…`, **fallback option** เมื่อค่าปัจจุบันไม่อยู่ใน master (เพื่อกันค่าหายตอน edit รายเก่าที่ยัง id เก่าค้าง), styling เทียบ `<Input>` (h-10, rounded-md, border-zinc-300, focus ring)
  - Caching: `useQuery(['personnel','admin','lookups'])` `staleTime: 5 นาที` — fetch ครั้งเดียวต่อ session, share ระหว่างทุกครั้งที่เปิด modal
- [x] **Deactivate workstatus + Filter ในตาราง Admin** — 2026-05-19
  - Migration [`039_tbwkctrstatus.sql`](../../database/migrations/039_tbwkctrstatus.sql): สร้างตาราง `app.tbwkctrstatus(workstatus, wkstatusdes, wkstcolor, is_active, sort_order)` เทียบ legacy MySQL `tbwkctrstatus` (JOIN ใน `sap/pages/user.php` + `M_personel.php` ฟิลด์ `filed24='workstatus'`) + seed 6 สถานะ: **ACTIVE** (`is_active=true`, emerald) / **INACTIVE** (amber) / **LEAVE** (purple) / **RESIGNED** (`is_active=false`, zinc) / **RETIRED** (blue) / **TERMINATED** (red); เพิ่ม index `idx_tbworkcenter_workstatus` เพื่อ filter เร็วในตารางที่อาจมีหลายพันแถว
  - Backend service [`personnel-admin.ts`](../../PM-Pepsi-App/backend/src/services/personnel-admin.ts): ขยาย `listPersonnelAdmin({ q, limit, offset, status })` รองรับ 4 mode — `all` (ทุกคน), `active` (เฉพาะ active **รวมแถวที่ workstatus เป็น NULL/ว่าง** เพื่อกัน data เก่าก่อน 039 หาย), `inactive` (เฉพาะ false), `<code>` (เช่น `RESIGNED` — match ตรง); เพิ่ม `listPersonnelWorkstatuses(pool)` คืน option ทั้งหมด (เรียงตาม `sort_order`)
  - Backend schema [`personnel-admin.ts`](../../PM-Pepsi-App/backend/src/schemas/personnel-admin.ts): เพิ่ม `personnelWorkstatusOptionSchema` + `personnelWorkstatusOptionsResponseSchema` (`{workstatus, wkstatusdes, wkstcolor, isActive, sortOrder}`)
  - Route [`routes/personnel.ts`](../../PM-Pepsi-App/backend/src/routes/personnel.ts):
    - `GET /api/v1/personnel/admin?status=<all|active|inactive|CODE>` — ขยาย query param เดิม
    - **เพิ่ม** `GET /api/v1/personnel/admin/workstatus-options` (Admin only, วางก่อน `:idwkctr` เพื่อกัน Express match พลาด) — รองรับ 503 SCHEMA_NOT_READY เมื่อยังไม่รัน migration 039
  - Frontend schema [`schemas.ts`](../../PM-Pepsi-App/frontend/src/api/schemas.ts): มิเรอร์ schema + ขยาย `fetchPersonnelAdminList({status})` ใน [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts) + เพิ่ม `fetchPersonnelWorkstatusOptions()`
  - UI [`PersonnelAdminPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx):
    - **Filter bar** บน toolbar — 3 chips (`ใช้งาน`/`ไม่ใช้งาน`/`ทั้งหมด`, default = `active`) + `<select>` เจาะจง code (ACTIVE/INACTIVE/LEAVE/RESIGNED/RETIRED/TERMINATED) — กดแล้ว re-fetch ทันที (`queryKey` รวม `statusFilter`)
    - **เปลี่ยน `workstatus` ในฟอร์ม edit/add จาก `<Input>` text → `LookupSelect`** (รีใช้ component เดิม) — placeholder "— เลือกสถานะ —", `staleTime: 10 นาที`
    - **เพิ่มคอลัมน์ "สถานะใช้งาน"** ในตาราง (เปลี่ยนคอลัมน์ "สถานะ" เดิมเป็น "บทบาท" — เพราะแสดง `userst`) + component `WorkstatusBadge` ระบายสีตาม `wkstcolor` แบบโปร่งใส 10% + ring 1px + จุด indicator + tooltip
    - กัน edge case 2 ข้อ: (1) `workstatus = null` แสดง "—" + tooltip "ยังไม่กำหนดสถานะ"; (2) `workstatus` มีค่าที่ไม่อยู่ใน `tbwkctrstatus` แสดง outline badge สีเทาเป็น fallback (เทียบเดียวกับ LookupSelect fallback)
- [x] **UI multi-assign สำหรับ "เพิ่ม assignee" หลายคนในคลิกเดียว** — 2026-05-19
  - Backend service [`work-orders.ts`](../../PM-Pepsi-App/backend/src/services/work-orders.ts) `assignWorkOrderPlanningBatch(pool, id, wkctrs[], comment, actorWkctr)`:
    - dedupe + filter empty ฝั่ง backend อีกชั้น
    - ตรวจ wkctr ที่มีจริงใน `app.tbworkcenter` (กันค่ามั่ว) → คืน `notFound[]`
    - หา wkctr ที่จ่ายไปแล้ว (มีอยู่ใน `tbplangingwork`) → คืน `skipped[]`
    - INSERT ที่เหลือด้วย `INSERT … SELECT FROM UNNEST(...) ON CONFLICT (idiw37, wkctr) DO NOTHING` (1 query หลายแถว) → คืน `assigned[]`
    - ใช้ `pwcomment` เดียวกับทุกคนในรอบนั้น (ถ้าว่างใช้ timestamp string เหมือน legacy)
  - Backend schema [`work-orders.ts`](../../PM-Pepsi-App/backend/src/schemas/work-orders.ts): เพิ่ม `workOrderPlanningBatchBodySchema` (`wkctrs: string[].min(1).max(200)`, `comment?`) + `workOrderPlanningBatchResponseSchema` (`ok` + `assigned[]` + `skipped[]` + `notFound[]`)
  - Backend route [`work-orders.ts`](../../PM-Pepsi-App/backend/src/routes/work-orders.ts): เพิ่ม `POST /api/v1/work-orders/:id/planning/batch` (Admin only) วางก่อน `DELETE :wkctr` ใน file order; รองรับ 503 `SCHEMA_NOT_READY` (migration `007_tbplangingwork_view_planwork.sql`)
  - Frontend schema/API: มิเรอร์ schema ใน [`schemas.ts`](../../PM-Pepsi-App/frontend/src/api/schemas.ts) + เพิ่ม `postWorkOrderPlanningBatch(id, body)` ใน [`api-public.ts`](../../PM-Pepsi-App/frontend/src/lib/api-public.ts)
  - Component ใหม่ [`PlanningMultiAssign.tsx`](../../PM-Pepsi-App/frontend/src/components/scheduling/PlanningMultiAssign.tsx) — ใช้ร่วมกันระหว่าง `WorkOrderDetailDialog` และ `ConfirmationParityPage`:
    - search input (filter ทั้ง wkctr + displayName, case-insensitive)
    - list มี checkbox + แสดง badge "จ่ายแล้ว" สำหรับคนที่อยู่ใน `assignedCodes` (disabled checkbox)
    - chips ของรายชื่อที่เลือก พร้อมปุ่ม × ดึงออก
    - ปุ่ม "เลือกทั้งหมดในมุมมอง" / "ล้างการเลือก"
    - counter "X เลือก" + footer สถิติ (total / จ่ายแล้ว / ว่าง)
    - ปุ่ม submit แสดง "เพิ่ม Assignee (N)" + state loading จาก parent
    - หลัง submit แสดงสรุป (`assigned`/`skipped`/`notFound`) + ล้างเฉพาะคนที่สำเร็จ/ข้าม (เก็บ notFound ไว้ให้เห็นข้อผิดพลาด)
    - controlled comment ผ่าน prop (กันสร้างซ้ำกับ comment เดิมในหน้า)
  - สอดเข้า [`WorkOrderDetailDialog`](../../PM-Pepsi-App/frontend/src/components/scheduling/WorkOrderDetailDialog.tsx) tab "planning": multi-assign เป็น primary; ปุ่มรายบุคคลเดิม (1-click) ย้ายลงเป็น `<details>` collapse ชื่อ "Quick assign — คลิก 1 ครั้ง/คน"
  - สอดเข้า [`SidebarParityPages.tsx`](../../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) `ConfirmationParityPage` tab "planning": ใช้ `PlanningMultiAssign` แบบ controlled (`planComment`/`setPlanComment`), mutation `batchAssign` แสดง toast 3 ระดับ — `success` (จ่ายสำเร็จ N คน) / `info` (ทั้งหมดจ่ายไปแล้ว) / `warning` (`notFound`)
  - Group-assign (`mode='G'`) ยังคงไว้แยกในตารางกลุ่ม (ใช้ legacy logic expand → loop INSERT ON CONFLICT) — multi-assign ใหม่จัดการเฉพาะรายบุคคล
- [x] **Role enum + explicit `userrole` field ใน `tbworkcenter`** — 2026-05-19
  - Migration [`041_tbworkcenter_userrole.sql`](../../database/migrations/041_tbworkcenter_userrole.sql):
    - เพิ่ม `app.tbworkcenter.userrole varchar(24)` + `CHECK (admin|manager|planner|technician)` + default `'planner'` + `NOT NULL`
    - ขยาย legacy `userst` check ให้รองรับ `A/H/U/W` ชัดเจน (`H` = Head/Manager) โดยยังคง menuright เดิม (`A:U:W`) ได้
    - Backfill `userrole` จาก `userst` ก่อน (`A→admin`, `H→manager`, `W→technician`) แล้วค่อย fallback จากชื่อ `tbposition.position` (manager/chief/supervisor/หัวหน้า/ผู้จัดการ/ช่าง) และ default เป็น `planner`
    - เพิ่ม index `idx_tbworkcenter_userrole` เพื่อเตรียมใช้ filter/RBAC ใน Admin module ต่อไป
  - Backend [`lib/user-role.ts`](../../PM-Pepsi-App/backend/src/lib/user-role.ts): เพิ่ม `normalizeUserRole()` + `resolveUserRole(userrole, userst, position)` — ใช้ `userrole` เป็น source of truth ก่อน และ fallback heuristic เดิมเฉพาะ data ที่ยังไม่ migrate
  - Backend Personal Dashboard [`services/personnel.ts`](../../PM-Pepsi-App/backend/src/services/personnel.ts): SELECT `wc.userrole` และ derive `role/roleLabel/roleData` จาก explicit role; profile response เพิ่ม `profile.userRole` เพื่อให้ UI ตรวจสอบได้ว่า role มาจาก field ใหม่
  - Backend Admin CRUD [`personnel-admin.ts`](../../PM-Pepsi-App/backend/src/schemas/personnel-admin.ts), [`services/personnel-admin.ts`](../../PM-Pepsi-App/backend/src/services/personnel-admin.ts):
    - schema upsert/list เพิ่ม `userrole`
    - `upsertPersonnelAdmin()` บันทึก `userrole` ทั้ง insert/update
    - import `Personel.xlsx` รองรับคอลัมน์ optional ใหม่ Row[23] = `userrole`; ถ้าไม่มีจะ resolve จาก `userst + positionName` เพื่อไม่ทำให้ template เก่าเสีย
  - Frontend Admin [`PersonnelAdminPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx):
    - `FormState` เพิ่ม `userrole`
    - แท็บ "ผู้ใช้/รหัสผ่าน" เพิ่ม dropdown **"บทบาท Dashboard/RBAC (userrole)"** แยกจาก **"สิทธิ์ระบบ (userst)"**
    - dropdown `userst` รองรับ `A/H/U/W`; `userrole` รองรับ `Admin/Manager/Planner/Technician`
    - ตารางแสดง badge `userrole` เป็นบทบาทหลัก และแสดง `UserST: X` เป็น legacy context
  - Frontend Personal Dashboard [`PersonnelPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx): profile card แสดงทั้ง `บทบาท` (RoleBadge จาก `profile.userRole`) และ `UserST` เพื่อช่วย audit หลัง migrate
- [x] **เกณฑ์ §3 ครบ — UI, Data, Business rules, Modal/Tabs, Tests** — 2026-05-19
  - เพิ่ม test harness มาตรฐานตาม `skills.md` §Quality/CI: เพิ่ม `vitest` ให้ backend และ frontend พร้อม script `npm test`; frontend เพิ่ม `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` สำหรับ interaction test
  - Backend tests:
    - [`user-role.test.ts`](../../PM-Pepsi-App/backend/src/lib/user-role.test.ts): ครอบคลุม explicit `userrole` เป็น source of truth, fallback `userst`, fallback heuristic จาก `position`, และ normalize role enum
    - [`personnel-admin.test.ts`](../../PM-Pepsi-App/backend/src/schemas/personnel-admin.test.ts): ครอบคลุม Admin CRUD schema (`userst=A/H/U/W`, `userrole` enum, default `planner`, reject role ผิด, list item ต้องมี `userrole`)
    - [`work-orders.batch.test.ts`](../../PM-Pepsi-App/backend/src/services/work-orders.batch.test.ts): ครอบคลุม business rule ของ batch multi-assign — dedupe input, skip คนที่จ่ายแล้ว, report `notFound`, insert เฉพาะคนที่เหลือด้วย `ON CONFLICT (idiw37, wkctr) DO NOTHING`, และกรณี WO ไม่พบคืน `null`
  - Frontend tests:
    - [`PlanningMultiAssign.test.tsx`](../../PM-Pepsi-App/frontend/src/components/scheduling/PlanningMultiAssign.test.tsx): ครอบคลุม UI multi-assign — search, disabled checkbox สำหรับคนที่จ่ายแล้ว, select-all-in-view, submit selected codes, result summary, uncontrolled comment mode
    - [`personnel-schemas.test.ts`](../../PM-Pepsi-App/frontend/src/features/personnel/personnel-schemas.test.ts): ครอบคลุม frontend contract ของ Admin row (`userrole`) และ Personal Dashboard (`profile.userRole` align กับ `role`)
  - Coverage ตามหัวข้อ:
    - **UI**: Admin role dropdown/badge, Personal Dashboard role display, PlanningMultiAssign interaction
    - **Data**: Zod schema contract backend/frontend, `userrole` enum, dashboard profile role
    - **Business rules**: explicit role priority/fallback, multi-assign dedupe/skip/notFound/conflict-safe insert
    - **Modal/Tabs**: Admin CRUD form tabs (`userst` + `userrole`) และ planning tab multi-assign ถูก validate ผ่าน component/API contract
    - **Tests**: `npm test` backend ผ่าน 3 files / 10 tests; frontend ผ่าน 2 files / 4 tests

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ลำดับ 10 |
| 2026-05-19 | Personal Dashboard เสร็จ — เพิ่ม schema/service/route `personnel.ts` (backend) + schema/api/UI ฝั่ง frontend; เปลี่ยน `/personnel` จาก stub เป็น dashboard ส่วนตัว (profile card + stats + recent planning + recent confirmation + worktime); ปลด menuright เป็น `A:U:W` ทั้ง nav-config และ migration `034_personnel_menu_personal_dashboard.sql` |
| 2026-05-19 | **Admin CRUD `M_personel.php` + `_form` + `_imports` เสร็จ** — เพิ่ม migration `035_tbworkcenter_full_personnel_columns.sql` ขยายตารางและเก็บภาพเป็น **WebP (resize 600px) ใน `imgmember_data` BYTEA** แทน filesystem (ประหยัด storage); ติดตั้ง `sharp` + service `personnel-image.ts`; service/route Admin CRUD + Excel import (skip 2 rows + lookup name→id + bcrypt password); หน้า React `/personnel/admin` 4 แท็บ (ส่วนตัว/งาน/รหัสผ่าน/รูป) + ค้นหา + Import + ตารางรูปประจำตัว; รูปแสดงผ่าน `GET /api/v1/personnel/:id/image` ใน `<img>` |
| 2026-05-19 | **Personnel Confirmation (`M_personel_confirm.php`) เสร็จ** — เพิ่ม view `view_countpersonelclose` (`036_view_countpersonelclose.sql`) + เมนู (`037_personnel_confirm_menu.sql`); หน้า React `/personnel/confirm` (Admin) — summary 4 การ์ด + filter status/search + Progress bar % ระบายสี + ปุ่ม Confirm เปิด `WorkOrderDetailDialog` ใน tab confirm; ลิงก์เพิ่มบน Personal Dashboard, Admin page และ sidebar (`menuright='A'`) |
| 2026-05-19 | **Sidebar menu sync — `/personnel/admin`** — พบช่องว่าง: route + UI ของ Admin CRUD พร้อม (App.tsx + PersonnelAdminPage.tsx) แต่ยังไม่โผล่ใน sidebar; เพิ่มเข้า [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) (icon `UserCog` จาก lucide, label `จัดการบุคลากร (Admin)`, menuright `A`) วางระหว่าง `/personnel` กับ `/personnel/confirm`; เพิ่ม migration [`040_personnel_admin_menu.sql`](../../database/migrations/040_personnel_admin_menu.sql) แทรก `app.tbmenu` (menuon=232, menuright=`A`) — กัน drift ด้วย UPDATE ถ้ารันซ้ำ |
| 2026-05-19 | **Deactivate workstatus + Filter ในตาราง Admin** — เพิ่ม migration `039_tbwkctrstatus.sql` สร้าง lookup `app.tbwkctrstatus` + seed 6 สถานะ (ACTIVE/INACTIVE/LEAVE = active; RESIGNED/RETIRED/TERMINATED = inactive) พร้อมสี + `sort_order` + index บน `tbworkcenter.workstatus`; ขยาย `listPersonnelAdmin` รองรับ `status` filter 4 mode (`all`/`active`/`inactive`/`<code>`) — `active` รวมแถวที่ workstatus เป็น NULL/ว่าง กัน data เก่าหาย; เพิ่ม `listPersonnelWorkstatuses` + route `GET /api/v1/personnel/admin/workstatus-options` (Admin only, ก่อน `:idwkctr`); ฝั่ง frontend เพิ่ม `personnelWorkstatusOption(s)Schema` + `fetchPersonnelWorkstatusOptions()` + `fetchPersonnelAdminList({status})`; UI `PersonnelAdminPage` เติม filter chips 3 ตัว + `<select>` เจาะจง code, เปลี่ยนฟิลด์ `workstatus` ในฟอร์มจาก `<Input>` → `LookupSelect`, เพิ่มคอลัมน์ "สถานะใช้งาน" + `WorkstatusBadge` ระบายสีตาม `wkstcolor` (10% bg + ring + indicator dot + tooltip) + เปลี่ยนคอลัมน์ "สถานะ" เดิมเป็น "บทบาท" (userst) |
| 2026-05-19 | **Dropdown lookup ใน Admin form (5 ฟิลด์ master)** — เพิ่ม helper `fetchPersonnelLookups()` รวม department/position/group/worktype/level (Promise.all), เพิ่ม component `LookupSelect` (native `<select>` + fallback option เมื่อ id ปัจจุบันไม่อยู่ใน master) ใน `PersonnelAdminPage` แทน 5 `<Input>` ใต้แท็บ "ข้อมูลงาน" (modal เพิ่ม/แก้); cache 5 นาทีต่อ session — ใช้ endpoint `GET /api/v1/master-data/:entity` เดิม ไม่มี route ใหม่ |
| 2026-05-19 | **UI multi-assign "เพิ่ม assignee" หลายคนในคลิกเดียว** — เพิ่มบริการ `assignWorkOrderPlanningBatch` (dedupe + check `tbworkcenter` + `ON CONFLICT DO NOTHING` via UNNEST 1-query) + schema `workOrderPlanningBatch{Body,Response}Schema` + route `POST /api/v1/work-orders/:id/planning/batch` (Admin only). สร้าง component ใช้ร่วม `PlanningMultiAssign.tsx` (search + checkbox list + selected chips + select-all-in-view + result summary แยก `assigned`/`skipped`/`notFound`) สอดเข้า `WorkOrderDetailDialog` (planning tab) และ `ConfirmationParityPage` (planning tab) เป็น primary; ปุ่ม Quick-assign ทีละคนเดิมยังคงไว้ใน `<details>` collapsible เพื่อ back-compat. toast 3 ระดับ (success/info/warning) แสดง `notFound` แยก. |
| 2026-05-19 | **Role enum + explicit `tbworkcenter.userrole` เสร็จ** — เพิ่ม migration `041_tbworkcenter_userrole.sql` (column `userrole`, CHECK enum `admin/manager/planner/technician`, default planner, backfill จาก `userst` + `tbposition.position`, index `idx_tbworkcenter_userrole`, ขยาย `userst` เป็น `A/H/U/W`); backend เพิ่ม `resolveUserRole(userrole, userst, position)` ใช้ field ใหม่ก่อน fallback heuristic; Personal Dashboard SELECT `wc.userrole` + response `profile.userRole`; Admin CRUD schema/service/import บันทึก `userrole` ทั้ง insert/update และ import รองรับคอลัมน์ optional Row[23]; Frontend Admin เพิ่ม dropdown `userrole` แยกจาก `userst`, ตารางแสดง role badge + legacy UserST; Profile card แสดงบทบาทใหม่ + UserST เพื่อ audit หลัง migrate |
| 2026-05-19 | **เกณฑ์ §3 ครบ + Tests** — เพิ่ม Vitest harness ทั้ง backend/frontend (`npm test`) ตาม `skills.md` §Quality/CI; backend tests 3 ไฟล์/10 tests (`user-role.test.ts`, `personnel-admin.test.ts`, `work-orders.batch.test.ts`) ครอบคลุม explicit role, Admin CRUD schema, business rule batch multi-assign (dedupe/skip/notFound/ON CONFLICT/null when WO missing); frontend tests 2 ไฟล์/4 tests (`PlanningMultiAssign.test.tsx`, `personnel-schemas.test.ts`) ครอบคลุม UI interaction multi-assign (search/disabled assigned/select all/submit/result summary/comment mode) และ data contract ของ `userrole/profile.userRole`; สรุป coverage §3: UI + Data + Business rules + Modal/Tabs + Tests สำหรับ CRUD/confirm/multi-assign/role-based dashboard |
| 2026-05-19 | **Multi-assign tbplangingwork + Role-based Personal Dashboard** — migration `038_tbplangingwork_multi_assign.sql` เปลี่ยน unique เป็น `(idiw37, wkctr)` ทำให้ 1 WO มอบหมายช่างหลายคนได้จริง (เทียบ `AddPlan.php`); service `assignPlanningWork` รองรับ mode `G` expand กลุ่ม + `removePlanningAssignment(idiw37, wkctr)`; `getWorkOrderModalDetail` คืน `assignees[]` พร้อม `idplanw` (คง `assigned` เป็น first สำหรับ back-compat); route `DELETE /api/v1/work-orders/:id/planning/:wkctr` (Admin only); UI `WorkOrderDetailDialog` + `ConfirmationParityPage` แสดงผู้รับผิดชอบเป็น list + ปุ่มลบรายตัว/ลบทั้งหมด + badge `GROUP`. เพิ่ม helper `lib/user-role.ts` `deriveUserRole(userst, position)` map เป็น 4 role (`admin`/`manager`/`planner`/`technician`); ขยาย `personnelDashboardResponseSchema` ด้วย `role`/`roleLabel`/`roleData`; `getPersonnelDashboard` populate `roleData.global` + `roleData.unassigned` ให้ admin&planner และ `roleData.team` (สมาชิกใน idwkctrgroup) ให้ manager; `PersonnelPage` แสดง `RoleBadge` สีต่างกัน + section แบบมีเงื่อนไข (Global cards + Unassigned WO 10 ใบ สำหรับ admin/planner; ตารางทีม สำหรับ manager; stat cards เดิม สำหรับ technician) |
