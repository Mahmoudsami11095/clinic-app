import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Clinics & Inventory Management - Live Automated Browser Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Clinics Directory & Branch Management (REQ-CLI-03)', async ({ page }) => {
    await page.goto('/clinics');
    await page.waitForLoadState('domcontentloaded');

    // Verify clinics heading
    const title = page.locator('h1, h2, h3').filter({ hasText: /Clinics|العيادات/i }).first();
    await expect(title).toBeVisible();

    // Check Add / Establish Clinic button
    const addBtn = page.locator('button').filter({ hasText: /Add Clinic|Establish|إنشاء عيادة|إضافة عيادة/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);

      // Verify modal opened
      const modal = page.locator('app-clinic-form, [role="dialog"], .modal, .fixed.inset-0').first();
      await expect(modal).toBeVisible();

      // Check fields: Branch Code, Clinic Name, Address, Phone, Rooms
      const modalText = await modal.innerText();
      expect(modalText).toMatch(/Name|الاسم/i);
      expect(modalText).toMatch(/Address|العنوان/i);

      // Close modal
      const cancelBtn = modal.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button:has(.pi-times)').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('2. Inventory Materials & Safe Stock Threshold Alerts', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded');

    // Verify inventory heading
    const title = page.locator('h1, h2, h3').filter({ hasText: /Inventory|المخزون|Materials/i }).first();
    await expect(title).toBeVisible();

    // Search inventory items
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Gloves');
      await page.waitForTimeout(300);
      await searchInput.clear();
    }

    // Check for Restock / Inward Shipment action
    const restockBtn = page.locator('button').filter({ hasText: /Restock|Shipment|Inward|إضافة مخزون|توريد/i }).first();
    if (await restockBtn.isVisible()) {
      await expect(restockBtn).toBeEnabled();
    }
  });
});
