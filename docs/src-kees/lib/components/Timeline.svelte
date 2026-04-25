<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentType } from 'svelte';

	/**
	 * Timeline item interface
	 * 
	 * @example
	 * ```typescript
	 * const item: TimelineItem = {
	 *   id: '1',
	 *   date: '2025-01-26',
	 *   title: 'Event Title',
	 *   description: 'Event description',
	 *   highlighted: true
	 * };
	 * ```
	 */
	interface TimelineItem {
		/**
		 * Unique identifier for the timeline item
		 */
		id: string | number;
		
		/**
		 * Date string displayed in timeline
		 */
		date: string;
		
		/**
		 * Title text for the timeline item
		 */
		title: string;
		
		/**
		 * Optional description text
		 */
		description?: string;
		
		/**
		 * Optional action snippet (rendered below description)
		 */
		action?: Snippet<[item: TimelineItem]>;
		
		/**
		 * Optional badge snippet (rendered above title)
		 */
		badge?: Snippet<[item: TimelineItem]>;
		
		/**
		 * Highlight this item (blue dot instead of gray)
		 * @default false
		 */
		highlighted?: boolean;
		
		/**
		 * Array of icon actions displayed on the right side
		 */
		iconActions?: Array<{
			/**
			 * Icon component
			 */
			icon: ComponentType;
			
			/**
			 * Tooltip text for the icon
			 */
			tooltip?: string;
			
			/**
			 * Click handler for the icon
			 */
			onClick: (item: TimelineItem) => void;
		}>;
	}

	/**
	 * Timeline component props
	 * 
	 * Vertical timeline component displaying chronological events.
	 */
	interface Props {
		/**
		 * Array of timeline items to display
		 * @example
		 * ```typescript
		 * <Timeline items={[
		 *   { id: '1', date: '2025-01-01', title: 'Event 1' },
		 *   { id: '2', date: '2025-01-02', title: 'Event 2' }
		 * ]} />
		 * ```
		 */
		items: TimelineItem[];
		
		/**
		 * Optional custom content snippet (overrides default rendering)
		 * @param item - Timeline item data
		 * @param index - Item index
		 * @example
		 * ```typescript
		 * <Timeline items={items}>
		 *   {#snippet(item, index)}
		 *     <div>Custom content for {item.title}</div>
		 *   {/snippet}
		 * </Timeline>
		 * ```
		 */
		children?: Snippet<[item: TimelineItem, index: number]>;
	}

	let { items, children }: Props = $props();
</script>

<ol class="relative border-s border-zinc-200">
	{#each items as item, index (item.id)}
		<li class={index < items.length - 1 ? 'mb-4 ms-8' : 'ms-8'}>
			<div
				class="absolute w-3 h-3 rounded-full mt-3.5 -start-1.5 border border-white {item.highlighted
					? 'bg-blue-600'
					: 'bg-zinc-900'}"
			></div>
			
			<div class="hover:bg-zinc-50 transition-colors rounded-lg py-3 px-6 -ml-3 group">
				{#if children}
					{@render children(item, index)}
				{:else}
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<time class="mb-1 text-sm font-normal font-inter leading-none text-zinc-400">
								{item.date}
							</time>
							
							{#if item.badge}
								<div class="mb-2">
									{@render item.badge(item)}
								</div>
							{/if}
							
							<h3 class="text-lg font-semibold font-aspekta text-zinc-900 tracking-tight">
								{item.title}
							</h3>
							
							{#if item.description}
								<p class="mb-4 text-base font-normal font-inter text-zinc-600 leading-relaxed">
									{item.description}
								</p>
							{/if}
							
							{#if item.action}
								{@render item.action(item)}
							{/if}
						</div>
						
						{#if item.iconActions && item.iconActions.length > 0}
							<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								{#each item.iconActions as action}
									{@const ActionIcon = action.icon}
									<button
										type="button"
										onclick={() => action.onClick(item)}
										class="inline-flex items-center justify-center p-2 rounded border border-zinc-200 shadow-xs transition-colors text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
										title={action.tooltip}
									>
										<ActionIcon size={18} />
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</li>
	{/each}
</ol>

