# PM-Pepsi-App — Frontend

โฟลเดอร์ `frontend/` ภายใต้ `PM-Pepsi-App` ตาม [`PROJECT-STRUCTURE.md`](../../PROJECT-STRUCTURE.md) และข้อกำหนดใน [`skills.md`](../../skills.md)

## สแต็ก

React 19 + Vite + TypeScript, Tailwind CSS v4, TanStack Query, React Router, Radix-style UI (CVA), React Hook Form + Zod, Sonner, Framer Motion, React Joyride, Chart.js, @dnd-kit / @use-gesture (สำหรับปฏิทินในเฟสถัดไป)

## คำสั่ง

```bash
npm install
npm run dev
npm run build
```

คัดลอก `.env.example` เป็น `.env` — ค่า `VITE_API_URL` ว่าง = ใช้ Vite proxy ไป backend ที่พอร์ต 4000

## API จริง (ไม่มี MSW)

- รัน backend ก่อน: `cd PM-Pepsi-App/backend && npm run dev`
- Frontend เรียก `/api/v1/*` ผ่าน proxy (ดู `vite.config.ts`)
- เมนู sidebar: `GET /api/v1/nav/menu` จาก `app.tbmenu` (migration `008` + seed `009` สำหรับ ADMIN01)

### Login ทดสอบเมนูครบ (Admin)

- แท็บ **Work center** → `ADMIN01` / `admin` (UserST = `A`)
- สมาชิก `demo` มีสิทธิ์ `U` — เมนูจะน้อยกว่า (ตาม `menuright` ใน DB)
