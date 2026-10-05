import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Advanced Radiology & X-Ray Viewer - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/radiology');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('1. Verify Radiology Dashboard Mounting & Launch Advanced Viewer', async ({ page }) => {
    // If not directly on radiology, click sidebar
    if (!page.url().includes('/radiology')) {
      const radLink = page.locator('a[href*="radiology"]').first();
      if (await radLink.isVisible()) {
        await radLink.click();
        await page.waitForTimeout(1000);
      } else {
        await page.goto('/radiology');
        await page.waitForTimeout(1000);
      }
    }

    // Verify page title
    const headerTitle = page.locator('h1').filter({ hasText: /Radiology|الأشعة/i }).first();
    await expect(headerTitle).toBeVisible({ timeout: 15000 });

    // Look for Launch Advanced Viewer button
    const launchBtn = page.locator('button').filter({ hasText: /Launch Advanced X-Ray Viewer|Advanced X-Ray/i }).first();
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();
    await page.waitForTimeout(600);

    // Verify modal opened
    const modalTitle = page.locator('text=High-Resolution Radiograph Viewer, text=REQ-RAD-02').first();
    await expect(modalTitle).toBeVisible();

    // Verify tools present
    await expect(page.locator('button').filter({ hasText: /Ruler/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /Compare Mode/i }).first()).toBeVisible();
    await expect(page.locator('text=Bright').first()).toBeVisible();
    await expect(page.locator('text=Contrast').first()).toBeVisible();
  });

  test('2. Measurement Caliper Ruler & Before/After Comparison Flow', async ({ page }) => {
    if (!page.url().includes('/radiology')) {
      await page.goto('/radiology');
      await page.waitForTimeout(1000);
    }

    // Open viewer modal
    const launchBtn = page.locator('button').filter({ hasText: /Launch Advanced X-Ray Viewer|Advanced X-Ray/i }).first();
    await launchBtn.click();
    await page.waitForTimeout(600);

    // Step A: Activate Caliper Measurement Ruler
    const rulerBtn = page.locator('button').filter({ hasText: /Ruler/i }).first();
    await rulerBtn.click();
    await page.waitForTimeout(300);

    // Verify ruler active HUD indicator
    const rulerHud = page.locator('text=Ruler Mode Active').first();
    await expect(rulerHud).toBeVisible();

    // Simulate clicking viewport to set Point A and Point B
    const viewport = page.locator('div.cursor-crosshair').first();
    const box = await viewport.boundingBox();
    if (box) {
      // Click Point A
      await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
      await page.waitForTimeout(200);

      // Click Point B
      await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.4);
      await page.waitForTimeout(300);

      // Verify SVG distance overlay rendered
      const svgOverlay = page.locator('svg line').first();
      await expect(svgOverlay).toBeVisible();
    }

    // Step B: Toggle Before & After Comparison Mode
    const compareBtn = page.locator('button').filter({ hasText: /Compare Mode/i }).first();
    await compareBtn.click();
    await page.waitForTimeout(500);

    // Verify dual comparison panels
    await expect(page.locator('text=PRE-OP BASELINE').first()).toBeVisible();
    await expect(page.locator('text=POST-OP CURRENT').first()).toBeVisible();

    // Capture screenshot artifact of the live viewer with comparison & ruler
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_radiology_xray_viewer.png',
      fullPage: false
    });
  });
});
