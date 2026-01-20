# Installing te9.dev

Quick and easy installation using the unified `te9` command script.

## One-Line Installation

### Install te9.dev

```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

This works on:
- ✅ Linux
- ✅ macOS
- ✅ Windows (Git Bash - comes with Git for Windows)

### Windows CMD

For Windows Command Prompt (without Git Bash), use:

```cmd
REM Download te9.cmd to your project
REM Then run:

te9 install
te9 update
te9 status
te9 version
te9 help
```

**Note:** The `te9.cmd` command for Windows automatically:
- Downloads the bash script from GitHub
- Uses Git Bash (if installed) or WSL
- Provides same functionality as bash script

**Prerequisites:**
- Git for Windows (recommended): https://git-scm.com/download/win
- Or WSL (Windows Subsystem for Linux)
- PowerShell (for downloading files)

**To get te9.cmd:**
1. Download from: https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9.cmd
2. Save as `te9.cmd` in your project folder
3. Run: `te9 install`

### After Installation

Open your project in OpenCode or Zed, then run:

```
skill('te9-init')
```

This creates:
- `te9.dev/specs/` - Spec file storage
- `te9.dev/logs/` - Execution logs

## Available Commands

The `te9` script supports these commands:

| Command | Purpose |
|---------|---------|
| `install` | Install te9.dev in current directory |
| `update` | Update te9.dev to latest version |
| `status` | Check installation status |
| `version` | Show version information |
| `help` | Show help message |

### Usage Examples

```bash
# Install te9.dev
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install

# Update to latest version
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update

# Check installation status
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status

# Show version
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash version

# Show help
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash help
```

**Or on Windows CMD:**
```cmd
te9 install
te9 update
te9 status
te9 version
te9 help
```

## What Gets Installed

### Core Files (4)
- `opencode.json` - Configuration file
- `openmemory.md` - Memory system rules
- `README.md` - Project documentation
- `te9.md` - Workflow guide

### Skills (6)
- `te9-init/SKILL.md` - Initialize te9.dev
- `spec-clarify/SKILL.md` - Clarify requirements
- `spec-store/SKILL.md` - Store spec files
- `spec-execute/SKILL.md` - Implement and log
- `spec-commit/SKILL.md` - Commit and push
- `spec-track/SKILL.md` - Track progress

### Technical Tools (4)
- `daisyui.ts` - UI component templates
- `knowledge_graph.ts` - Memory graph exporter
- `melt.ts` - Svelte UI builder
- `uikit.ts` - UI component generator

### Directory Structure
```
your-project/
├── te9.dev/
│   ├── specs/          # Spec files
│   │   ├── SPEC-<id>/
│   │   │   └── spec.md
│   │   └── specs.json
│   └── logs/           # Execution logs
│       └── SPEC-<id>.log
├── .opencode/
│   ├── skill/          # All 6 skills
│   └── tool/           # Technical tools
├── opencode.json       # Configuration
└── openmemory.md      # Memory rules
```

## Updating te9.dev

### Update to Latest Version

```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update
```

The update process:
1. ✅ Creates automatic backup (`.te9-backup-TIMESTAMP`)
2. ✅ Downloads latest files from GitHub
3. ✅ Preserves your specs and logs
4. ✅ Updates all skills and tools
5. ✅ Verifies the update
6. ✅ Rollback on failure

## Checking Status

### Verify Installation

```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status
```

Shows:
- ✅ Required files presence
- ✅ Technical tools status
- ✅ Directory structure
- ✅ Spec and log counts
- ✅ Git repository status

## Quick Start

### 1. Install te9.dev

```bash
cd your-project
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

### 2. Initialize in Project

Open your project in OpenCode or Zed, then run:

```
skill('te9-init')
```

### 3. Start Using te9.dev

Enter your request to the AI:

```
Add a login button
```

The AI will:
- Ask clarification questions (if needed)
- Create spec file
- Implement the button
- Create commit
- Ask for approval to push

### 4. Track Progress Anytime

```
spec-track
```

## Requirements

- OpenCode or Zed editor with MCP support
- Git repository (auto-initialized if missing)
- `curl` command (for downloading)
- Bash shell (Linux/macOS/Windows Git Bash)

## Troubleshooting

### Issue: Command Not Found

**Solution:** Make sure you're using the full curl command:
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

### Issue: Permission Denied

**Solution:** Ensure you have write permissions in the current directory:
```bash
# Check permissions
ls -la

# Fix permissions if needed
chmod u+w .
```

### Issue: Git Not Installed

**Solution:** Install Git first:
- **Linux:** `sudo apt install git` (Ubuntu/Debian)
- **macOS:** `xcode-select --install`
- **Windows:** Download from https://git-scm.com

### Issue: Installation Fails

**Solution:** Check your internet connection and try again:
```bash
# Test connectivity
curl -I https://github.com

# Retry installation
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

### Issue: Windows CMD - te9 Command Not Found

**Solution:** Make sure `te9.cmd` is in your project folder:
```cmd
REM Check if te9.cmd exists
dir te9.cmd

REM If not, download it:
REM 1. Go to: https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9.cmd
REM 2. Save as: te9.cmd
REM 3. Run: te9 install
```

### Issue: Windows CMD - Git Bash Not Found

**Solution:** Install Git for Windows or use WSL:

**Option 1 - Install Git for Windows (Recommended):**
1. Download from: https://git-scm.com/download/win
2. Run installer with default options
3. Restart Command Prompt
4. Run: `te9 install`

**Option 2 - Use WSL:**
```cmd
REM Enable WSL
wsl --install

REM Restart your computer

REM Then use WSL bash
wsl bash -c "cd %CD% && curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install"
```

### Issue: Windows CMD - PowerShell Download Fails

**Solution:** The `te9.cmd` script will automatically fall back to PowerShell if curl is not available. If PowerShell fails:

1. Check internet connection
2. Verify PowerShell execution policy:
```cmd
powershell -Command "Get-ExecutionPolicy"
```
3. If restricted, allow running scripts temporarily:
```cmd
powershell -Command "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass"
```
4. Retry: `te9 install`

### Issue: Update Fails

**Solution:** Your backup is automatically created. Check the backup directory:
```bash
ls -la .te9-backup-*/
```

Restore from backup if needed.

## Next Steps

After installation:

1. ✅ Verify installation: `curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status`
2. ✅ Initialize: Run `skill('te9-init')` in your editor
3. ✅ Start working: Enter your first request
4. ✅ Track progress: Use `spec-track` anytime

For detailed workflow information, see:
- `README.md` - Quick start and overview
- `te9.md` - Complete workflow guide

## Support

- GitHub: https://github.com/creatuluw/te9.dev
- Issues: https://github.com/creatuluw/te9.dev/issues