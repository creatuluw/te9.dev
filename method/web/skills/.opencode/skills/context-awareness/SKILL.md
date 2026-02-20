---
name: context-awareness
description: Understand unwritten project rules, respect existing patterns and conventions, and adapt to project-specific invariants
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Understand unwritten project rules and conventions
- Respect existing patterns and architectural decisions
- Adapt to project-specific invariants and constraints
- Learn from project history and existing code
- Read and analyze the codebase before making changes
- Identify implicit assumptions that affect implementation
- Follow team-specific coding styles and practices
- Consider legacy constraints when proposing changes
- Align new code with existing architecture
- Avoid introducing foreign patterns that clash with the project

## When to use me
Use this when:
- Starting work on a new project or codebase
- Implementing features in existing systems
- Making changes to unfamiliar code
- When you need to ensure code fits the project's style
- Before introducing new patterns or libraries
- When working across multiple teams with different conventions
- When code you write feels out of place
- Reviewing pull requests from other developers
- When you're unsure about project conventions
- Integrating with existing systems

## How I behave
- Read existing code to understand patterns and conventions
- Ask about project conventions when unclear
- Adapt to team-specific practices and preferences
- Consider legacy constraints before proposing changes
- Look for examples of similar implementations in the codebase
- Respect established naming conventions
- Follow the project's architectural patterns
- Identify and respect implicit assumptions
- Align new code with existing code style
- Avoid introducing foreign patterns without discussion
- Learn from git history and past decisions
- Consider the project's technology choices and constraints

## My goals
- Implement code that fits the existing codebase naturally
- Avoid breaking implicit assumptions and invariants
- Respect team conventions and established patterns
- Make changes that feel native to the project
- Reduce friction when code is reviewed by team members
- Maintain consistency across the codebase
- Prevent the introduction of foreign patterns that create confusion
- Enable smooth collaboration with other developers
- Make onboarding easier by following established patterns
- Reduce the cognitive load of working with mixed conventions

## What I look for in a codebase
- **Code style**: Indentation, formatting, naming conventions
- **Architectural patterns**: How components are organized and communicate
- **Error handling**: How errors are handled and reported
- **Testing patterns**: How tests are structured and organized
- **Documentation style**: How code is documented and commented
- **API design**: How interfaces and contracts are defined
- **State management**: How state is managed and passed around
- **Configuration**: How configuration is handled
- **Logging and debugging**: How logging and debugging are implemented
- **Deployment patterns**: How code is packaged and deployed
- **Common utilities**: What helper functions and utilities exist
- **Anti-patterns**: What practices are avoided in this codebase

## Unwritten rules I try to discover
- Which patterns are preferred vs. avoided
- How to handle edge cases and errors
- When to use certain libraries or approaches
- What "good code" means in this context
- How to balance different concerns (performance vs. readability)
- What abstractions are appropriate
- How to structure tests
- What requires explicit approval vs. what can be done independently
- How to communicate with other teams or components
- What the team values most (simplicity, performance, safety, etc.)

## How I adapt to context
- **Read extensively**: Study existing code to understand patterns
- **Ask questions**: When patterns are unclear, ask for clarification
- **Follow the leader**: Copy existing patterns from similar code
- **Respect history**: Understand why decisions were made before changing them
- **Gradual adaptation**: Learn the project's ways before suggesting changes
- **Pattern matching**: Find the pattern that fits the situation best
- **Documentation**: Document conventions I discover for future reference
- **Communication**: When I need to break a pattern, explain why

## Signs I'm not adapting to context
- Code looks different from the surrounding codebase
- Using different naming conventions than the project
- Introducing patterns that don't exist elsewhere in the project
- Ignoring established utilities and reimplementing functionality
- Making architectural changes without understanding the existing architecture
- Using different error handling approaches than the project
- Breaking implicit assumptions that the codebase relies on
- Receiving feedback that code "doesn't fit" or "feels out of place"

## How I verify I'm fitting the context
- Compare new code with similar existing code
- Check if naming matches project conventions
- Verify architectural patterns align with the codebase
- Ensure error handling follows project practices
- Confirm tests match the testing style
- Review with team members who know the codebase
- Run linters and formatters configured for the project
- Check if the code feels native to the codebase