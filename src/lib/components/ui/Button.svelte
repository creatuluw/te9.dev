<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface ButtonProps extends HTMLAnchorAttributes {
		variant: 'primary' | 'secondary';
		href: string;
		text: string;
		icon?: string;
		target?: string;
		rel?: string;
	}

	let {
		variant,
		href,
		text,
		icon,
		target,
		rel,
		...restProps
	}: ButtonProps = $props();
</script>

<a
	{href}
	{target}
	{rel}
	class={`btn btn-{variant}`}
	{...restProps}
>
	<span class="btn-text">{text}</span>
	{#if icon}
		<span class="btn-icon">{icon}</span>
	{/if}
</a>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-family: 'Lekton', monospace;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		border-radius: 4px;
		transition: all 0.3s ease;
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.btn-primary {
		background: transparent;
		color: #e8e8e8;
		border: 1px solid #ff9500;
	}

	.btn-primary::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 149, 0, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.btn-primary:hover::before {
		left: 100%;
	}

	.btn-primary:hover {
		background: rgba(255, 149, 0, 0.1);
		border-color: #ff9500;
		color: #ff9500;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
	}

	.btn-secondary {
		background: transparent;
		color: #888888;
		border: 1px solid #2a2a2a;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: #3a3a3a;
		color: #e8e8e8;
	}

	.btn-text {
		position: relative;
		z-index: 1;
	}

	.btn-icon {
		position: relative;
		z-index: 1;
		transition: transform 0.3s ease;
	}

	.btn-primary:hover .btn-icon {
		transform: translateX(4px);
	}
</style>
