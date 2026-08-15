/**
 * Error Handling Wrapper & Utilities
 *
 * Provides standardized error handling across the application:
 * - Consistent try-catch patterns
 * - Error logging and monitoring
 * - Fallback values for failed operations
 * - User-friendly error messages
 *
 * Usage:
 *   const result = await safeAsync(() => fetch('/api/data'));
 *   const value = tryCatch(() => JSON.parse(data), defaultValue);
 */

/**
 * Wrap async function with try-catch
 * @param {Function} fn - Async function to execute
 * @param {*} defaultValue - Value to return on error
 * @param {Function} onError - Optional error callback
 * @returns {Promise<*>} - Result or defaultValue
 */
export async function safeAsync(fn, defaultValue = null, onError = null) {
  try {
    return await fn();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      logError('safeAsync failed', error);
    }
    return defaultValue;
  }
}

/**
 * Wrap synchronous function with try-catch
 * @param {Function} fn - Sync function to execute
 * @param {*} defaultValue - Value to return on error
 * @param {Function} onError - Optional error callback
 * @returns {*} - Result or defaultValue
 */
export function tryCatch(fn, defaultValue = null, onError = null) {
  try {
    return fn();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      logError('tryCatch failed', error);
    }
    return defaultValue;
  }
}

/**
 * Fetch with error handling
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response|null>} - Response or null on error
 */
export async function safeFetch(url, options = {}) {
  return safeAsync(
    async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    },
    null,
    (error) => logError(`Fetch failed for ${url}`, error)
  );
}

/**
 * Parse JSON safely
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Value to return on parse error
 * @returns {*} - Parsed object or defaultValue
 */
export function safeJSON(jsonString, defaultValue = {}) {
  return tryCatch(
    () => JSON.parse(jsonString),
    defaultValue,
    (error) => logError('JSON parse failed', error)
  );
}

/**
 * Log error to monitoring service
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 */
export function logError(message, error, context = {}) {
  const errorReport = {
    message,
    error: {
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
      name: error?.name || 'Error',
    },
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development' || typeof process === 'undefined') {
    console.error(`[${errorReport.message}]`, errorReport.error);
  }

  // Send to monitoring service
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      navigator.sendBeacon(
        '/api/errors',
        JSON.stringify(errorReport)
      );
    } catch (e) {
      // Silent fail - don't create error loop
    }
  }

  // Send to global error boundary if available
  if (typeof window !== 'undefined' && window.__captureError) {
    window.__captureError(error, context);
  }
}

/**
 * Retry async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<*>} - Result or throws on final failure
 */
export async function retryAsync(fn, maxAttempts = 3, initialDelay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Create debounced function that catches errors
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} - Debounced function
 */
export function debounceSafe(fn, delay = 300) {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      tryCatch(
        () => fn(...args),
        null,
        (error) => logError('Debounced function failed', error)
      );
    }, delay);
  };
}

/**
 * Create throttled function that catches errors
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Throttle delay in ms
 * @returns {Function} - Throttled function
 */
export function throttleSafe(fn, delay = 300) {
  let lastRun = 0;

  return function throttled(...args) {
    const now = Date.now();

    if (now - lastRun >= delay) {
      lastRun = now;
      tryCatch(
        () => fn(...args),
        null,
        (error) => logError('Throttled function failed', error)
      );
    }
  };
}

/**
 * Handle promise array with partial failures
 * @param {Promise[]} promises - Array of promises
 * @param {boolean} throwOnError - Throw if any promise fails
 * @returns {Promise<Array>} - Results (null for failed promises)
 */
export async function handlePromiseArray(promises, throwOnError = false) {
  const results = await Promise.allSettled(promises);

  if (throwOnError) {
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      throw new Error(`${failed.length} promises failed`);
    }
  }

  return results.map((result) =>
    result.status === 'fulfilled' ? result.value : null
  );
}

/**
 * Timeout wrapper for promises
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<*>} - Result or throws TimeoutError
 */
export function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Create resilient API client with error handling
 * @param {object} config - Configuration
 * @returns {object} - API client methods
 */
export function createResilientClient(config = {}) {
  const {
    baseURL = '',
    timeout = 5000,
    retries = 2,
    onError = null,
  } = config;

  return {
    async get(path, options = {}) {
      return retryAsync(
        async () => {
          const response = await withTimeout(
            fetch(`${baseURL}${path}`, {
              method: 'GET',
              ...options,
            }),
            timeout
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        },
        retries
      ).catch((error) => {
        if (onError) onError(error);
        logError(`GET ${path} failed`, error);
        return null;
      });
    },

    async post(path, data, options = {}) {
      return retryAsync(
        async () => {
          const response = await withTimeout(
            fetch(`${baseURL}${path}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...options.headers },
              body: JSON.stringify(data),
              ...options,
            }),
            timeout
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        },
        retries
      ).catch((error) => {
        if (onError) onError(error);
        logError(`POST ${path} failed`, error);
        return null;
      });
    },

    async delete(path, options = {}) {
      return retryAsync(
        async () => {
          const response = await withTimeout(
            fetch(`${baseURL}${path}`, {
              method: 'DELETE',
              ...options,
            }),
            timeout
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        },
        retries
      ).catch((error) => {
        if (onError) onError(error);
        logError(`DELETE ${path} failed`, error);
        return null;
      });
    },
  };
}

// Export as default object for convenience
export default {
  safeAsync,
  tryCatch,
  safeFetch,
  safeJSON,
  logError,
  retryAsync,
  debounceSafe,
  throttleSafe,
  handlePromiseArray,
  withTimeout,
  createResilientClient,
};
