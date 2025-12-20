// test/tests/auth.spec.js
import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth-ui.js';

test.describe('Auth & Role Routing', () => {
  test('role_id=1 kullanıcı super-admin-dashboard.html yönlenmeli', async ({ page }) => {
    await loginViaUI(page, {
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD,
      expectUrl: /super-admin-dashboard\.html/i,
    });

    // İsteğe bağlı: sayfanın gerçekten yüklendiğini basitçe doğrula
    await expect(page).toHaveURL(/super-admin-dashboard\.html/i);
  });

  test('role_id=3 kullanıcı dashboard.html yönlenmeli', async ({ page }) => {
    await loginViaUI(page, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      expectUrl: /dashboard\.html/i,
    });

    await expect(page).toHaveURL(/dashboard\.html/i);
  });
});
