import { Page, expect } from '@playwright/test';

export const TEST_ADMIN_CREDENTIALS = {
  email: 'msami11095@gmail.com',
  password: 'Sami@11095',
  name: 'Mahmoud Sami'
};

/**
 * Robust helper to authenticate the user and wait for dashboard to load
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill credentials
  const emailInput = page.locator('input[type="email"], input[name="email"], input[formcontrolname="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  await emailInput.fill(TEST_ADMIN_CREDENTIALS.email);
  await passwordInput.fill(TEST_ADMIN_CREDENTIALS.password);
  await submitBtn.click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/i, { timeout: 20000 });
  await page.waitForLoadState('networkidle').catch(() => {});
}
