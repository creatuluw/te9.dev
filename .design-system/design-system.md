# te9.dev Design System v2.0

> Design system for te9.dev — Patrick's Digital Garden. Light theme. Vanilla CSS with semantic class names, zero external CSS dependencies, full accessibility.

---

## Fonts

| Font | Family | Weights | Usage |
|---|---|---|---|
| **Heading** | `'Bricolage Grotesque', system-ui, sans-serif` | 400, 500, 600, 700 | Page titles, hero headings, section headings, card titles, logo |
| **Mono** | `'JetBrains Mono', monospace` | 400, 500, 700 | Navigation logo, section labels, footer logo, code text, link names, tags |
| **Body** | `'Lekton', monospace` | 400, 700 | Body text, descriptions, button labels, subtitles, hero descriptions, card descriptions, nav links |

**Load HTML:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Lekton:wght@400;700&display=swap" rel="stylesheet" />
```

Font assignments:
- All headings → `var(--font-heading)`
- Mono/technical text → `var(--font-mono)`
- Body/default → `var(--font-body)`

---

## Icons

- **Library:** Lucide Icons
- **Variant:** Regular stroke weight, 1.5px stroke
- **Package:** `@lucide/svelte`
- **Usage:** `import { IconName } from '@lucide/svelte';`

| Context | Size | When to use |
|---|---|---|
| Inline | 12px | Inside text, beside labels |
| Button | 18px | Inside buttons, CTAs |
| Navigation | 20px | Nav links, arrow icons |
| Card | 24px | Garden card icons, feature icons |
| Decorative | 40px | Hero decorations, empty states |

---

## Color Tokens

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-brand-bg` | `#F8F8F6` | Page background |
| `--color-brand-bg-secondary` | `#EFEFEA` | Alternate section backgrounds, footer gradient start |
| `--color-brand-dark` | `#1A1A1A` | Primary text, buttons |
| `--color-accent` | `#E88500` | CTAs, highlights, logo prompt, labels |
| `--color-accent-light` | `#FFF4E6` | Accent tint, hover backgrounds |
| `--color-accent-dark` | `#C47000` | Accent hover, accessible accent text |
| `--color-brand-muted` | `#6B6B6B` | Secondary text, nav links, descriptions |
| `--color-brand-light` | `#9A9A9A` | Decorative only — **fails AA contrast** |

### Garden Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-garden-green` | `#00A855` | Garden icons, tags, status indicators |
| `--color-garden-green-light` | `#E6F9EF` | Green tint backgrounds |
| `--color-garden-green-dark` | `#008F47` | Green text (passes AA on white) |
| `--color-emerald` | `#059669` | Selection, focus rings |
| `--color-emerald-light` | `#ECFDF5` | Emerald tint backgrounds |

### Semantic Colors

| Token | 50 (bg) | 500 (default) | 700 (text) |
|---|---|---|---|
| Success | `#F0FDF4` | `#22C55E` | `#15803D` |
| Warning | `#FFFBEB` | `#F59E0B` | `#B45309` |
| Error | `#FEF2F2` | `#EF4444` | `#B91C1C` |
| Info | `#EFF6FF` | `#3B82F6` | `#1D4ED8` |

### Neutral Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-neutral-50` | `#FAFAF8` | Card backgrounds, table headers |
| `--color-neutral-100` | `#F5F5F0` | Alternate subtle backgrounds |
| `--color-neutral-500` | `#6B7280` | Neutral text, muted labels |
| `--color-neutral-700` | `#374151` | Neutral strong text |

### Structural Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-white` | `#FFFFFF` | Card surfaces, modal backgrounds |
| `--color-navbar-bg` | `rgba(248, 248, 246, 0.9)` | Navbar background (with blur) |
| `--color-overlay` | `rgba(0, 0, 0, 0.3)` | Overlay backdrop |
| `--color-modal-backdrop` | `rgba(0, 0, 0, 0.5)` | Modal backdrop |

### Border Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-border-subtle` | `#E0DDD8` | Default borders, dividers, navbar bottom |
| `--color-border-hover` | `#CCCCC4` | Hover state borders |
| `--color-border-secondary` | `#E8E8E0` | Secondary borders, list items |
| `--color-border-tertiary` | `#D4D4CC` | Input/select borders |
| `--color-input-border` | `#D4D4CC` | Form input borders |

### Accent Gradient

| Token | Value |
|---|---|
| `--color-accent-gradient-start` | `#E88500` |
| `--color-accent-gradient-end` | `#D07000` |
| `--color-accent-hover-start` | `#F09500` |
| `--color-accent-hover-end` | `#E08000` |

### 60-30-10 Rule

| Proportion | Colors | Role |
|---|---|---|
| **60%** | `#F8F8F6` | Background surfaces, breathing room |
| **30%** | `#1A1A1A` + `#FFFFFF` | Text, cards, structural contrast |
| **10%** | `#E88500` + `#00A855` | CTAs, highlights, interactive elements |

---

## Typography Scale

| Name | Size | Weight | LH | LS | Usage |
|---|---|---|---|---|---|
| hero-xl | `clamp(3rem, 8vw, 6rem)` | 700 | 1 | 0 | Hero heading (responsive) |
| hero-md | 3rem | 700 | 1 | 0 | Hero heading (tablet/mobile) |
| hero-sm | 2.5rem | 700 | 1 | 0 | Hero heading (small mobile) |
| section-xl | 2.5rem | 700 | 1.2 | 0 | Section heading (desktop) |
| section-md | 2rem | 700 | 1.2 | 0 | Section heading (tablet) |
| section-sm | 1.75rem | 700 | 1.2 | 0 | Section heading (mobile) |
| modal-title | 1.5rem | 600 | 1.3 | 0 | Modal heading |
| card-title | 1.25rem | 600 | 1.4 | 0 | Card title, garden card title |
| h1 | 2.5rem | 700 | 1.2 | 0 | Page H1 |
| h2 | 2rem | 600 | 1.3 | 0 | Page H2 |
| h3 | 1.25rem | 600 | 1.4 | 0 | Page H3 |
| h4 | 1.125rem | 600 | 1.4 | 0 | Page H4, footer headings |
| subtitle | 1.25rem | 400 | 1.6 | 0 | Hero subtitle, lead paragraphs |
| body-lg | 1.125rem | 400 | 1.7 | 0 | Lead text, hero description |
| body | 1rem | 400 | 1.7 | 0 | Default body text |
| body-sm | 0.875rem | 400 | 1.6 | 0 | Card descriptions, UI text, nav links |
| body-xs | 0.8125rem | 400 | 1.5 | 0 | Helper text, hints, link descriptions |
| small | 0.75rem | 400 | 1.4 | 0 | Footer copyright, metadata |
| label | 0.875rem | 500 | 1.4 | 0.1em | Uppercase labels, section labels |
| caption | 0.6875rem | 400 | 1.4 | 0.05em | Tag pills, micro labels |
| button | 0.9375rem | 500 | 1 | 0 | Primary/secondary button text |
| button-sm | 0.875rem | 500 | 1 | 0 | Small button text, outlined variant |
| logo | 1.5rem | 700 | 1 | 0 | Footer logo |
| logo-sm | 1rem | 500 | 1 | 0 | Navbar logo text |

---

## Spacing (8px Grid)

Base unit: **8px**. Half-step 4px for icon alignment, tag padding only.

| Token | rem | px | Usage |
|---|---|---|---|
| 0 | 0 | 0 | Reset |
| 0.25 | 0.0625rem | 1 | Hairline gaps |
| 0.5 | 0.125rem | 2 | Micro adjustments, tag vertical padding |
| 1 | 0.25rem | 4 | Tag horizontal padding, focus ring offset |
| 1.5 | 0.375rem | 6 | Status dot size, scrollbar width |
| 2 | 0.5rem | 8 | Button icon gap, scrollbar height, small icon gaps |
| 2.5 | 0.625rem | 10 | Nav link gap, hero label gap |
| 3 | 0.75rem | 12 | Small icon size, arrow offset, card header margin |
| 3.5 | 0.875rem | 14 | Link description margin |
| 4 | 1rem | 16 | Standard spacing, button icon shift, footer social gap |
| 5 | 1.25rem | 20 | Link item padding-y, fly transition y offset |
| 6 | 1.5rem | 24 | Button padding, card padding mobile, section margin bottom |
| 7 | 1.75rem | 28 | Button padding-x (secondary) |
| 8 | 2rem | 32 | Card padding, page padding-x, grid gap, footer padding-x |
| 9 | 2.25rem | 36 | Link item padding |
| 10 | 2.5rem | 40 | Section label margin bottom |
| 12 | 3rem | 48 | Section margin bottom, footer padding-top |
| 16 | 4rem | 64 | Hero padding, page-level spacing |
| 20 | 5rem | 80 | Link item padding-x |
| 24 | 6rem | 96 | Section padding-y, footer padding-top |
| 32 | 8rem | 128 | Large section padding |

---

## Border Radius

| Token | Value | px | Usage |
|---|---|---|---|
| `--radius-none` | 0 | 0 | Garden cards, sharp edges |
| `--radius-xs` | 0.125rem | 2 | Tag pills, micro elements |
| `--radius-sm` | 0.25rem | 4 | Buttons (outlined variant), inline elements |
| `--radius-md` | 0.375rem | 6 | Hero CTA buttons, inputs |
| `--radius-lg` | 0.5rem | 8 | Link items, cards, selects, tables |
| `--radius-xl` | 0.75rem | 12 | Modals, dialogs, elevated cards |
| `--radius-2xl` | 1rem | 16 | Modal content |
| `--radius-3xl` | 1.5rem | 24 | Large modals, feature sections |
| `--radius-full` | 9999px | — | Pills, badges, avatars, status dots |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Card resting state, subtle elevation |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Hovered cards, navbar scrolled, dropdowns |
| `--shadow-lg` | `0 12px 24px rgba(0,0,0,0.1)` | Tooltips, notifications, toasts, card hover |
| `--shadow-xl` | `0 20px 40px rgba(0,0,0,0.12)` | Drawers, side panels, dialogs |
| `--shadow-2xl` | `0 25px 50px rgba(0,0,0,0.16)` | Full-screen modals, alert dialogs |
| `--shadow-accent` | `0 8px 25px rgba(232, 133, 0, 0.25)` | Primary button hover shadow |
| `--shadow-accent-sm` | `0 4px 12px rgba(232, 133, 0, 0.15)` | Outlined button hover shadow |
| `--shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.06)` | Active/pressed states, inset focus |

---

## Breakpoints

| Name | Min | Max | Columns | Margin | Usage |
|---|---|---|---|---|---|
| mobile | 0 | 479px | 1 | 16px | Small phones, default styles |
| mobileL | 480 | 599px | 1 | 16px | Large phones, garden card stack |
| tablet | 600 | 767px | 2 | 24px | Small tablets, link item column layout |
| desktop | 768 | 1023px | 2 | 32px | Tablets landscape, desktop start |
| wide | 1024 | 1199px | 3 | 32px | Desktop, auto-fit grid kicks in |
| max | 1200 | — | 3 | auto | Wide desktop, max-width container |

Max content width: **1200px**. Hero content: 800px. Hero description: 600px. Modal: 500px.

**Strategy:** Mobile-first. Write base styles for mobile, add breakpoints for larger screens.

---

## Animation Tokens

### Durations

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | 100ms | Typing effect per character |
| `--duration-fast` | 200ms | Fade out, quick feedback |
| `--duration-normal` | 300ms | Hover transitions, slide transitions, default interactions |
| `--duration-moderate` | 500ms | Fly transitions, card entrance, fade in |
| `--duration-slow` | 550ms | View transition new content fade-in |
| `--duration-slower` | 800ms | View transition full animations, curtain |
| `--duration-pulse` | 2000ms | Status dot pulse, glow animations |
| `--duration-ring` | 11000ms | Decorative ring pulse cycle |
| `--duration-cursor` | 500ms | Cursor blink interval |

### Easing

| Token | Value | Usage |
|---|---|---|
| default | `ease` | Simple transitions |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard material easing, hover effects |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Entrances, fade-ins, view transition new |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Exits, fade-outs, view transition old |
| `--ease-spring` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Bouncy entrances, section reveals |
| `--ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful micro-interactions |

### Keyframes

| Name | From | To | Usage |
|---|---|---|---|
| fadeIn | opacity: 0 | opacity: 1 | Basic entrance animation |
| fadeOut | opacity: 1 | opacity: 0 | Basic exit animation |
| fadeInUp | opacity: 0, translateY(30px) | opacity: 1, translateY(0) | Section reveal, card stagger |
| slideFromRight | translateX(30px) | translateX(0) | View transition slide entrance |
| slideToLeft | translateX(0) | translateX(-30px) | View transition slide exit |
| zoomIn | scale(0.95), opacity: 0 | scale(1), opacity: 1 | View transition zoom entrance |
| zoomOut | scale(1), opacity: 1 | scale(1.05), opacity: 0 | View transition zoom exit |
| rotateIn | rotate(-5deg) scale(0.95), opacity: 0 | rotate(0) scale(1), opacity: 1 | View transition rotate entrance |
| rotateOut | rotate(0) scale(1), opacity: 1 | rotate(5deg) scale(1.05), opacity: 0 | View transition rotate exit |
| flipIn | perspective(1000px) rotateY(-30deg) scale(0.8), opacity: 0 | perspective(1000px) rotateY(0) scale(1), opacity: 1 | View transition flip entrance |
| flipOut | perspective(1000px) rotateY(0) scale(1), opacity: 1 | perspective(1000px) rotateY(30deg) scale(0.8), opacity: 0 | View transition flip exit |
| blurIn | filter: blur(10px), opacity: 0 | filter: blur(0), opacity: 1 | View transition blur entrance |
| blurOut | filter: blur(0), opacity: 1 | filter: blur(10px), opacity: 0 | View transition blur exit |
| curtainIn | clip-path: inset(0 0 100% 0) | clip-path: inset(0 0 0 0) | View transition curtain entrance |
| curtainOut | clip-path: inset(0 0 0 0) | clip-path: inset(100% 0 0 0) | View transition curtain exit |
| spiralIn | rotate(-180deg) scale(0.5), opacity: 0 | rotate(0) scale(1), opacity: 1 | View transition spiral entrance |
| spiralOut | rotate(0) scale(1), opacity: 1 | rotate(180deg) scale(0.5), opacity: 0 | View transition spiral exit |
| explodeIn | scale(0.1), blur(20px), opacity: 0 → opacity: 0.5 at 50% | scale(1), blur(0), opacity: 1 | View transition explode entrance |
| explodeOut | scale(1), blur(0), opacity: 1 | scale(1.5), blur(20px), opacity: 0 | View transition explode exit |
| scaleUp | scale(1.1), opacity: 0 | scale(1), opacity: 1 | View transition scale entrance |
| scaleDown | scale(1), opacity: 1 | scale(0.9), opacity: 0 | View transition scale exit |
| dropIn | translateY(-20px), opacity: 0 | translateY(0), opacity: 1 | View transition drop entrance |
| dropOut | translateY(0), opacity: 1 | translateY(20px), opacity: 0 | View transition drop exit |
| swipeFromBottom | translateY(50px) | translateY(0) | View transition swipe entrance |
| swipeToTop | translateY(0) | translateY(-50px) | View transition swipe exit |
| pulse | scale(1), opacity: 1 → scale(0.95), opacity: 0.5 at 50% | scale(1), opacity: 1 | Status dot pulse animation |
| blink | opacity: 1 (0–50%) | opacity: 0 (51–100%) | Cursor blink, terminal cursor |
| pulseGlow | opacity: 1 | opacity: 0.5 at 50% | Glow pulse effect |
| ringPulse1 | opacity: 0, scale(1), borderColor: #E0DDD8 → opacity: 0.15, scale(1.03), borderColor: #E88500 at 27% | opacity: 0, scale(1) at 38% | Hero decorative ring 1 (200px) |
| ringPulse2 | opacity: 0, scale(1) → opacity: 0.12, scale(1.44) at 27% | opacity: 0, scale(1) at 38% | Hero decorative ring 2 (450px) |
| ringPulse3 | opacity: 0, scale(1) → opacity: 0.12, scale(2.22) at 27% | opacity: 0, scale(1) at 38% | Hero decorative ring 3 (600px) |
| scrollBounce | translateY(0) | translateY(6px) at 50% | Scroll indicator bounce |
| drawLine | height: 0 | height: 100% | Timeline line draw animation |

### View Transitions

10 randomized page transition effects using the View Transitions API:

| Variant | Old Exit | New Enter |
|---|---|---|
| slide | slideToLeft | slideFromRight |
| zoom | zoomOut | zoomIn |
| scale | scaleDown | scaleUp |
| drop | dropOut | dropIn |
| swipe | swipeToTop | swipeFromBottom |
| rotate | rotateOut | rotateIn |
| flip | flipOut | flipIn |
| curtain | curtainOut | curtainIn |
| blur | blurOut | blurIn |
| explode | explodeOut | explodeIn |

**Timing:**

| Phase | Duration | Easing | Fill |
|---|---|---|---|
| Old exit | 250ms | `cubic-bezier(0.4, 0, 1, 1)` | both |
| New enter | 550ms, delay 250ms | `cubic-bezier(0, 0, 0.2, 1)` | both |
| Shared duration | 800ms | `cubic-bezier(0.4, 0, 0.2, 1)` | both |
| Curtain duration | 800ms | `cubic-bezier(0.4, 0, 0.2, 1)` | both |

### Stagger Patterns

| Context | Increment | Animation |
|---|---|---|
| Garden cards | 100ms per card | `fly({ y: 20, duration: 500 })` |
| Quick links | 50ms per link | `slide({ axis: 'y', duration: 300 })` |

### Section Reveal

- **Class:** `.section-reveal` → `.revealed`
- **Initial:** `opacity: 0; transform: translateY(30px);`
- **Revealed:** `opacity: 1; transform: translateY(0);`
- **Transition:** `all 800ms var(--ease-spring)`
- **Observer:** threshold 0.1, rootMargin `-60px`

---

## Components

### Button

CTA buttons with primary (filled gradient), secondary (ghost), outlined (border-only), and danger variants. All use Lekton font, lowercase text.

**Primary:** `.btn .btn-primary`

```html
<a class="btn btn-primary"><span class="btn-text">label</span><Icon class="btn-icon" /></a>
```

| Property | Value |
|---|---|
| display | inline-flex |
| align-items | center |
| gap | 0.5rem |
| padding | 0.875rem 2rem |
| font-size | 0.9375rem |
| font-weight | 500 |
| font-family | var(--font-body) |
| border-radius | 6px |
| text-transform | lowercase |
| background | `linear-gradient(135deg, #E88500 0%, #D07000 100%)` |
| color | #FFFFFF |
| border | none |
| position | relative |
| overflow | hidden |
| transition | `all 300ms cubic-bezier(0.4, 0, 0.2, 1)` |
| hover transform | translateY(-2px) |
| hover shadow | `0 8px 25px rgba(232, 133, 0, 0.25)` |

**Sweep effect:** `::before` slides from `left: -100%` to `left: 0` on hover (500ms ease) with gradient background.

**Secondary:** `.btn .btn-secondary` — Transparent bg, `1px solid #E0DDD8` border, hover: border → `#E88500`, bg → `rgba(232, 133, 0, 0.05)`, translateY(-2px).

**Outlined:** `.btn .btn-outlined` — Transparent bg, `1px solid #E88500` border, `0.75rem 1.5rem` padding, border-radius 4px. Hover: bg → `rgba(232, 133, 0, 0.08)`, translateY(-2px), shadow → `0 4px 12px rgba(232, 133, 0, 0.15)`.

**Danger:** `.btn .btn-danger` — bg `#EF4444`, color `#FFFFFF`.

---

### Garden Card

Content card for the garden section with icon, title, description, and tag. Features top border grow on hover and radial glow.

```html
<article class="garden-card">
  <div class="garden-card-accent"></div>
  <div class="card-content">
    <div class="garden-header">
      <h3 class="garden-title">Title</h3>
      <div class="garden-icon"><Icon size={24} /></div>
    </div>
    <p class="garden-desc">Description</p>
    <span class="garden-tag">tag</span>
  </div>
</article>
```

| Property | Value |
|---|---|
| position | relative |
| background | `linear-gradient(135deg, #FFFFFF 0%, #FAFAF8 100%)` |
| border | 1px solid #E0DDD8 |
| border-radius | **0** (sharp corners for terminal aesthetic) |
| padding | 2rem (1.5rem mobile) |
| transition | all 300ms ease |
| hover border-color | #CCCCC4 |
| hover box-shadow | `0 12px 24px rgba(0,0,0,0.1)` |

**Top border effect:** `::before` — height 2px, `background: linear-gradient(90deg, #00A855, #E88500)`, `transform: scaleX(0)`, origin left, transitions to `scaleX(1)` on hover.

**Radial glow effect:** `.garden-card-accent` — `background: radial-gradient(circle, rgba(232, 133, 0, 0.04) 0%, transparent 70%)`, opacity 0 → 1 on hover.

| Element | Style |
|---|---|
| Title | `var(--font-heading)`, 1.25rem, 600, #1A1A1A |
| Description | `var(--font-body)`, 0.875rem, #6B6B6B, line-height 1.6 |
| Icon | color: #00A855, flex-shrink: 0 |
| Tag | inline-block, 0.25rem 0.75rem, 0.6875rem, #008F47, bg: `rgba(0, 168, 85, 0.08)`, radius: 2px, `var(--font-body)`, lowercase, `letter-spacing: 0.05em` |

---

### Quick Link

External link item with name, description, and arrow icon. Translates on hover.

```html
<a href="..." class="link-item">
  <span class="link-name">Name</span>
  <span class="link-desc">Description</span>
  <ArrowUpRight class="link-arrow" size={20} />
</a>
```

| Property | Value |
|---|---|
| display | flex |
| align-items | center |
| justify-content | space-between |
| padding | 1.25rem 1.5rem |
| background | #FFFFFF |
| border | 1px solid #E8E8E0 |
| border-radius | 8px |
| hover background | #FAFAF8 |
| hover border-color | #E0DDD8 |
| hover transform | translateY(-2px) |

| Element | Style |
|---|---|
| Link name | `var(--font-mono)`, 1rem, 500, #1A1A1A, flex: 1 |
| Link description | 0.875rem, #9A9A9A, margin: 0 1rem |
| Arrow icon | color: #E88500, hover: `translate(2px, -2px)` |

Mobile: flex-direction column, align-items flex-start, gap 0.5rem.

---

### Section Header

Centered section label (mono, `//` prefix) and title (heading font).

```html
<div class="section-header">
  <span class="section-label">// label</span>
  <h2 class="section-title">Title</h2>
</div>
```

| Element | Style |
|---|---|
| Label | `var(--font-mono)`, 0.875rem, #E88500, margin-bottom: 1rem, lowercase, `letter-spacing: 0.05em`, centered |
| Title | `var(--font-heading)`, 2.5rem (desktop) / 2rem (tablet) / 1.75rem (mobile), 700, #1A1A1A, line-height 1.2, centered |

---

### Navbar

Fixed top navigation with typing logo effect, nav links, and scroll-aware blur background.

```html
<nav class="site-nav">
  <div class="nav-inner">
    <a class="nav-logo">› te9.dev_</a>
    <div class="nav-links">
      <a>garden</a>
      <a>links</a>
      <a>patrick.te9.nl</a>
    </div>
  </div>
</nav>
```

| Property | Value |
|---|---|
| position | fixed top |
| z-index | 1000 |
| height | 60px |
| background | `rgba(248, 248, 246, 0.9)` |
| backdrop-filter | blur(10px) |
| border-bottom | 1px solid #E0DDD8 |
| transition | all 300ms |
| scrolled background | `rgba(248, 248, 246, 0.95)` |
| scrolled shadow | `0 4px 20px rgba(0,0,0,0.08)` |

| Element | Style |
|---|---|
| Logo | `var(--font-mono)`, 1rem, 700, prompt color: #E88500, text: #1A1A1A, cursor: #E88500 |
| Nav links | `var(--font-body)`, 0.875rem, color: #6B6B6B, hover: #1A1A1A, lowercase |
| Active underline | color: #E88500, height: 1px, offset: -4px, transition: `width 300ms ease` |

**Scroll threshold:** 100px. **Typing effect:** 100ms per character, cursor blinks 500ms.

---

### Hero

Full-viewport hero with centered content, label brackets, accent dot, decorative pulsing rings.

```html
<section class="hero">
  <div class="hero-content">
    <div class="hero-label">[ digital-garden ]</div>
    <h1 class="hero-title">te9<span class="title-dot">.</span>dev</h1>
    <p class="hero-subtitle">...</p>
    <p class="hero-description">...</p>
    <div class="hero-cta">buttons</div>
  </div>
  <div class="hero-decoration">rings</div>
</section>
```

| Property | Value |
|---|---|
| min-height | calc(100vh - 60px) |
| display | flex |
| align-items | center |
| justify-content | center |
| position | relative |
| padding | 4rem 2rem |
| overflow | hidden |
| content max-width | 800px |

| Element | Style |
|---|---|
| Label | `var(--font-body)`, 0.875rem, `letter-spacing: 0.1em`, uppercase, bracket color: #E88500, text: #6B6B6B |
| Title | `var(--font-heading)`, `clamp(3rem, 8vw, 6rem)`, 700, line-height 1, color: #1A1A1A, dot: #E88500 |
| Subtitle | `var(--font-body)`, 1.25rem, color: #6B6B6B, line-height 1.6, accent color: #E88500 |
| Description | `var(--font-body)`, 1rem, #9A9A9A, max-width 600px, margin 0 auto 2rem, line-height 1.7 |

**Decorative rings:** 3 concentric circles with `ringPulse` animations on an 11s cycle.

| Ring | Size | Border | Animation |
|---|---|---|---|
| 1 | 200px | 1px solid #E0DDD8 | ringPulse1 11s infinite |
| 2 | 450px | 1px solid #E0DDD8 | ringPulse2 11s infinite 0.4s |
| 3 | 600px | 2px solid #E0DDD8 | ringPulse3 11s infinite 0.8s |

---

### Footer

Site footer with brand, navigation links, social icons, and status indicator.

```html
<footer class="site-footer">
  <div class="footer-content">
    <div class="footer-main">
      <div class="footer-brand">...</div>
      <div class="footer-links">...</div>
    </div>
    <div class="footer-bottom">...</div>
  </div>
</footer>
```

| Property | Value |
|---|---|
| background | `linear-gradient(to bottom, #EFEFEA, #F8F8F6)` |
| padding | 3rem 2rem 2rem |
| border-top | 1px solid #E0DDD8 |

| Element | Style |
|---|---|
| Logo | `var(--font-mono)`, 1.5rem, 700, color: #E88500 |
| Tagline | 0.875rem, color: #6B6B6B |
| Heading | 0.75rem, 600, uppercase, `letter-spacing: 0.1em`, #1A1A1A, margin-bottom: 1rem |
| Links | 0.875rem, #6B6B6B, hover: #E88500, transition: color 300ms |
| Social icons | flex, gap: 1rem, color: #6B6B6B, hover: #E88500 |
| Bottom | flex, space-between, align-items center, padding-top: 2rem, border-top: 1px solid #E0DDD8, 0.875rem, #9A9A9A |
| Status dot | 8px, background: #22C55E, border-radius: 50%, animation: pulse 2s infinite |

---

### Input / Select

```html
<input type="text" class="input" placeholder="..." />
<select class="select"><option>...</option></select>
```

| Property | Input | Select |
|---|---|---|
| width | 100% | 100% |
| padding | 0.75rem 1rem | 0.75rem 1rem |
| border | 1px solid #D4D4CC | 1px solid #D4D4CC |
| border-radius | 8px | 8px (bottom on focus: 0) |
| font-size | 0.875rem | 0.875rem |
| font-family | var(--font-body) | var(--font-body) |
| color | #1A1A1A | #1A1A1A |
| background | #FFFFFF | #FFFFFF |
| focus border | #E88500 | #E88500 |
| focus ring | `0 0 0 3px rgba(232, 133, 0, 0.15)` | `0 0 0 3px rgba(232, 133, 0, 0.15)` |
| appearance | — | none (custom chevron) |
| transition | all 200ms ease | all 200ms ease |

---

### Checkbox / Radio / Switch

**Checkbox:** `.checkbox-wrapper > input.checkbox + span`

| Property | Value |
|---|---|
| Size | 1.125rem × 1.125rem |
| Border | 1px solid #D4D4CC |
| Border-radius | 4px |
| Checked bg | #E88500 |
| Checked border | #E88500 |
| Checkmark | White |
| Transition | all 200ms ease |

**Radio:** `.radio-wrapper > input.radio + span` — Same size, border-radius 50%, dot instead of checkmark.

**Switch:** `.switch`

| Property | Value |
|---|---|
| Size | 2.25rem × 1.25rem |
| Background | #D4D4CC |
| Border-radius | 9999px |
| Knob size | 0.875rem |
| Knob bg | #FFFFFF, shadow: `0 1px 3px rgba(0,0,0,0.15)` |
| Checked bg | #E88500 |
| Checked translate | 1rem |
| Transition | all 300ms ease |

---

### Card

```html
<div class="card">
  <div class="card-title">Title</div>
  <p class="card-desc">Description</p>
</div>
```

| Property | Value |
|---|---|
| background | #FFFFFF |
| border | 1px solid #E0DDD8 |
| border-radius | 12px |
| padding | 1.5rem |
| box-shadow | var(--shadow-sm) |

Title: `var(--font-heading)`, 1.25rem, 600, #1A1A1A, margin-bottom 0.75rem, line-height 1.4.
Description: 0.875rem, #6B6B6B, line-height 1.6.

---

### Table

```html
<div class="table-container">
  <table class="table">
    <thead><tr><th>...</th></tr></thead>
    <tbody><tr><td>...</td></tr></tbody>
  </table>
</div>
```

| Property | Value |
|---|---|
| Container overflow | auto |
| Container border | 1px solid #E0DDD8 |
| Container border-radius | 8px |
| th background | #FAFAF8 |
| th font-weight | 600, color: #1A1A1A |
| th padding | 0.75rem 1rem |
| td padding | 0.75rem 1rem, color: #6B6B6B |
| td border-bottom | 1px solid #E8E8E0 |
| Striped row | `rgba(0,0,0,0.02)` |
| Font size | 0.875rem |

---

### List

```html
<ul class="list">
  <li class="list-item"><span class="list-item-icon">✓</span> Text</li>
  <li class="list-item list-item-spread">Label<span class="badge badge-success">Live</span></li>
</ul>
```

| Property | Value |
|---|---|
| list-style | none |
| border | 1px solid #E0DDD8 |
| border-radius | 12px |
| overflow | hidden |
| Item padding | 0.75rem 1rem |
| Item border-bottom | 1px solid #E8E8E0 |
| Item font-size | 0.875rem |
| Item color | #1A1A1A |
| Item gap | 0.75rem |
| Icon size | 16px |

`.list-item-spread` — `justify-content: space-between` for label + badge layout.

---

### Tabs

```html
<div class="tabs" data-tab-group="name">
  <div class="tab active" data-tab="panel1">Tab 1</div>
  <div class="tab" data-tab="panel2">Tab 2</div>
</div>
<div data-tab-panel="panel1">Content</div>
<div data-tab-panel="panel2" style="display:none">Content</div>
```

| Property | Value |
|---|---|
| display | flex |
| border-bottom | 1px solid #E0DDD8 |
| Tab padding | 0.75rem 1.5rem |
| Tab font-size | 0.875rem |
| Tab font-weight | 500 |
| Tab color | #6B6B6B |
| Tab active color | #1A1A1A |
| Tab active border-bottom | 2px solid #E88500 |
| Tab hover color | #1A1A1A |
| transition | color 200ms ease |

---

### Modal

```html
<div class="modal-overlay" id="id">
  <div class="modal">
    <button class="modal-close">×</button>
    <div class="modal-title">Title</div>
    <p class="modal-desc">Description</p>
    <div class="flex-row-end">buttons</div>
  </div>
</div>
```

| Property | Value |
|---|---|
| Overlay background | rgba(0,0,0,0.5) |
| Overlay backdrop-filter | blur(4px) |
| Overlay z-index | 600 |
| Overlay transition | all 300ms ease |
| Modal background | #FFFFFF |
| Modal border-radius | 24px |
| Modal padding | 2rem |
| Modal max-width | 500px |
| Modal shadow | `0 25px 50px rgba(0,0,0,0.16)` |
| Modal transform hidden | translateY(20px) |
| Modal transform visible | translateY(0) |
| Title | 1.5rem, 600 |
| Description | 0.875rem, line-height 1.6 |
| Close button | 2rem, border-radius 50% |

---

### Alert

```html
<div class="alert alert-success"><Icon /><span>Message</span></div>
```

| Variant | Class | bg | border | color | icon |
|---|---|---|---|---|---|
| Success | `.alert-success` | #F0FDF4 | #BBF7D0 | #15803D | check-circle |
| Warning | `.alert-warning` | #FFFBEB | #FDE68A | #B45309 | alert-triangle |
| Error | `.alert-error` | #FEF2F2 | #FECACA | #B91C1C | x-circle |
| Info | `.alert-info` | #EFF6FF | #BFDBFE | #1D4ED8 | info |
| Neutral | `.alert-neutral` | #FAFAF8 | #E0DDD8 | #374151 | — |

Common: flex, align-items center, gap 0.75rem, padding 1rem, border-radius 8px, 1px solid, font-size 0.875rem, icon 1.25rem.

---

### Toast

```html
<div class="toast"><Icon style="color:var(--color-success-500)" /><span>Message</span></div>
```

| Property | Value |
|---|---|
| display | flex, align-items center |
| gap | 0.75rem |
| padding | 1rem |
| background | #FFFFFF |
| border | 1px solid #E0DDD8 |
| border-radius | 8px |
| box-shadow | var(--shadow-lg) |
| font-size | 0.875rem |
| color | #1A1A1A |

---

### Badge

```html
<span class="badge badge-success">Live</span>
```

| Property | Value |
|---|---|
| display | inline-flex, align-items center |
| padding | 0.25rem 0.75rem |
| font-size | 0.75rem (12px) |
| font-weight | 500 |
| border-radius | 9999px |

| Variant | bg | color |
|---|---|---|
| `.badge-success` | #F0FDF4 | #15803D |
| `.badge-warning` | #FFFBEB | #B45309 |
| `.badge-error` | #FEF2F2 | #B91C1C |
| `.badge-info` | #EFF6FF | #1D4ED8 |

---

### Tooltip

```html
<div class="tooltip-container"><button>Hover me</button><div class="tooltip">Tooltip text</div></div>
```

| Property | Value |
|---|---|
| position | absolute, bottom calc(100% + 8px), left 50%, transform translateX(-50%) |
| background | #1A1A1A |
| color | #FFFFFF |
| padding | 0.5rem 0.75rem |
| border-radius | 6px (md) |
| font-size | 0.75rem |
| white-space | nowrap |
| opacity hidden/visible | 0 / 1 |
| transition | opacity 200ms ease |
| pointer-events | none |

---

### Avatar

```html
<div class="avatar">AB</div>
<!-- or with image -->
<div class="avatar"><img src="..." alt="..." /></div>
```

| Property | Value |
|---|---|
| width / height | 2.5rem |
| border-radius | 50% |
| background | var(--color-brand-bg) |
| font-size | 0.875rem (14px) |
| font-weight | 700 |
| color | #1A1A1A |
| overflow | hidden |
| img object-fit | cover |

---

### Tag Pill

```html
<span class="tag-pill">category</span>
```

| Property | Value |
|---|---|
| padding | 0.25rem 0.75rem |
| font-size | 0.6875rem |
| font-weight | 400 |
| border | none |
| border-radius | 2px |
| background | rgba(0, 168, 85, 0.08) |
| color | #008F47 |
| font-family | var(--font-body) |
| text-transform | lowercase |
| letter-spacing | 0.05em |
| hover background | darker tint |
| transition | all 300ms ease |
| cursor | default |

---

## Patterns

### Grid & Layout

- 8px base unit, `box-sizing: border-box` on all elements
- Max-width container: **1200px**
- Gutters: 16px (1rem) or 32px (2rem) only
- Margins scale with breakpoint: 16px → 24px → 32px
- Auto-fit grid: `repeat(auto-fit, minmax(300px, 1fr))` for garden cards
- Flex column for quick links with 1rem gap

| Strategy | Description | Use for |
|---|---|---|
| Responsive | Fluid columns using auto-fit/minmax | Garden card grid, editorial layouts |
| Adaptive | Fixed-width boxes that wrap at breakpoints | Quick link list, profile cards |
| Strict | Horizontal scroll at threshold | Data tables, code blocks |

### Forms

```html
<div class="form-stack">
  <div>
    <label class="form-label">Label</label>
    <input class="input" placeholder="..." />
  </div>
  <button class="btn btn-primary"><span class="btn-text">Submit</span></button>
</div>
```

- `.form-stack`: grid gap 1rem
- `.form-label`: 0.75rem, 600, uppercase, `letter-spacing: 0.05em`, color: #6B6B6B, margin-bottom: 0.5rem

### Navigation

- Fixed top, `backdrop-filter: blur(10px)`, scroll shadow at 100px threshold
- Navbar bg: `rgba(248, 248, 246, 0.9)` → scrolled: `rgba(248, 248, 246, 0.95)` + `0 4px 20px rgba(0,0,0,0.08)`

### Empty / Loading / Error States

Centered layout: emoji icon → heading (var(--font-heading), 600) → meta-text description → CTA button.

### Section Reveal

Intersection Observer-based reveal animation for below-fold sections.

- **Class:** `.section-reveal` → `.revealed`
- **Initial:** `opacity: 0; transform: translateY(30px);`
- **Revealed:** `opacity: 1; transform: translateY(0);`
- **Transition:** `all 800ms var(--ease-spring)`
- **Observer:** threshold 0.1, rootMargin `-60px`

### View Transitions

10 randomized page transition effects using the View Transitions API. On navigation:
1. Pick a random variant from the list
2. Add `transition-{variant}` class to `<html>`
3. Start view transition
4. Remove class on finished

Variants: slide, zoom, scale, drop, swipe, rotate, flip, curtain, blur, explode

### Stagger Entrance

- **Garden cards:** 100ms delay per card, `fly({ y: 20, duration: 500 })`
- **Quick links:** 50ms delay per link, `slide({ axis: 'y', duration: 300 })`

### Background Effects

Full-screen overlay effects for cultural layering. Purely presentational.

**Noise overlay:**
- Position: fixed, inset 0, z-index 9998
- Opacity: 0.02
- Background: SVG fractalNoise filter
- Pointer-events: none

**Scanlines overlay:**
- Position: fixed, inset 0, z-index 9999
- Background: `repeating-linear-gradient(to bottom, transparent 0, transparent 50%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.04) 100%)`
- Background-size: 100% 4px
- Opacity: 0.06
- Pointer-events: none

---

## Rules

### Mandatory Implementation

1. **Vanilla CSS** with `:root` custom properties + Tailwind utilities in Svelte templates (flex, grid, padding, margin). Component styles use scoped `<style>` blocks.
2. **Semantic class names** — `.garden-card`, `.hero-content`, not utility strings.
3. **Zero external CSS dependencies.** Only Google Fonts `<link>` allowed. No CSS frameworks.
4. **Mobile-first** responsive approach.
5. **Section padding:** `py-24` (6rem) for vertical, `px-8` (2rem) for horizontal.
6. **Antialiased font smoothing:** `-webkit-font-smoothing: antialiased` on body.
7. **Smooth scrolling:** `scroll-behavior: smooth` on html.
8. **font-display: swap** for all @font-face declarations.

### Accessibility (WCAG 2.1 AA)

| Combination | Ratio | Status |
|---|---|---|
| #1A1A1A on #F8F8F6 | 15.3:1 | ✓ Passes AA |
| #6B6B6B on #F8F8F6 | 4.7:1 | ✓ Passes AA |
| #9A9A9A on #F8F8F6 | 2.8:1 | ✗ Decorative only |
| #E88500 on #F8F8F6 | 3.8:1 | ✗ Large text only (≥24px) |
| #E88500 on #FFFFFF | 3.9:1 | ✗ Large text only |
| #C47000 on #FFFFFF | 5.1:1 | ✓ Passes AA |
| #FFFFFF on #E88500 | 3.9:1 | Large text only (button labels ≥15px bold) |
| #008F47 on #FFFFFF | 4.6:1 | ✓ Passes AA |

**Requirements:**
- All body text must use #1A1A1A on light backgrounds (15.3:1)
- Secondary text uses #6B6B6B (4.7:1 — passes AA)
- #9A9A9A is decorative only — never for meaningful text
- Accent #E88500 used for large text (≥24px) or icons only on light bg
- For small accent text, use #C47000 (5.1:1 — passes AA)
- Skip link: `<a href="#main-content" class="skip-link">Skip to content</a>`
- Focus ring: `:focus-visible { outline: 2px solid #E88500; outline-offset: 2px; }`
- Reduced motion: disable all keyframe animations, show final states

### Interaction States (5 required per component)

| State | Behavior |
|---|---|
| **Default** | Resting state with base styles |
| **Hover** | `transition: all 300ms ease` or `cubic-bezier(0.4, 0, 0.2, 1)`. Cards lift `translateY(-2px)`, buttons shift. |
| **Focus** | Outline ring via `:focus-visible`. Color: #E88500, offset: 2px. |
| **Active/pressed** | Subtle visual feedback (scale down, darker shade) |
| **Disabled** | `opacity: 0.5`, `cursor: not-allowed` |

### Spatial Hierarchy

| Level | Size | Usage |
|---|---|---|
| Micro | 2–4px | Icon-to-label gaps, tag padding, focus ring offset |
| Tight | 8–12px | Button internal gaps, list item spacing, scrollbar |
| Standard | 16–24px | Card padding, page padding, footer gaps |
| Comfortable | 32–48px | Section margins, hero padding, major separations |
| Spacious | 64–96px | Section padding-y, page-level whitespace |

### Design Principles

1. **Terminal Aesthetic** — The site evokes a developer's terminal: monospace labels, cursor blinks, prompt symbols (`›`), and sharp card edges. Use mono fonts for labels and navigation. Use sharp borders (radius-0) for content cards.

2. **Organic Growth** — The digital garden metaphor: content grows over time, sections are "seeded" not "published." Use green (#00A855) for growth indicators. Status dot pulses to show "alive." Tags use lowercase "experiments", "knowledge."

3. **Warm Minimalism** — Clean layout with warm undertones: not cold/clinical, not maximalist. Use warm off-white backgrounds (#F8F8F6, not pure white). Add subtle warmth to borders (#E0DDD8). Keep spacing generous.

4. **Accent Restraint** — Orange (#E88500) is used sparingly: labels, CTAs, and hover states only. Accent for section labels, button primary, nav active, logo prompt. Never fill large areas with accent.

5. **Dual Accent System** — Orange for interaction, green for status/growth. Two distinct semantic channels. Orange = "do this", green = "this is alive/growing."

6. **Progressive Disclosure** — Content reveals itself as needed: stagger animations, hover reveals, scroll-triggered sections. Cards fly in on scroll. Top border grows on hover. Radial glow appears on hover.

7. **Motion with Purpose** — 10 view transition variants create delightful navigation. Each serves the same function differently. Randomized transitions on page change. Consistent timing (250/550/800ms). Respect `prefers-reduced-motion`.

8. **Typographic Hierarchy** — Three font families create clear hierarchy: Bricolage (identity), JetBrains (technical), Lekton (narrative). Each font has a semantic role: heading, code, body.

9. **Cultural Layering** — Noise overlay + scanlines add texture without reducing readability. Noise at 2-3% opacity, scanlines at 6% opacity, `pointer-events: none` on both. Light theme uses even subtler effects.

10. **Consistent Interaction** — All interactive elements share the same hover pattern: `translateY(-2px)` + border/shadow change. Cards, buttons, links all lift 2px on hover. All use 300ms transition. All show accent color on hover.

11. **Accessible First** — Focus rings, skip links, reduced motion, and AA contrast are non-negotiable. Focus: 2px solid #E88500. Skip link at top. Reduced motion kills all animations. AA contrast for all meaningful text.

12. **Intentional Whitespace** — 6rem section padding, generous card padding, and centered content create breathing room. Section py: 6rem. Card padding: 2rem. Hero min-height: calc(100vh - 60px). Content is centered by default.

---

## Boilerplate

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>te9.dev</title>
  <!-- Font links -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Lekton:wght@400;700&display=swap" rel="stylesheet" />
  <!-- CSS variables -->
  <style>/* :root vars and reset */</style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <nav id="navbar" class="site-nav">...</nav>
  <main id="main-content">...</main>
  <footer class="site-footer">...</footer>
</body>
</html>
```

### CSS Reset

```css
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
a { text-decoration: none; color: inherit; }
button { cursor: pointer; border: none; background: none; font-family: inherit; }
img { display: block; max-width: 100%; }
```

### CSS Variables (`:root`)

```css
:root {
  --color-brand-bg: #F8F8F6;
  --color-brand-bg-secondary: #EFEFEA;
  --color-brand-dark: #1A1A1A;
  --color-accent: #E88500;
  --color-accent-light: #FFF4E6;
  --color-accent-dark: #C47000;
  --color-accent-gradient-start: #E88500;
  --color-accent-gradient-end: #D07000;
  --color-accent-hover-start: #F09500;
  --color-accent-hover-end: #E08000;
  --color-brand-muted: #6B6B6B;
  --color-brand-light: #9A9A9A;
  --color-garden-green: #00A855;
  --color-garden-green-light: #E6F9EF;
  --color-garden-green-dark: #008F47;
  --color-emerald: #059669;
  --color-emerald-light: #ECFDF5;
  --color-success-50: #F0FDF4;
  --color-success-500: #22C55E;
  --color-success-700: #15803D;
  --color-warning-50: #FFFBEB;
  --color-warning-500: #F59E0B;
  --color-warning-700: #B45309;
  --color-error-50: #FEF2F2;
  --color-error-500: #EF4444;
  --color-error-700: #B91C1C;
  --color-info-50: #EFF6FF;
  --color-info-500: #3B82F6;
  --color-info-700: #1D4ED8;
  --color-neutral-50: #FAFAF8;
  --color-neutral-100: #F5F5F0;
  --color-neutral-500: #6B7280;
  --color-neutral-700: #374151;
  --color-white: #FFFFFF;
  --color-navbar-bg: rgba(248, 248, 246, 0.9);
  --color-overlay: rgba(0, 0, 0, 0.3);
  --color-modal-backdrop: rgba(0, 0, 0, 0.5);
  --color-input-border: #D4D4CC;
  --color-border-subtle: #E0DDD8;
  --color-border-hover: #CCCCC4;
  --color-border-secondary: #E8E8E0;
  --color-border-tertiary: #D4D4CC;
  --font-heading: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Lekton', monospace;
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-moderate: 500ms;
  --duration-slow: 550ms;
  --duration-slower: 800ms;
  --duration-pulse: 2000ms;
  --duration-ring: 11000ms;
  --duration-cursor: 500ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.2, 0.8, 0.2, 1);
  --radius-none: 0;
  --radius-xs: 0.125rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 24px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 40px rgba(0,0,0,0.12);
  --shadow-2xl: 0 25px 50px rgba(0,0,0,0.16);
  --shadow-accent: 0 8px 25px rgba(232, 133, 0, 0.25);
  --shadow-accent-sm: 0 4px 12px rgba(232, 133, 0, 0.15);
  --shadow-inner: inset 0 2px 4px rgba(0,0,0,0.06);
  --border-subtle: 1px solid #E0DDD8;
}
```

### Body CSS

```css
body {
  font-family: var(--font-body);
  background: var(--color-brand-bg);
  color: var(--color-brand-dark);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
html { scroll-behavior: smooth; }
```

### Skip Link CSS

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  background: #FFFFFF;
  padding: 0.5rem 1rem;
  z-index: 10000;
  font-size: 0.875rem;
  border: 2px solid #E88500;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
}
```

### Focus Visible CSS

```css
:focus-visible {
  outline: 2px solid #E88500;
  outline-offset: 2px;
}
```

### Navbar Scroll JS

```js
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 100);
});
```

### Scroll Reveal JS

```js
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.section-reveal').forEach(el => revealObserver.observe(el));
```

### View Transition JS

```js
onNavigate((navigation) => {
  if (!document.startViewTransition) return;
  const transitions = ['slide', 'zoom', 'scale', 'drop', 'swipe', 'rotate', 'flip', 'curtain', 'blur', 'explode'];
  const random = transitions[Math.floor(Math.random() * transitions.length)];
  document.documentElement.classList.add(`transition-${random}`);
  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();
      await navigation.complete;
    }).finished.then(() => {
      document.documentElement.classList.remove(`transition-${random}`);
    });
  });
});
```

### Reduced Motion CSS

```css
@media (prefers-reduced-motion: reduce) {
  .section-reveal { opacity: 1; transform: none; transition: none; }
  .animate-fade-in-up { animation: none; opacity: 1; transform: none; }
  .stagger-in > * { animation: none; opacity: 1; transform: none; }
  .timeline-line { animation: none; height: 100%; }
  .scroll-indicator { animation: none; }
  .deco-ring { animation: none; opacity: 0.1; }
}
```

### Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| base | 0 | Default flow |
| dropdown | 100 | Dropdown menus |
| sticky | 200 | Sticky headers |
| overlay | 500 | Overlays, drawers |
| modal | 600 | Modal dialogs |
| popover | 700 | Popovers, tooltips |
| toast | 800 | Toast notifications |
| navbar | 1000 | Site navigation |
| effects | 9998 | Noise overlay |
| scanlines | 9999 | Scanline overlay |
| skipLink | 10000 | Skip to content link |