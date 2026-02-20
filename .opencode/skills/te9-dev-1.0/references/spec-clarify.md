# Spec Clarify - Requirements Gathering

## Purpose

Gather and clarify requirements through targeted questioning to ensure complete understanding before implementation.

## When to Use

Use this reference when executing Step 1 of the TE9.DEV workflow to:
- Understand what the user wants to build
- Clarify ambiguous requirements
- Identify constraints and assumptions
- Determine scope and complexity
- Prepare a complete requirements summary

## Complexity Assessment

### Simple (0-1 question)

**Characteristics:**
- Clear, well-defined request
- Single feature or bug fix
- No integrations or dependencies
- Familiar domain

**Examples:**
- "Add a search bar to the homepage"
- "Fix the login button styling"
- "Change the default sort order"

**Questions to Ask:**
- Just confirm understanding: "So you want to add a search bar that filters items by name, correct?"

### Medium (2-3 questions)

**Characteristics:**
- Multiple features or components
- Some integration requirements
- Multiple user flows
- Some ambiguity in requirements

**Examples:**
- "Implement user authentication with Google and GitHub"
- "Create a dashboard with charts and data filtering"
- "Build a shopping cart with checkout flow"

**Questions to Ask:**
1. "Question 1/3: Should users be able to link multiple OAuth accounts, or just one?"
2. "Question 2/3: What information should be stored when users authenticate (name, email, avatar, etc.)?"
3. "Question 3/3: Should we handle token refresh automatically, or do you have specific requirements there?"

### Complex (4-5 questions)

**Characteristics:**
- Large feature spanning multiple systems
- Significant architectural changes
- Multiple integrations with external services
- Performance or security critical
- Unclear or evolving requirements

**Examples:**
- "Build a real-time collaboration system with document editing"
- "Create a microservices architecture with event sourcing"
- "Implement a multi-tenant SaaS platform with RBAC"

**Questions to Ask:**
1. "Question 1/5: What's the expected number of concurrent users and documents?"
2. "Question 2/5: Should we support offline editing with conflict resolution?"
3. "Question 3/5: What's your preferred real-time technology (WebSockets, WebRTC, or something else)?"
4. "Question 4/5: Do you need version history with the ability to restore previous versions?"
5. "Question 5/5: Are there specific security or compliance requirements we should be aware of?"

## Question Guidelines

### Always Ask Questions ONE BY ONE

❌ **Bad:**
```
Here are my questions:
1. What should the search filter by?
2. Should it support partial matches?
3. How should results be sorted?
```

✅ **Good:**
```
Question 1/2: What fields should the search filter by (name, email, tags, etc.)?
```
[Wait for answer]
```
Question 2/2: Should search support partial matches and fuzzy matching?
```

### Be Targeted and Specific

❌ **Bad:**
- "What features do you want?" (Too vague)
- "How should it work?" (Too broad)
- "Any requirements?" (Too open-ended)

✅ **Good:**
- "Should the search support pagination or infinite scroll?"
- "Do you want search results highlighted when they match?"
- "Should search handle typos and provide suggestions?"

### Don't Ask Technical Implementation Details

❌ **Bad:**
- "Should we use React or Vue?"
- "What database schema do you want?"
- "Should we use REST or GraphQL?"

✅ **Good:**
- "What user experience should we provide for slow searches?"
- "How often do you expect the data to change?"
- "Do you need real-time updates to search results?

## Requirements Summary Template

After gathering all questions, prepare a summary using this template:

```markdown
# Requirements Summary

## Original Request
[User's original request verbatim]

## Complexity Level
[Simple/Medium/Complex]

## Clarified Requirements

### Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

### Non-Functional Requirements
1. [Requirement 1 - e.g., performance, security]
2. [Requirement 2 - e.g., accessibility, compatibility]

### Constraints & Assumptions
1. [Constraint 1 - e.g., time, budget, technology]
2. [Assumption 1 - e.g., existing infrastructure]
3. [Assumption 2 - e.g., user expertise level]

### Out of Scope
1. [Feature/Functionality explicitly not included]
2. [Items deferred to future iterations]

## Acceptance Criteria
1. [Criterion 1 - specific and testable]
2. [Criterion 2 - specific and testable]
3. [Criterion 3 - specific and testable]
```

## Common Patterns

### Web Development Requests

**Pattern:** User asks for UI components or features
**Typical questions:**
- Responsive behavior (mobile/tablet/desktop)?
- Accessibility requirements (WCAG level)?
- Browser support (modern browsers only or legacy)?
- Internationalization (i18n) needs?
- Dark mode support?

### API Development Requests

**Pattern:** User asks for API endpoints or services
**Typical questions:**
- Authentication requirements (API keys, OAuth, JWT)?
- Rate limiting needs?
- Error response format requirements?
- API versioning strategy?
- Documentation requirements (OpenAPI/Swagger)?

### Data Processing Requests

**Pattern:** User asks for data transformation or processing
**Typical questions:**
- Data source format and structure?
- Expected output format?
- Processing volume and frequency?
- Error handling requirements (stop on error, skip, retry)?
- Validation rules for input data?

### Integration Requests

**Pattern:** User asks to integrate with external services
**Typical questions:**
- Specific services to integrate with?
- Authentication mechanism for each service?
- Data synchronization requirements?
- Error handling for service outages?
- Fallback strategies?

## Red Flags

Stop and ask for clarification if:

1. **User provides contradictory requirements**
   - "Make it fast but also lightweight" (what trade-off?)
   - "Keep it simple but support every feature"

2. **Requirements seem technically infeasible**
   - "Parse this unstructured PDF perfectly"
   - "Make it work offline but sync instantly"

3. **Scope is unclear**
   - "Build a platform like Facebook" (which parts?)
   - "Fix all the bugs" (which bugs, prioritize?)

4. **Missing critical context**
   - "Implement the feature" (which feature?)
   - "Update the API" (what endpoints, what changes?)

5. **Ambiguous success criteria**
   - "Make it better" (better in what way?)
   - "Improve performance" (what metrics, what targets?)

## Examples

### Example 1: Simple Request

**User:** "Add a reset password feature to the login flow"

**Agent:** "Got it. Let me confirm my understanding: you want to add a 'Forgot Password' link on the login page that sends users a reset email, and a page where they can set a new password using a token from the email. Is that correct?"

**User:** "Yes"

**Agent:** [Proceeds to Step 2: Spec Store]

---

### Example 2: Medium Request

**User:** "We need a notification system that can send emails and push notifications"

**Agent:** "Question 1/3: Should notifications be sent immediately or can they be queued and sent in batches?"

**User:** "Immediately for critical alerts, batched for others"

**Agent:** "Question 2/3: Do you need users to be able to manage their notification preferences (what types, frequency, channels)?"

**User:** "Yes, they should be able to opt-in/out of different notification types"

**Agent:** "Question 3/3: Should we track delivery status (sent, delivered, opened, clicked)?"

**User:** "Just delivered status is fine"

**Agent:** [Prepares requirements summary and asks for confirmation]

---

### Example 3: Complex Request

**User:** "Build a real-time analytics dashboard"

**Agent:** "Question 1/5: What data sources will the dashboard connect to, and how frequently is data updated?"

**User:** "We have a PostgreSQL database and some event logs. Data is continuously generated"

**Agent:** "Question 2/5: How many users will be viewing the dashboard simultaneously, and what's the expected data volume per day?"

**User:** "Around 50 concurrent users, maybe 1 million events per day"

**Agent:** "Question 3/5: What kind of visualizations do you need (line charts, bar charts, heatmaps, tables, etc.)?"

**User:** "We'll need line charts for trends, a few bar charts, and some key metrics displayed as cards"

**Agent:** "Question 4/5: Do you need historical data viewing with time ranges (last hour, last day, last week), or just real-time current state?"

**User:** "Both real-time and historical with customizable time ranges"

**Agent:** "Question 5/5: Are there specific performance requirements for data loading and dashboard responsiveness?"

**User:** "Data should load within 2 seconds, dashboard should update every 5 seconds"

**Agent:** [Prepares detailed requirements summary and asks for confirmation]

## Verification Checklist

Before proceeding to Step 2 (Spec Store), verify:

- [ ] User's original request captured verbatim
- [ ] Complexity level determined and justified
- [ ] Appropriate number of questions asked (max 5)
- [ ] All questions asked one by one with numbering
- [ ] All answers gathered
- [ ] Requirements summary prepared with all sections
- [ ] Contradictions or ambiguities resolved
- [ ] Acceptance criteria are specific and testable
- [ ] User confirmation received before proceeding
- [ ] No technical implementation details assumed

## Next Step

After user confirmation, proceed to **Step 2: Spec Store** to save the requirements as a formal specification.