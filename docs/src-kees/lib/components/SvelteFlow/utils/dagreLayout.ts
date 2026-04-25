/**
 * Dagre layout integration for SvelteFlow
 * 
 * This utility provides Dagre-based hierarchical layout when @dagrejs/dagre is available.
 * Falls back to the built-in smart layout if Dagre is not installed.
 */

import type { Node, Edge } from '@xyflow/svelte';
import type { LayoutOptions } from '$lib/utils/flowLayout';
import { Position } from '@xyflow/svelte';

export interface DagreLayoutOptions extends LayoutOptions {
	/** Use Dagre layout algorithm (requires @dagrejs/dagre package) */
	useDagre?: boolean;
	/** Dagre-specific rankdir (TB, LR, BT, RL) */
	dagreRankdir?: 'TB' | 'LR' | 'BT' | 'RL';
}

/**
 * Apply Dagre layout to nodes and edges
 * Requires @dagrejs/dagre to be installed
 */
export async function applyDagreLayout(
	nodes: Node[],
	edges: Edge[],
	options: DagreLayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
	try {
		const dagreModule = await import('@dagrejs/dagre');
		const dagre = dagreModule.default || dagreModule;
		
		const dagreGraph = new dagre.graphlib.Graph();
		dagreGraph.setDefaultEdgeLabel(() => ({}));
		
		const nodeWidth = options.nodeWidth || 250;
		const nodeHeight = options.nodeHeight || 150;
		const rankdir = options.dagreRankdir || options.direction || 'TB';
		const isHorizontal = rankdir === 'LR' || rankdir === 'RL';
		
		dagreGraph.setGraph({ rankdir });
		
		// Add nodes to dagre graph
		nodes.forEach((node) => {
			dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
		});
		
		// Add edges to dagre graph
		edges.forEach((edge) => {
			dagreGraph.setEdge(edge.source, edge.target);
		});
		
		// Run dagre layout
		dagre.layout(dagreGraph);
		
		// Apply positions to nodes
		const layoutedNodes = nodes.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			
			// Set handle positions based on direction
			const nodeCopy: any = {
				...node,
				targetPosition: isHorizontal ? Position.Left : Position.Top,
				sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
				position: {
					x: nodeWithPosition.x - nodeWidth / 2,
					y: nodeWithPosition.y - nodeHeight / 2
				}
			};
			
			return nodeCopy;
		});
		
		return {
			nodes: layoutedNodes,
			edges: edges.map((edge) => ({
				...edge,
				type: edge.type || 'smoothstep'
			}))
		};
	} catch (error) {
		console.warn('Dagre not available, falling back to built-in layout:', error);
		// Fallback to built-in layout
		const { applySmartLayout } = await import('$lib/utils/flowLayout');
		const result = applySmartLayout(nodes, edges, options);
		return {
			nodes: result.nodes,
			edges: result.edges
		};
	}
}

/**
 * Check if Dagre is available
 */
export async function isDagreAvailable(): Promise<boolean> {
	try {
		await import('@dagrejs/dagre');
		return true;
	} catch {
		return false;
	}
}

