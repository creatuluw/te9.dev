<script lang="ts">
	import { onMount } from 'svelte';

	/****
	 * Accordion item interface
	 * 
	 * @example
	 * ```typescript
	 * const item: AccordionItem = {
	 *   id: 'faq-1',
	 *   title: 'What is this?',
	 *   content: 'This is an explanation...'
	 * };
	 * ```
	 */
	export interface AccordionItem {
		/**
		 * Unique identifier for the accordion item
		 */
		id: string;
		
		/**
		 * Title text displayed in the accordion header
		 */
		title: string;
		
		/**
		 * Content text displayed when item is expanded
		 */
		content: string;
	}

	/**
	 * Accordion component props
	 * 
	 * Collapsible content component that allows expanding/collapsing items.
	 */
	interface Props {
		/**
		 * Array of accordion items to display
		 * @example
		 * ```typescript
		 * <Accordion items={[
		 *   { id: '1', title: 'Question 1', content: 'Answer 1' },
		 *   { id: '2', title: 'Question 2', content: 'Answer 2' }
		 * ]} />
		 * ```
		 */
		items: AccordionItem[];
		
		/**
		 * Allow multiple items to be open simultaneously
		 * @default true
		 */
		allowMultiple?: boolean;
		
		/**
		 * Array of item IDs that should be open by default
		 * @default []
		 * @example
		 * ```typescript
		 * <Accordion defaultOpen={['faq-1']} items={items} />
		 * ```
		 */
		defaultOpen?: string[];
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		items,
		allowMultiple = true,
		defaultOpen = [],
		class: className = ''
	}: Props = $props();

	let openItems = $state<Set<string>>(new Set(defaultOpen));

	function toggleItem(id: string) {
		if (allowMultiple) {
			if (openItems.has(id)) {
				openItems.delete(id);
			} else {
				openItems.add(id);
			}
			openItems = new Set(openItems); // Trigger reactivity
		} else {
			// Close all other items and toggle current
			if (openItems.has(id)) {
				openItems = new Set();
			} else {
				openItems = new Set([id]);
			}
		}
	}

	function handleKeydown(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleItem(id);
		}
	}

	function handleClick(event: MouseEvent, id: string) {
		toggleItem(id);
		// Blur the button to remove focus ring after mouse click
		if (event.currentTarget instanceof HTMLElement) {
			event.currentTarget.blur();
		}
	}
</script>

	<div class="space-y-2 {className}">
	{#each items as item}
		<div class="rounded-md overflow-hidden {openItems.has(item.id) ? '' : 'border border-zinc-200'} transition-all duration-200">
			<button
				type="button"
				onclick={(e) => handleClick(e, item.id)}
				onkeydown={(e) => handleKeydown(e, item.id)}
				class="w-full px-4 py-3 text-left flex items-center justify-between text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition focus:outline-none"
				aria-expanded={openItems.has(item.id)}
				aria-controls={`accordion-content-${item.id}`}
			>
				<span>{item.title}</span>
				<svg
					class="w-5 h-5 text-zinc-500 transition-transform"
					class:rotate-180={openItems.has(item.id)}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			<div
				id={`accordion-content-${item.id}`}
				class="overflow-hidden transition-all duration-200"
				class:max-h-0={!openItems.has(item.id)}
				class:max-h-[1000px]={openItems.has(item.id)}
			>
				<div class="px-4 py-3 text-sm text-zinc-600 {openItems.has(item.id) ? '' : 'border-t border-zinc-100'}">
					{item.content}
				</div>
			</div>
		</div>
	{/each}
</div>

