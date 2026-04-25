<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button, ToastContainer } from '$lib/components';
	import { Loader2, Mail, Search, Check, ExternalLink, Code, FileQuestionMark } from 'lucide-svelte';
	import { navigationStore } from '$lib/stores/navigationStore';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import * as typebotService from '$lib/services/typebotService';
	import * as employeeService from '$lib/services/employeeService';
	import type { Typebot } from '$lib/schemas/typebot';
	import type { Employee } from '$lib/schemas/employee';
	import TypebotJsonDrawer from '$lib/components/typebot/TypebotJsonDrawer.svelte';

	let typebots = $state<Typebot[]>([]);
	let selectedTypebot = $state<Typebot | null>(null);
	let employees = $state<Employee[]>([]);
	let selectedEmployeeIds = $state<Array<string | number>>([]);
	let searchTerm = $state('');
	let subject = $state('');
	let message = $state('');
	let loading = $state(true);
	let loadingDetail = $state(false);
	let loadingEmployees = $state(false);
	let sending = $state(false);
	let error = $state<string | null>(null);
	let jsonDrawerOpen = $state(false);

	onMount(async () => {
		await loadTypebots();
	});

	async function loadTypebots() {
		loading = true;
		navigationStore.startPageLoading();
		error = null;

		const result = await typebotService.getAllTypebots();

		if (result.success) {
			typebots = result.value;
		} else {
			error = 'Kon typebots niet laden';
			toastStore.add('Kon typebots niet laden', 'error');
		}

		loading = false;
		navigationStore.stopPageLoading();
	}

	// Track currently loading ID to prevent duplicate loads
	let loadingTypebotId = $state<string | null>(null);

	// Watch for URL param changes and load typebot when id is present
	$effect(() => {
		// Don't try to load details until the list has finished loading
		if (loading) {
			return;
		}

		const typebotId = $page.url.searchParams.get('id');
		
		if (typebotId) {
			// Only load if we don't already have this typebot selected and we're not already loading it
			if ((!selectedTypebot || selectedTypebot.id !== typebotId) && loadingTypebotId !== typebotId) {
				loadTypebotById(typebotId);
			}
		} else {
			// Clear selection when id param is removed (but not if we're currently loading)
			if (selectedTypebot && !loadingTypebotId) {
				selectedTypebot = null;
			}
		}
	});

	async function loadTypebotById(id: string) {
		// Prevent duplicate loads
		if (loadingTypebotId === id) {
			return;
		}

		loadingTypebotId = id;
		loadingDetail = true;
		navigationStore.startPageLoading();
		
		try {
			const result = await typebotService.getTypebotById(id);
			
			if (result.success) {
				selectedTypebot = result.value;
				// Initialize email subject and message
				subject = `Formulier: ${selectedTypebot.name}`;
				message = `Beste collega,\n\nJe ontvangt deze e-mail omdat je bent geselecteerd om het volgende formulier in te vullen: ${selectedTypebot.name}\n\nKlik op de onderstaande link om het formulier te openen.\n\nMet vriendelijke groet, \n\nTeam Hoi Pippeloi`;
				// Load employees when typebot is loaded
				await loadEmployees();
			} else {
				const errorMessage = result.error ? getUserMessage(result.error) : 'Kon typebot details niet laden';
				toastStore.add(errorMessage, 'error');
				
				if (import.meta.env.DEV) {
					console.error('[typebot] Failed to load typebot:', id, result.error);
				}
				
				// Clear the URL param if loading failed
				const newUrl = new URL($page.url);
				newUrl.searchParams.delete('id');
				goto(newUrl.pathname + newUrl.search, { replaceState: true });
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Kon typebot details niet laden';
			toastStore.add(errorMessage, 'error');
			
			if (import.meta.env.DEV) {
				console.error('[typebot] Error loading typebot:', id, error);
			}
			
			// Clear the URL param if loading failed
			const newUrl = new URL($page.url);
			newUrl.searchParams.delete('id');
			goto(newUrl.pathname + newUrl.search, { replaceState: true });
		} finally {
			loadingDetail = false;
			loadingTypebotId = null;
			navigationStore.stopPageLoading();
		}
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

	async function selectTypebot(typebot: Typebot) {
		// Update URL with typebot id
		const newUrl = new URL($page.url);
		newUrl.searchParams.set('id', typebot.id);
		goto(newUrl.pathname + newUrl.search, { replaceState: false });
	}

	function closeDetail() {
		// Remove id param from URL
		const newUrl = new URL($page.url);
		newUrl.searchParams.delete('id');
		goto(newUrl.pathname + newUrl.search, { replaceState: false });
		// Reset state
		selectedEmployeeIds = [];
		searchTerm = '';
		subject = '';
		message = '';
	}

	const viewerUrl = 'https://viewer-production-a3fa.up.railway.app';
	const previewUrl = $derived.by(() => {
		if (!selectedTypebot?.publicId) return null;
		return `${viewerUrl}/${selectedTypebot.publicId}`;
	});

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
		if (sending) {
			return; // Prevent duplicate calls
		}
		
		if (!selectedTypebot?.publicId || selectedEmployeeIds.length === 0 || !subject.trim() || !message.trim()) {
			return;
		}

		sending = true;
		const result = await typebotService.sendTypebotLinks({
			typebotId: selectedTypebot.id,
			publicId: selectedTypebot.publicId,
			employeeIds: selectedEmployeeIds,
			subject: subject.trim(),
			message: message.trim(),
		});

		if (result.success) {
			toastStore.add(
				`${result.value.sent} e-mail(s) verzonden${result.value.failed > 0 ? `, ${result.value.failed} mislukt` : ''}`,
				result.value.failed > 0 ? 'warning' : 'success'
			);
			// Clear selected employees so user can select different ones and send again
			selectedEmployeeIds = [];
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
	<title>Typebot - Tools - Kees Pippeloi</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
	{#if selectedTypebot}
		<!-- Send view -->
		{#if loadingDetail}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 text-zinc-400 animate-spin" />
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-red-800">{error}</p>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- Header -->
				<div class="flex items-start justify-between mb-4">
					<div>
						<h1 class="text-2xl font-semibold text-zinc-900 font-aspekta">{selectedTypebot.name}</h1>
					</div>
					<div class="flex items-center gap-2">
						{#if previewUrl}
							<Button variant="outline" onclick={openPreview}>
								Preview
								<ExternalLink class="h-4 w-4 ml-2" />
							</Button>
						{/if}
						<Button variant="ghost" onclick={() => jsonDrawerOpen = true}>
							<Code class="h-4 w-4 mr-2" />
							Structuur & JSON
						</Button>
					</div>
				</div>

				<!-- Two Column Layout: Employee Selection and Email Composer -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
								rows="10"
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
							<Button variant="secondary" onclick={closeDetail}>Annuleren</Button>
							<Button onclick={handleSend} disabled={!subject.trim() || !message.trim() || selectedCount === 0 || sending}>
								<Mail class="h-4 w-4 mr-2" />
								{sending ? 'Verzenden...' : `Versturen (${selectedCount})`}
							</Button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<!-- List view -->
		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-zinc-900 font-aspekta">Typebot Integratie</h1>
			<p class="text-zinc-600 mt-1">Beheer en verstuur typebot formulieren naar medewerkers</p>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 text-zinc-400 animate-spin" />
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-red-800">{error}</p>
			</div>
		{:else if typebots.length === 0}
			<div class="bg-white rounded-lg border border-zinc-200 p-6 shadow-xs">
				<p class="text-zinc-600 text-center py-8">Geen typebots gevonden</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
				{#each typebots as typebot (typebot.id)}
					<button
						type="button"
						onclick={() => selectTypebot(typebot)}
						class="relative block cursor-pointer text-left w-full group p-4 rounded-lg bg-white border border-zinc-200 hover:shadow-sm hover:border-zinc-300 transition-all"
					>
						<!-- Typebot Icon & Name -->
						<div class="flex items-center space-x-4">
							<div class="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors flex items-center justify-center">
								<FileQuestionMark class="w-5 h-5 text-zinc-600" />
							</div>
							<div class="min-w-0 flex-1">
								<div class="text-sm font-medium text-zinc-900 truncate">{typebot.name}</div>
								<div class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors">
									{#if typebot.createdAt}
										Aangemaakt: {new Date(typebot.createdAt).toLocaleDateString('nl-NL')}
									{:else}
										Typebot
									{/if}
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- JSON/Structure Drawer -->
{#if selectedTypebot}
	<TypebotJsonDrawer 
		bind:open={jsonDrawerOpen} 
		typebotData={selectedTypebot} 
		onclose={() => jsonDrawerOpen = false} 
	/>
{/if}

<ToastContainer />

