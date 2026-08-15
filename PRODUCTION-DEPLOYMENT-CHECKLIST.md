# Production Deployment Checklist

**Purpose:** Final verification before deploying PromptPrompter to production  
**Last Updated:** August 15, 2026  
**Target Deployment:** September 15, 2026  
**Estimated Time:** 4 hours (initial setup), 30 minutes (per deployment)

---

## Pre-Deployment Verification (4 hours)

### ✅ Security Audit
- [ ] All secrets moved to environment variables
- [ ] No API keys in code or git history
- [ ] CORS headers properly configured
- [ ] CSP (Content Security Policy) headers set
- [ ] X-Frame-Options, X-Content-Type-Options headers added
- [ ] Rate limiting configured on all APIs
- [ ] Authentication tokens properly validated
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection tokens implemented
- [ ] Session timeout configured (30 min idle)
- [ ] Password requirements enforced
- [ ] Two-factor authentication available (optional)
- [ ] Audit logging enabled for admin actions

### ✅ Performance Verification
- [ ] Initial bundle size < 250KB (app.js)
- [ ] CSS < 30KB (critical, inlined)
- [ ] No render-blocking resources above fold
- [ ] Lazy loading implemented for modules
- [ ] Code-splitting verified (admin/billing/legal)
- [ ] Service worker registered and tested
- [ ] Cache headers configured on server
- [ ] Images optimized (WebP with fallbacks)
- [ ] Fonts optimized (font-display: swap)
- [ ] Core Web Vitals targets met:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Time to Interactive < 3.5s
- [ ] Lighthouse score > 90
- [ ] No console errors in production build

### ✅ Accessibility Compliance
- [ ] WCAG 2.1 Level AA compliance verified
- [ ] Keyboard navigation works on all pages
- [ ] Focus indicators visible and logical
- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] Heading hierarchy correct (single H1)
- [ ] Color contrast meets AA standard (4.5:1)
- [ ] Touch targets ≥ 44×44px
- [ ] Aria labels and roles appropriate
- [ ] Screen reader testing completed
- [ ] Error messages associated with fields
- [ ] Skip links functional

### ✅ Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)
- [ ] No console errors in any browser
- [ ] No layout shifts or visual bugs

### ✅ Mobile Testing
- [ ] Touch interactions work smoothly
- [ ] Viewport meta tag correct
- [ ] No horizontal scroll on mobile
- [ ] Mobile navigation functional
- [ ] Forms usable on mobile
- [ ] Loading states clear
- [ ] Error handling clear
- [ ] Tested on 375px (mobile) viewport
- [ ] Tested on 768px (tablet) viewport
- [ ] Tested on 1024px+ (desktop) viewport

### ✅ API Integration Testing
- [ ] All API endpoints return expected status codes
- [ ] Error responses properly formatted
- [ ] Rate limiting tested and working
- [ ] API authentication verified
- [ ] Request/response validation working
- [ ] Timeouts configured (30s default)
- [ ] Retry logic tested
- [ ] API monitoring enabled

### ✅ Database & Data
- [ ] Database backups automated
- [ ] Data migration scripts tested
- [ ] Schema validation working
- [ ] Connection pooling configured
- [ ] Query performance optimized (indexed)
- [ ] No N+1 queries
- [ ] Transaction handling correct
- [ ] Data encryption enabled (in transit + at rest)

### ✅ Error Handling & Logging
- [ ] Global error boundary functional
- [ ] Sentry integration verified
- [ ] Error logging to /api/errors working
- [ ] Performance metrics tracked
- [ ] User analytics collecting
- [ ] Uptime monitoring active
- [ ] Health check endpoint working
- [ ] Log retention policy set (30 days min)
- [ ] Error alerting configured
- [ ] Logs accessible in production dashboard

### ✅ Monitoring & Alerting
- [ ] Sentry project created and configured
- [ ] Error tracking verified
- [ ] Performance monitoring active
- [ ] Alert rules configured:
  - [ ] High error rate (> 5% of requests)
  - [ ] Slow API responses (> 5s)
  - [ ] Downtime alerts
  - [ ] Budget alerts (if using services with quotas)
- [ ] Slack/Email notifications setup
- [ ] Dashboard created for team

### ✅ Documentation
- [ ] README.md updated with deployment info
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed
- [ ] Troubleshooting guide created
- [ ] Code comments for complex logic
- [ ] Architecture decision records (ADRs) written

### ✅ User Testing
- [ ] 5+ test users from different tiers
- [ ] Accessibility testing with screen reader users
- [ ] Performance testing on slow networks (3G)
- [ ] User feedback collected and reviewed
- [ ] Critical issues resolved
- [ ] Nice-to-have feedback documented for later
- [ ] A/B tests planned (if applicable)

---

## Deployment Steps (Per Deployment)

### Step 1: Pre-Deployment (5 min)
```bash
# Create backup
pg_dump promptprompter > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
npm run migrate:prod

# Verify no uncommitted changes
git status

# Tag release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### Step 2: Build & Test (10 min)
```bash
# Install dependencies
npm ci

# Run tests
npm run test:e2e
npm run test:accessibility

# Build
npm run build

# Verify build size
npm run analyze:bundle
```

### Step 3: Deploy (10 min)
```bash
# Deploy to staging first
vercel deploy --prebuilt --prod

# Smoke tests on staging
npm run test:smoke -- https://staging.promptprompter.com

# Deploy to production
vercel promote <deployment-url>

# Verify production deployment
curl -I https://promptprompter.com/
```

### Step 4: Post-Deployment (5 min)
- [ ] Verify site loads without errors
- [ ] Check Sentry dashboard for errors
- [ ] Verify analytics data flowing
- [ ] Test critical user flows:
  - [ ] Login/Registration
  - [ ] Project creation
  - [ ] Mode selection
  - [ ] Prompt generation
  - [ ] Project saving
- [ ] Check API response times
- [ ] Review Lighthouse score
- [ ] Monitor error rates for 1 hour

### Step 5: Communication (5 min)
- [ ] Notify team of successful deployment
- [ ] Update status page
- [ ] Post to changelog
- [ ] Monitor support channels for issues

---

## Rollback Procedure

If critical issues found:

```bash
# Option 1: Revert to previous deployment
vercel rollback

# Option 2: Restore from database backup
psql promptprompter < backup-$(date -d "1 hour ago" +%Y%m%d-%H%M%S).sql

# Option 3: Deploy previous version
git revert HEAD
git push origin main
vercel deploy --prebuilt --prod
```

---

## Post-Deployment Monitoring (First 24 hours)

### Hour 1: Intensive Monitoring
- [ ] Error rate < 1%
- [ ] API response times normal
- [ ] Database performance normal
- [ ] No spike in user reports
- [ ] Sentry showing no critical errors

### Hours 2-6: Active Monitoring
- [ ] Check every 30 minutes
- [ ] Monitor analytics trends
- [ ] Verify all API endpoints
- [ ] Check rate limiting not too strict

### Hours 7-24: Regular Monitoring
- [ ] Check every 2 hours
- [ ] Verify user feedback
- [ ] Review error logs
- [ ] Monitor resource usage

---

## Sign-Off

- [ ] Security audit passed: _________________ (Date)
- [ ] Performance targets met: _________________ (Date)
- [ ] Accessibility verified: _________________ (Date)
- [ ] Testing complete: _________________ (Date)
- [ ] Deployment manager approval: _________________ (Date)

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | TBD | Planning | Initial production release |
| 1.0.1 | TBD | TBD | Post-launch fixes (if needed) |
| 1.1.0 | TBD | TBD | Phase 2 features |

---

## Emergency Contacts

- **On-Call Engineer:** [Name] - [Phone]
- **Engineering Manager:** [Name] - [Phone]
- **CTO:** [Name] - [Email]
- **Support Lead:** [Name] - [Phone]

---

## Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables](./ENV_TEMPLATE.md)
- [API Documentation](./docs/API.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

---

**Last Verification:** August 15, 2026  
**Next Review:** September 1, 2026 (2 weeks before deployment)
