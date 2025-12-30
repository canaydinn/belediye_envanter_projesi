// test/tests/login-screen.spec.js
import { test, expect } from '@playwright/test';
import { SEL } from '../helpers/selectors.js';

test.describe('Login Screen UI', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(SEL.login.url, { waitUntil: 'domcontentloaded' });
    });

    test('Sayfa başlığı doğru olmalı', async ({ page }) => {
        await expect(page).toHaveTitle('Giriş Yap | Envanter Yönetim Sistemi');
    });

    test('Logo ve marka ismi görünür olmalı', async ({ page }) => {
        const logo = page.locator('.app-brand-logo');
        const brandText = page.locator('.app-brand-text');
        
        await expect(logo).toBeVisible();
        await expect(brandText).toBeVisible();
        await expect(brandText).toHaveText('Envantor');
    });

    test('Login formu elementleri doğru olmalı', async ({ page }) => {
        // Email input
        const emailInput = page.locator(SEL.login.email);
        await expect(emailInput).toBeVisible();
        await expect(emailInput).toHaveAttribute('type', 'email');
        await expect(emailInput).toHaveAttribute('placeholder', 'ornek@belediye.gov.tr');

        // Password input
        const passwordInput = page.locator(SEL.login.password);
        await expect(passwordInput).toBeVisible();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveAttribute('placeholder', 'Şifrenizi giriniz');

        // Remember me checkbox
        const rememberMe = page.locator('#remember-me');
        await expect(rememberMe).toBeVisible();
        await expect(rememberMe).not.toBeChecked();

        // Submit button
        const submitBtn = page.locator(SEL.login.submitBtn);
        await expect(submitBtn).toBeVisible();
        await expect(submitBtn).toHaveText('Giriş Yap');
    });

    test('Şifremi unuttum linki doğru olmalı', async ({ page }) => {
        const forgotPasswordLink = page.locator('a[href="forgot-password.html"]');
        await expect(forgotPasswordLink).toBeVisible();
        await expect(forgotPasswordLink).toHaveText('Şifremi unuttum');
    });

    test('Boş form gönderildiğinde hata mesajı görünmeli (Client-side validation)', async ({ page }) => {
        // HTML5 validation'ı bypass edip JS kontrolünü tetiklemek gerekebilir veya
        // direkt butona basıp custom error div'inin görünüp görünmediğine bakabiliriz.
        // Mevcut kodda: showError('E-posta ve şifre zorunludur.'); çalışıyor mu bakalım.
        
        await page.locator(SEL.login.submitBtn).click();
        
        // Eğer HTML5 required varsa tarayıcı tooltip çıkarır, Playwright bunu yakalamaz.
        // Ancak JS tarafında boş kontrolü varsa ve alert div'i açıyorsa onu kontrol edebiliriz.
        // Kod analizine göre:
        // if (!email || !password) { showError('E-posta ve şifre zorunludur.'); return; }
        
        const errorAlert = page.locator(SEL.login.error);
        
        // Form 'novalidate' attribute'u var mı? HTML'e baktığımızda: <form id="formLogin" class="mb-3" novalidate>
        // Demek ki tarayıcı validasyonu kapalı, JS devreye girmeli.
        
        await expect(errorAlert).toBeVisible();
        await expect(errorAlert).toHaveText('E-posta ve şifre zorunludur.');
    });
});
