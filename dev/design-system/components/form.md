# Form Components

Form elements provide a consistent interface for user input across all pages and contexts in the Gray Design System.

## Overview

The form system includes text inputs, textareas, selects, checkboxes, radio buttons, and their associated labels and helper text. All form elements follow a unified styling approach with zinc-based colors, consistent spacing, and accessible focus states.

## Base Form Classes

### Shared Input Styles

All form elements share a common foundation:

```html
<input 
  class="form-input" 
  type="text" 
  placeholder="Enter text"
/>
```

**Base Classes:**
```css
.form-input,
.form-textarea,
.form-multiselect,
.form-select,
.form-checkbox,
.form-radio {
  border: 1px solid;
  border-color: rgb(228 228 231 / 1);
  box-shadow: 0 1px 2px 0 rgb(9 9 11 / 0.05);
}

.form-input,
.form-textarea,
.form-multiselect,
.form-select,
.form-checkbox {
  border-radius: 0.125rem;
}

.form-input,
.form-textarea,
.form-multiselect,
.form-select {
  background-color: rgb(255 255 255 / 1);
  padding-inline: 1rem;
  padding-block: 0.5rem;
  font-size: 0.875rem;
  color: rgb(98 98 105 / 1);
  border-color: rgb(228 228 231 / 1);
}

.form-input:focus,
.form-textarea:focus,
.form-multiselect:focus,
.form-select:focus,
.form-checkbox:focus,
.form-radio:focus {
  border-color: rgb(168 162 158 / 1);
}
```

## Input Fields

### Text Input

Standard text input field.

```html
<input 
  class="form-input text-sm w-full" 
  type="text" 
  placeholder="Enter your name"
/>
```

**Classes:**
- Base: `form-input`
- Size: `text-sm` (0.875rem)
- Width: `w-full` (or custom width)
- Placeholder: Automatically styled `placeholder-zinc-400`

### Email Input

Input field optimized for email addresses.

```html
<input 
  class="form-input text-sm w-full" 
  type="email" 
  placeholder="mark@acmecorp.com"
/>
```

### Password Input

Input field with password masking.

```html
<input 
  class="form-input text-sm w-full" 
  type="password" 
  placeholder="••••••••"
/>
```

### Search Input

Input field with search-specific styling.

```html
<input 
  class="form-input text-sm w-full" 
  type="search" 
  placeholder="Search..."
/>
```

**Note:** Search inputs automatically hide browser decoration:
```css
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
  -webkit-appearance: none;
}
```

## Textarea

Multi-line text input field.

```html
<textarea 
  id="message" 
  class="form-textarea text-sm w-full" 
  rows="4" 
  placeholder="Share your requirements"
></textarea>
```

**Classes:**
- Base: `form-textarea`
- Size: `text-sm` (0.875rem)
- Width: `w-full`
- Rows: `rows="4"` (adjustable)
- Placeholder: Automatically styled `placeholder-zinc-400`

## Select Dropdowns

### Standard Select

Dropdown selection field.

```html
<select id="channel" class="form-select w-full" required>
  <option>Twitter</option>
  <option>Medium</option>
  <option>Telegram</option>
</select>
```

**Classes:**
- Base: `form-select`
- Width: `w-full` (or custom width)
- Extra padding: `pr-10` (for dropdown arrow)

### Select with Label

Select field with associated label.

```html
<div>
  <label class="block text-sm text-zinc-800 font-medium mb-2" for="channel">
    How did you hear about us?
  </label>
  <select id="channel" class="form-select w-full" required>
    <option>Twitter</option>
    <option>Medium</option>
    <option>Telegram</option>
  </select>
</div>
```

## Checkboxes

### Standard Checkbox

Single checkbox for boolean choices.

```html
<div class="flex items-center">
  <input 
    id="terms" 
    class="form-checkbox" 
    type="checkbox" 
  />
  <label for="terms" class="text-sm text-zinc-600 ml-2">
    I agree to the terms and conditions
  </label>
</div>
```

**Classes:**
- Checkbox: `form-checkbox`
- Label: `text-sm text-zinc-600 ml-2`

### Checkbox States

```html
<!-- Unchecked -->
<input class="form-checkbox" type="checkbox" />

<!-- Checked -->
<input class="form-checkbox checked:bg-zinc-800" type="checkbox" checked />

<!-- Disabled -->
<input class="form-checkbox" type="checkbox" disabled />
```

**Checkbox Base Styles:**
```css
.form-checkbox {
  border-radius: 0.125rem;
  background-color: rgb(255 255 255 / 1);
}

.form-checkbox:checked {
  background-color: rgb(9 9 11 / 1);
  border-color: transparent;
}

.form-checkbox:focus-visible:not(:checked) {
  border-color: rgb(168 162 158 / 1);
}
```

## Radio Buttons

### Standard Radio Group

Group of radio buttons for single-choice selection.

```html
<div class="space-y-2">
  <div class="flex items-center">
    <input 
      id="option1" 
      class="form-radio" 
      type="radio" 
      name="options" 
      value="option1"
    />
    <label for="option1" class="text-sm text-zinc-600 ml-2">
      Option 1
    </label>
  </div>
  <div class="flex items-center">
    <input 
      id="option2" 
      class="form-radio" 
      type="radio" 
      name="options" 
      value="option2"
    />
    <label for="option2" class="text-sm text-zinc-600 ml-2">
      Option 2
    </label>
  </div>
</div>
```

**Classes:**
- Radio: `form-radio`
- Label: `text-sm text-zinc-600 ml-2`
- Container: `space-y-2` (for vertical spacing)

## Form Labels

### Standard Label

Label for form elements.

```html
<label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
  Email Address
</label>
```

**Classes:**
- Display: `block`
- Size: `text-sm` (0.875rem)
- Color: `text-zinc-800`
- Weight: `font-medium` (500)
- Bottom margin: `mb-2` (0.5rem)
- For: `for="id"` (associates with input)

### Required Field Label

Label indicating a required field.

```html
<label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
  Email Address
  <span class="text-red-500 ml-1">*</span>
</label>
```

**Required indicator:** `text-red-500 ml-1`

### Label with Helper Text

Label with additional helper information.

```html
<div>
  <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
    Email Address
  </label>
  <input 
    id="email" 
    class="form-input text-sm w-full" 
    type="email" 
    placeholder="mark@acmecorp.com"
  />
  <p class="text-sm text-zinc-500 mt-2">
    We'll never share your email with anyone else.
  </p>
</div>
```

**Helper text classes:** `text-sm text-zinc-500 mt-2`

## Form States

### Default State

Standard form field appearance.

```html
<input 
  class="form-input text-sm w-full" 
  type="text" 
  placeholder="Default state"
/>
```

### Focus State

Active focus state for keyboard navigation.

```html
<input 
  class="form-input text-sm w-full focus:border-zinc-400" 
  type="text" 
  placeholder="Focus state"
/>
```

**Focus classes:** `focus:border-zinc-400`

### Error State

Form field with validation error.

```html
<div>
  <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
    Email Address
  </label>
  <input 
    id="email" 
    class="form-input text-sm w-full border-red-500 focus:border-red-500" 
    type="email" 
    placeholder="mark@acmecorp.com"
  />
  <p class="text-sm text-red-500 mt-2">
    Please enter a valid email address
  </p>
</div>
```

**Error classes:**
- Input: `border-red-500 focus:border-red-500`
- Error text: `text-sm text-red-500 mt-2`

### Disabled State

Disabled form field.

```html
<input 
  class="form-input text-sm w-full opacity-50 cursor-not-allowed" 
  type="text" 
  placeholder="Disabled field"
  disabled
/>
```

**Disabled classes:** `opacity-50 cursor-not-allowed`

## Form Layouts

### Vertical Form Layout

Standard vertical form layout.

```html
<form>
  <div class="space-y-4">
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="name">
        Full Name
      </label>
      <input 
        id="name" 
        class="form-input text-sm w-full" 
        type="text" 
        placeholder="Patrick Rossi" 
        required 
      />
    </div>
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
        Work Email
      </label>
      <input 
        id="email" 
        class="form-input text-sm w-full" 
        type="email" 
        placeholder="mark@acmecorp.com" 
        required 
      />
    </div>
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="message">
        Project Details
      </label>
      <textarea 
        id="message" 
        class="form-textarea text-sm w-full" 
        rows="4" 
        placeholder="Share your requirements" 
        required
      ></textarea>
    </div>
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Submit
    </button>
  </div>
</form>
```

**Layout classes:**
- Form container: `space-y-4` (vertical spacing between fields)
- Submit button: `mt-5` (top margin above button)

### Two-Column Form Layout

Responsive two-column form.

```html
<form>
  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="firstName">
        First Name
      </label>
      <input 
        id="firstName" 
        class="form-input text-sm w-full" 
        type="text" 
        required 
      />
    </div>
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="lastName">
        Last Name
      </label>
      <input 
        id="lastName" 
        class="form-input text-sm w-full" 
        type="text" 
        required 
      />
    </div>
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Submit
    </button>
  </div>
</form>
```

**Layout classes:**
- Grid: `grid gap-4 sm:grid-cols-2`
- Mobile: Single column
- Desktop: Two columns

### Form with Inline Fields

Form with inline field layout.

```html
<form>
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="flex-1">
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="name">
        Name
      </label>
      <input 
        id="name" 
        class="form-input text-sm w-full" 
        type="text" 
        required 
      />
    </div>
    <div class="flex-1">
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
        Email
      </label>
      <input 
        id="email" 
        class="form-input text-sm w-full" 
        type="email" 
        required 
      />
    </div>
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Submit
    </button>
  </div>
</form>
```

**Layout classes:**
- Container: `flex flex-col sm:flex-row gap-4`
- Mobile: Vertical stack
- Desktop: Horizontal row

## Specialized Forms

### Login Form

Classic login form with email and password.

```html
<form>
  <div class="space-y-4">
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
        Email
      </label>
      <input 
        id="email" 
        class="form-input text-sm w-full" 
        type="email" 
        placeholder="mark@acmecorp.com" 
        required 
      />
    </div>
    <div>
      <div class="flex justify-between">
        <label class="block text-sm text-zinc-800 font-medium mb-2" for="password">
          Password
        </label>
        <a class="text-sm font-medium text-zinc-500 underline hover:no-underline ml-2" href="reset-password.html">
          Forgot?
        </a>
      </div>
      <input 
        id="password" 
        class="form-input text-sm w-full" 
        type="password" 
        required 
      />
    </div>
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Log in
    </button>
  </div>
</form>
```

### Contact/Request Demo Form

Extended form with multiple field types.

```html
<form>
  <div class="space-y-4">
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="name">
        Full Name
      </label>
      <input 
        id="name" 
        class="form-input text-sm w-full" 
        type="text" 
        placeholder="Patrick Rossi" 
        required 
      />
    </div>
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
        Work Email
      </label>
      <input 
        id="email" 
        class="form-input text-sm w-full" 
        type="email" 
        placeholder="mark@acmecorp.com" 
        required 
      />
    </div>
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="channel">
        How did you hear about us?
      </label>
      <select id="channel" class="form-select w-full" required>
        <option>Twitter</option>
        <option>Medium</option>
        <option>Telegram</option>
      </select>
    </div>
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="message">
        Project Details
      </label>
      <textarea 
        id="message" 
        class="form-textarea text-sm w-full" 
        rows="4" 
        placeholder="Share your requirements" 
        required
      ></textarea>
    </div>
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Request Demo
    </button>
  </div>
</form>
```

## Form with Social Login

Form with social authentication options.

```html
<form>
  <div class="space-y-4">
    <!-- Form fields -->
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
        Email
      </label>
      <input 
        id="email" 
        class="form-input text-sm w-full" 
        type="email" 
        placeholder="mark@acmecorp.com" 
        required 
      />
    </div>
    <div>
      <label class="block text-sm text-zinc-800 font-medium mb-2" for="password">
        Password
      </label>
      <input 
        id="password" 
        class="form-input text-sm w-full" 
        type="password" 
        required 
      />
    </div>
  </div>
  <div class="mt-5">
    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
      Log in
    </button>
  </div>
  
  <!-- Divider -->
  <div class="flex items-center my-5 before:border-t before:border-zinc-200 before:grow before:mr-3 after:border-t after:border-zinc-200 after:grow after:ml-3">
    <div class="text-xs text-zinc-400 italic">Or</div>
  </div>
  
  <!-- Social login -->
  <button class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm group relative flex after:flex-1">
    <div class="flex-1 flex items-center">
      <svg class="w-4 h-4 fill-zinc-400 group-hover:fill-rose-500 shrink-0 transition" viewBox="0 0 16 16">
        <path d="M15.679 6.545H8.043v3.273h4.328c-.692 2.182-2.401 2.91-4.363 2.91a4.727 4.727 0 1 1 3.035-8.347l2.378-2.265A8 8 0 1 0 8.008 16c4.41 0 8.4-2.909 7.67-9.455Z" />
      </svg>
    </div>
    <span class="flex-auto pl-3">Continue With Google</span>
  </button>
</form>
```

**Divider classes:**
- Container: `flex items-center my-5`
- Left line: `before:border-t before:border-zinc-200 before:grow before:mr-3`
- Right line: `after:border-t after:border-zinc-200 after:grow after:ml-3`
- Text: `text-xs text-zinc-400 italic`

## Form Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `'text' \| 'email' \| 'password' \| 'search' \| 'checkbox' \| 'radio'` | `'text'` | Input type |
| placeholder | `string` | `undefined` | Placeholder text |
| required | `boolean` | `false` | Field is required |
| disabled | `boolean` | `false` | Field is disabled |
| value | `string \| number` | `undefined` | Input value |
| id | `string` | `undefined` | Field identifier (required for labels) |
| name | `string` | `undefined` | Field name for form submission |
| rows | `number` | `undefined` | Number of rows for textarea |

## Usage Guidelines

### DO ✅

- Always provide clear, descriptive labels for form fields
- Use appropriate input types (email, password, etc.)
- Provide helpful placeholder text that doesn't duplicate labels
- Use consistent spacing between form fields (space-y-4)
- Include helper text when field requirements aren't obvious
- Group related fields visually
- Use form validation and provide clear error messages
- Ensure all form fields are keyboard accessible
- Use appropriate focus states for accessibility
- Consider mobile touch targets (minimum 44×44px)

### DON'T ❌

- Don't use placeholder text as a replacement for labels
- Don't create custom form field styles outside the system
- Don't use different colors for form field borders
- Don't mix form field sizes within the same context
- Don't require users to create passwords without strength indicators
- Don't disable form fields without explanation
- Don't use checkboxes when radio buttons are more appropriate
- Don't make form labels ambiguous or unclear
- Don't skip form validation or provide unclear error messages
- Don't create custom input types outside standard HTML5

## Accessibility

### Keyboard Navigation

All form fields should be keyboard accessible:

```html
<!-- Accessible form field -->
<label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
  Email Address
</label>
<input 
  id="email" 
  class="form-input text-sm w-full" 
  type="email" 
  placeholder="mark@acmecorp.com"
  aria-required="true"
  aria-invalid="false"
/>
```

### ARIA Attributes

Use appropriate ARIA attributes for accessibility:

```html
<!-- Required field -->
<input 
  class="form-input text-sm w-full" 
  type="email" 
  aria-required="true"
  required
/>

<!-- Error state -->
<input 
  class="form-input text-sm w-full border-red-500" 
  type="email" 
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" class="text-sm text-red-500 mt-2" role="alert">
  Please enter a valid email address
</p>

<!-- Descriptive text -->
<input 
  class="form-input text-sm w-full" 
  type="email" 
  aria-describedby="email-help"
/>
<p id="email-help" class="text-sm text-zinc-500 mt-2">
  We'll never share your email with anyone else.
</p>
```

### Label Association

Always associate labels with their form fields:

```html
<!-- Correct: label with for attribute -->
<label for="email">Email Address</label>
<input id="email" type="email" />

<!-- Alternative: implicit label -->
<label>
  Email Address
  <input type="email" />
</label>
```

### Focus Management

Ensure proper focus states and management:

```html
<input 
  class="form-input text-sm w-full focus:border-zinc-400 focus:ring-0 focus:ring-offset-0" 
  type="text"
/>
```

**Note:** The form system uses `focus:ring-0` to prevent default Tailwind focus rings, relying on border color changes for focus indication.

## Examples

### Complete Login Page

```html
<section class="relative before:absolute before:inset-0 before:h-80 before:pointer-events-none before:bg-linear-to-b before:from-zinc-100 before:-z-10">
  <div class="pt-32 pb-12 md:pt-40 md:pb-20">
    <div class="px-4 sm:px-6">
      <!-- Page header -->
      <div class="max-w-3xl mx-auto text-center pb-12 md:pb-16">
        <h1 class="font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900">
          Log in to Gray
        </h1>
      </div>

      <!-- Form -->
      <div class="max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7 relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
        
        <form>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
                Email
              </label>
              <input 
                id="email" 
                class="form-input text-sm w-full" 
                type="email" 
                placeholder="mark@acmecorp.com" 
                required 
              />
            </div>
            <div>
              <div class="flex justify-between">
                <label class="block text-sm text-zinc-800 font-medium mb-2" for="password">
                  Password
                </label>
                <a class="text-sm font-medium text-zinc-500 underline hover:no-underline ml-2" href="reset-password.html">
                  Forgot?
                </a>
              </div>
              <input 
                id="password" 
                class="form-input text-sm w-full" 
                type="password" 
                required 
              />
            </div>
          </div>
          <div class="mt-5">
            <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
              Log in
            </button>
          </div>
        </form>
        
        <!-- Divider -->
        <div class="flex items-center my-5 before:border-t before:border-zinc-200 before:grow before:mr-3 after:border-t after:border-zinc-200 after:grow after:ml-3">
          <div class="text-xs text-zinc-400 italic">Or</div>
        </div>
        
        <!-- Social login -->
        <button class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm group relative flex after:flex-1">
          <div class="flex-1 flex items-center">
            <svg class="w-4 h-4 fill-zinc-400 group-hover:fill-rose-500 shrink-0 transition" viewBox="0 0 16 16">
              <path d="M15.679 6.545H8.043v3.273h4.328c-.692 2.182-2.401 2.91-4.363 2.91a4.727 4.727 0 1 1 3.035-8.347l2.378-2.265A8 8 0 1 0 8.008 16c4.41 0 8.4-2.909 7.67-9.455Z" />
            </svg>
          </div>
          <span class="flex-auto pl-3">Continue With Google</span>
        </button>
        
        <div class="text-center mt-6">
          <div class="text-xs text-zinc-500">
            By logging in you agree with our 
            <a class="underline hover:no-underline" href="#0">Terms</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

## Implementation Notes

### Tailwind Forms Plugin

The form system uses the Tailwind Forms plugin:

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/forms', {
      strategy: 'base',
    }),
  ],
};
```

### Custom Form Classes

```css
/* Utility patterns from utility-patterns.css */
.form-input,
.form-textarea,
.form-multiselect,
.form-select,
.form-checkbox,
.form-radio {
  border-style: solid;
  border-width: 1px;
  border-color: rgb(228 228 231 / 1);
  box-shadow: 0 1px 2px 0 rgb(9 9 11 / 0.05);
}

.form-input,
.form-textarea,
.form-multiselect,
.form-select,
.form-checkbox {
  border-radius: 0.125rem;
}

.form-input,
.form-textarea,
.form-multiselect,
.form-select {
  background-color: rgb(255 255 255 / 1);
  padding-inline: 1rem;
  padding-block: 0.5rem;
  font-size: 0.875rem;
  color: rgb(98 98 105 / 1);
  border-color: rgb(228 228 231 / 1);
}

.form-input,
.form-textarea {
  &::placeholder {
    color: rgb(168 162 158 / 1);
  }
}

.form-select {
  padding-right: 2.5rem;
}

.form-checkbox,
.form-radio {
  background-color: rgb(255 255 255 / 1);
  color: rgb(9 9 11 / 1);
}

.form-checkbox:checked,
.form-radio:checked {
  background-color: rgb(9 9 11 / 1);
  border-color: transparent;
}

.form-checkbox:focus-visible:not(:checked),
.form-radio:focus-visible:not(:checked) {
  border-color: rgb(168 162 158 / 1);
}

.form-checkbox {
  border-radius: 0.125rem;
}
```

## Component Reference

| Component | Base Class | Use Case |
|-----------|------------|----------|
| Text Input | `form-input` | Single-line text input |
| Email Input | `form-input` `type="email"` | Email address input |
| Password Input | `form-input` `type="password"` | Password input |
| Search Input | `form-input` `type="search"` | Search field |
| Textarea | `form-textarea` | Multi-line text input |
| Select | `form-select` | Dropdown selection |
| Checkbox | `form-checkbox` | Boolean choice |
| Radio | `form-radio` | Single-choice selection |

| Element | Classes | Purpose |
|---------|----------|---------|
| Label | `text-sm text-zinc-800 font-medium mb-2` | Field label |
| Helper Text | `text-sm text-zinc-500 mt-2` | Additional information |
| Error Text | `text-sm text-red-500 mt-2` | Validation error |
| Container | `space-y-4` | Vertical spacing between fields |
| Submit Button | `btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm` | Form submission |

---

**Note:** Always use exact form classes specified in this documentation. Never create custom form field styles or deviate from the defined patterns. Ensure all form fields are accessible and follow the spacing and typography guidelines.