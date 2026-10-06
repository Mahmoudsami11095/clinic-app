import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Patient Self-Service Portal & Verification E2E Suite (v3.1.0)', () => {
  const screenshotsDir = path.join(__dirname, '../playwright-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('E2E Walkthrough: Login -> Dashboard -> Slot Booking -> Rx Print -> Receipt Print', async ({ page }) => {
    // 1. Visit Portal Login
    await page.goto('/portal/login');
    await expect(page.getByRole('heading', { name: /Patient Portal|بوابة المرضى/i })).toBeVisible();

    // 2. Fast fill demo phone and send OTP
    const fastFillBtn = page.getByRole('button', { name: /Fast Fill Demo Patient/i });
    if (await fastFillBtn.isVisible()) {
      await fastFillBtn.click();
    } else {
      await page.locator('input[type="tel"]').fill('+201012345678');
    }

    const sendCodeBtn = page.getByRole('button', { name: /Send Verification Code|إرسال الرمز/i });
    await sendCodeBtn.click();

    // 3. Verify OTP step
    const otpInput = page.locator('input[name="otpCode"]');
    await expect(otpInput).toBeVisible({ timeout: 10000 });

    const currentOtp = await otpInput.inputValue();
    if (!currentOtp) {
      await otpInput.fill('123456');
    }

    const verifyBtn = page.getByRole('button', { name: /Verify & Sign In|تأكيد ودخول/i });
    await verifyBtn.click();

    // 4. Assert arrival at Portal Dashboard
    await page.waitForURL('**/portal/dashboard', { timeout: 15000 });
    await expect(page.locator('text=Live Queue Tracker')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '01-portal-dashboard.png'), fullPage: true });

    // 5. Book an Appointment Slot
    const slotButtons = page.locator('button:has-text(":")');
    const slotCount = await slotButtons.count();
    if (slotCount > 0) {
      await slotButtons.first().click();
      const reasonInput = page.locator('input[name="bookReason"]');
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Routine oral hygiene & dental consultation');
      }
      const confirmBookingBtn = page.getByRole('button', { name: /Confirm Appointment|تأكيد الحجز/i });
      if (await confirmBookingBtn.isEnabled()) {
        await confirmBookingBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    await page.screenshot({ path: path.join(screenshotsDir, '02-portal-booking-flow.png') });

    // 6. Test Printable Prescription Modal
    const printRxButtons = page.locator('button:has-text("Print Rx")');
    if (await printRxButtons.count() > 0) {
      await printRxButtons.first().click();
      await expect(page.locator('text=Official Medical Prescription')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('img[alt*="Prescription Verification QR"]')).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, '03-prescription-print-modal.png') });

      // Close modal
      const closeButtons = page.locator('button:has(svg path[d*="M6 18L18 6"])');
      if (await closeButtons.count() > 0) {
        await closeButtons.first().click();
      }
    }

    // 7. Test Printable Tax Receipt Modal
    const receiptButtons = page.locator('button:has-text("Receipt")');
    if (await receiptButtons.count() > 0) {
      await receiptButtons.first().click();
      await expect(page.locator('text=Official Payment Receipt')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('img[alt*="Receipt Verification QR"]')).toBeVisible();
      await page.screenshot({ path: path.join(screenshotsDir, '04-payment-receipt-modal.png') });

      // Close modal
      const closeButtons = page.locator('button:has(svg path[d*="M6 18L18 6"])');
      if (await closeButtons.count() > 0) {
        await closeButtons.first().click();
      }
    }
  });

  test('Public Document Verification: Prescription & Tax Receipt Validation', async ({ page }) => {
    // 1. Test Prescription Verification Route
    await page.goto('/verify/rx/rx-101');
    await expect(page.locator('text=Officially Verified')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Smart Clinic Healthcare Center').first()).toBeVisible();
    await expect(page.locator('text=Security Fingerprint')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '05-public-rx-verification.png'), fullPage: true });

    // 2. Test Receipt Verification Route
    await page.goto('/verify/inv/inv-202');
    await expect(page.locator('text=Officially Verified')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Official Tax Receipt')).toBeVisible();
    await expect(page.locator('text=Security Fingerprint')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '06-public-receipt-verification.png'), fullPage: true });
  });
});
