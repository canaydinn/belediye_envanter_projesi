import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.FRONT_BASE_URL || 'http://localhost:4000',
    // Vuexy sayfalarında toast/animasyonlar olduğu için stabilite sağlar:
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry'
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
    // İstersen aç:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  reporter: [['html', { open: 'never' }]]
});
