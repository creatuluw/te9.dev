# Mermaid Component

Renders Mermaid diagrams from Mermaid syntax. Supports flowcharts, sequence diagrams, Gantt charts, and more diagram types.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | **required** | Mermaid diagram syntax/code |
| `config` | `object` | See below | Mermaid configuration options |
| `class` | `string` | `''` | Additional CSS classes |

### Config Object

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `'default' \| 'dark' \| 'forest' \| 'neutral'` | `'default'` | Diagram theme |
| `startOnLoad` | `boolean` | `true` | Auto-start rendering |
| `flowchart.useMaxWidth` | `boolean` | `true` | Use maximum width |
| `flowchart.htmlLabels` | `boolean` | `true` | Use HTML labels |
| `flowchart.curve` | `'basis' \| 'linear' \| 'cardinal' \| 'step'` | `'basis'` | Curve style |
| `themeVariables` | `Record<string, string>` | `undefined` | Custom theme variables |

## Examples

### Basic Flowchart

```svelte
<Mermaid code={`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`} />
```

### Sequence Diagram

```svelte
<Mermaid code={`sequenceDiagram
    participant A as Client
    participant B as Server
    
    A->>B: Request
    B-->>A: Response`} />
```

### Gantt Chart

```svelte
<Mermaid code={`gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :a2, after a1, 20d
    section Phase 2
    Task 3 :a3, 2024-02-01, 25d`} />
```

### State Diagram

```svelte
<Mermaid code={`stateDiagram-v2
    [*] --> Idle
    Idle --> Active: Start
    Active --> Idle: Stop
    Active --> Paused: Pause
    Paused --> Active: Resume`} />
```

### With Custom Theme

```svelte
<Mermaid 
    code={`graph LR
    A --> B --> C`}
    config={{ theme: 'dark' }}
/>
```

### With Custom Configuration

```svelte
<Mermaid 
    code={`graph TD
    A --> B --> C`}
    config={{
        theme: 'neutral',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'cardinal'
        },
        themeVariables: {
            primaryColor: '#ff6b6b',
            primaryTextColor: '#fff'
        }
    }}
/>
```

### Class Diagram

```svelte
<Mermaid code={`classDiagram
    class Animal {
        +String name
        +int age
        +eat()
        +sleep()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    Animal <|-- Dog`} />
```

### ER Diagram

```svelte
<Mermaid code={`erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "ordered in"
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int orderNumber
        date orderDate
    }`} />
```

## Supported Diagram Types

Mermaid supports many diagram types:

- **Flowchart** (`graph`, `flowchart`)
- **Sequence Diagram** (`sequenceDiagram`)
- **Class Diagram** (`classDiagram`)
- **State Diagram** (`stateDiagram`, `stateDiagram-v2`)
- **Entity Relationship Diagram** (`erDiagram`)
- **User Journey** (`journey`)
- **Gantt Chart** (`gantt`)
- **Pie Chart** (`pie`)
- **Gitgraph** (`gitGraph`)
- **Timeline** (`timeline`)
- **C4 Diagram** (`C4Context`, `C4Container`, etc.)
- **Mermaid Mindmap** (`mindmap`)

## Error Handling

If the Mermaid syntax is invalid, the component will display an error message with details about what went wrong.

## Accessibility

- Diagrams are rendered as SVG, which is accessible to screen readers
- Ensure diagram content is descriptive in the Mermaid syntax itself
- Consider adding descriptive alt text or captions for complex diagrams

## Documentation

For complete Mermaid syntax documentation, visit: [https://mermaid.js.org/](https://mermaid.js.org/)

