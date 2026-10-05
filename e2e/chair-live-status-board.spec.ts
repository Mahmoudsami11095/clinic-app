import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Chair & Room Live Status Board - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/chair-board');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('1. Verify Operatory Status Board Mounting & Live Metrics', async ({ page }) => {
    // Verify Live WebSocket Sync Header Banner
    const title = page.locator('h2').filter({ hasText: /Chair & Operatory|حالة العيادات/i });
    await expect(title).toBeVisible({ timeout: 15000 });

    const liveBadge = page.locator('text=Live Sync, text=مزامنة فورية').first();
    await expect(liveBadge).toBeVisible();

    // Verify KPI Status counters exist
    await expect(page.locator('text=Total Operatories, text=إجمالي الغرف').first()).toBeVisible();
    await expect(page.locator('text=Ready, text=جاهز').first()).toBeVisible();
    await expect(page.locator('text=In Chair, text=في الكرسي').first()).toBeVisible();
    await expect(page.locator('text=Sterilization, text=قيد التعقيم').first()).toBeVisible();

    // Verify operatory cards loaded
    const operatoryCards = page.locator('div:has-text("Room 101"), div:has-text("Operatory")').first();
    await expect(operatoryCards).toBeVisible();
  });

  test('2. Complete Lifecycle Flow: Seat Patient -> Discharge to Sterilization -> Mark Ready', async ({ page }) => {
    // Look for an available chair button "Seat Patient"
    const seatPatientBtn = page.locator('button').filter({ hasText: /Seat Patient|إجلاس مريض/i }).first();
    await seatPatientBtn.waitFor({ state: 'visible', timeout: 15000 });
    await seatPatientBtn.click();
    await page.waitForTimeout(500);

    // Verify modal dialog opens
    const modal = page.locator('[aria-label="Assign Patient to Operatory"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.fill('input[name="patientName"]', 'Nourhan Tarek');
    await page.fill('input[name="procedureName"]', 'Full Mouth Scaling & Polishing');
    await page.fill('textarea[name="notes"]', 'Prefers gentle ultrasonic scaler');

    // Submit assignment
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Verify modal closed
    await expect(modal).not.toBeVisible();

    // Verify operatory card is now occupied with patient name
    const patientTag = page.locator('text=Nourhan Tarek').first();
    await expect(patientTag).toBeVisible();

    // Step 2: Discharge & Sterilize
    const dischargeBtn = page.locator('button').filter({ hasText: /Discharge & Sterilize|إنهاء وبدء التعقيم/i }).first();
    await expect(dischargeBtn).toBeVisible();
    await dischargeBtn.click();
    await page.waitForTimeout(1000);

    // Step 3: Complete Cleaning (Mark Ready)
    const markReadyBtn = page.locator('button').filter({ hasText: /Complete Cleaning|اكتمال التعقيم/i }).first();
    await expect(markReadyBtn).toBeVisible();
    await markReadyBtn.click();
    await page.waitForTimeout(1000);

    // Verify card is restored to Ready
    const readyState = page.locator('text=Operatory Sanitized & Ready, text=جاهز').first();
    await expect(readyState).toBeVisible();

    // Capture screenshot artifact of the live status board
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_chair_status_board.png',
      fullPage: false
    });
  });
});
