<script lang="ts">
    import type { Task } from "$lib/schemas/task";
    import { formatDate } from "$lib/services/deadlineService";

    interface Props {
        /** Work item data */
        workItem: Task;
        /** Assignee name (if available) */
        assigneeName?: string | null;
        /** Project name (if available) */
        projectName?: string | null;
    }

    let { workItem, assigneeName = null, projectName = null }: Props = $props();

    // Translate kanban status
    function translateKanbanStatus(status: string): string {
        const translations: Record<string, string> = {
            backlog: "Backlog",
            gepland: "Gepland",
            mee_bezig: "Mee bezig",
            in_review: "In review",
            afgerond: "Afgerond",
            overdue: "Achterstallig",
        };
        return translations[status] || status;
    }

    // Get status color
    function getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            backlog:
                "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
            gepland:
                "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            mee_bezig:
                "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
            in_review:
                "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
            afgerond:
                "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            overdue:
                "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        };
        return colors[status] || colors.backlog;
    }
</script>

<div class="py-2 sm:py-3">
    <!-- Grid section - constrained width -->
    <div class="mx-2 max-w-2xl px-1 lg:max-w-7xl lg:px-1">
        <div
            class="mt-2 grid grid-cols-1 gap-2 sm:mt-3 lg:grid-cols-6 lg:grid-rows-2"
        >
            <!-- Task Details - Large card (4 cols) -->
            <div class="flex p-px lg:col-span-4">
                <div
                    class="w-full overflow-hidden rounded-lg bg-white shadow-sm outline outline-black/5 max-lg:rounded-t-4xl lg:rounded-tl-4xl dark:bg-zinc-800 dark:shadow-none dark:outline-white/15"
                >
                    <div class="p-6">
                        <h3
                            class="text-sm/4 font-semibold text-zinc-500 dark:text-zinc-400"
                        >
                            Taak Details
                        </h3>
                        <p
                            class="mt-2 text-lg font-medium tracking-tight text-zinc-900 dark:text-white"
                        >
                            Informatie over de taak
                        </p>

                        <div class="mt-6 space-y-6">
                            {#if workItem.voor_wie_is_het}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Voor wie is het?
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap"
                                    >
                                        {workItem.voor_wie_is_het}
                                    </p>
                                </div>
                            {/if}

                            {#if workItem.wat_ga_je_doen}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Wat ga je doen?
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap"
                                    >
                                        {workItem.wat_ga_je_doen}
                                    </p>
                                </div>
                            {/if}

                            {#if workItem.waarom_doe_je_het}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Waarom doe je het?
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap"
                                    >
                                        {workItem.waarom_doe_je_het}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Assignment & Status - Medium card (2 cols) -->
            <div class="flex p-px lg:col-span-2">
                <div
                    class="w-full overflow-hidden rounded-lg bg-white shadow-sm outline outline-black/5 lg:rounded-tr-4xl dark:bg-zinc-800 dark:shadow-none dark:outline-white/15"
                >
                    <div class="p-6">
                        <h3
                            class="text-sm/4 font-semibold text-zinc-500 dark:text-zinc-400"
                        >
                            Toewijzing & Status
                        </h3>
                        <p
                            class="mt-2 text-lg font-medium tracking-tight text-zinc-900 dark:text-white"
                        >
                            Wie en waar
                        </p>

                        <div class="mt-6 space-y-4">
                            {#if assigneeName}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Toegewezen aan
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400"
                                    >
                                        {assigneeName}
                                    </p>
                                </div>
                            {/if}

                            {#if workItem.kanban_status}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Kanban status
                                    </h4>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(
                                            workItem.kanban_status,
                                        )}"
                                    >
                                        {translateKanbanStatus(
                                            workItem.kanban_status,
                                        )}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timeline - Medium card (2 cols) -->
            <div class="flex p-px lg:col-span-2">
                <div
                    class="w-full overflow-hidden rounded-lg bg-white shadow-sm outline outline-black/5 lg:rounded-bl-4xl dark:bg-zinc-800 dark:shadow-none dark:outline-white/15"
                >
                    <div class="p-6">
                        <h3
                            class="text-sm/4 font-semibold text-zinc-500 dark:text-zinc-400"
                        >
                            Tijdlijn
                        </h3>
                        <p
                            class="mt-2 text-lg font-medium tracking-tight text-zinc-900 dark:text-white"
                        >
                            Deadline & uren
                        </p>

                        <div class="mt-6 space-y-4">
                            {#if workItem.deadline}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Deadline
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400"
                                    >
                                        {formatDate(workItem.deadline)}
                                    </p>
                                </div>
                            {/if}

                            {#if workItem.uren !== null && workItem.uren !== undefined}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Uren
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400"
                                    >
                                        {workItem.uren} uur
                                    </p>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Source & Context - Large card (4 cols) -->
            <div class="flex p-px lg:col-span-4">
                <div
                    class="w-full overflow-hidden rounded-lg bg-white shadow-sm outline outline-black/5 max-lg:rounded-b-4xl lg:rounded-br-4xl dark:bg-zinc-800 dark:shadow-none dark:outline-white/15"
                >
                    <div class="p-6">
                        <h3
                            class="text-sm/4 font-semibold text-zinc-500 dark:text-zinc-400"
                        >
                            Bron & Context
                        </h3>
                        <p
                            class="mt-2 text-lg font-medium tracking-tight text-zinc-900 dark:text-white"
                        >
                            Herkomst en project
                        </p>

                        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {#if workItem.komt_van}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Komt van
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400"
                                    >
                                        {workItem.komt_van}
                                    </p>
                                </div>
                            {/if}

                            {#if projectName}
                                <div>
                                    <h4
                                        class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                    >
                                        Project
                                    </h4>
                                    <p
                                        class="text-sm/6 text-zinc-600 dark:text-zinc-400"
                                    >
                                        {projectName}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
