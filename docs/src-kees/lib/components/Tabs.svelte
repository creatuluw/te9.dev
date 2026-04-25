<script lang="ts">
	import type { Snippet } from 'svelte';
	
	/**
	 * Tab item interface
	 * 
	 * @example
	 * ```typescript
	 * const tab: TabItem = {
	 *   id: 'settings',
	 *   label: 'Settings'
	 * };
	 * ```
	 */
export interface TabItem {
	/**
	 * Unique identifier for the tab
	 */
	id: string;
	
	/**
	 * Display label for the tab
	 */
	label: string;
	
	/**
	 * Optional badge count to display next to the label
	 */
	badgeCount?: number;
}

	/**
	 * Tabs component props
	 * 
	 * Tab navigation component with slot-based content rendering.
	 */
	interface Props {
		/**
		 * Array of tab items to display
		 * @example
		 * ```typescript
		 * <Tabs tabs={[
		 *   { id: 'tab1', label: 'Tab 1' },
		 *   { id: 'tab2', label: 'Tab 2' }
		 * ]}>
		 *   {#snippet children({ activeTab })}
		 *     Content for tab {activeTab}
		 *   {/snippet}
		 * </Tabs>
		 * ```
		 */
		tabs: TabItem[];
		
	/**
	 * Default active tab ID (uses first tab if not provided)
	 */
	defaultTab?: string;
	
	/**
	 * Controlled active tab ID (if provided, component becomes controlled)
	 */
	activeTab?: string;
	
	/**
	 * Additional CSS classes
	 */
	class?: string;
	
	/**
	 * Children snippet
	 */
	children?: Snippet<[{ activeTab: string }]>;
	
	/**
	 * Callback fired when active tab changes
	 * @param tabId - ID of the newly active tab
	 * @example
	 * ```typescript
	 * <Tabs 
	 *   tabs={tabs}
	 *   ontabchange={(id) => console.log('Switched to:', id)}
	 * />
	 * ```
	 */
	ontabchange?: (tabId: string) => void;
}

let {
	tabs,
	defaultTab,
	activeTab: controlledActiveTab,
	class: className = '',
	children,
	ontabchange
}: Props = $props();

let internalActiveTab = $state(controlledActiveTab || defaultTab || tabs[0]?.id || '');

// Use controlled tab if provided, otherwise use internal state
const activeTab = $derived(controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab);

// Sync internal state when controlled value changes
$effect(() => {
	if (controlledActiveTab !== undefined) {
		internalActiveTab = controlledActiveTab;
	} else if (defaultTab) {
		internalActiveTab = defaultTab;
	}
});

function switchTab(tabId: string) {
	if (controlledActiveTab === undefined) {
		internalActiveTab = tabId;
	}
	ontabchange?.(tabId);
}
</script>

<div class={className}>
	<div class="border-b border-zinc-200 flex-shrink-0 relative">
		<nav class="-mb-px flex space-x-8 relative z-10" aria-label="Tabs">
			{#each tabs as tab}
				<button
					type="button"
					onclick={() => switchTab(tab.id)}
					class="whitespace-nowrap py-4 px-1 border-b font-medium text-sm transition relative flex items-center gap-2"
					class:border-zinc-900={activeTab === tab.id}
					class:text-zinc-900={activeTab === tab.id}
					class:border-transparent={activeTab !== tab.id}
					class:text-zinc-500={activeTab !== tab.id}
					class:hover:text-zinc-900={activeTab !== tab.id}
					class:hover:border-zinc-300={activeTab !== tab.id}
					class:z-20={activeTab === tab.id}
					aria-current={activeTab === tab.id ? 'page' : undefined}
				>
					<span>{tab.label}</span>
					{#if tab.badgeCount !== undefined && tab.badgeCount > 0}
						<span class="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-orange-500 rounded-full">
							{tab.badgeCount > 9 ? '9+' : tab.badgeCount}
						</span>
					{/if}
				</button>
			{/each}
		</nav>
	</div>
	<div class="flex-1 flex flex-col min-h-0 pt-6">
		{@render children?.({ activeTab })}
	</div>
</div>

