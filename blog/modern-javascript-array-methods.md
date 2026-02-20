---
title: Modern JavaScript Array Methods
date: 2025-02-18
description: Master the essential array methods that make JavaScript a joy to write.
---

# Modern JavaScript Array Methods

Array methods transform how we work with data in JavaScript. Gone are the days of `for` loops. These methods make your code declarative, readable, and functional.

## The Big Three

**map** transforms each element:

```javascript
const prices = [10, 20, 30];
const withTax = prices.map(p => p * 1.2);
// [12, 24, 36]
```

**filter** keeps matching elements:

```javascript
const nums = [1, 2, 3, 4, 5];
const evens = nums.filter(n => n % 2 === 0);
// [2, 4]
```

**reduce** accumulates values:

```javascript
const cart = [10, 20, 30];
const total = cart.reduce((sum, p) => sum + p, 0);
// 60
```

## Finding Elements

**find** returns the first match:

```javascript
const users = [{ id: 1 }, { id: 2 }];
const user = users.find(u => u.id === 2);
```

**some** and **every** test conditions:

```javascript
const hasAdmin = users.some(u => u.role === 'admin');
const allActive = users.every(u => u.active);
```

## Flattening Arrays

Handle nested arrays elegantly:

```javascript
const nested = [1, [2, 3], [4, [5]]];
nested.flat(2); // [1, 2, 3, 4, 5]
```

## Chain Them Together

The real power comes from chaining:

```javascript
const result = items
  .filter(item => item.active)
  .map(item => item.price)
  .reduce((sum, price) => sum + price, 0);
```

Learn these methods deeply—they're the foundation of modern JavaScript.