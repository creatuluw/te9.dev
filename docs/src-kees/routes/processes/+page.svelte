<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { get } from "svelte/store";
    import * as processService from "$lib/services/processService";
    import { processStore } from "$lib/stores/processStore";
    import { navigationStore } from "$lib/stores/navigationStore";
    import type { Process } from "$lib/services/processService";
    import type { Case } from "$lib/schemas/case";
    import Button from "$lib/components/Button.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import ProcessDrawer from "$lib/components/ProcessDrawer.svelte";
    import CaseDrawer from "$lib/components/CaseDrawer.svelte";
    import ProcessStepEditor from "$lib/components/ProcessStepEditor.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import NavCard from "$lib/components/NavCard.svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import { Drawer, DateRangePicker } from "$lib/components";
    import {
        FilePlus,
        Pencil,
        Archive,
        Search,
        Eraser,
        Plus,
    } from "lucide-svelte";
    import { refreshAOS } from "$lib/utils/aosKit";
    import { browser } from "$app/environment";

    // Use processStore for reactive processes data
    const storeData = $state(processStore.getValue());
    processStore.subscribe((data) => {
        storeData.processes = data.processes;
        storeData.loading = data.loading;
        storeData.lastFetch = data.lastFetch;
    });

    let processes = $derived(storeData.processes);
    let loading = $derived(storeData.loading);
    let processStatsMap = $state<
        Record<
            number,
            { stepCount: number; taskCount: number; totalHours: number }
        >
    >({});

    // Filter state (applied filters)
    let searchQuery = $state("");
    let filterStatus = $state<string[]>([]);
    let filterCompletionDaysMin = $state<number | null>(null);
    let filterCompletionDaysMax = $state<number | null>(null);
    let filterCreatedFrom = $state<string | null>(null);
    let filterCreatedTo = $state<string | null>(null);

    // Temporary filter state (before applying)
    let tempSearchQuery = $state("");
    let tempFilterStatus = $state<string[]>([]);
    let tempFilterCompletionDaysMin = $state<number | null>(null);
    let tempFilterCompletionDaysMax = $state<number | null>(null);
    let tempFilterCreatedFrom = $state<string | null>(null);
    let tempFilterCreatedTo = $state<string | null>(null);

    // Derive search drawer state from URL params
    const searchDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "search",
    );

    // Modal state for confirmation
    let confirmModalOpen = $state(false);
    let processToArchive = $state<number | null>(null);
    let archiving = $state(false);

    async function loadStats() {
        // Load step/task counts for each process (not cached, always fresh)
        const statsPromises = processes.map(async (process) => {
            const result = await processService.getProcessStats(process.id);
            if (result.success) {
                return { processId: process.id, stats: result.value };
            } else {
                return {
                    processId: process.id,
                    stats: { stepCount: 0, taskCount: 0, totalHours: 0 },
                };
            }
        });

        const statsResults = await Promise.all(statsPromises);
        processStatsMap = {};
        for (const result of statsResults) {
            processStatsMap[result.processId] = result.stats;
        }
    }

    let _visibilityChangeHandler: (() => void) | null = null;

    onMount(async () => {
        // Load initial data with loading state
        navigationStore.startPageLoading();
        await processStore.refresh(true);
        await loadStats();
        navigationStore.stopPageLoading();

        // Start polling when page is visible
        if (typeof document !== "undefined") {
            processStore.startPolling(30000); // Poll every 30 seconds

            // Pause polling when tab is hidden, resume when visible
            _visibilityChangeHandler = () => {
                if (document.hidden) {
                    processStore.stopPolling();
                } else {
                    processStore.startPolling(30000);
                    // Refresh data when tab becomes visible
                    processStore.refresh();
                    loadStats();
                }
            };

            document.addEventListener(
                "visibilitychange",
                _visibilityChangeHandler,
            );

            // Refresh AOS after page loads to detect elements already in viewport
            if (browser) {
                setTimeout(async () => {
                    await refreshAOS();
                }, 500);
            }
        }
    });

    onDestroy(() => {
        processStore.stopPolling();
        if (_visibilityChangeHandler && typeof document !== "undefined") {
            document.removeEventListener(
                "visibilitychange",
                _visibilityChangeHandler,
            );
        }
    });

    // Reload stats when processes change
    $effect(() => {
        if (processes.length > 0) {
            loadStats();
        }
    });

    // Sync temporary filters with applied filters when drawer opens
    $effect(() => {
        if (searchDrawerOpen) {
            tempSearchQuery = searchQuery;
            tempFilterStatus = [...filterStatus];
            tempFilterCompletionDaysMin = filterCompletionDaysMin;
            tempFilterCompletionDaysMax = filterCompletionDaysMax;
            tempFilterCreatedFrom = filterCreatedFrom;
            tempFilterCreatedTo = filterCreatedTo;
        }
    });

    // Status options
    const statusOptions: SelectOption[] = [
        { value: "active", label: "Actief" },
        { value: "archived", label: "Gearchiveerd" },
    ];

    // Filter processes based on search and filters
    const filteredProcesses = $derived.by(() => {
        let filtered = processes;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((process) => {
                return (
                    process.name.toLowerCase().includes(query) ||
                    process.description?.toLowerCase().includes(query) ||
                    false
                );
            });
        }

        // Apply status filter
        if (filterStatus.length > 0) {
            filtered = filtered.filter((process) =>
                filterStatus.includes(process.status),
            );
        }

        // Apply completion days filter
        const minDays = filterCompletionDaysMin;
        if (minDays !== null) {
            filtered = filtered.filter(
                (process) => process.completion_days >= minDays,
            );
        }
        const maxDays = filterCompletionDaysMax;
        if (maxDays !== null) {
            filtered = filtered.filter(
                (process) => process.completion_days <= maxDays,
            );
        }

        // Apply created date filter
        if (filterCreatedFrom || filterCreatedTo) {
            filtered = filtered.filter((process) => {
                if (!process.created_at) return false;
                const createdDate = new Date(process.created_at);
                createdDate.setHours(0, 0, 0, 0);

                if (filterCreatedFrom) {
                    const fromDate = new Date(filterCreatedFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (createdDate < fromDate) return false;
                }
                if (filterCreatedTo) {
                    const toDate = new Date(filterCreatedTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (createdDate > toDate) return false;
                }
                return true;
            });
        }

        return filtered;
    });

    // Count active filters
    const activeFilterCount = $derived.by(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (filterStatus.length > 0) count++;
        if (
            filterCompletionDaysMin !== null ||
            filterCompletionDaysMax !== null
        )
            count++;
        if (filterCreatedFrom || filterCreatedTo) count++;
        return count;
    });

    // Apply filters function - called when "Tonen" button is clicked
    async function applyFilters() {
        searchQuery = tempSearchQuery;
        filterStatus = [...tempFilterStatus];
        filterCompletionDaysMin = tempFilterCompletionDaysMin;
        filterCompletionDaysMax = tempFilterCompletionDaysMax;
        filterCreatedFrom = tempFilterCreatedFrom;
        filterCreatedTo = tempFilterCreatedTo;

        // Build URL with all filter params (excluding drawer)
        const params: string[] = [];

        if (searchQuery) {
            params.push(`search=${encodeURIComponent(searchQuery)}`);
        }
        if (filterStatus.length > 0) {
            params.push(`status=${filterStatus.join(",")}`);
        }
        if (filterCompletionDaysMin !== null) {
            params.push(`completionDaysMin=${filterCompletionDaysMin}`);
        }
        if (filterCompletionDaysMax !== null) {
            params.push(`completionDaysMax=${filterCompletionDaysMax}`);
        }
        if (filterCreatedFrom) {
            params.push(`createdFrom=${encodeURIComponent(filterCreatedFrom)}`);
        }
        if (filterCreatedTo) {
            params.push(`createdTo=${encodeURIComponent(filterCreatedTo)}`);
        }

        const queryString = params.length > 0 ? `?${params.join("&")}` : "";
        const newUrl = `${$page.url.pathname}${queryString}`;
        await goto(newUrl, { replaceState: true, noScroll: true });
    }

    function handleSearchChange(value: string) {
        tempSearchQuery = value;
    }

    function handleStatusChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterStatus = value;
        } else if (value === null) {
            tempFilterStatus = [];
        } else {
            if (tempFilterStatus.includes(value)) {
                tempFilterStatus = tempFilterStatus.filter((s) => s !== value);
            } else {
                tempFilterStatus = [...tempFilterStatus, value];
            }
        }
    }

    function handleCompletionDaysMinChange(value: string | null) {
        if (value === null || value === "") {
            tempFilterCompletionDaysMin = null;
        } else {
            const num = parseInt(value, 10);
            tempFilterCompletionDaysMin = isNaN(num) ? null : num;
        }
    }

    function handleCompletionDaysMaxChange(value: string | null) {
        if (value === null || value === "") {
            tempFilterCompletionDaysMax = null;
        } else {
            const num = parseInt(value, 10);
            tempFilterCompletionDaysMax = isNaN(num) ? null : num;
        }
    }

    function handleCreatedDateRangeChange(
        from: string | null,
        to: string | null,
    ) {
        tempFilterCreatedFrom = from;
        tempFilterCreatedTo = to;
    }

    function handleResetFilters() {
        // Reset temporary filters
        tempSearchQuery = "";
        tempFilterStatus = [];
        tempFilterCompletionDaysMin = null;
        tempFilterCompletionDaysMax = null;
        tempFilterCreatedFrom = null;
        tempFilterCreatedTo = null;

        // Apply the reset
        searchQuery = "";
        filterStatus = [];
        filterCompletionDaysMin = null;
        filterCompletionDaysMax = null;
        filterCreatedFrom = null;
        filterCreatedTo = null;
    }

    async function handleOpenSearchDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("drawer", "search");
        await goto(`${$page.url.pathname}?${urlParams.toString()}`, {
            noScroll: true,
        });
    }

    async function handleCloseSearchDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.delete("drawer");
        const queryString = urlParams.toString();
        const newUrl = queryString
            ? `${$page.url.pathname}?${queryString}`
            : $page.url.pathname;
        await goto(newUrl, { noScroll: true });
    }

    // Temporary labels for drawer
    const tempStatusLabel = $derived.by(() => {
        if (tempFilterStatus.length === 0) return "Alle statussen";
        if (tempFilterStatus.length === 1) {
            const option = statusOptions.find(
                (opt) => opt.value === tempFilterStatus[0],
            );
            return option?.label || "Alle statussen";
        }
        return `${tempFilterStatus.length} statussen geselecteerd`;
    });

    function getProcessStats(processId: number) {
        return (
            processStatsMap[processId] || {
                stepCount: 0,
                taskCount: 0,
                totalHours: 0,
            }
        );
    }

    async function handleCreateCase(processId: number, event: Event) {
        event.stopPropagation();
        // Use goto with replaceState to prevent full reload
        try {
            await goto(`?drawer=case&processId=${processId}`, {
                replaceState: true,
                noScroll: true,
                keepFocus: true,
                invalidateAll: false,
            });
        } catch (error) {
            // If navigation fails, update URL manually as fallback
            if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("drawer", "case");
                url.searchParams.set("processId", processId.toString());
                window.history.replaceState({}, "", url.toString());
                window.dispatchEvent(new PopStateEvent("popstate"));
            }
        }
    }

    async function openCreateDrawer() {
        // Use goto with replaceState and invalidateAll: false to prevent full reload
        // This should open the drawer immediately without blocking
        try {
            await goto("?drawer=process", {
                replaceState: true,
                noScroll: true,
                keepFocus: true,
                invalidateAll: false,
            });
        } catch (error) {
            // If navigation fails, update URL manually as fallback
            if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("drawer", "process");
                window.history.replaceState({}, "", url.toString());
                window.dispatchEvent(new PopStateEvent("popstate"));
            }
        }
    }

    async function openEditDrawer(processId: number) {
        // Use goto with replaceState and invalidateAll: false to prevent full reload
        try {
            await goto(`?drawer=process&processId=${processId}`, {
                replaceState: true,
                noScroll: true,
                keepFocus: true,
                invalidateAll: false,
            });
        } catch (error) {
            // If navigation fails, update URL manually as fallback
            if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("drawer", "process");
                url.searchParams.set("processId", processId.toString());
                window.history.replaceState({}, "", url.toString());
                window.dispatchEvent(new PopStateEvent("popstate"));
            }
        }
    }

    async function handleProcessCreated(process: Process) {
        // Always redirect to the process page after creation
        // This allows users to immediately add process details (steps, tasks, etc.)
        await goto(`/processes/${process.id}`);
    }

    async function handleProcessUpdated() {
        // Refresh store (cache invalidation will ensure fresh data)
        await processStore.refresh(true);
        await loadStats();
    }

    async function handleStepsUpdated() {
        // Refresh store (cache invalidation will ensure fresh data)
        await processStore.refresh(true);
        await loadStats();
    }

    async function handleCaseCreated(caseData: Case) {
        // Navigate to the newly created case
        await goto(`/cases/${caseData.id}`);
    }

    function handleArchive(id: number, event: Event) {
        event.stopPropagation();
        processToArchive = id;
        confirmModalOpen = true;
    }

    async function confirmArchive() {
        if (processToArchive === null) return;

        archiving = true;
        try {
            const result =
                await processService.archiveProcess(processToArchive);
            if (result.success) {
                // Refresh store (cache invalidation will ensure fresh data)
                await processStore.refresh(true);
                await loadStats();
                confirmModalOpen = false;
                processToArchive = null;
            } else {
                alert("Fout bij archiveren van proces");
            }
        } catch (error) {
            alert("Fout bij archiveren van proces");
        } finally {
            archiving = false;
        }
    }

    function cancelArchive() {
        confirmModalOpen = false;
        processToArchive = null;
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <div class="mb-6">
        <NavCard
            title="Processen"
            subtitle={!loading
                ? `${filteredProcesses.length} proces${filteredProcesses.length !== 1 ? "sen" : ""} gevonden`
                : undefined}
            actions={[
                {
                    icon: Search,
                    label: "Zoeken & Filteren",
                    onclick: handleOpenSearchDrawer,
                    variant: "ghost",
                    badgeCount: activeFilterCount,
                },
            ]}
            class="w-full !py-3 !px-6"
        >
            {#snippet headerContent()}
                <div class="flex items-center gap-4">
                    <IconButton
                        icon={Plus}
                        variant="default"
                        onclick={openCreateDrawer}
                        tooltip="Nieuw proces maken"
                    />
                </div>
            {/snippet}
        </NavCard>
    </div>

    {#if loading}
        <div class="fixed inset-0 flex items-center justify-center">
            <Spinner size="xl" />
        </div>
    {:else if filteredProcesses.length === 0}
        <div class="text-center py-12">
            <p class="text-zinc-500">
                Geen processen gevonden met de huidige filters
            </p>
        </div>
    {:else}
        <!-- Process List -->
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-aos-id-processes
        >
            {#each filteredProcesses as process, index (process.id)}
                {@const processStats = getProcessStats(process.id)}
                <div
                    class="bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer flex flex-col"
                    onclick={() => goto(`/processes/${process.id}`)}
                    role="button"
                    tabindex="0"
                    data-aos="fade-up"
                    data-aos-anchor="[data-aos-id-processes]"
                    data-aos-delay={index * 50}
                >
                    <!-- Header -->
                    <div class="px-4 pt-4 pb-3 border-b border-zinc-100">
                        <div class="mb-0.5">
                            <h3
                                class="text-base font-semibold text-zinc-900 tracking-tight leading-tight font-inter"
                                style="font-style: normal; font-variant: normal;"
                            >
                                {process.name}
                            </h3>
                        </div>
                    </div>

                    <!-- Details section -->
                    <div class="px-4 py-3 flex-1">
                        {#if process.description}
                            <p class="text-zinc-600 text-sm mb-3 line-clamp-2">
                                {process.description}
                            </p>
                        {/if}
                        <div
                            class="flex items-center justify-between gap-3 text-xs"
                        >
                            <div class="flex items-center gap-1.5">
                                <span class="text-zinc-500">Voltooiing</span>
                                <span class="text-zinc-900 font-medium"
                                    >{process.completion_days} dagen</span
                                >
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-zinc-500">Stappen</span>
                                <span class="text-zinc-900 font-medium"
                                    >{processStats.stepCount}</span
                                >
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-zinc-500">Taken</span>
                                <span class="text-zinc-900 font-medium"
                                    >{processStats.taskCount}</span
                                >
                            </div>
                            {#if processStats.totalHours > 0}
                                <div class="flex items-center gap-1.5">
                                    <span class="text-zinc-500">Uren</span>
                                    <span class="text-zinc-900 font-medium"
                                        >{processStats.totalHours}</span
                                    >
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Footer with action buttons -->
                    <div
                        class="px-4 py-3 border-t border-zinc-100 bg-zinc-50 rounded-b-lg"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <!-- Empty space for alignment -->
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <Tooltip text="Case Aanmaken">
                                    <IconButton
                                        icon={FilePlus}
                                        size="sm"
                                        onclick={(e) =>
                                            handleCreateCase(process.id, e)}
                                    />
                                </Tooltip>
                                <Tooltip text="Bewerken">
                                    <IconButton
                                        icon={Pencil}
                                        size="sm"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            openEditDrawer(process.id);
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip text="Archiveren">
                                    <IconButton
                                        icon={Archive}
                                        size="sm"
                                        onclick={(e) =>
                                            handleArchive(process.id, e)}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Search & Filter Drawer (from top) -->
<Drawer
    open={searchDrawerOpen}
    position="top"
    class="w-full max-h-[60vh]"
    disableOverflow={true}
    onclose={handleCloseSearchDrawer}
>
    <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="mb-6">
            <h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                Zoeken & Filteren
            </h2>
        </div>

        <!-- Content -->
        <div class="flex-1">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Search Input -->
                <div class="lg:col-span-2">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Zoeken
                    </div>
                    <SearchInput
                        bind:value={tempSearchQuery}
                        placeholder="Zoek in naam, beschrijving..."
                        showSuggestions={false}
                        showSearchScope={false}
                        onchange={handleSearchChange}
                        isActive={tempSearchQuery.trim().length > 0}
                        class="w-full"
                    />
                </div>

                <!-- Status Filter -->
                <div class="lg:col-span-1 relative z-[60]">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Status
                        {#if tempFilterStatus.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterStatus.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterStatus}
                        options={statusOptions}
                        placeholder={tempStatusLabel}
                        onchange={handleStatusChange}
                        isActive={tempFilterStatus.length > 0}
                        class="w-full"
                        searchable={true}
                    />
                </div>

                <!-- Completion Days Range -->
                <div class="lg:col-span-1 relative z-[60]">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Voltooiing (dagen)
                    </div>
                    <div class="flex gap-2">
                        <input
                            type="number"
                            value={tempFilterCompletionDaysMin ?? ""}
                            oninput={(e) =>
                                handleCompletionDaysMinChange(
                                    e.currentTarget.value,
                                )}
                            placeholder="Min"
                            class="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            value={tempFilterCompletionDaysMax ?? ""}
                            oninput={(e) =>
                                handleCompletionDaysMaxChange(
                                    e.currentTarget.value,
                                )}
                            placeholder="Max"
                            class="flex-1 px-3 py-2 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <!-- Created Date Range Filter -->
                <div class="lg:col-span-2 relative z-[70]">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Aanmaakdatum
                    </div>
                    <DateRangePicker
                        bind:fromDate={tempFilterCreatedFrom}
                        bind:toDate={tempFilterCreatedTo}
                        fromPlaceholder="Van datum"
                        toPlaceholder="Tot datum"
                        onchange={handleCreatedDateRangeChange}
                        isActive={tempFilterCreatedFrom !== null ||
                            tempFilterCreatedTo !== null}
                        class="w-full"
                    />
                </div>
            </div>

            <!-- Apply Button and Selection Count -->
            <div class="mt-4 flex items-center justify-between">
                <div class="text-xs text-zinc-600">
                    {#if tempSearchQuery || tempFilterStatus.length > 0 || tempFilterCompletionDaysMin !== null || tempFilterCompletionDaysMax !== null || tempFilterCreatedFrom || tempFilterCreatedTo}
                        Selectie: {(tempSearchQuery ? 1 : 0) +
                            tempFilterStatus.length +
                            (tempFilterCompletionDaysMin !== null ||
                            tempFilterCompletionDaysMax !== null
                                ? 1
                                : 0) +
                            (tempFilterCreatedFrom || tempFilterCreatedTo
                                ? 1
                                : 0)} filter{(tempSearchQuery ? 1 : 0) +
                            tempFilterStatus.length +
                            (tempFilterCompletionDaysMin !== null ||
                            tempFilterCompletionDaysMax !== null
                                ? 1
                                : 0) +
                            (tempFilterCreatedFrom || tempFilterCreatedTo
                                ? 1
                                : 0) !==
                        1
                            ? "s"
                            : ""} geselecteerd
                    {/if}
                </div>
                <div class="flex items-center gap-2">
                    <Button onclick={applyFilters} variant="default">
                        Tonen
                    </Button>
                    <button
                        onclick={handleResetFilters}
                        class="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        aria-label="Filters resetten"
                        title="Filters resetten"
                    >
                        <Eraser size={18} />
                    </button>
                </div>
            </div>
        </div>
    </div>
</Drawer>

<!-- Drawers -->
<ProcessDrawer
    oncreated={handleProcessCreated}
    onupdated={handleProcessUpdated}
/>

<CaseDrawer oncreated={handleCaseCreated} />

<ProcessStepEditor onupdated={handleStepsUpdated} />

<!-- Confirmation Modal -->
<Modal
    bind:open={confirmModalOpen}
    title="Proces Archiveren"
    size="md"
    closeOnBackdropClick={false}
    loading={archiving}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u dit proces wilt archiveren?
        </p>
        <p class="text-sm text-zinc-500">
            Gearchiveerde processen worden verborgen maar blijven beschikbaar
            voor bestaande cases.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={cancelArchive}
                disabled={archiving}>Annuleren</Button
            >
            <button
                onclick={confirmArchive}
                disabled={archiving}
                class="px-4 py-2 bg-zinc-900 text-white rounded-sm shadow-xs hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {archiving ? "Archiveren..." : "Archiveren"}
            </button>
        </div>
    </div>
</Modal>
