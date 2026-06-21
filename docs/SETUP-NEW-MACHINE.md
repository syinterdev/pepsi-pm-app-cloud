# ติดตั้งเครื่องใหม่ — PostgreSQL + PM Pepsi App

**อัปเดต:** 2026-05-26  
ใช้เมื่อย้ายเครื่องพัฒนา / เครื่อง UAT / เซิร์ฟเวอร์ใหม่

---

## สารบัญ

1. [สิ่งที่ต้องติดตั้ง](#1-สิ่งที่ต้องติดตั้ง)
2. [ดึงโค้ดจาก Git](#2-ดึงโค้ดจาก-git)
3. [PostgreSQL — กรณีเครื่องใหม่ (ไม่มีข้อมูลเดิม)](#3-postgresql--กรณีเครื่องใหม่ไม่มีข้อมูลเดิม)
4. [PostgreSQL — ย้ายจากเครื่องเก่า](#4-postgresql--ย้ายจากเครื่องเก่า)
5. [รัน migration + seed](#5-รัน-migration--seed)
6. [Backend (API)](#6-backend-api)
7. [Frontend (React)](#7-frontend-react)
8. [ตรวจว่าใช้งานได้](#8-ตรวจว่าใช้งานได้)
9. [E2E smoke (ทางเลือก)](#9-e2e-smoke-ทางเลือก)
10. [โฟลเดอร์ / ข้อมูลเสริม](#10-โฟลเดอร์--ข้อมูลเสริม)
11. [แก้ปัญหาที่พบบ่อย](#11-แก้ปัญหาที่พบบ่อย)
12. [เช็กลิสต์ก่อนเสนอลูกค้า](#12-เช็กลิสต์ก่อนเสนอลูกค้า)

---

## 1. สิ่งที่ต้องติดตั้ง

| ซอฟต์แวร์ | เวอร์ชันแนะนำ | ใช้ทำอะไร |
|-----------|---------------|-----------|
| **Git** | ล่าสุด | ดึงโค้ด |
| **Node.js** | 20 LTS ขึ้นไป | frontend + backend |
| **PostgreSQL** | 14+ (15/16/18 ได้) | ฐานข้อมูล `app.*` |
| **psql** | มากับ PostgreSQL | รัน migration จากสคริปต์ |
| **PowerShell** | 5.1+ (Windows) | สคริปต์ `database/scripts/*.ps1` |

ทางเลือก:

- **DBeaver** — รัน SQL ทีละไฟล์ถ้าไม่มี `psql` ใน PATH
- **Playwright** — ติดตั้งอัตโนมัติเมื่อรัน E2E ครั้งแรก (`npx playwright install`)

---

## 2. ดึงโค้ดจาก Git

```powershell
cd C:\Users\<คุณ>\Desktop
git clone https://github.com/chinchettha/pepsi_pm_application.git sap_241163
cd sap_241163
git pull origin main
```

โครงสร้างหลัก:

| โฟลเดอร์ | คำอธิบาย |
|----------|----------|
| `PM-Pepsi-App/frontend` | React + Vite |
| `PM-Pepsi-App/backend` | Express API |
| `database/migrations` | SQL schema (`app`) — ปัจจุบัน `001`–`084+` |
| `database/seeds` | ผู้ใช้ทดสอบ + demo data |
| `database/scripts` | รัน migration/seed แบบชุด |
| `docs/` | คู่มือ / checklist |

---

## 3. PostgreSQL — กรณีเครื่องใหม่ (ไม่มีข้อมูลเดิม)

### 3.1 ติดตั้ง PostgreSQL

1. ดาวน์โหลดจาก [postgresql.org](https://www.postgresql.org/download/windows/) หรือใช้ installer ที่องค์กรกำหนด
2. จำ **พอร์ต** ที่ตั้ง (ค่าเริ่มต้น `5432`) — ถ้า `5432` ถูกใช้แล้ว ให้เลือกพอร์ตว่าง เช่น **`5433`**
3. จำรหัสผ่าน superuser (`postgres`)

### 3.2 สร้าง database และ user แอป

เปิด **pgAdmin**, **DBeaver** หรือ `psql -U postgres` แล้วรัน (แก้รหัสผ่านตามจริง):

```sql
CREATE USER pepsipm WITH PASSWORD 'รหัสผ่านที่ตั้งเอง';
CREATE DATABASE pepsi_pm OWNER pepsipm ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE pepsi_pm TO pepsipm;
```

เชื่อมต่อเข้า database `pepsi_pm` แล้วรัน:

```sql
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION pepsipm;
GRANT ALL ON SCHEMA app TO pepsipm;
ALTER ROLE pepsipm SET search_path TO app, public;
```

> แอป PM ใช้ schema **`app`** ไม่ใช่แค่ `public`

### 3.3 Connection string

บันทึกรูปแบบนี้ไว้ใช้กับ backend และสคริปต์:

```text
postgresql://pepsipm:รหัสผ่าน@127.0.0.1:5433/pepsi_pm
```

- แทน `5433` ด้วยพอร์ตจริง
- แทน `127.0.0.1` ด้วย host จริงถ้า DB อยู่เครื่องอื่น

---

## 4. PostgreSQL — ย้ายจากเครื่องเก่า

ใช้เมื่อมีข้อมูล production/UAT บนเครื่องเดิม และต้องการย้ายทั้ง database

### 4.1 บนเครื่องเก่า — สำรอง (backup)

```powershell
# Custom format (แนะนำ — กู้คืนง่าย)
pg_dump "postgresql://pepsipm:รหัส@127.0.0.1:5433/pepsi_pm" -Fc -f pepsi_pm_backup.dump

# หรือ plain SQL
pg_dump "postgresql://..." -f pepsi_pm_backup.sql
```

หรือใช้ **Admin → Backup** ในแอป (`/admin/backup`) ถ้า backend รันอยู่

### 4.2 บนที่เครื่องใหม่ — สร้าง database ว่าง

ทำตาม [§3.2](#32-สร้าง-database-และ-user-แอป) (user + database + schema `app`)

### 4.3 กู้คืน (restore)

```powershell
# จากไฟล์ .dump
pg_restore -d "postgresql://pepsipm:pepsipm@127.0.0.1:5433/pepsi_pm" --no-owner --role=pepsipm -c pepsi_pm_backup.dump

# จากไฟล์ .sql
psql "postgresql://pepsipm:รหัส@127.0.0.1:5433/pepsi_pm" -f pepsi_pm_backup.sql
```

### 4.4 หลัง restore — รัน migration ที่ขาด

ถ้าโค้ดบน Git ใหม่กว่า backup (เช่นมี `084_confirmation_export_all_permission.sql`):

```powershell
cd C:\Users\<คุณ>\Desktop\sap_241163
pwsh -File database/scripts/run-all-migrations.ps1
```

สคริปต์ใช้ `ON CONFLICT` / `IF NOT EXISTS` ในหลายไฟล์ — migration ที่รันแล้วมักข้ามได้ แต่ถ้า error ให้รันเฉพาะไฟล์เลขที่สูงกว่าที่เคยมีบนเครื่องเก่า

### 4.5 ย้ายเฉพาะ schema แอป (ไม่เอา database อื่น)

```powershell
pg_dump "postgresql://.../pepsi_pm" -n app -Fc -f pepsi_pm_app_only.dump
pg_restore -d "postgresql://.../pepsi_pm" --schema=app pepsi_pm_app_only.dump
```

---

## 5. รัน migration + seed

### 5.1 ตั้ง `DATABASE_URL` ก่อน

คัดลอก backend env (ทำครั้งเดียว — ดู [§6](#6-backend-api)):

```powershell
copy PM-Pepsi-App\backend\.env.example PM-Pepsi-App\backend\.env
# แก้ DATABASE_URL ใน .env ให้ตรง §3.3
```

### 5.2 รันครบชุด (แนะนำ)

จาก root โปรเจกต์:

```powershell
cd C:\Users\<คุณ>\Desktop\sap_241163

# 1) migration ทุกไฟล์ใน database/migrations/ (เรียงตามเลข 001, 002, … 084, …)
pwsh -File database/scripts/run-all-migrations.ps1

# 2) seed ผู้ใช้ทดสอบ + demo (เฉพาะเครื่อง dev — อย่ารันทับ production ถ้ามีข้อมูลจริงแล้ว)
pwsh -File database/scripts/run-all-seeds.ps1

# 3) ตรวจ schema + admin
pwsh -File database/scripts/verify-admin-environment.ps1
psql $env:DATABASE_URL -f database/scripts/verify_app_schema.sql
```

### 5.3 รันด้วย DBeaver (ถ้าไม่มี psql)

1. สร้าง connection → database `pepsi_pm`
2. เปิด `database/migrations/` เรียงชื่อไฟล์
3. Execute ทีละไฟล์ `001_…` จนถึงไฟล์ล่าสุด (เช่น `084_confirmation_export_all_permission.sql`)
4. รัน `database/seeds/009_dev_auth_seed.sql` (และ `010`, `011` ถ้าต้องการ demo)

รายละเอียด seed: [`database/seeds/README.md`](../database/seeds/README.md)

### 5.4 บัญชีทดสอบหลัง seed 009

| ประเภท | ผู้ใช้ | รหัสผ่าน | หมายเหตุ |
|--------|--------|----------|----------|
| Work center (Admin) | `ADMIN01` | `admin` | UserST = A, เมนูครบ |
| Work center | `WC001` | `wc001` | ทดสอบปฏิทิน/WO |
| Member | `demo` | `demo` | แท็บสมาชิกที่ `/login` |

---

## 6. Backend (API)

```powershell
cd PM-Pepsi-App\backend
copy .env.example .env
```

แก้ `.env` (อย่า commit ไฟล์นี้):

```env
PORT=4000
DATABASE_URL=postgresql://pepsipm:รหัสผ่าน@127.0.0.1:5433/pepsi_pm
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=สตริงสุ่มยาวอย่างน้อย-16-ตัวอักษร
```

ติดตั้งและรัน:

```powershell
npm install
npm run dev
```

ควรเห็น: `pm-api listening on http://127.0.0.1:4000`

ทดสอบ:

```powershell
curl http://127.0.0.1:4000/api/v1/health
```

คาดหวัง JSON มี `"db":"ok"`

Unit test (ทางเลือก):

```powershell
npm test
```

---

## 7. Frontend (React)

```powershell
cd PM-Pepsi-App\frontend
copy .env.example .env
```

`.env` สำหรับ dev (proxy ไป backend):

```env
VITE_API_URL=
```

ว่าง = เรียก `/api/...` ผ่าน Vite proxy → `http://127.0.0.1:4000` (ดู `vite.config.ts`)

```powershell
npm install
npm run dev
```

เปิดเบราว์เซอร์: **http://localhost:5173** (ใช้ `localhost` ไม่ใช่ `127.0.0.1` บน Windows บางเครื่อง)

Login: `ADMIN01` / `admin`

Build production (ตรวจ compile):

```powershell
npm run build
```

---

## 8. ตรวจว่าใช้งานได้

| ขั้น | การตรวจ | ผลที่คาดหวัง |
|------|---------|--------------|
| DB | `GET /api/v1/health` | `"db":"ok"` |
| Login | `/login` → `ADMIN01` / `admin` | เข้า Dashboard |
| RBAC | `/admin/roles` | เห็น `confirmation.export.all` |
| Export scope | login แล้วเรียก export API | `scope`: `ALL` หรือ `OWN` (ไม่ hardcode wkctr) |
| Unit | `npm test` ทั้ง backend + frontend | ผ่านครบ |

---

## 9. E2E smoke (ทางเลือก)

รายละเอียดเต็ม: [`customer-requirements/E2E-SMOKE.md`](customer-requirements/E2E-SMOKE.md)

```powershell
# Terminal 1 — backend (npm run dev)
# Terminal 2 — frontend (npm run dev)

cd PM-Pepsi-App\frontend
copy e2e\.env.example e2e\.env
# หรือ:
set E2E_USE_DEV_SEED=1

set PLAYWRIGHT_SKIP_WEBSERVER=1
npm run test:e2e:smoke
```

---

## 10. โฟลเดอร์ / ข้อมูลเสริม

| รายการ | ที่เก็บ | หมายเหตุ |
|--------|--------|----------|
| SAP CSV integration | `PM-Pepsi-App/backend/data/integration/` | สร้างเองถ้ายังไม่มี — ดู README ในโฟลเดอร์ |
| รูป confirm / branding | ใน DB (`BYTEA` / `tbl_setting`) | ย้ายพร้อม `pg_dump` |
| Backup ไฟล์ | ตาม Admin settings | มักอยู่ drive ที่ตั้งใน `/admin/settings` |
| เอกสารลูกค้า | `from customer/` (ไม่ commit Git) | คัดลอกมือจากเครื่องเก่า |
| Docker PG data | `{PROJECT}/database/postgres` | เฉพาะถ้าใช้ Docker ตาม on-site |

ติดตั้ง on-site / โรงงาน: [`ON-SITE-DATABASE-SETUP.md`](ON-SITE-DATABASE-SETUP.md)

---

## 11. แก้ปัญหาที่พบบ่อย

### `db: "error"` ใน `/api/v1/health`

- ตรวจ `DATABASE_URL` ใน `backend/.env` (พอร์ต, รหัสผ่าน, ชื่อ database)
- ตรวจ PostgreSQL service รันอยู่
- รัน migration ยังไม่ครบ → `run-all-migrations.ps1`

### Frontend เรียก API ไม่ได้ / HTML แทน JSON

- ต้องรัน **backend** (`:4000`) คู่กับ frontend
- ตรวจ Vite proxy ใน `vite.config.ts`

### `127.0.0.1:5173` connection refused แต่ `localhost:5173` ได้

- Vite bind แบบ `localhost` (IPv6) — ใช้ **http://localhost:5173** เสมอ
- Playwright ตั้ง `PLAYWRIGHT_BASE_URL=http://localhost:5173`

### Migration ล้มเหลวกลางทาง

- อ่านข้อความ error ในไฟล์นั้น
- แก้แล้วรันไฟล์ที่ fail ต่อ (หรือ restore จาก backup แล้วรันใหม่บน DB ว่าง)

### Login ไม่ได้หลัง seed

- รัน `009_dev_auth_seed.sql` อีกครั้ง
- ใช้ `mode: workcenter` กับ `ADMIN01` / `admin`
- รหัสจะถูก hash เป็น bcrypt หลัง login ครั้งแรก

### Port 5432 ถูกใช้แล้ว

- ตั้ง PostgreSQL instance ใหม่ฟัง **5433** (หรือพอร์ตอื่น)
- อัปเดต `DATABASE_URL` ทุกที่

---

## 12. เช็กลิสต์ก่อนเสนอลูกค้า

- [ ] Git pull ล่าสุด
- [ ] Migration ครบถึง `084` (และไฟล์ใหม่กว่านั้นถ้ามี)
- [ ] `GET /api/v1/health` → `db: ok`
- [ ] Login admin ได้
- [ ] `npm run build` frontend ผ่าน
- [ ] `npm test` backend + frontend ผ่าน
- [ ] (แนะนำ) `npm run test:e2e:smoke` ผ่าน
- [ ] `SESSION_SECRET` production เป็นค่าสุ่ม (ไม่ใช่ค่าใน `.env.example`)

---

## เอกสารที่เกี่ยวข้อง

| เอกสาร | เนื้อหา |
|--------|---------|
| [`database/README.md`](../database/README.md) | migration / scripts |
| [`database/seeds/README.md`](../database/seeds/README.md) | seed + บัญชีทดสอบ |
| [`ON-SITE-DATABASE-SETUP.md`](ON-SITE-DATABASE-SETUP.md) | ติดตั้งโรงงาน / Docker |
| [`USER-MANUAL-TH.md`](USER-MANUAL-TH.md) | คู่มือผู้ใช้ทุกหน้า |
| [`customer-requirements/E2E-SMOKE.md`](customer-requirements/E2E-SMOKE.md) | Playwright smoke |
| [`customer-requirements/UAT-ROUND-1-TH.md`](customer-requirements/UAT-ROUND-1-TH.md) | **ชีต UAT รอบ 1** ให้ลูกค้าติ๊กทดสอบ |
| [`customer-requirements/UAT-ROUND-2-TH.md`](customer-requirements/UAT-ROUND-2-TH.md) | **ชีต UAT รอบ 2** — PM manual · comment กลับ |
| [`customer-requirements/HARDCODE-MOCK-AUDIT.md`](customer-requirements/HARDCODE-MOCK-AUDIT.md) | เกณฑ์ mock/hardcode |
