# Coding Conventions

**Analysis Date:** 2026-01-25

## Naming Patterns

**Files:**
- Descriptive camelCase for JavaScript modules: `timeTracker.js`, `engagementTracker.js`, `navigationTracker.js`
- Component folders use kebab-case: `demo-box-1`, `demo-box-2`, `demo-box-4`
- Page folders use lowercase: `signup`, `features`, `security`
- API handlers use lowercase: `signup.js`
- Main feature files are lowercase: `navigation.js`, `theorb.js`, `analytics.js`

**Functions:**
- Class names use PascalCase: `TimeTracker`, `NavigationTracker`, `EngagementTracker`, `ContextTracker`, `Analyzer`, `Formatter`, `AnalyticsOrchestrator`
- Method names use camelCase: `init()`, `getData()`, `handleInput()`, `formatDuration()`, `calculateSignals()`, `deriveIntent()`
- Event handlers use camelCase: `handleSubmit()`, `handlePaste()`, `stopTyping()`, `handleInput()`, `attachFormInterceptor()`
- Static utility methods use camelCase: `Analyzer.deriveIntent()`, `Formatter.format()`

**Variables:**
- camelCase for local variables and properties: `pageLoadTime`, `typingStartTime`, `maxScrollDepth`, `totalTypingDuration`, `isTyping`
- UPPERCASE_SNAKE_CASE for constants: `FORM_ID`, `GOOGLE_URL`, `storageKey`
- Private/internal properties prefixed with underscore: Not consistently observed
- Descriptive names over abbreviations: `typingDurationFormatted`, `scrollDepthFormatted` instead of shorthand

**Types/Classes:**
- PascalCase for class names: `TimeTracker`, `NavigationTracker`, `EngagementTracker`, `ContextTracker`, `Analyzer`, `Formatter`, `AnalyticsOrchestrator`
- Plural names for collections: `trackers`, `nodes`, `edges`
- Descriptive property names for data objects: `intentLevel`, `intentReasoning`, `timeToSubmitMs`, `typingDurationMs`

## Code Style

**Formatting:**
- Indentation: 2 spaces (observed in most files)
- Arrow functions: Used throughout for event listeners and callbacks
- Semicolons: Present and consistently used at end of statements
- Line length: Varies, no strict limit observed

**Linting:**
- No ESLint configuration detected (no `.eslintrc*` files)
- No Prettier configuration detected
- No formal linting enforced in codebase

**Module System:**
- ES6 modules with `import`/`export` in analytics system: `import { TimeTracker } from './trackers/timeTracker.js'`
- Mixed with direct DOM script inclusion for simple features
- Module files use `.js` extension (no `.mjs` observed)

## Import Organization

**Order:**
1. Standard library/framework imports (none in this codebase)
2. External package imports (cytoscape in `demo-box-2/script.js`)
3. Local module imports: `import { TimeTracker } from './trackers/timeTracker.js';`
4. DOM-ready handlers with `document.addEventListener('DOMContentLoaded', ...)`

**Path Aliases:**
- No path aliases detected
- Relative imports used: `./trackers/timeTracker.js`, `./analyzer.js`, `./formatter.js`
- Document selectors used instead: `document.getElementById()`, `document.querySelector()`

## Error Handling

**Patterns:**
- Try-catch blocks wrapped around initialization and data collection: `try { ... } catch (error) { console.warn(...) }`
- Graceful degradation with fallback values: Returns default data objects on error
- Console.warn() for recoverable errors (e.g., missing DOM elements, tracker initialization failures)
- Console.error() for critical failures (e.g., analytics initialization, form submission)
- Early returns on missing DOM elements: `if (!form) { console.warn(...); return; }`
- Errors are caught but don't block execution; system continues with defaults
- Default empty objects or values returned on error: `return {}`, `return []`, `return { intentLevel: 'Medium', reasoning: 'Analysis unavailable' }`

## Logging

**Framework:** Native `console` object

**Patterns:**
- `console.log()`: Success messages with emoji: `✅ Analytics system initialized`, `📦 Analytics module loaded`
- `console.warn()`: Non-critical failures: `console.warn('Tracker initialization failed:', error)`
- `console.error()`: Critical failures: `console.error('Analytics initialization failed:', error)`
- Descriptive log messages with context: `Form submitted successfully`, `Google Sheet Error`
- Form submission logs include data summary: `console.log('✅ Saved to Google Sheet: ${name} / ${email}')`

## Comments

**When to Comment:**
- File headers documenting module purpose: `/** Analytics Orchestrator - Main entry point for analytics system */`
- Class-level documentation: `/** TimeTracker - Tracks time-to-submit and typing duration */`
- Inline comments for complex logic: `// Bidirectional relationship exists`, `// Detect bidirectional relationships with "You"`
- Section markers for logical groups: Comments separating initialization from data collection

**JSDoc/TSDoc:**
- JSDoc comments on class definitions: `/** ClassName - Description */`
- JSDoc on method definitions: `/** methodName() - Brief description */`
- Parameter documentation: Not systematically used
- Return type documentation: Not systematically used

## Function Design

**Size:**
- Methods range from 5-40 lines
- Smaller tracker methods focus on specific responsibilities
- Analyzer uses static methods for signal calculation and intent derivation
- No functions appear excessively large

**Parameters:**
- Minimal parameters; prefer instance properties for state
- Event handlers accept single `event` parameter or use arrow function closure
- Static methods in Analyzer accept data object as parameter

**Return Values:**
- Consistent return objects from `getData()` methods with multiple fields
- Try-catch blocks return default/fallback objects on error
- Boolean returns from detection methods: `getInputMethod()` returns string identifier
- No undefined returns observed; always return object or fallback value

## Module Design

**Exports:**
- Named exports for classes: `export class TimeTracker { ... }`
- Classes exported directly without aliases
- Analytics.js acts as orchestrator, imports all trackers
- Formatter and Analyzer exposed as standalone utilities

**Barrel Files:**
- No barrel files (`index.js`) detected in tracked modules
- Analytics system imports directly from relative paths

## Import Statement Style

Observed import patterns:

```javascript
// Module imports with named exports
import { TimeTracker } from './trackers/timeTracker.js';
import { NavigationTracker } from './trackers/navigationTracker.js';
import { Analyzer } from './analyzer.js';

// Direct script inclusion for simpler features
document.addEventListener('DOMContentLoaded', () => { ... });
```

## Event Handling Patterns

- Event listeners use camelCase method names: `handleInput()`, `handlePaste()`, `stopTyping()`
- Passive listeners for scroll/input events: `{ passive: true }` flag used
- Capture phase listeners for form submission: `{ capture: true, once: false }`
- Event delegation used in some handlers: checks if target contains element before processing
- Arrow functions preserve `this` context in event handlers

---

*Convention analysis: 2026-01-25*
