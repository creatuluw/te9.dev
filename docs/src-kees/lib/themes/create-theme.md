# Theme Creation Guide

Step-by-step guide for creating and implementing a new theme in the application.

## Step 1: Plan Your Theme

Before creating a new theme, decide on:
- **Theme name** (kebab-case, e.g., `ocean-breeze`, `dark-moon`)
- **Theme ID** (must be unique, lowercase, no spaces/special chars)
- **Design inspiration** or style goal (e.g., "Minimal dark theme with blue accents")
- **Color palette** - primary, secondary, background, surface, text colors
- **Typography** - heading, body, and monospace fonts
- **Shadow style** - if you want custom shadows (neo-brutalist, soft, etc.)

## Step 2: Understand the Theme Structure

Each theme must implement the `Theme` interface from `$lib/types/theme`:

```typescript
interface Theme {
  id: ThemeId;                    // Unique identifier (must be added to ThemeId type)
  name: string;                   // Display name
  description?: string;           // Optional description
  colors: ThemeColors;            // Color palette
  fonts: ThemeFonts;              // Typography
  shadows?: ThemeShadows;         // Optional shadow configuration
}
```

### Required Color Properties:
- `primary`: Main brand/primary color (hex or RGB)
- `background`: Main background color
- `surface`: Card/surface background color
- `text.primary`: Main text color
- `text.secondary`: Secondary text color
- `text.muted`: Muted/subtle text color
- `border`: Border color
- `focus`: Focus ring/indicator color

### Optional Color Properties:
- `secondary`: Secondary accent color
- `error`: Error state color
- `success`: Success state color
- `warning`: Warning state color

### Required Font Properties:
- `heading`: Font family for headings
- `body`: Font family for body text
- `mono`: Font family for monospace/code

### Optional Shadow Properties:
- `xs`: Extra small shadow
- `sm`: Small shadow
- `md`: Medium shadow (optional)

## Step 3: Create the Theme File

1. **Create a new file** in `src/lib/themes/` named `{theme-id}.ts`
   - Example: For theme ID `ocean-breeze`, create `ocean-breeze.ts`

2. **Use this template** as a starting point:

```typescript
/**
 * [Theme Name] theme - [Brief description]
 * [Additional details about design inspiration or style]
 */

import type { Theme } from '$lib/types/theme';

export const {themeId}Theme: Theme = {
	id: '{theme-id}',
	name: '{Theme Display Name}',
	description: '{Description of the theme}',

	colors: {
		primary: '#3b82f6',        // Replace with your primary color
		secondary: '#facc15',      // Optional: secondary accent
		background: '#ffffff',     // Main background
		surface: '#fafafa',        // Card/surface background
		text: {
			primary: '#18181b',    // Main text
			secondary: '#52525b',  // Secondary text
			muted: '#a1a1aa'       // Muted text
		},
		border: '#e4e4e7',         // Border color
		focus: '#FE773C',          // Focus color
		error: '#ef4444',          // Optional: error color
		success: '#10b981',        // Optional: success color
		warning: '#f59e0b'        // Optional: warning color
	},

	fonts: {
		heading: 'Aspekta, sans-serif',     // Heading font
		body: 'Inter, sans-serif',          // Body font
		mono: 'PT Mono, monospace'          // Monospace font
	},

	shadows: {
		xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		sm: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.1)'
		// Optional: md: '8px 8px 0px 0px rgba(0,0,0,1)' for neo-brutalist
	}
};
```

3. **Replace placeholders**:
   - `{themeId}` → camelCase version (e.g., `oceanBreeze`)
   - `{theme-id}` → kebab-case ID (e.g., `ocean-breeze`)
   - `{Theme Display Name}` → Display name (e.g., `Ocean Breeze`)
   - Update all color values to match your design
   - Update fonts if using custom fonts
   - Customize shadows if needed

## Step 4: Update the ThemeId Type

Add your new theme ID to the `ThemeId` type union in `src/lib/types/theme.ts`:

```typescript
// Before:
export type ThemeId = 'default' | 'catalyst' | 'vibrant' | 'pglite' | 'planet' | 'trevor' | 'cursor';

// After (add your theme):
export type ThemeId = 'default' | 'catalyst' | 'vibrant' | 'pglite' | 'planet' | 'trevor' | 'cursor' | 'ocean-breeze';
```

## Step 5: Register the Theme

Add your theme to the registry in `src/lib/themes/index.ts`:

1. **Import your theme** at the top:
```typescript
import { oceanBreezeTheme } from './ocean-breeze';
```

2. **Add to the themes object**:
```typescript
export const themes: Record<ThemeId, Theme> = {
	default: defaultTheme,
	catalyst: catalystTheme,
	vibrant: vibrantTheme,
	pglite: pgliteTheme,
	planet: planetTheme,
	trevor: trevorTheme,
	cursor: cursorTheme,
	'ocean-breeze': oceanBreezeTheme  // Add your theme here
};
```

3. **Add to the allThemes array**:
```typescript
export const allThemes: Theme[] = [
	defaultTheme,
	catalystTheme,
	vibrantTheme,
	pgliteTheme,
	planetTheme,
	trevorTheme,
	cursorTheme,
	oceanBreezeTheme  // Add your theme here
];
```

4. **Add to individual exports**:
```typescript
export { 
	defaultTheme, 
	catalystTheme, 
	vibrantTheme, 
	pgliteTheme, 
	planetTheme, 
	trevorTheme, 
	cursorTheme,
	oceanBreezeTheme  // Add your theme here
};
```

## Step 6: Test Your Theme

1. **Verify TypeScript compilation**:
   ```bash
   npm run check
   # or
   npm run build
   ```

2. **Test theme switching**:
   - Start the dev server: `npm run dev`
   - Navigate to the theme selector (if available in your UI)
   - Switch to your new theme
   - Verify all UI elements display correctly with your colors

3. **Check these areas**:
   - [ ] Background colors render correctly
   - [ ] Text is readable (adequate contrast)
   - [ ] Borders and focus states are visible
   - [ ] Buttons and interactive elements use primary color appropriately
   - [ ] Cards/surfaces use surface color
   - [ ] Fonts load correctly (if custom fonts are used)

## Step 7: Design Considerations

### Color Contrast
- Ensure text colors have sufficient contrast against background colors
- WCAG AA requires at least 4.5:1 contrast for normal text
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Color Palette Tips
- **Primary**: Should stand out but not be too bright for extended viewing
- **Background/Surface**: Usually subtle difference (e.g., white vs zinc-50)
- **Text hierarchy**: Primary > Secondary > Muted for clear information hierarchy
- **Focus color**: Should be visible and distinct from primary color

### Font Selection
- Use web-safe fonts or ensure custom fonts are loaded
- Common choices:
  - **Headings**: Aspekta, Inter, or custom brand fonts
  - **Body**: Inter, system fonts, or custom UI fonts
  - **Mono**: PT Mono, Fira Code, or other monospace fonts

### Shadow Styles
- **Default/Soft**: Subtle shadows for depth
- **Neo-brutalist**: Offset shadows (e.g., `4px 4px 0px 0px rgba(0,0,0,1)`)
- **Flat**: Minimal or no shadows

## Step 8: Common Patterns

### Dark Theme Example
```typescript
colors: {
  primary: '#60a5fa',
  background: '#0f172a',      // Dark background
  surface: '#1e293b',         // Darker surface
  text: {
    primary: '#f1f5f9',       // Light text
    secondary: '#cbd5e1',
    muted: '#94a3b8'
  },
  border: '#334155',
  focus: '#60a5fa'
}
```

### High Contrast Theme
```typescript
colors: {
  primary: '#000000',
  background: '#ffffff',
  surface: '#ffffff',
  text: {
    primary: '#000000',       // Pure black for max contrast
    secondary: '#000000',
    muted: '#1a1a1a'
  },
  border: '#000000',         // Pure black borders
  focus: '#0000ff'           // Blue focus indicator
}
```

### Vibrant/Colorful Theme
```typescript
colors: {
  primary: '#ec4899',         // Pink primary
  secondary: '#8b5cf6',       // Purple secondary
  background: '#fef3c7',      // Light yellow background
  surface: '#ffffff',
  text: {
    primary: '#1f2937',
    secondary: '#4b5563',
    muted: '#9ca3af'
  },
  border: '#fbbf24',
  focus: '#ec4899'
}
```

## Step 9: Verification Checklist

Before considering your theme complete:

- [ ] Theme file created: `src/lib/themes/{theme-id}.ts`
- [ ] ThemeId type updated: `src/lib/types/theme.ts`
- [ ] Theme imported in `src/lib/themes/index.ts`
- [ ] Theme added to `themes` object in `index.ts`
- [ ] Theme added to `allThemes` array in `index.ts`
- [ ] Theme exported individually in `index.ts`
- [ ] TypeScript compiles without errors
- [ ] Theme appears in theme selector (if available)
- [ ] All UI elements render correctly with new theme
- [ ] Text contrast meets accessibility standards
- [ ] Colors match design intent
- [ ] Fonts load correctly (if custom fonts)

## Step 10: Documentation

Consider documenting:
- **Design inspiration**: Where did the theme come from?
- **Use cases**: When should this theme be used?
- **Special features**: Any unique design elements (e.g., neo-brutalist shadows)

Add these as comments in your theme file or in the description field.

## Troubleshooting

### Theme not appearing in selector
- Check that ThemeId type includes your theme ID
- Verify theme is added to both `themes` object and `allThemes` array
- Restart dev server

### TypeScript errors
- Ensure ThemeId type matches your theme's `id` field exactly
- Check that all required properties are present
- Verify import/export statements are correct

### Colors not applying
- Check that CSS variables are properly set up (if your app uses CSS variables)
- Verify theme store is using the correct theme
- Check browser console for errors

### Font issues
- Ensure fonts are loaded before theme is applied
- Check font family names match exactly (case-sensitive)
- Verify fallback fonts are available

---

## Example: Complete Theme Creation

For a theme called "Ocean Breeze":

1. **Create file**: `src/lib/themes/ocean-breeze.ts`
2. **ThemeId update**: Add `'ocean-breeze'` to ThemeId type
3. **Register**: Add import and entries in `index.ts`
4. **Test**: Switch to theme and verify appearance

---

Ready to create a new theme? Start with Step 1 and work through each step systematically.

