<script lang="ts">
	import { Activity, User, Calendar, MapPin, Monitor } from 'lucide-svelte';
	import DataTable from './DataTable.svelte';
	
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
	
	interface Props {
		/** Activity logs */
		logs: ActivityLog[];
		
		/** Loading state */
		loading?: boolean;
		
		/** Additional CSS classes */
		class?: string;
	}
	
	let {
		logs,
		loading = false,
		class: className = ''
	}: Props = $props();
	
	// Format date
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	// Get activity type label
	function getActivityTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			'login': 'Inloggen',
			'logout': 'Uitloggen',
			'create_user': 'Gebruiker aangemaakt',
			'update_user': 'Gebruiker bijgewerkt',
			'delete_user': 'Gebruiker verwijderd',
			'assign_role': 'Rol toegewezen',
			'remove_role': 'Rol verwijderd',
			'create_role': 'Rol aangemaakt',
			'update_role': 'Rol bijgewerkt',
			'delete_role': 'Rol verwijderd',
			'permission_created': 'Permissie aangemaakt',
			'permission_updated': 'Permissie bijgewerkt',
			'permission_deleted': 'Permissie verwijderd',
			'role_permissions_updated': 'Rol permissies bijgewerkt',
			'data_access': 'Data toegang'
		};
		return labels[type] || type;
	}
	
	// Get activity badge color
	function getActivityBadgeColor(type: string): string {
		if (type.includes('create')) return 'bg-green-100 text-green-800';
		if (type.includes('update')) return 'bg-blue-100 text-blue-800';
		if (type.includes('delete') || type.includes('remove')) return 'bg-red-100 text-red-800';
		if (type.includes('login')) return 'bg-purple-100 text-purple-800';
		if (type.includes('assign')) return 'bg-orange-100 text-orange-800';
		return 'bg-zinc-100 text-zinc-800';
	}
	
	// Define table columns
	const columns = [
		{
			key: 'created_at',
			label: 'Datum/Tijd',
			sortable: true,
			render: (value: string) => formatDate(value),
			width: '180px'
		},
		{
			key: 'activity_type',
			label: 'Activiteit',
			sortable: true,
			render: (value: string) => getActivityTypeLabel(value)
		},
		{
			key: 'user_id',
			label: 'Gebruiker',
			width: '120px'
		},
		{
			key: 'resource_type',
			label: 'Resource',
			render: (value: string | null) => value || '-'
		},
		{
			key: 'action',
			label: 'Actie',
			render: (value: string | null) => value || '-'
		}
	];
</script>

<div class="activity-log-table {className}">
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-zinc-500">Laden...</div>
		</div>
	{:else if logs.length === 0}
		<div class="text-center py-12">
			<Activity class="w-12 h-12 text-zinc-300 mx-auto mb-4" />
			<p class="text-zinc-500">Geen activiteiten gevonden</p>
		</div>
	{:else}
		<!-- Desktop view - Table -->
		<div class="hidden md:block">
			<DataTable
				{columns}
				data={logs}
				paginated
				itemsPerPage={20}
				emptyMessage="Geen activiteiten gevonden"
			/>
		</div>
		
		<!-- Mobile view - Cards -->
		<div class="md:hidden space-y-3">
			{#each logs as log}
				<div class="bg-white rounded-lg border border-zinc-200 p-4">
					<!-- Activity type badge -->
					<div class="flex items-center justify-between mb-3">
						<span class="text-xs font-medium px-2 py-1 rounded {getActivityBadgeColor(log.activity_type)}">
							{getActivityTypeLabel(log.activity_type)}
						</span>
						<span class="text-xs text-zinc-500">{formatDate(log.created_at)}</span>
					</div>
					
					<!-- Details -->
					<div class="space-y-2 text-sm">
						{#if log.user_id}
							<div class="flex items-center gap-2 text-zinc-600">
								<User class="w-4 h-4" />
								<span>{log.user_id}</span>
							</div>
						{/if}
						
						{#if log.resource_type}
							<div class="flex items-center gap-2 text-zinc-600">
								<Activity class="w-4 h-4" />
								<span>{log.resource_type} {log.resource_id ? `(${log.resource_id})` : ''}</span>
							</div>
						{/if}
						
						{#if log.ip_address}
							<div class="flex items-center gap-2 text-zinc-600">
								<MapPin class="w-4 h-4" />
								<span>{log.ip_address}</span>
							</div>
						{/if}
						
						{#if log.user_agent}
							<div class="flex items-center gap-2 text-zinc-600">
								<Monitor class="w-4 h-4" />
								<span class="truncate text-xs">{log.user_agent}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

