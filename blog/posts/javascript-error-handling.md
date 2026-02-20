---
title: JavaScript Error Handling
date: 2025-02-16
description: Write robust JavaScript applications with proper error handling patterns and techniques.
---

# JavaScript Error Handling

Errors happen. Networks fail, users input unexpected data, and APIs change. Good error handling separates production-ready code from fragile scripts. Here's how to handle errors gracefully.

## Try-Catch Basics

Wrap risky code in try-catch blocks:

```javascript
try {
  const data = JSON.parse(jsonString);
  processData(data);
} catch (error) {
  console.error('Failed to parse JSON:', error.message);
  // Graceful fallback
  showUserError('Invalid data format');
}
```

Never catch errors silently. Always handle or rethrow.

## Throwing Meaningful Errors

Create descriptive error messages:

```javascript
function fetchUser(id) {
  if (!id) {
    throw new Error('User ID is required');
  }
  if (typeof id !== 'string') {
    throw new TypeError('User ID must be a string');
  }
  // ...
}
```

Use the right error type: `Error`, `TypeError`, `RangeError`, `SyntaxError`.

## Custom Error Classes

Create domain-specific errors:

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

throw new ValidationError('Email is invalid', 'email');
```

This makes error handling more specific.

## Async Error Handling

Handle promise rejections properly:

```javascript
// With async/await
async function loadUser(id) {
  try {
    const response = await fetch(`/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logError(error);
    return null;
  }
}

// With promises
fetch('/api/data')
  .then(response => response.json())
  .catch(error => console.error('Fetch failed:', error));
```

## Global Error Handling

Catch unhandled errors at the application level:

```javascript
// Synchronous errors
window.onerror = (message, source, line, col, error) => {
  logToService({ message, source, line, error });
  return true; // Prevent default
};

// Promise rejections
window.onunhandledrejection = (event) => {
  logToService(event.reason);
  event.preventDefault();
};
```

## Error Logging

Send errors to a monitoring service:

```javascript
function logToService(error, context = {}) {
  navigator.sendBeacon('/api/errors', JSON.stringify({
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    ...context
  }));
}
```

Services like Sentry, LogRocket, or Rollbar help track production errors.

## User-Friendly Messages

Never show technical errors to users:

```javascript
const ERROR_MESSAGES = {
  NetworkError: 'Please check your internet connection',
  ValidationError: 'Please check your input',
  AuthError: 'Please log in again',
  default: 'Something went wrong. Please try again.'
};

function showUserError(error) {
  const message = ERROR_MESSAGES[error.name] || ERROR_MESSAGES.default;
  toast.error(message);
}
```

## Start Handling Errors Today

Every `try-catch` you write makes your app more resilient. Start with critical paths: network requests, form submissions, and user inputs.