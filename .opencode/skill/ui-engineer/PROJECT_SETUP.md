# Project Setup Guide

Complete guide for initializing a new project with gray-html design system.

## Quick Start

1. Install dependencies
2. Configure Tailwind CSS
3. Set up base styles
4. Create component structure
5. Configure Svelte

---

## 1. Install Dependencies

```bash
# Tailwind CSS and plugins
npm install -D tailwindcss postcss autoprefixer

# Svelte 5 and SvelteKit
npm install -D svelte @sveltejs/kit svelte-check typescript vite

# Optional: Icon library
npm install lucide-svelte
```

---

## 2. Configure Tailwind CSS

### tailwind.config.js

Complete Tailwind configuration with gray-html design system:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## 3. Set Up Base Styles

### src/app.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Focus-visible styles for accessibility */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Remove default margins */
body {
  margin: 0;
}
```

### src/app.html

Ensure proper meta tags and HTML structure:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="description" content="Application description" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-body>
    %sveltekit.body%
  </body>
</html>
```

---

## 4. Create Component Structure

### Directory Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── Card.svelte
│   │   ├── Button.svelte
│   │   ├── Input.svelte
│   │   ├── Alert.svelte
│   │   ├── Badge.svelte
│   │   ├── Header.svelte
│   │   ├── Footer.svelte
│   │   ├── UserAvatar.svelte
│   │   ├── Spinner.svelte
│   │   ├── Modal.svelte
│   │   ├── Drawer.svelte
│   │   ├── Tabs.svelte
│   │   └── index.ts         # Barrel file
│   ├── utils/
│   │   ├── formatters.ts   # Date, currency, etc.
│   │   └── validators.ts   # Form validation
│   └── types/
│       └── index.ts         # Shared types
├── routes/
│   ├── +layout.svelte        # Global layout
│   ├── +page.svelte          # Home page
│   └── api/                 # API endpoints
├── app.css                   # Tailwind directives
└── app.html                  # HTML template
```

### Barrel File: src/lib/components/index.ts

Create a central export file for clean imports:

```typescript
// Layout Components
export { default as Header } from './Header.svelte';
export { default as Footer } from './Footer.svelte';

// Core Components
export { default as Card } from './Card.svelte';
export { default as Button } from './Button.svelte';
export { default as Alert } from './Alert.svelte';
export { default as Badge } from './Badge.svelte';

// Form Components
export { default as Input } from './Input.svelte';
export { default as Select } from './Select.svelte';
export { default as Textarea } from './Textarea.svelte';
export { default as Checkbox } from './Checkbox.svelte';

// Display Components
export { default as UserAvatar } from './UserAvatar.svelte';
export { default as Spinner } from './Spinner.svelte';

// Overlay Components
export { default as Modal } from './Modal.svelte';
export { default as Drawer } from './Drawer.svelte';
export { default as Tabs } from './Tabs.svelte';

// Re-export types
export type { TabItem } from './Tabs.svelte';
export type { UserAvatarProps } from './UserAvatar.svelte';
```

---

## 5. Configure Svelte

### svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $components: 'src/lib/components',
    },
  },
};

export default config;
```

### tsconfig.json

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*.d.ts", "src/**/*.js", "src/**/*.svelte"],
  "references": [{ "path": "./.svelte-kit" }]
}
```

---

## 6. Create First Components

### src/routes/+layout.svelte

```svelte
<script lang="ts">
  import '../app.css';
  import { Header, Footer } from '$lib/components';
</script>

<div class="min-h-screen bg-white flex flex-col">
  <Header />
  
  <main class="flex-1">
    <slot />
  </main>
  
  <Footer />
</div>
```

---

## 7. Verify Setup

### Test Installation

```bash
# Run dev server
npm run dev

# Check for TypeScript errors
npm run check

# Build for production
npm run build
```

### Create Test Page

**src/routes/+page.svelte:**

```svelte
<script lang="ts">
  import { Card, Button, Badge, Alert, Input } from '$lib/components';
  let email = $state('');
  let error = $state('');
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-zinc-900 mb-6">Setup Test</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card showHeader={true}>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-zinc-900">Test Card</h2>
      {/snippet}
      {#snippet children()}
        <p class="text-sm text-zinc-600 mb-4">Card content</p>
        <Badge variant="success">Working!</Badge>
      {/snippet}
    </Card>
    
    <Card>
      <Alert variant="info">
        {#snippet children()}
          <p class="text-sm text-blue-900">Design system is working!</p>
        {/snippet}
      </Alert>
      
      <form class="mt-4" onsubmit={(e) => e.preventDefault()}>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="test@example.com"
          bind:value={email}
        />
        <Button type="submit" class="mt-4">Test Button</Button>
      </form>
    </Card>
  </div>
</div>
```

---

## 8. Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

---

## 9. Common Configuration Issues

### Issue: Tailwind Classes Not Working

**Solution:** Ensure `tailwind.config.js` is in project root and `app.css` imports Tailwind directives.

### Issue: TypeScript Errors in Components

**Solution:** Run `npm run check` and ensure `tsconfig.json` includes `.svelte` files.

### Issue: Icons Not Showing

**Solution:** Install icon library: `npm install lucide-svelte` and import properly.

### Issue: Focus Styles Not Applied

**Solution:** Ensure `*:focus-visible` styles are in `app.css` and not overridden.

---

## 10. Production Checklist

Before deploying, ensure:

- [ ] Tailwind CSS is building correctly
- [ ] All components use Svelte 5 runes
- [ ] TypeScript has no errors
- [ ] All imports use barrel file or explicit paths
- [ ] Zinc color palette used consistently
- [ ] Focus states work with keyboard navigation
- [ ] Mobile responsiveness tested
- [ ] Production build completes successfully
- [ ] All environment variables configured
- [ ] Error boundaries in place

---

## Next Steps

1. **Review Components**: Browse [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
2. **Learn Patterns**: Study [PATTERNS.md](./PATTERNS.md)
3. **Best Practices**: Review [BEST_PRACTICES.md](./BEST_PRACTICES.md)
4. **Build Features**: Start implementing your application

---

## Troubleshooting

### Tailwind Not Compiling

```bash
# Clear cache and rebuild
rm -rf .svelte-kit node_modules
npm install
npm run dev
```

### Port Already in Use

```bash
# Use different port
npm run dev -- --port 3001

# Or find and kill process using port
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

### Build Fails

1. Check for TypeScript errors: `npm run check`
2. Verify Tailwind configuration: `tailwind --help`
3. Review dependency versions: `npm outdated`

---

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Svelte 5 Documentation](https://svelte.dev/docs/runes-api)
- [SvelteKit Documentation](https://kit.svelte.dev/docs/introduction)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Usage Patterns](./PATTERNS.md)