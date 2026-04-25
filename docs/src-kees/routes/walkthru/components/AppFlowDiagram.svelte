<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SvelteFlow from "$lib/components/SvelteFlow.svelte";
    import type { Node, Edge } from "@xyflow/svelte";
    import { MarkerType } from "@xyflow/svelte";
    import type { FlowNode, FlowEdge } from "../types";

    interface Props {
        nodes: FlowNode[];
        edges: FlowEdge[];
        currentSlideId?: string;
        onNodeClick?: (nodeId: string) => void;
    }

    let {
        nodes = [],
        edges = [],
        currentSlideId,
        onNodeClick,
    }: Props = $props();

    const dispatch = createEventDispatcher<{
        nodeclick: { nodeId: string; node: FlowNode };
    }>();

    function convertToSvelteFlowNodes(
        inputNodes: FlowNode[],
        activeRoute?: string,
    ): Node[] {
        return inputNodes.map((node) => ({
            id: node.id,
            type: "default",
            position: node.position || { x: 0, y: 0 },
            data: {
                label: node.label,
                description: node.description,
                jobs: node.jobs,
                color: node.color,
            },
            style: `width: 180px; background: ${node.color || "#fff"}; color: #fff; border-radius: 8px; padding: 10px 15px; font-size: 12px; font-weight: 500`,
            class: activeRoute === node.route ? "active-node" : "",
        }));
    }

    function convertToSvelteFlowEdges(inputEdges: FlowEdge[]): Edge[] {
        return inputEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            animated: edge.animated,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
            },
            style: "stroke: #d4d4d8; stroke-width: 1",
            labelStyle: "fill: #71717a; font-weight: 400; font-size: 11",
            type: "smoothstep",
        }));
    }

    let flowNodes = $state<Node[]>([]);
    let flowEdges = $state<Edge[]>([]);

    $effect(() => {
        if (nodes && nodes.length > 0) {
            flowNodes = convertToSvelteFlowNodes(nodes, currentSlideId);
        }
        if (edges && edges.length > 0) {
            flowEdges = convertToSvelteFlowEdges(edges);
        }
    });

    function handleNodeClick(_event: MouseEvent, node: Node) {
        const clickedNode = nodes.find((n) => n.id === node.id);
        if (clickedNode) {
            dispatch("nodeclick", {
                nodeId: clickedNode.id,
                node: clickedNode,
            });
            if (onNodeClick) {
                onNodeClick(clickedNode.id);
            }
        }
    }
</script>

<div class="w-full h-full">
    <SvelteFlow
        nodes={flowNodes}
        edges={flowEdges}
        showMinimap={true}
        showControls={true}
        showBackground={true}
        fitView={true}
        autoLayout={true}
        minZoom={0.3}
        maxZoom={1.5}
        height="100%"
        onNodeClick={handleNodeClick}
    />
</div>

<style>
    :global(.active-node) {
        box-shadow: 0 0 0 3px #3b82f6 !important;
        border-radius: 8px !important;
    }

    /* Subtle animated edge dashes */
    :global(.react-flow__edge.animated path) {
        stroke-dasharray: 5;
        animation: dashdraw 0.5s linear infinite;
    }

    @keyframes dashdraw {
        from {
            stroke-dashoffset: 10;
        }
        to {
            stroke-dashoffset: 0;
        }
    }
</style>
