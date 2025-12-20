import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth-ui.js';

test('Logout sonrası korumalı sayfaya gidince login’e düşmeli', async ({ page }) => {
  await loginViaUI(page, {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    expectRoleId: 3,
    expectUrl: /dashboard\.html/i,
  });

  // Projene göre logout selector’ını ayarlaman gerekecek:
  // Örn: a:has-text("Çıkış") veya [data-role="logout"]
  const logout = page.locator('[data-role="logout"], a:has-text("Çıkış"), button:has-text("Çıkış")').first();
  await logout.click();

  await page.goto('/admin/assets.html', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/admin\/login\.html/i);
});
