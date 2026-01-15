# te9.dev Workflow - Quick Reference Card

## Complete Development Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRD-DRIVEN DEVELOPMENT                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. INTERVIEW  →  Gather requirements (mandatory first step)        │
│                                                                     │
│  2. PLAN      →  Break into PRDs if needed (conditional)           │
│                                                                     │
│  3. CREATE    →  Generate PRD files and configuration              │
│                                                                     │
│  4. EXECUTE   →  Implement work                                    │
│                  ├─ Implement acceptance criteria                   │
│                  ├─ Test each criterion                            │
│                  ├─ Run unit tests 🧪                             │
│                  ├─ Verify 100% pass rate                         │
│                  └─ Create git commit ✍️                          │
│                                                                     │
│  5. TEST      →  Verify all criteria + all tests                 │
│                                                                     │
│  6. TRACK     →  Log completion + ask for push approval 👤         │
│                                                                     │
│  7. PUSH      →  Execute git push if approved ✅                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Critical Requirements Summary

### 🔴 UNIT TEST REQUIREMENTS

| Rule | Details |
|------|---------|
| **Pass Rate** | 100% required - NO exceptions |
| **Command** | `npm test` must run successfully |
| **Blocking** | Cannot proceed if ANY test fails |
| **Before Commit** | Tests must pass before git commit is created |
| **Zero Tolerance** | Cannot mark PRD as DONE with failing tests |

**Test Flow:**
```
Implementation → Unit Tests → 
┌─ PASS ✅ → Continue to Git Commit
└─ FAIL ❌ → Fix → Retry Tests → Repeat until PASS
```

### 🟢 GIT COMMIT & PUSH REQUIREMENTS

| Rule | Details |
|------|---------|
| **One Commit Per PRD** | Each PRD gets its own separate commit |
| **PRD ID Required** | Must include `[PRD-<id>]` in commit message |
| **Commit Format** | Conventional commits (feat/fix/refactor/etc.) |
| **Test Results** | Include "All unit tests passing (100%)" in message |
| **User Approval** | Never auto-push - always wait for approval |

**Commit Flow:**
```
Tests Pass → Auto-Commit Created → User Review → 
┌─ Approve → Push to Remote → Log Success
└─ Reject  → Commit Stays Local → Manual Push Later
```

## Commit Message Template

```bash
git commit -m "<type>: <PRD title> [PRD-<id>]

- Implemented all acceptance criteria
- All unit tests passing (100% pass rate)
- No regressions detected
- Code quality verified

PRD: PRD-<id>
Type: <type>
Priority: <priority>"
```

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code improvement
- `docs` - Documentation
- `test` - Test changes
- `chore` - Maintenance

## Approval Process

### When PRD Completes

**System Presents:**
```
✓ PRD ID: PRD-20250115-143022
✓ Commit Hash: a1b2c3d4e5f6...
✓ Files Changed: 5
✓ Test Results: 15/15 passing (100%)
✓ Message: "feat: Add user auth [PRD-20250115-143022]"

User Action Required:
Type "approve" to push, or "reject" to cancel.
```

### User Responses

| Response | Action | Result |
|----------|--------|--------|
| `approve` | Execute `git push` | Changes pushed to remote ✅ |
| `reject` | Cancel push | Commit stays local ⏸️ |

## Quick Checklist

### Before Completing PRD

- [ ] All acceptance criteria implemented
- [ ] Each criterion tested individually
- [ ] **All unit tests passing (100%)** ⚠️
- [ ] No regressions detected
- [ ] Code builds/compiles
- [ ] Code quality verified
- [ ] **Git commit created with PRD ID** ⚠️

### Before Approving Push

- [ ] Reviewed commit message
- [ ] Verified PRD ID is correct
- [ ] Checked files included in commit
- [ ] Confirmed test results in message
- [ ] Ready to deploy

## Critical Commands

```bash
# Run tests
npm test

# Check commit status
git status
git log -1 --oneline

# View commit details
git show HEAD

# Manual push (if needed)
git push origin <branch>

# Resolve conflicts
git pull
# (resolve conflicts)
git push
```

## Error Handling

### Tests Failing
```
❌ STOP IMMEDIATELY
→ Fix implementation
→ Re-run tests
→ Repeat until 100% pass rate
→ Cannot create commit until tests pass
```

### Push Fails
```
❌ Push Encountered Error
→ Check git remote: git remote -v
→ Verify authentication
→ Resolve conflicts: git pull
→ Retry push: git push
```

### User Rejects Push
```
✗ Push Cancelled by User
→ Commit remains local
→ Log: "Push declined by user"
→ Manual push available: git push
```

## Status Flow

```
PRD Status: TODO → IN_PROGRESS → DONE
                                              ↓
                                       Tests Must Pass
                                              ↓
                                    Git Commit Created
                                              ↓
                                  Awaiting User Approval
                                              ↓
                              ┌─────────────────┴─────────────────┐
                              │                                   │
                         APPROVE ✅                         REJECT ❌
                              │                                   │
                         Push to Remote                    Commit Stays Local
                              │                              Log Rejected
                           Log Success                       (Can push later)
```

## Golden Rules

### Unit Tests 🧪
1. **100% Pass Rate** - No test can fail
2. **Run Every Time** - Never skip `npm test`
3. **Fix Immediately** - Don't leave failing tests
4. **Zero Tolerance** - No exceptions, no compromises
5. **Before Commit** - Tests must pass before git commit

### Git Workflow ✍️
1. **One PRD = One Commit** - Never combine
2. **PRD ID Required** - Must include `[PRD-<id>]`
3. **User Approval** - Never auto-push
4. **Proper Format** - Follow conventional commits
5. **Include Tests** - Document test success in message

## Quick Reference Links

📖 **Full Documentation:**
- Unit Test Requirement: `../documentation/UNIT_TEST_REQUIREMENT.md`
- Git Commit & Push Workflow: `../documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md`

📋 **Quick References:**
- Git Commit Push Only: `./GIT_COMMIT_PUSH.md`
- Skills: `../skill/prd-execute/SKILL.md`, `../skill/prd-test/SKILL.md`, `../skill/prd-track/SKILL.md`

🎯 **Workflow:**
- Build Process: `../prompts/build.md`
- Zed Rules: `../../../.zed/rules/workflow.md`

## At a Glance

```
┌──────────────────────────────────────────────────────────┐
│         WORKFLOW IN ONE SENTENCE                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Implement → Test → All Pass ✅ → Commit → Approve ✅ →  │
│  Push ✅                                                  │
│                                                          │
│  If tests fail ❌: Fix → Retry → Continue                │
│                                                          │
│  If user rejects ❌: Commit stays local → Push later     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

**Remember:**
- 🧪 Tests MUST pass (100%) before any commit
- ✍️ Each PRD gets its own commit with PRD ID
- 👤 User approval REQUIRED before pushing
- ✅ Quality and control are non-negotiable