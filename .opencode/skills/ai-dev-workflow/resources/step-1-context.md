# Step 1: Context - Detailed Guide

## What is Context Gathering?

Before any coding task, provide AI with the right background information to prevent hallucinations and ensure code aligns with project standards.

## Three Types of Context

### 1. Project Background
**Always include:**
- README.md or project documentation
- Tech stack (languages, frameworks, libraries)
- Architecture patterns (MVC, microservices, monorepo, etc.)
- Project goals and scope

**What to look for:**
- Version constraints (e.g., "Django 4.0", "React 18+")
- External dependencies and their purposes
- API contracts or data models
- Deployment environment

### 2. Rules and Constraints
**Read these files:**
- AGENTS.md, CLAUDE.md, or similar AI instructions
- CONTRIBUTING.md or style guides
- .editorconfig, .eslintrc, or linting configs

**Identify:**
- Coding style patterns (naming conventions, formatting)
- Hard rules (e.g., "all dates must be UTC", "never call external API in dev")
- Testing conventions (Jest vs pytest, TDD approach)
- Error handling patterns (consistent error formats)
- Security requirements (input validation, data encryption)

### 3. Relevant Source and Signals
**Include:**
- Files/functions being modified
- Related code that interacts with changes
- Test files for the code being changed
- Error messages, stack traces, logs
- Expected vs actual behavior

**Signals are critical:**
- When debugging: paste the exact error and stack trace
- When fixing bugs: describe what you expected vs what happened
- When adding features: mention the user story or requirement

## Context Curation Rules

### Include
✅ Project README (always)
✅ Rules/conventions file
✅ Source files being modified
✅ Related test files
✅ Error messages, stack traces, logs
✅ Expected vs actual behavior
✅ API documentation if relevant

### Exclude
❌ Large documentation files (>300 words)
❌ Irrelevant files or unrelated code
❌ Duplicate information
❌ Entire codebase unless necessary
❌ Comments or changelogs
❌ Package manifests (unless version constraints matter)

### Limits
- **300-word rule**: If context exceeds 300 words, cut it down
- **Human-readability test**: If more than a human would reasonably read before starting, simplify
- **Focus**: Include only what prevents the AI from guessing
- **Signal over noise**: Brief and decisive beats comprehensive but overwhelming

## Context Templates

### Template 1: New Feature
```
I need to implement a new feature. Here's the context:

Feature Description:
<describe what the feature should do>

Requirements:
1. <requirement 1>
2. <requirement 2>
3. <requirement 3>

Constraints:
- Must integrate with <existing system>
- Must follow <existing patterns>
- Must be compatible with <version constraints>

Project Context:
Read @README to understand architecture and tech stack.
Read @AGENTS.md for coding conventions and rules.

Relevant Files:
- @file1.js - <description>
- @file2.js - <description>
- @file3.js - <description>

Your task is to [describe the implementation].
```

### Template 2: Bug Fix
```
I need to fix a bug. Here's the context:

Error Message:
```
<paste full error message>
```

Stack Trace:
```
<paste stack trace>
```

Relevant Files:
- @file_with_error.js - The function where error occurs
- @related_file.js - Code that calls this function

Context:
- This function is called by <caller>
- It depends on <dependencies>
- The error occurs when <conditions>

What I expected: <describe expected behavior>
What actually happened: <describe actual behavior>

Read @AGENTS.md for error handling patterns.
Read @related_test.js for expected behavior.

Help me understand why this is happening and how to fix it.
```

### Template 3: Refactoring
```
I need to refactor code while preserving behavior. Here's the context:

Refactoring Goal:
<describe what needs to improve - maintainability, performance, etc.>

Current Code:
Read @file_to_refactor.js

Constraints:
- Must preserve all existing behavior
- Must pass all existing tests
- Must follow @AGENTS.md conventions

Project Standards:
Read @AGENTS.md for coding patterns
Read @existing_tests.js for expected behavior

Your task is to refactor @file_to_refactor.js to [goal].
```

### Template 4: Context with Specific Rules
```
I'm starting a new coding task. Let me load the project context.

Read @README to understand the project scope, architecture, and constraints.

Read @AGENTS.md to learn the coding style, rules, and constraints for this codebase.

Then read @main.py, @business_logic_1.py, and @business_logic_2.py carefully.

Your task is to update @business_logic_2.py to implement the following changes:
1. <change 1>
2. <change 2>
3. <change 3>

Follow the conventions in the README and AGENTS file.
Do not modify other files unless strictly necessary and explain any extra changes you make.
```

## Common Mistakes

### ❌ Too Much Context
```
Reading entire package.json, all 50 source files, and documentation
→ AI gets overwhelmed, loses focus, hallucinates
```

### ✅ Curated Context
```
Reading README.md, AGENTS.md, and the 3 files being changed
→ AI has exactly what it needs, produces focused output
```

### ❌ Generic Context
```
"I need to add a feature"
→ AI guesses implementation, likely wrong
```

### ✅ Specific Context with Signals
```
"I need to add user authentication. Current login returns 200 on success,
but registration doesn't exist yet. See @auth.js and @User.js"
→ AI understands current state, builds on existing patterns
```

## When to Refresh Context

**Refresh context when:**
- Starting a new coding session
- Switching to a different part of the codebase
- After context drift (long conversation, AI forgetting earlier points)
- When debugging new issues

**No need to refresh when:**
- Continuing work on the same file/function
- Making incremental changes within same feature
- Following up on previous implementation

## Best Practices

1. **Always start with README** - even if you think you know the project
2. **Curate aggressively** - less is often more for AI context
3. **Include signals** - errors, logs, stack traces are worth their weight in gold
4. **Check rules files** - AGENTS.md/CLAUDE.md often have critical constraints
5. **Read tests** - test files show expected behavior better than code comments
6. **Be specific** - vague requirements lead to guessing and hallucinations

## Verification Checklist

Before asking AI to code, verify:
```
[ ] README.md read and understood
[ ] Rules/constraints file (AGENTS.md) read
[ ] Relevant source files read
[ ] Error/logs included (if debugging)
[ ] Context is < 300 words or well-structured
[ ] Requirements are specific and unambiguous
[ ] Constraints are clearly stated
[ ] Expected behavior is defined
```

See `resources/step-2-plan.md` for how to use context to create detailed plans.