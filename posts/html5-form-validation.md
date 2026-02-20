---
title: HTML5 Form Validation
date: 2025-02-16
description: Use built-in HTML5 validation attributes to create user-friendly forms without JavaScript.
---

# HTML5 Form Validation

HTML5 provides powerful form validation without any JavaScript. Browser-native validation is faster, more accessible, and works even if JavaScript fails.

## Required Fields

Mark fields as mandatory:

```html
<input type="text" required>
<textarea required></textarea>
```

Browsers prevent form submission and show error messages automatically.

## Input Types

Use semantic types for built-in validation:

```html
<input type="email">     <!-- Validates email format -->
<input type="url">       <!-- Validates URL format -->
<input type="number">    <!-- Numbers only -->
<input type="tel">       <!-- Phone numbers -->
<input type="date">      <!-- Date picker -->
```

Mobile browsers show appropriate keyboards for each type.

## Pattern Matching

Validate with regular expressions:

```html
<input 
  type="text" 
  pattern="[A-Za-z]{3}" 
  title="Three letters only">
```

The `title` attribute provides custom error text.

## Length Constraints

Control input length:

```html
<input type="text" minlength="3" maxlength="20">
<textarea minlength="10" maxlength="500"></textarea>
```

## Number Ranges

Set boundaries for numeric input:

```html
<input type="number" min="1" max="100" step="5">
```

## Styling Validation

Use CSS pseudo-classes:

```css
input:valid {
  border-color: green;
}

input:invalid {
  border-color: red;
}

input:focus:invalid {
  /* Only show when focused */
}
```

## JavaScript Enhancement

For custom validation messages:

```javascript
const input = document.querySelector('input');

input.addEventListener('invalid', () => {
  if (input.validity.valueMissing) {
    input.setCustomValidity('Please fill this field');
  }
});
```

## Best Practices

- Don't rely solely on validation—always validate server-side
- Show validation errors early, not just on submit
- Provide helpful error messages
- Don't be too restrictive with patterns

HTML5 validation handles most needs. Add JavaScript only for complex scenarios.