<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import type { NodeProps } from "@xyflow/svelte";

    // Dynamic imports to avoid SSR issues
    let Handle = $state<any>(undefined);
    let Position = $state<any>(undefined);
    let initialized = $state(false);

    onMount(async () => {
        if (browser) {
            try {
                const svelteFlowModule = await import("@xyflow/svelte");
                Handle = svelteFlowModule.Handle;
                Position = svelteFlowModule.Position;
                initialized = true;
            } catch (error) {
                console.error("Failed to load Svelte Flow components:", error);
            }
        }
    });

    interface CardNodeData {
        /** Card title */
        title?: string;
        /** Card description/subtitle */
        description?: string;
        /** Visual variant for different card types */
        variant?:
            | "default"
            | "stat"
            | "info"
            | "success"
            | "warning"
            | "danger";
        /** Node label (fallback if title not provided) */
        label?: string;
        /** Custom content to render */
        content?: any;
        /** Whether to show source handle (default: true) */
        sourceHandle?: boolean;
        /** Whether to show target handle (default: true) */
        targetHandle?: boolean;
        /** Source handle position */
        sourcePosition?: "top" | "right" | "bottom" | "left";
        /** Target handle position */
        targetPosition?: "top" | "right" | "bottom" | "left";
    }

    let { data, selected } = $props() as {
        data: CardNodeData;
        selected: boolean;
    };

    // Determine card border and background based on variant
    const variantClasses = $derived(() => {
        const variant = data.variant || "default";
        switch (variant) {
            case "stat":
                return "bg-white border border-zinc-200";
            case "info":
                return "bg-blue-50 border border-blue-300";
            case "success":
                return "bg-green-50 border border-green-300";
            case "warning":
                return "bg-yellow-50 border border-yellow-300";
            case "danger":
                return "bg-red-50 border border-red-300";
            default:
                return "bg-white border border-zinc-200";
        }
    });

    // Selected state styling
    const selectedClasses = $derived(() => {
        return selected ? "ring-2 ring-zinc-400 ring-offset-2" : "";
    });

    // Position mapping
    const getPosition = (pos?: string) => {
        if (!Position || !initialized) return undefined;
        switch (pos) {
            case "top":
                return Position.Top;
            case "right":
                return Position.Right;
            case "bottom":
                return Position.Bottom;
            case "left":
                return Position.Left;
            default:
                return undefined;
        }
    };
</script>

{#if initialized && Handle}
    <div
        class="rounded-lg shadow-xs {variantClasses()} {selectedClasses()} p-4 min-w-[150px] font-inter text-sm antialiased tracking-tight"
    >
        <!-- Target Handle (Top) -->
        {#if initialized && Handle && Position && data.targetHandle !== false}
            {@const targetPos =
                getPosition(data.targetPosition) ?? Position.Top}
            {@const HandleComponent = Handle}
            <HandleComponent
                type="target"
                position={targetPos}
                class="!bg-zinc-500 !border-2 !border-white !w-3 !h-3 hover:!bg-zinc-600 transition-colors"
            />
        {/if}

        <!-- Card Content -->
        {#if data.title || data.description}
            <div class="space-y-1">
                {#if data.title}
                    <h3
                        class="text-base font-semibold text-zinc-900 tracking-tight leading-tight"
                    >
                        {data.title}
                    </h3>
                {/if}
                {#if data.description}
                    <p class="text-sm text-zinc-600 whitespace-pre-line">
                        {data.description}
                    </p>
                {/if}
            </div>
        {:else if data.label}
            <div class="text-zinc-900 whitespace-pre-line">{data.label}</div>
        {:else if data.content}
            <div class="text-zinc-900">{@html data.content}</div>
        {/if}

        <!-- Source Handle (Bottom) -->
        {#if initialized && Handle && Position && data.sourceHandle !== false}
            {@const sourcePos =
                getPosition(data.sourcePosition) ?? Position.Bottom}
            {@const HandleComponent = Handle}
            <HandleComponent
                type="source"
                position={sourcePos}
                class="!bg-zinc-500 !border-2 !border-white !w-3 !h-3 hover:!bg-zinc-600 transition-colors"
            />
        {/if}
    </div>
{/if}
