import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth-ui.js';

const AUTH_PAGES = [
  '/admin/dashboard.html',
  '/admin/assets.html',
  '/admin/create_asset.html',
  '/admin/categories.html',
  '/admin/locations.html',
  '/admin/create-categories.html',
  '/admin/create-locations.html',
  '/admin/create-users.html',
  '/admin/user.html',
];

test.describe('Authenticated Smoke (role_id=3)', () => {
  test('Login sonrası sayfalar açılmalı (login’e düşmemeli)', async ({ page }) => {
    await loginViaUI(page, {
      email: process.env.ADMIN_EMAIL,         // deneme@gmail.com
      password: process.env.ADMIN_PASSWORD,
      expectRoleId: 3,
      expectUrl: /dashboard\.html/i,
    });

    for (const url of AUTH_PAGES) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // En temel doğrulama: login'e geri düşme
      await expect(page).not.toHaveURL(/\/admin\/login\.html/i);

      // “Yetki yok” yazıyorsa fail
      await expect(page.getByText(/bu işlem için yetkiniz yok|yetki|erişim/i)).toHaveCount(0);
    }
  });
});
