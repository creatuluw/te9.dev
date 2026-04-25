<script lang="ts">
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import type { Snippet } from 'svelte';
	
	interface Props {
		children: Snippet;
	}
	
	let { children }: Props = $props();
</script>

<ProtectedRoute requiredPermission="/admin" requiredAction="read">
	{@render children()}
</ProtectedRoute>
