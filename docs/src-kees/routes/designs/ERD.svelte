<script lang="ts">
    import { SvelteFlow } from "$lib/components/SvelteFlow";
    import type { Node, Edge, NodeTypes } from "@xyflow/svelte";
    import { MarkerType, Position, useSvelteFlow } from "@xyflow/svelte";
    import TableNode from "$lib/components/SvelteFlow/nodes/TableNode.svelte";
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    // Custom node types
    const nodeTypes = {
        table: TableNode,
    } as NodeTypes;

    // Database table definitions with fields
    interface TableField {
        name: string;
        type: string;
        constraints: string[];
    }

    interface TableDefinition {
        name: string;
        fields: TableField[];
        group: "templates" | "execution" | "supporting";
    }

    const tables: TableDefinition[] = [
        {
            name: "_bpm_processes",
            group: "templates",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "name",
                    type: "VARCHAR(255)",
                    constraints: ["NOT NULL"],
                },
                { name: "description", type: "TEXT", constraints: [] },
                {
                    name: "completion_days",
                    type: "INTEGER",
                    constraints: ["NOT NULL"],
                },
                {
                    name: "status",
                    type: "VARCHAR(50)",
                    constraints: ["NOT NULL"],
                },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
                { name: "updated_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
        {
            name: "_bpm_process_steps",
            group: "templates",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "process_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                {
                    name: "name",
                    type: "VARCHAR(255)",
                    constraints: ["NOT NULL"],
                },
                { name: "description", type: "TEXT", constraints: [] },
                {
                    name: "order_index",
                    type: "INTEGER",
                    constraints: ["NOT NULL"],
                },
                {
                    name: "start_days_offset",
                    type: "INTEGER",
                    constraints: ["NOT NULL"],
                },
                {
                    name: "completion_days",
                    type: "INTEGER",
                    constraints: ["NOT NULL"],
                },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
        {
            name: "_bpm_process_tasks",
            group: "templates",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "step_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                {
                    name: "name",
                    type: "VARCHAR(255)",
                    constraints: ["NOT NULL"],
                },
                { name: "description", type: "TEXT", constraints: [] },
                {
                    name: "order_index",
                    type: "INTEGER",
                    constraints: ["NOT NULL"],
                },
                { name: "criteria", type: "TEXT", constraints: [] },
                { name: "links", type: "JSONB", constraints: [] },
                {
                    name: "deadline_days",
                    type: "INTEGER",
                    constraints: ["NOT NULL"],
                },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
        {
            name: "_bpm_cases",
            group: "execution",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "process_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                {
                    name: "name",
                    type: "VARCHAR(255)",
                    constraints: ["NOT NULL"],
                },
                { name: "start_date", type: "DATE", constraints: ["NOT NULL"] },
                {
                    name: "completion_deadline",
                    type: "DATE",
                    constraints: ["NOT NULL"],
                },
                {
                    name: "status",
                    type: "VARCHAR(50)",
                    constraints: ["NOT NULL"],
                },
                { name: "owner_id", type: "VARCHAR(255)", constraints: [] },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
                { name: "updated_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
        {
            name: "_bpm_case_steps",
            group: "execution",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "case_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                {
                    name: "step_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                {
                    name: "status",
                    type: "VARCHAR(50)",
                    constraints: ["NOT NULL"],
                },
                { name: "start_date", type: "DATE", constraints: [] },
                { name: "completion_deadline", type: "DATE", constraints: [] },
                { name: "owner_id", type: "VARCHAR(255)", constraints: [] },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
                { name: "updated_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
        {
            name: "_bpm_tasks",
            group: "execution",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "task_type",
                    type: "ENUM(process,manual)",
                    constraints: ["NOT NULL"],
                },
                { name: "case_step_id", type: "INTEGER", constraints: ["FK"] },
                { name: "task_id", type: "INTEGER", constraints: ["FK"] },
                { name: "project_id", type: "INTEGER", constraints: ["FK"] },
                { name: "assignee_id", type: "VARCHAR(255)", constraints: [] },
                { name: "subject", type: "TEXT", constraints: [] },
                { name: "deadline", type: "TIMESTAMP", constraints: [] },
                {
                    name: "status",
                    type: "VARCHAR(50)",
                    constraints: ["NOT NULL"],
                },
                {
                    name: "kanban_status",
                    type: "VARCHAR(50)",
                    constraints: ["NOT NULL"],
                },
                { name: "kanban_order", type: "INTEGER", constraints: [] },
                { name: "started_at", type: "TIMESTAMP", constraints: [] },
                { name: "completed_at", type: "TIMESTAMP", constraints: [] },
                { name: "uren", type: "DECIMAL(10,2)", constraints: [] },
                { name: "tags", type: "JSONB", constraints: [] },
                { name: "bijlagen", type: "JSONB", constraints: [] },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
                { name: "updated_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
        {
            name: "_bpm_messages",
            group: "supporting",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "type",
                    type: "VARCHAR(100)",
                    constraints: ["NOT NULL"],
                },
                {
                    name: "recipient_email",
                    type: "VARCHAR(255)",
                    constraints: ["NOT NULL"],
                },
                {
                    name: "recipient_user_id",
                    type: "VARCHAR(255)",
                    constraints: [],
                },
                {
                    name: "subject",
                    type: "VARCHAR(255)",
                    constraints: ["NOT NULL"],
                },
                { name: "body", type: "TEXT", constraints: ["NOT NULL"] },
                {
                    name: "status",
                    type: "VARCHAR(50)",
                    constraints: ["NOT NULL"],
                },
                { name: "in_app_read", type: "BOOLEAN", constraints: [] },
                { name: "sent_at", type: "TIMESTAMP", constraints: [] },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
        {
            name: "_bpm_task_logs",
            group: "supporting",
            fields: [
                { name: "id", type: "SERIAL", constraints: ["PK"] },
                {
                    name: "task_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                {
                    name: "process_task_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                {
                    name: "case_id",
                    type: "INTEGER",
                    constraints: ["FK", "NOT NULL"],
                },
                { name: "owner_id", type: "VARCHAR(255)", constraints: [] },
                {
                    name: "completed_at",
                    type: "TIMESTAMP",
                    constraints: ["NOT NULL"],
                },
                { name: "completion_notes", type: "TEXT", constraints: [] },
                { name: "metadata", type: "JSONB", constraints: [] },
                { name: "created_at", type: "TIMESTAMP", constraints: [] },
            ],
        },
    ];

    // Relationships: source -> target [cardinality]
    const relationships: Array<{
        from: string;
        to: string;
        cardinality: string;
    }> = [
        {
            from: "_bpm_processes",
            to: "_bpm_process_steps",
            cardinality: "1:N",
        },
        {
            from: "_bpm_process_steps",
            to: "_bpm_process_tasks",
            cardinality: "1:N",
        },
        { from: "_bpm_processes", to: "_bpm_cases", cardinality: "1:N" },
        { from: "_bpm_cases", to: "_bpm_case_steps", cardinality: "1:N" },
        {
            from: "_bpm_process_steps",
            to: "_bpm_case_steps",
            cardinality: "1:N",
        },
        { from: "_bpm_case_steps", to: "_bpm_tasks", cardinality: "1:N" },
        { from: "_bpm_process_tasks", to: "_bpm_tasks", cardinality: "1:N" },
        { from: "_bpm_projects", to: "_bpm_tasks", cardinality: "1:N" },
        { from: "_bpm_tasks", to: "_bpm_task_logs", cardinality: "1:N" },
        {
            from: "_bpm_process_tasks",
            to: "_bpm_task_logs",
            cardinality: "1:N",
        },
        { from: "_bpm_cases", to: "_bpm_task_logs", cardinality: "1:N" },
    ];

    // Create nodes for each table
    const groupColors = {
        templates: { bg: "#f4f4f5", border: "#e4e4e7", header: "#71717a" },
        execution: { bg: "#fafafa", border: "#d4d4d8", header: "#52525b" },
        supporting: { bg: "#ffffff", border: "#c4c4c4", header: "#3f3f46" },
    };

    // Initialize nodes and edges as empty arrays for SSR safety
    let nodes = $state<Node[]>([]);
    let edges = $state<Edge[]>([]);
    let initialized = $state(false);
    let elk: any = null;

    // ELK layout options - similar to the example
    const elkOptions = {
        "elk.algorithm": "layered",
        "elk.layered.spacing.nodeNodeBetweenLayers": "250",
        "elk.spacing.nodeNode": "180",
    };

    // Function to get layouted elements using ELK (following example pattern)
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
                nodeSpacing: 180,
                layerSpacing: 250,
                nodeWidth: 280,
                nodeHeight: 350,
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
                const colors =
                    groupColors[
                        (node.data as any).group as keyof typeof groupColors
                    ];
                return {
                    ...node,
                    // Adjust handle positions based on layout direction
                    targetPosition: isHorizontal ? Position.Left : Position.Top,
                    sourcePosition: isHorizontal
                        ? Position.Right
                        : Position.Bottom,
                    // Hardcode width and height for ELK to use when layouting
                    width: 280,
                    height: 350,
                };
            }),
            edges: edges,
        };

        const layoutedGraph = await elk.layout(graph);

        return {
            nodes: layoutedGraph.children.map((node: any) => ({
                ...node,
                // SvelteFlow expects position property instead of x/y fields
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
        const initialNodes = tables.map((table): any => {
            const colors = groupColors[table.group];

            return {
                id: table.name,
                type: "table",
                position: { x: 0, y: 0 }, // Will be positioned by ELK layout
                data: {
                    label: table.name,
                    fields: table.fields,
                    group: table.group,
                    colors,
                },
                style: {
                    width: 280,
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                },
            };
        });

        // Create initial edges
        const initialEdges = relationships.map((rel): any => ({
            id: `e-${rel.from}-${rel.to}`,
            source: rel.from,
            target: rel.to,
            type: "bezier", // Curved edges (bezier creates smooth curved connections)
            label: rel.cardinality,
            labelStyle: {
                fontSize: "11px",
                fontWeight: 500,
                fill: "#52525b",
            },
            style: {
                stroke: "#71717a",
                strokeWidth: 2,
            },
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
    <div class="erd-container">
        <SvelteFlow
            bind:nodes
            bind:edges
            {nodeTypes}
            autoLayout={false}
            fitView={true}
            fitViewOptions={{
                padding: 20, // Reduced padding for zoomed in view
                includeHiddenNodes: false,
                minZoom: 0.4, // Higher minimum zoom to prevent over-zooming out
                maxZoom: 2,
                duration: 400,
            }}
            defaultZoom={1.2}
            defaultEdgeOptions={{
                type: "bezier", // Bezier creates smooth curved edges
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
            class="erd-flow"
        />
    </div>
{:else}
    <div class="flex items-center justify-center h-full text-zinc-500">
        Loading ERD...
    </div>
{/if}

<style>
    .erd-container {
        width: 100%;
        height: 100%;
    }
</style>
