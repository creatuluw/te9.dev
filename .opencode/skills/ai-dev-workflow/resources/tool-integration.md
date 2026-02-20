# AI Tool Integration Guide

This document provides detailed guidance on setting up and optimizing AI coding tools (Cursor, VS Code + Copilot, Claude Code, etc.) to work seamlessly with the strict AI coding workflow.

## Table of Contents

1. [Tool Overview](#tool-overview)
2. [Cursor Setup](#cursor-setup)
3. [VS Code + Copilot Setup](#vs-code--copilot-setup)
4. [Claude Code Setup](#claude-code-setup)
5. [CodeRabbit Integration](#coderabbit-integration)
6. [General Workflow Integration](#general-workflow-integration)
7. [Optimization Tips](#optimization-tips)
8. [Multi-Tool Strategies](#multi-tool-strategies)

---

## Tool Overview

### Recommended AI Coding Tools

| Tool | Best For | Strengths | Cost |
|-------|----------|------------|------|
| **Cursor** | Most use cases | Repo context, model switching, integrated chat | Free tier available |
| **VS Code + Copilot** | Lightweight coding | Inline suggestions, familiar interface | $10/month |
| **Claude Code** | Complex reasoning | Deep context understanding, strong planning | Free tier available |
| **ChatGPT** | Planning & explanation | Excellent reasoning, clear explanations | Free tier available |
| **CodeRabbit** | Automated reviews | PR reviews, security checks | Paid |
| **GitHub Copilot Labs** | Code understanding | Explain code, generate tests | Included with Copilot |

### Tool Selection Guide

**Use Cursor if you want:**
- All-in-one solution (editor + AI)
- Easy model switching between roles
- Strong repo context understanding
- Integrated chat and code editing

**Use VS Code + Copilot if you want:**
- Familiar interface
- Fast inline suggestions
- Lightweight AI assistance
- Already using VS Code

**Use Claude Code if you want:**
- Deep reasoning capabilities
- Excellent context awareness
- Strong planning and explanation
- Integrated with Claude API

**Use ChatGPT if you want:**
- Planning and design conversations
- Explanations of complex code
- General programming help
- Multi-step reasoning tasks

---

## Cursor Setup

### Installation

1. **Download Cursor:**
   ```bash
   # Visit https://cursor.sh
   # Download for your platform (Windows, Mac, Linux)
   ```

2. **Install Extensions:**
   ```
   - ESLint (for code quality)
   - Prettier (for formatting)
   - Jest Runner (for testing)
   - GitLens (for git operations)
   ```

3. **Configure Models:**
   ```
   - Settings → Models
   - Configure Claude, OpenAI, and local models
   - Set default model for each role
   ```

### Cursor-Specific Workflow Configuration

**Step 1: Context Configuration**

Create a `.cursorrules` file in your project root:

```markdown
# Cursor Rules for AI Coding Workflow

## Context Loading
- Always read README.md first
- Always read AGENTS.md or CLAUDE.md for project rules
- Load relevant files before suggesting changes

## Planning Mode
- When asked to plan, provide step-by-step breakdown
- List edge cases and considerations
- Wait for approval before coding

## Implementation Mode
- Follow approved plan strictly
- Implement one step at a time
- Ask before changing files not in plan

## Testing Mode
- Write tests for happy path and edge cases
- Use existing test patterns
- Cover error paths explicitly

## Code Style
- Follow project's existing patterns
- Match naming conventions
- Use consistent error handling
```

**Step 2: Model Configuration**

Configure models for different roles:

```
Settings → Models → Role-Specific Models

Planner Role: Claude 3.5 Sonnet
  - Best for: Reasoning, planning, explanation
  - Reason: Strong analytical capabilities

Implementer Role: GPT-4 Turbo or Claude 3 Haiku
  - Best for: Well-defined coding tasks
  - Reason: Fast, accurate implementation

Tester Role: Claude 3.5 Sonnet
  - Best for: Test quality and coverage
  - Reason: Understanding of edge cases

Explainer Role: GPT-4 or Claude 3.5 Sonnet
  - Best for: Summarization and explanation
  - Reason: Clear communication skills
```

**Step 3: Cursor Command Setup**

Create custom commands in `.cursor/commands.json`:

```json
{
  "commands": [
    {
      "name": "Load Context",
      "prompt": "Read README.md and AGENTS.md to understand project context. Then read the files I'm about to modify. Wait for my task."
    },
    {
      "name": "Plan First",
      "prompt": "Create a detailed plan for this change. Outline steps, edge cases, and files to modify. Wait for approval before coding."
    },
    {
      "name": "Implement Step",
      "prompt": "Implement this step from the approved plan. Only modify files listed. Explain what you're changing before writing code."
    },
    {
      "name": "Write Tests",
      "prompt": "Write comprehensive tests for this code. Cover happy path, edge cases, and error paths. Use existing test patterns."
    },
    {
      "name": "Review Changes",
      "prompt": "Review these changes for correctness, security, and maintainability. Provide detailed feedback."
    }
  ]
}
```

### Cursor Workflow Integration

**Phase 1: Context (Step 1 of Workflow)**

```
1. Open project in Cursor
2. Press Cmd+K (Mac) or Ctrl+K (Windows) to open AI chat
3. Type: "Load Context" (or use custom command)
4. Cursor reads: README.md, AGENTS.md, relevant files
5. Proceed to describe task
```

**Phase 2: Planning (Step 2 of Workflow)**

```
1. In chat, type your task description
2. Add: "Follow strict AI coding workflow. Plan first."
3. Cursor creates detailed plan
4. Review plan
5. Type: "approved" or provide feedback
```

**Phase 3: Coding (Step 3 of Workflow)**

```
Option A - Using Chat:
1. After approval, type: "Implement Step 1"
2. Cursor explains what it will change
3. Type: "go" or "proceed"
4. Cursor generates code
5. Review changes

Option B - Using Inline Edit:
1. Highlight code to modify
2. Press Cmd+I (Mac) or Ctrl+I (Windows)
3. Type instruction based on approved plan
4. Cursor generates inline suggestions
5. Accept or modify
```

**Phase 4: Review (Step 4 of Workflow)**

```
1. After each change, type: "Review this change"
2. Cursor provides detailed review
3. Check for: logic, security, style, edge cases
4. Address issues before proceeding
```

**Phase 5: Testing (Step 5 of Workflow)**

```
1. After implementation, type: "Write Tests"
2. Cursor generates tests
3. Review tests in integrated test panel
4. Run tests: Cmd+Shift+P → "Jest: Run All Tests"
5. Fix any failures
```

**Phase 6: Iteration (Step 6 of Workflow)**

```
If tests fail:
1. Show error to Cursor
2. Type: "Debug this failure with full context"
3. Cursor explains issue and proposes fix
4. Apply fix and re-run tests

If stuck after 2 attempts:
1. Clear chat history
2. Start fresh with: "I'm debugging [issue]. Here's context..."
3. Provide error, code, expectations
```

### Cursor Tips and Tricks

**Effective Context Management:**

```markdown
# Best Practice: Project Context Prompt
```
Read these files in order:
1. README.md - Project overview and architecture
2. AGENTS.md - Coding rules and conventions
3. package.json - Dependencies and versions
4. src/routes/api.js - API structure
5. src/models/User.js - Data models

My task: [describe task]
```

**Multi-File Changes:**

```
When modifying multiple files:
1. Use Cmd+L (Mac) or Ctrl+L (Windows) to include files
2. Add all relevant files to context
3. Specify which files to modify
4. Cursor understands cross-file dependencies
```

**Model Switching During Workflow:**

```
1. Planning: Click model dropdown → Select Claude 3.5 Sonnet
2. Implementation: Switch to GPT-4 Turbo (faster)
3. Testing: Switch back to Claude 3.5 Sonnet
4. Explanation: Use GPT-4 or Claude 3.5 Sonnet
```

**Keyboard Shortcuts:**

```
Cmd+K (Mac) / Ctrl+K (Windows)    - Open AI chat
Cmd+I (Mac) / Ctrl+I (Windows)    - Inline code edit
Cmd+L (Mac) / Ctrl+L (Windows)    - Add file to context
Cmd+Shift+K (Mac) / Ctrl+Shift+K   - New chat (start fresh)
Cmd+/ (Mac) / Ctrl+/ (Windows)      - Quick command palette
```

---

## VS Code + Copilot Setup

### Installation

1. **Install VS Code:**
   ```bash
   # Visit https://code.visualstudio.com
   # Download for your platform
   ```

2. **Install GitHub Copilot Extension:**
   ```
   1. Open VS Code
   2. Extensions → Search "GitHub Copilot"
   3. Click Install
   4. Sign in with GitHub account
   5. Activate subscription ($10/month)
   ```

3. **Install Additional Extensions:**
   ```
   - ESLint
   - Prettier
   - Jest
   - GitLens
   - Code Runner
   - Error Lens
   ```

### VS Code-Specific Workflow Configuration

**Step 1: Project Configuration**

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": false,
    "markdown": false
  },
  "github.copilot.advanced": {
    "inlineSuggest.enable": true,
    "inlineSuggest.count": 3
  }
}
```

**Step 2: Copilot Chat Setup**

Install Copilot Chat extension:

```
1. Extensions → Search "GitHub Copilot Chat"
2. Click Install
3. Sign in with same GitHub account
4. Configure workspace context
```

**Step 3: Custom VS Code Tasks**

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Load Context for AI",
      "type": "shell",
      "command": "echo",
      "args": [
        "Read README.md, AGENTS.md, and relevant files before AI coding"
      ],
      "presentation": {
        "reveal": "always",
        "focus": true
      }
    },
    {
      "label": "Run All Tests",
      "type": "shell",
      "command": "npm test",
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "Lint Code",
      "type": "shell",
      "command": "npm run lint"
    }
  ]
}
```

**Step 4: Workspace Context Configuration**

Create `.copilot-instructions.md` in project root:

```markdown
# Copilot Instructions

## AI Coding Workflow

When I ask you to code, follow this workflow:

1. **Context**: Ask me what files to read first
2. **Plan**: Create a detailed plan before coding
3. **Implement**: Write code step by step
4. **Test**: Write tests for all changes
5. **Review**: Verify correctness and security

## Project Rules

- Use the coding style in existing files
- Follow patterns in AGENTS.md
- Always add error handling
- Write tests for new code
- Ask before making breaking changes

## Testing

- Use Jest framework
- Write happy path tests
- Write edge case tests
- Write error path tests
```

### VS Code Workflow Integration

**Phase 1: Context (Step 1)**

```
1. Open Copilot Chat: View → Command Palette → "GitHub Copilot: Open Chat"
2. Type: "Read README.md and AGENTS.md to understand project"
3. Copilot reads and summarizes context
4. Ask follow-up questions to clarify context
```

**Phase 2: Planning (Step 2)**

```
1. In Copilot Chat, describe your task
2. Add: "Create a detailed plan. Don't write code yet."
3. Copilot generates plan
4. Review and refine: "Modify step 3 to..."
5. Approve: "Approved. Now implement."
```

**Phase 3: Coding (Step 3)**

```
Option A - Using Copilot Chat:
1. Type: "Implement Step 1 from the plan"
2. Copilot generates code
3. Apply changes manually or use AI Apply
4. Review before accepting

Option B - Using Inline Suggestions:
1. Start typing function or comment
2. Copilot suggests completion (grey text)
3. Press Tab to accept
4. Or press Escape to reject
5. Continue to cycle through suggestions
```

**Phase 4: Review (Step 4)**

```
1. After code changes, ask Copilot: "Review this code"
2. Copilot provides feedback
3. Check: logic, security, edge cases
4. Ask for fixes: "Fix security issue in..."
```

**Phase 5: Testing (Step 5)**

```
1. Ask Copilot: "Write tests for this code"
2. Copilot generates test file
3. Create test file in appropriate location
4. Run tests: Command Palette → "Jest: Run All Tests"
5. Debug failures with Copilot help
```

**Phase 6: Iteration (Step 6)**

```
If tests fail:
1. Copy error message
2. Paste into Copilot Chat
3. Add: "Explain why this error is happening"
4. Copilot explains and suggests fix
5. Apply fix
6. Re-run tests

If stuck:
1. Clear chat: Click "New Chat" button
2. Restart with: "I need to debug [error]. Here's context..."
```

### VS Code Tips and Tricks

**Inline Code Suggestions:**

```javascript
// Type a function signature
function authenticateUser(email, password) {
  // Copilot suggests implementation
  // Press Tab to accept
}

// Type a comment
// Get all active users from database
// Copilot suggests code
```

**Workspace Context:**

```
1. Right-click file in explorer → "Copilot: Add File to Context"
2. Multiple files can be added to context
3. Copilot understands relationships between files
4. Use for cross-file changes
```

**Explain Code:**

```
1. Select code block
2. Right-click → "Copilot: Explain This Code"
3. Copilot provides explanation
4. Use for understanding unfamiliar code
```

**Generate Tests:**

```
1. Select function to test
2. Right-click → "Copilot: Generate Tests"
3. Copilot generates test code
4. Review and adapt to your testing framework
```

**Keyboard Shortcuts:**

```
Ctrl+I (Windows) / Cmd+I (Mac)        - Open Copilot Chat
Ctrl+Enter (Windows) / Cmd+Enter (Mac)  - Send message in chat
Ctrl+Shift+I (Windows) / Cmd+Shift+I  - Toggle inline suggestions
Alt+\ (Windows) / Option+\ (Mac)        - Accept inline suggestion
Esc                                    - Reject inline suggestion
```

---

## Claude Code Setup

### Installation

1. **Install Claude Code:**
   ```bash
   # Visit https://claude.ai/code
   # Download for your platform
   # Sign in with Anthropic account
   ```

2. **Configure API:**
   ```
   1. Settings → API Key
   2. Add Anthropic API key
   3. Configure model preferences
   4. Set temperature (0.1-0.3 for code, 0.7+ for planning)
   ```

3. **Install Plugins:**
   ```
   - File system plugin
   - Git plugin
   - Test runner plugin (Jest, pytest, etc.)
   - Terminal plugin
   ```

### Claude Code-Specific Workflow Configuration

**Step 1: Project Configuration**

Create `.claude/config.json`:

```json
{
  "project": {
    "name": "your-project-name",
    "description": "Brief project description"
  },
  "context": {
    "always_load": [
      "README.md",
      "AGENTS.md",
      "package.json"
    ],
    "code_style": "Follow patterns in src/utils/",
    "test_framework": "jest",
    "language": "typescript"
  },
  "workflow": {
    "plan_before_code": true,
    "test_immediately": true,
    "review_changes": true
  },
  "models": {
    "default": "claude-3-5-sonnet-20241022",
    "planning": "claude-3-5-sonnet-20241022",
    "implementation": "claude-3-5-haiku-20241022",
    "testing": "claude-3-5-sonnet-20241022"
  }
}
```

**Step 2: Claude Instructions File**

Create `.claude/instructions.md`:

```markdown
# Claude Instructions for AI Coding Workflow

## Strict Workflow

Always follow this 6-step workflow:

### Step 1: Context
- Ask what files to read
- Read README.md and AGENTS.md first
- Understand project structure
- Identify relevant files

### Step 2: Plan
- Create detailed plan before coding
- Outline steps, edge cases
- Wait for approval
- List files to modify

### Step 3: Code
- Implement one step at a time
- Follow approved plan
- Explain changes before coding
- Only modify planned files

### Step 4: Review
- Check logic correctness
- Verify error handling
- Check for security issues
- Ensure code quality

### Step 5: Test
- Write tests immediately
- Cover happy path
- Cover edge cases
- Cover error paths

### Step 6: Iterate
- Debug with full context
- Explain root causes
- Provide clear fixes
- Reset if stuck

## Project Rules

- Use TypeScript strictly
- Follow ESLint rules
- Use async/await, not promises
- Consistent error handling
- Document complex logic

## When to Ask

- Before making breaking changes
- If requirements are unclear
- If multiple approaches exist
- If security implications
```

**Step 3: Custom Claude Commands**

Create `.claude/commands.json`:

```json
{
  "commands": [
    {
      "name": "Start Workflow",
      "prompt": "I'm starting a new coding task. First, ask me which files to read for context. Then I'll describe the task.",
      "description": "Begin strict AI coding workflow"
    },
    {
      "name": "Plan Task",
      "prompt": "Create a detailed plan for implementing [task]. Outline steps, edge cases, files to modify. Wait for approval before coding.",
      "description": "Plan implementation without coding"
    },
    {
      "name": "Implement Step",
      "prompt": "Implement step [N] from the approved plan. Explain what you're changing before writing code. Only modify files in the plan.",
      "description": "Implement one step of plan"
    },
    {
      "name": "Write Tests",
      "prompt": "Write comprehensive tests for the code I just showed you. Cover happy path, edge cases, and error paths. Use Jest framework.",
      "description": "Generate tests for code"
    },
    {
      "name": "Review Code",
      "prompt": "Review this code for correctness, security, maintainability. Provide specific feedback and suggestions.",
      "description": "Review code for quality"
    },
    {
      "name": "Debug Issue",
      "prompt": "I have this error: [paste error]. Here's the code: [paste code]. Explain why this is happening and how to fix it.",
      "description": "Debug error with explanation"
    }
  ]
}
```

### Claude Code Workflow Integration

**Phase 1: Context (Step 1)**

```
1. Open Claude Code
2. Select "Start Workflow" command
3. Claude asks: "Which files should I read for context?"
4. List files: README.md, AGENTS.md, src/, tests/
5. Claude reads and summarizes context
6. Verify understanding before proceeding
```

**Phase 2: Planning (Step 2)**

```
1. Describe your task
2. Claude asks for clarification if needed
3. Claude generates detailed plan
4. Review plan
5. Provide feedback or approve
6. If approved: "Approved. Proceed with implementation."
```

**Phase 3: Coding (Step 3)**

```
1. Use "Implement Step" command
2. Claude explains what it will change
3. Confirm or adjust
4. Claude generates code
5. Review code in Claude's interface
6. Accept or request changes
7. Continue with next step
```

**Phase 4: Review (Step 4)**

```
1. Use "Review Code" command
2. Paste or reference code
3. Claude provides detailed review
4. Check for: logic, security, edge cases
5. Address issues Claude identifies
6. Request fixes: "Fix security issue here"
```

**Phase 5: Testing (Step 5)**

```
1. Use "Write Tests" command
2. Claude generates test code
3. Create test file in appropriate location
4. Run tests via Claude Code terminal
5. Review test results
6. Fix failures with Claude's help
```

**Phase 6: Iteration (Step 6)**

```
If tests fail:
1. Use "Debug Issue" command
2. Paste error and code
3. Claude explains root cause
4. Claude provides fix
5. Apply fix
6. Re-run tests

If stuck:
1. Start new conversation
2. "I'm debugging [issue]. Context: [details]"
3. Provide full context
4. Get fresh perspective
```

### Claude Code Tips and Tricks

**Multi-File Context:**

```
1. Click "Add File" button in Claude interface
2. Select multiple files
3. Claude understands relationships
4. Use for cross-file refactoring
```

**Terminal Integration:**

```
1. Use built-in terminal for running tests
2. Claude can see terminal output
3. "Run npm test and explain failures"
4. Claude interprets results and suggests fixes
```

**Git Integration:**

```
1. Claude can see git diff
2. Ask: "Review my changes"
3. Claude shows modified files
4. Provides review of each change
```

**Project-Specific Context:**

```
1. Create .claude/context.md
2. Add project-specific information
3. Include: architecture, patterns, rules
4. Claude loads automatically
```

**Model Selection:**

```
For planning: Claude 3.5 Sonnet (best reasoning)
For coding: Claude 3.5 Haiku (fast, accurate)
For testing: Claude 3.5 Sonnet (test quality)
For explanation: Claude 3.5 Sonnet (clarity)
```

---

## CodeRabbit Integration

### Overview

CodeRabbit is an AI-powered code review tool that integrates with GitHub and GitLab. It automatically reviews pull requests and provides line-by-line suggestions.

### Installation

1. **Install CodeRabbit:**
   ```bash
   # Visit https://coderabbit.ai
   # Connect your GitHub or GitLab account
   # Select repositories to enable
   ```

2. **Configure for Project:**
   ```
   1. Go to CodeRabbit dashboard
   2. Select your repository
   3. Configure review rules:
      - Security checks: On
      - Performance checks: On
      - Code style checks: On
      - Custom rules: Add project-specific rules
   ```

3. **Install CodeRabbit CLI (optional):**
   ```bash
   npm install -g @coderabbit/cli
   coderabbit configure
   ```

### CodeRabbit Workflow Integration

**Step 4 Enhancement: Automated Review**

```
1. Create PR with your changes
2. CodeRabbit automatically triggers
3. Within 1-2 minutes, CodeRabbit posts:
   - Summary of changes
   - File-by-file review
   - Line-by-line suggestions
   - Security alerts
   - Performance warnings
4. Review CodeRabbit comments
5. Address issues:
   - Must-fix: Security, logic errors
   - Worth considering: Style, alternatives
6. Push updates to PR
7. CodeRabbit reviews new changes
```

**CodeRabbit Review Categories:**

```markdown
## CodeRabbit Review Summary

### Security
- [ ] SQL injection vulnerabilities
- [ ] XSS vulnerabilities
- [ ] Hardcoded secrets
- [ ] Missing authentication
- [ ] Broken access control

### Performance
- [ ] N+1 query problems
- [ ] Missing database indexes
- [ ] Inefficient algorithms
- [ ] Unnecessary loops
- [ ] Memory leaks

### Code Quality
- [ ] Code duplication
- [ ] Complex logic
- [ ] Inconsistent style
- [ ] Missing error handling
- [ ] Poor naming

### Best Practices
- [ ] SOLID principles
- [ ] Design patterns
- [ ] Framework conventions
- [ ] Testing coverage
- [ ] Documentation
```

**CodeRabbit Custom Rules:**

Create `.coderabbit.yml` in project root:

```yaml
review_rules:
  # Security rules
  security:
    - no_hardcoded_secrets
    - no_sql_injection
    - no_xss_vulnerabilities
    - validate_user_input

  # Performance rules
  performance:
    - no_n_plus_one_queries
    - use_database_indexes
    - optimize_loops
    - avoid_unnecessary_copies

  # Code quality rules
  quality:
    - max_function_length: 50
    - max_nesting_depth: 4
    - consistent_naming: true
    - avoid_code_duplication: true

  # Testing rules
  testing:
    - require_tests: true
    - min_coverage: 80
    - test_edge_cases: true
    - test_error_paths: true

  # Documentation rules
  documentation:
    - document_public_apis: true
    - document_complex_logic: true
    - update_readme: true
```

**CodeRabbit CLI Integration:**

```bash
# Review changes before pushing
coderabbit review

# Get specific feedback
coderabbit review --check security

# Generate PR description
coderabbit pr-description

# Review specific files
coderabbit review src/auth.js src/user.js
```

### CodeRabbit Tips and Tricks

**Batch Review:**

```
1. Make multiple related changes
2. Push to PR
3. CodeRabbit reviews entire PR
4. Addresses cross-file issues
5. Ensures consistency
```

**Incremental Review:**

```
1. Push changes to existing PR
2. CodeRabbit reviews only new changes
3. Faster feedback
4. Focuses on new work
```

**Security-First Review:**

```
1. Configure CodeRabbit to check security first
2. Block merge on critical issues
3. Require security review
4. Production code protection
```

**Custom Feedback:**

```
1. Reply to CodeRabbit comments
2. Explain context it missed
3. It learns for future reviews
4. Improves accuracy over time
```

**Integration with Workflow:**

```
Use CodeRabbit in Step 4 (Review):

1. Create PR
2. Manual review (your own review)
3. CodeRabbit automated review
4. Address CodeRabbit comments
5. Request team review
6. Merge when all approved
```

---

## General Workflow Integration

### Universal Workflow Prompts

These prompts work across all AI tools:

**Context Gathering (Step 1):**

```
I need to implement [task]. Before we start, please:

1. Read these files in order:
   - README.md (project overview)
   - AGENTS.md (coding rules)
   - [relevant files for the task]

2. After reading, summarize:
   - What is the project about?
   - What are the coding rules?
   - What patterns should I follow?

Then I'll describe the task.
```

**Planning (Step 2):**

```
I need to [describe task].

Please create a detailed plan:

1. **High-level approach**: What's the strategy?
2. **Step-by-step breakdown**: List each step with rationale
3. **Files to modify**: Which files and what changes?
4. **Edge cases**: What could go wrong?
5. **Testing strategy**: How will we verify it works?

Stop after the plan. Wait for my approval before coding.
```

**Implementation (Step 3):**

```
Approved. Implement Step 1:

[copy step from plan]

Please:
1. Explain what you're about to change
2. Show the code you'll write
3. Only modify files in the plan

Wait for my confirmation before writing.
```

**Review (Step 4):**

```
Review this code for:

1. Correctness
2. Security vulnerabilities
3. Error handling
4. Edge cases
5. Code quality
6. Maintainability

For each issue:
- What's the problem?
- Where is it?
- How do I fix it?

Provide specific, actionable feedback.
```

**Testing (Step 5):**

```
Write comprehensive tests for this code:

1. Happy path test
2. Edge case 1: [describe]
3. Edge case 2: [describe]
4. Error path test

Follow project's test framework: [Jest/Mocha/etc]

Use existing test patterns from tests/ directory.
```

**Iteration (Step 6):**

```
I'm experiencing this error:

```
[paste error message]
```

Here's the code:

```javascript
[paste code]
```

Context:
- Expected: [what should happen]
- Actual: [what actually happens]
- Environment: [relevant environment details]

First, explain why this is happening.
Then, provide a fix that follows best practices.
```

### Multi-Tool Workflow

**Best Tool for Each Step:**

| Step | Best Tool | Why |
|------|-----------|-----|
| Context | Any tool | All tools can read files |
| Planning | Claude/ChatGPT | Strong reasoning |
| Implementation | Cursor/Copilot | Inline suggestions |
| Testing | Claude/ChatGPT | Test quality matters |
| Review | CodeRabbit + Manual | Automated + human |
| Explanation | Claude/ChatGPT | Clear communication |

**Switching Between Tools:**

```
Example Workflow:

1. Cursor - Load context
2. ChatGPT - Create detailed plan
3. Cursor - Implement code (inline suggestions)
4. CodeRabbit - Automated review
5. Claude - Write comprehensive tests
6. ChatGPT - Explain changes and document
```

**Tool Integration Strategy:**

```
Use Cursor as primary editor:
- Best integration with AI
- Easy model switching
- Good repo context

Use ChatGPT/Claude for planning:
- Better at reasoning
- Stronger explanations
- Good for exploring options

Use CodeRabbit for review:
- Automated PR reviews
- Security checks
- Performance analysis

Use VS Code for:
- Familiar interface
- Lightweight tasks
- Team collaboration
```

---

## Optimization Tips

### Performance Optimization

**Context Loading:**

```
✅ DO:
- Load only relevant files
- Start with README and rules
- Add files incrementally
- Remove old context when switching tasks

❌ DON'T:
- Load entire codebase
- Include irrelevant files
- Keep stale context
- Overload with documentation
```

**Model Selection:**

```
Use faster models for:
- Simple code changes
- Refactoring
- Formatting
- Documentation

Use smarter models for:
- Planning and design
- Complex reasoning
- Security reviews
- Test generation
```

**Prompt Engineering:**

```
✅ Effective prompts:
- Clear and specific
- Include examples
- Define constraints
- Ask for structure

❌ Ineffective prompts:
- Vague requests
- Missing context
- No constraints
- Open-ended questions
```

### Quality Optimization

**Code Review Checklist:**

```
Before accepting AI code:
- [ ] Understand what it does
- [ ] Check for security issues
- [ ] Verify error handling
- [ ] Test edge cases
- [ ] Ensure it follows conventions
- [ ] Run tests
- [ ] Document if complex
```

**Test Quality:**

```
Ensure tests cover:
- Happy path (normal operation)
- Boundary values (min/max)
- Null/undefined inputs
- Error conditions
- Edge cases
- Integration points
```

**Security Best Practices:**

```
Always check for:
- Input validation
- SQL/NoSQL injection
- XSS vulnerabilities
- CSRF protection
- Authentication/authorization
- Secret management
- Dependency vulnerabilities
```

### Workflow Optimization

**Time Management:**

```
Task Type | Time Allocation
-----------|---------------
Small bug fix | 15-30 min
Small feature | 1-2 hours
Medium feature | 2-4 hours
Large refactor | Phase-based

Breakdown per task:
- Context: 10-15%
- Plan: 20-25%
- Code: 40-50%
- Test: 15-20%
- Review: 10%
```

**Iteration Strategy:**

```
If stuck:
1. Count attempts (stop after 2)
2. Ask for explanation (not just fix)
3. Start fresh chat
4. Provide better context
5. Narrow the question

Never:
- Say "try again" repeatedly
- Accept code you don't understand
- Skip context loading
- Skip planning
```

### Team Optimization

**Onboarding:**

```
New team members:
1. Teach the 6-step workflow
2. Provide project context files
3. Set up AI tools
4. Practice with small tasks
5. Review first few tasks together
```

**Best Practices:**

```
Team guidelines:
- Everyone follows same workflow
- Share prompt templates
- Document AI-generated code
- Review all AI changes
- Use version control strictly
- Track AI-related issues
```

---

## Multi-Tool Strategies

### When to Use Multiple Tools

**Complex Feature Development:**

```
1. ChatGPT - High-level architecture and design
2. Cursor - Implementation with repo context
3. Claude - Comprehensive test generation
4. CodeRabbit - Automated PR review
5. ChatGPT - Documentation and summary
```

**Bug Debugging:**

```
1. Cursor - Load context and error
2. ChatGPT - Explain root cause
3. Claude - Provide detailed fix
4. Cursor - Apply fix inline
5. Claude - Write regression test
```

**Code Refactoring:**

```
1. Claude - Analyze current code
2. ChatGPT - Propose refactoring plan
3. Cursor - Implement step by step
4. CodeRabbit - Review changes
5. Claude - Verify behavior preserved
```

### Tool Combinations

**Planning + Coding:**

```
1. ChatGPT (Planning Mode):
   "Plan the implementation of [feature]
    Consider edge cases, security, performance"

2. Cursor (Implementation Mode):
   "Implement Step 1 from the plan:
    [paste step]
    Follow these patterns: [paste examples]"
```

**Coding + Testing:**

```
1. Cursor (Coding Mode):
   "Implement [function] following these rules:
    - Use async/await
    - Handle errors gracefully
    - Return { success, data/error } format"

2. Claude (Testing Mode):
   "Write comprehensive tests for this code:
    - Happy path
    - Edge cases (null, undefined, empty)
    - Error paths
    - Boundary conditions"
```

**Review + Explanation:**

```
1. CodeRabbit (Automated Review):
   "Review this PR for:
    - Security issues
    - Performance problems
    - Code quality"

2. ChatGPT (Explanation Mode):
   "Explain the changes in this PR:
    - What was changed and why?
    - What are the trade-offs?
    - How are tests verifying correctness?"
```

### Seamless Integration

**Workflow Template:**

```
# Multi-Tool AI Coding Workflow Template

## Phase 1: Context (5-10 min)
Tool: Cursor/VS Code/Claude Code
- Load README.md
- Load AGENTS.md
- Load relevant source files
- Summarize context

## Phase 2: Planning (10-20 min)
Tool: ChatGPT/Claude
- Describe task
- Create detailed plan
- List edge cases
- Get approval

## Phase 3: Implementation (30-60 min)
Tool: Cursor/VS Code
- Implement step by step
- Follow plan exactly
- Use inline suggestions
- Review each change

## Phase 4: Review (10-15 min)
Tool: CodeRabbit + Manual
- Create PR
- Automated review
- Manual review
- Address feedback

## Phase 5: Testing (15-30 min)
Tool: Claude/ChatGPT
- Write comprehensive tests
- Run tests
- Fix failures
- Verify coverage

## Phase 6: Iteration (10-20 min)
Tool: Any tool
- Debug issues
- Refine code
- Document changes
- Final review

Total Time: 1.5-2.5 hours for medium feature
```

**Handoff Strategy:**

```
From planning to implementation:
- Copy approved plan
- Paste into Cursor chat
- "Implement Step 1 from this plan:
  [paste plan]
  Follow these patterns: [paste examples]"

From implementation to testing:
- Copy implemented code
- Paste into Claude chat
- "Write tests for this code:
  [paste code]
  Follow testing framework: [Jest]
  Cover: happy path, edge cases, errors"

From testing to review:
- Create PR
- CodeRabbit automatically reviews
- Address CodeRabbit comments
- Request human review
```

---

## Troubleshooting Tool Issues

### Common Problems

**Tool Not Responding:**

```
1. Check API key/subscription
2. Verify internet connection
3. Check tool status page
4. Restart the tool
5. Clear cache/context
```

**Poor Code Quality:**

```
1. Improve context (add more files)
2. Be more specific in prompts
3. Provide examples
4. Switch to smarter model
5. Break task into smaller steps
```

**Context Drift:**

```
1. Start fresh conversation
2. Clear context
3. Reload files
4. Summarize state
5. Continue from summary
```

**Model Limitations:**

```
1. Switch to different model
2. Combine multiple tools
3. Provide more context
4. Use human review
5. Consult documentation
```

---

## Advanced Techniques

### Custom Workflows

**Automated Testing Workflow:**

```
1. Implement code
2. Automatically generate tests with Claude
3. Run tests
4. If fail → Debug with Cursor
5. If pass → Review with CodeRabbit
6. Merge if all approved
```

**CI/CD Integration:**

```
1. Code changes pushed to PR
2. Automated tests run
3. CodeRabbit reviews changes
4. Security scan runs
4. Performance tests run
5. Human review triggered
6. Merge if all checks pass
```

**Learning Workflow:**

```
1. Ask AI to explain unfamiliar code
2. Request best practices
3. Ask for alternatives
4. Implement with guidance
5. Review AI's suggestions
6. Build mental models
```

### Continuous Improvement

**Track AI Effectiveness:**

```
Metrics to track:
- Time saved vs. manual coding
- Bug reduction rate
- Code quality improvements
- Test coverage increase
- Review time reduction

Adjust workflow based on metrics.
```

**Refine Prompts Over Time:**

```
Keep prompt library:
- Effective prompts that work
- Prompt patterns to reuse
- Tool-specific optimizations
- Project-specific templates

Update prompts as you learn.
```

**Share with Team:**

```
Best practices:
- Document successful workflows
- Share prompt templates
- Create team guidelines
- Train new members
- Collect feedback
```

---

## Summary

### Key Takeaways

1. **Choose the Right Tool**: Use strengths of each tool
2. **Follow the Workflow**: All 6 steps matter
3. **Context is Critical**: Never skip context loading
4. **Plan Before Coding**: Always get approval first
5. **Test Immediately**: Tests verify and document
6. **Review Thoroughly**: Use both automated and manual review
7. **Iterate Wisely**: Reset when stuck, don't spiral
8. **Optimize Continuously**: Improve based on experience

### Quick Reference

| Step | Recommended Tool | Key Action |
|------|------------------|------------|
| 1. Context | Cursor/VS Code/Claude | Load files |
| 2. Plan | ChatGPT/Claude | Create plan, approve |
| 3. Code | Cursor/VS Code | Implement step by step |
| 4. Review | CodeRabbit + Manual | Check everything |
| 5. Test | Claude/ChatGPT | Write comprehensive tests |
| 6. Iterate | Any tool | Debug, explain, fix |

### Resources

- **Cursor**: https://cursor.sh
- **GitHub Copilot**: https://github.com/features/copilot
- **Claude Code**: https://claude.ai/code
- **CodeRabbit**: https://coderabbit.ai
- **Strict AI Coding Workflow**: See SKILL.md and resources/examples.md

---

For detailed workflow examples, see `examples.md`
For prompt templates, see `templates.md`
For troubleshooting issues, see `troubleshooting.md`
