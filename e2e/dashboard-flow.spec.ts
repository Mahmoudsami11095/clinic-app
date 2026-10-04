import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Dashboard Feature - Live Automated Browser Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Dashboard Overview & Metric Cards Mount Successfully', async ({ page }) => {
    // Check dashboard heading
    const heading = page.locator('h1, h2, h3').filter({ hasText: /Dashboard|لوحة التحكم/i }).first();
    await expect(heading).toBeVisible();

    // Verify statistical summary cards are rendered
    const statCards = page.locator('.stat-card, [class*="bg-white"][class*="rounded"], [class*="p-6"][class*="shadow"]');
    await expect(statCards.first()).toBeVisible();

    // Ensure stat cards are populated with values (e.g. Total Patients, Active Doctors, Upcoming Appts)
    const cardTexts = await page.locator('body').innerText();
    expect(cardTexts).toMatch(/Patients|المرضى/i);
    expect(cardTexts).toMatch(/Revenue|الإيرادات|Appointments|المواعيد/i);

    // Verify NO error toasts appeared on dashboard load
    const errorToasts = page.locator('.toast-error, [role="alert"].toast-error');
    expect(await errorToasts.count()).toBe(0);
  });

  test('2. Chart Canvas Rendering & Analytics Sections', async ({ page }) => {
    // PrimeNG or Chart.js canvas elements
    const canvases = page.locator('canvas, p-chart');
    if (await canvases.count() > 0) {
      await expect(canvases.first()).toBeVisible();
    }

    // Check recent appointments card/table
    const recentSection = page.locator('text=/Recent Appointments|أحدث المواعيد/i').first();
    await expect(recentSection).toBeVisible();
  });

  test('3. Clinic Switcher Header Dropdown Functionality', async ({ page }) => {
    // Look for clinic selector in the top bar
    const clinicSelector = page.locator('button, select, div').filter({ hasText: /Clinic|العيادة|All Clinics|كل العيادات/i }).first();
    if (await clinicSelector.isVisible()) {
      await clinicSelector.click();
      await page.waitForTimeout(300);

      // Verify dropdown options list appears
      const dropdownItems = page.locator('[role="listbox"], [role="menu"], .dropdown-menu, div:has-text("All Clinics")');
      expect(await dropdownItems.count()).toBeGreaterThan(0);
    }
  });

  test('4. Sidebar Navigation Links to Core Features', async ({ page }) => {
    const sidebar = page.locator('app-sidebar, aside, nav').first();
    await expect(sidebar).toBeVisible();

    // Check presence of key navigation links
    const patientsLink = sidebar.locator('a[href*="patients"]').first();
    const appointmentsLink = sidebar.locator('a[href*="appointments"]').first();
    const billingLink = sidebar.locator('a[href*="billing"]').first();

    await expect(patientsLink).toBeVisible();
    await expect(appointmentsLink).toBeVisible();
    await expect(billingLink).toBeVisible();
  });
});
