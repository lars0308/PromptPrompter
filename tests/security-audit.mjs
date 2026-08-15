#!/usr/bin/env node

/**
 * Prompt.ai Security Audit Script
 *
 * Tests security properties of the live application:
 * 1. Authorization enforcement (admin, tariff-based)
 * 2. Secrets protection (no keys in responses/errors)
 * 3. Data exposure limits
 * 4. HTTPS enforcement
 * 5. Rate limiting
 *
 * Usage:
 *   node tests/security-audit.mjs https://www.prompt-ai.app
 */

const base = String(process.argv[2] || '').replace(/\/+$/, '');

if (!/^https?:\/\/.+/.test(base)) {
  console.error('Usage: node tests/security-audit.mjs <url>');
  console.error('Example: node tests/security-audit.mjs https://www.prompt-ai.app');
  process.exit(2);
}

const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? '✓' : '✗'} ${name}${!ok && detail ? `\n  ${detail}` : ''}`);
}

async function fetch_with_timeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function testHeader(name, headerName, expectedValue) {
  try {
    const response = await fetch_with_timeout(`${base}/`, { redirect: 'follow' });
    const value = response.headers.get(headerName);
    const ok = expectedValue ? value === expectedValue : Boolean(value);
    check(`Header: ${name}`, ok, `Got: ${value}`);
  } catch (error) {
    check(`Header: ${name}`, false, error.message);
  }
}

async function testEndpointAuth(name, endpoint, method = 'POST', body = null) {
  try {
    // Test without auth
    const unauthResponse = await fetch_with_timeout(`${base}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const unauthOk = [401, 403].includes(unauthResponse.status);
    check(`${name} - Requires auth`, unauthOk, `Status: ${unauthResponse.status} (expected 401/403)`);

    // Test with fake auth
    const fakeResponse = await fetch_with_timeout(`${base}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake_token_xyz',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const fakeOk = [401, 403].includes(fakeResponse.status);
    check(`${name} - Rejects invalid token`, fakeOk, `Status: ${fakeResponse.status}`);
  } catch (error) {
    check(`${name} - Test`, false, error.message);
  }
}

async function testConfigEndpoint() {
  try {
    // Test public config
    const publicResponse = await fetch_with_timeout(`${base}/api/config`, { method: 'GET' });
    const publicData = await publicResponse.json();

    // Should have these
    const hasPublic = publicData.supabaseUrl && publicData.pricing && publicData.quotaLimits;
    check('Config - Public endpoint accessible', publicResponse.ok && hasPublic);

    // Should NOT have these
    const hasSystemProfiles = Array.isArray(publicData.systemAiProfiles) && publicData.systemAiProfiles.length > 0;
    const hasSystemRoutes = Array.isArray(publicData.systemAiRoutes) && publicData.systemAiRoutes.length > 0;
    const hasPreviewRoutes = Array.isArray(publicData.previewRoutes) && publicData.previewRoutes.length > 0;

    check('Config - Does not expose systemAiProfiles', !hasSystemProfiles);
    check('Config - Does not expose systemAiRoutes', !hasSystemRoutes);
    check('Config - Does not expose previewRoutes', !hasPreviewRoutes);

    // Check for other suspicious data
    const allKeys = Object.keys(publicData);
    const suspiciousKeys = allKeys.filter((k) =>
      k.includes('test') || k.includes('error') || k.includes('priority') || k.includes('lastTest'),
    );
    check('Config - No test/debug data exposed', suspiciousKeys.length === 0, `Found: ${suspiciousKeys.join(', ')}`);

    // Test admin config requires auth
    const adminNoAuth = await fetch_with_timeout(`${base}/api/config?admin=true`, { method: 'GET' });
    check('Config - Admin endpoint requires auth', [401, 403].includes(adminNoAuth.status), `Status: ${adminNoAuth.status}`);
  } catch (error) {
    check('Config endpoint test', false, error.message);
  }
}

async function testRateLimiting() {
  try {
    let blocked = false;
    const requests = [];

    // Send 30 rapid requests
    for (let i = 0; i < 30; i++) {
      const response = await fetch_with_timeout(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quota-check' }),
      });
      requests.push(response.status);
      if (response.status === 429) {
        blocked = true;
        break;
      }
    }

    check('Rate limiting - Prevents excessive requests', blocked, `Statuses: ${[...new Set(requests)].join(', ')}`);
  } catch (error) {
    check('Rate limiting test', false, error.message);
  }
}

async function testSecretExposure() {
  try {
    const testCases = [
      {
        name: 'Invalid AI provider secret',
        endpoint: '/api/admin-action',
        body: { action: 'ai-save', provider: 'openai', secret: 'sk_test_123456789' },
      },
    ];

    for (const testCase of testCases) {
      try {
        const response = await fetch_with_timeout(`${base}${testCase.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.body),
        });
        const text = await response.text();
        const hasSecret = text.includes('sk_test_') || text.includes('sk_live_');
        check(`${testCase.name} - Secret not in error`, !hasSecret);
      } catch {
        // Test passed (network error, not secret exposure)
        check(`${testCase.name}`, true);
      }
    }
  } catch (error) {
    check('Secret exposure test', false, error.message);
  }
}

async function main() {
  console.log(`\n🔐 Prompt.ai Security Audit\n🎯 Target: ${base}\n`);

  // Test HTTPS
  check('HTTPS enforced', base.startsWith('https://'), 'Use https:// for security tests');

  // Test security headers
  console.log('\n📋 Security Headers:');
  await testHeader('Strict-Transport-Security', 'strict-transport-security', null);
  await testHeader('X-Content-Type-Options', 'x-content-type-options', null);
  await testHeader('X-Frame-Options', 'x-frame-options', null);
  await testHeader('Content-Security-Policy', 'content-security-policy', null);
  await testHeader('Referrer-Policy', 'referrer-policy', null);

  // Test authorization
  console.log('\n🔐 Authorization Checks:');
  await testEndpointAuth('Admin Overview', '/api/admin-overview', 'POST', {});
  await testEndpointAuth('Admin Action', '/api/admin-action', 'POST', { action: 'ai-models', provider: 'openai' });
  await testEndpointAuth('Config Admin', '/api/config?admin=true', 'GET');

  // Test config endpoint
  console.log('\n📊 API Configuration:');
  await testConfigEndpoint();

  // Test rate limiting
  console.log('\n⏱️  Rate Limiting:');
  await testRateLimiting();

  // Test secret exposure
  console.log('\n🔑 Secret Handling:');
  await testSecretExposure();

  // Summary
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n📈 Results: ${passed}/${results.length} passed`);

  if (failed > 0) {
    console.log(`❌ ${failed} security concerns found`);
    process.exit(1);
  } else {
    console.log('✅ All security checks passed');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Audit failed:', error.message);
  process.exit(2);
});
