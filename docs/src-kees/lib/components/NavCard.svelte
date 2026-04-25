<script lang="ts">
	import type { ComponentType } from 'svelte';
	import type { Snippet } from 'svelte';
	import IconButton from './IconButton.svelte';
	import Label from './Label.svelte';

	/**
	 * Navigation card action interface
	 */
	interface Action {
		/**
		 * Icon component for the action button
		 */
		icon: ComponentType;
		
		/**
		 * Tooltip label for the action
		 */
		label: string;
		
		/**
		 * Click handler for the action
		 */
		onclick: () => void;
		
		/**
		 * Button variant style
		 * @default 'ghost'
		 */
		variant?: 'default' | 'ghost' | 'danger';
		
		/**
		 * Badge count to display on the action button
		 * @default undefined (no badge)
		 */
		badgeCount?: number;
	}

	/**
	 * Badge data interface
	 */
	interface Badge {
		/**
		 * Number of items
		 */
		count: number;
		
		/**
		 * Total hours
		 */
		hours: number;
	}

	/**
	 * NavCard component props
	 * 
	 * Navigation card component with title and action buttons.
	 */
	interface Props {
		/**
		 * Card title text
		 */
		title: string;
		
		/**
		 * Array of action buttons displayed in header
		 * @example
		 * ```typescript
		 * <NavCard 
		 *   title="Settings"
		 *   actions={[
		 *     { icon: Edit, label: 'Edit', onclick: () => edit() },
		 *     { icon: Delete, label: 'Delete', onclick: () => delete(), variant: 'danger' }
		 *   ]}
		 * />
		 * ```
		 */
		actions: Action[];
		
	/**
	 * Optional badge to display next to title (count and hours)
	 */
	badge?: Badge;
	
	/**
	 * Optional subtitle/description to display after title
	 */
	subtitle?: string;
	
	/**
	 * Additional CSS classes
	 */
	class?: string;
	
	/**
	 * Optional children content to display below the header
	 */
	children?: Snippet;
	
	/**
	 * Optional header content to display in the header row (between title and actions)
	 * Use with: {#snippet headerContent()}...{/snippet}
	 */
	headerContent?: Snippet;
	
	/**
	 * Optional trailing content to display after the actions (at the very end)
	 * Use with: {#snippet trailingContent()}...{/snippet}
	 */
	trailingContent?: Snippet;
	
	/**
	 * Hide the title element (useful when using headerContent to replace it)
	 * @default false
	 */
	hideTitle?: boolean;
	}

	let {
		title,
		actions,
		badge,
		subtitle,
		class: className = '',
		children,
		headerContent,
		trailingContent,
		hideTitle = false
	}: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 {className}">
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			{#if !hideTitle}
				<h3 class="text-lg font-semibold text-zinc-900">{title}</h3>
			{/if}
			{#if headerContent && hideTitle}
				{@render headerContent()}
			{/if}
			{#if subtitle}
				<span class="w-1 h-1 rounded-full bg-zinc-400"></span>
				<span class="text-sm font-normal text-zinc-600">{subtitle}</span>
			{/if}
			{#if badge}
				<Label variant="default">
					{badge.count} • {badge.hours}u
				</Label>
			{/if}
		</div>
		<div class="flex items-center gap-2 flex-1 justify-end">
			{#if headerContent && !hideTitle}
				{@render headerContent()}
			{/if}
			{#each actions as action}
				<div class="relative">
					<IconButton
						icon={action.icon}
						variant={action.variant || 'ghost'}
						onclick={action.onclick}
						tooltip={action.label}
					/>
					{#if action.badgeCount !== undefined && action.badgeCount > 0}
						<span class="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-orange-500 rounded-full">
							{action.badgeCount > 9 ? '9+' : action.badgeCount}
						</span>
					{/if}
				</div>
			{/each}
			{#if trailingContent}
				{@render trailingContent()}
			{/if}
		</div>
	</div>
	{#if children}
		<div class="mt-4 pt-4 border-t border-zinc-200">
			{@render children()}
		</div>
	{/if}
</div>














