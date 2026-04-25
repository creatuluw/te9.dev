<script lang="ts">
	import type { Toast } from '$lib/stores/toastStore';
	import { onMount } from 'svelte';

	/**
	 * Toast component props
	 * 
	 * Individual toast notification item. Automatically dismisses after duration.
	 */
	interface Props {
		/**
		 * Toast data object containing message, variant, and metadata
		 * @example
		 * ```typescript
		 * const toast: Toast = {
		 *   id: '123',
		 *   message: 'Task completed',
		 *   variant: 'success',
		 *   duration: 5000
		 * };
		 * ```
		 */
		toast: Toast;
		
		/**
		 * Close handler function called when toast is dismissed
		 * @param id - Toast ID to remove
		 * @example
		 * ```typescript
		 * <Toast toast={toast} onClose={(id) => toastStore.remove(id)} />
		 * ```
		 */
		onClose: (id: string) => void;
	}

	let { toast, onClose }: Props = $props();

	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	function handleClose() {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		onClose(toast.id);
	}

	onMount(() => {
		const duration = toast.duration ?? 5000;
		if (duration > 0) {
			timeoutId = setTimeout(() => {
				handleClose();
			}, duration);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

<div
	role="alert"
	class="flex items-center gap-2 px-3 py-2 rounded-md shadow-sm border min-w-[280px] max-w-2xl text-white"
	class:bg-black={toast.variant !== 'error'}
	class:border-zinc-800={toast.variant !== 'error'}
	class:bg-red-600={toast.variant === 'error'}
	class:border-red-700={toast.variant === 'error'}
>
	<div class="flex-1 text-sm">{toast.message}</div>
	<button
		type="button"
		onclick={handleClose}
		class="shrink-0 text-white/70 hover:text-white transition"
		aria-label="Close"
	>
		<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>

