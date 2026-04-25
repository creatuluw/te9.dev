<script lang="ts">
    import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-svelte";
    import Button from "./Button.svelte";
    import Pagination from "./Pagination.svelte";

    interface Column {
        key: string;
        label: string;
        sortable?: boolean;
        width?: string;
        align?: "left" | "center" | "right";
        render?: (value: any, row: any) => string;
    }

    interface Action {
        label: string;
        icon?: any;
        variant?: "default" | "secondary" | "ghost" | "outline";
        onclick: (row: any) => void;
        show?: (row: any) => boolean;
    }

    interface Props {
        /** Array of column definitions */
        columns: Column[];

        /** Array of data rows */
        data: any[];

        /** Enable row selection */
        selectable?: boolean;

        /** Array of row actions */
        actions?: Action[];

        /** Row click handler */
        onrowclick?: (row: any) => void;

        /** Sort handler - receives column key and direction */
        onsort?: (key: string, direction: "asc" | "desc") => void;

        /** Enable pagination */
        paginated?: boolean;

        /** Items per page (if paginated) */
        itemsPerPage?: number;

        /** Current page (if paginated) */
        currentPage?: number;

        /** Page change handler */
        onpagechange?: (page: number) => void;

        /** Empty state message */
        emptyMessage?: string;

        /** Additional CSS classes */
        class?: string;
    }

    let {
        columns,
        data,
        selectable = false,
        actions = [],
        onrowclick,
        onsort,
        paginated = false,
        itemsPerPage = 10,
        currentPage = 1,
        onpagechange,
        emptyMessage = "Geen data beschikbaar",
        class: className = "",
    }: Props = $props();

    let selectedRows = $state<Set<any>>(new Set());
    let sortColumn = $state<string | null>(null);
    let sortDirection = $state<"asc" | "desc">("asc");

    // Pagination state
    let internalCurrentPage = $state(currentPage);

    // Update internal page when prop changes
    $effect(() => {
        internalCurrentPage = currentPage;
    });

    // Calculate paginated data
    const paginatedData = $derived.by(() => {
        if (!paginated) return data;

        const start = (internalCurrentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return data.slice(start, end);
    });

    const totalPages = $derived(Math.ceil(data.length / itemsPerPage));

    // Handle column sort
    function handleSort(column: Column) {
        if (!column.sortable) return;

        if (sortColumn === column.key) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortColumn = column.key;
            sortDirection = "asc";
        }

        onsort?.(column.key, sortDirection);
    }

    // Handle row selection
    function toggleRowSelection(row: any) {
        if (selectedRows.has(row)) {
            selectedRows.delete(row);
        } else {
            selectedRows.add(row);
        }
        selectedRows = new Set(selectedRows);
    }

    function toggleAllRows() {
        if (selectedRows.size === paginatedData.length) {
            selectedRows.clear();
        } else {
            selectedRows = new Set(paginatedData);
        }
        selectedRows = new Set(selectedRows);
    }

    // Handle page change
    function handlePageChange(page: number) {
        internalCurrentPage = page;
        onpagechange?.(page);
    }

    // Get cell value
    function getCellValue(row: any, column: Column): string {
        const value = row[column.key];
        if (column.render) {
            return column.render(value, row);
        }
        return value ?? "-";
    }

    // Check if action should be shown
    function shouldShowAction(action: Action, row: any): boolean {
        return action.show ? action.show(row) : true;
    }
</script>

<div class="data-table {className}">
    <div class="overflow-x-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr class="border-b border-zinc-200 bg-zinc-50">
                    {#if selectable}
                        <th class="px-4 py-3 text-left w-12">
                            <input
                                type="checkbox"
                                checked={selectedRows.size ===
                                    paginatedData.length &&
                                    paginatedData.length > 0}
                                onchange={toggleAllRows}
                                class="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                        </th>
                    {/if}

                    {#each columns as column}
                        <th
                            class="px-4 py-3 text-sm font-medium text-zinc-900 font-aspekta"
                            class:cursor-pointer={column.sortable}
                            class:text-left={column.align === "left" ||
                                !column.align}
                            class:text-center={column.align === "center"}
                            class:text-right={column.align === "right"}
                            style={column.width ? `width: ${column.width}` : ""}
                            onclick={() =>
                                column.sortable && handleSort(column)}
                        >
                            <div
                                class="flex items-center gap-2"
                                class:justify-center={column.align === "center"}
                                class:justify-end={column.align === "right"}
                            >
                                <span>{column.label}</span>
                                {#if column.sortable}
                                    <span class="text-zinc-400">
                                        {#if sortColumn === column.key}
                                            {#if sortDirection === "asc"}
                                                <ChevronUp size={16} />
                                            {:else}
                                                <ChevronDown size={16} />
                                            {/if}
                                        {:else}
                                            <ChevronsUpDown size={16} />
                                        {/if}
                                    </span>
                                {/if}
                            </div>
                        </th>
                    {/each}

                    {#if actions.length > 0}
                        <th
                            class="px-4 py-3 text-right text-sm font-medium text-zinc-900 font-aspekta w-32"
                        >
                            Acties
                        </th>
                    {/if}
                </tr>
            </thead>
            <tbody>
                {#if paginatedData.length === 0}
                    <tr>
                        <td
                            colspan={columns.length +
                                (selectable ? 1 : 0) +
                                (actions.length > 0 ? 1 : 0)}
                            class="px-4 py-12 text-center text-zinc-500"
                        >
                            {emptyMessage}
                        </td>
                    </tr>
                {:else}
                    {#each paginatedData as row, index}
                        <tr
                            class="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                            class:cursor-pointer={onrowclick}
                            onclick={() => onrowclick?.(row)}
                        >
                            {#if selectable}
                                <td class="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.has(row)}
                                        onchange={(e) => {
                                            e.stopPropagation();
                                            toggleRowSelection(row);
                                        }}
                                        onclick={(e) => e.stopPropagation()}
                                        class="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                    />
                                </td>
                            {/if}

                            {#each columns as column}
                                <td
                                    class="px-4 py-3 text-sm text-zinc-700"
                                    class:text-left={column.align === "left" ||
                                        !column.align}
                                    class:text-center={column.align ===
                                        "center"}
                                    class:text-right={column.align === "right"}
                                >
                                    {@html getCellValue(row, column)}
                                </td>
                            {/each}

                            {#if actions.length > 0}
                                <td class="px-4 py-3 text-right">
                                    <div
                                        class="flex items-center justify-end gap-2"
                                    >
                                        {#each actions as action}
                                            {#if shouldShowAction(action, row)}
                                                <Button
                                                    size="sm"
                                                    variant={action.variant ||
                                                        "ghost"}
                                                    onclick={(e) => {
                                                        e.stopPropagation();
                                                        action.onclick(row);
                                                    }}
                                                >
                                                    {#if action.icon}
                                                        {@const IconComponent =
                                                            action.icon}
                                                        <IconComponent
                                                            size={16}
                                                        />
                                                    {/if}
                                                    {action.label}
                                                </Button>
                                            {/if}
                                        {/each}
                                    </div>
                                </td>
                            {/if}
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>

    {#if paginated && totalPages > 1}
        <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-zinc-600">
                Toont {(internalCurrentPage - 1) * itemsPerPage + 1} tot {Math.min(
                    internalCurrentPage * itemsPerPage,
                    data.length,
                )} van {data.length} resultaten
            </div>
            <Pagination
                currentPage={internalCurrentPage}
                totalItems={data.length}
                {itemsPerPage}
                onPageChange={handlePageChange}
            />
        </div>
    {/if}
</div>

<style>
    @reference "tailwindcss";

    .data-table {
        @apply bg-zinc-50 rounded-lg border border-zinc-200;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    .data-table table {
        @apply min-w-full;
    }
</style>
