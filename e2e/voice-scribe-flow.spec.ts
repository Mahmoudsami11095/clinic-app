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

    // Click on the first patient record to open details
    const firstPatient = page.locator('tbody tr, .patient-card').first();
    await expect(firstPatient).toBeVisible();
    await firstPatient.click();
    await page.waitForTimeout(600);

    // Look for Notes / Clinical Encounter section or Add Note trigger button
    const addNoteBtn = page.getByRole('button', { name: /Add Note|ملاحظة جديدة|Record Note|Clinical Note/i }).first();
    if (await addNoteBtn.isVisible()) {
      await addNoteBtn.click();
      await page.waitForTimeout(400);
    }

    // Check if the Voice Scribe launcher button is visible
    const scribeLauncher = page.getByRole('button', { name: /Voice Scribe|المساعد الصوتي/i }).first();
    await expect(scribeLauncher).toBeVisible();
    await scribeLauncher.click();
    await page.waitForTimeout(400);

    // Verify Voice Scribe dialog is mounted
    const modal = page.locator('[role="dialog"][aria-label="AI Chair-side Voice Scribe"]');
    await expect(modal).toBeVisible();

    // Verify key UI elements: mic button, language picker, sample loader
    await expect(modal.getByText(/AI Chair-side Voice Scribe|المساعد الصوتي الذكي/i).first()).toBeVisible();
    const demoBtn = modal.getByRole('button', { name: /Load Dental Dictation Sample|نموذج إملاء/i });
    await expect(demoBtn).toBeVisible();

    // Click Load Sample Dictation to simulate chair-side audio stream
    await demoBtn.click();
    await page.waitForTimeout(500);

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
    const applyBtn = modal.getByRole('button', { name: /Apply to Clinical Note|إدراج في الملاحظة/i });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();
    await page.waitForTimeout(400);

    // Verify Voice Scribe modal closed
    await expect(modal).not.toBeVisible();

    // Verify note content textarea is populated with formatted SOAP text
    const noteTextarea = page.locator('textarea').filter({ hasText: /SUBJECTIVE|CHIEF COMPLAINT/i }).first();
    await expect(noteTextarea).toBeVisible();
    const content = await noteTextarea.inputValue();
    expect(content).toContain('[SUBJECTIVE / CHIEF COMPLAINT]');
    expect(content).toContain('[TREATMENT PLAN & RX]');
  });
});
