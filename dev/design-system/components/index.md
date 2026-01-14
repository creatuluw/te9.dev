# Component Index

A complete reference to all available components in the Gray Design System. This index provides quick access to component specifications, usage guidelines, and implementation examples.

## Component Library

### Interactive Elements

#### [Button](button.md)
Primary and secondary buttons with multiple variants and sizes.
- **Variants**: Primary, Secondary, Tertiary (link style)
- **Sizes**: Regular, Small
- **Features**: Full width support, icons, disabled states, focus states
- **Use Cases**: Primary CTAs, form submissions, navigation actions

#### [Form](form.md)
Complete form system including inputs, selects, textareas, checkboxes, and radio buttons.
- **Components**: Text inputs, Email, Password, Search, Textarea, Select, Checkbox, Radio
- **Features**: Validation states, helper text, required fields, error handling
- **Use Cases**: Login forms, contact forms, registration, search, data entry

### Layout Components

#### [Card](card.md)
Container component for grouping related content with consistent styling.
- **Variants**: Standard, Elevated, Interactive
- **Features**: Shadow system, borders, backgrounds, responsive
- **Use Cases**: Feature displays, content grouping, pricing, testimonials

#### [Modal](modal.md)
Overlay dialog for focused interactions and content.
- **Variants**: Standard, Alert, Confirmation
- **Features**: Backdrop, animation, accessibility, keyboard controls
- **Use Cases**: Forms, alerts, confirmations, detailed content

### Navigation Components

#### [Header](header.md)
Site navigation header with logo and menu items.
- **Variants**: Standard, Minimal, Transparent
- **Features**: Responsive, mobile menu, gradient borders
- **Use Cases**: Site navigation, branding, primary actions

#### [Footer](footer.md)
Site footer with links and organizational information.
- **Variants**: Standard, Minimal, Multi-column
- **Features**: Link groups, social icons, legal information
- **Use Cases**: Site navigation, contact information, legal pages

### Content Components

#### [Typography](typography.md)
Text components with consistent styling and hierarchy.
- **Components**: Headings, paragraphs, links, quotes, lists
- **Features**: Responsive scaling, gradients, semantic structure
- **Use Cases**: Content display, documentation, marketing copy

#### [Badge](badge.md)
Small status or category indicator.
- **Variants**: Default, Success, Warning, Error
- **Features**: Pill shape, outline options, icons
- **Use Cases**: Status indicators, tags, categories

### Feedback Components

#### [Alert](alert.md)
User feedback message with severity levels.
- **Variants**: Info, Success, Warning, Error
- **Features**: Dismissible, icons, auto-dismiss
- **Use Cases**: Notifications, validation messages, system alerts

#### [Toast](toast.md)
Non-intrusive notification messages.
- **Variants**: Default, Success, Error, Info
- **Features**: Positioning, animation, stacking
- **Use Cases**: Success confirmations, error notifications, updates

## Component Usage Matrix

| Component | Mobile | Tablet | Desktop | Dark Mode |
|-----------|--------|--------|---------|-----------|
| Button | ✅ | ✅ | ✅ | Planned |
| Form | ✅ | ✅ | ✅ | Planned |
| Card | ✅ | ✅ | ✅ | Planned |
| Modal | ✅ | ✅ | ✅ | Planned |
| Header | ✅ | ✅ | ✅ | Planned |
| Footer | ✅ | ✅ | ✅ | Planned |
| Typography | ✅ | ✅ | ✅ | Planned |
| Badge | ✅ | ✅ | ✅ | Planned |
| Alert | ✅ | ✅ | ✅ | Planned |
| Toast | ✅ | ✅ | ✅ | Planned |

## Quick Reference

### Buttons
```html
<button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Primary Button
</button>

<button class="btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
  Small Button
</button>
```

### Forms
```html
<input class="form-input text-sm w-full" type="text" placeholder="Enter text" />
<textarea class="form-textarea text-sm w-full" rows="4"></textarea>
<select class="form-select w-full"><option>Option</option></select>
```

### Cards
```html
<div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
  <h3 class="font-semibold text-zinc-900">Card Title</h3>
  <p class="text-sm text-zinc-500">Card content</p>
</div>
```

## Component Patterns

### Hero Section Pattern
```html
<!-- Hero with heading and buttons -->
<h1 class="font-inter-tight text-4xl md:text-5xl font-bold text-zinc-900">
  Hero Heading
</h1>
<div class="space-x-4">
  <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
    Primary Action
  </button>
  <button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
    Secondary Action
  </button>
</div>
```

### Form Section Pattern
```html
<!-- Standard form layout -->
<form>
  <div class="space-y-4">
    <div>
      <label class="text-sm text-zinc-800 font-medium mb-2">Label</label>
      <input class="form-input text-sm w-full" />
    </div>
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Submit
    </button>
  </div>
</form>
```

### Card Grid Pattern
```html
<!-- Responsive card grid -->
<div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
    <!-- Card content -->
  </div>
</div>
```

## Component Categories

### Core Components
These are fundamental components used throughout the system:
- Button
- Form
- Typography

### Layout Components
Components that structure and organize content:
- Card
- Header
- Footer
- Modal

### Interactive Components
Components that respond to user interaction:
- Button
- Form
- Modal

### Feedback Components
Components that provide user feedback:
- Alert
- Toast
- Badge

## Usage Guidelines

### Component Selection
1. **Use Buttons** for primary and secondary actions
2. **Use Forms** for user input and data collection
3. **Use Cards** to group related content
4. **Use Modals** for focused interactions
5. **Use Alerts** for important messages
6. **Use Toasts** for non-intrusive notifications

### Component Composition
Components are designed to work together:
- Forms contain buttons for submission
- Cards can contain forms, buttons, and other components
- Modals can contain forms, cards, and interactive content
- Headers and footers contain buttons and links

### Accessibility
All components follow WCAG AA guidelines:
- Keyboard navigation support
- ARIA attributes where needed
- Focus states and indicators
- Proper color contrast (≥4.5:1)
- Screen reader compatibility

## Component Status

### Stable
These components are production-ready:
- ✅ Button
- ✅ Form
- ✅ Card
- ✅ Header
- ✅ Footer
- ✅ Typography

### In Development
These components are currently being developed:
- 🚧 Modal
- 🚧 Badge
- 🚧 Alert
- 🚧 Toast

### Planned
These components are planned for future releases:
- 📋 Dropdown
- 📋 Tabs
- 📋 Accordion
- 📋 Pagination
- 📋 Breadcrumbs

## Contributing Components

When adding new components to the system:

1. **Create a new markdown file** in the `components/` directory
2. **Follow the documentation template**:
   - Component overview
   - Variants and sizes
   - States and interactions
   - Props and configuration
   - Usage examples
   - Accessibility notes
3. **Update this index** with the new component
4. **Add examples** to the `examples/` folder
5. **Test thoroughly** across breakpoints and browsers
6. **Document accessibility** features and ARIA attributes

## Related Documentation

- **[Tokens](../tokens/)**: Color, typography, and spacing tokens
- **[Layouts](../layouts/)**: Layout patterns and grid systems
- **[Guidelines](../guidelines/)**: Usage guidelines and best practices
- **[Examples](../examples/)**: Complete page implementations

## Quick Links

### By Purpose
- **[Actions](button.md)**: Buttons for user actions
- **[Input](form.md)**: Form components for data entry
- **[Display](card.md)**: Cards for content grouping
- **[Navigation](header.md)**: Headers and footers for site navigation
- **[Feedback](alert.md)**: Alerts and toasts for user feedback

### By Complexity
- **[Simple](button.md)**: Button, Badge
- **[Medium](form.md)**: Form, Card, Alert
- **[Complex](modal.md)**: Modal, Header with navigation

### By Frequency
- **[Most Used](button.md)**: Button, Form, Card
- **[Commonly Used](typography.md)**: Typography, Header, Footer
- **[Occasionally Used](alert.md)**: Modal, Alert, Toast

---

**Note**: This index is updated as new components are added to the system. Always check individual component documentation for detailed specifications, props, and usage examples. Use components exactly as documented to maintain consistency across the design system.