---
type: Learning
title: Design System Architecture
description: Dark terminal aesthetic design tokens and component patterns
timestamp: "2026-06-25T18:30:00.000Z"
---

# Design System Architecture

The design system (`.design-system/design-system-te9.dev.html`) is a standalone HTML document documenting every token and component extracted from the actual Svelte source code.

## Color System

Dark-first with layered black surfaces:
- **Surface**: `#0a0a0a` (base), `#0f0f0f` (raised), `#111111` (elevated), `#1a1a1a` (sunken)
- **Accent**: `#ff9500` (amber/orange) for primary CTAs, navigation prompts, decorative rings
- **Emerald**: `#00ff88` for status indicators, garden card tags, gradient accent borders
- **Text**: `#e8e8e8` (primary), `#888888` (secondary), `#666666` (tertiary)
- **Borders**: `#2a2a2a` (subtle), `#333333` (strong)
- **Selection**: `#10b981` (emerald green)

## Typography

Four font families loaded from Google Fonts via `src/app.html`:
- **Bricolage Grotesque** — display and body text
- **JetBrains Mono** — code snippets, timestamps, metadata
- **Lekton** — labels, navigation, UI text (typewriter aesthetic)
- **Space Grotesk** — alternative UI font

## Background Effects

Defined in `BackgroundEffects.svelte`:
- **Noise overlay**: Fixed SVG fractal noise at 3% opacity (z-index 9998)
- **Scanlines**: Fixed CSS linear-gradient CRT scanlines at 10% opacity, 4px spacing (z-index 9999)

## Component Patterns

- **Card accent border**: Garden and digest cards use `::before` with `background: linear-gradient(90deg, #00ff88, #ff9500)` scaling from `scaleX(0)` to `scaleX(1)` on hover via `transition: transform 300ms ease`
- **Hover glow**: Cards show a radial gradient accent (`rgba(255, 149, 0, 0.03)`) on hover
- **Buttons**: Primary buttons use a gradient overlay animation (`left: -100% → 0`) with `transform: translateY(-2px)` and accent shadow on hover
- **Navigation**: Fixed header with `› te9.dev_` terminal prompt, JS typing effect, cursor blink animation

## View Transitions

10 random CSS view transition styles per navigation (defined in `+layout.svelte`):
slide, zoom, rotate, flip, curtain, blur, spiral, explode, drop, swipe. Each has paired `old`/`new` keyframe animations. Reduced motion respected via `@media (prefers-reduced-motion)`.
