<script lang="ts">
	interface Step {
		label: string;
		status?: 'active' | 'completed' | 'pending';
	}

	interface Props {
		/** Current progress value (0-100) */
		value?: number;
		/** Status message/description text displayed above the progress bar */
		statusText?: string;
		/** Array of step labels displayed below the progress bar */
		steps?: Step[];
		/** Whether to show the step labels (requires steps prop) */
		showSteps?: boolean;
		/** Color variant of the progress bar */
		variant?: 'default' | 'indigo' | 'blue' | 'green';
		/** Height of the progress bar */
		size?: 'sm' | 'md' | 'lg';
		/** Additional CSS classes */
		class?: string;
	}

	let {
		value = 0,
		statusText,
		steps = [],
		showSteps = false,
		variant = 'indigo',
		size = 'md',
		class: className = '',
		...restProps
	}: Props = $props();

	const heightClasses = {
		sm: 'h-1.5',
		md: 'h-2',
		lg: 'h-3'
	};

	const variantClasses = {
		default: 'bg-zinc-600',
		indigo: 'bg-indigo-600',
		blue: 'bg-blue-600',
		green: 'bg-green-600'
	};

	const stepActiveClasses = {
		default: 'text-zinc-600',
		indigo: 'text-indigo-600',
		blue: 'text-blue-600',
		green: 'text-green-600'
	};

	const progressWidth = $derived(Math.min(Math.max(value, 0), 100));
	const hasSteps = $derived(showSteps && steps.length > 0);
</script>

<div class="space-y-6 {className}" {...restProps}>
	{#if statusText}
		<div>
			<h4 class="sr-only">Status</h4>
			<p class="text-sm font-medium text-zinc-900 font-inter">{statusText}</p>
		</div>
	{/if}
	<div aria-hidden="true">
		<div class="overflow-hidden rounded-full bg-zinc-200">
			<div
				class="rounded-full {heightClasses[size]} {variantClasses[variant]} transition-all duration-300"
				style="width: {progressWidth}%"
			></div>
		</div>
		{#if hasSteps}
			<div class="mt-6 hidden text-sm font-medium text-zinc-600 sm:grid font-inter" style="grid-template-columns: repeat({steps.length}, 1fr);">
				{#each steps as step, index}
					{@const stepStatus = step.status || (index < Math.floor((progressWidth / 100) * steps.length) ? 'completed' : index === Math.floor((progressWidth / 100) * steps.length) ? 'active' : 'pending')}
					<div
						class:text-left={index === 0}
						class:text-center={index > 0 && index < steps.length - 1}
						class:text-right={index === steps.length - 1}
						class:text-zinc-600={stepStatus === 'pending'}
						class={stepStatus === 'active' || stepStatus === 'completed' ? stepActiveClasses[variant] : ''}
					>
						{step.label}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

