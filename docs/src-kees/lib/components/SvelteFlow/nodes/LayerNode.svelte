<script lang="ts">
    import { Handle, Position, type NodeProps } from "@xyflow/svelte";

    interface LayerComponent {
        name: string;
        description?: string;
    }

    interface LayerNodeData {
        label: string;
        components: LayerComponent[];
        layerType: "frontend" | "service" | "data" | "external" | "database";
        colors: {
            bg: string;
            border: string;
            header: string;
        };
    }

    let { data } = $props() as { data: LayerNodeData };
</script>

<div
    class="layer-node"
    style="background: {data.colors.bg}; border-color: {data.colors.border};"
>
    <Handle type="target" position={Position.Left} />

    <div
        class="layer-header"
        style="border-bottom-color: {data.colors.border};"
    >
        <span class="layer-name" style="color: {data.colors.header};"
            >{data.label}</span
        >
    </div>

    <div class="layer-components">
        {#each data.components as component}
            <div class="component-row">
                <span class="component-name">{component.name}</span>
                {#if component.description}
                    <span class="component-description"
                        >{component.description}</span
                    >
                {/if}
            </div>
        {/each}
    </div>

    <Handle type="source" position={Position.Right} />
</div>

<style>
    .layer-node {
        border: 1px solid;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        overflow: hidden;
        font-family: "Inter", sans-serif;
        font-size: 0.75rem;
        min-width: 250px;
        max-width: 280px;
    }

    .layer-header {
        padding: 0.625rem 0.75rem;
        border-bottom: 1px solid;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.5);
    }

    .layer-name {
        font-size: 0.8125rem;
        letter-spacing: -0.01em;
        font-weight: 600;
    }

    .layer-components {
        padding: 0.5rem 0;
        max-height: 400px;
        overflow-y: auto;
    }

    .component-row {
        padding: 0.5rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        border-bottom: 1px solid rgba(228, 228, 231, 0.3);
        font-size: 0.6875rem;
    }

    .component-row:last-child {
        border-bottom: none;
    }

    .component-name {
        font-weight: 500;
        color: rgb(24, 24, 27);
        font-family: "PT Mono", monospace;
        font-size: 0.75rem;
    }

    .component-description {
        color: rgb(82, 82, 91);
        font-size: 0.625rem;
        font-style: italic;
    }

    /* Scrollbar styling */
    .layer-components::-webkit-scrollbar {
        width: 6px;
    }

    .layer-components::-webkit-scrollbar-track {
        background: transparent;
    }

    .layer-components::-webkit-scrollbar-thumb {
        background: rgb(228, 228, 231);
        border-radius: 3px;
    }

    .layer-components::-webkit-scrollbar-thumb:hover {
        background: rgb(212, 212, 216);
    }
</style>
