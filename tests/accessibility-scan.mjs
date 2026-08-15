/**
 * Accessibility Audit Scanner
 *
 * Comprehensive accessibility scanning based on WCAG 2.1 Level AA compliance.
 * Analyzes keyboard navigation, focus management, ARIA labels, color contrast, and touch targets.
 *
 * Usage:
 *   node tests/accessibility-scan.mjs
 *   node tests/accessibility-scan.mjs --verbose
 *   node tests/accessibility-scan.mjs --level AAA
 */

class AccessibilityAudit {
  constructor(options = {}) {
    this.level = options.level || 'AA';
    this.verbose = options.verbose || false;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: [],
    };
  }

  log(message, severity = 'info') {
    if (!this.verbose && severity === 'debug') return;
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '✗ ERROR  ',
      warning: '⚠ WARN   ',
      pass: '✓ PASS   ',
      debug: '• DEBUG  ',
      info: 'ℹ INFO   ',
    }[severity] || 'ℹ INFO   ';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  addIssue(category, severity, message, element = null) {
    this.results.issues.push({
      category,
      severity,
      message,
      element,
      wcagLevel: this.level,
    });

    if (severity === 'error') {
      this.results.failed++;
    } else if (severity === 'warning') {
      this.results.warnings++;
    }
  }

  // Keyboard Navigation Tests
  async testKeyboardNavigation() {
    this.log('Testing keyboard navigation...', 'debug');
    console.log('\n=== Keyboard Navigation ===');

    const issues = [];

    // Check for tab index issues
    const tabIndexElements = document.querySelectorAll('[tabindex]');
    for (const el of tabIndexElements) {
      const tabindex = parseInt(el.getAttribute('tabindex'), 10);
      if (tabindex > 0) {
        issues.push({
          severity: 'error',
          message: `Positive tabindex (${tabindex}) found. Use positive tabindex only for exceptional cases.`,
          element: el.className,
        });
      }
    }

    // Check for focusable elements without tabindex
    const focusableRoles = ['button', 'link', 'menuitem', 'tab'];
    focusableRoles.forEach((role) => {
      const elements = document.querySelectorAll(`[role="${role}"]`);
      for (const el of elements) {
        if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON' && el.tagName !== 'A') {
          issues.push({
            severity: 'warning',
            message: `Element with role="${role}" should have tabindex="0"`,
            element: el.className,
          });
        }
      }
    });

    issues.forEach((issue) => {
      this.addIssue('keyboard-navigation', issue.severity, issue.message, issue.element);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log('✓ Keyboard navigation looks good', 'pass');
      this.results.passed++;
    }
  }

  // Focus Management Tests
  async testFocusManagement() {
    this.log('Testing focus management...', 'debug');
    console.log('\n=== Focus Management ===');

    const issues = [];

    // Check for :focus-visible styles
    const focusVisible = document.querySelector('*:focus-visible');
    if (!focusVisible) {
      const hasFocusStyle = document.querySelector('style');
      if (hasFocusStyle && hasFocusStyle.textContent.includes('focus-visible')) {
        this.log('✓ :focus-visible styles defined', 'pass');
        this.results.passed++;
      } else {
        issues.push({
          severity: 'error',
          message: ':focus-visible styles not found. Define clear focus indicators.',
        });
      }
    }

    // Check for focus trap in dialogs
    const dialogs = document.querySelectorAll('[role="dialog"]');
    for (const dialog of dialogs) {
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) {
        issues.push({
          severity: 'warning',
          message: `Dialog missing focusable elements for focus trap`,
        });
      }
    }

    // Check for skip links
    const skipLink = document.querySelector('a[href="#main"]');
    if (!skipLink) {
      issues.push({
        severity: 'warning',
        message: 'Skip link to main content not found. Add <a href="#main" class="skip-link">',
      });
    }

    issues.forEach((issue) => {
      this.addIssue('focus-management', issue.severity, issue.message);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log('✓ Focus management looks good', 'pass');
      this.results.passed++;
    }
  }

  // ARIA Labels and Attributes Tests
  async testAriaLabels() {
    this.log('Testing ARIA labels and attributes...', 'debug');
    console.log('\n=== ARIA Labels & Attributes ===');

    const issues = [];

    // Check form inputs have labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    for (const input of inputs) {
      const id = input.getAttribute('id');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');

      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          severity: 'error',
          message: `Input missing label. Add <label for="${id}"> or aria-label attribute`,
          element: input.className,
        });
      }
    }

    // Check icon buttons have labels
    const iconButtons = document.querySelectorAll('button svg, button i[class*="icon"]');
    for (const iconBtn of iconButtons) {
      const button = iconBtn.closest('button');
      if (button) {
        const ariaLabel = button.getAttribute('aria-label');
        const text = button.textContent.trim();
        if (!ariaLabel && !text) {
          issues.push({
            severity: 'error',
            message: 'Icon button missing aria-label',
            element: button.className,
          });
        }
      }
    }

    // Check dialogs have proper ARIA attributes
    const dialogs = document.querySelectorAll('[role="dialog"]');
    for (const dialog of dialogs) {
      if (!dialog.getAttribute('aria-modal')) {
        issues.push({
          severity: 'error',
          message: 'Dialog missing aria-modal="true"',
        });
      }
      if (!dialog.getAttribute('aria-labelledby')) {
        issues.push({
          severity: 'warning',
          message: 'Dialog missing aria-labelledby attribute',
        });
      }
    }

    // Check lists have proper ARIA
    const lists = document.querySelectorAll('ul, ol');
    for (const list of lists) {
      const items = list.querySelectorAll(':scope > li');
      if (items.length === 0) {
        issues.push({
          severity: 'warning',
          message: 'List structure appears incomplete',
          element: list.className,
        });
      }
    }

    issues.forEach((issue) => {
      this.addIssue('aria-labels', issue.severity, issue.message, issue.element);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log('✓ ARIA labels look good', 'pass');
      this.results.passed++;
    }
  }

  // Touch Target Sizing Tests
  async testTouchTargets() {
    this.log('Testing touch target sizing...', 'debug');
    console.log('\n=== Touch Target Sizing (WCAG 2.1 Level AAA) ===');

    const issues = [];
    const minSize = 44;

    const interactiveElements = document.querySelectorAll(
      'button, a, input:not([type="hidden"]), [role="button"], [role="link"], [role="menuitem"], [role="tab"]'
    );

    for (const el of interactiveElements) {
      const rect = el.getBoundingClientRect();
      if (rect.width < minSize || rect.height < minSize) {
        issues.push({
          severity: this.level === 'AAA' ? 'error' : 'warning',
          message: `Touch target too small: ${Math.round(rect.width)}×${Math.round(
            rect.height
          )}px (minimum ${minSize}×${minSize}px)`,
          element: el.className,
        });
      }
    }

    issues.forEach((issue) => {
      this.addIssue('touch-targets', issue.severity, issue.message, issue.element);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log(`✓ All touch targets meet ${minSize}×${minSize}px minimum`, 'pass');
      this.results.passed++;
    }
  }

  // Heading Hierarchy Tests
  async testHeadingHierarchy() {
    this.log('Testing heading hierarchy...', 'debug');
    console.log('\n=== Heading Hierarchy ===');

    const issues = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    if (headings.length === 0) {
      issues.push({
        severity: 'warning',
        message: 'No headings found. Use heading tags to structure content.',
      });
    } else {
      let lastLevel = 0;
      for (const heading of headings) {
        const level = parseInt(heading.tagName[1], 10);
        if (level > lastLevel + 1 && lastLevel > 0) {
          issues.push({
            severity: 'warning',
            message: `Heading hierarchy skipped from h${lastLevel} to h${level}`,
          });
        }
        lastLevel = level;
      }

      const h1Count = document.querySelectorAll('h1').length;
      if (h1Count === 0) {
        issues.push({
          severity: 'error',
          message: 'No h1 heading found. Each page should have exactly one h1.',
        });
      } else if (h1Count > 1) {
        issues.push({
          severity: 'warning',
          message: `Multiple h1 headings found (${h1Count}). Should have exactly one h1.`,
        });
      }
    }

    issues.forEach((issue) => {
      this.addIssue('heading-hierarchy', issue.severity, issue.message);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log('✓ Heading hierarchy looks good', 'pass');
      this.results.passed++;
    }
  }

  // Color Contrast Tests
  async testColorContrast() {
    this.log('Testing color contrast...', 'debug');
    console.log('\n=== Color Contrast (WCAG 2.1 AA) ===');

    const issues = [];

    const textElements = document.querySelectorAll('p, a, button, label, span, div');
    for (const el of textElements) {
      if (el.textContent.trim().length < 3) continue;

      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;

      // Note: This is a simplified check. A full implementation would calculate contrast ratio.
      // For now, warn if text color is too light
      if (color === 'rgb(255, 255, 255)' && bgColor === 'rgba(0, 0, 0, 0)') {
        issues.push({
          severity: 'warning',
          message: 'White text on transparent background may have contrast issues',
          element: el.className,
        });
      }
    }

    issues.forEach((issue) => {
      this.addIssue('color-contrast', issue.severity, issue.message, issue.element);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log('✓ Color contrast appears adequate (simplified check)', 'pass');
      this.results.passed++;
    }
  }

  // Alt Text Tests
  async testAltText() {
    this.log('Testing alt text...', 'debug');
    console.log('\n=== Alt Text for Images ===');

    const issues = [];

    const images = document.querySelectorAll('img');
    for (const img of images) {
      const alt = img.getAttribute('alt');
      if (!alt) {
        issues.push({
          severity: 'error',
          message: `Image missing alt text: ${img.src || '(no src)'}`,
          element: img.className,
        });
      } else if (alt.trim().length === 0) {
        issues.push({
          severity: 'error',
          message: 'Image has empty alt text',
          element: img.className,
        });
      }
    }

    issues.forEach((issue) => {
      this.addIssue('alt-text', issue.severity, issue.message, issue.element);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log(images.length > 0 ? '✓ All images have alt text' : '✓ No images found', 'pass');
      if (images.length > 0) {
        this.results.passed++;
      }
    }
  }

  // Semantic HTML Tests
  async testSemanticHTML() {
    this.log('Testing semantic HTML...', 'debug');
    console.log('\n=== Semantic HTML ===');

    const issues = [];

    // Check for proper button elements
    const divButtons = document.querySelectorAll('div[role="button"]');
    if (divButtons.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${divButtons.length} div with role="button" found. Use <button> element instead.`,
      });
    }

    // Check for proper link elements
    const divLinks = document.querySelectorAll('div[role="link"]');
    if (divLinks.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${divLinks.length} div with role="link" found. Use <a> element instead.`,
      });
    }

    // Check for nav element
    const nav = document.querySelector('nav');
    if (!nav) {
      issues.push({
        severity: 'warning',
        message: 'No <nav> element found. Use <nav> for main navigation.',
      });
    }

    // Check for main element
    const main = document.querySelector('main');
    if (!main) {
      issues.push({
        severity: 'warning',
        message: 'No <main> element found. Use <main> to identify main content.',
      });
    }

    issues.forEach((issue) => {
      this.addIssue('semantic-html', issue.severity, issue.message);
      this.log(issue.message, issue.severity === 'error' ? 'error' : 'warning');
    });

    if (issues.length === 0) {
      this.log('✓ Semantic HTML looks good', 'pass');
      this.results.passed++;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(70));
    console.log('ACCESSIBILITY AUDIT RESULTS');
    console.log('='.repeat(70));
    console.log(`WCAG Level: ${this.level}`);
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed} ✓`);
    console.log(`Failed: ${this.results.failed} ✗`);
    console.log(`Warnings: ${this.results.warnings} ⚠`);
    console.log('='.repeat(70));

    if (this.results.issues.length > 0) {
      console.log('\nIssues by Category:');
      const byCategory = {};
      this.results.issues.forEach((issue) => {
        if (!byCategory[issue.category]) {
          byCategory[issue.category] = [];
        }
        byCategory[issue.category].push(issue);
      });

      Object.entries(byCategory).forEach(([category, issues]) => {
        console.log(`\n${category.toUpperCase()}:`);
        issues.forEach((issue) => {
          const icon = issue.severity === 'error' ? '✗' : '⚠';
          console.log(`  ${icon} ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      });
    } else {
      console.log('\n✓ No accessibility issues found!');
    }

    console.log('\n' + '='.repeat(70));
    return this.results.failed === 0;
  }

  async run() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Accessibility Audit - WCAG 2.1 Compliance Scanner            ║');
    console.log('║  Phase 3: Code Quality & Testing                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    await this.testKeyboardNavigation();
    await this.testFocusManagement();
    await this.testAriaLabels();
    await this.testTouchTargets();
    await this.testHeadingHierarchy();
    await this.testColorContrast();
    await this.testAltText();
    await this.testSemanticHTML();

    return this.printResults();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  level: args.includes('--level') ? args[args.indexOf('--level') + 1] : 'AA',
  verbose: args.includes('--verbose'),
};

// Note: This script is meant to be run in a browser environment via Node+jsdom
// For now, we'll export the class for use in testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityAudit;
}

// If running in browser context
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const audit = new AccessibilityAudit(options);
  audit.run().then((success) => {
    if (typeof process !== 'undefined') {
      process.exit(success ? 0 : 1);
    }
  });
}
