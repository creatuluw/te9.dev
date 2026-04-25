<script lang="ts">
	import { onMount } from 'svelte';
	import { Spinner, Label } from '$lib/components';
	import { toastStore } from '$lib/stores/toastStore';
	import { getAllEmployees } from '$lib/services/employeeService';
	import type { Employee } from '$lib/schemas/employee';
	import { getUserMessage } from '$lib/types/errors';
	import { Users, ChevronDown } from 'lucide-svelte';

	// State
	let employees = $state<Employee[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let expandedRows = $state<Set<string>>(new Set());
	
	// Track duplicate user_ids - use a computed function instead of $derived
	function getDuplicateUserIds(): (number | string)[] {
		const userIdCounts = new Map<number | string, number>();
		employees.forEach(emp => {
			const userId = emp.user_id || emp.employee_id;
			if (userId) {
				userIdCounts.set(userId, (userIdCounts.get(userId) || 0) + 1);
			}
		});
		const duplicates: (number | string)[] = [];
		userIdCounts.forEach((count, userId) => {
			if (count > 1) {
				duplicates.push(userId);
			}
		});
		return duplicates;
	}
	
	function isDuplicate(employee: Employee): boolean {
		const userId = employee.user_id || employee.employee_id;
		if (!userId) return false;
		const duplicates = getDuplicateUserIds();
		return duplicates.includes(userId);
	}

	// Load employees on mount
	onMount(async () => {
		await loadEmployees();
	});

	async function loadEmployees() {
		isLoading = true;
		error = null;

		const result = await getAllEmployees();
		
		if (result.success) {
			employees = result.value;
		} else {
			error = getUserMessage(result.error);
			toastStore.add(error, 'error');
		}

		isLoading = false;
	}

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '-';
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString('nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit' });
		} catch {
			return dateStr;
		}
	}

	function formatNumber(value: number | null | undefined): string {
		if (value === null || value === undefined) return '-';
		return value.toFixed(2);
	}

	function getRowId(employee: Employee, index: number): string {
		return (employee.user_id || employee.employee_id || index).toString() + '-' + (employee.valid_from || '') + '-' + (employee.valid_until || 'null');
	}

	function toggleRow(rowId: string) {
		const newSet = new Set(expandedRows);
		if (newSet.has(rowId)) {
			newSet.delete(rowId);
		} else {
			newSet.add(rowId);
		}
		expandedRows = newSet;
	}

	function isRowExpanded(rowId: string): boolean {
		return expandedRows.has(rowId);
	}
</script>

<svelte:head>
	<title>Medewerkers Rapport - Kees Pippeloi</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw] space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Label variant="default">{employees.length} medewerker{employees.length !== 1 ? 's' : ''}</Label>
		</div>
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<Spinner size="xl" />
		</div>
	{:else if error}
		<div class="bg-white rounded-lg border border-zinc-200 p-6 shadow-xs">
			<div class="text-center space-y-4">
				<p class="text-red-600 font-medium">Fout bij laden</p>
				<p class="text-sm text-zinc-600">{error}</p>
				<button
					type="button"
					onclick={loadEmployees}
					class="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm"
				>
					Opnieuw proberen
				</button>
			</div>
		</div>
	{:else if employees.length === 0}
		<div class="bg-white rounded-lg border border-zinc-200 p-12 shadow-xs">
			<div class="text-center space-y-4">
				<Users class="w-12 h-12 text-zinc-400 mx-auto" />
				<p class="text-zinc-600">Geen medewerkers gevonden.</p>
			</div>
		</div>
	{:else}
		<!-- Employee Table -->
		<div class="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-zinc-50 border-b border-zinc-200">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								Naam
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								E-mail
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								Geldig vanaf
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								Geldig tot
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								Uren/week
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								Volledige uren
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta">
								Max uren/week
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta w-12">
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-200">
						{#each employees as employee, index ((employee.user_id || employee.employee_id || index).toString() + '-' + (employee.valid_from || '') + '-' + (employee.valid_until || 'null'))}
							{@const hasDuplicate = isDuplicate(employee)}
							{@const rowId = getRowId(employee, index)}
							{@const isExpanded = isRowExpanded(rowId)}
							<tr class="hover:bg-zinc-50 transition-colors {hasDuplicate ? 'bg-yellow-50' : ''}">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center gap-2">
										<div class="text-sm font-medium text-zinc-900">
											{employee.fullname || employee.name || '-'}
										</div>
										{#if hasDuplicate}
											<Label variant="warning" class="text-xs">Dubbele ID</Label>
										{/if}
									</div>
									{#if employee.user_id}
										<div class="text-xs text-zinc-500">ID: {employee.user_id}</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-zinc-900">
										{employee.hoi_email || '-'}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
									{formatDate(employee.valid_from)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
									{formatDate(employee.valid_until)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if !employee.valid_until || new Date(employee.valid_until) >= new Date()}
										<Label variant="success">Actief</Label>
									{:else}
										<Label variant="warning">Verlopen</Label>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
									{formatNumber(employee.hours_per_week)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
									{formatNumber(employee.full_time_hours)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
									{formatNumber(employee.max_hours_per_week)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<button
										type="button"
										onclick={() => toggleRow(rowId)}
										class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 transition-colors"
										aria-label={isExpanded ? 'Inklappen' : 'Uitklappen'}
										aria-expanded={isExpanded}
									>
										<ChevronDown
											size={16}
											class="text-zinc-500 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
										/>
									</button>
								</td>
							</tr>
							{#if isExpanded}
								<tr class="bg-zinc-50/50">
									<td colspan="9" class="px-6 py-4">
										<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
											<div>
												<div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Contract type</div>
												<div class="text-zinc-900">{employee.type_of_contract || '-'}</div>
											</div>
											<div>
												<div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Uren berekening</div>
												<div class="text-zinc-900">{employee.hours_calculation_model || '-'}</div>
											</div>
											<div>
												<div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Schaal</div>
												<div class="text-zinc-900">{employee.scale || '-'}</div>
											</div>
											<div>
												<div class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Schaal nummer</div>
												<div class="text-zinc-900">{employee.scale_number ?? '-'}</div>
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

