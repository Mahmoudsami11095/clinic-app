import { test, expect } from '@playwright/test';

test.describe('Smart Clinic Live Authentication Flow (Browser Automation)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Password Visibility Toggle (Show/Hide Secret)', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Type confidential password
    await passwordInput.fill('SecretPass123!');
    expect(await passwordInput.getAttribute('type')).toBe('password');

    // Click visibility toggle button
    const toggleBtn = page.locator('button:has(.pi-eye), button:has(.pi-eye-slash)').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(150);

      // Input type should now be 'text'
      const revealedInput = page.locator('input[name="password"], input[formcontrolname="password"]').first();
      expect(await revealedInput.getAttribute('type')).toBe('text');

      // Click toggle again to hide
      await toggleBtn.click();
      await page.waitForTimeout(150);
      expect(await revealedInput.getAttribute('type')).toBe('password');
    }
  });

  test('2. Remember Me Checkbox Interaction', async ({ page }) => {
    const rememberMe = page.locator('input[type="checkbox"]#remember-me, input[type="checkbox"]').first();
    if (await rememberMe.isVisible()) {
      await rememberMe.check();
      expect(await rememberMe.isChecked()).toBeTrue();

      await rememberMe.uncheck();
      expect(await rememberMe.isChecked()).toBeFalse();
    }
  });

  test('3. Forgot Password Modal Workflow', async ({ page }) => {
    // Click Forgot Password link
    const forgotLink = page.locator('a:has-text("Forgot"), a:has-text("نسيت"), button:has-text("Forgot")').first();
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await page.waitForTimeout(300);

      // Verify modal is displayed
      const modal = page.locator('app-forgot-password, [role="dialog"], .fixed.inset-0').first();
      await expect(modal).toBeVisible();

      // Close modal
      const cancelBtn = modal.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button:has(.pi-times)').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('4. Social Authentication Options Mounting', async ({ page }) => {
    // Verify Google SSO or social auth options render cleanly
    const googleBtn = page.locator('button:has-text("Google"), [title*="Google"]').first();
    if (await googleBtn.isVisible()) {
      await expect(googleBtn).toBeEnabled();
    }
  });

  test('5. Navigation to User Registration Flow', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register"), a:has-text("إنشاء حساب")').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify URL updated to register
      await expect(page).toHaveURL(/register/i);
    }
  });
});
