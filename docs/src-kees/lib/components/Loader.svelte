<script lang="ts">
	interface Props {
		/** Optional text to display below the spinner */
		text?: string;
		/** Size of the loader (default: 'md') */
		size?: 'sm' | 'md' | 'lg';
		/** Whether to show as a full-page overlay */
		overlay?: boolean;
	}

	let { text, size = 'md', overlay = false }: Props = $props();

	const sizeClasses = {
		sm: 'w-8 h-6',
		md: 'w-16 h-12',
		lg: 'w-24 h-18'
	};
</script>

{#if overlay}
	<div class="fixed inset-0 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm z-50">
		<div class="flex flex-col items-center gap-4">
			<span class="loader {sizeClasses[size]}"></span>
			{#if text}
				<p class="text-zinc-700 font-inter font-medium">{text}</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex flex-col items-center gap-4">
		<span class="loader {sizeClasses[size]}"></span>
		{#if text}
			<p class="text-zinc-500 font-inter">{text}</p>
		{/if}
	</div>
{/if}

<style>
	.loader {
		position: relative;
		animation: split 1s ease-in infinite alternate;
	}

	.loader::before,
	.loader::after {
		content: '';
		position: absolute;
		height: 100%;
		aspect-ratio: 1;
		border-radius: 50%;
		left: 0;
		top: 0;
		transform: translateX(-10px);
		background: #FF3D00;
		opacity: 0.75;
		backdrop-filter: blur(20px);
	}

	.loader::after {
		left: auto;
		right: 0;
		background: #18181b; /* zinc-900 */
		transform: translateX(10px);
	}

	@keyframes split {
		0%,
		25% {
			width: 100%;
		}
		100% {
			width: 231%;
		}
	}

	/* Size variants */
	.w-8 {
		width: 2rem;
	}
	.h-6 {
		height: 1.5rem;
	}
	.w-16 {
		width: 4rem;
	}
	.h-12 {
		height: 3rem;
	}
	.w-24 {
		width: 6rem;
	}
	.h-18 {
		height: 4.5rem;
	}
</style>

