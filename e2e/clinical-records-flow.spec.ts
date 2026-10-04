import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Clinical Records & Prescriptions - Live Automated Browser Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Patient Clinical History & Encounter Notes Mounting', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Patients|المرضى/i }).first()).toBeVisible();

    // Check if any patient row exists to navigate to history
    const historyBtn = page.locator('button, a').filter({ hasText: /History|Notes|السجل|ملاحظات/i }).first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(400);

      // Verify patient history or clinical notes section
      const content = await page.locator('body').innerText();
      expect(content).toMatch(/Clinical|Encounter|Prescriptions|Notes|السريرية|الوصفات/i);
    }
  });

  test('2. Prescription Trigger in Appointments Roster', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Appointments|المواعيد/i }).first()).toBeVisible();

    // Check for Prescription / Prescribe button on appointments
    const rxBtn = page.locator('button').filter({ hasText: /Rx|Prescribe|Prescription|وصفة/i }).first();
    if (await rxBtn.isVisible()) {
      await rxBtn.click();
      await page.waitForTimeout(300);

      // Verify prescription dialog or section
      const rxModal = page.locator('app-prescription-form, [role="dialog"], .modal').first();
      if (await rxModal.isVisible()) {
        const modalText = await rxModal.innerText();
        expect(modalText).toMatch(/Medication|Medications|الدواء|الأدوية/i);

        // Close modal
        const closeBtn = rxModal.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button:has(.pi-times)').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    }
  });

  test('3. Dental Chart Odontogram Inspection & Tooth Anatomy', async ({ page }) => {
    await page.goto('/3d-dental-chart');
    await page.waitForLoadState('domcontentloaded');

    // Verify Dental Chart loads
    const chart = page.locator('app-dental-chart, app-skeuomorphic-dental-chart, main, .min-h-screen').first();
    await expect(chart).toBeVisible();

    // Check for interactive chart controls and view toggles
    const chartControls = page.locator('button:has-text("Adult"), button:has-text("Child"), button:has-text("Grid"), button:has-text("3D"), canvas');
    if (await chartControls.count() > 0) {
      await expect(chartControls.first()).toBeVisible();
      await chartControls.first().click();
      await page.waitForTimeout(200);
    }
  });
});
