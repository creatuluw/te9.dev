# te9.dev - AI-Powered Development Workspace

A sophisticated, PRD-driven development system that implements the te9-method for structured, testable, and traceable software development with AI agents.

## 🎯 Overview

**te9.dev** is an advanced development workspace that combines AI agents with structured workflows to deliver high-quality, well-documented software. It enforces mandatory PRD-driven development, comprehensive memory integration, and provides powerful tools for consistent UI generation.

### Core Philosophy

- **Structure First**: All development work follows PRD-driven workflows
- **Memory-Enabled**: Every interaction is tracked and contextualized through OpenMemory
- **Test-Driven**: Every PRD must pass acceptance criteria and test suites
- **Design-System-Driven**: Consistent UI through the Gray Design System
- **Traceable**: Complete audit trail of all decisions, implementations, and progress

## 🚀 What You Can Do With te9.dev

### 1. PRD-Driven Development

Create, manage, and execute Product Requirements Documents with full traceability:

```javascript
// Complete development workflow
skill("prd-interview")        // Gather requirements
skill("prd-create")           // Generate PRD files
skill("prd-execute")          // Implement work
skill("prd-test")             // Verify criteria
skill("prd-track")             // Log progress
```

**Features:**
- Structured 9-question interviews
- Automatic PRD file generation
- Multi-PRD planning for large projects
- Status tracking (TODO, IN_PROGRESS, DONE, FAILED, PAUSED, BLOCKED)
- Complete audit trails
- Dependency management

### 2. AI Memory & Context (OpenMemory)

Maintain persistent context across all interactions:

```javascript
// Query past context
openmemory_openmemory_query({
  query: "user authentication patterns",
  user_id: "default",
  limit: 10
})

// Store learnings
openmemory_openmemory_store({
  content: "User prefers JWT-based auth with refresh tokens",
  sector: "emotional",
  user_id: "default",
  tags: ["authentication", "preferences"]
})
```

**Memory Sectors:**
- **Episodic**: Specific events and conversations
- **Semantic**: Facts and codebase knowledge
- **Procedural**: How-to workflows and approaches
- **Emotional**: User preferences and feelings
- **Reflective**: Insights and patterns across interactions

### 3. Consistent UI Generation

Generate beautiful, accessible UI components using multiple frameworks:

#### Gray Design System
```javascript
// Generate components with design system adherence
"Generate a user card using Gray Design System:
- Reference: design-system/components/card.md
- Tokens: design-system/tokens/
- Layouts: design-system/layouts/
- Follow all guidelines for accessibility and responsiveness"
```

**Features:**
- LLM-optimized documentation
- Complete token system (colors, typography, spacing)
- WCAG AA compliance (≥4.5:1 contrast)
- Mobile-first responsive design
- Semantic HTML5 with ARIA attributes

#### UIKit Components
```javascript
uikit({
  action: "generate",
  component: "button",
  category: "form",
  withIcons: true
})
```
- 70+ pre-built components
- Complete framework features
- Layouts, navigation, forms, interactive components

#### DaisyUI Components
```javascript
daisyui({
  action: "generate",
  component: "card",
  theme: "business"
})
```
- 65+ Tailwind CSS components
- 30+ themes
- Semantic color utilities

#### Melt UI (Svelte 5)
```javascript
melt({
  action: "generate",
  builder: "select",
  styling: "tailwind",
  withImports: true
})
```
- Headless, accessible component builders
- 26+ builders
- Comprehensive accessibility patterns

### 4. Browser Automation & Testing

Automate browser interactions for testing and web scraping:

#### Playwright
```javascript
// Navigate and interact
playwright_browser_navigate({url: "https://example.com"})
playwright_browser_take_screenshot({fullPage: true})
playwright_browser_click({
  element: "Submit button",
  ref: "button[type='submit']"
})
```

#### Chrome DevTools
```javascript
// Deep browser inspection
chrome-devtools_navigate_page({url: "https://example.com"})
chrome-devtools_take_snapshot()
chrome-devtools_list_network_requests()
chrome-devtools_performance_start_trace({reload: true})
```

**Capabilities:**
- Automated testing
- Web scraping
- Performance analysis
- Network monitoring
- Screenshot capture
- Console inspection

### 5. Documentation & Knowledge Management

Export and visualize project knowledge:

```javascript
// Export knowledge graphs
knowledge_graph({
  user_id: "default",
  limit: 50,
  outputDir: "./knowledge-graphs"
})
```

**Features:**
- Timestamped JSON exports
- Mermaid diagram generation
- Memory sector visualization
- Relationship mapping

### 6. Sequential Thinking

Break down complex problems with structured reasoning:

```javascript
sequential-thinking_sequentialthinking({
  thought: "First, I need to understand the problem...",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5
})
```

**Benefits:**
- Step-by-step problem analysis
- Hypothesis generation and verification
- Branching and revision of thoughts
- Complete solution documentation

### 7. Documentation Search

Search GitHub repositories and web documentation:

```javascript
docfork_docfork_search_docs({
  query: "React hooks useEffect cleanup",
  docforkIdentifier: "facebook/react"
})

docfork_docfork_read_url({
  url: "https://react.dev/reference/react/useEffect"
})
```

**Features:**
- GitHub documentation search
- Web documentation search
- Focused library-specific searches
- Full page content retrieval

## 🏗️ Architecture

### Directory Structure

```
te9.dev/
├── .opencode/                 # OpenCode configuration and skills
│   ├── skill/                 # AI skill implementations
│   │   ├── prd-interview/      # Interview gathering skill
│   │   ├── prd-plan/          # Multi-PRD planning skill
│   │   ├── prd-create/        # PRD file generation skill
│   │   ├── prd-execute/       # Implementation skill
│   │   ├── prd-test/          # Testing skill
│   │   ├── prd-track/         # Progress tracking skill
│   │   ├── openmemory/        # Memory management skills
│   │   ├── uikit/             # UIKit generation skill
│   │   ├── daisyui/           # DaisyUI generation skill
│   │   └── melt/              # Melt UI generation skill
│   ├── tool/                  # Custom tools
│   │   ├── uikit.ts          # UIKit generator
│   │   ├── daisyui.ts        # DaisyUI generator
│   │   ├── melt.ts           # Melt UI generator
│   │   └── knowledge_graph.ts # Knowledge graph exporter
│   └── prompts/               # Agent prompts
│       └── build.md          # Build agent workflow
├── dev/
│   ├── design-system/         # Gray Design System
│   │   ├── tokens/           # Design tokens (colors, typography, spacing)
│   │   ├── components/       # Component specifications
│   │   ├── layouts/          # Layout patterns
│   │   ├── examples/         # Complete implementations
│   │   └── guidelines/       # Best practices
│   ├── prd/                   # PRD database and runs (auto-generated)
│   │   ├── prd.json          # PRD database
│   │   ├── runs/             # PRD execution folders
│   │   └── logs/             # Progress logs
│   └── interviews/            # Interview transcripts
└── .zed/
    └── rules/                 # Zed-compatible workflow rules
```

### MCP Integrations

te9.dev integrates with multiple MCP (Model Context Protocol) servers:

| MCP Server | Purpose | Type |
|------------|---------|------|
| **openmemory** | Persistent memory and context | Remote |
| **time-server** | Time zone and timestamp operations | Remote |
| **playwright** | Browser automation | Local |
| **chrome-devtools** | Deep browser inspection | Local |
| **sequential-thinking** | Structured problem solving | Local |
| **docfork** | Documentation search | Remote |

### Agent Configuration

**Build Agent**: `zai-coding-plan/glm-4.7` (temperature: 0.3)
- Enforces mandatory workflows
- Follows PRD-driven development
- Integrates with OpenMemory for context

## 📋 Mandatory Workflows

### Workflow 1: Memory Integration

All interactions must follow:

1. **QUERY FIRST**: Query OpenMemory before responding
2. **ANALYZE**: Review results and identify patterns
3. **INCORPORATE**: Adapt response based on memory context
4. **STORE LAST**: Save important learnings after interaction

### Workflow 2: PRD-Driven Development

All development work must follow:

1. **INTERVIEW**: Conduct structured requirements gathering
2. **PLAN** (if needed): Split large work into multiple PRDs
3. **CREATE**: Generate PRD files and configuration
4. **EXECUTE**: Implement work according to acceptance criteria
5. **TEST**: Verify all criteria pass, no regressions
6. **TRACK**: Log progress and maintain complete history

## 🎨 Gray Design System

### Token System

- **Colors**: Zinc palette (50-950) with semantic colors
- **Typography**: Inter & Inter Tight with 8pt grid scale
- **Spacing**: 4px base unit with consistent scale
- **Shadows**: xs, sm, 2xl with zinc-950/20 opacity

### Component Library

- Buttons (primary, secondary, tertiary, small, social)
- Forms (inputs, selects, textareas, validation)
- Cards (standard, elevated, interactive, feature)
- Layouts (12-column grid, hero, features, navigation)

### Accessibility

- WCAG AA compliance (≥4.5:1 contrast)
- Semantic HTML5 elements
- Proper ARIA attributes
- Keyboard navigation
- 44×44px minimum touch targets

## 🔧 Getting Started

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd te9.dev

# Install dependencies
cd .opencode
npm install
```

### Configuration

Edit `opencode.json` to customize:

```json
{
  "model": "zai-coding-plan/glm-4.7",
  "autoupdate": true,
  "mcp": {
    "openmemory": {
      "type": "remote",
      "url": "https://openmemory-production-f483.up.railway.app/mcp"
    }
  },
  "permission": {
    "skill": {"*": "allow"}
  }
}
```

### First PRD

```bash
# Start an interview
skill("prd-interview")

# Create the PRD
skill("prd-create", {interviewData: ...})

# Execute the work
skill("prd-execute", {prdId: "PRD-XXX"})

# Test and verify
skill("prd-test", {prdId: "PRD-XXX"})

# Track completion
skill("prd-track", {prdId: "PRD-XXX", eventType: "COMPLETED"})
```

## 💡 Use Cases

### 1. Building a Web Application

```javascript
// User Request:
"I need a web application for managing tasks with authentication"

// te9.dev Response:
1. Conducts prd-interview for requirements
2. Creates multi-PRD plan (auth, tasks, UI, testing)
3. Generates PRD files with acceptance criteria
4. Implements each PRD in sequence
5. Tests all criteria
6. Tracks complete progress
7. Uses Gray Design System for consistent UI
8. Remembers preferences in OpenMemory
```

### 2. Bug Fixing

```javascript
// User Request:
"There's a bug where the login form doesn't validate email"

// te9.dev Response:
1. Queries memory for authentication patterns
2. Conducts bugfix interview
3. Creates bugfix PRD with specific criteria
4. Implements fix
5. Tests thoroughly (no regressions)
6. Stores learnings about this bug
```

### 3. UI Component Generation

```javascript
// User Request:
"Create a modal dialog with close button and backdrop"

// te9.dev Response:
1. Queries memory for modal preferences
2. References Gray Design System components
3. Generates consistent, accessible modal
4. Includes all states (open, close, backdrop click)
5. Ensures WCAG AA compliance
6. Stores component pattern for future use
```

### 4. Documentation & Knowledge

```javascript
// Export project knowledge
knowledge_graph({
  user_id: "default",
  outputDir: "./docs/knowledge-graphs"
})

// Generates:
// - timestamped-knowledge-graph.json
// - timestamped-knowledge-graph.mermaid
```

## 📊 Key Benefits

### For Developers

✅ **Structured Development**: Every feature starts with a PRD
✅ **Test Coverage**: All work must pass tests
✅ **Documentation**: Complete audit trail of decisions
✅ **Context Awareness**: AI remembers past interactions
✅ **Consistent UI**: Design system ensures visual harmony
✅ **Automation**: Browser automation for testing

### For AI Agents

✅ **Memory**: Persistent context across sessions
✅ **Skills**: Modular, reusable capabilities
✅ **Workflows**: Enforced best practices
✅ **Traceability**: Complete execution history
✅ **Tools**: Powerful generators for UI, testing, knowledge
✅ **Documentation**: Structured for optimal understanding

## 🔍 Advanced Features

### Multi-PRD Planning

Automatically split large projects:

```javascript
// Large request triggers planning
skill("prd-plan", {
  interviewData: {...}
})

// Returns plan with:
// - PRD-001: Database schema
// - PRD-002: Authentication system
// - PRD-003: User management
// - PRD-004: API endpoints
// - PRD-005: Testing & deployment
```

### Continuous Integration

Track and verify all work:

```javascript
// Log progress during execution
skill("prd-track", {
  prdId: "PRD-XXX",
  eventType: "PROGRESS",
  eventData: {
    achievement: "Implemented user registration",
    criteriaCompleted: [1, 2],
    filesCreated: 3
  }
})

// Log issues
skill("prd-track", {
  prdId: "PRD-XXX",
  eventType: "ISSUE",
  eventData: {
    issue: "Database timeout",
    severity: "Medium",
    resolution: "Increased connection pool"
  }
})
```

### Knowledge Graph Export

Visualize project knowledge:

```javascript
// Exports JSON with:
// - Memory nodes and edges
// - Temporal validity
// - Sector classifications
// - Salience scores

// Generates Mermaid diagrams for:
// - Entity relationships
// - Temporal facts
// - Memory clusters
```

## 📚 Documentation

- **OpenCode Skills**: `.opencode/skill/README.md`
- **Build Workflows**: `.opencode/prompts/build.md`
- **Design System**: `dev/design-system/README.md`
- **Zed Rules**: `.zed/rules/README.md`
- **PRD Workflow**: `.opencode/skill/prd-*/SKILL.md`

## 🎯 Core Principles

1. **Never Skip Memory**: Query before every response, store after
2. **Never Skip PRD**: Interview, create, execute, test, track all dev work
3. **Always Be Testable**: Every PRD must pass acceptance criteria
4. **Always Be Traceable**: Complete history of all work
5. **Always Be Consistent**: Use design system and established patterns

## 🚀 What's Next

te9.dev is actively evolving. Coming features include:

- Advanced form components (date picker, file upload)
- Dark mode support for design system
- Animation documentation
- Component composition patterns
- Navigation patterns (dropdowns, breadcrumbs, tabs)
- Additional MCP integrations
- Performance optimization tools

## 📄 License

This project implements the te9-method and integrates with:

- **OpenCode**: AI-powered development platform
- **OpenMemory**: Persistent memory system
- **Gray HTML Template**: By Cruip (design system base)
- **Tailwind CSS**: Utility-first framework
- **Playwright**: Browser automation
- **MCP Protocol**: Model Context Protocol

---

**te9.dev - Where AI agents and structured development converge.**

For questions or contributions, explore the documentation in `.opencode/skill/` and `dev/design-system/`.
