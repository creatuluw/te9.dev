<script lang="ts">
	import { goto } from '$app/navigation';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { navigationStore } from '$lib/stores/navigationStore';
	import { isSysadminStore } from '$lib/stores/authStore';
	import { toastStore } from '$lib/stores/toastStore';
	import { useRealtime } from '$lib/hooks/useRealtime.svelte';
	import type { ProjectWithMembership } from '$lib/services/projectService';
	import type { Project } from '$lib/schemas/project';
	import Button from '$lib/components/Button.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ProjectDrawer from '$lib/components/ProjectDrawer.svelte';
	import ArchivedProjectsDrawer from '$lib/components/ArchivedProjectsDrawer.svelte';
	import { Pencil, Archive, FolderOpen, ArchiveRestore } from 'lucide-svelte';

	// Props from SSR
	interface PageData {
		projects: ProjectWithMembership[];
		_version: string;
		errors: { projects: any };
		timestamp: number;
	}

	const { data }: { data: PageData } = $props();

	// Capture initial data to avoid circular reference in fetcher
	let currentVersion = $state(data._version);
	let currentProjects = $state<ProjectWithMembership[]>(data.projects);

	// Realtime subscription with SSR data
	const realtime = useRealtime<ProjectWithMembership[]>(
		'projects:list',
		async () => {
			const res = await fetch('/api/realtime/projects', {
				headers: { 'If-None-Match': currentVersion }
			});
			if (res.status === 304) {
				return { data: currentProjects, etag: currentVersion };
			}
			const json = await res.json();
			currentProjects = json.data;
			currentVersion = json._version;
			return { data: json.data, etag: json._version };
		},
		{
			initialData: currentProjects,
			initialVersion: currentVersion,
			interval: 10000
		}
	);

	// Modal state for confirmation
	let confirmModalOpen = $state(false);
	let projectToArchive = $state<number | null>(null);
	let archiving = $state(false);

	// Derived state
	let projects = $derived(realtime.data || []);
	let loading = $derived(realtime.loading && !realtime.data);

	function handleViewProject(projectId: number) {
		goto(`/projects/${projectId}`);
	}

	function handleArchive(id: number, event: Event) {
		event.stopPropagation();
		projectToArchive = id;
		confirmModalOpen = true;
	}

	async function confirmArchive() {
		if (projectToArchive === null) return;

		const projectToArchiveId = projectToArchive;

		// Optimistic update - remove project from list immediately
		const optimisticId = realtime.updateLocal((current) => 
			current.filter(p => p.id !== projectToArchiveId)
		);

		confirmModalOpen = false;
		projectToArchive = null;

		try {
			const response = await fetch(`/api/projects/${projectToArchiveId}`, {
				method: 'PATCH',
				headers: { 
					'Content-Type': 'application/json',
					'If-Match': realtime.version
				},
				body: JSON.stringify({ action: 'archive' })
			});

			if (response.status === 412) {
				// Version conflict - rollback and show error
				realtime.rollback(optimisticId);
				const error = await response.json();
				toastStore.add(error.error || 'Project is gewijzigd door een andere gebruiker', 'error');
				await realtime.refresh();
				return;
			}

			if (!response.ok) {
				realtime.rollback(optimisticId);
				const error = await response.json();
				toastStore.add(error.error || 'Fout bij archiveren van project', 'error');
				return;
			}

			// Success - confirm the update with new version
			const json = await response.json();
			realtime.confirmUpdate(optimisticId, json._version || realtime.version);
			toastStore.add('Project gearchiveerd', 'success');
		} catch (error: any) {
			realtime.rollback(optimisticId);
			console.error('Error archiving project:', error);
			toastStore.add(error.message || 'Fout bij archiveren van project', 'error');
		}
	}

	function cancelArchive() {
		confirmModalOpen = false;
		projectToArchive = null;
	}

	async function openCreateDrawer() {
		await goto('?drawer=project', { noScroll: true });
	}

	async function openEditDrawer(projectId: number) {
		await goto(`?drawer=project&projectId=${projectId}`, { noScroll: true });
	}

	async function openArchivedProjectsDrawer() {
		await goto('?drawer=archived-projects', { noScroll: true });
	}

	async function handleProjectCreated(project: Project) {
		// Redirect to the project detail page after creation
		await goto(`/projects/${project.id}`);
	}

	async function handleProjectUpdated() {
		// Refresh the realtime data
		await realtime.refresh();
	}

	async function handleProjectRestored() {
		// Refresh the realtime data
		await realtime.refresh();
	}
</script>

<svelte:head>
	<title>Projecten - Business Process Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<div class="mb-8 flex justify-end items-start gap-3">

		{#if !loading}
			<Button variant="secondary" onclick={openArchivedProjectsDrawer} class="flex items-center gap-2">
				<ArchiveRestore class="w-4 h-4" />
				Archief
			</Button>
			<Button onclick={openCreateDrawer}>Nieuw project maken</Button>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<p class="text-zinc-500">Laden...</p>
		</div>
	{:else}
		<!-- Project List -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each projects as project (project.id)}
			{@const canManage = $isSysadminStore || project.isOwner}
				<div
					class="bg-white rounded-lg shadow-xs border border-zinc-200 hover:shadow-sm transition-shadow flex flex-col cursor-pointer"
					onclick={() => handleViewProject(project.id)}
				>
					<div class="p-4 flex-1">
						<div class="flex justify-between items-start mb-2">
							<h3 class="text-lg font-semibold text-zinc-900">{project.name}</h3>
							<div class="text-xs text-zinc-500">
								{project.status === 'active' ? 'Actief' : 'Gearchiveerd'}
							</div>
						</div>
						{#if project.description}
							<p class="text-zinc-600 text-sm mb-2 line-clamp-2">{project.description}</p>
						{/if}
					</div>
					<div class="border-t border-zinc-200 px-4 py-2 bg-zinc-50 rounded-b-lg">
						<div class="flex gap-2 justify-end items-center">
							<Tooltip text="Bekijken">
								<IconButton
									icon={FolderOpen}
									onclick={(e) => {
										e.stopPropagation();
										handleViewProject(project.id);
									}}
								/>
							</Tooltip>
							{#if canManage}
								<Tooltip text="Bewerken">
									<IconButton
										icon={Pencil}
										onclick={(e) => {
											e.stopPropagation();
											openEditDrawer(project.id);
										}}
									/>
								</Tooltip>
								<Tooltip text="Archiveren">
									<IconButton
										icon={Archive}
										onclick={(e) => handleArchive(project.id, e)}
									/>
								</Tooltip>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if projects.length === 0}
			<div class="text-center py-12">
				<p class="text-zinc-500">Nog geen projecten. Maak je eerste project aan.</p>
			</div>
		{/if}
	{/if}
</div>

<!-- Confirmation Modal -->
<Modal bind:open={confirmModalOpen} title="Project Archiveren" size="md" closeOnBackdropClick={false} loading={archiving}>
	<div class="space-y-4">
		<p class="text-zinc-600">
			Weet u zeker dat u dit project wilt archiveren?
		</p>
		<p class="text-sm text-zinc-500">
			Gearchiveerde projecten worden verborgen maar blijven beschikbaar voor bestaande work items.
		</p>
		<div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
			<Button variant="secondary" onclick={cancelArchive} disabled={archiving}>Annuleren</Button>
			<button
				onclick={confirmArchive}
				disabled={archiving}
				class="px-4 py-2 bg-zinc-900 text-white rounded-sm shadow-xs hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{archiving ? 'Archiveren...' : 'Archiveren'}
			</button>
		</div>
	</div>
</Modal>

<!-- Project Drawer -->
<ProjectDrawer 
	oncreated={handleProjectCreated}
	onupdated={handleProjectUpdated}
/>

<!-- Archived Projects Drawer -->
<ArchivedProjectsDrawer 
	onrestored={handleProjectRestored}
/>
