import { test, expect } from '@playwright/test';

const PAGES = [
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

test.describe('Auth Guard (login yokken erişim)', () => {
  for (const url of PAGES) {
    test(`${url} login olmadan engellenmeli`, async ({ page, context }) => {
      await context.clearCookies();

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // 1) Redirect varsa kabul
      if (/\/admin\/login\.html/i.test(page.url())) {
        await expect(page).toHaveURL(/\/admin\/login\.html/i);
        return;
      }

      // 2) Redirect yoksa: login UI render edilmiş olmalı
      await expect(
        page.locator('form#formLogin, button:has-text("Giriş Yap"), input[placeholder*="E-posta"]')
          .first()
      ).toBeVisible();
    });
  }
});
