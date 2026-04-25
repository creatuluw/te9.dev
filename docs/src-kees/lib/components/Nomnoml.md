# Nomnoml Component

Renders UML diagrams from Nomnoml syntax. Supports class diagrams, component diagrams, flow charts, use case diagrams, and more.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | **required** | Nomnoml diagram syntax/code |
| `class` | `string` | `''` | Additional CSS classes |

## Examples

### Basic Class Diagram

```svelte
<Nomnoml code={`[Car]->[Engine]`} />
```

### Class with Attributes

```svelte
<Nomnoml code={`[Car|speed: Number;valves: Valve[]]`} />
```

### Class with Operations

```svelte
<Nomnoml code={`[Engine||start()]`} />
```

### Association Types

```svelte
<Nomnoml code={`[Car]->[Engine]
[Car]o->[Manufacturer]
[Car]<:-[Pickup]`} />
```

### Component Diagram

```svelte
<Nomnoml code={`[Component] - [<socket> socket]
[<lollipop> lollipop] - [Component]`} />
```

### Flow Chart

```svelte
<Nomnoml code={`[<start>start] -> [<state>plunder] -> [<choice>more loot] -> [start]`} />
```

### Use Case Diagram

```svelte
<Nomnoml code={`[<actor>User] -> [<usecase>Login]
[<actor>Admin] -> [<usecase>Manage Users]`} />
```

### Complex Class Diagram

```svelte
<Nomnoml code={`[Car|speed: Number;valves: Valve[]]
[Car]+->0..*[RustPatch]
[Car]o->[Manufacturer]
[Car]<:-[Pickup]

[Engine||start()]
[Engine|
  [Cylinder]->1[Piston]
  [Cylinder]->2[Valve]
]`} />
```

### With Directives

```svelte
<Nomnoml code={`#fontSize: 12
#spacing: 40
#padding: 8
[Lorem ipsum]-[dolor sit amet]`} />
```

## Supported Diagram Types

- **Class Diagrams** - UML class relationships
- **Component Diagrams** - Software components and interfaces
- **Flow Charts** - Process flows and state machines
- **Use Case Diagrams** - Actor interactions
- **Tables** - Data tables
- **Custom Styles** - Custom classifier styles

## Directives

Nomnoml supports various directives for customization:

- `#font: Calibri` - Set font family
- `#fontSize: 12` - Set font size
- `#spacing: 40` - Set spacing between nodes
- `#padding: 8` - Set node padding
- `#direction: down | right` - Set layout direction
- `#stroke: #33322E` - Set stroke color
- `#fill: #eee8d5` - Set fill color

For complete directive documentation, visit: [https://www.nomnoml.com](https://www.nomnoml.com)

## Error Handling

If the Nomnoml syntax is invalid, the component will display an error message with details about what went wrong.

## Accessibility

- Diagrams are rendered as SVG, which is accessible to screen readers
- Ensure diagram content is descriptive in the Nomnoml syntax itself
- Consider adding descriptive alt text or captions for complex diagrams

## Documentation

For complete Nomnoml syntax documentation, visit: [https://www.nomnoml.com](https://www.nomnoml.com)

