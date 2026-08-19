/**
 * CSS Stylesheet Loader
 *
 * Manages critical and non-critical CSS loading for performance optimization.
 * Ensures critical CSS is inlined in HTML and non-critical CSS is loaded async.
 *
 * Strategy:
 * - Critical CSS (27KB): layout, typography, buttons, forms, nav - inlined in <head>
 * - Non-critical CSS (64KB): async loaded with media queries, theme variants
 */

class StylesheetLoader {
  constructor() {
    this.criticalLoaded = this.checkCriticalCSS();
    this.nonCriticalLoaded = false;
    this.mediaQueryLoader = null;
  }

  /**
   * Check if critical CSS is already in the page (inlined in <head>)
   */
  checkCriticalCSS() {
    const styles = document.querySelectorAll('style[data-critical], link[data-critical]');
    return styles.length > 0;
  }

  /**
   * Load non-critical CSS asynchronously
   */
  loadNonCriticalCSS() {
    if (this.nonCriticalLoaded) return;

    // Find non-critical CSS stylesheet references
    const nonCriticalSheets = [
      '/styles-dialog.css',
      '/styles-admin.css',
      '/styles-billing.css',
      '/styles-legal.css',
      '/styles-animations.css',
    ];

    nonCriticalSheets.forEach((sheet) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${sheet}?v=20260819-25`;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
        console.log(`[CSS-LOADER] ${sheet} loaded`);
      };
      document.head.appendChild(link);
    });

    this.nonCriticalLoaded = true;
    console.log('[CSS-LOADER] Non-critical CSS loading initiated');
  }

  /**
   * Load theme-specific CSS based on user preference
   */
  loadThemeCSS() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const userTheme = localStorage.getItem('sitebrief-theme');

    const themeName = userTheme || (prefersDark ? 'dark' : 'light');

    if (themeName === 'dark') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/styles-dark.css?v=20260819-25`;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
        console.log('[CSS-LOADER] Dark theme CSS loaded');
      };
      document.head.appendChild(link);
    }
  }

  /**
   * Load media-specific CSS based on viewport
   */
  loadMediaSpecificCSS() {
    // Mobile CSS
    const mobileLink = document.createElement('link');
    mobileLink.rel = 'stylesheet';
    mobileLink.href = '/styles-mobile.css?v=20260819-25';
    mobileLink.media = '(max-width: 768px)';
    document.head.appendChild(mobileLink);

    // Tablet CSS
    const tabletLink = document.createElement('link');
    tabletLink.rel = 'stylesheet';
    tabletLink.href = '/styles-tablet.css?v=20260819-25';
    tabletLink.media = '(min-width: 769px) and (max-width: 1024px)';
    document.head.appendChild(tabletLink);

    // Desktop CSS
    const desktopLink = document.createElement('link');
    desktopLink.rel = 'stylesheet';
    desktopLink.href = '/styles-desktop.css?v=20260819-25';
    desktopLink.media = '(min-width: 1025px)';
    document.head.appendChild(desktopLink);

    console.log('[CSS-LOADER] Media-specific CSS loaded');
  }

  /**
   * Monitor for theme changes and reload CSS
   */
  monitorThemeChanges() {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    darkModeQuery.addEventListener('change', (e) => {
      console.log(`[CSS-LOADER] Theme changed to ${e.matches ? 'dark' : 'light'}`);
      // Reload theme CSS if needed
      if (e.matches) {
        this.loadThemeCSS();
      }
    });
  }

  /**
   * Get CSS loader status
   */
  getStatus() {
    return {
      criticalLoaded: this.criticalLoaded,
      nonCriticalLoaded: this.nonCriticalLoaded,
      themeMonitored: true,
    };
  }

  /**
   * Initialize stylesheet loader
   */
  initialize() {
    // Wait for DOM to be interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    console.log('[CSS-LOADER] Initializing stylesheet loader...');

    // Load non-critical CSS after paint
    requestIdleCallback(() => {
      this.loadNonCriticalCSS();
      this.loadThemeCSS();
      this.loadMediaSpecificCSS();
      this.monitorThemeChanges();
    });

    console.log('[CSS-LOADER] ✓ Stylesheet loader initialized');
  }
}

/**
 * Initialize stylesheet loader on page load
 */
const stylesheetLoader = new StylesheetLoader();
stylesheetLoader.initialize();

export { stylesheetLoader, StylesheetLoader };
