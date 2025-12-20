// test/helpers/auth-ui.js
import { expect } from '@playwright/test';
import { SEL } from './selectors.js';

export async function loginViaUI(page, { email, password, expectUrl }) {
  await page.goto(SEL.login.url, { waitUntil: 'domcontentloaded' });

  await page.locator(SEL.login.email).fill(email);
  await page.locator(SEL.login.password).fill(password);

  await page.locator(SEL.login.submitBtn).click();

  // Role bazlı yönlendirme bekleniyor:
  if (expectUrl) {
    await expect(page).toHaveURL(expectUrl);
  } else {
    await expect(page).not.toHaveURL(/\/admin\/login\.html/i);
  }
}

export async function expectLoginErrorVisible(page) {
  const err = page.locator(SEL.login.error);
  await expect(err).toBeVisible();
  await expect(err).toContainText(/geçersiz|hata|başarısız/i);
}
