<script lang="ts">
	import { onMount } from 'svelte';
	import DatePicker from './DatePicker.svelte';
	import Button from './Button.svelte';
	import * as userAvailabilityService from '$lib/services/userAvailabilityService';
	import { getCurrentUserId } from '$lib/utils/userUtils';
	import { toastStore } from '$lib/stores/toastStore';
	import { getUserMessage } from '$lib/types/errors';
	import type { UserAvailability } from '$lib/services/userAvailabilityService';

	/**
	 * UserAvailabilityInput component props
	 * 
	 * Input component for setting weekly hours availability with date picker.
	 */
	interface Props {
		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	let hoursPerWeek = $state<string>('');
	let weekStartDate = $state<string | null>(null);
	let loading = $state(false);
	let saving = $state(false);
	let currentAvailability = $state<UserAvailability | null>(null);

	onMount(async () => {
		await loadCurrentAvailability();
	});

	async function loadCurrentAvailability() {
		loading = true;
		const result = await userAvailabilityService.getCurrentUserAvailability();
		if (result.success) {
			currentAvailability = result.value;
			if (result.value) {
				hoursPerWeek = String(result.value.hours_per_week);
				weekStartDate = result.value.week_start_date;
			}
		} else {
			toastStore.add(getUserMessage(result.error), 'error');
		}
		loading = false;
	}

	async function saveAvailability() {
		const userId = getCurrentUserId();
		if (!userId) {
			toastStore.add('Je moet ingelogd zijn om beschikbaarheid in te stellen', 'error');
			return;
		}

		if (!hoursPerWeek || !weekStartDate) {
			toastStore.add('Vul zowel uren per week als de startdatum in', 'error');
			return;
		}

		const hours = parseFloat(hoursPerWeek);
		if (isNaN(hours) || hours <= 0) {
			toastStore.add('Uren per week moet een positief getal zijn', 'error');
			return;
		}

		saving = true;
		
		// Create or update: if a record exists for this date, update it; otherwise create new
		const result = await userAvailabilityService.setUserAvailability({
			user_id: userId,
			hours_per_week: hours,
			week_start_date: weekStartDate
		});

		if (result.success) {
			// Reload the most recent availability to show in the form
			await loadCurrentAvailability();
			const toastId = toastStore.add('Beschikbaarheid opgeslagen', 'success');
			if (import.meta.env.DEV) {
				console.log('[UserAvailabilityInput] Toast added with ID:', toastId);
			}
		} else {
			toastStore.add(getUserMessage(result.error), 'error');
		}
		saving = false;
	}

	function handleHoursChange(event: Event) {
		const target = event.target as HTMLInputElement;
		hoursPerWeek = target.value;
	}

	// Get current week start date (Monday) if no date selected
	function getCurrentWeekStart(): string {
		const today = new Date();
		const day = today.getDay();
		const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
		const monday = new Date(today.setDate(diff));
		const year = monday.getFullYear();
		const month = String(monday.getMonth() + 1).padStart(2, '0');
		const date = String(monday.getDate()).padStart(2, '0');
		return `${year}-${month}-${date}`;
	}
</script>

<div class="bg-white rounded-lg shadow-xs border border-zinc-200 p-4 {className}">
	<div class="flex items-center justify-between mb-3">
		<h3 class="text-base font-semibold text-zinc-900">Uren beschikbaar</h3>
		{#if currentAvailability}
			<span class="text-xs text-zinc-500">
				Week vanaf {new Date(currentAvailability.week_start_date).toLocaleDateString('nl-NL', {
					day: 'numeric',
					month: 'short'
				})}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="text-sm text-zinc-500">Laden...</div>
	{:else}
		<div class="space-y-3">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div>
					<label for="hours-input" class="block text-sm font-medium text-zinc-700 mb-0.5">
						Uren per week
					</label>
					<input
						id="hours-input"
						type="number"
						value={hoursPerWeek}
						oninput={handleHoursChange}
						placeholder="40"
						min="0"
						step="0.1"
						class="w-full px-3 py-1.5 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm"
					/>
					{#if currentAvailability}
						<p class="mt-0.5 text-xs text-zinc-500">
							Laatst bijgewerkt: {new Date(currentAvailability.updated_at).toLocaleDateString('nl-NL', {
								day: 'numeric',
								month: 'short',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</p>
					{/if}
				</div>
				<div>
					<label for="week-start-input" class="block text-sm font-medium text-zinc-700 mb-0.5">
						Startdatum
					</label>
					<DatePicker
						id="week-start-input"
						bind:value={weekStartDate}
						placeholder={weekStartDate || getCurrentWeekStart()}
					/>
				</div>
			</div>
			<div class="flex justify-end pt-1">
				<Button 
					type="button"
					size="sm"
					onclick={(e) => {
						e.preventDefault?.();
						saveAvailability();
					}} 
					disabled={saving || !hoursPerWeek || !weekStartDate}
				>
					{saving ? 'Opslaan...' : 'Opslaan'}
				</Button>
			</div>
		</div>
	{/if}
</div>

