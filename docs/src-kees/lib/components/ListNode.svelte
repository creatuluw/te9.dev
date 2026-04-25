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

    interface ListNodeData {
        /** Node title */
        title?: string;
        /** List items as array of strings or objects with label/value */
        items?: Array<
            string | { label: string; value?: string; type?: string }
        >;
        /** List data as newline-separated string (legacy support) */
        listData?: string;
        /** Visual variant for different node types */
        variant?:
            | "default"
            | "stat"
            | "info"
            | "success"
            | "warning"
            | "danger";
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
        data: ListNodeData;
        selected: boolean;
    };

    // Parse list data - support both array and string formats
    const listItems = $derived(() => {
        if (data.items && Array.isArray(data.items)) {
            return data.items.map((item) => {
                if (typeof item === "string") {
                    // Parse string like "id: SERIAL PK" or "name: VARCHAR(255)"
                    const match = item.match(/^([^:]+):\s*(.+)$/);
                    if (match) {
                        return {
                            label: match[1].trim(),
                            value: match[2].trim(),
                        };
                    }
                    return { label: item, value: undefined };
                }
                return item;
            });
        }

        // Legacy support for newline-separated string
        if (data.listData) {
            return data.listData
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => {
                    const match = line.match(/^([^:]+):\s*(.+)$/);
                    if (match) {
                        return {
                            label: match[1].trim(),
                            value: match[2].trim(),
                        };
                    }
                    return { label: line.trim(), value: undefined };
                });
        }

        return [];
    });

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

    // Extract type/constraint from value (e.g., "SERIAL PK", "VARCHAR(255) NOT NULL")
    const getTypeInfo = (value: string) => {
        if (!value) return { type: "", constraint: "" };

        const pkMatch = value.match(/(.*?)\s+(PK|FK|NOT NULL|UNIQUE)/i);
        if (pkMatch) {
            return {
                type: pkMatch[1].trim(),
                constraint: value.substring(pkMatch[1].length).trim(),
            };
        }

        return { type: value, constraint: "" };
    };
</script>

{#if initialized && Handle}
    <div
        class="rounded-lg shadow-xs {variantClasses()} {selectedClasses()} p-4 min-w-[200px] max-w-[280px] font-inter text-sm antialiased tracking-tight"
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

        <!-- Node Title -->
        {#if data.title}
            <h3
                class="text-base font-semibold text-zinc-900 tracking-tight leading-tight mb-3 border-b border-zinc-100 pb-2"
            >
                {data.title}
            </h3>
        {/if}

        <!-- List Items -->
        {#if listItems().length > 0}
            <ul class="space-y-1.5 list-none">
                {#each listItems() as item}
                    {@const typeInfo = getTypeInfo(item.value || "")}
                    {@const hasValue = !!item.value}
                    <li class="flex items-start gap-2 text-xs leading-relaxed">
                        <!-- Bullet point -->
                        <span class="text-zinc-400 mt-0.5 flex-shrink-0">•</span
                        >

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Label -->
                            <span class="font-medium text-zinc-900"
                                >{item.label}</span
                            >

                            {#if hasValue}
                                <span class="text-zinc-500 mx-1">:</span>

                                <!-- Type -->
                                {#if typeInfo.type}
                                    <span
                                        class="text-zinc-600 font-mono text-[10px]"
                                        >{typeInfo.type}</span
                                    >
                                {/if}

                                <!-- Constraint badges -->
                                {#if typeInfo.constraint}
                                    {@const constraints = typeInfo.constraint
                                        .split(/\s+/)
                                        .filter((c) => c)}
                                    <div class="inline-flex gap-1 ml-1.5">
                                        {#each constraints as constraint}
                                            <span
                                                class="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium {constraint.toUpperCase() ===
                                                'PK'
                                                    ? 'bg-zinc-900 text-white'
                                                    : constraint.toUpperCase() ===
                                                        'FK'
                                                      ? 'bg-zinc-700 text-white'
                                                      : constraint.toUpperCase() ===
                                                          'NOT NULL'
                                                        ? 'bg-zinc-100 text-zinc-700'
                                                        : 'bg-zinc-50 text-zinc-600'}"
                                            >
                                                {constraint}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    </li>
                {/each}
            </ul>
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
