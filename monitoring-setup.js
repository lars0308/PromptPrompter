/**
 * Monitoring & Logging Setup
 *
 * Centralized configuration for application monitoring, logging, and analytics.
 * Supports multiple monitoring services (Sentry, LogRocket, custom API).
 *
 * Usage:
 *   monitoring.initialize(config);
 *   monitoring.log('info', 'User logged in', { userId: 123 });
 *   monitoring.error('Payment failed', error, { orderId: 456 });
 */

const LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
};

const LEVEL_SEVERITY = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  critical: 5,
};

/**
 * Central monitoring service
 */
class MonitoringService {
  constructor() {
    this.config = {
      minLevel: LEVEL.INFO,
      apiEndpoint: '/api/logs',
      maxBatchSize: 50,
      flushInterval: 5000,
      enableConsole: true,
      enableSentry: false,
      enableLogRocket: false,
    };

    this.queue = [];
    this.flushTimer = null;
    this.sessionId = this.generateSessionId();
    this.initialized = false;
  }

  /**
   * Initialize monitoring service
   * @param {Object} config - Configuration object
   */
  initialize(config = {}) {
    this.config = { ...this.config, ...config };

    // Initialize integrations
    if (this.config.enableSentry) {
      this.initializeSentry();
    }

    if (this.config.enableLogRocket) {
      this.initializeLogRocket();
    }

    // Start batch flush timer
    this.startFlushTimer();

    // Setup global error handlers
    this.setupGlobalHandlers();

    this.initialized = true;
    this.info('Monitoring initialized', {
      sessionId: this.sessionId,
      config: this.getPublicConfig(),
    });
  }

  /**
   * Log message
   * @param {string} level - Log level (debug, info, warn, error, critical)
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   */
  log(level, message, context = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    };

    // Log to console
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Log to Sentry if enabled
    if (this.config.enableSentry && level === LEVEL.ERROR) {
      this.sendToSentry(logEntry);
    }

    // Log to LogRocket if enabled
    if (this.config.enableLogRocket) {
      this.sendToLogRocket(logEntry);
    }

    // Queue for batch send
    this.queue.push(logEntry);

    // Flush if batch is full or critical error
    if (this.queue.length >= this.config.maxBatchSize || level === LEVEL.CRITICAL) {
      this.flush();
    }
  }

  debug(message, context) {
    this.log(LEVEL.DEBUG, message, context);
  }

  info(message, context) {
    this.log(LEVEL.INFO, message, context);
  }

  warn(message, context) {
    this.log(LEVEL.WARN, message, context);
  }

  error(message, error, context = {}) {
    const errorContext = {
      ...context,
      errorMessage: error?.message || String(error),
      errorStack: error?.stack || '',
      errorName: error?.name || 'Error',
    };

    this.log(LEVEL.ERROR, message, errorContext);
  }

  critical(message, error, context = {}) {
    this.error(message, error, { ...context, severity: 'critical' });
  }

  /**
   * Flush queue to API
   */
  async flush() {
    if (this.queue.length === 0) return;

    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      if (navigator?.sendBeacon) {
        navigator.sendBeacon(
          this.config.apiEndpoint,
          JSON.stringify({ logs: logsToSend })
        );
      } else {
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsToSend }),
        });
      }
    } catch (e) {
      // Re-queue on failure
      this.queue = [...logsToSend, ...this.queue];
    }
  }

  /**
   * Should log based on configured level
   */
  shouldLog(level) {
    const configSeverity = LEVEL_SEVERITY[this.config.minLevel];
    const levelSeverity = LEVEL_SEVERITY[level];

    return levelSeverity >= configSeverity;
  }

  /**
   * Log to browser console
   */
  logToConsole(entry) {
    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.level.toUpperCase()}]`;

    console[this.getConsoleMethod(entry.level)](
      `%c${prefix} ${entry.message}`,
      style,
      entry.context
    );
  }

  /**
   * Get console.log method for level
   */
  getConsoleMethod(level) {
    switch (level) {
      case LEVEL.ERROR:
      case LEVEL.CRITICAL:
        return 'error';
      case LEVEL.WARN:
        return 'warn';
      default:
        return 'log';
    }
  }

  /**
   * Get console style for level
   */
  getConsoleStyle(level) {
    const styles = {
      debug: 'color: #666; font-size: 12px;',
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff6600; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold; font-size: 14px;',
      critical: 'background: #cc0000; color: white; font-weight: bold; font-size: 14px; padding: 2px 6px; border-radius: 2px;',
    };

    return styles[level] || styles.info;
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', event.reason || new Error('Unknown rejection'), {
        type: 'unhandledRejection',
      });
    });
  }

  /**
   * Initialize Sentry integration (stub - requires Sentry SDK)
   */
  initializeSentry() {
    // This would be implemented with actual Sentry SDK
    // import * as Sentry from "@sentry/browser";
    // Sentry.init({ dsn: this.config.sentryDsn });
  }

  /**
   * Initialize LogRocket integration (stub)
   */
  initializeLogRocket() {
    // This would be implemented with actual LogRocket SDK
    // LogRocket.init(this.config.logRocketId);
  }

  /**
   * Send to Sentry
   */
  sendToSentry(logEntry) {
    // Implementation with Sentry SDK
  }

  /**
   * Send to LogRocket
   */
  sendToLogRocket(logEntry) {
    // Implementation with LogRocket SDK
  }

  /**
   * Start periodic flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get public config (without secrets)
   */
  getPublicConfig() {
    const { sentryDsn, logRocketId, ...config } = this.config;
    return config;
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * Destroy monitoring service
   */
  destroy() {
    this.flush();
    this.stopFlushTimer();
  }
}

/**
 * Performance monitoring utilities
 */
class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Start measuring operation
   */
  start(label) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${label}-start`);
    }
    this.marks.set(label, Date.now());
  }

  /**
   * End measuring operation
   */
  end(label) {
    if (!this.marks.has(label)) {
      console.warn(`Performance mark '${label}' not started`);
      return null;
    }

    const duration = Date.now() - this.marks.get(label);
    this.marks.delete(label);

    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }

    this.measures.push({ label, duration });

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[Performance] ${label} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * Get all measurements
   */
  getMeasures() {
    return [...this.measures];
  }

  /**
   * Clear measurements
   */
  clear() {
    this.measures = [];
    this.marks.clear();
  }
}

// Singleton instances
export const monitoring = new MonitoringService();
export const performance = new PerformanceMonitor();

// Export classes for testing
export { MonitoringService, PerformanceMonitor, LEVEL };
