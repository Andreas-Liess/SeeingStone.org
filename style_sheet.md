# SeeingStone Style Guide: The Efficient Bloomberg Aesthetic

## 1. Design Philosophy
**"Maximum Data, Minimum Noise."**
The SeeingStone aesthetic is inspired by high-frequency trading terminals (Bloomberg Terminal) and mission-critical dashboard interfaces. It prioritizes information density, legibility, and speed over decorative elements.

*   **Function over Form:** Every pixel must serve a purpose.
*   **High Contrast:** Stark blacks and vibrant accents for immediate readability.
*   **Grid-Locked:** Content lives in strict, bordered panels.
*   **Speed:** UI should feel instantaneous and raw.

---

## 2. Color Palette
We utilize a strict dark mode palette. There is no light mode.

### Backgrounds
*   **Void Black (`#0a0a0a`):** The primary canvas. Used for the body and main content areas.
*   **Panel Black (`#111111`):** Slightly lighter. Used for sidebars, cards, and distinct modules.
*   **Input Black (`#000000`):** True black. Used for data entry fields to create depth.

### Accents & Status
*   **Signal Orange (`#ff6600`):** **Primary Action & Brand.** Use for buttons, active states, cursors, and critical highlights.
*   **Terminal Green (`#00cc88`):** **Success & Stable.** Use for positive data trends, "online" status, and confirmation.
*   **Data Blue (`#0088ff`):** **Information & Tools.** Use for links, neutral data points, and secondary indicators.
*   **Alert Red (`#cc0000`):** **Critical & Error.** Use sparingly for destructive actions or system failures.

### Borders & Separators
*   **Standard Border (`#333333`):** The skeleton of the UI. All panels are defined by 1px solid borders of this color.
*   **Active Border (`#555555`):** Used for focus states or hovering over interactive panels.

---

## 3. Typography
Text is treated as data.

### Font Families
1.  **Data & Logic (Primary):** `Monospace`
    *   *Stack:* `ui-monospace`, `SFMono-Regular`, `"SF Mono"`, `Menlo`, `Consolas`, `"Liberation Mono"`, `monospace`.
    *   *Usage:* Tables, code blocks, data values, timestamps, status indicators, and inputs.
2.  **Structure & Headlines (Secondary):** `Sans-Serif`
    *   *Stack:* `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`.
    *   *Usage:* Section headers, marketing copy, and modal titles.

### 3.1 Font Usage & Text Hierarchy (Refined)
*   **Human-Readable Text:** Use `var(--font-sans)` for all body text, reasoning logs, emails, and descriptive content.
    *   *Color:* White (`#ffffff`) for primary text, Light Gray (`#cccccc`) for secondary/reasoning.
*   **Technical Data:** Use `var(--font-mono)` strictly for:
    *   Headers / Labels (e.g., "USER QUERY", "TOOL CALL")
    *   Timestamps / Dates
    *   IDs / Codes
    *   Input Fields
*   **Sizing:** Base font size is increased to `14px` (from 12px) to ensure legibility in high-density layouts.

### Hierarchy (Base 16px)
*   **Display:** `2.625rem` (42px) - Landing page headers.
*   **Panel Title:** `1.25rem` (20px) - Uppercase, bold, often with letter-spacing.
*   **Body/Standard:** `1rem` (16px) - Readable long-form text.
*   **Data/Table:** `0.875rem` (14px) - High density lists.
*   **Meta/Label:** `0.75rem` (12px) - Uppercase labels, timestamps, footnotes.

---

## 4. Layout & Grid
The interface typically follows a "Dashboard" or "Cockpit" model.

*   **Full Width:** Applications usually consume 100% of the viewport.
*   **Modular Panels:** The screen is divided into rectangular regions (bento-box).
*   **Borders, Not Whitespace:** Separation is achieved through visible lines (`1px solid #333`), not massive padding.
*   **Fixed Headers/Footers:** Tools and status bars are often pinned. Content scrolls within its specific panel.

---

## 5. UI Components

### Buttons
*   **Style:** Rectangular, sharp or minimal radius (2px).
*   **Primary:** Transparent background, `1px solid #ff6600`, Orange text. Hover fills with Orange.
*   **Secondary:** Gray border, White text.
*   **Text:** Uppercase, Bold, Monospace.

### Inputs
*   **Style:** Flat, no shadow, `#000` background, `1px solid #333` border.
*   **Focus:** Hard border color change to Orange (`#ff6600`). No soft glow.
*   **Cursor:** Blinking block cursor (`█`) where possible.

### Tables (The Core Component)
*   **Headers:** Uppercase, text-dim (`#888`), border-bottom.
*   **Rows:** Compact padding (`4px 8px`).
*   **Hover:** High-contrast row highlighting (background `#1a1a1a` or slight Orange tint).
*   **Cell Data:** Monospace. Right-align numbers.

### Modals & Overlays
*   **Appearance:** Sharp corners, high opacity background (no blur), distinct border.
*   **Behavior:** Snap into place. No "springy" animations.

---

## 6. Motion & Interaction
*   **Timing:** Instant (`100ms` or less). Snappy.
*   **Type:** Linear or standard ease. No bounce.
*   **Feedback:** Hover states should be binary and obvious (e.g., border color change, text color flip).

---

## 7. Implementation Checklist
When building a new component, ask:
1.  [ ] Is the background dark enough?
2.  [ ] Are borders used to define the space instead of margins?
3.  [ ] Is the font Monospace (for data)?
4.  [ ] Is the accent color used *only* for importance?
5.  [ ] detailed and high density?
