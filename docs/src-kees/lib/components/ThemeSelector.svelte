<script lang="ts">
	import { themeState, setTheme, getAvailableThemes } from '$lib/stores/themeStore.svelte';
	import type { ThemeId } from '$lib/types/theme';

	let showDropdown = $state(false);
	
	// Direct reactive access - no subscribe needed!
	const currentTheme = $derived(themeState.currentTheme);
	const availableThemes = $derived(getAvailableThemes());

	function handleThemeSelect(themeId: ThemeId) {
		setTheme(themeId);
		showDropdown = false;
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.theme-selector-dropdown')) {
			showDropdown = false;
		}
	}

	// Close dropdown on outside click
	if (typeof window !== 'undefined') {
		window.addEventListener('click', handleClickOutside);
	}
</script>

	<div class="theme-selector-dropdown relative">
	<button
		type="button"
		onclick={toggleDropdown}
		aria-label="Select theme"
		aria-expanded={showDropdown}
		aria-haspopup="true"
		class="text-sm font-medium px-3 py-2 flex items-center gap-2 transition rounded-md"
		style="color: var(--theme-text-secondary);"
		onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-surface)'}
		onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
	>
		<span class="hidden sm:inline">Thema</span>
		<span class="text-xs opacity-75">{currentTheme}</span>
	</button>

	{#if showDropdown}
		<div
			role="menu"
			class="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50"
			style="background-color: var(--theme-background); border: 1px solid var(--theme-border);"
		>
			{#each availableThemes as theme}
				<button
					type="button"
					role="menuitem"
					onclick={() => handleThemeSelect(theme.id)}
					class="w-full text-left px-4 py-2 text-sm transition flex items-center justify-between {currentTheme === theme.id ? 'font-medium' : ''}"
					style="color: {currentTheme === theme.id ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)'}; background-color: {currentTheme === theme.id ? 'var(--theme-surface)' : 'transparent'};"
					onmouseenter={(e) => {
						if (currentTheme !== theme.id) {
							e.currentTarget.style.backgroundColor = 'var(--theme-surface)';
						}
					}}
					onmouseleave={(e) => {
						if (currentTheme !== theme.id) {
							e.currentTarget.style.backgroundColor = 'transparent';
						}
					}}
				>
					<span>{theme.name}</span>
					{#if currentTheme === theme.id}
						<span class="text-xs">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

