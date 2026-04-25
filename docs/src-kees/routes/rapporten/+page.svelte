<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { FileText, Users, BarChart3 } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	/**
	 * Report card interface
	 */
	interface ReportCard {
		/**
		 * Report name/title
		 */
		name: string;
		
		/**
		 * Report description
		 */
		description?: string;
		
		/**
		 * Route path for the report (relative to /rapporten)
		 */
		href: string;
		
		/**
		 * Icon component for the report
		 * @default FileText
		 */
		icon?: ComponentType;
	}

	/**
	 * Available reports configuration
	 * Add new reports here to display them as cards
	 */
	const reports: ReportCard[] = [
		{
			name: 'Medewerkers',
			description: 'Overzicht van medewerkers en hun activiteiten',
			href: '/rapporten/medewerkers',
			icon: Users
		},
		{
			name: 'Operationeel',
			description: 'Werk en voortgang monitoring voor operationele managers',
			href: '/rapporten/operational',
			icon: BarChart3
		}
	];

	function handleViewReport(href: string, event?: MouseEvent) {
		if (event) {
			event.stopPropagation();
		}
		goto(href);
	}
</script>

<svelte:head>
	<title>Rapporten - Kees Pippeloi</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	
	{#if reports.length === 0}
		<div class="bg-white rounded-lg border border-zinc-200 p-6 shadow-xs">
			<p class="text-zinc-600">Nog geen rapporten beschikbaar.</p>
		</div>
	{:else}
		<!-- Report Cards Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
			{#each reports as report (report.href)}
				{@const Icon = report.icon || FileText}
				<button
					type="button"
					class="relative block cursor-pointer text-left w-full group p-4 rounded-lg bg-white border border-zinc-200 hover:shadow-sm hover:border-zinc-300 transition-all"
					onclick={() => handleViewReport(report.href)}
				>
					<!-- Report Icon & Name -->
					<div class="flex items-center space-x-4">
						<div class="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors flex items-center justify-center">
							<Icon class="w-5 h-5 text-zinc-600" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="text-sm font-medium text-zinc-900 truncate">{report.name}</div>
							<div class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">Rapport</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

