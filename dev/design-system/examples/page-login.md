# Login Page Example

A complete login page implementation demonstrating authentication patterns in the Gray Design System. This example shows how to create a secure, accessible, and visually consistent login interface.

## Page Structure

This login page includes:
- **Fixed Header**: Navigation with logo and links
- **Hero Section**: Page heading and description
- **Login Form Container**: Centered form with special styling and glow effect
- **Social Login**: Alternative authentication options with divider
- **Footer Elements**: Terms and conditions link

## Complete Implementation

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Gray Design System - Login</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="./style.css" rel="stylesheet">
</head>

<body class="font-inter antialiased bg-white text-zinc-900 tracking-tight">

  <!-- Page wrapper -->
  <div class="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">

    <!-- Site header -->
    <header class="absolute top-2 md:top-6 w-full z-30" role="banner">
      <div class="px-4 sm:px-6">
        <div class="max-w-3xl mx-auto">
          <div class="flex items-center justify-between h-14 border border-transparent [background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box] rounded-lg px-3">
          
            <!-- Site branding -->
            <div class="shrink-0 mr-4">
              <!-- Logo -->
              <a class="flex items-center justify-center bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20" href="index.html" aria-label="Home">
                <img src="./images/logo.png" width="24" height="24" alt="Logo">
              </a>
            </div>
          
            <!-- Desktop navigation -->
            <nav class="flex grow">
            
              <!-- Desktop sign in links -->
              <ul class="flex grow justify-end flex-wrap items-center">
                <li>
                  <a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition" href="login.html">
                    Log in
                  </a>
                </li>
                <li class="ml-1">
                  <a class="btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm" href="request-demo.html">
                    Request Demo
                  </a>
                </li>
              </ul>
            
            </nav>
          
          </div>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="grow" role="main">
      
      <section class="relative before:absolute before:inset-0 before:h-80 before:pointer-events-none before:bg-linear-to-b before:from-zinc-100 before:-z-10" aria-labelledby="login-heading">
        <div class="pt-32 pb-12 md:pt-40 md:pb-20">
          <div class="px-4 sm:px-6">

            <!-- Page header -->
            <div class="max-w-3xl mx-auto text-center pb-12 md:pb-16">
              <h1 id="login-heading" class="font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900">
                Log in to Gray
              </h1>
            </div>

            <!-- Form -->
            <div class="max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7 relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
            
              <form id="login-form" action="#" method="POST" novalidate>
                <div class="space-y-4">
                  
                  <!-- Email field -->
                  <div>
                    <label class="block text-sm text-zinc-800 font-medium mb-2" for="email">
                      Email
                    </label>
                    <input 
                      id="email" 
                      class="form-input text-sm w-full" 
                      type="email" 
                      name="email"
                      placeholder="mark@acmecorp.com" 
                      required
                      autocomplete="email"
                      aria-required="true"
                      aria-describedby="email-error"
                    />
                  </div>
                  
                  <!-- Password field -->
                  <div>
                    <div class="flex justify-between">
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="password">
                        Password
                      </label>
                      <a class="text-sm font-medium text-zinc-500 underline hover:no-underline ml-2" href="reset-password.html" aria-label="Reset password">
                        Forgot?
                      </a>
                    </div>
                    <input 
                      id="password" 
                      class="form-input text-sm w-full" 
                      type="password" 
                      name="password"
                      required
                      autocomplete="current-password"
                      aria-required="true"
                      minlength="8"
                      aria-describedby="password-error password-hint"
                    />
                    <p id="password-hint" class="text-xs text-zinc-400 mt-1">
                      Must be at least 8 characters
                    </p>
                  </div>
                  
                </div>
                
                <!-- Submit button -->
                <div class="mt-5">
                  <button 
                    type="submit"
                    class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
                  >
                    Log in
                  </button>
                </div>
              </form>
            
              <!-- Divider -->
              <div class="flex items-center my-5 before:border-t before:border-zinc-200 before:grow before:mr-3 after:border-t after:border-zinc-200 after:grow after:ml-3" role="separator" aria-label="Or">
                <div class="text-xs text-zinc-400 italic">
                  Or
                </div>
              </div>
            
              <!-- Social login -->
              <button 
                type="button"
                class="btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm group relative flex after:flex-1 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
                aria-label="Continue with Google"
              >
                <div class="flex-1 flex items-center">
                  <svg class="w-4 h-4 fill-zinc-400 group-hover:fill-rose-500 shrink-0 transition" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M15.679 6.545H8.043v3.273h4.328c-.692 2.182-2.401 2.91-4.363 2.91a4.727 4.727 0 1 1 3.035-8.347l2.378-2.265A8 8 0 1 0 8.008 16c4.41 0 8.4-2.909 7.67-9.455Z" />
                  </svg>
                </div>
                <span class="flex-auto pl-3">
                  Continue With Google
                </span>
              </button>
            
              <div class="text-center mt-6">
                <div class="text-xs text-zinc-500">
                  By logging in you agree with our 
                  <a class="underline hover:no-underline" href="#0">
                    Terms
                  </a>
                </div>
              </div>
            
            </div>

          </div>
        </div>
      </section>

    </main>

  </div>

</body>

</html>
```

## Component Breakdown

### Header Component
- **Type**: Fixed navigation with gradient border
- **Classes**: `absolute top-2 md:top-6 w-full z-30`
- **Pattern**: Logo + Navigation Links + CTA Button
- **Documentation**: See [Header Patterns](../layouts/patterns.md#navigation-patterns)

### Hero Section
- **Type**: Simple page heading with gradient text
- **Classes**: `pt-32 pb-12 md:pt-40 md:pb-20`
- **Features**:
  - Centered heading: `text-center`
  - Gradient text: `bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900`
- **Documentation**: See [Hero Section Pattern](../layouts/patterns.md#hero-section)

### Login Form Container
- **Type**: Centered form with special styling
- **Classes**: `max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl`
- **Features**:
  - Gradient background: `bg-linear-to-b from-zinc-100 to-zinc-50/.7`
  - Glow effect: `before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10`
  - Max width: `max-w-[25rem]` (400px)
- **Documentation**: See [Form Section Pattern](../layouts/patterns.md#form-section)

### Form Elements
- **Email Input**: `form-input text-sm w-full` with `type="email"`
- **Password Input**: `form-input text-sm w-full` with `type="password"`
- **Labels**: `text-sm text-zinc-800 font-medium mb-2`
- **Helper Text**: `text-xs text-zinc-400 mt-1`
- **Submit Button**: `btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm`
- **Documentation**: See [Form Components](../components/form.md)

### Social Login Button
- **Type**: Secondary authentication option with icon
- **Classes**: `btn text-zinc-600 bg-white hover:text-zinc-900 w-full shadow-sm`
- **Features**:
  - Icon on left: `flex-1 flex items-center`
  - Google logo SVG with hover effect
  - Group hover: `group-hover:fill-rose-500`
- **Documentation**: See [Social Login](../components/form.md#form-with-social-login)

### Divider Component
- **Type**: Visual separator between form and social login
- **Classes**: `flex items-center my-5`
- **Features**:
  - Left line: `before:border-t before:border-zinc-200 before:grow before:mr-3`
  - Right line: `after:border-t after:border-zinc-200 after:grow after:ml-3`
  - Center text: `text-xs text-zinc-400 italic`
- **Documentation**: See [Form with Social Login](../components/form.md#form-with-social-login)

## Token Usage

### Colors
- **Form Container Background**: `from-zinc-100 to-zinc-50/.7`
- **Glow Effect**: `before:bg-zinc-900 before:opacity-[.15]`
- **Form Labels**: `text-zinc-800`
- **Form Input Text**: `text-zinc-600`
- **Input Placeholder**: `placeholder-zinc-400` (automatic)
- **Primary Button**: `text-zinc-100 bg-zinc-900 hover:bg-zinc-800`
- **Secondary Button**: `text-zinc-600 bg-white hover:text-zinc-900`
- **Social Icon**: `fill-zinc-400 group-hover:fill-rose-500`
- **Documentation**: See [Color Tokens](../tokens/colors.md)

### Typography
- **Page Heading**: `font-inter-tight text-4xl md:text-5xl font-bold`
- **Form Labels**: `text-sm font-medium`
- **Helper Text**: `text-xs` (0.75rem)
- **Button Text**: `text-sm font-medium`
- **Divider Text**: `text-xs italic`
- **Documentation**: See [Typography Tokens](../tokens/typography.md)

### Spacing
- **Section Padding**: `pt-32 pb-12 md:pt-40 md:pb-20`
- **Form Padding**: `p-6` (1.5rem)
- **Field Spacing**: `space-y-4` (1rem vertical gap)
- **Label Spacing**: `mb-2` (0.5rem bottom margin)
- **Button Top Margin**: `mt-5` (1.25rem)
- **Divider Spacing**: `my-5` (1.25rem vertical margin)
- **Documentation**: See [Spacing Tokens](../tokens/spacing.md)

### Borders and Shadows
- **Form Container**: `rounded-lg shadow-2xl`
- **Header Border**: `[background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box]`
- **Button Shadow**: `shadow-sm`
- **Logo Shadow**: `shadow-xs shadow-zinc-950/20`
- **Documentation**: See [Color Tokens](../tokens/colors.md#shadow-system)

## Form Features

### Input Validation
```html
<!-- Required field with error state -->
<input 
  id="email"
  class="form-input text-sm w-full border-red-500 focus:border-red-500"
  type="email"
  required
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" class="text-sm text-red-500 mt-2" role="alert">
  Please enter a valid email address
</p>
```

### Password Strength Indicator
```html
<!-- Password with strength hints -->
<div>
  <label class="text-sm text-zinc-800 font-medium mb-2" for="password">
    Password
  </label>
  <input 
    id="password"
    class="form-input text-sm w-full"
    type="password"
    required
    minlength="8"
    aria-describedby="password-error password-hint password-strength"
  />
  <p id="password-hint" class="text-xs text-zinc-400 mt-1">
    Must be at least 8 characters
  </p>
  <div id="password-strength" class="mt-2 space-y-1">
    <div class="text-xs text-zinc-500">• At least 8 characters</div>
    <div class="text-xs text-zinc-500">• Contains uppercase letter</div>
    <div class="text-xs text-zinc-500">• Contains number</div>
  </div>
</div>
```

### Remember Me Checkbox
```html
<!-- Remember me with checkbox -->
<div class="flex items-center mt-4">
  <input 
    id="remember"
    class="form-checkbox"
    type="checkbox"
    name="remember"
  />
  <label for="remember" class="text-sm text-zinc-600 ml-2">
    Remember me for 30 days
  </label>
</div>
```

## Accessibility Features

### Semantic HTML
- `<header role="banner">` for page header
- `<main role="main">` for main content area
- `<form>` with proper `action` and `method` attributes
- `<label>` elements associated with inputs via `for` attribute
- `<button type="submit">` for form submission

### ARIA Attributes
```html
<!-- Required fields -->
<input 
  required
  aria-required="true"
/>

<!-- Error states -->
<input 
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" role="alert">
  Error message
</p>

<!-- Descriptive text -->
<input 
  aria-describedby="password-hint"
/>
<p id="password-hint">
  Helper text
</p>

<!-- Social login button -->
<button 
  aria-label="Continue with Google"
>
  <!-- Icon and text -->
</button>

<!-- Separator -->
<div role="separator" aria-label="Or">
  <!-- Divider content -->
</div>
```

### Keyboard Navigation
```html
<!-- Focus states for all interactive elements -->
<button 
  class="btn focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
>
  Log in
</button>

<input 
  class="form-input focus:border-zinc-400"
/>
```

### Color Contrast
- **Form labels on white**: zinc-800 (contrast ratio 12.6:1 - AAA)
- **Helper text on white**: zinc-400 (contrast ratio 4.5:1 - AA)
- **Primary button**: zinc-100 on zinc-900 (15.5:1 - AAA)
- **Secondary button**: zinc-600 on white (4.95:1 - AA)
- **Social icon**: zinc-400 (3.3:1) → rose-500 on hover (4.5:1 - AA)

## Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Full-width form container
- Stacked header elements
- Standard button sizes
- Touch-friendly spacing

### Tablet (640px - 768px)
- Centered form with max width
- Two-column header (logo + nav)
- Increased vertical padding
- Improved spacing around form

### Desktop (> 768px)
- Max width form container: 400px
- Full header with gradient border
- Enhanced vertical padding (40px top, 80px bottom)
- Hover effects on all interactive elements
- Optimal text sizes for readability

## Security Considerations

### Form Attributes
```html
<form 
  action="/login"
  method="POST"
  novalidate
  autocomplete="off"
>
  <!-- Form fields -->
</form>
```

### Input Attributes
```html
<!-- Email input -->
<input 
  type="email"
  name="email"
  autocomplete="email"
  required
/>

<!-- Password input -->
<input 
  type="password"
  name="password"
  autocomplete="current-password"
  required
  minlength="8"
  maxlength="128"
/>
```

### Best Practices
- Use HTTPS for form submission
- Implement CSRF protection
- Rate limit login attempts
- Provide clear error messages
- Never expose password requirements in error messages
- Implement account lockout after failed attempts
- Use secure password storage (bcrypt, argon2)

## Customization Options

### Brand Customization
```html
<!-- Change logo -->
<a class="bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20" href="#">
  <img src="your-logo.png" width="24" height="24" alt="Your Brand" />
</a>

<!-- Change brand colors -->
<h1 class="bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900">
  <style>
    /* Override gradient colors */
    .from-zinc-500 { background-color: your-brand-color; }
    .via-zinc-900 { background-color: your-brand-dark; }
    .to-zinc-900 { background-color: your-brand-dark; }
  </style>
  Log in to Your Brand
</h1>
```

### Layout Variations
```html
<!-- Wider form container -->
<div class="max-w-[32rem] mx-auto p-6 rounded-lg shadow-2xl">
  <!-- Form content -->
</div>

<!-- Two-column layout (login + info) -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
  <div class="p-6 rounded-lg shadow-2xl">
    <!-- Login form -->
  </div>
  <div>
    <!-- Info content -->
    <h2 class="font-inter-tight text-3xl font-bold text-zinc-900 mb-4">
      Welcome back
    </h2>
    <p class="text-lg text-zinc-500">
      Log in to access your dashboard and continue where you left off.
    </p>
  </div>
</div>
```

## Testing Checklist

### Functional Testing
- [ ] Form submits with valid credentials
- [ ] Validation errors display for invalid input
- [ ] Password visibility toggle works (if implemented)
- [ ] Remember me checkbox persists state
- [ ] Forgot password link navigates correctly
- [ ] Social login button triggers flow
- [ ] Terms link opens in new tab or modal

### Visual Testing
- [ ] All elements align properly across breakpoints
- [ ] Focus states are visible and accessible
- [ ] Hover effects work as expected
- [ ] Form container glow effect displays correctly
- [ ] Gradient border renders properly
- [ ] Social icon colors change on hover
- [ ] Text remains readable at all sizes

### Accessibility Testing
- [ ] All interactive elements are keyboard accessible
- [ ] Form can be submitted using Enter key
- [ ] Tab order follows logical flow
- [ ] Screen readers announce form labels and errors
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are clearly visible
- [ ] ARIA attributes are correct and complete

### Security Testing
- [ ] Form submits over HTTPS
- [ ] CSRF tokens are included
- [ ] Password input has appropriate autocomplete
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting is implemented
- [ ] Account lockout works after failed attempts

## Related Examples

- **[Landing Page](page-landing.md)**: Main landing page with hero and features
- **[Request Demo](page-request-demo.md)**: Extended form with multiple field types
- **[Form Components](../components/form.md)**: Complete form element documentation
- **[Button Components](../components/button.md)**: Button variants and states

## Migration Guide

### From Custom Login Forms
When migrating existing login forms to this system:

1. **Replace form container** with styled container
   ```html
   <!-- Before -->
   <div style="max-width: 400px; margin: 0 auto; padding: 24px;">
   
   <!-- After -->
   <div class="max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7">
   ```

2. **Update input styles** to use form classes
   ```html
   <!-- Before -->
   <input style="padding: 8px 16px; border: 1px solid #e4e4e7;" />
   
   <!-- After -->
   <input class="form-input text-sm w-full" />
   ```

3. **Replace button styles** with button classes
   ```html
   <!-- Before -->
   <button style="background: #111; color: white; padding: 8px 16px;">
     Log in
   </button>
   
   <!-- After -->
   <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
     Log in
   </button>
   ```

4. **Add accessibility attributes** to form elements
   ```html
   <!-- Add to all inputs -->
   <input aria-required="true" aria-describedby="field-error" />
   
   <!-- Add to form -->
   <form novalidate autocomplete="off">
   ```

## Implementation Notes

### File Structure
- Place in root directory as `login.html`
- Reference `style.css` for compiled Tailwind
- Images in `./images/` directory
- Create `reset-password.html` for forgot password flow
- Link to `index.html` for logo navigation

### Dependencies
- Tailwind CSS v4.0.3
- @tailwindcss/forms plugin
- Inter & Inter Tight fonts (Google Fonts)

### JavaScript Integration
```javascript
// Form validation and submission
document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Validate email
  const email = document.getElementById('email').value;
  if (!validateEmail(email)) {
    showError('email', 'Please enter a valid email address');
    return;
  }
  
  // Validate password
  const password = document.getElementById('password').value;
  if (password.length < 8) {
    showError('password', 'Password must be at least 8 characters');
    return;
  }
  
  // Submit form
  submitForm();
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorId = fieldId + '-error';
  
  input.classList.add('border-red-500');
  input.setAttribute('aria-invalid', 'true');
  
  let errorElement = document.getElementById(errorId);
  if (!errorElement) {
    errorElement = document.createElement('p');
    errorElement.id = errorId;
    errorElement.className = 'text-sm text-red-500 mt-2';
    errorElement.setAttribute('role', 'alert');
    input.parentNode.insertBefore(errorElement, input.nextSibling);
  }
  errorElement.textContent = message;
}

function clearErrors() {
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.classList.remove('border-red-500');
    input.setAttribute('aria-invalid', 'false');
  });
  
  const errors = document.querySelectorAll('[role="alert"]');
  errors.forEach(error => error.remove());
}
```

## Common Issues and Solutions

### Issue: Form not centering on mobile
**Solution**: Ensure container has proper margin and padding
```html
<div class="max-w-[25rem] mx-auto p-6">
  <!-- mx-auto centers horizontally -->
</div>
```

### Issue: Glow effect not visible
**Solution**: Check before element positioning and z-index
```html
<div class="relative">
  <div class="before:absolute before:-z-10">
    <!-- Glow effect -->
  </div>
</div>
```

### Issue: Gradient border not rendering
**Solution**: Ensure full gradient syntax is correct
```html
<div class="[background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box]">
  <!-- Gradient border -->
</div>
```

### Issue: Focus states not visible
**Solution**: Add focus outline and ring classes
```html
<button class="btn focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2">
  Button
</button>
```

---

**Note**: This login page demonstrates authentication patterns in the Gray Design System. All components follow established tokens, patterns, and accessibility guidelines. Use this example as a reference when implementing authentication pages, ensuring consistency with the design system and best practices for security and usability.