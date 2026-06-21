# Seeds — ข้อมูลทดสอบ / ติดตั้ง offline

รันหลัง migration **`001`–`010`** ครบใน schema **`app`**.

## ลำดับรัน (dev / โรงงานครั้งแรก)

| ลำดับ | ไฟล์ | เนื้อหา |
|------|------|--------|
| 1 | [`../migrations/`](../migrations/) `001` → `010` | สร้าง schema + sample ใน 003/004/005/008 + tbreason + tbmanhours |
| 2 | [`009_dev_auth_seed.sql`](009_dev_auth_seed.sql) | ผู้ใช้: ADMIN01/admin, WC001/wc001, demo/demo |
| 3 | [`010_dev_demo_data.sql`](010_dev_demo_data.sql) | WO + planning + line + import batch |
| 4 | [`011_dev_manhours_seed.sql`](011_dev_manhours_seed.sql) | ชั่วโมงทำงานทดสอบ (navbar worktime_count) |
| (ทางเลือก) | [`generated/import_*.sql`](generated/) | จาก MySQL จริง — [`import-auth-from-mysql.ps1`](../scripts/import-auth-from-mysql.ps1) |

### PowerShell (ถ้ามี `psql` ใน PATH)

```powershell
cd C:\Users\Chinchettha\Desktop\sap_241163
pwsh -File database/scripts/run-all-migrations.ps1
pwsh -File database/scripts/run-all-seeds.ps1
psql $env:DATABASE_URL -f database/scripts/verify_app_schema.sql
```

### DBeaver (Windows — แนะนำ)

1. เชื่อม `127.0.0.1:5433` / database `pepsi_pm`
2. รัน migration `001` … `010` ตามลำดับ (หรือเฉพาะไฟล์ที่ยังไม่รัน)
3. รัน seed `009` แล้ว `010` แล้ว `011`
4. รัน [`verify_app_schema.sql`](../scripts/verify_app_schema.sql) — คอลัมน์ `ok` ต้องเป็น `t` ทุกแถว

## บัญชีทดสอบ

| ประเภท | ชื่อผู้ใช้ | รหัสผ่าน | หมายเหตุ |
|--------|-----------|----------|----------|
| Work center (Admin) | `ADMIN01` | `admin` | เมนูครบ (UserST=A) |
| Work center (ช่าง) | `WC001` | `wc001` | ใช้ทดสอบ planning/calendar (WO ผูก WC001) |
| สมาชิก | `demo` | `demo` | แท็บสมาชิกใน `/login` |

รหัส plain จะถูกอัปเกรดเป็น **bcrypt** หลัง login ครั้งแรก

## ติดตั้ง offline บนไดรฟ์ D: (ลูกค้า)

ดู [`docs/ON-SITE-DATABASE-SETUP.md`](../../docs/ON-SITE-DATABASE-SETUP.md)

สรุป:

- โปรเจกต์บน **`D:\PM-Pepsi-App`** (หรือ path ที่ตกลง) — ดู `skills.md` / `PROJECT_ROOT`
- PostgreSQL data: **`{PROJECT_ROOT}/database/postgres`** (Docker bind mount)
- Host port แนะนำ **`55432`** (หลีกเลี่ยง 5432 ที่ OS ใช้อยู่แล้ว)
- Dev บนเครื่องพัฒนา: อาจใช้ **5433** แทน (ตาม `.env` ปัจจุบัน)

## ไม่ควร commit

- รหัสผ่าน production
- ไฟล์ `generated/` ที่มีข้อมูลลูกค้าจริง (ยกเว้น sample ปลอม)
