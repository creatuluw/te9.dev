---
title: CSS Animations Essentials
date: 2025-02-15
description: Create smooth, performant animations with CSS that enhance user experience without JavaScript.
---

# CSS Animations Essentials

CSS animations bring interfaces to life. When used thoughtfully, they guide users, provide feedback, and make interactions feel polished. Here's how to create animations that perform well and serve a purpose.

## Transitions for Simple Changes

Use transitions for state changes:

```css
.button {
  background: #3b82f6;
  transition: background 0.3s ease, transform 0.2s ease;
}

.button:hover {
  background: #2563eb;
  transform: translateY(-2px);
}
```

Transitions are perfect for hover effects and focus states.

## Keyframe Animations

For complex sequences, use keyframes:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.6s ease-out;
}
```

## Timing Functions

Choose the right easing:

```css
/* Smooth deceleration */
transition-timing-function: ease-out;

/* Bounce effect */
animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Linear movement */
animation-timing-function: linear;
```

Avoid `ease-in` for user interactions—it feels sluggish.

## Performance Matters

Only animate these properties for 60fps:

```css
/* Good - GPU accelerated */
transform: translateX(100px);
opacity: 0;

/* Avoid - causes repaints */
width: 200px;
height: 100px;
left: 50px;
```

Use `will-change` sparingly:

```css
.animated-element {
  will-change: transform, opacity;
}
```

## Controlling Animations

Pause and resume animations:

```css
.animation {
  animation-play-state: paused;
}

.animation:hover {
  animation-play-state: running;
}
```

Loop animations infinitely:

```css
.spinner {
  animation: spin 1s linear infinite;
}
```

## Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Purpose Over Flash

Animations should:
- Guide attention
- Provide feedback
- Show relationships
- Add personality

Avoid animations that distract or slow users down. Subtle usually beats dramatic.