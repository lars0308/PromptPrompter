/**
 * Production Monitoring Setup
 *
 * Comprehensive monitoring and error tracking for production.
 * Integrates Sentry for error tracking, custom analytics, uptime monitoring.
 *
 * Usage:
 *   import { initializeMonitoring } from './production-monitoring-setup.js';
 *   await initializeMonitoring({ dsn: '...', environment: 'production' });
 */

/**
 * Initialize production monitoring
 */
export async function initializeMonitoring(config = {}) {
  const {
    dsn = process.env.SENTRY_DSN,
    environment = process.env.NODE_ENV || 'development',
    release = process.env.APP_VERSION,
  } = config;

  if (!dsn) {
    console.warn('[MONITOR] Sentry DSN not provided, skipping initialization');
    return null;
  }

  // Initialize Sentry
  await initSentry({ dsn, environment, release });

  // Setup custom error tracking
  setupErrorTracking();

  // Setup performance monitoring
  setupPerformanceMonitoring();

  // Setup user analytics
  setupUserAnalytics();

  // Setup uptime monitoring
  setupUptimeMonitoring();

  console.log('[MONITOR] Production monitoring initialized');
}

/**
 * Initialize Sentry error tracking
 */
async function initSentry(options) {
  if (typeof window === 'undefined') return;

  // Stub implementation - in production, use actual Sentry SDK
  // import * as Sentry from "@sentry/browser";
  // Sentry.init(options);

  window.__Sentry = {
    captureException: (error, context) => {
      console.error('[SENTRY] Exception captured:', error, context);
      // Send to /api/errors
      logErrorToServer(error, context);
    },
    captureMessage: (message, level) => {
      console.log(`[SENTRY] Message (${level}):`, message);
    },
    captureEvent: (event) => {
      console.log('[SENTRY] Event captured:', event);
    },
    setUser: (user) => {
      console.log('[SENTRY] User set:', user);
    },
    setContext: (key, context) => {
      console.log(`[SENTRY] Context set (${key}):`, context);
    },
  };

  console.log('[MONITOR] Sentry initialized');
}

/**
 * Setup error tracking
 */
function setupErrorTracking() {
  if (typeof window === 'undefined') return;

  // Catch uncaught errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);

    logErrorToServer(error, {
      type: 'uncaught-error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    console.error('[MONITOR] Uncaught error:', error);
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason || new Error('Unhandled rejection');

    logErrorToServer(error, {
      type: 'unhandled-rejection',
      promise: event.promise,
    });

    console.error('[MONITOR] Unhandled rejection:', error);
  });
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Log Core Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        logMetricToServer('lcp', lastEntry.renderTime || lastEntry.loadTime, {
          url: lastEntry.url,
          element: lastEntry.element?.tagName,
        });

        console.log('[PERF] LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          logMetricToServer('fid', entry.processingDuration, {
            name: entry.name,
          });

          console.log('[PERF] FID:', entry.processingDuration);
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            logMetricToServer('cls', clsValue, {
              impact: entry.sources.map((s) => s.node?.tagName),
            });

            console.log('[PERF] CLS:', clsValue);
          }
        });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }

  // Log navigation timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const timing = window.performance.timing;
      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };

      logMetricToServer('navigation-timing', metrics);
      console.log('[PERF] Navigation timing:', metrics);
    }, 0);
  });
}

/**
 * Setup user analytics
 */
function setupUserAnalytics() {
  if (typeof window === 'undefined') return;

  // Track page views
  window.addEventListener('load', () => {
    logEventToServer('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
    });
  });

  // Track user interactions
  document.addEventListener('click', (event) => {
    const target = event.target;

    if (
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('a')
    ) {
      logEventToServer('interaction', {
        type: 'click',
        element: target.tagName,
        text: target.textContent?.substring(0, 50),
        url: target.href || target.closest('a')?.href,
      });
    }
  }, true);

  // Track form submissions
  document.addEventListener('submit', (event) => {
    logEventToServer('form_submit', {
      form: event.target.id || event.target.name,
      fields: new FormData(event.target).keys(),
    });
  }, true);

  // Track API calls
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0];
    const options = args[1] || {};

    const start = performance.now();

    return originalFetch
      .apply(this, args)
      .then((response) => {
        const duration = performance.now() - start;

        logEventToServer('api_call', {
          method: options.method || 'GET',
          url: typeof url === 'string' ? url : url.url,
          status: response.status,
          duration: Math.round(duration),
        });

        return response;
      })
      .catch((error) => {
        const duration = performance.now() - start;

        logErrorToServer(error, {
          type: 'fetch-error',
          url: typeof url === 'string' ? url : url.url,
          duration: Math.round(duration),
        });

        throw error;
      });
  };
}

/**
 * Setup uptime monitoring
 */
function setupUptimeMonitoring() {
  if (typeof window === 'undefined') return;

  // Send periodic heartbeat
  setInterval(() => {
    fetch('/api/health', {
      method: 'GET',
      keepalive: true,
    }).catch(() => {
      console.warn('[MONITOR] Health check failed');
    });
  }, 5 * 60 * 1000); // Every 5 minutes

  // Monitor connectivity
  window.addEventListener('online', () => {
    logEventToServer('connectivity', { status: 'online' });
  });

  window.addEventListener('offline', () => {
    logEventToServer('connectivity', { status: 'offline' });
  });
}

/**
 * Log error to server
 */
function logErrorToServer(error, context = {}) {
  const payload = {
    error: {
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
      name: error?.name || 'Error',
    },
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  };

  // Use sendBeacon for reliability
  if (navigator?.sendBeacon) {
    navigator.sendBeacon('/api/errors', JSON.stringify(payload));
  } else {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silent fail - don't create error loop
    });
  }
}

/**
 * Log metric to server
 */
function logMetricToServer(name, value, metadata = {}) {
  const payload = {
    metric: name,
    value,
    metadata,
    timestamp: new Date().toISOString(),
  };

  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Silent fail
  });
}

/**
 * Log event to server
 */
function logEventToServer(event, data = {}) {
  const payload = {
    event,
    data,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Silent fail
  });
}

/**
 * Set user context for monitoring
 */
export function setUserContext(user) {
  if (window.__Sentry?.setUser) {
    window.__Sentry.setUser(user);
  }

  // Send to analytics
  logEventToServer('user_context', {
    userId: user?.id,
    plan: user?.plan,
    tier: user?.tier,
  });
}

/**
 * Capture message
 */
export function captureMessage(message, level = 'info') {
  if (window.__Sentry?.captureMessage) {
    window.__Sentry.captureMessage(message, level);
  }

  logEventToServer('message', { message, level });
}

/**
 * Capture exception
 */
export function captureException(error, context = {}) {
  if (window.__Sentry?.captureException) {
    window.__Sentry.captureException(error, context);
  }

  logErrorToServer(error, context);
}

/**
 * Get monitoring status
 */
export function getMonitoringStatus() {
  return {
    sentry: !!window.__Sentry,
    errorTracking: true,
    performanceMonitoring: typeof window !== 'undefined' && !!window.performance,
    analyticsTracking: true,
    uptimeMonitoring: true,
  };
}

export default {
  initializeMonitoring,
  setUserContext,
  captureMessage,
  captureException,
  getMonitoringStatus,
};
