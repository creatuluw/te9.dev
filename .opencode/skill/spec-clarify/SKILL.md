Read user's initial prompt
Determine complexity level:
  - Simple: Clear, well-defined request (0-1 question)
  - Medium: Some ambiguity (2-3 questions)
  - Complex: Vague or large scope (4-5 questions)
```

### 2. Ask Clarification Questions
```
Based on complexity, ask targeted questions:

For Simple requests (0-1 question):
  - Confirm understanding
  - Ask: "Do you want me to proceed with [summary]?"

For Medium requests (2-3 questions):
  - Clarify specific details (what/how)
  - Confirm scope/boundaries
  - Check for edge cases

For Complex requests (4-5 questions):
  - Clarify main objective
  - Define success criteria
  - Identify constraints/limitations
  - Ask about preferences/alternatives
  - Confirm timeline/priorities
```

### 3. Gather Answers
```
Wait for user response
Store each answer
Ask follow-up if needed (within 5 total)
```

### 4. Prepare Requirements Summary
```
Compile all information into:
  - Clear objective
  - Specific requirements
  - Acceptance criteria
  - Any constraints
  - Success metrics
```

### 5. Confirm with User
```
Present summary:
  "Based on our conversation, here's what I understand:
  
  Objective: [clear statement]
  Requirements: [bullet points]
  
  Is this correct? Should I proceed?"

Wait for confirmation before proceeding to spec-store.
```

## Question Guidelines

### Maximum 5 Questions Total
```
Question 1: Main objective clarification
Question 2: Specific details/implementation approach
Question 3: Scope/boundaries (what's included/excluded)
Question 4: Constraints/preferences
Question 5: Confirmation and final details
```

### Question Types to Use
```
- Open-ended for gathering information
  "What should happen when...?"
  "How do you want... to work?"
  
- Multiple choice for decisions
  "Which approach: A) X, B) Y, or C) Z?"
  
- Confirmatory for verification
  "So you want X to do Y, correct?"
```

### What NOT to Ask
```
- Technical implementation details (save for spec-execute)
- Irrelevant preferences
- Questions that can be assumed
- Anything beyond the 5-question limit
```

## Complexity Decision Tree

```
User Prompt
    ↓
Is it clear and specific?
    ↓ YES → Simple (0-1 question) → Confirm
    ↓ NO
Has ambiguity or needs detail?
    ↓ YES → Medium (2-3 questions) → Clarify → Confirm
    ↓ NO
Is it vague or large scope?
    ↓ YES → Complex (4-5 questions) → Deep dive → Confirm
```

## Example Workflows

### Example 1: Simple Request
```
User: "Add a login button to the homepage"

AI: Got it! I'll add a login button to your homepage. 
    Should it link to /login or open a modal?

User: Link to /login

AI: Perfect. I'll add a login button that links to /login on your homepage.
    Proceed? (y/n)
```

### Example 2: Medium Request
```
User: "Fix the bug with user registration"

AI: I'd like to clarify a few things:
    
    1. What specific issue are users experiencing with registration?
    
    2. When does this happen - during form submission, after submission, or elsewhere?
    
    3. Any error messages or specific reproduction steps?

User: [answers all 3 questions]

AI: Thanks! So I need to fix [summary of issue] that happens [when/where].
    Is that correct? Proceed?
```

### Example 3: Complex Request
```
User: "Create a dashboard"

AI: I need more details to help you best:
    
    1. What's the main purpose of this dashboard?
    
    2. What data should be displayed?
    
    3. Who are the target users?
    
    4. What actions should users be able to take?
    
    5. Any specific design preferences or constraints?

User: [answers all 5 questions]

AI: Excellent. I'll create a dashboard for [purpose] that displays [data] 
    for [users] with [actions]. Any preferences on layout?
    
User: No, you decide
    
AI: Great! I'll create the dashboard. Ready to proceed.
```

## Transition to Next Skill

After confirmation, automatically proceed to:
→ **spec-store** - Store the clarified requirements as a spec file

## Success Criteria
- User's request is fully understood
- All ambiguity is resolved
- Requirements are clear and actionable
- Maximum 5 questions asked
- User confirms understanding before proceeding

## Notes
- Be conversational and helpful
- Don't overwhelm the user
- If user says "just do it," proceed with what you have
- Store conversation in OpenMemory for context
- Always confirm before moving to spec-store