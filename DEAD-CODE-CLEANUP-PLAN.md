# Dead Code Cleanup Plan

**Status:** Analysis Complete - Awaiting Manual Review  
**Date:** 2026-08-15  
**Risk Level:** HIGH (357KB app.js file - requires careful review)

---

## Analysis Summary

The dead code analyzer identified:
- **45 unused functions** - Should be reviewed before removal
- **60+ unused CSS classes** - Lower risk, can be removed more safely
- **30+ unused exports** - These are newer integration exports (safe to ignore for now)

---

## Risk Assessment

### HIGH RISK - Do NOT Auto-Delete
- Functions in `app.js` (357KB) - Single massive file, interdependencies unclear
- Functions in core modules - May be called dynamically or from legacy code
- Exported utilities - May be used by external code or future features

### MEDIUM RISK - Review Required
- Unused functions in `admin-*.js` - Can be reviewed in isolation
- Unused functions in `server/*.js` - Backend code, review needed
- CSS classes in `styles.css` - May have pseudo-class variations

### LOW RISK - Safe to Remove
- Test utilities (test files only)
- Duplicate exports in Phase 3+ modules (internal only)
- CSS classes with no variants

---

## Unused Functions Identified (45 total)

### In app.js (Core Application - HIGH RISK)
```javascript
onCancel()        - Dialog handler
priorities()      - Config function
domainLabel()     - Label generator
system()          - System config
mods()            - Module list
skills()          - Skills list
unanswered()      - Question check
elapsed()         - Time calculation
hasAnyUnresolved()- Validation check
heading()         - Element creator
list()            - List builder
answer()          - Response handler
number()          - Number formatter
templates()       - Template getter
modules()         - Module getter
wanted()          - Selection checker
```
**Action:** REVIEW IN CONTEXT before removal. May have subtle dependencies.

### In Admin Modules (MEDIUM RISK)
```javascript
admin-console-core.js:
  stored()        - Storage check

admin-prompts-ui.js:
  placeholders()  - Placeholder generator

admin-tokens-ui.js:
  row()           - Row builder
```
**Action:** Safe to remove after verifying admin console doesn't break.

### In Server Code (MEDIUM RISK)
```javascript
api/admin-action.js:
  known()         - Known check
  version()       - Version info

api/admin-overview.js:
  users()         - User list

server/generate-core.js:
  warnings()      - Warning filter
  blockers()      - Blocker filter

server/learning-hints.js:
  rows()          - Row formatter

server/stripe-rest.js:
  exact()         - Exact matcher
  byName()        - Name matcher
  byMeta()        - Meta matcher
```
**Action:** Review server endpoints to ensure these helpers aren't needed.

### In UI Modules (LOW-MEDIUM RISK)
```javascript
dialog-accessibility.js:
  tabHandler()    - Tab behavior

entry-gate-ui.js:
  reveal()        - Reveal function

project-state.js:
  exists()        - Existence check
  masterPrompt()  - Prompt getter

stability-ui.js:
  wrapped()       - Wrapper function

streamlined-project-flow.js:
  advance()       - State advance

system-ai-studio.js:
  plans()         - Plan config
```
**Action:** Review in module context, likely safe to remove.

### In Phase 3 Test Files (LOW RISK)
```javascript
tests/prompt-templates.test.mjs:
  MODEL_GONE()    - Test constant

tests/smoke.test.mjs:
  files()         - Test helper
  framing()       - Test setup
```
**Action:** Safe to remove - test-only code.

### In theme-init.js (LOW RISK)
```javascript
FLASH_MS()        - Animation timing
```
**Action:** Check if used in CSS animations before removing.

---

## Unused CSS Classes (60+ identified)

### High-Priority Removals (Safe)
```css
.sandbox-card              - Old sandbox UI
.subscription-card         - Old billing UI
.prompt-command-field      - Deprecated field
.prompt-flow-button        - Old flow button
.prompt-boot-mark          - Old boot state
.suggested-answer          - Deprecated answer
.gate-highlights           - Old gate UI
```
**Action:** Remove safely - old UI patterns.

### Medium-Priority (Verify First)
```css
.account-intro             - Old account section (appears 3x)
.welcome-intro-body        - Old welcome page
.intro-close               - Old intro control
.system-ai-note            - Old note style
.welcome-actions           - Old welcome UI
.welcome-features          - Old feature list
.profile-picker-row        - Old profile UI
.cloud-projects            - Old cloud UI
```
**Action:** Check if replacements exist in new components.

### Low-Priority (Mostly Decorative)
```css
.conn-slot-index           - Connection UI
.guided-auto-loading       - Loading state
.flow-transition-compact   - Animation class
.prompt-picker-menu        - Old picker
.welcome-tools             - Old tool list
.plan-summary              - Old plan display
.icon-button               - Duplicate button style
```
**Action:** Safe to remove if not used in animations.

---

## Removal Strategy

### Phase 1: CSS Cleanup (LOW RISK)
**Approach:** Start with CSS since it's easier to verify visually

1. Create backup of `styles.css`
2. Remove clearly unused classes (group 1: 8 classes)
3. Test UI in browser - check no visual breaks
4. Commit with note "Minor CSS cleanup"
5. Test on mobile/desktop/dark mode

**Estimated Impact:** -5-10KB from CSS file

### Phase 2: Server Code Cleanup (MEDIUM RISK)
**Approach:** Server code is isolated from UI

1. Review each unused function's definition and callers
2. Use grep to confirm no calls exist
3. Create backup of each file
4. Remove identified unused functions
5. Run server tests (if exist)
6. Verify API endpoints still work

**Estimated Impact:** -2-4KB from server files

### Phase 3: Admin UI Cleanup (MEDIUM RISK)
**Approach:** Admin modules are feature-isolated

1. Review admin function usage
2. Backup admin files
3. Remove unused functions
4. Test admin console in browser
5. Verify admin features work

**Estimated Impact:** -1-2KB from admin files

### Phase 4: Core app.js Cleanup (HIGH RISK - DEFER)
**Approach:** Only after extensive testing

1. Create detailed dependency map
2. Review each function's usage context
3. Check for dynamic function calls (eval, Function(), etc.)
4. Remove only well-confirmed unused functions
5. Run full E2E test suite
6. Monitor in production for 1 week

**Estimated Impact:** -5-15KB from app.js (varies by removal count)
**Risk:** HIGH - interdependencies unclear in massive file

**Recommendation:** Only remove 5-10 safest functions in Phase 1

---

## Recommended Phased Approach

### NOW (Low Risk)
- [ ] Remove CSS classes: 8 unused, low risk
- [ ] Remove test utilities: 3 functions in test files
- [ ] Commit as "Clean up unused CSS and test code"

### AFTER TESTING (Medium Risk)
- [ ] Remove server helpers: 8 functions
- [ ] Remove admin UI utilities: 3 functions
- [ ] Test server endpoints
- [ ] Commit as "Clean up server and admin utilities"

### PRODUCTION+ (High Risk - Optional)
- [ ] Profile app.js with Chrome DevTools
- [ ] Identify actually unused app.js functions
- [ ] Remove only top 5 safest candidates
- [ ] Monitor for 1 week
- [ ] Remove more if stable

---

## Verification Checklist

Before removing each function:
- [ ] Grep entire codebase for function name
- [ ] Check for dynamic calls (string references)
- [ ] Check for method references (Function.prototype)
- [ ] Review git history for recent additions
- [ ] Check related test files
- [ ] Verify no comments reference it

---

## Backup Strategy

Before any cleanup:
```bash
git stash
git checkout -b cleanup/dead-code-phase1
# Make changes
git add .
git commit -m "cleanup: Remove unused CSS and test utilities"
# Test thoroughly
# Then push or merge to main branch
```

---

## Impact Prediction

After complete cleanup (conservative estimate):
- CSS: 144KB → 135KB (-9KB)
- JS server: ~50KB → 46KB (-4KB)
- JS admin: ~75KB → 72KB (-3KB)
- JS app.js: 357KB → 352KB (-5KB, if removing 10 safe functions)
- **Total savings: ~21KB (5-6% of assets)**

With gzip:
- Current: ~65KB
- After cleanup: ~62KB
- Savings: ~3KB per user

---

## Files to Review

**Critical Path:**
1. `styles.css` - CSS classes (safe to review)
2. `server/generate-core.js` - Server utilities (review needed)
3. `admin-console-core.js` - Admin code (isolated)
4. `tests/dead-code-analyzer.mjs` - Source of this analysis

**Do Not Touch Without Testing:**
1. `app.js` - Too large, too risky
2. `cloud.js` - External integration
3. `server/prices.js` - Business logic

---

## Next Steps

1. **Review this plan** - Confirm approach with team
2. **Start Phase 1** - CSS cleanup (safest)
3. **Test thoroughly** - Visual regression testing
4. **Iterate carefully** - One removal at a time for high-risk code
5. **Monitor metrics** - Bundle size, performance
6. **Document findings** - Build institutional knowledge

---

## Notes

- The dead code analyzer may have false positives (functions called dynamically)
- app.js is 357KB - single largest file, needs profiling
- CSS cleanup is safest - visible immediately if broken
- Server code cleanup is next - isolated from UI
- Full app.js cleanup should be deferred until profiling shows real impact

---

**Status:** Ready for Phase 1 CSS Cleanup  
**Estimated Time:** 1-2 hours for full cleanup  
**Risk Rating:** Start LOW, escalate carefully

