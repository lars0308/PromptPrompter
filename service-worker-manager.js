/**
 * Service Worker Manager
 *
 * Handles service worker registration, updates, and lifecycle management.
 * Provides utilities for cache management and offline detection.
 */

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.updateCheckInterval = 6 * 60 * 60 * 1000; // 6 hours
  }

  /**
   * Register service worker
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW-MGR] Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker-caching.js', {
        scope: '/',
      });

      this.registration = registration;
      console.log('[SW-MGR] Service worker registered');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, this.updateCheckInterval);

      return registration;
    } catch (error) {
      console.error('[SW-MGR] Registration failed:', error);
      return null;
    }
  }

  /**
   * Handle service worker update
   */
  handleUpdateFound() {
    const newWorker = this.registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is ready, notify user
        this.notifyUpdate();
      }
    });
  }

  /**
   * Notify user about available update
   */
  notifyUpdate() {
    console.log('[SW-MGR] Update available');

    // Show notification (in-app)
    if (typeof window !== 'undefined' && window.__notifyUpdate) {
      window.__notifyUpdate({
        title: 'Update verfügbar',
        message: 'Eine neue Version der App ist verfügbar.',
        action: () => this.applyUpdate(),
      });
    }
  }

  /**
   * Apply pending update
   */
  applyUpdate() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when new worker becomes active
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.registration) {
      return null;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_CACHE_STATS' },
        [channel.port2]
      );

      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATS') {
          resolve(event.data.data);
        }
      };

      // Timeout if no response
      setTimeout(() => resolve(null), 5000);
    });
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName) {
    if (!this.registration) {
      return false;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      navigator.serviceWorker.controller?.postMessage(
        { type: 'CLEAR_CACHE', cacheName },
        [channel.port2]
      );

      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve(true);
        }
      };

      setTimeout(() => resolve(false), 5000);
    });
  }

  /**
   * Listen for online/offline changes
   */
  listenToOnlineStatus() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[SW-MGR] Back online');
      this.notifyStatusChange('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[SW-MGR] Went offline');
      this.notifyStatusChange('offline');
    });
  }

  /**
   * Notify about status change
   */
  notifyStatusChange(status) {
    if (typeof window !== 'undefined' && window.__notifyStatusChange) {
      window.__notifyStatusChange(status);
    }
  }

  /**
   * Check if online
   */
  isConnected() {
    return this.isOnline;
  }

  /**
   * Get service worker status
   */
  getStatus() {
    return {
      registered: !!this.registration,
      active: this.registration?.active !== undefined,
      installing: this.registration?.installing !== undefined,
      waiting: this.registration?.waiting !== undefined,
      isOnline: this.isOnline,
      scope: this.registration?.scope,
    };
  }

  /**
   * Unregister service worker (for cleanup)
   */
  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      console.log('[SW-MGR] Service worker unregistered');
    }
  }

  /**
   * Print cache statistics
   */
  async printCacheStats() {
    const stats = await this.getCacheStats();

    if (!stats) {
      console.log('[SW-MGR] Could not retrieve cache stats');
      return;
    }

    console.log('[SW-MGR] Cache Statistics');
    console.log('=======================');

    for (const [key, cache] of Object.entries(stats.caches)) {
      console.log(`\n${key.toUpperCase()} (${cache.name})`);
      console.log(`  Entries: ${cache.entries}`);
      cache.items.forEach((url) => {
        console.log(`    - ${new URL(url).pathname}`);
      });
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * Auto-register on page load
 */
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await serviceWorkerManager.register();
    serviceWorkerManager.listenToOnlineStatus();
  });
} else if (typeof window !== 'undefined') {
  (async () => {
    await serviceWorkerManager.register();
    serviceWorkerManager.listenToOnlineStatus();
  })();
}

export default serviceWorkerManager;
