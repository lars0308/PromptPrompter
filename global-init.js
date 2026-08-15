/**
 * Global Initialization
 *
 * Runs before any application code to set up:
 * - Error boundaries
 * - Monitoring hooks
 * - Global utilities
 */

// Initialize Error Boundary early to catch any errors
(function initErrorBoundary() {
  // Simple error boundary (inline version)
  class ErrorBoundary {
    constructor() {
      this.errorCount = 0;
      this.maxErrors = 10;
      this.setupHandlers();
    }

    setupHandlers() {
      window.addEventListener('error', (e) => this.handleError(e.error || new Error(e.message)));
      window.addEventListener('unhandledrejection', (e) => {
        this.handleError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)));
        e.preventDefault();
      });
    }

    handleError(error) {
      this.errorCount++;
      if (this.errorCount > this.maxErrors) return;

      // Show user-friendly error message
      this.showErrorToast('Something went wrong. Please try again.');

      // Log for monitoring
      if (navigator.sendBeacon && window.location.hostname !== 'localhost') {
        try {
          navigator.sendBeacon('/api/errors', JSON.stringify({
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          }));
        } catch (e) {
          // Silent fail
        }
      }
    }

    showErrorToast(message) {
      const container = document.getElementById('error-boundary-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.style.cssText = `
        background-color: #fee;
        border-left: 4px solid #c33;
        color: #333;
        padding: 12px 14px;
        margin-bottom: 8px;
        border-radius: 4px;
        font-size: 13px;
        animation: slideIn 0.3s ease-out;
      `;
      toast.innerHTML = `<strong>Error:</strong> ${message}`;

      container.appendChild(toast);

      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 6000);
    }
  }

  // Initialize
  window.__errorBoundary = new ErrorBoundary();
})();

// Set global monitoring hook
window.__captureError = function(error, context = {}) {
  if (window.__errorBoundary) {
    window.__errorBoundary.handleError(error instanceof Error ? error : new Error(String(error)));
  }
};

// Performance monitoring (optional - can be extended)
window.__perfMarks = {};
window.__markStart = function(label) {
  window.__perfMarks[label] = performance.now();
};

window.__markEnd = function(label) {
  if (window.__perfMarks[label]) {
    const duration = performance.now() - window.__perfMarks[label];
    if (duration > 1000) {
      // Log slow operations
      console.warn(`[Performance] ${label} took ${Math.round(duration)}ms`);
    }
    delete window.__perfMarks[label];
  }
};
