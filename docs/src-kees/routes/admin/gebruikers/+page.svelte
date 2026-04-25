<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import type { User } from '$lib/schemas/auth';
	import { Plus, Send, Trash2 } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import Label from '$lib/components/Label.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import UserDrawer from '$lib/components/UserDrawer.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	import { toastStore } from '$lib/stores/toastStore';
	
	interface PendingInvitation {
		id: number;
		email: string;
		created_at: string;
		expires_at: string;
	}
	
	let users = $state<User[]>([]);
	let pendingInvitations = $state<PendingInvitation[]>([]);
	let loading = $state(true);
	let invitationsLoading = $state(false);
	let resendingInvitations = $state<Set<number>>(new Set());
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let filterActive = $state<boolean | undefined>(undefined);
	
	// Delete modal state
	let deleteModalOpen = $state(false);
	let deleting = $state(false);
	let invitationToDelete = $state<{ id: number; email: string } | null>(null);
	
	// Drawer state - derived from URL params
	const drawerParam = $derived($page.url.searchParams.get('drawer'));
	const isUserDrawerOpen = $derived(drawerParam === 'newuser');
	let drawerLoading = $state(false);
	let drawerError = $state<string | null>(null);
	
	// Get authentication token
	const authData = $derived($authStore);
	
	// Ensure users is always an array
	$effect(() => {
		if (!users) {
			users = [];
		}
	});
	
	onMount(async () => {
		await Promise.all([loadUsers(), loadPendingInvitations()]);
	});
	
	async function loadUsers() {
		loading = true;
		navigationStore.startPageLoading();
		error = null;
		
		try {
			// Build query parameters
			const params = new URLSearchParams();
			if (searchQuery) params.set('search', searchQuery);
			if (filterActive !== undefined) params.set('is_active', String(filterActive));
			
			// Get authentication token
			const token = authData?.token;
			if (!token) {
				error = 'Niet geauthenticeerd';
				loading = false;
				return;
			}
			
			const response = await fetch(`/api/users?${params.toString()}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				error = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
				loading = false;
				navigationStore.stopPageLoading();
				return;
			}
			
			const result = await response.json();
			
			if (result.success) {
				// API returns result.data as an array directly
				users = Array.isArray(result.data) ? result.data : [];
			} else {
				error = result.error || 'Er ging iets mis bij het laden van gebruikers';
			}
		} catch (err) {
			error = 'Er ging iets mis bij het laden van gebruikers';
			console.error('Load users error:', err);
			if (import.meta.env.DEV) {
				console.error('Full error details:', err);
			}
		}
		
		loading = false;
		navigationStore.stopPageLoading();
	}
	
	async function handleSearch() {
		await loadUsers();
	}
	
	async function handleFilterChange() {
		await loadUsers();
	}
	
	function formatDate(dateString?: string | null): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('nl-NL', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	async function openUserDrawer() {
		drawerError = null;
		const url = new URL($page.url);
		url.searchParams.set('drawer', 'newuser');
		await goto(url.pathname + url.search, { noScroll: true });
	}
	
	async function closeUserDrawer() {
		const url = new URL($page.url);
		url.searchParams.delete('drawer');
		drawerError = null;
		await goto(url.pathname + url.search, { noScroll: true });
	}
	
	async function loadPendingInvitations() {
		invitationsLoading = true;
		
		try {
			const token = authData?.token;
			if (!token) {
				return;
			}
			
			const response = await fetch('/api/admin/users/invitations', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			
			if (!response.ok) {
				console.error('Failed to load pending invitations');
				return;
			}
			
			const result = await response.json();
			
			if (result.success) {
				pendingInvitations = result.data || [];
			}
		} catch (err) {
			console.error('Load pending invitations error:', err);
		} finally {
			invitationsLoading = false;
		}
	}
	
	async function handleResendInvitation(invitationId: number, email: string, event: MouseEvent) {
		event.stopPropagation();
		
		// Set loading state for this specific invitation
		resendingInvitations = new Set(resendingInvitations);
		resendingInvitations.add(invitationId);
		
		try {
			const token = authData?.token;
			if (!token) {
				toastStore.add('Niet geautoriseerd', 'error');
				return;
			}
			
			const response = await fetch(`/api/admin/users/invitations/${invitationId}/resend`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadPendingInvitations();
				toastStore.add(`Uitnodiging opnieuw verstuurd naar ${email}`, 'success');
			} else {
				toastStore.add(result.error || 'Er ging iets mis bij het opnieuw versturen van de uitnodiging', 'error');
			}
		} catch (err) {
			toastStore.add('Er ging iets mis bij het opnieuw versturen van de uitnodiging', 'error');
			console.error('Resend invitation error:', err);
		} finally {
			// Clear loading state for this invitation
			resendingInvitations = new Set(resendingInvitations);
			resendingInvitations.delete(invitationId);
		}
	}
	
	function handleDeleteInvitation(invitationId: number, email: string, event: MouseEvent) {
		event.stopPropagation();
		invitationToDelete = { id: invitationId, email };
		deleteModalOpen = true;
	}
	
	function cancelDelete() {
		deleteModalOpen = false;
		invitationToDelete = null;
	}
	
	async function confirmDelete() {
		if (!invitationToDelete) return;
		
		deleting = true;
		
		try {
			const token = authData?.token;
			if (!token) {
				toastStore.add('Niet geautoriseerd', 'error');
				deleting = false;
				return;
			}
			
			const response = await fetch(`/api/admin/users/invitations/${invitationToDelete.id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			
			// Check if response is OK before parsing JSON
			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = 'Er ging iets mis bij het verwijderen van de uitnodiging';
				
				if (contentType?.includes('application/json')) {
					try {
						const errorData = await response.json();
						errorMessage = errorData.error || errorMessage;
					} catch {
						// If JSON parsing fails, use default message
					}
				} else {
					// If response is HTML (like 404 page), use status-specific message
					if (response.status === 404) {
						errorMessage = 'Endpoint niet gevonden. Probeer de pagina te vernieuwen.';
					} else if (response.status === 401) {
						errorMessage = 'Niet geautoriseerd';
					} else if (response.status === 403) {
						errorMessage = 'Geen toestemming om deze actie uit te voeren';
					}
				}
				
				toastStore.add(errorMessage, 'error');
				deleting = false;
				return;
			}
			
			// Parse JSON only if response is OK
			const result = await response.json();
			
			if (result.success) {
				await loadPendingInvitations();
				toastStore.add(`Uitnodiging voor ${invitationToDelete.email} verwijderd`, 'success');
				deleteModalOpen = false;
				invitationToDelete = null;
			} else {
				toastStore.add(result.error || 'Er ging iets mis bij het verwijderen van de uitnodiging', 'error');
				deleting = false;
			}
		} catch (err) {
			toastStore.add('Er ging iets mis bij het verwijderen van de uitnodiging', 'error');
			console.error('Delete invitation error:', err);
			deleting = false;
		}
	}
	
	async function handleCreateUser(data: any) {
		drawerLoading = true;
		drawerError = null;
		
		try {
			const token = authData?.token;
			if (!token) {
				drawerError = 'Niet geautoriseerd';
				return;
			}
			
			// Send invitation instead of creating user directly
			const response = await fetch('/api/admin/users/invite', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: data.email })
			});
			
			const result = await response.json();
			
			if (result.success) {
				await Promise.all([loadUsers(), loadPendingInvitations()]);
				await closeUserDrawer();
				toastStore.add('Uitnodiging succesvol verstuurd', 'success');
			} else {
				drawerError = result.error || 'Er ging iets mis bij het versturen van de uitnodiging';
			}
		} catch (err) {
			drawerError = 'Er ging iets mis bij het versturen van de uitnodiging';
			console.error('Send invitation error:', err);
		}
		
		drawerLoading = false;
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2">
				Gebruikers
			</h1>
			<p class="text-zinc-600">
				Beheer gebruikers en hun rechten
			</p>
		</div>
		<Button onclick={openUserDrawer}>
			<Plus class="w-4 h-4" />
			Nieuwe gebruiker
		</Button>
	</div>
	
	<!-- Pending Invitations Section -->
	{#if pendingInvitations.length > 0}
		<div class="bg-white rounded-lg border border-zinc-200 p-6 mb-6 shadow-xs">
			<h2 class="text-xl font-aspekta font-semibold text-zinc-900 tracking-tight mb-4">
				Openstaande uitnodigingen ({pendingInvitations.length})
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each pendingInvitations as invitation}
					<div class="bg-zinc-50 rounded-lg border border-zinc-200 p-4 flex items-center justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-zinc-900 truncate mb-1">
								{invitation.email}
							</div>
							<div class="text-xs text-zinc-500">
								Verstuurd: {formatDate(invitation.created_at)}
							</div>
							<div class="text-xs text-zinc-500">
								Vervalt: {formatDate(invitation.expires_at)}
							</div>
						</div>
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={(e) => handleResendInvitation(invitation.id, invitation.email, e)}
								disabled={resendingInvitations.has(invitation.id) || deleting}
								class="flex-shrink-0 p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-600"
								title="Uitnodiging opnieuw versturen"
							>
								{#if resendingInvitations.has(invitation.id)}
									<Spinner size="xs" />
								{:else}
									<Send class="w-4 h-4" />
								{/if}
							</button>
							<button
								type="button"
								onclick={(e) => handleDeleteInvitation(invitation.id, invitation.email, e)}
								disabled={resendingInvitations.has(invitation.id) || deleting}
								class="flex-shrink-0 p-2 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-600"
								title="Uitnodiging verwijderen"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Filters -->
	<div class="bg-white rounded-lg border border-zinc-200 p-6 mb-6 shadow-xs">
		<div class="flex flex-col sm:flex-row gap-4">
			<!-- Search -->
			<div class="flex-1">
				<label for="search" class="block text-sm font-medium text-zinc-900 mb-2">
					Zoeken
				</label>
				<div class="flex gap-2">
					<input
						type="text"
						id="search"
						bind:value={searchQuery}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
						placeholder="Naam, email of gebruikersnaam..."
						class="flex-1 px-3 py-2 border border-zinc-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
					/>
					<Button onclick={handleSearch}>Zoek</Button>
				</div>
			</div>
			
			<!-- Filter by active status -->
			<div>
				<label for="filter-active" class="block text-sm font-medium text-zinc-900 mb-2">
					Status
				</label>
				<select
					id="filter-active"
					bind:value={filterActive}
					onchange={handleFilterChange}
					class="px-3 py-2 border border-zinc-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
				>
					<option value={undefined}>Alle</option>
					<option value={true}>Actief</option>
					<option value={false}>Inactief</option>
				</select>
			</div>
		</div>
	</div>
	
	<!-- Error message -->
	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
			{error}
		</div>
	{/if}
	
	<!-- Content -->
	{#if !loading && (!users || users.length === 0)}
		<div class="text-center py-12 bg-white rounded-lg border border-zinc-200">
			<p class="text-zinc-500">Geen gebruikers gevonden</p>
		</div>
	{:else if !loading}
		<!-- Results count -->
		<div class="mb-6">
			<div class="text-zinc-600">
				{users.length} {users.length === 1 ? 'gebruiker' : 'gebruikers'} gevonden
			</div>
		</div>
		
		<!-- Users Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each users as user}
				<div
					class="bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer flex flex-col group"
					onclick={() => goto(`/admin/gebruikers/${user.id}`)}
					role="button"
					tabindex="0"
				>
					<!-- Header -->
					<div class="px-4 pt-4 pb-3 border-b border-zinc-100 relative">
						<div class="flex items-center gap-3 mb-2">
							<UserAvatar user={user as any} size="md" showName={false} />
							<div class="flex-1 min-w-0">
								<h3 class="text-base font-semibold text-zinc-900 tracking-tight leading-tight font-inter truncate" style="font-style: normal; font-variant: normal;">
									{user.name || user.username || '-'}
								</h3>
								{#if user.username && user.name}
									<div class="text-xs text-zinc-500 truncate">
										@{user.username}
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Details section -->
					<div class="px-4 py-3 flex-1">
						<div class="space-y-2">
							<!-- Email -->
							<div class="text-xs text-zinc-600 truncate">
								{user.email}
							</div>
							
							<!-- Status badges in one row -->
							<div class="flex items-center gap-2 flex-wrap">
								{#if user.is_active}
									<Label variant="success">Actief</Label>
								{:else}
									<Label variant="default">Inactief</Label>
								{/if}
								
								{#if user.email_verified}
									<Label variant="success">Geverifieerd</Label>
								{/if}
							</div>
							
							<!-- Dates in one row -->
							<div class="flex items-center gap-3 text-xs flex-wrap">
								<div class="flex items-center gap-1.5">
									<span class="text-zinc-500">Aangemaakt</span>
									<span class="text-zinc-900 font-medium">{formatDate(user.created_at)}</span>
								</div>
								{#if user.last_login_at}
									<div class="flex items-center gap-1.5">
										<span class="text-zinc-500">Laatste login</span>
										<span class="text-zinc-900 font-medium">{formatDate(user.last_login_at)}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- User Drawer -->
<UserDrawer
	open={isUserDrawerOpen}
	onclose={closeUserDrawer}
	onsubmit={handleCreateUser}
	loading={drawerLoading}
	error={drawerError}
/>

<!-- Delete Confirmation Modal -->
<Modal bind:open={deleteModalOpen} title="Uitnodiging verwijderen" size="md" closeOnBackdropClick={false} loading={deleting}>
	<div class="space-y-4">
		<p class="text-zinc-600">
			Weet u zeker dat u de uitnodiging voor {invitationToDelete?.email || ''} wilt verwijderen?
		</p>
		<p class="text-sm text-zinc-500">
			Deze actie kan niet ongedaan worden gemaakt.
		</p>
		<div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
			<Button variant="secondary" onclick={cancelDelete} disabled={deleting}>
				Annuleren
			</Button>
			<button
				onclick={confirmDelete}
				disabled={deleting}
				class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{deleting ? 'Verwijderen...' : 'Verwijderen'}
			</button>
		</div>
	</div>
</Modal>

