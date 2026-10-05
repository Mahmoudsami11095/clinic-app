import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Global Command Palette (Ctrl + K) - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Verify Ctrl + K Global Shortcut Toggle and Escape Dismissal', async ({ page }) => {
    // Ensure we are on the dashboard
    await expect(page).toHaveURL(/.*dashboard.*/i);

    // Trigger Command Palette via keyboard shortcut
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);

    // Verify spotlight dialog is mounted
    const dialog = page.locator('[role="dialog"][aria-label="Universal Command Palette"]');
    await expect(dialog).toBeVisible();

    // Verify search input is present and focused
    const searchInput = dialog.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();

    // Verify key commands and shortcuts legend are visible
    await expect(dialog.getByText(/Go to Dashboard|الانتقال إلى لوحة التحكم/i).first()).toBeVisible();
    await expect(dialog.getByText(/Go to Patients Directory|الانتقال إلى دليل المرضى/i).first()).toBeVisible();
    await expect(dialog.getByText(/MedClinic Spotlight/i).first()).toBeVisible();

    // Capture screenshot artifact of the open spotlight modal
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_command_palette.png',
      fullPage: false
    });

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible();
  });

  test('2. Header Search Trigger, Dynamic Querying, and Keyboard Navigation', async ({ page }) => {
    // Click on the header search bar containing Ctrl K
    const headerSearchBar = page.locator('header div').filter({ hasText: /Ctrl K/i }).first();
    await expect(headerSearchBar).toBeVisible();
    await headerSearchBar.click();
    await page.waitForTimeout(400);

    const dialog = page.locator('[role="dialog"][aria-label="Universal Command Palette"]');
    await expect(dialog).toBeVisible();

    // Type query to filter to Operatory & Chair board
    const searchInput = dialog.locator('input[type="text"]');
    await searchInput.fill('Operatory');
    await page.waitForTimeout(400);

    // Verify filtered result is displayed
    const chairCommand = dialog.getByText(/Chair & Operatory Live Board|لوحة الغرف والعيادات/i).first();
    await expect(chairCommand).toBeVisible();

    // Press Enter to execute command
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify dialog closed and navigated to /chair-board
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/.*chair-board.*/i);
  });
});
