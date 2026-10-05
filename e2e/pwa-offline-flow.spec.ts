import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('PWA & Offline Resilience - Level 3 (Customer/E2E)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Verify Offline Mode Detection, Amber Banner, and Reconnection Recovery', async ({ page }) => {
    // Verify dashboard is loaded and online
    await expect(page).toHaveURL(/.*dashboard.*/i);

    // Step A: Simulate Network Outage / Offline Transition
    await page.context().setOffline(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(600);

    // Verify Offline Alert Banner mounts with emergency styles
    const offlineBanner = page.locator('[role="alert"]').filter({ hasText: /Offline Mode Active/i }).first();
    await expect(offlineBanner).toBeVisible();

    // Verify Retry Connection button exists
    const retryBtn = offlineBanner.locator('button').filter({ hasText: /Retry Connection/i }).first();
    await expect(retryBtn).toBeVisible();

    // Capture screenshot artifact of the live offline mode
    await page.screenshot({
      path: 'C:/Users/msamy5/.gemini/antigravity-ide/brain/4db351f1-d748-49ac-83d1-4bb6ac7e7ef4/live_pwa_offline_mode.png',
      fullPage: false
    });

    // Step B: Simulate Connectivity Restoration / Online Transition
    await page.context().setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(600);

    // Verify Back Online notification/banner mounts
    const onlineStatus = page.locator('[role="status"], div.toast-success').filter({ hasText: /Back Online/i }).first();
    await expect(onlineStatus).toBeVisible();
  });

  test('2. Verify Web App Manifest Registration for PWA Standalone Installability', async ({ page }) => {
    // Check that link rel="manifest" points to manifest.webmanifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', 'manifest.webmanifest');

    // Fetch manifest file to verify required PWA properties
    const response = await page.request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('MedClinic - Healthcare System');
    expect(manifest.short_name).toBe('MedClinic');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
