# SvelteFlow Component

A comprehensive, production-ready wrapper for [Svelte Flow](https://svelteflow.dev/) with smart defaults, automatic layout, and extensive customization options. Built with TypeScript, Tailwind CSS styling, and support for various use cases out of the box.

## Features

- **Smart Layout Algorithm**: Automatic hierarchical layout with overlap prevention
- **Auto-Zoom**: Intelligent viewport fitting based on graph size
- **Smart Edge Routing**: Automatically determines optimal handle positions (top/bottom/left/right)
- **Multiple Edge Types**: Built-in support for smoothstep, bezier, straight, and custom edges
- **Flexible Configuration**: Extensive props for all features with sensible defaults
- **Dagre Integration**: Optional support for Dagre layout algorithm
- **TypeScript**: Full type safety with comprehensive interfaces
- **Tailwind Styling**: Matches your design system with zinc color palette

## Installation

The component requires `@xyflow/svelte` to be installed:

```bash
npm install @xyflow/svelte
```

Optional: For Dagre layout support:

```bash
npm install @dagrejs/dagre
```

## Basic Usage

```svelte
<script lang="ts">
  import { SvelteFlow } from '$lib/components/SvelteFlow';
  import type { Node, Edge } from '@xyflow/svelte';

  let nodes = $state<Node[]>([
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 200, y: 0 }, data: { label: 'Node 2' } }
  ]);

  let edges = $state<Edge[]>([
    { id: 'e1-2', source: '1', target: '2' }
  ]);
</script>

<SvelteFlow bind:nodes bind:edges />
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `Node[]` | `[]` | Array of nodes (bindable) |
| `edges` | `Edge[]` | `[]` | Array of edges (bindable) |
| `nodeTypes` | `NodeTypes` | `undefined` | Custom node type components |
| `edgeTypes` | `EdgeTypes` | `undefined` | Custom edge type components |
| `defaultEdgeOptions` | `DefaultEdgeOptions` | `{ type: 'smoothstep' }` | Default options for new edges |
| `defaultNodeOptions` | `object` | `undefined` | Default options for new nodes |

### Layout & View

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoLayout` | `boolean` | `false` | Enable automatic smart layout |
| `layoutOptions` | `LayoutOptions` | `undefined` | Options for auto layout |
| `fitView` | `boolean` | `false` | Fit view to nodes on mount |
| `fitViewOptions` | `FitViewOptions` | `undefined` | Options for fit view |
| `minZoom` | `number` | `0.25` | Minimum zoom level |
| `maxZoom` | `number` | `2` | Maximum zoom level |
| `defaultZoom` | `number` | `1` | Default zoom level |

### Background, Controls & Minimap

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `background` | `BackgroundConfig \| boolean` | `true` | Background configuration |
| `controls` | `ControlsConfig \| boolean` | `true` | Controls configuration |
| `minimap` | `MiniMapConfig \| boolean` | `false` | MiniMap configuration |
| `panel` | `PanelConfig \| boolean` | `false` | Panel configuration |

### Connection & Interaction

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `connection` | `ConnectionOptions` | `undefined` | Connection options |
| `deleteKeyCode` | `string \| null` | `undefined` | Key code to delete nodes/edges |
| `multiSelectionKeyCode` | `string \| null` | `undefined` | Key code for multi-selection |
| `selectionMode` | `'full' \| 'partial'` | `'full'` | Selection mode |
| `selectNodesOnDrag` | `boolean` | `true` | Select nodes when dragging |
| `snapToGrid` | `boolean` | `false` | Snap nodes to grid |
| `snapGrid` | `[number, number]` | `undefined` | Grid size for snapping |

### Event Handlers

| Prop | Type | Description |
|------|------|-------------|
| `onNodeClick` | `(event: MouseEvent, node: Node) => void` | Node click handler |
| `onEdgeClick` | `(event: MouseEvent, edge: Edge) => void` | Edge click handler |
| `onNodeContextMenu` | `(event: MouseEvent, node: Node) => void` | Node right-click handler |
| `onPaneClick` | `(event: MouseEvent) => void` | Background click handler |
| `onConnect` | `(connection) => void` | Connection created handler |
| `onBeforeConnect` | `(connection) => boolean \| void` | Before connection validation |
| `onMove` | `(event: MouseEvent, node: Node) => void` | Node moved handler |
| `onSelectionChange` | `(params: { nodes, edges }) => void` | Selection changed handler |
| `onNodesChange` | `(changes) => void` | Nodes changed handler |
| `onEdgesChange` | `(changes) => void` | Edges changed handler |

### Styling

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `string` | `'400px'` | Container height |
| `width` | `string` | `undefined` | Container width |
| `class` | `string` | `''` | Additional CSS classes |

## Configuration Objects

### BackgroundConfig

```typescript
{
  variant?: 'dots' | 'lines' | 'cross';  // Default: 'dots'
  patternColor?: string;                  // Default: 'rgb(228 228 231)'
  gap?: number;                          // Default: 16
  size?: number;                         // Default: 1
}
```

### ControlsConfig

```typescript
{
  showZoomIn?: boolean;     // Default: true
  showZoomOut?: boolean;   // Default: true
  showFitView?: boolean;   // Default: true
  showLock?: boolean;      // Default: false
}
```

### MiniMapConfig

```typescript
{
  zoomable?: boolean;                    // Default: true
  pannable?: boolean;                    // Default: true
  height?: number;                       // Default: 120
  width?: number;                        // Default: 120
  nodeClass?: (node: Node) => string;   // Custom node class
  nodeColor?: (node: Node) => string;    // Custom node color
  maskColor?: string;                    // Default: 'rgba(0, 0, 0, 0.1)'
}
```

### LayoutOptions

```typescript
{
  direction?: 'TB' | 'LR' | 'BT' | 'RL';  // Default: 'TB'
  nodeSpacing?: number;                    // Default: 100
  layerSpacing?: number;                  // Default: 150
  nodeWidth?: number;                      // Default: 250
  nodeHeight?: number;                     // Default: 150
  padding?: number;                        // Default: 50
}
```

### ConnectionOptions

```typescript
{
  connectionLineType?: ConnectionLineType;  // Default: 'smoothstep'
  connectionRadius?: number;                // Proximity detection radius
  isValidConnection?: (connection) => boolean;  // Validation function
}
```

## Examples

### With Auto Layout

```svelte
<SvelteFlow
  bind:nodes
  bind:edges
  autoLayout={true}
  fitView={true}
  layoutOptions={{
    direction: 'LR',
    nodeSpacing: 120,
    layerSpacing: 200
  }}
/>
```

### Custom Background

```svelte
<SvelteFlow
  bind:nodes
  bind:edges
  background={{
    variant: 'dots',
    patternColor: '#aaa',
    gap: 20
  }}
/>
```

### With Minimap

```svelte
<SvelteFlow
  bind:nodes
  bind:edges
  minimap={{
    zoomable: true,
    pannable: true,
    height: 150,
    nodeClass: (node) => node.type || 'default'
  }}
/>
```

### Custom Edge Types

```svelte
<script lang="ts">
  import { SvelteFlow } from '$lib/components/SvelteFlow';
  import CustomEdge from './CustomEdge.svelte';
  import type { EdgeTypes } from '@xyflow/svelte';

  const edgeTypes: EdgeTypes = {
    custom: CustomEdge
  };

  let edges = $state<Edge[]>([
    { id: 'e1', source: '1', target: '2', type: 'custom' }
  ]);
</script>

<SvelteFlow bind:nodes bind:edges {edgeTypes} />
```

### Connection Validation

```svelte
<SvelteFlow
  bind:nodes
  bind:edges
  connection={{
    isValidConnection: (connection) => {
      // Only allow connections from 'input' type nodes
      const sourceNode = nodes.find(n => n.id === connection.source);
      return sourceNode?.type === 'input';
    }
  }}
/>
```

### Custom Event Handlers

```svelte
<script lang="ts">
  function handleConnect(connection) {
    console.log('New connection:', connection);
    edges = [...edges, {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target
    }];
  }

  function handleSelectionChange({ nodes, edges }) {
    console.log('Selected:', { nodes, edges });
  }
</script>

<SvelteFlow
  bind:nodes
  bind:edges
  onConnect={handleConnect}
  onSelectionChange={handleSelectionChange}
/>
```

### Using Panel Component

```svelte
<SvelteFlow bind:nodes bind:edges panel={{ position: 'top-right' }}>
  <button onclick={() => applyLayout('TB')}>Vertical Layout</button>
  <button onclick={() => applyLayout('LR')}>Horizontal Layout</button>
</SvelteFlow>
```

## Built-in Edge Types

The component includes a `button` edge type by default, which allows deleting edges by clicking a button on the edge.

```svelte
let edges = $state<Edge[]>([
  { id: 'e1', source: '1', target: '2', type: 'button' }
]);
```

## Auto Layout Features

### Smart Positioning

- Automatically arranges nodes in hierarchical layers
- Prevents node overlapping
- Configurable spacing and direction

### Smart Edge Routing

- Automatically determines handle positions:
  - **Horizontal layouts (LR)**: Right/Left handles
  - **Vertical layouts (TB)**: Bottom/Top handles
- Ensures edges connect in a readable way

### Auto-Zoom

- Calculates optimal zoom level to fit all nodes
- Respects container dimensions and padding
- Works with any number of nodes

## Styling

The component uses Tailwind CSS classes and matches your zinc color palette:

- **Nodes**: White background, zinc borders, subtle shadows
- **Edges**: Zinc-500 stroke, smoothstep curves
- **Handles**: Zinc-500 background, white border
- **Controls**: Minimal styling with zinc borders

All styles are scoped to `.svelteflow-container` to avoid conflicts.

## Integration with CardNode and ListNode

The component works seamlessly with `CardNode` and `ListNode` components:

```svelte
<script lang="ts">
  import { SvelteFlow } from '$lib/components/SvelteFlow';
  import { CardNode, ListNode } from '$lib/components';
  import type { NodeTypes } from '@xyflow/svelte';

  const nodeTypes: NodeTypes = {
    card: CardNode,
    list: ListNode
  };

  let nodes = $state<Node[]>([
    {
      id: '1',
      type: 'card',
      position: { x: 0, y: 0 },
      data: {
        title: 'My Node',
        description: 'Node description'
      }
    }
  ]);
</script>

<SvelteFlow bind:nodes bind:edges {nodeTypes} />
```

## Advanced Usage

### Dagre Layout

When `@dagrejs/dagre` is installed, you can use it for layout:

```svelte
<script lang="ts">
  import { applyDagreLayout } from '$lib/components/SvelteFlow/utils/dagreLayout';
  
  async function applyLayout() {
    const layouted = await applyDagreLayout(nodes, edges, {
      dagreRankdir: 'LR',
      nodeWidth: 200,
      nodeHeight: 100
    });
    nodes = layouted.nodes;
    edges = layouted.edges;
  }
</script>
```

### Custom Node Types with Handles

```svelte
<!-- CustomNode.svelte -->
<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  
  let { data }: NodeProps = $props();
</script>

<div class="custom-node">
  <Handle type="target" position={Position.Top} />
  <div>{data.label}</div>
  <Handle type="source" position={Position.Bottom} />
</div>
```

### Edge Markers

```svelte
<script lang="ts">
  import { MarkerType } from '@xyflow/svelte';
  
  let edges = $state<Edge[]>([
    {
      id: 'e1',
      source: '1',
      target: '2',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#FF4000'
      }
    }
  ]);
</script>
```

## Best Practices

1. **Use autoLayout for complex graphs**: Let the algorithm handle positioning
2. **Enable fitView**: Ensure all nodes are visible on mount
3. **Use smoothstep edges**: Better readability than straight lines
4. **Configure handle positions**: Let the layout algorithm set them automatically
5. **Customize backgrounds**: Use different variants for different contexts
6. **Enable minimap**: For large graphs, helps with navigation

## Troubleshooting

### Nodes not visible
- Check that nodes have valid positions
- Enable `fitView` to auto-zoom to nodes
- Verify container has height

### Layout not applying
- Ensure `autoLayout={true}` is set
- Check that nodes and edges are properly initialized
- Wait for component to initialize (check for "Loading..." message)

### Edges not connecting properly
- Verify handle positions are set on nodes
- Check that source/target node IDs match edge definitions
- Enable smart layout for automatic handle positioning

## Resources

- [Svelte Flow Documentation](https://svelteflow.dev/)
- [Svelte Flow API Reference](https://svelteflow.dev/api-reference)
- [Svelte Flow Examples](https://svelteflow.dev/examples)
- [Dagre Documentation](https://github.com/dagrejs/dagre)

## Component Structure

```
SvelteFlow/
├── SvelteFlow.svelte       # Main component
├── types.ts                # TypeScript interfaces
├── index.ts                # Exports
├── edges/
│   └── ButtonEdge.svelte  # Custom edge type
└── utils/
    ├── defaults.ts         # Default configurations
    └── dagreLayout.ts      # Dagre integration (optional)
```

