/**
 * Global Error Boundary
 *
 * Catches unhandled errors and shows graceful error messages to users
 * instead of crashing the entire application.
 *
 * Usage: Initialize at app startup with: new ErrorBoundary()
 */

class ErrorBoundary {
  constructor(options = {}) {
    this.errorCount = 0;
    this.maxErrors = options.maxErrors || 10;
    this.showUI = options.showUI !== false;
    this.sendToMonitoring = options.sendToMonitoring !== false;
    this.monitoringEndpoint = options.monitoringEndpoint || '/api/errors';

    this.setupGlobalHandlers();
    this.setupErrorDisplay();
  }

  setupGlobalHandlers() {
    // Catch synchronous errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        source: 'error-event',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { source: 'unhandledrejection' }
      );
      event.preventDefault();
    });
  }

  setupErrorDisplay() {
    // Create error toast container
    const container = document.createElement('div');
    container.id = 'error-boundary-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    document.body.appendChild(container);
    this.container = container;
  }

  handleError(error, context = {}) {
    this.errorCount++;

    // Prevent error spam - limit error display
    if (this.errorCount > this.maxErrors) {
      console.error('[ErrorBoundary] Too many errors, suppressing UI updates');
      return;
    }

    // Log for debugging
    console.error('[ErrorBoundary]', error, context);

    // Show user-friendly message
    if (this.showUI) {
      this.showErrorToast(this.getUserFriendlyMessage(error));
    }

    // Send to monitoring service
    if (this.sendToMonitoring) {
      this.reportToMonitoring(error, context);
    }

    // Don't crash the app - return to normal operation
    return false;
  }

  showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
      background-color: #fee;
      border-left: 4px solid #c33;
      color: #333;
      padding: 14px 16px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
    `;

    toast.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1; padding-right: 10px;">
          <strong>Oops!</strong> Something went wrong.<br>
          <small style="color: #666; margin-top: 4px; display: block;">${message}</small>
        </div>
        <button aria-label="Close error" style="
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
    `;

    // Close button handler
    toast.querySelector('button').addEventListener('click', () => {
      toast.remove();
    });

    // Auto-remove after 8 seconds
    const timeout = setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 8000);

    // Cancel timeout on manual close
    const originalRemove = toast.remove.bind(toast);
    toast.remove = function() {
      clearTimeout(timeout);
      originalRemove();
    };

    this.container.appendChild(toast);
  }

  getUserFriendlyMessage(error) {
    // Don't expose technical details to users
    if (error.message.includes('404')) {
      return 'Resource not found. Please try again.';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('Unauthorized')) {
      return 'You need to log in to perform this action.';
    }
    if (error.message.includes('timeout')) {
      return 'Request took too long. Please try again.';
    }

    // Generic message for other errors
    return 'Please try again. If the problem persists, contact support.';
  }

  reportToMonitoring(error, context) {
    try {
      // Prepare error report
      const report = {
        message: error.message,
        stack: error.stack,
        context,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Send to monitoring endpoint
      navigator.sendBeacon(
        this.monitoringEndpoint,
        JSON.stringify(report)
      );
    } catch (e) {
      // Silently fail - don't create error loop
    }
  }

  /**
   * Manually report an error
   */
  captureException(error, context = {}) {
    this.handleError(error instanceof Error ? error : new Error(String(error)), context);
  }

  /**
   * Manually report a message
   */
  captureMessage(message, context = {}) {
    this.handleError(new Error(message), { ...context, type: 'message' });
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      errorCount: this.errorCount,
      maxErrors: this.maxErrors,
      isOverflow: this.errorCount > this.maxErrors,
    };
  }

  /**
   * Reset error counter (useful for testing)
   */
  resetCounter() {
    this.errorCount = 0;
  }
}

// Add animation styles to document
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addErrorBoundaryStyles();
  });
} else {
  addErrorBoundaryStyles();
}

function addErrorBoundaryStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    .error-toast {
      animation: slideIn 0.3s ease-out;
    }

    @media (max-width: 640px) {
      #error-boundary-container {
        left: 10px !important;
        right: 10px !important;
        max-width: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other modules
export { ErrorBoundary };
