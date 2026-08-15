# Performance Baseline Report

**Date:** August 15, 2026  
**Status:** Phase 2 - Code-Splitting Planning

---

## Current Bundle Metrics

### Bundle Size Analysis

| File | Size | Status |
|------|------|--------|
| app.js | 349 KB | Main entry point - includes all features |
| styles.css | 144 KB | Single stylesheet - all features |
| **Total Initial Load** | **493 KB** | ⚠️ Can be reduced with code-splitting |

### JavaScript Module Count

- Total JS files: 95
- Main modules: 10+
- Feature modules loaded on every page: All

### Project Structure

```
Root modules (always loaded):
├── app.js (349 KB)
├── error-beacon.js
├── ui-final-touch.js
├── cloud.js
└── promptai-experience-v1.js

Feature modules (candidates for lazy-loading):
├── admin-console.js (admin features only)
├── plan-defaults.js (billing/plans - Pro/Ultimate only)
├── usage-quota-ui.js (quota display)
├── mode-flow-ui.js (main project flow)
├── home-entry-ui.js (home page)
└── project-history.js (project list)
```

---

## Code-Splitting Opportunities

### Phase 2A: Essential Optimizations

**1. Admin Bundle (Lazy-Load)**
- **Module:** `admin-console.js`
- **When:** Admin pages only (requireAdmin check)
- **Impact:** -15-20 KB first load for 80% of users
- **Priority:** HIGH

**2. Billing/Plans Bundle (Lazy-Load)**
- **Modules:** `plan-defaults.js`, pricing dialogs
- **When:** Pricing page, plan selection flow
- **Impact:** -20-25 KB first load for non-Premium users
- **Priority:** HIGH

**3. Library/Templates Bundle (Lazy-Load)**
- **Modules:** Library preview, template system
- **When:** User accesses Templates/Library menu
- **Impact:** -15-20 KB first load
- **Priority:** MEDIUM

---

## Target Metrics

### First Load (Desktop)
- **Current:** 493 KB gzip
- **Target Phase 2:** 350 KB (Guest/Free users)
- **Target Phase 3:** 280 KB (further optimization)
- **Reduction:** ~28% for core audience

### First Load (Mobile)
- **Current:** 493 KB gzip
- **Target Phase 2:** 320 KB
- **Target Phase 3:** 240 KB
- **Reduction:** ~35% for mobile users

### Core Web Vitals Targets

| Metric | Current | Target | Importance |
|--------|---------|--------|------------|
| LCP (Largest Contentful Paint) | ? | < 2.5s | ✅ Critical |
| INP (Interaction to Next Paint) | ? | < 200ms | ✅ Critical |
| CLS (Cumulative Layout Shift) | ? | < 0.1 | ✅ Critical |

---

## Implementation Roadmap

### Phase 2 (This Sprint)
- [ ] Measure current Core Web Vitals (manual testing)
- [ ] Implement admin-console lazy-loading
- [ ] Implement billing bundle lazy-loading
- [ ] Validate bundle size reduction
- [ ] Document performance improvements

### Phase 3 (Next Sprint)
- [ ] Library bundle lazy-loading
- [ ] Critical CSS extraction
- [ ] Image optimization (WebP, responsive)
- [ ] Cache strategy optimization
- [ ] Service Worker implementation

### Phase 4 (Future)
- [ ] Route-based code-splitting
- [ ] Component-level lazy-loading
- [ ] Dynamic import analysis
- [ ] Third-party script optimization

---

## Lazy-Loading Implementation Strategy

### Pattern: Dynamic Import with Fallback

```javascript
// Only load admin features if user is admin
async function loadAdminConsole() {
  if (!user.isAdmin) return;
  
  const module = await import('./admin-console.js');
  module.initAdminConsole();
}

// Only load billing features if needed
async function loadBillingDialog() {
  const module = await import('./plan-defaults.js');
  module.showPricingDialog();
}

// Preload on route change for better UX
router.on('route-change', preloadRequiredModules);
```

### Bundle Configuration

Add to `vercel.json`:
```json
{
  "functions": {
    "api/**": {
      "memory": 512,
      "maxDuration": 10
    }
  }
}
```

---

## Next Actions

1. Implement admin-console lazy-loading
2. Implement billing bundle lazy-loading
3. Measure bundle size reduction
4. Monitor Core Web Vitals with real user data
5. Create performance monitoring dashboard

---

## References

- [Web Vitals](https://web.dev/vitals/)
- [Code Splitting Best Practices](https://webpack.js.org/guides/code-splitting/)
- [Dynamic Imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Vercel Performance Optimization](https://vercel.com/docs/concepts/analytics/web-vitals)
