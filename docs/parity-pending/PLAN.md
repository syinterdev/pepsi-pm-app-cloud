# แผนย้าย PHP → React (อัปเดตใหม่)



**วันที่สแกน:** 2026-05-21  

**อัปเดตล่าสุด:** 2026-05-21 (ขั้น 0–4 ✅ · สัญลักษณ์สถานะทั้งเอกสาร)

**อ้างอิง:** [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) · [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md)

**React routes:** [`App.tsx`](../../PM-Pepsi-App/frontend/src/App.tsx)

### สัญลักษณ์สถานะ (ใช้ทั้ง `PLAN.md`)

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| ✅ | **เสร็จ** — แกนโค้ด/route/API/UI หรือขั้นใน CHECKLIST-ORDER ปิดแล้ว |
| ⏳ | **กำลังทำ / ถัดไป** — มีบางส่วน หรือรอ UAT ขั้น 5 / parity doc ยังเปิด |
| ❌ | **ยังไม่ทำ** — ยังไม่เริ่มหรือนอกขอบเขตรอบนี้ |
| — | **ข้ามตั้งใจ** — legacy/ซ้ำ ไม่ย้าย (ไม่นับเป็นค้าง) |

> **ทำตามลำดับ:** [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md) (ขั้น 0→6)  
> **สถานะตอนนี้:** ขั้น **0–4** ✅ → ถัดไป ขั้น **5** ⏳ UAT มือ



---



## 0) ความคืบหน้า (สรุปสั้น)



| ขั้น | หัวข้อ | สถานะ |

|------|--------|--------|

| 0 | ตัดสินใจ login → **0A** Plan Calendar | ✅ |

| 1 | แก้เอกสาร §4/§5 (legacy → ข้าม) | ✅ |

| 2 | P0 `M_plan_calendar` → `/plan-calendar` | ✅ |

| 3 | Modal P1 (3.1–3.6) | ✅ |

| 4 | Auth — เปลี่ยนรหัสผ่าน + บันทึก member/RBAC | ✅ |

| 5 | UAT มือโมดูล 2–12 | ⏳ **ถัดไป** |

| 6 | Admin test / Deploy | ❌ หลัง parity ธุรกิจ |

### โมดูล parity (`parity-pending/0N-*.md`)

| ลำดับ | โมดูล | สถานะแกน |
|------|--------|----------|
| 01 | Auth / settings | ✅ |
| 02 | Master data | ✅ |
| 03 | Line calendar | ✅ |
| 04 | Work calendar | ✅ |
| 05 | Backlog | ✅ |
| 06 | Work orders | ✅ |
| 07 | IW37N | ✅ |
| 08 | Dashboard / Planning / Plan Calendar | ✅ |
| 09 | Confirmation | ✅ |
| 10 | Personnel | ✅ |
| 11 | Manhours / Worktime | ✅ |
| 12 | Reports / Summary | ✅ |
| 13 | Deploy offline | ❌ |
| 14 | Administrator | ✅ |

---



## 1) สรุปการสแกน



| พื้นที่ | จำนวนไฟล์ `.php` | หมายเหตุ |

|--------|------------------|----------|

| `sap/pages/` | **204** | รวม shell, master, งานหลัก, legacy |

| `sap/modalPages/` | **37** | AJAX / fragment |

| **รวม** | **241** | เท่า checklist เดิม |



### สถานะใน checklist หลัก (§4 + §5) — หลังขั้น 0–4

| สถานะ | จำนวนแถว (โดยประมาณ) | ความหมายจริง |
|-------|----------------------|----------------|
| ✅ เสร็จ | ~150+ | รวม `M_*`, Plan Calendar, modal P1, IW37N, Planning, Confirm |
| — ข้าม | ~60+ | legacy `tb_*`, `member*` (ยกเว้น change password → `/settings`), template, `test_*` |
| ⏳ กำลังทำ | 0 | — |
| — ข้าม (กลุ่ม D + §5 utility) | **~90+** | สำรอง, legacy `tb_*`/`member*`, worker ซ้ำ, demo — ดู P4 ขยาย |
| ⏳ นอก parity ธุรกิจ | track **E** | deploy, Playwright admin — ไม่บล็อก UAT §3 |



**แผนนี้ใช้การจัดกลุ่ม (§2)** — ไม่นับทีละ 241 แถว



---



## 2) วิธีจัดกลุ่ม (ใช้ตอนอัปเดต checklist)



| รหัส | สถานะ | ชื่อ | ทำอะไร |
|------|--------|------|--------|
| **A** | ✅ | ย้ายแล้ว | มี route + API + UI ใช้งานกับ PG — ติ๊ก **เสร็จ** ใน §4 |
| **B** | ✅ | รวมแล้ว | `_form` / `_imports` / คู่ list — ไม่มี route แยก |
| **C** | ✅ | ต้องย้าย (ปิดคิว) | **0** ไฟล์ — `W_*` / utility §5 ย้ายไป **D** แล้ว; parity โค้ดใหม่เหลือแค่ **UAT ขั้น 5** |
| **D** | — | ข้าม | สำรอง, ทดสอบ, legacy ซ้ำ `M_*` — ติ๊ก **ข้าม** |
| **E** | ⏳ | นอกขอบเขต parity | Admin ใหม่, deploy — **ไม่บล็อก** ธุรกิจ |



### เกณฑ์ปิดงาน



- UI + ข้อมูล + กฎธุรกิจ + modal ที่เกี่ยว + ทดสอบมือ (ขั้นที่ 5)

- อัปเดตแถว §4/§5 + `parity-pending/0N-*.md` + §7 checklist หลัก



---



## 3) แผนที่เมนู production (PHP) → React ⏳ UAT

เอกสารอ้างอิง (ไม่ใช่รายการไฟล์ PHP ทีละแถวใน §4):

| แหล่ง | ใช้ทำอะไร |
|------|-----------|
| [`left_menu.php`](../../sap/pages/left_menu.php) | เมนูจริงจาก `tbmenu` + `menuright` |
| [`left_menu_bk17052563.php`](../../sap/pages/left_menu_bk17052563.php) | โครงเมนูตาม `UserST` (A / U / W) — ใช้เทียบสิทธิ์ |
| [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) | Fallback sidebar React (เมื่อ API ว่าง) |
| `app.tbmenu` + migration [`008`](../../database/migrations/008_auth_tbmenu_member.sql), [`074`](../../database/migrations/074_plan_calendar_menu.sql) | เมนูใน PG → `GET /api/v1/nav/menu` |
| [`NAV_ROUTE_PERMISSION`](../../PM-Pepsi-App/frontend/src/lib/nav-route-permissions.ts) | กรองเมนูด้วย RBAC (มี permissions ใน JWT) |

สถานะแต่ละเมนู — ดู **ตารางสัญลักษณ์ด้านบนเอกสาร** + [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md). คอลัมน์ **menuright** = ใครเห็นใน PHP (`A` / `U` / `W`). (รหัสกลุ่ม **A** ใน §2 = ✅ ย้ายแล้ว)

---

### สรุปสถานะเมนู (ภาพรวม §3)

| สถานะ | รายการ |
|-------|--------|
| ✅ | `/`, `/plan-calendar`, `/calendar`, `/line-calendar`, `/backlog`, `/work-orders`, `/confirmation`, `/master-data`, `/user-log`, `/admin/*`, modal WO (ขั้น 3), `/iw37n`, `/planning`, `/personnel*`, `/manhours*`, `/worktime`, `/reports`, `/summary-weekly`, `/manhours-hr`, `/settings`, login redirect **0A**, migration **074** (โค้ด) |
| ⏳ | Deploy/docker (track E) — UAT ขั้น 5 ทุกหน้า §3.2 |
| ❌ | Deploy offline (`13`) — นอกเมนู production |

---

### 3.1 กลุ่ม sidebar: ปฏิทิน & ใบงาน (React)

ลำดับใน React ตรง [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) — หลังรัน migration 074 จะตรง `tbmenu` ด้วย

| สถานะ | ลำดับ | เมนู React | `react_route` | menuright | RBAC (หลัก) | PHP module | เอกสาร parity |
|-------|------|------------|---------------|-----------|-------------|------------|----------------|
| ✅ | — | Dashboard / หน้าแรก | `/` | A:U:W | `dashboard.read` | `content.php` (demo) · [`HomePage`](../../PM-Pepsi-App/frontend/src/features/home/HomePage.tsx) | [`08-dashboard-planning.md`](08-dashboard-planning.md) |
| ✅ | 1 | **Plan Calendar / จ่ายงาน** | `/plan-calendar` | A:U:W | `planning.read` | **`M_plan_calendar`** | [`08-dashboard-planning.md`](08-dashboard-planning.md) |
| ✅ | 2 | ปฏิทิน (Work scheduling) | `/calendar` | A:U:W | `calendar.read` | `calendar`, `M_filter_iw37` | [`04-work-calendar.md`](04-work-calendar.md) |
| ✅ | 3 | ปฏิทินเส้น / Line | `/line-calendar` | A:U:W | `calendar.read` | `line_calendar`, `M_lineschdul*` | [`03-line-calendar.md`](03-line-calendar.md) |
| ✅ | 4 | Backlog / แผนค้าง | `/backlog` | A:U:W | `backlog.read` | `backlog` | [`05-backlog.md`](05-backlog.md) |
| ✅ | 5 | ใบงาน / WO | `/work-orders` | A:U:W | `work-orders.read` | `workorder` | [`06-work-orders-master-filters.md`](06-work-orders-master-filters.md) |
| ✅ | 6 | รับรอง / Confirmation | `/confirmation` | A:U:W | `confirmation.read` | `M_confirmation`, `M_Confirm*` | [`09-confirmation.md`](09-confirmation.md) |

**หมายเหตุลำดับ PHP vs React**

- PHP หลัง login WC (0A): เปิด **`M_plan_calendar`** ก่อน — React ใส่ `/plan-calendar` เป็นรายการแรกในกลุ่มนี้ (หลัง Dashboard)
- PHP Admin เมนูหลักมักมี `calendar` → `backlog` → `line_calendar` (ไม่มี Plan Calendar แยกใน `left_menu_bk` เก่า) — React รวมทั้งสาม + plan-calendar ในกลุ่มเดียว

---

### 3.2 รายละเอียดหน้า (ตาราง UAT)

แต่ละหัวข้อด้านล่าง = **หนึ่งตารางต่อหน้า/โมดูล** — ใช้เทียบ PHP กับ React ใน **ขั้น 5 UAT** ([`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md) บรรทัด 124–128)

**สัญลักษณ์:** **แกน ✅** = route + API + FE ครบตาม parity doc · **UAT ⏳** = ยังไม่ติ๊กมือเทียบ PHP · ดูรายการเช็คใน [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md)

#### สารบัญ §3.2 (เรียงตาม §3.1 กลุ่มปฏิทิน & ใบงาน ก่อน)

| ลำดับ §3.1 | หน้า | Route | แกน | UAT 5 | Parity |
|------------|------|-------|-----|-------|--------|
| — | Dashboard | `/` | ✅ | ⏳ | [08](08-dashboard-planning.md) |
| 1 | Plan Calendar | `/plan-calendar` | ✅ | ⏳ | [08](08-dashboard-planning.md) |
| 2 | Work scheduling | `/calendar` | ✅ | ⏳ | [04](04-work-calendar.md) |
| 3 | Line scheduling | `/line-calendar` | ✅ | ⏳ | [03](03-line-calendar.md) |
| 4 | Backlog | `/backlog` | ✅ | ⏳ | [05](05-backlog.md) |
| 5 | Work orders | `/work-orders` | ✅ | ⏳ | [06](06-work-orders-master-filters.md) |
| 6 | Confirmation | `/confirmation` | ✅ | ⏳ | [09](09-confirmation.md) |
| — | แผน PM/CM | `/planning` | ✅ | ⏳ | [08](08-dashboard-planning.md) |
| — | Master data | `/master-data` | ✅ | ⏳ | [02](02-master-data.md) |
| — | Manhours / Worktime | `/manhours`, `/worktime` | ✅ | ⏳ | [11](11-manhours-worktime.md) |
| — | Personnel | `/personnel`, `/personnel/confirm` | ✅ | ⏳ | [10](10-personnel.md) |
| — | IW37N | `/iw37n` | ✅ | ⏳ | [07](07-iw37n.md) |
| — | Reports | `/reports`, `/summary-weekly`, `/manhours-hr` | ✅ | ⏳ | [12](12-reports-summary.md) |
| — | Settings | `/settings` | ✅ | ⏳ | [01](01-auth.md) |
| — | Admin | `/admin/*` | ✅ | ⏳ | [14](14-administrator.md) |
| — | User log | `/user-log` | ✅ | ⏳ | [02](02-master-data.md) · [01](01-auth.md) |

---

#### Dashboard — `/` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — การ์ดสรุปจาก PG + ลิงก์โมดูล · ไม่ clone SB Admin demo ของ PHP |
| PHP | `index2.php` โหลด [`content.php`](../../sap/pages/content.php) — **template demo** (ไม่มี KPI ธุรกิจจริง) |
| PHP (member) | `login-bk` → `module=info` — เทียบ React **`/`** หลัง login member |
| API React | `GET /api/v1/dashboard/summary` — นับ WO เปิด/ปิด, รอจ่ายงาน (ไม่มีแผนใน `tbplangingwork`), ลิงก์ไปโมดูล |
| หน้า FE | [`HomePage.tsx`](../../PM-Pepsi-App/frontend/src/features/home/HomePage.tsx) — การ์ด KPI + กริดลิงก์ `/calendar`, `/work-orders`, `/planning`, … |
| เมนู | migration [`031_dashboard_menu_all_roles.sql`](../../database/migrations/031_dashboard_menu_all_roles.sql) · `menuright` **A:U:W** |
| ไม่ทำใน `/` | กราฟ Technician/Summary แบบ `W_summary_weekly*` → ย้ายไป **`/reports`** ✅ |
| หมายเหตุ login | WC หลัง login ไป **`/plan-calendar`** (0A) ไม่ใช่ `/` — Dashboard เป็น home ทั่วไป + member |
| UAT ขั้น 5 | ตัวเลขการ์ดตรง DB; คลิกลิงก์ไปแต่ละโมดูล; member login ลง `/` |

#### Plan Calendar — `/plan-calendar` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — ขั้น 0A + P0 · [`08-dashboard-planning.md`](08-dashboard-planning.md) |
| PHP | `index.php?module=M_plan_calendar` → [`M_plan_calendar.php`](../../sap/pages/M_plan_calendar.php) |
| API React | `GET /api/v1/plan-calendar/events` · assign/close ใน dialog |
| หน้า FE | [`PlanCalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/plan-calendar/PlanCalendarPage.tsx) |
| Login | redirect WC → `/plan-calendar` (§3.4 ✅ 0A) |
| เมนู DB | migration **074** ไฟล์ ✅ · **รันบน PG** ⏳ (ดู §3.4) |
| UAT ขั้น 5 | login WC → หน้านี้; จ่ายงาน/ปิดงานเทียบ PHP |

#### Work Scheduling — `/calendar` (+ `/calendar/wc/:code`) ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — filter + events + move-plan + WO dialog · [`04-work-calendar.md`](04-work-calendar.md) |
| PHP | `index.php?module=calendar` → [`calendar.php`](../../sap/pages/calendar.php) + include [`M_filter_iw37.php`](../../sap/pages/M_filter_iw37.php) |
| ข้อมูลหลัก | `view_order` / `tbiw37n` — ปฏิทินใบงานตาม filter |
| API React | `GET/POST /api/v1/calendar/filter-options`, `GET/POST /api/v1/calendar/events` |
| Modal | คลิก event → [`ModalOrderDetail.php`](../../sap/modalPages/ModalOrderDetail.php) → **`WorkOrderDetailDialog`** |
| ย้ายแผน | `MovePlant.php` → `POST /api/v1/scheduling/move-plan` + DnD บนปฏิทิน |
| Filter | รวมใน calendar page (ไม่มี route `/filter` แยก) — เทียบ `M_filter_iw37` |
| Route WC | `/calendar/wc/:code` — โฟกัส work center (ไม่มีใน PHP module string เดียว) |
| UAT ขั้น 5 | ฟิลเตอร์, ลากย้ายแผน, เปิดรายละเอียด WO |

#### Line Scheduling — `/line-calendar` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — events + create/edit + DnD + CRUD/import ใน `/master-data` · [`03-line-calendar.md`](03-line-calendar.md) |
| PHP | `index.php?module=line_calendar` → [`line_calendar.php`](../../sap/pages/line_calendar.php) |
| ข้อมูลหลัก | `tblineschdul` / `view_lineschdul` — ตารางเวลาเส้นผลิต (uptime รายวัน) |
| API React | `GET /api/v1/line-calendar/events?year=&month=` |
| หน้า FE | [`LineCalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/line-calendar/LineCalendarPage.tsx) |
| CRUD master | แท็บ Line ใน `/master-data` → `POST/PUT/DELETE .../lineschdul`, import |
| เห็นเมนู | A, U, W (menuright `A:U:W`) — ช่าง W ใน PHP bk เห็นเป็น "Line Scheduling" |
| UAT ขั้น 5 | สร้าง/แก้ slot เส้น, ลาก (ถ้ามี), เทียบสี/วันกับ PHP |

#### BackLog — `/backlog` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — [`05-backlog.md`](05-backlog.md) |
| PHP | `index.php?module=backlog` → [`backlog.php`](../../sap/pages/backlog.php) |
| ข้อมูลหลัก | `view_order` — งานค้าง / แผนที่ยังไม่จ่ายตาม filter |
| API React | `GET /api/v1/backlog/filter-options`, `POST /api/v1/backlog/events`, `POST .../filter-detail`, `POST .../manhour-summary` |
| Modal | `FilterDetail.php`, `ModalMHshow.php` — สรุป filter + manhour ช่วงวัน |
| Team | `FilterDetail_AddTeam` → team A/B/P + [`AddTeam.php`](../../sap/modalPages/AddTeam.php) |
| UAT ขั้น 5 | ปฏิทิน backlog, filter-detail, เลือกช่วงวัน manhour |

#### Work Order — `/work-orders` (+ `/work-orders/:id`) ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — ค้นหา/ฟิลเตอร์ + ตารางสถานะ + team + **`WorkOrderDetailDialog`** ครบแท็บ · [`06-work-orders-master-filters.md`](06-work-orders-master-filters.md) |
| PHP | `index2.php?module=workorder` → [`workorder.php`](../../sap/pages/workorder.php) + `M_filter_iw37` |
| ข้อมูลหลัก | `view_order` — ค้นหา/กรอง WO แบบตาราง + เปิดรายละเอียด |
| API React | `GET /api/v1/work-orders`, `POST .../search`, `GET .../:id`, `GET .../:id/modal-detail`, `PUT .../team`, planning APIs |
| Dialog | **`WorkOrderDetailDialog`** — แท็บ WO / Task / Machine / Planning / Material / Confirm |
| Deep link | `/work-orders/:id` — เปิดรายการโดยตรง (PHP มักเปิดผ่าน modal จาก calendar) |
| UAT ขั้น 5 | ค้นหา, ตั้ง Team, เปิด modal ครบแท็บ |

#### Confirmation — `/confirmation` (+ `/confirmation/export`) ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — หน้า admin + ปิดงานใน dialog + personnel close (073) · [`09-confirmation.md`](09-confirmation.md) |
| PHP (Admin) | `index2.php?module=M_confirmation` → [`M_confirmation.php`](../../sap/pages/M_confirmation.php), import/export [`M_Confirm*`](../../sap/pages/) |
| PHP (ช่าง W ใน bk) | เมนูชื่อ "Confirmation" ชี้ **`W_planwork_view`** — **ไม่ใช่** `M_confirmation` (คนละ flow) |
| React | **`/confirmation`** = หน้ารับรองงาน admin (list + import/export) — [`ConfirmationParityPage`](../../PM-Pepsi-App/frontend/src/features/parity/SidebarParityPages.tsx) |
| ปิดงานจริง | แท็บ Confirm ใน **`WorkOrderDetailDialog`** + `POST /api/v1/confirmation/:idiw37/close` (เทียบ `AddClose`, `confirmTab*`) |
| API | `GET .../confirmation/by-wkorder`, comments, images, export `.xlsx` |
| menuright | `A:U:W` ใน React fallback — แต่ import/export มักต้องสิทธิ์ admin (`confirmation.import`) |
| UAT ขั้น 5 | ปิดงานจาก dialog, ดูรายการ confirm, export (ถ้ามีสิทธิ์) |

#### แผน PM/CM — `/planning` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — ตารางแผน + DnD บางส่วน · 08 |
| PHP | `M_planwork_view` / `W_planwork_view` (เมนูช่างชื่อ Confirmation) |
| API React | planning APIs ร่วมกับ work-orders / WO dialog |
| หน้า FE | [`PlanningPage.tsx`](../../PM-Pepsi-App/frontend/src/features/planning/PlanningPage.tsx) |
| menuright | **A** (admin ตาราง) · ช่าง U/W ใช้ flow เดียวกันผ่านเมนู bk |
| UAT ขั้น 5 | ตารางแผน, multi-assign, เทียบ `W_planwork_view` |

#### Master data — `/master-data` (+ `/admin/master` hub) ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — 17 แท็บ CRUD/import ต่อ PostgreSQL · [`02-master-data.md`](02-master-data.md) |
| PHP | `M_activitytype*`, `M_department*`, `M_equipment*`, `M_functional*`, `M_reason*`, `M_workstatus*`, `M_worktype*`, `M_zb*`, `M_lineproduct*`, `M_zone*`, `M_machine*`, `M_material*`, `M_level*`, `M_position*`, `M_Group*`, `M_tasklist*`, `M_lineschdul*` (เมนูย่อยใน bk Admin) |
| Route | **`/master-data`** — hub แท็บ · **`/admin/master`** — ลิงก์เข้าแท็บ (`?entity=`) · **`/user-log`** แยก route (ไม่ใช่แท็บใน hub) |
| RBAC | `master-data.read` · แก้/ลบ/นำเข้า `master-data.write` |
| menuright | **A** (Admin — Import SAP / Config ใน bk) |
| API | `GET/POST/PUT/DELETE /api/v1/master-data/{entity}` + `POST .../import` (หลาย entity) — ดูรายการใน 02 |
| หน้า FE | [`MasterDataPage.tsx`](../../PM-Pepsi-App/frontend/src/features/master-data/MasterDataPage.tsx) · Activity type: [`ActivityTypePanel.tsx`](../../PM-Pepsi-App/frontend/src/features/master-data/ActivityTypePanel.tsx) |
| แท็บต่อ DB | activitytype, department, equipment, functional, reason, workstatus, worktype, zb, level, position, group, tasklist, lineproduct, lineschdul, zone, machine, material — badge **API + DB** |
| Hub admin | [`AdminMasterHubPage.tsx`](../../PM-Pepsi-App/frontend/src/features/admin/master/AdminMasterHubPage.tsx) → `/master-data?entity=` |
| ที่ยังแยก | **`/user-log`** — route แยกจาก hub master (ดู §3.2 User Log) |
| UAT ขั้น 5 | แต่ละแท็บ: CRUD + import ไฟล์ (skip 2 แถวตาม PHP); เทียบ validation/error กับ legacy |

#### Manhours & Worktime — `/manhours` · `/worktime` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — [`11-manhours-worktime.md`](11-manhours-worktime.md) |
| PHP | `M_manhour`, `W_worktime_view` |
| Route | `/manhours`, `/manhours/admin`, `/worktime` |
| API | `GET /api/v1/manhours/*`, `GET /api/v1/worktime/me` |
| UAT ขั้น 5 | บันทึกชั่วโมง, import, worktime 2 แท็บ |

#### Settings — `/settings` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — โปรไฟล์ + เปลี่ยนรหัสผ่าน (ขั้น 4) · [`01-auth.md`](01-auth.md) |
| PHP | `user`, `member_change_password*` |
| API | `POST /api/v1/auth/change-password` |
| UAT ขั้น 5 | เปลี่ยนรหัสผ่าน WC/member |

#### Administrator — `/admin/*` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ ~90% — โซนใหม่ (ไม่มี PHP module เดียว) · Phase A–F + CHECKLIST §0–§14 ส่วนใหญ่ปิด · [`14-administrator.md`](14-administrator.md) |
| PHP | ไม่มี Admin Console แบบ React — ฟังก์ชันกระจายในเมนูย่อย bk (`M_*` master, `M_confirmation`, config ฯลฯ) |
| Route | **`/admin`** (Console) · **`/admin/users`** · **`/admin/roles`** · **`/admin/menu`** · **`/admin/branding`** · **`/admin/settings`** · **`/admin/audit`** · **`/admin/health`** · **`/admin/backup`** · **`/admin/announcements`** · **`/admin/security`** · **`/admin/about`** · **`/admin/master`** → `/master-data?entity=` |
| RBAC | `admin.*.read` / `admin.*.write` ต่อหน้า — ไม่ใช่ `userst='A'` อย่างเดียว (`requirePermission` + JWT `permissions[]`) |
| หน้า FE | [`AdminLayout`](../../PM-Pepsi-App/frontend/src/features/admin/AdminLayout.tsx) + หน้าย่อยใน [`features/admin/`](../../PM-Pepsi-App/frontend/src/features/admin/) |
| API | `GET/PUT /api/v1/admin/*` — settings, branding, users, roles, menu, audit, health, backup, announcements, security, about |
| ค้างแกน (~10%) | Docker container metrics ใน Health · **track E** deploy/docker-compose · Playwright/E2E CI env |
| UAT ขั้น 5 | Login `ADMIN01` · branding reload ทั้งแอป · backup บน D: · restore (staging) · roles matrix · ดู [14 §15](14-administrator.md) |

#### User Log — `/user-log` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — บันทึก login/logout + ตารางอ่าน log ของผู้ใช้ที่ล็อกอิน · [02-master-data.md](02-master-data.md) |
| PHP | [`M_UserLog.php`](../../sap/pages/M_UserLog.php) — ตาราง login/logout ของ session ปัจจุบัน |
| ข้อมูลหลัก | `app.tbworkcenter_userlog` (WC) · `app.tbl_system_userlog` (member) — เขียนตอน login/logout ใน [`auth.ts`](../../PM-Pepsi-App/backend/src/services/auth.ts) |
| API React | `GET /api/v1/user-log?limit=&offset=` — รายการของ user ปัจจุบัน (`user-log.read`) |
| หน้า FE | [`UserLogPage.tsx`](../../PM-Pepsi-App/frontend/src/features/user-log/UserLogPage.tsx) — คอลัมน์ Date, Status, userIp, myIp |
| เมนู | migration [`025_tbmenu_userlog.sql`](../../database/migrations/025_tbmenu_userlog.sql) · `nav-config` **A:U:W** (ไม่มีใน `left_menu_bk` เก่า) |
| หมายเหตุ | ไม่ใช่ Admin Audit (`/admin/audit`) — audit ระบบกว้างกว่า |
| UAT ขั้น 5 | Login → logout → เปิด `/user-log` เห็นแถว login/logout · IP ตรง PHP (dev localhost อาจเป็น `127.0.0.1`) |

#### IW37N — `/iw37n` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — import + batches + items CRUD + export CSV · [`07-iw37n.md`](07-iw37n.md) |
| PHP | `index2.php?module=M_iw37n` → [`M_iw37n.php`](../../sap/pages/M_iw37n.php), ฟอร์ม [`M_iw37n_form.php`](../../sap/pages/M_iw37n_form.php), นำเข้า [`M_iw37n_imports.php`](../../sap/pages/M_iw37n_imports.php) |
| ข้อมูลหลัก | `tbiw37n` (upsert คู่ `wkorder`+`opac`), batch log `tbiw37n_import_batch` / `tbiw37n_import_row` |
| RBAC | `iw37n.read` · แก้/ลบ `iw37n.write` · อัปโหลด `iw37n.import` |
| menuright | **A** เท่านั้น (Admin — ใต้ Import Data SAP ใน bk) |
| API React | `POST /api/v1/iw37n/import` (multipart) · `GET /api/v1/iw37n/batches` · `GET .../batches/:id/rows` · `GET .../batches/:id/export.csv` · `GET /api/v1/iw37n/items` · `GET/PUT/DELETE .../items/:id` |
| หน้า FE | [`Iw37nPage.tsx`](../../PM-Pepsi-App/frontend/src/features/iw37n/Iw37nPage.tsx) — อัปโหลด, ประวัติ batch, ผลรายแถว, แก้รายการ, ดาวน์โหลด log CSV |
| Parser | [`iw37n-parser.ts`](../../PM-Pepsi-App/backend/src/services/iw37n-parser.ts) — ข้าม 2 แถวแรก, แมปคอลัมน์เทียบ PHP, คำนวณ `syst` จาก `systemstatus`, SHA256 กันซ้ำไฟล์ |
| หลัง import | Invalidate query ปฏิทิน/WO — ข้อมูลไป `view_order` / calendar / backlog |
| ไฟล์ตัวอย่าง | [`IW37N.xlsx`](../../IW37N.xlsx), legacy [`sap/download/iw37n.xlsx`](../../sap/download/iw37n.xlsx) |
| Parity doc | [`07-iw37n.md`](07-iw37n.md) |
| UAT ขั้น 5 | อัปโหลด xlsx จริง, ตรวจ inserted/updated/skipped, แก้แถวเดียว, เปิด WO บนปฏิทินหลัง import |

#### Personnel — `/personnel` (+ `/personnel/confirm`, admin) ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — dashboard + confirm + CRUD ผ่าน `/admin/users` · [`10-personnel.md`](10-personnel.md) |
| PHP (CRUD) | `M_personel` → [`M_personel.php`](../../sap/pages/M_personel.php), [`M_personel_form.php`](../../sap/pages/M_personel_form.php), [`M_personel_imports.php`](../../sap/pages/M_personel_imports.php) |
| PHP (ยืนยันรายคน) | `M_personel_confirm` → [`M_personel_confirm.php`](../../sap/pages/M_personel_confirm.php), [`M_personel_confirm_form.php`](../../sap/pages/M_personel_confirm_form.php) — เปิด confirm ต่อ WO |
| PHP (เมนูย่อย master) | ใน bk: `M_level`, `M_department`, `M_position`, `M_Group` — รวม lookup ใน React master/personnel admin |
| ข้อมูลหลัก | `tbworkcenter` (+ รูป WebP ใน DB), `view_planwork`, `tbcofirm`/`tbiw37n`, `view_countpersonelclose` (หน้า confirm) |
| **Route React** | **`/personnel`** — Personal Dashboard · **`/personnel/confirm`** — Personnel Confirmation (Admin) · **`/personnel/admin`** → redirect **`/admin/users`** ([`App.tsx`](../../PM-Pepsi-App/frontend/src/App.tsx)) |
| RBAC | Dashboard `personnel.read` · Confirm `personnel.confirm.read` · CRUD `personnel.write` (API admin) · รูป `GET /api/v1/personnel/:id/image` |
| menuright | Dashboard: **`A:U:W`** (nav-config / migration 034) · Confirm + admin menu: **`A`** |
| API — Dashboard | `GET /api/v1/personnel/me/dashboard` — โปรไฟล์ + สรุปงานเปิด/ปิด + confirmation + worktime (เทียบ `worktime_count.php`) |
| API — Admin CRUD | `GET/POST /api/v1/personnel/admin`, `GET/PUT/DELETE .../admin/:idwkctr`, `POST .../import`, `POST/DELETE .../image`, `GET .../workstatus-options` |
| API — Confirm list | `GET /api/v1/personnel/admin/confirm?q&status&syst&limit&offset` — % ปิดต่อ WO (`view_countpersonelclose`) |
| หน้า FE | [`PersonnelPage.tsx`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx) · [`PersonnelConfirmPage.tsx`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelConfirmPage.tsx) · จัดการ WC: [`AdminUsersPage`](../../PM-Pepsi-App/frontend/src/features/admin/users/AdminUsersPage.tsx) (แทน `PersonnelAdminPage` โดยตรง) |
| Modal / dialog | Confirm จากตาราง confirm → **`WorkOrderDetailDialog`** `initialTab="confirm"` (เทียบ `confirmTab1/3/4.php`) |
| Parity doc | [`10-personnel.md`](10-personnel.md) |
| UAT ขั้น 5 | Login ช่าง → dashboard ของตัวเอง; Admin → import Excel บุคลากร, อัปโหลดรูป WebP; Confirm → กรองสถานะ % ปิด, เปิด WO แท็บ Confirm |

#### Reports — `/reports` · `/summary-weekly` · `/manhours-hr` ✅

| หัวข้อ | ค่า |
|--------|-----|
| **สถานะแกน** | ✅ เสร็จ — KPI + สรุปสัปดาห์ + fullscreen chart + Manhour HR · [`12-reports-summary.md`](12-reports-summary.md) |
| PHP — รายงานรวม (Admin) | `report_backlog`, `report_pm`, `report_peatime`, `report_technician` (เมนูย่อยใน bk — โมดูลแยกใน legacy) |
| PHP — สรุปสัปดาห์ | [`W_summary_weekly.php`](../../sap/pages/W_summary_weekly.php), กราฟ [`W_summary_weekly_chart.php`](../../sap/pages/W_summary_weekly_chart.php), [`W_summary_weekly_chart2.php`](../../sap/pages/W_summary_weekly_chart2.php), fullscreen `_chart_full` / `_chart2_full` |
| PHP — Manhour HR | [`W_manhours_hr.php`](../../sap/pages/W_manhours_hr.php) — ตาราง manhour ทุกคนใน WC เดียวกับผู้ login |
| ข้อมูลหลัก | `tbmanhours`, `view_order` (backlog open), `view_confirmation` / `tbcofirm`, ช่วงวัน `workday` / `bscstart` / `endate` |
| **Route React** | **`/reports`** — KPI + Chart.js · **`/summary-weekly`** — ตาราง + กราฟ utilization · **`/summary-weekly/chart/full?variant=chart\|chart2`** — กราฟเต็มจอ (ไม่มี sidebar) · **`/manhours-hr`** — ตาราง HR ต่อ WC |
| RBAC | `/reports`, `/summary-weekly` → `reports.read` · `/manhours-hr` → `manhours.read` (map เดียวกับ worktime) |
| menuright | `/reports` → **A** · `/summary-weekly`, `/manhours-hr` → **A:U:W** (ช่าง U/W เห็นใน bk) |
| API React | `GET /api/v1/reports/kpi?from=&to=` · `GET /api/v1/reports/summary-weekly?from=&to=` · `GET /api/v1/manhours/hr` (กรอง WC จาก session) |
| หน้า FE | [`ReportsPage.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/ReportsPage.tsx) · [`SummaryWeeklyPage.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/SummaryWeeklyPage.tsx) · [`SummaryWeeklyChartFullPage.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/SummaryWeeklyChartFullPage.tsx) · [`ManhoursHrPage.tsx`](../../PM-Pepsi-App/frontend/src/features/manhours/ManhoursHrPage.tsx) |
| Filter ช่วงวัน | [`ReportsDateFilter.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/ReportsDateFilter.tsx) — `from`/`to` ใน query + fullscreen URL |
| กติกาธุรกิจ | KPI: utilization = Confirm/HR manhour, backlog จาก open WO · สรุปสัปดาห์: %PM / %Reactive / %RCA ตาม `W_summary_weekly.php` |
| Parity doc | [`12-reports-summary.md`](12-reports-summary.md) · Manhour HR รายละเอียดใน [`11-manhours-worktime.md`](11-manhours-worktime.md) |
| UAT ขั้น 5 | เลือกช่วงวันที่ทั้ง 3 หน้า; เทียบตัวเลขสรุปสัปดาห์กับ PHP; Manhour HR ตรง WC; เปิดกราฟ fullscreen แท็บใหม่ |

---

### 3.3 กลุ่ม sidebar อื่น (สรุป + อ้างอิง parity)

โครงกลุ่มตรง [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) (หลัง §3.1). คอลัมน์ **seed** = [`008_auth_tbmenu_member.sql`](../../database/migrations/008_auth_tbmenu_member.sql) + [`074`](../../database/migrations/074_plan_calendar_menu.sql) ถ้ามีใน DB.

**ความต่าง PHP สองแบบ**

| แบบ | ไฟล์ | พฤติกรรม |
|-----|------|----------|
| **เมนู DB** | [`left_menu.php`](../../sap/pages/left_menu.php) | อ่าน `tbmenu` กรอง `menuright` กับ `$_SESSION['UserST']` (A/U/W) |
| **เมนู hardcode** | [`left_menu_bk17052563.php`](../../sap/pages/left_menu_bk17052563.php) | แยกบล็อกตาม UserST — ไม่มี `/plan-calendar` แยก (redirect ไป `M_plan_calendar` แทน) |

React ใช้ **`GET /api/v1/nav/menu`** → [`use-app-nav.ts`](../../PM-Pepsi-App/frontend/src/lib/use-app-nav.ts) → `filterNavForUser` + JWT `permissions` (มีสิทธิ์แล้วใช้ RBAC เป็นหลัก)

---

#### กลุ่ม «แผน & นำเข้า SAP»

| สถานะ | เมนู React | Route | RBAC | seed menuright | PHP module (หลัก) | Parity |
|-------|------------|-------|------|----------------|-------------------|--------|
| ✅ | แผน PM/CM | `/planning` | `planning.read` | `A` | `M_planwork_view` (ตารางแผน) | [`08-dashboard-planning.md`](08-dashboard-planning.md) |
| ✅ | IW37N | `/iw37n` | `iw37n.read` | `A` | `M_iw37n`, import SAP | [`07-iw37n.md`](07-iw37n.md) |
| ✅ | ข้อมูลหลัก | `/master-data` | `master-data.read` | `A` | `M_activitytype`, `M_equipment`, `M_zone`, … (รวมใน master hub) | [`02-master-data.md`](02-master-data.md) |
| ✅ | Master (admin hub) | `/admin/master` | `master-data.read` | — (RBAC admin) | ลิงก์เข้า `/master-data?entity=` | [`14-administrator.md`](14-administrator.md) |

**PHP Admin (`UserST=A`)** — เมนูย่อยใน bk: Import Data SAP (IW37N, tasklist, lineschdul, manhour, equipment, …), Config System (reason, workstatus, worktype, zb).

**หมายเหตุ `W_planwork_view`:** ช่าง/ผู้ใช้ U ใน bk เห็นเมนูชื่อ **Confirmation** และ **View Plan Work** แต่ทั้งคู่ชี้ module เดียว → React แยกเป็น **`/planning`** (ตารางแผน) ไม่ใช่ **`/confirmation`** (admin `M_confirmation`) — ดู §3.2 Confirmation

---

#### กลุ่ม «ชั่วโมง & บุคลากร»

| สถานะ | เมนู React | Route | RBAC | seed / nav-config menuright | PHP module | Parity |
|-------|------------|-------|------|----------------------------|------------|--------|
| ✅ | Manhours | `/manhours` | `manhours.read` | `A` | `M_manhour` | [`11-manhours-worktime.md`](11-manhours-worktime.md) |
| ✅ | จัดการ Man Hour (Admin) | `/manhours/admin` | `manhours.admin` | `A` (เฉพาะ nav-config) | `M_manhour` (admin UI) | 11 |
| ✅ | ดู Worktime ทั้งหมด | `/worktime` | `manhours.read` | `A:U:W` | `W_worktime_view` | 11 |
| ✅ | Personal Dashboard | `/personnel` | `personnel.read` | seed `A` · nav-config **`A:U:W`** | `M_personel` + ย่อย level/dept/position/group | [`10-personnel.md`](10-personnel.md) |
| ✅ | Personnel Confirmation | `/personnel/confirm` | `personnel.confirm.read` | `A` | flow ยืนยันบุคลากร (admin) | 10 |
| ✅ | ผู้ใช้งาน (WC+member) | `/admin/users` | `admin.users.read` | `A` | ไม่มีใน bk — RBAC ใหม่ | 14 |

---

#### กลุ่ม «รายงาน»

| สถานะ | เมนู React | Route | RBAC | menuright | PHP module | Parity |
|-------|------------|-------|------|-----------|------------|--------|
| ✅ | รายงานรวม | `/reports` | `reports.read` | `A` | `report_backlog`, `report_pm`, `report_peatime`, `report_technician` (รวมในหน้าเดียว) | [`12-reports-summary.md`](12-reports-summary.md) |
| ✅ | Manhour HR | `/manhours-hr` | `manhours.read` | `A:U:W` | `W_manhours_hr` | 12 |
| ✅ | สรุปรายสัปดาห์ | `/summary-weekly` | `reports.read` | `A:U:W` | `W_summary_weekly` | 12 |

---

#### กลุ่ม «ผู้ดูแลระบบ» + «ระบบ»

| สถานะ | เมนู React | Route | RBAC (ตัวอย่าง) | PHP เดิม | Parity |
|-------|------------|-------|-----------------|----------|--------|
| ✅ | `/admin`, `/admin/users`, `/admin/roles`, … | ตาม [`ADMIN_SECTIONS`](../../PM-Pepsi-App/frontend/src/lib/admin-sections.ts) | `admin.*` | ไม่มีใน `left_menu_bk` — โซนใหม่ | [`14-administrator.md`](14-administrator.md) |
| ✅ | User Log | `/user-log` | `user-log.read` | `M_UserLog` / `tbworkcenter_userlog` | [02](02-master-data.md) · [01](01-auth.md) |
| ✅ | ตั้งค่า (+ เปลี่ยนรหัสผ่าน) | `/settings` | `admin.settings.read` | `user`, `member_change_password*` | [`01-auth.md`](01-auth.md) |
| ✅ | Login / Logout | `/login`, `/logout` | — | `login`, `logout` / `login-bk` | 01-auth |

---

### 3.4 Redirect หลัง login (ขั้น 0A)

**การตัดสินใจ:** หลัง login **work center** ให้ไปหน้าจ่ายงาน (Plan Calendar) ไม่ใช่ line calendar หรือ dashboard อย่างเดียว

| สถานะ | ช่องทาง | PHP | React |
|-------|---------|-----|-------|
| ✅ | **Work center (0A)** | [`login.php`](../../sap/pages/login.php) บรรทัด 114 — **ทุก** `UserST` → `M_plan_calendar` | [`POST_LOGIN_PATH_WORKCENTER`](../../PM-Pepsi-App/frontend/src/features/auth/auth-paths.ts) = **`/plan-calendar`** |
| ✅ | **Member** | [`login-bk.php`](../../sap/pages/login-bk.php) → `?module=**info**` | `POST_LOGIN_PATH_MEMBER` = **`/`** |
| ✅ | **Deep link** | — | `resolvePostLoginPath` คืน `from` ถ้าไม่ใช่ `/login` |
| ✅ | **ไม่มีสิทธิ์ plan-calendar** | — | [`PostLoginGuard`](../../PM-Pepsi-App/frontend/src/features/auth/AuthGuards.tsx) → `allowedPaths[0]` |
| ✅ | **เมนู DB 074 (ไฟล์)** | — | [`074_plan_calendar_menu.sql`](../../database/migrations/074_plan_calendar_menu.sql) — INSERT/UPDATE `tbmenu` สำหรับ `/plan-calendar` |
| ⏳ | **รัน 074 บน PG เป้าหมาย** | — | Ops ต่อสภาพแวดล้อม: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/074_plan_calendar_menu.sql` |

**หมายเหตุเมนู vs redirect:** Redirect 0A ในโค้ด (**`/plan-calendar`**) ไม่ขึ้นกับ 074 — ทำงานได้ทันทีหลัง login WC  
ถ้ายัง**ไม่รัน** 074 บน DB: sidebar ยังมี `/plan-calendar` ผ่าน [`nav-config.ts`](../../PM-Pepsi-App/frontend/src/components/layout/nav-config.ts) + [`supplementNavFromFallback`](../../PM-Pepsi-App/frontend/src/lib/nav-menu-api.ts) · หลังรัน 074 เมนูมาจาก `GET /api/v1/nav/menu` (`tbmenu`) ตรง seed

**Flow React (สรุป)**

```mermaid
flowchart LR
  subgraph login [Login]
    WC[Tab Work center]
    MB[Tab Member]
  end
  WC --> PL["resolvePostLoginPath(..., workcenter)"]
  MB --> PM["resolvePostLoginPath(..., member)"]
  PL --> PC["/plan-calendar"]
  PM --> DH["/"]
  PC --> Guard[PostLoginGuard + RBAC nav]
  Guard -->|no planning.read| Alt[allowedPaths[0]]
```

**UAT ขั้น 5 (redirect):** login WC → ต้องลง `/plan-calendar`; login member → `/`; logout → `/login`

---

### 3.5 ใครเห็นเมนูอะไร (A / U / W + RBAC)

ใช้สามชั้น — อ่านร่วมกัน:

1. **`UserST` + `left_menu_bk`** — เมนูที่ PHP แสดงแบบ hardcode (อ้างอิง UAT เทียบ legacy UI)
2. **`menuright` ใน `tbmenu`** — กฎเดียวกับ `left_menu.php` (และ seed 008/074)
3. **RBAC ใน JWT** — กฎจริงของ React เมื่อมี `permissions[]` ([`nav-rbac.ts`](../../PM-Pepsi-App/frontend/src/lib/nav-rbac.ts), `rbacStrict` เมื่อมีสิทธิ์)

---

#### 3.5.1 ตาราง `left_menu_bk` (hardcode) — ✓ = มีลิงก์ใน bk

| เมนู (ชื่อใน bk) | PHP `module` | A | U | W | React ที่ map |
|------------------|--------------|---|---|---|----------------|
| Work Scheduling | `calendar` | ✓ | ✓ | ✓ | `/calendar` |
| BackLog Report | `backlog` | ✓ | ✓ | ✓ | `/backlog` |
| Line Scheduling | `line_calendar` | ✓ | ✓ | ✓ | `/line-calendar` |
| Work Order | `workorder` | ✓ | ✓ | ✓ | `/work-orders` |
| Confirmation (admin) | `M_confirmation` | ✓ | — | — | `/confirmation` |
| Confirmation (ช่าง/ผู้ใช้) | `W_planwork_view` | — | ✓ | ✓ | **`/planning`** (ไม่ใช่ `/confirmation`) |
| View Plan Work | `W_planwork_view` | — | ✓ | ✓ | `/planning` |
| View All Worktime | `W_worktime_view` | — | ✓ | ✓ | `/worktime` |
| Import SAP / Config / Personel (ย่อย) | `M_*` | ✓ | — | — | `/iw37n`, `/master-data`, `/personnel`, … |
| Report ย่อย (backlog, PM, …) | `report_*` | ✓ | — | — | `/reports` |
| Manhour HR / Summary Weekly | `W_manhours_hr`, `W_summary_weekly` | ✓¹ | ✓ | ✓ | `/manhours-hr`, `/summary-weekly` |

¹ Admin bk ใส่รายงานทั้งใต้ collapse **Report** และซ้ำใน heading รายงาน (ช่าง W มี heading รายงานซ้ำ 2 ชุดในไฟล์เดิม)

**ไม่มีใน bk แต่มีใน React + login redirect**

| สถานะ | รายการ | หมายเหตุ |
|-------|--------|----------|
| ✅ | **Plan Calendar** `M_plan_calendar` | Redirect หลัง login WC; route + API; migration **074** (โค้ด ✅) |
| ✅ | **Dashboard** `/` | [`HomePage`](../../PM-Pepsi-App/frontend/src/features/home/HomePage.tsx) + `dashboard/summary` — กราฟรายงานอยู่ `/reports` |
| ✅ | **Admin console** `/admin/*` | RBAC ใหม่ — แกน ~90% · UAT ⏳ |
| ✅ | **User log** `/user-log` | แกน ✅ — มีใน nav-config (`A:U:W`); ไม่มีใน `left_menu_bk` เก่า · UAT ⏳ |

---

#### 3.5.2 ตาราง `menuright` (seed `app.tbmenu` + nav-config)

| `react_route` | menuright (seed 008/074) | A | U | W |
|---------------|--------------------------|---|---|---|
| `/` | A:U:W | ✓ | ✓ | ✓ |
| `/plan-calendar` | A:U:W (074) | ✓ | ✓ | ✓ |
| `/calendar`, `/line-calendar`, `/backlog`, `/work-orders`, `/confirmation` | A:U:W | ✓ | ✓ | ✓ |
| `/planning`, `/iw37n`, `/master-data`, `/manhours`, `/reports`, `/settings` | **A** | ✓ | ✗ | ✗ |
| `/worktime`, `/manhours-hr`, `/summary-weekly` | A:U:W | ✓ | ✓ | ✓ |
| `/personnel` | seed **A** · fallback nav-config **A:U:W** | ✓ | ขึ้น DB/ fallback | ขึ้น DB/ fallback |
| `/personnel/confirm`, `/manhours/admin` | A (nav-config) | ✓ | ✗ | ✗ |
| `/admin/*` | A (ผ่าน RBAC ไม่ใช่ menuright ใน seed) | ✓ | ✗ | ✗ |
| `/user-log` | A:U:W (nav-config; ไม่มีใน seed 008) | ✓ | ✓ | ✓ |

---

#### 3.5.3 ตัวอย่าง RBAC → เมนูที่เหลือ (React)

จาก [`nav-rbac.test.ts`](../../PM-Pepsi-App/frontend/src/lib/nav-rbac.test.ts) — เมื่อ JWT มี permissions จะกรองแบบ strict

| โปรไฟล์ | `userst` | permissions ตัวอย่าง | เมนูที่ยังเห็น (ไม่ครบทุก route) |
|---------|----------|----------------------|----------------------------------|
| Planner | `U` | `planning.read`, `calendar.read`, `backlog.read`, `personnel.read`, … | `/planning`, `/calendar`, `/backlog`, `/personnel` — **ไม่**เห็น `/iw37n`, `/admin/*` |
| Technician | `W` | `calendar.read`, `work-orders.read`, `confirmation.read`, … | `/calendar`, `/work-orders`, `/confirmation` — **ไม่**เห็น `/planning`, `/iw37n` |
| Manager | `H`¹ | `confirmation.*`, `planning.read`, … | `/confirmation` ได้ — **ไม่**เห็น `/admin/roles` |
| Admin | `A` | `admin.settings.read`, `admin.branding.read`, … | เฉพาะรายการที่มี permission (ไม่ใช่ “เห็นทุก admin” โดยอัตโนมัติ) |

¹ `H` = สถานะใน master บุคลากร — **ไม่มีใน PHP `UserST`** แต่ใช้ใน RBAC React; ถ้าไม่มี JWT permissions จะ fallback ตาม `menuright` ของ `userst` ที่ parse ได้ (A/U/W)

**สรุปเชิง UAT**

| บทบาท | ควรทดสอบ sidebar |
|--------|------------------|
| **ช่าง W** | plan-calendar, calendar, backlog, line, work-orders; **ไม่**คาดหวัง iw37n/master/admin; ปิดงานผ่าน WO dialog + อาจเข้า `/confirmation` ถ้ามีสิทธิ์ |
| **ผู้ใช้ U** | เหมือน W ใน bk + อาจมี `/planning` ถ้า role ใน PG ให้ `planning.read` |
| **Admin A** | ครบตาม role matrix ใน Admin → Roles; เทียบเมนูย่อย master/IW37N กับ bk |

---

#### 3.5.4 เมนูหาย / ไม่ตรง PHP

| อาการ | แก้ / ตรวจ |
|--------|-----------|
| ไม่มี **Plan Calendar** ใน sidebar (API) | รัน [`074_plan_calendar_menu.sql`](../../database/migrations/074_plan_calendar_menu.sql) บน PG — หรือใช้ fallback [`supplementNavFromFallback`](../../PM-Pepsi-App/frontend/src/lib/nav-menu-api.ts) จาก `nav-config` ชั่วคราว |
| Sidebar ว่าง | API `nav/menu` ล้ม → ใช้ `getFallbackNav()` |
| เห็นเมนูแต่เข้าแล้ว 403 | Route guard + `NAV_ROUTE_PERMISSION` — ต้องใส่ permission ใน role |
| ช่างเห็น **Confirmation** ใน PHP แต่ React เปิด `/planning` | ตั้งใจ — ชื่อเมนู legacy ไม่ตรง route admin |

---



## 4) งานคิว — สถานะหลังขั้น 0–4 ✅



### P0 — ใช้ production / login ✅

| # | สถานะ | PHP | งาน |
|---|--------|-----|-----|
| 1 | ✅ | `M_plan_calendar.php` | `/plan-calendar`, `GET /api/v1/plan-calendar/events`, dialog assign/close |
| 2 | ✅ | Login redirect 0A | `POST_LOGIN_PATH_WORKCENTER = '/plan-calendar'` |



### P1 — Modal / flow §5 ✅ (ขั้นที่ 3)

| สถานะ | PHP modal | React / API |
|--------|-----------|-------------|
| ✅ | `ChackStatus.php` | `WorkOrderWorkflowSteps` + suffix บน calendar/backlog/plan-calendar |
| ✅ | `AddTeam.php` | `PUT /work-orders/:id/team` + dialog |
| ✅ | `FilterDetail_AddTeam.php` | `/backlog` + `/work-orders` `filter-detail` |
| ✅ | `AddClose.php` | Confirm → Close Work (`tbcofirm`) |
| ✅ | `AddClosePersonel.php` | Personnel Close (`tbwrkclose`, migration 073) |
| ✅ | `ShowPlan.php` / `ShowPlanGroup.php` | Planning tab ตารางรายบุคคล/กลุ่ม |
| ✅ | `AddPlan.php` | `PlanningMultiAssign` + batch assign |
| ✅ | `MovePlant.php` | `POST /scheduling/move-plan` + DnD |
| ✅ | `confirmTab*` / `plan_confirmTab*` / `submit_upload_file` / `ShowClose` / `ShowImgUpload` | `WorkOrderDetailDialog` Confirm — close list + images (เทียบ `confirmTab2`/`confirmTab3`) |
| ✅ | `TabWorkOrder` … `TabMaterial` | `WorkOrderDetailDialog` ครบ + Confirm tab |
| ✅ | `ModalOrderDetail.php` | `WorkOrderDetailDialog` + `modal-detail` API |
| ✅ | `ShowClose.php` | fragment ใน `confirmTab2` → แท็บ Confirm **Close Work** (`GET confirmation/by-wkorder`, ลบ `idclose`) |
| ✅ | `ShowImgUpload.php` | fragment ใน `confirmTab3` → แท็บ Confirm **Images** (upload/list/preview/delete `confirmation/images*`) |
| — | `W_calendar.php`, `W_calendar_wkctr.php` | **ไม่พอร์ต** — หน้า FullCalendar ฝั่งช่าง (duplicate) → ใช้ **`/plan-calendar`** (login WC) + **`/calendar`** + `WorkOrderDetailDialog` |
| ✅ | `W_confirm_*` (`pages/`) | รวมใน **`WorkOrderDetailDialog`** แท็บ Confirm + **`/planning`** / **`/confirmation`** (checklist §4 แถว `W_confirm_*` = เสร็จ) |
| — | utility §5 · UI helper (`select_*`, `show_form`, `tables`, `tabs` …) | demo/fragment เก่า → ฟิลเตอร์จริงใน **`/calendar`**, **`/work-orders`** |
| — | utility §5 · `view_confirm`, `view_planwork` | นิยาม SQL view — ข้อมูลผ่าน **`/confirmation`**, **`/planning`**, **`/plan-calendar`**, **`/personnel`** |
| — | utility §5 · `W_add_image*` | รวม Confirm Images ใน **`WorkOrderDetailDialog`** + `confirmation/images*` |
| — | utility §5 · `W_calc_*` | **`/worktime`**, **`/manhours`**, `GET /personnel/me/dashboard` |
| — | utility §5 · `user*`, `user_profile` | **`/settings`** (เทียบ P2 — ไม่ clone tab PHP) |
| — | utility §5 · `worktime_view`, `worktime_count`, `W_worktime_count` | **`/worktime`** + personnel/manhours API (ซ้ำ `W_worktime_view` ที่เสร็จแล้ว) |

> **Checklist §4:** แถวไฟล์เดียวกันใน [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) = **ข้าม** · สรุปกลุ่มใน §5.1



### P2 — Auth / shell ✅ (ขั้นที่ 4)

| สถานะ | PHP | React |
|--------|-----|-------|
| ✅ | `member_change_password.php` / `_process.php` | `POST /api/v1/auth/change-password` + [`ChangePasswordForm.tsx`](../../PM-Pepsi-App/frontend/src/features/settings/ChangePasswordForm.tsx) |
| — | `password.php` | **SB Admin demo** “Password Recovery” — HTML ล้วน ไม่มี `POST`/session/เมนู `index2.php`; ลิงก์ใน `login.php` ถูกคอมเมนต์ — **ไม่พอร์ต** forgot-email flow |
| ✅ | (เปลี่ยนรหัส production) | เทียบ **`member_change_password*`** → **`/settings`** + `POST /api/v1/auth/change-password` (ไม่ใช่ `password.php`) |
| ✅ | บัญชี `member` จำกัด API | RBAC + menuright — [`01-auth.md`](01-auth.md) |
| ✅ | `navbar.php` | `AppNavShell` / command palette |
| ✅ / — | `user.php`, `user_form*` | `/settings` ✅ · legacy form tabs — |



### P3 — รายงาน / หน้าเสริม ✅ (ข้าม / รวม route แล้ว)

| สถานะ | PHP | React / API |
|--------|-----|-------------|
| — | `worktime_view.php` | ร่างซ้ำ **`W_worktime_view.php`** (query `tbplangingwork`+`view_workcenter` เหมือนกัน แต่อ้างคอลัมน์ `tbiw37n.*` โดยไม่ JOIN — หน้าเสีย) · `$tbl_policy=view_confrim` ไม่ได้ใช้ใน query · **ไม่มี** `?module=worktime_view` ใน `tbmenu` |
| ✅ | `W_worktime_view.php` (production) | **`/worktime`** — [`11-manhours-worktime.md`](11-manhours-worktime.md) · แท็บมอบหมาย `GET /api/v1/worktime/planning` · แท็บชม. HR `GET /api/v1/worktime/me` (`worktime_manhours.php`) |
| — | `worktime_count.php` | fragment `include` — `SUM(wh+ot*)` จาก `tbmanhours` ตาม `$_SESSION['mem_id']` แล้ว `echo` ตัวเลขเดียว (เคยใน `navbar.php` บล็อกโปรไฟล์ — มักคอมเมนต์) · ซ้ำ **`W_worktime_count.php`** |
| ✅ | (สรุปชม. รวม) | BE [`getWorktimeTotal`](../../PM-Pepsi-App/backend/src/services/manhours.ts) → **`GET /api/v1/auth/me`** · **`GET /api/v1/personnel/me/dashboard`** (`worktime` + `worktimeTotalHours`) · UI: [`AppNavbarUser`](../../PM-Pepsi-App/frontend/src/components/layout/AppNavbarUser.tsx), [`ProfilePanel`](../../PM-Pepsi-App/frontend/src/features/settings/ProfilePanel.tsx), [`PersonnelPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelPage.tsx) — [`10-personnel.md`](10-personnel.md) |
| — | `M_importConfrim.php` | **ชื่อผิด** (Confrim) — โค้ด ≡ **`M_iw37n.php`** (`$title_page` = นำเข้า IW37N, `$myfile=M_iw37n`, `iw37n.xlsx`, upsert `tbiw37n`, skip แถว 1–2) · **ไม่มี** `?module=M_importConfrim` ใน `tbmenu` |
| ✅ | `M_iw37n.php` (production IW37N) | **`/iw37n`** — [`07-iw37n.md`](07-iw37n.md) · `POST /api/v1/iw37n/import` · `GET /iw37n/batches` (เมนู `008`: `module=M_iw37n`) |
| ✅ | `M_Confirm.php` (production Confirm import) | **`/confirmation`** — [`09-confirmation.md`](09-confirmation.md) · `POST /api/v1/confirmation/import` · ไฟล์ `Confirm.xlsx` → `tbcofirm` |
| ✅ | `M_filter_iw37.php` | ฟิลเตอร์ IW37 ใน **`/calendar`** — [`04-work-calendar.md`](04-work-calendar.md) · `GET/POST /api/v1/calendar/*` |



### P4 — ไม่ต้องย้าย (— ข้าม) · รหัส **D** ใน §2

ไฟล์ในกลุ่มนี้ **ไม่ใส่คิวพอร์ต** — ติ๊ก **ข้าม** ใน [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) §4 พร้อมหมายเหตุว่ารวมที่ route ไหน (ถ้ามี)

<details>

<summary>กลุ่ม D — คลิกขยาย (สรุป ~90+ ไฟล์ · ไม่บล็อก UAT ขั้น 5)</summary>

| ชุด | ตัวอย่าง PHP | เหตุผลข้าม | React / แทนที่ |
|-----|-------------|------------|----------------|
| **สำรอง / ทดสอบ** | `*_bk*`, `test_*`, `Test_*`, `import_test`, `calendar_bk*`, `left_menu_bk*`, `login-bk.php`, `user_form-bk.php` | ไม่ใช่ production | — |
| **SB Admin / demo** | `content.php`, `charts.php`, `tables.php`, `tabs.php`, `password.php`, `register.php`, `login.html` | เทมเพลต / demo | `/` (KPI ใหม่), `/login`, `/settings` |
| **Fragment / include** | `calc_birthday.php`, `footer.php`, `navbar.php`, `left_menu.php`, `personel_form_tab*`, `worktime_count.php`, `count_worktime.php` | ไม่ใช่ `?module=` | Shell: `AppShell`, `AppNavShell`, profile API |
| **Legacy list+form** | `tb_*.php`, `tbdepartment*`, `tbposition*`, `tbwkctrgroup*`, `tbwkctrtype*` | ซ้ำ `M_*` | **`/master-data`** แท็บ entity + **`/admin/users`** |
| **Legacy member** | `member.php`, `member_form*`, `member_edit*` (ยกเว้น change password) | ซ้ำ admin/personnel | **`/personnel`**, **`/admin/users`** |
| **Worker ซ้ำ** | `W_calendar*`, `worktime_view.php`, `W_worktime_count.php` | หน้า/fragment ซ้ำ | **`/plan-calendar`**, **`/calendar`**, **`/worktime`** |
| **Worker รวมแล้ว** | `W_confirm_*` (`pages/`) | ไม่พอร์ตไฟล์แยก | **`WorkOrderDetailDialog`** + `/planning`, `/confirmation` |
| **Utility §5** | `select_*`, `show_form`, `view_planwork`, `view_confirm`, `W_add_image*`, `W_calc_*`, `user*` | helper / SQL view | ดูตาราง P1 §4 (6 แถว —) |
| **ชื่อผิด / ไฟล์ซ้ำ** | `M_importConfrim.php`, `Scheduing.php`, `slectall.php`, `selectMunti.php` | typo หรือ ≡ ไฟล์อื่น | **`M_iw37n`** → `/iw37n`; **`M_Confirm`** → `/confirmation` |
| **IW37N legacy** | `iw37n.php`, `iw37n_form.php` | ไม่มีเมนู | **`/iw37n`** + `M_iw37n*` |
| **เมนูไม่มีไฟล์** | `report_backlog`, `report_pm`, … | dead link ในเมนูเก่า | **`/reports`** (KPI ที่ทำแล้ว) |

**Checklist §4:** แถว `tbdepartment*` / `tbposition*` / `tbwkctrgroup*` / `tbwkctrtype*` → **ข้าม** แล้ว (รวมใน **`/master-data`**)

**Modal (`modalPages/`):** ครบ P1 §5 — เหลือเฉพาะ `ModalOrderDetailXXX.php` (ข้าม)

</details>



---



## 5) สรุปตัวเลข “งานที่เหลือ”



| สถานะ | กลุ่ม | ประมาณ |
|--------|------|--------|
| ✅ | **A + B** (ย้าย/รวมแล้ว) | ~150+ ไฟล์ |
| ✅ | **C** ต้องทำ (โค้ดใหม่) | **0** — `W_*` / utility ไม่ใช่คิว (→ **D**); ไม่มี `ยังไม่ทำ` ใน §4/§5 |
| — | **D** ข้าม | ~90 ไฟล์ |
| ⏳ | **E** Admin / Deploy | แยก track — หลังขั้นที่ 5 |

**งานจริงถัดไป:** ขั้น **5** ⏳ UAT มือ — [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md)



---



## 6) แผน Sprint (สถานะ)



### Sprint 1 — เอกสาร ✅

- ✅ ตกลง redirect **0A**
- ✅ อัปเดต §4/§5, legacy ข้าม, COMPLETION-MATRIX, README

### Sprint 2 — P0 Plan Calendar ✅

- ✅ API `plan-calendar/events`, หน้า `/plan-calendar`, login redirect, §4 `M_plan_calendar`

### Sprint 3 — Modal P1 ✅

- ✅ 3.1–3.6 ตาม CHECKLIST-ORDER (ChackStatus, AddTeam, FilterDetail, AddClose, ShowPlan*, Tab*)

### Sprint 4 — Auth ✅

- ✅ `POST /api/v1/auth/change-password`, UI ใน `/settings`, `01-auth.md` member/RBAC

### Sprint 5 — ปิด parity ธุรกิจ ⏳

- ⏳ UAT มือตาม CHECKLIST-ORDER ขั้นที่ 5
- ⏳ §7 ใน checklist หลัก — บันทึกวันที่ปิดแต่ละลำดับ
- ✅ ปิดแถว §5 `W_calendar*` + utility เป็น **—**; `W_confirm_*` อยู่ในแกน ✅ แล้ว (P1 modal §5 ปิดเอกสาร)

### หลัง Sprint 5

- ❌ Admin §15 tests / Playwright
- ❌ Deploy §13 docker-compose



---



## 7) รายการอ้างอิง `sap/pages/*.php`



### 7.1 งานหลัก

| สถานะ | กลุ่ม PHP | Route React | §4 / parity |
|--------|-----------|-------------|-------------|
| ✅ | Auth + settings | `/login`, `/logout`, `/settings` | 01-auth |
| ✅ | Dashboard (Home) | `/` | 08 |
| ✅ | Plan Calendar | `/plan-calendar` | 08 |
| ✅ | Work calendar | `/calendar` | 04 |
| ✅ | Line calendar | `/line-calendar` | 03 |
| ✅ | Backlog | `/backlog` | 05 |
| ✅ | Work orders | `/work-orders` | 06 |
| ✅ | Confirmation / IW37N | `/confirmation`, `/iw37n` | 09, 07 |
| ✅ | Planning | `/planning` | 08 |
| ✅ | Personnel / Manhours / Reports | `/personnel`, `/manhours`, `/worktime`, `/reports`, … | 10–12 |
| ✅ | Master | `/master-data` | 02 |
| ✅ | Admin | `/admin/*` | 14 |



### 7.2 `sap/modalPages/*.php` — §5

| สถานะ | ไฟล์ / กลุ่ม |
|--------|----------------|
| ✅ | `ModalOrderDetail.php`, `Tab*`, `MovePlant`, `AddPlan`, `AddTeam`, `FilterDetail*`, `ChackStatus` |
| ✅ | `AddClose`, `AddClosePersonel`, `ShowPlan`, `ShowPlanGroup`, `ShowWorkClose` |
| ✅ | `confirmTab*`, `plan_confirmTab*`, `ShowClose`, `ShowImgUpload`, `plan_submit_upload_file` |
| — | `W_calendar*` (worker calendar เก่า) — ข้าม |
| — | utility §5 (`pages/` helper: `select_*`, `view_*`, `W_calc_*`, `user*`, `worktime_*` ฯลฯ) — ดูตาราง §4 P1 |
| ✅ | `W_confirm_*` (`pages/`) — รวมใน dialog Confirm แล้ว |
| — | `ModalOrderDetailXXX.php` |



---



## 8) วิธีซิงค์ checklist หลังปิดแต่ละงาน

| ลำดับ | สถานะเมื่อปิดงาน | ไฟล์ |
|------|------------------|------|
| 1 | ✅ | [`CHECKLIST-ORDER.md`](CHECKLIST-ORDER.md) |
| 2 | ✅ | [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) §4/§5 |
| 3 | ✅ | `parity-pending/0N-*.md` + [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md) |
| 4 | ✅ | **แผนนี้** — §0, §3 ตารางเมนู, §6 Sprint |
| 5 | ✅ | §7 ประวัติ checklist หลัก |



---



## 9) นอกแผน parity ธุรกิจ

| สถานะ | รายการ |
|--------|--------|
| ✅ | **Admin** (`/admin/*`) — แกน ~90% · UAT/deploy แยก track E |
| ⏳ | **`npm test` / Playwright** ทั้งโปรเจกต์ — หลังขั้นที่ 5 |
| ❌ | **Docker / ส่งมอบ** — ลำดับ 13 |



---



## 10) บันทึกการอัปเดตแผน



| วันที่ | สรุป |

|--------|------|

| 2026-05-21 | สแกนใหม่ 241 ไฟล์; จัดกลุ่ม A–E; Sprint 1–5 แบบร่าง |

| 2026-05-21 | **ขั้น 0–4 ✅:** 0A + `/plan-calendar`, modal P1 (3.1–3.6), change password API/UI, migration 074 — **ถัดไป ขั้น 5 ⏳** |
| 2026-05-21 | **สัญลักษณ์ทั้งเอกสาร** — ✅ / ⏳ / ❌ / — ใน §0–§10 และ §3 (เมนู production) |


