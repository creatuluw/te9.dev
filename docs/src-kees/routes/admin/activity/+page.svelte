<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { Filter, Download } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import ActivityLogTable from '$lib/components/ActivityLogTable.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	
	interface ActivityLog {
		id: number;
		user_id: string;
		activity_type: string;
		resource_type?: string | null;
		resource_id?: string | null;
		action?: string | null;
		ip_address?: string | null;
		user_agent?: string | null;
		metadata?: Record<string, any> | null;
		created_at: string;
	}
	
	let logs = $state<ActivityLog[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// Filters
	let userIdFilter = $state('');
	let activityTypeFilter = $state('');
	let resourceTypeFilter = $state('');
	let startDateFilter = $state('');
	let endDateFilter = $state('');
	
	// Check if user is admin
	const authData = $derived($authStore);
	const isAdmin = $derived.by(() => {
		if (!authData?.roles) return false;
		return authData.roles.some(role => role.name.toLowerCase() === 'admin');
	});
	
	onMount(async () => {
		// Redirect if not admin
		if (!isAdmin) {
			goto('/');
			return;
		}
		
		await loadLogs();
	});
	
	async function loadLogs() {
		loading = true;
		navigationStore.startPageLoading();
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			// Build query parameters
			const params = new URLSearchParams();
			params.set('limit', '100');
			if (userIdFilter) params.set('user_id', userIdFilter);
			if (activityTypeFilter) params.set('activity_type', activityTypeFilter);
			if (resourceTypeFilter) params.set('resource_type', resourceTypeFilter);
			if (startDateFilter) params.set('start_date', startDateFilter);
			if (endDateFilter) params.set('end_date', endDateFilter);
			
			const response = await fetch(`/api/admin/activity?${params.toString()}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			const result = await response.json();
			
			if (result.success) {
				logs = result.data;
			} else {
				error = result.error || 'Er ging iets mis bij het laden van activiteiten';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het laden van activiteiten';
			console.error('Load logs error:', err);
		}
		
		loading = false;
		navigationStore.stopPageLoading();
	}
	
	function handleApplyFilters() {
		loadLogs();
	}
	
	function handleClearFilters() {
		userIdFilter = '';
		activityTypeFilter = '';
		resourceTypeFilter = '';
		startDateFilter = '';
		endDateFilter = '';
		loadLogs();
	}
	
	async function handleExportCSV() {
		// Export functionality (TODO: implement CSV export)
		console.log('Export CSV - to be implemented');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2">
				Activiteiten Log
			</h1>
			<p class="text-zinc-600">Bekijk alle systeemactiviteiten en gebruikersacties</p>
		</div>
		<Button variant="ghost" onclick={handleExportCSV}>
			<Download class="w-4 h-4" />
			Exporteer CSV
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
		<div class="flex items-center gap-2 mb-4">
			<Filter class="w-5 h-5 text-zinc-500" />
			<h3 class="text-sm font-medium text-zinc-900">Filters</h3>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<!-- User ID Filter -->
			<div>
				<label for="user-id-filter" class="block text-sm font-medium text-zinc-700 mb-1">
					Gebruiker ID
				</label>
				<input
					id="user-id-filter"
					type="text"
					bind:value={userIdFilter}
					placeholder="UUID..."
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				/>
			</div>
			
			<!-- Activity Type Filter -->
			<div>
				<label for="activity-type-filter" class="block text-sm font-medium text-zinc-700 mb-1">
					Activiteit Type
				</label>
				<select
					id="activity-type-filter"
					bind:value={activityTypeFilter}
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				>
					<option value="">Alle types</option>
					<option value="login">Inloggen</option>
					<option value="logout">Uitloggen</option>
					<option value="create_user">Gebruiker aangemaakt</option>
					<option value="update_user">Gebruiker bijgewerkt</option>
					<option value="delete_user">Gebruiker verwijderd</option>
					<option value="assign_role">Rol toegewezen</option>
					<option value="remove_role">Rol verwijderd</option>
					<option value="data_access">Data toegang</option>
				</select>
			</div>
			
			<!-- Resource Type Filter -->
			<div>
				<label for="resource-type-filter" class="block text-sm font-medium text-zinc-700 mb-1">
					Resource Type
				</label>
				<input
					id="resource-type-filter"
					type="text"
					bind:value={resourceTypeFilter}
					placeholder="user, case, etc..."
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				/>
			</div>
			
			<!-- Start Date Filter -->
			<div>
				<label for="start-date-filter" class="block text-sm font-medium text-zinc-700 mb-1">
					Van datum
				</label>
				<input
					id="start-date-filter"
					type="date"
					bind:value={startDateFilter}
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				/>
			</div>
			
			<!-- End Date Filter -->
			<div>
				<label for="end-date-filter" class="block text-sm font-medium text-zinc-700 mb-1">
					Tot datum
				</label>
				<input
					id="end-date-filter"
					type="date"
					bind:value={endDateFilter}
					class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
				/>
			</div>
		</div>
		
		<!-- Filter Actions -->
		<div class="flex gap-2 mt-4">
			<Button onclick={handleApplyFilters} size="sm">
				Filters toepassen
			</Button>
			<Button variant="ghost" onclick={handleClearFilters} size="sm">
				Reset filters
			</Button>
		</div>
		
		<div class="mt-3 text-sm text-zinc-500">
			{logs.length} activiteiten gevonden
		</div>
	</div>
	
	<!-- Activity Log Table -->
	<ActivityLogTable {logs} {loading} />
</div>

