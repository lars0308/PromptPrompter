/**
 * Lazy-Load Integration
 *
 * Integrates code-splitting loader into application for dynamic module loading.
 * Demonstrates real-world usage patterns.
 *
 * Usage:
 *   import { initLazyLoading, lazyLoadAdmin, lazyLoadBilling } from './lazy-load-integration.js';
 *   await initLazyLoading();
 */

import { codeSplittingLoader } from './code-splitting-loader.js';

/**
 * Initialize lazy-loading system
 * Set up event listeners and preload strategy
 */
export async function initLazyLoading() {
  if (typeof window === 'undefined') return;

  // Preload based on route when app initializes
  window.__lazyLoadingReady = codeSplittingLoader;

  // Listen for route changes and preload relevant modules
  window.addEventListener('app-route-change', (event) => {
    const route = event.detail?.route;
    preloadByRoute(route);
  });

  // Preload modules based on user tier
  const userTier = getUserTier();
  await codeSplittingLoader.preloadByTier(userTier);

  console.log('[LAZY-LOAD] System initialized');
}

/**
 * Get current user tier
 */
function getUserTier() {
  if (typeof window !== 'undefined' && window.__user) {
    return window.__user.plan || 'guest';
  }
  return 'guest';
}

/**
 * Preload modules based on route
 */
function preloadByRoute(route) {
  const moduleMap = {
    '/admin': ['admin', 'analytics'],
    '/billing': ['billing'],
    '/plans': ['billing'],
    '/settings': ['billing'],
    '/legal': ['legal'],
    '/terms': ['legal'],
    '/privacy': ['legal'],
    '/templates': ['templates'],
    '/library': ['templates'],
  };

  const modules = moduleMap[route] || [];
  if (modules.length > 0) {
    codeSplittingLoader.preload(...modules);
  }
}

/**
 * Lazy load admin console with loading indicator
 */
export async function lazyLoadAdmin() {
  const loadingIndicator = showLoadingIndicator('Laden Admin-Konsole...');

  try {
    const adminModule = await codeSplittingLoader.load('admin');
    hideLoadingIndicator(loadingIndicator);

    if (adminModule.__manifest) {
      console.log(`[LAZY-LOAD] Admin loaded in ${adminModule.__loadTime.toFixed(0)}ms`);
    }

    return adminModule;
  } catch (error) {
    hideLoadingIndicator(loadingIndicator);
    console.error('[LAZY-LOAD] Failed to load admin:', error);
    showErrorNotification('Admin-Konsole konnte nicht geladen werden.');
    throw error;
  }
}

/**
 * Lazy load billing/subscription features
 */
export async function lazyLoadBilling() {
  const loadingIndicator = showLoadingIndicator('Laden Abrechnungsoptionen...');

  try {
    const billingModule = await codeSplittingLoader.load('billing');
    hideLoadingIndicator(loadingIndicator);

    if (billingModule.__manifest) {
      console.log(`[LAZY-LOAD] Billing loaded in ${billingModule.__loadTime.toFixed(0)}ms`);
    }

    return billingModule;
  } catch (error) {
    hideLoadingIndicator(loadingIndicator);
    console.error('[LAZY-LOAD] Failed to load billing:', error);
    showErrorNotification('Abrechnungsoptionen konnten nicht geladen werden.');
    throw error;
  }
}

/**
 * Lazy load legal pages
 */
export async function lazyLoadLegal() {
  const loadingIndicator = showLoadingIndicator('Laden rechtliche Dokumente...');

  try {
    const legalModule = await codeSplittingLoader.load('legal');
    hideLoadingIndicator(loadingIndicator);

    if (legalModule.__manifest) {
      console.log(`[LAZY-LOAD] Legal loaded in ${legalModule.__loadTime.toFixed(0)}ms`);
    }

    return legalModule;
  } catch (error) {
    hideLoadingIndicator(loadingIndicator);
    return null;
  }
}

/**
 * Lazy load templates and library
 */
export async function lazyLoadTemplates() {
  const loadingIndicator = showLoadingIndicator('Laden Vorlagen...');

  try {
    const templatesModule = await codeSplittingLoader.load('templates');
    hideLoadingIndicator(loadingIndicator);

    if (templatesModule.__manifest) {
      console.log(`[LAZY-LOAD] Templates loaded in ${templatesModule.__loadTime.toFixed(0)}ms`);
    }

    return templatesModule;
  } catch (error) {
    hideLoadingIndicator(loadingIndicator);
    console.error('[LAZY-LOAD] Failed to load templates:', error);
    showErrorNotification('Vorlagen konnten nicht geladen werden.');
    throw error;
  }
}

/**
 * Show loading indicator
 */
function showLoadingIndicator(message) {
  if (typeof window === 'undefined') return null;

  const indicator = document.createElement('div');
  indicator.className = 'lazy-load-indicator';
  indicator.innerHTML = `
    <div class="lazy-load-spinner"></div>
    <p>${message}</p>
  `;
  indicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px 40px;
    border-radius: 8px;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
  `;

  document.body.appendChild(indicator);
  return indicator;
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator(indicator) {
  if (indicator && indicator.parentNode) {
    indicator.remove();
  }
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
  if (typeof window === 'undefined') return;

  const notification = document.createElement('div');
  notification.className = 'lazy-load-error';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    z-index: 10000;
    font-size: 14px;
    max-width: 300px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * Register callback for module pre-load
 */
export function onModuleLoaded(moduleName, callback) {
  codeSplittingLoader.onModuleLoaded(moduleName, callback);
}

/**
 * Get lazy-loading statistics
 */
export function getLazyLoadStats() {
  return codeSplittingLoader.getStats();
}

/**
 * Analyze bundle size with lazy-loading
 */
export function analyzeBundleSize() {
  return codeSplittingLoader.analyzeBundleSize();
}

/**
 * Export loader for direct access
 */
export { codeSplittingLoader };

// Auto-init if in browser
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  initLazyLoading();
} else if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initLazyLoading();
  });
}
