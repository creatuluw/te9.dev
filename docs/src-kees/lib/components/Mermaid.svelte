<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import mermaid from 'mermaid';

	interface Props {
		/**
		 * Mermaid diagram syntax/code
		 */
		code: string;

		/**
		 * Mermaid configuration options (optional)
		 * @see https://mermaid.js.org/config/theming.html
		 */
		config?: {
			theme?: 'default' | 'dark' | 'forest' | 'neutral';
			startOnLoad?: boolean;
			flowchart?: {
				useMaxWidth?: boolean;
				htmlLabels?: boolean;
				curve?: 'basis' | 'linear' | 'cardinal' | 'step';
			};
			themeVariables?: Record<string, string>;
		};

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		code,
		config: userConfig,
		class: className = ''
	}: Props = $props();

	// Default config with custom fonts and theme variables
	const defaultConfig = {
		theme: 'default' as const,
		startOnLoad: true,
		flowchart: {
			useMaxWidth: true,
			htmlLabels: true,
			curve: 'basis' as const
		},
		themeVariables: {
			fontFamily: 'Inter, sans-serif',
			fontSize: '12px',
			primaryTextColor: '#18181b', // zinc-900
			primaryColor: '#3f3f46', // zinc-600
			secondaryColor: '#71717a', // zinc-500
			tertiaryColor: '#a1a1aa', // zinc-400
			primaryBorderColor: '#e4e4e7', // zinc-200
			secondaryBorderColor: '#d4d4d8', // zinc-300
			noteTextColor: '#18181b' // zinc-900
		}
	};

	// Merge user config with defaults (reactive)
	const config = $derived(userConfig 
		? {
				...defaultConfig,
				...userConfig,
				flowchart: {
					...defaultConfig.flowchart,
					...userConfig.flowchart
				},
				themeVariables: {
					...defaultConfig.themeVariables,
					...userConfig.themeVariables
				}
			}
		: defaultConfig);

	let containerRef: HTMLDivElement | null = $state(null);
	let diagramId = $state(`mermaid-${Math.random().toString(36).substring(2, 9)}`);
	let error = $state<string | null>(null);
	let initialized = $state(false);

	onMount(async () => {
		if (!browser) return;

		// Initialize Mermaid with merged config (disable auto-start)
		mermaid.initialize({
			...config,
			startOnLoad: false
		});

		initialized = true;

		// Wait for next tick to ensure DOM is ready
		await new Promise((resolve) => setTimeout(resolve, 0));
		
		// Render diagram when code changes
		renderDiagram();
	});

	async function renderDiagram() {
		if (!browser || !containerRef || !code.trim() || !initialized) return;

		error = null;

		try {
			// Clear previous content
			if (containerRef) {
				containerRef.innerHTML = '';
			}

			// Generate new unique ID for this render
			diagramId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

			// Use mermaid.render() to generate SVG string
			const { svg } = await mermaid.render(diagramId, code);

		if (containerRef) {
			// Insert the rendered SVG directly
			containerRef.innerHTML = svg;
			
			// Apply custom fonts and font sizes to SVG text elements after insertion
			if (containerRef.firstElementChild) {
				const svgElement = containerRef.firstElementChild as SVGElement;
				applyCustomFonts(svgElement);
				applyFontSizes(svgElement);
			}
		}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to render Mermaid diagram';
			console.error('Mermaid render error:', err);
		}
	}

	// Apply custom fonts to SVG text elements
	function applyCustomFonts(svgElement: SVGElement) {
		if (!browser) return;
		
		// Find all text elements in the SVG
		const textElements = svgElement.querySelectorAll('text, tspan');
		
		textElements.forEach((element) => {
			const textEl = element as SVGTextElement;
			
			// Check if it's a label/heading (usually has specific classes or attributes)
			const isLabel = textEl.classList.contains('nodeLabel') || 
			                textEl.classList.contains('edgeLabel') ||
			                textEl.classList.contains('cluster-label') ||
			                textEl.getAttribute('font-weight') === 'bold' ||
			                textEl.getAttribute('font-weight') === '600' ||
			                textEl.getAttribute('font-weight') === '650';
			
			// Apply Aspekta for labels/headings, Inter for body text
			if (isLabel) {
				textEl.setAttribute('font-family', 'Aspekta, sans-serif');
			} else {
				textEl.setAttribute('font-family', 'Inter, sans-serif');
			}
		});
	}

	// Apply smaller font sizes to all text elements
	function applyFontSizes(svgElement: SVGElement) {
		if (!browser) return;
		
		// Find all text elements in the SVG
		const textElements = svgElement.querySelectorAll('text, tspan');
		
		textElements.forEach((element) => {
			const textEl = element as SVGTextElement;
			
			// Get current font size or use default
			const currentSize = textEl.getAttribute('font-size') || '14px';
			const currentSizeNum = parseFloat(currentSize);
			
			// Reduce font size by ~15% (scale down proportionally)
			if (currentSizeNum > 0) {
				const newSize = Math.max(10, currentSizeNum * 0.85); // Minimum 10px
				textEl.setAttribute('font-size', `${newSize}px`);
			} else {
				// Set to 12px if no size was specified
				textEl.setAttribute('font-size', '12px');
			}
		});
	}

	// Reactive update when code changes
	$effect(() => {
		if (initialized && code && containerRef) {
			// Use a small timeout to ensure DOM is ready
			const timeoutId = setTimeout(() => {
				renderDiagram();
			}, 0);
			
			return () => clearTimeout(timeoutId);
		}
	});
</script>

<div class="mermaid-container {className}">
	{#if error}
		<div class="mermaid-error border border-red-300 bg-red-50 rounded-lg p-4">
			<p class="text-sm text-red-900 font-medium mb-1">Mermaid Rendering Error</p>
			<p class="text-xs text-red-700 font-mono">{error}</p>
		</div>
	{:else}
		<div bind:this={containerRef} class="mermaid-diagram flex justify-center items-center min-h-[200px] p-4"></div>
	{/if}
</div>

<style>
	.mermaid-container :global(.mermaid) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.mermaid-container :global(svg) {
		max-width: 100%;
		height: auto;
	}

	/* Apply custom fonts to all Mermaid SVG text elements */
	.mermaid-container :global(svg text),
	.mermaid-container :global(svg tspan) {
		font-family: Inter, sans-serif;
		font-size: 12px;
	}

	/* Apply Aspekta for labels and headings */
	.mermaid-container :global(svg .nodeLabel),
	.mermaid-container :global(svg .edgeLabel),
	.mermaid-container :global(svg .cluster-label),
	.mermaid-container :global(svg text[font-weight="bold"]),
	.mermaid-container :global(svg text[font-weight="600"]),
	.mermaid-container :global(svg text[font-weight="650"]) {
		font-family: Aspekta, sans-serif;
	}

	/* Apply PT Mono for code/monospace text if needed */
	.mermaid-container :global(svg .code),
	.mermaid-container :global(svg text[font-family*="mono"]) {
		font-family: 'PT Mono', monospace;
	}
</style>

