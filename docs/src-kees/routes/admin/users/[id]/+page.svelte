<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/authStore';
	import type { UserWithRoles } from '$lib/services/userManagementService';
	import type { Role } from '$lib/schemas/auth';
	import { ArrowLeft, Edit2, Trash2, Mail, Calendar, CheckCircle, XCircle, Shield } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import UserDrawer from '$lib/components/UserDrawer.svelte';
	import UserRoleManager from '$lib/components/UserRoleManager.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { toastStore } from '$lib/stores/toastStore';
	import Spinner from '$lib/components/Spinner.svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	
	let user = $state<UserWithRoles | null>(null);
	let allRoles = $state<Role[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// Drawer state
	let showEditDrawer = $state(false);
	let drawerLoading = $state(false);
	let drawerError = $state<string | null>(null);
	
	// Delete modal state
	let showDeleteModal = $state(false);
	let deleteLoading = $state(false);
	
	// Role management loading
	let roleLoading = $state(false);
	
	// Sysadmin toggle loading
	let sysadminLoading = $state(false);
	
	const userId = $derived($page.url.pathname.split('/').pop());
	
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
		
		await Promise.all([loadUser(), loadRoles()]);
	});
	
	async function loadUser() {
		loading = true;
		navigationStore.startPageLoading();
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch(`/api/admin/users/${userId}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			const result = await response.json();
			
			if (result.success) {
				user = result.data;
			} else {
				error = result.error || 'Er ging iets mis bij het laden van de gebruiker';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het laden van de gebruiker';
			console.error('Load user error:', err);
		}
		
		loading = false;
		navigationStore.stopPageLoading();
	}
	
	async function loadRoles() {
		try {
			const token = $authStore?.token;
			if (!token) return;
			
			const response = await fetch('/api/auth/roles', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			const result = await response.json();
			
			if (result.success) {
				allRoles = result.data;
			}
		} catch (err) {
			console.error('Load roles error:', err);
		}
	}
	
	function openEditDrawer() {
		drawerError = null;
		showEditDrawer = true;
	}
	
	async function handleUpdateUser(data: any) {
		drawerLoading = true;
		drawerError = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				drawerError = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadUser();
				showEditDrawer = false;
				toastStore.add('Gebruiker succesvol bijgewerkt', 'success');
			} else {
				drawerError = result.error || 'Er ging iets mis bij het bijwerken van de gebruiker';
			}
		} catch (err) {
			drawerError = 'Er ging iets mis bij het bijwerken van de gebruiker';
			console.error('Update user error:', err);
		}
		
		drawerLoading = false;
	}
	
	async function handleDeleteUser() {
		deleteLoading = true;
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			const result = await response.json();
			
			if (result.success) {
				toastStore.add('Gebruiker succesvol verwijderd', 'success');
				goto('/admin/users');
			} else {
				error = result.error || 'Er ging iets mis bij het verwijderen van de gebruiker';
				showDeleteModal = false;
			}
		} catch (err) {
			error = 'Er ging iets mis bij het verwijderen van de gebruiker';
			console.error('Delete user error:', err);
			showDeleteModal = false;
		}
		
		deleteLoading = false;
	}
	
	async function handleAssignRole(roleId: number) {
		roleLoading = true;
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch(`/api/admin/users/${userId}/roles`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role_id: roleId })
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadUser();
				toastStore.add('Rol succesvol toegewezen', 'success');
			} else {
				error = result.error || 'Er ging iets mis bij het toewijzen van de rol';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het toewijzen van de rol';
			console.error('Assign role error:', err);
		}
		
		roleLoading = false;
	}
	
	async function handleRemoveRole(roleId: number) {
		roleLoading = true;
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch(`/api/admin/users/${userId}/roles?role_id=${roleId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadUser();
				toastStore.add('Rol succesvol verwijderd', 'success');
			} else {
				error = result.error || 'Er ging iets mis bij het verwijderen van de rol';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het verwijderen van de rol';
			console.error('Remove role error:', err);
		}
		
		roleLoading = false;
	}
	
	async function handleToggleSysadmin(checked: boolean) {
		sysadminLoading = true;
		error = null;
		
		try {
			const token = $authStore?.token;
			if (!token) {
				error = 'Niet geautoriseerd';
				return;
			}
			
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ is_sysadmin: checked })
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadUser();
				toastStore.add(
					checked ? 'Systeembeheerder rechten toegekend' : 'Systeembeheerder rechten ingetrokken',
					'success'
				);
			} else {
				error = result.error || 'Er ging iets mis bij het bijwerken van de systeembeheerder status';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het bijwerken van de systeembeheerder status';
			console.error('Toggle sysadmin error:', err);
		}
		
		sysadminLoading = false;
	}
	
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	// Get display name (handles both 'name' and 'first_name'/'last_name')
	function getDisplayName(user: UserWithRoles | null): string {
		if (!user) return 'Laden...';
		if ((user as any).name) {
			return (user as any).name;
		}
		if (user.first_name || user.last_name) {
			return `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-';
		}
		return (user as any).username || user.email || '-';
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<!-- Header -->
	<div class="mb-6">
		<button
			onclick={() => goto('/admin/users')}
			class="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Terug naar gebruikers
		</button>
		
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2">
					{getDisplayName(user)}
				</h1>
				<p class="text-zinc-600">{user?.email || ''}</p>
			</div>
			{#if user}
				<div class="flex items-center gap-2">
					<Button variant="ghost" onclick={openEditDrawer}>
						<Edit2 class="w-4 h-4" />
						Bewerken
					</Button>
					<Button variant="secondary" onclick={() => showDeleteModal = true}>
						<Trash2 class="w-4 h-4" />
						Verwijderen
					</Button>
				</div>
			{/if}
		</div>
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
	{:else if user}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- User Info -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Basic Info Card -->
				<div class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6">
					<h2 class="text-xl font-aspekta font-semibold text-zinc-900 mb-4">
						Gebruikersinformatie
					</h2>
					
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<Mail class="w-5 h-5 text-zinc-500" />
							<div>
								<div class="text-sm text-zinc-500">Email</div>
								<div class="text-zinc-900">{user.email}</div>
							</div>
						</div>
						
						<div class="flex items-center gap-3">
							{#if user.is_active}
								<CheckCircle class="w-5 h-5 text-green-500" />
							{:else}
								<XCircle class="w-5 h-5 text-red-500" />
							{/if}
							<div>
								<div class="text-sm text-zinc-500">Status</div>
								<div class="text-zinc-900">
									{user.is_active ? 'Actief' : 'Inactief'}
								</div>
							</div>
						</div>
						
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-3">
								<Shield class="w-5 h-5 text-zinc-500" />
								<div>
									<div class="text-sm text-zinc-500">Systeembeheerder</div>
									<div class="text-zinc-900">
										{(user as any).is_sysadmin ? 'Ja' : 'Nee'}
									</div>
								</div>
							</div>
							<Toggle
								checked={(user as any).is_sysadmin ?? false}
								disabled={sysadminLoading}
								ariaLabel="Systeembeheerder status"
								onchange={(e) => handleToggleSysadmin(e.currentTarget.checked)}
							/>
						</div>
						
						<div class="flex items-center gap-3">
							<Calendar class="w-5 h-5 text-zinc-500" />
							<div>
								<div class="text-sm text-zinc-500">Aangemaakt</div>
								<div class="text-zinc-900">{formatDate(user.created_at)}</div>
							</div>
						</div>
						
						{#if user.updated_at !== user.created_at}
							<div class="flex items-center gap-3">
								<Calendar class="w-5 h-5 text-zinc-500" />
								<div>
									<div class="text-sm text-zinc-500">Laatst bijgewerkt</div>
									<div class="text-zinc-900">{formatDate(user.updated_at)}</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Role Management -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6">
					<UserRoleManager
						{user}
						availableRoles={allRoles}
						onassign={handleAssignRole}
						onremove={handleRemoveRole}
						loading={roleLoading}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Edit User Drawer -->
{#if user}
	<UserDrawer
		open={showEditDrawer}
		onclose={() => {
			showEditDrawer = false;
			drawerError = null;
		}}
		{user}
		onsubmit={handleUpdateUser}
		loading={drawerLoading}
		error={drawerError}
	/>
{/if}

<!-- Delete Confirmation Modal -->
<Modal
	open={showDeleteModal}
	onclose={() => showDeleteModal = false}
	title="Gebruiker verwijderen"
>
	<div class="space-y-4">
		<p class="text-zinc-700">
			Weet je zeker dat je <strong>{getDisplayName(user)}</strong> wilt verwijderen?
			De gebruiker wordt gedeactiveerd en kan niet meer inloggen.
		</p>
		
		<div class="flex gap-2 justify-end pt-4">
			<Button
				variant="ghost"
				onclick={() => showDeleteModal = false}
				disabled={deleteLoading}
			>
				Annuleren
			</Button>
			<Button
				variant="secondary"
				onclick={handleDeleteUser}
				disabled={deleteLoading}
			>
				{deleteLoading ? 'Verwijderen...' : 'Verwijderen'}
			</Button>
		</div>
	</div>
</Modal>

