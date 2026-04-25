<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button, ToastContainer } from '$lib/components';
	import { ArrowLeft, Loader2, Mail, Search, Check, ExternalLink } from 'lucide-svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import * as typebotService from '$lib/services/typebotService';
	import * as employeeService from '$lib/services/employeeService';
	import type { Typebot } from '$lib/schemas/typebot';
	import type { Employee } from '$lib/schemas/employee';

	let typebot = $state<Typebot | null>(null);
	let employees = $state<Employee[]>([]);
	let selectedEmployeeIds = $state<Array<string | number>>([]);
	let searchTerm = $state('');
	let subject = $state('');
	let message = $state('');
	let loading = $state(true);
	let loadingEmployees = $state(false);
	let sending = $state(false);
	let error = $state<string | null>(null);

	const viewerUrl = 'https://viewer-production-a3fa.up.railway.app';
	const previewUrl = $derived.by(() => {
		if (!typebot?.publicId) return null;
		return `${viewerUrl}/${typebot.publicId}`;
	});

	onMount(async () => {
		await loadTypebot();
		await loadEmployees();
	});

	async function loadTypebot() {
		const typebotId = $page.url.searchParams.get('id');
		if (!typebotId) {
			error = 'Geen typebot ID opgegeven';
			toastStore.add('Geen typebot ID opgegeven', 'error');
			loading = false;
			return;
		}

		loading = true;
		navigationStore.startPageLoading();
		error = null;

		const result = await typebotService.getTypebotById(typebotId);

		if (result.success) {
			typebot = result.value;
			if (!typebot.publicId) {
				error = 'Deze typebot heeft geen public ID en kan niet worden gedeeld';
				toastStore.add('Deze typebot heeft geen public ID en kan niet worden gedeeld', 'error');
			} else {
				// Initialize email subject and message
				subject = `Invulformulier: ${typebot.name}`;
				message = `Beste collega,\n\nJe ontvangt deze e-mail omdat je bent geselecteerd om het volgende formulier in te vullen: ${typebot.name}\n\nKlik op de onderstaande link om het formulier te openen.\n\nMet vriendelijke groet, \n\n Team Hoi Pippeloi`;
			}
		} else {
			error = result.error ? getUserMessage(result.error) : 'Kon typebot niet laden';
			toastStore.add(error, 'error');
		}

		loading = false;
		navigationStore.stopPageLoading();
	}

	async function loadEmployees() {
		loadingEmployees = true;
		const result = await employeeService.getAllEmployees();
		if (result.success) {
			// Sort employees by user_id (treating both string and number IDs)
			employees = result.value.sort((a, b) => {
				const aId = typeof a.user_id === 'number' ? a.user_id : parseInt(String(a.user_id || 0), 10);
				const bId = typeof b.user_id === 'number' ? b.user_id : parseInt(String(b.user_id || 0), 10);
				return aId - bId;
			});
		} else {
			toastStore.add('Kon medewerkers niet laden', 'error');
		}
		loadingEmployees = false;
	}

	function goBack() {
		const typebotId = $page.url.searchParams.get('id');
		if (typebotId) {
			goto(`/tools/typebot?id=${typebotId}`, { replaceState: false });
		} else {
			goto('/tools/typebot', { replaceState: false });
		}
	}

	// Filter employees based on search and sort by ID
	const filteredEmployees = $derived.by(() => {
		let filtered = employees;
		
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = employees.filter(
				(emp) =>
					(emp.fullname || emp.name || '').toLowerCase().includes(term) ||
					(emp.hoi_email || emp.email || emp.email_value || '').toLowerCase().includes(term)
			);
		}
		
		// Sort by user_id (treating both string and number IDs) - create new array to avoid mutation
		return [...filtered].sort((a, b) => {
			const aId = typeof a.user_id === 'number' ? a.user_id : parseInt(String(a.user_id || 0), 10);
			const bId = typeof b.user_id === 'number' ? b.user_id : parseInt(String(b.user_id || 0), 10);
			return aId - bId;
		});
	});

	const selectedCount = $derived(selectedEmployeeIds.length);
	const selectedEmployees = $derived.by(() =>
		employees.filter((emp) => emp.user_id !== undefined && selectedEmployeeIds.includes(emp.user_id))
	);
	const allSelected = $derived.by(() => {
		if (filteredEmployees.length === 0) return false;
		return filteredEmployees.every((emp) => emp.user_id !== undefined && selectedEmployeeIds.includes(emp.user_id));
	});
	const someSelected = $derived.by(() => {
		if (allSelected) return false;
		return filteredEmployees.some((emp) => emp.user_id !== undefined && selectedEmployeeIds.includes(emp.user_id));
	});

	function toggleEmployee(userId: string | number | undefined) {
		if (userId === undefined || userId === null) return;
		const index = selectedEmployeeIds.indexOf(userId);
		if (index >= 0) {
			selectedEmployeeIds = selectedEmployeeIds.filter((id) => id !== userId);
		} else {
			selectedEmployeeIds = [...selectedEmployeeIds, userId];
		}
	}

	function toggleSelectAll() {
		if (allSelected) {
			// Deselect all filtered
			const filteredIds = filteredEmployees.map((emp) => emp.user_id).filter((id): id is string | number => id !== undefined);
			selectedEmployeeIds = selectedEmployeeIds.filter((id) => !filteredIds.includes(id));
		} else {
			// Select all filtered
			const filteredIds = filteredEmployees.map((emp) => emp.user_id).filter((id): id is string | number => id !== undefined);
			const newSelected = [...new Set([...selectedEmployeeIds, ...filteredIds])];
			selectedEmployeeIds = newSelected;
		}
	}

	async function handleSend() {
		if (!typebot?.publicId || selectedEmployeeIds.length === 0 || !subject.trim() || !message.trim()) {
			return;
		}

		sending = true;
		const result = await typebotService.sendTypebotLinks({
			typebotId: typebot.id,
			publicId: typebot.publicId,
			employeeIds: selectedEmployeeIds,
			subject: subject.trim(),
			message: message.trim(),
		});

		if (result.success) {
			toastStore.add(
				`${result.value.sent} e-mail(s) verzonden${result.value.failed > 0 ? `, ${result.value.failed} mislukt` : ''}`,
				result.value.failed > 0 ? 'warning' : 'success'
			);
			// Navigate back to typebot detail
			goBack();
		} else {
			const errorMessage = result.error ? getUserMessage(result.error) : 'Kon e-mails niet verzenden';
			toastStore.add(errorMessage, 'error');
			if (import.meta.env.DEV) {
				console.error('[typebot] Failed to send emails:', result.error);
			}
		}
		sending = false;
	}

	function getEmployeeEmail(emp: Employee): string {
		return emp.hoi_email || emp.email || emp.email_value || '';
	}

	function getEmployeeName(emp: Employee): string {
		return emp.fullname || emp.name || 'Onbekend';
	}

	function openPreview() {
		if (previewUrl) {
			window.open(previewUrl, '_blank');
		}
	}
</script>

<svelte:head>
	<title>Typebot Versturen - Tools - Kees Pippeloi</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	<!-- Back button -->
	<div class="mb-4">
		<Button variant="ghost" onclick={goBack}>
			<ArrowLeft class="h-4 w-4 mr-2" />
			Terug
		</Button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Loader2 class="h-8 w-8 text-zinc-400 animate-spin" />
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-red-800">{error}</p>
		</div>
	{:else if typebot}
		<div class="max-w-4xl mx-auto space-y-6">
			<!-- Header -->
			<div class="bg-white rounded-lg border border-zinc-200 p-6 shadow-xs">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h1 class="text-2xl font-semibold text-zinc-900 font-aspekta">{typebot.name}</h1>
					</div>
					{#if previewUrl}
						<Button variant="outline" onclick={openPreview}>
							Preview
							<ExternalLink class="h-4 w-4 ml-2" />
						</Button>
					{/if}
				</div>
			</div>

			<!-- Employee Selection -->
			<div class="bg-white rounded-lg border border-zinc-200 p-6 shadow-xs">
				<h2 class="text-lg font-semibold text-zinc-900 font-aspekta mb-4">Selecteer medewerkers</h2>

				<!-- Search -->
				<div class="relative mb-4">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Zoek op naam of e-mail..."
						class="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent"
					/>
				</div>

				<!-- Select all -->
				<div class="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4">
					<button
						type="button"
						onclick={toggleSelectAll}
						class="flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-zinc-700"
					>
						<div
							class="w-4 h-4 border-2 rounded border-zinc-300 flex items-center justify-center {allSelected
								? 'bg-orange-500 border-orange-500'
								: someSelected
									? 'bg-orange-500/50 border-orange-500'
									: ''}"
						>
							{#if allSelected || someSelected}
								<Check class="h-3 w-3 text-white" />
							{/if}
						</div>
						<span>{allSelected ? 'Alles deselecteren' : 'Alles selecteren'}</span>
					</button>
					<span class="text-sm text-zinc-600">{selectedCount} geselecteerd</span>
				</div>

				<!-- Employee list -->
				<div class="max-h-96 overflow-y-auto space-y-2">
					{#if loadingEmployees}
						<div class="flex items-center justify-center py-8">
							<Loader2 class="h-6 w-6 text-zinc-400 animate-spin" />
						</div>
					{:else if filteredEmployees.length === 0}
						<p class="text-center text-zinc-600 py-8">Geen medewerkers gevonden</p>
					{:else}
						{#each filteredEmployees as employee (employee.user_id)}
							{@const userId = employee.user_id}
							{@const isSelected = userId !== undefined && selectedEmployeeIds.includes(userId)}
							{@const email = getEmployeeEmail(employee)}
							{@const name = getEmployeeName(employee)}
							{#if userId !== undefined}
								<label
									class="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer {isSelected
										? 'bg-orange-50 border-orange-300'
										: ''}"
								>
									<input
										type="checkbox"
										checked={isSelected}
										onchange={() => toggleEmployee(userId)}
										class="w-4 h-4 text-orange-500 border-zinc-300 rounded focus:ring-orange-500"
									/>
									<div class="flex-1 min-w-0 flex items-center gap-2">
										<span class="font-medium text-zinc-900">{name}</span>
										{#if email}
											<span class="text-sm text-zinc-600">•</span>
											<span class="text-sm text-zinc-600 truncate">{email}</span>
										{/if}
									</div>
								</label>
							{/if}
						{/each}
					{/if}
				</div>
			</div>

			<!-- Email Composer -->
			<div class="bg-white rounded-lg border border-zinc-200 p-6 shadow-xs">
				<h2 class="text-lg font-semibold text-zinc-900 font-aspekta mb-4">E-mail opstellen</h2>

				<!-- Info -->
				<div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-4">
					<p class="text-sm text-zinc-700">
						<strong>{selectedCount}</strong> medewerker{selectedCount !== 1 ? 's' : ''} geselecteerd
					</p>
					{#if previewUrl}
						<div class="mt-2 flex items-center gap-2">
							<span class="text-sm text-zinc-600">Preview link:</span>
							<a
								href={previewUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm text-blue-600 hover:underline flex items-center gap-1"
							>
								{previewUrl}
								<ExternalLink class="h-3 w-3" />
							</a>
						</div>
					{/if}
				</div>

				<!-- Subject -->
				<div class="mb-4">
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
				<div class="mb-4">
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
				{#if previewUrl}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
						<p class="text-sm text-blue-900">
							<strong>Let op:</strong> Elke medewerker ontvangt een gepersonaliseerde link met hun e-mailadres en reset parameter.
						</p>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
					<Button variant="secondary" onclick={goBack}>Annuleren</Button>
					{#if previewUrl}
						<Button variant="outline" onclick={openPreview}>
							Preview
							<ExternalLink class="h-4 w-4 ml-2" />
						</Button>
					{/if}
					<Button onclick={handleSend} disabled={!subject.trim() || !message.trim() || selectedCount === 0 || sending}>
						<Mail class="h-4 w-4 mr-2" />
						{sending ? 'Verzenden...' : `Versturen (${selectedCount})`}
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<ToastContainer />

