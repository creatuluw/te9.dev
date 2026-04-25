<script lang="ts">
	import { goto } from '$app/navigation';
	import Drawer from './Drawer.svelte';
	import Button from './Button.svelte';
	import IconButton from './IconButton.svelte';
	import { Bookmark, ExternalLink, Trash2, Check } from 'lucide-svelte';
	import * as shortcutsService from '$lib/services/shortcutsService';
	import type { Shortcut } from '$lib/services/shortcutsService';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';

	interface Props {
		/**
		 * Whether the drawer is open
		 */
		open?: boolean;

		/**
		 * Callback when drawer closes
		 */
		onclose?: () => void;

		/**
		 * Current page title for adding shortcuts
		 */
		pageTitle?: string;

		/**
		 * Current URL for adding shortcuts
		 */
		currentUrl?: string;
	}

	let { open = $bindable(false), onclose, pageTitle = '', currentUrl = '' }: Props = $props();

	let shortcuts = $state<Shortcut[]>([]);
	let shortcutsLoading = $state(false);
	let shortcutsError = $state<string | null>(null);
	let shortcutToDelete = $state<number | null>(null);

	// Load shortcuts when drawer opens or re-opens
	$effect(() => {
		if (open) {
			loadShortcuts();
		}
	});

	async function loadShortcuts() {
		shortcutsLoading = true;
		shortcutsError = null;

		const result = await shortcutsService.getUserShortcuts();

		if (result.success) {
			shortcuts = result.value;
		} else {
			shortcutsError = getUserMessage(result.error);
			shortcuts = [];
		}

		shortcutsLoading = false;
	}

	function handleDeleteShortcut(shortcutId: number) {
		// Set confirmation state
		shortcutToDelete = shortcutId;
	}

	async function confirmDeleteShortcut(shortcutId: number) {
		const result = await shortcutsService.deleteShortcut(shortcutId);

		if (result.success) {
			toastStore.add('Snelkoppeling verwijderd', 'success');
			// Reset confirmation state
			shortcutToDelete = null;
			// Reload shortcuts
			await loadShortcuts();
		} else {
			toastStore.add(getUserMessage(result.error), 'error');
			// Reset confirmation state on error
			shortcutToDelete = null;
		}
	}

	function cancelDeleteShortcut() {
		shortcutToDelete = null;
	}

	function handleShortcutClick(url: string) {
		// Close drawer
		open = false;
		onclose?.();
		// Navigate
		goto(url);
	}
</script>

<Drawer bind:open position="left" class="w-[95vw] md:w-[66vw]" {onclose}>
	<div class="flex flex-col h-full p-6">
		<!-- Header -->
		<div class="mb-6">
			<h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">Snelkoppelingen</h2>
			<p class="text-sm text-zinc-600 mt-1">Je persoonlijke snelkoppelingen</p>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto">
			{#if shortcutsLoading}
				<div class="text-center py-12">
					<p class="text-zinc-500">Laden...</p>
				</div>
			{:else if shortcutsError}
				<div class="text-center py-12">
					<p class="text-red-600">{shortcutsError}</p>
					<Button variant="ghost" onclick={loadShortcuts} class="mt-4">
						Opnieuw proberen
					</Button>
				</div>
			{:else if shortcuts.length === 0}
				<div class="text-center py-12">
					<Bookmark class="w-12 h-12 text-zinc-300 mx-auto mb-4" />
					<p class="text-zinc-500 mb-2">Nog geen snelkoppelingen</p>
					<p class="text-sm text-zinc-400">
						Klik op het bookmark-plus icoon in de header om een snelkoppeling toe te voegen
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{#each shortcuts as shortcut (shortcut.id)}
					{@const shortcutColor = shortcut.color || '#3b82f6'}
					{@const isConfirmingDelete = shortcutToDelete === shortcut.id}
					<div
						class="flex flex-col p-3 bg-white border rounded-lg hover:bg-zinc-50 transition group relative min-h-[100px]"
						class:opacity-50={isConfirmingDelete}
						style="border-color: {shortcutColor}; border-width: 1px; border-style: dotted;"
						role="button"
						tabindex={isConfirmingDelete ? 0 : -1}
						onclick={(e) => {
							if (isConfirmingDelete && e.target === e.currentTarget) {
								cancelDeleteShortcut();
							}
						}}
						onkeydown={(e) => {
							if ((e.key === 'Enter' || e.key === ' ') && isConfirmingDelete && e.target === e.currentTarget) {
								e.preventDefault();
								cancelDeleteShortcut();
							}
						}}
					>
							<!-- Normal mode: Show shortcut content -->
							<button
								onclick={() => {
									if (!isConfirmingDelete) {
										handleShortcutClick(shortcut.url);
									}
								}}
								class="flex-1 text-left flex flex-col gap-2"
								class:pointer-events-none={isConfirmingDelete}
							>
								<div class="flex items-start gap-2">
									<Bookmark
										class="w-4 h-4 transition shrink-0 mt-0.5"
										style="color: {shortcutColor};"
									/>
									<div class="flex-1 min-w-0">
										<h3 class="text-sm font-medium text-zinc-900 line-clamp-2">
											{shortcut.title}
										</h3>
									</div>
								</div>
								<p class="text-xs text-zinc-500 truncate font-mono pl-6">
									{shortcut.url}
								</p>
							</button>

							{#if isConfirmingDelete}
								<!-- Confirmation mode: Show Check button overlay in center -->
								<div
									class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg"
								>
									<button
										onclick={() => confirmDeleteShortcut(shortcut.id)}
										class="flex items-center justify-center w-12 h-12 rounded-full transition hover:opacity-90"
										style="background-color: {shortcutColor}; color: white;"
										title="Bevestig verwijderen"
									>
										<Check class="w-6 h-6" />
									</button>
								</div>
							{:else}
								<!-- Normal mode: Show action buttons -->
								<div
									class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<a
										href={shortcut.url}
										target="_blank"
										rel="noopener noreferrer"
										onclick={(e) => e.stopPropagation()}
										class="p-1.5 text-zinc-400 hover:text-zinc-600 transition rounded hover:bg-zinc-100"
										title="Openen in nieuw tabblad"
									>
										<ExternalLink class="w-4 h-4" />
									</a>
									<IconButton
										icon={Trash2}
										variant="ghost"
										size="sm"
										tooltip="Verwijderen"
										onclick={(e) => {
											e.stopPropagation();
											handleDeleteShortcut(shortcut.id);
										}}
									/>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</Drawer>

