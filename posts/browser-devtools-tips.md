---
title: Browser DevTools Tips
date: 2025-02-15
description: Master browser DevTools with these essential tips that will supercharge your debugging workflow.
---

# Browser DevTools Tips

DevTools is your most powerful debugging ally. Most developers barely scratch the surface. Here are the features that will transform your workflow.

## Quick Console Tricks

Log objects with style:

```javascript
console.table(arrayOfObjects)
console.dir(element)
console.time('operation')
// ... code ...
console.timeEnd('operation')
```

Use `$_` to reference the last result and `$0` to reference the selected element.

## Network Throttling

Test slow connections:

1. Open Network tab
2. Click "Throttling" dropdown
3. Select "Slow 3G" or create custom profiles

Simulate real-world conditions for all users.

## Device Mode

Test responsiveness:

- Click device icon (Ctrl+Shift+M)
- Choose device presets
- Test touch events
- Check media queries

## Element Editing

Edit styles in real-time:

- Click any CSS value and modify
- Use arrow keys to increment/decrement
- Add classes in the Classes panel
- Drag elements to reorder

## Breakpoints That Matter

Beyond `debugger`:

```javascript
// Conditional breakpoint
// Right-click line number → Add conditional breakpoint
x > 10

// XHR breakpoints
// Sources → XHR/fetch Breakpoints
```

## Performance Profiling

Find bottlenecks:

1. Performance tab → Record
2. Interact with your page
3. Stop recording
4. Analyze flame chart

Look for long tasks blocking the main thread.

## Application Storage

Inspect storage:

- Local Storage
- Session Storage
- IndexedDB
- Cookies
- Service Workers

All accessible in the Application tab.

## Command Menu

Press Ctrl+Shift+P:

- "Screenshot" → Capture full page
- "Coverage" → Find unused CSS/JS
- "Layers" → See compositing layers

## Master Your Tools

Spend time exploring DevTools. Every feature you learn saves hours of debugging later.