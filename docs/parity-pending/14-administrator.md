# ลำดับที่ 14 — Administrator / ผู้ดูแลระบบ

**สถานะรวม:** แกนเสร็จ ✅ ~90% · UAT/Deploy ⏳ — Phase A–F + 13 หน้า + CHECKLIST §0–§14 ส่วนใหญ่ปิด · ค้าง §15–§16 (ทดสอบ CI, UAT มือ, docker) — ดู [**CHECKLIST — ปิดงาน Admin**](#checklist--ปิดงาน-admin-ทำต่อ)  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ใกล้ครบสำหรับ admin — ยังขาด deploy/docker, RBAC ทุก route นอก admin, บาง UX ใน spec  
**Route หลัก:** `/admin` (Admin Console) + sub-route 12 หน้าตามตาราง §2  
**Checklist หลัก:** [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) §4 / §5 — แถวใหม่หมวด **Administrator**  
**อ้างอิงลูกค้า:** [`skills.md`](../../skills.md) §Theme/Skin (Liquid Glass + Pepsi red/white/blue), §Logo customization (บรรทัด 52 — “สามารถ customize เปลี่ยนแปลงโลโก้ของ application ได้”), §3 Security (RBAC + Audit), §4 Deploy offline (Auto backup D:)

> **เจตนาเอกสารฉบับนี้:** เป็นข้อกำหนด (spec) ระดับสากลสำหรับสร้างหน้า/บริการของ **ผู้ดูแลระบบ** ให้ครอบคลุมการจัดการทุกอย่างในระบบ PM ของลูกค้า — ใช้เป็นพิมพ์เขียวก่อน implement และเป็นเอกสารส่งมอบ (handover) ให้ทีมลูกค้าต่อยอด

---

## 1) ขอบเขตงาน (Scope) — สรุปสั้น

ผู้ดูแลระบบ (`userst='A'`) ต้องสามารถ **จัดการทุกอย่าง** ที่กระทบโครงสร้าง / ผู้ใช้ / นโยบาย / รูปลักษณ์ของแอป โดย**ไม่ต้อง** เข้าถึง shell / DBeaver / ไฟล์ระบบของ Windows Server ลูกค้า — ทุกฟังก์ชันต้องทำผ่าน UI ของ **Admin Console** ที่ผูก backend RBAC + Audit Trail (เทียบ `skills.md` §3 “defense in depth”)

**ขอบเขตรวม 13 หมวด** (ดูตาราง §2):

1. **Admin Console (Hub)** — KPI สรุประบบ + Quick action
2. **User Management** — บัญชี workcenter + member
3. **Role & Permission Management** — RBAC matrix + custom role (future)
4. **Menu Builder** — แก้ `tbmenu` ผ่าน UI + drag/drop ลำดับ
5. **Branding / Customization** — โลโก้ / สี / favicon / app name (legacy `Pepsi (รับงาน) สั่งทำ` ใน footer)
6. **System Settings** — timezone, locale, BE/AD year toggle, upload limit, feature flags
7. **Master Data Hub** — รวมลิงก์/สถิติ master ทั้ง 17 ตาราง (ลิงก์เดิม `/master-data`)
8. **Audit / Activity Log** — login, import, confirm, master edits, branding/setting changes
9. **Backup & Restore** — manual backup + schedule + restore + download `.tar.gz`
10. **System Health** — DB connection, disk D: usage, container stats, error log
11. **Announcement / Maintenance mode** — broadcast banner + readonly toggle
12. **Reports / Security audit** — login attempts, RBAC violation, slow query
13. **About / License** — version, build hash, vendor (S.Y. Interactive Development), migration status

---

## 2) ผังเมนู Admin (Navigation map)

> **หมายเหตุ (อัปเดตตามของที่ทำจริง):**
>
> - **Routes admin มีครบ** ภายใต้ prefix `/admin/*` (ดู `App.tsx`)
> - **Sidebar** ใน `nav-config.ts` ปัจจุบันแสดง “เมนูเด่น” เฉพาะบางหน้า (เพื่อไม่ให้รก) แต่ยังสามารถเข้าหน้าอื่นได้ผ่าน URL/ลิงก์ในหน้า Console
> - ค่า `menuright='A'` เป็น **fallback**; งานจริงใช้ RBAC ผ่าน `permission` (`admin.*.read`)

| ลำดับ | Route React | เมนู | Icon (lucide) | แสดงใน sidebar | Permission (RBAC) | menuright (fallback) | สรุปฟังก์ชัน |
|------|-------------|------|----------------|------------------|------------------|---------------------|-------------|
| 14.0 | `/admin` | **Admin Console** | `LayoutDashboard` | ✅ | `admin.settings.read` | `A` | ภาพรวม + quick links |
| 14.1 | `/admin/branding` | **ธีม & โลโก้ (Branding)** | `Palette` | ✅ | `admin.branding.read` | `A` | โลโก้/สี/ธีม |
| 14.2 | `/admin/settings` | **ตั้งค่าระบบ (System)** | `Settings2` | ✅ | `admin.settings.read` | `A` | ตั้งค่า public/system + policy ต่างๆ |
| 14.3 | `/admin/audit` | **บันทึกกิจกรรม (Audit)** | `History` | ✅ | `admin.audit.read` | `A` | ดู/ค้น/เทียบ diff audit |
| 14.4 | `/admin/health` | **สุขภาพระบบ (Health)** | `Activity` | ✅ | `admin.health.read` | `A` | health checks / metrics |
| 14.5 | `/admin/users` | **จัดการผู้ใช้ (Users)** | `UserCog` | ✅ | `admin.users.read` | `A` | list/manage users |
| 14.6 | `/admin/roles` | **บทบาท & สิทธิ์ (Roles)** | `ShieldCheck` | ✅ | `admin.roles.read` | `A` | role matrix + preview |
| 14.7 | `/admin/menu` | **เมนู (Menu Builder)** | `LayoutList` | ✅ | `admin.menu.read` | `A` | แก้ `tbmenu` + preview |
| 14.8 | `/admin/backup` | **สำรอง & กู้คืน (Backup)** | `Database` | ✅ | `admin.backup.read` | `A` | backup schedule + list |
| 14.9 | `/admin/announcements` | **ประกาศ (Announcements)** | `Megaphone` | ✅ | `admin.announcement.read` | `A` | broadcast/ประกาศ |
| 14.10 | `/admin/master` | **Master Data Hub** | (ดูในหน้า) | ❌ | `master-data.read` (ผ่าน admin) | `A` | hub count + last updated |
| 14.11 | `/admin/security` | **Security** | (ดูในหน้า) | ❌ | `admin.security.read` | `A` | รายงานความปลอดภัย |
| 14.12 | `/admin/about` | **About / License** | (ดูในหน้า) | ❌ | `admin.about.read` | `A` | เวอร์ชัน/ข้อมูลระบบ |

**Navigation pattern (UI):**

- โครงหลัก: `/admin/*` ใช้ `AdminLayout` + `<Outlet />` (route-based)
- Sidebar ใช้ `NavMenuList` (แสดงเมนูเด่น 7 รายการตาม `nav-config.ts`)
- ทุกหน้ามี **breadcrumb** `Home / ผู้ดูแลระบบ / [section]`
- **React Joyride tour** เปิดอัตโนมัติครั้งแรก (เก็บ `seen_admin_tour=1` ใน `tbl_user_pref`)

---

## 3) ตาราง / Migration ที่ต้องเพิ่ม (PostgreSQL `app` schema)

> **ไม่มี** ในระบบ PHP เดิม — เป็น **ส่วนขยายใหม่** เพื่อให้ admin ครอบคลุมงานสากล

### 3.1 `app.tbl_role` (RBAC role definition)

```sql
CREATE TABLE app.tbl_role (
  role_code   varchar(16) PRIMARY KEY,  -- 'A','H','U','W' + future custom
  role_name   text NOT NULL,            -- ผู้ดูแลระบบ / Manager / Planner / Technician
  role_color  varchar(16) NOT NULL DEFAULT '#0A84FF',
  is_system   boolean NOT NULL DEFAULT false,  -- A/H/U/W = true, ห้ามลบ
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**Seed:** A (admin/rose), H (manager/purple), U (planner/blue), W (technician/emerald) — `is_system=true`

### 3.2 `app.tbl_permission` + `app.tbl_role_permission` (permission matrix)

```sql
CREATE TABLE app.tbl_permission (
  perm_code   varchar(64) PRIMARY KEY,  -- 'work-orders.read', 'planning.assign', 'admin.users.write'
  perm_group  varchar(32) NOT NULL,     -- 'work-orders','planning','admin', ...
  perm_name   text NOT NULL,
  description text
);

CREATE TABLE app.tbl_role_permission (
  role_code   varchar(16) REFERENCES app.tbl_role(role_code) ON DELETE CASCADE,
  perm_code   varchar(64) REFERENCES app.tbl_permission(perm_code) ON DELETE CASCADE,
  granted     boolean NOT NULL DEFAULT true,
  PRIMARY KEY (role_code, perm_code)
);
```

**กลุ่ม permission (perm_group):** `dashboard`, `planning`, `work-orders`, `confirmation`, `personnel`, `master-data`, `iw37n`, `reports`, `manhours`, `admin.users`, `admin.roles`, `admin.menu`, `admin.branding`, `admin.settings`, `admin.audit`, `admin.backup`, `admin.health`, `admin.security`, `admin.announcement`

**Action verbs:** `read`, `write`, `delete`, `import`, `export`, `approve`

> backend ทุก route ต้อง enforce ผ่าน middleware `requirePermission('xxx.yyy')` — ปลด `requireAdmin` (เช็ค `userst='A'`) เป็น `requirePermission` ที่ precise กว่า

### 3.3 `app.tbl_setting` (key/value settings)

```sql
CREATE TABLE app.tbl_setting (
  setting_key   varchar(64) PRIMARY KEY,
  setting_value jsonb NOT NULL,
  category      varchar(32) NOT NULL,    -- 'branding','system','feature','backup'
  description   text,
  is_secret     boolean NOT NULL DEFAULT false,  -- mask ใน UI/audit
  updated_by    text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

**ตัวอย่าง key:**

| Key | Category | Default value | หมายเหตุ |
|-----|----------|---------------|----------|
| `app.name` | branding | `"PM Pepsi"` | แสดงใน topbar / browser title |
| `app.logo_bytes` / `app.logo_mime` | branding | (BYTEA + image/webp) | ไฟล์โลโก้ — ดู §4.4 |
| `app.favicon_bytes` | branding | (BYTEA) | favicon override |
| `app.footer_text` | branding | `"© S.Y. Interactive Development Limited"` | |
| `app.primary_color` | branding | `"#FF3B30"` (Pepsi red) | เทียบ skills.md §Theme |
| `app.accent_color` | branding | `"#007AFF"` (system blue) | |
| `app.theme_mode` | branding | `"system"` (light/dark/system) | |
| `app.locale` | system | `"th-TH"` | |
| `app.timezone` | system | `"Asia/Bangkok"` | |
| `app.year_format` | system | `"BE"` (BE/AD) | toggle วันที่ พ.ศ. ↔ ค.ศ. |
| `app.date_format` | system | `"dd/MM/yyyy"` | |
| `app.upload_max_mb` | system | `15` | |
| `app.session_ttl_min` | system | `480` | (8 ชั่วโมง) |
| `feature.indexeddb_offline` | feature | `false` | flag — เปิดเมื่อพร้อม |
| `feature.dashboard_charts` | feature | `false` | |
| `backup.schedule_cron` | backup | `"0 2 * * *"` | ทุกวัน 02:00 |
| `backup.retention_days` | backup | `30` | |
| `backup.target_dir` | backup | `"D:/PM-Pepsi-App/backup"` | |
| `maintenance.enabled` | system | `false` | readonly mode |
| `maintenance.message` | system | `""` | banner ที่จะแสดง |

### 3.4 `app.tbl_audit_log` (audit trail)

```sql
CREATE TABLE app.tbl_audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     text,                    -- idwkctr หรือ username
  actor_role   varchar(16),             -- A/H/U/W
  action       varchar(64) NOT NULL,    -- 'auth.login','planning.assign','admin.user.create' ...
  resource     varchar(64),             -- 'tbworkcenter','tbmenu','tbiw37n' ...
  resource_id  text,                    -- PK ของ resource
  before_json  jsonb,                   -- snapshot ก่อนแก้ (เฉพาะ write/delete)
  after_json   jsonb,                   -- snapshot หลังแก้
  ip           inet,
  user_agent   text,
  status       varchar(16) NOT NULL DEFAULT 'ok',  -- 'ok','denied','error'
  message      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor_time ON app.tbl_audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_action_time ON app.tbl_audit_log (action, created_at DESC);
CREATE INDEX idx_audit_resource ON app.tbl_audit_log (resource, resource_id);
```

> backend helper `auditLog(actorCtx, action, {...})` — เรียกจากทุก write route; กฎ retention: 365 วัน (ใส่ใน `backup.retention_days` แยกของ audit ใน `app.tbl_setting`)

### 3.5 `app.tbl_backup_history` (record backup runs)

```sql
CREATE TABLE app.tbl_backup_history (
  id          bigserial PRIMARY KEY,
  trigger     varchar(16) NOT NULL,    -- 'manual','schedule'
  status      varchar(16) NOT NULL,    -- 'success','failed','running'
  size_bytes  bigint,
  file_path   text,
  sha256      text,
  duration_ms integer,
  started_by  text,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error_text  text
);
```

### 3.6 `app.tbl_announcement` (broadcast banner)

```sql
CREATE TABLE app.tbl_announcement (
  id         serial PRIMARY KEY,
  level      varchar(16) NOT NULL DEFAULT 'info',  -- 'info','warn','error','maintenance'
  title      text NOT NULL,
  body       text,
  starts_at  timestamptz NOT NULL DEFAULT now(),
  ends_at    timestamptz,
  dismissable boolean NOT NULL DEFAULT true,
  active     boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.7 `app.tbl_user_pref` (per-user UI preference — small but admin-aware)

```sql
CREATE TABLE app.tbl_user_pref (
  user_id      text PRIMARY KEY,        -- idwkctr หรือ member username
  theme_mode   varchar(16),             -- 'light','dark','system'
  language     varchar(16),
  density      varchar(16),             -- 'comfortable','compact'
  seen_tours   jsonb DEFAULT '{}'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

---

## 4) ฟังก์ชันละเอียดต่อหมวด

### 4.1 Users (`/admin/users`)

- ปรับปรุง [`PersonnelAdminPage`](../../PM-Pepsi-App/frontend/src/features/personnel/PersonnelAdminPage.tsx) ที่มีอยู่แล้ว — ย้าย route `/personnel/admin` → คง alias แต่เพิ่ม `/admin/users` (เมนูใหม่)
- เพิ่ม **Filter: บทบาท / สถานะใช้งาน** (workstatus) — เติม checklist ที่ค้างใน `10-personnel.md`
- เพิ่มแอ็กชัน:
  - Reset password → ส่ง password ใหม่ + force change ที่ login ครั้งถัดไป
  - Lock / Unlock (`workstatus`)
  - Bulk role change (`<Checkbox>` หลายแถว + dropdown role)
  - Impersonate (Admin login เป็น user คนนั้นชั่วคราว — audit log บันทึก `auth.impersonate`)
- รวม account 2 ฝั่ง: `tbworkcenter` (HR) + `tbl_member` (login-bk) เป็น tab เดียวกัน

### 4.2 Roles & Permissions (`/admin/roles`)

- หน้า **Matrix table** — แถว = role (`tbl_role`), คอลัมน์ = permission group, cell = checkbox grant/revoke
- ปุ่ม **+ สร้าง role ใหม่** — เปิด modal กรอก code/name/color/desc → insert `tbl_role` (`is_system=false`)
- **ห้ามลบ** role ที่ `is_system=true` หรือยังมี user ผูกอยู่
- **ตัวอย่าง permission**: `planning.assign` (จ่ายงาน), `planning.delete` (ลบ assignee), `confirmation.close` (ปิด WO), `admin.users.write` ฯลฯ
- เปลี่ยน middleware backend ทุก route จาก `requireAdmin` → `requirePermission(code)` (ดู §6.2)
- มี **simulate role** เพื่อ preview เมนู/หน้าจากมุมมอง role นั้นก่อน save

### 4.3 Menu Builder (`/admin/menu`)

- ดึง `app.tbmenu` มาเป็นต้นไม้ — heading > items
- **DnD reorder** ด้วย `@dnd-kit` (skills.md §2 “Interactions”) — update `menuon` ของแถวที่ย้าย
- **รูปแบบเมนูหลัก (Navigation shell)** — admin เลือก `sidebar` | `navbar` | `hamburger` บันทึกที่ `nav.shell_mode` (`tbl_setting`) — ทุกผู้ใช้เห็น layout ตามที่ตั้ง
- Modal **เพิ่ม/แก้** เมนู: `menutitle`, `menulink` (PHP legacy), `react_route`, `menuicon` (lucide name picker), `menuright` (multi-select role), `menu_kind`, `idmenusub` (parent), `end_exact`
- ปุ่ม **Sync from PHP** — import จาก `database/seeds/generated/import_tbmenu_pg.sql` (เทียบเก่า)
- Preview: แสดงตัวอย่าง sidebar ทางขวาแบบ real-time
- บันทึก audit: `admin.menu.create/update/delete`

### 4.4 Branding (`/admin/branding`) — **เน้นเป็นพิเศษตามบรีฟ skills.md บรรทัด 52**

- หัวข้อย่อย:
  - **โลโก้ (Logo)** — `<DropZone>` รับ PNG/SVG/JPEG/WebP → backend ใช้ `sharp` แปลงเป็น WebP (เทียบ `personnel-image.ts`) → เก็บลง `tbl_setting.app.logo_bytes`
    - แสดง preview ทั้ง topbar / login screen / favicon
    - ปุ่ม **คืนค่ามาตรฐาน** = ใช้โลโก้ Pepsi default (วงกลม แดง/ขาว/น้ำเงิน) จาก [`skills.md`](../../skills.md) §สีและโลโก้
  - **สี (Theme colors)** — color picker 6 ตัว (primary/accent/success/warning/danger/info) + preview swatch + live preview การ์ดตัวอย่างที่ใช้สีนั้น
    - มี preset 3 ชุด: **Pepsi (default)** = แดง #FF3B30 / น้ำเงิน #007AFF / ขาว, **Liquid Glass Light** = น้ำเงิน / เขียว / ส้ม, **Liquid Glass Dark** = #0A84FF / #30D158 / #FF9F0A (ตามตาราง skills.md §1)
  - **ธีมโหมด (Theme mode)** — radio: Light / Dark / Follow system (CSS `prefers-color-scheme`)
  - **ชื่อแอป (App name)** — แสดงใน topbar / `<title>` / login (override `"PM Pepsi"`)
  - **ข้อความ footer** — override default
  - **Favicon** — upload .ico/.png → resize 32×32
  - **Login background** — รูปพื้นหลังหน้า login (optional)
- ทุกการเปลี่ยน save ลง `tbl_setting` + ลง audit log + invalidate cache frontend ผ่าน TanStack Query (`['settings','public']`)
- **Public endpoint** `GET /api/v1/settings/public` ส่ง branding ที่ไม่ลับให้ทุกหน้าใช้ก่อน auth (logo, app.name, colors)

### 4.5 System Settings (`/admin/settings`)

- ฟอร์มกลุ่ม:
  - **Locale & Date** — timezone select, locale `th-TH`/`en-US`, year format (พ.ศ./ค.ศ. toggle), date format pattern
  - **Limits** — upload max MB, session TTL (นาที), password min length, max login attempt
  - **Feature flags** — toggle each: IndexedDB offline, Dashboard charts, React Joyride tour, Optimistic UI, DnD calendar
  - **Maintenance mode** — toggle + custom message → banner แดงทั้งแอป + 503 readonly response สำหรับ user ที่ไม่ใช่ admin (เทียบ skills.md §3 “ลด misconfiguration”)
- ปุ่ม **คืนค่ามาตรฐาน** ในแต่ละกลุ่ม

### 4.6 Master Data Hub (`/admin/master`)

- ตารางสรุป 17 master entity (`activitytype`, `department`, `equipment`, `functional`, `reason`, `workstatus`, `worktype`, `zb`, `lineproduct`, `zone`, `machine`, `material`, `level`, `position`, `group`, `tasklist`, `lineschdul`)
  - คอลัมน์: ชื่อ, จำนวนแถว, แก้ครั้งสุดท้าย, ลิงก์ → หน้าเดิม `/master-data?entity=xxx`
- ใช้ `fetchMasterData(entity)` + meta endpoint (ใหม่: `GET /api/v1/master-data/:entity/meta` → `count` + `lastUpdatedAt`)

### 4.7 Audit Log (`/admin/audit`)

- ตารางมี filter:
  - ช่วงวันที่ (default 24 ชั่วโมงล่าสุด)
  - actor (autocomplete user)
  - action (multi-select group)
  - resource
  - status (ok/denied/error)
- คอลัมน์: เวลา, ผู้กระทำ, action, resource, status, IP, diff (`before` vs `after` แบบ pretty JSON)
- ปุ่ม **Export CSV** (skills.md §2 “Export”) — ปุ่ม **ลบเก่ากว่า X วัน** (manual cleanup)
- ใช้ `useInfiniteQuery` (skeleton screens) — เพราะ log ใหญ่

### 4.8 Backup & Restore (`/admin/backup`)

- การ์ดสถานะ: backup ล่าสุด (เวลา, ขนาด, status), Schedule cron ปัจจุบัน, retention days, target dir
- ปุ่ม **Backup ตอนนี้** → backend เรียก `pg_dump` ผ่าน `child_process` → write `.tar.gz` ลง `D:/PM-Pepsi-App/backup/YYYY-MM-DD-HHmm.tar.gz` → record `tbl_backup_history` → sha256 → ส่ง Sonner toast (เทียบ skills.md §2 “Feedback / Toasts”)
- ตารางประวัติ: filter, download (`<a href="/api/v1/admin/backup/:id/download">`), delete
- ฟอร์มตั้ง **Schedule** — cron expression + preview “ครั้งถัดไป” (`cron-parser` lib)
- ปุ่ม **Restore from file** — upload `.tar.gz` → confirm modal (ระบุชื่อไฟล์เพื่อยืนยัน) → `pg_restore` → log
- **เตือน** ก่อน restore: ระบบจะเปิด maintenance mode อัตโนมัติแล้วปิดเมื่อเสร็จ

> ทั้งหมดสอดคล้อง skills.md §4 “Auto backup” + §1.3 “Bind mount D:”

### 4.9 System Health (`/admin/health`)

- การ์ดสถานะ realtime (poll ทุก 10s):
  - **DB** — ping latency (`SELECT 1`), connection pool stats
  - **Disk D:** — total / free / used (อ่านผ่าน `/api/v1/admin/health/disk` → backend `fs.statfs`)
  - **Container** — CPU%, memory% (อ่านจาก `/proc/self/status` หรือ Docker stats ผ่าน socket)
  - **Migration status** — รัน migration ครบล่าสุด `0XX` หรือยัง (`pg_migrations` checksum)
- แท็บ **Error log** — tail 100 บรรทัดจาก backend log (`tbl_audit_log WHERE status='error'`)
- แท็บ **Slow API** — top 20 endpoint ที่ p95 > 1s (จาก middleware metrics)
- ปุ่ม **Run migration** — execute pending migration (เฉพาะ A, ทำเฉพาะตอน maintenance mode)

### 4.10 Announcements (`/admin/announcements`)

- CRUD `tbl_announcement` — level select (info/warn/error/maintenance) + WYSIWYG ง่าย (markdown หรือ plain), starts_at/ends_at picker
- ฝั่ง user เห็น **banner** แดง/เหลือง/ฟ้าที่บนสุดของ `AppLayout` (เทียบ Bootstrap alert PHP เดิม)
- ปุ่มลัด **เปิด/ปิด maintenance mode** = shortcut update `tbl_setting.maintenance.enabled`

### 4.11 Security (`/admin/security`)

- กราฟ failed login per day (Chart.js — skills.md §2 “Charts”)
- ตาราง RBAC denial (ดึงจาก `audit_log.status='denied'`)
- รายการ IP ผิดปกติ (rate limit hit)
- ปุ่ม **Block IP** (เพิ่มลง `tbl_blocked_ip` — migration `072`, UI `BlockedIpCard`)

### 4.12 About (`/admin/about`)

- การ์ดข้อมูลระบบ:
  - Version (จาก `package.json`)
  - Build commit hash + build time
  - Vendor: **S.Y. Interactive Development Limited** (ตาม skills.md §บรรทัด 2)
  - Client: **บริษัท เป๊ปซี่โคล่า (ไทย) เทรดดิ้ง จำกัด**
  - Migration status: ครบ 0XX/0YY
  - License: (ถ้ามี) — สถานะ + วันหมดอายุ
  - Server: Windows Server 2019 / Drive D usage (อ่านจาก `/admin/health`)

---

## 5) UI / UX (ผูก skills.md §Theme/Skin)

### 5.1 Liquid Glass + Pepsi palette

- ทุกหน้า `/admin/*` ใช้ **AdminLayout** ใหม่ — พื้นหลัง `#F6F6F6` (light) / `#1E1E1E` (dark) + card overlay opacity 70% + `backdrop-filter: blur(20px)` + กรอบ `1px solid rgba(255,255,255,0.18)` เพื่อให้ได้ feel Liquid Glass (เทียบ skills.md §Theme บรรทัด 25)
- การ์ด KPI ใช้สีหลักตาม `tbl_setting.app.primary_color` (default Pepsi red `#FF3B30`) + accent gradient จาก `app.accent_color` (default `#007AFF`)
- Sidebar ใช้ vibrancy material (semi-transparent + blur)

### 5.2 Component standard

| รายการ | ใช้ | จาก |
|--------|----|------|
| Layout / Card | Shadcn `Card` | `components/ui/card.tsx` |
| Form | React Hook Form + Zod | skills.md §2 |
| Table | TanStack Table + Shadcn | (ใหม่) — implement `components/ui/data-table.tsx` |
| Date picker | Shadcn-style | มี `DatePicker.tsx` |
| Color picker | `react-colorful` | (ต้องเพิ่ม dependency) |
| Cron picker | (ใหม่) — input + `cron-parser` preview | — |
| DnD | `@dnd-kit` | มีใน package.json |
| Toast | Sonner | มีแล้ว |
| Tour | React Joyride | ติดตั้งแล้ว — admin tour ครั้งแรก |
| Animation | Framer Motion | มีแล้ว |
| Skeleton | Shadcn skeleton | มี `components/ui/skeleton.tsx` |
| Chart | Chart.js + react-chartjs-2 | มีใน package.json |

### 5.3 UX principles (user-friendly)

1. **Confirm before destructive** — ทุก delete / restore ต้องเปิด `<AlertDialog>` พิมพ์ resource ID ยืนยัน
2. **Optimistic UI** — toggle setting / role / menu ใช้ `useMutation({ onMutate })` แล้ว revert ถ้า error (skills.md §2 “Optimistic UI”)
3. **Skeleton screens** — ทุกหน้า list (skills.md §2 “Skeleton Screens”)
4. **Inline help** — `<HoverCard>` ข้างทุกฟิลด์ที่ลึกซึ้ง (cron, regex, JSON path) — อธิบายภาษาไทย + ตัวอย่าง
5. **Keyboard shortcut** — ⌘K (`cmd-k`) เปิด command palette สำหรับ jump ระหว่างหน้า admin (เพิ่ม dependency `cmdk`)
6. **Diff viewer ใน audit** — ใช้ `react-diff-viewer-continued` (เพิ่ม dep) หรือ simple line-by-line — pretty JSON before/after
7. **Empty state ที่เป็นมิตร** — ทุก list เปล่าโชว์ icon + คำอธิบาย + ปุ่มสร้าง
8. **Toast ทุก action สำเร็จ/ล้มเหลว** (Sonner) — เทียบ skills.md §Feedback
9. **Breadcrumb + back button** ทุกหน้า
10. **A11y** — `aria-label` ทุกปุ่ม icon, focus ring ชัด, contrast ratio ≥ 4.5:1 (Liquid Glass ต้องระวังเรื่อง contrast)
11. **Responsive** — admin ใช้บนแท็บเล็ตได้จริง (sidebar collapse ที่ < 768px)
12. **Joyride tour** — ครั้งแรกที่ admin login พาทัวร์ 12 จุด (1 จุด/หน้า) + skip + restart ได้

---

## 6) Backend / API design

### 6.1 Route map

```
GET    /api/v1/settings/public                     (no auth — branding ใช้ก่อน login)
GET    /api/v1/settings                            requireAdmin
PUT    /api/v1/settings/:key                       requirePermission('admin.settings.write')

# Branding
POST   /api/v1/admin/branding/logo                 requirePermission('admin.branding.write')   (multipart, sharp→WebP)
GET    /api/v1/admin/branding/logo                 (public, cache 5 min, ETag)
DELETE /api/v1/admin/branding/logo                 requirePermission('admin.branding.write')   (reset to default)
POST   /api/v1/admin/branding/favicon              requirePermission('admin.branding.write')

# Users (extend /api/v1/personnel/admin/* — same backend)
POST   /api/v1/admin/users/:id/reset-password      requirePermission('admin.users.write')
POST   /api/v1/admin/users/:id/lock                requirePermission('admin.users.write')
POST   /api/v1/admin/users/:id/unlock              requirePermission('admin.users.write')
POST   /api/v1/admin/users/:id/impersonate         requirePermission('admin.users.impersonate')

# Roles
GET    /api/v1/admin/roles                         requirePermission('admin.roles.read')
POST   /api/v1/admin/roles                         requirePermission('admin.roles.write')
PUT    /api/v1/admin/roles/:code                   requirePermission('admin.roles.write')
DELETE /api/v1/admin/roles/:code                   requirePermission('admin.roles.write')    (เฉพาะ is_system=false)
GET    /api/v1/admin/permissions                   requirePermission('admin.roles.read')
PUT    /api/v1/admin/roles/:code/permissions       requirePermission('admin.roles.write')    (bulk grant)

# Menu
GET    /api/v1/admin/menu                          requirePermission('admin.menu.read')
POST   /api/v1/admin/menu                          requirePermission('admin.menu.write')
PUT    /api/v1/admin/menu/:id                      requirePermission('admin.menu.write')
DELETE /api/v1/admin/menu/:id                      requirePermission('admin.menu.write')
POST   /api/v1/admin/menu/reorder                  requirePermission('admin.menu.write')    (body: [{id, menuon}])

# Audit
GET    /api/v1/admin/audit                         requirePermission('admin.audit.read')   (filter+paginate)
GET    /api/v1/admin/audit/export                  requirePermission('admin.audit.read')   (CSV)
DELETE /api/v1/admin/audit?olderThan=YYYY-MM-DD    requirePermission('admin.audit.delete')

# Backup
GET    /api/v1/admin/backup                        requirePermission('admin.backup.read')
POST   /api/v1/admin/backup                        requirePermission('admin.backup.write')    (start backup now)
GET    /api/v1/admin/backup/:id/download           requirePermission('admin.backup.read')     (stream .tar.gz)
DELETE /api/v1/admin/backup/:id                    requirePermission('admin.backup.delete')
POST   /api/v1/admin/backup/restore                requirePermission('admin.backup.restore')  (multipart .tar.gz)
GET    /api/v1/admin/backup/schedule               requirePermission('admin.backup.read')
PUT    /api/v1/admin/backup/schedule               requirePermission('admin.backup.write')

# Health
GET    /api/v1/admin/health                        requirePermission('admin.health.read')
GET    /api/v1/admin/health/disk                   requirePermission('admin.health.read')
GET    /api/v1/admin/health/migration              requirePermission('admin.health.read')
POST   /api/v1/admin/health/migrate                requirePermission('admin.health.migrate')

# Announcements
GET    /api/v1/announcements/active                (auth — for banner)
GET    /api/v1/admin/announcements                 requirePermission('admin.announcement.read')
POST   /api/v1/admin/announcements                 requirePermission('admin.announcement.write')
PUT    /api/v1/admin/announcements/:id             requirePermission('admin.announcement.write')
DELETE /api/v1/admin/announcements/:id             requirePermission('admin.announcement.write')

# Security
GET    /api/v1/admin/security/failed-login         requirePermission('admin.security.read')
GET    /api/v1/admin/security/denied                requirePermission('admin.security.read')

# About
GET    /api/v1/admin/about                         requirePermission('admin.about.read')
```

### 6.2 Middleware ใหม่

```ts
// PM-Pepsi-App/backend/src/middleware/require-permission.ts
export function createRequirePermission(pool: Pool, sessionSecret: string) {
  return (perm: string) => async (req: Request, res: Response, next: NextFunction) => {
    const session = decodeSession(req, sessionSecret)
    if (!session) return res.status(401).json({ error: 'UNAUTHORIZED' })
    const granted = await hasPermission(pool, session.userst, perm)
    if (!granted) {
      await auditLog(pool, { actor: session, action: 'rbac.deny', resource: perm, status: 'denied' })
      return res.status(403).json({ error: 'FORBIDDEN', message: `ไม่มีสิทธิ์ ${perm}` })
    }
    next()
  }
}
```

- ทุก route ปัจจุบันที่ใช้ `requireAdmin` ต้อง migrate เป็น `requirePermission('xxx.yyy')` ทีละ batch
- เพิ่ม helper `hasPermission(pool, userst, perm)` ที่ query `tbl_role_permission` (cache 60s)

### 6.3 Audit helper

```ts
// PM-Pepsi-App/backend/src/lib/audit.ts
export async function auditLog(pool: Pool, args: {
  actor: { user_id: string; userst: string; ip?: string; ua?: string }
  action: string
  resource?: string
  resource_id?: string
  before?: unknown
  after?: unknown
  status?: 'ok' | 'denied' | 'error'
  message?: string
}) { ... }
```

เรียกจากทุก write route — pattern คล้าย logger middleware

---

## 7) Frontend / Component plan

### 7.1 หน้าใหม่

```
PM-Pepsi-App/frontend/src/features/admin/
├── AdminLayout.tsx              # 2-column + breadcrumb + tour
├── AdminConsolePage.tsx         # /admin
├── users/AdminUsersPage.tsx     # /admin/users (rebadge PersonnelAdminPage)
├── roles/AdminRolesPage.tsx     # /admin/roles
│   └── PermissionMatrix.tsx
├── menu/AdminMenuPage.tsx       # /admin/menu (DnD tree)
│   ├── MenuTreeNode.tsx
│   └── MenuEditDialog.tsx
├── branding/AdminBrandingPage.tsx
│   ├── LogoUploadCard.tsx
│   ├── ColorPickerCard.tsx
│   └── ThemePreviewCard.tsx
├── settings/AdminSettingsPage.tsx
├── master/AdminMasterHubPage.tsx
├── audit/AdminAuditPage.tsx
│   └── AuditDiffViewer.tsx
├── backup/AdminBackupPage.tsx
│   └── CronInput.tsx
├── health/AdminHealthPage.tsx
├── announcements/AdminAnnouncementsPage.tsx
├── security/AdminSecurityPage.tsx
└── about/AdminAboutPage.tsx
```

**สถานะ implement (2026-05-19):**

- [x] ย้ายหน้าทั้งหมดเข้าโฟลเดอร์ย่อย + `features/admin/index.ts` barrel + `App.tsx` import จาก barrel
- [x] `roles/PermissionMatrix.tsx` + `CreateRoleDialog.tsx` · `backup/CronInput.tsx` · `audit/AuditDiffViewer.tsx` · `security/FailedLoginChart.tsx`
- [x] `master/AdminMasterHubPage.tsx` + route `/admin/master` + nav/tour `admin-master` (ใช้ `GET /api/v1/master-data/:entity/meta` สำหรับ count + “แก้ไขล่าสุด” จาก audit)
- [x] ลิงก์ hub → `/master-data?entity=…` (+ `MasterDataPage` อ่าน query `entity`)
- [x] `menu/MenuEditDialog.tsx` + `MenuTreeNode.tsx` + `menu-form-utils.ts`
- [x] `branding/LogoUploadCard` · `ColorPickerCard` · `ThemePreviewCard` · `branding-constants.ts`
- [x] §7.2 lib ใหม่: `admin-api.ts`, `settings-context.tsx`, `theme-provider.tsx`, `permissions.ts`
- [x] §7.3 `RequireRole` ครอบ `/admin/*` (แสดง 403 เมื่อไม่มีสิทธิ์)
- [x] §7.4 `SettingsProvider` + `ThemeProvider` ครอบทั้งแอปใน `main.tsx`

### 7.2 hook / lib ใหม่

```
PM-Pepsi-App/frontend/src/lib/
├── admin-api.ts                 # API client ทุก /admin/*
├── settings-context.tsx         # SettingsProvider — fetch /settings/public, ใช้ทั้ง public+admin
├── theme-provider.tsx           # apply primary/accent color เป็น CSS variable + theme mode
└── permissions.ts               # usePermission(code) hook
```

### 7.3 App.tsx — เพิ่ม route

```tsx
<Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
  <Route index element={<AdminConsolePage />} />
  <Route path="users" element={<AdminUsersPage />} />
  <Route path="roles" element={<AdminRolesPage />} />
  <Route path="menu" element={<AdminMenuPage />} />
  <Route path="branding" element={<AdminBrandingPage />} />
  <Route path="settings" element={<AdminSettingsPage />} />
  <Route path="master" element={<AdminMasterHubPage />} />
  <Route path="audit" element={<AdminAuditPage />} />
  <Route path="backup" element={<AdminBackupPage />} />
  <Route path="health" element={<AdminHealthPage />} />
  <Route path="announcements" element={<AdminAnnouncementsPage />} />
  <Route path="security" element={<AdminSecurityPage />} />
  <Route path="about" element={<AdminAboutPage />} />
</Route>
```

### 7.4 SettingsProvider (ครอบทั้งแอป)

```tsx
// ครอบที่ <App> — fetch /api/v1/settings/public 1 ครั้ง, apply CSS vars ทันที
useEffect(() => {
  const r = document.documentElement.style
  r.setProperty('--color-primary', settings.app.primary_color)
  r.setProperty('--color-accent', settings.app.accent_color)
  document.title = settings.app.name
  if (settings.app.logo_url) setFaviconHref(settings.app.favicon_url)
}, [settings])
```

---

## 8) Security & Audit (defense in depth — skills.md §3)

| ประเด็น | มาตรการ |
|---------|---------|
| RBAC | ✅ ทุก route admin ใช้ `requirePermission` — frontend จาก `user.permissions` |
| Audit | ✅ Write/Delete → `tbl_audit_log` (branding, settings, menu, role, backup, restore, impersonate, user pref) |
| Impersonate | ✅ `auth.impersonate.start` / `auth.impersonate.end` + banner **ทำงานในนาม XXX** + หยุดสวมรอย + TTL 30 นาที (token + FE timer) |
| Maintenance mode | ✅ 503 mutating API + banner (`maintenance-mode` middleware) |
| Password reset | ✅ `generateTemporaryPassword()` 12 ตัว (3+3+3+3) + `pass_must_change` (`053`) |
| Restore | ✅ auto maintenance ระหว่าง restore (`admin-backup-restore`) |
| Upload limit | ✅ `app.upload_max_mb` — `enforce-upload-size` + multer `getMulterFileSizeLimit()` refresh 60s |
| Rate limit | ✅ `express-rate-limit` auth/admin + audit `security.rate_limit` |
| Secret mask | ✅ `GET /admin/settings/secrets` masked •••• + migration `069_app.license_key_secret` |
| Logo upload | ✅ magic bytes + SVG sanitize → rasterize WebP (`image-magic`, `svg-sanitize`) |

---

## 9) Offline & Deploy (skills.md §1 / §4)

- Setting `backup.target_dir` default = `D:/PM-Pepsi-App/backup` (bind mount เข้า container ที่ `/backup`)
- Cron job รันใน container `api` (`node-cron` หรือ external cron + `docker exec`)
- Restore stream `.tar.gz` ผ่าน multer → temp file ใน `/tmp` → `pg_restore` → ลบ temp
- Auto-backup ใส่ใน `docker-compose.yml` service `api` env: `BACKUP_CRON=...` (fallback ถ้า DB ยังไม่ตั้ง)
- IndexedDB cache (`feature.indexeddb_offline`) — เก็บ list view เพื่อให้ admin ดู audit/backup history เมื่อ DB ไม่ตอบ (อ่านอย่างเดียว) — สอดคล้อง skills.md §2 “IndexedDB”

---

## 10) Migration plan (เรียงตามลำดับ)

| ลำดับ | ไฟล์ | สรุป |
|------|------|------|
| 1 | `044_tbl_role.sql` | สร้าง `tbl_role` + seed A/H/U/W |
| 2 | `045_tbl_permission.sql` | สร้าง `tbl_permission` + seed 66 permission codes |
| 3 | `046_tbl_role_permission.sql` | grant default per legacy: A=all, H=read+manager scope, U=planning subset, W=technician subset |
| 4 | `047_tbl_setting.sql` | สร้าง `tbl_setting` + seed default (branding/system/feature/backup) |
| 5 | `0XX_tbl_audit_log.sql` | สร้าง `tbl_audit_log` |
| 6 | `0XX_tbl_backup_history.sql` | สร้าง `tbl_backup_history` |
| 7 | `0XX_tbl_announcement.sql` | สร้าง `tbl_announcement` |
| 8 | `068_tbl_user_pref.sql` | สร้าง `tbl_user_pref` |
| 9 | `0XX_admin_menu.sql` | INSERT 12 รายการ admin menu ลง `tbmenu` (`menuright='A'`) |
| 10 | `0XX_tbworkcenter_must_change_password.sql` | ALTER เพิ่ม column |

> ลำดับเลข `0XX` กำหนดต่อจาก migration ล่าสุดที่มีอยู่ในขณะ implement (044–046 สำหรับ RBAC)

---

## 11) เกณฑ์ §3 (UI / Data / Business rules / Modal / Tests) — checklist

- [x] **3.1 UI** — 12 หน้า admin + AdminLayout + breadcrumb + tour + Liquid Glass theme + Pepsi color — 2026-05-20
  - 12 routes ใน `App.tsx` · `AdminPageRoot` + `data-tour` ทุกหน้า
  - `AdminLayout` + `AdminBreadcrumb` + `admin-layout-glass` / `app-surface` / `--app-primary` (Pepsi)
  - `AdminTour` นำทางอัตโนมัติครบ 12 หน้า (Joyride + `pm_seen_admin_tour`)
  - Vitest: `admin-sections.test.ts`, `admin-ui-checklist.test.ts`
- [x] **3.2 Data** — `tbl_role`, `tbl_permission`, `tbl_role_permission`, `tbl_setting`, `tbl_audit_log`, `tbl_backup_history`, `tbl_announcement`, `tbl_user_pref` + Zod schemas frontend/backend — 2026-05-20
  - Migrations `044`–`047`, `050`, `062`, `064`, **`068_tbl_user_pref`**
  - Backend: `schemas/admin-*.ts`, `user-pref.ts`, `lib/admin-data-tables.ts`
  - Frontend: mirrors ใน `api/schemas.ts` + `admin-data-schemas.test.ts`
  - API: `GET/PATCH /api/v1/user/preferences`, `POST .../tour-seen` (sync Joyride `seenTours.admin`)
  - Verify: `database/scripts/verify_admin_data_tables.sql`
- [x] **3.3 Business rules** — RBAC ทุก endpoint, audit ทุก write, maintenance mode 503, backup atomic, restore confirm — 2026-05-20
  - Middleware `createMaintenanceMiddleware` → 503 `MAINTENANCE` สำหรับ POST/PUT/PATCH/DELETE (ยกเว้น login/logout + admin bypass permissions)
  - `withBackupAdvisoryLock` + `hasRunningBackup` — backup/restore atomic
  - `restoreConfirmBodySchema` (`confirmPhrase: 'RESTORE'`) + UI confirm
  - `canAssign` / `canMovePlan` ใช้ `planning.assign` แทน `userst === 'A'`
  - Audit: `user.pref.update`, `user.pref.tour_seen`; RBAC deny → `rbac.deny`
  - Vitest: `admin-business-rules.test.ts`; FE `MaintenanceModeError` ใน `fetch-api.ts`
  - **Rate limit** — `express-rate-limit` ที่ `/api/v1/auth/*` + `/api/v1/admin/*` (100/min/IP, env `RATE_LIMIT_*`, audit `security.rate_limit`)
- [x] **3.4 Modal/Tabs** — Role create, Menu edit, Setting reset, Backup restore (confirm), Announcement edit, User reset/lock/impersonate — 2026-05-20
  - `ConfirmPhraseDialog` — settings reset (`RESET`), role delete (role code), announcement delete (`DELETE`), users reset/lock/impersonate/delete (id/username)
  - มีอยู่แล้ว: `CreateRoleDialog`, `MenuEditDialog`, backup restore (`RESTORE`), announcement create/edit
- [x] **3.5 Tests** — Vitest unit (`hasPermission`, `auditLog`), Supertest API (`/admin/users`, `/admin/branding/logo`, `/admin/backup`), Playwright E2E happy path admin tour — 2026-05-20
  - Unit (มีอยู่แล้ว): `has-permission.test.ts`, `audit-log.test.ts`, `admin-business-rules.test.ts`, `rate-limit.test.ts`
  - Supertest: `backend/src/routes/admin-api.supertest.test.ts` (401/403/200 RBAC, branding logo, backup list, restore validate)
  - FE unit: `admin-tour.test.ts` (`shouldAutoStartAdminTour`, `restartAdminTour`)
  - Playwright: `frontend/e2e/admin-tour.spec.ts` — ต้องตั้ง `E2E_ADMIN_USER` + `E2E_ADMIN_PASSWORD` + dev servers (`npm run test:e2e`)

---

## 12) ทำแล้ว

- [x] **§8 Security & Audit (defense in depth)** — 2026-05-20
  - Impersonate: `auth.impersonate.start/end`, JWT TTL 30m, `ImpersonationBanner`
  - Password: `lib/password-policy.ts` (12 chars, 4 classes)
  - Upload: `enforce-upload-size` + dynamic multer limits from `app.upload_max_mb`
  - Branding: `image-magic` + `svg-sanitize` before sharp
  - Secrets: `GET /admin/settings/secrets`, migration `069`
- [x] **Migration 044–046 (RBAC tables + seed)** — 2026-05-19
  - [`044_tbl_role.sql`](../../database/migrations/044_tbl_role.sql) — `tbl_role` + seed A/H/U/W (system roles)
  - [`045_tbl_permission.sql`](../../database/migrations/045_tbl_permission.sql) — `tbl_permission` + 66 codes
  - [`046_tbl_role_permission.sql`](../../database/migrations/046_tbl_role_permission.sql) — default grants (A=all, H/U/W subsets)
- [x] **RBAC engine (Phase A core)** — 2026-05-19
  - [`has-permission.ts`](../../PM-Pepsi-App/backend/src/lib/has-permission.ts) — cache 60s + legacy fallback ถ้ายังไม่รัน migration
  - [`require-permission.ts`](../../PM-Pepsi-App/backend/src/middleware/require-permission.ts) — `createRequirePermission` / `createRequireAnyPermission`
  - `GET /api/v1/auth/me` → `user.permissions[]`
  - Routes migrated: personnel admin, manhours admin, planning assign, WO planning batch, confirmation import
- [x] **Frontend RBAC nav** — [`use-permission.ts`](../../PM-Pepsi-App/frontend/src/lib/use-permission.ts), [`nav-route-permissions.ts`](../../PM-Pepsi-App/frontend/src/lib/nav-route-permissions.ts), `filterNavForUser` ใช้ `user.permissions` จาก `/auth/me`
- [x] **Migration 047 (`tbl_setting`)** — 2026-05-19 — [`047_tbl_setting.sql`](../../database/migrations/047_tbl_setting.sql) 21 keys (branding/system/feature/backup/maintenance)

---

## 13) สรุป Phase A–F (implement หลัก — ทำแล้ว)

| Phase | สถานะ | หมายเหตุ |
|-------|--------|----------|
| A — RBAC | ✅ แกน | `044`–`046`, `requirePermission`, `/auth/me` → `permissions[]` — **ยังไม่** ครบทุก route นอก admin |
| B — Settings & Branding | ✅ แกน | `047`, public settings, branding/settings pages — บางรายการ spec §4.4 ยังไม่ครบ |
| C — Audit & Health | ✅ แกน | `050`, `/admin/audit`, `/admin/health` — ยังไม่มี error log / slow API / run migration จาก UI |
| D — Users & Menu | ✅ แกน | users/roles/menu — bulk role ✅; ยังไม่มี sync menu PHP, UI `nav.shell_mode` |
| E — Backup & Ops | ✅ แกน | `062`–`065`, backup/announcements/security/about |
| F — UX | ✅ แกน | Layout, tour, cmdk, tests — E2E ต้องตั้ง env + CI |

รายการที่ยังต้องทำต่อ → [**§ CHECKLIST — ปิดงาน Admin**](#checklist--ปิดงาน-admin-ทำต่อ)

---

## CHECKLIST — ปิดงาน Admin (ทำต่อ)

ใช้ติ๊ก `[x]` เมื่อปิดงานจริง แล้วอัปเดต [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md) แถวลำดับ 14 และ §7 ใน [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md)

### 0) ฐานข้อมูล & สภาพแวดล้อม (ทำก่อน — ไม่งั้นหน้า admin ว่าง/403)

> **สคริปต์รวม (repo):**
> - ครบ 001–069: [`database/scripts/run-all-migrations.ps1`](../../database/scripts/run-all-migrations.ps1)
> - เฉพาะ admin 044–069: [`database/scripts/run-admin-migrations.ps1`](../../database/scripts/run-admin-migrations.ps1)
> - ตรวจ §0 อัตโนมัติ: [`database/scripts/verify-admin-environment.ps1`](../../database/scripts/verify-admin-environment.ps1)
>
> **PG dev ที่ใช้กับ DBeaver:** `postgresql://pepsipm:***@127.0.0.1:5433/pepsi_pm` (PostgreSQL **11** · service `postgresql-x64-11`) — ไม่สลับพอร์ตกับ PG 18 ที่ `5432`

- [x] รัน migration admin ครบบน PG เป้าหมาย: **`044`–`047`**, **`050`**, **`053`**, **`058`–`061`**, **`062`–`069`** (ต่อจาก `001`–`043`) — ตรวจ 2026-05-21: ตาราง §3.2 ครบทุก `ok=t`
- [x] รัน [`database/scripts/verify_admin_data_tables.sql`](../../database/scripts/verify_admin_data_tables.sql) — ทุกแถว `ok = t`
- [x] Login **`ADMIN01`/`admin`** แล้ว API admin ไม่ 503 `SCHEMA_NOT_READY` (`GET /admin/settings` ผ่าน)
- [x] Backend `.env`: `DATABASE_URL` (5433), `SESSION_SECRET` · Frontend: `.env.local` + proxy (`VITE_API_URL` ว่าง)

### 1) Admin Console & Navigation

> **13 โมดูล** = Console + 12 หน้าย่อย (ตาราง §2 ลำดับ 14.0–14.12) · sidebar/command palette สร้างจาก [`admin-nav-entries.ts`](../../PM-Pepsi-App/frontend/src/lib/admin-nav-entries.ts)

- [x] KPI บน `/admin` โหลดจาก `GET /admin/health` (เมื่อมี `admin.health.read`) + แสดง error ชัด · quick links 11 หน้าย่อย + KPI โมดูลตาม RBAC
- [x] Sidebar กรองด้วย `user.permissions` (`filterNavForUser` + `rbacStrict` ใน `use-app-nav.ts`)
- [x] Sidebar ครบ 13 รายการรวม **`/admin/master`**, **`/admin/security`**, **`/admin/about`** (จาก `buildAdminNavEntries()`)
- [x] Breadcrumb + `AdminLayout` ทุก sub-route ใน `App.tsx`
- [x] React Joyride: ทัวร์ Console + 11 หน้า + command hint · `markAdminTourSeen()` → `POST /user/preferences/tour-seen` + localStorage
- [x] ⌘K / Ctrl+K → `AppCommandPalette` รายการ admin ตามสิทธิ์แต่ละโมดูล

### 2) Users (`/admin/users`)

- [x] แท็บ **Work center** + **Member** ในหน้าเดียว (`PersonnelAdminPage` variant `admin`)
- [x] Reset password + `pass_must_change` (`053`) — API + badge ในตาราง
- [x] Lock / Unlock (workcenter + member)
- [x] Impersonate + `ImpersonationBanner` + audit `auth.impersonate.*`
- [x] Filter บทบาท (`userrole`) + สถานะใช้งาน (`workstatus`)
- [x] **Bulk เปลี่ยนบทบาท** — `POST /admin/users/bulk-userrole` + checkbox + dropdown
- [x] `/personnel/admin` → redirect `/admin/users` (`App.tsx`); legacy nav ชี้ `/admin/users`

### 3) Roles & Permissions (`/admin/roles`)

- [x] Matrix grant/revoke บันทึก `tbl_role_permission` (`PUT .../permissions` + `PermissionMatrix`)
- [x] สร้าง role ใหม่ (`is_system=false`) + ห้ามลบ system role (`CreateRoleDialog` + API 403 `SYSTEM_ROLE`)
- [x] **Simulate role** — `GET/POST .../simulate` + `RbacPreviewBanner` + `RoleNavPreview` + `rbac-preview` กรองเมนู
- [x] role **H/U/W** — Vitest `nav-rbac.test.ts`, `rbac-role-nav-preview.test.ts` (ไม่มี `/admin/*`, มี planning/confirmation ตามสิทธิ์)

### 4) Menu Builder (`/admin/menu`)

- [x] DnD เรียง `menuon` + CRUD modal (`MenuEditDialog`)
- [x] Preview sidebar ตาม role / permissions matrix (`MenuPreviewPanel`)
- [x] **UI `nav.shell_mode`** — `MenuNavLayoutCard` + `GET/PUT /admin/menu/layout` บันทึก `tbl_setting`
- [x] `AppNavShell` อ่าน `navShellMode` จาก `GET /settings/public` (sidebar / navbar / hamburger)
- [x] **Sync from PHP** — `POST /admin/menu/sync-from-php` + ปุ่มยืนยัน `SYNC_MENU`
- [x] Audit: `admin.menu.create/update/delete/reorder/layout/sync`

### 5) Branding (`/admin/branding`)

- [x] อัปโหลดโลโก้ → WebP BYTEA + `GET /settings/public/logo`
- [x] Favicon upload + `GET /settings/public/favicon`
- [x] Preset Pepsi / Liquid Glass + **primary + accent** (`ColorPickerCard`, `COLOR_PRESETS`)
- [x] **สี success / warning / danger / info** — `SemanticColorCard` + patch/public + `--admin-*` ใน `apply-theme.ts`
- [x] App name, footer text, theme mode light/dark/system
- [x] ปุ่มคืนค่า default Pepsi (`POST /admin/branding/reset`, `BRANDING_DEFAULTS` `#004C97` / `#E31837`)
- [x] **Login background** — `POST/DELETE /admin/branding/login-background` + `GET /settings/public/login-background` + `LoginBackgroundCard`
- [x] หน้า login ใช้ branding จาก `GET /settings/public` (โลโก้, ชื่อแอป, พื้นหลัง)

### 6) System Settings (`/admin/settings`)

- [x] Timezone, locale, พ.ศ./ค.ศ., date format (`AdminSettingsPage` + `tbl_setting`)
- [x] Upload max MB, session TTL, password policy — `enforce-upload-size` + `session-ttl.ts` + `password_min_length` / `max_login_attempts` (migration 070)
- [x] Maintenance mode + message (503 `MAINTENANCE` + `SettingsProvider` banner)
- [x] Feature flags: IndexedDB offline, dashboard charts — UI ระบุ Joyride / Optimistic UI / DnD calendar ยังไม่มี toggle
- [x] **คืนค่ามาตรฐาน** ต่อ section — `POST /admin/settings/reset/:section` + ปุ่มต่อการ์ด
- [x] Masked secrets — `GET /admin/settings/secrets` + การ์ด UI (migration 069)

### 7) Master Data Hub (`/admin/master`)

- [x] ตาราง 17 entity + `GET /master-data/:entity/meta` (count + `lastUpdatedAt`) — `AdminMasterHubPage` + แถวรวม
- [x] ลิงก์ไป `/master-data?entity=...` — `masterDataHref()` + แท็บตาม URL ใน `MasterDataPage`
- [x] UI hub อัปเดตแล้ว (ไม่มีข้อความ “รอ meta API”) — แสดง legacy + audit ล่าสุด
- [x] สิทธิ์ `master-data.read` — hub, nav, `nav-route-permissions` (ไม่ใช้ `admin.settings.read`)

### 8) Audit (`/admin/audit`)

- [x] Filter วันที่ / actor / action / resource / status (+ กลุ่ม action prefix, ค้นหา `q`)
- [x] Diff viewer before/after (`AuditDiffViewer` + dialog)
- [x] Export CSV + ลบเก่ากว่า X วัน (`admin.audit.delete`)
- [x] `useInfiniteQuery` + skeleton แถวตาราง + โหลดเพิ่ม
- [x] IndexedDB cache เมื่อ `feature.indexeddb_offline` เปิด (จาก `GET /settings/public`)
- [x] **Audit master-data** — `auditMasterDataMutations` middleware (`master-data.create/update/delete/import`)

### 9) Backup (`/admin/backup`)

- [x] Manual backup → `pg_dump` → `.sql.gz` ใน `backup.target_dir` (default `D:/PM-Pepsi-App/backup`)
- [x] ประวัติ + download + delete + SHA256 (`tbl_backup_history`)
- [x] Cron schedule + retention (`startBackupScheduler` ทุก 60s + `purgeOldBackups`)
- [x] Restore + confirm `RESTORE` + maintenance auto (`admin-backup-restore.ts`)
- [x] UI แสดง `pg_dump`/`psql` path + สถานะพร้อม (Windows / `PG_DUMP_PATH`, `PSQL_PATH`)

### 10) Health (`/admin/health`)

- [x] Poll DB latency + pool (poll 10s)
- [x] Disk path (เช่น `D:\`) free/used (`fs.statfs` + path picker)
- [x] Migration probes list (applied/pending)
- [x] แท็บ **Error log** — `GET /admin/health/errors` (tail `tbl_audit_log` status=error)
- [x] แท็บ **Slow API** — `GET /admin/health/slow-apis` (middleware p95 > 1s)
- [x] **Run pending migrations** — `POST /admin/health/migrate` + UI (phrase `MIGRATE`, ต้องเปิด maintenance)
- [ ] Docker container CPU/RAM — spec ระบุ · ตอนนี้มีแค่ **process** metrics (RSS/heap)

### 11) Announcements (`/admin/announcements`)

- [x] CRUD `tbl_announcement` (`GET/POST/PUT/DELETE /admin/announcements` + audit)
- [x] Banner ใน `AppShell` — `AnnouncementBanner` + `GET /announcements/active` (dismiss → localStorage)
- [x] Shortcut maintenance — toggle + แก้ข้อความ (`patchAdminSettings`) · banner ระบบจาก `SettingsProvider` (`maintenance.enabled`)

### 12) Security (`/admin/security`)

- [x] กราฟ failed login รายวัน (Chart.js + `auth.login` denied)
- [x] ตาราง RBAC deny — `action=rbac.deny` จาก `requirePermission` middleware
- [x] รายการ IP rate limit — `action=security.rate_limit` + IP ผิดปกติ (denied ≥3)
- [x] **Block IP** + `tbl_blocked_ip` — migration `072`, middleware 403 `IP_BLOCKED`, `/admin/security/blocked-ips`, UI `BlockedIpCard` + quick block จาก rate limit / suspicious IP (`admin.security.write`)

### 13) About (`/admin/about`)

- [x] Version, build hash, vendor S.Y. Interactive, client Pepsi — `GET /api/v1/admin/about`, `AdminAboutPage`, `BUILD_COMMIT` / `BUILD_TIME`
- [x] Migration สรุป + disk จาก health API — reuse `getAdminHealth`, progress bar, link Health/Settings; license จาก `app.license_key` + env

### 14) RBAC & Security ข้ามระบบ

- [x] ย้าย route ที่ยังใช้แค่ `requireAuth` → **`requirePermission`** ครบ (dashboard, backlog, calendar, line-calendar, iw37n, master-data, reports, planning, scheduling, work-orders, personnel, manhours, user-log) — audit `rbac-route-audit.test.ts`
- [x] Rate limit `/auth/*` + `/admin/*` + audit `security.rate_limit` — `registerRateLimiters` ใน `app.ts` + `rate-limit.ts`
- [x] FE + BE สอดคล้อง — `NavRouteGuard` + `permissionForRoute` (403), Master Data / IW37N ซ่อนปุ่ม mutate, `nav-route-permissions` ปรับ `/personnel/admin`

### 15) ทดสอบ & ส่งมอบ

- [ ] Backend: `npm test` ใน `PM-Pepsi-App/backend` ผ่าน (ปัจจุบัน ~89 tests)
- [ ] Frontend: `npm test` ผ่าน (admin-tour, schemas, …)
- [ ] Playwright `e2e/admin-tour.spec.ts` — ตั้ง `E2E_ADMIN_USER` / `E2E_ADMIN_PASSWORD` + รันใน CI
- [ ] UAT มือ: branding → reload ทั้งแอป · backup บน D: · restore บน staging เท่านั้น
- [ ] อัปเดต [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md) แถว 14 เป็น **เสร็จ** เมื่อ §0–§14 ครบตามที่ทีมตกลง “ปิด admin”

### 16) Deploy offline (ลำดับ 13 — คู่กับ admin)

- [ ] `docker-compose.yml` (db + api + web) + bind mount `database/postgres` และ `backup/`
- [ ] `BACKUP_CRON` ใน container `api`
- [ ] Manifest + SHA256 ส่งมอบ — ดู [`13-deploy-offline.md`](13-deploy-offline.md)

---

## 14) Stack เต็มรูปแบบ (skills.md) — ความพร้อมต่อหมวด

| §2 หมวด | สถานะหลัง implement Phase A–F |
|---------|------------------------------|
| Shadcn/ui | ✅ ทุกหน้า admin |
| Tailwind | ✅ |
| Lucide icons | ✅ |
| Framer Motion | ✅ tour transitions, modal |
| Anime.js | ✅ micro-animation บน color picker |
| DnD-kit | ✅ `/admin/menu`, `/admin/roles` row reorder |
| Skeleton screens | ✅ ทุก list |
| Optimistic UI | ✅ toggle setting/permission |
| React Hook Form + Zod | ✅ ทุกฟอร์ม |
| Sonner | ✅ ทุก action |
| React Joyride | ✅ admin tour ครั้งแรก |
| TanStack Query | ✅ ทุก fetch |
| Highcharts / Chart.js | ✅ `/admin/security`, `/admin/health` |
| IndexedDB | ✅ cache audit/backup readonly |
| Backend Express + Zod | ✅ + Helmet, rate limit (skills.md §3) |
| RBAC enforcement | ✅ ทุก endpoint |
| Audit trail | ✅ login, import, confirm, master, admin write |
| Docker compose | ✅ ใช้ `BACKUP_CRON` env, bind mount D: `/backup` |
| Auto backup | ✅ schedule + retention + sha256 |
| Vitest + Supertest + Playwright | ✅ ตาม §3 ทดสอบ |

> หมวดที่ Phase F ครอบคลุม = **โมดูล admin จะเป็นโมดูลแรกที่ผ่านเกณฑ์ "stack เต็มรูปแบบ"** ตาม [`00-stack-target.md`](00-stack-target.md)

---

## 15) ข้อพิจารณาเฉพาะลูกค้า (จาก skills.md)

| ข้อกำหนด | ที่จะ implement |
|---------|----------------|
| Server offline (ไม่มี internet) | ทุก library import ผ่าน npm cache; ไม่มี CDN runtime; favicon/logo เก็บใน DB ไม่ใช้ external |
| ติดตั้งใน D: ใช้พื้นที่ ≤ 300GB | Backup target = `D:/PM-Pepsi-App/backup` + retention policy 30 วัน + auto cleanup |
| Theme = Liquid Glass + Pepsi (แดง/ขาว/น้ำเงิน) | AdminLayout + preset color 3 ชุด (Pepsi default, Liquid Glass Light, Dark) + `prefers-color-scheme` |
| Logo customize ได้ | `/admin/branding` + `tbl_setting.app.logo_bytes` + endpoint public + restore default |
| ไม่ remote เข้า server | ทุกฟังก์ชัน admin ทำผ่าน UI ของแอปได้ — ไม่ต้องเข้า DBeaver/SSH (รวมถึง migration runner ใน `/admin/health`) |
| Auto backup | `/admin/backup` schedule + run cron ใน container `api` + บันทึก `tbl_backup_history` |
| PDPA / นโยบาย client cache | `tbl_user_pref` + IndexedDB clear policy (admin reset ผ่าน UI ได้) ✅ |
| Audit trail ตามนโยบายลูกค้า | `tbl_audit_log` + retention setting + export CSV |

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-19 | **§7.1 Frontend structure** — โฟลเดอร์ admin ตามแผน, barrel export, Master Hub, แยก PermissionMatrix/CronInput, 13 routes |
| 2026-05-20 | **§8 Security & Audit** — impersonate TTL/audit, password policy, upload limit จาก settings, logo magic bytes, secret mask API |
| 2026-05-20 | **§3.5 Tests** — Supertest admin API, Playwright admin tour E2E, `admin-tour.test.ts` |
| 2026-05-20 | **§3.4 Modal/Tabs + rate limit** — `ConfirmPhraseDialog` ทุก destructive action; `express-rate-limit` auth/admin + audit `security.rate_limit` |
| 2026-05-20 | **§3.2 Data checklist** — migration `068_tbl_user_pref`, user preferences API, schema contract tests BE/FE, `verify_admin_data_tables.sql` |
| 2026-05-20 | **§3.1 UI checklist** — ยืนยัน 13 หน้า admin (รวม `/admin/master`), tour นำทางอัตโนมัติ, `AdminPageRoot`, อัปเดต Console |
| 2026-05-21 | **CHECKLIST ปิดงาน** — ปรับสถานะรวมเป็น “แกน ~90%”; เพิ่ม § CHECKLIST 16 กลุ่ม (0–16) แยกสิ่งที่ทำแล้ว vs ค้าง (nav shell UI, bulk role, sync menu, สี 6 ตัว, health tabs/migrate, audit master-data, RBAC ทุก route, deploy) |
| 2026-05-21 | อัปเดต [`PLAN.md`](PLAN.md) §3.2 — Admin `/admin/*` แกน ✅ · UAT ⏳ (สอดคล้อง parity ธุรกิจ) |
| 2026-05-19 | **สร้างเอกสารออกแบบ ลำดับ 14 — Administrator** ครอบคลุม 12 หน้าย่อย + 8 ตารางใหม่ + ~40 endpoint + UI/UX ตาม Liquid Glass + Pepsi palette + integration กับ skills.md §1–§4 (offline, Auto backup D:, RBAC, audit, customize logo); แบ่ง implementation เป็น 6 phase A–F |
| 2026-05-19 | **Phase A — Migration 044–046** — `tbl_role` (4 system roles), `tbl_permission` (66 codes), `tbl_role_permission` (A=all, H manager subset, U planner, W technician) |
| 2026-05-19 | **Phase B — Migration 047** — `tbl_setting` + seed 21 keys (Pepsi theme, locale, feature flags, backup D:, maintenance) |
