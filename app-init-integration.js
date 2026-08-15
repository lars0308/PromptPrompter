/**
 * App Initialization Integration
 *
 * Integrates Phase 3 and Phase 4 systems into the running app:
 * - Initializes production monitoring (Sentry, metrics, analytics)
 * - Activates service worker for offline support
 * - Initializes code-splitting loader for lazy loading
 * - Sets up error boundary for uncaught errors
 *
 * This runs after app.js loads, so it can hook into existing functions.
 */

import { initializeMonitoring, setUserContext, captureException } from './production-monitoring-setup.js';
import { serviceWorkerManager } from './service-worker-manager.js';
import { CodeSplittingLoader } from './code-splitting-loader.js';

/**
 * Initialize all Phase 3+ systems
 */
async function initializeAppIntegration() {
  console.log('[APP-INIT] Starting app integration...');

  try {
    // 1. Initialize production monitoring
    await initializeMonitoring({
      dsn: process.env.SENTRY_DSN || window.__SENTRY_DSN__,
      environment: process.env.NODE_ENV || 'production',
      release: window.__APP_VERSION__ || 'unknown',
    });
    console.log('[APP-INIT] ✓ Monitoring initialized');

    // 2. Set user context if available
    if (window.SiteBriefCloud?.user || window.appState?.user) {
      const user = window.SiteBriefCloud?.user || window.appState?.user;
      setUserContext({
        id: user.id,
        email: user.email,
        plan: user.plan || 'free',
        tier: user.plan || 'free',
      });
      console.log('[APP-INIT] ✓ User context set');
    }

    // 3. Register service worker for offline support and caching
    await serviceWorkerManager.register();
    serviceWorkerManager.listenToOnlineStatus();
    console.log('[APP-INIT] ✓ Service worker registered');

    // 4. Initialize code-splitting loader for performance
    const codeSplitter = new CodeSplittingLoader();
    window.__codeSplitter = codeSplitter;
    console.log('[APP-INIT] ✓ Code-splitting loader initialized');

    // 5. Hook into global error handler
    window.addEventListener('error', (event) => {
      captureException(event.error || new Error(event.message), {
        type: 'uncaught-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      captureException(event.reason || new Error('Unhandled rejection'), {
        type: 'unhandled-rejection',
      });
    });

    console.log('[APP-INIT] ✓ Global error handlers installed');
    console.log('[APP-INIT] ✓ Integration complete');

  } catch (error) {
    console.error('[APP-INIT] Initialization failed:', error);
    // Don't throw - let the app continue even if monitoring setup fails
  }
}

// Wait for DOM ready and app.js to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAppIntegration);
} else {
  // DOM already loaded
  requestAnimationFrame(initializeAppIntegration);
}

export { initializeAppIntegration };
