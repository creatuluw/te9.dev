---
name: developer-skills
description: Orchestrate the use of development skills based on context, specifications, tasks, architecture, and reasoning
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Analyze the current context to determine which skills are relevant
- Evaluate specifications, tasks, and architecture to guide skill selection
- Use reasoning to match appropriate skills to different situations
- Orchestrate the use of multiple skills in sequence or parallel
- Prevent skill conflicts and redundant work
- Provide guidance on skill dependencies and prerequisites
- Help sequence skills for optimal effectiveness
- Adapt skill usage based on changing context
- Balance between different skill areas (quality, speed, learning)
- Recommend skill combinations for complex scenarios

## When to use me
Use this when:
- Starting any development task or feature
- You're unsure which skills apply to the current situation
- Multiple skills might be relevant and you need to prioritize
- You're working through a complex multi-step process
- Context changes and you need to adjust your approach
- You need to coordinate between different skill areas
- You're building something new vs. maintaining existing code
- You need to balance competing priorities (speed, quality, learning)
- Tasks involve architectural decisions or design choices
- You need to understand the full skill landscape available

## How I behave
- Analyze the current context and identify what type of work is being done
- Map the context to relevant skills from the skill inventory
- Prioritize skills based on immediate needs and long-term goals
- Consider dependencies between skills (some skills need others first)
- Sequence skills logically (e.g., specification before implementation)
- Adapt recommendations based on project stage (new vs. existing)
- Consider team maturity and experience level
- Balance different skill areas appropriately
- Provide clear guidance on which skills to use and when
- Flag when multiple skills apply and help choose among them
- Recommend skill combinations for comprehensive coverage

## My goals
- Help LLMs use the right skills for the right situations
- Ensure all relevant skills are considered for each task
- Prevent skill conflicts and redundant work
- Optimize the sequence of skill application
- Adapt skill usage to changing context
- Balance competing priorities effectively
- Build understanding of when different skills apply
- Create a systematic approach to skill selection
- Improve outcomes through better skill orchestration
- Make skill selection a conscious, reasoned process

## Skill Inventory

### Planning and Specification Skills
- **declarative-specification**: Convert user requests into structured specifications with clear success criteria
  - *Use when*: Starting new features, requirements seem vague, need clear testable specs
  - *Prerequisites*: None
  - *Followed by*: test-driven-development, architectural-planning, requirement-clarification

- **requirement-clarification**: Surface inconsistencies in user requests, ask clarifying questions, validate specs are complete
  - *Use when*: Requirements are vague or incomplete, contradictions exist, edge cases unclear
  - *Prerequisites*: None
  - *Often used with*: declarative-specification
  - *Followed by*: declarative-specification, architectural-planning

- **architectural-planning**: Design high-level architecture before implementation, define module boundaries and API contracts
  - *Use when*: Starting new features, designing complex systems, refactoring architecture
  - *Prerequisites*: requirement-clarification, declarative-specification
  - *Often used with*: api-contract-definition, context-awareness
  - *Followed by*: implementation skills (TDD, etc.)

- **api-contract-definition**: Define clear interfaces, specify input/output contracts, document error handling
  - *Use when*: Designing APIs, integrating services, defining frontend-backend contracts
  - *Prerequisites*: architectural-planning, requirement-clarification
  - *Often used with*: architectural-planning, test-driven-development
  - *Followed by*: implementation skills

### Implementation Skills
- **test-driven-development**: Write tests before implementation and iterate until tests pass
  - *Use when*: Implementing new features, fixing bugs, refactoring, adding functionality
  - *Prerequisites*: declarative-specification, requirement-clarification
  - *Often used with*: code-quality-review, visual-verification
  - *Followed by*: code-quality-review, dead-code-cleanup

- **constraint-enforcement**: Define task boundaries, enforce success criteria, respect project constraints, prevent scope creep
  - *Use when*: Requirements start expanding, time/budget constraints exist, scope creep observed
  - *Prerequisites*: declarative-specification, requirement-clarification
  - *Often used with*: delegation-management, tradeoff-analysis
  - *Used throughout*: Implementation to maintain focus

- **self-reflection**: Question premises, validate assumptions, reconsider approaches, identify potential problems before they occur
  - *Use when*: Starting tasks, requirements seem off, high stakes, unfamiliar territory
  - *Prerequisites*: None
  - *Used throughout*: All stages of development
  - *Often used with*: All skills - applied as a meta-skill

### Quality and Review Skills
- **code-quality-review**: Review code with fresh context to catch issues before human review and maintain quality at scale
  - *Use when*: After completing features, before PR submission, refactoring existing code
  - *Prerequisites*: test-driven-development or any implementation skill
  - *Often used with*: dead-code-cleanup, abstraction-simplification
  - *Followed by*: revisions based on review findings

- **abstraction-simplification**: Evaluate whether abstractions are necessary, push back on over-engineering, prefer simple solutions
  - *Use when*: Over-engineering observed, code seems too complex for the problem, refactoring
  - *Prerequisites*: code-quality-review, architectural-planning
  - *Often used with*: code-quality-review, context-awareness
  - *Used during*: Implementation and review

- **dead-code-cleanup**: Identify unused code and comments, remove orphaned implementations, clean up after feature changes
  - *Use when*: Completing features, refactoring, removing functionality, during maintenance
  - *Prerequisites*: code-quality-review, test-driven-development
  - *Often used with*: code-quality-review, abstraction-simplification
  - *Used as*: Maintenance activity

### Context and Adaptation Skills
- **context-awareness**: Understand unwritten project rules, respect existing patterns and conventions, adapt to project-specific invariants
  - *Use when*: Working on new projects, integrating with existing code, reviewing unfamiliar code
  - *Prerequisites*: None
  - *Used throughout*: All stages of development
  - *Often used with*: All skills - applied as a foundational skill

- **tradeoff-analysis**: Present multiple approaches to problems, analyze pros and cons, recommend based on context
  - *Use when*: Multiple approaches possible, architectural decisions, performance vs. simplicity tradeoffs
  - *Prerequisites*: requirement-clarification, context-awareness
  - *Often used with*: architectural-planning, constraint-enforcement
  - *Used during*: Planning and design stages

### Delegation and Learning Skills
- **delegation-management**: Identify tasks suitable for automation vs manual work, determine appropriate autonomy levels
  - *Use when*: Deciding what to implement manually vs with AI, setting up workflows, managing AI assistance
  - *Prerequisites*: context-awareness, self-reflection
  - *Often used with*: constraint-enforcement, tradeoff-analysis
  - *Used as*: Ongoing meta-skill

- **learning-integration**: Explain implementation decisions, teach through code reviews, highlight patterns and best practices
  - *Use when*: Reviewing code, implementing new patterns, teaching, when user wants to understand
  - *Prerequisites*: code-quality-review, implementation skills
  - *Often used with*: code-quality-review, self-reflection
  - *Used throughout*: As a meta-skill to build understanding

- **visual-verification**: Test applications in browsers, verify UI behavior, catch visual regressions, validate user flows
  - *Use when*: Making UI changes, refactoring CSS, testing responsive design, validating user interactions
  - *Prerequisites*: test-driven-development, implementation skills
  - *Often used with*: test-driven-development, code-quality-review
  - *Used as*: Complement to automated tests

## Context-Based Skill Selection

### New Feature Development
When starting a new feature:
1. **self-reflection** - Question if this feature is the right approach
2. **requirement-clarification** - Clarify requirements and identify gaps
3. **declarative-specification** - Create clear, testable specifications
4. **architectural-planning** - Design how this fits into the architecture
5. **api-contract-definition** - Define interfaces if needed
6. **tradeoff-analysis** - Analyze implementation approaches
7. **test-driven-development** - Write tests first
8. **implementation** - Implement the feature
9. **code-quality-review** - Review the implementation
10. **visual-verification** - Verify UI behavior (if applicable)
11. **learning-integration** - Explain decisions and teach

### Bug Fixes
When fixing a bug:
1. **self-reflection** - Understand the root cause
2. **context-awareness** - Understand the existing code and patterns
3. **test-driven-development** - Write a failing test that reproduces the bug
4. **implementation** - Fix the bug
5. **code-quality-review** - Review the fix
6. **test-driven-development** - Verify all tests pass

### Refactoring
When refactoring existing code:
1. **context-awareness** - Understand existing patterns and conventions
2. **self-reflection** - Question if refactoring is the right approach
3. **code-quality-review** - Identify areas for improvement
4. **abstraction-simplification** - Simplify over-engineered code
5. **dead-code-cleanup** - Remove unused code
6. **test-driven-development** - Maintain test coverage throughout
7. **code-quality-review** - Review the refactored code

### API Development
When developing APIs:
1. **requirement-clarification** - Clarify API requirements
2. **declarative-specification** - Specify the API contract
3. **api-contract-definition** - Define detailed API specifications
4. **architectural-planning** - Design how the API fits into the system
5. **test-driven-development** - Write tests for the API
6. **implementation** - Implement the API
7. **code-quality-review** - Review the implementation
8. **visual-verification** - Test the API via browser/tools

### UI Development
When developing UI:
1. **requirement-clarification** - Clarify UI requirements and behaviors
2. **declarative-specification** - Specify UI behavior and acceptance criteria
3. **test-driven-development** - Write tests for UI logic
4. **implementation** - Implement the UI
5. **code-quality-review** - Review the implementation
6. **visual-verification** - Verify UI behavior and responsiveness

### Legacy Code Maintenance
When maintaining legacy code:
1. **context-awareness** - Understand existing patterns and invariants
2. **self-reflection** - Question if changes are necessary
3. **requirement-clarification** - Clarify requirements in the context of legacy code
4. **tradeoff-analysis** - Analyze approaches considering legacy constraints
5. **code-quality-review** - Review changes carefully
6. **test-driven-development** - Add tests to prevent regressions
7. **implementation** - Make minimal changes
8. **code-quality-review** - Review again carefully

### Emergency Hotfixes
When doing emergency hotfixes:
1. **self-reflection** - Assess urgency and risks
2. **context-awareness** - Understand the codebase quickly
3. **minimal change** - Make the smallest possible fix
4. **test-driven-development** - Add a test if time permits
5. **code-quality-review** - Quick review of the fix
6. **create follow-up tasks** - Plan for proper fix later

## Skill Dependency Graph

### Foundational Skills (no prerequisites)
- self-reflection
- context-awareness
- requirement-clarification

### Planning Phase Skills (depend on foundational)
- declarative-specification (after requirement-clarification)
- architectural-planning (after requirement-clarification, declarative-specification)
- tradeoff-analysis (after requirement-clarification, context-awareness)
- api-contract-definition (after architectural-planning)

### Implementation Phase Skills (depend on planning)
- test-driven-development (after declarative-specification, requirement-clarification)
- constraint-enforcement (after declarative-specification, requirement-clarification)
- delegation-management (after context-awareness, self-reflection)
- visual-verification (after test-driven-development)

### Review and Improvement Skills (depend on implementation)
- code-quality-review (after test-driven-development or any implementation)
- abstraction-simplification (after code-quality-review, architectural-planning)
- dead-code-cleanup (after code-quality-review, test-driven-development)

### Meta Skills (used throughout)
- self-reflection
- context-awareness
- delegation-management
- learning-integration

## Skill Conflict Resolution

### When multiple skills apply:
1. **Prioritize by phase**: Use skills in logical order (planning → implementation → review)
2. **Consider dependencies**: Some skills require others to complete first
3. **Balance competing needs**: E.g., speed vs. quality, simplicity vs. completeness
4. **Apply iteratively**: Skills can be applied in cycles, not just once
5. **Use as needed**: Not all skills are required for every task

### Conflicts to avoid:
- **Over-analysis**: Don't spend too much time on planning skills when quick action is needed
- **Under-specification**: Don't skip declarative-specification when requirements are complex
- **Over-simplification**: Don't apply abstraction-simplification when complexity is justified
- **Scope creep**: Don't let requirement-clarification expand the scope indefinitely
- **Review bottleneck**: Don't over-apply code-quality-review to the point of slowing progress

## Decision-Making Framework

### Step 1: Analyze Context
- What type of work is being done? (new feature, bug fix, refactoring, maintenance, emergency)
- What's the project state? (new project, existing codebase, legacy system)
- What are the constraints? (time, budget, quality, complexity)
- What's the team experience level? (junior, senior, mixed)
- What are the stakes? (high, medium, low)

### Step 2: Identify Candidate Skills
- Map context to relevant skills using the inventory
- Identify all skills that could apply to the situation
- Consider both phase-appropriate and cross-cutting skills
- Note meta skills that should always be considered

### Step 3: Prioritize Skills
- Order skills by logical dependencies
- Prioritize skills based on context needs (e.g., planning skills for new features)
- Consider time constraints (skip optional skills when rushed)
- Balance skill areas (don't over-index on one area)

### Step 4: Execute Skills
- Apply skills in the prioritized order
- Iterate as needed (go back and re-apply skills based on new information)
- Monitor for skill conflicts or redundancy
- Adapt to changing context

### Step 5: Reflect and Adjust
- **self-reflection**: Did I use the right skills? Would different skills have been better?
- **learning-integration**: What did I learn about skill selection?
- Adjust future skill selection based on this experience

## Skill Selection Heuristics

### Always apply these skills (meta-skills):
- **self-reflection**: Before starting any work
- **context-awareness**: Throughout all work
- **delegation-management**: When deciding what to do yourself vs. with AI
- **learning-integration**: When teaching or learning

### Apply these for new work:
- **requirement-clarification**: Before starting implementation
- **declarative-specification**: Before starting implementation
- **architectural-planning**: For significant new features

### Apply these for quality:
- **test-driven-development**: For all implementation work
- **code-quality-review**: After completing implementation
- **abstraction-simplification**: When code seems over-complex
- **dead-code-cleanup**: During maintenance and refactoring

### Apply these for complexity:
- **tradeoff-analysis**: When multiple approaches are possible
- **api-contract-definition**: When defining interfaces
- **constraint-enforcement**: When scope starts expanding

### Apply these for validation:
- **visual-verification**: For UI changes
- **test-driven-development**: For behavior verification

## Skill Orchestration Patterns

### Sequential Pattern
Apply skills one after another in order:
```
requirement-clarification → declarative-specification → architectural-planning → test-driven-development → code-quality-review
```

### Iterative Pattern
Apply skills in cycles, revisiting based on new information:
```
requirement-clarification → declarative-specification → (implementation发现问题) → requirement-clarification → declarative-specification → implementation → code-quality-review
```

### Parallel Pattern
Apply multiple skills simultaneously when they complement each other:
```
(code-quality-review + abstraction-simplification) applied together after implementation
```

### Layered Pattern
Apply skills at different layers of abstraction:
```
self-reflection (meta) → context-awareness (foundational) → declarative-specification (planning) → test-driven-development (implementation) → learning-integration (meta)
```

## Monitoring and Adjustment

### Signs of skill misuse:
- Spending too much time on planning (over-analysis)
- Skipping planning when it's needed (under-specification)
- Over-applying review skills (review bottleneck)
- Not applying enough quality skills (quality issues)
- Applying skills out of order (inefficient workflow)

### When to adjust skill usage:
- Context changes (new information emerges)
- Requirements shift
- Time constraints change
- Quality issues emerge
- Team feedback indicates problems
- Learning from previous iterations

### How to adjust:
- **self-reflection**: Analyze why current skill usage isn't working
- **tradeoff-analysis**: Consider different skill combinations
- **constraint-enforcement**: Enforce boundaries on skill application
- **learning-integration**: Learn from the adjustment for next time

## Common Skill Combinations

### For robust feature development:
```
requirement-clarification + declarative-specification + architectural-planning + test-driven-development + code-quality-review + visual-verification + learning-integration
```

### For fast iteration:
```
requirement-clarification + test-driven-development + minimal code-quality-review
```

### For legacy maintenance:
```
context-awareness + self-reflection + minimal change + code-quality-review
```

### For architecture work:
```
self-reflection + requirement-clarification + declarative-specification + tradeoff-analysis + architectural-planning + api-contract-definition + learning-integration
```

### For quality improvement:
```
code-quality-review + abstraction-simplification + dead-code-cleanup + test-driven-development
```

### For learning and teaching:
```
self-reflection + context-awareness + code-quality-review + learning-integration
```

## Conclusion

The developer-skills orchestrator helps LLMs make intelligent, context-aware decisions about which skills to apply when. By understanding the full skill inventory, analyzing context, reasoning about dependencies, and sequencing skills appropriately, LLMs can work more effectively as senior software engineers—balancing speed, quality, learning, and architectural considerations.

The key is not to apply all skills all the time, but to apply the right skills at the right time based on thoughtful analysis of the situation.