# P5 — Go-live Runbook (Nav · Admin · Telegram)

**อัปเดต:** 2026-06-09  
**อ้างอิง:** [`PM-WORKFLOW-PHASE-CHECKLIST.md`](PM-WORKFLOW-PHASE-CHECKLIST.md) §P5 · [`TELEGRAM-IMPLEMENTATION-CHECKLIST.md`](TELEGRAM-IMPLEMENTATION-CHECKLIST.md)

โค้ดหลัก **พร้อมแล้ว** — P5 ส่วนใหญ่เป็นงาน **ops บน server offline** + UAT

---

## ก่อนเริ่ม

```powershell
cd PM-Pepsi-App/backend
npx tsx scripts/verify-p5-go-live.ts
```

แก้ `[FAIL]` ก่อน go-live (migration / RBAC / tbmenu)

---

## P5.1 Telegram — Dev UAT (ไม่ต้องมี Bot)

```powershell
cd PM-Pepsi-App/backend
npm run seed:telegram-p51      # WC001/WC002 mock chat + ack_to_planner group
npm run verify:p51-telegram    # assign → callback ack → DB + group resolve
```

ผ่านเมื่อไม่มี critical FAIL (token/webhook เป็น WARN ใน dev)

## P5.1 Telegram (server offline)

### 1) BotFather + secrets

1. สร้าง Bot ที่ [@BotFather](https://t.me/BotFather)
2. ใส่ใน `.env` บน API server (ไม่ commit):

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_WEBHOOK_SECRET=<random-long-secret>
TELEGRAM_NOTIFY_ENABLED=true
APP_PUBLIC_URL=https://<public-api-host>
```

3. Restart API (`npm run start` หรือ service)

### 2) setWebhook

```powershell
cd PM-Pepsi-App/backend
npx tsx scripts/telegram-set-webhook.ts
```

หรือ curl:

```text
POST https://api.telegram.org/bot<TOKEN>/setWebhook
{ "url": "https://<host>/api/v1/telegram/webhook", "secret_token": "<TELEGRAM_WEBHOOK_SECRET>" }
```

### 3) Admin — กลุ่ม `ack_to_planner`

1. Login Admin → **`/admin/telegram`**
2. **Add group** · `notify_kind` = **ack_to_planner**
3. ใส่ **Telegram Chat ID** กลุ่ม Planner (ลูกค้าสร้างกลุ่ม + add Bot เป็น member)
4. **Test send** 1 ครั้ง

### 4) ผูกช่าง ≥2 คน

- **`/admin/users`** หรือ **`/personnel/admin`** → สร้างลิงก์เชิญ Telegram
- ช่างเปิดลิงก์ในมือถือ → `/start <token>`

### 5) E2E (เกณฑ์ผ่าน P5)

| ขั้น | ผู้ทำ | ผลที่คาดหวัง |
|------|--------|----------------|
| จ่ายงาน | Planner | ช่างที่ผูก TG ได้ **DM** |
| รับทราบ | ช่าง (ปุ่มในแชท หรือ `/planning` → Ack) | `ack_status=acknowledged` |
| แจ้ง Planner | ระบบ | ข้อความในกลุ่ม **ack_to_planner** |

---

## P5.2 Admin ปฏิบัติการ

### Dev verify (pg_dump + D:)

```powershell
cd PM-Pepsi-App/backend
npm run verify:p52-backup
```

- สร้าง `D:/PM-Pepsi-App/backup` ถ้ายังไม่มี
- รัน manual backup → ตรวจ `tbl_backup_history` + ไฟล์ `.sql.gz`
- ถ้า `pg_dump` ไม่อยู่ใน PATH ใส่ `PG_DUMP_PATH` ใน `.env` (ดู `.env.example`)

### Backup schedule (production)

1. **`/admin/backup`**
2. ตรวจ **Target directory** = `D:/PM-Pepsi-App/backup` (ค่าเริ่มต้นใน backend)
3. ตั้ง **Cron** (ค่าเริ่มต้น `0 2 * * *` = 02:00 ทุกวัน)
4. กด **Backup now** ครั้งแรก → สถานะ **success** + ไฟล์ `.sql.gz` บน D:

> Scheduler รันอัตโนมัติเมื่อ API start (`BACKUP_SCHEDULER` ไม่ใช่ `0`)

### Master Plan — Publish หลัง import แผนปี

1. Import IW37N / แก้แผน → **`/master-plan`**
2. ตรวจ mntplan + task list ใน WO modal แท็บ **Task**
3. กด **Publish** (per line EE/ME/PK) ก่อนให้ Planner ใช้งานจริง
4. ลิงก์จาก **`/admin/master`** (คำแนะนำ Publish)

### เฟส 2 (ยังไม่ทำ)

- ฟิลด์ AA/BB บน **`/personnel/admin`**

---

## P5.3 Menu Builder (`tbmenu`)

ทำแล้วใน P4.3 — รัน migration บน prod:

```text
database/migrations/111_confirmation_menu_planner_rbac.sql
```

ผลลัพธ์:

- เมนูเดียว **Confirmation** (`/confirmation`, `menuright A:U`)
- ลบ **Personnel Confirmation** จาก sidebar
- Planner (`U`) ได้ `confirmation.import` + `confirmation.export`

ถ้า prod แก้เมนูผ่าน **`/admin/menu`** เอง — sync ให้ตรงกับด้านบน

---

## สรุปเกณฑ์ผ่าน P5

- [ ] `verify-p5-go-live.ts` — 0 FAIL
- [ ] Telegram E2E 1 WO (DM → ack → กลุ่ม Planner)
- [x] Backup manual สำเร็จที่ `D:/PM-Pepsi-App/backup` (dev: `npm run verify:p52-backup` · prod: Admin UI)
