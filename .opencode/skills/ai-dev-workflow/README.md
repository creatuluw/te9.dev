# AI Development Workflow

## Installation

### Via skills.sh CLI

Install using the skills.sh package manager:

```bash
npx skills add creatuluw/agent-skills --skill ai-dev-workflow
```

### Manual Installation

1. Navigate to your skills directory (typically `.agents/skills/` or your configured skills folder)
2. Create a new directory called `strict-ai-coding-workflow`
3. Copy all skill files (`SKILL.md`, `resources/`) into this directory
4. Ensure `SKILL.md` is in the root directory

For more information on skills.sh CLI, visit https://skills.sh/docs

## Features

- **Context-First Approach**: Ensures AI has complete project background before coding to prevent hallucinations
- **Plan-Before-Code**: Enforces explicit planning and approval before generating any code
- **Multi-Agent Roles**: Splits work into Planner, Implementer, Tester, and Explainer roles for better output quality
- **Incremental Implementation**: Implements changes in small steps (5-30 minutes) with immediate verification
- **Test-Driven Workflow**: Writes tests immediately after code changes as both verification and documentation
- **Controlled Iteration**: Debugs with full context and resets conversations when stuck to avoid circular reasoning
- **Human-in-the-Loop**: Requires human approval at critical points for production-ready code
- **Review Layering**: Uses manual review, AI-assisted tools, linting, and security checks for comprehensive verification

## When to Use

Use this skill when you need to:

- **Code with AI reliability**: Prevent AI hallucinations and produce trustworthy code
- **Implement features**: Build new functionality with confidence through disciplined approach
- **Fix bugs**: Debug and resolve issues systematically without getting stuck in loops
- **Refactor code**: Improve code quality while maintaining behavior through testing
- **Onboard to codebases**: Understand unfamiliar code by following structured workflow
- **Maintain quality standards**: Ensure consistent, reviewable, and maintainable code
- **Reduce AI mistakes**: Follow proven patterns that prevent common AI coding failures

### Ideal Scenarios

- Implementing new features with multiple components
- Fixing complex bugs requiring investigation
- Refactoring existing code while preserving behavior
- Working in unfamiliar codebases or frameworks
- Building production-critical functionality
- Training teams on effective AI coding practices
- Onboarding engineers to AI-assisted development

## Usage

### Basic Workflow

The skill guides you through the 6-step AI coding workflow:

1. **Context**: Load project background, rules, and relevant code
2. **Plan**: Create and approve a detailed plan before coding
3. **Code**: Implement changes in small steps using multi-agent roles
4. **Review**: Carefully check output with multiple verification layers
5. **Test**: Write tests immediately after code changes
6. **Iterate**: Debug failures with full context and controlled iteration

### Example Invocation

```
User: I need to implement user authentication with JWT tokens

Strict AI Coding Workflow: I'll guide you through the strict AI coding workflow.

Step 1: Context
I'll read your project README and rules to understand your setup.
Do you have a README.md file? [yes/no]
```

### Phase-by-Phase Example

**Phase 1: Context Gathering**
```
Read README.md → Understand project stack and architecture
Read AGENTS.md → Learn coding conventions and rules
Read auth-related files → Identify existing auth implementation
```

**Phase 2: Planning**
```
User: Plan the JWT authentication implementation

AI (Planner Role): Here's my plan:
1. Install required dependencies (jsonwebtoken, bcrypt)
2. Create token generation utility
3. Implement login endpoint
4. Add authentication middleware
5. Write tests for each component

Edge cases: Token expiration, invalid tokens, missing credentials

User: approved
```

**Phase 3: Implementation**
```
AI (Implementer Role): Step 1 - Installing dependencies
I'll add jsonwebtoken and bcrypt to package.json...
[installs dependencies]
```

**Phase 4: Testing**
```
AI (Tester Role): Writing tests for token generation
- Happy path: Valid credentials generate valid token
- Edge case 1: Invalid credentials throw error
- Edge case 2: Token expires at correct time
```

**Phase 5: Review**
```
Reviewing generated code...
✓ Logic correct
✓ Error handling present
✓ Security best practices followed
✓ Tests cover edge cases
```

### Best Practices

- **Always start with context**: Never skip loading project files before coding
- **Plan before coding**: Always get plan approval before generating any code
- **Small steps**: Keep changes small (5-30 minutes) for easy review and rollback
- **Test immediately**: Write tests right after code changes, not as a separate phase
- **Use appropriate models**: Use reasoning models for planning/testing, faster models for implementation
- **Reset when stuck**: If fix doesn't work after 2 tries, start fresh with better context
- **Human oversight**: Always review code before merging, especially for production changes

### Multi-Agent Role Usage

**Planner**: Use for complex tasks requiring reasoning
```
Act as Planner. Break down [task] into steps, call out edge cases.
```

**Implementer**: Use for well-defined coding tasks
```
Act as Implementer. Follow approved plan. One step at a time.
```

**Tester**: Use for test generation
```
Act as Tester. Write tests covering happy path + edge cases.
```

**Explainer**: Use for summarizing changes
```
Act as Explainer. Summarize changes, explain logic, list risks.
```

### Debugging Workflow

When something breaks:

1. **Provide full context**:
   - Error message or stack trace
   - Function where error occurs
   - Surrounding code
   - Expected vs actual behavior

2. **Ask for explanation first**:
   ```
   Do not fix yet. Explain what this function does step by step.
   Then list likely failure cases.
   ```

3. **Request targeted fix**:
   ```
   Rewrite this function using best practices,
   keeping it efficient and readable.
   ```

4. **Reset if stuck**:
   - After 2 failed attempts, stop
   - Start fresh chat with better context
   - Restate problem with narrower focus

### Common Patterns

**Feature Implementation:**
Context → Plan → Implement (small steps) → Test → Review → Repeat

**Bug Fix:**
Context (error, logs, code) → Plan (explain root cause) → Fix → Regression test → Verify

**Refactoring:**
Context → Plan (preserve behavior) → Refactor (small steps) → Test (all existing tests pass) → Review

**New Codebase:**
Context (README, structure) → Plan (understand architecture) → Small feature → Learn → Scale

## Integration with AI Tools

This workflow works with any AI coding assistant:

- **Cursor**: Excellent for repo context and model switching
- **VS Code + Copilot**: Good for inline suggestions and chat
- **Claude Code**: Strong reasoning and context awareness
- **ChatGPT**: Good for planning and explanation phases
- **CodeRabbit**: Use for automated PR reviews

## Time Investment

| Task Type | Time with Workflow | Benefit |
|-----------|-------------------|---------|
| Simple bug fix | 15-30 min | Prevents regressions, includes tests |
| Small feature | 1-2 hours | Well-tested, documented, reviewable |
| Medium feature | 2-4 hours | Reliable, maintainable, safe |
| Large refactor | Phase-based | Controlled, verifiable, rollbackable |

The workflow adds overhead but dramatically reduces time spent fixing AI-generated bugs.

## Success Metrics

You're following the workflow correctly if:

- [ ] You always read project context before coding
- [ ] You always get plan approval before generating code
- [ ] You implement in small, verifiable steps
- [ ] You write tests immediately after code changes
- [ ] You review code before merging
- [ ] You reset conversations when stuck (after 2 failed attempts)
- [ ] You use appropriate AI models for different roles
- [ ] You maintain human oversight at critical points

## Learn More

For detailed examples, troubleshooting, and advanced patterns, see:
- `resources/examples.md` - Step-by-step workflow examples
- `resources/troubleshooting.md` - Common issues and solutions
- `resources/templates.md` - Reusable prompt templates
- `resources/tool-integration.md` - AI editor setup and optimization

## Origin

This skill is based on the AI development workflow described in ["I struggled to code with AI until I learned this workflow"](https://newsletter.systemdesign.one/p/ai-coding-workflow) from The System Design Newsletter.