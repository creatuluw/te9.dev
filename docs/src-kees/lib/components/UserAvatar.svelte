<script lang="ts">
	import { formatUserName } from '$lib/utils/userUtils';
	import type { PocketBaseUser } from '$lib/services/pocketbaseService';

	/**
	 * UserAvatar component props
	 * 
	 * Displays user avatar with initials and optionally shows user name.
	 */
	let { 
		/**
		 * User object (null renders placeholder 'X')
		 */
		user,
		
		/**
		 * Avatar size
		 * @default 'md'
		 */
		size = 'md',
		
		/**
		 * Show user name next to avatar
		 * @default false
		 */
		showName = false,
		
		/**
		 * Whether this item is ad-hoc (applies red styling)
		 * @default false
		 */
		isAdHoc = false,
		
		/**
		 * Tooltip text to display on hover
		 */
		title = '',
		
		/**
		 * Additional CSS classes for the container
		 */
		class: className = '',
		
		/**
		 * Additional CSS classes for the name text
		 */
		nameClass = ''
	}: {
		user: PocketBaseUser | null;
		size?: 'xs' | 'sm' | 'md' | 'lg';
		showName?: boolean;
		isAdHoc?: boolean;
		title?: string;
		class?: string;
		nameClass?: string;
	} = $props();

	const sizeClasses = {
		xs: 'w-5 h-5 text-[10px]',
		sm: 'w-6 h-6 text-xs',
		md: 'w-8 h-8 text-sm',
		lg: 'w-12 h-12 text-base'
	};

	const displayName = $derived(user ? formatUserName(user) : 'X');
	const initials = $derived.by(() => {
		if (!user) return 'X';
		const name = user.name || user.username || '';
		if (name) {
			const parts = name.split(' ');
			if (parts.length > 1) {
				return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
			}
			return name.substring(0, 2).toUpperCase();
		}
		return (user.email || 'X').substring(0, 1).toUpperCase();
	});
</script>

<div class="flex items-center gap-2 {className}">
	<div
		class="flex items-center justify-center rounded-full font-medium {sizeClasses[size]}"
		class:bg-red-500={isAdHoc}
		class:text-white={isAdHoc}
		class:bg-zinc-200={!isAdHoc}
		class:text-zinc-700={!isAdHoc}
		title={title || undefined}
	>
		{initials}
	</div>
	{#if showName && user}
		<span class="text-sm text-zinc-900 {nameClass}">{displayName}</span>
	{/if}
</div>

