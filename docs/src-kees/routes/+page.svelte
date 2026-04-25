<script lang="ts">
    import {
        goto,
        preloadCode,
        preloadData,
        invalidate,
    } from "$app/navigation";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import { get } from "svelte/store";
    import { onMount, onDestroy } from "svelte";
    import type { PageData } from "./$types";

    // Note: When logging $state variables, use $inspect(...) or $state.snapshot(...)
    // instead of console.log(...) to avoid Svelte warnings about $state proxies
    import NavCard from "$lib/components/NavCard.svelte";
    import Kanban from "$lib/components/Kanban.svelte";
    import UserAvailabilityInput from "$lib/components/UserAvailabilityInput.svelte";
    import BacklogDrawer from "$lib/components/BacklogDrawer.svelte";
    import WorkItemCard from "$lib/components/WorkItemCard.svelte";
    import CaseTaskDrawer from "$lib/components/CaseTaskDrawer.svelte";
    import ChatDrawer from "$lib/components/ChatDrawer.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import BacklogWeeklyStats from "$lib/components/BacklogWeeklyStats.svelte";
    import { Drawer, Button } from "$lib/components";
    import {
        Plus,
        List,
        SlidersHorizontal,
        ChartGantt,
        User,
        BotMessageSquare,
        Bookmark,
        Trash2,
        ExternalLink,
        Check,
        Ellipsis,
    } from "lucide-svelte";
    import DropdownNav from "$lib/components/DropdownNav.svelte";
    import { taskStore } from "$lib/stores/taskStore";
    import {
        getCurrentUserId,
        getCurrentUserName,
        getCurrentUser,
    } from "$lib/utils/userUtils";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import * as taskService from "$lib/services/taskService";
    import * as caseService from "$lib/services/caseService";
    import * as shortcutsService from "$lib/services/shortcutsService";
    import type { Shortcut } from "$lib/services/shortcutsService";
    import IconButton from "$lib/components/IconButton.svelte";
    import type { Task } from "$lib/schemas/task";
    import type {
        UnifiedPlanningItem,
        UnifiedBacklogItem,
    } from "$lib/services/taskService";
    import { getISOWeek, getISOWeekYear } from "$lib/utils/dateUtils";
    import { refreshAOS } from "$lib/utils/aosKit";
    import { afterNavigate } from "$app/navigation";

    // Get SSR data from page
    let { data }: { data: PageData } = $props();

    // Use server-provided user ID for consistent SSR/client hydration
    // Then sync with client-side auth state after hydration
    const serverUserId = $derived(data.userId);
    const clientUserId = $derived(browser ? getCurrentUserId() : null);

    // Use server ID during initial render, then sync with client auth state
    // This ensures consistent hydration while still being reactive to auth changes
    const currentUserId = $derived.by(() => {
        // During SSR or initial hydration, use server-provided ID
        // After hydration, use client-side auth state (which may update)
        if (!browser) {
            return serverUserId;
        }
        // On client, prefer client-side auth state, but fall back to server ID if not available yet
        return clientUserId ?? serverUserId;
    });

    const currentUserName = $derived(browser ? getCurrentUserName() : null);
    const currentUser = $derived(browser ? getCurrentUser() : null);

    // Use SSR data immediately for instant render
    let planningItems = $state(data.planningItems || []);
    let backlogItems = $state(data.backlogItems || []);

    // Initialize store with SSR data immediately (before subscription can overwrite)
    if (data.planningItems.length > 0 || data.backlogItems.length > 0) {
        taskStore.initialize(data.planningItems || [], data.backlogItems || []);
    }

    // Use taskStore for reactive updates (after SSR)
    const storeData = $state(taskStore.getValue());
    let isLoadingBacklog = $state(false);
    let hasInitialLoad = $state(data.backlogItems.length > 0); // Track if we've had initial SSR data
    taskStore.subscribe((storeData) => {
        storeData.backlogItems = storeData.backlogItems;
        storeData.planningItems = storeData.planningItems;
        storeData.loading = storeData.loading;
        isLoadingBacklog = storeData.loading || storeData.syncing;
        // Only update local state from store when not loading (to prevent showing partial data)
        // Or if we haven't had initial load yet, use store data
        if (!isLoadingBacklog || !hasInitialLoad) {
            planningItems = storeData.planningItems;
            backlogItems = storeData.backlogItems;
            if (storeData.backlogItems.length > 0) {
                hasInitialLoad = true;
            }
        }
    });

    // Memoized backlog stats - only updates when count or hours actually change
    let backlogStats = $state<{ count: number; hours: number } | null>(null);
    let lastBacklogStatsKey = $state<string | null>(null);

    // Derive backlog stats from store - count all items (matching /work/backlog behavior)
    // Only calculate when not loading to prevent showing partial data
    $effect(() => {
        // Don't show stats while loading to prevent flashing between partial and complete data
        if (isLoadingBacklog) {
            // Keep existing stats while loading (don't clear them)
            return;
        }

        const items = backlogItems;
        if (!items || items.length === 0) {
            // Only clear stats if we had stats before (to prevent flashing)
            if (backlogStats !== null) {
                backlogStats = null;
                lastBacklogStatsKey = null;
            }
            return;
        }

        const totalHours = items.reduce(
            (sum, item) => sum + (item.uren || 0),
            0,
        );
        const newStatsKey = `${items.length}-${totalHours}`;

        // Only update stats if the key (count-hours) actually changed
        if (lastBacklogStatsKey !== newStatsKey) {
            backlogStats = {
                count: items.length,
                hours: totalHours,
            };
            lastBacklogStatsKey = newStatsKey;
        }
    });

    // Memoized kanban stats - only updates when count or hours actually change
    let kanbanStats = $state<{ count: number; hours: number } | null>(null);
    let lastKanbanStatsKey = $state<string | null>(null);

    // Derive kanban stats from planning items - filtered by current assignee
    // This shows the count and hours for tasks currently in the kanban board
    $effect(() => {
        // Don't show stats while loading to prevent flashing between partial and complete data
        if (isLoadingBacklog) {
            // Keep existing stats while loading (don't clear them)
            return;
        }

        const items = planningItems;
        if (!items || items.length === 0) {
            // Only clear stats if we had stats before (to prevent flashing)
            if (kanbanStats !== null) {
                kanbanStats = null;
                lastKanbanStatsKey = null;
            }
            return;
        }

        // Filter items by assignee (same logic as Kanban component)
        const filteredItems = assigneeFilter
            ? items.filter((item) => {
                  // Handle assignee_id as array (work items) or string/null (legacy)
                  if (Array.isArray(item.assignee_id)) {
                      return item.assignee_id.includes(assigneeFilter);
                  } else if (item.assignee_id === assigneeFilter) {
                      return true;
                  }
                  // Check owner_id for case tasks
                  if (
                      item.type === "case_task" &&
                      item.owner_id === assigneeFilter
                  ) {
                      return true;
                  }
                  return false;
              })
            : items;

        if (filteredItems.length === 0) {
            // Only clear stats if we had stats before (to prevent flashing)
            if (kanbanStats !== null) {
                kanbanStats = null;
                lastKanbanStatsKey = null;
            }
            return;
        }

        const totalHours = filteredItems.reduce(
            (sum, item) => sum + (item.uren || 0),
            0,
        );
        const newStatsKey = `${filteredItems.length}-${totalHours}`;

        // Only update stats if the key (count-hours) actually changed
        if (lastKanbanStatsKey !== newStatsKey) {
            kanbanStats = {
                count: filteredItems.length,
                hours: totalHours,
            };
            lastKanbanStatsKey = newStatsKey;
        }
    });

    // Derive assigneeFilter directly from URL - URL is the source of truth
    const assigneeFilter = $derived.by(() => {
        const urlParams = $page.url.searchParams;
        const onlyMyWorkParam = urlParams.get("alleenMijnWerk");
        // Default to showing only my work if param is null or 'true'
        // Show all work if param is explicitly 'false'
        if (onlyMyWorkParam === "false") {
            return null;
        }
        // Default behavior: show only my work (when param is null or 'true')
        return currentUserId;
    });

    // Derive showOverdueOnly from URL
    const showOverdueOnly = $derived(
        $page.url.searchParams.get("status") === "overdue",
    );

    // Derive selectedWeeks from URL parameter - parse comma-separated list
    const weeksParam = $derived($page.url.searchParams.get("weeks"));
    const selectedWeeks = $derived(
        weeksParam
            ? weeksParam
                  .split(",")
                  .map((w) => w.trim())
                  .filter((w) => w)
            : [],
    );

    // Function to toggle the "alleenMijnWerk" URL parameter
    async function toggleAlleenMijnWerk() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        const currentParam = urlParams.get("alleenMijnWerk");

        if (currentParam === "false" || currentParam === null) {
            // Turn on: set to 'true'
            urlParams.set("alleenMijnWerk", "true");
        } else {
            // Turn off: set to 'false' (explicit state, not removing)
            urlParams.set("alleenMijnWerk", "false");
        }

        const newUrl = `${$page.url.pathname}?${urlParams.toString()}`;
        await goto(newUrl, { replaceState: true, noScroll: true });
    }

    async function handleOpenBacklogDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.set("drawer", "workitem");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    function handleEditPlanningItem(item: UnifiedPlanningItem) {
        // Navigate to the full page view in the same tab
        goto(`/work/${item.id}`);
    }

    function handleNavigateToBacklog() {
        goto("/work/backlog");
    }

    // Preload backlog page on hover for immediate responsiveness
    let backlogCardElement: HTMLElement | null = $state(null);

    async function handleBacklogCardHover() {
        try {
            // Preload code and data if not already preloaded
            await Promise.all([
                preloadCode("/work/backlog"),
                preloadData("/work/backlog"),
            ]);
        } catch (error) {
            // Silently fail - preloading is optional optimization
            console.debug("Failed to preload backlog page on hover:", error);
        }
    }

    async function handleOpenMyBacklogDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.set("drawer", "mybacklog");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleOpenSettingsDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.set("drawer", "settings");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleCloseSettingsDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.delete("drawer");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleCloseMyBacklogDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.delete("drawer");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleOpenChatDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.set("drawer", "chat");
        // Preserve mode if already set, otherwise default to 'chat'
        if (!urlParams.has("mode")) {
            urlParams.set("mode", "chat");
        }
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    /**
     * Update chat mode in URL
     */
    async function updateChatMode(mode: "chat" | "task") {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        const currentMode = urlParams.get("mode") || "chat";

        // Only update if mode actually changed and drawer is open
        if (urlParams.get("drawer") === "chat" && currentMode !== mode) {
            urlParams.set("mode", mode);
            await goto(`?${urlParams.toString()}`, {
                noScroll: true,
                replaceState: true,
            });
        }
    }

    async function handleCloseChatDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.delete("drawer");
        urlParams.delete("mode"); // Also remove mode when closing drawer
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleOpenShortcutsDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.set("drawer", "shortcuts");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleCloseShortcutsDrawer() {
        const urlParams = new URLSearchParams($page.url?.searchParams);
        urlParams.delete("drawer");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    // Derive drawer state from URL
    const isSettingsDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "settings",
    );
    const isMyBacklogDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "mybacklog",
    );
    const isChatDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "chat",
    );

    // Derive chat mode from URL parameter (default to 'chat' if not specified)
    const chatDrawerMode = $derived.by(() => {
        const modeParam = $page.url.searchParams.get("mode");
        return (modeParam === "task" ? "task" : "chat") as "chat" | "task";
    });

    const isShortcutsDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "shortcuts",
    );

    // Shortcuts state
    let shortcuts = $state<Shortcut[]>([]);
    let shortcutsLoading = $state(false);
    let shortcutsError = $state<string | null>(null);
    let shortcutToDelete = $state<number | null>(null);

    // Load shortcuts when drawer opens
    $effect(() => {
        if (isShortcutsDrawerOpen) {
            loadShortcuts();
        }
    });

    async function loadShortcuts() {
        shortcutsLoading = true;
        shortcutsError = null;

        const result = await shortcutsService.getUserShortcuts();

        if (result.success) {
            shortcuts = result.value;
        } else {
            shortcutsError = getUserMessage(result.error);
            shortcuts = [];
        }

        shortcutsLoading = false;
    }

    function handleDeleteShortcut(shortcutId: number) {
        // Set confirmation state
        shortcutToDelete = shortcutId;
    }

    async function confirmDeleteShortcut(shortcutId: number) {
        const result = await shortcutsService.deleteShortcut(shortcutId);

        if (result.success) {
            toastStore.add("Snelkoppeling verwijderd", "success");
            // Reset confirmation state
            shortcutToDelete = null;
            // Reload shortcuts
            await loadShortcuts();
        } else {
            toastStore.add(getUserMessage(result.error), "error");
            // Reset confirmation state on error
            shortcutToDelete = null;
        }
    }

    function cancelDeleteShortcut() {
        shortcutToDelete = null;
    }

    // Handle week selection - update URL parameter
    async function handleWeekSelect(weekId: string) {
        const currentWeeks = selectedWeeks; // Get current value from derived state

        let newWeeks: string[];
        if (currentWeeks.includes(weekId)) {
            // Deselect: remove from array
            newWeeks = currentWeeks.filter((w) => w !== weekId);
        } else {
            // Select: add to array
            newWeeks = [...currentWeeks, weekId];
        }

        // Build URL manually to avoid encoding commas
        const params: string[] = [];

        // Preserve existing params except weeks and myBacklogPage
        const currentParams = $page.url?.searchParams;
        if (currentParams) {
            currentParams.forEach((value, key) => {
                if (key !== "weeks" && key !== "myBacklogPage") {
                    params.push(`${key}=${encodeURIComponent(value)}`);
                }
            });
        }

        // Add weeks parameter with unencoded commas
        if (newWeeks.length > 0) {
            params.push(`weeks=${newWeeks.join(",")}`);
        }

        // Reset pagination to page 1 (omit if page 1 for cleaner URL)

        const url = params.length > 0 ? `?${params.join("&")}` : "?";
        await goto(url, { replaceState: true, noScroll: true });
    }

    // Derive my backlog items (filtered by current user, sorted by due date ascending)
    const myBacklogItems = $derived.by(() => {
        const items = backlogItems;
        if (!items || !currentUserId) return [];
        const filteredItems = items.filter((item) => {
            // Get assignee IDs as array (handle both array and single value for backward compatibility)
            const itemAssigneeIds = Array.isArray(item.assignee_id)
                ? item.assignee_id
                : item.assignee_id
                  ? [item.assignee_id]
                  : [];
            const itemOwnerId = item.owner_id ? [item.owner_id] : [];
            const allItemAssigneeIds = [...itemAssigneeIds, ...itemOwnerId];

            // Check if current user is in the assignee/owner list
            return allItemAssigneeIds.includes(currentUserId);
        });

        // Sort by due_date/deadline ascending (earliest first)
        return filteredItems.sort((a, b) => {
            // Get the date from either due_date or deadline field
            const dateA = a.due_date || a.deadline;
            const dateB = b.due_date || b.deadline;

            // Items without date go to the end
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            // Compare dates
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
    });

    // Filtered backlog items based on selected weeks
    const filteredBacklogItems = $derived.by(() => {
        // If no weeks selected, show all items
        if (selectedWeeks.length === 0) return myBacklogItems;

        // Filter items that match any of the selected weeks
        return myBacklogItems.filter((item) => {
            const deadlineStr = item.deadline || item.due_date;
            if (!deadlineStr) return false;

            const itemDate = new Date(deadlineStr);
            const itemWeek = getISOWeek(itemDate);
            const itemYear = getISOWeekYear(itemDate);
            const itemWeekId = `${itemWeek}-${itemYear}`;

            return selectedWeeks.includes(itemWeekId);
        });
    });

    // Pagination state for My Backlog Drawer - derived from URL
    const myBacklogPageParam = $derived(
        $page.url.searchParams.get("myBacklogPage"),
    );
    const myBacklogCurrentPage = $derived(
        myBacklogPageParam
            ? Math.max(1, parseInt(myBacklogPageParam, 10) || 1)
            : 1,
    );
    const myBacklogItemsPerPage = 15;

    // Derived paginated items for My Backlog (use filtered items)
    const myBacklogPaginatedItems = $derived.by(() => {
        const startIndex = (myBacklogCurrentPage - 1) * myBacklogItemsPerPage;
        const endIndex = startIndex + myBacklogItemsPerPage;
        return filteredBacklogItems.slice(startIndex, endIndex);
    });

    const myBacklogTotalPages = $derived(
        Math.ceil(filteredBacklogItems.length / myBacklogItemsPerPage),
    );

    // Handle page change for My Backlog - update URL parameter
    async function handleMyBacklogPageChange(pageNumber: number) {
        const currentPage = get(page);

        // Build URL manually to avoid encoding commas
        const params: string[] = [];

        // Preserve existing params except myBacklogPage
        const searchParams = currentPage?.url?.searchParams;
        if (searchParams) {
            searchParams.forEach((value, key) => {
                if (key !== "myBacklogPage") {
                    // Keep weeks param unencoded for readability
                    if (key === "weeks") {
                        params.push(`${key}=${value}`);
                    } else {
                        params.push(`${key}=${encodeURIComponent(value)}`);
                    }
                }
            });
        }

        // Add page param only if not page 1 (for cleaner URLs)
        if (pageNumber !== 1) {
            params.push(`myBacklogPage=${pageNumber}`);
        }

        const url = params.length > 0 ? `?${params.join("&")}` : "?";
        await goto(url, { replaceState: true, noScroll: true });
    }

    // Convert backlog item to planning item for WorkItemCard
    function convertToPlanningItem(
        item: UnifiedBacklogItem,
    ): UnifiedPlanningItem {
        return {
            ...item,
            kanban_status: item.kanban_status || "backlog",
            kanban_order: 0,
        };
    }

    // Handle editing a backlog item
    function handleEditBacklogItem(item: UnifiedBacklogItem) {
        // Navigate to full detail page
        goto(`/work/${item.id}`);
    }

    function handleQuickEditBacklogItem(item: UnifiedBacklogItem) {
        // Open quick edit drawer
        if (item.type === "work_item") {
            // Open work item drawer with the item ID
            const urlParams = new URLSearchParams($page.url?.searchParams);
            urlParams.set("drawer", "workitem");
            urlParams.set("workItemId", String(item.id));
            goto(`?${urlParams.toString()}`, { noScroll: true });
        } else {
            // Open case task drawer with the item ID
            const urlParams = new URLSearchParams($page.url?.searchParams);
            urlParams.set("drawer", "casetask");
            urlParams.set("caseTaskId", String(item.id));
            goto(`?${urlParams.toString()}`, { noScroll: true });
        }
    }

    async function handleBacklogItemSaved() {
        // Refresh both backlog and planning items to reflect changes immediately
        await Promise.all([
            taskStore.getBacklogItems(null, false),
            taskStore.getPlanningItems(assigneeFilter || undefined, false),
        ]);
    }

    async function handleMoveToPlanning(
        item: UnifiedBacklogItem,
        status: "gepland" | "ad-hoc",
    ) {
        // Optimistically remove the item from the backlog immediately (it will move to planning)
        // This prevents flashing in the drawer
        backlogItems = backlogItems.filter(
            (i) => !(i.id === item.id && i.type === item.type),
        );

        // Also update the store optimistically
        await taskStore.updateWorkItem(item.id, {
            status,
            kanban_status: "gepland",
        } as Parameters<typeof taskStore.updateWorkItem>[1]);

        // Show toast immediately for better UX
        const toastMessage =
            item.type === "work_item"
                ? "Item verplaatst naar planning"
                : "Taak verplaatst naar planning";
        toastStore.add(toastMessage, "success");

        try {
            if (item.type === "work_item") {
                const result = await taskService.moveWorkItemToPlanning(
                    item.id,
                    status,
                );
                if (!result.success) {
                    // Remove success toast and show error
                    toastStore.clear();
                    toastStore.add(getUserMessage(result.error), "error");
                    console.error(
                        "Error moving work item to planning:",
                        result.error,
                    );
                    // Revert optimistic update on error - refresh from server
                    await taskStore.getBacklogItems(null, false);
                } else {
                    // Only refresh planning items - backlog already updated optimistically
                    await taskStore.getPlanningItems(
                        assigneeFilter || undefined,
                        false,
                    );
                }
            } else if (item.type === "case_task") {
                const result = await caseService.moveCaseTaskToPlanning(
                    item.id,
                    status,
                );
                if (!result.success) {
                    // Remove success toast and show error
                    toastStore.clear();
                    toastStore.add(getUserMessage(result.error), "error");
                    console.error(
                        "Error moving case task to planning:",
                        result.error,
                    );
                    // Revert optimistic update on error - refresh from server
                    await taskStore.getBacklogItems(null, false);
                } else {
                    // Only refresh planning items - backlog already updated optimistically
                    await taskStore.getPlanningItems(
                        assigneeFilter || undefined,
                        false,
                    );
                }
            }
        } catch (error) {
            // Handle unexpected errors
            console.error("Unexpected error moving item to planning:", error);
            toastStore.clear();
            toastStore.add("Er is een onverwachte fout opgetreden", "error");
            // Revert optimistic update on error - refresh from server
            await taskStore.getBacklogItems(null, false);
        }
    }

    onMount(() => {
        // Only fetch backlog items if SSR didn't provide them (avoid duplicate API call)
        if (!data.backlogItems?.length) {
            taskStore.getBacklogItems(null, false);
        }

        // Start polling for work items (both planning and backlog) with current filter
        taskStore.startPolling(30000, assigneeFilter);

        // Preload backlog page code and data for faster navigation
        // Use setTimeout to avoid blocking initial page load
        setTimeout(async () => {
            try {
                // Preload the JavaScript code for the backlog page
                await preloadCode("/work/backlog");
                // Preload the page data (server load function)
                await preloadData("/work/backlog");
            } catch (error) {
                // Silently fail - preloading is optional optimization
                console.debug("Failed to preload backlog page:", error);
            }
        }, 1000); // Wait 1 second after page load to not interfere with initial rendering

        // Refresh AOS after page loads to detect elements already in viewport
        if (browser) {
            // Wait for DOM to be ready and AOS to be initialized
            setTimeout(async () => {
                await refreshAOS();
            }, 500);
        }

        // Handle visibility changes
        if (typeof document !== "undefined") {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    taskStore.stopPolling();
                } else {
                    taskStore.startPolling(30000, assigneeFilter);
                    // Refresh data when tab becomes visible
                    taskStore.getBacklogItems(null, false);
                }
            };
            document.addEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );

            return () => {
                document.removeEventListener(
                    "visibilitychange",
                    handleVisibilityChange,
                );
            };
        }
    });

    // Restart polling when assigneeFilter changes
    $effect(() => {
        // Stop and restart polling with new filter
        taskStore.stopPolling();
        taskStore.startPolling(30000, assigneeFilter);
    });

    onDestroy(() => {
        // Stop polling when component is destroyed
        taskStore.stopPolling();
    });

    async function handleWorkItemSaved(workItem: Task) {
        // Refresh both backlog and planning items to reflect changes immediately
        await Promise.all([
            taskStore.getBacklogItems(null, false),
            taskStore.getPlanningItems(assigneeFilter || undefined, false),
        ]);
    }
</script>

<svelte:head>
    <title
        >{showOverdueOnly ? "Te Late Taken" : "Ons Werk"} - Business Process Management</title
    >
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[98vw] lg:max-w-[90vw] relative">
    <div class="space-y-6">
        <!-- Navigation Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-aos-id-navcards>
            <!-- User Navigation Card -->
            {#if currentUserName}
                <div
                    class="relative z-10"
                    data-aos="fade-down"
                    data-aos-anchor="[data-aos-id-navcards]"
                    data-aos-delay="0"
                >
                    <NavCard
                        title=""
                        hideTitle={true}
                        subtitle={kanbanStats
                            ? `${kanbanStats.count} taken in ${kanbanStats.hours} uur`
                            : undefined}
                        actions={[
                            {
                                icon: User,
                                label: "Mijn backlog",
                                onclick: handleOpenMyBacklogDrawer,
                                variant: "ghost",
                            },
                            {
                                icon: ChartGantt,
                                label: "Weekplanning",
                                onclick: () => goto("/mijn-werk"),
                                variant: "ghost",
                            },
                            {
                                icon: Bookmark,
                                label: "Mijn snelkoppelingen",
                                onclick: handleOpenShortcutsDrawer,
                                variant: "ghost",
                            },
                        ]}
                    >
                        {#snippet headerContent()}
                            <UserAvatar
                                user={currentUser}
                                size="md"
                                showName={false}
                            />
                        {/snippet}
                        {#snippet trailingContent()}
                            <DropdownNav
                                icon={Ellipsis}
                                items={[
                                    { label: "Chat Assistant", href: "#chat" },
                                    {
                                        label: "Mijn voorkeuren",
                                        href: "#settings",
                                    },
                                ]}
                                position="right"
                                showBorder={false}
                                onitemclick={(item) => {
                                    if (item.href === "#chat") {
                                        handleOpenChatDrawer();
                                    } else if (item.href === "#settings") {
                                        handleOpenSettingsDrawer();
                                    }
                                }}
                            />
                        {/snippet}
                    </NavCard>
                </div>
            {/if}

            <!-- Backlog Navigation Card -->
            <div
                bind:this={backlogCardElement}
                onmouseenter={handleBacklogCardHover}
                role="presentation"
                data-aos="fade-down"
                data-aos-anchor="[data-aos-id-navcards]"
                data-aos-delay="100"
            >
                <NavCard
                    title="Backlog"
                    subtitle={backlogStats
                        ? `${backlogStats.count} taken in ${backlogStats.hours} uur`
                        : undefined}
                    actions={[
                        {
                            icon: List,
                            label: "Bekijk backlog",
                            onclick: handleNavigateToBacklog,
                            variant: "ghost",
                        },
                        {
                            icon: Plus,
                            label: "Work item toevoegen",
                            onclick: handleOpenBacklogDrawer,
                            variant: "default",
                        },
                    ]}
                />
            </div>
        </div>

        <!-- Kanban Board -->
        <Kanban
            {assigneeFilter}
            {showOverdueOnly}
            onitemclick={handleEditPlanningItem}
        />
    </div>
</div>

<!-- Settings Drawer -->
<Drawer
    open={isSettingsDrawerOpen}
    position="right"
    class="w-[95vw] md:w-[66vw]"
    onclose={handleCloseSettingsDrawer}
>
    <div class="flex flex-col h-full p-6">
        <!-- Header -->
        <div class="mb-6">
            <h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                {currentUserName || "Instellingen"}
            </h2>
            <p class="text-sm text-zinc-600 mt-1">
                Beheer je beschikbaarheid en andere instellingen
            </p>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <UserAvailabilityInput />
        </div>
    </div>
</Drawer>

<!-- My Backlog Drawer -->
<Drawer
    open={isMyBacklogDrawerOpen}
    position="right"
    class="w-[95vw] md:w-[66vw]"
    onclose={handleCloseMyBacklogDrawer}
>
    <div class="flex flex-col h-full p-6 overflow-y-auto">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                    Mijn Backlog
                </h2>
                <span class="text-zinc-400">•</span>
                <p class="text-sm text-zinc-600">
                    {#if selectedWeeks.length > 0}
                        {filteredBacklogItems.length} van {myBacklogItems.length}
                        {filteredBacklogItems.length === 1 ? "taak" : "taken"} (gefilterd)
                    {:else}
                        {myBacklogItems.length}
                        {myBacklogItems.length === 1 ? "taak" : "taken"} in je backlog
                    {/if}
                </p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onclick={() => goto("/mijn-werk")}
            >
                <ChartGantt class="w-4 h-4 mr-2" />
                Weekplanning
            </Button>
        </div>

        <!-- Weekly Stats -->
        {#if myBacklogItems.length > 0}
            <div class="mb-6">
                <BacklogWeeklyStats
                    items={myBacklogItems}
                    {selectedWeeks}
                    onweekselect={handleWeekSelect}
                />
            </div>
        {/if}

        <!-- Content -->
        <div>
            {#if myBacklogItems.length === 0}
                <div class="text-center py-12">
                    <p class="text-zinc-500">Geen backlog items gevonden</p>
                </div>
            {:else if filteredBacklogItems.length === 0}
                <div class="text-center py-12">
                    <p class="text-zinc-500">
                        Geen items gevonden voor de geselecteerde weken
                    </p>
                </div>
            {:else}
                <!-- Backlog Items Grid -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {#each myBacklogPaginatedItems as item (item.type + "-" + item.id)}
                        {@const planningItem = convertToPlanningItem(item)}
                        <WorkItemCard
                            workItem={planningItem}
                            draggable={false}
                            onclick={() => handleEditBacklogItem(item)}
                            oneditclick={() => handleQuickEditBacklogItem(item)}
                            showStatusButtons={true}
                            onstatuschange={(status) =>
                                handleMoveToPlanning(item, status)}
                        />
                    {/each}
                </div>

                <!-- Pagination Component -->
                {#if myBacklogTotalPages > 1}
                    <div class="mt-8">
                        <Pagination
                            currentPage={myBacklogCurrentPage}
                            totalItems={filteredBacklogItems.length}
                            itemsPerPage={myBacklogItemsPerPage}
                            onPageChange={handleMyBacklogPageChange}
                        />
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</Drawer>

<!-- Backlog Drawer -->
<BacklogDrawer onsaved={handleBacklogItemSaved} />

<!-- Case Task Drawer -->
<CaseTaskDrawer onsaved={handleBacklogItemSaved} />

<!-- Chat Drawer -->
<Drawer
    open={isChatDrawerOpen}
    position="left"
    class={chatDrawerMode === "task"
        ? "w-[calc(31.5vw+399px)] max-w-[calc(31.5vw+399px)]"
        : "w-[31.5vw] max-w-[31.5vw]"}
    onclose={handleCloseChatDrawer}
>
    <div class="w-full h-full overflow-hidden flex flex-col">
        <ChatDrawer
            mode={chatDrawerMode}
            onmodechange={updateChatMode}
            class="w-full h-full"
        />
    </div>
</Drawer>

<!-- Shortcuts Drawer -->
<Drawer
    open={isShortcutsDrawerOpen}
    position="left"
    class="w-[95vw] md:w-[66vw]"
    onclose={handleCloseShortcutsDrawer}
>
    <div class="flex flex-col h-full p-6">
        <!-- Header -->
        <div class="mb-6">
            <h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                Snelkoppelingen
            </h2>
            <p class="text-sm text-zinc-600 mt-1">
                Je persoonlijke snelkoppelingen
            </p>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            {#if shortcutsLoading}
                <div class="text-center py-12">
                    <p class="text-zinc-500">Laden...</p>
                </div>
            {:else if shortcutsError}
                <div class="text-center py-12">
                    <p class="text-red-600">{shortcutsError}</p>
                    <Button
                        variant="ghost"
                        onclick={loadShortcuts}
                        class="mt-4"
                    >
                        Opnieuw proberen
                    </Button>
                </div>
            {:else if shortcuts.length === 0}
                <div class="text-center py-12">
                    <Bookmark class="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p class="text-zinc-500 mb-2">Nog geen snelkoppelingen</p>
                    <p class="text-sm text-zinc-400">
                        Klik op het bookmark-plus icoon in de header om een
                        snelkoppeling toe te voegen
                    </p>
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                >
                    {#each shortcuts as shortcut (shortcut.id)}
                        {@const shortcutColor = shortcut.color || "#3b82f6"}
                        {@const isConfirmingDelete =
                            shortcutToDelete === shortcut.id}
                        <div
                            class="flex flex-col p-3 bg-white border rounded-lg hover:bg-zinc-50 transition group relative"
                            class:opacity-50={isConfirmingDelete}
                            style="border-color: {shortcutColor}; border-width: 1px; border-style: dotted;"
                            role="button"
                            tabindex={isConfirmingDelete ? 0 : -1}
                            onclick={(e) => {
                                if (
                                    isConfirmingDelete &&
                                    e.target === e.currentTarget
                                ) {
                                    cancelDeleteShortcut();
                                }
                            }}
                            onkeydown={(e) => {
                                if (
                                    (e.key === "Enter" || e.key === " ") &&
                                    isConfirmingDelete &&
                                    e.target === e.currentTarget
                                ) {
                                    e.preventDefault();
                                    cancelDeleteShortcut();
                                }
                            }}
                        >
                            <!-- Normal mode: Show shortcut content -->
                            <button
                                onclick={() => {
                                    if (!isConfirmingDelete) {
                                        goto(shortcut.url);
                                    }
                                }}
                                class="flex-1 text-left flex flex-col gap-2"
                                class:pointer-events-none={isConfirmingDelete}
                            >
                                <div class="flex items-start gap-2">
                                    <Bookmark
                                        class="w-4 h-4 transition shrink-0 mt-0.5"
                                        style="color: {shortcutColor};"
                                    />
                                    <div class="flex-1 min-w-0">
                                        <h3
                                            class="text-sm font-medium text-zinc-900 line-clamp-2"
                                        >
                                            {shortcut.title}
                                        </h3>
                                    </div>
                                </div>
                                <p
                                    class="text-xs text-zinc-500 truncate font-mono pl-6"
                                >
                                    {shortcut.url}
                                </p>
                            </button>

                            {#if isConfirmingDelete}
                                <!-- Confirmation mode: Show Check button overlay in center -->
                                <div
                                    class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg"
                                >
                                    <button
                                        onclick={() =>
                                            confirmDeleteShortcut(shortcut.id)}
                                        class="flex items-center justify-center w-12 h-12 rounded-full transition hover:opacity-90"
                                        style="background-color: {shortcutColor}; color: white;"
                                        title="Bevestig verwijderen"
                                    >
                                        <Check class="w-6 h-6" />
                                    </button>
                                </div>
                            {:else}
                                <!-- Normal mode: Show action buttons -->
                                <div
                                    class="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <a
                                        href={shortcut.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onclick={(e) => e.stopPropagation()}
                                        class="p-1.5 text-zinc-400 hover:text-zinc-600 transition rounded hover:bg-zinc-100"
                                        title="Openen in nieuw tabblad"
                                    >
                                        <ExternalLink class="w-4 h-4" />
                                    </a>
                                    <IconButton
                                        icon={Trash2}
                                        variant="ghost"
                                        size="sm"
                                        tooltip="Verwijderen"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteShortcut(shortcut.id);
                                        }}
                                    />
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</Drawer>
