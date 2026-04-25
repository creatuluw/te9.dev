# Timeline Component

A vertical timeline component for displaying chronological events with dots and connecting lines.

## Features

- Vertical timeline with connecting border line
- Customizable timeline items with date, title, description
- Support for badges and action buttons
- Highlighted/unhighlighted states (colored vs gray dots)
- Subtle hover effect with light gray background
- Icon actions that appear on hover (aligned right)
- Flexible rendering with snippets or default layout
- Last item automatically removes bottom margin

## Props

```typescript
interface TimelineItem {
  id: string | number;           // Unique identifier
  date: string;                  // Date label (e.g., "February 2022", "3 min ago")
  title: string;                 // Main heading
  description?: string;          // Optional description text
  action?: Snippet<[item]>;      // Optional action snippet (buttons, links)
  badge?: Snippet<[item]>;       // Optional badge snippet (status, tags)
  highlighted?: boolean;         // If true, shows blue dot; if false, gray dot
  iconActions?: Array<{          // Optional icon button actions (appear on hover)
    icon: ComponentType;         // Lucide icon component
    tooltip?: string;            // Tooltip text
    onClick: (item) => void;     // Click handler
  }>;
}

interface Props {
  items: TimelineItem[];         // Array of timeline items
  children?: Snippet<[item, index]>; // Optional custom render for each item
}
```

## Usage

### Basic Timeline

```svelte
<script>
  import Timeline from '$lib/components/Timeline.svelte';
  
  const events = [
    {
      id: 1,
      date: 'February 2022',
      title: 'Application UI code in Tailwind CSS',
      description: 'Get access to over 20+ pages including a dashboard layout.',
      highlighted: true
    },
    {
      id: 2,
      date: 'March 2022',
      title: 'Marketing UI design in Figma',
      description: 'All pages and components are first designed in Figma.'
    }
  ];
</script>

<Timeline items={events} />
```

### Timeline with Actions

```svelte
<script>
  import Timeline from '$lib/components/Timeline.svelte';
  import Button from '$lib/components/Button.svelte';
  
  const events = [
    {
      id: 1,
      date: 'February 2022',
      title: 'Application UI Released',
      description: 'New dashboard components available.',
      highlighted: true,
      action: (item) => {
        return `<Button size="sm" onclick={() => viewDetails(item.id)}>
          Learn more
        </Button>`;
      }
    }
  ];
</script>

<Timeline items={events} />
```

### Timeline with Badges

```svelte
<script>
  import Timeline from '$lib/components/Timeline.svelte';
  
  const events = [
    {
      id: 1,
      date: '3 min ago',
      title: 'New notification received',
      description: 'You have a new message from John.',
      highlighted: true,
      badge: (item) => {
        return `<span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          New
        </span>`;
      }
    }
  ];
</script>

<Timeline items={events} />
```

### Timeline with Icon Actions

Icon buttons that appear on hover, aligned to the right:

```svelte
<script>
  import Timeline from '$lib/components/Timeline.svelte';
  import { Check, Trash2, Eye } from 'lucide-svelte';
  
  const events = [
    {
      id: 1,
      date: '3 min ago',
      title: 'New notification received',
      description: 'You have a new message from John.',
      highlighted: true,
      iconActions: [
        {
          icon: Check,
          tooltip: 'Mark as read',
          onClick: (item) => markAsRead(item.id)
        },
        {
          icon: Trash2,
          tooltip: 'Delete',
          onClick: (item) => deleteItem(item.id)
        }
      ]
    }
  ];
</script>

<Timeline items={events} />
```

### Custom Rendering with Snippets

For complete control over rendering:

```svelte
<script>
  import Timeline from '$lib/components/Timeline.svelte';
  
  const events = [
    { id: 1, date: 'Today', title: 'Event 1', highlighted: true },
    { id: 2, date: 'Yesterday', title: 'Event 2' }
  ];
</script>

<Timeline items={events}>
  {#snippet children(item, index)}
    <div class="custom-layout">
      <p class="text-sm text-zinc-500">{item.date}</p>
      <h4 class="font-bold">{item.title}</h4>
      <button>Custom Action</button>
    </div>
  {/snippet}
</Timeline>
```

## Styling

The Timeline component uses:
- **Fonts**: `font-inter` for body text, `font-aspekta` for headings
- **Colors**: Zinc palette (zinc-900, zinc-600, zinc-400, zinc-200)
- **Border**: Left border with `border-zinc-200`
- **Dots**: 3x3 rounded circles, blue for highlighted, gray for normal
- **Spacing**: 10 margin-bottom between items, 4 margin-start for content

### Highlighted States

- `highlighted: true` → Blue dot (`bg-blue-600`)
- `highlighted: false` or undefined → Gray dot (`bg-zinc-200`)

## Examples

### Notification Timeline

```svelte
<Timeline
  items={notifications.map(n => ({
    id: n.id,
    date: formatRelativeTime(n.created_at),
    title: n.subject,
    description: n.body,
    highlighted: !n.read,
    badge: !n.read ? () => `<span class="badge">New</span>` : undefined
  }))}
/>
```

### Project Milestone Timeline

```svelte
<Timeline
  items={milestones.map(m => ({
    id: m.id,
    date: formatDate(m.date),
    title: m.name,
    description: m.details,
    highlighted: m.status === 'active',
    action: () => `<Button size="sm">View Details</Button>`
  }))}
/>
```

## Accessibility

- Uses semantic `<ol>` element for timeline list
- Each item is a `<li>` with proper structure
- Time information uses `<time>` element
- Headings use `<h3>` for proper document outline

## Notes

- Last item in the timeline automatically has no bottom margin
- The vertical line is created using `border-s` on the `<ol>` element
- Dots are positioned with `absolute` and `-start-1.5` offset
- All styling follows the gray-html design system with zinc colors

