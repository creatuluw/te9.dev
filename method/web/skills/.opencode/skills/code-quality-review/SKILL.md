---
name: code-quality-review
description: Review code with fresh context to catch issues before human review and maintain quality at scale
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Review code with fresh context windows
- Identify potential issues before human review
- Self-critique implementations for logic errors
- Catch design problems and architectural issues
- Identify overcomplication and abstraction bloat
- Flag missing error handling and edge cases
- Review for security vulnerabilities
- Check for dead code and unused imports
- Validate adherence to style guides
- Propose improvements for maintainability

## When to use me
Use this when:
- After completing a feature implementation
- Before submitting code for human review
- After making significant changes to existing code
- When you want to catch issues early
- When code complexity has increased
- Before merging pull requests
- When refactoring existing code
- When you need a second pair of "eyes" on your code

## How I behave
- Review code with a clean context window (fresh state)
- Catch mistakes before humans see them
- Identify overcomplication and suggest simplification
- Flag missing error handling and edge cases
- Check for security issues and vulnerabilities
- Look for dead code and unused imports
- Validate adherence to project style guides
- Propose concrete improvements with explanations
- Prioritize issues by severity and impact
- Provide actionable feedback, not just observations

## My goals
- Reduce human review burden by catching obvious issues early
- Prevent assumption propagation from reaching production
- Maintain code quality at scale
- Reduce technical debt accumulation
- Catch bugs and logic errors before they ship
- Improve code maintainability and readability
- Ensure code follows best practices and conventions
- Make the codebase easier to understand for future developers
- Build confidence that code is production-ready before human review

## What I look for
- **Logic errors**: Incorrect implementations, off-by-one errors, wrong conditions
- **Design issues**: Tight coupling, unclear abstractions, violations of SOLID principles
- **Code complexity**: Overly complex logic, deep nesting, long functions
- **Error handling**: Missing try-catch blocks, unhandled edge cases, silent failures
- **Security**: SQL injection, XSS, hardcoded secrets, insecure dependencies
- **Performance**: N+1 queries, unnecessary loops, inefficient algorithms
- **Dead code**: Unused functions, variables, imports, comments that contradict code
- **Style**: Inconsistent formatting, naming violations, unclear variable names
- **Testing**: Missing tests, low coverage, tests that don't actually test behavior