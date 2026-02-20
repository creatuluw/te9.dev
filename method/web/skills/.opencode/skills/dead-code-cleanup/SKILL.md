---
name: dead-code-cleanup
description: Identify unused code and comments, remove orphaned implementations, clean up after feature changes, and maintain lean codebases
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Identify unused code, functions, and variables
- Remove orphaned implementations after feature changes
- Clean up comments that contradict current code
- Remove unused imports and dependencies
- Delete deprecated or commented-out code
- Track code that can be safely removed
- Maintain clean, lean codebases
- Find and remove dead branches and unreachable code
- Clean up test files for deleted features
- Remove configuration for unused features

## When to use me
Use this when:
- Completing a feature implementation
- Refactoring existing code
- Deleting or replacing functionality
- After a major codebase change
- During regular maintenance cycles
- Before a release
- When code coverage drops due to dead code
- When code comments contradict implementation
- After removing a feature or component
- When you notice commented-out code accumulating

## How I behave
- Actively look for dead code during changes
- Remove old implementations rather than leaving them
- Clean up comments that are no longer relevant
- Track code that can be removed
- Use tools to identify unused code (linters, static analysis)
- Verify code is truly unused before removing it
- Check for references across the entire codebase
- Remove related tests and documentation
- Update imports and dependencies
- Commit cleanup separately from functional changes when possible
- Be cautious with code that might be used dynamically or via reflection

## My goals
- Prevent technical debt accumulation
- Keep codebases maintainable and lean
- Reduce cognitive load for developers
- Ensure code reflects current reality
- Make the codebase easier to understand
- Remove potential confusion from old implementations
- Reduce bundle sizes and improve performance
- Make onboarding faster by reducing code volume
- Ensure tests cover actual functionality, not dead code

## Types of dead code I identify
- **Unused functions and methods**: Functions that are never called
- **Unused variables and constants**: Defined but never referenced
- **Orphaned imports**: Imports for modules that are no longer used
- **Commented-out code**: Old implementations left in comments
- **Dead branches**: Code that can never be reached
- **Unreachable code**: Code after return, throw, or continue statements
- **Unused parameters**: Function parameters that are never read
- **Unused classes and interfaces**: Definitions with no references
- **Obsolete comments**: Documentation that contradicts current code
- **Stale configuration**: Settings for features that no longer exist

## How I identify dead code
- **Static analysis**: Use linters and tools to find unused code
- **Code coverage**: Check which code is never executed in tests
- **Reference checking**: Search for all references to verify usage
- **Import analysis**: Identify imports that can be removed
- **Pattern matching**: Look for common dead code patterns
- **Human review**: Ask developers about code that seems unused
- **Dynamic analysis**: Run the application and track what's actually used
- **Dependency analysis**: Check which packages and modules are imported

## Safety measures before removal
- Search for all references across the codebase
- Check for string-based references (dynamic calls, reflection)
- Verify tests pass after removal
- Check for public API usage (documentation, external consumers)
- Consider backward compatibility if it's a library
- Look for configuration that might enable the code
- Check for feature flags or conditional compilation
- Review git history for context on why code exists

## Cleanup best practices
- **Separate commits**: Keep cleanup separate from functional changes when possible
- **Test first**: Ensure tests cover the functionality before removing code
- **Gradual removal**: Remove small batches at a time to minimize risk
- **Document**: Explain why code is being removed in commit messages
- **Review carefully**: Have team members review cleanup changes
- **Monitor**: Watch for breakage after cleanup is deployed
- **Tooling**: Use automated tools to catch new dead code continuously

## When NOT to remove code
- Code that's part of a public API (even if unused internally)
- Code that might be used by plugins or extensions
- Code that's conditionally compiled or feature-flagged
- Code that's referenced in configuration files
- Code that has external dependencies we can't verify
- Code during a large refactoring where cleanup might be premature
- Code with unclear history when you're unsure of its purpose
- Code that's temporarily disabled but will be re-enabled soon