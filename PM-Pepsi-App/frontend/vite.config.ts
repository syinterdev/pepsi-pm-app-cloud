import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version?: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_'],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version ?? '0.0.0'),
  },
  server: {
    proxy: {
      // เมื่อไม่ตั้ง VITE_API_URL — เรียก `/api/...` same-origin แล้วส่งต่อไป pm-api (ดู PM-Pepsi-App/backend)
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
