<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Button from './Button.svelte';
	import { Download, X } from 'lucide-svelte';

	/**
	 * ImageViewerModal component props
	 */
	interface Props {
		/**
		 * Image URL to display
		 */
		imageUrl: string;
		
		/**
		 * Image name (for download)
		 */
		imageName?: string;
		
		/**
		 * Whether modal is open
		 */
		open?: boolean;
		
		/**
		 * Callback when modal closes
		 */
		onClose?: () => void;
	}

	let {
		imageUrl,
		imageName,
		open: isOpen = $bindable(false),
		onClose
	}: Props = $props();

	function handleClose() {
		isOpen = false;
		onClose?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (event.target === event.currentTarget) {
				handleClose();
			}
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			handleClose();
		}
	}

	function handleDownload() {
		const link = document.createElement('a');
		link.href = imageUrl;
		link.download = imageName || 'image';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	onMount(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('keydown', handleEscape);
			if (isOpen) {
				document.body.classList.add('modal-open');
			}
		}
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('keydown', handleEscape);
			document.body.classList.remove('modal-open');
		}
	});

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (isOpen) {
				document.body.classList.add('modal-open');
			} else {
				document.body.classList.remove('modal-open');
			}
		}
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 flex items-center justify-center p-4 z-modal bg-zinc-900/90"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="dialog"
		aria-modal="true"
		aria-label="Image viewer"
		tabindex={-1}
	>
		<!-- Close button -->
		<button
			type="button"
			onclick={handleClose}
			class="absolute top-4 right-4 z-10 bg-black text-white hover:bg-red-600 transition p-2 rounded-lg"
			aria-label="Close image viewer"
		>
			<X class="w-6 h-6" />
		</button>

		<!-- Image container with download button below -->
		<div class="flex flex-col items-center gap-4">
			<div class="relative max-w-[50vw] max-h-[50vh] flex items-center justify-center">
				<img
					src={imageUrl}
					alt={imageName || 'Image'}
					class="max-w-full max-h-[50vh] object-contain rounded-lg shadow-2xl"
					role="presentation"
					onclick={(e) => e.stopPropagation()}
				/>
			</div>
			<Button
				variant="secondary"
				size="sm"
				onclick={handleDownload}
				class="bg-white/90 hover:bg-white text-xs py-1 px-2"
			>
				<Download class="w-3 h-3 mr-1.5" />
				Download
			</Button>
		</div>
	</div>
{/if}

