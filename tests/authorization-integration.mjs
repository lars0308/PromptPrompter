/**
 * PRIORITY 1: Integrationstests für Server-seitige Admin-Autorisierung
 *
 * Diese Tests prüfen dass Admin-APIs korrekt autorisiert sind
 * und nicht vom Client-gelieferten Rollen vertraut.
 *
 * Verwendung:
 *   node tests/authorization-integration.mjs [API_URL]
 *
 * Beispiel:
 *   node tests/authorization-integration.mjs http://localhost:3000
 *   node tests/authorization-integration.mjs https://prompt-ai.app
 */

const API_URL = process.argv[2] || 'http://localhost:3000';

// Mock-Auth Tokens (in echter App würden diese echte JWT sein)
const MOCK_TOKENS = {
  guest: null,  // Kein Token
  free: 'token-free-user-123',
  pro: 'token-pro-user-456',
  ultimate: 'token-ultimate-user-789',
  admin: 'token-admin-user-000'
};

const ROLE_LABELS = {
  guest: 'Gast (nicht authentifiziert)',
  free: 'Free-Tier Benutzer',
  pro: 'Pro-Tier Benutzer',
  ultimate: 'Ultimate-Tier Benutzer',
  admin: 'Admin-Benutzer'
};

// ============================================================================
// TEST UTILS
// ============================================================================

function log(title, message = '') {
  console.log(`\n${title}`);
  if(message) console.log(`  ${message}`);
}

function logResult(testName, passed, status, expected) {
  const icon = passed ? '✓' : '✗';
  const mark = passed ? '✅' : '❌';
  console.log(`  ${icon} ${testName}`);
  if(!passed) {
    console.log(`    Erhalten: ${status}, Erwartet: ${expected}`);
  }
}

async function fetchWithRole(endpoint, options = {}) {
  const { role, method = 'GET', body, expectStatus = 200 } = options;

  try {
    const headers = { 'Content-Type': 'application/json' };

    // In echter App: Bearer Token
    if(MOCK_TOKENS[role]) {
      headers['Authorization'] = `Bearer ${MOCK_TOKENS[role]}`;
    }

    const fetchOptions = {
      method,
      headers
    };

    if(body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
    const data = await response.json().catch(() => null);

    return {
      status: response.status,
      ok: response.ok,
      data,
      passed: response.status === expectStatus
    };
  } catch(error) {
    console.error(`  ERROR fetching ${endpoint}:`, error.message);
    return {
      status: 0,
      ok: false,
      data: null,
      error: error.message,
      passed: false
    };
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('PRIORITY 1: Admin-Autorisierungs-Integrationstests');
  console.log('='.repeat(70));
  console.log(`API URL: ${API_URL}`);

  let totalTests = 0;
  let passedTests = 0;

  // ========================================================================
  // TEST 1: /api/admin-overview Endpunkt
  // ========================================================================

  log('\n1️⃣ TEST: /api/admin-overview (Admin-Übersicht)');
  log('Erwartet: Nur Admin kann zugreifen');

  for(const [role] of Object.entries(ROLE_LABELS)) {
    if(role === 'admin') {
      // Admin sollte 200 erhalten
      const result = await fetchWithRole('/api/admin-overview', {
        role,
        expectStatus: 200
      });
      totalTests++;
      if(result.passed) passedTests++;
      logResult(`Admin erhält 200 OK`, result.passed, result.status, 200);
    } else {
      // Nicht-Admin sollte 403 oder 401 erhalten
      const result = await fetchWithRole('/api/admin-overview', {
        role,
        expectStatus: [401, 403]
      });
      totalTests++;
      if(result.status === 401 || result.status === 403) passedTests++;
      logResult(
        `${ROLE_LABELS[role]} erhält 403 Forbidden`,
        result.status === 401 || result.status === 403,
        result.status,
        '401 oder 403'
      );
    }
  }

  // ========================================================================
  // TEST 2: /api/config?admin=true Endpunkt
  // ========================================================================

  log('\n2️⃣ TEST: /api/config?admin=true (Admin-Konfiguration)');
  log('Erwartet: Nur Admin kann zugreifen');

  for(const [role] of Object.entries(ROLE_LABELS)) {
    if(role === 'admin') {
      const result = await fetchWithRole('/api/config?admin=true', {
        role,
        expectStatus: 200
      });
      totalTests++;
      if(result.passed) passedTests++;
      logResult(`Admin erhält 200 OK`, result.passed, result.status, 200);
    } else {
      const result = await fetchWithRole('/api/config?admin=true', {
        role
      });
      totalTests++;
      if(result.status === 401 || result.status === 403) passedTests++;
      logResult(
        `${ROLE_LABELS[role]} erhält 403 Forbidden`,
        result.status === 401 || result.status === 403,
        result.status,
        '401 oder 403'
      );
    }
  }

  // ========================================================================
  // TEST 3: /api/config (Öffentlich)
  // ========================================================================

  log('\n3️⃣ TEST: /api/config (Öffentliche Konfiguration)');
  log('Erwartet: Alle können zugreifen (aber unterschiedliche Daten)');

  for(const [role] of Object.entries(ROLE_LABELS)) {
    const result = await fetchWithRole('/api/config', {
      role,
      expectStatus: 200
    });
    totalTests++;
    if(result.passed) passedTests++;
    logResult(
      `${ROLE_LABELS[role]} erhält 200 OK`,
      result.passed,
      result.status,
      200
    );

    // Prüfe dass Admin-Daten nicht in public config sind
    if(role !== 'admin' && result.data) {
      const hasSystemAiProfiles = 'systemAiProfiles' in result.data;
      totalTests++;
      if(!hasSystemAiProfiles) passedTests++;
      logResult(
        `  → Keine systemAiProfiles in nicht-Admin config`,
        !hasSystemAiProfiles,
        hasSystemAiProfiles ? 'enthalten' : 'nicht enthalten',
        'nicht enthalten'
      );
    }
  }

  // ========================================================================
  // TEST 4: /api/admin-action - AI-Save (POST)
  // ========================================================================

  log('\n4️⃣ TEST: /api/admin-action mit action=ai-save');
  log('Erwartet: Nur Admin kann ai-save ausführen');

  const aiSaveBody = {
    action: 'ai-save',
    provider: 'openai',
    secret: 'test-secret',
    defaultModel: 'gpt-4',
    enabled: true,
    routeRole: 'primary'
  };

  for(const [role] of Object.entries(ROLE_LABELS)) {
    if(role === 'admin') {
      const result = await fetchWithRole('/api/admin-action', {
        role,
        method: 'POST',
        body: aiSaveBody,
        expectStatus: 200
      });
      totalTests++;
      // 200 oder 503 (wenn kein echter Secret gespeichert werden kann) ist OK
      if(result.status === 200 || result.status === 503) passedTests++;
      logResult(
        `Admin kann ai-save ausführen (${result.status})`,
        result.status === 200 || result.status === 503,
        result.status,
        '200 oder 503'
      );
    } else {
      const result = await fetchWithRole('/api/admin-action', {
        role,
        method: 'POST',
        body: aiSaveBody
      });
      totalTests++;
      if(result.status === 401 || result.status === 403) passedTests++;
      logResult(
        `${ROLE_LABELS[role]} erhält 403 bei ai-save`,
        result.status === 401 || result.status === 403,
        result.status,
        '401 oder 403'
      );
    }
  }

  // ========================================================================
  // TEST 5: /api/admin-action - suspend (POST)
  // ========================================================================

  log('\n5️⃣ TEST: /api/admin-action mit action=suspend');
  log('Erwartet: Nur Admin kann suspend ausführen');

  const suspendBody = {
    action: 'suspend',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    days: 7,
    reason: 'Test suspension'
  };

  for(const [role] of Object.entries(ROLE_LABELS)) {
    if(role === 'admin') {
      const result = await fetchWithRole('/api/admin-action', {
        role,
        method: 'POST',
        body: suspendBody
      });
      totalTests++;
      if(result.status === 200 || result.status === 400 || result.status === 404) passedTests++;
      logResult(
        `Admin kann suspend ausführen (${result.status})`,
        result.status === 200 || result.status === 400 || result.status === 404,
        result.status,
        '2xx oder 4xx'
      );
    } else {
      const result = await fetchWithRole('/api/admin-action', {
        role,
        method: 'POST',
        body: suspendBody
      });
      totalTests++;
      if(result.status === 401 || result.status === 403) passedTests++;
      logResult(
        `${ROLE_LABELS[role]} erhält 403 bei suspend`,
        result.status === 401 || result.status === 403,
        result.status,
        '401 oder 403'
      );
    }
  }

  // ========================================================================
  // TEST 6: Sicherheit - Client-gelieferte Role wird ignoriert
  // ========================================================================

  log('\n6️⃣ TEST: Client-gelieferte isAdmin/role wird ignoriert');
  log('Erwartet: Free-User kann sich nicht als Admin ausgeben');

  const maliciousBody = {
    action: 'set-plan',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    plan: 'ultimate',
    isAdmin: true,  // ← Böser Versuch
    role: 'admin'   // ← Böser Versuch
  };

  const result = await fetchWithRole('/api/admin-action', {
    role: 'free',
    method: 'POST',
    body: maliciousBody
  });
  totalTests++;
  if(result.status === 401 || result.status === 403) passedTests++;
  logResult(
    'Free-User mit gefälschtem isAdmin wird abgelehnt',
    result.status === 401 || result.status === 403,
    result.status,
    '401 oder 403'
  );

  // ========================================================================
  // ZUSAMMENFASSUNG
  // ========================================================================

  console.log('\n' + '='.repeat(70));
  console.log('ERGEBNIS');
  console.log('='.repeat(70));
  console.log(`Bestandene Tests: ${passedTests}/${totalTests}`);
  console.log(`Erfolgsquote: ${Math.round(passedTests/totalTests*100)}%`);

  if(passedTests === totalTests) {
    console.log('\n✅ ALLE TESTS BESTANDEN - Admin-Autorisierung ist sicher!');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} Tests fehlgeschlagen`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
}

// ============================================================================
// RUN
// ============================================================================

console.log('🧪 Starte Integrationstests...');
console.log(`Verbindung zu: ${API_URL}`);

runTests().catch(error => {
  console.error('\n❌ FEHLER:', error.message);
  process.exit(1);
});
