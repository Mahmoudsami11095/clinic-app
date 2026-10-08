const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('🚀 Starting AI Vision Radiograph Walkthrough with Direct UI Interactions...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('[BROWSER]', msg.type(), msg.text()));

  const outDir = path.resolve(__dirname, '../playwright-screenshots/ai-vision');
  const artifactDir = 'C:\\Users\\msamy5\\.gemini\\antigravity-ide\\brain\\4db351f1-d748-49ac-83d1-4bb6ac7e7ef4';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('1. Navigating to login page...');
  await page.goto('https://clinic-app-ten-topaz.vercel.app/login', { waitUntil: 'networkidle' });

  // Fill in login credentials
  console.log('2. Entering credentials (msami11095@gmail.com)...');
  await page.fill('input[formControlName="email"]', 'msami11095@gmail.com');
  await page.fill('input[formControlName="password"]', 'Sami@11095');

  console.log('3. Submitting login form...');
  await page.click('button[type="submit"]');

  // Wait for login response and redirect
  await page.waitForTimeout(4000);
  console.log('Current URL after login attempt:', page.url());

  // Navigate to /radiology
  console.log('4. Navigating to /radiology...');
  await page.goto('https://clinic-app-ten-topaz.vercel.app/radiology', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Take Screenshot 1: Radiology Dashboard
  const sc1 = path.join(outDir, '01-radiology-dashboard.png');
  await page.screenshot({ path: sc1, fullPage: true });
  console.log('✓ Saved 01-radiology-dashboard.png');

  // Click Launch Advanced X-Ray Viewer button
  console.log('5. Clicking "Launch Advanced X-Ray Viewer" button...');
  await page.click('button:has-text("Launch Advanced X-Ray Viewer")');
  await page.waitForSelector('#ai-vision-toggle-btn', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Take Screenshot 2: Baseline Radiograph Viewer
  const sc2 = path.join(outDir, '02-scan-viewer-baseline.png');
  await page.screenshot({ path: sc2 });
  console.log('✓ Saved 02-scan-viewer-baseline.png');

  // Trigger AI Vision Toggle
  console.log('6. Activating AI Vision Assistant Toggle button (#ai-vision-toggle-btn)...');
  await page.click('#ai-vision-toggle-btn');

  // Allow scanning beam animation and AI detection pipeline to resolve
  console.log('7. Running DentalVision YOLOv11 Multi-Head CV Ensemble...');
  await page.waitForTimeout(2500);

  // Take Screenshot 3: Active AI Vision with Color-Coded Bounding Boxes
  const sc3 = path.join(outDir, '03-ai-vision-pathology-boxes.png');
  await page.screenshot({ path: sc3 });
  console.log('✓ Saved 03-ai-vision-pathology-boxes.png');

  // Click on Finding Card (Tooth #16 - Caries) in the Drawer
  console.log('8. Selecting Caries finding #16 in Findings Drawer...');
  const tooth16Card = page.locator('text=Tooth #16').first();
  if (await tooth16Card.isVisible()) {
    await tooth16Card.click();
  }
  await page.waitForTimeout(1000);

  // Take Screenshot 4: Findings Drawer with Clinical Safety Governance
  const sc4 = path.join(outDir, '04-ai-findings-drawer.png');
  await page.screenshot({ path: sc4 });
  console.log('✓ Saved 04-ai-findings-drawer.png');

  // Click 1-Click Sync to Odontogram
  console.log('9. Clicking 1-Click Sync to Patient Odontogram (#sync-odontogram-btn)...');
  await page.click('#sync-odontogram-btn');
  await page.waitForTimeout(2000);

  // Take Screenshot 5: Odontogram Synced Banner
  const sc5 = path.join(outDir, '05-ai-odontogram-synced.png');
  await page.screenshot({ path: sc5 });
  console.log('✓ Saved 05-ai-odontogram-synced.png');

  // Copy all screenshots to artifact directory
  [
    '01-radiology-dashboard.png',
    '02-scan-viewer-baseline.png',
    '03-ai-vision-pathology-boxes.png',
    '04-ai-findings-drawer.png',
    '05-ai-odontogram-synced.png'
  ].forEach(file => {
    const src = path.join(outDir, file);
    const dest = path.join(artifactDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✓ Copied ${file} -> artifacts`);
    }
  });

  await browser.close();
  console.log('🎉 Done! All 5 authentic screenshots captured successfully!');
}

run().catch(err => {
  console.error('Walkthrough error:', err);
  process.exit(1);
});
