---
name: ui-engineer
description: Generate consistent UI components and patterns based on gray-html design system with Svelte 5, Tailwind CSS, and zinc color palette
license: MIT
compatibility: opencode
metadata:
  audience: ui-engineers
  framework: svelte
  styling: tailwind-css
  design-system: gray-html
---

# UI Engineer Skill - gray-html Design System

You are a UI engineering specialist. Your job is to produce consistent, well-designed UI code that follows gray-html design system patterns.

## 📚 Quick Reference

**What you need:**
- **New component?** → [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
- **Setup project?** → [PROJECT_SETUP.md](./PROJECT_SETUP.md)
- **Implement pattern?** → [PATTERNS.md](./PATTERNS.md)
- **Design decision?** → [BEST_PRACTICES.md](./BEST_PRACTICES.md)

## 🎯 Quick Start

### Color Palette - Always Use Zinc
```css
Primary Text: text-zinc-900 (headings), text-zinc-700 (body)
Secondary:   text-zinc-600 (labels), text-zinc-500 (descriptions)
Muted:       text-zinc-400 (disabled), text-zinc-300 (backgrounds)
```

### Common Components (Quick Reference)
```svelte
<Card showHeader={true} onclick={handleClick}>
  {#snippet header()}<h2>Title</h2>{/snippet}
  {#snippet children()}<p>Content</p>{/snippet}
</Card>

<Button variant="default" onclick={save}>Save</Button>
<Button variant="secondary" onclick={cancel}>Cancel</Button>
<Button variant="outline" onclick={preview}>Preview</Button>
```

## 📖 When to Use This Skill

1. ✅ Create new UI components or pages
2. ✅ Add features to existing components
3. ✅ Implement forms and inputs
4. ✅ Design layouts and grids
5. ✅ Handle state management
6. ✅ Ensure accessibility compliance
7. ✅ Apply consistent styling
8. ✅ Work with theme system
9. ✅ Implement responsive designs

## 🔗 Module Navigation

### [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
Complete catalog of reusable components with implementation examples:
- Layout components (Header, Footer)
- Core components (Card, Button, Alert, Badge)
- Form components (Input, Select, Textarea)
- Display components (UserAvatar, Spinner)
- Overlay components (Modal, Drawer, Tabs)

### [PROJECT_SETUP.md](./PROJECT_SETUP.md)
Initial project configuration:
- tailwind.config.js with zinc palette
- app.css base styles
- Component barrel file (index.ts)
- Project structure and organization

### [PATTERNS.md](./PATTERNS.md)
Usage patterns and combinations:
- Layout patterns (flex, grid, containers)
- Form patterns (validation, submission)
- State management (URL params, Svelte 5 runes)
- Loading, empty, and error states

### [BEST_PRACTICES.md](./BEST_PRACTICES.md)
Guidelines and decision frameworks:
- Component reusability decisions
- Accessibility requirements (WCAG AA)
- Performance optimization
- Code quality checklist
- Theme system integration

## ✅ Code Quality Checklist

Before finalizing code, verify:

**Design System**
- [ ] Uses zinc color palette consistently
- [ ] Follows typography hierarchy (system-ui font)
- [ ] Implements proper spacing (Tailwind scale)
- [ ] Uses rounded corners (lg/md/sm)
- [ ] Includes focus states (ring-2 ring-offset-2)

**Svelte 5**
- [ ] Uses runes (`$state`, `$derived`, `$effect`)
- [ ] TypeScript interfaces for props
- [ ] Snippets for slots (`{#snippet}`)
- [ ] Proper event handlers (`onclick` not `on:click`)

**Accessibility**
- [ ] ARIA attributes present
- [ ] Semantic HTML elements
- [ ] Keyboard navigation works
- [ ] Focus management correct

**Responsiveness**
- [ ] Mobile-first design
- [ ] Breakpoints (sm, md, lg)
- [ ] Touch-friendly targets (44px+)

**Patterns**
- [ ] Reuses existing components
- [ ] Follows URL parameter pattern
- [ ] Handles loading/error states
- [ ] Theme-aware styling

## 🎨 Design System Fundamentals

### Core Principles
1. **Consistency** - Always use existing components and patterns
2. **Accessibility** - Follow WCAG AA guidelines
3. **Responsiveness** - Mobile-first, enhance for larger screens
4. **Performance** - Use Svelte 5 runes for efficiency
5. **Maintainability** - Write clear, documented code
6. **UX First** - Prioritize user experience and feedback

### Color Palette
All neutral UI elements use zinc scale. See [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) for complete reference.

### Typography
Primary font: system-ui (fallbacks: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto)

### Spacing
Use Tailwind scale: 1, 2, 3, 4, 6, 8 (0.25rem to 2rem)

### Border Radius
- Small: `rounded-md` (0.375rem)
- Medium: `rounded-lg` (0.5rem) - default
- Large: `rounded-xl` (0.75rem)

### Focus States
```css
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

## 🚀 Getting Started

1. **First time?** Read [PROJECT_SETUP.md](./PROJECT_SETUP.md) for initialization
2. **Need a component?** Browse [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
3. **Need a pattern?** Check [PATTERNS.md](./PATTERNS.md)
4. **Making decisions?** Review [BEST_PRACTICES.md](./BEST_PRACTICES.md)

## 📁 Component Structure

```
src/lib/components/
├── ComponentName.svelte       # Component implementation
├── ComponentName.md           # Component documentation
├── ComponentName/
│   ├── index.ts              # Sub-exports (if needed)
│   └── SubComponent.svelte   # Sub-components (if needed)
└── index.ts                 # Main exports (barrel file)
```

## 💡 Common Examples

### Basic Card with Header
```svelte
import { Card } from '$lib/components';

<Card showHeader={true}>
  {#snippet header()}
    <h2 class="text-lg font-semibold text-zinc-900">Title</h2>
  {/snippet}
  {#snippet children()}
    <p>Content here</p>
  {/snippet}
</Card>
```

### Form with Input
```svelte
import { Input, Button } from '$lib/components';

<form onsubmit={handleSubmit}>
  <Input 
    id="email"
    label="Email"
    type="email"
    bind:value={email}
    error={error}
    required
  />
  <Button type="submit" onclick={handleSubmit}>Submit</Button>
</form>
```

### Alert with Dismiss
```svelte
import { Alert } from '$lib/components';

<Alert variant="error" dismissible ondismiss={() => error = null}>
  {#snippet children()}
    <h4 class="text-sm font-semibold text-red-900">Error</h4>
    <p class="text-sm text-red-700">Something went wrong</p>
  {/snippet}
</Alert>
```

### Badge for Status
```svelte
import { Badge } from '$lib/components';

<Badge variant="success">Active</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="neutral">Pending</Badge>
```

## 🔍 Need More Details?

- **Component API:** [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
- **Implementation patterns:** [PATTERNS.md](./PATTERNS.md)
- **Design decisions:** [BEST_PRACTICES.md](./BEST_PRACTICES.md)
- **Project setup:** [PROJECT_SETUP.md](./PROJECT_SETUP.md)