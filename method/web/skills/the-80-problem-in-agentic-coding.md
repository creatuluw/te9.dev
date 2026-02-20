# The 80% Problem in Agentic Coding

### Managing comprehension debt when leaning on AI to code

Addy Osmani  
Jan 28, 2026

Andrej Karpathy said something this week that made me pause: 

> **"I rapidly went from about 80% manual+autocomplete coding and 20% agents to 80% agent coding and 20% edits+touchups. I really am mostly programming in English now."**

The inversion happened over a few weeks in late 2025. While this may apply to new (greenfield) or personal projects more than existing or legacy apps, I imagine **how far AI takes you is still further than a year ago.** You can thank models, specs, skills, MCPs and our workflows improving. 

Boris Cherney, creator of Claude Code, has recently echoed similar sentiments:

> **"Pretty much 100% of our code is written by Claude Code + Opus 4.5. For me personally it has been 100% for two+ months now, I don't even make small edits by hand. I shipped 22 PRs yesterday and 27 the day before, each one 100% written by Claude. I think most of the industry will see similar stats in the coming months - it will take more time for some vs others."**

Some time ago I wrote about "the 70% problem" - where AI coding took you to 70% completion, then leave the final 30% last mile for humans. That framing may now be evolving. The percentage may shift to 80% or higher for certain kinds of projects, but the nature of the problem changed more dramatically than the numbers suggest.

Armin Ronacher's poll of 5,000 developers compliments this story: 44% now write less than 10% of their code manually. Another 26% are in the 10-50% range. We've crossed a threshold. But here's what the triumphalist narrative misses: the problems didn't disappear, they shifted. And some got worse.

**I want to caveat: I've definitely felt the shift to 80%+ agent coding on new side-projects, however, this is very different in large or existing apps, especially where teams are involved. Expectations differ, but this is a taste of where we're headed.**

## The mistakes changed

**AI errors evolved from syntax bugs to conceptual failures - the kind a sloppy, hasty junior may make under time pressure.**

Karpathy catalogs what still breaks: 

> **"The models make wrong assumptions on your behalf and run with them without checking. They don't manage confusion, don't seek clarifications, don't surface inconsistencies, don't present tradeoffs, don't push back when they should. They're still a little too sycophantic."**

**Assumption propagation**: The model misunderstands something early and builds an entire feature on faulty premises. You don't notice until you're five PRs deep and the architecture is cemented. This is kind of two-steps-back pattern.

**Abstraction bloat**: Given free rein, agents can overcomplicate relentlessly. They'll scaffold 1,000 lines where 100 would suffice, creating elaborate class hierarchies where a function would do. You have to actively push back: "Couldn't you just...?" The response is always "Of course!" followed by immediate simplification. They're optimizing for looking comprehensive, not for maintainability.

**Dead code accumulation**: They often don't clean up after themselves. Old implementations linger. Comments get removed as side effects. Code they don't fully understand gets altered anyway because it was adjacent to the task.

**Sycophantic agreement**: They don't always push back. No "Are you sure?" or "Have you considered...?" Just enthusiastic execution of whatever you described, even if your description was incomplete or contradictory.

**It's possible to mitigate some of this via Skills if you know what to watch for.**

These otherwise persist despite system prompts, despite CLAUDE.md instructions, despite plan mode. They're not bugs to be fixed - they're sometimes inherent to how these systems work. 

**Agents optimize for coherent output, not for questioning your premises.**

I've watched this happen on my own teams - code that looks right in review but breaks three commits later when someone touches an adjacent system. 

If you're data minded, recent survey data suggests "verification bottleneck" has emerged: only 48% of developers consistently check AI-assisted code before committing it, even though 38% find that reviewing AI-generated logic actually requires more effort than reviewing human-written code. **We're generating correct code faster, but may be accumulating technical debt even faster.**

## Comprehension debt: a hidden cost we don't track

**Generation (writing code) and discrimination (reading code) are different cognitive capabilities. You can review code competently even after your ability to write it from scratch has atrophied. But there's a threshold where "review" becomes "rubber stamping."**

Jeremy Twei coined the perfect term for this: *comprehension debt*. It's certainly tempting to just move on when the LLM one-shotted something that seems to work. This is the insidious part. The agent doesn't get tired. It will sprint through implementation after implementation with unwavering confidence. The code looks plausible. The tests pass (or seem to). You're under pressure to ship. You move on.

**Over time, you may understand less of your own codebase.**

I caught myself doing this last week. Claude implemented a feature I'd been putting off for days. The tests passed. I skimmed it, nodded, merged. Three days later I couldn't explain how it worked.

Yoko Li captured the addiction loop perfectly: 

> **"The agent implements an amazing feature and got maybe 10% of the thing wrong, and you're like 'hey I can fix this if I just prompt it for 5 more mins.' And that was 5 hrs ago."**

You're always almost there. The final 10% feels tantalizingly close. Just one more prompt. Just one more iteration. The psychological hook is real.

Someone else put it differently: 

> "I spend most of my time babysitting agents. The AGI vibes are real, but so is the micromanagement tax. You're not coding anymore, you're supervising. Watching. Redirecting. It's a different kind of exhausting."

**The dangerous part: it's trivially easy to review code you can no longer write from scratch.** If your ability to "read" doesn't scale with the agent's ability to "output," you're not engineering anymore. You're hoping.

## The productivity paradox: More code, same throughput

**Individual output surged 98% in high-adoption teams, but PR review time increased anywhere as high as 91%.**

The data from Faros AI and Google's DORA report are interesting:

- Teams with high AI adoption merged 98% more PRs
- Those same teams saw review times balloon 91%
- PR size increased 154% on average
- Code review became the new bottleneck

Atlassian's 2025 survey found the paradox in stark terms: 99% of AI-using developers reported saving 10+ hours per week, yet most reported no decrease in overall workload. The time saved writing code was consumed by organizational friction - more context switching, more coordination overhead, managing the higher volume of changes.

**We got faster cars, but the roads got more congested.**

We're producing more code but spending more time reviewing it. The bottleneck just moved. When you make a resource cheaper (in this case, code generation), consumption increases faster than efficiency improves, and total resource use goes up. 

We're not writing less code. We're writing vastly more code, and someone still has to understand much of it. There are of course groups of developers who feel this should no longer be the case if AI can do that.

## Where the 80/20 split actually works

**The 80% threshold is most accessible in greenfield contexts where you control the entire stack and comprehension debt stays manageable through small team size.**

This actually works in a few contexts:

- Personal projects where you control everything
- MVPs where "good enough" is actually good enough
- Startups in greenfield territory without legacy constraints
- Teams small enough that comprehension debt stays manageable

In these environments, the agent's weaknesses matter less. You can scaffold rapidly, refactor aggressively, throw away code without political friction. The pace of iteration outweighs occasional misdirection.

In mature codebases with complex invariants, the calculus inverts. The agent doesn't know what it doesn't know. It can't intuit the unwritten rules. Its confidence scales inversely with context understanding.

Someone pointed out the obvious thing I was tiptoeing around: the first 90% might be easy, but the last 10% can take a long time. 90% accuracy is fine for non-mission-critical stuff. For the parts that actually matter, it's nowhere close. Self-driving cars work great until they don't, and that's why L2 is everywhere but L4 is still mostly vaporware.

For non-engineers, the wall is lower but still real. Tools like AI Studio, v0 and Bolt can turn sketches into working prototypes instantly. But hardening that prototype for production - handling real user data at scale, ensuring security and compliance - still requires engineering fundamentals. AI gets you 80% to an MVP; the last 20% requires patience, learning deeply or hiring engineers.

## Two different populations

**We're not seeing a smooth curve of adoption - we're seeing a split between those who've crossed the threshold and everyone else. The gap between early adopters and the rest is widening, not closing.**

Armin's poll revealed what raw adoption numbers obscure: 44% of developers still write over 90% of their code manually. We have a bimodal distribution, not a bell curve. On one side: people like Karpathy and the Claude Code team, shipping dozens of PRs daily with 100% AI-written code, iterating faster than ever before. On the other: the vast majority, incrementally adopting copilot-style tools but not fundamentally changing their workflow.

The age split may be visible in discourse too. Younger developers seem more willing to adapt workflow radically. Older developers are more skeptical - not because they can't use the tools, but because they've seen enough cycles to know the difference between a temporary productivity boost and a sustainable practice. Both might be right.

Stack Overflow's 2025 survey showed only 16% reported "great" productivity improvements. Half saw modest gains. The top frustrations: "AI solutions that are almost right, but not quite" (66%) and "debugging AI code takes longer than writing it myself" (45%).

The engineers who appear to be thriving in 2026 aren't just using better tools. They've reconceptualized their role from implementer to orchestrator. They've learned to think declaratively rather than imperatively. They've accepted that their job is now architectural oversight and quality control, not line-by-line coding.

Those struggling are trying to use AI as a faster typewriter. They haven't adapted their workflow. They're fighting the agent's approach instead of redirecting its goals. They haven't invested in learning to prompt effectively which is now as critical as writing good documentation or design specs ever was.

There's an uncomfortable truth here: **orchestrating agents feels a lot like management**. Delegating tasks. Reviewing output. Redirecting when things go sideways. If you became an engineer because you didn't want to be a manager, this shift might feel like a betrayal. The role changed underneath you.

**The gap seems to be widening. The people who've figured out how to work with these tools are shipping stuff I can barely keep up with. Everyone else is... still figuring it out.**

This split may make some uncomfortable. I've always said I'm a builder, but I also enjoyed programming. The idea that these are now diverging paths - that you have to pick one - feels reductive. Like we're forcing a binary on something more complicated. Someone in the comments said it perfectly: both viewpoints are valid, just different wiring. Neither is wrong.

## From imperative to declarative: The real leverage

**Don't tell the AI what to do - give it success criteria and watch it loop. The magic isn't in the agent writing code, it's in the agent iterating until it satisfies conditions you specify.**

Karpathy's observation about leverage cuts to the core: 

> **"LLMs are exceptionally good at looping until they meet specific goals and this is where most of the 'feel the AGI' magic is to be found."**

The shift from imperative to declarative development:

**Old model (imperative)**: "Write a function that takes X and returns Y. Use this library. Handle these edge cases. Make sure to..."

**New model (declarative)**: "Here are the requirements. Here are the tests that must pass. Here's the success criteria. Figure out how."

This works because agents never get demoralized. They'll try approaches you wouldn't have patience for. They iterate relentlessly. If you specify the destination clearly, they'll navigate there - even if it takes 30 failed attempts.

The patterns that work:

- Write tests first, let the agent iterate until they pass
- Hook it up to a browser via MCP, let it verify behavior visually
- Implement the naive correct version, then optimize while preserving correctness
- Define the API contract, let it implement to spec

But this only works if your success criteria are actually correct. Garbage in, garbage out scales with capability.

The developers succeeding with this approach spend 70% of their time on problem definition and verification strategy, 30% on execution. The ratios inverted from traditional development, but the total time decreased dramatically.

## The slopacolypse question

**When anyone can generate thousands of lines of code in minutes, the ability to say 'we don't need this' becomes more valuable.**

Karpathy warned: 

> **"I am bracing for 2026 as the year of the slopacolypse across all of github, substack, arxiv, X/instagram, and generally all digital media."**

The concern is straightforward: when anyone can generate arbitrarily large volumes of plausible-looking code, content, papers, or posts, how do we maintain signal-to-noise ratio?

Boris Cherny offers a counterpoint: "My bet is that there will be no slopcopolypse because the model will become better at writing less sloppy code and at fixing existing code issues. In the meantime, what helps is having the model code review its code using a fresh context window."

Both can be true simultaneously. The capability for slop exists at unprecedented scale. The tooling to prevent it is emerging. The question is which scales faster.

**The slopacolypse will be driven by people who mistake velocity for productivity.** Agents are marathon runners with no sense of direction unless you give it to them. They will sprint ten miles into a brick wall if you don't audit the "code actions" where necessary.

The teams I've seen handle this well tend to do a few things:

- Fresh-context code reviews help, though it feels weird asking the same model to critique its own code. It works, though - give it a clean slate and it catches its own mistakes.
- Automated verification at every step (CI/CD, linters, type checkers, tests as guardrails)
- Deliberate constraints on agent autonomy (bounded tasks, clear success criteria)
- High emphasis on human-in-the-loop at architectural decision points

The code quality problems Karpathy describes - overcomplication, abstraction bloat, dead code - these improve as models improve. But they won't disappear. They're emergent from how these systems approach problems.

## What actually works: practical patterns

**The future belongs to those who can maintain a coherent mental model of the macro while agents handle tactical drudgery of the micro.**

After watching teams adapt over the past year, effective patterns have crystallized:

### 1. Agent-first drafts with tight iteration loops  

Don't use AI for one-off suggestions. Generate entire first drafts, then refine. The Claude Code team practice: have the model review its own code with a fresh context window. This catches issues before human review.

### 2. Declarative communication  

Spend 70% of effort on problem definition, 30% on execution. Write comprehensive specs, define success criteria, provide test cases up front. Guide the agent's goals, not its methods.

### 3. Automated verification  

If you repeatedly fix the same class of mistake, write a test or lint rule preemptively. Make the agent explain its code and flag potential problems before you review.

### 4. Deliberate learning vs. just focusing so much on production  

Use AI as a learning tool, not a crutch (you've heard this a few times now). When the agent writes something you don't understand, that's a signal to dig deeper. Treat AI-generated code like code from a mentor - review it to learn, not just to ship.

### 5. Architectural hygiene  

More modularization, clearer API boundaries. Well-documented style guides fed into prompts. High-level architecture descriptions provided before coding begins. The planning phase expanded; the coding phase compressed; the review phase focused on design rather than syntax.

**The developers who thrive won't be those who generate the most code. They'll be those who know which code to generate, when to question the output, and how to maintain comprehension even as their hands leave the keyboard.**

## The uncomfortable truth about skill development

**If your ability to "read" doesn't scale at the same rate as the agent's ability to "output," you aren't engineering anymore. You're rubber stamping.**

> "It's been like the boiling frog for me. Started by copy-pasting more into ChatGPT. Then more in-IDE prompting. Then agent tools. Suddenly I barely hand code anymore. The transition was so gradual I didn't notice until I was already there" [HN]

There's early evidence of skill atrophy in heavy AI users. Junior developers who rely on AI for everything report feeling less confident in problem-solving abilities over time. It's the Google effect applied to coding - when you outsource constantly, your brain stops retaining.

I don't know what the solution is, but I've been trying a few things:

- Use TDD: write tests (or think through test cases) before letting AI implement
- Pair with seniors: discuss AI suggestions in real-time to learn the decision-making process
- Ask for explanations: have the AI justify its approach, not just generate solutions
- Alternate: write some features manually to maintain muscle memory

**The risk is real: it's dangerously easy to review code you can no longer write from scratch.** When that happens, you've become dependent on the tool in a way that limits your growth.

The engineers who will thrive long-term are those who use AI to accelerate gaining experience, not to bypass it entirely. They maintain their fundamentals while leveraging AI to explore more territory faster.

## Where this leaves us

**The shift from 70% to 80% isn't about percentages - it's about the gap between prototype and production-ready software. That gap is narrowing, but it hasn't closed.**

Karpathy asks the right questions: 

> **"What happens to the '10X engineer' - the ratio of productivity between the mean and the max engineer? It's quite possible that this grows a lot. Armed with LLMs, do generalists increasingly outperform specialists?"**

These questions will define the next few years.

One thing is certain: AI wrote 80% of code for early adopters in late 2025. Even if your percentage is much lower, it's likely higher than a year ago. This places disproportionate emphasis on the human's role: owning outcomes, maintaining quality bars, ensuring tests actually validate behavior.

**The danger isn't that the agent fails. I think it's that it succeeds so confidently in the wrong direction that you stop checking the compass.**

DORA's 2025 report crystallized the reality: AI is an amplifier of your development practices. Good processes get better (high-performing teams saw 55-70% faster delivery). Bad processes get worse (accumulating debt at unprecedented speed). There is no silver bullet.

Karpathy's final observation resonates most: 

> **"I didn't anticipate that with agents programming feels more fun because a lot of the fill in the blanks drudgery is removed and what remains is the creative part. I also feel less blocked/stuck and I experience a lot more courage because there's almost always a way to work hand in hand with it to make some positive progress."**

He also notes: "LLM coding will split up engineers based on those who primarily liked coding and those who primarily liked building."

**That's probably the most insightful prediction about where this is headed.**

If you liked the act of writing code itself - the craft of it, the meditation of it - this transition might feel like loss. If you liked building things and code was the necessary means, this feels like liberation.

Neither response is wrong. But the tooling is optimizing for the latter.

## For the skeptics (you're right to be skeptical)

The productivity claims are often overhyped. AI still makes mistakes a competent junior wouldn't. Comprehension debt is real and poorly understood. The slopacolypse risk is genuine.

But the shift is real. When Karpathy admits he barely writes code directly anymore, when the Claude Code team ships 20+ PRs daily with 100% AI-written code, we're past the point of dismissing this as hype.

**As software engineers, our identity was never "the person who can write code" - it was "the person who can solve problems with software."**

AI isn't replacing engineers. It's amplifying them - for better and for worse.

My advice: embrace the tools, but own the outcome. Use AI to accelerate learning, not skip it. Focus on fundamentals that matter more than ever: robust architecture, clean code, thorough tests, thoughtful UX. These remain as important as ever - maybe more so, since implementation is no longer the bottleneck.

I don't know where this goes. Karpathy's probably right that it'll split people between those who liked coding and those who liked building. 

We're all figuring this out in public, one PR at a time.