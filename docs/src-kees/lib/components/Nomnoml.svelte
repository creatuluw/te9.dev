<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import nomnoml from 'nomnoml';

	interface Props {
		/**
		 * Nomnoml diagram syntax/code
		 */
		code: string;

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		code,
		class: className = ''
	}: Props = $props();

	let containerRef: HTMLDivElement | null = $state(null);
	let error = $state<string | null>(null);

	onMount(() => {
		if (!browser) return;
		renderDiagram();
	});

	function renderDiagram() {
		if (!browser || !containerRef || !code.trim()) return;

		error = null;

		try {
			// Clear previous content
			if (containerRef) {
				containerRef.innerHTML = '';
			}

			// Use nomnoml.renderSvg() to generate SVG string
			const svg = nomnoml.renderSvg(code);

			if (containerRef) {
				// Insert the rendered SVG directly
				containerRef.innerHTML = svg;

				// Apply custom fonts to SVG text elements after insertion
				if (containerRef.firstElementChild) {
					const svgElement = containerRef.firstElementChild as SVGElement;
					applyCustomFonts(svgElement);
					applyFontSizes(svgElement);
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to render Nomnoml diagram';
			console.error('Nomnoml render error:', err);
		}
	}

	// Apply custom fonts to SVG text elements
	function applyCustomFonts(svgElement: SVGElement) {
		if (!browser) return;

		// Find all text elements in the SVG
		const textElements = svgElement.querySelectorAll('text, tspan');

		textElements.forEach((element) => {
			const textEl = element as SVGTextElement;

			// Check if it's a label/heading (usually bold or title)
			const isLabel =
				textEl.getAttribute('font-weight') === 'bold' ||
				textEl.getAttribute('font-weight') === '600' ||
				textEl.getAttribute('font-weight') === '650' ||
				textEl.classList.contains('title');

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
		if (code && containerRef) {
			// Use a small timeout to ensure DOM is ready
			const timeoutId = setTimeout(() => {
				renderDiagram();
			}, 0);

			return () => clearTimeout(timeoutId);
		}
	});
</script>

<div class="nomnoml-container {className}">
	{#if error}
		<div class="nomnoml-error border border-red-300 bg-red-50 rounded-lg p-4">
			<p class="text-sm text-red-900 font-medium mb-1">Nomnoml Rendering Error</p>
			<p class="text-xs text-red-700 font-mono">{error}</p>
		</div>
	{:else}
		<div bind:this={containerRef} class="nomnoml-diagram flex justify-center items-center min-h-[200px] p-4"></div>
	{/if}
</div>

<style>
	.nomnoml-container :global(.nomnoml) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.nomnoml-container :global(svg) {
		max-width: 100%;
		height: auto;
	}

	/* Apply custom fonts to all Nomnoml SVG text elements */
	.nomnoml-container :global(svg text),
	.nomnoml-container :global(svg tspan) {
		font-family: Inter, sans-serif;
		font-size: 12px;
	}

	/* Apply Aspekta for labels and headings */
	.nomnoml-container :global(svg text[font-weight="bold"]),
	.nomnoml-container :global(svg text[font-weight="600"]),
	.nomnoml-container :global(svg text[font-weight="650"]),
	.nomnoml-container :global(svg .title) {
		font-family: Aspekta, sans-serif;
	}

	/* Apply PT Mono for code/monospace text if needed */
	.nomnoml-container :global(svg .code),
	.nomnoml-container :global(svg text[font-family*="mono"]) {
		font-family: 'PT Mono', monospace;
	}
</style>

