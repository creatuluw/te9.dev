<script lang="ts">
    import { goto, invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount, onDestroy } from "svelte";
    import type { PageData } from "./$types";
    import WorkItemCard from "$lib/components/WorkItemCard.svelte";
    import BacklogDrawer from "$lib/components/BacklogDrawer.svelte";
    import CaseTaskDrawer from "$lib/components/CaseTaskDrawer.svelte";
    import Button from "$lib/components/Button.svelte";
    import Toggle from "$lib/components/Toggle.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Label from "$lib/components/Label.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import NavCard from "$lib/components/NavCard.svelte";
    import HoursChart from "$lib/components/HoursChart.svelte";
    import ButtonGroup from "$lib/components/ButtonGroup.svelte";
    import { Drawer, DateRangePicker } from "$lib/components";
    import { Eraser, Search, Plus, ChartBarDecreasing } from "lucide-svelte";
    import {
        taskState,
        getBacklogItems,
        getPlanningItems,
        updateWorkItem,
        initialize,
        startPolling,
        stopPolling,
    } from "$lib/stores/taskStore.svelte";
    import {
        startPageLoading,
        stopPageLoading,
    } from "$lib/stores/navigationStore.svelte";
    import * as taskService from "$lib/services/taskService";
    import * as caseService from "$lib/services/caseService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import * as projectService from "$lib/services/projectService";
    import * as processService from "$lib/services/processService";
    import { getCurrentUserId, formatUserName } from "$lib/utils/userUtils";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type {
        UnifiedBacklogItem,
        UnifiedPlanningItem,
    } from "$lib/services/taskService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Project } from "$lib/schemas/project";
    import type { Case } from "$lib/schemas/case";
    import type { Process } from "$lib/schemas/process";
    import { queryTableResult } from "$lib/utils/postgrest";
    import { authStore } from "$lib/stores/authStore";
    import * as projectMemberService from "$lib/services/projectMemberService";
    import { refreshAOS } from "$lib/utils/aosKit";
    import { browser } from "$app/environment";

    // Get SSR data from page
    let { data }: { data: PageData } = $props();

    // Use SSR data immediately for instant render
    // Cards are visible immediately with SSR data - no waiting for loading to complete
    let backlogItems = $state(data.backlogItems || []);
    let users = $state(data.users || []);
    let projects = $state(data.projects || []);
    let processes = $state(data.processes || []);
    let cases = $state(data.cases || []);

    // Track items that are currently being moved to planning (to prevent them from reappearing)
    let itemsBeingMoved = $state<Set<string>>(new Set());

    // Track if we're in a filter transition to prevent showing mismatched data
    let isFilterTransition = $state(false);

    // Track when we're resetting to show proper loading state
    let isResetting = $state(false);

    // Track if we have SSR data (cards should be visible immediately)
    const hasSSRData = $derived(data.backlogItems.length > 0);

    // Initialize process tasks from SSR data (all data arrives together)
    let processTasks = $state<
        Map<number, { name: string; description: string | null }>
    >(
        data.processTasks && data.processTasks.length > 0
            ? new Map(
                  data.processTasks.map((task: any) => [
                      task.id,
                      { name: task.name, description: task.description },
                  ]),
              )
            : new Map(),
    );

    // Initialize filters from SSR data (applied filters)
    const currentUserId = getCurrentUserId();

    const openSearchDrawerButtonSnippet = `
        <IconButton
            icon={Search}
            variant="ghost"
            tooltip="Zoeken & Filteren"
        />
    `;

    const openChartDrawerButtonSnippet = `
        <IconButton
            icon={ChartBarDecreasing}
            variant="ghost"
            tooltip="Uren overzicht"
        />
    `;

    const openCreateDrawerButtonSnippet = `
        <IconButton
            icon={Plus}
            variant="default"
            tooltip="Nieuw item toevoegen"
        />
    `;

    // Filters are now DERIVED from URL params - strictly reactive to URL
    // This eliminates race conditions and flickering when URL changes
    const searchQuery = $derived.by(() => {
        const val = $page.url.searchParams.get("search") || "";
        return val;
    });
    const searchScope = $derived.by(() => {
        const val = $page.url.searchParams.get("scope") || "alle";
        return val;
    });
    const filterAssignee = $derived.by(() => {
        const val = $page.url.searchParams.get("assignee");
        // If URL has assignee param, use it; otherwise empty array (all users)
        // The initial load auto-select is handled in onMount, not here
        return val ? val.split(",").filter(Boolean) : [];
    });
    const filterTaskType = $derived.by(() => {
        const val = $page.url.searchParams.get("taskType");
        return val ? val.split(",").filter(Boolean) : [];
    });
    const filterKomtVan = $derived.by(() => {
        const val = $page.url.searchParams.get("komtVan");
        return val
            ? val
                  .split(",")
                  .map((v) => decodeURIComponent(v))
                  .filter(Boolean)
            : [];
    });
    const filterDeadline = $derived.by(() => {
        return $page.url.searchParams.get("deadline") || null;
    });
    const filterDateFrom = $derived.by(() => {
        return $page.url.searchParams.get("dateFrom") || null;
    });
    const filterDateTo = $derived.by(() => {
        return $page.url.searchParams.get("dateTo") || null;
    });
    const filterProject = $derived.by(() => {
        const val = $page.url.searchParams.get("project");
        return val ? parseInt(val, 10) : null;
    });
    const filterCase = $derived.by(() => {
        const val = $page.url.searchParams.get("case");
        return val ? parseInt(val, 10) : null;
    });
    const filterTags = $derived.by(() => {
        const val = $page.url.searchParams.get("tags");
        return val ? val.split(",").filter(Boolean) : [];
    });
    const filterPriority = $derived.by(() => {
        const val = $page.url.searchParams.get("priority");
        return val ? val.split(",").filter(Boolean) : [];
    });

    // Temporary filter state (before applying)
    let tempSearchQuery = $state("");
    let tempSearchScope = $state("alle");
    let tempFilterTaskType = $state<string[]>([]);
    let tempFilterKomtVan = $state<string[]>([]);
    let tempFilterDeadline = $state<string | null>(null);
    let tempFilterDateFrom = $state<string | null>(null);
    let tempFilterDateTo = $state<string | null>(null);
    let tempFilterProject = $state<number | null>(null);
    let tempFilterTags = $state<string[]>([]);
    let tempFilterPriority = $state<string[]>([]);
    let tempFilterCase = $state<number | null>(null);

    // Initialize tempFilterAssignee after currentUserId is defined
    let tempFilterAssignee = $state<string[]>(
        currentUserId ? [currentUserId] : [],
    );

    // Track open state for each select to manage z-index
    let assigneeSelectOpen = $state(false);
    let taskTypeSelectOpen = $state(false);
    let komtVanSelectOpen = $state(false);
    let deadlineSelectOpen = $state(false);
    let projectSelectOpen = $state(false);
    let tagsSelectOpen = $state(false);
    let prioritySelectOpen = $state(false);
    let caseSelectOpen = $state(false);
    let dateRangePickerOpen = $state(false);

    // Derive drawer states from URL params
    const searchDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "search",
    );
    const chartDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "hourschart",
    );
    const chartGroupBy = $derived.by(() => {
        const groupByParam = $page.url.searchParams.get("chartGroupBy");
        if (
            groupByParam === "assignee" ||
            groupByParam === "project" ||
            groupByParam === "source" ||
            groupByParam === "week"
        ) {
            return groupByParam;
        }
        return "assignee" as const;
    });

    // Use taskState for reactive updates (Svelte 5 $state runes pattern)
    // Direct reactive access - no subscribe needed!
    let lastStoreUpdate = $state(taskState.lastFetch || 0); // Track when store was last updated
    let hasInitializedFromSSR = $state(false); // Track if we've initialized from SSR data

    // Derive loading state reactively
    // Only show loading when explicitly requested (user actions), not during silent background sync
    const isLoading = $derived(taskState.loading);

    // Track if we're currently initializing to prevent $effect from reacting
    // Start as true to prevent $effect from running until we've initialized from SSR
    let isInitializing = $state(true);

    // Track if this is the initial render (for skipping AOS animation on first load)
    let isInitialRender = $state(true);

    // Helper function for deep equality check
    function arraysEqual(
        a: UnifiedBacklogItem[],
        b: UnifiedBacklogItem[],
    ): boolean {
        if (a.length !== b.length) return false;
        const aMap = new Map(
            a.map((item) => [`${item.type}-${item.id}`, JSON.stringify(item)]),
        );
        const bMap = new Map(
            b.map((item) => [`${item.type}-${item.id}`, JSON.stringify(item)]),
        );
        if (aMap.size !== bMap.size) return false;
        for (const [key, aValue] of aMap) {
            if (bMap.get(key) !== aValue) return false;
        }
        return true;
    }

    // Update backlogItems when data actually changes (silent updates)
    // IMPORTANT: This effect should NOT overwrite SSR data immediately after initialization
    // Only update from store when:
    // 1. No SSR data was available (hasInitializedFromSSR is false)
    // 2. Store data actually changed (deep equality check) - prevents unnecessary re-renders
    $effect(() => {
        // Skip updates during initialization to prevent overwriting SSR data
        if (isInitializing) return;

        // Only react to actual data changes, not loading state changes
        // This prevents re-renders during silent background polling
        const storeItems = taskState.backlogItems;
        const storeLastFetch = taskState.lastFetch || 0;

        // Only update if:
        // 1. We haven't initialized from SSR yet (meaning SSR data was empty) - always update
        // 2. Store data actually changed (deep equality check)
        if (!hasInitializedFromSSR) {
            // No SSR data - always use store data
            backlogItems = storeItems;
            lastStoreUpdate = storeLastFetch;
            hasInitializedFromSSR = true;
        } else if (storeLastFetch > lastStoreUpdate) {
            // Store has newer data - check if it actually changed
            const dataChanged = !arraysEqual(backlogItems, storeItems);

            if (dataChanged) {
                // Data actually changed - update (will trigger re-render)
                // Filter out items that are currently being moved
                const filteredStoreItems = storeItems.filter((item) => {
                    const itemKey = `${item.type}-${item.id}`;
                    return !itemsBeingMoved.has(itemKey);
                });
                backlogItems = filteredStoreItems;
                lastStoreUpdate = storeLastFetch;

                // Clear transition flag when new data matches current URL
                const currentUrlString = $page.url.search;
                if (currentUrlString === lastFetchUrl) {
                    isFilterTransition = false;
                }
            } else {
                // Data unchanged - silently update timestamp (no re-render)
                lastStoreUpdate = storeLastFetch;
            }
        }
    });

    // Start page loading immediately when component initializes (client-side only)
    // This ensures spinner shows as soon as the page component loads
    let loadingStarted = $state(false);
    $effect(() => {
        if (typeof window !== "undefined" && !loadingStarted) {
            startPageLoading();
            loadingStarted = true;
        }
    });

    // Initial load is complete when we have finished loading all unfiltered data
    // Show spinner until initialization is complete and loading has finished
    // During SSR, always show content (SSR data is already loaded)
    const initialLoadComplete = $derived.by(() => {
        // During SSR, always show content (data is already loaded)
        if (typeof window === "undefined") {
            return true;
        }

        // If we have SSR data, show content immediately (don't wait for loading)
        // This ensures cards appear as soon as loader stops
        if (hasSSRData) {
            return hasInitializedFromSSR;
        }

        // No SSR data: wait for initialization and loading to complete
        return hasInitializedFromSSR && !isLoading;
    });

    // Refresh AOS when cards are updated (after initial render)
    // Initial render shows cards immediately without AOS animation
    $effect(() => {
        if (
            !isInitialRender &&
            initialLoadComplete &&
            browser &&
            backlogItems.length > 0
        ) {
            // Use double RAF to ensure DOM has fully rendered
            requestAnimationFrame(() => {
                requestAnimationFrame(async () => {
                    await refreshAOS();
                });
            });
        }
    });

    // Project membership tracking (project_id -> {isMember: boolean, isOwner: boolean})
    // Check if user can access a specific project
    // Note: Server already filters projects via getProjectsForUser
    // If project exists in projects array, user has access
    function canAccessProject(projectId: number | null): boolean {
        if (!projectId) return true; // No project = accessible

        // Check if project exists in the server-filtered projects array
        // If it exists, user has access (server already filtered by membership)
        const project = projectMap.get(projectId);
        return project !== undefined;
    }

    // Note: users, projects, cases, processes, and processTasks are already initialized from SSR data above

    // Map of project_id -> project for quick lookup
    const projectMap = $derived.by(() => {
        const map = new Map<number, Project>();
        projects.forEach((project: Project) => {
            map.set(project.id, project);
        });
        return map;
    });

    // Map of case_id -> case for quick lookup
    const caseMap = $derived.by(() => {
        const map = new Map<number, Case>();
        cases.forEach((caseItem: Case) => {
            map.set(caseItem.id, caseItem);
        });
        return map;
    });

    // Map of user_id -> user for quick lookup
    const userMap = $derived.by(() => {
        const map = new Map<string, PocketBaseUser>();
        users.forEach((user: PocketBaseUser) => {
            map.set(user.id, user);
        });
        return map;
    });

    // Map of process_id -> process for quick lookup
    const processMap = $derived.by(() => {
        const map = new Map<number, Process>();
        processes.forEach((process: Process) => {
            map.set(process.id, process);
        });
        return map;
    });

    // Distinct komt_van values - only from backlog items
    const distinctKomtVanValues = $derived.by(() => {
        const values = new Set<string>();
        backlogItems.forEach((item: any) => {
            if (item.komt_van) {
                values.add(item.komt_van);
            }
        });
        return Array.from(values).sort();
    });

    // Komt van options - only show values from backlog items
    const komtVanOptions = $derived.by((): SelectOption[] => {
        const options: SelectOption[] = distinctKomtVanValues.map((email) => ({
            value: email,
            label: email,
        }));
        // Add "Onbekend" option only if there are items with null komt_van
        const hasNullKomtVan = backlogItems.some((item: any) => !item.komt_van);
        if (hasNullKomtVan) {
            options.unshift({ value: "__null__", label: "Onbekend" });
        }
        return options;
    });

    // Task type options - only show types that exist in backlog items
    const taskTypeOptions = $derived.by((): SelectOption[] => {
        const types = new Set<string>();
        backlogItems.forEach((item: any) => {
            if (item.task_type) {
                types.add(item.task_type);
            }
        });

        const options: SelectOption[] = [];
        // Show in order: help > case > normaal
        if (types.has("help")) {
            options.push({ value: "help", label: "Help" });
        }
        if (types.has("process")) {
            options.push({ value: "process", label: "Case" });
        }
        if (types.has("manual")) {
            options.push({ value: "manual", label: "Normaal" });
        }
        return options;
    });

    // User options for assignee filter - only show users that have backlog items
    const userOptions = $derived.by((): SelectOption[] => {
        // Extract all unique assignee_id and owner_id values from backlog items
        const assigneeIds = new Set<string>();
        backlogItems.forEach((item: any) => {
            // Handle assignee_id as array or single value
            if (item.assignee_id) {
                if (Array.isArray(item.assignee_id)) {
                    item.assignee_id.forEach((id: string) =>
                        assigneeIds.add(id),
                    );
                } else {
                    assigneeIds.add(item.assignee_id);
                }
            }
            if (item.owner_id) {
                assigneeIds.add(item.owner_id);
            }
        });

        // Filter users to only include those with backlog items
        const options: SelectOption[] = users
            .filter((user: PocketBaseUser) => assigneeIds.has(user.id))
            .map((user: PocketBaseUser) => ({
                value: user.id,
                label: formatUserName(user),
            }));

        // Add "Niet toegewezen" option only if there are items without assignee
        const hasUnassignedItems = backlogItems.some(
            (item: any) => !item.assignee_id && !item.owner_id,
        );
        if (hasUnassignedItems) {
            options.unshift({
                value: "__unassigned__",
                label: "Niet toegewezen",
            });
        }

        return options;
    });

    // Project options for project filter
    const projectOptions = $derived.by((): SelectOption[] => {
        return projects.map((project: Project) => ({
            value: String(project.id),
            label: project.name,
        }));
    });

    // Case options for case filter
    const caseOptions = $derived.by((): SelectOption[] => {
        return cases.map((caseItem: Case) => ({
            value: String(caseItem.id),
            label: caseItem.name,
        }));
    });

    // Tags options - extract unique tags from backlog items
    const tagOptions = $derived.by((): SelectOption[] => {
        const tagSet = new Set<string>();
        backlogItems.forEach((item: any) => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach((tag: string) => {
                    if (tag && tag.trim()) {
                        tagSet.add(tag.trim());
                    }
                });
            }
        });
        return Array.from(tagSet)
            .sort()
            .map((tag) => ({
                value: tag,
                label: tag,
            }));
    });

    // Priority options
    const priorityOptions: SelectOption[] = [
        { value: "laag", label: "Laag" },
        { value: "normaal", label: "Normaal" },
        { value: "hoog", label: "Hoog" },
    ];

    // Derived values for display - show first selected or count
    const selectedAssigneeDisplay = $derived.by(() => {
        if (filterAssignee.length === 0) return null;
        if (filterAssignee.length === 1) return filterAssignee[0];
        // For multiple, show first one (user can still toggle)
        return filterAssignee[0];
    });

    const selectedTaskTypeDisplay = $derived.by(() => {
        if (filterTaskType.length === 0) return null;
        if (filterTaskType.length === 1) return filterTaskType[0];
        // For multiple, show first one
        return filterTaskType[0];
    });

    const selectedKomtVanDisplay = $derived.by(() => {
        if (filterKomtVan.length === 0) return null;
        if (filterKomtVan.length === 1) return filterKomtVan[0];
        // For multiple, show first one
        return filterKomtVan[0];
    });

    // Labels showing selection counts
    const assigneeLabel = $derived.by(() => {
        if (filterAssignee.length === 0) return "Alle gebruikers";
        if (filterAssignee.length === 1) {
            if (filterAssignee[0] === "__unassigned__")
                return "Niet toegewezen";
            const user = users.find(
                (u: PocketBaseUser) => u.id === filterAssignee[0],
            );
            return user ? formatUserName(user) : "Alle gebruikers";
        }
        return `${filterAssignee.length} gebruikers geselecteerd`;
    });

    const taskTypeLabel = $derived.by(() => {
        if (filterTaskType.length === 0) return "Alle types";
        if (filterTaskType.length === 1) {
            const option = taskTypeOptions.find(
                (opt) => opt.value === filterTaskType[0],
            );
            return option?.label || "Alle types";
        }
        return `${filterTaskType.length} types geselecteerd`;
    });

    const komtVanLabel = $derived.by(() => {
        if (filterKomtVan.length === 0) return "Alle afzenders";
        if (filterKomtVan.length === 1) {
            if (filterKomtVan[0] === "__null__") return "Onbekend";
            return filterKomtVan[0];
        }
        return `${filterKomtVan.length} afzenders geselecteerd`;
    });

    // Deadline options - only show options that have items with deadlines in those ranges
    const deadlineOptions = $derived.by((): SelectOption[] => {
        const options: SelectOption[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Helper to check if any items have deadlines in a range
        const hasItemsInRange = (endDate: Date): boolean => {
            return backlogItems.some((item: any) => {
                const itemDeadline = item.deadline || item.due_date;
                if (!itemDeadline) return false;
                const deadlineDate = new Date(itemDeadline);
                deadlineDate.setHours(0, 0, 0, 0);
                return deadlineDate >= today && deadlineDate <= endDate;
            });
        };

        // Helper to check if any items are overdue (deadline < today AND status !== 'completed')
        const hasOverdueItems = (): boolean => {
            const now = new Date();
            return backlogItems.some((item: any) => {
                const itemDeadline = item.deadline || item.due_date;
                if (!itemDeadline || item.status === "completed") return false;
                return new Date(itemDeadline) < now;
            });
        };

        // Add overdue option first if there are overdue items
        if (hasOverdueItems()) {
            options.push({ value: "overdue", label: "Deadline verstreken" });
        }

        // Check each deadline range
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const fourteenDays = new Date(
            today.getTime() + 14 * 24 * 60 * 60 * 1000,
        );
        const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sixtyDays = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
        const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
        const oneYear = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

        if (hasItemsInRange(today)) {
            options.push({ value: "today", label: "Vandaag" });
        }
        if (hasItemsInRange(tomorrow)) {
            options.push({ value: "tomorrow", label: "Morgen" });
        }
        if (hasItemsInRange(sevenDays)) {
            options.push({ value: "7days", label: "< 7 dagen" });
        }
        if (hasItemsInRange(fourteenDays)) {
            options.push({ value: "14days", label: "< 14 dagen" });
        }
        if (hasItemsInRange(thirtyDays)) {
            options.push({ value: "30days", label: "< 30 dagen" });
        }
        if (hasItemsInRange(sixtyDays)) {
            options.push({ value: "60days", label: "< 60 dagen" });
        }
        if (hasItemsInRange(ninetyDays)) {
            options.push({ value: "90days", label: "< 90 dagen" });
        }
        if (hasItemsInRange(oneYear)) {
            options.push({ value: "1year", label: "< 1 jaar" });
        }

        return options;
    });

    const deadlineLabel = $derived.by(() => {
        if (!filterDeadline) return "Alle deadlines";
        const option = deadlineOptions.find(
            (opt) => opt.value === filterDeadline,
        );
        return option?.label || "Alle deadlines";
    });

    // Temporary labels for drawer (using temp state)
    const tempAssigneeLabel = $derived.by(() => {
        if (tempFilterAssignee.length === 0) return "Alle gebruikers";
        if (tempFilterAssignee.length === 1) {
            if (tempFilterAssignee[0] === "__unassigned__")
                return "Niet toegewezen";
            const user = users.find(
                (u: PocketBaseUser) => u.id === tempFilterAssignee[0],
            );
            return user ? formatUserName(user) : "Alle gebruikers";
        }
        return `${tempFilterAssignee.length} gebruikers geselecteerd`;
    });

    const tempTaskTypeLabel = $derived.by(() => {
        if (tempFilterTaskType.length === 0) return "Alle types";
        if (tempFilterTaskType.length === 1) {
            const option = taskTypeOptions.find(
                (opt) => opt.value === tempFilterTaskType[0],
            );
            return option?.label || "Alle types";
        }
        return `${tempFilterTaskType.length} types geselecteerd`;
    });

    const tempKomtVanLabel = $derived.by(() => {
        if (tempFilterKomtVan.length === 0) return "Alle afzenders";
        if (tempFilterKomtVan.length === 1) {
            if (tempFilterKomtVan[0] === "__null__") return "Onbekend";
            return tempFilterKomtVan[0];
        }
        return `${tempFilterKomtVan.length} afzenders geselecteerd`;
    });

    const tempDeadlineLabel = $derived.by(() => {
        if (!tempFilterDeadline) return "Alle deadlines";
        const option = deadlineOptions.find(
            (opt) => opt.value === tempFilterDeadline,
        );
        return option?.label || "Alle deadlines";
    });

    const tempProjectLabel = $derived.by(() => {
        if (!tempFilterProject) return "Alle projecten";
        const project = projects.find(
            (p: Project) => p.id === tempFilterProject,
        );
        return project?.name || "Alle projecten";
    });

    const tempCaseLabel = $derived.by(() => {
        if (!tempFilterCase) return "Alle cases";
        const caseItem = cases.find((c: Case) => c.id === tempFilterCase);
        return caseItem?.name || "Alle cases";
    });

    const tempTagsLabel = $derived.by(() => {
        if (tempFilterTags.length === 0) return "Alle tags";
        if (tempFilterTags.length === 1) return tempFilterTags[0];
        return `${tempFilterTags.length} tags geselecteerd`;
    });

    const tempPriorityLabel = $derived.by(() => {
        if (tempFilterPriority.length === 0) return "Alle prioriteiten";
        if (tempFilterPriority.length === 1) {
            const option = priorityOptions.find(
                (opt) => opt.value === tempFilterPriority[0],
            );
            return option?.label || "Alle prioriteiten";
        }
        return `${tempFilterPriority.length} prioriteiten geselecteerd`;
    });

    // Count active filters
    const activeFilterCount = $derived.by(() => {
        let count = 0;

        // Date range counts as 1 filter if either date is set
        if (filterDateFrom || filterDateTo) count++;

        // Search query
        if (searchQuery && searchQuery.trim()) count++;

        // Assignee filter
        if (filterAssignee.length > 0) count++;

        // Task type filter
        if (filterTaskType.length > 0) count++;

        // Komt van filter
        if (filterKomtVan.length > 0) count++;

        // Deadline filter
        if (filterDeadline) count++;

        // Project filter
        if (filterProject !== null) count++;

        // Case filter
        if (filterCase !== null) count++;

        // Tags filter
        if (filterTags.length > 0) count++;

        // Priority filter
        if (filterPriority.length > 0) count++;

        return count;
    });

    // Calculate total hours from filtered items
    const totalHours = $derived.by(() => {
        return filteredBacklogItems.reduce(
            (sum: number, item: any) => sum + (item.uren || 0),
            0,
        );
    });

    // Format date for display (DD-MM-YYYY)
    function formatDateForDisplay(dateString: string | null): string {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    // Format active filters as subtitle
    const activeFiltersSubtitle = $derived.by(() => {
        const filters: string[] = [];

        // Date range filter
        if (filterDateFrom || filterDateTo) {
            if (filterDateFrom && filterDateTo) {
                filters.push(
                    `${formatDateForDisplay(filterDateFrom)} - ${formatDateForDisplay(filterDateTo)}`,
                );
            } else if (filterDateFrom) {
                filters.push(`Vanaf ${formatDateForDisplay(filterDateFrom)}`);
            } else if (filterDateTo) {
                filters.push(`Tot ${formatDateForDisplay(filterDateTo)}`);
            }
        }

        // Search query
        if (searchQuery && searchQuery.trim()) {
            filters.push(`Zoek: "${searchQuery}"`);
        }

        // Assignee filter
        if (filterAssignee.length > 0) {
            const assigneeNames = filterAssignee
                .map((id) => {
                    if (id === "__unassigned__") return "Niet toegewezen";
                    const user = userMap.get(id);
                    return user ? formatUserName(user) : "Onbekend";
                })
                .join(", ");
            filters.push(`Gebruiker: ${assigneeNames}`);
        }

        // Task type filter
        if (filterTaskType.length > 0) {
            const typeLabels = filterTaskType.map((type) => {
                if (type === "help") return "Help";
                if (type === "process") return "Case";
                if (type === "manual") return "Normaal";
                return type;
            });
            filters.push(`Type: ${typeLabels.join(", ")}`);
        }

        // Komt van filter
        if (filterKomtVan.length > 0) {
            filters.push(`Komt van: ${filterKomtVan.join(", ")}`);
        }

        // Deadline filter
        if (filterDeadline) {
            const option = deadlineOptions.find(
                (opt) => opt.value === filterDeadline,
            );
            if (option) {
                filters.push(`Deadline: ${option.label}`);
            }
        }

        return filters.length > 0 ? filters.join(" • ") : "";
    });

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

    async function handleOpenChartDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("drawer", "hourschart");
        // Set default groupBy if not already set
        if (!urlParams.has("chartGroupBy")) {
            urlParams.set("chartGroupBy", "assignee");
        }
        await goto(`${$page.url.pathname}?${urlParams.toString()}`, {
            noScroll: true,
        });
    }

    async function handleCloseChartDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.delete("drawer");
        urlParams.delete("chartGroupBy");
        const queryString = urlParams.toString();
        const newUrl = queryString
            ? `${$page.url.pathname}?${queryString}`
            : $page.url.pathname;
        await goto(newUrl, { noScroll: true });
    }

    async function handleChartGroupByChange(
        groupBy: "assignee" | "project" | "source" | "week",
    ) {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("chartGroupBy", groupBy);
        // Ensure drawer is open when changing groupBy
        if (!urlParams.has("drawer")) {
            urlParams.set("drawer", "hourschart");
        }
        await goto(`${$page.url.pathname}?${urlParams.toString()}`, {
            noScroll: true,
            replaceState: true,
        });
    }

    // Track if this is the initial page load (before any filters applied)
    let hasInitialPageLoad = true;

    onMount((async () => {
        // Loading spinner is already started by $effect above
        // This ensures it shows immediately when component loads

        // Update URL with current user selected in assignee filter (only on very first page load)
        const urlParams = new URLSearchParams($page.url.searchParams);
        const hasAnyFilterParams =
            urlParams.has("assignee") ||
            urlParams.has("search") ||
            urlParams.has("taskType") ||
            urlParams.has("komtVan") ||
            urlParams.has("deadline") ||
            urlParams.has("dateFrom") ||
            urlParams.has("dateTo") ||
            urlParams.has("project") ||
            urlParams.has("case") ||
            urlParams.has("tags") ||
            urlParams.has("priority");

        // On initial page load with no filters, auto-select current user
        if (hasInitialPageLoad && !hasAnyFilterParams) {
            if (currentUserId) urlParams.set("assignee", currentUserId);
            const queryString = urlParams.toString();
            const newUrl = `?${queryString}`;
            goto(newUrl, { replaceState: true, noScroll: true });
        }

        hasInitialPageLoad = false;

        // Use SSR data if available (it's now always unfiltered from server)
        // All data (backlogItems, users, projects, processes, cases, processTasks)
        // arrives together via Promise.all in +page.server.ts
        // This avoids unnecessary API calls and provides instant render
        if (data.backlogItems.length > 0) {
            // Log SSR data arrival
            const ssrTimestamp = new Date().toISOString();
            console.log(`[Backlog UI] SSR data arrived at ${ssrTimestamp}:`, {
                timestamp: ssrTimestamp,
                source: "SSR",
                recordCount: data.backlogItems.length,
                records: data.backlogItems.map((item: any) => ({
                    id: item.id,
                    type: item.type,
                    subject: item.subject,
                    status: item.status,
                })),
            });

            // Prevent $effect from reacting during initialization
            // isInitializing starts as true, so $effect is already blocked

            // Set local state first (this is what user sees immediately)
            // This ensures all data appears together without waiting for store updates
            backlogItems = data.backlogItems;
            // Set timestamp to ensure store updates are detected
            // Use current time to prevent immediate overwrites from background sync
            lastStoreUpdate = Date.now();
            hasInitializedFromSSR = true;

            // Initialize store with SSR data (always unfiltered) - but don't let $effect react
            // We do this after setting local state so the store is in sync, but $effect won't overwrite
            // The store update happens, but $effect is blocked from reacting (isInitializing = true)
            initialize([], data.backlogItems);

            // Re-enable $effect after initialization is complete
            // Use requestAnimationFrame to ensure this happens after render cycle completes
            // This prevents $effect from running during the initial render
            requestAnimationFrame(() => {
                // Double-check that we still have the same data to prevent race conditions
                if (
                    hasInitializedFromSSR &&
                    backlogItems.length === data.backlogItems.length
                ) {
                    // Now allow $effect to run (for background sync updates only)
                    isInitializing = false;
                }
            });

            // Stop loading immediately - data is ready from SSR
            // Cards are already visible (no AOS on initial render)
            await new Promise((resolve) => requestAnimationFrame(resolve));
            stopPageLoading();

            // Mark initial render as complete after a brief moment
            // This allows cards to appear immediately, then enable AOS for future updates
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isInitialRender = false;
                    // Now refresh AOS for future updates (but cards are already visible)
                    if (browser) {
                        refreshAOS();
                    }
                });
            });

            // Don't sync immediately - SSR data is fresh and all data arrives together
            // Polling will handle background updates after 30 seconds
            // Start polling with current filter (if any)
            const assigneeFilter =
                filterAssignee.length === 1 ? filterAssignee[0] : null;
            startPolling(30000, assigneeFilter || undefined);
        } else {
            // SSR data is empty - fetch client-side
            // This ensures we show loading state instead of "no data" immediately
            const fetchStartTime = new Date().toISOString();
            console.log(
                `[Backlog UI] Starting client-side fetch at ${fetchStartTime} (SSR data was empty)`,
            );

            await getBacklogItems(undefined, true);

            // Log client-side fetch completion
            const fetchEndTime = new Date().toISOString();
            if (taskState.backlogItems.length > 0) {
                console.log(
                    `[Backlog UI] Client-side fetch completed at ${fetchEndTime}:`,
                    {
                        timestamp: fetchEndTime,
                        source: "client-fetch",
                        recordCount: taskState.backlogItems.length,
                        records: taskState.backlogItems.map((item) => ({
                            id: item.id,
                            type: item.type,
                            subject: item.subject,
                            status: item.status,
                        })),
                    },
                );
            } else {
                console.log(
                    `[Backlog UI] Client-side fetch completed at ${fetchEndTime}: No records found`,
                );
            }

            // Initialize store with fetched data
            if (taskState.backlogItems.length > 0) {
                initialize([], taskState.backlogItems);
                backlogItems = taskState.backlogItems;
            }

            lastStoreUpdate = taskState.lastFetch || Date.now();
            hasInitializedFromSSR = true;
            // Stop loading immediately - data is ready
            // Cards are already visible (no AOS on initial render)
            await new Promise((resolve) => requestAnimationFrame(resolve));
            stopPageLoading();

            // Mark initial render as complete after a brief moment
            // This allows cards to appear immediately, then enable AOS for future updates
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isInitialRender = false;
                    // Now refresh AOS for future updates (but cards are already visible)
                    if (browser) {
                        refreshAOS();
                    }
                });
            });
        }

        // Process tasks are already loaded from SSR data (no separate call needed)

        // Polling is started above if we have SSR data, or here if we don't
        if (data.backlogItems.length === 0) {
            const assigneeFilter =
                filterAssignee.length === 1 ? filterAssignee[0] : null;
            startPolling(30000, assigneeFilter || undefined);
        }

        // Handle visibility changes
        if (typeof document !== "undefined") {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    stopPolling();
                } else {
                    const filter =
                        filterAssignee.length === 1 ? filterAssignee[0] : null;
                    startPolling(30000, filter || undefined);
                    // Refresh data when tab becomes visible (silent mode - no loading indicator)
                    getBacklogItems(filter || undefined, false);
                }
            };
            document.addEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );

            // AOS is refreshed immediately after stopPageLoading above
            // No need for additional delay

            return () => {
                document.removeEventListener(
                    "visibilitychange",
                    handleVisibilityChange,
                );
            };
        }
    }) as any);

    onDestroy(() => {
        // Stop polling when component is destroyed
        stopPolling();
    });

    async function loadUsers() {
        const result = await pocketbaseService.getAllUsers();
        if (result.success) {
            users = result.value;
        }
    }

    // No longer needed - server already filters projects via getProjectsForUser
    // Projects array only contains projects the user has access to

    async function loadCases() {
        const result = await caseService.getAllCases();
        if (result.success) {
            cases = result.value;
        }
    }

    async function loadProcesses() {
        const result = await processService.getAllProcesses();
        if (result.success) {
            processes = result.value;
        }
    }

    // Process tasks are now loaded server-side via Promise.all in +page.server.ts
    // No separate client-side loading needed - all data arrives together

    // Reload when filters change (but skip on initial mount if we have SSR data)
    let isInitialMount = $state(true);
    let previousUrlString = $state("");
    let lastFetchUrl = $state("");
    let isFetching = $state(false);
    let isUrlChangeEffectRunning = $state(false);

    $effect(() => {
        // Get current URL string and assignee filter from derived state
        const currentUrlString = $page.url.search;
        const assigneeFilter =
            filterAssignee.length === 1 ? filterAssignee[0] : null;

        // On initial mount with SSR data, don't fetch - just update polling
        // The filtering happens client-side from SSR data via filteredBacklogItems
        if (
            isInitialMount &&
            hasInitializedFromSSR &&
            data.backlogItems.length > 0
        ) {
            // Skip fetch on initial mount - use SSR data
            stopPolling();
            startPolling(30000, assigneeFilter || undefined);
            // Mark as complete but DON'T update tracking state within this effect
            // This prevents effect from re-triggering
            requestAnimationFrame(() => {
                isInitialMount = false;
                previousUrlString = currentUrlString;
                // IMPORTANT: Initialize lastFetchUrl to prevent unnecessary fetches on navigation
                lastFetchUrl = currentUrlString;
            });
            return;
        }

        // Skip if URL hasn't actually changed
        if (previousUrlString === currentUrlString) {
            return;
        }

        // Skip if effect is already running (prevents duplicate rapid calls)
        if (isUrlChangeEffectRunning) {
            return;
        }

        // Mark effect as running
        isUrlChangeEffectRunning = true;

        // After initial mount, fetch when URL filters change
        const filterChangeTime = new Date().toISOString();
        console.log(
            `[Backlog UI] URL filters changed, fetching at ${filterChangeTime}:`,
            {
                timestamp: filterChangeTime,
                source: "url-change",
                url: currentUrlString,
                assigneeFilter: assigneeFilter || "all",
            },
        );

        // Mark transition in progress - prevents showing mismatched data
        // Client-side filtering is instant via $derived, so no server fetch needed
        // Skip transition state during reset
        if (!isResetting) {
            isFilterTransition = true;
        }

        isFetching = true;

        // Update polling with new filter (no fetch - we already have all data locally)
        // Client-side filtering happens instantly via filteredBacklogItems $derived
        stopPolling();
        startPolling(30000, assigneeFilter || undefined);
        // Update tracking state (but skip during reset to avoid triggering effect again)
        if (!isResetting) {
            previousUrlString = currentUrlString;
        }

        // Clear running flag at the end
        requestAnimationFrame(() => {
            isUrlChangeEffectRunning = false;
        });
    });

    // Clear fetching and transition flags when loading completes or URL stabilizes
    $effect(() => {
        // Clear flags when fetch completes
        if (!isLoading && isFetching && !isResetting) {
            isFetching = false;
        }

        // Clear flags when URL is stable after reset
        // Combined logic prevents multiple triggers and flicker
        const currentUrlString = $page.url.search;
        if (previousUrlString === currentUrlString) {
            if (isResetting) {
                // Reset operation completed - clear reset flag and update tracking
                isResetting = false;
                previousUrlString = currentUrlString;
            } else if (isFilterTransition) {
                // Normal filter change completed - clear transition flag
                isFilterTransition = false;
            }
        }
    });

    async function handleWorkItemSaved() {
        // Refresh backlog items from store (show loading)
        const refreshTime = new Date().toISOString();
        console.log(
            `[Backlog UI] Refreshing after work item saved at ${refreshTime}`,
        );
        const assigneeFilter =
            filterAssignee.length === 1 ? filterAssignee[0] : null;
        await getBacklogItems(assigneeFilter || undefined, true);
        const refreshCompleteTime = new Date().toISOString();
        console.log(
            `[Backlog UI] Refresh completed at ${refreshCompleteTime}:`,
            {
                timestamp: refreshCompleteTime,
                source: "work-item-saved",
                recordCount: taskState.backlogItems.length,
            },
        );
    }

    async function handleTaskSaved() {
        // Refresh backlog items from store (show loading)
        const refreshTime = new Date().toISOString();
        console.log(
            `[Backlog UI] Refreshing after task saved at ${refreshTime}`,
        );
        const assigneeFilter =
            filterAssignee.length === 1 ? filterAssignee[0] : null;
        await getBacklogItems(assigneeFilter || undefined, true);
        const refreshCompleteTime = new Date().toISOString();
        console.log(
            `[Backlog UI] Refresh completed at ${refreshCompleteTime}:`,
            {
                timestamp: refreshCompleteTime,
                source: "task-saved",
                recordCount: taskState.backlogItems.length,
            },
        );
    }

    async function loadBacklog() {
        // Refresh backlog items from store (show loading)
        const refreshTime = new Date().toISOString();
        console.log(`[Backlog UI] Manual refresh triggered at ${refreshTime}`);
        const assigneeFilter =
            filterAssignee.length === 1 ? filterAssignee[0] : null;
        await getBacklogItems(assigneeFilter || undefined, true);
        const refreshCompleteTime = new Date().toISOString();
        console.log(
            `[Backlog UI] Manual refresh completed at ${refreshCompleteTime}:`,
            {
                timestamp: refreshCompleteTime,
                source: "manual-refresh",
                recordCount: taskState.backlogItems.length,
            },
        );
    }

    async function moveToPlanning(
        item: UnifiedBacklogItem,
        status: "gepland" | "ad-hoc",
    ) {
        const itemKey = `${item.type}-${item.id}`;

        // Mark item as being moved (prevents it from reappearing)
        itemsBeingMoved.add(itemKey);

        // Optimistically remove the item from the backlog immediately (it will move to planning)
        // This prevents flashing in the UI
        backlogItems = backlogItems.filter(
            (i: any) => !(i.id === item.id && i.type === item.type),
        );

        // Show toast immediately for better UX
        const toastMessage =
            item.type === "work_item"
                ? "Item verplaatst naar planning"
                : "Taak verplaatst naar planning";
        toastStore.add(toastMessage, "success");

        // Delay the movement to kanban by 500ms for smoother UX transition
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update the store optimistically (moves item to planning/kanban)
        await updateWorkItem(item.id, {
            status,
            kanban_status: "gepland",
            assignee_id: [],
        });

        try {
            const assigneeFilter =
                filterAssignee.length === 1 ? filterAssignee[0] : null;

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
                    // Remove from being moved set so it can reappear
                    itemsBeingMoved.delete(itemKey);
                    // Revert optimistic update on error - refresh from server
                    await getBacklogItems(assigneeFilter || undefined, false);
                } else {
                    if (import.meta.env.DEV) {
                        console.log(
                            "Successfully moved work item to planning:",
                            item.id,
                            "status:",
                            status,
                            "result:",
                            result.value,
                        );
                    }
                    // Only refresh planning items - backlog already updated optimistically
                    await getPlanningItems(assigneeFilter || undefined, false);
                    // Keep item in itemsBeingMoved for a bit longer to prevent reappearance during polling
                    // Remove after a delay to ensure server has fully processed the move
                    setTimeout(() => {
                        itemsBeingMoved.delete(itemKey);
                    }, 2000);
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
                    // Remove from being moved set so it can reappear
                    itemsBeingMoved.delete(itemKey);
                    // Revert optimistic update on error - refresh from server
                    await getBacklogItems(assigneeFilter || undefined, false);
                } else {
                    if (import.meta.env.DEV) {
                        console.log(
                            "Successfully moved case task to planning:",
                            item.id,
                            "status:",
                            status,
                            "result:",
                            result.value,
                        );
                    }
                    // Only refresh planning items - backlog already updated optimistically
                    await getPlanningItems(assigneeFilter || undefined, false);
                    // Keep item in itemsBeingMoved for a bit longer to prevent reappearance during polling
                    // Remove after a delay to ensure server has fully processed the move
                    setTimeout(() => {
                        itemsBeingMoved.delete(itemKey);
                    }, 2000);
                }
            }
        } catch (error) {
            // Handle unexpected errors
            console.error("Unexpected error moving item to planning:", error);
            toastStore.clear();
            toastStore.add("Er is een onverwachte fout opgetreden", "error");
            // Remove from being moved set so it can reappear
            itemsBeingMoved.delete(itemKey);
            // Revert optimistic update on error - refresh from server
            const assigneeFilter =
                filterAssignee.length === 1 ? filterAssignee[0] : null;
            await getBacklogItems(assigneeFilter || undefined, false);
        }
    }

    async function openEditDrawer(item: UnifiedBacklogItem) {
        // Check if user can access this item's project
        if (item.project_id && !canAccessProject(item.project_id)) {
            toastStore.add("You do not have access to this project", "error");
            return;
        }

        // Navigate to dedicated detail page for both work items and case tasks
        // Both use the unified task ID from _bpm_tasks
        await goto(`/work/${item.id}`);
    }

    // Convert UnifiedBacklogItem to UnifiedPlanningItem format for WorkItemCard
    function convertToPlanningItem(
        item: UnifiedBacklogItem,
        hasAccess: boolean = true,
    ): UnifiedPlanningItem {
        // For case tasks, we need to fetch description and criteria from the process task
        // But for now, we'll use the basic structure - these can be enriched later if needed
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
            description: null, // Can be enriched from process task if needed
            criteria: null, // Can be enriched from process task if needed
            order_index: null,
            project_id: item.project_id || null,
            canInteract: hasAccess,
        } as UnifiedPlanningItem;
    }

    async function handleItemSaved(item: any) {
        // When creating from homepage, redirect to work item detail page
        if ($page.url.pathname === "/") {
            await goto(`/work/${item.id}`);
        } else {
            const assigneeFilter =
                filterAssignee.length === 1 ? filterAssignee[0] : null;
            getBacklogItems(assigneeFilter || undefined, false);
        }
    }

    async function openCreateDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("drawer", "workitem");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    // Helper function to calculate deadline date based on filter
    function getDeadlineDate(deadlineFilter: string): Date {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (deadlineFilter) {
            case "today":
                return today;
            case "tomorrow":
                return new Date(today.getTime() + 24 * 60 * 60 * 1000);
            case "7days":
                return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            case "14days":
                return new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
            case "30days":
                return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            case "60days":
                return new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
            case "90days":
                return new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
            case "1year":
                return new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
            default:
                return today;
        }
    }

    // Filter backlog items based on search query and filters
    const filteredBacklogItems = $derived.by(() => {
        let items = backlogItems;

        // Filter out items that are currently being moved to planning
        items = items.filter((item: any) => {
            const itemKey = `${item.type}-${item.id}`;
            return !itemsBeingMoved.has(itemKey);
        });

        // IMPORTANT: Date range filter is applied FIRST to reduce the dataset
        // This ensures other filters only show values available within the date range
        if (filterDateFrom || filterDateTo) {
            items = items.filter((item: any) => {
                const deadline = item.deadline || item.due_date;
                if (!deadline) return false;

                const itemDate = new Date(deadline);
                itemDate.setHours(0, 0, 0, 0);
                const fromDate = filterDateFrom
                    ? new Date(filterDateFrom)
                    : null;
                const toDate = filterDateTo ? new Date(filterDateTo) : null;

                if (fromDate) {
                    fromDate.setHours(0, 0, 0, 0);
                    if (itemDate < fromDate) return false;
                }
                if (toDate) {
                    toDate.setHours(23, 59, 59, 999);
                    if (itemDate > toDate) return false;
                }

                return true;
            });
        }

        // Filter by task_type (help, manual, process) - support multiple
        if (filterTaskType.length > 0) {
            items = items.filter((item: any) => {
                return filterTaskType.includes(item.task_type);
            });
        }

        // Filter by assignee - support multiple
        if (filterAssignee.length > 0) {
            items = items.filter((item: any) => {
                // Get assignee IDs as array (handle both array and single value for backward compatibility)
                const itemAssigneeIds = Array.isArray(item.assignee_id)
                    ? item.assignee_id
                    : item.assignee_id
                      ? [item.assignee_id]
                      : [];
                const itemOwnerId = item.owner_id ? [item.owner_id] : [];
                const allItemAssigneeIds = [...itemAssigneeIds, ...itemOwnerId];

                return filterAssignee.some((assigneeId) => {
                    if (assigneeId === "__unassigned__") {
                        return allItemAssigneeIds.length === 0;
                    }
                    return allItemAssigneeIds.includes(assigneeId);
                });
            });
        }

        // Filter by komt_van - support multiple
        if (filterKomtVan.length > 0) {
            items = items.filter((item: any) => {
                return filterKomtVan.some((komtVan) => {
                    if (komtVan === "__null__") {
                        return !item.komt_van;
                    } else {
                        return item.komt_van === komtVan;
                    }
                });
            });
        }

        // Filter by deadline
        if (filterDeadline) {
            if (filterDeadline === "overdue") {
                // Filter for overdue items: deadline < now AND status !== 'completed'
                const now = new Date();
                items = items.filter((item: any) => {
                    const itemDeadline = item.deadline || item.due_date;
                    if (!itemDeadline || item.status === "completed")
                        return false;
                    return new Date(itemDeadline) < now;
                });
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endDate = getDeadlineDate(filterDeadline);
                endDate.setHours(23, 59, 59, 999); // End of day

                items = items.filter((item: any) => {
                    // Use deadline for case tasks, due_date for work items
                    const itemDeadline = item.deadline || item.due_date;
                    if (!itemDeadline) return false;

                    const deadlineDate = new Date(itemDeadline);
                    deadlineDate.setHours(0, 0, 0, 0);

                    // Check if deadline is between today and the target date (inclusive)
                    return deadlineDate >= today && deadlineDate <= endDate;
                });
            }
        }

        // Filter by project
        if (filterProject !== null) {
            items = items.filter((item: any) => {
                return item.project_id === filterProject;
            });
        }

        // Filter by case
        if (filterCase !== null) {
            items = items.filter((item: any) => {
                return item.case_id === filterCase;
            });
        }

        // Filter by tags
        if (filterTags && filterTags.length > 0) {
            items = items.filter((item: any) => {
                if (!item.tags || !Array.isArray(item.tags)) return false;
                return filterTags.some((tag) => item.tags?.includes(tag));
            });
        }

        // Filter by priority
        if (filterPriority && filterPriority.length > 0) {
            items = items.filter((item: any) => {
                const itemPriority = (item as any).priority || "normaal";
                return filterPriority.includes(itemPriority);
            });
        }

        // Filter by search query with scope
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            items = items.filter((item: any) => {
                // Define search scope matching function
                const matchesInScope = (scope: string): boolean => {
                    switch (scope) {
                        case "alle":
                            // Search in all text fields
                            const allFields = [
                                item.subject,
                                item.case_name,
                                item.task_name,
                                item.wat_ga_je_doen,
                                item.waarom_doe_je_het,
                                item.voor_wie_is_het,
                                item.komt_van,
                                ...((item.tags || []) as string[]),
                            ];

                            // Add project name/description if work item has project_id
                            if (item.type === "work_item" && item.project_id) {
                                const project = projectMap.get(item.project_id);
                                if (project) {
                                    allFields.push(
                                        project.name,
                                        project.description || "",
                                    );
                                }
                            }

                            // Add case name/description if item has case_id
                            if (item.case_id) {
                                const caseItem = caseMap.get(item.case_id);
                                if (caseItem) {
                                    allFields.push(caseItem.name);
                                }
                            }

                            // Add process name/description if case task has process_id
                            if (item.type === "case_task" && item.case_id) {
                                const caseItem = caseMap.get(item.case_id);
                                if (caseItem?.process_id) {
                                    const process = processMap.get(
                                        caseItem.process_id,
                                    );
                                    if (process) {
                                        allFields.push(
                                            process.name,
                                            process.description || "",
                                        );
                                    }
                                }
                            }

                            // Add task name/description if item has task_id
                            if (item.task_id) {
                                const task = processTasks.get(item.task_id);
                                if (task) {
                                    allFields.push(
                                        task.name,
                                        task.description || "",
                                    );
                                }
                            }

                            // Add assignee/owner names
                            const assignee = item.assignee_id
                                ? users.find(
                                      (u: PocketBaseUser) =>
                                          u.id === item.assignee_id,
                                  )
                                : null;
                            const owner = item.owner_id
                                ? users.find(
                                      (u: PocketBaseUser) =>
                                          u.id === item.owner_id,
                                  )
                                : null;
                            if (assignee)
                                allFields.push(formatUserName(assignee));
                            if (owner) allFields.push(formatUserName(owner));

                            return allFields.some((field) =>
                                field?.toLowerCase().includes(query),
                            );

                        case "cases":
                            // Search case names for those cases (cases don't have descriptions in schema)
                            if (item.type !== "case_task" || !item.case_id)
                                return false;

                            const caseItem = caseMap.get(item.case_id);
                            if (!caseItem) return false;

                            // Search in case name (from map) and case_name field (already in UnifiedBacklogItem)
                            return (
                                caseItem.name.toLowerCase().includes(query) ||
                                item.case_name?.toLowerCase().includes(query) ||
                                false
                            );

                        case "taken":
                            // Search task names and descriptions/text fields for those tasks
                            const taskFields = [
                                item.subject,
                                item.task_name,
                                item.wat_ga_je_doen,
                                item.waarom_doe_je_het,
                            ];

                            // Add process task description if available
                            if (item.task_id) {
                                const task = processTasks.get(item.task_id);
                                if (task) {
                                    taskFields.push(
                                        task.name,
                                        task.description || "",
                                    );
                                }
                            }

                            return taskFields.some((field) =>
                                field?.toLowerCase().includes(query),
                            );

                        case "personen":
                            // Search people/assignee names related to those tasks
                            const personFields: string[] = [];

                            // Add assignee name
                            if (item.assignee_id) {
                                const assignee = users.find(
                                    (u: PocketBaseUser) =>
                                        u.id === item.assignee_id,
                                );
                                if (assignee) {
                                    personFields.push(formatUserName(assignee));
                                }
                            }

                            // Add owner name
                            if (item.owner_id) {
                                const owner = users.find(
                                    (u: PocketBaseUser) =>
                                        u.id === item.owner_id,
                                );
                                if (owner) {
                                    personFields.push(formatUserName(owner));
                                }
                            }

                            // Add voor_wie_is_het and komt_van
                            if (item.voor_wie_is_het)
                                personFields.push(item.voor_wie_is_het);
                            if (item.komt_van) personFields.push(item.komt_van);

                            return personFields.some((field) =>
                                field?.toLowerCase().includes(query),
                            );

                        case "projecten":
                            // Search project names and descriptions for those projects
                            if (item.type !== "work_item" || !item.project_id)
                                return false;

                            const project = projectMap.get(item.project_id);
                            if (!project) return false;

                            return (
                                project.name.toLowerCase().includes(query) ||
                                project.description
                                    ?.toLowerCase()
                                    .includes(query) ||
                                false
                            );

                        case "processen":
                            // Search process names and descriptions for those processes
                            if (item.type !== "case_task" || !item.case_id)
                                return false;

                            const caseForProcess = caseMap.get(item.case_id);
                            if (!caseForProcess?.process_id) return false;

                            const process = processMap.get(
                                caseForProcess.process_id,
                            );
                            if (!process) return false;

                            return (
                                process.name.toLowerCase().includes(query) ||
                                process.description
                                    ?.toLowerCase()
                                    .includes(query) ||
                                false
                            );

                        default:
                            return false;
                    }
                };

                return matchesInScope(searchScope);
            });
        }

        return items;
    });

    // Sync temporary filters with applied filters when drawer opens
    $effect(() => {
        if (searchDrawerOpen) {
            tempSearchQuery = searchQuery;
            tempSearchScope = searchScope;
            tempFilterAssignee =
                filterAssignee.length > 0 ? [...filterAssignee] : [];
            tempFilterTaskType = [...filterTaskType];
            tempFilterKomtVan = [...filterKomtVan];
            tempFilterDeadline = filterDeadline;
            tempFilterDateFrom = filterDateFrom;
            tempFilterDateTo = filterDateTo;
            tempFilterProject = filterProject;
            tempFilterCase = filterCase;
            tempFilterTags = [...filterTags];
            tempFilterPriority = [...filterPriority];
        }
    });

    // Apply filters function - called when "Tonen" button is clicked
    // Filters are derived from URL params, so we just need to update the URL
    async function applyFilters() {
        // Reset to first page
        currentPage = 1;

        // Build URL with all filter params from temporary filter state
        const urlParams = new URLSearchParams();

        // Search query
        if (tempSearchQuery) {
            urlParams.set("search", tempSearchQuery);
        }

        // Search scope
        if (tempSearchScope !== "alle") {
            urlParams.set("scope", tempSearchScope);
        }

        // Assignee filter
        if (tempFilterAssignee.length > 0) {
            urlParams.set("assignee", tempFilterAssignee.join(","));
        }

        // Task type filter
        if (tempFilterTaskType.length > 0) {
            urlParams.set("taskType", tempFilterTaskType.join(","));
        }

        // Komt van filter
        if (tempFilterKomtVan.length > 0) {
            urlParams.set(
                "komtVan",
                tempFilterKomtVan.map((v) => encodeURIComponent(v)).join(","),
            );
        }

        // Deadline filter
        if (tempFilterDeadline) {
            urlParams.set("deadline", tempFilterDeadline);
        }

        // Date range filter
        if (tempFilterDateFrom) {
            urlParams.set("dateFrom", tempFilterDateFrom);
        }
        if (tempFilterDateTo) {
            urlParams.set("dateTo", tempFilterDateTo);
        }

        // Project filter
        if (tempFilterProject !== null) {
            urlParams.set("project", String(tempFilterProject));
        }

        // Case filter
        if (tempFilterCase !== null) {
            urlParams.set("case", String(tempFilterCase));
        }

        // Tags filter
        if (tempFilterTags.length > 0) {
            urlParams.set(
                "tags",
                tempFilterTags.map((t) => encodeURIComponent(t)).join(","),
            );
        }

        // Priority filter
        if (tempFilterPriority.length > 0) {
            urlParams.set("priority", tempFilterPriority.join(","));
        }

        // Build URL and navigate
        const queryString = urlParams.toString();
        const newUrl = queryString
            ? `${$page.url.pathname}?${queryString}`
            : $page.url.pathname;

        await goto(newUrl, { replaceState: true, noScroll: true });
    }

    function handleAssigneeChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterAssignee = value;
        } else if (value === null) {
            tempFilterAssignee = [];
        } else {
            // Toggle assignee: if already selected, remove it; otherwise add it
            if (tempFilterAssignee.includes(value)) {
                tempFilterAssignee = tempFilterAssignee.filter(
                    (id) => id !== value,
                );
            } else {
                tempFilterAssignee = [...tempFilterAssignee, value];
            }
        }
    }

    function handleTaskTypeChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterTaskType = value;
        } else if (value === null) {
            tempFilterTaskType = [];
        } else {
            // Toggle task type: if already selected, remove it; otherwise add it
            if (tempFilterTaskType.includes(value)) {
                tempFilterTaskType = tempFilterTaskType.filter(
                    (t) => t !== value,
                );
            } else {
                tempFilterTaskType = [...tempFilterTaskType, value];
            }
        }
    }

    function handleKomtVanChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterKomtVan = value;
        } else if (value === null) {
            tempFilterKomtVan = [];
        } else {
            // Toggle komt van: if already selected, remove it; otherwise add it
            if (tempFilterKomtVan.includes(value)) {
                tempFilterKomtVan = tempFilterKomtVan.filter(
                    (k) => k !== value,
                );
            } else {
                tempFilterKomtVan = [...tempFilterKomtVan, value];
            }
        }
    }

    function handleDeadlineChange(value: string | null | string[]) {
        // Deadline is single value only, so take first if array
        if (Array.isArray(value)) {
            tempFilterDeadline = value.length > 0 ? value[0] : null;
        } else {
            tempFilterDeadline = value;
        }
    }

    function handleDateRangeChange(from: string | null, to: string | null) {
        tempFilterDateFrom = from;
        tempFilterDateTo = to;
    }

    function handleProjectChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            const numValue = value.length > 0 ? parseInt(value[0], 10) : null;
            tempFilterProject = numValue;
        } else if (value === null) {
            tempFilterProject = null;
        } else {
            tempFilterProject = parseInt(value, 10);
        }
    }

    function handleCaseChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            const numValue = value.length > 0 ? parseInt(value[0], 10) : null;
            tempFilterCase = numValue;
        } else if (value === null) {
            tempFilterCase = null;
        } else {
            tempFilterCase = parseInt(value, 10);
        }
    }

    function handleTagsChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterTags = value;
        } else if (value === null) {
            tempFilterTags = [];
        } else {
            // Toggle tag: if already selected, remove it; otherwise add it
            if (tempFilterTags.includes(value)) {
                tempFilterTags = tempFilterTags.filter((t) => t !== value);
            } else {
                tempFilterTags = [...tempFilterTags, value];
            }
        }
    }

    function handlePriorityChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterPriority = value;
        } else if (value === null) {
            tempFilterPriority = [];
        } else {
            // Toggle priority: if already selected, remove it; otherwise add it
            if (tempFilterPriority.includes(value)) {
                tempFilterPriority = tempFilterPriority.filter(
                    (p) => p !== value,
                );
            } else {
                tempFilterPriority = [...tempFilterPriority, value];
            }
        }
    }

    function handleSearchChange(value: string) {
        tempSearchQuery = value;
    }

    function handleSearchScopeChange(value: string) {
        tempSearchScope = value;
    }

    async function handleResetFilters() {
        console.log("[Backlog UI] Starting filter reset");

        // Set loading flag BEFORE any state changes
        // This prevents mismatched data from showing during transition
        isResetting = true;
        isFilterTransition = true;

        // Reset temporary filters (clear all selections)
        tempSearchQuery = "";
        tempSearchScope = "alle";
        tempFilterAssignee = [];
        tempFilterTaskType = [];
        tempFilterKomtVan = [];
        tempFilterDeadline = null;
        tempFilterDateFrom = null;
        tempFilterDateTo = null;
        tempFilterProject = null;
        tempFilterCase = null;
        tempFilterTags = [];
        tempFilterPriority = [];

        // Reset current page
        currentPage = 1;

        // Reset all filters in URL - filters will automatically update via $derived
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.delete("search");
        urlParams.delete("scope");
        urlParams.delete("assignee");
        urlParams.delete("taskType");
        urlParams.delete("komtVan");
        urlParams.delete("deadline");
        urlParams.delete("dateFrom");
        urlParams.delete("dateTo");
        urlParams.delete("case");
        urlParams.delete("project");
        urlParams.delete("tags");
        urlParams.delete("priority");

        const queryString = urlParams.toString();
        const newUrl = queryString ? `?${queryString}` : $page.url.pathname;

        console.log("[Backlog UI] Reset URL to:", newUrl);
        await goto(newUrl, { replaceState: true, noScroll: true });

        // Let the effect handle flag clearing when URL stabilizes
        // The effect will detect previousUrlString === currentUrl and clear isResetting
    }

    // Pagination state
    const itemsPerPage = 100;
    let currentPage = $state(1);

    // Calculate total pages
    const totalPages = $derived(
        Math.ceil(filteredBacklogItems.length / itemsPerPage),
    );

    // Get paginated items for current page
    const paginatedItems = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBacklogItems.slice(startIndex, endIndex);
    });

    // Track previous page to log only on page changes
    let previousPage = $state(1);
    let previousFilteredCount = $state(0);

    // Log when displayed items change (page change or filter change)
    $effect(() => {
        const currentPageNum = currentPage;
        const currentFilteredCount = filteredBacklogItems.length;
        const currentPaginatedCount = paginatedItems.length;

        // Only log if page changed or filtered count changed
        if (
            currentPageNum !== previousPage ||
            currentFilteredCount !== previousFilteredCount
        ) {
            if (currentPaginatedCount > 0) {
                const displayTime = new Date().toISOString();
                console.log(
                    `[Backlog UI] Displaying items at ${displayTime}:`,
                    {
                        timestamp: displayTime,
                        source: "display",
                        page: currentPageNum,
                        totalPages: totalPages,
                        itemsOnPage: currentPaginatedCount,
                        totalFiltered: currentFilteredCount,
                        totalUnfiltered: backlogItems.length,
                    },
                );
            }
            previousPage = currentPageNum;
            previousFilteredCount = currentFilteredCount;
        }
    });

    // Reset to page 1 when filters change
    $effect(() => {
        // Watch filteredBacklogItems length changes
        void filteredBacklogItems.length;
        // Don't reset page if it's just initial load
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = 1;
        }
    });

    function handlePageChange(page: number) {
        currentPage = page;
        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<svelte:head>
    <title>Backlog - Ons Werk</title>
    <style>
        /* Custom fade-up animation with shorter slide distance (20px) */
        @keyframes fade-up-short {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Override AOS fade-up for backlog cards with shorter slide */
        [data-aos-id-backlog-cards] [data-aos="fade-up"] {
            animation-name: fade-up-short !important;
        }

        /* Initial state for AOS animations */
        [data-aos-id-backlog-cards] [data-aos="fade-up"]:not(.aos-animate) {
            opacity: 0;
            transform: translateY(20px);
        }

        /* Cards without AOS (initial render) are visible immediately */
        [data-aos-id-backlog-cards] .aos-immediate {
            opacity: 1 !important;
            transform: none !important;
        }
    </style>
</svelte:head>

<div class="h-full overflow-y-auto">
    <div class="container mx-auto px-4 py-8 max-w-[90vw]">
        <div class="space-y-6">
            <!-- Navigation Card with Search -->
            <NavCard
                title="Backlog"
                subtitle={activeFiltersSubtitle}
                actions={[
                    {
                        icon: ChartBarDecreasing,
                        label: "Uren overzicht",
                        onclick: handleOpenChartDrawer,
                        variant: "ghost",
                    },
                    {
                        icon: Eraser,
                        label: "Filters wissen",
                        onclick: handleResetFilters,
                        variant: "ghost",
                    },
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
                    <IconButton
                        icon={Plus}
                        variant="default"
                        onclick={openCreateDrawer}
                        tooltip="Nieuw item toevoegen"
                    />
                {/snippet}
            </NavCard>

            {#if initialLoadComplete}
                {#if isLoading || isFilterTransition}
                    <div class="flex items-center justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                {:else if backlogItems.length === 0}
                    <div class="text-center py-12">
                        <p class="text-zinc-500">Geen backlog items gevonden</p>
                    </div>
                {:else if filteredBacklogItems.length === 0}
                    <div class="text-center py-12">
                        <p class="text-zinc-500">
                            Geen items gevonden met de huidige filters
                        </p>
                    </div>
                {:else}
                    <!-- Backlog Items - Work Items and Case Tasks as Cards -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch"
                        data-aos-id-backlog-cards
                    >
                        {#each paginatedItems as item, index (item.type + "-" + item.id)}
                            <!-- Use canInteract flag that's already set by getUnifiedBacklogItems service -->
                            <!-- This flag properly checks project membership for both manual and case tasks -->
                            {@const canInteract = item.canInteract !== false}
                            {@const planningItem = convertToPlanningItem(
                                item,
                                canInteract,
                            )}
                            <!-- Only use AOS animation after initial render - show cards immediately on first load -->
                            <div
                                class="h-full {isInitialRender
                                    ? ''
                                    : 'aos-immediate'}"
                                data-aos={isInitialRender
                                    ? undefined
                                    : "fade-up"}
                                data-aos-anchor={isInitialRender
                                    ? undefined
                                    : "[data-aos-id-backlog-cards]"}
                                data-aos-delay={isInitialRender
                                    ? undefined
                                    : index * 50}
                                data-aos-duration={isInitialRender
                                    ? undefined
                                    : "300"}
                                data-aos-offset={isInitialRender
                                    ? undefined
                                    : "40"}
                            >
                                <WorkItemCard
                                    workItem={planningItem}
                                    draggable={false}
                                    ondelete={loadBacklog}
                                    onclick={canInteract
                                        ? () => openEditDrawer(item)
                                        : undefined}
                                    showStatusButtons={canInteract}
                                    onstatuschange={canInteract
                                        ? (status) =>
                                              moveToPlanning(item, status)
                                        : undefined}
                                    disabled={!canInteract}
                                    {userMap}
                                />
                            </div>
                        {/each}
                    </div>

                    <!-- Pagination Component -->
                    {#if totalPages > 1}
                        <div class="mt-8">
                            <Pagination
                                {currentPage}
                                totalItems={filteredBacklogItems.length}
                                {itemsPerPage}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    {/if}
                {/if}
            {/if}
        </div>
    </div>
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
                        bind:searchScope={tempSearchScope}
                        placeholder="Zoek in onderwerp, tags, case naam, taak naam..."
                        showSuggestions={false}
                        showSearchScope={true}
                        searchScopeOptions={[
                            { value: "alle", label: "Alles" },
                            { value: "cases", label: "Cases" },
                            { value: "projecten", label: "Projecten" },
                            { value: "taken", label: "Taken" },
                            { value: "processen", label: "Processen" },
                            { value: "personen", label: "Personen" },
                        ]}
                        onchange={handleSearchChange}
                        onscopechange={handleSearchScopeChange}
                        isActive={tempSearchQuery.trim().length > 0}
                        class="w-full"
                    />
                </div>

                <!-- Date Range Filter -->
                <div
                    class="lg:col-span-2 relative {dateRangePickerOpen
                        ? 'z-[200]'
                        : 'z-[70]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Datum bereik
                    </div>
                    <DateRangePicker
                        bind:fromDate={tempFilterDateFrom}
                        bind:toDate={tempFilterDateTo}
                        fromPlaceholder="Van datum"
                        toPlaceholder="Tot datum"
                        onchange={handleDateRangeChange}
                        isActive={tempFilterDateFrom !== null ||
                            tempFilterDateTo !== null}
                        class="w-full"
                        bind:open={dateRangePickerOpen}
                    />
                </div>

                <!-- Assignee Filter -->
                <div
                    class="lg:col-span-1 relative {assigneeSelectOpen
                        ? 'z-[200]'
                        : 'z-[100]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Toegewezen aan
                        {#if tempFilterAssignee.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterAssignee.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterAssignee}
                        options={userOptions}
                        placeholder={tempAssigneeLabel}
                        onchange={handleAssigneeChange}
                        isActive={tempFilterAssignee.length > 0}
                        class="w-full"
                        searchable={true}
                        bind:open={assigneeSelectOpen}
                    />
                </div>

                <!-- Task Type Filter -->
                <div
                    class="lg:col-span-1 relative {taskTypeSelectOpen
                        ? 'z-[200]'
                        : 'z-[110]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Taak type
                        {#if tempFilterTaskType.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterTaskType.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterTaskType}
                        options={taskTypeOptions}
                        placeholder={tempTaskTypeLabel}
                        onchange={handleTaskTypeChange}
                        isActive={tempFilterTaskType.length > 0}
                        class="w-full"
                        searchable={true}
                        bind:open={taskTypeSelectOpen}
                    />
                </div>

                <!-- Komt Van Filter -->
                <div
                    class="lg:col-span-1 relative {komtVanSelectOpen
                        ? 'z-[200]'
                        : 'z-[120]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Komt van
                        {#if tempFilterKomtVan.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterKomtVan.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterKomtVan}
                        options={komtVanOptions}
                        placeholder={tempKomtVanLabel}
                        onchange={handleKomtVanChange}
                        isActive={tempFilterKomtVan.length > 0}
                        class="w-full"
                        searchable={true}
                        bind:open={komtVanSelectOpen}
                    />
                </div>

                <!-- Deadline Filter -->
                <div
                    class="lg:col-span-1 relative {deadlineSelectOpen
                        ? 'z-[200]'
                        : 'z-[130]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Deadline
                    </div>
                    <Select
                        value={tempFilterDeadline}
                        options={deadlineOptions}
                        placeholder={tempDeadlineLabel}
                        onchange={handleDeadlineChange}
                        isActive={tempFilterDeadline !== null}
                        class="w-full"
                        searchable={true}
                        bind:open={deadlineSelectOpen}
                    />
                </div>

                <!-- Project Filter -->
                <div
                    class="lg:col-span-1 relative {projectSelectOpen
                        ? 'z-[200]'
                        : 'z-[140]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Project
                    </div>
                    <Select
                        value={tempFilterProject !== null
                            ? String(tempFilterProject)
                            : null}
                        options={projectOptions}
                        placeholder={tempProjectLabel}
                        onchange={handleProjectChange}
                        isActive={tempFilterProject !== null}
                        class="w-full"
                        searchable={true}
                        bind:open={projectSelectOpen}
                    />
                </div>

                <!-- Case Filter -->
                <div
                    class="lg:col-span-1 relative {caseSelectOpen
                        ? 'z-[200]'
                        : 'z-[141]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Case
                    </div>
                    <Select
                        value={tempFilterCase !== null
                            ? String(tempFilterCase)
                            : null}
                        options={caseOptions}
                        placeholder={tempCaseLabel}
                        onchange={handleCaseChange}
                        isActive={tempFilterCase !== null}
                        class="w-full"
                        searchable={true}
                        bind:open={caseSelectOpen}
                    />
                </div>

                <!-- Tags Filter -->
                <div
                    class="lg:col-span-1 relative {tagsSelectOpen
                        ? 'z-[200]'
                        : 'z-[150]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Tags
                        {#if tempFilterTags.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterTags.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterTags}
                        options={tagOptions}
                        placeholder={tempTagsLabel}
                        onchange={handleTagsChange}
                        isActive={tempFilterTags.length > 0}
                        class="w-full"
                        searchable={true}
                        bind:open={tagsSelectOpen}
                    />
                </div>

                <!-- Priority Filter -->
                <div
                    class="lg:col-span-1 relative {prioritySelectOpen
                        ? 'z-[200]'
                        : 'z-[160]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Prioriteit
                        {#if tempFilterPriority.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterPriority.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterPriority}
                        options={priorityOptions}
                        placeholder={tempPriorityLabel}
                        onchange={handlePriorityChange}
                        isActive={tempFilterPriority.length > 0}
                        class="w-full"
                        searchable={true}
                        bind:open={prioritySelectOpen}
                    />
                </div>
            </div>

            <!-- Apply Button and Item Count -->
            <div class="mt-4 flex items-center justify-between">
                <div class="text-xs text-zinc-600">
                    {#if tempSearchQuery || tempFilterDateFrom || tempFilterDateTo || tempFilterAssignee.length > 0 || tempFilterTaskType.length > 0 || tempFilterKomtVan.length > 0 || tempFilterDeadline || tempFilterProject !== null || tempFilterCase !== null || tempFilterTags.length > 0 || tempFilterPriority.length > 0}
                        Selectie: {tempFilterAssignee.length +
                            tempFilterTaskType.length +
                            tempFilterKomtVan.length +
                            (tempFilterDeadline ? 1 : 0) +
                            (tempFilterProject !== null ? 1 : 0) +
                            (tempFilterCase !== null ? 1 : 0) +
                            tempFilterTags.length +
                            tempFilterPriority.length +
                            (tempSearchQuery ? 1 : 0) +
                            (tempFilterDateFrom || tempFilterDateTo ? 1 : 0)} filter{tempFilterAssignee.length +
                            tempFilterTaskType.length +
                            tempFilterKomtVan.length +
                            (tempFilterDeadline ? 1 : 0) +
                            (tempFilterProject !== null ? 1 : 0) +
                            (tempFilterCase !== null ? 1 : 0) +
                            tempFilterTags.length +
                            tempFilterPriority.length +
                            (tempSearchQuery ? 1 : 0) +
                            (tempFilterDateFrom || tempFilterDateTo ? 1 : 0) !==
                        1
                            ? "s"
                            : ""} geselecteerd
                    {/if}
                </div>
                <div class="flex gap-2 items-center">
                    <Button
                        onclick={handleResetFilters}
                        variant="secondary"
                        class="flex items-center gap-2"
                    >
                        <Eraser size={16} />
                        Filters wissen
                    </Button>
                    <Button onclick={applyFilters} variant="default">
                        Tonen
                    </Button>
                </div>
            </div>
        </div>
    </div></Drawer
>

<!-- Backlog Drawer -->
<BacklogDrawer onsaved={handleItemSaved} />

<!-- Case Task Drawer -->
<CaseTaskDrawer onsaved={handleItemSaved} />

<!-- Hours Chart Drawer -->
<Drawer
    open={chartDrawerOpen}
    position="right"
    class="w-[90vw] md:w-[40vw]"
    onclose={handleCloseChartDrawer}
>
    <div class="flex flex-col h-full p-6">
        <!-- Header -->
        <div class="mb-6">
            <h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                Uren Overzicht
            </h2>
            {#if activeFiltersSubtitle}
                <p class="text-sm text-zinc-500 mt-1">
                    {activeFiltersSubtitle}
                </p>
            {/if}
        </div>

        <!-- Grouping selector -->
        <div class="mb-6">
            <div class="block text-sm font-medium text-zinc-700 mb-2">
                Groepeer op
            </div>
            <ButtonGroup size="sm" class="w-full">
                <Button
                    type="button"
                    variant={chartGroupBy === "assignee"
                        ? "default"
                        : "secondary"}
                    class="button-group-item"
                    onclick={() => handleChartGroupByChange("assignee")}
                >
                    Gebruiker
                </Button>
                <Button
                    type="button"
                    variant={chartGroupBy === "project"
                        ? "default"
                        : "secondary"}
                    class="button-group-item"
                    onclick={() => handleChartGroupByChange("project")}
                >
                    Project
                </Button>
                <Button
                    type="button"
                    variant={chartGroupBy === "source"
                        ? "default"
                        : "secondary"}
                    class="button-group-item"
                    onclick={() => handleChartGroupByChange("source")}
                >
                    Komt van
                </Button>
                <Button
                    type="button"
                    variant={chartGroupBy === "week" ? "default" : "secondary"}
                    class="button-group-item"
                    onclick={() => handleChartGroupByChange("week")}
                >
                    Per week
                </Button>
            </ButtonGroup>
        </div>

        <!-- Chart -->
        <div class="flex-1 overflow-y-auto">
            <HoursChart
                items={filteredBacklogItems}
                {userMap}
                {projectMap}
                groupBy={chartGroupBy}
            />
        </div>

        <!-- Footer -->
        <div
            class="mt-6 pt-4 border-t border-zinc-200 text-sm text-zinc-500 text-center"
        >
            {filteredBacklogItems.length} items • Totaal: {totalHours.toFixed(
                1,
            )} uur
        </div>
    </div>
</Drawer>
