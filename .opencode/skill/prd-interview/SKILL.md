---
name: prd-interview
description: Conduct structured interview for new work (New Project, Feature, Refactor, Bugfix, Other)
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: prd-creation
---

# PRD Interview Skill

## What I Do

I conduct a structured 9-question interview to gather comprehensive requirements for new work. This ensures all necessary information is captured before creating PRDs.

## When to Use Me

Use this when starting any new work:
- **New Project**: Creating an entirely new application or system from scratch
- **New Feature**: Adding new functionality to existing system
- **Refactor**: Improving existing code structure or performance
- **Bugfix**: Fixing identified issues or defects
- **Other**: Infrastructure, documentation, research, or other work

## Interview Questions

Ask these questions **one by one**, waiting for each answer before proceeding to the next.

### Question 1: Work Type
**What type of work is this?**
- Options: New Project, New Feature, Refactor, Bugfix, Other, Single Prompt
- If "New Project": Explain this is for creating an entirely new application or system from scratch
- If "Other": Ask for clarification
- If "Single Prompt": **SKIP THE ENTIRE PRD PROCESS**. Execute immediately as a single prompt. Return immediately with:
  ```json
  {
    "skipPRD": true,
    "reason": "Single prompt execution - skipping PRD process"
  }
  ```
- For all other options: Proceed to Question 2

**What counts as "Single Prompt" (skip PRD, execute immediately):**
- User explicitly wants immediate execution
- Quick tasks that don't need PRD tracking
- Experimental builds or tests
- One-off questions or explanations
- When user specifies "single prompt" option

### Question 2: Title
**What is a short, descriptive title for this work?**
- Keep it under 10 words
- Should be concise and clear

### Question 3: Detailed Description
**Provide a detailed description of what needs to be done.**
- Explain the problem or opportunity
- Describe the desired outcome
- Include any relevant context

### Question 4: Acceptance Criteria
**What are the acceptance criteria?**
- List specific, testable conditions that define success
- Ask "Any more?" until user indicates they're done
- Criteria should be clear and measurable

### Question 5: Priority Level
**What is the priority level?**
- Options: 1 (Highest), 2 (High), 3 (Medium), 4 (Low), 5 (Lowest)

### Question 6: Dependencies
**Are there any dependencies on other work or systems?**
- If yes: List them
- If no: Proceed

### Question 7: Technologies
**What technologies, frameworks, or tools are involved?**
- List programming languages, libraries, APIs, etc.

### Question 8: Constraints
**Are there any constraints, risks, or special considerations?**
- If yes: Explain
- If no: Proceed

### Question 9: Additional Notes
**Any additional notes or context that would be helpful?**
- If yes: Capture them
- If no: Proceed

## After Interview

### Present Recap (Only if Question 0 was "Yes")

Provide a detailed summary in this exact format:

```markdown
## WORK RECAP

**Type:** [Type from Q1]
**Title:** [Title from Q2]
**Priority:** [Priority from Q5]

**Description:**
[Description from Q3]

**Acceptance Criteria:**
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]
...

**Dependencies:**
[Dependencies from Q6 or "None"]

**Technologies:**
[Tech from Q7]

**Constraints & Notes:**
[Info from Q8-9 or "None"]
```

### Request Approval (Only if Question 0 was "Yes")

**DO YOU APPROVE CREATING THIS PRD?**
Type "yes" to proceed, or "no" to cancel.

**WAIT for user response.**

- If user says "no": Stop and inform them they can restart anytime
- If user says "yes": Return structured interview data for the next skill to process
- If user chose "Single Prompt" in Question 1: Return skip PRD response (already handled above)

## Return Data

### If Question 1 was "Single Prompt" (Skip PRD)
Return immediately with:
```json
{
  "skipPRD": true,
  "reason": "Single prompt execution - skipping PRD process"
}
```

### If work type was other option (New Project, Feature, Refactor, Bugfix, Other) and approved
Return this structured data:

```json
{
  "type": "work type from Q1",
  "title": "title from Q2",
  "description": "description from Q3",
  "acceptanceCriteria": ["criterion 1", "criterion 2", "..."],
  "priority": "number from Q5",
  "dependencies": "dependencies or null",
  "technologies": "tech or null",
  "constraints": "constraints or null",
  "notes": "notes or null"
}
```

## Important Notes

- **Ask questions one at a time** - don't overwhelm the user
- **Wait for approval** - never proceed without user confirmation
- **Be thorough** - ensure you capture all necessary information
- **Stay flexible** - adapt to the user's communication style
- **Document everything** - keep clear records of all responses

---

Ready to begin? Start with Question 1. And do all questions one by one as well as for sub-questions so the user can answer each question individually.

**IMPORTANT:** If user selects "Single Prompt" in Question 1, skip all remaining questions and return immediately with skipPRD flag.
