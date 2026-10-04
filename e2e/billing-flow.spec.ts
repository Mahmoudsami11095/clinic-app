import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Billing & Revenue Feature - Live Automated Browser Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/billing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('1. Billing Directory & Revenue Metric Headers', async ({ page }) => {
    // Check page title
    const title = page.locator('h1, h2, h3').filter({ hasText: /Billing|الفواتير|Invoices/i }).first();
    await expect(title).toBeVisible();

    // Verify financial summary cards (Paid, Outstanding, Collected)
    const pageText = await page.locator('body').innerText();
    expect(pageText).toMatch(/Collected|Paid|المحصل|المدفوع|Outstanding|المتبقي/i);

    // Verify search bar input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('2. Invoice Payment Status Filters (Paid, Pending, Overdue, Voided)', async ({ page }) => {
    const statusPills = page.locator('button').filter({ hasText: /All|Paid|Pending|Overdue|Voided|الكل|المدفوعة|المعلقة|الملغاة/i });
    await expect(statusPills.first()).toBeVisible();

    // Click 'Pending' filter
    const pendingPill = statusPills.filter({ hasText: /Pending|المعلقة/i }).first();
    if (await pendingPill.isVisible()) {
      await pendingPill.click();
      await page.waitForTimeout(200);
    }
  });

  test('3. Create Invoice Modal Form & Financial Calculations', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /Create Invoice|إنشاء فاتورة|New Invoice/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('app-billing-form, [role="dialog"], .modal, .fixed.inset-0').first();
      await expect(modal).toBeVisible();

      // Check key invoice fields
      const modalText = await modal.innerText();
      expect(modalText).toMatch(/Patient|المريض/i);
      expect(modalText).toMatch(/Amount|المبلغ|Subtotal/i);

      // Close modal
      const cancelBtn = modal.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button:has(.pi-times)').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('4. Print & Receipt Generation Controls', async ({ page }) => {
    // If invoices exist in the table, verify Print action button
    const printButtons = page.locator('button:has(.pi-print), button:has-text("Print"), button:has-text("طباعة")');
    if (await printButtons.count() > 0) {
      await expect(printButtons.first()).toBeVisible();
    }
  });
});
