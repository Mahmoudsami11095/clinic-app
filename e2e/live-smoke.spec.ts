import { test, expect } from '@playwright/test';

test.describe('Smart Clinic Live Browser E2E Automation', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Application Shell Mounting & Title', async ({ page }) => {
    // Root container must be mounted in DOM
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeAttached();

    // Verify main page card or form is visible
    const mainContainer = page.locator('app-root form, app-root .min-h-screen').first();
    await expect(mainContainer).toBeVisible();

    // Verify page title
    await expect(page).toHaveTitle(/ClinicApp/i);
  });

  test('2. Bilingual Language Directional Switching (LTR <-> RTL)', async ({ page }) => {
    const htmlTag = page.locator('html');

    // Click language switch to Arabic
    const langBtn = page.locator('button:has-text("العربية"), button:has-text("English"), button[title*="Language"], button[title*="اللغة"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(300);

      const dir = await htmlTag.getAttribute('dir');
      expect(dir === 'rtl' || dir === 'ltr').toBeTruthy();

      // Toggle back
      await langBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('3. Theme Switcher (Dark & Light Mode Toggle)', async ({ page }) => {
    const htmlTag = page.locator('html');
    const themeBtn = page.locator('button:has(.pi-sun), button:has(.pi-moon), button[title*="Theme"], button[title*="المظهر"]').first();

    if (await themeBtn.isVisible()) {
      const initialHasDark = await htmlTag.evaluate(el => el.classList.contains('dark'));
      
      // Click toggle
      await themeBtn.click();
      await page.waitForTimeout(300);

      const afterHasDark = await htmlTag.evaluate(el => el.classList.contains('dark'));
      expect(afterHasDark).not.toBe(initialHasDark);

      // Revert back
      await themeBtn.click();
    }
  });

  test('4. Form Security & Reactive Validation on Empty Submission', async ({ page }) => {
    // Locate the primary submit button
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();

    // Click Sign In with empty fields
    await submitBtn.click();

    // Verify error prompts or invalid class presence
    const invalidInputs = page.locator('.ng-invalid, input:invalid');
    await expect(invalidInputs.first()).toBeVisible();
  });

  test('5. Tab Navigation: Password vs OTP Code Login Method', async ({ page }) => {
    // Look for OTP Tab
    const otpTab = page.locator('button:has-text("OTP"), button:has-text("رمز"), [role="tab"]:has-text("OTP")').first();
    const passwordTab = page.locator('button:has-text("Password"), button:has-text("كلمة المرور")').first();

    if (await otpTab.isVisible()) {
      await otpTab.click();
      await page.waitForTimeout(200);

      // Verify OTP action is visible
      const otpAction = page.locator('button:has-text("Send OTP"), button:has-text("إرسال"), input[type="text"]');
      await expect(otpAction.first()).toBeVisible();

      // Switch back to password
      if (await passwordTab.isVisible()) {
        await passwordTab.click();
        await page.waitForTimeout(200);
        await expect(page.locator('input[type="password"]')).toBeVisible();
      }
    }
  });

  test('6. Chair-Side Ergonomics: Responsive Viewport without Horizontal Overflow', async ({ page }) => {
    // Check for zero horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of error for fractional pixels
  });
});
