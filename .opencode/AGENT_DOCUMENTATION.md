# OpenCode Agents

This directory contains agent definitions for specialized development workflows.

## Overview

Agents are specialized AI assistants that are configured for specific tasks and workflows. They allow you to create focused tools with custom prompts, models, and tool access.

## Available Agents

### @prd - PRD Creation Agent

**Purpose:** Defines new work by creating PRDs through the prd-interview and prd-create process.

**What it does:**
- Conducts structured interviews to gather requirements
- Creates PRDs for new features, bug fixes, refactors, and other development work
- Assesses complexity and suggests planning for large work
- NEVER implements code - only creates PRDs

**When to use:**
- When you need to define new work
- Before starting any development work
- When you want to document requirements formally

**Work types supported:**
- **New Project** - Creating entirely new application or system from scratch
- **New Feature** - Adding new functionality to existing system
- **Refactor** - Improving existing code structure or performance
- **Bugfix** - Fixing identified issues or defects
- **Other** - Infrastructure, documentation, research, or other work

**Process:**
1. Starts with work type question
2. Conducts 9-question interview (title, description, criteria, priority, dependencies, tech, constraints, notes)
3. Determines if planning is needed (for large work: >10 criteria, >500 words, or New Project)
4. Creates PRD files and updates database
5. Provides next steps guidance

**Output:**
- PRD file: `/dev/prd/runs/<prd-id>/PRD.md`
- Database entry: `/dev/prd/prd.json`
- Log file: `/dev/prd/logs/<prd-id>.md`
- Interview transcript: `/dev/interviews/<interview-id>.md`

---

### @work - Work Status & Guidance Agent

**Purpose:** Displays PRD status overview and guides user on starting work on existing PRDs.

**What it does:**
- Shows all active PRDs (non-DONE status)
- Analyzes log files for context on in-progress PRDs
- Provides guidance on how to start working on PRDs
- Recommends which PRD to work on next based on priority and dependencies
- NEVER creates PRDs or implements code - only reads and guides

**When to use:**
- When you want to see what work needs to be done
- When deciding which PRD to start next
- When checking the status of current work
- When you need guidance on starting PRD implementation

**Process:**
1. Loads PRD database from `/dev/prd/prd.json`
2. Filters active PRDs (TODO, IN_PROGRESS, FAILED, PAUSED, BLOCKED)
3. Reads and analyzes log files for each active PRD
4. Builds comprehensive status report
5. Provides starting guidance based on current state:
   - **IN_PROGRESS PRDs:** Shows last activity, what's remaining, offers execution/testing options
   - **TODO PRDs:** Recommends which to start with based on priority and dependencies
   - **BLOCKED PRDs:** Displays blockers and what needs to be unblocked
   - **FAILED PRDs:** Displays errors and guidance for addressing failures
   - **PAUSED PRDs:** Asks if user wants to resume
   - **No active PRDs:** Directs user to @prd agent

**Output:**
- Active PRDs list with ID, title, status, priority
- Work status recap by priority and status
- Log insights from analysis
- Specific guidance on how to start working

---

## How Agents Fit Into the Workflow

### Session Flow

```
1. BUILD Agent Starts
   └─ Queries memory (mandatory)
   └─ Asks user orientation: "Create PRDs" or "Execute PRDs?"

2. If "Create PRDs"
   └─ Invokes @prd agent
   └─ Agent handles full interview and creation process
   └─ Returns with new PRD(s)

3. If "Execute PRDs"
   └─ Invokes @work agent
   └─ Agent displays PRD status and provides guidance
   └─ User can then execute specific PRDs
```

### Full Development Workflow

```
@prd (creates work)
  ├─ Interview → (Plan) → Create PRD files
  │
@work (shows status & guides)
  ├─ Display PRD status
  ├─ Analyze logs
  └─ Recommend which PRD to work on
  │
@prd-execute (implements)
  ├─ Implement acceptance criteria
  ├─ Run unit tests (must pass 100%) 🧪
  └─ Create git commit with PRD reference ✍️
  │
@prd-test (verifies)
  ├─ Test all criteria
  ├─ Check regressions
  └─ Confirm 100% test pass rate 🧪
  │
@prd-track (logs & pushes)
  ├─ Log completion
  ├─ Present commit for approval 👤
  └─ Execute git push if approved
```

## Agent Configuration

All agents are configured with markdown frontmatter in their respective `.md` files:

```yaml
---
name: agent-name
description: Brief description of agent's purpose
mode: subagent              # primary, subagent, or all
model: anthropic/claude-sonnet-4-20250514
temperature: 0.3           # Controls creativity: 0.0-1.0
permission:
  edit: allow/deny         # Edit file permissions
  write: allow/deny        # Write file permissions
  bash:
    "*": ask/allow/deny    # Bash command permissions
tools:
  read: true/false        # File read access
  write: true/false       # File write access
  edit: true/false        # File edit access
  bash: true/false        # Bash command access
---
```

## When to Use Directly vs. Via Build Agent

### Direct Invocation
Use `@agent-name` when:
- You know exactly what you want to do
- You want to skip the orientation question
- You're continuing work from a previous session

### Via Build Agent
Let the BUILD agent guide you when:
- You're unsure what to do next
- You want to see your overall workflow options
- You're starting a new session and need orientation

## Critical Rules

1. **@prd NEVER implements code** - Its job is ONLY to create PRDs
2. **@work NEVER creates PRDs or implements code** - Its job is ONLY to read and guide
3. **Always query memory first** - Before any agent invocation
4. **Store memory after important interactions** - For context continuity
5. **Follow PRD workflow** - Interview → (Plan) → Create → Execute → Test → Track

## Related Documentation

- **[.opencode/prompts/build.md](../prompts/build.md)** - Complete workflows including session orientation
- **[.opencode/skill/README.md](../skill/README.md)** - Skill implementations (interview, plan, create, execute, test, track)
- **[../AGENTS.md](../../AGENTS.md)** - Development standards and quick reference
- **[.zed/rules/README.md](../../.zed/rules/README.md)** - Zed integration

## Architecture

```
.opencode/
├── agent/
│   ├── prd.md              # PRD Creation Agent (@prd)
│   ├── work.md             # Work Status Agent (@work)
│   └── README.md           # This file
├── skill/
│   ├── prd-interview/      # Interview skill
│   ├── prd-plan/           # Planning skill
│   ├── prd-create/         # Creation skill
│   ├── prd-execute/        # Execution skill
│   ├── prd-test/           # Testing skill
│   └── prd-track/          # Tracking skill
└── prompts/
    └── build.md            # Master workflows
```

## Examples

### Example 1: Creating a New Feature

```
User: @prd
Agent: Welcome! What type of work do you want to define?
       1. New Project
       2. New Feature
       ...
User: New Feature
Agent: What is the working title for this work?
User: Add user authentication
...
[Full interview proceeds]
Agent: PRD created! PRD-20250115-143022: Add user authentication
       Use @work to start working on this PRD.
```

### Example 2: Checking Work Status

```
User: @work
Agent: # PRD Work Status Overview

       ## Active PRDs
       - PRD-20250115-143022: Add user authentication (IN_PROGRESS, Priority 1)
       - PRD-20250116-093000: Fix database timeout (TODO, Priority 1)

       ## How to Start Working
       ⚠️ Existing Work In Progress
       PRD-20250115-143022 is currently in progress.
       
       Options:
       - @prd-execute PRD-20250115-143022 - Continue working
       - @prd-test PRD-20250115-143022 - Test current work
       - @prd-track PRD-20250115-143022 - Track progress
```

### Example 3: Session Orientation via BUILD Agent

```
BUILD Agent: [Queries memory...]
             
             Welcome! I can help you in two ways:
             
             1. Create PRDs - Define new work by creating Product Requirement Documents
                - Use @prd agent to conduct interviews and create PRDs
                - Good for: New features, bug fixes, refactors, new projects
             
             2. Execute PRDs - Work on existing PRDs and implement features
                - Use @work agent to see status, then @prd-execute to implement
                - Good for: Continuing work on existing PRDs
             
             What would you like to do today? (Create PRDs / Execute PRDs)
```

## Troubleshooting

### PRD Agent Issues

**Issue:** Agent tries to implement code
- **Solution:** Check agent prompt - it should clearly state it ONLY creates PRDs

**Issue:** Agent skips interview
- **Solution:** Ensure "Single Prompt" work type is selected only when intended

**Issue:** PRD files not created
- **Solution:** Check directory permissions and ensure `/dev/prd/` structure exists

### Work Agent Issues

**Issue:** No PRDs found
- **Solution:** Use @prd agent to create PRDs first

**Issue:** Log files not read
- **Solution:** Ensure log files exist at `/dev/prd/logs/<prd-id>.md`

**Issue:** Guidance unclear
- **Solution:** Agent should provide specific next steps with agent names and commands

## Best Practices

1. **Start with @prd** when defining new work - don't skip documentation
2. **Use @work** before executing - understand your workload and priorities
3. **Follow the full workflow** - Create → Execute → Test → Track
4. **Read agent outputs carefully** - They contain important guidance and next steps
5. **Store memory** after important decisions for context continuity

## Version History

- **v1.0** - Initial agent system with @prd and @work agents
  - PRD Creation Agent for defining new work
  - Work Status Agent for guiding execution
  - Integration with existing skill system
  - Session orientation workflow in BUILD agent