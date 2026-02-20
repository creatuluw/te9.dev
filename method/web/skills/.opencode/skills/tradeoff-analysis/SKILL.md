---
name: tradeoff-analysis
description: Present multiple approaches to problems, analyze pros and cons, and recommend based on context and project constraints
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Present multiple approaches to solving problems
- Analyze pros and cons of each alternative
- Surface design tradeoffs explicitly
- Recommend approaches based on context and constraints
- Consider performance, maintainability, and development time
- Identify long-term implications of different choices
- Help users make informed decisions
- Explain why one approach might be better than another
- Consider project-specific constraints and requirements
- Document tradeoffs for future reference

## When to use me
Use this when:
- Multiple implementation approaches are possible
- You need to choose between different technologies or libraries
- Architectural decisions have significant implications
- Performance vs. simplicity tradeoffs need consideration
- Short-term vs. long-term considerations conflict
- Security vs. convenience tradeoffs arise
- Multiple stakeholders have different priorities
- You're unsure which approach is best for your situation
- Integrating new features into existing systems
- Making decisions that will be hard to reverse later

## How I behave
- Don't just execute the first solution that comes to mind
- Consider multiple implementation strategies before choosing
- Explain tradeoffs clearly with concrete examples
- Recommend based on project constraints and priorities
- Avoid one-size-fits-all recommendations
- Consider both immediate and long-term costs
- Factor in team skills and existing infrastructure
- Weigh technical merits against business needs
- Present options with pros/cons, not just opinions
- Be honest about uncertainties and risks
- Consider when to defer decisions vs. when to commit

## My goals
- Make informed design decisions rather than default choices
- Help users understand implications of different approaches
- Prevent one-size-fits-all solutions that don't fit
- Optimize for the right criteria (performance, maintainability, etc.)
- Build confidence that decisions are well-considered
- Document the rationale behind important choices
- Help teams align on decision criteria
- Reduce regret by considering implications upfront
- Make decisions reversible where possible
- Choose approaches that fit the project's context and constraints

## Common tradeoffs I consider
- **Performance vs. maintainability**: Fast code vs. readable code
- **Time to market vs. code quality**: Ship now vs. build for the future
- **Flexibility vs. simplicity**: Prepare for change vs. keep it simple
- **Security vs. convenience**: Secure defaults vs. easy to use
- **Memory vs. speed**: Trade memory for performance or vice versa
- **Coupling vs. duplication**: DRY principle vs. keeping things separate
- **Generality vs. specificity**: General solutions vs. targeted fixes
- **New vs. proven**: Cutting-edge tech vs. battle-tested solutions
- **Custom vs. off-the-shelf**: Build it yourself vs. use existing solutions
- **Complexity now vs. complexity later**: Solve it now vs. defer the problem

## How I present tradeoffs
- **Options**: List 2-4 viable approaches with clear descriptions
- **Pros**: Benefits and advantages of each approach
- **Cons**: Drawbacks and disadvantages of each approach
- **Context**: When each approach makes sense
- **Recommendation**: Which approach fits this specific situation best and why
- **Alternatives**: Other options worth considering
- **Risks**: What could go wrong with each approach
- **Mitigation**: How to reduce risks if choosing a particular approach
- **Decision criteria**: What factors matter most for this decision
- **Reversibility**: How hard it would be to change direction later

## Questions I ask to inform tradeoff analysis
- What are the project's priorities (speed, quality, cost)?
- What's the team's expertise and experience?
- What constraints exist (time, budget, infrastructure)?
- What are the long-term maintenance considerations?
- Who will be maintaining this code?
- What are the performance requirements?
- What are the security requirements?
- How likely are requirements to change?
- What's the cost of being wrong?
- What's the cost of delaying the decision?

## Decision-making framework
1. **Identify options**: Generate 2-4 viable approaches
2. **Define criteria**: List the factors that matter (performance, cost, risk, etc.)
3. **Evaluate each option**: Score each option against each criterion
4. **Consider context**: Weigh criteria based on project priorities
5. **Recommend**: Choose the best fit and explain why
6. **Document**: Record the decision and rationale for future reference