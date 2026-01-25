# Architecture

**Analysis Date:** 2026-01-25

## Pattern Overview

**Overall:** Multi-page Static Site with Interactive Demos and Analytics Collection

**Key Characteristics:**
- Server-rendered HTML pages with client-side interactivity
- Component-based demo boxes as isolated HTML/JS/CSS modules
- Modular analytics system with tracker composition pattern
- Centralized design system via CSS variables
- Vercel serverless function for form submissions

## Layers

**Presentation Layer:**
- Purpose: Render UI, handle interactions, display analytics
- Location: `index.html`, `pages/*/index.html`, `components/demo-box-*/index.html`
- Contains: HTML markup, inline styles, page-specific logic
- Depends on: CSS system (`css-new/`), shared JS utilities (`js/navigation.js`), analytics module
- Used by: Direct user interaction through browser

**Component Layer:**
- Purpose: Encapsulate reusable UI modules with self-contained logic
- Location: `components/demo-box-1/`, `demo-box-2/`, `demo-box-3/`, `demo-box-4/`
- Contains: `index.html`, `script.js`, `style.css` per component
- Depends on: External libraries (Cytoscape for graphs), base styles
- Used by: Main pages via `<iframe>` embeds

**Styling System:**
- Purpose: Centralized design tokens and component styles
- Location: `css-new/` directory
- Contains: `global.css` (variables and reset), `layout.css` (grid/container system), `components.css` (reusable component styles), `main.css` (orchestrator)
- Depends on: CSS variables defined in `global.css`
- Used by: All HTML pages

**Analytics Layer:**
- Purpose: Track user behavior across pages, collect contextual data, derive intent
- Location: `js/analytics/`
- Contains: `analytics.js` (orchestrator), `analyzer.js` (intent derivation), `formatter.js` (data formatting), `trackers/` (specialized trackers)
- Depends on: Individual tracker modules
- Used by: Signup form submission

**API/Backend Layer:**
- Purpose: Handle form submission and data persistence
- Location: `api/signup.js` (Vercel serverless function)
- Contains: Google Forms submission, Vercel logging
- Depends on: External Google Forms endpoint
- Used by: Signup form in `pages/signup/index.html`

**Navigation/Shared Utilities:**
- Purpose: Cross-page navigation, mobile menu, active state detection
- Location: `js/navigation.js`
- Contains: Hamburger menu logic, active link highlighting, Escape key handling
- Depends on: DOM selectors
- Used by: All pages via script tag

## Data Flow

**User Access Landing Page:**

1. Browser loads `index.html` (root)
2. CSS system loads via `css-new/main.css` → cascades `global.css`, `layout.css`, `components.css`
3. Navigation script initializes (`js/navigation.js`) - detects current page, toggles mobile menu
4. Main demo component loads via `<iframe>` from `components/demo-box-1/index.html`
5. Demo component initializes internal state and renders visualization

**Form Submission Flow:**

1. User fills form in `pages/signup/index.html`
2. Analytics module initializes on page load (via `<script type="module" src="js/analytics/analytics.js">`)
3. Analytics orchestrator subscribes to form submit event at capture phase
4. On submit, analytics collects data from all trackers (time, navigation, engagement, context)
5. Analyzer derives intent level from collected data
6. Structured analytics data stored in `window.lvAnalyticsData`
7. Form submission proceeds to `/api/signup` via fetch
8. Backend handler receives form data + analytics payload
9. Data POSTed to Google Forms endpoint and logged to Vercel console

**Tab Switching on Features Page:**

1. User clicks tab button in `pages/features/index.html`
2. `switchTab()` function hides all demo frames
3. Selected frame becomes visible, explanation text updates
4. IFrame with corresponding demo component loads

**State Management:**

- Client-side state: DOM class toggling (`.active`, `.open` states)
- Local state in analytics trackers: Time markers, navigation history, engagement counts
- Global state: `window.lvAnalyticsData` (submitted before form submission), `window.lvAnalyticsReady` (module readiness flag)
- Persistent state: None (stateless site)

## Key Abstractions

**Demo Box Component:**
- Purpose: Standardized container for interactive demonstrations
- Examples: `components/demo-box-1/` (Agent reasoning flow), `demo-box-2/` (Network graph), `demo-box-3/` (Thread extraction), `demo-box-4/` (Protocol manager)
- Pattern: Each has isolated HTML, script, CSS; loads via iframe; communicates only via visual rendering

**Analytics Tracker:**
- Purpose: Specialized data collection for one dimension of behavior
- Examples: `TimeTracker` (session duration, typing time), `NavigationTracker` (page history, entry/exit), `EngagementTracker` (scroll depth, interactions), `ContextTracker` (device, timezone, language)
- Pattern: All trackers have `.init()` and `.getData()` methods; compose into Orchestrator

**Design Tokens (CSS Variables):**
- Purpose: Single source of truth for colors, spacing, typography
- Examples: `--color-orange`, `--color-bg-primary`, `--space-4`, `--font-mono`
- Pattern: Defined in `global.css` `:root`, used throughout all component stylesheets

**Modal/Overlay Pattern:**
- Purpose: Reveal/hide content overlays with backdrop
- Examples: Manifesto modal in `index.html`, modal in signup confirmation
- Pattern: Hidden by default (`display: none`), toggled via `.open` class, click-outside to close

## Entry Points

**Home Page:**
- Location: `/index.html`
- Triggers: User navigates to root domain
- Responsibilities: Display hero section, embedded demo (demo-box-1), manifesto modal, CTA buttons

**Features Page:**
- Location: `/pages/features/index.html`
- Triggers: User clicks "Features" nav link or directly visits URL
- Responsibilities: Tab interface for system capabilities, display 4 demo components, update one-liner explanations

**Signup Page:**
- Location: `/pages/signup/index.html`
- Triggers: User clicks "Request Access" button
- Responsibilities: Render form, initialize analytics tracking, submit to `/api/signup`, show success/error message

**Security Page:**
- Location: `/pages/security/index.html`
- Triggers: User clicks "Security" nav link
- Responsibilities: Display security mandate, deployment tier options, compliance information

**API Handler:**
- Location: `/api/signup.js`
- Triggers: POST request from signup form to `/api/signup`
- Responsibilities: Receive form + analytics data, forward to Google Forms, log to Vercel

## Error Handling

**Strategy:** Silent failure with user-facing feedback

**Patterns:**
- Form submission errors: Try/catch block logs to console, shows user message "Something went wrong. Please try again or use the Google Form link below."
- Analytics initialization: Each tracker wrapped in try/catch; failure does not block form submission (`console.warn` only)
- Tracker data collection: Orchestrator collects from each tracker in try/catch; continues if individual tracker fails
- Missing DOM elements: Explicit null checks (e.g., `if (!form) return`) before attaching listeners

## Cross-Cutting Concerns

**Logging:**
- Client-side: `console.log()` for normal flow, `console.warn()` for recoverable errors, `console.error()` for failures
- Server-side: Vercel console logging in `/api/signup.js`
- No centralized log aggregation

**Validation:**
- HTML5 form validation (`required` attributes on inputs)
- Email type validation via `type="email"` input
- No backend validation of form data before Google Forms submission

**Authentication:**
- None. Site is public access with no auth mechanism.
- Form submission is open endpoint (no CSRF protection visible)

**Mobile Responsiveness:**
- Viewport meta tag configured
- CSS media queries for breakpoint `768px`
- Hamburger menu for mobile navigation
- Demo viewport heights adjusted for mobile (`70vh` vs `900px`)
- Terminal tabs scroll horizontally on mobile
- "Hide on mobile" utility class (`.hide-mobile`)
