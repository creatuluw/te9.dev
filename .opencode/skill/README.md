# OpenCode Skills for the te9-method

This directory contains OpenCode Skills that implement the te9-method's PRD-driven development workflow. These skills enable AI agents to conduct structured interviews, create PRDs, execute work, test criteria, and track progress.

## Installation

Copy the entire skill folders to your project:

```bash
# Copy all skills to your project's .opencode directory
cp -r opencode-skills/* <your-project>/.opencode/skill/
```

Your project structure should look like:

```
.your-project/
├── .opencode/
│   └── skill/
│       ├── prd-interview/
│       │   └── SKILL.md
│       ├── prd-plan/
│       │   └── SKILL.md
│       ├── prd-create/
│       │   └── SKILL.md
│       ├── prd-execute/
│       │   └── SKILL.md
│       ├── prd-test/
│       │   └── SKILL.md
│       └── prd-track/
│           └── SKILL.md
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `prd-interview` | Conduct structured 9-question interview for new work |
| `prd-plan` | Break large asks into multiple well-sized PRDs |
| `prd-create` | Generate PRD files, update database, create run folders |
| `prd-execute` | Implement work on a specific PRD |
| `prd-test` | Verify all acceptance criteria with tests |
| `prd-track` | Log progress, achievements, and issues |

## Quick Start Examples

### Example 1: Simple Feature (Single PRD)

**Your prompt:**
```
I need to add user authentication to my webapp
```

**Agent workflow:**
1. Calls `skill("prd-interview")` → Conducts 9-question interview
2. Gets your approval on the recap
3. Calls `skill("prd-create")` → Generates PRD files
4. Calls `skill("prd-execute")` → Implements authentication
5. Calls `skill("prd-test")` → Runs tests and verifies criteria
6. Calls `skill("prd-track")` → Updates logs and marks PRD as DONE

### Example 2: Large Project (Multiple PRDs)

**Your prompt:**
```
I want to create an e-commerce platform with shopping cart, checkout, and payment processing
```

**Agent workflow:**
1. Calls `skill("prd-interview")` → Conducts interview
2. Recognizes it's a large ask (10+ criteria, complex description)
3. Calls `skill("prd-plan")` → Creates multi-PRD plan:
   - PRD-001: Database schema & product models
   - PRD-002: Shopping cart functionality
   - PRD-003: Checkout system
   - PRD-004: Payment integration
   - PRD-005: Testing & deployment
4. Gets your approval on the plan
5. Calls `skill("prd-create")` → Generates all PRD files
6. For each PRD in order:
   - Calls `skill("prd-execute")` → Implements work
   - Calls `skill("prd-test")` → Tests and verifies
   - Calls `skill("prd-track")` → Updates progress
7. Summarizes all completed work

### Example 3: Bugfix

**Your prompt:**
```
There's a bug where the login form doesn't validate email format
```

**Agent workflow:**
1. Calls `skill("prd-interview")` with type "Bugfix"
2. Gets approval on the bugfix PRD
3. Calls `skill("prd-create")` → Generates bugfix PRD
4. Calls `skill("prd-execute")` → Fixes the email validation
5. Calls `skill("prd-test")` → Verifies fix works, checks for regressions
6. Calls `skill("prd-track")` → Logs completion

## Configuration

Optional: Configure skill permissions in `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow"
    }
  }
}
```

## Project Structure

The skills expect this structure (the te9-method will create if missing):

```
your-project/
├── dev/
│   ├── prd/
│   │   ├── prd.json              # PRD database
│   │   ├── runs/                 # PRD execution folders
│   │   │   └── <prd-id>/
│   │   │       ├── <prd-id>.json
│   │   │       ├── <prd-id>-prompt.md
│   │   │       └── <prd-id>-config.json
│   │   └── logs/                 # PRD progress logs
│   │       └── <prd-id>.md
│   └── interviews/               # Interview transcripts
│       └── <interview-id>.md
```

## Skill Dependencies

Skills follow this dependency order:

```
prd-interview (gather requirements)
    ↓
prd-plan (optional: chunk large asks)
    ↓
prd-create (generate PRD files)
    ↓
prd-execute (implement work)
    ↓
prd-test (verify criteria)
    ↓
prd-track (log progress)
```

## Benefits

✅ **Modular**: Each skill has a single, focused responsibility  
✅ **Reusable**: Skills can be used in different workflows  
✅ **Automated**: Agent orchestrates the entire process  
✅ **Tracked**: Complete history of all work done  
✅ **Tested**: Every PRD is verified with tests  

## Need Help?

- Review individual skill documentation in each `SKILL.md` file
- Check the generated PRD files in `/dev/prd/runs/<prd-id>/`
- Monitor progress in `/dev/prd/logs/<prd-id>.md`

Happy coding with the te9-method's OpenCode Skills! 🚀