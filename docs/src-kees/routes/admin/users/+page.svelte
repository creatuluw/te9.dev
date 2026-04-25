<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import type { UserWithRoles } from '$lib/services/userManagementService';
	import { Plus, Search, Grid, List, Filter } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import UserCard from '$lib/components/UserCard.svelte';
	import UserDrawer from '$lib/components/UserDrawer.svelte';
	import { toastStore } from '$lib/stores/toastStore';
	import Spinner from '$lib/components/Spinner.svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	
	let users = $state<UserWithRoles[]>([]);
	let filteredUsers = $state<UserWithRoles[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// View state
	let viewMode = $state<'table' | 'grid'>('table');
	let searchQuery = $state('');
	let filterActive = $state<'all' | 'active' | 'inactive'>('all');
	
	// Drawer state
	let showUserDrawer = $state(false);
	let drawerLoading = $state(false);
	let drawerError = $state<string | null>(null);
	
	// Check if user is admin
	const authData = $derived($authStore);
	const isAdmin = $derived.by(() => {
		if (!authData?.roles) return false;
		return authData.roles.some(role => role.name.toLowerCase() === 'admin');
	});
	
	// Apply filters
	$effect(() => {
		let filtered = [...users];
		
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(u => {
				const email = u.email?.toLowerCase() || '';
				const name = (u as any).name?.toLowerCase() || '';
				const firstName = u.first_name?.toLowerCase() || '';
				const lastName = u.last_name?.toLowerCase() || '';
				const username = (u as any).username?.toLowerCase() || '';
				
				return email.includes(query) ||
					name.includes(query) ||
					firstName.includes(query) ||
					lastName.includes(query) ||
					username.includes(query);
			});
		}
		
		// Active filter
		if (filterActive === 'active') {
			filtered = filtered.filter(u => u.is_active);
		} else if (filterActive === 'inactive') {
			filtered = filtered.filter(u => !u.is_active);
		}
		
		filteredUsers = filtered;
	});
	
	// Data table columns
	const columns = [
		{
			key: 'name',
			label: 'Naam',
			sortable: true,
			render: (_: any, row: UserWithRoles) => {
				// Database has 'name' field, but type expects first_name/last_name
				if ((row as any).name) {
					return (row as any).name;
				}
				if (row.first_name || row.last_name) {
					return `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-';
				}
				return '-';
			}
		},
		{
			key: 'email',
			label: 'Email',
			sortable: true
		},
		{
			key: 'roles',
			label: 'Rollen',
			render: (_: any, row: UserWithRoles) => 
				row.roles.map(r => r.name).join(', ') || 'Geen rollen'
		},
		{
			key: 'is_active',
			label: 'Status',
			align: 'center' as const,
			render: (value: boolean) => value ? 'Actief' : 'Inactief'
		}
	];
	
	// Data table actions
	const actions = [
		{
			label: 'Bekijken',
			variant: 'ghost' as const,
			onclick: (row: UserWithRoles) => goto(`/admin/users/${row.id}`)
		}
	];
	
	onMount(async () => {
		// Redirect if not admin
		if (!isAdmin) {
			goto('/');
			return;
		}
		
		await loadUsers();
	});
	
	async function loadUsers() {
		loading = true;
		navigationStore.startPageLoading();
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch('/api/admin/users', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			const result = await response.json();
			
			if (result.success) {
				users = result.data;
				filteredUsers = result.data;
			} else {
				error = result.error || 'Er ging iets mis bij het laden van gebruikers';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het laden van gebruikers';
			console.error('Load users error:', err);
		}
		
		loading = false;
		navigationStore.stopPageLoading();
	}
	
	function openUserDrawer() {
		drawerError = null;
		showUserDrawer = true;
	}
	
	async function handleCreateUser(data: any) {
		drawerLoading = true;
		drawerError = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				drawerError = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadUsers();
				showUserDrawer = false;
				toastStore.add('Gebruiker succesvol aangemaakt', 'success');
			} else {
				drawerError = result.error || 'Er ging iets mis bij het aanmaken van de gebruiker';
			}
		} catch (err) {
			drawerError = 'Er ging iets mis bij het aanmaken van de gebruiker';
			console.error('Create user error:', err);
		}
		
		drawerLoading = false;
	}
	
	function handleUserCardClick(user: UserWithRoles) {
		goto(`/admin/users/${user.id}`);
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2">
				Gebruikers
			</h1>
			<p class="text-zinc-600">Beheer gebruikersaccounts en rechten</p>
		</div>
		<div class="flex items-center gap-2">
			<!-- View toggle -->
			<div class="flex items-center gap-1 border border-zinc-200 rounded-md p-1">
				<button
					onclick={() => viewMode = 'table'}
					class="p-2 rounded {viewMode === 'table' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}"
					title="Tabel weergave"
				>
					<List class="w-4 h-4" />
				</button>
				<button
					onclick={() => viewMode = 'grid'}
					class="p-2 rounded {viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}"
					title="Grid weergave"
				>
					<Grid class="w-4 h-4" />
				</button>
			</div>
			
			<Button onclick={openUserDrawer}>
				<Plus class="w-4 h-4" />
				Nieuwe gebruiker
			</Button>
		</div>
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
			<div class="flex-1 relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<Search class="w-5 h-5 text-zinc-400" />
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Zoek op naam of email..."
					class="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				/>
			</div>
			
			<!-- Status filter -->
			<div class="w-48">
				<select
					bind:value={filterActive}
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				>
					<option value="all">Alle statussen</option>
					<option value="active">Actief</option>
					<option value="inactive">Inactief</option>
				</select>
			</div>
		</div>
		
		<div class="mt-3 text-sm text-zinc-500">
			Toont {filteredUsers.length} van {users.length} gebruikers
		</div>
	</div>
	
	<!-- Loading state -->
	{#if loading}
		<div class="fixed inset-0 flex items-center justify-center">
			<Spinner size="xl" />
		</div>
	{:else}
		<!-- Table view -->
		{#if viewMode === 'table'}
			<DataTable
				{columns}
				data={filteredUsers}
				{actions}
				paginated
				itemsPerPage={20}
				emptyMessage="Geen gebruikers gevonden"
			/>
		{:else}
			<!-- Grid view -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredUsers as user}
					<UserCard {user} onclick={handleUserCardClick} />
				{/each}
			</div>
			
			{#if filteredUsers.length === 0}
				<div class="text-center py-12">
					<p class="text-zinc-500">Geen gebruikers gevonden</p>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<!-- User Drawer -->
<UserDrawer
	open={showUserDrawer}
	onclose={() => {
		showUserDrawer = false;
		drawerError = null;
	}}
	onsubmit={handleCreateUser}
	loading={drawerLoading}
	error={drawerError}
/>

