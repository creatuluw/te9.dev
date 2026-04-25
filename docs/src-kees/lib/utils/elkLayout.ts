/**
 * ELK (Eclipse Layout Kernel) integration for SvelteFlow
 *
 * This utility provides ELK-based hierarchical layout when elkjs is available.
 * Falls back to the built-in smart layout if ELK is not installed.
 */

import type { Node, Edge } from "@xyflow/svelte";
import { Position } from "@xyflow/svelte";

export interface ElkLayoutOptions {
  /** ELK algorithm (default: 'layered') */
  algorithm?: string;
  /** Direction: 'DOWN', 'RIGHT', 'UP', 'LEFT' */
  direction?: "DOWN" | "RIGHT" | "UP" | "LEFT";
  /** Spacing between nodes in the same layer */
  nodeSpacing?: number;
  /** Spacing between layers */
  layerSpacing?: number;
  /** Node width */
  nodeWidth?: number;
  /** Node height */
  nodeHeight?: number;
}

/**
 * Apply ELK layout to nodes and edges
 * Requires elkjs to be installed
 */
export async function applyElkLayout(
  nodes: Node[],
  edges: Edge[],
  options: ElkLayoutOptions = {},
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  try {
    const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
    const elk = new ELK();

    const direction = options.direction || "RIGHT";
    const isHorizontal = direction === "RIGHT" || direction === "LEFT";
    const nodeWidth = options.nodeWidth || 280;
    const nodeHeight = options.nodeHeight || 350;
    const nodeSpacing = options.nodeSpacing || 80;
    const layerSpacing = options.layerSpacing || 100;

    const elkOptions = {
      "elk.algorithm": options.algorithm || "layered",
      "elk.direction": direction,
      "elk.layered.spacing.nodeNodeBetweenLayers": String(layerSpacing),
      "elk.spacing.nodeNode": String(nodeSpacing),
    };

    const graph = {
      id: "root",
      layoutOptions: elkOptions,
      children: nodes.map((node) => ({
        ...node,
        // Adjust handle positions based on layout direction
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        // Hardcode width and height for elk
        width: nodeWidth,
        height: nodeHeight,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    const layoutedGraph = await elk.layout(graph);

    const layoutedNodes = (layoutedGraph.children ?? []).map((node: any) => ({
      ...node,
      // SvelteFlow expects position property
      position: { x: node.x, y: node.y },
    }));

    // Map ELK edges back to SvelteFlow Edge format
    const layoutedEdges: Edge[] = (layoutedGraph.edges ?? []).map(
      (elkEdge: any) => ({
        ...edges.find((e) => e.id === elkEdge.id),
        id: elkEdge.id,
        source: elkEdge.sources?.[0] ?? "",
        target: elkEdge.targets?.[0] ?? "",
      }),
    );

    return {
      nodes: layoutedNodes,
      edges: layoutedEdges.length > 0 ? layoutedEdges : edges,
    };
  } catch (error) {
    console.warn("ELK not available, falling back to built-in layout:", error);
    // Fallback to built-in layout
    const { applySmartLayout } = await import("$lib/utils/flowLayout");
    const directionMap: Record<string, "TB" | "LR"> = {
      DOWN: "TB",
      RIGHT: "LR",
      UP: "TB",
      LEFT: "LR",
    };
    const result = applySmartLayout(nodes, edges, {
      direction: directionMap[options.direction || "RIGHT"] || "LR",
      nodeSpacing: options.nodeSpacing,
      layerSpacing: options.layerSpacing,
      nodeWidth: options.nodeWidth,
      nodeHeight: options.nodeHeight,
    });
    return {
      nodes: result.nodes,
      edges: result.edges,
    };
  }
}

/**
 * Check if ELK is available
 */
export async function isElkAvailable(): Promise<boolean> {
  try {
    await import("elkjs");
    return true;
  } catch {
    return false;
  }
}
