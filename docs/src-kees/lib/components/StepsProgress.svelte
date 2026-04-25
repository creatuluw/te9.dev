<script lang="ts">
	/**
	 * Step interface for progress indicator
	 * 
	 * @example
	 * ```typescript
	 * const step: Step = {
	 *   label: 'Step 1',
	 *   href: '/step1',
	 *   onclick: (e, i) => navigateToStep(i)
	 * };
	 * ```
	 */
	export interface Step {
		/**
		 * Step label (displayed in screen reader and below progress bar)
		 */
		label: string;
		
		/**
		 * Optional href for navigation (makes step clickable)
		 */
		href?: string;
		
		/**
		 * Optional click handler
		 * @param event - Mouse event
		 * @param index - Step index (0-based)
		 */
		onclick?: (event: MouseEvent, index: number) => void;
	}

	/**
	 * StepsProgress component props
	 * 
	 * Step-by-step progress indicator component with clickable steps.
	 */
	interface Props {
		/**
		 * Array of steps to display
		 * @example
		 * ```typescript
		 * <StepsProgress 
		 *   steps={[
		 *     { label: 'Step 1', href: '/step1' },
		 *     { label: 'Step 2', href: '/step2' },
		 *     { label: 'Step 3' }
		 *   ]}
		 *   currentStep={1}
		 * />
		 * ```
		 */
		steps: Step[];
		
		/**
		 * Current step index (0-based)
		 * @default 0
		 */
		currentStep?: number;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		steps,
		currentStep = 0,
		class: className = ''
	}: Props = $props();

	/**
	 * Determine step state: completed, current, or upcoming
	 */
	function getStepState(index: number): 'completed' | 'current' | 'upcoming' {
		if (index < currentStep) return 'completed';
		if (index === currentStep) return 'current';
		return 'upcoming';
	}

	/**
	 * Check if connecting line should be active (completed)
	 */
	function isLineCompleted(index: number): boolean {
		return index < currentStep;
	}

	function handleClick(event: MouseEvent, step: Step, index: number) {
		if (step.onclick) {
			step.onclick(event, index);
		}
		// If href is provided and no custom onclick, let default navigation happen
		// Otherwise prevent default if no href
		if (!step.href && step.onclick) {
			event.preventDefault();
		}
	}
</script>

<nav aria-label="Progress" class="{className}">
	<ol role="list" class="flex items-center">
		{#each steps as step, index}
			{@const stepState = getStepState(index)}
			{@const isLast = index === steps.length - 1}
			{@const lineCompleted = isLineCompleted(index)}
			
			<li class="relative {isLast ? '' : 'pr-8 sm:pr-20'}">
				<!-- Connecting Line -->
				<div aria-hidden="true" class="absolute inset-0 flex items-center">
					<div class="h-0.5 w-full {lineCompleted ? 'bg-zinc-600' : 'bg-zinc-200'}"></div>
				</div>

				{#if stepState === 'completed'}
					<!-- Completed Step -->
					<a
						href={step.href || '#'}
						onclick={(e) => handleClick(e, step, index)}
						class="relative flex size-8 items-center justify-center rounded-full bg-zinc-600 hover:bg-zinc-900 {step.href || step.onclick ? 'cursor-pointer' : 'cursor-default'}"
					>
						<svg
							viewBox="0 0 20 20"
							fill="currentColor"
							data-slot="icon"
							aria-hidden="true"
							class="size-5 text-white"
						>
							<path
								d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
								clip-rule="evenodd"
								fill-rule="evenodd"
							/>
						</svg>
						<span class="sr-only">{step.label}</span>
					</a>
				{:else if stepState === 'current'}
					<!-- Current Step -->
					<a
						href={step.href || '#'}
						onclick={(e) => handleClick(e, step, index)}
						aria-current="step"
						class="relative flex size-8 items-center justify-center rounded-full border-2 border-zinc-600 bg-white {step.href || step.onclick ? 'cursor-pointer' : 'cursor-default'}"
					>
						<span aria-hidden="true" class="size-2.5 rounded-full bg-zinc-600"></span>
						<span class="sr-only">{step.label}</span>
					</a>
				{:else}
					<!-- Upcoming Step -->
					<a
						href={step.href || '#'}
						onclick={(e) => handleClick(e, step, index)}
						class="group relative flex size-8 items-center justify-center rounded-full border-2 border-zinc-300 bg-white hover:border-zinc-400 {step.href || step.onclick ? 'cursor-pointer' : 'cursor-default'}"
					>
						<span
							aria-hidden="true"
							class="size-2.5 rounded-full bg-transparent group-hover:bg-zinc-300"
						></span>
						<span class="sr-only">{step.label}</span>
					</a>
				{/if}
			</li>
		{/each}
	</ol>
</nav>


