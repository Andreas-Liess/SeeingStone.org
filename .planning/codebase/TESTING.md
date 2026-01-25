# Testing Patterns

**Analysis Date:** 2026-01-25

## Test Framework

**Status:** No testing framework detected

- No test files found (no `.test.js`, `.spec.js` files)
- No Jest, Vitest, Mocha, or other test runner configuration
- No test dependencies in package.json (package.json not found)
- No test scripts or coverage tools configured

**Code is currently untested**

## Test Infrastructure Observations

**What Would Be Needed:**
- Test runner: Jest, Vitest, or Mocha recommended for this Node.js/ES6 codebase
- Assertion library: Would need built-in or third-party assertion library
- Mock framework: For DOM mocking (JSDOM or Happy-DOM), fetch mocking, localStorage/sessionStorage simulation

## Current Testing Practices

**Manual Testing Only:**
- Code relies on manual browser testing
- Console logging used for debugging and verification: `console.log('✅ Analytics system initialized')`
- Global flags set for testing: `window.lvAnalyticsReady`, `window.lvAnalyticsData`
- Form submission tested manually through browser

## Code Structure Supporting Testing

**Modular Class Design:**
The codebase is well-structured for testing with dependency-injectable classes:

```javascript
// TimeTracker - standalone class that could be unit tested
export class TimeTracker {
  constructor() {
    this.pageLoadTime = Date.now();
    this.totalTypingDuration = 0;
    this.isTyping = false;
  }

  init() { ... }
  getData() { ... }
}
```

**Trackable Patterns:**
- State is maintained in instance properties, making it testable
- Methods are pure or have clear side effects
- Error handling wrapped in try-catch, allowing failure scenarios to be tested

## What Should Be Tested

**High Priority - Core Logic:**

1. **Analytics Orchestration** (`js/analytics/analytics.js`):
   - Constructor initializes all trackers
   - `init()` method initializes trackers without blocking on failures
   - `collectData()` aggregates data from all trackers with fallbacks
   - `attachFormInterceptor()` registers form submission handler

2. **Time Tracking** (`js/analytics/trackers/timeTracker.js`):
   - `handleInput()` starts typing session on first input
   - `stopTyping()` accumulates typing duration correctly
   - `formatDuration()` converts milliseconds to human-readable format:
     - < 60 seconds: "15s"
     - < 60 minutes: "5m 30s"
     - >= 60 minutes: "2h 15m"
   - `getData()` stops active session and returns formatted data

3. **Engagement Tracking** (`js/analytics/trackers/engagementTracker.js`):
   - `updateScrollDepth()` calculates percentage correctly
   - `handlePaste()` extracts clipboard data length
   - `handleInput()` distinguishes paste vs typed input
   - `getInputMethod()` returns correct classification:
     - "pasted" if > 80% pasted
     - "mixed" if > 20% pasted
     - "typed" if mostly typed
   - Edge cases: empty input, paste events, input clearing

4. **Navigation Tracking** (`js/analytics/trackers/navigationTracker.js`):
   - `getPageName()` extracts meaningful page identifiers from paths
   - `extractDomain()` removes www. prefix and handles invalid URLs
   - `getJourneyData()` reads/writes sessionStorage correctly
   - Journey accumulation doesn't duplicate consecutive pages
   - Referrer extraction handles direct navigation

5. **Context Tracking** (`js/analytics/trackers/contextTracker.js`):
   - Device detection (would need to verify this file exists)
   - Resolution, language, timezone extraction

6. **Intent Analysis** (`js/analytics/analyzer.js`):
   - `calculateSignals()` scores each signal 0-3:
     - Time engagement: 0 if < 30s, 1 if 30-90s, 2 if 90-180s, 3 if > 180s
     - Typing effort: 0 if < 15s, 1 if 15-45s, 2 if 45-60s, 3 if > 60s
     - Scroll engagement: 0 if < 50%, 1 if 50-70%, 2 if > 70%
     - Content exploration: 0 if no content, 1 if 1-2 pages, 2 if > 2 pages
     - Input quality: 0 if pasted, 1 if mixed, 2 if typed
   - `calculateIntentLevel()` derives intent from signal sum:
     - "High" if >= 8 points
     - "Medium" if 4-7 points
     - "Low" if 0-3 points
   - `generateReasoning()` produces human-readable explanation

7. **Data Formatting** (`js/analytics/formatter.js`):
   - `capitalizeFirst()` handles null/empty strings
   - `formatPageName()` maps internal paths to user-friendly names
   - Entire format output includes all metadata fields

**Medium Priority - Integration:**

8. **Form Submission** (`pages/signup/js/signup.js`):
   - Form submit event captured and analytics attached
   - Request sent to `/api/signup` endpoint
   - Response handling (success vs error)
   - Loading state management on button
   - Form reset on success
   - Error message display

9. **API Handler** (`api/signup.js`):
   - Request body parsed correctly
   - Data sent to Google Forms with correct field mappings
   - Error handling on network failure
   - Console logging includes name, email, intent level

**Low Priority - UI/Navigation:**

10. **Navigation Menu** (`js/navigation.js`):
    - Menu toggle on hamburger click
    - Menu closes on outside click
    - Menu closes on Escape key
    - Active link highlighting based on current path

## Testing Strategy Recommendations

**Unit Tests First:**
- Start with pure functions: `formatDuration()`, `calculateSignals()`, `capitalizeFirst()`
- Then test classes with state: `TimeTracker`, `Analyzer`, `NavigationTracker`

**DOM Testing with jsdom:**
```javascript
// Example test setup needed
import { JSDOM } from 'jsdom';
import { TimeTracker } from './js/analytics/trackers/timeTracker.js';

const dom = new JSDOM('<!DOCTYPE html><textarea id="message"></textarea>');
global.document = dom.window.document;
global.window = dom.window;

const tracker = new TimeTracker();
tracker.init();
// Test tracking behavior
```

**Mock Storage:**
- sessionStorage/localStorage mocking for NavigationTracker
- Needed for journey persistence testing

**Event Simulation:**
- Simulate input events for typing detection
- Simulate paste events for engagement tracking
- Simulate scroll events for scroll depth

## Current Error Handling (Testable)

All critical paths wrapped in try-catch:

```javascript
// Pattern used throughout
try {
  // Operation
  tracker.init();
} catch (error) {
  console.warn('Tracker initialization failed:', error);
  // Continue with defaults
}
```

Errors don't block execution - system always returns fallback data. This is good for resilience but makes testing error paths important to ensure fallbacks work.

## Coverage Gaps

**Untested Areas:**
- `ContextTracker.js`: Device/resolution/language detection logic not examined
- Complex interaction flows: multiple form submissions, page navigations
- Edge cases in date/time calculations
- Timezone handling in formatting
- Browser compatibility issues (e.g., sessionStorage availability)
- Network error scenarios in signup submission
- Analytics system initialization without form present

## Recommended Test Suite Structure

```
tests/
├── unit/
│   ├── analyzer.test.js        # Intent calculation logic
│   ├── formatter.test.js       # Output formatting
│   ├── timeTracker.test.js     # Duration tracking
│   ├── engagementTracker.test.js   # Scroll and input detection
│   └── navigationTracker.test.js   # Journey tracking
├── integration/
│   ├── analytics.test.js       # Orchestrator initialization
│   └── formSubmission.test.js  # End-to-end form flow
└── fixtures/
    ├── mockData.js             # Test data generators
    └── mockDOM.js              # DOM setup helpers
```

---

*Testing analysis: 2026-01-25*
