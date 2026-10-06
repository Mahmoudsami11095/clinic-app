const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const outDir = path.resolve(__dirname, '../playwright-screenshots');
  const artifactDir = 'C:\\Users\\msamy5\\.gemini\\antigravity-ide\\brain\\4db351f1-d748-49ac-83d1-4bb6ac7e7ef4';

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('1. Navigating to portal login...');
  await page.goto('https://clinic-app-ten-topaz.vercel.app/portal/login', { waitUntil: 'networkidle' });

  // Fast fill demo
  await page.click('button:has-text("Fast Fill Demo Patient")');
  await page.click('button:has-text("Send Verification Code")');
  await page.waitForSelector('input[name="otpCode"]', { timeout: 10000 });

  const otpVal = await page.inputValue('input[name="otpCode"]');
  if (!otpVal) {
    await page.fill('input[name="otpCode"]', '123456');
  }

  console.log('2. Signing in to portal dashboard...');
  await page.click('button:has-text("Verify & Sign In")');
  await page.waitForURL('**/portal/dashboard', { timeout: 15000 });
  await page.waitForSelector('text=Live Queue Tracker', { timeout: 10000 });

  // 01. Dashboard
  await page.screenshot({ path: path.join(outDir, '01-portal-dashboard.png'), fullPage: true });
  console.log('Saved 01-portal-dashboard.png');

  // Select slot
  const slotBtn = page.locator('button:has-text(":")').first();
  if (await slotBtn.isVisible()) {
    await slotBtn.click();
    await page.fill('input[name="bookReason"]', 'Routine checkup & cleaning');
  }
  await page.screenshot({ path: path.join(outDir, '02-portal-booking-flow.png') });
  console.log('Saved 02-portal-booking-flow.png');

  // Open Prescription Print Modal via component method or button
  console.log('3. Opening Prescription Print Modal...');
  await page.evaluate(() => {
    const el = document.querySelector('app-portal-dashboard');
    if (el && window.ng) {
      const comp = window.ng.getComponent(el);
      if (comp) comp.openPrescriptionPrint('rx-101');
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '03-prescription-print-modal.png') });
  console.log('Saved 03-prescription-print-modal.png');

  // Close modal and open receipt modal
  console.log('4. Opening Receipt Modal...');
  await page.evaluate(() => {
    const el = document.querySelector('app-portal-dashboard');
    if (el && window.ng) {
      const comp = window.ng.getComponent(el);
      if (comp) {
        comp.closeModal();
        comp.openReceipt('inv-202');
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04-payment-receipt-modal.png') });
  console.log('Saved 04-payment-receipt-modal.png');

  // Public Verification pages
  console.log('5. Navigating to Public Prescription Verification...');
  await page.goto('https://clinic-app-ten-topaz.vercel.app/verify/rx/rx-101', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, '05-public-rx-verification.png'), fullPage: true });
  console.log('Saved 05-public-rx-verification.png');

  console.log('6. Navigating to Public Receipt Verification...');
  await page.goto('https://clinic-app-ten-topaz.vercel.app/verify/inv/inv-202', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, '06-public-receipt-verification.png'), fullPage: true });
  console.log('Saved 06-public-receipt-verification.png');

  await browser.close();

  // Copy all to artifactDir
  const files = fs.readdirSync(outDir);
  for (const f of files) {
    if (f.endsWith('.png')) {
      fs.copyFileSync(path.join(outDir, f), path.join(artifactDir, f));
      console.log(`Copied ${f} to artifacts directory`);
    }
  }
}

run().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
