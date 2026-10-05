import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Multi-Stage Treatment Plans & Cost Estimator - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/patients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('1. Open Patient Profile and Launch Multi-Stage Treatment Plan Modal', async ({ page }) => {
    // Click on the first patient card to navigate to patient detail
    const patientCard = page.locator('div[class*="cursor-pointer"]:has(h3), table tbody tr').first();
    await patientCard.waitFor({ state: 'visible', timeout: 15000 });
    await patientCard.click();
    await page.waitForURL(/\/patients\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Locate Treatment Plan action button in dental chart header
    const planBtn = page.locator('button').filter({ hasText: /Treatment Plan|خطة العلاج/i }).first();
    await planBtn.waitFor({ state: 'visible', timeout: 15000 });
    await planBtn.evaluate(b => (b as HTMLElement).click());
    await page.waitForTimeout(1000);

    // Verify Treatment Plan & Cost Estimator modal opens
    const modal = page.locator('[aria-label="Multi-Stage Treatment Plan & Cost Estimator"]');
    await expect(modal).toBeVisible();

    // Verify Title & Ref
    await expect(modal.locator('text=Multi-Stage Treatment Plan & Cost Estimator')).toBeVisible();
    await expect(modal.locator('text=Ref: DTP-')).toBeVisible();

    // Close modal
    const closeBtn = modal.locator('button[aria-label="Close treatment plan modal"]').first();
    await closeBtn.click();
    await page.waitForTimeout(400);
    await expect(modal).not.toBeVisible();
  });

  test('2. Multi-Stage Roadmap, Cost Estimator, and Formal Consent Document', async ({ page }) => {
    // Navigate to first patient
    const patientCard = page.locator('div[class*="cursor-pointer"]:has(h3), table tbody tr').first();
    await patientCard.waitFor({ state: 'visible', timeout: 15000 });
    await patientCard.click();
    await page.waitForURL(/\/patients\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Open Treatment Plan Modal
    const planBtn = page.locator('button').filter({ hasText: /Treatment Plan|خطة العلاج/i }).first();
    await planBtn.waitFor({ state: 'visible', timeout: 15000 });
    await planBtn.evaluate(b => (b as HTMLElement).click());
    await page.waitForTimeout(1000);

    const modal = page.locator('[aria-label="Multi-Stage Treatment Plan & Cost Estimator"]');
    await expect(modal).toBeVisible();

    // ── Tab 1: Roadmap & Phases ──
    const roadmapTab = modal.locator('button:has-text("Phases & Roadmap")');
    await expect(roadmapTab).toBeVisible();
    await expect(modal.locator('text=Clinical Treatment Trajectory')).toBeVisible();

    // ── Tab 2: Cost Estimator ──
    const estimatorTab = modal.locator('button:has-text("Cost Estimator")');
    await expect(estimatorTab).toBeVisible();
    await estimatorTab.click();
    await page.waitForTimeout(500);

    // Verify Financial Cards
    await expect(modal.locator('text=Gross Subtotal')).toBeVisible();
    await expect(modal.locator('text=Net Estimated Total')).toBeVisible();
    await expect(modal.locator('text=Initial Deposit')).toBeVisible();
    await expect(modal.locator('text=Milestone Installment Schedule')).toBeVisible();

    // Test Discount presets
    const discount10Btn = modal.locator('button:has-text("10%")').first();
    if (await discount10Btn.isVisible()) {
      await discount10Btn.click();
      await page.waitForTimeout(200);
    }

    // Verify Deposit Action button exists
    const genInvoiceBtn = modal.locator('button:has-text("Generate Deposit Invoice")');
    await expect(genInvoiceBtn).toBeVisible();

    // ── Tab 3: Formal Document & Patient Consent ──
    const printTab = modal.locator('button:has-text("Document & Consent")');
    await expect(printTab).toBeVisible();
    await printTab.click();
    await page.waitForTimeout(500);

    // Verify Printable Letterhead & Signatures
    await expect(modal.locator('text=Multi-Stage Treatment Plan & Quote')).toBeVisible();
    await expect(modal.locator('text=Informed Consent & Treatment Agreement')).toBeVisible();
    await expect(modal.locator('text=Patient / Legal Guardian')).toBeVisible();
    await expect(modal.locator('text=Attending Clinician')).toBeVisible();

    // Capture screenshot artifact of the live Treatment Plan & Cost Estimator modal
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_treatment_plan_estimator.png',
      fullPage: false
    });

    // Close modal cleanly
    const closeBtn = modal.locator('button[aria-label="Close treatment plan modal"]').first();
    await closeBtn.click();
    await page.waitForTimeout(400);
    await expect(modal).not.toBeVisible();
  });
});
