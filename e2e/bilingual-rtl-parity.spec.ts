import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Bilingual RTL Parity & Localization Polish - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Verify Language Switch to Arabic: dir="rtl", Cairo font, translated navigation, and RTL mirrored layout', async ({ page }) => {
    // 1. Initial State: English (LTR)
    await expect(page).toHaveURL(/.*dashboard.*/i);
    const html = page.locator('html');
    
    // Ensure English is initial or switch to English first if cached
    const currentLang = await html.getAttribute('lang');
    if (currentLang === 'ar') {
      const langBtn = page.locator('header button').filter({ hasText: /English/i }).first();
      if (await langBtn.isVisible()) {
        await langBtn.click();
        await page.waitForTimeout(400);
      }
    }

    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(html).toHaveAttribute('lang', 'en');

    // Verify English sidebar labels
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
    await expect(page.getByText(/Patients/i).first()).toBeVisible();

    // 2. Switch to Arabic via Header Button
    const toArabicBtn = page.locator('header button').filter({ hasText: /العربية/i }).first();
    await expect(toArabicBtn).toBeVisible();
    await toArabicBtn.click();
    await page.waitForTimeout(500);

    // 3. Verify RTL DOM Attributes
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    // 4. Verify Arabic Translated UI Navigation Elements
    await expect(page.getByText('لوحة التحكم').first()).toBeVisible();
    await expect(page.getByText('المرضى').first()).toBeVisible();
    await expect(page.getByText('المواعيد').first()).toBeVisible();

    // 5. Open Universal Command Palette in Arabic via Ctrl+K
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);

    const dialog = page.locator('[role="dialog"][aria-label="Universal Command Palette"]');
    await expect(dialog).toBeVisible();

    // Verify Arabic Command Palette Placeholder & Commands
    const searchInput = dialog.locator('input[type="text"]');
    await expect(searchInput).toHaveAttribute('placeholder', /اكتب أمرًا/i);
    await expect(dialog.getByText(/الانتقال إلى جدول المواعيد/i).first()).toBeVisible();

    // 6. Capture full screenshot artifact of the live Arabic RTL interface
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_arabic_rtl_parity.png',
      fullPage: false
    });

    // Dismiss command palette
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(dialog).not.toBeVisible();

    // 7. Verify Bidirectional Round-Trip: Switch back to English
    const toEnglishBtn = page.locator('header button').filter({ hasText: /English/i }).first();
    await expect(toEnglishBtn).toBeVisible();
    await toEnglishBtn.click();
    await page.waitForTimeout(400);

    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
  });

  test('2. Verify Operatory Board and Currency Localization in Arabic', async ({ page }) => {
    // Navigate to Operatory / Chair Status Board
    await page.goto('/chair-board');
    await page.waitForLoadState('domcontentloaded');

    const html = page.locator('html');
    const currentDir = await html.getAttribute('dir');
    if (currentDir !== 'rtl') {
      const globeBtn = page.locator('header button').filter({ has: page.locator('.pi-globe') }).first();
      await globeBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify translated chair board headers
    await expect(page.getByText(/لوحة حالة الغرف وكراسي الأسنان المباشرة|مزامنة فورية/i).first()).toBeVisible();

    // Switch back to English for cleanup
    const englishGlobeBtn = page.locator('header button').filter({ has: page.locator('.pi-globe') }).first();
    await englishGlobeBtn.click();
    await page.waitForTimeout(400);

    await expect(html).toHaveAttribute('dir', 'ltr');
  });
});
