<script lang="ts">
    import type { UnifiedBacklogItem } from "$lib/services/taskService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Project } from "$lib/schemas/project";
    import { formatUserName } from "$lib/utils/userUtils";

    let {
        items,
        userMap,
        projectMap = new Map(),
        groupBy = "assignee",
    }: {
        /** Filtered backlog items to display in chart */
        items: UnifiedBacklogItem[];

        /** Users map for lookup */
        userMap: Map<string, PocketBaseUser>;

        /** Projects map for lookup (optional, needed for project grouping) */
        projectMap?: Map<number, Project>;

        /** Grouping method */
        groupBy?: "assignee" | "project" | "source" | "week";
    } = $props();

    interface ChartItem {
        label: string;
        hours: number;
        count: number;
        weekNumber?: number;
        isUnplanned?: boolean;
    }

    // Helper: Get ISO week number and year from date
    function getISOWeek(date: Date): { week: number; year: number } {
        const tempDate = new Date(date.valueOf());
        tempDate.setHours(0, 0, 0, 0);
        tempDate.setDate(
            tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7),
        );
        const week1 = new Date(tempDate.getFullYear(), 0, 4);
        const weekNumber =
            1 +
            Math.round(
                ((tempDate.getTime() - week1.getTime()) / 86400000 -
                    3 +
                    ((week1.getDay() + 6) % 7)) /
                    7,
            );
        return { week: weekNumber, year: tempDate.getFullYear() };
    }

    // Helper: Get week start (Monday) and end (Sunday) dates
    function getWeekDateRange(
        year: number,
        week: number,
    ): { start: Date; end: Date } {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dayOfWeek = simple.getDay();
        const ISOweekStart = simple;
        if (dayOfWeek <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }
        const weekEnd = new Date(ISOweekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return { start: ISOweekStart, end: weekEnd };
    }

    // Helper: Format week label as "Wk-{number} ({start_date}-{end_date})"
    function formatWeekLabel(week: number, year: number): string {
        const { start, end } = getWeekDateRange(year, week);
        const formatDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
        return `Wk-${week} (${formatDate(start)}-${formatDate(end)})`;
    }

    // Helper: Get current ISO week
    function getCurrentISOWeek(): { week: number; year: number } {
        return getISOWeek(new Date());
    }

    // Compute chart data
    function computeChartData(
        items: UnifiedBacklogItem[],
        userMap: Map<string, PocketBaseUser>,
        projectMap: Map<number, Project>,
        groupBy: string,
    ): ChartItem[] {
        const grouped = new Map<
            string,
            {
                hours: number;
                count: number;
                label: string;
                weekNumber?: number;
                isUnplanned?: boolean;
            }
        >();
        const localGroupBy = groupBy;

        items.forEach((item) => {
            let key: string;
            let label: string;

            if (groupBy === "assignee") {
                // Group by assignee - split hours when multiple assignees
                const assigneeIds = Array.isArray(item.assignee_id)
                    ? item.assignee_id
                    : item.assignee_id
                      ? [item.assignee_id]
                      : [];

                const allAssigneeIds: string[] = [];

                // Collect all assignee IDs
                if (assigneeIds.length > 0) {
                    allAssigneeIds.push(...assigneeIds);
                } else if (item.owner_id) {
                    allAssigneeIds.push(item.owner_id);
                }

                // Process each assignee individually
                if (allAssigneeIds.length === 0) {
                    // No assignees - add as unassigned
                    key = "__unassigned__";
                    label = "Niet toegewezen";
                    const hours = Number(item.uren) || 0;
                    const existing = grouped.get(key);

                    if (existing) {
                        existing.hours += hours;
                        existing.count += 1;
                    } else {
                        grouped.set(key, {
                            hours,
                            count: 1,
                            label,
                        });
                    }
                    return; // Skip to next item
                }

                // Each assignee gets the full hours from the task (for workload planning)
                // The task.uren is the sum of all assignee hours, so we need to get per-assignee hours
                // For now, we'll use the task total divided by assignee count as an approximation
                // In the future, we should fetch actual per-assignee hours from _bpm_task_assignees.uren
                const taskTotalHours = Number(item.uren) || 0;
                // Since each assignee gets full hours, and task total is sum, we divide to get per-assignee hours
                const hoursPerAssignee =
                    allAssigneeIds.length > 0
                        ? taskTotalHours / allAssigneeIds.length
                        : 0;

                // Add hours for each assignee individually (each gets their allocated hours)
                for (const assigneeId of allAssigneeIds) {
                    const user = userMap.get(assigneeId);
                    // Group all unknown users together
                    if (user) {
                        key = assigneeId;
                        label = formatUserName(user);
                    } else {
                        key = "__unknown__";
                        label = "Onbekend";
                    }

                    const existing = grouped.get(key);
                    if (existing) {
                        existing.hours += hoursPerAssignee;
                        existing.count += 1;
                    } else {
                        grouped.set(key, {
                            hours: hoursPerAssignee,
                            count: 1,
                            label,
                        });
                    }
                }

                return; // Skip default processing for assignee grouping
            } else if (groupBy === "project") {
                // Group by project
                if (item.project_id) {
                    key = `project_${item.project_id}`;
                    const project = projectMap.get(item.project_id);
                    label = project
                        ? project.name
                        : `Project ${item.project_id}`;
                } else {
                    key = "__no_project__";
                    label = "Geen project";
                }
            } else if (groupBy === "week") {
                // Group by ISO week based on deadline or due_date
                const dateStr = item.deadline || item.due_date;

                if (dateStr) {
                    const date = new Date(dateStr);
                    const { week, year } = getISOWeek(date);
                    const currentWeek = getCurrentISOWeek();

                    // Only include weeks >= current week
                    const isCurrentOrFuture =
                        year > currentWeek.year ||
                        (year === currentWeek.year && week >= currentWeek.week);

                    if (isCurrentOrFuture) {
                        key = `week_${year}_${week}`;
                        label = formatWeekLabel(week, year);
                    } else {
                        // Week is in the past - skip this item
                        return;
                    }
                } else {
                    // No deadline or due_date - add to Unplanned
                    key = "__unplanned__";
                    label = "Unplanned";
                }
            } else {
                // Group by source (komt_van)
                key = item.komt_van || "__unknown__";
                label = item.komt_van || "Onbekend";
            }

            // Accumulate hours (for all grouping modes except assignee which has its own logic)
            const hours = Number(item.uren) || 0;
            const existing = grouped.get(key);

            if (existing) {
                existing.hours += hours;
                existing.count += 1;
            } else {
                const entry = {
                    hours,
                    count: 1,
                    label,
                };
                // Add week-specific properties for week grouping
                if (localGroupBy === "week" && key.startsWith("week_")) {
                    const match = key.match(/week_(\d+)_(\d+)/);
                    if (match) {
                        (entry as any).weekNumber = parseInt(match[2]);
                    }
                } else if (localGroupBy === "week" && key === "__unplanned__") {
                    (entry as any).isUnplanned = true;
                }
                grouped.set(key, entry);
            }
        });

        return Array.from(grouped.values())
            .map((item) => ({
                label: item.label,
                hours: item.hours,
                count: item.count,
                weekNumber: item.weekNumber,
                isUnplanned: item.isUnplanned,
            }))
            .sort((a, b) => {
                // Week grouping: sort by week number ascending, Unplanned at bottom
                if (localGroupBy === "week") {
                    // Unplanned always at bottom
                    if (a.isUnplanned) return 1;
                    if (b.isUnplanned) return -1;
                    // Sort by week number ascending
                    const weekA = a.weekNumber || 0;
                    const weekB = b.weekNumber || 0;
                    return weekA - weekB;
                }

                // Other groupings: sort by hours descending, unknown at bottom
                const aIsUnknown =
                    a.label === "Onbekend" || a.label === "Geen project";
                const bIsUnknown =
                    b.label === "Onbekend" || b.label === "Geen project";

                if (aIsUnknown && !bIsUnknown) return 1;
                if (!aIsUnknown && bIsUnknown) return -1;
                // Otherwise sort by hours descending
                return b.hours - a.hours;
            });
    }

    // Group items and calculate hours per group
    let chartData = $state(
        computeChartData(items, userMap, projectMap, groupBy),
    );

    $effect(() => {
        chartData = computeChartData(items, userMap, projectMap, groupBy);
    });

    // Calculate max hours for percentage calculation (excluding unknown/unplanned)
    let maxHours = $derived.by(() => {
        const validItems = chartData.filter((item) => {
            // Exclude unknown, onbekend, and unplanned categories
            if (item.isUnplanned) return false;
            if (item.label === "Onbekend") return false;
            if (item.label === "Geen project") return false;
            if (item.label === "Niet toegewezen") return false;
            if (item.label === "Unplanned") return false;
            return true;
        });
        if (validItems.length === 0) return 0;
        return Math.max(...validItems.map((item) => item.hours));
    });

    // Format hours for display
    function formatHours(hours: number): string {
        if (hours < 1) {
            return `${Math.round(hours * 10) / 10}u`;
        }
        return `${Math.round(hours * 10) / 10}u`;
    }
</script>

<div class="w-full">
    {#if chartData.length === 0}
        <div class="text-center py-8 text-zinc-500">Geen data beschikbaar</div>
    {:else}
        <ul
            class="flex justify-between text-xs uppercase text-zinc-400 dark:text-zinc-500 font-semibold px-2 space-x-2 mb-3"
        >
            <li>
                {groupBy === "assignee"
                    ? "Gebruiker"
                    : groupBy === "project"
                      ? "Project"
                      : groupBy === "week"
                        ? "Week"
                        : "Komt van"}
            </li>
            <li>Uren</li>
        </ul>

        <ul class="space-y-1 text-sm text-zinc-800 dark:text-zinc-100">
            {#each chartData as item}
                {@const isUnplanned = item.isUnplanned}
                {@const percentage =
                    maxHours > 0 ? (item.hours / maxHours) * 100 : 0}
                {@const isUnknown =
                    item.label === "Onbekend" || item.label === "Geen project"}
                {@const barColor = isUnknown ? "#E4E4E7" : "#FC9467"}
                {@const finalBarColor = isUnplanned ? "#E4E4E7" : barColor}
                {@const shouldHideBar =
                    isUnplanned ||
                    isUnknown ||
                    item.label === "Niet toegewezen" ||
                    item.label === "Unplanned"}
                {@const barWidth = shouldHideBar ? 0 : percentage}
                <li class="relative px-2 py-1 min-h-4">
                    <!-- Always show bar -->
                    <div
                        class="absolute inset-0 rounded-r"
                        aria-hidden="true"
                        style="width: {barWidth}%; background-color: {finalBarColor}; min-width: 4px;"
                    ></div>
                    <div class="relative flex justify-between space-x-2">
                        <div class="truncate" title={item.label}>
                            {item.label}
                            {#if item.count > 1}
                                <span class="text-xs text-zinc-500 ml-1"
                                    >({item.count})</span
                                >
                            {/if}
                        </div>
                        <div class="font-medium shrink-0 ml-2">
                            {formatHours(item.hours)}
                        </div>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>
