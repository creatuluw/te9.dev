# Interactive Islands Reference

Interactive islands in Nue add dynamic features to your static web content. These are compact, targeted components — such as forms, menus, or image galleries — that seamlessly integrate with your Markdown or layout modules.

## Overview

**Key characteristics:**
- **Lightweight**: Uses a 2.5kb runtime (`/@nue/nue.js`)
- **Progressive enhancement**: Static HTML first, JavaScript second
- **SEO-friendly**: Server-rendered by default
- **Isolated**: Each island is self-contained
- **Flexible**: Can be used anywhere in content or layouts

## Creating Islands

Islands use HTML-based templates stored in `.dhtml` files, identified by the `@name` attribute.

### Basic Island Structure

```html
<form @name="join-list" @submit.prevent="submit" autocomplete="on">
  <label>
    <span>Your name</span>
    <input type="text" name="name" placeholder="Example: John Doe" required>
  </label>
  
  <label>
    <span>Your email</span>
    <input type="email" name="email" placeholder="your@email.com" required>
  </label>
  
  <button>Submit</button>
  
  <script>
    function submit() {
      // Handle form submission
      fetch('/api/join', {
        method: 'POST',
        body: new FormData(this)
      })
    }
  </script>
</form>
```

**Key elements:**
- `@name` attribute: Unique identifier for the island
- Event handlers: `@submit.prevent`, `@click`, etc.
- `<script>` tag: Island-specific JavaScript
- Template syntax: Dynamic data insertion with `{ variable }`

### Event Handlers

Nue supports various event handlers:

```html
<button @click="handleClick">Click me</button>
<form @submit.prevent="handleSubmit">
<input @input="validateInput" type="text">
<div @mouseenter="showTooltip" @mouseleave="hideTooltip">
```

**Common modifiers:**
- `.prevent` - Call `event.preventDefault()`
- `.stop` - Call `event.stopPropagation()`
- `.once` - Run handler only once

### Form Handling

```html
<form @name="contact-form" @submit.prevent="submit">
  <label>
    <span>Email</span>
    <input type="email" name="email" required>
  </label>
  
  <label>
    <span>Message</span>
    <textarea name="message"></textarea>
  </label>
  
  <button type="submit">Send</button>
  
  <script>
    async function submit() {
      const formData = new FormData(this)
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        alert('Message sent!')
        this.reset()
      }
    }
  </script>
</form>
```

## Using Islands

### In Markdown Content

Add islands to Markdown files using bracket syntax:

```markdown
### Join our mailing list

Be the first to know about our new releases.

[join-list]
```

Nue replaces `[join-list]` with the island's HTML, ready to work when the page loads.

### In Layout Modules

Embed islands in layout templates using custom elements:

```html
<footer @name="pagefoot">
  <h3>Join our mailing list</h3>
  <p>Be the first to know about our new releases</p>
  <join-list/>
</footer>
```

### Passing Data to Islands

Pass custom properties to islands:

**From front matter:**

```markdown
---
cta: "Sign up now"
theme: "dark"
---
[join-list cta="{cta}" theme="{theme}"]
```

**From layout:**

```html
<join-list cta="Subscribe now" theme="light"/>
```

**Using in island:**

```html
<form @name="join-list">
  <button>{ cta || 'Submit' }</button>
</form>
```

## Island Organization

Islands can live at different levels in your project, depending on where you need them.

### Scope Levels

1. **Global islands**: `@globals/islands.dhtml`
   - Available across entire site
   - Use for: site-wide signup forms, global search, theme switchers

2. **Area-specific islands**: `blog/islands.dhtml`
   - Available within specific app/section
   - Use for: blog comments, category filters, section-specific features

3. **Page-specific islands**: `blog/post/islands.dhtml`
   - Available on single page
   - Use for: one-off interactive features

### Multiple Islands per File

A single `.dhtml` file can hold multiple islands:

```html
<!-- blog/islands.dhtml -->

<div @name="comment-form">
  <form @submit.prevent="submitComment">
    <!-- form content -->
  </form>
</div>

<div @name="share-button">
  <button @click="sharePage">Share</button>
  <script>
    function sharePage() {
      navigator.share({ url: location.href })
    }
  </script>
</div>

<div @name="related-posts">
  <!-- related posts display -->
</div>
```

Use them separately in Markdown:

```markdown
[comment-form]
[share-button]
[related-posts]
```

## Data Access

Islands pull data from multiple sources, keeping logic separate from content.

### Data Sources

**1. Global data (site.yaml):**

```yaml
# site.yaml
api_endpoint: https://api.example.com
site_name: My Site
```

```html
<form @name="contact">
  <script>
    const endpoint = '{ api_endpoint }'
    // Use endpoint in fetch calls
  </script>
</form>
```

**2. App data (app.yaml):**

```yaml
# blog/blog.yaml
categories: [technology, design, business]
comments_enabled: true
```

```html
<div @name="category-filter">
  <select>
    <option each="cat in categories">{ cat }</option>
  </select>
</div>
```

**3. Page data (front matter):**

```markdown
---
post_id: 123
author: John Doe
---
```

```html
<div @name="comments">
  <script>
    const postId = { post_id }
    fetch(`/api/comments/${postId}`)
  </script>
</div>
```

### Template Syntax

Islands support dynamic template syntax:

**Variable interpolation:**

```html
<h1>{ title }</h1>
<p>By { author }</p>
```

**Conditionals:**

```html
<div>
  <span if="user">Welcome, { user }</span>
  <span else>Please log in</span>
</div>
```

**Loops:**

```html
<ul>
  <li each="item in items">{ item.name }</li>
</ul>
```

**Attributes:**

```html
<button class="btn { theme }" disabled="{ isLoading }">
  { buttonText }
</button>
```

## Isomorphic Islands

For SEO-critical interactivity, islands can render on both server and client.

### Video Player Example

```html
<div @name="video-player">
  <!-- Server-rendered for SEO and no-JS users -->
  <noscript>
    <video src="https://video.nuejs.org/{videoId}/play_720p.mp4" controls>
      Your browser does not support the video tag.
    </video>
  </noscript>
  
  <!-- Client-side enhanced player -->
  <video-player :videoId="videoId" :poster="poster" :width="width"/>
  
  <!-- SEO-friendly caption -->
  <figcaption if="caption">{ caption }</figcaption>
</div>
```

**Benefits:**
- Search engines see video content
- Users without JavaScript can still play video
- JavaScript-enabled users get enhanced experience

### Image Gallery Example

```html
<div @name="image-gallery">
  <!-- Static images for SEO -->
  <noscript>
    <img each="image in images" src="{ image.url }" alt="{ image.alt }">
  </noscript>
  
  <!-- Interactive gallery -->
  <gallery :images="images"/>
</div>
```

## Common Island Patterns

### 1. Newsletter Signup

```html
<form @name="newsletter" @submit.prevent="submit">
  <input type="email" name="email" placeholder="Enter your email" required>
  <button>{ cta || 'Subscribe' }</button>
  
  <p if="success" class="success">Thanks for subscribing!</p>
  <p if="error" class="error">{ error }</p>
  
  <script>
    let success = false
    let error = null
    
    async function submit() {
      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          body: new FormData(this)
        })
        
        if (response.ok) {
          success = true
          this.reset()
        } else {
          error = 'Subscription failed'
        }
      } catch (e) {
        error = 'Network error'
      }
    }
  </script>
</form>
```

### 2. Dark Mode Toggle

```html
<button @name="theme-toggle" @click="toggleTheme">
  <span if="isDark">☀️ Light</span>
  <span else>🌙 Dark</span>
  
  <script>
    let isDark = localStorage.getItem('theme') === 'dark'
    
    function toggleTheme() {
      isDark = !isDark
      document.body.classList.toggle('dark', isDark)
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }
    
    // Apply saved theme on mount
    document.body.classList.toggle('dark', isDark)
  </script>
</button>
```

### 3. Tab Interface

```html
<div @name="tabs">
  <div class="tab-buttons">
    <button 
      each="tab in tabs" 
      @click="selectTab(tab)"
      class="{ active: activeTab === tab }">
      { tab.label }
    </button>
  </div>
  
  <div class="tab-content">
    <div each="tab in tabs" if="activeTab === tab">
      { tab.content }
    </div>
  </div>
  
  <script>
    let activeTab = tabs[0]
    
    function selectTab(tab) {
      activeTab = tab
    }
  </script>
</div>
```

### 4. Search Component

```html
<div @name="search">
  <input 
    type="search" 
    @input="search" 
    placeholder="Search..."
    debounce="300">
  
  <ul if="results.length">
    <li each="result in results">
      <a href="{ result.url }">{ result.title }</a>
    </li>
  </ul>
  
  <p if="searching">Searching...</p>
  <p if="noResults">No results found</p>
  
  <script>
    let results = []
    let searching = false
    let noResults = false
    
    async function search(e) {
      const query = e.target.value
      if (!query) {
        results = []
        return
      }
      
      searching = true
      noResults = false
      
      const response = await fetch(`/api/search?q=${query}`)
      results = await response.json()
      
      searching = false
      noResults = results.length === 0
    }
  </script>
</div>
```

### 5. Dynamic Content Loader

```html
<div @name="load-more">
  <div class="content">
    <slot/> <!-- Existing content -->
  </div>
  
  <button 
    @click="loadMore" 
    if="hasMore" 
    disabled="{ loading }">
    { loading ? 'Loading...' : 'Load More' }
  </button>
  
  <script>
    let hasMore = true
    let loading = false
    let page = 1
    
    async function loadMore() {
      loading = true
      page++
      
      const response = await fetch(`/api/content?page=${page}`)
      const html = await response.text()
      
      // Append new content
      document.querySelector('.content').insertAdjacentHTML('beforeend', html)
      
      loading = false
      
      // Check if more content available
      hasMore = response.headers.get('X-Has-More') === 'true'
    }
  </script>
</div>
```

## Importing External Libraries

Islands can import external modules:

```html
<div @name="chart">
  <script>
    import Chart from '/lib/chart.js'
    
    mounted() {
      new Chart(this.$el, {
        type: 'line',
        data: chartData
      })
    }
  </script>
</div>
```

Use import maps configured in `site.yaml`:

```yaml
import_map:
  chart: /lib/chart.js
  d3: /lib/d3.js
```

## Lifecycle Hooks

Islands support lifecycle methods:

```html
<div @name="my-component">
  <script>
    // Called when island is mounted
    mounted() {
      console.log('Island mounted')
    }
    
    // Called when island is removed
    destroyed() {
      console.log('Island destroyed')
    }
  </script>
</div>
```

## State Management

Islands maintain their own state:

```html
<div @name="counter">
  <button @click="decrement">-</button>
  <span>{ count }</span>
  <button @click="increment">+</button>
  
  <script>
    let count = 0
    
    function increment() {
      count++
    }
    
    function decrement() {
      count--
    }
  </script>
</div>
```

## Best Practices

### 1. Keep Islands Small

Focus on single responsibility:

```html
<!-- ✅ Good: Single purpose -->
<form @name="email-signup">
  <!-- Only handles email signup -->
</form>

<!-- ❌ Bad: Multiple responsibilities -->
<form @name="user-management">
  <!-- Handles signup, login, profile update -->
</form>
```

### 2. Progressive Enhancement

Ensure basic functionality without JavaScript:

```html
<div @name="enhanced-form">
  <!-- Works without JS -->
  <form action="/api/submit" method="POST">
    <input type="email" name="email">
    <button type="submit">Submit</button>
  </form>
  
  <!-- Enhanced with JS -->
  <script>
    // Override form submission for better UX
    this.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault()
      // Handle with fetch
    })
  </script>
</div>
```

### 3. Use Semantic HTML

Improve accessibility and SEO:

```html
<!-- ✅ Good: Semantic -->
<nav @name="main-nav">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<!-- ❌ Bad: Non-semantic -->
<div @name="main-nav">
  <div onclick="navigate('/')">Home</div>
</div>
```

### 4. Organize by Feature

Group related islands:

```
blog/
  ├── islands.dhtml         # Blog-specific islands
  │   ├── comment-form
  │   ├── share-button
  │   └── related-posts
  └── post/
      └── islands.dhtml     # Post-specific islands
          └── reading-progress
```

### 5. Error Handling

Handle errors gracefully:

```html
<form @name="contact">
  <script>
    async function submit() {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          body: new FormData(this)
        })
        
        if (!response.ok) {
          throw new Error('Submission failed')
        }
        
        // Success handling
      } catch (error) {
        // Show user-friendly error
        this.querySelector('.error').textContent = 
          'Unable to submit. Please try again.'
      }
    }
  </script>
</form>
```

## Debugging Islands

### Console Logging

```html
<div @name="debug-example">
  <script>
    let data = { foo: 'bar' }
    
    mounted() {
      console.log('Island data:', data)
      console.log('DOM element:', this.$el)
    }
  </script>
</div>
```

### Browser DevTools

Islands appear in DevTools as custom elements:

```html
<nue-island name="my-component">
  <!-- Island content -->
</nue-island>
```

Inspect them like any other DOM element.

## Performance Considerations

### 1. Minimize JavaScript

Only include necessary logic:

```html
<!-- ✅ Good: Minimal JS -->
<form @name="simple-form" @submit.prevent="submit">
  <script>
    function submit() {
      fetch('/api/submit', { method: 'POST', body: new FormData(this) })
    }
  </script>
</form>

<!-- ❌ Bad: Heavy libraries -->
<form @name="heavy-form">
  <script src="/lib/huge-library.js"></script>
</form>
```

### 2. Lazy Load Islands

Load islands only when needed:

```html
<div @name="lazy-component">
  <button @click="load">Show Component</button>
  <div if="loaded">
    <!-- Load heavy content on demand -->
  </div>
  
  <script>
    let loaded = false
    
    function load() {
      loaded = true
    }
  </script>
</div>
```

### 3. Debounce Expensive Operations

Prevent excessive API calls:

```html
<input @input="search" debounce="300">

<script>
  async function search(e) {
    // Only runs 300ms after user stops typing
  }
</script>
```

## Summary

Interactive islands provide:
- **Progressive enhancement**: Static first, dynamic second
- **SEO-friendly**: Server-rendered by default
- **Lightweight**: Minimal runtime (2.5kb)
- **Flexible**: Use anywhere in content or layouts
- **Isolated**: Self-contained components
- **Isomorphic**: Can render on server and client

Use islands to add interactivity where needed while maintaining the benefits of static content.