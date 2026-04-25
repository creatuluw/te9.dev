<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { get } from "svelte/store";
    import * as dashboardService from "$lib/services/dashboardService";
    import type { DashboardStats } from "$lib/services/dashboardService";
    import type { Case } from "$lib/services/caseService";
    import type { Process } from "$lib/services/processService";
    import Spinner from "$lib/components/Spinner.svelte";
    import Label from "$lib/components/Label.svelte";
    import { navigationStore } from "$lib/stores/navigationStore";
    // Optimize icon imports - import only what's needed
    import ClipboardList from "lucide-svelte/icons/clipboard-list";
    import CheckCircle2 from "lucide-svelte/icons/check-circle-2";
    import Clock from "lucide-svelte/icons/clock";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import ListTodo from "lucide-svelte/icons/list-todo";
    import Archive from "lucide-svelte/icons/archive";
    import RefreshCcwDot from "lucide-svelte/icons/refresh-ccw-dot";
    import BriefcaseBusiness from "lucide-svelte/icons/briefcase-business";
    import ClipboardCheck from "lucide-svelte/icons/clipboard-check";
    import List from "lucide-svelte/icons/list";
    import FolderKanban from "lucide-svelte/icons/folder-kanban";
    import IconButton from "$lib/components/IconButton.svelte";
    import type { PageData } from "./$types";
    import { dashboardCache } from "$lib/stores/dashboardCache";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    // Use pre-loaded data from +page.ts
    let stats = $state<DashboardStats | null>(data.stats);
    let loading = $state(false);

    // Cache the initial data
    if (stats) {
        dashboardCache.setCache(stats);
    }

    // Lazy load drawer components only when needed
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const shouldLoadDrawers = $derived(
        drawerParam === "process" || drawerParam === "case",
    );

    async function loadData(bypassCache = false) {
        // Check cache first if not bypassing
        if (!bypassCache) {
            const cached = dashboardCache.getCache(get(dashboardCache));
            if (cached) {
                stats = cached;
                return;
            }
        }

        loading = true;
        navigationStore.startPageLoading();
        const result = await dashboardService.getDashboardStats();
        if (result.success) {
            stats = result.value;
            dashboardCache.setCache(result.value);
        } else {
            console.error("Error loading dashboard data:", result.error);
            stats = null;
        }
        loading = false;
        navigationStore.stopPageLoading();
    }

    async function handleProcessCreated(process: Process) {
        // Clear cache when data changes
        dashboardCache.clearCache();

        // Always redirect to the process edit page after creation
        // This allows users to immediately add process details (steps, tasks, etc.)
        await goto(`/processes/${process.id}`);
    }

    async function handleProcessUpdated() {
        // Clear cache when data changes
        dashboardCache.clearCache();
        await loadData(true); // Bypass cache
    }

    async function handleCaseCreated(caseData: Case) {
        // Clear cache when data changes
        dashboardCache.clearCache();

        // When creating from homepage, redirect to the case detail page
        const currentPath = get(page).url.pathname;
        if (currentPath === "/") {
            await goto(`/cases/${caseData.id}`);
        } else {
            await loadData(true); // Bypass cache
            // Navigate to the newly created case
            await goto(`/cases/${caseData.id}`);
        }
    }

    async function handleNewProcess() {
        await goto("/processes?drawer=process", { noScroll: true });
    }

    async function handleNewCase() {
        await goto("/cases?drawer=case", { noScroll: true });
    }

    async function handleNewTask() {
        await goto("/work?drawer=workitem", { noScroll: true });
    }

    async function handleBacklog() {
        await goto("/work/backlog");
    }

    async function handleProjects() {
        await goto("/projects");
    }
</script>

<svelte:head>
    <title>Kees - Business Process Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    {#if loading}
        <div class="fixed inset-0 flex items-center justify-center">
            <Spinner size="xl" />
        </div>
    {:else if stats}
        <!-- Task Status Cards -->
        <div class="mb-8">
            <h2 class="text-xl font-semibold text-zinc-900 mb-4">Taken</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <!-- Backlog Tasks Card -->
                <button
                    onclick={() => goto("/work-items?status=backlog")}
                    class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 0ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition-colors"
                        >
                            <Archive class="w-5 h-5 text-zinc-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-zinc-600 mb-1">Backlog</div>
                        <div class="text-2xl font-bold text-zinc-900">
                            {stats.backlogTasks}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 text-xs">
                        <Label>help: {stats.backlogTasksByType.help}</Label>
                        <Label>case: {stats.backlogTasksByType.process}</Label>
                        <Label>normaal: {stats.backlogTasksByType.manual}</Label
                        >
                    </div>
                </button>

                <!-- Pending Tasks Card -->
                <button
                    onclick={() => goto("/work-items?status=gepland")}
                    class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 100ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition-colors"
                        >
                            <Clock class="w-5 h-5 text-zinc-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-zinc-600 mb-1">Gepland</div>
                        <div class="text-2xl font-bold text-zinc-900">
                            {stats.pendingTasks}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 text-xs">
                        <Label>help: {stats.pendingTasksByType.help}</Label>
                        <Label>case: {stats.pendingTasksByType.process}</Label>
                        <Label>normaal: {stats.pendingTasksByType.manual}</Label
                        >
                    </div>
                </button>

                <!-- Active Tasks Card -->
                <button
                    onclick={() =>
                        goto("/work-items?status=mee_bezig,in_review")}
                    class="bg-white rounded-lg shadow-xs border border-blue-200 p-6 hover:shadow-sm hover:border-blue-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 200ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors"
                        >
                            <ListTodo class="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-blue-600 mb-1">
                            In behandeling
                        </div>
                        <div class="text-2xl font-bold text-blue-900">
                            {stats.activeTasksCount}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 text-xs">
                        <Label>help: {stats.activeTasksByType.help}</Label>
                        <Label>case: {stats.activeTasksByType.process}</Label>
                        <Label>normaal: {stats.activeTasksByType.manual}</Label>
                    </div>
                </button>

                <!-- Completed Tasks Card -->
                <button
                    onclick={() => goto("/work-items?status=afgerond")}
                    class="bg-white rounded-lg shadow-xs border border-green-200 p-6 hover:shadow-sm hover:border-green-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 300ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors"
                        >
                            <CheckCircle2 class="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-green-600 mb-1">Afgerond</div>
                        <div class="text-2xl font-bold text-green-900">
                            {stats.completedTasksCount}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 text-xs">
                        <Label>help: {stats.completedTasksByType.help}</Label>
                        <Label>case: {stats.completedTasksByType.process}</Label
                        >
                        <Label
                            >normaal: {stats.completedTasksByType.manual}</Label
                        >
                    </div>
                </button>

                <!-- Overdue Tasks Card -->
                <button
                    onclick={() => goto("/work-items?status=overdue")}
                    class="bg-white rounded-lg shadow-xs border border-red-200 p-6 hover:shadow-sm hover:border-red-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 400ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors"
                        >
                            <AlertCircle class="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-red-600 mb-1">Te laat</div>
                        <div class="text-2xl font-bold text-red-900">
                            {stats.overdueTasks}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 text-xs">
                        <Label>help: {stats.overdueTasksByType.help}</Label>
                        <Label>case: {stats.overdueTasksByType.process}</Label>
                        <Label>normaal: {stats.overdueTasksByType.manual}</Label
                        >
                    </div>
                </button>
            </div>
        </div>

        <!-- Case Status Cards -->
        <div class="mb-8">
            <h2 class="text-xl font-semibold text-zinc-900 mb-4">Cases</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Pending Cases Card -->
                <button
                    onclick={() => goto("/cases?status=gepland")}
                    class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 500ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition-colors"
                        >
                            <Clock class="w-5 h-5 text-zinc-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-zinc-600 mb-1">Gepland</div>
                        <div class="text-2xl font-bold text-zinc-900">
                            {stats.pendingCases}
                        </div>
                    </div>
                    <p
                        class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                    >
                        Cases die wachten om te starten
                    </p>
                </button>

                <!-- Active Cases Card -->
                <button
                    onclick={() => goto("/cases?status=mee_bezig")}
                    class="bg-white rounded-lg shadow-xs border border-blue-200 p-6 hover:shadow-sm hover:border-blue-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 600ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors"
                        >
                            <ClipboardList class="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-blue-600 mb-1">Mee bezig</div>
                        <div class="text-2xl font-bold text-blue-900">
                            {stats.activeCases}
                        </div>
                    </div>
                    <p
                        class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                    >
                        Cases die momenteel in behandeling zijn
                    </p>
                </button>

                <!-- Completed Cases Card -->
                <button
                    onclick={() => goto("/cases?status=afgerond")}
                    class="bg-white rounded-lg shadow-xs border border-green-200 p-6 hover:shadow-sm hover:border-green-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 700ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors"
                        >
                            <CheckCircle2 class="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-green-600 mb-1">Afgerond</div>
                        <div class="text-2xl font-bold text-green-900">
                            {stats.completedCases}
                        </div>
                    </div>
                    <p
                        class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                    >
                        Cases die succesvol zijn afgerond
                    </p>
                </button>

                <!-- Overdue Cases Card -->
                <button
                    onclick={() => goto("/cases?status=overdue")}
                    class="bg-white rounded-lg shadow-xs border border-red-200 p-6 hover:shadow-sm hover:border-red-300 transition-all text-left group relative animate-fade-in-up"
                    style="animation-delay: 800ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="absolute top-6 right-6">
                        <div
                            class="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors"
                        >
                            <AlertCircle class="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="text-sm text-red-600 mb-1">Te laat</div>
                        <div class="text-2xl font-bold text-red-900">
                            {stats.overdueCases}
                        </div>
                    </div>
                    <p
                        class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                    >
                        Cases die de deadline hebben overschreden
                    </p>
                </button>
            </div>
        </div>

        <!-- Process Details -->
        {#if stats?.processes && stats.processes.length > 0}
            <div class="mb-8">
                <div
                    class="bg-white rounded-lg shadow-xs border border-zinc-200 overflow-hidden animate-fade-in-up"
                    style="animation-delay: 900ms; animation-duration: 500ms; animation-fill-mode: both;"
                >
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider"
                                    >
                                        Proces
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider"
                                    >
                                        Gepland
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider"
                                    >
                                        Mee bezig
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider"
                                    >
                                        Afgerond
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider"
                                    >
                                        Te laat
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-zinc-200">
                                {#each stats?.processes || [] as process (process.id)}
                                    <tr
                                        class="hover:bg-zinc-50 transition-colors"
                                    >
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onclick={() =>
                                                    goto(`/processes`)}
                                                class="text-sm font-medium text-zinc-900 hover:text-zinc-700"
                                            >
                                                {process.name}
                                            </button>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="text-sm text-zinc-900 font-medium"
                                                >{process.pendingCases}</span
                                            >
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="text-sm text-blue-600 font-medium"
                                                >{process.activeCases}</span
                                            >
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="text-sm text-green-600 font-medium"
                                                >{process.completedCases}</span
                                            >
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="text-sm text-red-600 font-medium"
                                                >{process.overdueCases}</span
                                            >
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        {/if}
    {:else}
        <div
            class="text-center py-12 bg-white rounded-lg border border-zinc-200"
        >
            <p class="text-zinc-500">Geen data beschikbaar.</p>
        </div>
    {/if}
</div>

<!-- Lazy load drawers only when needed -->
{#if shouldLoadDrawers}
    {#await Promise.all( [import("$lib/components/ProcessDrawer.svelte"), import("$lib/components/CaseDrawer.svelte")], )}
        <!-- Loading drawers -->
    {:then [ProcessDrawerModule, CaseDrawerModule]}
        <ProcessDrawerModule.default
            oncreated={handleProcessCreated}
            onupdated={handleProcessUpdated}
        />
        <CaseDrawerModule.default oncreated={handleCaseCreated} />
    {/await}
{/if}
