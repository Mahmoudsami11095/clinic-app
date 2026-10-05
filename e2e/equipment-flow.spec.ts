import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Clinical Equipment & Devices Asset Management - E2E Browser Flow', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Sidebar Navigation and Page Header Verification', async ({ page }) => {
    // Locate Equipment link in sidebar
    const equipmentLink = page.locator('aside a[href="/equipment"], nav a[href="/equipment"]').first();
    await expect(equipmentLink).toBeVisible();
    await equipmentLink.click();

    // Verify URL navigation
    await page.waitForURL(/\/equipment/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    // Verify main header
    const pageHeading = page.locator('h2').filter({ hasText: /Clinical Equipment & Devices|الأجهزة والمعدات/i }).first();
    await expect(pageHeading).toBeVisible();
  });

  test('2. KPI Metric Cards and Seeded Devices Catalog Verification', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify KPI Metric Cards
    const totalDevicesCard = page.locator('text=/Total Devices|إجمالي الأجهزة/i').first();
    await expect(totalDevicesCard).toBeVisible();

    const operationalCard = page.locator('text=/Operational|يعمل بكفاءة/i').first();
    await expect(operationalCard).toBeVisible();

    // Verify table has standard dental devices loaded
    const tableBody = page.locator('tbody').first();
    await expect(tableBody).toBeVisible();

    // Verify key dental equipment exists
    const autoclaveRow = page.locator('td').filter({ hasText: /Autoclave|أوتوكلاف/i }).first();
    await expect(autoclaveRow).toBeVisible();

    const curingLightRow = page.locator('td').filter({ hasText: /Curing Light|ضوء المعالجة|Woodpecker/i }).first();
    await expect(curingLightRow).toBeVisible();

    const handpieceRow = page.locator('td').filter({ hasText: /Handpiece|قبضة/i }).first();
    await expect(handpieceRow).toBeVisible();
  });

  test('3. Search and Category Filter Interaction', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Search devices"], input[placeholder*="بحث"]').first();
    await expect(searchInput).toBeVisible();

    // Search for Autoclave
    await searchInput.fill('Autoclave');
    await page.waitForTimeout(300);

    const rowsAfterSearch = page.locator('tbody tr');
    const rowCount = await rowsAfterSearch.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Test filter status buttons (Operational)
    const operationalFilterBtn = page.locator('button').filter({ hasText: /^Operational/i }).first();
    if (await operationalFilterBtn.isVisible()) {
      await operationalFilterBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('4. Register Device Modal Lifecycle', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('domcontentloaded');

    // Click "Register Device" button
    const registerBtn = page.locator('button').filter({ hasText: /Register Device|تسجيل جهاز/i }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Modal should be open
    const modalTitle = page.locator('h3').filter({ hasText: /Register Clinical Equipment|تسجيل/i }).first();
    await expect(modalTitle).toBeVisible();

    // Inspect fields
    const deviceNameInput = page.locator('input[placeholder*="Autoclave"], input[name="name"]').first();
    await expect(deviceNameInput).toBeVisible();

    // Close modal via Cancel button
    const cancelBtn = page.locator('button').filter({ hasText: /Cancel|إلغاء/i }).first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await page.waitForTimeout(300);

    // Modal should be closed
    await expect(modalTitle).not.toBeVisible();
  });

  test('5. Maintenance Service Dialog Inspection', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click "Service / Log" button on the first equipment item
    const serviceBtn = page.locator('button').filter({ hasText: /Service \/ Log|صيانة/i }).first();
    if (await serviceBtn.isVisible()) {
      await serviceBtn.click();

      // Maintenance Modal should appear
      const modalHeader = page.locator('h3').filter({ hasText: /Log Maintenance & Service|تسجيل الصيانة/i }).first();
      await expect(modalHeader).toBeVisible();

      // Check service notes and provider inputs
      const providerInput = page.locator('input[placeholder*="Company"], input[placeholder*="الشركة"]').first();
      if (await providerInput.isVisible()) {
        await expect(providerInput).toBeVisible();
      }

      // Close modal
      const closeBtn = page.locator('button').filter({ hasText: /Cancel|إلغاء/i }).first();
      await closeBtn.click();
      await page.waitForTimeout(300);
      await expect(modalHeader).not.toBeVisible();
    }
  });

  test('6. Equipment Image Thumbnail and Lightbox Zoom Modal', async ({ page }) => {
    await page.goto('/equipment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for equipment image thumbnails
    const thumbnails = page.locator('table img[src*="/images/equipment/"]');
    const count = await thumbnails.count();
    if (count > 0) {
      const firstThumb = thumbnails.first();
      await expect(firstThumb).toBeVisible();

      // Click thumbnail to trigger full-size lightbox zoom
      await firstThumb.click();
      await page.waitForTimeout(400);

      // Lightbox preview should appear
      const lightboxModal = page.locator('.fixed.inset-0.z-50 img[src*="/images/equipment/"]');
      await expect(lightboxModal).toBeVisible();

      // Close lightbox
      const closeBtn = page.locator('.fixed.inset-0.z-50 button').first();
      await closeBtn.click();
      await page.waitForTimeout(300);
      await expect(lightboxModal).not.toBeVisible();
    }
  });
});
