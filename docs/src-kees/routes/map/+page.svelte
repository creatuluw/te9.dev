<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Nomnoml from '$lib/components/Nomnoml.svelte';

	// Nomnoml diagram code showing hierarchical sitemap structure
	const sitemapDiagram = `#direction: down
#spacing: 40
#padding: 12
#fontSize: 12
#stroke: #52525b
#fill: #fafafa
#gutter: 8

[Home|/]

[Home] -> [Processen]
[Home] -> [Cases]
[Home] -> [Werk]
[Home] -> [Berichten]
[Home] -> [Projecten]
[Home] -> [Account]
[Home] -> [Bestanden]
[Home] -> [Help]
[Home] -> [Overige Pagina's]

[Processen|/processes] -> [Nieuw Proces]
[Processen] -> [Bewerk Proces]

[Cases|/cases] -> [Nieuwe Case]
[Cases] -> [Case Detail]

[Werk|/work] -> [Werk Detail]
[Werk] -> [Backlog]

[Projecten|/projects] -> [Project Detail]

[Overige Pagina's] -> [Demo]
[Overige Pagina's] -> [Designs]
[Overige Pagina's] -> [Tests]
[Overige Pagina's] -> [Kees]
`;

	// Route mappings for clickable elements (Dutch names)
	const routeMap: Record<string, string> = {
		Home: '/',
		Processen: '/processes',
		'Nieuw Proces': '/processes/new',
		'Bewerk Proces': '/processes', // Will need ID, but general link
		Cases: '/cases',
		'Nieuwe Case': '/cases/new',
		'Case Detail': '/cases', // Will need ID, but general link
		Werk: '/work',
		'Werk Detail': '/work', // Will need ID, but general link
		Backlog: '/work/backlog',
		Berichten: '/messages',
		Projecten: '/projects',
		'Project Detail': '/projects', // Will need ID, but general link
		Account: '/account',
		Bestanden: '/files',
		Help: '/help',
		Demo: '/demo',
		Designs: '/designs',
		Tests: '/tests',
		Kees: '/kees'
	};

	let diagramContainer: HTMLDivElement | null = $state(null);

	// Use effect to watch for SVG rendering
	$effect(() => {
		if (!browser || !diagramContainer) return;

		// Use MutationObserver to watch for SVG being added
		const observer = new MutationObserver(() => {
			const svg = diagramContainer?.querySelector('.nomnoml-diagram svg') as SVGElement | null;
			if (svg && !svg.hasAttribute('data-clickable-processed')) {
				svg.setAttribute('data-clickable-processed', 'true');
				makeDiagramClickable(svg);
			}
		});

		observer.observe(diagramContainer, {
			childList: true,
			subtree: true
		});

		// Also try immediately in case SVG is already there
		const svg = diagramContainer.querySelector('.nomnoml-diagram svg') as SVGElement | null;
		if (svg && !svg.hasAttribute('data-clickable-processed')) {
			svg.setAttribute('data-clickable-processed', 'true');
			makeDiagramClickable(svg);
		}

		// Cleanup
		return () => {
			observer.disconnect();
		};
	});

	function makeDiagramClickable(svg: SVGElement) {
		if (!browser) return;

		// Find all groups that contain text elements
		const groups = svg.querySelectorAll('g');
		
		groups.forEach((group) => {
			// Skip if already processed
			if (group.hasAttribute('data-route')) return;
			
			// Find text elements in this group
			const textElements = group.querySelectorAll('text, tspan');
			
				textElements.forEach((textEl) => {
				const textContent = textEl.textContent?.trim() || '';
				
				// Check if this text matches a route (exact match or partial match)
				let route: string | undefined = routeMap[textContent];
				
				// If no exact match, try to find partial matches
				if (!route) {
					for (const [key, value] of Object.entries(routeMap)) {
						if (textContent.includes(key) || key.includes(textContent)) {
							route = value;
							break;
						}
					}
				}
				
				if (route) {
					const finalRoute = route; // Capture for closure
					// Mark this group as clickable
					group.setAttribute('data-route', finalRoute);
					group.style.cursor = 'pointer';
					
					// Find all rects in this group and make them clickable too
					const rects = group.querySelectorAll('rect');
					rects.forEach((rect) => {
						rect.style.cursor = 'pointer';
					});
					
					// Add hover effect using CSS classes
					group.classList.add('clickable-route');
					
					// Add click handler
					group.addEventListener('click', (e) => {
						e.preventDefault();
						e.stopPropagation();
						goto(finalRoute);
					});
					
					// Add title attribute for accessibility
					group.setAttribute('title', `Navigeer naar ${textContent}`);
				}
			});
		});
	}
</script>

<svelte:head>
	<title>Sitemap - Business Process Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-zinc-900 mb-2 font-aspekta">Sitemap</h1>
		<p class="text-zinc-600 text-sm">
			Overzicht van alle pagina's in de applicatie. Klik op een pagina om naar de betreffende route te navigeren.
		</p>
	</div>

	<div class="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 mb-6">
		<div bind:this={diagramContainer} class="overflow-x-auto flex justify-center">
			<Nomnoml code={sitemapDiagram} />
		</div>
	</div>
</div>

<style>
	:global(.nomnoml-diagram svg) {
		cursor: default;
	}

	:global(.nomnoml-diagram svg .clickable-route) {
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	:global(.nomnoml-diagram svg .clickable-route:hover) {
		opacity: 0.7;
	}

	:global(.nomnoml-diagram svg .clickable-route:hover rect) {
		fill: #e4e4e7 !important;
		stroke: #3b82f6 !important;
		stroke-width: 2 !important;
	}

	:global(.nomnoml-diagram svg .clickable-route:hover text) {
		fill: #3b82f6 !important;
		font-weight: 600;
	}
</style>

