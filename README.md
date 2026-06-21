# Pepsi PM Application

Migration ระบบวางแผน PM/CM จาก PHP (`sap/`) เป็น React + Express + PostgreSQL (`PM-Pepsi-App/`).

## โครงสร้าง

| โฟลเดอร์ | คำอธิบาย |
|----------|----------|
| `PM-Pepsi-App/frontend` | React + Vite + TypeScript |
| `PM-Pepsi-App/backend` | Express API |
| `database/migrations` | PostgreSQL schema (`app`) |
| `database/seeds` | ข้อมูลทดสอบ dev |
| `sap/` | โค้ด PHP เดิม (อ้างอิง parity) |
| `docs/` | Checklist และคู่มือติดตั้ง |

## เริ่มต้น (dev)

1. PostgreSQL — รัน migration + seed (ดู [`docs/SETUP-NEW-MACHINE.md`](docs/SETUP-NEW-MACHINE.md))
2. Backend — คัดลอก `PM-Pepsi-App/backend/.env.example` → `.env` แล้ว `npm install && npm run dev`
3. Frontend — คัดลอก `PM-Pepsi-App/frontend/.env.example` → `.env` แล้ว `npm install && npm run dev`

บัญชีทดสอบ: `ADMIN01`/`admin`, `WC001`/`wc001`, `demo`/`demo`

## เอกสาร

- **[`docs/SETUP-NEW-MACHINE.md`](docs/SETUP-NEW-MACHINE.md)** — ติดตั้งเครื่องใหม่ / ย้าย PostgreSQL / backend / frontend
- [`docs/PHP-REACT-PARITY-CHECKLIST.md`](docs/PHP-REACT-PARITY-CHECKLIST.md)
- [`docs/ON-SITE-DATABASE-SETUP.md`](docs/ON-SITE-DATABASE-SETUP.md)
