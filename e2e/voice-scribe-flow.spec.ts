import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('AI Chair-side Voice Scribe - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Launch Voice Scribe, Simulate Dental Dictation, Verify SOAP & Prescription Extraction, and Capture Artifact', async ({ page }) => {
    // Navigate to patients directory
    await page.goto('/patients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click on the first patient card to navigate to patient detail
    const patientCard = page.locator('div[class*="cursor-pointer"]:has(h3), table tbody tr').first();
    await patientCard.waitFor({ state: 'visible', timeout: 15000 });
    await patientCard.click();
    await page.waitForURL(/\/patients\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Look for Notes / Clinical Encounter section Add Note trigger button
    const addNoteBtn = page.locator('button').filter({ hasText: /Add Note|ملاحظة|Record Note|Clinical Note/i }).first();
    await addNoteBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addNoteBtn.evaluate(b => (b as HTMLElement).click());
    await page.waitForTimeout(500);

    // Check if the Voice Scribe launcher button is visible
    const scribeLauncher = page.locator('button').filter({ hasText: /Voice Scribe|المساعد الصوتي/i }).first();
    await scribeLauncher.waitFor({ state: 'visible', timeout: 15000 });
    await scribeLauncher.click();
    await page.waitForTimeout(500);

    // Verify Voice Scribe dialog is mounted
    const modal = page.locator('[role="dialog"][aria-label="AI Chair-side Voice Scribe"]');
    await expect(modal).toBeVisible();

    // Verify key UI elements: title, sample loader
    await expect(modal.getByText(/AI Chair-side Voice Scribe|المساعد الصوتي الذكي/i).first()).toBeVisible();
    const demoBtn = modal.locator('button').filter({ hasText: /Load Dental Dictation Sample|نموذج إملاء/i }).first();
    await expect(demoBtn).toBeVisible();

    // Click Load Sample Dictation to simulate chair-side audio stream
    await demoBtn.click();
    await page.waitForTimeout(600);

    // Verify SOAP Architecture is computed and displayed
    await expect(modal.getByText(/SOAP Architecture/i)).toBeVisible();
    await expect(modal.getByText(/Subjective/i).first()).toBeVisible();
    await expect(modal.getByText(/Objective/i).first()).toBeVisible();
    await expect(modal.getByText(/Assessment/i).first()).toBeVisible();
    await expect(modal.getByText(/Plan/i).first()).toBeVisible();

    // Verify Prescription Extraction identified Amoxicillin & Ibuprofen
    await expect(modal.getByText(/Prescriptions Detected|أدوية مستخرجة/i)).toBeVisible();
    await expect(modal.getByText(/Amoxicillin/i).first()).toBeVisible();
    await expect(modal.getByText(/Ibuprofen/i).first()).toBeVisible();

    // Capture screenshot artifact for Level 3 Customer Verification
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_voice_scribe.png',
      fullPage: false
    });

    // Click Apply to Clinical Note
    const applyBtn = modal.locator('button').filter({ hasText: /Apply to Clinical Note|إدراج في الملاحظة/i }).first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();
    await page.waitForTimeout(500);

    // Verify Voice Scribe modal closed
    await expect(modal).not.toBeVisible();

    // Verify note content textarea is populated with formatted SOAP text
    const noteTextarea = page.locator('textarea').first();
    await expect(noteTextarea).toBeVisible();
    const content = await noteTextarea.inputValue();
    expect(content).toContain('[SUBJECTIVE / CHIEF COMPLAINT]');
    expect(content).toContain('[TREATMENT PLAN & RX]');
  });
});
