---
title: NPM Package Management
date: 2025-02-14
description: Master npm with these essential commands, scripts, and best practices for managing JavaScript dependencies.
---

# NPM Package Management

NPM is the backbone of JavaScript development. Understanding it deeply will save you countless hours of dependency hell. Here's what every developer should know.

## Install with Intention

Different install commands serve different purposes:

```bash
# Production dependency
npm install lodash

# Development dependency
npm install --save-dev jest

# Global tool
npm install --global typescript

# Exact version
npm install lodash --save-exact
```

Keep `node_modules` lean by using `--save-dev` appropriately.

## Semantic Versioning

Version numbers have meaning:

```
1.2.3
│ │ │
│ │ └── Patch: Bug fixes
│ └───── Minor: New features
└──────── Major: Breaking changes
```

Control updates in `package.json`:

```json
{
  "dependencies": {
    "lodash": "4.17.21",     // Exact version
    "express": "^4.18.0",    // Compatible (4.x.x)
    "react": "~18.2.0"       // Approximately (18.2.x)
  }
}
```

## Useful Scripts

Automate common tasks:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "jest",
    "lint": "eslint src/",
    "format": "prettier --write .",
    "clean": "rm -rf node_modules && npm install"
  }
}
```

Run with `npm run <script>` or `npm <script>` for built-in commands.

## Audit Dependencies

Check for vulnerabilities:

```bash
# Check for issues
npm audit

# Fix automatically
npm audit fix

# See what would change
npm audit fix --dry-run
```

Run audits regularly in your CI pipeline.

## Outdated Packages

Stay current:

```bash
# Check for updates
npm outdated

# Update all to latest
npm update

# Update specific package
npm install lodash@latest
```

## Lock Files Matter

Never delete `package-lock.json`. It ensures:
- Consistent installs across machines
- Exact dependency versions
- Faster npm install

Commit it to version control.

## npx for One-offs

Run packages without installing:

```bash
# Create new project
npx create-react-app myapp

# Run tools
npx prettier --write .

# Use different versions
npx node@16 script.js
```

## Keep It Healthy

- Review dependencies regularly
- Remove unused packages
- Prefer well-maintained packages
- Check bundle size impact
- Lock critical versions

A clean `package.json` is a sign of a healthy project.