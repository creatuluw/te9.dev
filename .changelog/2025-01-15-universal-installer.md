# Universal Installer - January 15, 2025

## Summary
Created universal bash installer and updater scripts for cross-platform installation and updates of te9.dev assets.

## New Scripts

### install.sh
**Purpose**: One-line installation of te9.dev in any project folder

**Usage**:
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/install | bash
```

**Features**:
- Cross-platform support (Linux, macOS, Windows Git Bash)
- Automatic platform detection
- Downloads all files from GitHub
- Creates complete directory structure
- Verifies installation
- Git repository check and initialization

**What it installs**:
- Core files: opencode.json, openmemory.md, README.md, te9.md
- All 6 skills: te9-init, spec-clarify, spec-store, spec-execute, spec-commit, spec-track
- Technical tools: daisyui.ts, knowledge_graph.ts, melt.ts, uikit.ts
- Directory structure: te9.dev/specs/, te9.dev/logs/, .opencode/skill/, .opencode/tool/

### update.sh
**Purpose**: Update te9.dev to latest version from GitHub

**Usage**:
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/update | bash
```

**Features**:
- Automatic backup of existing files (.te9-backup-TIMESTAMP)
- Preserves user's specs and logs
- Downloads latest versions from GitHub
- Creates new directories if needed
- Rollback on download failure
- Verification of update

**What it updates**:
- All core configuration files
- All skill files
- All technical tools
- Preserves: te9.dev/specs/, te9.dev/logs/, te9.dev/specs.json

### status.sh
**Purpose**: Check te9.dev installation status and verify all components

**Usage**:
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/status | bash
```

**Features**:
- Platform detection
- Checks all required files
- Checks optional technical tools
- Verifies directory structure
- Counts specs and logs
- Git status check
- Clear status indicators (✅ present, ❌ missing)

**Reports**:
- Required files (8 files)
- Technical tools (4 tools)
- Project structure
- Git repository status
- Spec and log counts
- Installation summary

## Cross-Platform Support

All scripts work on:
- **Linux**: Native bash support
- **macOS**: Native bash support
- **Windows**: Git Bash (installed with Git for Windows)

Platform detection:
```bash
case "$(uname -s)" in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="macos";;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows";;
esac
```

## Installation Flow

### For New Users

1. Navigate to project folder
2. Run one-line installer:
   ```bash
   curl -fsSL https://github.com/creatuluw/te9.dev/install | bash
   ```
3. Script downloads all files from GitHub
4. Creates directory structure
5. Verifies installation
6. Ready to use

### For Updates

1. Navigate to project folder
2. Run updater:
   ```bash
   curl -fsSL https://github.com/creatuluw/te9.dev/update | bash
   ```
3. Script backs up existing files
4. Downloads latest versions
5. Preserves specs and logs
6. Verifies update
7. Ready to continue

### For Status Check

1. Navigate to project folder
2. Run status check:
   ```bash
   curl -fsSL https://github.com/creatuluw/te9.dev/status | bash
   ```
3. Script checks all components
4. Shows detailed status report
5. Provides next steps

## File Downloads

All scripts download from:
```
https://raw.githubusercontent.com/creatuluw/te9.dev/main/
```

**Core Files (4)**:
- opencode.json
- openmemory.md
- README.md
- te9.md

**Skill Files (8)**:
- .opencode/skill/README.md
- .opencode/skill/te9-init/SKILL.md
- .opencode/skill/spec-clarify/SKILL.md
- .opencode/skill/spec-store/SKILL.md
- .opencode/skill/spec-execute/SKILL.md
- .opencode/skill/spec-commit/SKILL.md
- .opencode/skill/spec-track/SKILL.md

**Tool Files (4)**:
- .opencode/tool/daisyui.ts
- .opencode/tool/knowledge_graph.ts
- .opencode/tool/melt.ts
- .opencode/tool/uikit.ts

## Directory Structure Created

```
project/
├── .opencode/
│   ├── skill/
│   │   ├── te9-init/
│   │   ├── spec-clarify/
│   │   ├── spec-store/
│   │   ├── spec-execute/
│   │   ├── spec-commit/
│   │   ├── spec-track/
│   │   └── README.md
│   └── tool/
│       ├── daisyui.ts
│       ├── knowledge_graph.ts
│       ├── melt.ts
│       └── uikit.ts
├── te9.dev/
│   ├── specs/
│   │   └── SPEC-<id>/
│   │       └── spec.md
│   ├── logs/
│   │   └── SPEC-<id>.log
│   └── specs.json
├── opencode.json
└── openmemory.md
```

## Error Handling

### Download Failures
- Stops on first failure
- Shows clear error message
- Doesn't leave partial installation

### Update Failures
- Automatic rollback from backup
- Preserves previous working state
- Shows detailed error messages

### Verification Failures
- Lists missing files
- Provides fix instructions
- Doesn't proceed if incomplete

## User Experience

### Simplicity
- One command to install
- One command to update
- One command to check status
- No complex configuration
- Works across platforms

### Safety
- Automatic backups on update
- Verification after install
- Rollback on failure
- Clear status indicators
- Git repository check

### Feedback
- Color-coded output (✅ success, ❌ error, ⚠️ warning, ℹ️ info)
- Progress messages for each step
- Clear next steps after completion
- Detailed error messages

## Documentation Updates

### README.md
Updated installation section with:
- One-line install command
- Update command
- Status check command
- Cross-platform note
- Removed complex copy instructions

### Removed
- INSTALL.md - No longer needed (one-line install is simpler)
- Complex installation scripts directory

## Benefits

### For Users
- **Faster**: One command instead of multiple copy operations
- **Easier**: No manual file management
- **Safer**: Automatic backups and verification
- **Universal**: Same command works on all platforms
- **Maintainable**: Easy to update to latest version

### For Development
- **Simpler**: Single source of truth (GitHub repo)
- **Faster**: Push updates instantly available
- **Reliable**: No version mismatch issues
- **Trackable**: Can see installation status anytime
- **Automatic**: Users can stay up-to-date easily

## Testing Recommendations

Test on:
- [ ] Linux (Ubuntu/Debian)
- [ ] Linux (CentOS/Fedora)
- [ ] macOS (Intel)
- [ ] macOS (Apple Silicon)
- [ ] Windows (Git Bash)
- [ ] Windows (MSYS2)
- [ ] Windows (Cygwin)

## Future Enhancements

Potential improvements:
- [ ] Version checking before install/update
- [ ] Interactive mode for advanced users
- [ ] Selective component installation
- [ ] Uninstall script
- [ ] Migration tool from old versions
- [ ] Integration tests for all platforms

## Impact

This universal installer makes te9.dev significantly more accessible and maintainable. Users can now install, update, and check status with simple one-line commands that work across all major platforms.