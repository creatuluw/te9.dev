<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { Users, Shield, Key, Activity } from 'lucide-svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	
	let userStats = $state<{ total: number; active: number; inactive: number } | null>(null);
	let roleCount = $state(0);
	let permissionCount = $state(0);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	onMount(async () => {
		await loadStatistics();
	});
	
	async function loadStatistics() {
		loading = true;
		navigationStore.startPageLoading();
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			// Load user statistics
			const userStatsResponse = await fetch('/api/admin/users/statistics', {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const userStatsResult = await userStatsResponse.json();
			if (userStatsResult.success) {
				userStats = userStatsResult.data;
			}
			
			// Load roles count
			const rolesResponse = await fetch('/api/auth/roles', {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const rolesResult = await rolesResponse.json();
			if (rolesResult.success) {
				roleCount = rolesResult.data.length;
			}
			
			// Load permissions count
			const permsResponse = await fetch('/api/auth/permissions', {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const permsResult = await permsResponse.json();
			if (permsResult.success) {
				permissionCount = permsResult.data.length;
			}
		} catch (err) {
			error = 'Er ging iets mis bij het laden van statistieken';
			console.error('Load statistics error:', err);
		}
		
		loading = false;
		navigationStore.stopPageLoading();
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2">
			Gebruikersbeheer
		</h1>
		<p class="text-zinc-600">Overzicht van gebruikers, rollen en permissies</p>
	</div>
	
	<!-- Error message -->
	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
			{error}
		</div>
	{/if}
	
	<!-- Loading state -->
	{#if loading}
		<div class="fixed inset-0 flex items-center justify-center">
			<Spinner size="xl" />
		</div>
	{:else}
		<!-- Statistics Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			<!-- Total Users -->
			<button
				onclick={() => goto('/admin/gebruikers')}
				class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
			>
				<div class="absolute top-6 right-6">
					<div class="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
						<Users class="w-5 h-5 text-blue-600" />
					</div>
				</div>
				<div class="mb-3">
					<div class="text-sm text-zinc-600 mb-1">Totaal gebruikers</div>
					<div class="text-2xl font-bold text-zinc-900">{userStats?.total || 0}</div>
				</div>
				{#if userStats}
					<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
						{userStats.active} actief · {userStats.inactive} inactief
					</p>
				{/if}
			</button>
			
			<!-- Active Users -->
			<button
				onclick={() => goto('/admin/gebruikers')}
				class="bg-white rounded-lg shadow-xs border border-green-200 p-6 hover:shadow-sm hover:border-green-300 transition-all text-left group relative"
			>
				<div class="absolute top-6 right-6">
					<div class="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
						<Users class="w-5 h-5 text-green-600" />
					</div>
				</div>
				<div class="mb-3">
					<div class="text-sm text-green-600 mb-1">Actieve gebruikers</div>
					<div class="text-2xl font-bold text-green-900">{userStats?.active || 0}</div>
				</div>
				<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
					{userStats ? Math.round((userStats.active / userStats.total) * 100) : 0}% van totaal
				</p>
			</button>
			
			<!-- Roles -->
			<button
				onclick={() => goto('/admin/rollen')}
				class="bg-white rounded-lg shadow-xs border border-purple-200 p-6 hover:shadow-sm hover:border-purple-300 transition-all text-left group relative"
			>
				<div class="absolute top-6 right-6">
					<div class="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
						<Shield class="w-5 h-5 text-purple-600" />
					</div>
				</div>
				<div class="mb-3">
					<div class="text-sm text-purple-600 mb-1">Rollen</div>
					<div class="text-2xl font-bold text-purple-900">{roleCount}</div>
				</div>
				<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
					Beheer gebruikersrollen
				</p>
			</button>
			
			<!-- Permissions -->
			<button
				onclick={() => goto('/admin/permissions')}
				class="bg-white rounded-lg shadow-xs border border-orange-200 p-6 hover:shadow-sm hover:border-orange-300 transition-all text-left group relative"
			>
				<div class="absolute top-6 right-6">
					<div class="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
						<Key class="w-5 h-5 text-orange-600" />
					</div>
				</div>
				<div class="mb-3">
					<div class="text-sm text-orange-600 mb-1">Permissies</div>
					<div class="text-2xl font-bold text-orange-900">{permissionCount}</div>
				</div>
				<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
					Beheer toegangsrechten
				</p>
			</button>
		</div>
		
		<!-- Quick Actions -->
		<div class="mb-8">
			<h2 class="text-xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-4">
				Ga naar &rarr;
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<button
					onclick={() => goto('/admin/users')}
					class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
				>
					<div class="absolute top-6 right-6">
						<div class="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
							<Users class="w-5 h-5 text-blue-600" />
						</div>
					</div>
					<div class="mb-3">
						<div class="text-sm text-zinc-900 mb-1 font-aspekta font-semibold">Gebruikers</div>
					</div>
					<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
						Beheer gebruikers
					</p>
				</button>
				
				<button
					onclick={() => goto('/admin/rollen')}
					class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
				>
					<div class="absolute top-6 right-6">
						<div class="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
							<Shield class="w-5 h-5 text-purple-600" />
						</div>
					</div>
					<div class="mb-3">
						<div class="text-sm text-zinc-900 mb-1 font-aspekta font-semibold">Rollen</div>
					</div>
					<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
						Beheer rollen
					</p>
				</button>
				
				<button
					onclick={() => goto('/admin/permissions')}
					class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
				>
					<div class="absolute top-6 right-6">
						<div class="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
							<Key class="w-5 h-5 text-orange-600" />
						</div>
					</div>
					<div class="mb-3">
						<div class="text-sm text-zinc-900 mb-1 font-aspekta font-semibold">Permissies</div>
					</div>
					<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
						Beheer permissies
					</p>
				</button>
				
				<button
					onclick={() => goto('/admin/activity')}
					class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
				>
					<div class="absolute top-6 right-6">
						<div class="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
							<Activity class="w-5 h-5 text-red-600" />
						</div>
					</div>
					<div class="mb-3">
						<div class="text-sm text-zinc-900 mb-1 font-aspekta font-semibold">Activiteiten</div>
					</div>
					<p class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
						Bekijk logs
					</p>
				</button>
			</div>
		</div>
	{/if}
</div>

