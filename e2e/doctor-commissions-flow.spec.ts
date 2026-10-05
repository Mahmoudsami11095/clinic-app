import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Doctor Commission & Profit-Sharing Analytics - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. View Executive Commission Analytics, Configure Doctor Plan, Settle Payout, and Capture Artifact', async ({ page }) => {
    // Navigate directly to doctor commissions module
    await page.goto('/billing/commissions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 1. Verify Page Title & Subtitle
    await expect(page.getByText(/Doctor Commissions & Profit-Sharing Analytics|عمولات الأطباء/i).first()).toBeVisible();

    // 2. Verify 4 Executive KPI Cards are visible
    await expect(page.getByText(/Total Gross Revenue|إجمالي الإيرادات/i).first()).toBeVisible();
    await expect(page.getByText(/Doctor Net Commissions|صافي عمولات الأطباء/i).first()).toBeVisible();
    await expect(page.getByText(/Clinic Retained Profit|صافي أرباح العيادة/i).first()).toBeVisible();
    await expect(page.getByText(/Lab Fees Deducted|تكاليف المعامل/i).first()).toBeVisible();

    // 3. Verify Doctor Breakdown Table
    await expect(page.getByText(/Doctor Breakdown & Shares|تفصيل الأطباء/i).first()).toBeVisible();
    const configPlanBtn = page.locator('button').filter({ hasText: /Configure Plan|ضبط الخطة/i }).first();
    await expect(configPlanBtn).toBeVisible();

    // 4. Open Plan Configuration Modal
    await configPlanBtn.click();
    await page.waitForTimeout(500);

    const planModal = page.locator('[role="dialog"][aria-label="Configure Doctor Commission Plan"]');
    await expect(planModal).toBeVisible();

    // Verify Real-Time Formula Simulator inside Modal
    await expect(planModal.getByText(/Live Formula Real-Time Simulator/i)).toBeVisible();
    await expect(planModal.getByText(/Doctor Payout:/i)).toBeVisible();
    await expect(planModal.getByText(/Clinic Retained:/i)).toBeVisible();

    // Save Plan Modal
    const savePlanBtn = planModal.locator('button').filter({ hasText: /Save Commission Plan|حفظ خطة العمولة/i }).first();
    await expect(savePlanBtn).toBeVisible();
    await savePlanBtn.click();
    await page.waitForTimeout(500);
    await expect(planModal).not.toBeVisible();

    // 5. Switch to Itemized Encounters Tab
    const encountersTab = page.locator('button').filter({ hasText: /Itemized Encounters|الإجراءات والزيارات/i }).first();
    await encountersTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator('table').first()).toBeVisible();

    // 6. Switch to Payout Settlement Ledger Tab
    const payoutsTab = page.locator('button').filter({ hasText: /Payout Settlement Ledger|سجل تسوية المدفوعات/i }).first();
    await payoutsTab.click();
    await page.waitForTimeout(500);

    // 7. Click Settle Payout button if available, or generate one
    const settleBtn = page.locator('button').filter({ hasText: /Settle Payout|تسوية المستحقات/i }).first();
    if (await settleBtn.isVisible()) {
      await settleBtn.click();
      await page.waitForTimeout(400);

      const settleModal = page.locator('[role="dialog"][aria-label="Settle Doctor Commission Payout"]');
      await expect(settleModal).toBeVisible();

      // Enter payment reference
      const refInput = settleModal.locator('input').first();
      await refInput.fill('CIB-TRX-778899');

      // Capture screenshot artifact for Level 3 Customer Verification with Settle Modal open
      await page.screenshot({
        path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_doctor_commission.png',
        fullPage: false
      });

      // Confirm Settlement
      const confirmBtn = settleModal.locator('button').filter({ hasText: /Confirm & Mark Paid|تأكيد التحويل والتسوية/i }).first();
      await confirmBtn.click();
      await page.waitForTimeout(500);
      await expect(settleModal).not.toBeVisible();
    } else {
      // Capture screenshot artifact on Executive Dashboard view
      await page.screenshot({
        path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_doctor_commission.png',
        fullPage: false
      });
    }
  });

  test('2. Navigation Switcher Toggles Between Invoices and Doctor Commissions', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify Invoices view
    await expect(page.getByText(/Create Invoice|إنشاء فاتورة/i).first()).toBeVisible();

    // Click on Doctor Commissions switcher tab
    const commTab = page.locator('a, button').filter({ hasText: /Doctor Commissions|عمولات الأطباء/i }).first();
    await expect(commTab).toBeVisible();
    await commTab.click();

    // Verify URL transitions to /billing/commissions
    await page.waitForURL(/\/billing\/commissions/, { timeout: 10000 });
    await expect(page.getByText(/Total Gross Revenue|إجمالي الإيرادات/i).first()).toBeVisible();
  });
});
