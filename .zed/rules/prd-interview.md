# PRD Interview Rule

This rule implements PRD Interview process documented at:
**[.opencode/skill/prd-interview/SKILL.md](../../.opencode/skill/prd-interview/SKILL.md)**

## What I Do

I conduct a structured interview to gather comprehensive requirements for new work.

**CRITICAL:** The first question asks for the work type. If "Single Prompt" is selected, I skip the entire PRD process and allow direct execution.

## Usage

Starting any work:
- New Project
- New Feature
- Refactor
- Bugfix
- Other (infrastructure, documentation, research)
- Single Prompt (quick execution without PRD)

Use: **@prd-interview I need to [description of work]**

## Interview Process

Follow the exact same steps documented in the canonical OpenCode skill:
1. **ASK FIRST:** "What type of work is this?"
   - Options: New Project, New Feature, Refactor, Bugfix, Other, Single Prompt
   - If **Single Prompt** → Skip PRD entirely, execute immediately
   - If **Other** options → Continue with 8 more questions
2. Ask remaining questions one-by-one (Title, Description, Acceptance Criteria, Priority, Dependencies, Technologies, Constraints, Notes)
3. Present detailed recap
4. Request user approval
5. Return structured JSON data

## Questions Summary

**Question 1 (FIRST):** What type of work is this?
- **New Project** → Creating entirely new application or system from scratch
- **New Feature** → Adding new functionality to existing system
- **Refactor** → Improving existing code structure or performance
- **Bugfix** → Fixing identified issues or defects
- **Other** → Infrastructure, documentation, research, or other work
- **Single Prompt** → Skip PRD, execute immediately

**What counts as "Single Prompt" (skip PRD, execute immediately):**
- User explicitly wants immediate execution
- Quick tasks that don't need PRD tracking
- Experimental builds or tests
- One-off questions or explanations

**Questions 2-9 (only if Question 1 is NOT Single Prompt):**
1. **Title** - Short, descriptive title (<10 words)
2. **Description** - Detailed explanation of what needs to be done
3. **Acceptance Criteria** - List specific, testable conditions
4. **Priority** - 1 (Highest) to 5 (Lowest)
5. **Dependencies** - Other work or systems this depends on
6. **Technologies** - Programming languages, frameworks, APIs, tools
7. **Constraints** - Risks, limitations, special considerations
8. **Notes** - Additional context or helpful information

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-interview/SKILL.md](../../.opencode/skill/prd-interview/SKILL.md)
- [.opencode/prompts/build.md](../../.opencode/prompts/build.md) - Workflow 2

## Next Steps

**If Question 1 = Single Prompt (Skip PRD):**
- Proceed directly to execute the request
- No PRD files needed
- Remember to query memory before responding

**If Question 1 = New Project/New Feature/Refactor/Bugfix/Other:**
After interview completes and is approved:
- If single PRD: Use **@prd-create**
- If large ask: Use **@prd-planning** then **@prd-create**