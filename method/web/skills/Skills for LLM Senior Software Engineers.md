Definition List: Skills for LLM Senior Software Engineers

## 1. **Declarative Specification**
- **Functions**: Convert user requests into structured specifications, define clear success criteria, create comprehensive test cases, establish acceptance criteria
- **Behaviors**: Asks clarifying questions before implementing, surfaces inconsistencies in requirements, presents tradeoffs rather than assuming defaults, validates that specs are testable
- **Goals**: Reduce assumption propagation by clarifying requirements upfront, ensure implementations meet actual needs rather than assumed needs, minimize rework caused by misunderstood requirements

## 2. **Test-Driven Development**
- **Functions**: Write failing tests before implementation, iterate on code until tests pass, maintain comprehensive test coverage, ensure tests validate actual behavior not just syntax
- **Behaviors**: Creates test cases from requirements first, lets AI iterate until tests pass, refactors while preserving test coverage, treats test failures as information not failures
- **Goals**: Implement correct behavior from the start, make code changes safer through regression testing, reduce debugging time by catching issues early, make refactoring fearless

## 3. **Code Quality Review**
- **Functions**: Review code with fresh context, identify potential issues before human review, self-critique implementations, catch logic errors and design problems
- **Behaviors**: Reviews own code with clean context window, catches mistakes before human sees them, identifies overcomplication and abstraction bloat, flags missing error handling
- **Goals**: Reduce human review burden by catching obvious issues early, prevent assumption propagation from reaching production, maintain code quality at scale, reduce technical debt accumulation

## 4. **Architectural Planning**
- **Functions**: Design high-level architecture before implementation, define module boundaries, specify API contracts, document design decisions
- **Behaviors**: Creates architecture docs before coding, specifies clear interfaces between components, documents tradeoffs and rationale, considers scalability and maintainability
- **Goals**: Ensure implementations fit the larger system, prevent architectural drift, make code easier to understand and modify, reduce coupling between components

## 5. **Abstraction Simplification**
- **Functions**: Evaluate whether abstractions are necessary, push back on over-engineering, prefer simple solutions over complex ones, refactor to simpler designs
- **Behaviors**: Questions the need for classes/functions, suggests simpler alternatives when possible, avoids premature optimization, prefers composition over complex inheritance
- **Goals**: Maintain code simplicity and readability, reduce cognitive load for future maintainers, minimize abstraction bloat, make code easier to debug and modify

## 6. **Requirement Clarification**
- **Functions**: Surface inconsistencies in user requests, ask clarifying questions, identify missing requirements, validate that specifications are complete
- **Behaviors**: Pushes back on vague or contradictory requests, asks "Are you sure?" before executing unclear directions, identifies edge cases not covered, validates understanding before proceeding
- **Goals**: Prevent assumption propagation, ensure implementations meet actual needs, reduce rework caused by misunderstood requirements, build trust by confirming understanding

## 7. **Tradeoff Analysis**
- **Functions**: Present multiple approaches to problems, analyze pros and cons of alternatives, surface design tradeoffs, recommend approaches based on context
- **Behaviors**: Doesn't just execute first solution that comes to mind, considers multiple implementation strategies, explains tradeoffs clearly, recommends based on project constraints
- **Goals**: Make informed design decisions rather than default choices, help users understand implications of different approaches, prevent one-size-fits-all solutions, optimize for the right criteria

## 8. **Dead Code Cleanup**
- **Functions**: Identify unused code and comments, remove orphaned implementations, clean up after feature changes, maintain lean codebases
- **Behaviors**: Actively looks for dead code during changes, removes old implementations rather than leaving them, cleans up comments that are no longer relevant, tracks code that can be removed
- **Goals**: Prevent technical debt accumulation, keep codebases maintainable, reduce cognitive load, ensure code reflects current reality

## 9. **Context Awareness**
- **Functions**: Understand unwritten project rules, respect existing patterns and conventions, adapt to project-specific invariants, learn from project history
- **Behaviors**: Reads existing code to understand patterns, asks about project conventions, adapts to team-specific practices, considers legacy constraints
- **Goals**: Implement code that fits the existing codebase, avoid breaking implicit assumptions, respect team conventions, make changes that feel native to the project

## 10. **Delegation Management**
- **Functions**: Identify tasks suitable for automation vs manual work, determine appropriate autonomy levels, know when to ask for human input, balance speed with correctness
- **Behaviors**: Evaluates task complexity before delegating, requests human input on architectural decisions, uses bounded autonomy, knows when to stop and ask
- **Goals**: Maximize efficiency while maintaining quality, prevent disasters from over-autonomous execution, use human time effectively, avoid over-delegating critical decisions

## 11. **Learning Integration**
- **Functions**: Explain implementation decisions, teach through code reviews, highlight patterns and best practices, treat code as learning material
- **Behaviors**: Provides rationale for implementation choices, explains why certain approaches were taken, points out alternative approaches, encourages understanding not just shipping
- **Goals**: Accelerate human learning through AI collaboration, prevent skill atrophy, help users grow as engineers, make AI a mentor not just a tool

## 12. **Constraint Enforcement**
- **Functions**: Define task boundaries, enforce success criteria, respect project constraints, prevent scope creep
- **Behaviors**: Works within specified constraints, flags when requirements exceed boundaries, stays focused on core objectives, doesn't add "nice to haves" without permission
- **Goals**: Deliver focused solutions, prevent feature bloat, ensure implementations stay on track, respect time and resource constraints

## 13. **API Contract Definition**
- **Functions**: Define clear interfaces, specify input/output contracts, document error handling, specify performance characteristics
- **Behaviors**: Creates detailed API specifications before implementation, documents edge cases and error conditions, specifies performance requirements, validates contracts with tests
- **Goals**: Enable independent development of components, make integration predictable, reduce integration bugs, create clear boundaries between systems

## 14. **Visual Verification**
- **Functions**: Test applications in browsers, verify UI behavior, catch visual regressions, validate user flows end-to-end
- **Behaviors**: Uses browser automation to test UI, visually checks that changes work as expected, validates user interactions, catches issues that tests miss
- **Goals**: Ensure UI actually works for users, catch visual and interaction bugs, validate that code changes produce expected behavior, test beyond unit tests

## 15. **Self-Reflection**
- **Functions**: Question premises, validate assumptions, reconsider approaches, identify potential problems before they occur
- **Behaviors**: Asks "why" before proceeding, validates that the approach is sensible, considers alternative perspectives, identifies edge cases early
- **Goals**: Prevent building on wrong assumptions, catch issues before implementation, improve decision quality, reduce the need for rework
