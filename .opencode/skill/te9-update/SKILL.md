# te9-update

## Description

The te9-update skill manages checking for and applying updates to te9.dev on a project basis.

## When to Use

- Automatically on session initialization
- Manually when user requests update check

## Workflow Integration

This skill is called at the start of each session to ensure the te9.dev system is current.

## How It Works

1. Check if more than 24 hours have passed since the last update check for this project
2. If so, fetch the latest commit hash from GitHub
3. Compare with the stored local commit hash
4. If they differ (update available), ask the user for approval
5. If approved, execute the update command
6. Update the last check timestamp

## Rules

- **Daily Check Limit**: Only perform update check once per day per project
- **User Approval Required**: Never auto-update without explicit user approval
- **Storage**: Timestamps and commit hashes stored in `te9.dev/logs/`
- **Tool Usage**: Uses `te9-update.ts` tool for all operations
- **Error Tolerance**: If GitHub check fails, skip and try again next session

## Implementation Details

- Uses GitHub API to get latest commit from main branch
- Stores last check time in `.te9-last-update-check`
- Stores local commit hash in `.te9-local-commit`
- Update command: `curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update`

## Memory Integration

- Store successful updates in OpenMemory as semantic memory
- Log update events for project history
- Track update frequency for analytics

## Error Handling

- Network failures: Log and skip check
- Update failures: Log error, notify user, continue with current version
- File access errors: Use defaults and log warnings

## Dependencies

- Requires internet for GitHub API
- Requires Node.js for tool execution
- Requires write access to logs directory

---

**Fast. Simple. Easy.**