import { defineConfig, devices } from '@playwright/test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadE2eEnv } from './e2e/helpers/env.js'

loadE2eEnv()

const rootDir = dirname(fileURLToPath(import.meta.url))
const backendDir = join(rootDir, '..', 'backend')
/** Vite dev มัก bind `localhost` (IPv6) — บน Windows 127.0.0.1 อาจ refused */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:4000'

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'npm run dev',
          cwd: backendDir,
          url: `${apiURL}/api/v1/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
})
