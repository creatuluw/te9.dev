<script lang="ts">
	import { hasPermission as checkPermission } from '$lib/utils/authGuard';

	interface Props {
		/** Required permission route */
		permission: string;
		
		/** Required permission action */
		action: 'read' | 'write' | 'delete' | 'execute';
		
		/** Show fallback content when no permission */
		showFallback?: boolean;
		
		/** Fallback message */
		fallbackMessage?: string;
		
		/** Children content */
		children?: import('svelte').Snippet;
		
		/** Fallback content */
		fallback?: import('svelte').Snippet;
	}

	let {
		permission,
		action,
		showFallback = false,
		fallbackMessage = 'U heeft geen toegang tot deze functie',
		children,
		fallback
	}: Props = $props();

	// Check if user has permission
	const hasPerm = $derived(checkPermission(permission, action));
</script>

{#if hasPerm}
	{@render children?.()}
{:else if showFallback}
	{#if fallback}
		{@render fallback()}
	{:else}
		<div class="text-zinc-500 text-sm italic">
			{fallbackMessage}
		</div>
	{/if}
{/if}

