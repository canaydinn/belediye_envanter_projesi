import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth-ui.js';

test.describe('Role Access Control', () => {
  test('role_id=3 super-admin-dashboard.html açmaya çalışınca engellenmeli', async ({ page }) => {
    await loginViaUI(page, {
      email: process.env.ADMIN_EMAIL,          // deneme@gmail.com
      password: process.env.ADMIN_PASSWORD,
      expectRoleId: 3,
      expectUrl: /dashboard\.html/i,           // login sonrası normal dashboard
    });

    await page.goto('/admin/super-admin-dashboard.html', { waitUntil: 'domcontentloaded' });

    // Engellenme: login'e atabilir, dashboard'a geri atabilir veya yetki mesajı gösterebilir
    const u = page.url();

    if (/\/admin\/login\.html/i.test(u)) {
      await expect(page).toHaveURL(/\/admin\/login\.html/i);
      return;
    }

    if (/dashboard\.html/i.test(u)) {
      await expect(page.getByText(/yetki|erişim/i).first()).toBeVisible();
      return;
    }

    // Sayfa açıldı gibi görünse bile kritik bir “Yetki yok” uyarısı bekleyelim
    await expect(page.getByText(/yetki|erişim|bu işlem için yetkiniz yok/i).first()).toBeVisible();
  });
});
