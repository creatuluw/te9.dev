---
name: ai-dev-workflow
description: Follow a 6-step AI development workflow (Context → Plan → Code → Review → Test → Iterate) to produce reliable, maintainable code. Use when coding with AI, implementing features, fixing bugs, or refactoring code.
license: Complete terms in LICENSE.txt
---

# AI Development Workflow

## Goals

- **Context-First**: Ensure AI has complete project background before any code generation
- **Plan-Before-Code**: Require explicit planning and approval before generating code
- **Incremental Changes**: Implement in small steps (5-30 minutes) with immediate testing
- **Multi-Agent Roles**: Split work into Planner, Implementer, Tester, and Explainer roles
- **Test-Driven Workflow**: Write tests immediately after code changes
- **Controlled Iteration**: Debug with full context and reset conversations when stuck

## Permissions

**Required:**
- File system read/write access to project directory
- Ability to run tests, builds, and verification commands
- Network access for external APIs and documentation (if needed)
- No administrative privileges required

**Scope:**
- Create/modify source code files
- Write test files and test fixtures
- Read project documentation
- Cannot modify configuration files or dependencies without explicit approval
- Cannot access files outside project root

## Tool Usage

**Required Tools:**
- `read_file` - Examine project files, documentation, and rules
- `edit_file` - Make code changes, write tests, update documentation
- `terminal` - Run tests, builds, linting, and verification commands
- AI chat interface - For planning, reasoning, and explanation

**Command Patterns:**
```bash
# Read project context
read_file README.md
read_file AGENTS.md

# Make code changes
edit_file -path src/module.ts -mode modify

# Run tests
terminal -c "npm test"
terminal -c "pytest"
```

**Tool Call Sequence:**
1. **Context**: Read README, rules, relevant source files
2. **Plan**: Use chat interface to create and approve plan
3. **Code**: Use edit_file for small, incremental changes
4. **Review**: Read modified files, run linters
5. **Test**: Use terminal to run tests, write new tests
6. **Iterate**: Debug with full context, restart if needed

## Triggers

**Trigger Description**: "Follow AI development workflow for reliable code generation"

Use when:
- User requests to "write code", "implement a feature", or "fix a bug" with AI
- Mentions "AI coding", "AI-assisted development", or "using AI for programming"
- Asks to "generate code", "refactor code", or "add functionality"
- References "AI assistants", "Claude", "ChatGPT", "Copilot" for coding tasks
- Experiences AI hallucinations or unreliable AI code output

## Acceptance Criteria

1. **Context Completeness**: Every AI coding session begins with project context (README, rules, constraints, relevant code) before any code generation

2. **Plan-First Compliance**: No code is generated until a detailed plan is created in plain language and explicitly approved by the user

3. **Incremental Implementation**: Code changes are implemented in small steps (5-30 minutes each) with immediate verification and testing after each step

4. **Test Coverage**: Tests are written immediately after code changes, covering happy path and edge cases, serving as both verification and documentation

5. **Human Review**: All significant changes pass through human review and verification before merging, especially for security-sensitive or production-affecting code

## Core Instructions

### Step 1: Context - Brief the AI

Load three kinds of context before starting any coding task:

1. **Project Background**: Read README.md for scope, architecture, stack, technologies
2. **Rules and Constraints**: Read rules file (AGENTS.md, CLAUDE.md) for coding style, conventions, version constraints
3. **Relevant Source and Signals**: Read function/file involved in change, error messages, stack traces, logs, test files

**Context Prompt Template:**
```
Read @README to understand project scope, architecture, constraints.
Read @AGENTS.md to learn coding style, rules, constraints.
Then read @relevant_files carefully.
Your task is to [description].
Follow conventions in README and AGENTS.
Do not modify other files unless strictly necessary.
```

*See `resources/step-1-context.md` for detailed context curation strategies and examples*

### Step 2: Plan - Design Before Coding

Never generate code immediately. Always plan first and get approval.

**Phase 1: Plan Only (No Code)**
- Use chat model for planning
- Think step by step, outline clear plan
- List main steps, call out decisions/tradeoffs
- Mention edge cases
- **Stop after plan, wait for approval**

**Phase 2: Approve and Implement**
- Once approved, implement one step at a time
- Explain each change before making it
- Write tests for each step where appropriate

**Planning Prompt Template:**
```
You are a senior engineer helping with a change.

Read the feature/bug description:
<insert description and context>

Step 1 — Plan only:
- Think step by step and outline a clear plan
- List main steps
- Call out important decisions or tradeoffs
- Mention edge cases

Stop after the plan. Do not write code until I say "approved."
```

*See `resources/step-2-plan.md` for detailed planning strategies, templates, and examples*

### Step 3: Code - Multi-Agent Roles

Split work into four roles for better output quality:

**Role 1: Planner**
- Break task into steps
- Call out edge cases
- Identify dependencies
- Question assumptions

**Role 2: Implementer**
- Write code strictly following approved plan
- Change only files listed in plan
- Keep changes small and focused
- Ask before coding anything unclear

**Role 3: Tester**
- Write tests for happy path and edge cases
- Create regression tests for bug fixes
- Write integration tests for multi-component changes
- Use tests as documentation

**Role 4: Explainer**
- Summarize changes by file
- Explain logic in plain language
- List what could break and how tests cover it
- Document decisions and tradeoffs

**Model Selection:**
- Planner: Claude/ChatGPT (reasoning matters)
- Implementer: Faster model (speed matters for well-defined tasks)
- Tester: Claude/ChatGPT (test quality matters)
- Explainer: Any model

*See `resources/step-3-code.md` for detailed role prompts, model selection guide, and examples*

### Step 4: Review - Check AI Output

Add layers of verification to AI-generated code:

**Review Process:**
1. **Manual Review**: Carefully read generated code
2. **AI-Assisted Review**: Use tools like CodeRabbit for automated PR reviews
3. **Linting**: Run linters and static analysis tools
4. **Security Check**: Verify no security issues introduced

**What to Check:**
- Logic errors and incorrect assumptions
- Missing error handling
- Security issues (injections, exposed secrets, improper validation)
- Edge cases and boundary conditions
- Code quality and maintainability
- Adherence to project conventions

**Review Question:**
- Would this likely cause a bug?
- Would this confuse someone reading the code later?
- If yes to either, fix it or add a test

*See `resources/step-4-review.md` for detailed review checklist and best practices*

### Step 5: Test - Tests are Part of the Flow

Write tests immediately after code changes, not as a separate phase.

**Test Types by Scenario:**

**New functions:**
```
Write unit tests for this function.
Cover happy path and at least two edge cases.
```

**Bug fixes:**
```
Write a regression test for this bug.
Test should fail before fix and pass after.
```

**Multi-component changes:**
```
Write minimal integration test for this feature.
Include realistic user flow and edge cases.
```

**Reviewing existing tests:**
```
Review these tests.
Are there obvious edge cases missing or weak assertions?
```

**Testing Guidelines:**
- Tests serve as verification AND documentation
- Reading test often teaches more than reading function
- If AI can't write sensible test, code is unclear
- Treat unclear tests as signal to revisit code or prompt

*See `resources/step-5-test.md` for detailed testing patterns and examples*

### Step 6: Iterate - Debug and Refine

When something breaks, debug with full context and controlled iteration.

**Debugging Prompt Template:**
```
Here is the function and error message.
Explain why this is happening.
Then rewrite function using best practices, keeping it efficient and readable.
```

**Include when debugging:**
- Error message or stack trace
- Function where error occurs
- Relevant surrounding code or types
- Expected vs actual behavior

**Iteration Rules:**

**When to retry (1-2 times):**
- Minor errors or small misunderstandings
- Missing context or clarifications needed

**When to start fresh:**
- After 2 failed attempts
- Context drift or model forgetting earlier decisions
- Circular reasoning or repeated bad ideas
- Answers getting worse over time

**Starting Fresh:**
```
Stop this conversation.
Start fresh chat with better context.
Restate problem with narrower focus.
Avoid saying "try again" repeatedly.
```

**Ask for explanation first:**
```
Do not fix yet.
Explain what this function does step by step.
Then list most likely failure cases.
```

*See `resources/step-6-iterate.md` for detailed debugging strategies and troubleshooting*

## Decision Management

### When to Use Different AI Models

**Use reasoning models (Claude, ChatGPT) for:**
- Planning and design (Step 2)
- Explaining complex logic (Explainer role)
- Writing high-quality tests (Tester role)
- Debugging unfamiliar code

**Use faster models for:**
- Implementation (Implementer role) when plan is well-defined
- Simple code changes or refactoring
- Formatting and style fixes

### When to Split Roles vs. Single Prompt

**Split into roles when:**
- Complex tasks with multiple steps
- Quality-critical code (security, algorithms)
- Multi-step refactoring
- Building new features
- User-facing functionality

**Use single prompt when:**
- Simple bug fixes
- Obvious changes
- Small tasks (< 5 minutes)
- Adding comments or documentation
- One-off formatting changes

### Context Curation Strategy

**Include:**
- Project README (always)
- Rules/conventions file (AGENTS.md, CLAUDE.md)
- Relevant source files being modified
- Test files for code being changed
- Error messages, stack traces, logs
- Expected vs actual behavior

**Exclude:**
- Large documentation files (>300 words)
- Irrelevant files or unrelated code
- Duplicate information
- Entire codebase unless necessary

**Context limits:**
- If more than human would reasonably read, cut it down
- Focus on what prevents guessing
- Brief and decisive beats comprehensive but overwhelming

### Conversation Management

**Keep conversations short:**
- Long chats cause context drift
- Model forgets earlier decisions
- Recycles bad ideas or circles back

**Best practices:**
- One chat for design, one for part A, one for part B
- Summarize between steps
- Paste summary into next prompt
- Start fresh when thread feels messy

*See `resources/decision-management.md` for detailed decision trees and edge cases*

## Human Interaction

### When to Request Human Approval

**Required before:**
- Writing any code (after plan is approved)
- Merging any pull request
- Making destructive changes (deleting files, dropping tables)
- Modifying production systems or data
- Using new libraries or dependencies
- Making architectural decisions

**Request format:**
```
I'm ready to implement [change description].
Plan: [brief summary]
Files to modify: [list]
Impact: [what could break]

Should I proceed? [yes/no/adjust]
```

### When to Request Human Advice

**Recommended for:**
- Choosing between multiple implementation approaches
- Handling ambiguous requirements
- Deciding on library/tool choices
- Architecture or design decisions
- Handling unfamiliar codebases or technologies

**Request format:**
```
I encountered [situation] with options:

Option A: [description]
- Pros: [list]
- Cons: [list]
- Trade-offs: [explain]

Option B: [description]
- Pros: [list]
- Cons: [list]
- Trade-offs: [explain]

Which approach should I take? [A/B/other]
```

### When to Request Human Feedback

**Required after:**
- Completing plan (before coding)
- Completing each major code change
- Generating tests
- Fixing bugs
- Before merging any PR

**Request format:**
```
I completed [task] with results:
- [change 1]
- [change 2]

Tests written: [number]
Coverage: [happy path, edge cases]

Does this meet expectations? [yes/no/adjust]
```

### When to Require Human Review

**Must-have review for:**
- All pull requests before merging
- Security-sensitive code (auth, payments, data handling)
- Algorithmic code that must be correct
- Database migrations or schema changes
- Configuration changes affecting production
- Any code that could cause financial or reputational damage

*See `resources/human-interaction.md` for detailed interaction patterns and templates*

## Limits

### What This Skill Does Not Cover

- **Project setup and initialization**: Use other skills for new project scaffolding
- **Framework-specific patterns**: This skill provides general workflow, not framework-specific guidance
- **DevOps and deployment**: Deployment workflows are outside scope
- **Performance optimization**: For specialized performance work, use domain-specific skills
- **Security audits**: This skill includes security checks but is not replacement for dedicated security reviews

### Anti-Use Cases

Do NOT use this skill for:
- **One-shot code generation**: This workflow requires iteration and verification
- **Simple copy-paste tasks**: Direct terminal commands are more efficient
- **Non-coding tasks**: Use appropriate skills for documentation, research, etc.
- **Experiments or prototyping**: Strict workflow may slow down rapid prototyping
- **Learning exercises**: Workflow is for production code, not educational practice

### Resource Requirements

- **AI access**: At least one AI model (Claude, ChatGPT, Copilot, etc.) must be available
- **Project documentation**: README.md and rules files should exist
- **Test framework**: Project should have tests configured (Jest, pytest, etc.)
- **Version control**: Git or similar VCS for managing changes
- **Code review tools** (optional): CodeRabbit or similar for AI-assisted reviews

### Time Expectations

- **Simple bug fix**: 15-30 minutes with full workflow
- **Small feature**: 1-2 hours including tests
- **Medium feature**: 2-4 hours including tests and review
- **Large feature or refactor**: Plan in phases, each phase follows workflow

Workflow adds overhead but produces more reliable, maintainable code.

## References

*For detailed examples of each workflow step:*
- `resources/step-1-context.md` - Context gathering strategies
- `resources/step-2-plan.md` - Planning templates and examples
- `resources/step-3-code.md` - Multi-agent role prompts
- `resources/step-4-review.md` - Review checklist and best practices
- `resources/step-5-test.md` - Testing patterns and examples
- `resources/step-6-iterate.md` - Debugging strategies
- `resources/decision-management.md` - Decision trees and edge cases
- `resources/human-interaction.md` - Interaction patterns and templates

*For additional resources:*
- `resources/examples.md` - Complete workflow examples
- `resources/troubleshooting.md` - Common issues and solutions
- `resources/templates.md` - Reusable prompt templates
- `resources/tool-integration.md` - AI editor setup and optimization