# Rating Component

A star rating component that displays and optionally allows users to set a rating value. Supports interactive selection with hover effects and can be configured as readonly.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rating` | `number` | `0` | Current rating value (0 to max) |
| `max` | `number` | `5` | Maximum rating value |
| `readonly` | `boolean` | `false` | If true, rating cannot be changed |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size of the stars |
| `showValue` | `boolean` | `false` | Show rating value as text next to stars |
| `class` | `string` | `''` | Additional CSS classes |
| `onchange` | `(rating: number) => void` | `undefined` | Callback when rating changes |

## Sizes

### Small
```svelte
<Rating rating={3} size="sm" />
```

### Default
```svelte
<Rating rating={4} />
```

### Large
```svelte
<Rating rating={5} size="lg" />
```

## Examples

### Basic Display
Display a rating without interaction:
```svelte
<Rating rating={4} readonly />
```

### Interactive Rating
Allow users to select a rating:
```svelte
<script>
  let currentRating = $state(0);
  
  function handleRatingChange(rating) {
    currentRating = rating;
    console.log('Rating changed to:', rating);
  }
</script>

<Rating rating={currentRating} onchange={handleRatingChange} />
```

### With Value Display
Show the numeric rating value:
```svelte
<Rating rating={4.5} showValue readonly />
```

### Custom Max Rating
Use a different maximum rating:
```svelte
<Rating rating={8} max={10} readonly />
```

### With Custom Classes
Apply custom styling:
```svelte
<Rating rating={3} class="my-4" readonly />
```

