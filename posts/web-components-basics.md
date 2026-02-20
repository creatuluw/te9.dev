---
title: Web Components Basics
date: 2025-02-13
description: Build reusable, encapsulated UI components with native browser APIs that work everywhere.
---

# Web Components Basics

Web Components are a set of native browser APIs that let you create reusable, encapsulated components. No frameworks needed—just vanilla JavaScript that works across all modern browsers.

## Custom Elements

Create your own HTML elements:

```javascript
class MyButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<button>Click me</button>`;
  }
}

customElements.define('my-button', MyButton);
```

Use it in HTML:

```html
<my-button></my-button>
```

## Shadow DOM

Encapsulate styles and markup:

```javascript
class MyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: white;
          padding: 1rem;
        }
      </style>
      <slot></slot>
    `;
  }
}
```

Styles won't leak in or out.

## HTML Templates

Define reusable markup:

```html
<template id="card-template">
  <style>
    .card { padding: 1rem; }
  </style>
  <div class="card">
    <slot name="title"></slot>
    <slot name="content"></slot>
  </div>
</template>
```

Clone and use:

```javascript
const template = document.getElementById('card-template');
const clone = template.content.cloneNode(true);
```

## Attributes and Properties

Accept inputs:

```javascript
class MyBadge extends HTMLElement {
  static get observedAttributes() {
    return ['type'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'type') {
      this.render();
    }
  }

  render() {
    const type = this.getAttribute('type') || 'default';
    this.innerHTML = `<span class="badge-${type}">`;
  }
}
```

## Slots for Content

Compose with slots:

```html
<my-card>
  <h2 slot="title">Card Title</h2>
  <p slot="content">Card content goes here.</p>
</my-card>
```

## Lifecycle Callbacks

Hook into component lifecycle:

```javascript
class MyComponent extends HTMLElement {
  constructor() { super(); }
  
  connectedCallback() {
    // Element added to DOM
  }
  
  disconnectedCallback() {
    // Element removed from DOM
  }
  
  adoptedCallback() {
    // Element moved to new document
  }
}
```

## Start Simple

Web Components work great alone or with frameworks. Start with simple components and build complexity as needed.
