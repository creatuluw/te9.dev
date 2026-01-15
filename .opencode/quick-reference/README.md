# Quick Reference Directory

This directory contains quick reference guides and cheat sheets for the te9.dev development workflow. These documents are designed to be fast to read and easy to scan during development.

## Available Quick References

### 🚀 [WORKFLOW_SUMMARY.md](./WORKFLOW_SUMMARY.md)
**Complete Development Workflow Card**

A comprehensive one-page reference that covers the entire PRD-driven development process:
- Complete workflow diagram
- Unit test requirements (100% pass rate)
- Git commit and push workflow
- Commit message templates
- Approval process steps
- Quick checklists
- Error handling scenarios
- Status flow diagram
- Golden rules for quality

**Use when:** You need to see the complete workflow at a glance or reference any part of the development process.

---

### ✍️ [GIT_COMMIT_PUSH.md](./GIT_COMMIT_PUSH.md)
**Git Commit and Push Workflow Reference**

Focused reference specifically for git operations:
- Commit message format and templates
- Commit types (feat, fix, refactor, etc.)
- Approval process flow
- Key rules and requirements
- Quick commands reference
- Common scenarios
- Troubleshooting guide
- Quick tips and checklists

**Use when:** You need quick information about git commits, push approval, or commit message formatting.

---

## How to Use These References

### For New Developers
1. Start with **WORKFLOW_SUMMARY.md** to understand the complete process
2. Refer to **GIT_COMMIT_PUSH.md** when you're ready to commit and push

### For Daily Development
1. Use **WORKFLOW_SUMMARY.md** for quick lookup of any workflow step
2. Use **GIT_COMMIT_PUSH.md** for commit message templates and approval process

### For Troubleshooting
1. Check **WORKFLOW_SUMMARY.md** for error handling scenarios
2. Check **GIT_COMMIT_PUSH.md** for git-specific troubleshooting

---

## Quick Navigation

| Need | Document |
|------|----------|
| Complete workflow overview | [WORKFLOW_SUMMARY.md](./WORKFLOW_SUMMARY.md) |
| Git commit format | [GIT_COMMIT_PUSH.md](./GIT_COMMIT_PUSH.md#commit-message-format) |
| Approval process | [WORKFLOW_SUMMARY.md](./WORKFLOW_SUMMARY.md#approval-process) or [GIT_COMMIT_PUSH.md](./GIT_COMMIT_PUSH.md#approval-process) |
| Test requirements | [WORKFLOW_SUMMARY.md](./WORKFLOW_SUMMARY.md#-unit-test-requirements) |
| Error handling | [WORKFLOW_SUMMARY.md](./WORKFLOW_SUMMARY.md#error-handling) |
| Commit templates | [GIT_COMMIT_PUSH.md](./GIT_COMMIT_PUSH.md#commit-message-format) |
| Quick commands | [GIT_COMMIT_PUSH.md](./GIT_COMMIT_PUSH.md#quick-commands) |

---

## Relationship to Full Documentation

These quick references are condensed versions of the comprehensive documentation:

| Quick Reference | Full Documentation |
|-----------------|-------------------|
| WORKFLOW_SUMMARY.md | `../documentation/UNIT_TEST_REQUIREMENT.md` + `../documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md` |
| GIT_COMMIT_PUSH.md | `../documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md` |

**Use quick references** for daily work and quick lookups.  
**Use full documentation** for detailed explanations, examples, and comprehensive coverage.

---

## Key Concepts

### 🔴 Unit Test Requirements
- **100% Pass Rate** - All tests must pass, no exceptions
- **Blocking** - Cannot proceed if any test fails
- **Before Commit** - Tests must pass before git commit is created

### 🟢 Git Commit and Push Requirements
- **One Commit Per PRD** - Each PRD gets its own separate commit
- **PRD ID Required** - Must include `[PRD-<id>]` in commit message
- **User Approval** - Never auto-push, always wait for user approval

---

## Getting Started

1. **New to te9.dev?** Start with [WORKFLOW_SUMMARY.md](./WORKFLOW_SUMMARY.md)
2. **Ready to commit?** Check [GIT_COMMIT_PUSH.md](./GIT_COMMIT_PUSH.md) for format
3. **Need help?** Refer to the troubleshooting sections in each document

---

## Tips for Efficient Use

- **Bookmark your most-used section** for instant access
- **Print** the workflow summary card for your desk
- **Keep the commit template handy** when working on PRDs
- **Use the checklists** before completing each step

---

## Quick Links to Parent Documentation

- **Full Unit Test Documentation:** `../documentation/UNIT_TEST_REQUIREMENT.md`
- **Full Git Workflow Documentation:** `../documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md`
- **Build Process:** `../prompts/build.md`
- **Skills:** `../skill/prd-execute/SKILL.md`, `../skill/prd-test/SKILL.md`, `../skill/prd-track/SKILL.md`

---

**Remember:** These quick references are designed for speed and clarity. For detailed explanations, examples, and edge cases, refer to the full documentation in the `../documentation/` directory.