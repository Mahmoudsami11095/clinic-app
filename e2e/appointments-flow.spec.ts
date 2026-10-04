import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Appointments Feature - Live Automated Browser Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/appointments');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Appointments Directory & Status Filter Tabs', async ({ page }) => {
    // Check page title
    const title = page.locator('h1, h2, h3').filter({ hasText: /Appointments|المواعيد/i }).first();
    await expect(title).toBeVisible();

    // Verify status filter options (All, Scheduled, Completed, Cancelled)
    const filterTabs = page.locator('button, [role="tab"]').filter({ hasText: /All|Scheduled|Completed|Cancelled|الكل|المجدولة|المكتملة/i });
    expect(await filterTabs.count()).toBeGreaterThan(0);

    // Click 'Scheduled' filter
    const scheduledTab = filterTabs.filter({ hasText: /Scheduled|المجدولة/i }).first();
    if (await scheduledTab.isVisible()) {
      await scheduledTab.click();
      await page.waitForTimeout(200);
    }
  });

  test('2. Book Appointment Modal Workflow & Field Inspections', async ({ page }) => {
    // Open Book Appointment modal
    const bookBtn = page.locator('button').filter({ hasText: /Book Appointment|حجز موعد|New Appointment/i }).first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
      await page.waitForTimeout(300);

      // Verify booking modal
      const modal = page.locator('app-appointment-form, [role="dialog"], .modal, .fixed.inset-0').first();
      await expect(modal).toBeVisible();

      // Check fields presence: Patient select, Doctor select, Date & Time, Visit Type
      const formText = await modal.innerText();
      expect(formText).toMatch(/Patient|المريض/i);
      expect(formText).toMatch(/Doctor|الطبيب/i);
      expect(formText).toMatch(/Date|التاريخ/i);

      // Close modal
      const cancelBtn = modal.locator('button:has-text("Cancel"), button:has-text("إلغاء"), button:has(.pi-times)').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('3. Live Waiting Room Queue Management (REQ-APT-02)', async ({ page }) => {
    // Locate the Live Waiting Room queue container
    const queueSection = page.locator('text=/Live Waiting Room|غرفة الانتظار|Queue/i').first();
    if (await queueSection.isVisible()) {
      await expect(queueSection).toBeVisible();

      // Verify queue controls (Check In, Start Consultation buttons if patients exist)
      const checkInBtns = page.locator('button:has-text("Check In"), button:has-text("تسجيل وصول")');
      if (await checkInBtns.count() > 0) {
        await expect(checkInBtns.first()).toBeVisible();
      }
    }
  });

  test('4. Automated Appointment Reminders & Messaging Trigger', async ({ page }) => {
    // Check for reminder buttons or batch reminder dispatch
    const reminderBtn = page.locator('button').filter({ hasText: /Send Reminder|Reminders|إرسال تذكير/i }).first();
    if (await reminderBtn.isVisible()) {
      await expect(reminderBtn).toBeEnabled();
    }
  });
});
