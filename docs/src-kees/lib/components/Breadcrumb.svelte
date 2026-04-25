<script lang="ts">
	import type { BreadcrumbItem } from './Breadcrumb.types';
	
	/**
	 * Breadcrumb component props
	 * 
	 * Navigation breadcrumb component displaying hierarchical path with separators.
	 */
	let { 
		/**
		 * Array of breadcrumb items to display
		 * @default []
		 * @example
		 * ```typescript
		 * <Breadcrumb items={[
		 *   { label: 'Home', href: '/' },
		 *   { label: 'Cases', href: '/cases' },
		 *   { label: 'Case Details' } // Current page (no href)
		 * ]} />
		 * ```
		 */
		items = [] as BreadcrumbItem[],
		
		/**
		 * Optional user name to display on the right side
		 * @default undefined
		 * @example
		 * ```typescript
		 * <Breadcrumb items={items} userName="John Doe" />
		 * ```
		 */
		userName = undefined as string | undefined
	} = $props();
</script>

{#if items.length > 0}
	<div class="w-full bg-gradient-to-b from-zinc-50 to-zinc-100/50 border-b border-zinc-200">
		<div class="w-full">
			<nav class="py-1 px-4 flex items-center justify-between" aria-label="Breadcrumb">
				<ol class="flex items-center gap-1 text-xs">
					{#each items as item, index}
						<li class="flex items-center gap-1">
							{#if index > 0}
								<svg class="w-3 h-3 fill-zinc-400" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.6 13.4L5.2 12l4-4-4-4 1.4-1.4L12 8z"/>
								</svg>
							{/if}
							
							{#if item.href && index < items.length - 1}
								<a 
									href={item.href} 
									class="text-zinc-500 hover:text-zinc-900 transition font-medium"
								>
									{item.label}
								</a>
							{:else}
								<span class="text-zinc-900 font-medium">
									{item.label}
								</span>
							{/if}
						</li>
					{/each}
				</ol>
				
				{#if userName}
					<div class="text-xs text-zinc-600 font-medium">
						{userName}
					</div>
				{/if}
			</nav>
		</div>
	</div>
{/if}
