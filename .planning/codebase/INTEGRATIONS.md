# External Integrations

**Analysis Date:** 2026-01-25

## APIs & External Services

**Data Collection:**
- Google Forms - Signup data ingestion
  - SDK/Client: Native fetch API (no SDK)
  - Integration: Direct POST to Google Forms endpoint in `api/signup.js`
  - Form ID: `1FAIpQLScQQhkDqiSSsq7R3jdKaroPv3yjtNrgHmHv7g_XhIZo81YDUQ`

**User Engagement Analytics:**
- Internal custom analytics system (no external service)
  - Tracks: time to submit, typing duration, scroll depth, navigation journey, user intent
  - Data storage: Sent to backend via `/api/signup` endpoint
  - Location: `js/analytics/analytics.js` (orchestrator), `js/analytics/trackers/` (individual trackers)

## Data Storage

**Databases:**
- Google Sheets (via Google Forms)
  - Connection: Webhook POST to Google Forms endpoint
  - Data collected: Email, company, message, analytics metadata
  - No direct database connection detected

**File Storage:**
- Static file serving only (no dynamic file upload/storage)
- Component assets (CSS, JS) served from project root

**Caching:**
- Browser cache only (no cache layer detected)
- No server-side caching

## Authentication & Identity

**Auth Provider:**
- None (public landing page, no user authentication)
- Signup form collects name/email but no auth tokens or sessions

**Form Data Handling:**
- Client-side form validation in `pages/signup/js/signup.js`
- Analytics data aggregation in `js/analytics/analytics.js`
- Sent to backend as JSON payload

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, LogRocket, or similar)

**Logs:**
- Console logging only
- Backend logs: Vercel function logs (automatic)
- Client-side logging: `console.log()` and `console.error()` calls throughout analytics system

**Log Examples:**
- `"✅ Analytics system initialized"` in `js/analytics/analytics.js`
- `"✅ Saved to Google Sheet: ${name} / ${email}"` in `api/signup.js`
- `"Form submitted successfully"` in `pages/signup/js/signup.js`

## CI/CD & Deployment

**Hosting:**
- Vercel (static site + serverless functions)

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, or CircleCI config)

**Deployment:**
- Git-based deployment on Vercel
- Automatic deployments from main branch
- Serverless function at `api/signup.js` runs on Vercel Node.js runtime

## Environment Configuration

**Required env vars:**
- None detected

**Secrets location:**
- No `.env` file (all config hardcoded or public)
- Google Forms ID is hardcoded in `api/signup.js` (acceptable as it's a public form endpoint)

**Security Notes:**
- Form ID is public (acceptable for Google Forms)
- No API keys or secrets stored (form submission is unauthenticated)
- Footer states: "Data processing occurs on sovereign European infrastructure"

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Google Forms webhook - POST to `https://docs.google.com/forms/d/e/{FORM_ID}/formResponse`
  - Triggered by: Form submission on signup page
  - Payload: URLEncoded form data with fields:
    - `entry.1816007361`: Email
    - `entry.1782966477`: Company
    - `entry.1997805328`: Message
    - `entry.1483401731`: Analytics data (JSON string)
  - Location: `api/signup.js` lines 13-22

## Data Flow

**Form Submission Flow:**

1. User fills signup form on `pages/signup/index.html`
2. Analytics system in `js/analytics/analytics.js` collects:
   - Time to submit (via `js/analytics/trackers/timeTracker.js`)
   - Navigation journey (via `js/analytics/trackers/navigationTracker.js`)
   - Engagement depth (via `js/analytics/trackers/engagementTracker.js`)
   - User context (via `js/analytics/trackers/contextTracker.js`)
3. Intent analysis in `js/analytics/analyzer.js` derives user intent level (High/Medium/Low)
4. Data formatted via `js/analytics/formatter.js`
5. Form submission in `pages/signup/js/signup.js` sends POST to `/api/signup` with:
   - name, email, company, message, analytics metadata
6. Vercel function `api/signup.js` receives request
7. Backend transforms data and POSTs to Google Forms endpoint
8. Google Sheet receives and logs the data

## Client-Side Analytics Trackers

**TimeTracker** (`js/analytics/trackers/timeTracker.js`):
- Measures page load time and form completion time
- Returns: `timeToSubmit`, `timeToSubmitFormatted`

**NavigationTracker** (`js/analytics/trackers/navigationTracker.js`):
- Tracks page visits and navigation journey
- Returns: `entryPage`, `referrer`, `journey`, `journeyFormatted`

**EngagementTracker** (`js/analytics/trackers/engagementTracker.js`):
- Monitors scroll depth, typing duration, input method
- Returns: `scrollDepth`, `scrollDepthFormatted`, `typingDuration`, `typingDurationFormatted`, `inputMethod`

**ContextTracker** (`js/analytics/trackers/contextTracker.js`):
- Collects device, resolution, language, timezone data
- Returns: `device`, `resolution`, `language`, `timezone`

## Intent Analysis Engine

**Location:** `js/analytics/analyzer.js`

**Scoring System:**
- Combines 5 signals: timeEngagement, typingEffort, scrollEngagement, contentExploration, inputQuality
- Total possible score: 12 points
- Intent levels:
  - High: 8+ points
  - Medium: 4-7 points
  - Low: 0-3 points

**Example Signals:**
- Time engagement: 3 points if >3 min, 2 points if >1.5 min, 1 point if >30s
- Typing effort: 3 points if >60s, 2 points if >45s, 1 point if >15s
- Scroll engagement: 2 points if >70% depth, 1 point if >50%
- Content exploration: 2 points if visited 2+ pages, 1 point if 1+ page
- Input quality: 2 points if typed, 1 point if mixed

## Integration Gaps

**Not Integrated:**
- Database (using Google Sheets as workaround)
- Authentication system
- Payment processing
- Email service (no automated confirmations)
- Error tracking/monitoring
- CMS (content is static HTML)

---

*Integration audit: 2026-01-25*
