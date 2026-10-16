import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Release v9.0.0 - v9.3.0: Interactive 3D Intraoral Mesh Viewer, Caliper, Heatmap & Articulator E2E Suite', () => {
  const screenshotsDir = path.join(__dirname, '../playwright-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  async function open3DViewerInDropzone(page: Page) {
    // Intercept partner order API call to provide consistent requisition metadata
    await page.route(/\/diagnostics\/orders/i, async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': '*',
          'content-type': 'application/json'
        },
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'ord-123456',
            requisitionToken: 'ORD-A1B2C3',
            clinicId: 'c1',
            clinicName: 'Cairo Dental Center',
            doctorId: 'd1',
            doctorName: 'Dr. Mahmoud Sami',
            patientId: 'p1',
            patientName: 'Ahmed Hassan',
            toothNumber: 36,
            serviceType: 'DentalLab',
            indications: 'Crown prep 36 Zirconia',
            status: 'Pending',
            resultFileUrls: [],
            createdAt: new Date().toISOString()
          }
        })
      });
    });

    // Intercept articulator & lab persistence calls
    await page.route(/\/labworkorders\/.*\/articulator/i, async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': '*',
          'content-type': 'application/json'
        },
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: 'ord-123456',
          condylarInclinationDeg: 35.0,
          bennettAngleDeg: 15.0,
          incisalPinOpeningMm: 0.0,
          excursionType: 'Centric',
          maxInterferenceMm: 0.0,
          activeContactCount: 12,
          hasInterferenceWarning: false,
          statusMessage: 'Optimal Centric Occlusion. No dynamic interference.',
          evaluatedAtUtc: new Date().toISOString()
        })
      });
    });


    await page.goto('/partner-dropzone?order=ORD-A1B2C3');
    await page.waitForLoadState('domcontentloaded');

    // Verify requisition loaded and file input is ready
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 15000 });

    // Provide test ASCII STL file
    await fileInput.setInputFiles({
      name: 'crown_prep_36.stl',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(
        'solid crown\n' +
        '  facet normal 0 0 1\n' +
        '    outer loop\n' +
        '      vertex 0 0 0\n' +
        '      vertex 10 0 0\n' +
        '      vertex 5 10 0\n' +
        '    endloop\n' +
        '  endfacet\n' +
        'endsolid crown\n'
      )
    });

    // Staged mesh file should show 3D preview button
    const preview3DBtn = page.locator('button:has-text("3D")').first();
    await expect(preview3DBtn).toBeVisible({ timeout: 10000 });
    await preview3DBtn.click();

    // Verify 3D Intraoral Mesh Viewer modal mounts and dialog is visible
    const modal = page.locator('app-intraoral-mesh-viewer [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Allow Three.js scene to render
    await page.waitForTimeout(600);
    return modal;
  }

  test('1. Partner Dropzone: 3D STL file detection & automatic viewer modal launch', async ({ page }) => {
    const modal = await open3DViewerInDropzone(page);
    await expect(modal).toBeVisible();

    // Canvas must be rendered
    const canvas = modal.locator('canvas');
    await expect(canvas).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '01-3d-dropzone-preview.png'), fullPage: true });
  });

  test('2. 3D Viewer Shaders & Telemetry: inspect vertex/polygon count, switch materials & camera angles', async ({ page }) => {
    const modal = await open3DViewerInDropzone(page);

    // Verify telemetry badge is present in DOM
    const telemetry = modal.getByText(/Model Telemetry|بيانات النموذج|Calibrated/i).first();
    await expect(telemetry).toBeVisible({ timeout: 10000 });

    // Test Material Shader Presets (Zirconia, e.max, Gold, Enamel)
    const emaxBtn = modal.locator('button:has-text("e.max"):visible').first();
    await expect(emaxBtn).toBeVisible();
    await emaxBtn.click();
    await page.waitForTimeout(300);

    const zirconiaBtn = modal.locator('button:has-text("Zirconia"):visible, button:has-text("زركونيا"):visible').first();
    await expect(zirconiaBtn).toBeVisible();
    await zirconiaBtn.click();
    await page.waitForTimeout(300);

    // Test Camera Presets (Occlusal, Buccal, Lingual, Prep Margin)
    const occlusalBtn = modal.locator('button:has-text("Occlusal"), button:has-text("إطباقي")').first();
    if (await occlusalBtn.isVisible()) {
      await occlusalBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '02-3d-mesh-viewer-shaders.png'), fullPage: true });
  });

  test('3. Milestone 1 (v9.1.0): 3D Surface Caliper & Convergence Angle Gauge', async ({ page }) => {
    const modal = await open3DViewerInDropzone(page);

    // Toggle Caliper Mode
    const caliperBtn = modal.locator('#toggle-caliper-btn');
    await expect(caliperBtn).toBeVisible({ timeout: 5000 });
    await caliperBtn.click();
    await page.waitForTimeout(400);

    // Verify Caliper guidance pill is displayed
    const hintPill = modal.locator('#caliper-hint-pill');
    await expect(hintPill).toBeVisible({ timeout: 5000 });

    // Switch between Distance Mode and Angle Mode
    const angleModeBtn = modal.locator('#caliper-mode-angle-btn');
    await expect(angleModeBtn).toBeVisible();
    await angleModeBtn.click();
    await page.waitForTimeout(300);

    const distModeBtn = modal.locator('#caliper-mode-dist-btn');
    await expect(distModeBtn).toBeVisible();
    await distModeBtn.click();
    await page.waitForTimeout(300);

    // Toggle Saved Measurements Drawer
    const drawerToggleBtn = modal.locator('#caliper-drawer-toggle-btn');
    if (await drawerToggleBtn.isVisible()) {
      await drawerToggleBtn.click();
      await page.waitForTimeout(300);
      const drawer = modal.locator('#saved-measurements-drawer');
      await expect(drawer).toBeVisible();

      // Close drawer
      const closeDrawerBtn = modal.locator('#close-drawer-btn');
      if (await closeDrawerBtn.isVisible()) {
        await closeDrawerBtn.click();
        await page.waitForTimeout(200);
      }
    }

    await page.screenshot({ path: path.join(screenshotsDir, '03-3d-caliper-mode.png'), fullPage: true });
  });

  test('4. Milestone 2 (v9.2.0): 3D Color-Coded Undercut & Occlusal Clearance Heatmap', async ({ page }) => {
    const modal = await open3DViewerInDropzone(page);

    // Toggle Heatmap Mode
    const heatmapBtn = modal.locator('#toggle-heatmap-btn');
    await expect(heatmapBtn).toBeVisible({ timeout: 5000 });
    await heatmapBtn.click();
    await page.waitForTimeout(400);

    // Verify Heatmap Control Panel is displayed
    const panel = modal.locator('#heatmap-control-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Switch between Clearance Mode and Undercut Mode
    const undercutBtn = modal.locator('#heatmap-mode-undercut-btn');
    await expect(undercutBtn).toBeVisible();
    await undercutBtn.click();
    await page.waitForTimeout(400);

    // Verify POI Tilt controls are displayed
    const poiControls = modal.getByText(/M\/D:/i).first();
    await expect(poiControls).toBeVisible({ timeout: 5000 });

    // Switch back to Clearance Mode
    const clearanceBtn = modal.locator('#heatmap-mode-clearance-btn');
    await expect(clearanceBtn).toBeVisible();
    await clearanceBtn.click();
    await page.waitForTimeout(400);

    // Test saving evaluation
    const saveHeatmapBtn = modal.locator('#save-heatmap-btn');
    if (await saveHeatmapBtn.isVisible()) {
      await saveHeatmapBtn.click();
      await page.waitForTimeout(400);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '04-3d-clearance-heatmap.png'), fullPage: true });

    // Close modal
    const closeBtn = page.locator('#close-mesh-viewer-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  });

  test('5. Milestone 1 (v9.3.0): 3D Virtual Articulator & Dynamic Occlusal Collision Simulation', async ({ page }) => {
    const modal = await open3DViewerInDropzone(page);

    // Toggle Virtual Articulator Mode
    const articulatorBtn = modal.locator('#toggle-articulator-btn');
    await expect(articulatorBtn).toBeVisible({ timeout: 5000 });
    await articulatorBtn.click();
    await page.waitForTimeout(400);

    // Verify Articulator Control Panel HUD is displayed
    const panel = modal.locator('#articulator-control-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Verify Collision Telemetry Pill is displayed
    const collisionPill = modal.locator('#articulator-collision-pill');
    await expect(collisionPill).toBeVisible({ timeout: 5000 });

    // Test Excursion Mode Buttons (Protrusive, Right Lateral, Left Lateral, Centric)
    const protrusiveBtn = modal.locator('#excursion-protrusive-btn');
    await expect(protrusiveBtn).toBeVisible();
    await protrusiveBtn.click();
    await page.waitForTimeout(400);

    const lateralRBtn = modal.locator('#excursion-lateral-r-btn');
    await expect(lateralRBtn).toBeVisible();
    await lateralRBtn.click();
    await page.waitForTimeout(400);

    const lateralLBtn = modal.locator('#excursion-lateral-l-btn');
    await expect(lateralLBtn).toBeVisible();
    await lateralLBtn.click();
    await page.waitForTimeout(400);

    const centricBtn = modal.locator('#excursion-centric-btn');
    await expect(centricBtn).toBeVisible();
    await centricBtn.click();
    await page.waitForTimeout(400);

    // Test Dynamic Excursion Playback Toggle
    const playBtn = modal.locator('#articulator-play-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await page.waitForTimeout(600);
    await playBtn.click(); // Pause playback
    await page.waitForTimeout(300);

    // Test Stepper controls (HCI, Bennett, Pin)
    const hciPlusBtn = modal.locator('button:has-text("+5°"):visible').first();
    if (await hciPlusBtn.isVisible()) {
      await hciPlusBtn.click();
      await page.waitForTimeout(200);
    }

    // Persist Articulator Simulation
    const saveArticulatorBtn = modal.locator('#save-articulator-btn');
    await expect(saveArticulatorBtn).toBeVisible();
    await saveArticulatorBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(screenshotsDir, '05-3d-virtual-articulator.png'), fullPage: true });

    // Close modal
    const closeBtn = page.locator('#close-mesh-viewer-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  });
});

