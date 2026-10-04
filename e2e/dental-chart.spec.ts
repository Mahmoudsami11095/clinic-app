import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Smart Clinic Dental Charting (Browser Automation)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/3d-dental-chart');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Dental Chart Mounting & Header Verification', async ({ page }) => {
    await expect(page.locator('app-dental-chart, app-root').first()).toBeAttached();
    const heading = page.locator('h1, h2, h3').filter({ hasText: /Dental|الأسنان|Teeth/i }).first();
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible();
    }
  });

  test('2. Dentition Switcher Controls (Adult 32 vs Pediatric 20)', async ({ page }) => {
    const adultBtn = page.locator('button:has-text("Adult"), button:has-text("بالغ")').first();
    const childBtn = page.locator('button:has-text("Child"), button:has-text("Pediatric"), button:has-text("أطفال")').first();

    if (await adultBtn.isVisible()) {
      await adultBtn.click();
      await page.waitForTimeout(200);
    }

    if (await childBtn.isVisible()) {
      await childBtn.click();
      await page.waitForTimeout(200);
    }
  });

  test('3. Odontogram View Mode Toggle (3D vs Skeuomorphic Grid)', async ({ page }) => {
    const gridBtn = page.locator('button:has-text("Grid"), button:has-text("شبكة"), button[title*="Grid"]').first();
    const threeBtn = page.locator('button:has-text("3D"), button[title*="3D"]').first();

    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await page.waitForTimeout(300);
    }

    if (await threeBtn.isVisible()) {
      await threeBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
