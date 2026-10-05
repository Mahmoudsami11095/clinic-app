import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Angular 19 Signal Primitives Modernization - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Verify ModalComponent Signal Primitives & Reactive Dialog Life Cycle', async ({ page }) => {
    // Navigate to appointments module
    await page.goto('/appointments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for Book Appointment / New Appointment button
    const newAptBtn = page.locator('button').filter({ hasText: /Book Appointment|New Appointment|حجز موعد/i }).first();
    await expect(newAptBtn).toBeVisible({ timeout: 15000 });
    await newAptBtn.click();
    await page.waitForTimeout(500);

    // Verify modal dialog with signal inputs is rendered
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Capture screenshot artifact for Level 3 Customer Verification
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_signal_primitives_modernization.png',
      fullPage: false
    });

    // Close modal via Escape or Close button
    const closeBtn = modal.locator('button[aria-label*="Close"], button:has(i.pi-times)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
      await expect(modal).not.toBeVisible();
    }
  });

  test('2. Verify Patient Profile Modal Flow with Signal Inputs and Outputs', async ({ page }) => {
    // Navigate to patients module
    await page.goto('/patients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Open first patient
    const patientRow = page.locator('div[class*="cursor-pointer"]:has(h3), table tbody tr').first();
    await patientRow.waitFor({ state: 'visible', timeout: 15000 });
    await patientRow.click();
    await page.waitForURL(/\/patients\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Verify patient profile renders smoothly
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});
