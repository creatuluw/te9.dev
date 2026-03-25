# Component Refactoring Specification

## Feature Overview

The current homepage implementation in `src\routes\+page.svelte` contains a monolithic structure with navigation, hero section, garden cards, quick links, and footer all embedded within a single 1136-line file. This makes the code difficult to maintain, test, and reuse across the application. The component refactoring feature will extract logical UI components into dedicated, reusable Svelte components within `src\lib\components\ui`, following SvelteKit best practices and enabling better code organization.

The primary goal is to create a modular component architecture where each UI element has a single responsibility and can be independently developed, tested, and reused. This includes extracting a Header component that will be added to `src\routes\+layout.svelte` to provide consistent navigation across all pages, along with page-specific components for the homepage. Type definitions and static data will be separated into dedicated files to improve maintainability.

This refactoring will establish a scalable component library that future features can build upon, reduce code duplication, improve developer experience through better IDE support and autocomplete, and enable proper unit testing of individual components. The visual appearance and functionality of the site will remain unchanged, but the underlying architecture will be significantly more maintainable and extensible.

## Success Criteria

- [ ] All 10 components successfully extracted and functional in `src\lib\components\ui`
- [ ] Header component integrated into `src\routes\+layout.svelte` and visible on all pages
- [ ] Homepage (`src\routes\+page.svelte`) refactored to use extracted components with identical visual appearance
- [ ] Type definitions (`types.ts`) properly exported and imported across components
- [ ] Static data (`data.ts`) separated from component logic
- [ ] All existing animations and interactions preserved (typing effect, scroll behavior, hover states)
- [ ] No TypeScript errors in compilation
- [ ] Component props properly typed with TypeScript interfaces
- [ ] Code reduced from 1136 lines in +page.svelte to under 150 lines
- [ ] Each component file under 200 lines
- [ ] All components follow Svelte 5 runes syntax ($state, $effect, $props)

## Design Goals

### Primary Goals (Must Have)
- Extract Header.svelte with typing animation and scroll behavior for +layout.svelte
- Create Footer.svelte, BackgroundEffects.svelte for layout consistency
- Build reusable Hero.svelte, GardenCard.svelte, QuickLink.svelte for homepage
- Implement SectionHeader.svelte and Button.svelte as shared components
- Separate type definitions and static data into dedicated files
- Maintain 100% visual and functional parity with current implementation
- Use TypeScript strict typing for all component props
- Follow Svelte 5 runes syntax throughout

### Secondary Goals (Nice to Have)
- Add JSDoc comments for all component props
- Create component stories or documentation
- Optimize bundle size through better code splitting
- Add unit tests for utility functions (typing effect, scroll handler)
- Create a component index file for easier imports

## User Experience

From a user perspective, the website will look and behave exactly as it does now. The typing animation in the header will continue to animate "te9.dev" character by character, the navigation will still change background on scroll, hero section will display with the same decorative rings and call-to-action buttons, garden cards will animate in with the same fly/fade transitions, and quick links will slide in with the same timing.

The primary difference is for developers who will now work with clean, modular components instead of a monolithic file. Each component can be developed, tested, and debugged in isolation. New pages can reuse components like SectionHeader, Button, and Footer without duplicating code. The codebase will be more approachable for future contributors and easier to extend with new features.

## Design Rationale

This refactoring follows the Single Responsibility Principle where each component handles one specific piece of UI functionality. By separating concerns, we make the codebase more testable (each component can be unit tested independently), more maintainable (changes to one component don't affect others), and more reusable (components can be used across different pages).

The decision to use Svelte 5 runes ($state, $effect, $props) ensures the codebase is future-proof and follows the latest Svelte best practices. TypeScript interfaces for all props provide compile-time type safety and excellent IDE autocomplete support. Separating data and types into their own files follows the convention of keeping concerns separated and makes it easier to update content without touching component logic.

Alternative approaches considered included keeping everything in one file (rejected due to maintainability issues), using a state management library (rejected as over-engineering for this use case), and creating a component library as a separate package (rejected as premature optimization). The chosen approach strikes the right balance between simplicity and scalability.

## Constraints/Assumptions

### Technical Constraints
- Must use Svelte 5 with runes syntax (no legacy reactive statements)
- Must maintain compatibility with SvelteKit file-based routing
- All components must be client-side compatible (no SSR-specific code)
- Must preserve existing CSS custom properties and design tokens
- Animations must use Svelte's built-in transition functions (fade, fly, slide)
- No external UI libraries or component frameworks

### Business Assumptions
- The current visual design is final and should not be altered
- All existing functionality is required and must be preserved
- Performance should remain equivalent or improve
- SEO and accessibility must not be negatively impacted
- The site will continue to be a single-page application with no additional routes in the immediate future
- Development will continue by a single developer (no immediate team scaling needs)

### Development Constraints
- Must work with existing `app.css` global styles
- Cannot break existing favicon and asset loading
- Must maintain the current color scheme (#ff9500 accent, #0a0a0a background, etc.)
- Typography (Lekton, JetBrains Mono, Bricolage Grotesque) must remain unchanged
- Z-index layering (noise overlay, scanlines, navigation) must be preserved

## Functional Requirements

### FR-1: Header Component with Typing Animation
**Description**: Create Header.svelte component with logo typing effect and scroll-based background changes.

**Acceptance Criteria**:
- Component accepts no props, manages internal state with $state
- Typing animation types "te9.dev" character by character at 100ms intervals
- Cursor blinks at 500ms intervals
- Navigation background changes when scrollY > 100px
- Contains navigation links: about, garden, links, external link to patrick.te9.nl
- All links use proper href attributes and target="_blank" where appropriate
- Component cleans up intervals and event listeners on destroy

### FR-2: Footer Component with Brand and Links
**Description**: Create Footer.svelte component with brand section, link columns, and status indicator.

**Acceptance Criteria**:
- Displays "te9.dev" logo and "Patrick's Digital Garden" tagline
- Two link columns: "Connect" (Email, LinkedIn, Bluesky) and "Sites" (patrick.te9.nl, GitHub)
- Copyright shows "© 2025 Patrick Tehubijuluw"
- Status indicator shows animated dot with "Growing organically" text
- All external links open in new tab with rel="noopener noreferrer"
- Responsive layout adjusts for mobile (< 500px)

### FR-3: Background Effects Component
**Description**: Create BackgroundEffects.svelte component with noise overlay and scanlines.

**Acceptance Criteria**:
- Renders noise-overlay div with proper CSS class
- Renders scanlines div with proper CSS class
- Uses existing CSS styles from app.css (no inline styles)
- Has no JavaScript logic (purely presentational)
- Positioned absolutely with proper z-index layering

### FR-4: Hero Section Component
**Description**: Create Hero.svelte component with label, title, subtitle, description, CTAs, and decorative elements.

**Acceptance Criteria**:
- Displays "[ digital-garden ]" label with bracket styling
- Shows "te9.dev" as main title with proper typography
- Subtitle displays "Playground. Garden. Archive." with accent text
- Description text matches current implementation
- Primary CTA button links to #garden with "explore →" text
- Secondary CTA button links to patrick.te9.nl/about with "about me" text
- Three decorative rings render with proper positioning and animation
- All styling matches current implementation

### FR-5: Garden Card Component
**Description**: Create GardenCard.svelte component to display individual garden cards with icons and metadata.

**Acceptance Criteria**:
- Accepts `card` prop typed as GardenCard interface
- Accepts `index` prop for animation delay calculation
- Renders SVG icon supporting path, rect, polyline, line, and circle elements
- Applies fly in-animation with y: 20, duration: 500ms, delay based on index
- Applies fade out-animation with duration: 200ms
- Displays title, description, and tag with proper styling
- Hover effect changes card appearance (border glow, background shift)
- Uses relative positioning with z-index for layering

### FR-6: Quick Link Component
**Description**: Create QuickLink.svelte component for individual quick link items.

**Acceptance Criteria**:
- Accepts `link` prop typed as QuickLink interface
- Accepts `index` prop for animation delay calculation
- Renders as anchor element with href from link data
- Opens in new tab with rel="noopener noreferrer"
- Applies slide in-animation with axis: "y", duration: 300ms, delay based on index
- Displays link name, description, and arrow indicator
- Hover effect shows underline and arrow translation
- Uses cubicOut easing for smooth animation

### FR-7: Shared Section Header Component
**Description**: Create SectionHeader.svelte component for reusable section headers with label and title.

**Acceptance Criteria**:
- Accepts `label` prop (e.g., "// purpose", "// shortcuts")
- Accepts `title` prop (supports line breaks via <br>)
- Renders label with section-label CSS class
- Renders title with section-title CSS class
- Maintains proper spacing and typography
- Reusable across Garden and Links sections

### FR-8: Reusable Button Component
**Description**: Create Button.svelte component with primary and secondary variants.

**Acceptance Criteria**:
- Accepts `variant` prop with values "primary" | "secondary"
- Accepts `href` prop for link destination
- Accepts `text` prop for button text
- Accepts optional `icon` prop for icon/arrow display
- Primary variant has animated background on hover
- Secondary variant has border and subtle hover effect
- Renders as anchor element (<a>)
- Supports external links with target="_blank"
- Applies proper focus states for accessibility

### FR-9: Type Definitions and Data Separation
**Description**: Extract type definitions and static data into dedicated files.

**Acceptance Criteria**:
- Create types.ts with PathData type and GardenCard, QuickLink interfaces
- PathData type supports all SVG element variations (path, rect, polyline, line, circle)
- GardenCard interface has paths, title, desc, tag properties
- QuickLink interface has href, name, desc properties
- Create data.ts with gardenCards and quickLinks arrays
- All data accurately migrated from +page.svelte without modifications
- Files export types and data for component consumption

### FR-10: Layout Integration
**Description**: Integrate Header, Footer, and BackgroundEffects into +layout.svelte.

**Acceptance Criteria**:
- Header component renders at top of page with fixed positioning
- BackgroundEffects render behind all content
- Footer component renders at bottom of page
- Layout wraps children with proper structure
- Main content has pt-[60px] padding to account for fixed header
- No duplicate rendering of components
- All pages automatically inherit header and footer

## Edge Cases

### EC-1: Component Reuse Across Pages
**Scenario**: When components are used on pages other than the homepage.

**Considerations**:
- Ensure components don't make assumptions about page context
- Props should be required where data is essential
- Provide sensible defaults where appropriate
- Document component usage requirements

### EC-2: Missing or Invalid Props
**Scenario**: When components receive undefined or incorrectly typed props.

**Considerations**:
- TypeScript will catch compile-time errors
- Required props should not have defaults (enforced by TS)
- Optional props should have clear fallback behavior
- Components should not crash if optional data is missing

### EC-3: Animation Performance on Low-End Devices
**Scenario**: Multiple animations triggering simultaneously on slower hardware.

**Considerations**:
- Use Svelte's built-in transition optimizations
- Keep animation durations reasonable (300-500ms)
- Avoid animating expensive CSS properties (use transform, opacity)
- Consider adding `prefers-reduced-motion` media query support in future

### EC-4: External Link Failures
**Scenario**: When external URLs (GitHub, LinkedIn, etc.) are unavailable or changed.

**Considerations**:
- Links should still be clickable (browser handles network errors)
- rel="noopener noreferrer" for security
- Consider adding aria-labels for accessibility
- External links should visually indicate they open in new tab

### EC-5: Scroll Position on Page Navigation
**Scenario**: When user navigates to anchor links (#garden, #links).

**Considerations**:
- Browser handles native anchor scrolling
- Fixed header height (60px) accounted for in layout
- Smooth scroll behavior can be added via CSS if desired
- Component should not interfere with native scroll behavior

### EC-6: Rapid Page Load with Animations
**Scenario**: When page loads and multiple animations trigger immediately.

**Considerations**:
- Stagger animations using index-based delays
- Svelte handles animation queuing automatically
- No manual animation orchestration needed
- Components should animate independently

### EC-7: Mobile Responsive Breakpoints
**Scenario**: When site is viewed on various screen sizes.

**Considerations**:
- Existing CSS handles responsive behavior
- Components should not override responsive styles
- Test at 320px, 375px, 768px, 1024px, 1440px viewports
- Ensure touch targets are at least 44x44px on mobile

### EC-8: TypeScript Strict Mode Compatibility
**Scenario**: When project has strict TypeScript configuration enabled.

**Considerations**:
- All props must be properly typed (no `any`)
- Optional props use `?` syntax or union with `undefined`
- SVG element props must match valid SVG attributes
- Event handlers must have proper type annotations