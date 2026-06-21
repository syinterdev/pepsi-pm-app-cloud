# Deploy Frontend บน Vercel

**Repo:** https://github.com/syinterdev/pepsi-pm-app-cloud (branch `main`)

## สาเหตุ 404 NOT_FOUND

Vercel deploy จาก **root monorepo** แต่ frontend อยู่ที่ `PM-Pepsi-App/frontend/` — ไม่มี `dist/` ที่ root

**แก้แล้ว:** เพิ่ม `vercel.json` ที่ root ชี้ build/output ไป frontend

## ตั้งค่า Vercel Project

### วิธี A — ใช้ root `vercel.json` (แนะนำ)

- **Root Directory:** ว่าง (repo root)
- Push แล้ว Redeploy

### วิธี B — ตั้ง Root Directory

- **Root Directory:** `PM-Pepsi-App/frontend`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## Environment Variables

| ตัวแปร | ค่า |
|--------|-----|
| `VITE_API_URL` | URL Railway backend เช่น `https://pepsi-pm-app-cloud-production.up.railway.app` |

ตั้ง `CORS_ORIGIN` บน Railway ให้ตรง URL Vercel เช่น `https://your-project.vercel.app`

## หลัง deploy

1. เปิด URL Vercel → ควรเห็นหน้า Login
2. Login: `ADMIN01` / `admin`
3. ถ้า API error → ตรวจ `VITE_API_URL` และ Railway Variables
