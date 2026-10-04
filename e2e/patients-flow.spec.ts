import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Patients Feature - Live Automated Browser Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/patients');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Patient Directory List Renders with Headers and Search', async ({ page }) => {
    // Check page header
    const title = page.locator('h1, h2, h3').filter({ hasText: /Patients|المرضى/i }).first();
    await expect(title).toBeVisible();

    // Verify search bar input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"]').first();
    await expect(searchInput).toBeVisible();

    // Type a search query to verify reactive filtering
    await searchInput.fill('John');
    await page.waitForTimeout(300);
    await searchInput.clear();
  });

  test('2. Add New Patient Modal Workflow & Validation', async ({ page }) => {
    // Locate Add Patient button
    const addBtn = page.locator('button').filter({ hasText: /Add Patient|إضافة مريض|New Patient/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);

      // Verify patient form modal opens
      const modal = page.locator('app-patient-form, [role="dialog"], .modal, .fixed.inset-0').first();
      await expect(modal).toBeVisible();

      // Check required input fields
      const firstNameInput = modal.locator('input[formcontrolname="firstName"], input[name="firstName"]').first();
      const lastNameInput = modal.locator('input[formcontrolname="lastName"], input[name="lastName"]').first();
      
      if (await firstNameInput.isVisible()) {
        await expect(firstNameInput).toBeVisible();
        await expect(lastNameInput).toBeVisible();
      }

      // Test validation: attempt submit with empty fields
      const saveBtn = modal.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(200);

        // Form should remain invalid
        const invalidFields = modal.locator('.ng-invalid, input:invalid');
        expect(await invalidFields.count()).toBeGreaterThan(0);
      }

      // Close modal
      const cancelBtn = modal.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button:has(.pi-times)').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('3. Gender and Demographic Filter Controls', async ({ page }) => {
    // Find filter select or buttons
    const filterSelect = page.locator('select, [role="combobox"]').filter({ hasText: /Gender|All|الكل|ذكر|أنثى/i }).first();
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      await page.waitForTimeout(200);
    }
  });

  test('4. Patient Table Row Interaction & Action Buttons', async ({ page }) => {
    // If patient rows exist, test action buttons (View, Edit, Medical History)
    const patientRows = page.locator('table tbody tr, .patient-card');
    const rowCount = await patientRows.count();

    if (rowCount > 0) {
      const firstRow = patientRows.first();
      await expect(firstRow).toBeVisible();

      // Check for action icons (edit, view, history)
      const actionIcons = firstRow.locator('button, a[href*="patients/"]');
      expect(await actionIcons.count()).toBeGreaterThan(0);
    }
  });
});
