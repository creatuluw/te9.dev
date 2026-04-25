<script lang="ts">
    import { Handle, Position, type NodeProps } from "@xyflow/svelte";

    interface TableField {
        name: string;
        type: string;
        constraints: string[];
    }

    interface TableNodeData {
        label: string;
        fields: TableField[];
        group: "templates" | "execution" | "supporting";
        colors: {
            bg: string;
            border: string;
            header: string;
        };
    }

    let { data } = $props() as { data: TableNodeData };
</script>

<div
    class="table-node"
    style="background: {data.colors.bg}; border-color: {data.colors.border};"
>
    <Handle type="target" position={Position.Left} />

    <div
        class="table-header"
        style="border-bottom-color: {data.colors.border};"
    >
        <span class="table-name" style="color: {data.colors.header};"
            >{data.label}</span
        >
    </div>

    <div class="table-fields">
        {#each data.fields as field}
            <div class="field-row">
                <span class="field-name">{field.name}</span>
                <span class="field-type">{field.type}</span>
                {#if field.constraints.length > 0}
                    <span class="field-constraints">
                        {#each field.constraints as constraint}
                            <span class="constraint-badge">{constraint}</span>
                        {/each}
                    </span>
                {/if}
            </div>
        {/each}
    </div>

    <Handle type="source" position={Position.Right} />
</div>

<style>
    .table-node {
        border: 1px solid;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        overflow: hidden;
        font-family: "Inter", sans-serif;
        font-size: 0.75rem;
        min-width: 250px;
        max-width: 280px;
    }

    .table-header {
        padding: 0.625rem 0.75rem;
        border-bottom: 1px solid;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.5);
    }

    .table-name {
        font-size: 0.8125rem;
        letter-spacing: -0.01em;
        font-weight: 600;
    }

    .table-fields {
        padding: 0.5rem 0;
        max-height: 400px;
        overflow-y: auto;
    }

    .field-row {
        padding: 0.375rem 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-bottom: 1px solid rgba(228, 228, 231, 0.3);
        font-size: 0.6875rem;
    }

    .field-row:last-child {
        border-bottom: none;
    }

    .field-name {
        font-weight: 500;
        color: rgb(24, 24, 27);
        min-width: 100px;
        flex-shrink: 0;
    }

    .field-type {
        color: rgb(82, 82, 91);
        font-family: "PT Mono", monospace;
        font-size: 0.625rem;
        flex-grow: 1;
        text-align: right;
    }

    .field-constraints {
        display: flex;
        gap: 0.25rem;
        flex-shrink: 0;
    }

    .constraint-badge {
        padding: 0.125rem 0.375rem;
        background: rgb(244, 244, 245);
        border: 1px solid rgb(228, 228, 231);
        border-radius: 0.25rem;
        font-size: 0.5625rem;
        font-weight: 600;
        color: rgb(63, 63, 70);
        letter-spacing: 0.025em;
    }

    /* Scrollbar styling */
    .table-fields::-webkit-scrollbar {
        width: 6px;
    }

    .table-fields::-webkit-scrollbar-track {
        background: transparent;
    }

    .table-fields::-webkit-scrollbar-thumb {
        background: rgb(228, 228, 231);
        border-radius: 3px;
    }

    .table-fields::-webkit-scrollbar-thumb:hover {
        background: rgb(212, 212, 216);
    }
</style>
