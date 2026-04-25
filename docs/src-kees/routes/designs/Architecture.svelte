<script lang="ts">
    import { SvelteFlow } from "$lib/components/SvelteFlow";
    import type { Node, Edge, NodeTypes } from "@xyflow/svelte";
    import { MarkerType, Position } from "@xyflow/svelte";
    import LayerNode from "$lib/components/SvelteFlow/nodes/LayerNode.svelte";
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    // Custom node types
    const nodeTypes = {
        layer: LayerNode,
    } as NodeTypes;

    // Architecture layer definitions with components
    interface LayerComponent {
        name: string;
        description?: string;
    }

    interface LayerDefinition {
        name: string;
        components: LayerComponent[];
        layerType: "frontend" | "service" | "data" | "external" | "database";
    }

    const layers: LayerDefinition[] = [
        {
            name: "Presentation Layer",
            layerType: "frontend",
            components: [
                { name: "SvelteKit Routes" },
                { name: "UI Components" },
                { name: "Form Components" },
                { name: "Business Components" },
            ],
        },
        {
            name: "Service Layer",
            layerType: "service",
            components: [
                { name: "processService" },
                { name: "caseService" },
                { name: "taskService" },
                { name: "messageService" },
                { name: "dashboardService" },
                { name: "deadlineService" },
            ],
        },
        {
            name: "Data Access Layer",
            layerType: "data",
            components: [
                { name: "PostgREST Client" },
                { name: "API Client" },
                { name: "Query Builder" },
                { name: "Filter Builder" },
            ],
        },
        {
            name: "PocketBase",
            layerType: "external",
            components: [
                { name: "Authentication" },
                { name: "User Management" },
                { name: "User Data" },
            ],
        },
        {
            name: "Email Service",
            layerType: "external",
            components: [
                { name: "SMTP" },
                { name: "Email Sending" },
                { name: "Templates" },
            ],
        },
        {
            name: "PostgreSQL",
            layerType: "database",
            components: [
                { name: "PostgREST API" },
                { name: "REST Endpoints" },
                { name: "Auto-Generated" },
            ],
        },
    ];

    // Relationships: source -> target
    const relationships: Array<{ from: string; to: string; label?: string }> = [
        { from: "Presentation Layer", to: "Service Layer" },
        { from: "Service Layer", to: "Data Access Layer" },
        { from: "Data Access Layer", to: "PostgreSQL" },
        { from: "Service Layer", to: "PocketBase" },
        { from: "Service Layer", to: "Email Service" },
    ];

    // Create nodes for each layer
    const layerColors = {
        frontend: { bg: "#f4f4f5", border: "#e4e4e7", header: "#71717a" },
        service: { bg: "#fafafa", border: "#d4d4d8", header: "#52525b" },
        data: { bg: "#ffffff", border: "#c4c4c4", header: "#3f3f46" },
        external: { bg: "#faf5ff", border: "#e9d5ff", header: "#9333ea" },
        database: { bg: "#f0f9ff", border: "#bae6fd", header: "#0284c7" },
    };

    // Initialize nodes and edges as empty arrays for SSR safety
    let nodes = $state<Node[]>([]);
    let edges = $state<Edge[]>([]);
    let initialized = $state(false);
    let elk: any = null;

    // ELK layout options
    const elkOptions = {
        "elk.algorithm": "layered",
        "elk.layered.spacing.nodeNodeBetweenLayers": "200",
        "elk.spacing.nodeNode": "150",
    };

    // Function to get layouted elements using ELK
    async function getLayoutedElements(
        nodes: Node[],
        edges: Edge[],
        options: Record<string, string> = {},
    ) {
        if (!elk) {
            // Fallback to smart layout if ELK not available
            const { applySmartLayout } = await import("$lib/utils/flowLayout");
            const result = applySmartLayout(nodes, edges, {
                direction: "LR",
                nodeSpacing: 150,
                layerSpacing: 200,
                nodeWidth: 280,
                nodeHeight: 300,
            });
            return {
                nodes: result.nodes,
                edges: result.edges,
            };
        }

        const isHorizontal = options?.["elk.direction"] === "RIGHT";
        const graph = {
            id: "root",
            layoutOptions: options,
            children: nodes.map((node) => {
                return {
                    ...node,
                    targetPosition: isHorizontal ? Position.Left : Position.Top,
                    sourcePosition: isHorizontal
                        ? Position.Right
                        : Position.Bottom,
                    width: 280,
                    height: 300,
                };
            }),
            edges: edges,
        };

        const layoutedGraph = await elk.layout(graph);

        return {
            nodes: layoutedGraph.children.map((node: any) => ({
                ...node,
                position: { x: node.x, y: node.y },
            })),
            edges: layoutedGraph.edges || edges,
        };
    }

    // Initialize nodes and edges on client side only
    onMount(async () => {
        if (!browser) return;

        try {
            // Try to load ELK
            const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
            elk = new ELK();
        } catch (error) {
            console.warn("ELK not available, will use fallback layout:", error);
        }

        // Create initial nodes
        const initialNodes = layers.map((layer) => {
            const colors = layerColors[layer.layerType];

            return {
                id: layer.name,
                type: "layer",
                position: { x: 0, y: 0 }, // Will be positioned by ELK layout
                data: {
                    label: layer.name,
                    components: layer.components,
                    layerType: layer.layerType,
                    colors,
                },
                style: `width: 280px; background: ${colors.bg}; border: 1px solid ${colors.border};`,
            };
        });

        // Create initial edges
        const initialEdges = relationships.map((rel) => ({
            id: `e-${rel.from}-${rel.to}`,
            source: rel.from,
            target: rel.to,
            type: "bezier",
            label: rel.label || "",
            labelStyle: "font-size: 11px; font-weight: 500; fill: #52525b;",
            style: "stroke: #71717a; stroke-width: 2;",
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: "#71717a",
            },
        }));

        // Apply ELK layout with RIGHT direction (horizontal)
        const opts = { "elk.direction": "RIGHT", ...elkOptions };
        const layouted = await getLayoutedElements(
            initialNodes,
            initialEdges,
            opts,
        );

        nodes = layouted.nodes;
        edges = layouted.edges;

        initialized = true;
    });
</script>

{#if browser && initialized}
    <div class="architecture-container">
        <SvelteFlow
            bind:nodes
            bind:edges
            {nodeTypes}
            autoLayout={false}
            fitView={true}
            fitViewOptions={{
                padding: 20,
                includeHiddenNodes: false,
                minZoom: 0.4,
                maxZoom: 2,
                duration: 400,
            }}
            defaultZoom={1.2}
            defaultEdgeOptions={{
                type: "bezier",
                animated: false,
                style: "stroke: #71717a; stroke-width: 2;",
            }}
            background={{ variant: "dots", patternColor: "#e4e4e7", gap: 20 }}
            controls={true}
            minimap={{
                height: 150,
                width: 200,
                zoomable: true,
                pannable: true,
            }}
            minZoom={0.1}
            maxZoom={2}
            height="800px"
            class="architecture-flow"
        />
    </div>
{:else}
    <div class="flex items-center justify-center h-full text-zinc-500">
        Loading Architecture...
    </div>
{/if}

<style>
    .architecture-container {
        width: 100%;
        height: 100%;
    }
</style>
