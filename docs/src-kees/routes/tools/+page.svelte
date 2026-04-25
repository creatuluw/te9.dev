<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components';
	import { FileQuestionMark, ClipboardList } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Tools - Kees Pippeloi</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-zinc-900 font-aspekta">Tools</h1>
		<p class="text-zinc-600 mt-1">Beheer integraties en tools</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">

		<!-- Formbricks Tool -->
		<button
			type="button"
			onclick={() => goto('/tools/formbricks')}
			class="relative block cursor-pointer text-left w-full group p-4 rounded-lg bg-white border border-zinc-200 hover:shadow-sm hover:border-zinc-300 transition-all"
		>
			<!-- Tool Icon & Name -->
			<div class="flex items-center space-x-4">
				<div class="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors flex items-center justify-center">
					<ClipboardList class="w-5 h-5 text-zinc-600" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="text-sm font-medium text-zinc-900 truncate">Formulieren - Formbricks</div>
					<div class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">Formulieren beheren</div>
				</div>
			</div>
		</button>

		<!-- Typebot Tool -->
		<button hidden
			type="button"
			onclick={() => goto('/tools/typebot')}
			class="relative block cursor-pointer text-left w-full group p-4 rounded-lg bg-white border border-zinc-200 hover:shadow-sm hover:border-zinc-300 transition-all"
		>
			<!-- Tool Icon & Name -->
			<div class="flex items-center space-x-4">
				<div class="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors flex items-center justify-center">
					<FileQuestionMark class="w-5 h-5 text-zinc-600" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="text-sm font-medium text-zinc-900 truncate">Typebot</div>
					<div class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">Verstuur formulieren</div>
				</div>
			</div>
		</button>

	</div>
</div>

