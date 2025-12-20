// test/tests/auth-invalid.spec.js
import { test } from '@playwright/test';
import { SEL } from '../helpers/selectors.js';
import { expectLoginErrorVisible } from '../helpers/auth-ui.js';

test('Hatalı e-posta/şifre ile girişte hata mesajı gösterilmeli', async ({ page }) => {
  await page.goto(SEL.login.url, { waitUntil: 'domcontentloaded' });

  await page.locator(SEL.login.email).fill('yanlis@ornek.com');
  await page.locator(SEL.login.password).fill('yanlis_sifre');
  await page.locator(SEL.login.submitBtn).click();

  await expectLoginErrorVisible(page);
});
