# Technology Stack

**Analysis Date:** 2026-01-25

## Languages

**Primary:**
- HTML5 - Markup for all pages and components
- CSS3 - Styling with modern CSS variables and Grid/Flexbox layout
- JavaScript (ES6+) - Client-side logic and analytics

**Secondary:**
- None (no backend language detected)

## Runtime

**Environment:**
- Browser-based (client-side static site + serverless functions)

**Package Manager:**
- None detected (no package.json, no npm/yarn)

**Deployment Target:**
- Vercel (static hosting + serverless functions at `/api/`)

## Frameworks

**Core:**
- Vanilla JavaScript - No UI framework used
- CSS-in-HTML - Custom design system with CSS imports (no Sass/Less)

**Presentation:**
- Custom Bloomberg-inspired design system in `css-new/`

**Testing:**
- Not detected

**Build/Dev:**
- No build tool detected (direct HTML/CSS/JS)

## Key Dependencies

**Critical:**
- None (no external npm packages, no CDN dependencies, no frameworks)

**Infrastructure:**
- Vercel Serverless Functions - For POST endpoint at `api/signup.js`
- Google Forms - For receiving signup data (embedded via webhook)

## Configuration

**Environment:**
- No `.env` file detected
- Google Forms ID hardcoded in `api/signup.js` (FORM_ID = '1FAIpQLScQQhkDqiSSsq7R3jdKaroPv3yjtNrgHmHv7g_XhIZo81YDUQ')
- All configuration is static/client-side

**Build:**
- No build configuration detected
- Direct file serving from project root

## Platform Requirements

**Development:**
- Any modern browser (Chrome, Firefox, Safari, Edge)
- HTTP server for local testing (to avoid CORS issues with `/api` calls)
- Text editor or IDE

**Production:**
- Vercel hosting with serverless functions enabled
- Node.js runtime for `api/signup.js` (Vercel handles this automatically)

## Project Structure

```
SeeingStone.org/
├── index.html              # Home page
├── api/
│   └── signup.js           # Vercel serverless function
├── js/
│   ├── navigation.js       # Nav menu and routing logic
│   ├── analytics/          # Analytics orchestration system
│   │   ├── analytics.js    # Main analytics entry point
│   │   ├── analyzer.js     # Intent derivation engine
│   │   ├── formatter.js    # Data formatting
│   │   └── trackers/
│   │       ├── timeTracker.js
│   │       ├── navigationTracker.js
│   │       ├── engagementTracker.js
│   │       └── contextTracker.js
│   └── theorb.js
├── components/
│   ├── demo-box-1/         # Network intelligence demo
│   ├── demo-box-2/         # Encrypted demo
│   ├── demo-box-3/         # Transparent demo
│   └── demo-box-4/         # Permissioned demo
├── pages/
│   ├── features/           # Features page
│   ├── security/           # Security architecture page
│   └── signup/             # Signup form page
├── css-new/
│   ├── main.css            # Master import
│   ├── global.css          # Variables, reset, base
│   ├── layout.css          # Grid, containers, sections
│   └── components.css      # Button, nav, card, form styles
├── css/                    # Legacy/deprecated styles
└── assets/                 # Images/brand assets
```

## Module Pattern

All JavaScript modules use modern ES6 import/export syntax:
- `js/analytics/analytics.js` - Orchestrator pattern
- `js/analytics/analyzer.js` - Pure utility class with static methods
- `js/analytics/formatter.js` - Pure formatter with static methods
- Tracker modules - Individual tracking services

No bundler (Webpack, Vite, etc.) - files are imported directly in HTML with `type="module"`.

## Styling Architecture

**Design System Location:** `css-new/`

**Three-tier CSS structure:**
1. `global.css` - CSS variables, color palette, typography, reset
2. `layout.css` - Grid system, containers, layout utilities
3. `components.css` - Reusable components (buttons, cards, forms, nav)

**Color Scheme:**
- Dark theme with orange accents (#ff6b35 range)
- Semantic variables: `--color-text-primary`, `--color-text-secondary`, `--color-bg-primary`, `--color-bg-secondary`, `--color-border`, `--color-orange`

**Spacing System:** CSS variables like `--space-1` through `--space-8` for consistent spacing

---

*Stack analysis: 2026-01-25*
