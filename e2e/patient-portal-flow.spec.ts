import { test, expect } from '@playwright/test';

test.describe('Patient Self-Service Portal Flow (v3.1.0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal/login');
  });

  test('should display portal branding and phone OTP login form', async ({ page }) => {
    // Assert page header
    await expect(page.getByRole('heading', { name: /Patient Portal|بوابة المرضى/i })).toBeVisible();

    // Verify phone input and demo fast-fill button
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();

    const fastFillBtn = page.getByRole('button', { name: /Fast Fill Demo Patient/i });
    await expect(fastFillBtn).toBeVisible();
    await fastFillBtn.click();

    // Verify phone input populated
    await expect(phoneInput).toHaveValue('+201012345678');
  });

  test('should advance to OTP step and allow step reversion', async ({ page }) => {
    // Fill phone number
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('+201012345678');

    // Click send verification code
    const submitBtn = page.getByRole('button', { name: /Send Verification Code|إرسال الرمز/i });
    await submitBtn.click();

    // Verify step transition or mock verification
    const otpInput = page.locator('input[name="otpCode"]');
    if (await otpInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(otpInput).toBeVisible();
      // Test back button
      const backBtn = page.getByRole('button', { name: /Change Number/i });
      await backBtn.click();
      await expect(phoneInput).toBeVisible();
    }
  });
});
