<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import type { Node, Edge, NodeTypes, EdgeTypes, FitViewOptions } from '@xyflow/svelte';
	import { applySmartLayout, calculateFitView, type LayoutOptions } from '$lib/utils/flowLayout';

	// Dynamic imports to avoid SSR issues with directory imports
	let SvelteFlow = $state<any>(undefined);
	let MiniMap = $state<any>(undefined);
	let Controls = $state<any>(undefined);
	let Background = $state<any>(undefined);
	let useSvelteFlow = $state<any>(undefined);
	let initialized = $state(false);

	onMount(async () => {
		if (browser) {
			try {
				const svelteFlowModule = await import('@xyflow/svelte');
				SvelteFlow = svelteFlowModule.SvelteFlow;
				MiniMap = svelteFlowModule.MiniMap;
				Controls = svelteFlowModule.Controls;
				Background = svelteFlowModule.Background;
				useSvelteFlow = svelteFlowModule.useSvelteFlow;
				await import('@xyflow/svelte/dist/style.css');
				initialized = true;
			} catch (error) {
				console.error('Failed to load Svelte Flow:', error);
			}
		}
	});

	interface Props {
		/**
		 * Array of nodes to display in the flow
		 */
		nodes?: Node[];

		/**
		 * Array of edges connecting nodes
		 */
		edges?: Edge[];

		/**
		 * Custom node types/components
		 */
		nodeTypes?: NodeTypes;

		/**
		 * Custom edge types/components
		 */
		edgeTypes?: EdgeTypes;

		/**
		 * Whether to show minimap
		 */
		showMinimap?: boolean;

		/**
		 * Whether to show controls (zoom, pan)
		 */
		showControls?: boolean;

		/**
		 * Whether to show background grid
		 */
		showBackground?: boolean;

		/**
		 * Background variant (dots or lines)
		 */
		backgroundVariant?: 'dots' | 'lines';

		/**
		 * Whether to fit view on mount
		 */
		fitView?: boolean;

		/**
		 * Fit view options
		 */
		fitViewOptions?: FitViewOptions;

		/**
		 * Minimum zoom level
		 */
		minZoom?: number;

		/**
		 * Maximum zoom level
		 */
		maxZoom?: number;

		/**
		 * Default zoom level
		 */
		defaultZoom?: number;

		/**
		 * Container height (default: 400px)
		 */
		height?: string;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Event handler for node click
		 */
		onNodeClick?: (event: MouseEvent, node: Node) => void;

		/**
		 * Event handler for edge click
		 */
		onEdgeClick?: (event: MouseEvent, edge: Edge) => void;

		/**
		 * Event handler for node context menu (right-click)
		 */
		onNodeContextMenu?: (event: MouseEvent, node: Node) => void;

		/**
		 * Event handler for pane click (background click)
		 */
		onPaneClick?: (event: MouseEvent) => void;
		
		/**
		 * Children snippet
		 */
		children?: import('svelte').Snippet;

		/**
		 * Enable automatic smart layout
		 */
		autoLayout?: boolean;

		/**
		 * Layout options for autoLayout
		 */
		layoutOptions?: LayoutOptions;
	}

	let {
		nodes = $bindable([]),
		edges = $bindable([]),
		nodeTypes,
		edgeTypes,
		showMinimap = true,
		showControls = true,
		showBackground = true,
		backgroundVariant = 'dots',
		fitView = false,
		fitViewOptions,
		minZoom = 0.5,
		maxZoom = 2,
		defaultZoom = 1,
		height = '400px',
		class: className = '',
		onNodeClick,
		onEdgeClick,
		onNodeContextMenu,
		onPaneClick,
		children,
		autoLayout = false,
		layoutOptions
	}: Props = $props();

	// Container ref for calculating dimensions
	let containerElement = $state<HTMLDivElement | null>(null);
	let containerWidth = $state(800);
	let containerHeight = $state(600);

	// Track if layout has been applied to avoid infinite loops
	let layoutApplied = $state(false);
	let layoutedNodes = $state<Node[]>([]);
	let layoutedEdges = $state<Edge[]>([]);

	// Apply smart layout when autoLayout is enabled
	$effect(() => {
		if (autoLayout && initialized && nodes.length > 0 && containerElement && !layoutApplied) {
			// Use requestAnimationFrame to ensure DOM is ready
			requestAnimationFrame(() => {
				if (!containerElement) return;
				
				const rect = containerElement.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0) {
					// Retry after a short delay if container not measured yet
					setTimeout(() => {
						if (containerElement && !layoutApplied) {
							const retryRect = containerElement.getBoundingClientRect();
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

		// Apply layout
		const layouted = applySmartLayout([...nodes], [...edges], layoutOptions);
		
		// Store layouted nodes and edges
		layoutedNodes = layouted.nodes;
		layoutedEdges = layouted.edges;

		// Mark layout as applied
		layoutApplied = true;

		// Calculate and set fit view
		if (fitView) {
			const fitViewCalc = calculateFitView(
				layouted.bounds,
				containerWidth,
				containerHeight,
				20
			);
			fitViewOptions = {
				...fitViewOptions,
				padding: 20,
				minZoom: minZoom,
				maxZoom: maxZoom
			};
		}
	}

	// Use layouted nodes/edges when autoLayout is enabled, otherwise use original
	const displayNodes = $derived(autoLayout && layoutApplied ? layoutedNodes : nodes);
	const displayEdges = $derived(autoLayout && layoutApplied ? layoutedEdges : edges);

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
	style="height: {height}"
>
	{#if initialized && SvelteFlow}
		<svelte:component
			this={SvelteFlow}
			nodes={displayNodes}
			edges={displayEdges}
			{nodeTypes}
			{edgeTypes}
			defaultEdgeOptions={{ type: 'smoothstep' }}
			{fitView}
			{fitViewOptions}
			{minZoom}
			{maxZoom}
			{defaultZoom}
			onnodeclick={onNodeClick}
			onedgeclick={onEdgeClick}
			onnodecontextmenu={onNodeContextMenu}
			onpaneclick={onPaneClick}
		>
			{#if showBackground && Background}
				<svelte:component this={Background} variant={backgroundVariant} />
			{/if}
			{#if showControls && Controls}
				<svelte:component this={Controls} />
			{/if}
			{#if showMinimap && MiniMap}
				<svelte:component this={MiniMap} />
			{/if}
			{@render children?.()}
		</svelte:component>
	{:else}
		<div class="flex items-center justify-center h-full text-zinc-500">Loading...</div>
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
	:global(.svelteflow-container .react-flow) {
		background-color: white;
	}

	/* Default node styling - matches design system (Inter font, zinc colors) */
	:global(.svelteflow-container .react-flow__node) {
		font-family: Inter, sans-serif; /* font-inter */
		font-size: 0.75rem; /* text-xs */
		color: rgb(24 24 27); /* text-zinc-900 */
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		letter-spacing: -0.025em; /* tracking-tight */
	}

	/* Selected node styling */
	:global(.svelteflow-container .react-flow__node.selected) {
		outline: 2px solid rgb(161 161 170); /* ring-zinc-400 */
		outline-offset: 2px; /* ring-offset-2 */
	}

	/* Default node wrapper styling - card-like appearance */
	:global(.svelteflow-container .react-flow__node-default) {
		background: white;
		border: 1px solid rgb(228 228 231); /* border-zinc-200 */
		border-radius: 0.5rem; /* rounded-lg */
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-xs */
		padding: 0.5rem 0.75rem; /* px-3 py-2 */
	}

	/* Handle styling - zinc palette with white border */
	:global(.svelteflow-container .react-flow__handle) {
		background-color: rgb(113 113 122); /* bg-zinc-500 */
		border: 2px solid white;
		width: 0.75rem; /* w-3 */
		height: 0.75rem; /* h-3 */
		transition: background-color 0.2s;
	}

	:global(.svelteflow-container .react-flow__handle:hover) {
		background-color: rgb(82 82 91); /* bg-zinc-600 */
	}

	/* Handle connection valid state */
	:global(.svelteflow-container .react-flow__handle.react-flow__handle-connecting) {
		background-color: rgb(82 82 91); /* bg-zinc-600 */
		outline: 2px solid rgb(161 161 170); /* ring-zinc-400 */
		outline-offset: 0;
	}

	/* Edge path styling */
	:global(.svelteflow-container .react-flow__edge-path) {
		stroke: rgb(113 113 122); /* stroke-zinc-500 */
		stroke-width: 2;
		transition: stroke 0.2s, stroke-width 0.2s;
	}

	/* Selected edge styling */
	:global(.svelteflow-container .react-flow__edge.selected .react-flow__edge-path) {
		stroke: rgb(63 63 70); /* stroke-zinc-600 */
		stroke-width: 3;
	}

	/* Edge text/label styling */
	:global(.svelteflow-container .react-flow__edge-text) {
		font-family: Inter, sans-serif; /* font-inter */
		font-size: 0.75rem; /* text-xs */
		color: rgb(24 24 27); /* text-zinc-900 */
	}

	:global(.svelteflow-container .react-flow__edge-textbg) {
		fill: white;
	}

	/* Controls styling - minimal shadow and zinc borders */
	:global(.svelteflow-container .react-flow__controls) {
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-xs */
	}

	:global(.svelteflow-container .react-flow__controls-button) {
		border: 1px solid rgb(228 228 231); /* border-zinc-200 */
		background: white;
		color: rgb(24 24 27); /* text-zinc-900 */
		transition: background-color 0.2s;
	}

	:global(.svelteflow-container .react-flow__controls-button:hover) {
		background: rgb(244 244 245); /* bg-zinc-100 */
	}

	/* Minimap styling */
	:global(.svelteflow-container .react-flow__minimap) {
		background-color: white;
		border: 1px solid rgb(228 228 231); /* border-zinc-200 */
		border-radius: 0.5rem; /* rounded-lg */
		overflow: hidden;
	}

	/* Background pattern styling - zinc-200 color */
	:global(.svelteflow-container .react-flow__background) {
		color: rgb(228 228 231); /* zinc-200 */
	}

	/* Node resize handle */
	:global(.svelteflow-container .react-flow__resize-control) {
		border-color: rgb(161 161 170); /* border-zinc-400 */
		background-color: rgb(244 244 245); /* bg-zinc-100 */
	}

	/* Node selection box */
	:global(.svelteflow-container .react-flow__nodesselection-rect) {
		border: 2px solid rgb(161 161 170); /* border-zinc-400 */
		background-color: rgba(244, 244, 245, 0.2); /* bg-zinc-100 bg-opacity-20 */
	}
</style>

