import type { Node, Edge } from '@xyflow/svelte';

// Position type (matching CardNode/ListNode expectations)
type PositionType = 'top' | 'right' | 'bottom' | 'left';

const Position = {
	Top: 'top' as PositionType,
	Bottom: 'bottom' as PositionType,
	Left: 'left' as PositionType,
	Right: 'right' as PositionType
};

export interface LayoutOptions {
	/** Direction of the layout */
	direction?: 'TB' | 'LR' | 'BT' | 'RL';
	/** Spacing between nodes */
	nodeSpacing?: number;
	/** Minimum spacing between layers */
	layerSpacing?: number;
	/** Node width (estimated) */
	nodeWidth?: number;
	/** Node height (estimated) */
	nodeHeight?: number;
	/** Padding around the entire layout */
	padding?: number;
}

export interface LayoutedGraph {
	nodes: Node[];
	edges: Edge[];
	bounds: {
		width: number;
		height: number;
		minX: number;
		minY: number;
	};
}

const DEFAULT_NODE_WIDTH = 250;
const DEFAULT_NODE_HEIGHT = 150;
const DEFAULT_NODE_SPACING = 100;
const DEFAULT_LAYER_SPACING = 150;
const DEFAULT_PADDING = 50;

/**
 * Build adjacency lists for efficient graph traversal
 */
function buildGraph(nodes: Node[], edges: Edge[]) {
	const inEdges = new Map<string, string[]>();
	const outEdges = new Map<string, string[]>();
	const nodeMap = new Map<string, Node>();

	nodes.forEach((node) => {
		inEdges.set(node.id, []);
		outEdges.set(node.id, []);
		nodeMap.set(node.id, node);
	});

	edges.forEach((edge) => {
		const sourceList = outEdges.get(edge.source);
		const targetList = inEdges.get(edge.target);
		if (sourceList && targetList) {
			sourceList.push(edge.target);
			targetList.push(edge.source);
		}
	});

	return { inEdges, outEdges, nodeMap };
}

/**
 * Find nodes with no incoming edges (roots)
 */
function findRoots(nodes: Node[], inEdges: Map<string, string[]>): string[] {
	return nodes.filter((node) => {
		const incoming = inEdges.get(node.id) || [];
		return incoming.length === 0;
	}).map((node) => node.id);
}

/**
 * Assign layers using BFS from roots
 */
function assignLayers(
	nodes: Node[],
	inEdges: Map<string, string[]>,
	outEdges: Map<string, string[]>
): Map<string, number> {
	const layers = new Map<string, number>();
	const visited = new Set<string>();
	const queue: Array<{ id: string; layer: number }> = [];

	// Find roots and assign layer 0
	const roots = findRoots(nodes, inEdges);
	if (roots.length === 0 && nodes.length > 0) {
		// If no roots (cyclic graph), start with first node
		roots.push(nodes[0].id);
	}

	roots.forEach((root) => {
		queue.push({ id: root, layer: 0 });
		layers.set(root, 0);
		visited.add(root);
	});

	// BFS to assign layers
	while (queue.length > 0) {
		const { id, layer } = queue.shift()!;
		const outgoing = outEdges.get(id) || [];

		for (const targetId of outgoing) {
			if (!visited.has(targetId)) {
				visited.add(targetId);
				layers.set(targetId, layer + 1);
				queue.push({ id: targetId, layer: layer + 1 });
			} else {
				// Handle cycles - keep max layer
				const existingLayer = layers.get(targetId) || 0;
				layers.set(targetId, Math.max(existingLayer, layer + 1));
			}
		}
	}

	// Handle disconnected nodes
	nodes.forEach((node) => {
		if (!layers.has(node.id)) {
			const maxLayer = Math.max(...Array.from(layers.values()), -1);
			layers.set(node.id, maxLayer + 1);
		}
	});

	return layers;
}

/**
 * Position nodes within layers (handle node overlap)
 */
function positionNodesInLayers(
	nodes: Node[],
	layers: Map<string, number>,
	options: Required<LayoutOptions>
): Map<string, { x: number; y: number }> {
	const positions = new Map<string, { x: number; y: number }>();
	const nodesByLayer = new Map<number, Node[]>();

	// Group nodes by layer
	nodes.forEach((node) => {
		const layer = layers.get(node.id) || 0;
		if (!nodesByLayer.has(layer)) {
			nodesByLayer.set(layer, []);
		}
		nodesByLayer.get(layer)!.push(node);
	});

	// Calculate positions for each layer
	const maxLayer = Math.max(...Array.from(layers.values()), 0);

	for (let layer = 0; layer <= maxLayer; layer++) {
		const layerNodes = nodesByLayer.get(layer) || [];
		
		if (layerNodes.length === 0) continue;

		// Sort nodes by ID for consistent positioning
		layerNodes.sort((a, b) => a.id.localeCompare(b.id));

		// Calculate total width needed
		const totalWidth = layerNodes.length * options.nodeWidth + 
			(layerNodes.length - 1) * options.nodeSpacing;

		// Start X position (center horizontally)
		let currentX = -totalWidth / 2 + options.nodeWidth / 2;

		// Assign positions
		layerNodes.forEach((node) => {
			const isHorizontal = options.direction === 'LR' || options.direction === 'RL';
			
			if (isHorizontal) {
				positions.set(node.id, {
					x: layer * options.layerSpacing,
					y: currentX
				});
			} else {
				positions.set(node.id, {
					x: currentX,
					y: layer * options.layerSpacing
				});
			}

			currentX += options.nodeWidth + options.nodeSpacing;
		});
	}

	return positions;
}

/**
 * Determine optimal handle position for an edge
 */
function getOptimalHandlePosition(
	sourceNode: Node,
	targetNode: Node,
	direction: LayoutOptions['direction'] = 'TB'
): { source: PositionType; target: PositionType } {
	const isHorizontal = direction === 'LR' || direction === 'RL';
	const isReversed = direction === 'BT' || direction === 'RL';

	if (!sourceNode.position || !targetNode.position) {
			return { source: Position.Top, target: Position.Bottom };
	}

	const sourceX = sourceNode.position.x;
	const sourceY = sourceNode.position.y;
	const targetX = targetNode.position.x;
	const targetY = targetNode.position.y;

	if (isHorizontal) {
		// Horizontal layout: use left/right handles
		if (isReversed) {
			// Right to Left (RL): source on right connects to target on left
			return {
				source: Position.Left,
				target: Position.Right
			};
		} else {
			// Left to Right (LR): source on left connects from right side, target on right connects to left side
			return {
				source: Position.Right,
				target: Position.Left
			};
		}
	} else {
		// Vertical layout: use top/bottom handles
		if (isReversed) {
			// Bottom to Top
			return {
				source: sourceY > targetY ? Position.Top : Position.Bottom,
				target: targetY > sourceY ? Position.Bottom : Position.Top
			};
		} else {
			// Top to Bottom
			return {
				source: sourceY < targetY ? Position.Bottom : Position.Top,
				target: targetY < sourceY ? Position.Top : Position.Bottom
			};
		}
	}
}

/**
 * Calculate bounding box of all nodes
 */
function calculateBounds(
	nodes: Node[],
	options: Required<LayoutOptions>
): { width: number; height: number; minX: number; minY: number } {
	if (nodes.length === 0) {
		return { width: 0, height: 0, minX: 0, minY: 0 };
	}

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	nodes.forEach((node) => {
		if (node.position) {
			const halfWidth = options.nodeWidth / 2;
			const halfHeight = options.nodeHeight / 2;

			minX = Math.min(minX, node.position.x - halfWidth);
			minY = Math.min(minY, node.position.y - halfHeight);
			maxX = Math.max(maxX, node.position.x + halfWidth);
			maxY = Math.max(maxY, node.position.y + halfHeight);
		}
	});

	const width = maxX - minX + 2 * options.padding;
	const height = maxY - minY + 2 * options.padding;

	return {
		width: Math.max(width, options.nodeWidth + 2 * options.padding),
		height: Math.max(height, options.nodeHeight + 2 * options.padding),
		minX: minX - options.padding,
		minY: minY - options.padding
	};
}

/**
 * Apply smart layout to nodes and edges
 * 
 * @param nodes - Array of nodes to layout
 * @param edges - Array of edges connecting nodes
 * @param options - Layout options
 * @returns Layouted graph with positioned nodes and smart edge routing
 */
export function applySmartLayout(
	nodes: Node[],
	edges: Edge[],
	options: LayoutOptions = {}
): LayoutedGraph {
	if (nodes.length === 0) {
		return {
			nodes: [],
			edges: [],
			bounds: { width: 0, height: 0, minX: 0, minY: 0 }
		};
	}

	const opts: Required<LayoutOptions> = {
		direction: options.direction || 'TB',
		nodeSpacing: options.nodeSpacing || DEFAULT_NODE_SPACING,
		layerSpacing: options.layerSpacing || DEFAULT_LAYER_SPACING,
		nodeWidth: options.nodeWidth || DEFAULT_NODE_WIDTH,
		nodeHeight: options.nodeHeight || DEFAULT_NODE_HEIGHT,
		padding: options.padding || DEFAULT_PADDING
	};

	// Build graph structure
	const { inEdges, outEdges } = buildGraph(nodes, edges);

	// Assign layers
	const layers = assignLayers(nodes, inEdges, outEdges);

	// Position nodes
	const positions = positionNodesInLayers(nodes, layers, opts);

	// Apply positions to nodes
	const layoutedNodes = nodes.map((node) => {
		const pos = positions.get(node.id) || { x: 0, y: 0 };
		return {
			...node,
			position: { x: pos.x, y: pos.y }
		};
	});

	// Update nodes with smart handle positions based on their connections
	const nodeConnections = new Map<string, { sources: string[]; targets: string[] }>();
	
	edges.forEach((edge) => {
		if (!nodeConnections.has(edge.source)) {
			nodeConnections.set(edge.source, { sources: [], targets: [] });
		}
		if (!nodeConnections.has(edge.target)) {
			nodeConnections.set(edge.target, { sources: [], targets: [] });
		}
		
		nodeConnections.get(edge.source)!.targets.push(edge.target);
		nodeConnections.get(edge.target)!.sources.push(edge.source);
	});

	// Update nodes with optimal handle positions based on their actual connections
	const finalNodes = layoutedNodes.map((node) => {
		const connections = nodeConnections.get(node.id) || { sources: [], targets: [] };
		const nodeData: any = { ...node.data }; // Start with existing data
		
		// Collect all handle positions this node needs
		const sourcePositions = new Set<PositionType>();
		const targetPositions = new Set<PositionType>();
		
		// For each outgoing edge, determine the source handle position
		for (const targetId of connections.targets) {
			const targetNode = layoutedNodes.find((n) => n.id === targetId);
			if (targetNode) {
				const handlePos = getOptimalHandlePosition(node, targetNode, opts.direction);
				sourcePositions.add(handlePos.source);
			}
		}
		
		// For each incoming edge, determine the target handle position
		for (const sourceId of connections.sources) {
			const sourceNode = layoutedNodes.find((n) => n.id === sourceId);
			if (sourceNode) {
				const handlePos = getOptimalHandlePosition(sourceNode, node, opts.direction);
				targetPositions.add(handlePos.target);
			}
		}
		
		// Set the primary handle positions based on layout direction
		if (sourcePositions.size > 0) {
			const isHorizontal = opts.direction === 'LR' || opts.direction === 'RL';
			if (isHorizontal) {
				// For horizontal layouts, prefer Right for sources
				nodeData.sourcePosition = Position.Right;
			} else {
				// For vertical layouts, prefer Bottom for sources
				nodeData.sourcePosition = Position.Bottom;
			}
		}
		
		if (targetPositions.size > 0) {
			const isHorizontal = opts.direction === 'LR' || opts.direction === 'RL';
			if (isHorizontal) {
				// For horizontal layouts, prefer Left for targets
				nodeData.targetPosition = Position.Left;
			} else {
				// For vertical layouts, prefer Top for targets
				nodeData.targetPosition = Position.Top;
			}
		}

		return {
			...node,
			data: nodeData
		};
	});

	// Ensure all edges use smoothstep (curved) instead of straight lines
	const layoutedEdges = edges.map((edge) => ({
		...edge,
		type: edge.type || 'smoothstep' // Default to smoothstep for curved edges
	}));

	// Calculate bounds using final nodes
	const bounds = calculateBounds(finalNodes, opts);

	return {
		nodes: finalNodes,
		edges: layoutedEdges,
		bounds
	};
}

/**
 * Calculate optimal zoom and pan for fit view
 * 
 * @param bounds - Bounding box of all nodes
 * @param containerWidth - Width of the container
 * @param containerHeight - Height of the container
 * @param padding - Padding around nodes (in pixels)
 * @returns Fit view options with zoom and center position
 */
export function calculateFitView(
	bounds: { width: number; height: number; minX: number; minY: number },
	containerWidth: number,
	containerHeight: number,
	padding: number = 20
): { zoom: number; center: { x: number; y: number } } {
	const graphWidth = bounds.width;
	const graphHeight = bounds.height;
	const centerX = bounds.minX + graphWidth / 2;
	const centerY = bounds.minY + graphHeight / 2;

	// Calculate zoom to fit both dimensions
	const zoomX = (containerWidth - 2 * padding) / graphWidth;
	const zoomY = (containerHeight - 2 * padding) / graphHeight;
	const zoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 1.0

	return {
		zoom: Math.max(zoom, 0.1), // Minimum zoom 0.1
		center: { x: centerX, y: centerY }
	};
}

/**
 * Helper to apply layout and get fit view options in one call
 */
export function layoutAndFitView(
	nodes: Node[],
	edges: Edge[],
	containerWidth: number,
	containerHeight: number,
	layoutOptions?: LayoutOptions,
	fitViewPadding?: number
) {
	const layouted = applySmartLayout(nodes, edges, layoutOptions);
	const fitView = calculateFitView(
		layouted.bounds,
		containerWidth,
		containerHeight,
		fitViewPadding
	);

	return {
		...layouted,
		fitView
	};
}

