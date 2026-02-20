---
title: JavaScript ES Modules
date: 2025-02-15
description: Master the modern JavaScript module system with import/export syntax and best practices.
---

# JavaScript ES Modules

ES Modules are the official standard for JavaScript modules. After years of competing formats (CommonJS, AMD, UMD), native modules are now supported in all modern browsers and Node.js.

## Exporting Code

Share code from a module:

```javascript
// Named exports
export const name = 'MyLib';
export function greet(user) {
  return `Hello, ${user}`;
}
export class User {
  constructor(name) {
    this.name = name;
  }
}

// Default export (one per module)
export default function() {
  console.log('Default export');
}
```

## Importing Code

Use exports in another file:

```javascript
// Named imports
import { name, greet } from './utils.js';

// Default import
import myFunction from './main.js';

// Both
import greet, { name } from './utils.js';

// Import everything
import * as utils from './utils.js';
utils.greet('World');
```

## Dynamic Imports

Load modules on demand:

```javascript
async function loadModule() {
  const module = await import('./heavy-module.js');
  module.doSomething();
}

// Conditional loading
if (userNeedsFeature) {
  const feature = await import('./feature.js');
  feature.init();
}
```

## Browser Usage

Use modules directly in browsers:

```html
<script type="module">
  import { greet } from './utils.js';
  greet('Browser');
</script>

<script type="module" src="app.js"></script>
```

## Module Patterns

Re-export from other modules:

```javascript
// Re-export everything
export * from './utils.js';

// Re-export specific
export { name, greet } from './utils.js';

// Rename while exporting
export { greet as sayHello } from './utils.js';
```

## Best Practices

- Use named exports for utilities
- Use default exports for main functionality
- Keep modules focused and small
- Use relative paths for local modules
- Consider tree-shaking in bundlers

ES Modules are the future. Start using them today for cleaner, more maintainable code.