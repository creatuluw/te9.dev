Definition List: Concepts for LLMs to Become Senior Software Engineers

## Core Concepts

### **Comprehension Debt**
The gradual loss of understanding of your own codebase that occurs when you review but don't write code. When you can review code competently but can no longer write it from scratch, you've crossed a dangerous threshold where "review" becomes "rubber stamping."

### **Assumption Propagation**
A failure mode where a model misunderstands a requirement early in development and builds an entire feature or system on those faulty premises. These errors compound and often aren't discovered until the architecture is cemented, making corrections expensive.

### **Abstraction Bloat**
The tendency of AI agents to overcomplicate solutions unnecessarily—creating elaborate class hierarchies where a simple function would suffice, or scaffolding 1000 lines where 100 would do. This stems from optimizing for looking comprehensive rather than maintainable.

### **Dead Code Accumulation**
The practice of leaving old implementations, orphaned code, and comments in the codebase after implementing changes. Agents often don't clean up after themselves, leading to technical debt that accumulates silently.

### **Sycophantic Agreement**
The failure mode where AI agents don't push back on unclear, contradictory, or incomplete requests. Instead of asking clarifying questions or surfacing inconsistencies, they enthusiastically execute whatever is described, even when the direction is flawed.

### **Declarative Communication**
The practice of specifying what needs to happen (requirements, success criteria, constraints) rather than how to do it. Instead of "Write a function that does X using this library," you say "Here are the requirements and tests—figure out the implementation."

### **Automated Verification**
The use of tests, lint rules, type checkers, and CI/CD pipelines as guardrails around AI-generated code. When you repeatedly fix the same class of mistake, you write preventive verification rather than reactive fixes.

### **Architectural Hygiene**
The practice of maintaining clear API boundaries, modularization, well-documented style guides, and high-level architecture descriptions before coding begins. This includes feeding architecture docs into prompts and ensuring the planning phase is thorough.

### **Agent-First Drafting**
A pattern where you generate complete first drafts via AI, then refine them iteratively. Rather than using AI for one-off suggestions or small fragments, you let it create substantial implementations, then guide it through tight iteration loops.

### **Tight Iteration Loops**
The practice of rapidly iterating on code with fresh context windows. The Claude Code team's approach: have the model review its own code with a clean context before human review, catching issues early and preventing them from accumulating.

### **Problem Definition**
The cognitive shift from spending most effort on implementation to spending most effort on defining the problem. Effective teams now spend 70% of effort on requirements, success criteria, and verification strategy, and only 30% on execution.

### **Success Criteria**
Clear, testable conditions that specify when a feature or implementation is complete. Instead of vague descriptions, success criteria include specific test cases, performance requirements, API contracts, and behavioral expectations.

### **Skill Atrophy Mitigation**
Practices to prevent the degradation of fundamental engineering skills when relying heavily on AI. This includes writing some code manually, using TDD, pair programming with humans, and treating AI-generated code as learning material rather than just deliverables.

### **Code Review Quality**
The standard of actually understanding code during review rather than rubber stamping. High-quality review requires that your ability to "read" scales with the agent's ability to "output," or you're not engineering—you're hoping.

### **Verification Bottleneck**
The emergent bottleneck that occurs when AI generates code faster than humans can properly review it. Faros AI data shows PR review time increased 91% in high-adoption teams, shifting the bottleneck from coding to review.
