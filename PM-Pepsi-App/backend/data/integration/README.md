# SAP integration I/O (local dev)

โฟลเดอร์นี้อยู่ใน `.gitignore` — สร้างอัตโนมัติโดย `ensureIntegrationDirs()` หรือสคริปต์ทดสอบ

```
data/integration/
  inbound/iw37n/     ← วางไฟล์ IW37N (.xlsx/.xls/.csv)
  inbound/confirm/   ← วางไฟล์ Confirm IN
  outbound/confirm/  ← export กลับ SAP (ระบบเขียน)
  processing/        ← ชั่วคราวระหว่าง import
  archive/inbound/YYYY-MM/
  archive/outbound/
  error/             ← ไฟล์ล้ม + *.error.json
```

**ทดสอบ drop IW37N:**

```powershell
cd PM-Pepsi-App/backend
npx tsx scripts/integration-drop-test.ts
# หรือ copy ไฟล์เองแล้ว:
npm run integration:watch
```

**Override path:** ตั้ง `INTEGRATION_DATA_DIR` ใน `.env`
