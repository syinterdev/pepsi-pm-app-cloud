# Unified Login + Module Portal — สเปกออกแบบ (ร่าง)

**วันที่:** 2026-06-09  
**สถานะ:** ร่าง — รอ confirm ลูกค้า / ทีม  
**ที่มา:** ลูกค้าต้องการโปรเจกต์เพิ่ม (สโตร์อะไหล่ · แจ้งซ่อม · อื่นๆ) โดย login จุดเดียว → Portal การ์ดตามสิทธิ์ → redirect ไปแอปที่อนุญาต

**Checklist UI (ทำคู่ U4):** [`../../customer-requirements/PRE-UAT-UI-PHASES.md`](../../customer-requirements/PRE-UAT-UI-PHASES.md) §**U4f**  
**Handoff สโตร์/แจ้งซ่อม (เมื่อมี URL):** [`2026-06-09-module-handoff-store-repair.md`](2026-06-09-module-handoff-store-repair.md)

**นิยามสโตร์ (ลูกค้า):** **สโตร์เบิกอะไหล่/วัสดุ** สำหรับช่างในการซ่อมและทำ PM — **ไม่ใช่** ร้านค้าปลีก

**เกี่ยวข้อง:** PM-Pepsi-App auth/RBAC ปัจจุบัน · [`WORK-PHASES.md`](../../WORK-PHASES.md) · [`PRE-UAT-MASTER-PHASES.md`](../../PRE-UAT-MASTER-PHASES.md)

---

## 1) เป้าหมายลูกค้า

| เป้า | รายละเอียด |
|------|-------------|
| **Login จุดเดียว** | ชื่อผู้ใช้/รหัสผ่านชุดเดียว (หรือ account เดียว) ไม่ต้อง login ซ้ำทุกระบบ |
| **Portal หลัง login** | หน้าการ์ดแสดงเฉพาะ module ที่ user มีสิทธิ์ |
| **Redirect ตามสิทธิ์** | คลิกการ์ด → เข้าเว็บ/แอปของ module นั้น (PM · สโตร์ · แจ้งซ่อม · …) |
| **แยกสิทธิ์ต่อ module** | คนเดียวอาจเห็นแค่ PM, อีกคนเห็น PM+สโตร์, Admin เห็นทุกอัน |

**ไม่รวมในรอบแรก (ยืนยันทีหลัง):** รายละเอียดฟีเจอร์สโตร์/แจ้งซ่อม · บัญชี AD/LDAP · mobile app แยก

---

## 2) สถานะปัจจุบัน (PM-Pepsi-App)

```text
/login  →  POST /api/v1/auth/login  →  cookie pm_session (HMAC JWT)
         →  redirect ตาม role โดยตรง:
              A → /          U → /planning    W → /plan-calendar
              member → /
```

- ผู้ใช้: `tbworkcenter` (ช่าง) + `tbl_member` (สมาชิก)
- สิทธิ์: `tbl_role` + `tbl_permission` + `tbl_role_permission` + legacy `userst` A/U/W
- **ยังไม่มี** หน้า portal · **ยังไม่มี** แนวคิด module หลายแอป

---

## 3) เป้าหมาย UX ใหม่

```text
                    ┌─────────────────┐
                    │  /login (เดียว)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  /portal         │
                    │  การ์ด Module    │
                    │  (กรอง RBAC)    │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ PM Pepsi     │  │ สโตร์อะไหล่  │  │ แจ้งซ่อม     │
    │ (แอปนี้)     │  │ เบิกวัสดุช่าง │  │ (แอปใหม่)    │
    └──────────────┘  └──────────────┘  └──────────────┘
```

**กรณีมีสิทธิ์ module เดียว:** ข้าม portal ไปแอปนั้นเลย (optional — ตั้งค่าได้)

**กรณีไม่มีสิทธิ์ module ใด:** หน้า portal ว่าง + ข้อความติดต่อ Admin

---

## 4) แนวทางสถาปัตยกรรม (3 ทางเลือก)

### ทางเลือก A — Portal + หลาย module ใน SPA เดียว (Monorepo)

| ข้อดี | ข้อเสีย |
|-------|---------|
| Login/RBAC ใช้ของเดิม | แอปโตเร็ว · bundle ใหญ่ |
| Deploy ชุดเดียว | ทีมสโตร์/แจ้งซ่อมต้องแชร์ repo หรือ merge บ่อย |
| UX ลื่น (ไม่ reload ข้ามโดเมน) | ไม่เหมาะถ้าแต่ละ module เป็น vendor คนละทีม |

- Route: `/portal`, `/pm/*`, `/store/*`, `/repair/*`
- Permission: `module.pm`, `module.store`, `module.repair`

### ทางเลือก B — Hub Portal + แอปแยก deploy (แนะนำถ้า module เป็นคนละโปรเจกต์) ⭐

| ข้อดี | ข้อเสีย |
|-------|---------|
| PM / สโตร์ / แจ้งซ่อน deploy อิสระ | ต้องออกแบบ SSO ข้ามแอป |
| Scale ทีมแยกได้ | โดเมน/ cookie ต้องวางแผน |
| PM app ปัจจุบันแทบไม่ต้องย้าย logic | Auth service กลาง (ขั้นแรกอาจอยู่ใน PM backend) |

**Flow SSO แบบง่าย (Phase 1):**

1. User login ที่ Hub (`pm.example.com` หรือ `portal.example.com`)
2. Portal เรียก `GET /api/v1/portal/modules`
3. คลิกการ์ด **ภายใน** → same-origin `/...` (PM)
4. คลิกการ์ด **ภายนอก** → `POST /api/v1/auth/module-handoff` ได้ one-time code (60s) → redirect `https://store.example.com/auth/callback?code=...` → แอปปลายทางแลก session ของตัวเอง

### ทางเลือก C — IdP กลาง (Keycloak / Azure AD / OIDC)

| ข้อดี | ข้อเสีย |
|-------|---------|
| มาตรฐานองค์กร · MFA · AD | งาน ops + ค่าใช้จ่าย · overkill ระยะสั้น |
| ทุกแอปเป็น OIDC client | ต้อง migrate user/password |

**แนะนำ:** เริ่ม **B** → ค่อยย้าย **C** เมื่อลูกค้าต้อง AD

---

## 5) แบบข้อมูล (ร่าง)

### 5.1 ตาราง Module registry

```sql
-- migration ร่าง
CREATE TABLE app.tbl_app_module (
  module_code   text PRIMARY KEY,          -- 'pm', 'store', 'repair'
  name_th       text NOT NULL,
  name_en       text NOT NULL,
  description_th text,
  description_en text,
  icon_key      text,                      -- lucide / asset key
  accent_token  text,                      -- CSS token สีการ์ด
  base_url      text NOT NULL,             -- '' = same app; https://store...
  entry_path    text DEFAULT '/',          -- path หลังเข้า module
  sort_order    int  NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  handoff_mode  text NOT NULL DEFAULT 'none'  -- none | same_origin | code_exchange
);

-- สิทธิ์เข้า module (ผูก role เดิม)
CREATE TABLE app.tbl_role_module (
  role_code    text NOT NULL REFERENCES app.tbl_role(role_code),
  module_code  text NOT NULL REFERENCES app.tbl_app_module(module_code),
  PRIMARY KEY (role_code, module_code)
);
```

**ทางเลือก:** ใช้ `tbl_permission` แทน (`module.pm`, `module.store`) — สอดคล้อง RBAC ปัจจุบัน · ไม่ต้องตาราง `tbl_role_module`

### 5.2 Permission codes (แนะนำ)

| Code | ความหมาย |
|------|----------|
| `module.pm` | เข้า PM Maintenance |
| `module.store` | เข้าระบบสโตร์เบิกอะไหล่ (งานซ่อม/PM) |
| `module.repair` | เข้าระบบแจ้งซ่อม |
| `portal.view` | เห็นหน้า portal (default ทุกคนที่ login ได้) |

Admin → Roles matrix เพิ่มคอลัมน์ module

### 5.3 Seed เริ่มต้น

| module_code | name_th | base_url | handoff |
|-------------|---------|----------|---------|
| `pm` | PM Pepsi | `` (same app) | same_origin |
| `store` | สโตร์อะไหล่ (เบิกวัสดุช่าง) | TBD | code_exchange |
| `repair` | แจ้งซ่อม | TBD | code_exchange |

---

## 6) API ร่าง

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/v1/portal/modules` | รายการ module ที่ user มีสิทธิ์ + metadata การ์ด |
| POST | `/api/v1/auth/module-handoff` | body `{ moduleCode }` → `{ redirectUrl, code?, expiresAt }` |
| POST | `/api/v1/auth/module-exchange` | แอปปลายทางแลก `code` → session ของแอปนั้น (ถ้าแชร์ auth service) |

**Response ตัวอย่าง `GET /portal/modules`:**

```json
{
  "modules": [
    {
      "code": "pm",
      "name": "PM Maintenance",
      "description": "แผนงาน · WO · Confirm",
      "iconKey": "wrench",
      "entryUrl": "/plan-calendar",
      "external": false
    },
    {
      "code": "store",
      "name": "สโตร์",
      "description": "จัดการสต็อก/เบิก",
      "iconKey": "package",
      "entryUrl": "https://store.factory.local/auth/callback",
      "external": true,
      "handoff": "code_exchange"
    }
  ],
  "autoRedirect": null
}
```

`autoRedirect`: ถ้ามีสิทธิ์ module เดียว → ส่ง URL เพื่อข้าม portal

---

## 7) Frontend ร่าง (PM app เป็น Hub ชั่วคราว)

| งาน | รายละเอียด |
|-----|------------|
| หน้า `/portal` | `AppPageShell` · grid การ์ด glass · ไอคอน + ชื่อ TH/EN |
| หลัง login | `resolvePostLoginPath` → `/portal` (แทน `/plan-calendar` โดยตรง) |
| Deep link | เก็บ `?module=pm` หรือ path เดิมหลัง login |
| Settings | ลิงก์ "กลับ Portal" ใน topbar (ถ้ามี >1 module) |
| i18n | `portal.json` EN/TH |

**UI:** ใช้ design system เดิม (U4) — การ์ด module เป็นชุดใหม่ใน `/dev/ui`

---

## 8) แผน Phase (ไม่บล็อก Pre-UAT PM)

| Phase | ชื่อ | ขอบเขต | หมายเหตุ |
|-------|------|--------|----------|
| **M0** | Portal ใน PM | ตาราง module + permission · หน้า `/portal` · PM การ์ดเดียวทำงาน | ไม่ต้องมีแอปสโตร์จริง |
| **M1** | RBAC module | Admin Roles ติ๊ก module · API handoff ร่าง | mock URL สโตร์/แจ้งซ่อม |
| **M2** | แอปสโตร์ | โปรเจกต์ใหม่ + exchange code | ทีมลูกค้า/spec แยก |
| **M3** | แจ้งซ่อม | เหมือน M2 | |
| **M4** | IdP (optional) | OIDC / AD | เมื่อลูกค้าพร้อม |

**ความสัมพันธ์ Pre-UAT:** PM UAT ยังทำได้โดยข้าม portal (feature flag `PORTAL_ENABLED=false`) หรือ portal มีแค่การ์ด PM

---

## 9) คำถามที่ต้อง confirm ลูกค้า (ก่อน implement)

1. **สโตร์ / แจ้งซ่อม** — แอปแยก deploy (คนละ URL) หรืออยู่ในเว็บเดียวกับ PM?
2. **โดเมน** — `pm.factory.com` + `store.factory.com` หรือ path เดียว `/store`?
3. **บัญชีผู้ใช้** — ชุดเดียวกับ PM (`tbworkcenter`/`tbl_member`) หรือ user store แยก?
4. **Login หลัง portal** — ถ้ามีสิทธิ์แค่ 1 module ให้ข้าม portal หรือโชว์ portal เสมอ?
5. **ลำดับ go-live** — Portal ก่อน หรือรอสโตร์พร้อมค่อยเปิด portal?

---

## 10) ความเสี่ยง

| ความเสี่ยง | การลด |
|------------|--------|
| Cookie ข้าม subdomain ไม่ได้ | ใช้ code exchange แทน shared cookie |
| แอปใหม่ไม่ใช่ stack เดียว (PHP/.NET) | Handoff code + REST exchange มาตรฐานเดียว |
| RBAC ซับซ้อน (สิทธิ์ PM ละเอียด + สิทธิ์ module) | แยก layer: `module.*` = เข้าแอป · permission เดิม = ในแอป |
| บล็อก UAT PM | Feature flag · portal optional รอบแรก |

---

## 11) สรุปแนะนำทีม

1. ยอมรับแนว **Hub Portal (ทางเลือก B)** เป็นเป้าหลัก — PM app เป็น Hub รอบแรก  
2. ทำ **M0** หลัง Pre-UAT PM (หรือ parallel ถ้าลูกค้ายืนยันไม่บล็อก)  
3. ใช้ **`module.*` permissions** ใน RBAC เดิม — ไม่สร้างระบบ login ใหม่  
4. สโตร์/แจ้งซ่อมเป็น **repo/deploy แยก** แลก token ผ่าน `module-handoff`

---

## บันทึก

| วันที่ | เหตุการณ์ |
|--------|-----------|
| 2026-06-09 | สร้างสเปกจาก requirement ลูกค้า — รอ review |
