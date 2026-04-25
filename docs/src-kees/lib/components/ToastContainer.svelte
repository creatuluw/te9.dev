<script lang="ts">
	import { toastState, removeToast, type Toast } from '$lib/stores/toastStore.svelte';
	import ToastComponent from './Toast.svelte';

	/**
	 * Toast container position on screen
	 * - top-right: Top right corner (default)
	 * - top-left: Top left corner
	 * - bottom-right: Bottom right corner
	 * - bottom-left: Bottom left corner
	 * - top-center: Top center
	 * - bottom-center: Bottom center
	 */
	type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

	/**
	 * ToastContainer component props
	 * 
	 * Container component for displaying toast notifications.
	 * Uses Svelte 5 $state runes for direct reactive access.
	 */
	interface Props {
		/**
		 * Position of the toast container on screen
		 * @default 'top-right'
		 * @example
		 * ```typescript
		 * <ToastContainer position="bottom-right" />
		 * ```
		 */
		position?: ToastPosition;
	}

	let { position = 'top-right' }: Props = $props();

	// Direct reactive access - no subscribe needed!
	const toasts = $derived(toastState.toasts);

	function getPositionClasses(position: ToastPosition): string {
		const positions: Record<ToastPosition, string> = {
			'top-right': 'top-4 right-4',
			'top-left': 'top-4 left-4',
			'bottom-right': 'bottom-4 right-4',
			'bottom-left': 'bottom-4 left-4',
			'top-center': 'top-4 left-1/2 -translate-x-1/2',
			'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
		};
		return positions[position];
	}

	function handleClose(id: string) {
		removeToast(id);
	}
</script>

{#if toasts.length > 0}
	<div class="fixed z-toast {getPositionClasses(position)} flex flex-col gap-1.5 pointer-events-none">
		{#each toasts as toast (toast.id)}
			<div class="pointer-events-auto">
				<ToastComponent {toast} onClose={handleClose} />
			</div>
		{/each}
	</div>
{/if}

