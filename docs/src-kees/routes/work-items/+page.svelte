<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import WorkItemCard from "$lib/components/WorkItemCard.svelte";
    import BacklogDrawer from "$lib/components/BacklogDrawer.svelte";
    import CaseTaskDrawer from "$lib/components/CaseTaskDrawer.svelte";
    import Button from "$lib/components/Button.svelte";
    import Toggle from "$lib/components/Toggle.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import NavCard from "$lib/components/NavCard.svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import { Drawer, DateRangePicker } from "$lib/components";
    import { Eraser, Search, Plus, ChartBarDecreasing } from "lucide-svelte";
    import * as taskService from "$lib/services/taskService";
    import * as caseService from "$lib/services/caseService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import * as projectService from "$lib/services/projectService";
    import { getCurrentUserId, formatUserName } from "$lib/utils/userUtils";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import { navigationStore } from "$lib/stores/navigationStore";
    import type {
        UnifiedBacklogItem,
        UnifiedPlanningItem,
    } from "$lib/services/taskService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Project } from "$lib/schemas/project";
    import type { PageData } from "./$types";

    // Get SSR data from page
    let { data }: { data: PageData } = $props();

    // Use SSR data immediately for instant render
    let workItems = $state<UnifiedBacklogItem[]>(data.workItems || []);
    let showOnlyMyWork = $state(false);
    let searchQuery = $state(data.filters?.search || "");
    let searchScope = $state(data.filters?.scope || "alle");
    let loading = $state(false); // Start as false since SSR data is available
    let filterStatus = $state<string[]>(data.filters?.status || []);

    // Derive drawer state from URL params
    const searchDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "search",
    );

    // Filter states - support multiple values except deadline - initialize from SSR data
    let filterAssignee = $state<string[]>(data.filters?.assignee || []);
    let filterTaskType = $state<string[]>(data.filters?.taskType || []);
    let filterKomtVan = $state<string[]>(data.filters?.komtVan || []);
    let filterDeadline = $state<string | null>(data.filters?.deadline || null); // Single value only
    let filterDateFrom = $state<string | null>(data.filters?.dateFrom || null);
    let filterDateTo = $state<string | null>(data.filters?.dateTo || null);
    let filterProject = $state<number | null>(
        (data.filters as any)?.project || null,
    );
    let filterTags = $state<string[]>((data.filters as any)?.tags || []);
    let filterPriority = $state<string[]>(
        (data.filters as any)?.priority || [],
    );

    // UI state for filter dropdowns/pickers (for z-index management)
    let dateRangePickerOpen = $state(false);
    let assigneeSelectOpen = $state(false);
    let taskTypeSelectOpen = $state(false);
    let komtVanSelectOpen = $state(false);
    let deadlineSelectOpen = $state(false);
    let statusSelectOpen = $state(false);
    let projectSelectOpen = $state(false);
    let tagsSelectOpen = $state(false);
    let prioritySelectOpen = $state(false);

    // Users for assignee filter - initialize from SSR data
    let users = $state<PocketBaseUser[]>(data.users || []);

    // Distinct komt_van values - only from work items
    const distinctKomtVanValues = $derived.by(() => {
        const values = new Set<string>();
        workItems.forEach((item) => {
            if (item.komt_van) {
                values.add(item.komt_van);
            }
        });
        return Array.from(values).sort();
    });

    // Komt van options - only show values from work items
    const komtVanOptions = $derived.by((): SelectOption[] => {
        const options: SelectOption[] = distinctKomtVanValues.map((email) => ({
            value: email,
            label: email,
        }));
        // Add "Onbekend" option only if there are items with null komt_van
        const hasNullKomtVan = workItems.some((item) => !item.komt_van);
        if (hasNullKomtVan) {
            options.unshift({ value: "__null__", label: "Onbekend" });
        }
        return options;
    });

    // Task type options - only show types that exist in work items
    const taskTypeOptions = $derived.by((): SelectOption[] => {
        const types = new Set<string>();
        workItems.forEach((item) => {
            if (item.type === "case_task") {
                types.add("process");
            } else if (item.type === "work_item") {
                types.add("manual");
            }
        });

        const options: SelectOption[] = [];
        if (types.has("process")) {
            options.push({ value: "process", label: "Cases" });
        }
        if (types.has("manual")) {
            options.push({ value: "manual", label: "Handmatig" });
        }
        return options;
    });

    // User options for assignee filter - only show users that have work items
    const userOptions = $derived.by((): SelectOption[] => {
        // Extract all unique assignee_id and owner_id values from work items
        const assigneeIds = new Set<string>();
        workItems.forEach((item) => {
            // Handle assignee_id as array or single value
            if (item.assignee_id) {
                if (Array.isArray(item.assignee_id)) {
                    item.assignee_id.forEach((id) => assigneeIds.add(id));
                } else {
                    assigneeIds.add(item.assignee_id);
                }
            }
            if (item.owner_id) {
                assigneeIds.add(item.owner_id);
            }
        });

        // Filter users to only include those with work items
        const options: SelectOption[] = users
            .filter((user) => assigneeIds.has(user.id))
            .map((user) => ({
                value: user.id,
                label: formatUserName(user),
            }));

        // Add "Niet toegewezen" option only if there are items without assignee
        const hasUnassignedItems = workItems.some(
            (item) => !item.assignee_id && !item.owner_id,
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
    let projects = $state<Project[]>([]);
    const projectOptions = $derived.by((): SelectOption[] => {
        return projects.map((project) => ({
            value: String(project.id),
            label: project.name,
        }));
    });

    // Tags options - extract unique tags from work items
    const tagOptions = $derived.by((): SelectOption[] => {
        const tagSet = new Set<string>();
        workItems.forEach((item) => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach((tag) => {
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
        return filterAssignee[0];
    });

    const selectedTaskTypeDisplay = $derived.by(() => {
        if (filterTaskType.length === 0) return null;
        if (filterTaskType.length === 1) return filterTaskType[0];
        return filterTaskType[0];
    });

    const selectedKomtVanDisplay = $derived.by(() => {
        if (filterKomtVan.length === 0) return null;
        if (filterKomtVan.length === 1) return filterKomtVan[0];
        return filterKomtVan[0];
    });

    // Labels showing selection counts
    const assigneeLabel = $derived.by(() => {
        if (filterAssignee.length === 0) return "Alle gebruikers";
        if (filterAssignee.length === 1) {
            if (filterAssignee[0] === "__unassigned__")
                return "Niet toegewezen";
            const user = users.find((u) => u.id === filterAssignee[0]);
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
            return workItems.some((item) => {
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
            return workItems.some((item) => {
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
            options.push({ value: "7days", label: "+ 7 dagen" });
        }
        if (hasItemsInRange(fourteenDays)) {
            options.push({ value: "14days", label: "+ 14 dagen" });
        }
        if (hasItemsInRange(thirtyDays)) {
            options.push({ value: "30days", label: "+ 30 dagen" });
        }
        if (hasItemsInRange(sixtyDays)) {
            options.push({ value: "60days", label: "+ 60 dagen" });
        }
        if (hasItemsInRange(ninetyDays)) {
            options.push({ value: "90days", label: "+ 90 dagen" });
        }
        if (hasItemsInRange(oneYear)) {
            options.push({ value: "1year", label: "+ 1 jaar" });
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

    // Status options - based on kanban statuses from kees page
    const statusOptions: SelectOption[] = [
        { value: "backlog", label: "Backlog" },
        { value: "gepland", label: "Gepland" },
        { value: "mee_bezig", label: "Mee bezig" },
        { value: "in_review", label: "In review" },
        { value: "afgerond", label: "Afgerond" },
        { value: "overdue", label: "Te laat" },
    ];

    const statusLabel = $derived.by(() => {
        if (filterStatus.length === 0) return "Alle statussen";
        if (filterStatus.length === 1) {
            const option = statusOptions.find(
                (opt) => opt.value === filterStatus[0],
            );
            return option?.label || "Alle statussen";
        }
        return `${filterStatus.length} statussen geselecteerd`;
    });

    const projectLabel = $derived.by(() => {
        if (!filterProject) return "Alle projecten";
        const project = projects.find((p) => p.id === filterProject);
        return project?.name || "Alle projecten";
    });

    const tagsLabel = $derived.by(() => {
        if (filterTags.length === 0) return "Alle tags";
        if (filterTags.length === 1) return filterTags[0];
        return `${filterTags.length} tags geselecteerd`;
    });

    const priorityLabel = $derived.by(() => {
        if (filterPriority.length === 0) return "Alle prioriteiten";
        if (filterPriority.length === 1) {
            const option = priorityOptions.find(
                (opt) => opt.value === filterPriority[0],
            );
            return option?.label || "Alle prioriteiten";
        }
        return `${filterPriority.length} prioriteiten geselecteerd`;
    });

    // Map of user_id -> user for quick lookup
    const userMap = $derived.by(() => {
        const map = new Map<string, PocketBaseUser>();
        users.forEach((user) => {
            map.set(user.id, user);
        });
        return map;
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

        // Status filter
        if (filterStatus.length > 0) count++;

        // Project filter
        if (filterProject !== null) count++;

        // Tags filter
        if (filterTags.length > 0) count++;

        // Priority filter
        if (filterPriority.length > 0) count++;

        return count;
    });

    // Calculate total hours from filtered items
    const totalHours = $derived.by(() => {
        return filteredWorkItems.reduce(
            (sum, item) => sum + (item.uren || 0),
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
            const typeLabels = filterTaskType.map((type) =>
                type === "process" ? "Proces" : "Handmatig",
            );
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

        // Status filter
        if (filterStatus.length > 0) {
            const statusLabels = filterStatus.map((status) => {
                const option = statusOptions.find(
                    (opt) => opt.value === status,
                );
                return option?.label || status;
            });
            filters.push(`Status: ${statusLabels.join(", ")}`);
        }

        // Project filter
        if (filterProject !== null) {
            const project = projects.find((p) => p.id === filterProject);
            if (project) {
                filters.push(`Project: ${project.name}`);
            }
        }

        // Tags filter
        if (filterTags.length > 0) {
            filters.push(`Tags: ${filterTags.join(", ")}`);
        }

        // Priority filter
        if (filterPriority.length > 0) {
            const priorityLabels = filterPriority.map((p) => {
                const option = priorityOptions.find((opt) => opt.value === p);
                return option?.label || p;
            });
            filters.push(`Prioriteit: ${priorityLabels.join(", ")}`);
        }

        // Show only my work
        if (showOnlyMyWork) {
            filters.push("Alleen mijn werk");
        }

        return filters.length > 0 ? filters.join(" • ") : "";
    });

    const currentUserId = getCurrentUserId();

    // Helper function to parse comma-separated URL param values
    function parseUrlParam(param: string | null): string[] {
        if (!param) return [];
        return param
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
    }

    onMount(async () => {
        // Use SSR data if available (it's now always unfiltered from server)
        // All data (workItems, users) arrives together via Promise.all in +page.server.ts
        // This avoids unnecessary API calls and provides instant render
        if (data.workItems && data.workItems.length > 0) {
            // Log SSR data arrival
            const ssrTimestamp = new Date().toISOString();
            console.log(
                `[Work Items UI] SSR data arrived at ${ssrTimestamp}:`,
                {
                    timestamp: ssrTimestamp,
                    source: "SSR",
                    recordCount: data.workItems.length,
                    records: data.workItems.map((item: any) => ({
                        id: item.id,
                        type: item.type,
                        subject: item.subject,
                        status: item.status,
                        kanban_status: item.kanban_status,
                    })),
                },
            );

            // SSR data is already set in state initialization above
            // Just ensure loading is false
            loading = false;
        } else {
            // Fallback: Load data client-side if SSR data is not available
            console.log("[Work Items UI] No SSR data, loading client-side");
            loading = true;
            await Promise.all([loadWorkItems(), loadUsers(), loadProjects()]);
            loading = false;
        }

        // Load projects if not already loaded
        if (projects.length === 0) {
            await loadProjects();
        }

        // Mark initial load as complete (allows URL watcher to trigger reloads)
        hasInitialLoad = true;
    });

    async function loadUsers() {
        const result = await pocketbaseService.getAllUsers();
        if (result.success) {
            users = result.value;
        }
    }

    async function loadProjects() {
        const currentUserId = getCurrentUserId();
        const result = await projectService.getProjectsForUser(
            currentUserId || "",
        );
        if (result.success) {
            projects = result.value;
        }
    }

    async function loadWorkItems() {
        // Guard against concurrent loads
        if (loading) return;

        loading = true;
        navigationStore.startPageLoading();
        const assigneeFilter = showOnlyMyWork ? currentUserId : null;
        // Pass all status filters as comma-separated string (API supports multiple statuses)
        // This is especially important for 'afgerond' to include closed tasks
        const statusFilterForAPI =
            filterStatus.length > 0 ? filterStatus.join(",") : undefined;
        const result = await taskService.getAllUnifiedWorkItems(
            assigneeFilter || undefined,
            statusFilterForAPI || undefined,
        );
        if (result.success) {
            workItems = result.value;
        } else {
            toastStore.add(getUserMessage(result.error), "error");
            workItems = [];
        }
        loading = false;
        navigationStore.stopPageLoading();
    }

    async function toggleFilter() {
        showOnlyMyWork = !showOnlyMyWork;
        // Reload work items when filter changes
        await loadWorkItems();
    }

    async function moveToPlanning(
        item: UnifiedBacklogItem,
        status: "gepland" | "ad-hoc",
    ) {
        // Optimistically remove the item from the list immediately (it will move to planning)
        // This prevents flashing in the UI
        workItems = workItems.filter(
            (i) => !(i.id === item.id && i.type === item.type),
        );

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
                    await loadWorkItems();
                }
                // On success, item already removed optimistically - no need to refresh
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
                    await loadWorkItems();
                }
                // On success, item already removed optimistically - no need to refresh
            }
        } catch (error) {
            // Handle unexpected errors
            console.error("Unexpected error moving item to planning:", error);
            toastStore.clear();
            toastStore.add("Er is een onverwachte fout opgetreden", "error");
            // Revert optimistic update on error - refresh from server
            await loadWorkItems();
        }
    }

    async function openEditDrawer(item: UnifiedBacklogItem) {
        const urlParams = new URLSearchParams($page.url.searchParams);
        if (item.type === "work_item") {
            urlParams.set("drawer", "workitem");
            urlParams.set("workItemId", String(item.id));
            await goto(`?${urlParams.toString()}`, { noScroll: true });
        } else if (item.type === "case_task") {
            urlParams.set("drawer", "casetask");
            urlParams.set("caseTaskId", String(item.id));
            await goto(`?${urlParams.toString()}`, { noScroll: true });
        }
    }

    async function openItemDetail(item: UnifiedBacklogItem) {
        // Navigate to the full detail page based on task type
        // Both work_item and case_task use the unified task ID from _bpm_tasks
        await goto(`/work/${item.id}`);
    }

    // Convert UnifiedBacklogItem to UnifiedPlanningItem format for WorkItemCard
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

    async function handleItemSaved(item: any) {
        // When creating from homepage, redirect to the work item detail page
        if ($page.url.pathname === "/") {
            await goto(`/work/${item.id}`);
        } else {
            loadWorkItems();
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

    // Filter work items based on search query and filters
    const filteredWorkItems = $derived.by(() => {
        let items = workItems;

        // IMPORTANT: Date range filter is applied FIRST to reduce the dataset
        // This ensures other filters only show values available within the date range
        if (filterDateFrom || filterDateTo) {
            items = items.filter((item) => {
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

        // Filter by task_type (process = case_task, manual = work_item) - support multiple
        if (filterTaskType.length > 0) {
            items = items.filter((item) => {
                return filterTaskType.some((type) => {
                    if (type === "process") {
                        return item.type === "case_task";
                    } else if (type === "manual") {
                        return item.type === "work_item";
                    }
                    return false;
                });
            });
        }

        // Filter by assignee - support multiple
        if (filterAssignee.length > 0) {
            items = items.filter((item) => {
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
            items = items.filter((item) => {
                return filterKomtVan.some((komtVan) => {
                    if (komtVan === "__null__") {
                        return !item.komt_van;
                    } else {
                        return item.komt_van === komtVan;
                    }
                });
            });
        }

        // Filter by status - support multiple
        if (filterStatus.length > 0) {
            items = items.filter((item) => {
                // Check both status and kanban_status
                const itemStatus = item.status;
                const itemKanbanStatus = item.kanban_status;

                return filterStatus.some((status) => {
                    // Handle special statuses
                    if (status === "overdue") {
                        // Overdue items: deadline < now AND status !== 'completed' AND kanban_status !== 'afgerond'
                        const now = new Date();
                        const itemDeadline = item.deadline || item.due_date;
                        if (!itemDeadline) return false;
                        return (
                            new Date(itemDeadline) < now &&
                            itemStatus !== "completed" &&
                            itemKanbanStatus !== "afgerond"
                        );
                    }

                    // Match by status or kanban_status
                    return itemStatus === status || itemKanbanStatus === status;
                });
            });
        }

        // Filter by deadline
        if (filterDeadline) {
            if (filterDeadline === "overdue") {
                // Filter for overdue items: deadline < now AND status !== 'completed'
                const now = new Date();
                items = items.filter((item) => {
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

                items = items.filter((item) => {
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
            items = items.filter((item) => {
                return item.project_id === filterProject;
            });
        }

        // Filter by tags
        if (filterTags && filterTags.length > 0) {
            items = items.filter((item) => {
                if (!item.tags || !Array.isArray(item.tags)) return false;
                return filterTags.some((tag) => item.tags?.includes(tag));
            });
        }

        // Filter by priority
        if (filterPriority && filterPriority.length > 0) {
            items = items.filter((item) => {
                const itemPriority = (item as any).priority || "normaal";
                return filterPriority.includes(itemPriority);
            });
        }

        // Filter by search query with scope
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            items = items.filter((item) => {
                // Define search scope matching function
                const matchesInScope = (scope: string) => {
                    switch (scope) {
                        case "alle":
                            // Search in all fields
                            return (
                                item.subject?.toLowerCase().includes(query) ||
                                item.tags?.some((tag) =>
                                    tag.toLowerCase().includes(query),
                                ) ||
                                item.case_name?.toLowerCase().includes(query) ||
                                item.task_name?.toLowerCase().includes(query) ||
                                item.wat_ga_je_doen
                                    ?.toLowerCase()
                                    .includes(query) ||
                                item.voor_wie_is_het
                                    ?.toLowerCase()
                                    .includes(query) ||
                                item.komt_van?.toLowerCase().includes(query)
                            );

                        case "cases":
                            // Only search case-related fields
                            return (
                                item.type === "case_task" &&
                                (item.case_name
                                    ?.toLowerCase()
                                    .includes(query) ||
                                    item.subject?.toLowerCase().includes(query))
                            );

                        case "taken":
                            // Search in task fields
                            return (
                                item.subject?.toLowerCase().includes(query) ||
                                item.task_name?.toLowerCase().includes(query) ||
                                item.wat_ga_je_doen
                                    ?.toLowerCase()
                                    .includes(query)
                            );

                        case "personen":
                            // Search in person-related fields
                            return (
                                item.voor_wie_is_het
                                    ?.toLowerCase()
                                    .includes(query) ||
                                item.komt_van?.toLowerCase().includes(query)
                            );

                        case "projecten":
                            // Search in project-related fields (tags, case names that might be projects)
                            return (
                                item.tags?.some((tag) =>
                                    tag.toLowerCase().includes(query),
                                ) ||
                                item.case_name?.toLowerCase().includes(query)
                            );

                        case "processen":
                            // Only search process tasks
                            return (
                                item.type === "case_task" &&
                                (item.task_name
                                    ?.toLowerCase()
                                    .includes(query) ||
                                    item.subject?.toLowerCase().includes(query))
                            );

                        default:
                            return false;
                    }
                };

                return Boolean(matchesInScope(searchScope));
            });
        }

        return items;
    });

    // Track if we're updating from URL to avoid loops
    let updatingFromUrl = $state(false);

    // Helper function to build URL with current filter state
    function updateUrlFromFilters() {
        // Don't update URL if we're currently syncing from URL
        if (updatingFromUrl) return;

        const params: string[] = [];

        // Update search query (encode properly for text that may contain special chars)
        if (searchQuery) {
            params.push(`search=${encodeURIComponent(searchQuery)}`);
        }

        // Update search scope
        if (searchScope !== "alle") {
            params.push(`scope=${searchScope}`);
        }

        // Update status filter (comma-separated)
        if (filterStatus.length > 0) {
            params.push(`status=${filterStatus.join(",")}`);
        }

        // Update assignee filter (comma-separated, no encoding needed for user IDs)
        if (filterAssignee.length > 0) {
            params.push(`assignee=${filterAssignee.join(",")}`);
        }

        // Update task type filter (comma-separated)
        if (filterTaskType.length > 0) {
            params.push(`taskType=${filterTaskType.join(",")}`);
        }

        // Update komt van filter (comma-separated, encode values that may contain special chars)
        if (filterKomtVan.length > 0) {
            params.push(
                `komtVan=${filterKomtVan.map((v) => encodeURIComponent(v)).join(",")}`,
            );
        }

        // Update deadline filter (single value)
        if (filterDeadline) {
            params.push(`deadline=${filterDeadline}`);
        }

        // Update date range filter
        if (filterDateFrom) {
            params.push(`dateFrom=${encodeURIComponent(filterDateFrom)}`);
        }
        if (filterDateTo) {
            params.push(`dateTo=${encodeURIComponent(filterDateTo)}`);
        }

        // Update project filter
        if (filterProject !== null) {
            params.push(`project=${filterProject}`);
        }

        // Update tags filter
        if (filterTags.length > 0) {
            params.push(
                `tags=${filterTags.map((t) => encodeURIComponent(t)).join(",")}`,
            );
        }

        // Update priority filter
        if (filterPriority.length > 0) {
            params.push(`priority=${filterPriority.join(",")}`);
        }

        const queryString = params.length > 0 ? `?${params.join("&")}` : "";
        const newUrl = `${$page.url.pathname}${queryString}`;
        const currentUrl = `${$page.url.pathname}${$page.url.search}`;

        // Only navigate if URL actually changed
        if (newUrl !== currentUrl) {
            goto(newUrl, { replaceState: true, noScroll: true });
        }
    }

    // Track if user is actively typing to prevent URL sync from overwriting
    let isTyping = $state(false);

    // Track if initial load is complete (prevents reload on mount)
    let hasInitialLoad = $state(false);

    // Sync filter state from URL params (reactive to URL changes)
    $effect(() => {
        // Don't sync from URL if user is actively typing
        if (isTyping) return;

        const urlParams = $page.url.searchParams;
        updatingFromUrl = true;

        let statusFilterChanged = false;

        try {
            // Read search query
            const searchParam = urlParams.get("search");
            if (searchParam !== null && searchQuery !== searchParam) {
                searchQuery = searchParam;
            } else if (searchParam === null && searchQuery !== "") {
                searchQuery = "";
            }

            // Read search scope
            const scopeParam = urlParams.get("scope") || "alle";
            if (searchScope !== scopeParam) {
                searchScope = scopeParam;
            }

            // Read status filter (comma-separated values)
            const statusParam = parseUrlParam(urlParams.get("status"));
            const currentStatuses = [...filterStatus].sort();
            const newStatuses = [...statusParam].sort();
            if (
                JSON.stringify(currentStatuses) !== JSON.stringify(newStatuses)
            ) {
                filterStatus = statusParam;
                statusFilterChanged = true;
            }

            // Read assignee filter
            const assigneeParam = parseUrlParam(urlParams.get("assignee"));
            const currentAssignees = [...filterAssignee].sort();
            const newAssignees = [...assigneeParam].sort();
            if (
                JSON.stringify(currentAssignees) !==
                JSON.stringify(newAssignees)
            ) {
                filterAssignee = assigneeParam;
            }

            // Read task type filter
            const taskTypeParam = parseUrlParam(urlParams.get("taskType"));
            const currentTaskTypes = [...filterTaskType].sort();
            const newTaskTypes = [...taskTypeParam].sort();
            if (
                JSON.stringify(currentTaskTypes) !==
                JSON.stringify(newTaskTypes)
            ) {
                filterTaskType = taskTypeParam;
            }

            // Read komt van filter (decode values)
            const komtVanParam = parseUrlParam(urlParams.get("komtVan")).map(
                (v) => decodeURIComponent(v),
            );
            const currentKomtVan = [...filterKomtVan].sort();
            const newKomtVan = [...komtVanParam].sort();
            if (JSON.stringify(currentKomtVan) !== JSON.stringify(newKomtVan)) {
                filterKomtVan = komtVanParam;
            }

            // Read deadline filter (single value)
            const deadlineParam = urlParams.get("deadline");
            if (deadlineParam !== null && filterDeadline !== deadlineParam) {
                filterDeadline = deadlineParam;
            } else if (deadlineParam === null && filterDeadline !== null) {
                filterDeadline = null;
            }

            // Read date range filter
            const dateFromParam = urlParams.get("dateFrom");
            if (dateFromParam !== null && filterDateFrom !== dateFromParam) {
                filterDateFrom = dateFromParam;
            } else if (dateFromParam === null && filterDateFrom !== null) {
                filterDateFrom = null;
            }

            const dateToParam = urlParams.get("dateTo");
            if (dateToParam !== null && filterDateTo !== dateToParam) {
                filterDateTo = dateToParam;
            } else if (dateToParam === null && filterDateTo !== null) {
                filterDateTo = null;
            }

            // Read project filter
            const projectParam = urlParams.get("project");
            if (projectParam !== null) {
                const projectId = parseInt(projectParam, 10);
                if (!isNaN(projectId) && filterProject !== projectId) {
                    filterProject = projectId;
                }
            } else if (projectParam === null && filterProject !== null) {
                filterProject = null;
            }

            // Read tags filter (comma-separated, decode values)
            const tagsParam = parseUrlParam(urlParams.get("tags")).map((v) =>
                decodeURIComponent(v),
            );
            const currentTags = [...filterTags].sort();
            const newTags = [...tagsParam].sort();
            if (JSON.stringify(currentTags) !== JSON.stringify(newTags)) {
                filterTags = tagsParam;
            }

            // Read priority filter (comma-separated)
            const priorityParam = parseUrlParam(urlParams.get("priority"));
            const currentPriorities = [...filterPriority].sort();
            const newPriorities = [...priorityParam].sort();
            if (
                JSON.stringify(currentPriorities) !==
                JSON.stringify(newPriorities)
            ) {
                filterPriority = priorityParam;
            }
        } finally {
            updatingFromUrl = false;

            // Reload if statusFilter changed from URL (but not on initial mount)
            if (statusFilterChanged && hasInitialLoad && !loading) {
                loadWorkItems();
            }
        }
    });

    function handleAssigneeChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            filterAssignee = value;
        } else if (value === null) {
            filterAssignee = [];
        } else {
            // Toggle assignee: if already selected, remove it; otherwise add it
            if (filterAssignee.includes(value)) {
                filterAssignee = filterAssignee.filter((id) => id !== value);
            } else {
                filterAssignee = [...filterAssignee, value];
            }
        }
        updateUrlFromFilters();
    }

    function handleTaskTypeChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            filterTaskType = value;
        } else if (value === null) {
            filterTaskType = [];
        } else {
            // Toggle task type: if already selected, remove it; otherwise add it
            if (filterTaskType.includes(value)) {
                filterTaskType = filterTaskType.filter((t) => t !== value);
            } else {
                filterTaskType = [...filterTaskType, value];
            }
        }
        updateUrlFromFilters();
    }

    function handleKomtVanChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            filterKomtVan = value;
        } else if (value === null) {
            filterKomtVan = [];
        } else {
            // Toggle komt van: if already selected, remove it; otherwise add it
            if (filterKomtVan.includes(value)) {
                filterKomtVan = filterKomtVan.filter((k) => k !== value);
            } else {
                filterKomtVan = [...filterKomtVan, value];
            }
        }
        updateUrlFromFilters();
    }

    function handleDeadlineChange(value: string | null | string[]) {
        // Deadline is single value only, so take first if array
        if (Array.isArray(value)) {
            filterDeadline = value.length > 0 ? value[0] : null;
        } else {
            filterDeadline = value;
        }
        updateUrlFromFilters();
    }

    function handleDateRangeChange(from: string | null, to: string | null) {
        filterDateFrom = from;
        filterDateTo = to;
        updateUrlFromFilters();
    }

    function handleProjectChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            const numValue = value.length > 0 ? parseInt(value[0], 10) : null;
            filterProject = numValue;
        } else if (value === null) {
            filterProject = null;
        } else {
            filterProject = parseInt(value, 10);
        }
        updateUrlFromFilters();
    }

    function handleTagsChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            filterTags = value;
        } else if (value === null) {
            filterTags = [];
        } else {
            // Toggle tag: if already selected, remove it; otherwise add it
            if (filterTags.includes(value)) {
                filterTags = filterTags.filter((t) => t !== value);
            } else {
                filterTags = [...filterTags, value];
            }
        }
        updateUrlFromFilters();
    }

    function handlePriorityChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            filterPriority = value;
        } else if (value === null) {
            filterPriority = [];
        } else {
            // Toggle priority: if already selected, remove it; otherwise add it
            if (filterPriority.includes(value)) {
                filterPriority = filterPriority.filter((p) => p !== value);
            } else {
                filterPriority = [...filterPriority, value];
            }
        }
        updateUrlFromFilters();
    }

    let searchTimeout: ReturnType<typeof setTimeout> | null = null;

    function handleSearchChange(value: string) {
        isTyping = true;
        searchQuery = value;
        // Debounce URL update for search to avoid too many navigation events
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
            isTyping = false;
            updateUrlFromFilters();
        }, 300);
    }

    async function handleResetFilters() {
        searchQuery = "";
        searchScope = "alle";
        filterAssignee = [];
        filterTaskType = [];
        filterKomtVan = [];
        filterDeadline = null;
        filterDateFrom = null;
        filterDateTo = null;
        filterStatus = [];
        filterProject = null;
        filterTags = [];
        filterPriority = [];
        currentPage = 1; // Reset to first page

        // Update URL to reflect cleared filters
        updateUrlFromFilters();

        // Reload work items when filters are reset (filterStatus affects API call)
        await loadWorkItems();
    }

    function handleStatusChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            filterStatus = value;
        } else if (value === null) {
            filterStatus = [];
        } else {
            // Toggle status: if already selected, remove it; otherwise add it
            if (filterStatus.includes(value)) {
                filterStatus = filterStatus.filter((s) => s !== value);
            } else {
                filterStatus = [...filterStatus, value];
            }
        }
        updateUrlFromFilters();
        // Reload if status changed (affects API call)
        if (hasInitialLoad && !loading) {
            loadWorkItems();
        }
    }

    // Pagination state
    const itemsPerPage = 20;
    let currentPage = $state(1);

    // Calculate total pages
    const totalPages = $derived(
        Math.ceil(filteredWorkItems.length / itemsPerPage),
    );

    // Get paginated items for current page
    const paginatedItems = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredWorkItems.slice(startIndex, endIndex);
    });

    // Reset to page 1 when filters change
    $effect(() => {
        // Watch filteredWorkItems length changes
        void filteredWorkItems.length;
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
</script>

<svelte:head>
    <title>Work Items - Ons Werk</title>
</svelte:head>

<div class="h-full overflow-y-auto">
    <div class="container mx-auto px-4 py-8 max-w-[90vw]">
        <div class="space-y-6">
            <!-- Navigation Card with Search -->
            <NavCard
                title="Werk items"
                subtitle={!loading
                    ? `${filteredWorkItems.length} taken in ${totalHours} uur${activeFiltersSubtitle ? ` • ${activeFiltersSubtitle}` : ""}`
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
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-zinc-700"
                                >Alleen mijn items</span
                            >
                            <Toggle
                                checked={showOnlyMyWork}
                                onchange={toggleFilter}
                            />
                        </div>
                        <IconButton
                            icon={Plus}
                            variant="default"
                            onclick={openCreateDrawer}
                            tooltip="Nieuw item toevoegen"
                        />
                    </div>
                {/snippet}
            </NavCard>

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
                    <div class="mb-6 flex items-center justify-between">
                        <h2
                            class="text-2xl font-semibold text-zinc-900 font-aspekta"
                        >
                            Zoeken & Filteren
                        </h2>
                        <button
                            onclick={handleResetFilters}
                            class="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                            aria-label="Filters resetten"
                            title="Filters resetten"
                        >
                            <Eraser size={18} />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1">
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            <!-- Search Input -->
                            <div class="lg:col-span-2">
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Zoeken
                                </div>
                                <SearchInput
                                    bind:value={searchQuery}
                                    bind:searchScope
                                    placeholder="Zoek in onderwerp, tags, case naam, taak naam..."
                                    showSuggestions={false}
                                    showSearchScope={true}
                                    searchScopeOptions={[
                                        { value: "alle", label: "Alles" },
                                        { value: "cases", label: "Cases" },
                                        {
                                            value: "projecten",
                                            label: "Projecten",
                                        },
                                        { value: "taken", label: "Taken" },
                                        {
                                            value: "processen",
                                            label: "Processen",
                                        },
                                        {
                                            value: "personen",
                                            label: "Personen",
                                        },
                                    ]}
                                    onchange={handleSearchChange}
                                    onscopechange={updateUrlFromFilters}
                                    isActive={searchQuery.trim().length > 0}
                                    class="w-full"
                                />
                            </div>

                            <!-- Date Range Filter -->
                            <div
                                class="lg:col-span-2 relative {dateRangePickerOpen
                                    ? 'z-[200]'
                                    : 'z-[70]'}"
                            >
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Datum bereik
                                </div>
                                <DateRangePicker
                                    bind:fromDate={filterDateFrom}
                                    bind:toDate={filterDateTo}
                                    fromPlaceholder="Van datum"
                                    toPlaceholder="Tot datum"
                                    onchange={handleDateRangeChange}
                                    isActive={filterDateFrom !== null ||
                                        filterDateTo !== null}
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
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Toegewezen aan
                                    {#if filterAssignee.length > 1}
                                        <span class="ml-2 text-xs text-zinc-500"
                                            >({filterAssignee.length})</span
                                        >
                                    {/if}
                                </div>
                                <Select
                                    multiple={true}
                                    selectedValues={filterAssignee}
                                    options={userOptions}
                                    placeholder={assigneeLabel}
                                    onchange={handleAssigneeChange}
                                    isActive={filterAssignee.length > 0}
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
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Taak type
                                    {#if filterTaskType.length > 1}
                                        <span class="ml-2 text-xs text-zinc-500"
                                            >({filterTaskType.length})</span
                                        >
                                    {/if}
                                </div>
                                <Select
                                    multiple={true}
                                    selectedValues={filterTaskType}
                                    options={taskTypeOptions}
                                    placeholder={taskTypeLabel}
                                    onchange={handleTaskTypeChange}
                                    isActive={filterTaskType.length > 0}
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
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Komt van
                                    {#if filterKomtVan.length > 1}
                                        <span class="ml-2 text-xs text-zinc-500"
                                            >({filterKomtVan.length})</span
                                        >
                                    {/if}
                                </div>
                                <Select
                                    multiple={true}
                                    selectedValues={filterKomtVan}
                                    options={komtVanOptions}
                                    placeholder={komtVanLabel}
                                    onchange={handleKomtVanChange}
                                    isActive={filterKomtVan.length > 0}
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
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Deadline
                                </div>
                                <Select
                                    value={filterDeadline}
                                    options={deadlineOptions}
                                    placeholder={deadlineLabel}
                                    onchange={handleDeadlineChange}
                                    isActive={filterDeadline !== null}
                                    class="w-full"
                                    searchable={true}
                                    bind:open={deadlineSelectOpen}
                                />
                            </div>

                            <!-- Status Filter -->
                            <div
                                class="lg:col-span-1 relative {statusSelectOpen
                                    ? 'z-[200]'
                                    : 'z-[140]'}"
                            >
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Status
                                    {#if filterStatus.length > 1}
                                        <span class="ml-2 text-xs text-zinc-500"
                                            >({filterStatus.length})</span
                                        >
                                    {/if}
                                </div>
                                <Select
                                    multiple={true}
                                    selectedValues={filterStatus}
                                    options={statusOptions}
                                    placeholder={statusLabel}
                                    onchange={handleStatusChange}
                                    isActive={filterStatus.length > 0}
                                    class="w-full"
                                    searchable={true}
                                    bind:open={statusSelectOpen}
                                />
                            </div>

                            <!-- Project Filter -->
                            <div
                                class="lg:col-span-1 relative {projectSelectOpen
                                    ? 'z-[200]'
                                    : 'z-[150]'}"
                            >
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Project
                                </div>
                                <Select
                                    value={filterProject !== null
                                        ? String(filterProject)
                                        : null}
                                    options={projectOptions}
                                    placeholder={projectLabel}
                                    onchange={handleProjectChange}
                                    isActive={filterProject !== null}
                                    class="w-full"
                                    searchable={true}
                                    bind:open={projectSelectOpen}
                                />
                            </div>

                            <!-- Tags Filter -->
                            <div
                                class="lg:col-span-1 relative {tagsSelectOpen
                                    ? 'z-[200]'
                                    : 'z-[160]'}"
                            >
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Tags
                                    {#if filterTags.length > 1}
                                        <span class="ml-2 text-xs text-zinc-500"
                                            >({filterTags.length})</span
                                        >
                                    {/if}
                                </div>
                                <Select
                                    multiple={true}
                                    selectedValues={filterTags}
                                    options={tagOptions}
                                    placeholder={tagsLabel}
                                    onchange={handleTagsChange}
                                    isActive={filterTags.length > 0}
                                    class="w-full"
                                    searchable={true}
                                    bind:open={tagsSelectOpen}
                                />
                            </div>

                            <!-- Priority Filter -->
                            <div
                                class="lg:col-span-1 relative {prioritySelectOpen
                                    ? 'z-[200]'
                                    : 'z-[170]'}"
                            >
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Prioriteit
                                    {#if filterPriority.length > 1}
                                        <span class="ml-2 text-xs text-zinc-500"
                                            >({filterPriority.length})</span
                                        >
                                    {/if}
                                </div>
                                <Select
                                    multiple={true}
                                    selectedValues={filterPriority}
                                    options={priorityOptions}
                                    placeholder={priorityLabel}
                                    onchange={handlePriorityChange}
                                    isActive={filterPriority.length > 0}
                                    class="w-full"
                                    searchable={true}
                                    bind:open={prioritySelectOpen}
                                />
                            </div>
                        </div>

                        <!-- Item Count (below filters, positioned on the right) -->
                        {#if searchQuery || filterDateFrom || filterDateTo || filterAssignee.length > 0 || filterTaskType.length > 0 || filterKomtVan.length > 0 || filterDeadline || filterStatus.length > 0 || filterProject !== null || filterTags.length > 0 || filterPriority.length > 0}
                            <div class="mt-3 text-right text-xs text-zinc-600">
                                {filteredWorkItems.length} van {workItems.length}
                                items
                            </div>
                        {/if}
                    </div>
                </div>
            </Drawer>

            {#if loading}{:else if workItems.length === 0}
                <div class="text-center py-12">
                    <p class="text-zinc-500">Geen work items gevonden</p>
                </div>
            {:else if filteredWorkItems.length === 0}
                <div class="text-center py-12">
                    <p class="text-zinc-500">
                        Geen items gevonden met de huidige filters
                    </p>
                </div>
            {:else}
                <!-- Work Items - Work Items and Case Tasks as Cards -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch"
                >
                    {#each paginatedItems as item (item.type + "-" + item.id)}
                        {@const planningItem = convertToPlanningItem(item)}
                        <div class="h-full">
                            <WorkItemCard
                                workItem={planningItem}
                                draggable={false}
                                ondelete={loadWorkItems}
                                onclick={() => openItemDetail(item)}
                                oneditclick={() => openEditDrawer(item)}
                                showStatusButtons={true}
                                onstatuschange={(status) =>
                                    moveToPlanning(item, status)}
                            />
                        </div>
                    {/each}
                </div>

                <!-- Pagination Component -->
                {#if totalPages > 1}
                    <div class="mt-8">
                        <Pagination
                            {currentPage}
                            totalItems={filteredWorkItems.length}
                            {itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>

<!-- Backlog Drawer -->
<BacklogDrawer onsaved={handleItemSaved} />

<!-- Case Task Drawer -->
<CaseTaskDrawer onsaved={handleItemSaved} />
