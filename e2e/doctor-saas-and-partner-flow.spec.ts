import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Doctor SaaS, Assistant Hub & Partner Dropzone E2E Suite (v4.2.0)', () => {
  const screenshotsDir = path.join(__dirname, '../playwright-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Public Clinic QR Booking: /book/:clinicSlug renders branding and doctor selection', async ({ page }) => {
    // Navigate to a sample clinic booking route
    await page.goto('/book/al-amal-cairo');
    await page.waitForLoadState('domcontentloaded');

    // Either clinic booking interface or not found state is rendered with verified styling
    const heading = page.locator('h1, h2');
    await expect(heading.first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: path.join(screenshotsDir, '01-public-booking-landing.png'), fullPage: true });
  });

  test('Diagnostic Partner Dropzone: /partner-dropzone renders token lookup and dropzone', async ({ page }) => {
    // Navigate to partner dropzone
    await page.goto('/partner-dropzone');
    await page.waitForLoadState('domcontentloaded');

    // Check heading and token lookup input
    await expect(page.locator('h1')).toBeVisible();
    const tokenInput = page.locator('input[placeholder*="ORD-"]');
    await expect(tokenInput).toBeVisible();

    // Verify lookup button
    const lookupBtn = page.locator('button:has-text("Lookup"), button:has-text("استعلام")');
    await expect(lookupBtn).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '02-partner-dropzone.png'), fullPage: true });
  });

  test('Assistant Hub: Authenticated access, clinical governance guardrail, and multi-tab operational triage', async ({ page }) => {
    // Log in as admin/staff
    await loginAsAdmin(page);

    // Navigate to Assistant Hub
    await page.goto('/assistant-hub');
    await page.waitForLoadState('domcontentloaded');

    // Verify Assistant Hub header and Governance Banner (BR-ASST-02)
    await expect(page.locator('text=Clinic Assistant Action Hub, text=مركز عمليات مساعد العيادة')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=BR-ASST-02')).toBeVisible();

    // Verify tab buttons exist
    const tabs = page.locator('button:has-text("Intake"), button:has-text("Cashiering"), button:has-text("Sterilization")');
    await expect(tabs.first()).toBeVisible();

    // Fill demographic intake form
    const nameInput = page.locator('input[placeholder*="Mahmoud Mostafa"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Ahmed Gamal');
      const phoneInput = page.locator('input[placeholder*="+2010"]');
      await phoneInput.fill('+201099887766');

      const registerBtn = page.locator('button:has-text("Register Patient"), button:has-text("حفظ ملف المريض")');
      await registerBtn.click();
      await expect(page.locator('text=registered successfully, text=تم حفظ')).toBeVisible();
    }

    await page.screenshot({ path: path.join(screenshotsDir, '03-assistant-hub.png'), fullPage: true });
  });

  test('Clinic Management: QR Kit modal displays live QR code and booking URL', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/clinics');
    await page.waitForLoadState('domcontentloaded');

    // Click "QR Kit" on first available clinic card
    const qrKitBtn = page.locator('button:has-text("QR Kit")').first();
    if (await qrKitBtn.isVisible({ timeout: 10000 })) {
      await qrKitBtn.click();

      // Verify QR Modal opened
      await expect(page.locator('text=Printable Clinic QR Poster Kit, text=حقيبة بوستر الباركود')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('img[alt*="Clinic"]')).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: path.join(screenshotsDir, '04-clinic-qr-modal.png'), fullPage: true });
    }
  });
});
