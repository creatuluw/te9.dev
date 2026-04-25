<script lang="ts">
	import type { ProjectMemberWithUser } from '$lib/schemas/projectMember';
	import Button from './Button.svelte';
	import Label from './Label.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import Modal from './Modal.svelte';
	import UserSelector from './UserSelector.svelte';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import { Crown, UserPlus, X, Shield } from 'lucide-svelte';
	import { page } from '$app/stores';

	/**
	 * ProjectMemberManager component props
	 */
	interface Props {
		/**
		 * Project ID
		 */
		projectId: number;

		/**
		 * Current user ID
		 */
		currentUserId: string;

		/**
		 * Whether current user is an owner
		 */
		isOwner: boolean;

		/**
		 * Callback when members are updated
		 */
		onupdate?: () => void;
	}

	let { projectId, currentUserId, isOwner, onupdate }: Props = $props();

	let members = $state<ProjectMemberWithUser[]>([]);
	let loading = $state(true);
	let addMemberModalOpen = $state(false);
	let selectedUserId = $state<string | null>(null);
	let selectedIsOwner = $state(false);
	let adding = $state(false);
	let availableUsers = $state<any[]>([]);
	let loadingUsers = $state(false);
	let deleteModalOpen = $state(false);
	let memberToDelete = $state<ProjectMemberWithUser | null>(null);
	let deleting = $state(false);

	// Load members
	async function loadMembers() {
		loading = true;
		try {
			const response = await fetch(`/api/projects/${projectId}/members`);
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to load members');
			}
			const data = await response.json();
			members = data;
			console.log('[ProjectMemberManager] Loaded members count:', data.length);
			console.log('[ProjectMemberManager] First member:', data[0]);
			console.log('[ProjectMemberManager] Member details:', {
				user_id: data[0]?.user_id,
				user_name: data[0]?.user_name,
				user_email: data[0]?.user_email,
				is_owner: data[0]?.is_owner
			});
		} catch (error: any) {
			console.error('[ProjectMemberManager] Error loading members:', error);
			toastStore.add(error.message || 'Failed to load members', 'error');
		} finally {
			loading = false;
		}
	}

	// Load available users (excluding current members)
	async function loadAvailableUsers() {
		loadingUsers = true;
		try {
			const response = await fetch('/api/users/public');
			if (!response.ok) {
				throw new Error('Failed to load users');
			}
			const allUsers = await response.json();
			// Filter out users who are already members
			const memberIds = members.map(m => m.user_id);
			availableUsers = allUsers.filter((u: any) => !memberIds.includes(u.id));
		} catch (error: any) {
			toastStore.add(error.message || 'Failed to load users', 'error');
			availableUsers = [];
		} finally {
			loadingUsers = false;
		}
	}

	// Open add member modal
	function openAddMemberModal() {
		selectedUserId = null;
		selectedIsOwner = false;
		addMemberModalOpen = true;
		loadAvailableUsers();
	}

	// Add member
	async function handleAddMember() {
		if (!selectedUserId) {
			toastStore.add('Please select a user', 'error');
			return;
		}

		adding = true;
		try {
			const response = await fetch(`/api/projects/${projectId}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: selectedUserId,
					is_owner: selectedIsOwner
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to add member');
			}

			toastStore.add('Member added successfully', 'success');
			addMemberModalOpen = false;
			await loadMembers();
			onupdate?.();
		} catch (error: any) {
			toastStore.add(error.message || 'Failed to add member', 'error');
		} finally {
			adding = false;
		}
	}

	// Toggle member owner status
	async function toggleOwnerStatus(userId: string, currentStatus: boolean) {
		try {
			const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_owner: !currentStatus })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update member role');
			}

			toastStore.add('Member role updated', 'success');
			await loadMembers();
			onupdate?.();
		} catch (error: any) {
			toastStore.add(error.message || 'Failed to update member role', 'error');
		}
	}

	// Open delete confirmation modal
	function openDeleteModal(member: ProjectMemberWithUser) {
		if (member.user_id === currentUserId) {
			toastStore.add('You cannot remove yourself from the project', 'error');
			return;
		}
		memberToDelete = member;
		deleteModalOpen = true;
	}

	// Cancel delete
	function cancelDelete() {
		memberToDelete = null;
		deleteModalOpen = false;
	}

	// Remove member (after confirmation)
	async function confirmRemoveMember() {
		if (!memberToDelete) return;

		deleting = true;
		try {
			const response = await fetch(`/api/projects/${projectId}/members/${memberToDelete.user_id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to remove member');
			}

			toastStore.add('Member removed successfully', 'success');
			deleteModalOpen = false;
			memberToDelete = null;
			await loadMembers();
			onupdate?.();
		} catch (error: any) {
			toastStore.add(error.message || 'Failed to remove member', 'error');
		} finally {
			deleting = false;
		}
	}

	// Load members on mount
	$effect(() => {
		loadMembers();
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold text-zinc-900">Project Members</h3>
		{#if isOwner}
			<Button variant="default" size="sm" onclick={openAddMemberModal}>
				<UserPlus size={16} class="mr-2" />
				Add Member
			</Button>
		{/if}
	</div>

	{#if loading}
		<div class="text-sm text-zinc-500">Loading members...</div>
	{:else if members.length === 0}
		<div class="text-sm text-zinc-500">No members yet</div>
	{:else}
		<div class="space-y-2">
			{#each members as member (member.id)}
				<div class="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200">
					<div class="flex items-center gap-3">
						<UserAvatar 
							user={{ 
								id: member.user_id, 
								name: member.user_name || '', 
								email: member.user_email || '',
								avatar: member.user_avatar 
							}} 
							size="md" 
							showName={true}
						/>
						{#if member.is_owner}
							<Label variant="default" class="bg-amber-100 text-amber-800">
								<Crown size={12} class="mr-1" />
								Owner
							</Label>
						{:else}
							<Label variant="default" class="bg-blue-100 text-blue-800">
								<Shield size={12} class="mr-1" />
								Member
							</Label>
						{/if}
					</div>

					{#if isOwner && member.user_id !== currentUserId}
						<div class="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onclick={() => toggleOwnerStatus(member.user_id, member.is_owner)}
							>
								{member.is_owner ? 'Make Member' : 'Make Owner'}
							</Button>
							<Button
								variant="danger"
								size="sm"
								onclick={() => openDeleteModal(member)}
							>
								<X size={16} />
							</Button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add Member Modal -->
<Modal
	open={addMemberModalOpen}
	onclose={() => (addMemberModalOpen = false)}
	title="Add Project Member"
>
	<div class="space-y-4">
		<div>
			<label for="user-select" class="block text-sm font-medium text-zinc-700 mb-2">
				Select User
			</label>
			<UserSelector
				bind:selectedUserId={selectedUserId}
				placeholder="-- Select a user --"
				users={availableUsers}
			/>
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="is-owner"
				bind:checked={selectedIsOwner}
				class="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900"
			/>
			<label for="is-owner" class="text-sm text-zinc-700">
				Make this user an owner
			</label>
		</div>

		<!-- Footer buttons -->
		<div class="flex justify-end gap-2 pt-4 border-t border-zinc-200">
			<Button variant="ghost" onclick={() => (addMemberModalOpen = false)}>
				Cancel
			</Button>
			<Button
				variant="default"
				onclick={handleAddMember}
				disabled={adding || !selectedUserId}
			>
				{adding ? 'Adding...' : 'Add Member'}
			</Button>
		</div>
	</div>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal 
	bind:open={deleteModalOpen} 
	title="Remove Project Member" 
	size="md" 
	closeOnBackdropClick={false} 
	loading={deleting}
>
	<div class="space-y-4">
		<p class="text-zinc-600">
			Are you sure you want to remove <strong>{memberToDelete?.user_name || memberToDelete?.user_email || 'this member'}</strong> from the project?
		</p>
		<p class="text-sm text-zinc-500">
			They will lose access to this project immediately.
		</p>
		<div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
			<Button variant="secondary" onclick={cancelDelete} disabled={deleting}>
				Cancel
			</Button>
			<button
				onclick={confirmRemoveMember}
				disabled={deleting}
				class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{deleting ? 'Removing...' : 'Remove Member'}
			</button>
		</div>
	</div>
</Modal>

