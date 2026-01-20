# AI Instructions File - January 15, 2025

## Summary
Created AI_INSTRUCTIONS.md to provide AI assistants with comprehensive guidance on installing and managing te9.dev in user projects.

## Created Files

### AI_INSTRUCTIONS.md
**Purpose:** Complete guide for AI assistants to help users with te9.dev installation and management

**What it contains:**
- What te9.dev is and how it works
- Installation commands for all platforms
- Update procedures
- Status checking
- Prerequisites and requirements
- Troubleshooting guidance
- Common scenarios with example conversations
- Platform-specific instructions
- Quick start guides

## Content Breakdown

### Installation Guide
- Step-by-step installation process
- Platform detection guidance
- Commands for Linux/macOS/Git Bash
- Commands for Windows CMD
- Commands for Windows PowerShell
- File verification steps
- Initialization instructions

### Update Instructions
- How to check for updates
- Update command for each platform
- What gets updated (files preserved)
- Backup creation details
- Verification steps

### Status Checking
- How to verify installation
- What status shows
- Interpretation of status output
- Troubleshooting incomplete installations

### Quick Start Example
Complete conversation flow example showing:
1. User requests te9.dev installation
2. AI provides platform-specific command
3. AI explains what gets installed
4. AI guides initialization
5. AI explains next steps

### Common Scenarios
#### Scenario 1: User wants to update
- AI provides update command
- Explains backup process
- Confirms data preservation

#### Scenario 2: User wants to check status
- AI provides status command
- Explains output interpretation
- Guides troubleshooting if needed

#### Scenario 3: User wants help
- AI shows all available commands
- Provides examples for each platform

## Updated Files

### opencode.json
**Change:** Added `AI_INSTRUCTIONS.md` to instructions array

**Before:**
```json
"instructions": ["openmemory.md"]
```

**After:**
```json
"instructions": ["openmemory.md", "AI_INSTRUCTIONS.md"]
```

**Impact:** AI assistants now automatically load AI_INSTRUCTIONS.md with every session, providing immediate access to te9.dev installation guidance.

## Content Structure

### Main Sections

1. **What is te9.dev?**
   - Overview of 6-step workflow
   - Purpose and benefits

2. **Quick Installation Commands**
   - Linux/macOS/Git Bash commands
   - Windows CMD commands
   - All 5 commands (install, update, status, version, help)

3. **Installation Process**
   - 5-step installation guide
   - Platform-specific instructions
   - Verification steps

4. **What Gets Installed**
   - 4 core files
   - 6 skills
   - 4 technical tools
   - Directory structure

5. **Updating te9.dev**
   - Update commands
   - Backup process explanation
   - What gets preserved

6. **Checking Status**
   - Status command
   - Output interpretation
   - Troubleshooting

7. **Quick Start Example**
   - Complete user/AI conversation
   - Step-by-step guidance
   - From request to working te9.dev

8. **Common Scenarios**
   - Update scenario
   - Status check scenario
   - Help scenario
   - Platform-specific variations

9. **Prerequisites**
   - Required tools and software
   - Platform-specific requirements
   - Installation links

10. **Troubleshooting**
    - Common issues and solutions
    - Platform-specific problems
    - Error handling

11. **Important Notes**
    - Notes for AI assistants
    - Notes for users
    - Best practices

12. **Additional Resources**
    - Links to documentation
    - Support channels
    - Issue tracking

## Benefits for AI Assistants

### Before This Change
AI assistants had to:
- Remember installation commands from README
- Look up platform-specific instructions
- Verify correct commands manually
- Troubleshoot user issues ad-hoc

### After This Change
AI assistants now have:
- Complete installation guide in one file
- All platform commands readily available
- Example conversations to reference
- Troubleshooting steps pre-written
- Platform detection guidance
- Common scenarios with responses

## Benefits for Users

### Faster Onboarding
- AI can immediately guide installation
- No searching through documentation
- Clear, platform-specific commands
- Example conversation flow

### Better Experience
- AI provides consistent guidance
- Platform-aware responses
- Proactive troubleshooting
- Clear next steps
- Context-aware support

### Fewer Errors
- AI knows exact commands
- Correct platform detection
- Proper prerequisites checking
- Verified command examples
- Known issues and solutions

## AI Assistant Integration

### Automatic Loading
AI_INSTRUCTIONS.md is automatically loaded via opencode.json:
```json
"instructions": ["openmemory.md", "AI_INSTRUCTIONS.md"]
```

This means:
- AI assistants load both files at session start
- Complete memory + installation guidance available
- No manual reference needed
- Immediate access to all instructions

### Usage by AI
AI assistants can now:
```javascript
// User asks: "How do I install te9.dev?"
// AI has AI_INSTRUCTIONS.md loaded and knows:

"Perfect! Here's how to install te9.dev in your project:

Step 1: Navigate to your project folder
cd your-project

Step 2: Run installation command

For Linux/macOS/Git Bash:
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install

For Windows Command Prompt:
te9 install

Step 3: Initialize te9.dev
In your OpenCode or Zed editor, run:
skill('te9-init')

This will create te9.dev/specs/ and te9.dev/logs/ folders.

Step 4: Start using te9.dev!
Enter your request, and I'll help you through the 6-step workflow.

Ready to get started?"
```

## Key Scenarios Covered

### Scenario: New User Installation
**User:** "I want to use te9.dev"
**AI:** Provides complete 4-step guide with platform-specific commands

### Scenario: Existing User Update
**User:** "Is there a newer version?"
**AI:** Provides update command, explains backup process

### Scenario: Status Check
**User:** "Check if te9.dev is installed"
**AI:** Provides status command, interprets output

### Scenario: Platform Unclear
**User:** "How do I install?"
**AI:** Detects platform or asks, provides appropriate commands

## Platform Support Matrix

| Platform | Bash Script | CMD Wrapper | AI Guide |
|----------|-------------|--------------|-----------|
| **Linux** | ✅ | N/A | ✅ |
| **macOS** | ✅ | N/A | ✅ |
| **Windows Git Bash** | ✅ | N/A | ✅ |
| **Windows CMD** | N/A | ✅ | ✅ |
| **Windows PowerShell** | N/A | ✅ | ✅ |

## Documentation Updates

### New File
- **AI_INSTRUCTIONS.md** - 390 lines of comprehensive AI guidance

### Updated File
- **opencode.json** - Added AI_INSTRUCTIONS.md to instructions array

## Impact Metrics

### Expected Improvements
- [ ] Faster user onboarding
- [ ] Fewer installation errors
- [ ] More consistent AI responses
- [ ] Better platform detection
- [ ] Improved troubleshooting success rate
- [ ] Reduced support requests
- [ ] Higher user satisfaction
- [ ] Faster issue resolution

## Related Changes

This change complements:
- Unified te9 command (bash script)
- Windows CMD wrapper (te9.cmd)
- Simplified workflow (6 steps, 6 skills)
- Cross-platform support
- One-line installation approach

## Technical Details

### File Size
- **AI_INSTRUCTIONS.md:** 390 lines
- **Sections:** 12 main sections
- **Scenarios:** 3 detailed scenarios
- **Commands:** Platform-specific for all operations
- **Examples:** Complete conversation flows

### Integration
- **Auto-loaded:** Via opencode.json instructions
- **Always available:** In every AI session
- **No manual lookup:** AI has context from start
- **Complementary:** Works with openmemory.md

## Best Practices Documented

### For AI Assistants
- Always detect platform before providing commands
- Provide both bash and Windows options when unclear
- Explain what each command does
- Wait for user confirmation
- Offer help if user seems stuck
- Check for prerequisites
- Provide troubleshooting for common issues

### For Users
- te9.dev is self-contained (no installation needed)
- No installation needed (just run command)
- Updates preserve data
- Cross-platform compatible
- Backups automatic
- Help always available

## Future Enhancements

Potential improvements to AI_INSTRUCTIONS.md:
- [ ] Interactive installation mode selection
- [ ] Advanced options guide
- [ ] Custom configuration scenarios
- [ ] Migration from old versions
- [ ] Uninstall guidance
- [ ] Performance optimization tips
- [ ] Integration examples with other tools
- [ ] Video tutorial links
- [ ] FAQ section

## Testing Checklist

- [ ] AI loads file correctly
- [ ] Commands are accurate
- [ ] Platform detection works
- [ ] All scenarios cover common cases
- [ ] Examples are realistic
- [ ] Troubleshooting is helpful
- [ ] Links are correct
- [ ] Format is consistent
- [ ] Content is comprehensive

## Summary

AI_INSTRUCTIONS.md provides AI assistants with a complete reference guide for helping users install and manage te9.dev. Key benefits:

✅ **Faster Onboarding:** AI can immediately guide installation
✅ **Platform Aware:** Commands for all platforms available
✅ **Scenario Based:** Common use cases with example conversations
✅ **Troubleshooting Ready:** Known issues and solutions documented
✅ **Auto-Loaded:** Available in every AI session via opencode.json
✅ **Comprehensive:** Covers installation, update, status, help, and troubleshooting
✅ **User Friendly:** Clear, step-by-step guidance
✅ **Cross-Platform:** Works on Linux, macOS, and Windows
✅ **Consistent:** AI responses are standardized and accurate

This significantly improves the user experience by enabling AI assistants to provide immediate, accurate, and helpful guidance for te9.dev installation and management.