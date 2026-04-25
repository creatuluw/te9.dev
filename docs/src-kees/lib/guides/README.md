# Guides System

This directory contains the guides system for providing in-app help and documentation to users.

## Overview

The guides system provides contextual help modals that explain page features and functionality in Dutch. Each page can have its own guide that users can access via a help button (question mark icon).

## File Structure

```
src/lib/guides/
├── README.md          # This file - documentation
└── guides.json        # All guide content definitions
```

## URL Pattern Matching System

The guides system uses URL patterns as keys in `guides.json` to determine which guide to display on a given page. The Header component automatically matches the current URL against these patterns.

### Pattern Syntax

URL patterns used as keys in `guides.json` support:
- **Static segments**: Exact match required (e.g., `/mijn-werk`)
- **Dynamic segments**: Match any value (e.g., `/work/[id]`)
- **Query parameters**: Exact match required (e.g., `?tab=notities`)

### Pattern Examples in guides.json

```json
{
  "/": {
    "title": "Homepage - Handleiding",
    "sections": [...]
  },
  "/mijn-werk": {
    "title": "Mijn Werk - Handleiding",
    "sections": [...]
  },
  "/work/[id]": {
    "title": "Work Detail - Handleiding",
    "sections": [...]
  },
  "/work/[id]?tab=notities": {
    "title": "Work Detail - Handleiding",
    "sections": [...]
  }
}
```

### How It Works

1. The Header component reads all keys from `guides.json` (which are URL patterns)
2. For each pattern, it checks if the current URL matches
3. When a pattern matches, the corresponding guide content is displayed
4. If no pattern matches, no guide is shown

### Adding New Guides

To add a guide for a new URL pattern, simply add a new entry to `guides.json` with the URL pattern as the key:

```json
{
  "existing-guides": { ... },
  "/your-page": {
    "title": "Your Page - Handleiding",
    "sections": [
      {
        "heading": "Overzicht",
        "content": "Description of what this page does..."
      }
    ]
  },
  "/your-page/[id]?tab=notities": {
    "title": "Your Page (Notes Tab) - Handleiding",
    "sections": [
      {
        "heading": "Notes Tab",
        "content": "This guide only appears when viewing the notes tab."
      }
    ]
  }
}
```

### Pattern Matching Rules

- Pattern segments must match exactly (same count and structure)
- Dynamic segments `[anything]` match any value
- Query parameters must match exactly (all specified params must match)
- The first matching pattern is used (order of JSON properties matters for overlapping patterns)

### Common Patterns

| Pattern | Description | Example URLs |
|---------|-------------|--------------|
| `/` | Root/homepage | `/` |
| `/page` | Static route | `/mijn-werk` |
| `/page/[id]` | Dynamic route | `/work/1718`, `/processes/42` |
| `/page/[id]?tab=x` | With query param | `/work/1718?tab=notities` |
| `/page/[id]?a=1&b=2` | Multiple params | `/work/1718?tab=notities&other=value` |

## Guide Data Structure

All guides are defined in `guides.json` with URL patterns as keys:

```json
{
  "/": {
    "title": "Page Title - Handleiding",
    "sections": [
      {
        "heading": "Section Heading",
        "content": "Paragraph text content (optional)"
      },
      {
        "heading": "Another Section",
        "content": "More text content",
        "items": [
          "**Bold text**: Regular text for list items",
          "Another list item with **bold** text"
        ]
      }
    ]
  },
  "/mijn-werk": {
    "title": "Mijn Werk - Handleiding",
    "sections": [...]
  },
  "/work/[id]?tab=notities": {
    "title": "Work Detail (Notes) - Handleiding",
    "sections": [...]
  }
}
```

### Key Components

- **`key`**: URL pattern that triggers this guide (e.g., `"/mijn-werk"`, `"/work/[id]?tab=notities"`)
- **`title`**: Modal title shown at the top
- **`sections`**: Array of content sections
  - **`heading`**: Section heading (required)
  - **`content`**: Paragraph text (optional)
  - **`items`**: Bulleted list items (optional)
    - Use `**text**` for bold formatting
    - Each item becomes a bullet point with an orange dot

## Implementation Guide

### Step 1: Add Guide to guides.json

Simply add a new entry to `src/lib/guides/guides.json` with the URL pattern as the key:

```json
{
  "existing-guides": { ... },
  "/your-page": {
    "title": "Your Page - Handleiding",
    "sections": [
      {
        "heading": "Overzicht",
        "content": "Description of what this page does..."
      },
      {
        "heading": "Functionaliteiten",
        "items": [
          "**Feature 1**: Description of first feature",
          "**Feature 2**: Description of second feature"
        ]
      }
    ]
  },
  "/your-page/[id]?tab=notities": {
    "title": "Your Page (Notes Tab) - Handleiding",
    "sections": [
      {
        "heading": "Notes Tab",
        "content": "This guide only appears when viewing the notes tab."
      }
    ]
  }
}
```

The Header component will automatically match URLs against these patterns and show the guide when a match is found.

### Step 2: (Optional) Add Guide Button to Page

**Note**: The guide system is integrated into the global Header component. The guide icon will automatically appear in the header when the URL matches a pattern in `guides.json`. No manual implementation is required for most pages.

If you need manual control over the guide icon's placement in your page's `+page.svelte` file:

```svelte
<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import { MessageCircleQuestionMark } from 'lucide-svelte';
  import { IconButton } from '$lib/components';
  import guidesData from '$lib/guides/guides.json';
  
  // ... other imports
</script>
```

### Step 3: Add State and Guide Reference

```svelte
<script lang="ts">
  // ... other code
  
  // Help modal state
  let helpModalOpen = $state(false);
  const guide = guidesData['your-page']; // Use your page key
</script>
```

### Step 4: Add Help Button

Add the help button icon in your page header:

```svelte
<div class="flex items-start justify-between">
  <div>
    <h1 class="text-2xl font-semibold text-zinc-900 font-aspekta">Your Page</h1>
    <p class="text-zinc-600 mt-1">Page description</p>
  </div>
  <div class="flex items-center gap-2">
    <IconButton
      icon={MessageCircleQuestionMark}
      variant="ghost"
      size="default"
      tooltip="Hulp"
      tooltipPosition="left"
      onclick={() => helpModalOpen = true}
    />
    <!-- Other buttons -->
  </div>
</div>
```

### Step 5: Add Help Modal

Add the modal component at the end of your template (before `</svelte:head>` or at the end):

```svelte
<!-- Help Modal -->
<Modal 
  bind:open={helpModalOpen} 
  title={guide.title} 
  size="custom" 
  customWidth="40vw" 
  maxContentHeight="60vh"
>
  <div class="space-y-6">
    {#each guide.sections as section}
      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-zinc-900 font-aspekta">
          {section.heading}
        </h3>
        {#if section.content}
          <p class="text-zinc-700 leading-relaxed">{section.content}</p>
        {/if}
        {#if section.items}
          <ul class="space-y-2 mt-3">
            {#each section.items as item}
              <li class="flex items-start gap-2 text-zinc-700">
                <span class="text-orange-500 leading-relaxed">•</span>
                <span class="flex-1 leading-relaxed">
                  {@html item.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>')}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>
</Modal>
```

## Complete Example

See `src/routes/mijn-werk/+page.svelte` for a complete working implementation.

### Minimal Example

```svelte
<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import { MessageCircleQuestionMark } from 'lucide-svelte';
  import { IconButton } from '$lib/components';
  import guidesData from '$lib/guides/guides.json';
  
  let helpModalOpen = $state(false);
  const guide = guidesData['my-page'];
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-start justify-between mb-6">
    <h1 class="text-2xl font-semibold text-zinc-900">My Page</h1>
    <IconButton
      icon={MessageCircleQuestionMark}
      variant="ghost"
      tooltip="Hulp"
      onclick={() => helpModalOpen = true}
    />
  </div>
  
  <!-- Your page content -->
</div>

<!-- Help Modal -->
<Modal 
  bind:open={helpModalOpen} 
  title={guide.title} 
  size="custom" 
  customWidth="40vw" 
  maxContentHeight="60vh"
>
  <div class="space-y-6">
    {#each guide.sections as section}
      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-zinc-900 font-aspekta">
          {section.heading}
        </h3>
        {#if section.content}
          <p class="text-zinc-700 leading-relaxed">{section.content}</p>
        {/if}
        {#if section.items}
          <ul class="space-y-2 mt-3">
            {#each section.items as item}
              <li class="flex items-start gap-2 text-zinc-700">
                <span class="text-orange-500 leading-relaxed">•</span>
                <span class="flex-1 leading-relaxed">
                  {@html item.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>')}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>
</Modal>
```

## Styling Guidelines

### Modal Configuration

- **Width**: `40vw` (40% of viewport width) for comfortable reading
- **Max Height**: `60vh` (60% of viewport height) with automatic scrolling
- **Size**: Use `size="custom"` with `customWidth` and `maxContentHeight`

### Content Styling

- **Headings**: Use `font-aspekta` for section headings
- **Text**: Use `text-zinc-700` for body text with `leading-relaxed`
- **Bullets**: Orange color (`text-orange-500`) for visual consistency
- **Bold Text**: Use `**text**` in JSON, rendered with `font-semibold text-zinc-900`

## Best Practices

### Content Writing

1. **Write in Dutch**: All guides should be in Dutch for consistency
2. **Be Concise**: Keep sections focused and easy to scan
3. **Use Structure**: Organize content with clear headings and sections
4. **Highlight Key Actions**: Use bold text for important features or actions
5. **Include Examples**: Where relevant, mention specific UI elements or workflows

### Section Organization

Recommended section structure:

1. **Overzicht**: Brief overview of the page purpose
2. **[Feature Name]**: Explanation of main features
3. **Functionaliteiten**: Bulleted list of key features and how to use them
4. **Tips**: Helpful tips and best practices

### Example Content Pattern

```json
{
  "heading": "Feature Name",
  "content": "What this feature does and why it's useful.",
  "items": [
    "**Action Name**: What happens when you perform this action",
    "**Another Action**: Description of this feature"
  ]
}
```

## TypeScript Type Definitions

For type safety, you can define types for the guide structure:

```typescript
interface GuideItem {
  heading: string;
  content?: string;
  items?: string[];
}

interface Guide {
  title: string;
  sections: GuideItem[];
}

type Guides = Record<string, Guide>;
```

## Troubleshooting

### Guide not showing

- Verify the URL pattern key in `guides.json` matches your current URL
- Check that the pattern syntax is correct (use `[id]` for dynamic segments)
- Check query parameters match exactly (case-sensitive, all params must be present)
- Ensure pattern comes before overlapping patterns (JSON property order matters)
- Try refreshing the page after adding a new pattern to guides.json
- Check browser console for any errors in pattern matching logic

### Styling issues

- Ensure all Tailwind classes are properly applied
- Check that `font-aspekta` is available in your project
- Verify the Modal component supports `customWidth` and `maxContentHeight` props

### Content formatting

- Use `{@html ...}` to render bold text from `**markdown**` syntax
- Escape any special characters in JSON strings
- Ensure proper JSON syntax (no trailing commas)

## Future Enhancements

Potential improvements to consider:

- [ ] Add support for images/screenshots in guides
- [ ] Support for code snippets with syntax highlighting
- [ ] Multi-language support (NL/EN toggle)
- [ ] Guide versioning/changelog tracking
- [ ] Search functionality within guides
- [ ] Video tutorial embedding

## Related Components

- **Header** (`src/lib/components/Header.svelte`): Contains automatic URL pattern matching logic
- **Modal** (`src/lib/components/Modal.svelte`): Base modal component
- **IconButton** (`src/lib/components/IconButton.svelte`): Button for help icon
- **Lucide Icons**: Icon library for `MessageCircleQuestionMark`

## Pattern Matching Reference

### Dynamic Segments

Use square brackets for dynamic segments that match any value:
- `/work/[id]` matches `/work/123`, `/work/abc`, `/work/anything`
- `/processes/[id]` matches `/processes/42`, `/processes/my-process`

### Query Parameters

Add query parameters after `?` in the pattern:
- `/work/[id]?tab=notities` - must have `tab=notities`
- `/work/[id]?tab=notities&other=value` - must have both params

### Multiple Patterns

You can define multiple patterns for the same base route in `guides.json`:
```json
{
  "/work/[id]": {
    "title": "Work Detail - Handleiding",
    "sections": [...]
  },
  "/work/[id]?tab=notities": {
    "title": "Work Detail (Notes) - Handleiding",
    "sections": [...]
  },
  "/work/[id]?tab=huidig": {
    "title": "Work Detail (Current) - Handleiding",
    "sections": [...]
  }
}
```

**Important**: JSON property order matters! The first matching pattern is used, so put more specific patterns (with query params) before general patterns. In JSON, the order of properties is typically preserved by modern browsers and Node.js, but if you encounter issues, consider the order in which patterns might be evaluated.

## Support

For questions or issues with the guides system, refer to:
- This README
- Example implementation in `src/routes/mijn-werk/+page.svelte`
- Modal component documentation in `src/lib/components/Modal.svelte`

