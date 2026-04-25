<script lang="ts">
    import { onMount } from "svelte";
    import { Spinner, Label } from "$lib/components";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import { queryTableResult } from "$lib/utils/postgrest";
    import { BarChart3, Download, Filter, RefreshCw } from "lucide-svelte";

    interface TaskData {
        id: number;
        task_type: string;
        subject: string | null;
        assignee_id: string | null;
        project_id: number | null;
        priority: string;
        status: string;
        kanban_status: string;
        deadline: string | null;
        started_at: string | null;
        completed_at: string | null;
        created_at: string;
        uren: number | null;
        voor_wie_is_het: string | null;
        wat_ga_je_doen: string | null;
        relevantie: number | null;
        closed: boolean;
    }

    interface ProjectData {
        id: number;
        name: string;
        status: string;
        created_at: string;
    }

    interface CaseData {
        id: number;
        name: string;
        status: string;
        start_date: string;
        completion_deadline: string;
        owner_id: string | null;
        project_id: number | null;
        created_at: string;
    }

    interface AggregatedStats {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        backlogTasks: number;
        overdueTasks: number;
        totalEstimatedHours: number;
        totalProjects: number;
        activeProjects: number;
        totalCases: number;
        activeCases: number;
        completionRate: number;
        avgTasksPerProject: number;
    }

    // State
    let tasks = $state<TaskData[]>([]);
    let projects = $state<ProjectData[]>([]);
    let cases = $state<CaseData[]>([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Filters
    let filterTimeRange = $state<string>("all"); // all, week, month, quarter
    let filterAssignee = $state<string>("all");
    let filterProject = $state<string>("all");
    let filterStatus = $state<string>("all");
    let filterPriority = $state<string>("all");

    // Computed statistics
    let stats = $derived<AggregatedStats>(calculateStats());
    let filteredTasks = $derived(applyFilters());
    let uniqueAssignees = $derived(getUniqueAssignees());

    // Load data on mount
    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        isLoading = true;
        error = null;

        try {
            // Load tasks
            const tasksResult = await queryTableResult<TaskData>("_bpm_tasks", {
                order: "created_at.desc",
            });

            if (!tasksResult.success) {
                error = getUserMessage(tasksResult.error);
                toastStore.add(error, "error");
                isLoading = false;
                return;
            }

            tasks = tasksResult.value.data || [];

            // Load projects
            const projectsResult = await queryTableResult<ProjectData>(
                "_bpm_projects",
                {
                    order: "created_at.desc",
                },
            );

            if (projectsResult.success) {
                projects = projectsResult.value.data || [];
            }

            // Load cases
            const casesResult = await queryTableResult<CaseData>("_bpm_cases", {
                order: "created_at.desc",
            });

            if (casesResult.success) {
                cases = casesResult.value.data || [];
            }
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Fout bij laden van data";
            toastStore.add(error, "error");
        } finally {
            isLoading = false;
        }
    }

    function calculateStats(): AggregatedStats {
        const filtered = applyFilters();
        const completedTasks = filtered.filter(
            (t) => t.kanban_status === "afgerond" || t.closed,
        ).length;
        const inProgressTasks = filtered.filter(
            (t) => t.kanban_status === "in_behandeling",
        ).length;
        const backlogTasks = filtered.filter(
            (t) =>
                t.kanban_status === "gepland" || t.kanban_status === "backlog",
        ).length;
        const now = new Date();
        const overdueTasks = filtered.filter((t) => {
            if (!t.deadline || t.closed) return false;
            return new Date(t.deadline) < now;
        }).length;

        const totalEstimatedHours = filtered.reduce(
            (sum, t) => sum + (t.uren || 0),
            0,
        );
        const activeProjects = projects.filter(
            (p) => p.status === "active",
        ).length;
        const activeCases = cases.filter(
            (c) => c.status === "mee_bezig" || c.status === "pending",
        ).length;

        return {
            totalTasks: filtered.length,
            completedTasks,
            inProgressTasks,
            backlogTasks,
            overdueTasks,
            totalEstimatedHours,
            totalProjects: projects.length,
            activeProjects,
            totalCases: cases.length,
            activeCases,
            completionRate:
                filtered.length > 0
                    ? (completedTasks / filtered.length) * 100
                    : 0,
            avgTasksPerProject:
                projects.length > 0 ? filtered.length / projects.length : 0,
        };
    }

    function applyFilters(): TaskData[] {
        return tasks.filter((task) => {
            // Time range filter
            if (filterTimeRange !== "all") {
                const taskDate = new Date(task.created_at);
                const now = new Date();
                const daysDiff = Math.floor(
                    (now.getTime() - taskDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                );

                if (filterTimeRange === "week" && daysDiff > 7) return false;
                if (filterTimeRange === "month" && daysDiff > 30) return false;
                if (filterTimeRange === "quarter" && daysDiff > 90)
                    return false;
            }

            // Assignee filter
            if (
                filterAssignee !== "all" &&
                task.assignee_id !== filterAssignee
            ) {
                return false;
            }

            // Project filter
            if (filterProject !== "all") {
                const projectId = parseInt(filterProject);
                if (task.project_id !== projectId) return false;
            }

            // Status filter
            if (filterStatus !== "all" && task.kanban_status !== filterStatus) {
                return false;
            }

            // Priority filter
            if (filterPriority !== "all" && task.priority !== filterPriority) {
                return false;
            }

            return true;
        });
    }

    function getUniqueAssignees(): string[] {
        const assignees = new Set<string>();
        tasks.forEach((t) => {
            if (t.assignee_id) assignees.add(t.assignee_id);
        });
        return Array.from(assignees).sort();
    }

    function resetFilters() {
        filterTimeRange = "all";
        filterAssignee = "all";
        filterProject = "all";
        filterStatus = "all";
        filterPriority = "all";
    }

    function formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("nl-NL", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
        } catch {
            return dateStr;
        }
    }

    function formatNumber(value: number, decimals: number = 1): string {
        return value.toFixed(decimals);
    }

    type LabelVariant = "default" | "success" | "warning" | "danger";

    function getStatusColor(status: string): LabelVariant {
        const statusMap: Record<string, LabelVariant> = {
            afgerond: "success",
            in_behandeling: "default",
            gepland: "warning",
            backlog: "default",
        };
        return statusMap[status] || "default";
    }

    function getPriorityColor(priority: string): LabelVariant {
        const priorityMap: Record<string, LabelVariant> = {
            urgent: "danger",
            hoog: "warning",
            normaal: "default",
            laag: "default",
        };
        return priorityMap[priority] || "default";
    }

    function exportToCSV() {
        const headers = [
            "ID",
            "Onderwerp",
            "Toegewezen aan",
            "Project ID",
            "Prioriteit",
            "Status",
            "Deadline",
            "Uren",
            "Gemaakt op",
        ];

        const rows = filteredTasks.map((t) => [
            t.id,
            t.subject || "-",
            t.assignee_id || "-",
            t.project_id || "-",
            t.priority,
            t.kanban_status,
            t.deadline ? formatDate(t.deadline) : "-",
            t.uren || 0,
            formatDate(t.created_at),
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `operational-report-${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
</script>

<svelte:head>
    <title>Operationeel Rapport - Kees Pippeloi</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[95vw] space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <BarChart3 class="w-6 h-6 text-zinc-600" />
            <h1 class="text-2xl font-medium text-zinc-900 font-aspekta">
                Operationeel Rapport
            </h1>
        </div>
        <div class="flex items-center gap-2">
            <button
                type="button"
                onclick={resetFilters}
                class="px-3 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm flex items-center gap-2"
            >
                <Filter size={16} />
                Reset Filters
            </button>
            <button
                type="button"
                onclick={exportToCSV}
                class="px-3 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm flex items-center gap-2"
            >
                <Download size={16} />
                Exporteer CSV
            </button>
            <button
                type="button"
                onclick={loadData}
                class="px-3 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm flex items-center gap-2"
                disabled={isLoading}
            >
                <RefreshCw size={16} class={isLoading ? "animate-spin" : ""} />
                Ververs
            </button>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <!-- Time Range Filter -->
            <div>
                <label
                    for="filter-time"
                    class="block text-xs font-medium text-zinc-600 mb-1"
                >
                    Tijdsbereik
                </label>
                <select
                    id="filter-time"
                    bind:value={filterTimeRange}
                    class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                    <option value="all">Alle tijd</option>
                    <option value="week">Laatste week</option>
                    <option value="month">Laatste maand</option>
                    <option value="quarter">Laatste kwartaal</option>
                </select>
            </div>

            <!-- Assignee Filter -->
            <div>
                <label
                    for="filter-assignee"
                    class="block text-xs font-medium text-zinc-600 mb-1"
                >
                    Toegewezen aan
                </label>
                <select
                    id="filter-assignee"
                    bind:value={filterAssignee}
                    class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                    <option value="all">Iedereen</option>
                    {#each uniqueAssignees as assignee}
                        <option value={assignee}>{assignee}</option>
                    {/each}
                </select>
            </div>

            <!-- Project Filter -->
            <div>
                <label
                    for="filter-project"
                    class="block text-xs font-medium text-zinc-600 mb-1"
                >
                    Project
                </label>
                <select
                    id="filter-project"
                    bind:value={filterProject}
                    class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                    <option value="all">Alle projecten</option>
                    {#each projects as project}
                        <option value={project.id.toString()}
                            >{project.name}</option
                        >
                    {/each}
                </select>
            </div>

            <!-- Status Filter -->
            <div>
                <label
                    for="filter-status"
                    class="block text-xs font-medium text-zinc-600 mb-1"
                >
                    Status
                </label>
                <select
                    id="filter-status"
                    bind:value={filterStatus}
                    class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                    <option value="all">Alle statussen</option>
                    <option value="backlog">Backlog</option>
                    <option value="gepland">Gepland</option>
                    <option value="in_behandeling">In behandeling</option>
                    <option value="afgerond">Afgerond</option>
                </select>
            </div>

            <!-- Priority Filter -->
            <div>
                <label
                    for="filter-priority"
                    class="block text-xs font-medium text-zinc-600 mb-1"
                >
                    Prioriteit
                </label>
                <select
                    id="filter-priority"
                    bind:value={filterPriority}
                    class="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                    <option value="all">Alle prioriteiten</option>
                    <option value="urgent">Urgent</option>
                    <option value="hoog">Hoog</option>
                    <option value="normaal">Normaal</option>
                    <option value="laag">Laag</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Loading State -->
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
                    onclick={loadData}
                    class="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm"
                >
                    Opnieuw proberen
                </button>
            </div>
        </div>
    {:else}
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Tasks -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Totaal taken
                </div>
                <div class="text-2xl font-medium text-zinc-900">
                    {stats.totalTasks}
                </div>
                <div class="text-xs text-zinc-500 mt-1">
                    {stats.completedTasks} afgerond, {stats.inProgressTasks} bezig,
                    {stats.backlogTasks} gepland
                </div>
            </div>

            <!-- Completion Rate -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Voltooiingsgraad
                </div>
                <div class="text-2xl font-medium text-zinc-900">
                    {formatNumber(stats.completionRate)}%
                </div>
                <div class="text-xs text-zinc-500 mt-1">
                    {stats.completedTasks} van {stats.totalTasks} taken
                </div>
            </div>

            <!-- Overdue Tasks -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Verlopen taken
                </div>
                <div class="text-2xl font-medium text-red-600">
                    {stats.overdueTasks}
                </div>
                <div class="text-xs text-zinc-500 mt-1">Actie vereist</div>
            </div>

            <!-- Total Estimated Hours -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Totaal uren
                </div>
                <div class="text-2xl font-medium text-zinc-900">
                    {formatNumber(stats.totalEstimatedHours, 0)}
                </div>
                <div class="text-xs text-zinc-500 mt-1">Geschatte uren</div>
            </div>

            <!-- Projects -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Projecten
                </div>
                <div class="text-2xl font-medium text-zinc-900">
                    {stats.totalProjects}
                </div>
                <div class="text-xs text-zinc-500 mt-1">
                    {stats.activeProjects} actief
                </div>
            </div>

            <!-- Cases -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Cases
                </div>
                <div class="text-2xl font-medium text-zinc-900">
                    {stats.totalCases}
                </div>
                <div class="text-xs text-zinc-500 mt-1">
                    {stats.activeCases} actief
                </div>
            </div>

            <!-- Avg Tasks per Project -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Gem. taken per project
                </div>
                <div class="text-2xl font-medium text-zinc-900">
                    {formatNumber(stats.avgTasksPerProject, 1)}
                </div>
                <div class="text-xs text-zinc-500 mt-1">Gemiddelde</div>
            </div>

            <!-- Active Work -->
            <div
                class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
            >
                <div
                    class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1"
                >
                    Actief werk
                </div>
                <div class="text-2xl font-medium text-blue-600">
                    {stats.inProgressTasks}
                </div>
                <div class="text-xs text-zinc-500 mt-1">In behandeling</div>
            </div>
        </div>

        <!-- Tasks Table -->
        <div
            class="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-zinc-200">
                <h2 class="text-lg font-medium text-zinc-900 font-aspekta">
                    Taken ({filteredTasks.length})
                </h2>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                ID
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                Onderwerp
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                Toegewezen aan
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                Prioriteit
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                Status
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                Deadline
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                Uren
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta"
                            >
                                Relevantie
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-200">
                        {#each filteredTasks as task}
                            {@const isOverdue =
                                task.deadline &&
                                !task.closed &&
                                new Date(task.deadline) < new Date()}
                            <tr
                                class="hover:bg-zinc-50 transition-colors {isOverdue
                                    ? 'bg-red-50'
                                    : ''}"
                            >
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div
                                        class="text-sm font-medium text-zinc-900"
                                    >
                                        #{task.id}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div
                                        class="text-sm text-zinc-900 max-w-md truncate"
                                    >
                                        {task.subject ||
                                            task.wat_ga_je_doen ||
                                            "-"}
                                    </div>
                                    {#if task.voor_wie_is_het}
                                        <div class="text-xs text-zinc-500 mt-1">
                                            Voor: {task.voor_wie_is_het}
                                        </div>
                                    {/if}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-zinc-900">
                                        {task.assignee_id || "-"}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <Label
                                        variant={getPriorityColor(
                                            task.priority,
                                        )}>{task.priority}</Label
                                    >
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <Label
                                        variant={getStatusColor(
                                            task.kanban_status,
                                        )}>{task.kanban_status}</Label
                                    >
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div
                                        class="text-sm text-zinc-900 {isOverdue
                                            ? 'text-red-600 font-medium'
                                            : ''}"
                                    >
                                        {formatDate(task.deadline)}
                                    </div>
                                    {#if isOverdue}
                                        <Label
                                            variant="danger"
                                            class="text-xs mt-1">Verlopen</Label
                                        >
                                    {/if}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-zinc-900">
                                        {task.uren
                                            ? formatNumber(task.uren, 1)
                                            : "-"}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-zinc-900">
                                        {#if task.relevantie}
                                            {"★".repeat(
                                                task.relevantie,
                                            )}{"☆".repeat(5 - task.relevantie)}
                                        {:else}
                                            -
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                        {#if filteredTasks.length === 0}
                            <tr>
                                <td
                                    colspan="8"
                                    class="px-6 py-12 text-center text-zinc-500"
                                >
                                    Geen taken gevonden met de huidige filters
                                </td>
                            </tr>
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
