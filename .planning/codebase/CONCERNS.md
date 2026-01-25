# Codebase Concerns

**Analysis Date:** 2026-01-25

## Security Issues

**Hardcoded Google Forms ID:**
- Issue: Google Forms endpoint ID hardcoded directly in source code
- Files: `api/signup.js` (line 5)
- Details: `const FORM_ID = '1FAIpQLScQQhkDqiSSsq7R3jdKaroPv3yjtNrgHmHv7g_XhIZo81YDUQ'`
- Impact: ID is exposed in Git history, client-side inspection, public repositories. If Google Form is disabled or replaced, code must be redeployed
- Fix approach: Move FORM_ID to environment variable (Vercel secret) and access via process.env in `api/signup.js`. Implement backend-only endpoint that never exposes Form ID to client

**Missing Cross-Origin Handling:**
- Issue: `api/signup.js` does not set CORS headers
- Files: `api/signup.js`
- Impact: If frontend is served from different domain than Vercel API, requests will fail. No CORS header validation means potential cross-origin submission abuse
- Fix approach: Add explicit CORS headers in response; validate Origin header or use same-origin deployment

**No Input Validation on Server:**
- Issue: `api/signup.js` passes form data directly to Google Forms without sanitization
- Files: `api/signup.js` (lines 16-21)
- Impact: Malicious actors can submit XSS payloads, SQL injection attempts (if later connected to database), or oversized data. Google Forms may fail silently
- Fix approach: Implement server-side validation: check email format, sanitize strings, validate data types, enforce field length limits before submission

**Analytics Data Exposure:**
- Issue: Sensitive analytics data (intent level, typing patterns, scroll depth) sent to Google Forms
- Files: `api/signup.js`, `js/analytics/analytics.js`
- Impact: User behavioral data captured without explicit consent; data privacy implications for "sovereign European infrastructure" claim
- Fix approach: Add privacy notice on signup page; implement opt-in for analytics; consider GDPR/consent requirements

## Fragile Areas

**Analytics System Fragility:**
- Files: `js/analytics/analytics.js`, `js/analytics/trackers/*.js`, `pages/signup/js/signup.js`
- Why fragile:
  - System depends on form ID `signup-form` existing in DOM (line 45 in analytics.js) - if renamed/removed, analytics silently disables without warning
  - Five independent trackers (TimeTracker, NavigationTracker, EngagementTracker, ContextTracker, Analyzer) each have try-catch blocks that swallow errors - failures are invisible to end users
  - Navigation tracker uses hardcoded page name mappings (line 89-94 in navigationTracker.js) - new pages break journey tracking silently
  - Each tracker fails independently without cascading errors, making debugging difficult
- Safe modification:
  - Add defensive check: log warning if form element not found
  - Create shared analytics error handler that aggregates failures
  - Refactor page name mappings to auto-detect from pathname or accept config parameter
  - Add integration test that verifies all trackers initialize correctly

**sessionStorage Dependency:**
- Files: `js/analytics/trackers/navigationTracker.js`
- Why fragile:
  - Journey data stored in sessionStorage (line 73, 82); if storage quota exceeded or disabled, data silently lost
  - No validation that sessionStorage is available before use - fails silently on some browsers
  - sessionStorage cleared on browser close - analytics data lost across sessions
- Safe modification:
  - Check sessionStorage availability at init time
  - Add explicit error logging if storage fails
  - Consider fallback to in-memory storage if sessionStorage unavailable

**Demo Box Component Size:**
- Files: `components/demo-box-2/script.js` (268 lines), `components/demo-box-1/script.js` (213 lines)
- Why fragile:
  - Demo-box-2 contains hardcoded data for 20+ people with complex relationship mappings
  - No data validation - if connection targets don't exist, graph rendering fails silently
  - Cytoscape layout calculation (concentric) depends on exact node count - too many nodes breaks layout
  - Color logic splits nodes into 3 categories but has no validation bounds
- Safe modification:
  - Extract hardcoded data to separate JSON file with schema validation
  - Add bounds checking for node count before rendering
  - Validate all connection targets exist in nodes set

**Form Submission Error Handling:**
- Files: `pages/signup/js/signup.js` (line 49-59)
- Why fragile:
  - Generic error message shown on any fetch failure (network, timeout, server error, malformed response)
  - No retry logic - single failed submission ends interaction
  - Button state reset happens even if error is not recoverable
  - Form data cleared on success but not persisted if failure - user loses typed content
- Safe modification:
  - Distinguish between client errors (validation) and server errors (retry-able)
  - Implement exponential backoff for retries
  - Preserve form data in localStorage on failure so user doesn't retype
  - Show specific error messages (network timeout vs server error vs validation)

## Test Coverage Gaps

**Analytics Orchestrator - No Tests:**
- What's not tested: Core orchestration logic in `js/analytics/analytics.js` - initialization, tracker coordination, data collection
- Files: `js/analytics/analytics.js`
- Risk: Analytics system initialization order matters but is untested; if tracker fails, entire submission may fail silently
- Priority: High (critical user flow)

**Form Submission - No Tests:**
- What's not tested: Form submission flow, error handling, API integration
- Files: `pages/signup/js/signup.js`, `api/signup.js`
- Risk: Changes to form fields, validation, or API endpoint break silently; no regression detection
- Priority: High (core conversion funnel)

**Navigation Tracker Page Mapping - No Tests:**
- What's not tested: Page name extraction logic, journey formatting, edge cases
- Files: `js/analytics/trackers/navigationTracker.js`
- Risk: New pages added without updating mappings will show as "Unknown" journey; tracking breaks silently
- Priority: Medium (data quality)

**Intent Analyzer Scoring - No Tests:**
- What's not tested: Signal calculation, intent level thresholds, reasoning generation
- Files: `js/analytics/analyzer.js`
- Risk: Intent scoring logic has hardcoded thresholds (lines 35-43) but no tests verify they work correctly; changes risk misclassification
- Priority: Medium (analytics accuracy)

**Engagement Tracker Paste Detection - No Tests:**
- What's not tested: Paste event handling, typed vs pasted ratio calculation
- Files: `js/analytics/trackers/engagementTracker.js`
- Risk: Paste detection logic (line 64) may not catch all paste methods; ratio calculations (line 79-82) have magic numbers (0.8, 0.2) without justification
- Priority: Low (feature accuracy)

**Demo Components - No Tests:**
- What's not tested: Cytoscape graph rendering, node highlighting, edge detection
- Files: `components/demo-box-1/script.js`, `components/demo-box-2/script.js`
- Risk: Graph visualization may break with different data shapes; interactive features (node selection, zoom) untested
- Priority: Medium (demo credibility)

## Scaling Limits

**Hardcoded Page Mappings:**
- Current capacity: 4 pages hardcoded (Home, Signup, Features, Security)
- Limit: When more pages added, navigationTracker.js must be manually updated
- Scaling path: Generate page mappings dynamically from DOM data attributes or pathname patterns instead of hardcoded dictionary

**Demo Box 2 Network Graph:**
- Current capacity: ~20 nodes, ~30 edges
- Limit: Cytoscape concentric layout (line 218-229) becomes crowded beyond ~50 nodes; label collision at 100+ nodes
- Scaling path: Implement force-directed layout or cluster layout for larger graphs; add pan/zoom controls

**Analytics Data Window:**
- Current capacity: Single signup form session
- Limit: Journey data in sessionStorage cleared on browser close; no persistent analytics history
- Scaling path: Archive analytics to backend database; implement retention policy; add analytics dashboard

## Known Bugs

**Intent Analysis Fallback:**
- Symptoms: When all signals are 0, returns "Standard interaction" instead of "Low"
- Files: `js/analytics/analyzer.js` (line 115-116)
- Trigger: User submits form without scrolling, typing, or exploring any pages
- Workaround: Current behavior is acceptable (identifies passive submissions) but inconsistent with scoring logic
- Fix: Ensure fallback message aligns with Low intent categorization

**Console Logging in Production:**
- Symptoms: Debug/success logs appear in production console
- Files: `api/signup.js` (lines 25, 27), `js/analytics/analytics.js` (line 38, 70), multiple tracker files
- Trigger: Any form submission or page load with analytics
- Workaround: Disable in browser console settings (not user-facing)
- Impact: Minor (UX smell, no functional impact); should be removed or gated behind environment flag

**sessionStorage Quota Error Silent:**
- Symptoms: Navigation tracker fails to save journey if storage quota exceeded, but no error shown
- Files: `js/analytics/trackers/navigationTracker.js` (line 84)
- Trigger: Rare - requires user to visit many different pages with large URL parameters
- Workaround: None visible to user
- Fix: Implement quota checking before writes; log warning; fall back to in-memory tracking

## Performance Bottlenecks

**Typing Animation Speed:**
- Problem: Character-by-character typing animation in demo-box-1 with 20ms delay per character
- Files: `components/demo-box-1/script.js` (line 89, speed parameter)
- Cause: Script delays 50ms for user input typing, 30ms for thinking, 10ms for fast sections - slow feedback on slower devices
- Improvement path: Reduce delays (20ms → 5ms), add skip/play-faster button, or gait animation speed based on device performance (window.requestIdleCallback)

**DOM Updates in Analytics:**
- Problem: Analytics system captures form submission data but HTML is stringified (line 10 in signup.js: `JSON.stringify(analytics)`)
- Files: `pages/signup/js/signup.js`, `api/signup.js`
- Cause: Analytics object with all tracker data is serialized on every submission
- Improvement path: Trim non-essential fields before submission, implement compression if data exceeds threshold

**Cytoscape Graph Rendering:**
- Problem: Graph re-renders entire visualization on any event (click, resize)
- Files: `components/demo-box-2/script.js` (line 264-267)
- Cause: Window resize triggers `cy.fit()` which recalculates layout for all nodes/edges
- Improvement path: Debounce resize events, use requestAnimationFrame for layout recalculation, add virtual rendering for large graphs

## Tech Debt

**Mixed CSS Architecture:**
- Issue: Legacy `css/` directory exists alongside new `css-new/`
- Files: `css/`, `css-new/`
- Impact: Confusion about which styles are active; duplication risk; CSS selector conflicts
- Fix approach: Audit all HTML files to identify which CSS is imported; deprecate unused styles; remove `css/` directory

**Inconsistent Error Handling Strategy:**
- Issue: Analytics system uses `console.warn()` for all errors, signup form uses message UI, API uses res.status()
- Files: `js/analytics/*.js`, `pages/signup/js/signup.js`, `api/signup.js`
- Impact: No unified error handling; difficult to instrument monitoring/alerting
- Fix approach: Create centralized error handler; standardize on error codes and messages

**Hardcoded Configuration Values:**
- Issue: Multiple hardcoded thresholds and constants scattered across files
- Files: `js/analytics/analyzer.js` (lines 35-43: time/typing thresholds), `js/analytics/trackers/engagementTracker.js` (lines 79-82: paste ratios), `js/analytics/trackers/navigationTracker.js` (line 223-226: layout concentric values)
- Impact: Constants must be changed in multiple places; no clear documentation of intent
- Fix approach: Create config object in single location, import across modules

**Module Pattern Without Build Tool:**
- Issue: Using ES6 import/export syntax without bundler (Webpack, Vite, etc.)
- Files: All `js/analytics/` files
- Impact: Depends on browser module support; no tree-shaking or optimization; larger bundle size than necessary
- Fix approach: Implement simple module bundler or migrate to Vercel Functions for all logic

## Dependencies at Risk

**Google Forms Integration - Deprecated Backend:**
- Risk: Google Forms API not officially recommended for programmatic use; form structure changes break integration
- Impact: If Google changes form ID validation or endpoint, signup flow fails entirely
- Current mitigation: Direct HTTPS POST to undocumented endpoint; no error handling for endpoint changes
- Migration plan: Replace with Vercel Postgres database + custom form handler, or migrate to Supabase for European data residency

**Cytoscape.js - Large Dependency:**
- Risk: Cytoscape is unmaintained library; no updates for newer browser APIs
- Impact: Only used in demo-box-2 component; not essential to core product
- Current mitigation: No known issues; library is stable but old
- Migration plan: Consider lightweight alternatives (vis.js, D3.js) or evaluate if graph demo is necessary; alternatively, pre-render graph as SVG

**Browser sessionStorage Dependency:**
- Risk: sessionStorage behavior varies across browsers (private browsing often disables it); no fallback
- Impact: Navigation tracking fails silently on some browsers
- Current mitigation: None
- Migration plan: Add fallback to in-memory storage; detect availability at init time

## Missing Critical Features

**No Privacy/Consent Management:**
- Problem: Analytics system captures user behavior (scrolling, typing timing, device info) without consent mechanisms
- Blocks: Cannot comply with GDPR/CCPA without consent UI
- Impact: Legal risk for European users ("sovereign European infrastructure" claim undermined)
- Recommendation: Implement consent banner with granular analytics opt-in; store consent preference in localStorage

**No Rate Limiting on API:**
- Problem: `api/signup.js` endpoint accepts unlimited submissions without validation
- Blocks: Vulnerable to spam/DDoS; no protection for Google Forms quota
- Impact: Form could be flooded with invalid data
- Recommendation: Add rate limiting (Vercel middleware), implement CAPTCHA, validate email domain

**No Monitoring/Alerting:**
- Problem: Form submission errors log to console only; no way to detect production issues
- Blocks: Cannot monitor signup conversion funnel; silent failures go unnoticed
- Impact: Unknown submission loss/failure rate
- Recommendation: Integrate error tracking (Sentry, LogRocket); add metrics logging

## Code Quality Issues

**Inline Hardcoded Data in Components:**
- Issue: Demo components contain large hardcoded data structures (demo-box-1, demo-box-2)
- Files: `components/demo-box-1/script.js` (lines 13-51 data), `components/demo-box-2/script.js` (lines 2-85 data)
- Impact: Makes components unmaintainable; difficult to test; prevents component reuse
- Recommendation: Extract to JSON files; implement data loader

**Magic Numbers Without Documentation:**
- Issue: Scoring thresholds, timings, ratios appear without explanation
- Files: `js/analytics/analyzer.js`, `js/analytics/trackers/engagementTracker.js`
- Impact: Changes to thresholds require understanding entire scoring algorithm
- Recommendation: Add constants with named explanations; document intent scoring methodology

**No Input Sanitization:**
- Issue: Form inputs sent directly to Google Forms without encoding/validation
- Files: `api/signup.js` (lines 16-21)
- Impact: Potential for form field injection if Google Forms field structure changes
- Recommendation: Use form encoding (already using URLSearchParams), add whitelist validation

---

*Concerns audit: 2026-01-25*
