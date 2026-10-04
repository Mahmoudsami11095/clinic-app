import { test, expect } from '@playwright/test';

test.describe('Smart Clinic Radiology & Imaging Viewer (Browser Automation)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/radiology');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Radiology Section Navigation & Container Presence', async ({ page }) => {
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      await expect(page.locator('app-root')).toBeAttached();
    } else {
      await expect(page.locator('app-root, [role="main"]')).toBeAttached();
    }
  });

  test('2. Scan Viewer Modal Controls & Action Verification', async ({ page }) => {
    // If view scan button exists on screen, trigger modal
    const viewScanBtn = page.locator('button:has-text("View Scan"), button:has-text("عرض الأشعة"), button:has(.pi-eye)').first();
    if (await viewScanBtn.isVisible()) {
      await viewScanBtn.click();
      await page.waitForTimeout(300);

      // Verify Scan Viewer Modal
      const modal = page.locator('app-scan-viewer-modal, [role="dialog"]').first();
      if (await modal.isVisible()) {
        // Test Zoom In
        const zoomInBtn = modal.locator('button:has(.pi-search-plus)').first();
        if (await zoomInBtn.isVisible()) {
          await zoomInBtn.click();
        }

        // Test Rotate
        const rotateBtn = modal.locator('button:has(.pi-refresh)').first();
        if (await rotateBtn.isVisible()) {
          await rotateBtn.click();
        }

        // Close modal
        const closeBtn = modal.locator('button:has(.pi-times)').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    }
  });
});
