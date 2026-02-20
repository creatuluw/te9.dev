---
title: Async/Await Patterns
date: 2025-02-16
description: Write cleaner asynchronous JavaScript with async/await patterns that make complex flows readable.
---

# Async/Await Patterns

Async/await makes asynchronous code look synchronous. No more callback hell or long `.then()` chains. Here's how to use it effectively.

## The Basics

Mark functions as async:

```javascript
async function fetchUser(id) {
  const response = await fetch(`/users/${id}`);
  return response.json();
}
```

`await` pauses execution until the promise resolves.

## Error Handling

Use try/catch for errors:

```javascript
async function loadUser(id) {
  try {
    const user = await fetchUser(id);
    return user;
  } catch (error) {
    console.error('Failed to load user:', error);
    throw error;
  }
}
```

## Parallel Operations

Run promises concurrently:

```javascript
async function loadDashboard() {
  const [user, posts, notifications] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchNotifications(userId)
  ]);
  
  return { user, posts, notifications };
}
```

## Sequential Operations

Run promises one after another:

```javascript
async function processFiles(files) {
  for (const file of files) {
    await processFile(file);
  }
}
```

## Promise Patterns

Handle multiple outcomes:

```javascript
async function fetchWithTimeout(url, ms) {
  const response = await Promise.race([
    fetch(url),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
  
  return response;
}
```

## Top-Level Await

Use await at module level:

```javascript
// config.js
export const data = await fetch('/config.json').then(r => r.json());
```

Works in modern browsers and Node.js modules.

## Start Simple

Convert your promise chains to async/await. Your future self will thank you.