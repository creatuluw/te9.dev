---
title: Implementing Dark Mode
date: 2025-02-17
description: Add dark mode to your website using CSS custom properties and prefers-color-scheme.
---

# Implementing Dark Mode

Dark mode isn't just a trend—it reduces eye strain and saves battery on OLED screens. Here's how to implement it properly.

## CSS Custom Properties

Define color tokens for both modes:

```css
:root {
  --bg: #ffffff;
  --text: #1a1a1a;
  --accent: #0066cc;
}

[data-theme="dark"] {
  --bg: #1a1a1a;
  --text: #e5e5e5;
  --accent: #66b3ff;
}
```

Use these throughout your styles:

```css
body {
  background: var(--bg);
  color: var(--text);
}
```

## System Preference

Respect user's system setting automatically:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e5e5e5;
  }
}
```

## Manual Toggle

Let users override their preference:

```javascript
const toggle = document.querySelector('#theme-toggle');

toggle.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});
```

## Persist Choice

Remember user's preference:

```javascript
// On load
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
```

## Avoid Flash

Prevent flash of unstyled content:

```html
<script>
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  }
</script>
```

Place this in `<head>` before CSS loads.

## Test Both Modes

Always test your design in both modes. What looks good in light might need adjustment in dark.