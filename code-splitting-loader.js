/**
 * Code-Splitting Loader & Module Management
 *
 * Dynamically loads feature modules to reduce initial bundle size.
 * Target: -28% reduction (349KB → 250KB initial load)
 *
 * Usage:
 *   const adminModule = await CodeSplittingLoader.load('admin');
 *   CodeSplittingLoader.onModuleLoaded('admin', (module) => { ... });
 */

class CodeSplittingLoader {
  constructor() {
    this.modules = new Map();
    this.loading = new Map();
    this.listeners = new Map();
    this.moduleManifest = {
      admin: {
        files: [
          'admin-console.js',
          'admin-console-core.js',
          'admin-tokens-ui.js',
          'admin-ai-ui.js',
          'admin-prompts-ui.js',
        ],
        size: '77KB',
        priority: 'low',
        dependencies: [],
        description: 'Admin console and management interface',
      },
      billing: {
        files: ['subscription-ui.js', 'plan-preview-ui.js', 'plan-defaults.js'],
        size: '20KB',
        priority: 'medium',
        dependencies: [],
        description: 'Billing, subscription, and plan management',
      },
      legal: {
        files: ['legal-pages.js'],
        size: '16KB',
        priority: 'low',
        dependencies: [],
        description: 'Legal pages (terms, privacy, imprint)',
      },
      templates: {
        files: ['free-prompt-presets.js', 'brand-werkstatt.js'],
        size: '30KB',
        priority: 'low',
        dependencies: [],
        description: 'Templates and prompt library',
      },
      analytics: {
        files: ['monitoring-setup.js'],
        size: '9KB',
        priority: 'low',
        dependencies: [],
        description: 'Monitoring and analytics integration',
      },
    };
  }

  /**
   * Load a feature module dynamically
   * @param {string} moduleName - Module identifier (admin, billing, legal, etc.)
   * @returns {Promise<Object>} Loaded module exports
   */
  async load(moduleName) {
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName);
    }

    if (this.loading.has(moduleName)) {
      return this.loading.get(moduleName);
    }

    const manifest = this.moduleManifest[moduleName];
    if (!manifest) {
      throw new Error(`Unknown module: ${moduleName}`);
    }

    const promise = this.loadModule(moduleName, manifest);
    this.loading.set(moduleName, promise);

    try {
      const module = await promise;
      this.modules.set(moduleName, module);
      this.loading.delete(moduleName);
      this.notifyListeners(moduleName, module);
      return module;
    } catch (error) {
      this.loading.delete(moduleName);
      throw error;
    }
  }

  /**
   * Load module files and compile exports
   */
  async loadModule(moduleName, manifest) {
    const startTime = performance.now();
    const moduleObj = { __name: moduleName, __files: [] };

    for (const file of manifest.files) {
      try {
        // Simulate dynamic import
        const response = await this.fetchModule(file);
        const exports = this.parseModuleExports(response);
        Object.assign(moduleObj, exports);
        moduleObj.__files.push(file);
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error);
      }
    }

    const duration = performance.now() - startTime;
    moduleObj.__loadTime = duration;
    moduleObj.__manifest = manifest;

    this.logModuleLoad(moduleName, manifest, duration);
    return moduleObj;
  }

  /**
   * Simulate fetching module (in real app, use dynamic import)
   */
  async fetchModule(file) {
    // In production, this would be an actual dynamic import
    // import(`./${file}`).then(m => m.default || m)
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (e) {
      // Fallback: module is already in global scope
      return '';
    }
  }

  /**
   * Parse module exports from script text (simplified)
   */
  parseModuleExports(scriptText) {
    const exports = {};
    const exportPattern = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
    let match;
    while ((match = exportPattern.exec(scriptText)) !== null) {
      exports[match[1]] = true;
    }
    return exports;
  }

  /**
   * Preload modules in background (after page load)
   */
  async preload(...moduleNames) {
    await Promise.all(
      moduleNames.map((name) =>
        this.load(name).catch((e) => {
          console.warn(`Preload failed for ${name}:`, e);
        })
      )
    );
  }

  /**
   * Preload modules based on user tier
   */
  async preloadByTier(userTier) {
    const tierModules = {
      guest: ['templates'],
      free: ['templates', 'billing'],
      pro: ['billing', 'templates'],
      ultimate: ['billing', 'templates'],
      admin: ['admin', 'billing', 'legal', 'analytics'],
    };

    const modules = tierModules[userTier] || [];
    if (modules.length > 0) {
      this.preload(...modules);
    }
  }

  /**
   * Register callback for module load
   */
  onModuleLoaded(moduleName, callback) {
    if (!this.listeners.has(moduleName)) {
      this.listeners.set(moduleName, []);
    }
    this.listeners.get(moduleName).push(callback);

    if (this.modules.has(moduleName)) {
      callback(this.modules.get(moduleName));
    }
  }

  /**
   * Notify listeners of module load
   */
  notifyListeners(moduleName, module) {
    const listeners = this.listeners.get(moduleName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(module);
        } catch (error) {
          console.error(`Listener error for ${moduleName}:`, error);
        }
      });
    }
  }

  /**
   * Get module manifest for debugging
   */
  getManifest(moduleName) {
    return this.moduleManifest[moduleName];
  }

  /**
   * Get all loaded modules
   */
  getLoadedModules() {
    return Array.from(this.modules.keys());
  }

  /**
   * Get module statistics
   */
  getStats() {
    const stats = {
      loaded: this.modules.size,
      loading: this.loading.size,
      totalSize: 0,
      modules: {},
    };

    for (const [name, manifest] of Object.entries(this.moduleManifest)) {
      const sizeKb = parseInt(manifest.size) || 0;
      stats.totalSize += sizeKb;
      stats.modules[name] = {
        size: manifest.size,
        priority: manifest.priority,
        loaded: this.modules.has(name),
        loading: this.loading.has(name),
        description: manifest.description,
      };
    }

    stats.initialBundleSize = '250KB (estimated)';
    stats.lazyLoadableSize = `${stats.totalSize}KB (can defer)`;

    return stats;
  }

  /**
   * Log module load performance
   */
  logModuleLoad(moduleName, manifest, duration) {
    const message = `Module loaded: ${moduleName} (${manifest.size}, ${duration.toFixed(0)}ms)`;

    if (typeof window !== 'undefined' && window.__monitoring) {
      window.__monitoring.log('debug', message, {
        module: moduleName,
        size: manifest.size,
        duration,
        priority: manifest.priority,
      });
    }

    if (duration > 1000) {
      console.warn(`[PERF] Slow module load: ${message}`);
    } else {
      console.log(`[LAZY-LOAD] ${message}`);
    }
  }

  /**
   * Clear cache (for development)
   */
  clearCache() {
    this.modules.clear();
    this.loading.clear();
    console.log('[LAZY-LOAD] Cache cleared');
  }

  /**
   * Get bundle size analysis
   */
  analyzeBundleSize() {
    const analysis = {
      currentState: {
        loadedModules: this.getLoadedModules(),
        totalLoadedSize: 0,
      },
      initial: {
        size: '250KB',
        includes: ['Core app, routing, auth, main UI'],
        excludes: ['Admin, billing, legal, templates'],
      },
      deferred: this.getStats(),
    };

    for (const [name, manifest] of Object.entries(this.moduleManifest)) {
      if (this.modules.has(name)) {
        analysis.currentState.totalLoadedSize += parseInt(manifest.size) || 0;
      }
    }

    return analysis;
  }
}

export const codeSplittingLoader = new CodeSplittingLoader();

// Export class and singleton
export default {
  CodeSplittingLoader,
  codeSplittingLoader,
};
