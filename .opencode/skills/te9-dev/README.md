# TE9.DEV - Spec-Driven Development Workflow

A complete spec-driven development workflow for AI agents, orchestrating requirements gathering, test-driven implementation, version control, and pull request management in a structured 6-step process.

## Installation

Install via skills.sh CLI:

```bash
npx skills add creatuluw/agent-skills --skill te9-dev
```

Or manually:
1. Copy the te9-dev skill directory to your `.agents/skills/` folder
2. Ensure `SKILL.md` is in the root directory
3. Verify all references are in the `references/` subdirectory

## Features

TE9.DEV provides a complete development workflow with:

- **Requirements Gathering**: Structured clarification with targeted questioning (max 5 questions)
- **Spec Storage**: Automatic spec ID generation and organized file management
- **Test-Driven Implementation**: Enforces TDD methodology with RED-GREEN-REFACTOR cycle
- **Version Control**: Automated branch creation, commit management, and push operations
- **Pull Request Management**: Comprehensive PR creation with reviewers, CI/CD integration, and status tracking
- **Progress Monitoring**: Real-time status tracking, execution logging, and reporting

### Workflow Steps

1. **Spec Clarify** - Gather and confirm requirements through targeted questioning
2. **Spec Store** - Save specifications with unique IDs and structured metadata
3. **Spec Execute** - Implement features using test-driven development
4. **Spec Branch Commit** - Create feature branches and commit changes
5. **Spec PR Create** - Generate pull requests with complete context
6. **Spec PR Review** - Provide PR for manual review and merge

### Included Reference Skills

The te9-dev skill includes comprehensive reference documentation:

- **spec-clarify.md** - Requirements gathering guidelines and question strategies
- **spec-store.md** - Spec file templates and storage structures
- **spec-execute.md** - Implementation guidance with TDD methodology
- **spec-branch-commit.md** - Git workflow and commit conventions
- **spec-pr-create.md** - Pull request creation and CI/CD integration
- **spec-pr-review.md** - Review process and merge procedures
- **spec-track.md** - Progress tracking and reporting
- **test-driven-development.md** - Complete TDD methodology and best practices
- **testing-anti-patterns.md** - Common pitfalls to avoid

## When to Use

Use te9-dev when:

- You want to build software with a structured, traceable process
- You need to implement features following test-driven development
- You want to manage development workflow from requirements to deployment
- You need to create pull requests with proper review processes
- You want to track progress through detailed execution logs
- You're working on projects that require git version control and PR reviews
- You need to implement features with clear acceptance criteria
- You want to maintain audit trails for all development work

### Ideal Use Cases

- **Feature Development**: Building new features with clear requirements and acceptance criteria
- **Bug Fixes**: Systematic fixing with test coverage and verification
- **Refactoring**: Improving code quality while maintaining behavior
- **API Development**: Creating endpoints with comprehensive testing
- **Database Changes**: Managing schema changes with migration tracking
- **Security Implementation**: Adding authentication, authorization, and security features

## Usage

### Starting the Workflow

To begin the te9.dev workflow, simply use the trigger command:

```bash
@te9.md
```

Or trigger by saying:

```
"start te9.dev workflow"
"begin spec-driven development"
"create a new spec"
```

### Basic Workflow Example

```
User: @te9.md

Agent: You've triggered the te9.dev workflow! Let's get started.

What would you like to build?

User: Add user authentication with email and password

Agent: Question 1/2: Should users be able to log in using social providers like Google or GitHub, or just email/password?

User: Just email/password for now

Agent: Question 2/2: Do you need password reset functionality in this initial implementation?

User: Not for now, we can add that later

Agent: Here's the requirements summary:
[...detailed summary...]

Is this correct? [yes/no]

[Workflow proceeds through all 6 steps automatically...]
```

### Tracking Progress

At any point during the workflow, you can check status:

```bash
@spec-track SPEC-20240115-1430-add-user-auth
```

This will show:
- Current workflow step
- Acceptance criteria status
- Execution log details
- Next steps

### Reviewing Execution Logs

View detailed execution logs:

```bash
cat te9.dev/logs/SPEC-20240115-1430-add-user-auth.log
```

Logs include timestamps, actions taken, test results, and status changes.

### Managing Multiple Specs

List all specifications:

```bash
cat te9.dev/specs/specs.json
```

Filter by status or priority:

```bash
jq '.specs[] | select(.status == "IN_PROGRESS")' te9.dev/specs/specs.json
```

## Workflow Enforcement

TE9.DEV enforces best practices:

✅ **Test-First Development**: Tests must be written before production code
✅ **Spec Traceability**: All commits reference spec IDs
✅ **Human Approval**: Requires approval for git operations
✅ **Comprehensive Testing**: Verifies all acceptance criteria
✅ **Documentation**: Maintains execution logs throughout
✅ **Code Review**: Facilitates collaborative review process

## Project Structure

The te9.dev skill creates and manages:

```
te9.dev/
├── specs/
│   ├── SPEC-<id>/
│   │   └── spec.md              # Individual specification
│   └── specs.json                # Specs registry
└── logs/
    ├── SPEC-<id>.log            # Execution logs
    └── completed/               # Archived logs
```

### Spec File Structure

Each spec.md includes:
- Meta information (ID, created date, status, priority)
- Original user request
- Clarified requirements
- Acceptance criteria with status
- Technical considerations
- Implementation plan
- Risk assessment
- Success metrics
- Status history

## Integration with Existing Workflows

TE9.DEV integrates seamlessly with:

- **Git**: Standard git workflow with branch protection
- **GitHub PRs**: Automatic PR creation and status tracking
- **CI/CD**: Monitors automated checks and test results
- **Testing Frameworks**: Works with any testing setup (Jest, Mocha, etc.)
- **Project Management**: Links to issues and milestones

## Best Practices

### For Developers

- **Start with te9.md** when beginning any new feature or bug fix
- **Answer questions clearly** during the clarification phase
- **Review the requirements summary** before proceeding
- **Check spec-track** for status updates anytime
- **Review pull requests** thoroughly before merging

### For Project Managers

- Use `@spec-track` to monitor progress across all active specs
- Review execution logs for detailed progress information
- Check specs.json for overall project status
- Use the dashboard command for high-level summaries

### For Code Reviewers

- Review PR descriptions for spec context
- Verify all acceptance criteria are met
- Check execution logs for implementation details
- Approve only when CI/CD checks pass

## Troubleshooting

### Workflow Interrupted

If the workflow is interrupted, resume with:

```bash
@spec-track SPEC-<id>
```

Review the last log entry to determine where to continue.

### Spec Not Found

Check the specs registry:

```bash
cat te9.dev/specs/specs.json
```

If the spec exists but file is missing, restore from versioning or recreate.

### CI/CD Failures

Check CI/CD status:

```bash
gh pr checks <pr-number>
```

View failure details:

```bash
gh run view <run-id> --log
```

## Contributing

To extend or improve te9.dev:

1. Reference the sub-skill documentation in `references/`
2. Follow the established patterns in SKILL.md
3. Update all relevant reference files
4. Test changes thoroughly
5. Update this README if adding new features

## Related Skills

- **skill-creator** - For creating new skills with proper structure
- **test-driven-development** - Deep dive into TDD methodology
- **find-skills** - For discovering other useful skills

## Support

For issues or questions about te9.dev:

1. Review the relevant reference documentation in `references/`
2. Check execution logs for detailed error information
3. Use `@spec-track` to understand current workflow state
4. Refer to the main SKILL.md for complete workflow details

## License

Complete terms in LICENSE.txt

---

**Ready to build better software?** Start with `@te9.md` and let the structured workflow guide your development process.