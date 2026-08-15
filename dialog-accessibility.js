/**
 * Dialog Accessibility Manager
 *
 * Adds proper ARIA attributes and focus management to dialogs:
 * - Focus trap (Tab cycles within dialog)
 * - ESC key closes dialog
 * - Focus returns to trigger on close
 * - ARIA modal attributes
 * - Proper heading association
 *
 * Usage: new AccessibleDialog(dialogElement, triggerElement)
 */

class AccessibleDialog {
  constructor(dialogElement, triggerElement = null) {
    this.dialog = dialogElement;
    this.triggerElement = triggerElement;
    this.previouslyFocused = null;
    this.focusableElements = [];

    this.setup();
  }

  setup() {
    // Add ARIA attributes
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');

    // Find and associate with heading
    const heading = this.dialog.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (heading) {
      const titleId = heading.id || `dialog-title-${Math.random().toString(36).substr(2, 9)}`;
      heading.id = titleId;
      this.dialog.setAttribute('aria-labelledby', titleId);
    }

    // Find and associate with description
    const description = this.dialog.querySelector('[data-dialog-description]');
    if (description) {
      const descId = description.id || `dialog-desc-${Math.random().toString(36).substr(2, 9)}`;
      description.id = descId;
      this.dialog.setAttribute('aria-describedby', descId);
    }

    // Setup keyboard handlers
    this.setupKeyboardHandlers();

    // Auto-open if data attribute present
    if (this.dialog.dataset.autoOpen === 'true') {
      this.open();
    }
  }

  open() {
    // Store previously focused element
    this.previouslyFocused = document.activeElement;

    // Show dialog
    this.dialog.style.display = 'block';
    this.dialog.setAttribute('aria-hidden', 'false');

    // Setup focus trap
    this.setupFocusTrap();

    // Move focus to first focusable element
    this.focusFirstElement();

    // Emit event
    this.dialog.dispatchEvent(new CustomEvent('dialog-open'));
  }

  close() {
    // Hide dialog
    this.dialog.style.display = 'none';
    this.dialog.setAttribute('aria-hidden', 'true');

    // Restore focus
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      setTimeout(() => this.previouslyFocused.focus(), 0);
    }

    // Emit event
    this.dialog.dispatchEvent(new CustomEvent('dialog-close'));
  }

  setupKeyboardHandlers() {
    // ESC key closes dialog
    this.dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  setupFocusTrap() {
    // Get all focusable elements
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])',
    ].join(',');

    this.focusableElements = Array.from(this.dialog.querySelectorAll(focusableSelectors)).filter(
      (el) => this.isVisible(el)
    );

    if (this.focusableElements.length === 0) return;

    const firstFocusable = this.focusableElements[0];
    const lastFocusable = this.focusableElements[this.focusableElements.length - 1];

    // Tab key handler
    const tabHandler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab on first element wraps to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab on last element wraps to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    this.dialog.addEventListener('keydown', tabHandler);

    // Store handler for cleanup
    this._tabHandler = tabHandler;
  }

  focusFirstElement() {
    // Find the first button or interactive element to focus
    const firstButton = this.dialog.querySelector('button:not([disabled])');
    if (firstButton) {
      setTimeout(() => firstButton.focus(), 0);
      return;
    }

    // Fall back to first focusable
    if (this.focusableElements.length > 0) {
      setTimeout(() => this.focusableElements[0].focus(), 0);
    }
  }

  isVisible(element) {
    return element.offsetParent !== null && !element.hidden;
  }

  /**
   * Destroy dialog (for cleanup)
   */
  destroy() {
    if (this._tabHandler) {
      this.dialog.removeEventListener('keydown', this._tabHandler);
    }
  }
}

/**
 * Auto-initialize dialogs on page
 */
function initializeDialogs() {
  // Find all dialog elements
  const dialogs = document.querySelectorAll('[role="dialog"], .dialog, .modal');

  dialogs.forEach((dialogEl) => {
    // Skip if already initialized
    if (dialogEl.dataset.a11yInitialized === 'true') return;

    // Create accessible dialog
    const dialog = new AccessibleDialog(dialogEl);
    dialogEl.dataset.a11yInitialized = 'true';

    // Store reference for external use
    dialogEl._accessibleDialog = dialog;

    // Setup open/close triggers
    const openButtons = document.querySelectorAll(`[data-dialog-trigger="${dialogEl.id}"], [aria-controls="${dialogEl.id}"]`);
    openButtons.forEach((btn) => {
      btn.addEventListener('click', () => dialog.open());
    });

    const closeButtons = dialogEl.querySelectorAll('[data-dialog-close], .dialog-close, .close-btn, [aria-label*="close"], [aria-label*="dismiss"]');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => dialog.close());
    });

    // Setup confirm buttons (close after action)
    const confirmButtons = dialogEl.querySelectorAll('[data-dialog-confirm]');
    confirmButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Allow action to complete before closing
        setTimeout(() => dialog.close(), 0);
      });
    });
  });
}

/**
 * Manually create accessible dialog
 */
function createAccessibleDialog(options = {}) {
  const {
    title = 'Dialog',
    content = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm = null,
  } = options;

  // Create dialog structure
  const dialog = document.createElement('div');
  dialog.id = `dialog-${Date.now()}`;
  dialog.className = 'accessible-dialog';
  dialog.innerHTML = `
    <div class="dialog-backdrop"></div>
    <div class="dialog-content">
      <h2 class="dialog-title">${escapeHtml(title)}</h2>
      <div class="dialog-body">${content}</div>
      <div class="dialog-actions">
        <button type="button" data-dialog-close class="outline-btn">${escapeHtml(cancelText)}</button>
        <button type="button" data-dialog-confirm class="solid-btn">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Create accessible dialog instance
  const accessible = new AccessibleDialog(dialog);

  // Setup confirm callback
  const confirmBtn = dialog.querySelector('[data-dialog-confirm]');
  if (confirmBtn && onConfirm) {
    confirmBtn.addEventListener('click', () => {
      onConfirm();
      accessible.close();
    });
  }

  return accessible;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDialogs);
} else {
  initializeDialogs();
}

// Export for manual use
export { AccessibleDialog, initializeDialogs, createAccessibleDialog };
