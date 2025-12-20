# SeeingStone Design System

**Bloomberg-inspired minimalism with orange brand identity**

## Philosophy

This design system is built on three principles:

1. **Show, don't decorate** - No fake complexity, no cosplaying as the product
2. **Minimal but not minimal** - Bloomberg-style authority through simplicity
3. **Performance first** - System fonts, clean CSS, zero bloat

---

## File Structure

```
css-new/
├── main.css          # Import all (use this in HTML)
├── global.css        # Variables, reset, base elements
├── layout.css        # Grid, containers, sections
├── components.css    # Buttons, nav, cards, forms
└── README.md         # This file
```

---

## Design Tokens

### Colors

**Brand Colors:**
- Orange: `#ff6600` (primary, CTAs, highlights)
- Orange Hover: `#ff8534`
- Orange Active: `#cc5200`

**Neutrals:**
- Black: `#0a0a0a` (dark backgrounds, text)
- White: `#ffffff` (light backgrounds, inverse text)
- Gray scale: 100-900 (borders, text-secondary, etc.)

**Usage:**
```css
var(--color-orange)
var(--color-black)
var(--color-white)
var(--color-text-primary)
var(--color-bg-dark)
```

### Typography

**Font Family:**
- Primary: System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Monospace: `'Courier New', monospace` (only for real code)

**Font Sizes:**
- Base: 16px (1rem)
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 42px

**Font Weights:**
- Normal: 400 (body text)
- Bold: 700 (headings only)

**Line Heights:**
- Tight: 1.2 (headings)
- Normal: 1.5 (UI elements)
- Relaxed: 1.6 (body text)

**Usage:**
```css
font-family: var(--font-primary);
font-size: var(--font-size-xl);
font-weight: var(--font-weight-bold);
line-height: var(--line-height-relaxed);
```

### Spacing

**8px Grid System:**
```
--space-1:  8px
--space-2:  16px
--space-3:  24px
--space-4:  32px
--space-6:  48px
--space-8:  64px
--space-12: 96px
```

**Usage:**
```css
padding: var(--space-4);
margin-bottom: var(--space-3);
gap: var(--space-2);
```

### Borders

**Border Radius:**
- Small: 2px (micro elements)
- Default: 4px (buttons, cards, inputs)
- Large: 8px (larger containers)

**Border Width:**
- Standard: 1px
- Thick: 2px (buttons, emphasis)

**Usage:**
```css
border-radius: var(--border-radius);
border: var(--border-width) solid var(--color-border);
```

---

## Components

### Buttons

```html
<!-- Primary (Orange solid) -->
<button class="btn btn-primary">Sign Up</button>

<!-- Secondary (Orange outline) -->
<button class="btn btn-secondary">Learn More</button>

<!-- Inverse (White on dark) -->
<button class="btn btn-inverse">Get Started</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Navigation

```html
<nav class="nav">
  <div class="nav-container">
    <a href="/" class="nav-logo">SeeingStone</a>
    <div class="nav-menu">
      <a href="/features" class="nav-link">Features</a>
      <a href="/security" class="nav-link">Security</a>
      <a href="/pricing" class="nav-link">Pricing</a>
      <a href="/signup" class="nav-link">
        <button class="btn btn-primary btn-sm">Sign Up</button>
      </a>
    </div>
  </div>
</nav>
```

### Cards

```html
<!-- Light card -->
<div class="card">
  <h3 class="card-title">Feature Title</h3>
  <p class="card-content">Feature description goes here.</p>
</div>

<!-- Dark card -->
<div class="card card-dark">
  <h3 class="card-title">Feature Title</h3>
  <p class="card-content">Feature description on dark background.</p>
</div>

<!-- Feature card -->
<div class="feature-card">
  <div class="feature-card-icon">🔒</div>
  <h3 class="feature-card-title">Security First</h3>
  <p class="feature-card-description">End-to-end encryption for all data.</p>
</div>
```

### Forms

```html
<form>
  <div class="form-group">
    <label class="form-label" for="email">Email</label>
    <input type="email" id="email" class="form-input" placeholder="you@example.com">
    <small class="form-help">We'll never share your email.</small>
  </div>

  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

---

## Layout

### Sections

```html
<!-- Hero Section (Dark background) -->
<section class="hero">
  <div class="container">
    <h1 class="hero-title">Network Intelligence You Can Trust</h1>
    <p class="hero-subtitle">Privacy-first monitoring for modern infrastructure</p>
    <div class="hero-cta">
      <button class="btn btn-primary btn-lg">Get Started</button>
      <button class="btn btn-inverse btn-lg">Learn More</button>
    </div>
  </div>
</section>

<!-- Content Section (Light background) -->
<section class="section section-light">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">Features</h2>
      <p class="section-description">Everything you need for secure network monitoring</p>
    </div>

    <div class="features-grid">
      <!-- Feature cards here -->
    </div>
  </div>
</section>

<!-- CTA Section (Dark background) -->
<section class="cta-section">
  <div class="container">
    <h2 class="cta-title">Ready to get started?</h2>
    <p class="cta-description">Join thousands of teams using SeeingStone</p>
    <div class="cta-buttons">
      <button class="btn btn-primary btn-lg">Sign Up Free</button>
      <button class="btn btn-inverse btn-lg">Talk to Sales</button>
    </div>
  </div>
</section>
```

### Grid System

```html
<!-- 3-column grid -->
<div class="grid grid-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

<!-- Auto-responsive grid -->
<div class="grid grid-auto-md">
  <!-- Automatically wraps at 300px min-width -->
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Flexbox layout -->
<div class="flex justify-between items-center gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

---

## Usage Guide

### 1. Include CSS in HTML

**Option A: Use main.css (recommended)**
```html
<link rel="stylesheet" href="css-new/main.css">
```

**Option B: Import individual files**
```html
<link rel="stylesheet" href="css-new/global.css">
<link rel="stylesheet" href="css-new/layout.css">
<link rel="stylesheet" href="css-new/components.css">
```

### 2. Basic Page Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SeeingStone</title>
  <link rel="stylesheet" href="css-new/main.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="nav">...</nav>

  <!-- Hero Section -->
  <section class="hero">...</section>

  <!-- Content Sections -->
  <section class="section section-light">...</section>

  <!-- CTA Section -->
  <section class="cta-section">...</section>

  <!-- Footer -->
  <footer class="footer">...</footer>
</body>
</html>
```

### 3. Dark/Light Section Pattern

Bloomberg-style alternating sections:

```html
<!-- Dark hero -->
<section class="hero">...</section>

<!-- Light content -->
<section class="section section-light">...</section>

<!-- Dark accent -->
<section class="section section-dark">...</section>

<!-- Light content -->
<section class="section section-light">...</section>

<!-- Dark CTA -->
<section class="cta-section">...</section>

<!-- Dark footer -->
<footer class="footer">...</footer>
```

---

## Responsive Design

All components are mobile-first and responsive:

- **Mobile:** < 768px (single column, stacked navigation)
- **Tablet:** 768px - 1024px (2-column grids)
- **Desktop:** > 1024px (full layout)

**Responsive utilities:**
```html
<div class="hide-mobile">Only on desktop</div>
<div class="hide-desktop">Only on mobile</div>
```

---

## Accessibility

- ✅ WCAG AA contrast ratios
- ✅ Focus-visible styles (orange outline)
- ✅ Reduced motion support
- ✅ High contrast mode support
- ✅ Semantic HTML required
- ✅ Keyboard navigation support

---

## When to Use Monospace Fonts

**Use `font-family: var(--font-mono)` ONLY for:**
- Real code snippets users will copy
- API keys, tokens, credentials
- Terminal commands
- Real-time data that needs alignment (tables, logs)

**DO NOT use monospace for:**
- Decorative "tech aesthetic"
- Fake code blocks
- Regular UI text
- Headings or body copy

---

## Migration from Old CSS

### Phase 1: CSS Refactor (Current)
1. New CSS created in `css-new/` folder
2. Old CSS untouched in `css/` folder
3. Can test new styles by swapping CSS imports

### Phase 2: HTML/JS Cleanup (Next)
1. Strip fake complexity elements
2. Update class names to match new system
3. Remove unused components
4. Simplify structure

---

## Design Principles

### ✅ DO
- Use system fonts everywhere (except real code)
- Keep borders subtle (4px radius)
- Use orange for CTAs and highlights only
- Alternate dark/light sections for rhythm
- Show real product functionality
- Use 8px spacing grid strictly

### ❌ DON'T
- Add decorative code blocks
- Use fake "LIVE" indicators
- Mix multiple font families
- Over-engineer components
- Add unnecessary animations
- Break the spacing grid

---

## Support

Questions? Check:
1. This README
2. CSS comments in each file
3. Example HTML in `test-design-system.html` (if available)

---

**Version:** 1.0.0
**Last Updated:** 2025-12-19
**Design System:** Bloomberg-inspired minimalism
**Brand Color:** Orange (#ff6600)
