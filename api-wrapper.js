/**
 * Centralized API Wrapper
 *
 * Intercepts all API calls to app.js functions with automatic:
 * - Error handling and user notifications
 * - Retry logic with exponential backoff
 * - Request timeout protection
 * - Performance monitoring
 * - Sentry error tracking
 *
 * This module wraps the native fetch function before app.js runs.
 */

import {
  retryAsync,
  withTimeout,
  safeFetch,
  createResilientClient,
} from './error-handling-wrapper.js';
import {
  captureException,
  captureMessage,
} from './production-monitoring-setup.js';

const API_RETRY_CONFIG = {
  '/api/generate': { retries: 3, initialDelay: 2000, timeout: 90000 },
  '/api/site-context': { retries: 2, initialDelay: 1000, timeout: 30000 },
  '/api/ai-test': { retries: 2, initialDelay: 1000, timeout: 15000 },
  '/api/models': { retries: 1, initialDelay: 500, timeout: 10000 },
  '/api/checkout': { retries: 0, initialDelay: 0, timeout: 15000 },
  '/api/portal': { retries: 0, initialDelay: 0, timeout: 15000 },
  '/api/github-publish': { retries: 1, initialDelay: 1000, timeout: 20000 },
};

const DEFAULT_RETRY_CONFIG = { retries: 2, initialDelay: 1000, timeout: 15000 };

/**
 * Get retry configuration for an API endpoint
 */
function getRetryConfig(url) {
  for (const [pattern, config] of Object.entries(API_RETRY_CONFIG)) {
    if (url.includes(pattern)) {
      return config;
    }
  }
  return DEFAULT_RETRY_CONFIG;
}

/**
 * Wrap fetch with error handling and retry logic
 */
const originalFetch = window.fetch.bind(window);
window.fetch = async function wrappedFetch(...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
  const options = (typeof args[1] === 'object' ? args[1] : {}) || {};

  // Check if this is an API call
  if (!url.includes('/api/')) {
    return originalFetch.apply(this, args);
  }

  const config = getRetryConfig(url);
  const startTime = performance.now();

  try {
    // Wrap with retry and timeout
    const response = await retryAsync(
      () =>
        withTimeout(
          originalFetch.apply(this, args),
          config.timeout
        ),
      config.retries,
      config.initialDelay
    );

    const duration = Math.round(performance.now() - startTime);

    // Log successful API call
    if (window.__monitoring?.logEvent) {
      window.__monitoring.logEvent('api_call', {
        url,
        method: options.method || 'GET',
        status: response.status,
        duration,
        success: true,
      });
    }

    return response;

  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    // Log failed API call
    if (window.__monitoring?.logEvent) {
      window.__monitoring.logEvent('api_call_failed', {
        url,
        method: options.method || 'GET',
        error: error.message,
        duration,
      });
    }

    // Capture exception in monitoring
    if (window.__Sentry?.captureException) {
      captureException(error, {
        type: 'api-call-failed',
        url,
        method: options.method || 'GET',
      });
    }

    // Re-throw so the app can handle it
    throw error;
  }
};

/**
 * Create a resilient API client for app use
 */
export const apiClient = createResilientClient({
  baseURL: '/api',
  timeout: 15000,
  retries: 2,
  onError: (error) => {
    console.error('[API-CLIENT] Error:', error);
    if (window.__monitoring?.error) {
      window.__monitoring.error('API Error', error, {
        type: 'api-error',
      });
    }
  },
});

/**
 * Utility to safely call an API endpoint with error handling
 */
export async function safeApiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    timeout = 15000,
    retries = 2,
    onError = null,
  } = options;

  try {
    const response = await retryAsync(
      () =>
        withTimeout(
          originalFetch(`/api${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', ...options.headers },
            body: body ? JSON.stringify(body) : null,
          }),
          timeout
        ),
      retries,
      1000
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `API error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();

  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error(`[API] ${endpoint} failed:`, error);
    }
    throw error;
  }
}

/**
 * Initialize API wrapper
 */
export function initializeApiWrapper() {
  console.log('[API-WRAPPER] API wrapper initialized');
}

export default {
  apiClient,
  safeApiCall,
  initializeApiWrapper,
};
