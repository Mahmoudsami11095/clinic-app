const https = require('https');

function request(url, options = {}, body = null) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (body) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          durationMs: duration
        });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - start;
      reject({ error: err, durationMs: duration });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout after 30s probing ${url}`));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runSyntheticProbes() {
  console.log('========================================================================');
  console.log('   PRODUCTION SYNTHETIC HEALTH & LATENCY MONITOR (AZURE + VERCEL)       ');
  console.log('========================================================================\n');

  const baseUrl = 'https://clinic-api-123-a0ghf9aeb5ccawha.swedencentral-01.azurewebsites.net';
  const frontendUrl = 'https://clinic-app-ten-topaz.vercel.app';
  let failureCount = 0;
  const latencies = [];

  // 1. Frontend Edge CDN Probe
  try {
    const frontRes = await request(frontendUrl);
    console.log(`[FRONTEND] ${frontendUrl} -> ${frontRes.status} (${frontRes.durationMs}ms)`);
    if (frontRes.status !== 200) {
      console.error(`❌ Frontend root returned HTTP ${frontRes.status}`);
      failureCount++;
    }
  } catch (err) {
    console.error(`❌ Frontend probe failed:`, err);
    failureCount++;
  }

  // 2. Health & Liveness Probes
  const healthEndpoints = ['/api/health', '/api/health/liveness', '/api/health/readiness'];
  for (const ep of healthEndpoints) {
    try {
      const res = await request(baseUrl + ep);
      latencies.push(res.durationMs);
      console.log(`[HEALTH] ${ep} -> ${res.status} (${res.durationMs}ms)`);
      if (res.status !== 200) {
        console.error(`❌ Health probe ${ep} failed with status ${res.status}`);
        failureCount++;
      }
    } catch (err) {
      console.error(`❌ Health probe ${ep} failed:`, err);
      failureCount++;
    }
  }

  // 3. Authenticate & Obtain JWT
  let token = null;
  try {
    const loginRes = await request(baseUrl + '/api/auth/login', { method: 'POST' }, {
      email: 'msami11095@gmail.com',
      password: 'Sami@11095'
    });
    latencies.push(loginRes.durationMs);
    console.log(`[AUTH] /api/auth/login -> ${loginRes.status} (${loginRes.durationMs}ms)`);
    if (loginRes.status === 200) {
      const parsed = JSON.parse(loginRes.body);
      token = parsed.token;
      console.log(`[AUTH] Succeeded! User: ${parsed.user?.name || 'Verified'}`);
    } else {
      console.error(`❌ Auth failed with status ${loginRes.status}: ${loginRes.body}`);
      failureCount++;
    }
  } catch (err) {
    console.error(`❌ Auth request failed:`, err);
    failureCount++;
  }

  if (!token) {
    console.error('❌ Cannot proceed with authenticated probes without token.');
    process.exit(1);
  }

  const authHeaders = { Authorization: 'Bearer ' + token };

  // 4. Critical Business Transactions & Schema Integrity Probes
  const businessEndpoints = [
    '/api/clinics',
    '/api/patients',
    '/api/appointments',
    '/api/doctors',
    '/api/billing',
    '/api/materials/low-stock',
    '/api/executive/analytics/summary',
    '/api/executive/analytics/branches',
    '/api/executive/analytics/doctors',
    '/api/executive/analytics/supply-velocity',
    '/api/mobile/devices/my-devices'
  ];

  for (const ep of businessEndpoints) {
    try {
      const res = await request(baseUrl + ep, { headers: authHeaders });
      latencies.push(res.durationMs);
      console.log(`[BUSINESS] ${ep} -> ${res.status} (${res.durationMs}ms)`);
      if (res.status !== 200) {
        console.error(`❌ Business endpoint ${ep} returned HTTP ${res.status}! Body: ${res.body.slice(0, 200)}`);
        failureCount++;
      }
    } catch (err) {
      console.error(`❌ Probe to ${ep} threw error:`, err);
      failureCount++;
    }
  }

  // 5. Latency Statistics
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const maxLatency = Math.max(...latencies);
  console.log('\n------------------------------------------------------------------------');
  console.log(`Probe Results: ${latencies.length} endpoints tested | Avg Latency: ${avgLatency}ms | Max: ${maxLatency}ms`);
  console.log(`Failures Detected: ${failureCount}`);
  console.log('------------------------------------------------------------------------\n');

  if (failureCount > 0) {
    console.error(`💥 SYNTHETIC MONITOR FAILED: ${failureCount} check(s) did not meet production standards.`);
    process.exit(1);
  } else {
    console.log('✅ ALL PRODUCTION SYNTHETIC PROBES PASSED WITH 100% HEALTH!');
    process.exit(0);
  }
}

runSyntheticProbes().catch(err => {
  console.error('Unhandled monitor error:', err);
  process.exit(1);
});
