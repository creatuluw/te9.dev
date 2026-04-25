<script lang="ts">
    import { Button, Modal } from "$lib/components";
    import { Search, Check } from "lucide-svelte";
    import type { Employee } from "$lib/schemas/employee";

    interface Props {
        open?: boolean;
        employees?: Employee[];
        selectedIds?: Array<string | number>;
        onclose?: () => void;
        onconfirm?: (selectedIds: Array<string | number>) => void;
    }

    let {
        open: isOpen = $bindable(false),
        employees = [],
        selectedIds: selectedIdsProp = $bindable([]),
        onclose,
        onconfirm,
    }: Props = $props();

    let searchTerm = $state("");
    let selectedIds = $state<Array<string | number>>([...selectedIdsProp]);

    // Sync prop changes
    $effect(() => {
        selectedIds = [...selectedIdsProp];
    });

    // Filter employees based on search
    const filteredEmployees = $derived.by(() => {
        if (!searchTerm.trim()) return employees;

        const term = searchTerm.toLowerCase();
        return employees.filter(
            (emp) =>
                (emp.fullname || emp.name || "").toLowerCase().includes(term) ||
                (emp.hoi_email || emp.email || emp.email_value || "")
                    .toLowerCase()
                    .includes(term),
        );
    });

    const selectedCount = $derived(selectedIds.length);
    const allSelected = $derived(
        filteredEmployees.length > 0 &&
            filteredEmployees.every((emp) =>
                selectedIds.includes(emp.user_id || ""),
            ),
    );
    const someSelected = $derived(
        filteredEmployees.some((emp) =>
            selectedIds.includes(emp.user_id || ""),
        ) && !allSelected,
    );

    function toggleEmployee(userId: string | number | undefined) {
        if (!userId) return;
        const index = selectedIds.indexOf(userId);
        if (index >= 0) {
            selectedIds = selectedIds.filter((id) => id !== userId);
        } else {
            selectedIds = [...selectedIds, userId];
        }
    }

    function toggleSelectAll() {
        if (allSelected) {
            // Deselect all filtered
            const filteredIds = filteredEmployees
                .map((emp) => emp.user_id)
                .filter((id): id is string | number => id !== undefined);
            selectedIds = selectedIds.filter((id) => !filteredIds.includes(id));
        } else {
            // Select all filtered
            const filteredIds = filteredEmployees
                .map((emp) => emp.user_id)
                .filter((id): id is string | number => id !== undefined);
            const newSelected = [...new Set([...selectedIds, ...filteredIds])];
            selectedIds = newSelected;
        }
    }

    function handleConfirm() {
        selectedIdsProp = [...selectedIds];
        onconfirm?.(selectedIds);
        closeModal();
    }

    function closeModal() {
        isOpen = false;
        selectedIds = [...selectedIdsProp]; // Reset to prop value
        searchTerm = "";
        onclose?.();
    }

    function getEmployeeEmail(emp: Employee): string {
        return emp.hoi_email || emp.email || emp.email_value || "";
    }

    function getEmployeeName(emp: Employee): string {
        return emp.fullname || emp.name || "Onbekend";
    }
</script>

<Modal
    open={isOpen}
    title="Selecteer medewerkers"
    size="lg"
    onclose={closeModal}
>
    <div class="space-y-4">
        <!-- Search -->
        <div class="relative">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
            />
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Zoek op naam of e-mail..."
                class="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent"
            />
        </div>

        <!-- Select all -->
        <div
            class="flex items-center justify-between border-b border-zinc-200 pb-2"
        >
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
                <span
                    >{allSelected
                        ? "Alles deselecteren"
                        : "Alles selecteren"}</span
                >
            </button>
            <span class="text-sm text-zinc-600"
                >{selectedCount} geselecteerd</span
            >
        </div>

        <!-- Employee list -->
        <div class="max-h-96 overflow-y-auto space-y-2">
            {#if filteredEmployees.length === 0}
                <p class="text-center text-zinc-600 py-8">
                    Geen medewerkers gevonden
                </p>
            {:else}
                {#each filteredEmployees as employee (employee.user_id)}
                    {@const userId = employee.user_id}
                    {@const isSelected =
                        userId !== undefined && selectedIds.includes(userId)}
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
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-zinc-900">
                                    {name}
                                </div>
                                {#if email}
                                    <div class="text-sm text-zinc-600 truncate">
                                        {email}
                                    </div>
                                {/if}
                            </div>
                        </label>
                    {/if}
                {/each}
            {/if}
        </div>

        <!-- Actions -->
        <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200"
        >
            <Button variant="secondary" onclick={closeModal}>Annuleren</Button>
            <Button onclick={handleConfirm} disabled={selectedCount === 0}>
                Bevestigen ({selectedCount})
            </Button>
        </div>
    </div>
</Modal>
