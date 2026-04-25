<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Drawer } from '$lib/components';
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import * as caseService from '$lib/services/caseService';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import type { CaseTask } from '$lib/schemas/case';
	import { ArchiveRestore, CheckCircle2, Trash2 } from 'lucide-svelte';

	interface Props {
		caseId: number;
		onrestored?: () => void;
	}

	let {
		caseId,
		onrestored
	}: Props = $props();

	const drawerParam = $derived($page.url.searchParams.get('drawer'));
	const isOpen = $derived(drawerParam === 'archived-tasks');

	let archivedTasks = $state<CaseTask[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let restoring = $state<number | null>(null);

	$effect(() => {
		if (isOpen) {
			loadArchivedTasks();
		}
	});

	async function loadArchivedTasks() {
		loading = true;
		error = null;
		try {
			const result = await caseService.getCaseById(caseId);
			if (result.success) {
				const allTasks: CaseTask[] = [];
				result.value.steps.forEach(step => {
					step.tasks.forEach(task => {
						if (task.closed) {
							allTasks.push(task);
						}
					});
				});
				archivedTasks = allTasks;
			} else {
				console.error('Error loading archived tasks:', result.error);
				error = 'Fout bij laden van gearchiveerde taken';
				toastStore.add(getUserMessage(result.error), 'error');
			}
		} catch (err) {
			console.error('Error loading archived tasks:', err);
			error = 'Fout bij laden van gearchiveerde taken';
		} finally {
			loading = false;
		}
	}

	async function handleRestore(taskId: number) {
		restoring = taskId;
		try {
			const result = await caseService.unarchiveCaseTask(taskId);
			if (result.success) {
				toastStore.add('Taak hersteld', 'success');
				await loadArchivedTasks();
				onrestored?.();
			} else {
				console.error('Error restoring task:', result.error);
				toastStore.add(getUserMessage(result.error), 'error');
			}
		} catch (err) {
			console.error('Error restoring task:', err);
			toastStore.add('Fout bij herstellen van taak', 'error');
		} finally {
			restoring = null;
		}
	}

	async function handleClose() {
		const url = new URL($page.url);
		url.searchParams.delete('drawer');
		await goto(url.pathname + url.search, { noScroll: true });
	}
</script>

<Drawer open={isOpen} position="right" class="w-[95vw] md:w-[66vw]" onclose={handleClose}>
	<div class="flex flex-col h-full">
		<div class="mb-6 pb-4 border-b border-zinc-200">
			<h2 class="text-2xl font-bold text-zinc-900 font-aspekta">
				Gearchiveerde Taken
			</h2>
			<p class="text-zinc-600 text-sm mt-2">
				Bekijk en beheer alle gearchiveerde taken voor deze case. U kunt taken herstellen om ze weer actief te maken.
			</p>
		</div>

		<div class="flex-1 overflow-y-auto pb-6">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<Spinner size="md" />
				</div>
			{:else if error}
				<div class="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
					{error}
				</div>
			{:else if archivedTasks.length === 0}
				<div class="text-center py-12">
					<p class="text-zinc-500">Geen gearchiveerde taken gevonden.</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each archivedTasks as task (task.id)}
						<div class="relative block cursor-pointer text-left w-full group">
							<div class="p-4 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 shadow-xs transition">
								<div class="grid grid-cols-12 items-center gap-x-2">
									<div class="col-span-6 sm:col-span-4 flex items-center space-x-4">
										<div class="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
											<CheckCircle2 class="w-5 h-5 text-zinc-600" />
										</div>
										<div class="min-w-0">
											<div class="text-sm font-medium text-zinc-900 truncate">{task.name || `Taak ${task.id}`}</div>
											<div class="text-xs text-zinc-500">ID: {task.id}</div>
										</div>
									</div>

									<div class="col-span-6 sm:col-span-4 text-center hidden sm:block">
										<div class="text-sm text-zinc-600 truncate">
											{task.status || 'Onbekend'}
										</div>
									</div>

									<div class="col-span-6 sm:col-span-2 text-right sm:text-center">
										<div class="text-xs inline-flex font-medium bg-yellow-500/20 text-yellow-700 rounded-full text-center px-2.5 py-1">
											Gearchiveerd
										</div>
									</div>

									<div class="col-span-6 sm:col-span-3 flex items-center justify-end gap-2">
										<Tooltip text="Herstellen">
											<button
												onclick={(e) => { e.stopPropagation(); handleRestore(task.id); }}
												disabled={restoring === task.id}
												class="w-8 h-8 flex items-center justify-center hover:bg-green-50 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<ArchiveRestore class="w-4 h-4 text-green-600" />
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

		<div class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white">
			<div class="flex justify-end">
				<Button variant="secondary" onclick={handleClose}>
					Sluiten
				</Button>
			</div>
		</div>
	</div>
</Drawer>
