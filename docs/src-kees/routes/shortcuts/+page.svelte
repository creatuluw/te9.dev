<script lang="ts">
	import type { PageData } from './$types';

	// Get SSR data from page
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Snelkoppelingen - Business Process Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-zinc-900 mb-2 font-aspekta">Snelkoppelingen</h1>
		<p class="text-zinc-600 text-sm">
			Je persoonlijke snelkoppelingen
		</p>
	</div>

	<div class="bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
		<div class="text-center py-12">
			<p class="text-zinc-500">Snelkoppelingen komen hier binnenkort beschikbaar</p>
		</div>
	</div>
</div>





































