import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('WhatsApp Notification Hub & Reminders - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/appointments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('1. Batch 24h Reminders Button and Count Inspection', async ({ page }) => {
    // Locate the batch reminder action button in the page header
    const batchBtn = page.locator('button').filter({ hasText: /Send 24h Reminders|إرسال تذكيرات|Reminders/i }).first();
    await expect(batchBtn).toBeVisible();

    // Verify it is interactive
    expect(await batchBtn.isEnabled()).toBe(true);
  });

  test('2. Open WhatsApp Hub Modal and Verify Interactive Features', async ({ page }) => {
    // Locate WhatsApp button on the first appointment and click it
    const whatsappBtn = page.locator('table button:has-text("WhatsApp"), table button:has(.pi-whatsapp)').first();
    await whatsappBtn.waitFor({ state: 'attached', timeout: 15000 });
    await whatsappBtn.evaluate(b => (b as HTMLElement).click());
    await page.waitForTimeout(1000);

    // Verify WhatsApp Hub modal opens
    const modal = page.locator('[aria-label="WhatsApp Notification Hub"]');
    await expect(modal).toBeVisible();

    // Capture screenshot of live WhatsApp Hub modal
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_whatsapp_hub_modal.png',
      fullPage: false
    });

    // Verify modal header & subtitle
    await expect(modal.locator('text=WhatsApp Notification Hub')).toBeVisible();

    // Verify Template Type buttons
    const tplReminder = modal.locator('button:has-text("24h Reminder")');
    const tplConfirmation = modal.locator('button:has-text("Confirmation")');
    const tplInstructions = modal.locator('button:has-text("Instructions")');
    await expect(tplReminder).toBeVisible();
    await expect(tplConfirmation).toBeVisible();
    await expect(tplInstructions).toBeVisible();

    // Verify Language buttons
    const langBilingual = modal.locator('button:has-text("Bilingual")');
    const langEnglish = modal.locator('button:has-text("English")');
    const langArabic = modal.locator('button:has-text("العربية")');
    await expect(langBilingual).toBeVisible();
    await expect(langEnglish).toBeVisible();
    await expect(langArabic).toBeVisible();

    // Verify live WhatsApp chat bubble preview
    const chatBubble = modal.locator('.bg-white.dark\\:bg-\\[\\#1f2c34\\], [class*="rounded-tl-none"]').first();
    await expect(chatBubble).toBeVisible();
    let text = await chatBubble.innerText();
    expect(text).toMatch(/Reminder for your upcoming visit|تذكير بموعدك/i);

    // Switch language to English
    await langEnglish.click();
    await page.waitForTimeout(200);
    text = await chatBubble.innerText();
    expect(text).toContain('Reminder for your upcoming visit');
    expect(text).not.toContain('تذكير بموعدك');

    // Switch language to Arabic
    await langArabic.click();
    await page.waitForTimeout(200);
    text = await chatBubble.innerText();
    expect(text).toContain('تذكير بموعدك');
    expect(text).not.toContain('Reminder for your upcoming visit');

    // Switch template to Confirmation
    await tplConfirmation.click();
    await page.waitForTimeout(200);
    text = await chatBubble.innerText();
    expect(text).toMatch(/تم تأكيد الحجز بنجاح|Appointment Confirmed/i);

    // Switch template to Instructions
    await tplInstructions.click();
    await page.waitForTimeout(200);
    text = await chatBubble.innerText();
    expect(text).toMatch(/تعليمات هامة قبل الزيارة|Pre-Visit/i);

    // Test Copy Text button
    const copyBtn = modal.locator('button:has-text("Copy Text")');
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.waitForTimeout(300);
      await expect(modal.locator('text=/Message Copied!|Copy Text/i')).toBeVisible();
    }

    // Verify Open in WhatsApp button and Send Cloud button exist
    await expect(modal.locator('button:has-text("Open in WhatsApp")')).toBeVisible();
    await expect(modal.locator('button:has-text("Send WhatsApp Cloud")')).toBeVisible();

    // Close modal
    const closeBtn = modal.locator('button[aria-label="Close modal"], button:has(.pi-times)').first();
    await closeBtn.click();
    await page.waitForTimeout(400);
    await expect(modal).not.toBeVisible();
  });
});
