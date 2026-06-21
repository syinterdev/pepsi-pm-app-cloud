# ออกแบบ Database (PostgreSQL) + Middleware + Backend — PM Web (เทียบระบบ PHP / MySQL)

เอกสารนี้สรุปผลการ **ศึกษาแหล่งข้อมูลระบบเก่า** และ **ทิศทางออกแบบ** สำหรับ PostgreSQL + Express ให้สอดคล้อง [`skills.md`](../skills.md), [`PROJECT-STRUCTURE.md`](../PROJECT-STRUCTURE.md), และสัญญา API ที่ล็อกใน [`PM-Pepsi-App/frontend/src/api/schemas.ts`](../PM-Pepsi-App/frontend/src/api/schemas.ts)

---

## 1) แหล่งอ้างอิงระบบเก่า (ที่ต้องอ่านควบคู่)

| แหล่ง | บทบาท | หมายเหตุ |
|--------|--------|-----------|
| **`MySQL/data/sap_lay/*.frm`** | สคีมาจริงที่รันบนเครื่องพัฒนา — ฐาน **`sap_lay`** ตาม [`sap/include/connection.php`](../sap/include/connection.php) | ไม่มี `CREATE TABLE` ใน repo สำหรับทุกตาราง — ใช้เป็น **รายการ object** และถ่าย DDL จาก MySQL (`SHOW CREATE TABLE` / mysqldump) เมื่อล็อก migration |
| **[`sap/db_lays.sql`](../sap/db_lays.sql)** | Dump phpMyAdmin (ปี 2020) ชื่อ DB ใน header คือ **`db_lays`** | ชื่อ DB **ไม่ตรง** กับ `sap_lay` ใน `connection.php` — ใช้เป็น **อ้างอิง DDL/ตัวอย่างตารางที่มีในไฟล์** (เช่น `confirmation`, `tbl_system_user*`) ต้อง **เทียบกับ `sap_lay` จริง** ก่อนนำไป PG |
| **โค้ด PHP `sap/pages/*.php`** | บอกว่า query ไปตาราง/view ใด, ฟิลด์ที่ใช้, session | ใช้จัด **ลำดับความสำคัญ API** (auth → master → iw37n → calendar/backlog views) |

### 1.1 รายการ object ใน MySQL `sap_lay` (จาก `MySQL/data/sap_lay/*.frm`)

ตารางหลัก (prefix `tb*`):

- `tbactivitytype`, `tbconfirmcom`, `tbconfirmimg`, `tbcofirm`, `tbdepartment`, `tbequipment`, `tbfunctional`, `tbiw37n`, `tbmainteanance`, `tbmanhours`, `tbmaterial`, `tbmenu`, `tbmoveplan`, `tbplangingwork`, `tbposition`, `tbproductline`, `tbreason`, `tblineschdul`, `tbtasklist`, `tbuserst`, `tbwkctrgroup`, `tbwkctrstatus`, `tbwkctrtype`, `tbwklevel`, `tbwkstatus`, `tbwkzb`, `tbworkcenter`, `tbworkcenter_userlog`, `tbworkctrgroup`, `tbwrkclose`, `tbzone`

มุมมอง (`view*`):

- `view_confirmation`, `view_countpersonelclose`, `view_exportconfirm`, `view_lineschdul`, `view_order`, `view_personelclose`, `view_planwork`, `view_plangroup`, `view_tarklist`, `view_workcenter`, `view_zone`

> **แนว migration:** ใน PostgreSQL แนะนำสคีมา **`app`** (หรือ `pm`) แยกจากระบบอื่นบน host — ตารางใช้ `snake_case` ชื่อเดิมได้เพื่อลดความสับสนกับ view ใน PHP หรือ **แมปชื่อใหม่** พร้อมตาราง `legacy_column_map` เฉพาะจุดที่ refactor

---

## 2) ทางเลือกกลยุทธ์ PostgreSQL

| กลยุทธ์ | เมื่อไหร่เหมาะ | ความเสี่ยง |
|---------|----------------|-------------|
| **A — ย้ายสคีมาใกล้เคียง MySQL** | ต้องการ parity query กับ PHP เร็ว, ลดการเขียน view ใหม่ | ชนิดข้อมูลเวลา/ตัวเลขใน MySQL เก่า (เช่น UNIX time ใน `bscstart`) ต้องแปลงเป็น `timestamptz` / `bigint` อย่างเป็นระบบ |
| **B — โมเดลใหม่ + ETL จาก MySQL** | ต้องการ normalize, ความปลอดภัย, multi-plant ชัด | ใช้แรงมากขึ้น; ต้องมีชั้น read จาก legacy ระหว่างย้าย |

**คำแนะเริ่มต้น:** เริ่ม **A แบบค่อยเป็นค่อยไป** — ตารางลำดับแรก: `tbworkcenter` (login), `tbworkcenter_userlog`, จากนั้น master ที่ frontend ใช้ (`tbactivitytype`, …) แล้วค่อย `tbiw37n` + materialized หรือ **VIEW ใน PG** เทียบ `view_order` / `view_lineschdul` เพื่อไม่ซ้ำ logic ใน Node มากเกินไป

---

## 3) Middleware (ชั้น Express — “ก่อน” business handler)

ลำดับแนะนำ (outside → inside):

1. **Request id** — `X-Request-Id` สำหรับ log + audit  
2. **Helmet** — header ความปลอดภัย  
3. **CORS** — whitelist origin (dev: Vite; prod: โดเมน `web`)  
4. **Rate limit** — โดยเฉพาะ `/auth/login`, `/iw37n/import`, upload  
5. **Body / multipart limit** — ป้องกันไฟล์ใหญ่เกิน policy  
6. **Auth middleware** — ยืนยัน session cookie หรือ JWT แล้วแนบ `req.user` (idwkctr / role / plant)  
7. **RBAC** — ตรวจสิทธิ์ตาม matrix ที่ลูกค้าอนุมัติ (เทียบ `UserST` เดิม A/U/W + `tbmenu.menuright`)  
8. **Audit hook** (optional แยก service) — login/logout/import/confirm WO

**ไม่** ใส่ business rule หนักใน middleware ยกเว้น auth/RBAC/audit

---

## 4) Backend (Node.js + Express) — โครงสร้างและแมป API

สอดคล้องโครงใน [`PROJECT-STRUCTURE.md`](../PROJECT-STRUCTURE.md) §3 และ path ที่ frontend ล็อกแล้ว:

| Prefix API (มีใน MSW แล้ว) | Router / โดเมน | ข้อมูลอ้างอิง PHP / MySQL |
|---------------------------|----------------|---------------------------|
| `GET /api/v1/health` | `routes/health.ts` | health check |
| `POST /api/v1/auth/login` | `routes/auth.ts` | [`login.php`](../sap/pages/login.php) → `tbworkcenter` |
| `POST /api/v1/auth/logout` (เพิ่ม) | `routes/auth.ts` | [`logout.php`](../sap/pages/logout.php) → `tbworkcenter_userlog` |
| `GET /api/v1/dashboard/summary` | `routes/dashboard.ts` | aggregate จาก WO / personnel / import batch |
| `GET/POST …/work-orders*` | `routes/work-orders.ts` | `tbiw37n` / views |
| `GET …/calendar/events`, `POST …/backlog/events` | `routes/scheduling.ts` | `view_order`, `M_filter_iw37` logic → SQL หรือ view ใน PG |
| `GET …/iw37n/batches`, `POST …/iw37n/import` | `routes/iw37n.ts` + `services/sap-parser` | `M_iw37n*`, SHA256, ไฟล์ Excel |
| `GET /api/v1/master-data/:entity` | `routes/master-data.ts` | แมป `entity` → ตาราง `tb*` ที่สอดคล้อง (เช่น `activitytype` → `tbactivitytype`) |

**Validation:** Zod ร่วมกับ schema ที่ export จากแพ็กเกจ shared ได้ในอนาคต (`packages/shared` หรือ copy จาก `schemas.ts`) — ลด drift FE/BE

---

## 5) Database PostgreSQL — ลำดับ migration แนะนำ

| Phase | ตาราง / หัวข้อ | เหตุผล |
|-------|----------------|--------|
| **0** | สร้าง DB, role, extension `pgcrypto` (ถ้า hash รหัส), schema `app` | พื้นฐาน |
| **1** | `tbworkcenter`, `tbworkcenter_userlog` (หรือชื่อเดียวกันใน PG) | login/logout parity |
| **2** | Master ที่ UI ใช้บ่อย: `tbactivitytype`, `tbequipment`, `tbfunctional`, `tbzone`, `tbworkctr*`, `tbmenu` (ถ้าเมนูไม่ hardcode) | `/master-data` |
| **3** | `tbiw37n` + index ตาม `wkorder`, `wkctr`, `bscstart` | IW37N + backlog |
| **4** | VIEW ใน PG เทียบ `view_order`, `view_lineschdul`, `view_confrim` (สะกดตาม legacy) | ลด duplication กับ PHP |

**การนำเข้าข้อมูลจาก MySQL:** ใช้ `mysqldump --no-data` ถ่าย DDL → แปลงด้วยเครื่องมือหรือมือ + จากนั้น `mysqldump --complete-insert` / CSV → `COPY` เข้า PG ตาม phase

---

## 6) PostgreSQL ที่ติดตั้งแล้วใน repo

โฟลเดอร์ [`PM-Pepsi-App/PostgreSQL/`](../PM-Pepsi-App/PostgreSQL/) เป็น **ชุด PostgreSQL + pgAdmin บนเครื่องพัฒนา** (มี `data/`, `postgresql.conf`, `scripts/runpsql.bat`)

- **Dev:** ใช้ต่อกับ backend บน localhost ตามพอร์ตที่ตั้งใน instance นี้  
- **Production / ส่งมอบลูกค้า:** ยังยึดแนว **`docker-compose`** + volume `database/postgres` ตาม [`skills.md`](../skills.md) — อินสแตนซ์ใน `PM-Pepsi-App/PostgreSQL` ใช้เป็น **อ้างอิงเวอร์ชันและเครื่องมือ admin** ไม่จำเป็นต้องเป็นคนละ schema กับ container ถ้าทีมแยก dev ชัด

---

## 7) งานถัดไป (checklist สำหรับทีม)

1. อ่าน [`database/README.md`](../database/README.md) — รัน migration `001` + สคริปต์ export DDL  
2. รัน `mysqldump --no-data` / สคริปต์ `export-sap-lay-schema.ps1` จาก MySQL `sap_lay` สำหรับ object ใน §1.1 แล้วเก็บใน `database/legacy-reference/`  
3. เลือกกลยุทธ์ §2 และเขียน ADR สั้น 1 หน้า  
4. สร้าง `backend/` + `pg` pool + migration ถัดไป (master / `tbiw37n`)  
5. Implement `POST /auth/login` ให้ตรงกับ `schemas.ts` แล้วปิด MSW สำหรับ endpoint นั้นใน dev เมื่อมี `VITE_API_URL`

---

*อัปเดตเอกสารนี้เมื่อล็อก DDL จริงใน PostgreSQL หรือเมื่อมีการเปลี่ยนชื่อ schema/table จากของเดิม*
