<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import type { Permission } from '$lib/schemas/auth';
	import { Plus, Pencil, Trash2, Key, Filter } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import Label from '$lib/components/Label.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	
	let permissions = $state<Permission[]>([]);
	let filteredPermissions = $state<Permission[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// Filter state
	let searchQuery = $state('');
	let selectedAction = $state<string>('all');
	
	// Modal state
	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedPermission = $state<Permission | null>(null);
	
	// Form state
	let formRoute = $state('');
	let formDescription = $state('');
	let formActions = $state<string[]>([]);
	let formLoading = $state(false);
	
	const availableActions = ['read', 'write', 'delete', 'execute'];
	
	// Check if user is admin
	const authData = $derived($authStore);
	const isAdmin = $derived.by(() => {
		if (!authData?.roles) return false;
		return authData.roles.some(role => role.name.toLowerCase() === 'admin');
	});
	
	// Apply filters
	$effect(() => {
		let filtered = [...permissions];
		
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(p => 
				p.route.toLowerCase().includes(query) || 
				(p.description && p.description.toLowerCase().includes(query))
			);
		}
		
		// Action filter
		if (selectedAction !== 'all') {
			filtered = filtered.filter(p => normalizeActions(p.actions).includes(selectedAction as any));
		}
		
		filteredPermissions = filtered;
	});
	
	onMount(async () => {
		// Redirect if not admin
		if (!isAdmin) {
			goto('/');
			return;
		}
		
		await loadPermissions();
	});
	
	async function loadPermissions() {
		loading = true;
		navigationStore.startPageLoading();
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
		const response = await fetch('/api/auth/permissions', {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		const result = await response.json();
		
		if (result.success) {
			// Normalize actions field (PostgREST sometimes returns JSON fields as strings)
			permissions = result.data.map((perm: Permission) => ({
				...perm,
				actions: normalizeActions(perm.actions)
			}));
			filteredPermissions = permissions;
		} else {
			error = result.error || 'Er ging iets mis bij het laden van permissies';
		}
		} catch (err) {
			error = 'Er ging iets mis bij het laden van permissies';
			console.error('Load permissions error:', err);
		}
		
		loading = false;
		navigationStore.stopPageLoading();
	}
	
	function openCreateModal() {
		formRoute = '';
		formDescription = '';
		formActions = [];
		showCreateModal = true;
	}
	
	function openEditModal(permission: Permission) {
		selectedPermission = permission;
		formRoute = permission.route;
		formDescription = permission.description || '';
		formActions = [...normalizeActions(permission.actions)];
		showEditModal = true;
	}
	
	function openDeleteModal(permission: Permission) {
		selectedPermission = permission;
		showDeleteModal = true;
	}
	
	function toggleAction(action: string) {
		if (formActions.includes(action)) {
			formActions = formActions.filter(a => a !== action);
		} else {
			formActions = [...formActions, action];
		}
	}
	
	async function createPermission() {
		if (!formRoute.trim()) {
			error = 'Route is verplicht';
			return;
		}
		
		if (formActions.length === 0) {
			error = 'Selecteer minimaal één actie';
			return;
		}
		
		formLoading = true;
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const payload: Record<string, any> = {
				route: formRoute.trim(),
				actions: formActions
			};
			
			// Only include description if it's not empty
			const trimmedDescription = formDescription.trim();
			if (trimmedDescription) {
				payload.description = trimmedDescription;
			}
			
			const response = await fetch('/api/auth/permissions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadPermissions();
				showCreateModal = false;
			} else {
				error = result.error || 'Er ging iets mis bij het aanmaken van de permissie';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het aanmaken van de permissie';
			console.error('Create permission error:', err);
		}
		
		formLoading = false;
	}
	
	async function updatePermission() {
		if (!selectedPermission) return;
		if (!formRoute.trim()) {
			error = 'Route is verplicht';
			return;
		}
		
		if (formActions.length === 0) {
			error = 'Selecteer minimaal één actie';
			return;
		}
		
		formLoading = true;
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const payload: Record<string, any> = {
				route: formRoute.trim(),
				actions: formActions
			};
			
			// Only include description if it's not empty
			const trimmedDescription = formDescription.trim();
			if (trimmedDescription) {
				payload.description = trimmedDescription;
			}
			
			const response = await fetch(`/api/auth/permissions/${selectedPermission.id}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadPermissions();
				showEditModal = false;
				selectedPermission = null;
			} else {
				error = result.error || 'Er ging iets mis bij het bijwerken van de permissie';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het bijwerken van de permissie';
			console.error('Update permission error:', err);
		}
		
		formLoading = false;
	}
	
	async function deletePermission() {
		if (!selectedPermission) return;
		
		formLoading = true;
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch(`/api/auth/permissions/${selectedPermission.id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadPermissions();
				showDeleteModal = false;
				selectedPermission = null;
			} else {
				error = result.error || 'Er ging iets mis bij het verwijderen van de permissie';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het verwijderen van de permissie';
			console.error('Delete permission error:', err);
		}
		
		formLoading = false;
	}
	
	function normalizeActions(actions: any): string[] {
		// If already an array, return it
		if (Array.isArray(actions)) {
			return actions;
		}
		
		// If it's a string, try to parse it as JSON
		if (typeof actions === 'string') {
			try {
				const parsed = JSON.parse(actions);
				if (Array.isArray(parsed)) {
					return parsed;
				}
			} catch (e) {
				console.error('Failed to parse actions:', e);
			}
		}
		
		// Default to empty array
		return [];
	}
	
	function getActionBadgeColor(action: string): string {
		switch (action) {
			case 'read': return 'bg-blue-100 text-blue-800';
			case 'write': return 'bg-green-100 text-green-800';
			case 'delete': return 'bg-red-100 text-red-800';
			case 'execute': return 'bg-purple-100 text-purple-800';
			default: return 'bg-zinc-100 text-zinc-800';
		}
	}
	
	function getRouteCategory(route: string): string {
		if (route.startsWith('/admin')) return 'Admin';
		if (route.startsWith('/api')) return 'API';
		if (route.startsWith('/cases')) return 'Cases';
		if (route.startsWith('/processes')) return 'Processes';
		return 'General';
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2">
				Permissies
			</h1>
			<p class="text-zinc-600">Beheer toegangsrechten voor routes en acties</p>
		</div>
		<Button onclick={openCreateModal}>
			<Plus class="w-4 h-4" />
			Nieuwe permissie
		</Button>
	</div>
	
	<!-- Error message -->
	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
			{error}
		</div>
	{/if}
	
	<!-- Filters -->
	<div class="bg-white rounded-lg border border-zinc-200 shadow-xs p-4 mb-6">
		<div class="flex items-center gap-4">
			<Filter class="w-5 h-5 text-zinc-500" />
			
			<!-- Search -->
			<div class="flex-1">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Zoek op route of beschrijving..."
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				/>
			</div>
			
			<!-- Action filter -->
			<div class="w-48">
				<select
					bind:value={selectedAction}
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				>
					<option value="all">Alle acties</option>
					<option value="read">Read</option>
					<option value="write">Write</option>
					<option value="delete">Delete</option>
					<option value="execute">Execute</option>
				</select>
			</div>
		</div>
		
		<div class="mt-3 text-sm text-zinc-500">
			Toont {filteredPermissions.length} van {permissions.length} permissies
		</div>
	</div>
	
	<!-- Loading state -->
	{#if loading}
		<div class="fixed inset-0 flex items-center justify-center">
			<Spinner size="xl" />
		</div>
	{:else}
		<!-- Permissions grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each filteredPermissions as permission}
				<div class="bg-white rounded-lg shadow-xs border border-zinc-200 p-4 hover:shadow-sm hover:border-zinc-300 transition-all group relative">
					<!-- Header: Route name, icon, and actions in one row -->
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center gap-2 flex-1 min-w-0">
							<div class="p-1.5 bg-zinc-100 rounded-md group-hover:bg-zinc-200 transition-colors flex-shrink-0">
								<Key class="w-4 h-4 text-zinc-600" />
							</div>
							<div class="flex flex-col gap-0.5 flex-1 min-w-0">
								<div class="text-xs text-zinc-500">{getRouteCategory(permission.route)}</div>
								<h3 class="text-base font-aspekta font-semibold text-zinc-900 truncate">
									{permission.route}
								</h3>
							</div>
						</div>
						<!-- Action buttons - compact -->
						<div class="flex items-center gap-1 flex-shrink-0 ml-2">
							<IconButton
								icon={Pencil}
								variant="ghost"
								size="sm"
								onclick={() => openEditModal(permission)}
								tooltip="Bewerken"
								tooltipPosition="top"
							/>
							<IconButton
								icon={Trash2}
								variant="danger"
								size="sm"
								onclick={() => openDeleteModal(permission)}
								tooltip="Verwijderen"
								tooltipPosition="top"
							/>
						</div>
					</div>
					
					<!-- Actions count and description in one row -->
					<div class="flex items-start gap-4 mb-3">
						<!-- Actions count - compact -->
						<div class="flex items-baseline gap-1.5 flex-shrink-0">
							<span class="text-lg font-bold text-zinc-900">{normalizeActions(permission.actions).length}</span>
							<span class="text-xs text-zinc-500">acties</span>
						</div>
						
						<!-- Description - compact, truncated -->
						{#if permission.description}
							<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors flex-1 min-w-0 overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; max-height: 2.8em;">
								{permission.description}
							</p>
						{:else}
							<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors flex-1 min-w-0 overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; max-height: 2.8em;">
								Toegangsrechten voor deze route
							</p>
						{/if}
					</div>
					
					<!-- Actions badges - compact -->
					<div class="pt-2 border-t border-zinc-100">
						<div class="flex flex-wrap gap-1">
							{#each normalizeActions(permission.actions) as action}
								<span class="text-xs font-medium px-2 py-0.5 rounded {getActionBadgeColor(action)}">
									{action}
								</span>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		{#if filteredPermissions.length === 0}
			<div class="text-center py-12">
				<Key class="w-12 h-12 text-zinc-300 mx-auto mb-4" />
				<p class="text-zinc-500">Geen permissies gevonden</p>
			</div>
		{/if}
	{/if}
</div>

<!-- Create Permission Modal -->
<Modal open={showCreateModal} onclose={() => (showCreateModal = false)} title="Nieuwe permissie aanmaken">
	<div class="space-y-4">
		<div>
			<label for="create-route" class="block text-sm font-medium text-zinc-700 mb-2">
				Route *
			</label>
			<input
				id="create-route"
				type="text"
				bind:value={formRoute}
				class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="Bijvoorbeeld: /admin/users"
			/>
		</div>
		
		<div>
			<label for="create-description" class="block text-sm font-medium text-zinc-700 mb-2">
				Beschrijving
			</label>
			<textarea
				id="create-description"
				bind:value={formDescription}
				rows="3"
				class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="Beschrijving van de permissie..."
			></textarea>
		</div>
		
		<div>
			<label class="block text-sm font-medium text-zinc-700 mb-2">
				Acties *
			</label>
			<div class="space-y-2">
				{#each availableActions as action}
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={formActions.includes(action)}
							onchange={() => toggleAction(action)}
							class="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
						/>
						<span class="text-sm text-zinc-700 capitalize">{action}</span>
					</label>
				{/each}
			</div>
		</div>
		
		<div class="flex gap-2 justify-end pt-4">
			<Button
				variant="ghost"
				onclick={() => (showCreateModal = false)}
				disabled={formLoading}
			>
				Annuleren
			</Button>
			<Button
				onclick={createPermission}
				disabled={formLoading}
			>
				{formLoading ? 'Aanmaken...' : 'Aanmaken'}
			</Button>
		</div>
	</div>
</Modal>

<!-- Edit Permission Modal -->
<Modal open={showEditModal} onclose={() => (showEditModal = false)} title="Permissie bewerken">
	<div class="space-y-4">
		<div>
			<label for="edit-route" class="block text-sm font-medium text-zinc-700 mb-2">
				Route *
			</label>
			<input
				id="edit-route"
				type="text"
				bind:value={formRoute}
				class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		
		<div>
			<label for="edit-description" class="block text-sm font-medium text-zinc-700 mb-2">
				Beschrijving
			</label>
			<textarea
				id="edit-description"
				bind:value={formDescription}
				rows="3"
				class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>
		
		<div>
			<label class="block text-sm font-medium text-zinc-700 mb-2">
				Acties *
			</label>
			<div class="space-y-2">
				{#each availableActions as action}
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={formActions.includes(action)}
							onchange={() => toggleAction(action)}
							class="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
						/>
						<span class="text-sm text-zinc-700 capitalize">{action}</span>
					</label>
				{/each}
			</div>
		</div>
		
		<div class="flex gap-2 justify-end pt-4">
			<Button
				variant="ghost"
				onclick={() => (showEditModal = false)}
				disabled={formLoading}
			>
				Annuleren
			</Button>
			<Button
				onclick={updatePermission}
				disabled={formLoading}
			>
				{formLoading ? 'Opslaan...' : 'Opslaan'}
			</Button>
		</div>
	</div>
</Modal>

<!-- Delete Permission Modal -->
<Modal open={showDeleteModal} onclose={() => (showDeleteModal = false)} title="Permissie verwijderen">
	<div class="space-y-4">
		<p class="text-zinc-700">
			Weet je zeker dat je de permissie voor <strong>{selectedPermission?.route}</strong> wilt verwijderen?
			Dit kan niet ongedaan worden gemaakt.
		</p>
		
		<div class="flex gap-2 justify-end pt-4">
			<Button
				variant="ghost"
				onclick={() => (showDeleteModal = false)}
				disabled={formLoading}
			>
				Annuleren
			</Button>
			<Button
				variant="secondary"
				onclick={deletePermission}
				disabled={formLoading}
			>
				{formLoading ? 'Verwijderen...' : 'Verwijderen'}
			</Button>
		</div>
	</div>
</Modal>

