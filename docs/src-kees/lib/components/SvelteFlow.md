# SvelteFlow Component

Interactive node-based flow diagram component built on top of Svelte Flow. Supports custom nodes, edges, and interactive editing of flow diagrams.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `Node[]` | `[]` | Array of nodes to display (bindable) |
| `edges` | `Edge[]` | `[]` | Array of edges connecting nodes (bindable) |
| `nodeTypes` | `NodeTypes` | `undefined` | Custom node type components |
| `edgeTypes` | `EdgeTypes` | `undefined` | Custom edge type components |
| `showMinimap` | `boolean` | `true` | Whether to show minimap |
| `showControls` | `boolean` | `true` | Whether to show zoom/pan controls |
| `showBackground` | `boolean` | `true` | Whether to show background grid |
| `backgroundVariant` | `'dots' \| 'lines'` | `'dots'` | Background pattern variant |
| `fitView` | `boolean` | `false` | Whether to fit view on mount |
| `fitViewOptions` | `FitViewOptions` | `undefined` | Options for fit view behavior |
| `minZoom` | `number` | `0.5` | Minimum zoom level |
| `maxZoom` | `number` | `2` | Maximum zoom level |
| `defaultZoom` | `number` | `1` | Default zoom level |
| `height` | `string` | `'400px'` | Container height |
| `class` | `string` | `''` | Additional CSS classes |
| `onNodeClick` | `(event: MouseEvent, node: Node) => void` | `undefined` | Node click handler |
| `onEdgeClick` | `(event: MouseEvent, edge: Edge) => void` | `undefined` | Edge click handler |
| `onNodeContextMenu` | `(event: MouseEvent, node: Node) => void` | `undefined` | Node context menu (right-click) handler |
| `onPaneClick` | `(event: MouseEvent) => void` | `undefined` | Pane (background) click handler |

## Examples

### Basic Flow

```svelte
<script>
  import { SvelteFlow } from '$lib/components';
  import type { Node, Edge } from '@xyflow/svelte';

  let nodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 200, y: 0 }, data: { label: 'Node 2' } },
    { id: '3', position: { x: 400, y: 0 }, data: { label: 'Node 3' } }
  ];

  let edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' }
  ];
</script>

<SvelteFlow bind:nodes bind:edges />
```

### With Custom Height

```svelte
<SvelteFlow 
  bind:nodes 
  bind:edges 
  height="600px" 
/>
```

### Without Minimap

```svelte
<SvelteFlow 
  bind:nodes 
  bind:edges 
  showMinimap={false} 
/>
```

### With Event Handlers

```svelte
<script>
  function handleNodeClick(event: MouseEvent, node: Node) {
    console.log('Node clicked:', node);
  }

  function handleEdgeClick(event: MouseEvent, edge: Edge) {
    console.log('Edge clicked:', edge);
  }

  function handleNodeContextMenu(event: MouseEvent, node: Node) {
    event.preventDefault();
    console.log('Node right-clicked:', node);
    // Show context menu
  }

  function handlePaneClick(event: MouseEvent) {
    console.log('Pane clicked');
    // Close context menu, etc.
  }
</script>

<SvelteFlow 
  bind:nodes 
  bind:edges 
  onNodeClick={handleNodeClick}
  onEdgeClick={handleEdgeClick}
  onNodeContextMenu={handleNodeContextMenu}
  onPaneClick={handlePaneClick}
/>
```

### Lines Background

```svelte
<SvelteFlow 
  bind:nodes 
  bind:edges 
  backgroundVariant="lines" 
/>
```

### Fit View on Mount

```svelte
<SvelteFlow 
  bind:nodes 
  bind:edges 
  fitView={true} 
/>
```

### Custom Zoom Range

```svelte
<SvelteFlow 
  bind:nodes 
  bind:edges 
  minZoom={0.25}
  maxZoom={4}
  defaultZoom={1.5}
/>
```

## Node Types

Svelte Flow supports default node types:
- `default` - Basic node
- `input` - Input node (with source handle only)
- `output` - Output node (with target handle only)

You can define custom node types using the `nodeTypes` prop:

```svelte
<script>
  import { SvelteFlow } from '$lib/components';
  import type { NodeTypes, NodeProps } from '@xyflow/svelte';
  import CustomNode from './CustomNode.svelte';

  const nodeTypes: NodeTypes = {
    custom: CustomNode
  };

  let nodes = [
    { 
      id: '1', 
      type: 'custom',
      position: { x: 0, y: 0 }, 
      data: { label: 'Custom Node' } 
    }
  ];
</script>

<SvelteFlow bind:nodes nodeTypes={nodeTypes} />
```

## Edge Types

Svelte Flow supports default edge types:
- `default` - Straight edge
- `smoothstep` - Smooth step edge
- `bezier` - Bezier curve edge

You can define custom edge types using the `edgeTypes` prop:

```svelte
<script>
  import { SvelteFlow } from '$lib/components';
  import type { EdgeTypes } from '@xyflow/svelte';
  import CustomEdge from './CustomEdge.svelte';

  const edgeTypes: EdgeTypes = {
    custom: CustomEdge
  };

  let edges = [
    { 
      id: 'e1-2', 
      type: 'custom',
      source: '1', 
      target: '2' 
    }
  ];
</script>

<SvelteFlow bind:edges edgeTypes={edgeTypes} />
```

## Styling

The component uses the zinc color palette to match the design system:
- Node text: `zinc-900`
- Handles: `zinc-500`
- Edges: `zinc-500`
- Selected edges: `zinc-600`
- Borders: `zinc-200`
- Background: white

## Interaction

The component supports:
- **Drag nodes** - Click and drag to reposition nodes
- **Connect nodes** - Drag from source handle to target handle to create edges
- **Zoom** - Mouse wheel or controls
- **Pan** - Click and drag background or use controls
- **Select** - Click nodes or edges to select them
- **Context menu** - Right-click on nodes to show custom context menus
- **Event handlers** - Respond to clicks, context menus, and pane interactions

## Two-Way Binding

Nodes and edges are bindable, so changes made through the UI are automatically reflected:

```svelte
<SvelteFlow bind:nodes bind:edges />

<!-- Nodes and edges will be updated when user interacts with the flow -->
```

### Context Menu Example

```svelte
<script>
  import { SvelteFlow } from '$lib/components';
  import type { Node, Edge } from '@xyflow/svelte';
  
  let nodes = $state<Node[]>([
    { id: '1', position: { x: 100, y: 100 }, data: { label: 'Right-click me!' } }
  ]);
  let edges = $state<Edge[]>([]);
  let contextMenuState = $state<{ id: string; x: number; y: number } | null>(null);

  function handleNodeContextMenu(event: MouseEvent, node: Node) {
    event.preventDefault();
    contextMenuState = {
      id: node.id,
      x: event.clientX,
      y: event.clientY
    };
  }

  function handlePaneClick() {
    contextMenuState = null;
  }
</script>

<div class="relative">
  <SvelteFlow 
    bind:nodes 
    bind:edges={[]}
    onNodeContextMenu={handleNodeContextMenu}
    onPaneClick={handlePaneClick}
  />
  {#if contextMenuState}
    <div 
      class="absolute bg-white border rounded-lg shadow-lg p-2 z-50"
      style="left: {contextMenuState.x}px; top: {contextMenuState.y}px;"
    >
      <div onclick={() => console.log('Action 1')}>Action 1</div>
      <div onclick={() => console.log('Action 2')}>Action 2</div>
      <div onclick={() => contextMenuState = null}>Close</div>
    </div>
  {/if}
</div>
```

## Additional Resources

For more information about Svelte Flow features:
- [Svelte Flow Documentation](https://svelteflow.dev)
- [Svelte Flow API Reference](https://svelteflow.dev/api-reference)
- [Svelte Flow Examples](https://svelteflow.dev/examples)
- [Custom Nodes Guide](https://svelteflow.dev/learn/customization/custom-nodes)
- [Custom Edges Guide](https://svelteflow.dev/learn/customization/custom-edges)

