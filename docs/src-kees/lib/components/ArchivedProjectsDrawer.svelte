<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Drawer } from '$lib/components';
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import * as projectService from '$lib/services/projectService';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import type { Project } from '$lib/services/projectService';
	import { ArchiveRestore, FolderOpen, Pencil, Folder } from 'lucide-svelte';

	/**
	 * ArchivedProjectsDrawer component props
	 * 
	 * Drawer component for viewing and managing archived projects.
	 * Opens when URL param `drawer=archived-projects` is present.
	 */
	interface Props {
		/**
		 * Callback fired when a project is restored
		 */
		onrestored?: () => void;
	}

	let {
		onrestored
	}: Props = $props();

	// Derive state from URL params
	const drawerParam = $derived($page.url.searchParams.get('drawer'));
	
	const isOpen = $derived(drawerParam === 'archived-projects');

	let archivedProjects = $state<Project[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let restoring = $state<number | null>(null);

	// Load archived projects when drawer opens
	$effect(() => {
		if (isOpen) {
			loadArchivedProjects();
		}
	});

	async function loadArchivedProjects() {
		loading = true;
		error = null;
		try {
			const result = await projectService.getAllProjectsIncludingArchived();
			if (result.success) {
				// Filter to only archived projects
				archivedProjects = result.value.filter(p => p.status === 'archived');
			} else {
				console.error('Error loading archived projects:', result.error);
				error = 'Fout bij laden van gearchiveerde projecten';
				toastStore.add(getUserMessage(result.error), 'error');
			}
		} catch (err) {
			console.error('Error loading archived projects:', err);
			error = 'Fout bij laden van gearchiveerde projecten';
		} finally {
			loading = false;
		}
	}

	async function handleRestore(projectId: number) {
		restoring = projectId;
		try {
			const result = await projectService.updateProject(projectId, {
				status: 'active'
			});
			if (result.success) {
				toastStore.add('Project hersteld', 'success');
				// Reload archived projects
				await loadArchivedProjects();
				onrestored?.();
			} else {
				console.error('Error restoring project:', result.error);
				toastStore.add(getUserMessage(result.error), 'error');
			}
		} catch (err) {
			console.error('Error restoring project:', err);
			toastStore.add('Fout bij herstellen van project', 'error');
		} finally {
			restoring = null;
		}
	}

	function handleViewProject(projectId: number) {
		goto(`/projects/${projectId}`);
	}

	async function openEditDrawer(projectId: number) {
		await goto(`?drawer=project&projectId=${projectId}`, { noScroll: true });
	}

	async function handleClose() {
		// Remove drawer params from URL
		const url = new URL($page.url);
		url.searchParams.delete('drawer');
		await goto(url.pathname + url.search, { noScroll: true });
	}
</script>

<Drawer open={isOpen} position="right" class="w-[95vw] md:w-[66vw]" onclose={handleClose}>
	<div class="flex flex-col h-full">
		<!-- Header -->
		<div class="mb-6 pb-4 border-b border-zinc-200">
			<h2 class="text-2xl font-bold text-zinc-900 font-aspekta">
				Gearchiveerde Projecten
			</h2>
			<p class="text-zinc-600 text-sm mt-2">
				Bekijk en beheer alle gearchiveerde projecten. U kunt projecten herstellen om ze weer actief te maken.
			</p>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto pb-6">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<Spinner size="md" />
				</div>
			{:else if error}
				<div class="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
					{error}
				</div>
			{:else if archivedProjects.length === 0}
				<div class="text-center py-12">
					<p class="text-zinc-500">Geen gearchiveerde projecten gevonden.</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each archivedProjects as project (project.id)}
						<div class="relative block cursor-pointer text-left w-full group">
							<div class="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-xs transition">
								<div class="grid grid-cols-12 items-center gap-x-2">
									<!-- Project Icon & Name -->
									<div class="col-span-6 order-1 sm:order-none sm:col-span-3 flex items-center space-x-4">
										<div class="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
											<Folder class="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
										</div>
										<div class="min-w-0">
											<div class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{project.name}</div>
											<div class="text-xs text-zinc-500 dark:text-zinc-400">ID: {project.id}</div>
										</div>
									</div>
									
									<!-- Description (hidden on small screens) -->
									<div class="col-span-6 order-2 sm:order-none sm:col-span-4 text-left sm:text-center hidden sm:block">
										<div class="text-sm text-zinc-600 dark:text-zinc-400 truncate">
											{project.description || 'Geen beschrijving'}
										</div>
									</div>
									
									<!-- Status -->
									<div class="col-span-6 order-1 sm:order-none sm:col-span-2 text-right sm:text-center">
										<div class="text-xs inline-flex font-medium bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full text-center px-2.5 py-1">
											Gearchiveerd
										</div>
									</div>
									
									<!-- Actions -->
									<div class="col-span-6 order-2 sm:order-none sm:col-span-3 flex items-center justify-end gap-2">
										<Tooltip text="Bekijken">
											<button
												onclick={(e) => { e.stopPropagation(); handleViewProject(project.id); }}
												class="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-sm transition-colors"
											>
												<FolderOpen class="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
											</button>
										</Tooltip>
										<Tooltip text="Bewerken">
											<button
												onclick={(e) => { e.stopPropagation(); openEditDrawer(project.id); }}
												class="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-sm transition-colors"
											>
												<Pencil class="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
											</button>
										</Tooltip>
										<Tooltip text="Herstellen">
											<button
												onclick={(e) => { e.stopPropagation(); handleRestore(project.id); }}
												disabled={restoring === project.id}
												class="w-8 h-8 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/20 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<ArchiveRestore class="w-4 h-4 text-green-600 dark:text-green-400" />
											</button>
										</Tooltip>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white">
			<div class="flex justify-end">
				<Button variant="secondary" onclick={handleClose}>
					Sluiten
				</Button>
			</div>
		</div>
	</div>
</Drawer>

