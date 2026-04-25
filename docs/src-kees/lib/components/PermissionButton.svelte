<script lang="ts">
	import { hasPermission as checkPermission } from '$lib/utils/authGuard';
	import Button from './Button.svelte';

	interface Props {
		/** Required permission route */
		permission: string;
		
		/** Required permission action */
		action: 'read' | 'write' | 'delete' | 'execute';
		
		/** Button variant */
		variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'danger';
		
		/** Button size */
		size?: 'default' | 'sm';
		
		/** Disabled state */
		disabled?: boolean;
		
		/** Button type */
		type?: 'button' | 'submit' | 'reset';
		
		/** Click handler */
		onclick?: (event: MouseEvent) => void;
		
		/** Children content */
		children?: import('svelte').Snippet;
		
		/** Additional CSS classes */
		class?: string;
	}

	let {
		permission,
		action,
		variant = 'default',
		size = 'default',
		disabled = false,
		type = 'button',
		onclick,
		children,
		class: className = ''
	}: Props = $props();

	// Check if user has permission
	const hasPerm = $derived(checkPermission(permission, action));
</script>

{#if hasPerm}
	<Button
		{variant}
		{size}
		{disabled}
		{type}
		{onclick}
		class={className}
	>
		{@render children?.()}
	</Button>
{/if}

