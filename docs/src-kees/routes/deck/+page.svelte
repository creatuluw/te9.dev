<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Button from '$lib/components/Button.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		ArrowRight,
		ArrowLeft,
		Target,
		Users,
		Eye,
		TrendingUp,
		MessageSquare,
		BarChart3,
		Workflow,
		FileText,
		CheckSquare,
		List,
		Calendar,
		MessageCircle,
		FolderOpen,
		FileSearch,
		ChartBar,
		Activity,
		Folder,
		Settings,
		Shield,
		ExternalLink,
		Home,
		Clock,
		Archive,
		HelpCircle,
		Map,
		Wrench,
		Rocket,
		Lightbulb,
		Sparkles
	} from 'lucide-svelte';
	import slidesData from './slides.json';

	// Icon map to convert string names to icon components
	const iconMap: Record<string, any> = {
		Rocket,
		Target,
		Users,
		Eye,
		TrendingUp,
		MessageSquare,
		BarChart3,
		Workflow,
		FileText,
		CheckSquare,
		List,
		Calendar,
		MessageCircle,
		FolderOpen,
		FileSearch,
		ChartBar,
		Activity,
		Folder,
		Settings,
		Shield,
		ExternalLink,
		Home,
		Clock,
		Archive,
		HelpCircle,
		Map,
		Wrench,
		Lightbulb,
		Sparkles
	};

	interface Slide {
		id: string;
		type: 'title' | 'content' | 'feature';
		title: string;
		subtitle?: string;
		content?: string;
		icon?: any;
		features?: Array<{ name: string; description: string; link: string; icon: any }>;
	}

	// Process slides data: convert icon strings to icon components
	const slides: Slide[] = slidesData.map((slide: any) => ({
		...slide,
		icon: slide.icon ? iconMap[slide.icon] : undefined,
		features: slide.features?.map((feature: any) => ({
			...feature,
			icon: feature.icon ? iconMap[feature.icon] : undefined
		}))
	}));

	let currentSlideIndex = $state(0);
	let isTransitioning = $state(false);
	let isUpdatingFromUrl = $state(false);

	const currentSlide = $derived(slides[currentSlideIndex]);
	const totalSlides = slides.length;
	const progress = $derived(((currentSlideIndex + 1) / totalSlides) * 100);

	// Update URL when slide changes (but not when updating from URL)
	function updateUrl(index: number) {
		if (isUpdatingFromUrl) return; // Don't update URL if we're syncing from URL
		
		const newUrl = new URL($page.url);
		if (index === 0) {
			// Remove slide param for first slide
			newUrl.searchParams.delete('slide');
		} else {
			newUrl.searchParams.set('slide', String(index + 1)); // Convert to 1-based
		}
		goto(newUrl.toString(), { replaceState: true, noScroll: true });
	}

	// Initialize from URL parameter on mount and sync with URL changes (browser back/forward)
	$effect(() => {
		const slideParam = $page.url.searchParams.get('slide');
		if (slideParam) {
			const index = parseInt(slideParam, 10) - 1; // Convert 1-based to 0-based
			if (!isNaN(index) && index >= 0 && index < slides.length && index !== currentSlideIndex) {
				isUpdatingFromUrl = true;
				currentSlideIndex = index;
				// Reset flag after a brief delay to allow URL updates to complete
				setTimeout(() => {
					isUpdatingFromUrl = false;
				}, 0);
			}
		} else if (currentSlideIndex !== 0) {
			// If no slide param and not on first slide, go to first slide
			isUpdatingFromUrl = true;
			currentSlideIndex = 0;
			setTimeout(() => {
				isUpdatingFromUrl = false;
			}, 0);
		}
	});

	function nextSlide() {
		if (isTransitioning || currentSlideIndex >= slides.length - 1) return;
		isTransitioning = true;
		currentSlideIndex++;
		updateUrl(currentSlideIndex);
		setTimeout(() => {
			isTransitioning = false;
		}, 500);
	}

	function prevSlide() {
		if (isTransitioning || currentSlideIndex <= 0) return;
		isTransitioning = true;
		currentSlideIndex--;
		updateUrl(currentSlideIndex);
		setTimeout(() => {
			isTransitioning = false;
		}, 500);
	}

	function goToSlide(index: number) {
		if (isTransitioning) return;
		isTransitioning = true;
		currentSlideIndex = index;
		updateUrl(currentSlideIndex);
		setTimeout(() => {
			isTransitioning = false;
		}, 500);
	}

	function openFeature(link: string) {
		window.open(link, '_blank');
	}

	onMount(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === 'ArrowRight' || e.key === ' ') {
				e.preventDefault();
				nextSlide();
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				prevSlide();
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	});
</script>

<svelte:head>
	<title>Presentatie - kees.pippeloi.nl</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="fixed inset-0 bg-zinc-50 overflow-hidden">
	<!-- Progress Bar -->
	<div class="absolute top-0 left-0 right-0 h-1 bg-zinc-200 z-50">
		<div
			class="h-full bg-zinc-900 transition-all duration-500 ease-out"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Navigation Controls -->
	<div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4">
		<button
			onclick={prevSlide}
			disabled={currentSlideIndex === 0 || isTransitioning}
			class="p-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			aria-label="Vorige slide"
		>
			<ArrowLeft class="w-5 h-5" />
		</button>

		<div class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm">
			<span class="presentation-slide-number">
				{currentSlideIndex + 1} / {totalSlides}
			</span>
		</div>

		<button
			onclick={nextSlide}
			disabled={currentSlideIndex >= slides.length - 1 || isTransitioning}
			class="p-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			aria-label="Volgende slide"
		>
			<ArrowRight class="w-5 h-5" />
		</button>
	</div>

	<!-- Slide Indicators -->
	<div class="absolute top-4 right-4 z-40 flex flex-wrap gap-1 max-w-xs">
		{#each slides as slide, index}
			<button
				onclick={() => goToSlide(index)}
				class="w-2 h-2 rounded-full transition-all duration-200 {currentSlideIndex === index
					? 'bg-zinc-900 w-6'
					: 'bg-zinc-300 hover:bg-zinc-400'}"
				aria-label="Ga naar slide {index + 1}"
			></button>
		{/each}
	</div>

	<!-- Slide Content -->
	<div class="h-full w-full flex items-center justify-center p-12 relative">
		{#key currentSlideIndex}
			{#if currentSlide.type === 'title'}
				<div
					class="text-center max-w-4xl mx-auto {currentSlideIndex === 0 ? 'title-slide' : ''}"
					in:fly={{ y: 50, duration: 600, easing: quintOut }}
					out:fade={{ duration: 300 }}
				>
					<h1 class="presentation-title">
						{currentSlide.title}
					</h1>
					{#if currentSlide.subtitle}
						<p class="presentation-subtitle">
							{currentSlide.subtitle}
						</p>
					{/if}
					{#if currentSlide.content}
						<p class="presentation-body">
							{currentSlide.content}
						</p>
					{/if}
				</div>
			{:else if currentSlide.type === 'content'}
				<div
					class="max-w-4xl mx-auto text-center"
					in:fly={{ y: 50, duration: 600, easing: quintOut }}
					out:fade={{ duration: 300 }}
				>
					<h2 class="presentation-heading">
						{currentSlide.title}
					</h2>
					<p class="presentation-content">
						{currentSlide.content}
					</p>
				</div>
			{:else if currentSlide.type === 'feature'}
				<div
					class="max-w-6xl mx-auto w-full"
					in:slide={{ axis: 'x', duration: 600, easing: quintOut }}
					out:fade={{ duration: 300 }}
				>
					<h2 class="presentation-section-title">
						{currentSlide.title}
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						{#each currentSlide.features || [] as feature, index}
							<button
								onclick={() => openFeature(feature.link)}
								class="group bg-white rounded-lg border border-zinc-200 p-6 shadow-xs hover:shadow-sm hover:border-zinc-300 transition-all duration-200 text-left"
								in:fly={{ y: 30, duration: 400, delay: index * 100, easing: quintOut }}
							>
								<div class="flex items-start gap-4">
									<div
										class="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-200 transition-colors"
									>
										<svelte:component this={feature.icon} class="w-6 h-6 text-zinc-900" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-2">
											<h3 class="presentation-feature-title">
												{feature.name}
											</h3>
											<ExternalLink class="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors flex-shrink-0" />
										</div>
										<p class="presentation-feature-description">
											{feature.description}
										</p>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/key}

		<!-- Bottom-right Icon -->
		{#if currentSlide.icon}
			<div
				class="absolute bottom-8 right-8 z-30 opacity-20"
				in:fly={{ x: 50, opacity: 0, duration: 600, delay: 300, easing: quintOut }}
				out:fade={{ duration: 300 }}
			>
				<svelte:component this={currentSlide.icon} class="w-64 h-64 text-zinc-900" />
			</div>
		{/if}
	</div>

	<!-- Home Button -->
	<div class="absolute top-4 left-4 z-40">
		<button
			onclick={() => goto('/kees')}
			class="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200 group"
			aria-label="Ga naar Kees"
		>
			<Home class="w-4 h-4 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
			<span class="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors font-inter">
				Kees
			</span>
		</button>
	</div>

</div>

<style>
	:global(body) {
		overflow: hidden;
	}

	/* Presentation Typography - Montserrat for headings, Inter for body */
	.presentation-title {
		font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 4.5rem;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: #18181b;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.presentation-subtitle {
		font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 2rem;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.01em;
		color: #52525b;
		margin-bottom: 2rem;
		text-align: center;
	}

	.presentation-body {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 1.5rem;
		font-weight: 400;
		line-height: 1.6;
		color: #71717a;
		text-align: center;
		max-width: 48rem;
		margin: 0 auto;
	}

	/* Larger text for first slide (title slide) */
	.title-slide .presentation-title {
		font-size: 8rem;
		margin-bottom: 2.5rem;
	}

	.title-slide .presentation-subtitle {
		font-size: 3.5rem;
		margin-bottom: 3rem;
	}

	.title-slide .presentation-body {
		font-size: 2.5rem;
		max-width: 64rem;
	}

	.presentation-heading {
		font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 3.5rem;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: #18181b;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.presentation-content {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 1.375rem;
		font-weight: 400;
		line-height: 1.7;
		color: #52525b;
		text-align: center;
		max-width: 48rem;
		margin: 0 auto;
	}

	.presentation-section-title {
		font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 2.75rem;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.01em;
		color: #18181b;
		margin-bottom: 2rem;
		text-align: center;
	}

	.presentation-feature-title {
		font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.01em;
		color: #18181b;
	}

	.presentation-feature-description {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.6;
		color: #52525b;
	}

	.presentation-slide-number {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 0.875rem;
		font-weight: 500;
		color: #52525b;
	}

	.presentation-hint {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 0.75rem;
		font-weight: 400;
		color: #a1a1aa;
	}

	/* Responsive adjustments for smaller screens */
	@media (max-width: 768px) {
		.presentation-title {
			font-size: 3rem;
		}

		.presentation-subtitle {
			font-size: 1.5rem;
		}

		.presentation-body {
			font-size: 1.25rem;
		}

		.presentation-heading {
			font-size: 2.5rem;
		}

		.presentation-content {
			font-size: 1.125rem;
		}

		.presentation-section-title {
			font-size: 2rem;
		}
	}
</style>

