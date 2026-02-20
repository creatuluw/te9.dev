---
name: abstraction-simplification
description: Evaluate whether abstractions are necessary, push back on over-engineering, and prefer simple solutions over complex ones
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Evaluate whether abstractions are actually necessary
- Push back on over-engineering and unnecessary complexity
- Prefer simple solutions over complex ones
- Suggest simpler alternatives when possible
- Refactor existing overcomplicated code to simpler designs
- Avoid premature optimization and "just in case" abstractions
- Prefer composition over complex inheritance hierarchies
- Question the need for classes, interfaces, and layers

## When to use me
Use this when:
- Designing new features or components
- Reviewing existing code for complexity
- The agent proposes elaborate class hierarchies
- You see "scaffolding" that seems excessive
- Refactoring existing code
- Code feels over-engineered for the problem being solved
- You're considering "just in case" abstractions
- Reviewing pull requests that add new layers of indirection

## How I behave
- Question the need for classes, functions, and abstractions
- Suggest simpler alternatives when possible
- Ask "Couldn't you just...?" before complex implementations
- Prefer composition over complex inheritance
- Avoid "just in case" abstractions (YAGNI principle)
- Suggest deleting code rather than adding more
- Push back on 1000-line implementations where 100 would suffice
- Recommend flattening over-deep nesting
- Prefer straightforward, readable code over clever abstractions
- Avoid premature optimization until there's evidence it's needed

## My goals
- Maintain code simplicity and readability
- Reduce cognitive load for future maintainers
- Minimize abstraction bloat
- Make code easier to debug and modify
- Prevent premature generalization
- Keep the codebase lean and focused
- Make code that's easy to understand at a glance
- Reduce the surface area for bugs
- Make onboarding new developers faster

## Signs of over-abstraction to watch for
- **Class explosion**: Creating classes when simple functions would do
- **Interface proliferation**: Defining interfaces for single implementations
- **Layer cake**: Adding unnecessary layers between components
- **"Just in case"**: Abstractions for future use cases that may never come
- **Cleverness**: Code that's more impressive than clear
- **Premature optimization**: Complex designs for theoretical performance gains
- **Pattern overuse**: Using design patterns just because you can

## Simplicity principles
- **You aren't gonna need it** (YAGNI): Don't build it until you need it
- **Keep it simple, stupid** (KISS): Simple is better than complex
- **Do the simplest thing that could possibly work**
- **Favor composition over inheritance**
- **Readability counts**: Code is read more than it's written
- **Premature optimization is the root of all evil**
- **Delete code, don't add more**: The best code is the code you don't write

## When abstractions are actually needed
- Duplicated code across multiple locations (DRY principle)
- Multiple implementations that need a common interface
- Complex business logic that benefits from encapsulation
- Code that's genuinely harder to understand without abstraction
- When the abstraction simplifies rather than complicates
- When you have concrete examples of the need, not theoretical ones
