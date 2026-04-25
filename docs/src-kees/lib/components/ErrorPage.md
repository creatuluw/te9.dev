# ErrorPage Component

A reusable error page component for displaying various error states (404, 403, 500, etc.) with consistent styling based on the zinc color palette and Aspekta/Inter fonts.

## Import

```typescript
import { ErrorPage } from '$lib/components';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `number \| string` | required | Error code to display (e.g., 404, 403, 500) |
| `title` | `string` | required | Error title/heading |
| `message` | `string` | required | Error description/message |
| `showHomeButton` | `boolean` | `true` | Show "Go back home" button |
| `showSupportLink` | `boolean` | `true` | Show "Contact support" link |
| `homeUrl` | `string` | `'/'` | Custom URL for home button |
| `supportUrl` | `string` | `'/help'` | Custom URL for support link |
| `class` | `string` | `''` | Additional CSS classes |

## Slots

- **Default slot**: Additional content to display below the action buttons

## Usage

### Basic 404 Error

```svelte
<script>
  import { ErrorPage } from '$lib/components';
</script>

<ErrorPage
  code={404}
  title="Pagina niet gevonden"
  message="Sorry, we kunnen de pagina die u zoekt niet vinden."
/>
```

### 403 Forbidden Error

```svelte
<ErrorPage
  code={403}
  title="Geen toegang"
  message="U heeft geen toegang tot deze pagina."
  homeUrl="/"
  supportUrl="/help"
/>
```

### Custom Error with Slot

```svelte
<ErrorPage
  code={500}
  title="Er ging iets mis"
  message="Er is een onverwachte fout opgetreden."
  showSupportLink={false}
>
  <div class="mt-8">
    <p class="text-sm text-zinc-500">Error ID: {errorId}</p>
  </div>
</ErrorPage>
```

### Error Without Actions

```svelte
<ErrorPage
  code="Onderhoud"
  title="Site in onderhoud"
  message="We zijn bezig met onderhoud. Probeer het later opnieuw."
  showHomeButton={false}
  showSupportLink={false}
/>
```

## Styling

The component uses:
- **Background**: `bg-zinc-50` for subtle background
- **Text colors**: `text-zinc-900` for headings, `text-zinc-600` for body text
- **Fonts**: `font-aspekta` for headings, `font-inter` for body text
- **Typography**: `tracking-tight`, `antialiased` for crisp text rendering
- **Button**: Uses the standard `Button` component with default variant

## Accessibility

- Semantic HTML with `<main>` element
- Proper heading hierarchy
- Clear, descriptive error messages
- Keyboard-accessible navigation

## Related

- See `src/routes/+error.svelte` for SvelteKit error page implementation
- See `src/routes/404/+page.svelte` for dedicated 404 page
- See `Button.svelte` for button component details

