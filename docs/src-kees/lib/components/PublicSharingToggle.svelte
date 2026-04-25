<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Toggle from './Toggle.svelte';
	import Button from './Button.svelte';
	import Spinner from './Spinner.svelte';
	import { Copy, Check } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';

	interface Props {
		/** Entity type */
		entityType: 'work' | 'case' | 'project';
		
		/** Entity ID */
		entityId: number;
		
		/** Current sharing status */
		currentStatus?: {
			isPublic: boolean;
			token: string | null;
			publicUrl: string | null;
		};
		
		/** Additional CSS classes */
		class?: string;
	}

	let {
		entityType,
		entityId,
		currentStatus,
		class: className = ''
	}: Props = $props();

	let isPublic = $state(currentStatus?.isPublic || false);
	let publicUrl = $state<string | null>(currentStatus?.publicUrl || null);
	let loading = $state(false);
	let copying = $state(false);
	let copied = $state(false);

	// Update state when currentStatus changes
	$effect(() => {
		if (currentStatus) {
			isPublic = currentStatus.isPublic;
			publicUrl = currentStatus.publicUrl;
		}
	});

	// Load initial status if not provided
	onMount(async () => {
		if (!currentStatus) {
			await loadStatus();
		}
	});

	async function loadStatus() {
		loading = true;
		try {
			const apiPath = entityType === 'work' 
				? `/api/work/${entityId}/public`
				: entityType === 'case'
				? `/api/cases/${entityId}/public`
				: `/api/projects/${entityId}/public`;

			const response = await fetch(apiPath);
			if (response.ok) {
				const data = await response.json();
				isPublic = data.isPublic;
				publicUrl = data.publicUrl;
			} else {
				// If 404, entity might not exist or user doesn't have permission
				// Set defaults and don't show error (component will be hidden if no permission)
				if (response.status === 404 || response.status === 403) {
					isPublic = false;
					publicUrl = null;
				}
			}
		} catch (error) {
			console.error('Error loading sharing status:', error);
			// Set defaults on error
			isPublic = false;
			publicUrl = null;
		} finally {
			loading = false;
		}
	}

	async function handleToggle(checked: boolean) {
		loading = true;
		try {
			const apiPath = entityType === 'work' 
				? `/api/work/${entityId}/public`
				: entityType === 'case'
				? `/api/cases/${entityId}/public`
				: `/api/projects/${entityId}/public`;

			const response = await fetch(apiPath, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ isPublic: checked })
			});

			if (!response.ok) {
				const errorData = await response.json();
				const errorMessage = errorData?.error || errorData?.message || 'Fout bij bijwerken van delen';
				toastStore.add(errorMessage, 'error');
				return;
			}

			const data = await response.json();
			isPublic = data.isPublic;
			publicUrl = data.publicUrl;

			if (checked) {
				toastStore.add('Publiek delen ingeschakeld', 'success');
			} else {
				toastStore.add('Publiek delen uitgeschakeld', 'success');
			}
		} catch (error) {
			console.error('Error toggling sharing:', error);
			toastStore.add('Fout bij bijwerken van delen', 'error');
		} finally {
			loading = false;
		}
	}

	async function copyToClipboard() {
		if (!publicUrl) return;

		copying = true;
		copied = false;

		try {
			const fullUrl = browser ? `${window.location.origin}${publicUrl}` : publicUrl;
			
			if (browser && navigator.clipboard) {
				await navigator.clipboard.writeText(fullUrl);
				copied = true;
				toastStore.add('URL gekopieerd naar klembord', 'success');
				
				// Reset copied state after 2 seconds
				setTimeout(() => {
					copied = false;
				}, 2000);
			} else {
				// Fallback for older browsers
				const textArea = document.createElement('textarea');
				textArea.value = fullUrl;
				textArea.style.position = 'fixed';
				textArea.style.opacity = '0';
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
				copied = true;
				toastStore.add('URL gekopieerd naar klembord', 'success');
				
				setTimeout(() => {
					copied = false;
				}, 2000);
			}
		} catch (error) {
			console.error('Error copying to clipboard:', error);
			toastStore.add('Fout bij kopiëren naar klembord', 'error');
		} finally {
			copying = false;
		}
	}
</script>

<div class="flex flex-col gap-3 {className}">
	<div class="flex items-center gap-3">
		<label class="text-sm font-medium text-zinc-700">
			Publiek delen
		</label>
		{#if loading}
			<Spinner size="sm" />
		{:else}
			<Toggle
				checked={isPublic}
				disabled={loading}
				onchange={(e) => handleToggle(e.currentTarget.checked)}
				ariaLabel="Publiek delen inschakelen"
			/>
		{/if}
	</div>

	{#if isPublic && publicUrl}
		<div class="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
			<input
				type="text"
				readonly
				value={browser ? `${window.location.origin}${publicUrl}` : publicUrl}
				class="flex-1 px-2 py-1 text-sm text-zinc-700 bg-white border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
			/>
			<Button
				variant="secondary"
				size="sm"
				onclick={copyToClipboard}
				disabled={copying}
				class="flex items-center gap-1"
			>
				{#if copied}
					<Check class="w-4 h-4" />
					<span>Gekopieerd</span>
				{:else if copying}
					<Spinner size="sm" />
				{:else}
					<Copy class="w-4 h-4" />
					<span>Kopieer</span>
				{/if}
			</Button>
		</div>
	{/if}
</div>

