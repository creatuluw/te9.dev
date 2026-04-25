<script lang="ts">
	import { Button, Modal } from '$lib/components';
	import { ExternalLink } from 'lucide-svelte';
	import type { Employee } from '$lib/schemas/employee';

	interface Props {
		open?: boolean;
		typebotName?: string;
		typebotUrl?: string;
		selectedEmployees?: Employee[];
		onclose?: () => void;
		onsend?: (data: { subject: string; message: string }) => void;
	}

	let {
		open: isOpen = $bindable(false),
		typebotName = '',
		typebotUrl = '',
		selectedEmployees = [],
		onclose,
		onsend,
	}: Props = $props();

	let subject = $state(`Invulformulier: ${typebotName}`);
	let message = $state(`Beste collega,\n\nJe ontvangt deze e-mail omdat je bent geselecteerd om het volgende formulier in te vullen: ${typebotName}\n\nKlik op de onderstaande link om het formulier te openen.\n\nMet vriendelijke groet`);

	// Update subject when typebot name changes
	$effect(() => {
		if (typebotName) {
			subject = `Invulformulier: ${typebotName}`;
		}
	});

	function handleSend() {
		if (!subject.trim() || !message.trim()) {
			return;
		}
		onsend?.({ subject, message });
		closeModal();
	}

	function closeModal() {
		isOpen = false;
		onclose?.();
	}

	function openPreview() {
		if (typebotUrl) {
			window.open(typebotUrl, '_blank');
		}
	}

	const employeeCount = $derived(selectedEmployees.length);
</script>

<Modal open={isOpen} title="E-mail opstellen" size="lg" onclose={closeModal}>
	<div class="space-y-4">
		<!-- Info -->
		<div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
			<p class="text-sm text-zinc-700">
				<strong>{employeeCount}</strong> medewerker{employeeCount !== 1 ? 's' : ''} geselecteerd
			</p>
			{#if typebotUrl}
				<div class="mt-2 flex items-center gap-2">
					<span class="text-sm text-zinc-600">Preview link:</span>
					<a
						href={typebotUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-blue-600 hover:underline flex items-center gap-1"
					>
						{typebotUrl}
						<ExternalLink class="h-3 w-3" />
					</a>
				</div>
			{/if}
		</div>

		<!-- Subject -->
		<div>
			<label for="email-subject" class="block text-sm font-medium text-zinc-900 mb-1">
				Onderwerp
			</label>
			<input
				id="email-subject"
				type="text"
				bind:value={subject}
				class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent"
				placeholder="E-mail onderwerp"
			/>
		</div>

		<!-- Message -->
		<div>
			<label for="email-message" class="block text-sm font-medium text-zinc-900 mb-1">
				Bericht
			</label>
			<textarea
				id="email-message"
				bind:value={message}
				rows="8"
				class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent font-inter"
				placeholder="E-mail bericht (de link wordt automatisch toegevoegd)"
			></textarea>
			<p class="mt-1 text-xs text-zinc-500">
				De link naar het formulier wordt automatisch aan het einde van het bericht toegevoegd.
			</p>
		</div>

		<!-- Preview link info -->
		{#if typebotUrl}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
				<p class="text-sm text-blue-900">
					<strong>Let op:</strong> Elke medewerker ontvangt een gepersonaliseerde link met hun e-mailadres en reset parameter.
				</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
			<Button variant="secondary" onclick={closeModal}>Annuleren</Button>
			{#if typebotUrl}
				<Button variant="outline" onclick={openPreview}>
					Preview
					<ExternalLink class="h-4 w-4 ml-2" />
				</Button>
			{/if}
			<Button onclick={handleSend} disabled={!subject.trim() || !message.trim()}>
				Versturen ({employeeCount})
			</Button>
		</div>
	</div>
</Modal>

