/**
 * Form Accessibility Enhancements
 *
 * Improves form accessibility by:
 * - Adding aria-describedby for help text
 * - Adding aria-required for required fields
 * - Adding aria-label for icon-only buttons
 * - Improving error message associations
 *
 * Usage: Include after DOM is ready or wrap in DOMContentLoaded
 */

function enhanceFormAccessibility() {
  // Find all form fields
  const fields = document.querySelectorAll('.field, [role="search"]');

  fields.forEach((field) => {
    const input = field.querySelector('input, select, textarea');
    if (!input) return;

    // Add aria-required if field has required indicator
    if (field.textContent.includes('optional') === false) {
      input.setAttribute('aria-required', 'true');
    }

    // Find associated help text or description
    const helpText = field.querySelector('small');
    if (helpText && !helpText.id) {
      const inputId = input.id || `field-${Math.random().toString(36).substr(2, 9)}`;
      input.id = inputId;
      helpText.id = `${inputId}-help`;
      input.setAttribute('aria-describedby', `${inputId}-help`);
    }

    // Add error message support
    const errorSpan = field.querySelector('[role="alert"]');
    if (errorSpan && input.id) {
      errorSpan.id = errorSpan.id || `${input.id}-error`;
      const existing = input.getAttribute('aria-describedby') || '';
      input.setAttribute('aria-describedby', `${existing} ${errorSpan.id}`.trim());
    }
  });

  // Enhance icon-only buttons
  enhanceIconButtons();

  // Add error announcement support
  setupFormValidation();
}

function enhanceIconButtons() {
  // Find icon-only buttons (buttons without text)
  const buttons = document.querySelectorAll('button');

  buttons.forEach((btn) => {
    // Skip if already has aria-label
    if (btn.hasAttribute('aria-label')) return;

    // Check if button has visible text
    const hasText = btn.textContent.trim().length > 0 && !btn.querySelector('i, svg, [aria-hidden]');

    if (!hasText) {
      // This is an icon-only button
      // Try to infer label from context
      const label = inferButtonLabel(btn);
      if (label) {
        btn.setAttribute('aria-label', label);
      }
    }
  });
}

function inferButtonLabel(btn) {
  // Common button patterns
  if (btn.innerHTML.includes('×') || btn.innerHTML.includes('X')) {
    return 'Close';
  }
  if (btn.innerHTML.includes('✓') || btn.innerHTML.includes('✔')) {
    return 'Confirm';
  }
  if (btn.innerHTML.includes('⚙') || btn.innerHTML.includes('gear')) {
    return 'Settings';
  }
  if (btn.innerHTML.includes('≡') || btn.innerHTML.includes('menu')) {
    return 'Menu';
  }
  if (btn.innerHTML.includes('×') || btn.classList.contains('close-btn')) {
    return 'Close';
  }
  if (btn.classList.contains('delete-btn') || btn.classList.contains('remove-btn')) {
    return 'Delete';
  }
  if (btn.classList.contains('edit-btn')) {
    return 'Edit';
  }
  if (btn.classList.contains('add-btn')) {
    return 'Add';
  }

  // Check title attribute
  if (btn.title) {
    return btn.title;
  }

  // Check parent context
  const parent = btn.closest('[role="dialog"], form, section');
  if (parent && parent.querySelector('h2, h3')) {
    const title = parent.querySelector('h2, h3').textContent.trim();
    if (title.length < 50) {
      return `${title} - ${btn.className}`;
    }
  }

  return null;
}

function setupFormValidation() {
  // Add ARIA live region for form errors
  const existingLive = document.querySelector('[role="alert"][aria-live="polite"]');
  if (!existingLive) {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'form-error-announcer';
    liveRegion.setAttribute('role', 'alert');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  // Setup form submit handler
  const forms = document.querySelectorAll('form');
  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      announceFormErrors(form);
    });
  });
}

function announceFormErrors(form) {
  const announcer = document.getElementById('form-error-announcer');
  if (!announcer) return;

  const errors = form.querySelectorAll('[role="alert"], .error, .validation-error');
  if (errors.length === 0) {
    announcer.textContent = '';
    return;
  }

  const errorTexts = Array.from(errors)
    .map((el) => el.textContent.trim())
    .filter((text) => text.length > 0)
    .join('. ');

  if (errorTexts) {
    announcer.textContent = `Form errors: ${errorTexts}`;
  }
}

/**
 * Enhance specific field with error support
 */
function addFieldError(fieldSelector, errorMessage) {
  const field = document.querySelector(fieldSelector);
  if (!field) return;

  const input = field.querySelector('input, select, textarea');
  if (!input) return;

  // Create or update error message
  let errorSpan = field.querySelector('[role="alert"]');
  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.setAttribute('role', 'alert');
    errorSpan.style.color = 'var(--danger, #c00)';
    errorSpan.style.fontSize = '9px';
    errorSpan.style.display = 'block';
    errorSpan.style.marginTop = '4px';
    field.appendChild(errorSpan);
  }

  errorSpan.textContent = errorMessage;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', errorSpan.id || 'error-message');
}

/**
 * Clear field error
 */
function clearFieldError(fieldSelector) {
  const field = document.querySelector(fieldSelector);
  if (!field) return;

  const input = field.querySelector('input, select, textarea');
  if (input) {
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
  }

  const errorSpan = field.querySelector('[role="alert"]');
  if (errorSpan) {
    errorSpan.remove();
  }
}

// Initialize on DOMContentLoaded if not already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhanceFormAccessibility);
} else {
  // Already loaded
  enhanceFormAccessibility();
}

// Export for manual use
export { enhanceFormAccessibility, addFieldError, clearFieldError };
