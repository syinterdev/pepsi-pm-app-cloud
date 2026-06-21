# Deploy Frontend บน Vercel

**Repo:** https://github.com/syinterdev/pepsi-pm-app-cloud (branch `main`)

## 1) สร้าง/เชื่อม Project บน Vercel

1. ไปที่ https://vercel.com/new
2. Import **`syinterdev/pepsi-pm-app-cloud`**
3. **Root Directory:** ว่าง (ใช้ `vercel.json` ที่ root repo)
4. Framework จะ detect จาก `vercel.json` อัตโนมัติ

## 2) Environment Variables (Vercel → Settings → Environment Variables)

| ตัวแปร | ค่า | หมายเหตุ |
|--------|-----|----------|
| `VITE_API_URL` | `https://<railway-backend-url>` | **ไม่มี** trailing slash |

ตัวอย่าง:

```env
VITE_API_URL=https://intuitive-respect-production.up.railway.app
```

## 3) ตั้ง CORS บน Railway (สำคัญ — login ข้าม domain)

Railway → Variables:

```env
CORS_ORIGIN=https://<your-project>.vercel.app
NODE_ENV=production
```

แล้ว **Redeploy Railway** หลังได้ URL Vercel จริง

## 4) Deploy

- Push ขึ้น `main` → Vercel auto-deploy  
- หรือ Vercel Dashboard → **Deployments → Redeploy**

## 5) ทดสอบ

1. เปิด URL Vercel → หน้า **Login**
2. Login: `ADMIN01` / `admin`
3. ถ้า API error → ตรวจ `VITE_API_URL` และ `CORS_ORIGIN`

## โครงสร้าง build (vercel.json ที่ root)

- Install: `PM-Pepsi-App/frontend`
- Build: `npm run build:vercel` (vite build)
- Output: `PM-Pepsi-App/frontend/dist`
- SPA rewrite → `index.html`

## ทางเลือก: Root Directory = PM-Pepsi-App/frontend

- Build: `npm run build:vercel`
- Output: `dist`
- ใช้ `PM-Pepsi-App/frontend/vercel.json`
