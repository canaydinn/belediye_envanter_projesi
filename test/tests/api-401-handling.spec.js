import { test, expect } from '@playwright/test';

test('Cookie yokken assets.html API 401 olursa login/uyarı göstermeli', async ({ page, context }) => {
  await context.clearCookies();

  await page.goto('/admin/assets.html', { waitUntil: 'domcontentloaded' });

  // Login’e atma veya 401 uyarısı bekle
  const u = page.url();
  if (/\/admin\/login\.html/i.test(u)) {
    await expect(page).toHaveURL(/\/admin\/login\.html/i);
    return;
  }

  await expect(
    page.getByText(/401|oturum|giriş|yetki/i).first()
  ).toBeVisible();
});
