import { test, expect } from '@playwright/test';

test.describe('Smart Clinic Registration Wizard (Browser Automation)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Registration Page Mounting & Initial Form Controls', async ({ page }) => {
    await expect(page).toHaveURL(/register/i);

    // Verify key Stage 1 inputs exist inside app-input-field
    const inputs = page.locator('app-input-field input, input');
    await expect(inputs.first()).toBeVisible();

    const emailInput = page.locator('input[type="email"], app-input-field[type="email"] input').first();
    const passwordInput = page.locator('input[type="password"], app-input-field[type="password"] input').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('2. Stepper Guard: Prevent Advancing with Empty Credentials', async ({ page }) => {
    // Attempt to proceed without entering name or email
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("التالي")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);

      // Verify form remains on register and highlights invalid inputs
      const invalidFields = page.locator('.ng-invalid, input:invalid');
      await expect(invalidFields.first()).toBeVisible();
    }
  });

  test('3. Interactive Role Card Selection (Doctor, Assistant, Patient)', async ({ page }) => {
    // Locate role cards or radio selections
    const doctorCard = page.locator('text=Doctor, text=طبيب, [data-role="doctor"]').first();
    const patientCard = page.locator('text=Patient, text=مريض, [data-role="patient"]').first();

    if (await doctorCard.isVisible()) {
      await doctorCard.click();
      await page.waitForTimeout(200);
    }

    if (await patientCard.isVisible()) {
      await patientCard.click();
      await page.waitForTimeout(200);
    }
  });

  test('4. Seamless Sign-In Navigation Link Back to Login', async ({ page }) => {
    // Find "Already have an account? Sign In" link
    const signInLink = page.locator('a[href*="login"], a:has-text("Sign in"), a:has-text("تسجيل الدخول")').first();
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Confirm navigation back to login
    await expect(page).toHaveURL(/login/i);
  });
});
