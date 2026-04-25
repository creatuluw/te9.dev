<script lang="ts">
	import Button from './Button.svelte';
	import { Bookmark } from 'lucide-svelte';
	import * as shortcutsService from '$lib/services/shortcutsService';
	import { generateRandomColor } from '$lib/services/shortcutsService';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';

	/**
	 * AddShortcutModal component props
	 */
	interface Props {
		/**
		 * Whether the modal is open
		 */
		open?: boolean;

		/**
		 * Current page title
		 */
		pageTitle: string;

		/**
		 * Current URL
		 */
		currentUrl: string;

		/**
		 * Callback when modal closes
		 */
		onclose?: () => void;

		/**
		 * Callback to open shortcuts drawer
		 */
		onopenShortcutsDrawer?: () => void;
	}

	let {
		open: isOpen = $bindable(false),
		pageTitle,
		currentUrl,
		onclose,
		onopenShortcutsDrawer
	}: Props = $props();

	let shortcutTitle = $state(pageTitle);
	let shortcutUrl = $state(currentUrl);
	let shortcutColor = $state(generateRandomColor());
	let saving = $state(false);

	// Update title and URL when props change
	$effect(() => {
		if (isOpen) {
			shortcutTitle = pageTitle;
			shortcutUrl = currentUrl;
			// Generate new random color each time modal opens
			shortcutColor = generateRandomColor();
		}
	});

	async function handleSave() {
		if (!shortcutTitle.trim() || !shortcutUrl.trim()) {
			toastStore.add('Titel en URL zijn verplicht', 'error');
			return;
		}

		saving = true;
		const result = await shortcutsService.addShortcut({
			title: shortcutTitle.trim(),
			url: shortcutUrl.trim(),
			color: shortcutColor
		});

		if (result.success) {
			toastStore.add('Snelkoppeling toegevoegd', 'success');
			isOpen = false;
			onclose?.();
		} else {
			toastStore.add(getUserMessage(result.error), 'error');
		}
		saving = false;
	}

	function handleOpenShortcutsDrawer() {
		isOpen = false;
		onclose?.();
		onopenShortcutsDrawer?.();
	}
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<label for="shortcut-title" class="block text-sm font-medium text-zinc-900">
			Titel <span class="text-red-500">*</span>
		</label>
		<input
			id="shortcut-title"
			type="text"
			bind:value={shortcutTitle}
			placeholder="bijv. Mijn Backlog"
			disabled={saving}
			class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm"
		/>
	</div>

	<div class="space-y-2">
		<label for="shortcut-url" class="block text-sm font-medium text-zinc-900">
			URL <span class="text-red-500">*</span>
		</label>
		<input
			id="shortcut-url"
			type="text"
			bind:value={shortcutUrl}
			placeholder="/work/backlog"
			disabled={saving}
			class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-mono"
		/>
		<p class="text-xs text-zinc-500">
			De URL van de huidige pagina. Je kunt deze aanpassen indien nodig.
		</p>
	</div>

	<div class="space-y-2">
		<label for="shortcut-color" class="block text-sm font-medium text-zinc-900">
			Kleur
		</label>
		<div class="flex items-center gap-3">
			<input
				id="shortcut-color"
				type="color"
				bind:value={shortcutColor}
				disabled={saving}
				class="w-16 h-10 border border-zinc-300 rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			/>
			<input
				type="text"
				bind:value={shortcutColor}
				placeholder="#3b82f6"
				disabled={saving}
				class="flex-1 px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-mono"
			/>
		</div>
		<p class="text-xs text-zinc-500">
			Kies een kleur voor de snelkoppeling. De kleur wordt gebruikt voor de border en het icoon.
		</p>
	</div>

	<div class="pt-4 border-t border-zinc-200 flex items-center justify-between">
		<button
			type="button"
			onclick={handleOpenShortcutsDrawer}
			class="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={saving}
			title="Bekijk alle snelkoppelingen"
		>
			<Bookmark class="w-4 h-4" />
		</button>

		<div class="flex gap-3">
			<Button
				variant="ghost"
				onclick={() => {
					isOpen = false;
					onclose?.();
				}}
				disabled={saving}
			>
				Annuleren
			</Button>
			<Button
				variant="default"
				onclick={handleSave}
				disabled={saving || !shortcutTitle.trim() || !shortcutUrl.trim()}
			>
				{saving ? 'Opslaan...' : 'Toevoegen'}
			</Button>
		</div>
	</div>
</div>

