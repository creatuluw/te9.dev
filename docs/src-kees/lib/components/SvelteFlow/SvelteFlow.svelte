<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";
    import type {
        Node,
        Edge,
        NodeTypes,
        EdgeTypes,
        FitViewOptions,
        ConnectionLineType,
    } from "@xyflow/svelte";
    import {
        applySmartLayout,
        calculateFitView,
        type LayoutOptions,
    } from "$lib/utils/flowLayout";
    import type { SvelteFlowProps } from "./types";
    import {
        mergeEdgeOptions,
        normalizeBackgroundConfig,
        normalizeControlsConfig,
        normalizeMiniMapConfig,
        DEFAULT_CONNECTION_LINE_TYPE,
        DEFAULT_ZOOM,
    } from "./utils/defaults";
    import ButtonEdge from "./edges/ButtonEdge.svelte";

    // Dynamic imports to avoid SSR issues
    let SvelteFlow = $state<any>(undefined);
    let MiniMap = $state<any>(undefined);
    let Controls = $state<any>(undefined);
    let Background = $state<any>(undefined);
    let Panel = $state<any>(undefined);
    let BackgroundVariant = $state<any>(undefined);
    let ConnectionLineTypeEnum = $state<any>(undefined);
    let ConnectionLineTypeImport = $state<any>(undefined);
    let initialized = $state(false);

    onMount(async () => {
        if (browser) {
            try {
                const svelteFlowModule = await import("@xyflow/svelte");
                SvelteFlow = svelteFlowModule.SvelteFlow;
                MiniMap = svelteFlowModule.MiniMap;
                Controls = svelteFlowModule.Controls;
                Background = svelteFlowModule.Background;
                Panel = svelteFlowModule.Panel;
                BackgroundVariant = svelteFlowModule.BackgroundVariant;
                ConnectionLineTypeEnum = svelteFlowModule.ConnectionLineType;
                ConnectionLineTypeImport = svelteFlowModule;
                await import("@xyflow/svelte/dist/style.css");
                initialized = true;
            } catch (error) {
                console.error("Failed to load Svelte Flow:", error);
            }
        }
    });

    let {
        nodes = $bindable([]),
        edges = $bindable([]),
        nodeTypes,
        edgeTypes,
        defaultEdgeOptions,
        defaultNodeOptions,
        background,
        controls,
        minimap,
        panel,
        // Deprecated props for backward compatibility
        showBackground,
        backgroundVariant: legacyBackgroundVariant,
        showControls,
        showMinimap,
        fitView = false,
        fitViewOptions,
        minZoom = DEFAULT_ZOOM.min,
        maxZoom = DEFAULT_ZOOM.max,
        defaultZoom = DEFAULT_ZOOM.default,
        height = "400px",
        width,
        class: className = "",
        autoLayout = false,
        layoutOptions,
        connection,
        onNodeClick,
        onEdgeClick,
        onNodeContextMenu,
        onPaneClick,
        onConnect,
        onBeforeConnect,
        onMove,
        onSelectionChange,
        onNodesChange,
        onEdgesChange,
        children,
        deleteKeyCode,
        multiSelectionKeyCode,
        selectionMode = "full",
        selectNodesOnDrag = true,
        proximityConnectOnConnect = false,
        nodeOrigin,
        snapToGrid = false,
        snapGrid,
        attributionPosition = "bottom-left",
    }: SvelteFlowProps = $props();

    // Container ref for calculating dimensions
    let containerElement = $state<HTMLDivElement | null>(null);
    let containerWidth = $state(800);
    let containerHeight = $state(600);

    // Track if layout has been applied
    let layoutApplied = $state(false);
    let layoutedNodes = $state<Node[]>([]);
    let layoutedEdges = $state<Edge[]>([]);

    // Normalize configurations with backward compatibility
    const backgroundConfig = $derived.by(() => {
        // Use legacy props if new props not provided
        if (background === undefined && showBackground !== undefined) {
            return normalizeBackgroundConfig(
                showBackground
                    ? legacyBackgroundVariant
                        ? { variant: legacyBackgroundVariant }
                        : true
                    : false,
            );
        }
        return normalizeBackgroundConfig(
            background !== undefined ? background : true,
        );
    });
    const controlsConfig = $derived.by(() => {
        if (controls === undefined && showControls !== undefined) {
            return normalizeControlsConfig(showControls);
        }
        return normalizeControlsConfig(
            controls !== undefined ? controls : true,
        );
    });
    const minimapConfig = $derived.by(() => {
        if (minimap === undefined && showMinimap !== undefined) {
            return normalizeMiniMapConfig(showMinimap);
        }
        return normalizeMiniMapConfig(minimap !== undefined ? minimap : false);
    });

    // Merge default edge types with user provided ones
    const mergedEdgeTypes = $derived.by(() => {
        const defaults: EdgeTypes = {
            button: ButtonEdge,
        };
        return { ...defaults, ...edgeTypes };
    });

    // Merge default edge options
    const mergedDefaultEdgeOptions = $derived(
        mergeEdgeOptions(defaultEdgeOptions),
    );

    // Connection line type
    const connectionLineType = $derived.by(() => {
        if (connection?.connectionLineType) {
            return connection.connectionLineType;
        }
        // Try enum first, then fallback to string
        if (ConnectionLineTypeEnum) {
            return ConnectionLineTypeEnum.SmoothStep || "smoothstep";
        }
        return "smoothstep";
    });

    // Apply smart layout when autoLayout is enabled
    $effect(() => {
        if (
            autoLayout &&
            initialized &&
            nodes.length > 0 &&
            containerElement &&
            !layoutApplied
        ) {
            requestAnimationFrame(() => {
                if (!containerElement) return;

                const rect = containerElement.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    setTimeout(() => {
                        if (containerElement && !layoutApplied) {
                            const retryRect =
                                containerElement.getBoundingClientRect();
                            if (retryRect.width > 0 && retryRect.height > 0) {
                                applyLayout();
                            }
                        }
                    }, 100);
                    return;
                }

                applyLayout();
            });
        }
    });

    function applyLayout() {
        if (!containerElement || layoutApplied) return;

        const rect = containerElement.getBoundingClientRect();
        containerWidth = rect.width || 800;
        containerHeight = rect.height || 600;

        const layouted = applySmartLayout(
            [...nodes],
            [...edges],
            layoutOptions,
        );

        layoutedNodes = layouted.nodes;
        layoutedEdges = layouted.edges;
        layoutApplied = true;

        if (fitView) {
            const fitViewCalc = calculateFitView(
                layouted.bounds,
                containerWidth,
                containerHeight,
                20,
            );
            fitViewOptions = {
                ...fitViewOptions,
                padding: 20,
                minZoom: minZoom,
                maxZoom: maxZoom,
            };
        }
    }

    // Use layouted nodes/edges when autoLayout is enabled
    const displayNodes = $derived(
        autoLayout && layoutApplied ? layoutedNodes : nodes,
    );
    const displayEdges = $derived(
        autoLayout && layoutApplied ? layoutedEdges : edges,
    );

    // Watch for container size changes
    let resizeObserver: ResizeObserver | null = null;

    onMount(() => {
        if (browser && containerElement) {
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    containerWidth = entry.contentRect.width;
                    containerHeight = entry.contentRect.height;
                }
            });
            resizeObserver.observe(containerElement);
        }
    });

    onDestroy(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
    });
</script>

<div
    bind:this={containerElement}
    class="svelteflow-container {className}"
    style="height: {height}; {width ? `width: ${width};` : ''}"
>
    {#if initialized && SvelteFlow}
        {@const FlowComponent = SvelteFlow}
        <FlowComponent
            nodes={displayNodes}
            edges={displayEdges}
            {nodeTypes}
            edgeTypes={mergedEdgeTypes}
            defaultEdgeOptions={mergedDefaultEdgeOptions}
            {fitView}
            {fitViewOptions}
            {minZoom}
            {maxZoom}
            {defaultZoom}
            {connectionLineType}
            connectionRadius={connection?.connectionRadius}
            isValidConnection={connection?.isValidConnection}
            {nodeOrigin}
            {snapToGrid}
            {snapGrid}
            {selectNodesOnDrag}
            {selectionMode}
            {deleteKeyCode}
            {multiSelectionKeyCode}
            {attributionPosition}
            onnodeclick={onNodeClick}
            onedgeclick={onEdgeClick}
            onnodecontextmenu={onNodeContextMenu}
            onpaneclick={onPaneClick}
            onconnect={onConnect}
            onbeforeconnect={onBeforeConnect}
            onmove={onMove}
            onselectionchange={onSelectionChange}
            onnodeschange={onNodesChange}
            onedgeschange={onEdgesChange}
        >
            {#if backgroundConfig && Background && BackgroundVariant}
                {@const variant = backgroundConfig.variant || "dots"}
                {@const variantValue =
                    variant === "dots"
                        ? BackgroundVariant.Dots
                        : BackgroundVariant.Lines}
                {@const BackgroundComponent = Background}
                <BackgroundComponent
                    variant={variantValue}
                    patternColor={backgroundConfig.patternColor}
                    gap={backgroundConfig.gap}
                    size={backgroundConfig.size}
                />
            {/if}

            {#if controlsConfig && Controls}
                {@const ControlsComponent = Controls}
                <ControlsComponent
                    showZoomIn={controlsConfig.showZoomIn}
                    showZoomOut={controlsConfig.showZoomOut}
                    showFitView={controlsConfig.showFitView}
                    showLock={controlsConfig.showLock}
                />
            {/if}

            {#if minimapConfig && MiniMap}
                {@const MiniMapComponent = MiniMap}
                <MiniMapComponent
                    zoomable={minimapConfig.zoomable}
                    pannable={minimapConfig.pannable}
                    height={minimapConfig.height}
                    width={minimapConfig.width}
                    nodeClass={minimapConfig.nodeClass}
                    nodeColor={minimapConfig.nodeColor}
                    maskColor={minimapConfig.maskColor}
                />
            {/if}

            {#if panel && Panel}
                {@const positionMap = {
                    "top-left": "top-left",
                    "top-right": "top-right",
                    "bottom-left": "bottom-left",
                    "bottom-right": "bottom-right",
                }}
                {@const PanelComponent = Panel}
                <PanelComponent
                    position={typeof panel === "object" && panel.position
                        ? positionMap[panel.position]
                        : "top-right"}
                >
                    {@render children?.()}
                </PanelComponent>
            {:else}
                {@render children?.()}
            {/if}
        </FlowComponent>
    {:else}
        <div class="flex items-center justify-center h-full text-zinc-500">
            Loading SvelteFlow...
        </div>
    {/if}
</div>

<style>
    /* Container styling - Tailwind design system */
    :global(.svelteflow-container) {
        position: relative;
        width: 100%;
        border: 1px solid rgb(228 228 231); /* border-zinc-200 */
        border-radius: 0.5rem; /* rounded-lg */
        overflow: hidden;
        background: white;
    }

    /* Flow background */
    :global(.svelteflow-container .svelte-flow) {
        background-color: white;
    }

    /* Default node styling - matches design system (Inter font, zinc colors) */
    :global(.svelteflow-container .svelte-flow__node) {
        font-family: Inter, sans-serif; /* font-inter */
        font-size: 0.75rem; /* text-xs */
        color: rgb(24 24 27); /* text-zinc-900 */
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        letter-spacing: -0.025em; /* tracking-tight */
    }

    /* Selected node styling */
    :global(.svelteflow-container .svelte-flow__node.selected) {
        outline: 2px solid rgb(161 161 170); /* ring-zinc-400 */
        outline-offset: 2px; /* ring-offset-2 */
    }

    /* Default node wrapper styling - card-like appearance */
    :global(.svelteflow-container .svelte-flow__node-default) {
        background: white;
        border: 1px solid rgb(228 228 231); /* border-zinc-200 */
        border-radius: 0.5rem; /* rounded-lg */
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-xs */
        padding: 0.5rem 0.75rem; /* px-3 py-2 */
    }

    /* Handle styling - zinc palette with white border */
    :global(.svelteflow-container .svelte-flow__handle) {
        background-color: rgb(113 113 122); /* bg-zinc-500 */
        border: 2px solid white;
        width: 0.75rem; /* w-3 */
        height: 0.75rem; /* h-3 */
        transition: background-color 0.2s;
    }

    :global(.svelteflow-container .svelte-flow__handle:hover) {
        background-color: rgb(82 82 91); /* bg-zinc-600 */
    }

    /* Handle connection valid state */
    :global(
        .svelteflow-container
            .svelte-flow__handle.svelte-flow__handle-connecting
    ) {
        background-color: rgb(82 82 91); /* bg-zinc-600 */
        outline: 2px solid rgb(161 161 170); /* ring-zinc-400 */
        outline-offset: 0;
    }

    /* Edge path styling */
    :global(.svelteflow-container .svelte-flow__edge-path) {
        stroke: rgb(113 113 122); /* stroke-zinc-500 */
        stroke-width: 2;
        transition:
            stroke 0.2s,
            stroke-width 0.2s;
    }

    /* Selected edge styling */
    :global(
        .svelteflow-container
            .svelte-flow__edge.selected
            .svelte-flow__edge-path
    ) {
        stroke: rgb(63 63 70); /* stroke-zinc-600 */
        stroke-width: 3;
    }

    /* Edge text/label styling */
    :global(.svelteflow-container .svelte-flow__edge-text) {
        font-family: Inter, sans-serif; /* font-inter */
        font-size: 0.75rem; /* text-xs */
        color: rgb(24 24 27); /* text-zinc-900 */
    }

    :global(.svelteflow-container .svelte-flow__edge-textbg) {
        fill: white;
    }

    /* Controls styling - minimal shadow and zinc borders */
    :global(.svelteflow-container .svelte-flow__controls) {
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-xs */
    }

    :global(.svelteflow-container .svelte-flow__controls-button) {
        border: 1px solid rgb(228 228 231); /* border-zinc-200 */
        background: white;
        color: rgb(24 24 27); /* text-zinc-900 */
        transition: background-color 0.2s;
    }

    :global(.svelteflow-container .svelte-flow__controls-button:hover) {
        background: rgb(244 244 245); /* bg-zinc-100 */
    }

    /* Minimap styling */
    :global(.svelteflow-container .svelte-flow__minimap) {
        background-color: white;
        border: 1px solid rgb(228 228 231); /* border-zinc-200 */
        border-radius: 0.5rem; /* rounded-lg */
        overflow: hidden;
    }

    /* Background pattern styling - zinc-200 color */
    :global(.svelteflow-container .svelte-flow__background) {
        color: rgb(228 228 231); /* zinc-200 */
    }

    /* Node resize handle */
    :global(.svelteflow-container .svelte-flow__resize-control) {
        border-color: rgb(161 161 170); /* border-zinc-400 */
        background-color: rgb(244 244 245); /* bg-zinc-100 */
    }

    /* Node selection box */
    :global(.svelteflow-container .svelte-flow__nodesselection-rect) {
        border: 2px solid rgb(161 161 170); /* border-zinc-400 */
        background-color: rgba(
            244,
            244,
            245,
            0.2
        ); /* bg-zinc-100 bg-opacity-20 */
    }
</style>
