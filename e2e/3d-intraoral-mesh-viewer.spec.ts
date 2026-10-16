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
    // Catch-all route to intercept any unmocked Azure backend requests and prevent 401 logout redirects
    await page.route(/azurewebsites\.net/i, async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS, PUT, DELETE',
          'access-control-allow-headers': '*',
          'content-type': 'application/json'
        },
        contentType: 'application/json',
        body: '{}'
      });
    });

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

    // Intercept margin line & finish line persistence calls (v9.4.0)
    await page.route(/\/labworkorders\/.*\/margin-line/i, async (route) => {
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
          profileType: 'Chamfer',
          perimeterMm: 45.2,
          averageWidthMm: 0.65,
          smoothingTension: 0.5,
          isClosed: true,
          isApproved: true,
          hasMarginWarning: false,
          statusMessage: 'Gingival finish line validated (Chamfer, 45.2 mm perimeter). Ready for CAM toolpathing.',
          points: [
            { x: 7.2, y: -0.2, z: 0.0, index: 0 },
            { x: 5.1, y: 0.1, z: 4.6, index: 1 },
            { x: 0.0, y: -0.2, z: 6.5, index: 2 },
            { x: -5.1, y: 0.1, z: 4.6, index: 3 },
            { x: -7.2, y: -0.2, z: 0.0, index: 4 },
            { x: -5.1, y: 0.1, z: -4.6, index: 5 },
            { x: 0.0, y: -0.2, z: -6.5, index: 6 },
            { x: 5.1, y: 0.1, z: -4.6, index: 7 }
          ],
          evaluatedAtUtc: new Date().toISOString()
        })
      });
    });

    // Intercept CAM toolpath & G-code generator endpoints (v10.0.0)
    await page.route(/\/cam/i, async (route) => {
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
          toolpathId: 'TP-ORD-A1B2C3',
          blankMaterial: 'Zirconia',
          blankThicknessMm: 14.0,
          shrinkageFactor: 1.2450,
          spindleRpm: 24000,
          feedRateMmMin: 1200,
          estimatedMillingMinutes: 14.5,
          totalGCodeLines: 1420,
          totalToolpathLengthMm: 342.8,
          burChangeCount: 3,
          marginProtectionEnforced: true,
          statusMessage: 'Dental CAM 5-axis toolpath generated (Zirconia). ISO 6983 compliant.',
          gcodeContent: `; --- SMART CLINIC DENTAL CAM 5-AXIS POST-PROCESSOR ---
G90 G21 G17 G40 G49 G80 G94
G54
M06 T01
S24000 M03
M10
G04 P2.0
G00 X0.000 Y0.000 Z15.000 A0.000 B0.000
G01 Z8.500 F1200
M05
M11
G91 G28 Z0.
M30`,
          layers: [
            { layerIndex: 1, passType: 'Roughing', zHeightMm: 8.5, pointCount: 32, estimatedSeconds: 240 },
            { layerIndex: 2, passType: 'SemiFinishing', zHeightMm: 4.2, pointCount: 48, estimatedSeconds: 320 },
            { layerIndex: 3, passType: 'MarginDetail', zHeightMm: 0.0, pointCount: 64, estimatedSeconds: 310 }
          ],
          generatedAtUtc: new Date().toISOString()
        })
      });
    });

    // Intercept 3D Implant Surgical Guide & Stent endpoints (v10.1.0)
    await page.route(/\/surgical-guide/i, async (route) => {
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
          implantSystem: 'NobelActive',
          sleeveDiameterMm: 5.0,
          sleeveInnerDiameterMm: 4.2,
          sleeveHeightMm: 5.0,
          drillOffsetMm: 9.0,
          buccoLingualAngleDeg: 2.5,
          mesioDistalAngleDeg: 1.0,
          stentWallThicknessMm: 2.5,
          safetyClearanceMm: 3.4,
          hasInspectionWindow: true,
          hasSafetyWarning: false,
          statusMessage: 'Implant surgical guide plan active (NobelActive). Anatomical clearance: 3.4 mm.',
          plannedAtUtc: new Date().toISOString()
        })
      });
    });

    // Mock background app polling routes
    await page.route(/\/notifications/i, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route(/\/subscription/i, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"isSubscribed":true,"tier":"Enterprise"}' });
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

  test('6. Milestone 2 (v9.4.0): AI Gingival Finish Line & Margin Auto-Tracing', async ({ page }) => {
    const modal = await open3DViewerInDropzone(page);

    // Toggle Margin Tracing Mode
    const marginBtn = modal.locator('#toggle-margin-btn');
    await expect(marginBtn).toBeVisible({ timeout: 5000 });
    await marginBtn.click();
    await page.waitForTimeout(400);

    // Verify Margin Control Panel HUD is displayed
    const panel = modal.locator('#margin-control-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Verify Telemetry elements (perimeter, width, node count)
    const perimeterVal = modal.locator('#margin-perimeter-val');
    await expect(perimeterVal).toBeVisible();

    const widthVal = modal.locator('#margin-width-val');
    await expect(widthVal).toBeVisible();

    const nodesVal = modal.locator('#margin-nodes-val');
    await expect(nodesVal).toBeVisible();

    // Toggle Profile: Shoulder vs Chamfer
    const shoulderBtn = modal.locator('#margin-profile-shoulder-btn');
    await expect(shoulderBtn).toBeVisible();
    await shoulderBtn.click();
    await page.waitForTimeout(300);

    const chamferBtn = modal.locator('#margin-profile-chamfer-btn');
    await expect(chamferBtn).toBeVisible();
    await chamferBtn.click();
    await page.waitForTimeout(300);

    // Click Auto-Trace
    const autoTraceBtn = modal.locator('#auto-trace-margin-btn');
    await expect(autoTraceBtn).toBeVisible();
    await autoTraceBtn.click();
    await page.waitForTimeout(400);

    // Toggle Approve Margin
    const approveBtn = modal.locator('#approve-margin-btn');
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(screenshotsDir, '06-3d-gingival-finish-line.png'), fullPage: true });

    // Save Margin Evaluation
    const saveMarginBtn = modal.locator('#save-margin-btn');
    if (await saveMarginBtn.isVisible()) {
      await saveMarginBtn.click();
      await page.waitForTimeout(500);
    }

    // Close modal
    const closeBtn = page.locator('#close-mesh-viewer-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  });

  test('7. Milestone 3 (v10.0.0): Dental CAM Toolpath Engine & Direct 5-Axis G-Code Generator', async ({ page }) => {
    const modal = await open3DViewerInDropzone(page);

    // Toggle CAM Milling Mode
    const camBtn = modal.locator('#toggle-cam-btn');
    await expect(camBtn).toBeVisible({ timeout: 5000 });
    await camBtn.click();
    await page.waitForTimeout(400);

    // Verify CAM Control Panel HUD is displayed
    const panel = modal.locator('#cam-control-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Verify Safety Buffer pill is visible
    const safetyPill = modal.locator('#cam-safety-pill');
    await expect(safetyPill).toBeVisible();

    // Verify Telemetry elements (time, lines, stages)
    const timeVal = modal.locator('#cam-time-val');
    await expect(timeVal).toBeVisible();

    const linesVal = modal.locator('#cam-lines-val');
    await expect(linesVal).toBeVisible();

    const stagesVal = modal.locator('#cam-stages-val');
    await expect(stagesVal).toBeVisible();

    // Switch Milling Blank Material: PMMA
    const pmmaBtn = modal.locator('#cam-material-pmma-btn');
    await expect(pmmaBtn).toBeVisible();
    await pmmaBtn.click({ force: true });
    await page.waitForTimeout(300);

    // Switch Milling Blank Material: Titanium
    const titaniumBtn = modal.locator('#cam-material-titanium-btn');
    await expect(titaniumBtn).toBeVisible();
    await titaniumBtn.click({ force: true });
    await page.waitForTimeout(300);

    // Switch back to Zirconia
    const zirconiaBtn = modal.locator('#cam-material-zirconia-btn');
    await expect(zirconiaBtn).toBeVisible();
    await zirconiaBtn.click({ force: true });
    await page.waitForTimeout(300);

    // Trigger G-Code Calculation
    const generateGcodeBtn = modal.locator('#generate-gcode-btn');
    await expect(generateGcodeBtn).toBeVisible();
    await generateGcodeBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Verify Download .NC Button is ready
    const downloadGcodeBtn = modal.locator('#download-gcode-btn');
    await expect(downloadGcodeBtn).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '07-3d-dental-cam-toolpath.png'), fullPage: true });

    // Close modal
    const closeBtn = page.locator('#close-mesh-viewer-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  });

  test('8. Milestone 4 (v10.1.0): 3D Implant Surgical Guide & Stent Generator, Angulation & Dossier Export', async ({ page }) => {
    test.setTimeout(45000);
    const modal = await open3DViewerInDropzone(page);

    // Toggle Surgical Guide Mode
    const guideBtn = modal.locator('#toggle-guide-btn');
    await expect(guideBtn).toBeVisible({ timeout: 5000 });
    await guideBtn.click();
    await page.waitForTimeout(400);

    // Verify Guide Control Panel HUD is displayed
    const panel = modal.locator('#guide-control-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Verify Telemetry elements (sleeve outer, drill offset, safety clearance)
    const sleeveVal = modal.locator('#guide-sleeve-val');
    await expect(sleeveVal).toBeVisible();

    const offsetVal = modal.locator('#guide-offset-val');
    await expect(offsetVal).toBeVisible();

    const clearanceVal = modal.locator('#guide-clearance-val');
    await expect(clearanceVal).toBeVisible();

    // Switch Implant System: StraumannBLX
    const straumannBtn = modal.locator('#guide-system-straumann-btn');
    await expect(straumannBtn).toBeVisible();
    await straumannBtn.click({ force: true });
    await page.waitForTimeout(300);

    // Switch Implant System: ZimmerTSV
    const zimmerBtn = modal.locator('#guide-system-zimmer-btn');
    await expect(zimmerBtn).toBeVisible();
    await zimmerBtn.click({ force: true });
    await page.waitForTimeout(300);

    // Switch back to NobelActive
    const nobelBtn = modal.locator('#guide-system-nobel-btn');
    await expect(nobelBtn).toBeVisible();
    await nobelBtn.click({ force: true });
    await page.waitForTimeout(300);

    // Adjust Angulation BL & MD
    const incBlBtn = modal.locator('#guide-control-panel button:has-text("+2°")').first();
    await expect(incBlBtn).toBeVisible();
    await incBlBtn.click({ force: true });
    await page.waitForTimeout(200);

    const incMdBtn = modal.locator('#guide-control-panel button:has-text("+2°")').nth(1);
    await expect(incMdBtn).toBeVisible();
    await incMdBtn.click({ force: true });
    await page.waitForTimeout(200);

    // Toggle Seating & Coolant Window
    const windowBtn = modal.locator('#guide-toggle-window-btn');
    await expect(windowBtn).toBeVisible();
    await windowBtn.click({ force: true });
    await page.waitForTimeout(200);

    // Save Surgical Guide Plan
    const saveGuideBtn = modal.locator('#save-guide-btn');
    await expect(saveGuideBtn).toBeVisible();
    await saveGuideBtn.click({ force: true });
    await page.waitForTimeout(400);

    // Export Surgical Guide Dossier
    const exportDossierBtn = modal.locator('#export-guide-btn');
    await expect(exportDossierBtn).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '08-3d-implant-surgical-guide.png'), fullPage: true });

    // Close modal
    const closeBtn = page.locator('#close-mesh-viewer-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  });
});


