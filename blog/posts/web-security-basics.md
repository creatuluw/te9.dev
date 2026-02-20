---
title: Web Security Basics
date: 2025-02-16
description: Essential security practices every web developer should know to protect applications and users.
---

# Web Security Basics

Security isn't an afterthought—it's a fundamental requirement. Every developer needs to understand the basics of web security to protect users and applications from common threats.

## Use HTTPS Everywhere

HTTPS encrypts data in transit:

```html
<!-- Force HTTPS -->
<meta http-equiv="Content-Security-Policy" 
      content="upgrade-insecure-requests">
```

Enable HSTS headers on your server:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Prevent XSS Attacks

Cross-site scripting (XSS) injects malicious scripts:

```javascript
// Bad: Direct HTML insertion
element.innerHTML = userInput;

// Good: Text content
element.textContent = userInput;

// Better: Sanitize
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

## Protect Against CSRF

Cross-site request forgery tricks users into unwanted actions:

```html
<form method="POST">
  <input type="hidden" 
         name="csrf_token" 
         value="{{ csrfToken }}">
  <!-- form fields -->
</form>
```

Verify the token server-side on every POST request.

## Content Security Policy

CSP restricts what resources can load:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://trusted.cdn.com; 
               style-src 'self' 'unsafe-inline';">
```

Start restrictive, add exceptions as needed.

## Input Validation

Validate on both client and server:

```javascript
// Client-side
const email = formData.get('email');
if (!isValidEmail(email)) {
  showError('Invalid email format');
  return;
}

// Server-side (always required)
if (!validateInput(email, 'email')) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

## Security Headers

Add these headers to every response:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=()
```

## Stay Updated

Security evolves constantly:

- Subscribe to security advisories
- Keep dependencies updated
- Use tools like `npm audit`
- Test with OWASP ZAP

Security is an ongoing process, not a one-time task.