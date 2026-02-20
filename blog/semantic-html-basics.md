---
title: Semantic HTML Basics
date: 2025-02-18
description: Write meaningful HTML using semantic elements that improve accessibility and SEO.
---

# Semantic HTML Basics

Semantic HTML gives meaning to your markup. Instead of using generic divs for everything, semantic elements describe their purpose to browsers, screen readers, and developers.

## Why Semantics Matter

Semantic HTML provides multiple benefits:

- **Accessibility**: Screen readers navigate by landmarks
- **SEO**: Search engines understand content structure
- **Maintainability**: Code becomes self-documenting
- **Consistency**: Clear patterns for teams to follow

## Document Structure

Use landmarks to define page regions:

```html
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
  </article>
</main>

<footer>
  <p>&copy; 2025</p>
</footer>
```

## Content Elements

Choose elements that match your content:

```html
<article>   <!-- Self-contained content -->
<section>   <!-- Thematic grouping -->
<aside>     <!-- Tangentially related -->
<figure>    <!-- Self-contained media -->
<time>      <!-- Machine-readable dates -->
```

## Text Semantics

Mark up text with meaning:

```html
<mark>      <!-- Highlighted text -->
<cite>      <!-- Citation -->
<abbr>      <!-- Abbreviation -->
<address>   <!-- Contact info -->
<blockquote> <!-- Extended quotes -->
```

## Start Simple

You don't need to use every semantic element. Start with document landmarks (`header`, `main`, `footer`, `nav`) and expand from there.