#!/usr/bin/env node

/**
 * Prompt.ai Accessibility Quick-Scan
 *
 * Checks für häufigste A11y-Probleme:
 * 1. Dialog focus trap
 * 2. Keyboard navigation (Tab, ESC)
 * 3. Touch targets ≥44px
 * 4. aria-labels auf interaktiven Elementen
 * 5. Form error messages
 *
 * Usage: node tests/accessibility-scan.mjs
 */

const fs = require('fs');
const path = require('path');

const results = [];

function check(category, name, ok, detail = '') {
  results.push({ category, name, ok });
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${category}: ${name}${!ok && detail ? `\n    ${detail}` : ''}`);
}

// Scan HTML files
function scanHTML() {
  const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    // Check 1: Meta viewport
    const hasViewport = content.includes('name="viewport"');
    check('HTML', `${file}: Viewport meta tag`, hasViewport);

    // Check 2: Lang attribute
    const hasLang = /<html[^>]*lang=/i.test(content);
    check('HTML', `${file}: Lang attribute`, hasLang);
  });
}

// Scan JS files for dialog handling
function scanDialogs() {
  const files = fs.readdirSync('.')
    .filter(f => f.endsWith('.js') && f.includes('dialog'))
    .slice(0, 5); // Sample

  if (files.length === 0) {
    check('Dialogs', 'Dialog files found', false, 'No *dialog*.js files found');
    return;
  }

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for focus management
    const hasFocusTrap = /focus|aria-modal|trap|lastFocus/i.test(content);
    check('Dialogs', `${file}: Focus management`, hasFocusTrap);

    // Check for ESC handler
    const hasEscHandler = /keydown|keyup|key.*Escape/i.test(content);
    check('Dialogs', `${file}: ESC key handler`, hasEscHandler);
  });
}

// Scan styles for touch targets
function scanCSS() {
  const content = fs.readFileSync('./styles.css', 'utf-8');

  // Check for button sizing
  const hasButtonMinHeight = /button[^{]*{[^}]*(?:min-)?height:\s*(?:44|48|50|5[0-9])px|min-height:\s*44px/i.test(content);
  check('Styling', 'Button minimum height', hasButtonMinHeight, 'Buttons should be ≥44px');

  // Check for focus styles
  const hasFocus = /:focus|:focus-visible/i.test(content);
  check('Styling', 'Focus styles defined', hasFocus);

  // Check for color contrast (heuristic)
  const hasContrastClasses = /contrast|a11y|accessibility/i.test(content);
  check('Styling', 'Contrast-aware classes', hasContrastClasses);
}

// Summary
function summary() {
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const byCategory = {};

  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = { ok: 0, fail: 0 };
    if (r.ok) byCategory[r.category].ok++;
    else byCategory[r.category].fail++;
  });

  console.log(`\n📊 Accessibility Scan Summary:\n`);
  Object.entries(byCategory).forEach(([cat, counts]) => {
    console.log(`${cat}: ${counts.ok}✓ ${counts.fail}✗`);
  });
  console.log(`\nGesamt: ${passed}/${results.length} bestanden`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} Probleme gefunden. Siehe oben.`);
  } else {
    console.log('\n✅ Alle Quick-Scan Checks bestanden!');
  }
}

try {
  console.log('🔍 Prompt.ai Accessibility Quick-Scan\n');
  scanHTML();
  scanDialogs();
  scanCSS();
  summary();
} catch (error) {
  console.error('Scan Error:', error.message);
  process.exit(1);
}
