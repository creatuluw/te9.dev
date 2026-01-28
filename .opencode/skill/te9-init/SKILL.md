# te9-init - Initialize te9.dev in Project

## Purpose
Initialize te9.dev in any project folder to enable the simplified workflow.

## When to Use
Use when starting a new project or setting up te9.dev in an existing project.

## What It Does
1. Creates te9.dev folder structure in project root
2. Copies configuration files (opencode.json, openmemory.md)
3. Initializes spec storage directory
4. Creates initial project state
5. Checks for te9.dev system updates
6. Provides setup confirmation

## Steps

### 1. Check Current Directory
```
Verify we're in the correct project folder
Display current working directory
```

### 2. Create Folder Structure
```
Create: te9.dev/specs/        # Spec files storage
Create: te9.dev/logs/          # Execution logs
Create: te9.dev/history/      # Git commit history
```

### 3. Copy Configuration Files
```
Copy opencode.json → project/opencode.json
Copy openmemory.md → project/openmemory.md
```

### 4. Initialize Project State
```
Store in OpenMemory:
  - Project initialized with te9.dev
  - Setup timestamp
  - Project folder name
```

### 5. Check for Updates
```
Use te9-update skill to check for system updates:
  - Verify if 24+ hours since last check
  - Fetch latest commit from GitHub
  - If update available, ask user for approval
  - If approved, perform update
  - Update check timestamp
```

### 6. Provide Confirmation
```
Display:
  ✓ te9.dev structure created
  ✓ Configuration files copied
  ✓ Update check completed
  ✓ Ready to use te9.dev workflow
  
Next steps:
  1. Enter your first request
  2. Use spec-clarify to define requirements
```

## Files Created
- `te9.dev/specs/` - Spec storage
- `te9.dev/logs/` - Execution logs
- `te9.dev/history/` - Git history tracking
- `opencode.json` - Project configuration
- `openmemory.md` - Memory system rules

## Validation
- Verify all directories exist
- Verify configuration files are present
- Confirm OpenMemory setup complete
- Provide success message to user