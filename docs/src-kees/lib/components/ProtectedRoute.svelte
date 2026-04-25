<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { hasPermission, isAuthenticated } from '$lib/utils/authGuard';
	import Spinner from './Spinner.svelte';

	interface Props {
		/** Required permission route */
		requiredPermission?: string;
		
		/** Required permission action */
		requiredAction?: 'read' | 'write' | 'delete' | 'execute';
		
		/** Redirect URL if unauthorized (default: home) */
		redirectTo?: string;
		
		/** Show forbidden message instead of redirecting */
		showForbidden?: boolean;
		
		/** Custom forbidden message */
		forbiddenMessage?: string;
		
		/** Loading message */
		loadingMessage?: string;
		
		/** Children content */
		children?: import('svelte').Snippet;
		
		/** Additional CSS classes */
		class?: string;
	}

	let {
		requiredPermission,
		requiredAction = 'read',
		redirectTo = '/',
		showForbidden = false,
		forbiddenMessage = 'U heeft geen toegang tot deze pagina',
		loadingMessage = 'Verificatie...',
		children,
		class: className = ''
	}: Props = $props();

	let isChecking = $state(true);
	let isAuthorized = $state(false);
	let authData = $state($authStore);

	// Subscribe to auth store
	$effect(() => {
		authData = $authStore;
	});

	// Check authorization when component mounts
	onMount(() => {
		checkAuthorization();
	});

	// Recheck when auth data changes
	$effect(() => {
		if (authData !== null) {
			checkAuthorization();
		}
	});

	function checkAuthorization() {
		// Check authentication first
		if (!isAuthenticated()) {
			isChecking = false;
			isAuthorized = false;
			
			if (!showForbidden) {
				// Redirect to login
				const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
				goto(`/login?redirect=${encodeURIComponent(currentPath)}`);
			}
			return;
		}

		// If no permission required, user is authorized
		if (!requiredPermission) {
			isChecking = false;
			isAuthorized = true;
			return;
		}

		// Check permission
		const hasPerm = hasPermission(requiredPermission, requiredAction);
		
		isChecking = false;
		isAuthorized = hasPerm;

		// Redirect if not authorized and not showing forbidden message
		if (!hasPerm && !showForbidden) {
			goto(redirectTo);
		}
	}
</script>

<div class="protected-route {className}">
	{#if isChecking}
		<!-- Loading state -->
		<div class="flex flex-col items-center justify-center py-12">
			<Spinner size="md" />
			<p class="mt-4 text-zinc-600 text-sm">{loadingMessage}</p>
		</div>
	{:else if !isAuthorized}
		<!-- Forbidden state -->
		{#if showForbidden}
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
				<div class="text-red-800 text-lg font-semibold mb-2">
					Toegang geweigerd
				</div>
				<p class="text-red-700 text-sm">
					{forbiddenMessage}
				</p>
				<button
					onclick={() => goto('/')}
					class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
				>
					Terug naar home
				</button>
			</div>
		{/if}
	{:else}
		<!-- Authorized - render children -->
		{@render children?.()}
	{/if}
</div>

