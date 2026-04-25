<script lang="ts">
    import { onMount } from "svelte";
    import { HeatmapTable, IconButton, Button } from "$lib/components";
    import WorkItemCard from "$lib/components/WorkItemCard.svelte";
    import Toggle from "$lib/components/Toggle.svelte";
    import BacklogDrawer from "$lib/components/BacklogDrawer.svelte";
    import CaseTaskDrawer from "$lib/components/CaseTaskDrawer.svelte";
    import { ClipboardList } from "lucide-svelte";
    import * as taskService from "$lib/services/taskService";
    import { queryTableResult } from "$lib/utils/postgrest";
    import { getCurrentUserId } from "$lib/utils/userUtils";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import {
        getWeekStartDate,
        getWeekInMonth,
        getMonthsInRange,
    } from "$lib/utils/dateUtils";
    import * as caseService from "$lib/services/caseService";
    import type {
        UnifiedBacklogItem,
        UnifiedPlanningItem,
    } from "$lib/services/taskService";
    import type { UserAvailability } from "$lib/schemas/userAvailability";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { navigationStore } from "$lib/stores/navigationStore";
    import Spinner from "$lib/components/Spinner.svelte";

    let loading = $state(true);
    let heatmapData = $state<Map<string, number>>(new Map()); // Percentage values (0-100)
    let availabilityData = $state<Map<string, number>>(new Map()); // Available hours per week
    let plannedHoursData = $state<Map<string, number>>(new Map()); // Planned hours per week
    let rowLabels = $state<string[]>(["1", "2", "3", "4", "5"]);
    let columnLabels = $state<string[]>([]);
    let months = $state<Array<{ year: number; month: number; label: string }>>(
        [],
    );

    // Backlog drawer state - derived from URL
    const backlogDrawerOpen = $derived(
        $page.url.searchParams.get("backlog") === "open",
    );
    let backlogItems = $state<UnifiedBacklogItem[]>([]);
    let closedItems = $state<UnifiedBacklogItem[]>([]); // Closed items (not backlog status)
    let loadingBacklog = $state(false);

    // Selected week filter state - derived from URL
    const selectedWeekStart = $derived(
        $page.url.searchParams.get("weekStart") || null,
    );
    const selectedWeekEnd = $derived(
        $page.url.searchParams.get("weekEnd") || null,
    );

    // Toggle state - derived from URL param (defaults to true if not set)
    const showItemsWithoutDate = $derived(
        $page.url.searchParams.get("zonderDatum") !== "false",
    );

    // Filtered backlog items based on toggle and selected week
    // When showItemsWithoutDate is true (default): show only items WITHOUT deadlines
    // When showItemsWithoutDate is false: show only items WITH deadlines
    // When a week is selected: show only items in that week
    // Includes closed items (non-backlog status) for display in drawer
    // Sorted by due date ascending
    const filteredBacklogItems = $derived.by(() => {
        // Combine open and closed items (closed items are already filtered to exclude backlog status)
        let items = [...backlogItems, ...closedItems];

        // If a week is selected, filter by that week
        if (selectedWeekStart && selectedWeekEnd) {
            const weekStart = new Date(selectedWeekStart);
            const weekEnd = new Date(selectedWeekEnd);

            items = items.filter((item) => {
                const dateStr = item.deadline || item.due_date;
                if (!dateStr) return false;

                const itemDate = new Date(dateStr);
                return itemDate >= weekStart && itemDate <= weekEnd;
            });
        } else {
            // Otherwise, apply the toggle filter
            if (showItemsWithoutDate) {
                items = items.filter(
                    (item) => !item.deadline && !item.due_date,
                );
            } else {
                items = items.filter((item) => item.deadline || item.due_date);
            }
        }

        // Sort by due date ascending (items without date go to the end)
        items = [...items].sort((a, b) => {
            const dateA = a.deadline || a.due_date;
            const dateB = b.deadline || b.due_date;

            // Items without dates go to the end
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            // Sort by date ascending
            const dateAObj = new Date(dateA);
            const dateBObj = new Date(dateB);
            return dateAObj.getTime() - dateBObj.getTime();
        });

        return items;
    });

    // Calculate total hours for the selected week (including closed items)
    const totalWeekHours = $derived.by(() => {
        if (!selectedWeekStart || !selectedWeekEnd) return 0;

        const openHours = filteredBacklogItems.reduce((sum, item) => {
            return sum + (item.uren || 0);
        }, 0);

        // Add closed items hours for the selected week (only non-backlog items)
        const weekStart = new Date(selectedWeekStart);
        const weekEnd = new Date(selectedWeekEnd);
        const closedHours = closedItems
            .filter((item) => {
                // Only include closed items that are not backlog status
                if (item.status === "backlog") return false;
                const dateStr = item.deadline || item.due_date;
                if (!dateStr) return false;
                const itemDate = new Date(dateStr);
                return itemDate >= weekStart && itemDate <= weekEnd;
            })
            .reduce((sum, item) => sum + (item.uren || 0), 0);

        return openHours + closedHours;
    });

    // Calculate total closed hours (all closed items, not just selected week)
    const totalClosedHours = $derived.by(() => {
        return closedItems
            .filter((item) => item.status !== "backlog") // Only non-backlog closed items
            .reduce((sum, item) => sum + (item.uren || 0), 0);
    });

    // Function to update URL param for toggle
    async function toggleItemsWithoutDate(
        event: Event & { currentTarget: HTMLInputElement },
    ) {
        const urlParams = new URLSearchParams($page.url.searchParams);
        // Clear week selection when toggling
        urlParams.delete("weekStart");
        urlParams.delete("weekEnd");

        if (event.currentTarget.checked) {
            // When checked, remove param (defaults to true)
            urlParams.delete("zonderDatum");
        } else {
            // When unchecked, set to false
            urlParams.set("zonderDatum", "false");
        }
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    /**
     * Process tasks and availability into heatmap data format with percentages
     */
    function processTasksForHeatmap(
        tasks: UnifiedBacklogItem[],
        availabilityRecords: UserAvailability[],
        monthRange: number = 6,
        closedTasks: UnifiedBacklogItem[] = [], // Add closed tasks parameter
    ): {
        percentageData: Map<string, number>; // Percentage (0-100)
        availabilityData: Map<string, number>; // Available hours
        plannedHoursData: Map<string, number>; // Planned hours
        months: Array<{ year: number; month: number; label: string }>;
    } {
        const plannedHours = new Map<string, number>();
        const availabilityMap = new Map<string, string>();

        // Get current date normalized to start of day for comparisons
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Process tasks - sum planned hours per week
        const validTasks = tasks.filter(
            (task) =>
                (task.deadline || task.due_date) &&
                task.uren !== null &&
                task.uren !== undefined &&
                task.uren > 0,
        );

        // Add closed tasks (only non-backlog status)
        const validClosedTasks = closedTasks.filter(
            (task) =>
                task.status !== "backlog" && // Exclude backlog closed items
                (task.deadline || task.due_date) &&
                task.uren !== null &&
                task.uren !== undefined &&
                task.uren > 0,
        );

        // Combine open and closed tasks for processing
        const allTasks = [...validTasks, ...validClosedTasks];

        for (const task of allTasks) {
            const deadlineStr = task.deadline || task.due_date;
            if (!deadlineStr) continue;

            try {
                const deadline = new Date(deadlineStr);
                if (isNaN(deadline.getTime())) continue;

                const year = deadline.getFullYear();
                const month = deadline.getMonth();
                const weekInMonth = getWeekInMonth(deadline);
                const weekStart = getWeekStartDate(deadline);
                const weekStartStr = weekStart.toISOString().split("T")[0]; // YYYY-MM-DD

                // Calculate week end date (Sunday) to check if week has passed
                const weekEndDate = new Date(weekStart);
                weekEndDate.setDate(weekEndDate.getDate() + 6);
                weekEndDate.setHours(23, 59, 59, 999); // End of Sunday

                // Skip weeks that have already passed
                if (weekEndDate < now) {
                    continue;
                }

                // Create key: "YYYY-MM-WW"
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${weekInMonth}`;

                // Sum planned hours
                const currentValue = plannedHours.get(key) || 0;
                plannedHours.set(key, currentValue + (task.uren || 0));

                // Store week start date for availability lookup
                availabilityMap.set(key, weekStartStr);
            } catch (error) {
                console.error("Error processing task deadline:", error, task);
            }
        }

        // Determine date range: current month to monthRange months in the future (no past months/weeks)
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Start from current month, end monthRange months in the future
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + monthRange + 1, 0); // Last day of the last month in range
        const allMonths = getMonthsInRange(startDate, endDate);

        // Process availability records - create map by week start date
        // Sort by week_start_date to find the most recent availability for each week
        const sortedAvailability = [...availabilityRecords].sort((a, b) =>
            a.week_start_date.localeCompare(b.week_start_date),
        );
        const availabilityByWeekStart = new Map<string, number>();
        for (const record of sortedAvailability) {
            availabilityByWeekStart.set(
                record.week_start_date,
                record.hours_per_week,
            );
        }

        // Helper function to get availability for a week start date
        // If exact match not found, use the most recent availability before this week
        function getAvailabilityForWeek(weekStartDate: Date): number {
            const weekStartStr = weekStartDate.toISOString().split("T")[0];

            // Try exact match first
            if (availabilityByWeekStart.has(weekStartStr)) {
                return availabilityByWeekStart.get(weekStartStr)!;
            }

            // Find most recent availability before this week
            let mostRecent: UserAvailability | null = null;
            for (const record of sortedAvailability) {
                const recordDate = new Date(record.week_start_date);
                if (recordDate <= weekStartDate) {
                    if (
                        !mostRecent ||
                        recordDate > new Date(mostRecent.week_start_date)
                    ) {
                        mostRecent = record;
                    }
                }
            }

            return mostRecent?.hours_per_week || 0;
        }

        // Calculate percentages for all weeks in the date range
        const percentageData = new Map<string, number>();
        const finalAvailabilityData = new Map<string, number>();

        // Process weeks with planned hours
        for (const [key, planned] of plannedHours.entries()) {
            const weekStartStr = availabilityMap.get(key);
            if (!weekStartStr) continue;

            const weekStartDate = new Date(weekStartStr);
            const available = getAvailabilityForWeek(weekStartDate);
            finalAvailabilityData.set(key, available);

            if (available > 0) {
                const percentage = Math.min((planned / available) * 100, 100); // Cap at 100%
                percentageData.set(key, percentage);
            } else {
                percentageData.set(key, 0);
            }
        }

        // Also process all weeks in the date range (even without planned hours)
        // to ensure availability data is available for all cells
        // Filter out weeks that have already passed
        for (const month of allMonths) {
            const lastDay = new Date(month.year, month.month + 1, 0).getDate();
            const weekSet = new Set<number>();

            // Get all weeks in this month
            for (let day = 1; day <= lastDay; day++) {
                const date = new Date(month.year, month.month, day);
                const weekInMonth = getWeekInMonth(date);
                if (weekInMonth >= 1 && weekInMonth <= 5) {
                    weekSet.add(weekInMonth);
                }
            }

            // Process each week in the month
            for (const weekNum of weekSet) {
                const key = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${weekNum}`;

                // If we already processed this week, skip
                if (finalAvailabilityData.has(key)) continue;

                // Find a date in this week to get the week start
                let weekStartDate: Date | null = null;
                for (let day = 1; day <= lastDay; day++) {
                    const date = new Date(month.year, month.month, day);
                    if (getWeekInMonth(date) === weekNum) {
                        weekStartDate = getWeekStartDate(date);
                        break;
                    }
                }

                if (weekStartDate) {
                    // Calculate week end date (Sunday)
                    const weekEndDate = new Date(weekStartDate);
                    weekEndDate.setDate(weekEndDate.getDate() + 6);
                    weekEndDate.setHours(23, 59, 59, 999); // End of Sunday

                    // Skip weeks that have already passed
                    if (weekEndDate < now) {
                        continue;
                    }

                    const available = getAvailabilityForWeek(weekStartDate);
                    finalAvailabilityData.set(key, available);

                    // If no planned hours, percentage is 0
                    const planned = plannedHours.get(key) || 0;
                    if (available > 0 && planned > 0) {
                        const percentage = Math.min(
                            (planned / available) * 100,
                            100,
                        );
                        percentageData.set(key, percentage);
                    } else {
                        percentageData.set(key, 0);
                    }
                }
            }
        }

        // Filter months to only include those with at least one future week
        const filteredMonths = allMonths.filter((month) => {
            // Check if this month has any future weeks
            const lastDay = new Date(month.year, month.month + 1, 0).getDate();
            const weekSet = new Set<number>();

            // Get all weeks in this month
            for (let day = 1; day <= lastDay; day++) {
                const date = new Date(month.year, month.month, day);
                const weekInMonth = getWeekInMonth(date);
                if (weekInMonth >= 1 && weekInMonth <= 5) {
                    weekSet.add(weekInMonth);
                }
            }

            // Check if any week in this month hasn't passed yet
            for (const weekNum of weekSet) {
                // Find week start date to check if week has passed
                let weekStartDate: Date | null = null;
                for (let day = 1; day <= lastDay; day++) {
                    const date = new Date(month.year, month.month, day);
                    if (getWeekInMonth(date) === weekNum) {
                        weekStartDate = getWeekStartDate(date);
                        break;
                    }
                }

                if (weekStartDate) {
                    const weekEndDate = new Date(weekStartDate);
                    weekEndDate.setDate(weekEndDate.getDate() + 6);
                    weekEndDate.setHours(23, 59, 59, 999);

                    // If week hasn't passed, include this month
                    if (weekEndDate >= now) {
                        return true;
                    }
                }
            }

            return false;
        });

        return {
            percentageData,
            availabilityData: finalAvailabilityData,
            plannedHoursData: plannedHours,
            months: filteredMonths,
        };
    }

    async function loadHeatmapData() {
        loading = true;
        navigationStore.startPageLoading();
        const userId = getCurrentUserId();

        if (!userId) {
            toastStore.add(
                "Je moet ingelogd zijn om je werk te bekijken",
                "error",
            );
            loading = false;
            navigationStore.stopPageLoading();
            return;
        }

        // Fetch tasks, closed items, and availability in parallel
        const [tasksResult, closedItemsResult, availabilityResult] =
            await Promise.all([
                taskService.getAllUnifiedWorkItems(userId, null),
                taskService.getClosedUnifiedItems(userId),
                queryTableResult<UserAvailability>("_bpm_user_availability", {
                    filter: { user_id: `eq.${userId}` },
                }),
            ]);

        if (!tasksResult.success) {
            toastStore.add(getUserMessage(tasksResult.error), "error");
            heatmapData = new Map();
            columnLabels = [];
            months = [];
            loading = false;
            navigationStore.stopPageLoading();
            return;
        }

        if (!availabilityResult.success) {
            toastStore.add(getUserMessage(availabilityResult.error), "error");
            heatmapData = new Map();
            columnLabels = [];
            months = [];
            loading = false;
            navigationStore.stopPageLoading();
            return;
        }

        // Store closed items (filter out backlog status)
        if (closedItemsResult.success) {
            closedItems = closedItemsResult.value.filter(
                (item) => item.status !== "backlog",
            );
        } else {
            closedItems = [];
        }

        // Use 6 months range for the heatmap
        const monthRange = 6;
        const processed = processTasksForHeatmap(
            tasksResult.value,
            availabilityResult.value.data,
            monthRange,
            closedItems, // Pass closed items to heatmap processing
        );
        heatmapData = processed.percentageData;
        availabilityData = processed.availabilityData;
        plannedHoursData = processed.plannedHoursData;
        months = processed.months;
        columnLabels = processed.months.map((m) => m.label);

        loading = false;
        navigationStore.stopPageLoading();
    }

    onMount(() => {
        loadHeatmapData();
        // Load backlog items if drawer should be open
        if (backlogDrawerOpen) {
            loadBacklogItems();
        }
    });

    // Load backlog items when drawer opens (via URL param)
    // Track previous state to avoid unnecessary reloads
    let previousDrawerState = $state(backlogDrawerOpen);
    $effect(() => {
        // Only load if drawer state changed to open
        if (previousDrawerState !== backlogDrawerOpen) {
            previousDrawerState = backlogDrawerOpen;
            // Load backlog items if drawer opened
            if (backlogDrawerOpen) {
                loadBacklogItems();
            }
            // Note: Removed loadHeatmapData() here to avoid duplicate fetches
            // loadBacklogItems already fetches the same data
        }
    });

    function formatPercentage(value: number): string {
        return `${value.toFixed(0)}%`;
    }

    async function loadBacklogItems() {
        const userId = getCurrentUserId();
        if (!userId) return;

        loadingBacklog = true;
        // Use getAllUnifiedWorkItems to match heatmap data (includes all statuses)
        const [openResult, closedResult] = await Promise.all([
            taskService.getAllUnifiedWorkItems(userId, null),
            taskService.getClosedUnifiedItems(userId),
        ]);

        if (openResult.success) {
            backlogItems = openResult.value;
        } else {
            toastStore.add(getUserMessage(openResult.error), "error");
            backlogItems = [];
        }

        // Load closed items (filter out backlog status)
        if (closedResult.success) {
            closedItems = closedResult.value.filter(
                (item) => item.status !== "backlog",
            );
        } else {
            closedItems = [];
        }

        loadingBacklog = false;
    }

    async function openBacklogDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("backlog", "open");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
        // Effect will handle loading backlog items and reloading heatmap
    }

    async function closeBacklogDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.delete("backlog");
        urlParams.delete("weekStart");
        urlParams.delete("weekEnd");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
        // Effect will handle reloading heatmap
    }

    async function handleHeatmapCellClick(
        rowIndex: number,
        columnLabel: string,
        weekStartDate: string,
        weekEndDate: string,
    ) {
        // Open the drawer with the selected week filter
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("backlog", "open");
        urlParams.set("weekStart", weekStartDate);
        urlParams.set("weekEnd", weekEndDate);
        // Remove the toggle param when a week is selected
        urlParams.delete("zonderDatum");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
        // Effect will handle loading backlog items
    }

    function openEditDrawer(item: UnifiedBacklogItem) {
        const urlParams = new URLSearchParams($page.url.searchParams);
        if (item.type === "work_item") {
            urlParams.set("drawer", "workitem");
            urlParams.set("workItemId", String(item.id));
        } else if (item.type === "case_task") {
            urlParams.set("drawer", "casetask");
            urlParams.set("caseTaskId", String(item.id));
        }
        goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    function convertToPlanningItem(
        item: UnifiedBacklogItem,
    ): UnifiedPlanningItem {
        return {
            id: item.id,
            type: item.type,
            task_type: item.task_type,
            subject: item.subject,
            assignee_id: item.assignee_id,
            owner_id: item.owner_id,
            due_date: item.due_date,
            deadline: item.deadline,
            uren: item.uren,
            tags: item.tags,
            status: item.status,
            kanban_status: item.kanban_status || "gepland",
            relevantie: item.relevantie,
            voor_wie_is_het: item.voor_wie_is_het,
            wat_ga_je_doen: item.wat_ga_je_doen,
            waarom_doe_je_het: item.waarom_doe_je_het,
            komt_van: item.komt_van,
            bijlagen: item.bijlagen || null,
            created_at: item.created_at,
            updated_at: item.updated_at,
            case_id: item.case_id || null,
            case_name: item.case_name || null,
            case_step_id: item.case_step_id,
            name: item.task_name || null,
            description: null,
            criteria: null,
            order_index: null,
        } as UnifiedPlanningItem;
    }

    async function handleItemDeleted() {
        await loadBacklogItems();
    }

    async function handleItemSaved() {
        // Reload backlog items and heatmap data
        await Promise.all([loadBacklogItems(), loadHeatmapData()]);
        // Close the drawer
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.delete("drawer");
        urlParams.delete("workItemId");
        urlParams.delete("caseTaskId");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleDropOnHeatmap(
        rowIndex: number,
        columnLabel: string,
        fridayDate: string,
    ) {
        // Get the dragged item from the drag data
        // The drag data is set by WorkItemCard component
        // We need to track which item is being dragged
        const draggedItemId = draggedItemIdState;
        if (!draggedItemId) {
            toastStore.add("Geen item gevonden om te verplaatsen", "error");
            return;
        }

        // Find the item in backlogItems
        const item = backlogItems.find((i) => i.id === draggedItemId);
        if (!item) {
            toastStore.add("Item niet gevonden", "error");
            return;
        }

        // Update the item based on its type
        let result;
        if (item.type === "work_item") {
            result = await taskService.updateWorkItem(item.id, {
                deadline: fridayDate,
                assignee_id: [],
            });
        } else if (item.type === "case_task") {
            result = await caseService.updateCaseTask(item.id, {
                deadline: fridayDate,
            });
        } else {
            toastStore.add("Onbekend item type", "error");
            return;
        }

        if (result.success) {
            toastStore.add(
                "Deadline bijgewerkt naar " +
                    new Date(fridayDate).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                    }),
                "success",
            );
            // Reload backlog items and heatmap
            await Promise.all([loadBacklogItems(), loadHeatmapData()]);
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }

        // Clear dragged item state
        draggedItemIdState = null;
    }

    // Track which item is being dragged
    let draggedItemIdState = $state<number | null>(null);
    let dragGhost = $state<HTMLElement | null>(null);
    let dragOffset = $state<{ x: number; y: number } | null>(null);
    let isDragging = $state(false);

    // Track which task card is being hovered (for highlighting week in heatmap)
    let hoveredTaskId = $state<number | null>(null);

    // Calculate hovered week start/end dates from hovered task
    const hoveredWeekStart = $derived.by(() => {
        if (!hoveredTaskId) return null;

        // Search in filteredBacklogItems first (what's currently displayed), then fall back to backlogItems
        const item =
            filteredBacklogItems.find((i) => i.id === hoveredTaskId) ||
            backlogItems.find((i) => i.id === hoveredTaskId);
        if (!item) return null;

        const dateStr = item.deadline || item.due_date;
        if (!dateStr) return null;

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;

            // Normalize date to start of day to avoid timezone issues
            date.setHours(0, 0, 0, 0);

            const weekStart = getWeekStartDate(date);
            weekStart.setHours(0, 0, 0, 0);
            return weekStart.toISOString().split("T")[0];
        } catch {
            return null;
        }
    });

    const hoveredWeekEnd = $derived.by(() => {
        if (!hoveredTaskId) return null;

        // Search in filteredBacklogItems first (what's currently displayed), then fall back to backlogItems
        const item =
            filteredBacklogItems.find((i) => i.id === hoveredTaskId) ||
            backlogItems.find((i) => i.id === hoveredTaskId);
        if (!item) return null;

        const dateStr = item.deadline || item.due_date;
        if (!dateStr) return null;

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;

            // Normalize date to start of day to avoid timezone issues
            date.setHours(0, 0, 0, 0);

            const weekStart = getWeekStartDate(date);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
            weekEnd.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
            return weekEnd.toISOString().split("T")[0];
        } catch {
            return null;
        }
    });

    function handleDragStart(itemId: number, event: DragEvent) {
        draggedItemIdState = itemId;
        isDragging = true;
        const target = event.currentTarget as HTMLElement;

        // Create drag ghost that follows cursor
        const ghost = target.cloneNode(true) as HTMLElement;
        ghost.id = "drag-ghost";
        ghost.className = "drag-ghost";
        ghost.style.position = "fixed";
        ghost.style.pointerEvents = "none";
        ghost.style.zIndex = "10000";
        ghost.style.opacity = "0.9";
        ghost.style.transform = "scale(1.1)";
        ghost.style.boxShadow =
            "0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)";
        ghost.style.width = `${target.offsetWidth}px`;
        ghost.style.transition = "none";

        // Calculate offset from mouse to card top-left
        const rect = target.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        // Set initial position
        ghost.style.left = `${event.clientX - offsetX}px`;
        ghost.style.top = `${event.clientY - offsetY}px`;

        document.body.appendChild(ghost);
        dragGhost = ghost;
        dragOffset = { x: offsetX, y: offsetY };

        // Track mouse position globally during drag
        let mouseX = event.clientX;
        let mouseY = event.clientY;

        // Update ghost position using requestAnimationFrame for smooth updates
        function updateGhostPosition() {
            if (dragGhost && dragOffset && isDragging) {
                dragGhost.style.left = `${mouseX - dragOffset.x}px`;
                dragGhost.style.top = `${mouseY - dragOffset.y}px`;
                requestAnimationFrame(updateGhostPosition);
            }
        }

        // Track mouse position during drag
        function trackMousePosition(e: DragEvent | MouseEvent) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }

        // Start animation loop
        requestAnimationFrame(updateGhostPosition);

        // Update on dragover (fires continuously during drag)
        document.addEventListener("dragover", trackMousePosition);
        document.addEventListener("drag", trackMousePosition);

        // Clean up on drag end
        function cleanup() {
            isDragging = false;
            document.removeEventListener("dragover", trackMousePosition);
            document.removeEventListener("drag", trackMousePosition);
            if (dragGhost && document.body.contains(dragGhost)) {
                document.body.removeChild(dragGhost);
            }
            dragGhost = null;
            dragOffset = null;
        }

        // Store cleanup function for dragend
        (target as any).__dragCleanup = cleanup;
    }

    function handleDragEnd(event: DragEvent) {
        const target = event.currentTarget as HTMLElement;

        // Run cleanup if stored
        if ((target as any).__dragCleanup) {
            (target as any).__dragCleanup();
        }

        // Clear dragged item state if drag was cancelled (not dropped)
        if (event.dataTransfer?.dropEffect === "none") {
            draggedItemIdState = null;
        }
    }
</script>

<svelte:head>
    <title>Mijn Werk - Business Process Management</title>
</svelte:head>

{#if loading}
    <div class="fixed inset-0 flex items-center justify-center">
        <Spinner size="xl" />
    </div>
{:else}
    <div class="container mx-auto px-4 py-8 max-w-[90vw]">
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div>
                    <h1
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Mijn Werk
                    </h1>
                    <p class="text-zinc-600 mt-1">
                        Overzicht van je geplande uren per week
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <IconButton
                        icon={ClipboardList}
                        variant="ghost"
                        size="default"
                        tooltip="Mijn backlog taken"
                        tooltipPosition="left"
                        onclick={openBacklogDrawer}
                    />
                </div>
            </div>

            {#if backlogDrawerOpen}
                <!-- Two column layout when drawer is open -->
                <div class="grid grid-cols-[1fr_2fr] gap-6">
                    <!-- Left column: Heatmap -->
                    <div>
                        {#if columnLabels.length === 0}
                            <div
                                class="bg-white rounded-lg shadow-xs border border-zinc-200 p-8"
                            >
                                <div class="text-center">
                                    <p class="text-zinc-600">
                                        Geen taken met deadlines en uren
                                        gevonden.
                                    </p>
                                </div>
                            </div>
                        {:else}
                            <div
                                class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6"
                            >
                                <div class="space-y-4">
                                    <div>
                                        <h2
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-2"
                                        >
                                            Geplande uren vs beschikbare uren
                                        </h2>
                                        <p class="text-sm text-zinc-600">
                                            De heatmap toont het percentage
                                            geplande uren ten opzichte van
                                            beschikbare uren per week. Donker
                                            oranje = dicht bij 100% (bijna vol),
                                            licht grijs-wit = weinig gepland.
                                            Klik op een week om taken te
                                            filteren.
                                        </p>
                                    </div>
                                    <HeatmapTable
                                        data={heatmapData}
                                        {rowLabels}
                                        {columnLabels}
                                        valueFormatter={formatPercentage}
                                        {availabilityData}
                                        {plannedHoursData}
                                        droppable={backlogDrawerOpen}
                                        ondrop={handleDropOnHeatmap}
                                        onclick={handleHeatmapCellClick}
                                        {selectedWeekStart}
                                        {selectedWeekEnd}
                                        {hoveredWeekStart}
                                        {hoveredWeekEnd}
                                    />
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Right column: Backlog Drawer Content -->
                    <div
                        class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 flex flex-col h-fit max-h-[calc(100vh-12rem)]"
                    >
                        <!-- Header -->
                        <div class="mb-6 flex-shrink-0">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h2
                                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                                    >
                                        {#if selectedWeekStart && selectedWeekEnd}
                                            In deze week {totalWeekHours} uren gepland
                                        {:else}
                                            Mijn Backlog Taken
                                        {/if}
                                    </h2>
                                    <p class="text-sm text-zinc-600 mt-1">
                                        {#if selectedWeekStart && selectedWeekEnd}
                                            {new Date(
                                                selectedWeekStart,
                                            ).toLocaleDateString("nl-NL", {
                                                day: "numeric",
                                                month: "short",
                                            })} - {new Date(
                                                selectedWeekEnd,
                                            ).toLocaleDateString("nl-NL", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        {:else}
                                            Overzicht van al je backlog taken
                                        {/if}
                                    </p>
                                </div>
                                <div class="flex items-center gap-4">
                                    {#if selectedWeekStart && selectedWeekEnd}
                                        <!-- Clear week selection button -->
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onclick={async () => {
                                                const urlParams =
                                                    new URLSearchParams(
                                                        $page.url.searchParams,
                                                    );
                                                urlParams.delete("weekStart");
                                                urlParams.delete("weekEnd");
                                                await goto(
                                                    `?${urlParams.toString()}`,
                                                    { noScroll: true },
                                                );
                                            }}
                                        >
                                            Toon alles
                                        </Button>
                                    {:else}
                                        <!-- Toggle for items without date -->
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm text-zinc-700"
                                                >Zonder datum</span
                                            >
                                            <Toggle
                                                checked={showItemsWithoutDate}
                                                onchange={toggleItemsWithoutDate}
                                            />
                                        </div>
                                    {/if}
                                    <button
                                        onclick={closeBacklogDrawer}
                                        class="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                        aria-label="Sluiten"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path d="M18 6 6 18" />
                                            <path d="m6 6 12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 overflow-y-auto">
                            {#if loadingBacklog}
                                <div
                                    class="flex items-center justify-center py-12"
                                >
                                    <p class="text-zinc-600">Laden...</p>
                                </div>
                            {:else if filteredBacklogItems.length === 0}
                                <div class="text-center py-12 space-y-4">
                                    <p class="text-zinc-500">
                                        Geen backlog taken gevonden
                                    </p>
                                    <Button
                                        onclick={() => goto("/work/backlog")}
                                    >
                                        Zie backlog →
                                    </Button>
                                </div>
                            {:else}
                                <div class="grid grid-cols-2 gap-4">
                                    {#each filteredBacklogItems as item (item.type + "-" + item.id)}
                                        {@const planningItem =
                                            convertToPlanningItem(item)}
                                        {@const isClosed = closedItems.some(
                                            (closedItem) =>
                                                closedItem.id === item.id &&
                                                closedItem.type === item.type,
                                        )}
                                        <div
                                            draggable={!isClosed}
                                            class="draggable-card"
                                            class:opacity-50={isClosed}
                                            class:cursor-not-allowed={isClosed}
                                            onmouseenter={() => {
                                                if (!isClosed) {
                                                    hoveredTaskId = item.id;
                                                }
                                            }}
                                            onmouseleave={() => {
                                                hoveredTaskId = null;
                                            }}
                                            ondragstart={(e) => {
                                                if (isClosed) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                                const target =
                                                    e.currentTarget as HTMLElement;
                                                // Set ID on dragged card (MDN pattern for styling)
                                                target.id = "dragged-card";
                                                handleDragStart(item.id, e);

                                                if (e.dataTransfer) {
                                                    e.dataTransfer.effectAllowed =
                                                        "move";
                                                    e.dataTransfer.setData(
                                                        "text/plain",
                                                        JSON.stringify({
                                                            type: item.type,
                                                            id: item.id,
                                                        }),
                                                    );

                                                    // Create invisible drag image (we'll use the ghost instead)
                                                    const emptyImg =
                                                        document.createElement(
                                                            "img",
                                                        );
                                                    emptyImg.src =
                                                        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                                    e.dataTransfer.setDragImage(
                                                        emptyImg,
                                                        0,
                                                        0,
                                                    );
                                                }
                                            }}
                                            ondragend={(e) => {
                                                const target =
                                                    e.currentTarget as HTMLElement;
                                                // Remove ID attribute (MDN pattern)
                                                target.removeAttribute("id");
                                                handleDragEnd(e);
                                            }}
                                        >
                                            <WorkItemCard
                                                workItem={planningItem}
                                                draggable={false}
                                                ondelete={handleItemDeleted}
                                                onclick={() => {
                                                    if (!isClosed) {
                                                        openEditDrawer(item);
                                                    }
                                                }}
                                                showStatusButtons={!isClosed}
                                                disabled={isClosed}
                                            />
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Full width layout when drawer is closed -->
                <!-- Heatmap -->
                {#if columnLabels.length === 0}
                    <div
                        class="bg-white rounded-lg shadow-xs border border-zinc-200 p-8"
                    >
                        <div class="text-center">
                            <p class="text-zinc-600">
                                Geen taken met deadlines en uren gevonden.
                            </p>
                        </div>
                    </div>
                {:else}
                    <div
                        class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6"
                    >
                        <div class="space-y-4">
                            <div>
                                <h2
                                    class="text-lg font-semibold text-zinc-900 font-aspekta mb-2"
                                >
                                    Geplande uren vs beschikbare uren
                                </h2>
                                <p class="text-sm text-zinc-600">
                                    De heatmap toont het percentage geplande
                                    uren ten opzichte van beschikbare uren per
                                    week. Donker oranje = dicht bij 100% (bijna
                                    vol), licht grijs-wit = weinig gepland. Klik
                                    op een week om taken te filteren.
                                </p>
                            </div>
                            <HeatmapTable
                                data={heatmapData}
                                {rowLabels}
                                {columnLabels}
                                valueFormatter={formatPercentage}
                                {availabilityData}
                                {plannedHoursData}
                                droppable={false}
                                onclick={handleHeatmapCellClick}
                                {selectedWeekStart}
                                {selectedWeekEnd}
                                {hoveredWeekStart}
                                {hoveredWeekEnd}
                            />
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}

<!-- Backlog Drawer -->
<BacklogDrawer onsaved={handleItemSaved} />

<!-- Case Task Drawer -->
<CaseTaskDrawer onsaved={handleItemSaved} />

<style>
    /* Grab cursor - inspired by the drag-me example */
    :global(.draggable-card),
    :global([draggable="true"]) {
        cursor:
            url("https://www.google.com/intl/en_ALL/mapfiles/openhand.cur"),
            all-scroll !important;
        cursor: -webkit-grab !important;
        cursor: -moz-grab !important;
        cursor: -o-grab !important;
        cursor: -ms-grab !important;
        cursor: grab !important;
        transition:
            box-shadow 0.2s ease,
            border-radius 0.2s ease;
    }

    /* Grabbing cursor when actively dragging */
    :global(.draggable-card:active),
    :global([draggable="true"]:active),
    :global(#dragged-card) {
        cursor:
            url("https://www.google.com/intl/en_ALL/mapfiles/closedhand.cur"),
            all-scroll !important;
        cursor: -webkit-grabbing !important;
        cursor: -moz-grabbing !important;
        cursor: -o-grabbing !important;
        cursor: -ms-grabbing !important;
        cursor: grabbing !important;
    }

    /* Hover effect - subtle shadow enhancement only */
    :global(.draggable-card:hover:not(#dragged-card)),
    :global([draggable="true"]:hover:not(#dragged-card)) {
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.06) !important;
    }

    /* Active/dragging state - larger scale with darker shadow */
    :global(#dragged-card) {
        opacity: 0.9 !important;
        transform: scale(1.1) !important;
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.25),
            0 4px 8px rgba(0, 0, 0, 0.15) !important;
        z-index: 1000 !important;
        position: relative;
        transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    /* Prevent interactions while dragging */
    :global(#dragged-card *) {
        pointer-events: none !important;
    }

    /* Ensure card inside draggable container doesn't interfere */
    :global(.draggable-card > *) {
        pointer-events: auto;
    }

    /* Make sure the draggable container itself handles transforms */
    :global(.draggable-card) {
        display: block;
        will-change: box-shadow;
        border-radius: 0.5rem; /* rounded-lg - preserve border-radius */
        overflow: hidden; /* Ensure child rounded corners are preserved */
    }

    /* Drag ghost that follows cursor */
    :global(.drag-ghost) {
        transition: none !important;
        will-change: transform, top, left;
    }
</style>
