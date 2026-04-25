import type {
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  FitViewOptions,
  ConnectionLineType,
  DefaultEdgeOptions,
  MarkerType,
} from "@xyflow/svelte";
import type { LayoutOptions } from "$lib/utils/flowLayout";

/**
 * Background variant options
 */
export type BackgroundVariant = "dots" | "lines";

/**
 * Edge type options (built-in + custom)
 */
export type EdgeType =
  | "default"
  | "smoothstep"
  | "bezier"
  | "step"
  | "straight"
  | string;

/**
 * Node drag options
 */
export interface DragOptions {
  /** Whether nodes are draggable */
  draggable?: boolean;
  /** Whether to allow dragging multiple selected nodes */
  selectionDraggable?: boolean;
}

/**
 * Connection options
 */
export interface ConnectionOptions {
  /** Connection line type when dragging new connection */
  connectionLineType?: ConnectionLineType;
  /** Connection radius for proximity detection */
  connectionRadius?: number;
  /** Whether connections are valid */
  isValidConnection?: (connection: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }) => boolean;
}

/**
 * Background configuration
 */
export interface BackgroundConfig {
  /** Background variant */
  variant?: BackgroundVariant;
  /** Pattern color */
  patternColor?: string;
  /** Gap between pattern elements */
  gap?: number;
  /** Pattern size */
  size?: number;
}

/**
 * Controls configuration
 */
export interface ControlsConfig {
  /** Show zoom in button */
  showZoomIn?: boolean;
  /** Show zoom out button */
  showZoomOut?: boolean;
  /** Show fit view button */
  showFitView?: boolean;
  /** Show lock button */
  showLock?: boolean;
}

/**
 * MiniMap configuration
 */
export interface MiniMapConfig {
  /** Whether minimap is zoomable */
  zoomable?: boolean;
  /** Whether minimap is pannable */
  pannable?: boolean;
  /** Minimap height */
  height?: number;
  /** Minimap width */
  width?: number;
  /** Node class function */
  nodeClass?: (node: Node) => string;
  /** Node color function */
  nodeColor?: (node: Node) => string;
  /** Mask color */
  maskColor?: string;
}

/**
 * Panel configuration
 */
export interface PanelConfig {
  /** Panel position */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

/**
 * Complete SvelteFlow component props interface
 */
export interface SvelteFlowProps {
  /** Array of nodes to display in the flow */
  nodes?: Node[];
  /** Array of edges connecting nodes */
  edges?: Edge[];
  /** Custom node types/components */
  nodeTypes?: NodeTypes;
  /** Custom edge types/components */
  edgeTypes?: EdgeTypes;
  /** Default edge options (type, animated, style, etc.) */
  defaultEdgeOptions?: DefaultEdgeOptions;
  /** Default node options */
  defaultNodeOptions?: {
    type?: string;
    selectable?: boolean;
    draggable?: boolean;
    deletable?: boolean;
    connectable?: boolean;
  };
  /** Background configuration */
  background?: BackgroundConfig | boolean;
  /** Controls configuration */
  controls?: ControlsConfig | boolean;
  /** MiniMap configuration */
  minimap?: MiniMapConfig | boolean;
  /** Panel configuration */
  panel?: PanelConfig | boolean;
  /** Whether to fit view on mount */
  fitView?: boolean;
  /** Fit view options */
  fitViewOptions?: FitViewOptions;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Default zoom level */
  defaultZoom?: number;
  /** Container height (default: 400px) */
  height?: string;
  /** Container width (default: 100%) */
  width?: string;
  /** Additional CSS classes */
  class?: string;
  /** Enable automatic smart layout */
  autoLayout?: boolean;
  /** Layout options for autoLayout */
  layoutOptions?: LayoutOptions;
  /** Connection options */
  connection?: ConnectionOptions;
  /** Drag options */
  drag?: DragOptions;
  /** @deprecated Use background prop instead */
  showBackground?: boolean;
  /** @deprecated Use background.variant prop instead */
  backgroundVariant?: BackgroundVariant;
  /** @deprecated Use controls prop instead */
  showControls?: boolean;
  /** @deprecated Use minimap prop instead */
  showMinimap?: boolean;

  /** Event handler for node click */
  onNodeClick?: (event: MouseEvent, node: Node) => void;
  /** Event handler for edge click */
  onEdgeClick?: (event: MouseEvent, edge: Edge) => void;
  /** Event handler for node context menu (right-click) */
  onNodeContextMenu?: (event: MouseEvent, node: Node) => void;
  /** Event handler for pane click (background click) */
  onPaneClick?: (event: MouseEvent) => void;
  /** Event handler for connection */
  onConnect?: (connection: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }) => void;
  /** Event handler before connection */
  onBeforeConnect?: (connection: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }) => boolean | void;
  /** Event handler for node move */
  onMove?: (event: MouseEvent, node: Node) => void;
  /** Event handler for selection change */
  onSelectionChange?: (params: { nodes: Node[]; edges: Edge[] }) => void;
  /** Event handler for nodes change */
  onNodesChange?: (changes: any[]) => void;
  /** Event handler for edges change */
  onEdgesChange?: (changes: any[]) => void;
  /** Children snippet for custom components */
  children?: import("svelte").Snippet;
  /** Whether to delete nodes/edges on key press */
  deleteKeyCode?: string | null;
  /** Whether to allow multiple selection */
  multiSelectionKeyCode?: string | null;
  /** Selection mode */
  selectionMode?: "full" | "partial";
  /** Whether nodes are selectable */
  selectNodesOnDrag?: boolean;
  /** Proximity for connection detection */
  proximityConnectOnConnect?: boolean;
  /** Node origin (for positioning) */
  nodeOrigin?: [number, number];
  /** Whether to snap to grid */
  snapToGrid?: boolean;
  /** Snap grid size */
  snapGrid?: [number, number];
  /** Whether to show attribution */
  attributionPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | null;
}
