/**
 * App Error Integration Layer
 *
 * Wraps critical app functions with standardized error handling.
 * Integrates error-handling-wrapper.js utilities into main application.
 *
 * This layer sits between app.js and API calls, providing:
 * - Automatic retry logic for failed requests
 * - User-friendly error messages
 * - Error logging and monitoring
 * - Fallback values for failed operations
 *
 * Integration: Include this BEFORE app.js loads
 */

import {
  safeAsync,
  tryCatch,
  safeFetch,
  safeJSON,
  retryAsync,
  handlePromiseArray,
  withTimeout,
  createResilientClient,
} from './error-handling-wrapper.js';

/**
 * Wrap API client with error handling
 */
export const apiClient = createResilientClient({
  baseURL: '/api',
  timeout: 10000,
  retries: 2,
  onError: (error) => {
    logAPIError(error);
  },
});

/**
 * Safe API call wrapper for app
 */
export const AppAPI = {
  /**
   * Get projects
   */
  async getProjects() {
    return safeAsync(
      () => apiClient.get('/projects'),
      [],
      (error) => {
        showErrorNotification('Projekte konnten nicht geladen werden');
        console.error('Failed to load projects:', error);
      }
    );
  },

  /**
   * Create project
   */
  async createProject(data) {
    return safeAsync(
      () => apiClient.post('/projects', data),
      null,
      (error) => {
        showErrorNotification('Projekt konnte nicht erstellt werden');
        console.error('Failed to create project:', error);
      }
    );
  },

  /**
   * Update project
   */
  async updateProject(id, data) {
    return safeAsync(
      () => apiClient.post(`/projects/${id}`, data),
      null,
      (error) => {
        showErrorNotification('Projekt konnte nicht aktualisiert werden');
        console.error('Failed to update project:', error);
      }
    );
  },

  /**
   * Delete project
   */
  async deleteProject(id) {
    return safeAsync(
      () => apiClient.delete(`/projects/${id}`),
      false,
      (error) => {
        showErrorNotification('Projekt konnte nicht gelöscht werden');
        console.error('Failed to delete project:', error);
      }
    );
  },

  /**
   * Generate prompt
   */
  async generatePrompt(projectId, options) {
    return retryAsync(
      () =>
        withTimeout(
          apiClient.post(`/projects/${projectId}/generate`, options),
          30000
        ),
      3,
      2000
    ).catch((error) => {
      showErrorNotification('Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      console.error('Failed to generate prompt:', error);
      return null;
    });
  },

  /**
   * Get preview
   */
  async getPreview(projectId) {
    return safeAsync(
      () => withTimeout(apiClient.get(`/projects/${projectId}/preview`), 15000),
      null,
      (error) => {
        showErrorNotification('Vorschau konnte nicht geladen werden');
        console.error('Failed to get preview:', error);
      }
    );
  },

  /**
   * Save project state
   */
  async saveProjectState(projectId, state) {
    return safeAsync(
      () => apiClient.post(`/projects/${projectId}/state`, state),
      false,
      (error) => {
        console.warn('Failed to save project state:', error);
        // Don't show error to user - this is background save
      }
    );
  },

  /**
   * Get user settings
   */
  async getUserSettings() {
    return safeAsync(
      () => apiClient.get('/user/settings'),
      {},
      (error) => {
        console.warn('Failed to load user settings:', error);
      }
    );
  },

  /**
   * Update user settings
   */
  async updateUserSettings(settings) {
    return safeAsync(
      () => apiClient.post('/user/settings', settings),
      false,
      (error) => {
        showErrorNotification('Einstellungen konnten nicht gespeichert werden');
        console.error('Failed to update settings:', error);
      }
    );
  },

  /**
   * Check quota
   */
  async checkQuota() {
    return safeAsync(
      () => apiClient.get('/user/quota'),
      { remaining: 0, limit: 0 },
      (error) => {
        console.warn('Failed to check quota:', error);
      }
    );
  },

  /**
   * Get available models
   */
  async getModels() {
    return safeAsync(
      () => apiClient.get('/models'),
      [],
      (error) => {
        console.warn('Failed to load models:', error);
      }
    );
  },

  /**
   * Batch operations with error handling
   */
  async batchOperations(operations) {
    return handlePromiseArray(operations, false);
  },
};

/**
 * Safe state management wrapper
 */
export const SafeState = {
  /**
   * Safely update app state
   */
  update(key, value) {
    return tryCatch(
      () => {
        if (typeof window !== 'undefined' && window.appState) {
          window.appState[key] = value;
          return true;
        }
        return false;
      },
      false,
      (error) => {
        console.warn(`Failed to update state[${key}]:`, error);
      }
    );
  },

  /**
   * Safely read app state
   */
  get(key, defaultValue = null) {
    return tryCatch(
      () => {
        if (typeof window !== 'undefined' && window.appState) {
          return window.appState[key] ?? defaultValue;
        }
        return defaultValue;
      },
      defaultValue,
      (error) => {
        console.warn(`Failed to read state[${key}]:`, error);
      }
    );
  },

  /**
   * Safely perform state mutation
   */
  async mutate(key, mutationFn) {
    return safeAsync(
      async () => {
        const current = this.get(key);
        const updated = await mutationFn(current);
        this.update(key, updated);
        return updated;
      },
      null,
      (error) => {
        console.warn(`Failed to mutate state[${key}]:`, error);
      }
    );
  },
};

/**
 * Safe localStorage wrapper
 */
export const SafeStorage = {
  /**
   * Safely save to localStorage
   */
  set(key, value) {
    return tryCatch(
      () => {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      },
      false,
      (error) => {
        console.warn(`Failed to save ${key} to localStorage:`, error);
      }
    );
  },

  /**
   * Safely read from localStorage
   */
  get(key, defaultValue = null) {
    return tryCatch(
      () => {
        const stored = localStorage.getItem(key);
        return stored ? safeJSON(stored, defaultValue) : defaultValue;
      },
      defaultValue,
      (error) => {
        console.warn(`Failed to read ${key} from localStorage:`, error);
      }
    );
  },

  /**
   * Safely remove from localStorage
   */
  remove(key) {
    return tryCatch(
      () => {
        localStorage.removeItem(key);
        return true;
      },
      false,
      (error) => {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    );
  },
};

/**
 * Safe DOM operations
 */
export const SafeDOM = {
  /**
   * Safely query selector
   */
  query(selector, defaultValue = null) {
    return tryCatch(
      () => document.querySelector(selector),
      defaultValue,
      (error) => {
        console.warn(`Failed to query ${selector}:`, error);
      }
    );
  },

  /**
   * Safely add event listener
   */
  addEventListener(target, event, handler, options = {}) {
    return tryCatch(
      () => {
        target?.addEventListener(event, handler, options);
        return true;
      },
      false,
      (error) => {
        console.warn(`Failed to add event listener:`, error);
      }
    );
  },

  /**
   * Safely set innerHTML
   */
  setHTML(element, html) {
    return tryCatch(
      () => {
        if (element) {
          element.innerHTML = html;
          return true;
        }
        return false;
      },
      false,
      (error) => {
        console.warn(`Failed to set HTML:`, error);
      }
    );
  },
};

/**
 * Show error notification to user
 */
function showErrorNotification(message) {
  if (typeof window === 'undefined') return;

  // Try to use app's notification system if available
  if (window.showNotification) {
    window.showNotification({
      type: 'error',
      message,
      duration: 5000,
    });
    return;
  }

  // Fallback: create simple toast
  const toast = document.createElement('div');
  toast.className = 'app-error-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #cc0000;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    z-index: 10000;
    font-size: 14px;
    max-width: 300px;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

/**
 * Log API error
 */
function logAPIError(error) {
  if (typeof window !== 'undefined' && window.__monitoring) {
    window.__monitoring.error('API Error', error, {
      type: 'api-error',
    });
  }

  console.error('[API-ERROR]', error);
}

/**
 * Integration instructions
 */
export const INTEGRATION_GUIDE = {
  installation: `
    1. Include this file BEFORE app.js in index.html:
       <script type="module" src="./app-error-integration.js"></script>
       <script type="module" src="./app.js"></script>

    2. Replace API calls in app.js:
       OLD: fetch('/api/projects')
       NEW: AppAPI.getProjects()

    3. Replace state mutations:
       OLD: state.setting = value
       NEW: SafeState.update('setting', value)

    4. Replace localStorage:
       OLD: localStorage.setItem('key', JSON.stringify(data))
       NEW: SafeStorage.set('key', data)
  `,

  benefits: [
    'Automatic retry on failed requests',
    'Consistent error handling',
    'User-friendly error messages',
    'Error logging to monitoring',
    'Graceful fallbacks',
    'Timeout protection',
  ],

  examples: `
    // Get projects with error handling
    const projects = await AppAPI.getProjects();

    // Create project with retry
    const project = await AppAPI.createProject({ name: 'My Project' });

    // Safe state update
    SafeState.update('currentStep', 2);

    // Safe localStorage
    SafeStorage.set('user-preferences', { theme: 'dark' });
  `,
};

export default {
  AppAPI,
  SafeState,
  SafeStorage,
  SafeDOM,
  INTEGRATION_GUIDE,
};
