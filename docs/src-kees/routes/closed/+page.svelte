<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import WorkItemCard from "$lib/components/WorkItemCard.svelte";
    import NavCard from "$lib/components/NavCard.svelte";
    import { Drawer } from "$lib/components";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import Button from "$lib/components/Button.svelte";
    import { Search, Eraser } from "lucide-svelte";
    import { navigationStore } from "$lib/stores/navigationStore";
    import * as taskService from "$lib/services/taskService";
    import * as caseService from "$lib/services/caseService";
    import * as projectService from "$lib/services/projectService";
    import * as processService from "$lib/services/processService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
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
    let closedItems = $state(data.closedItems || []);
    let allClosedItems = $state<UnifiedBacklogItem[]>([]); // All items for filtering/search
    let totalCount = $state(data.totalCount || 0);
    let users = $state(data.users || []);
    let projects = $state(data.projects || []);
    let processes = $state(data.processes || []);
    let cases = $state(data.cases || []);

    // Initialize filters from SSR data (applied filters)
    let searchQuery = $state(data.filters?.search || "");
    let searchScope = $state(data.filters?.scope || "alle");
    let filterAssignee = $state(data.filters?.assignee || []);
    let filterTaskType = $state(data.filters?.taskType || []);
    let filterKomtVan = $state(data.filters?.komtVan || []);
    let filterDeadline = $state(data.filters?.deadline || null);
    let filterProject = $state<number | null>(
        (data.filters as any)?.project || null,
    );
    let filterTags = $state<string[]>((data.filters as any)?.tags || []);
    let filterPriority = $state<string[]>(
        (data.filters as any)?.priority || [],
    );

    // Temporary filter state (before applying)
    let tempSearchQuery = $state("");
    let tempSearchScope = $state("alle");
    let tempFilterAssignee = $state<string[]>([]);
    let tempFilterTaskType = $state<string[]>([]);
    let tempFilterKomtVan = $state<string[]>([]);
    let tempFilterDeadline = $state<string | null>(null);
    let tempFilterProject = $state<number | null>(null);
    let tempFilterTags = $state<string[]>([]);
    let tempFilterPriority = $state<string[]>([]);

    // Track open state for each select to manage z-index
    let assigneeSelectOpen = $state(false);
    let taskTypeSelectOpen = $state(false);
    let komtVanSelectOpen = $state(false);
    let deadlineSelectOpen = $state(false);
    let projectSelectOpen = $state(false);
    let tagsSelectOpen = $state(false);
    let prioritySelectOpen = $state(false);
    let dateRangePickerOpen = $state(false);

    // Derive search drawer state from URL params
    const searchDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "search",
    );

    // Track if initial load is complete (to distinguish between "loading" and "no data")
    // We always need to load all items (SSR only provides first 50), so initial load isn't complete yet
    let initialLoadComplete = $state(false);

    // Project membership tracking (project_id -> {isMember: boolean, isOwner: boolean})
    let projectMemberships = $state<
        Map<number, { isMember: boolean; isOwner: boolean }>
    >(new Map());

    // Check if user can access a specific project
    function canAccessProject(projectId: number | null): boolean {
        if (!projectId) return true; // No project = accessible

        // Sysadmins can access everything
        if ($authStore?.user?.is_sysadmin) return true;

        // Check if user has Admin role
        if ($authStore?.roles?.some((r) => r.name === "Admin")) return true;

        // Check if project is public or private
        const project = projectMap.get(projectId);
        if (!project) return false; // Unknown project = no access

        // Public projects are accessible to everyone
        if (!project.is_private) {
            return true;
        }

        // Private projects require membership
        const membership = projectMemberships.get(projectId);
        return membership?.isMember || false;
    }

    // Process tasks for task name/description lookup (id -> {name, description})
    let processTasks = $state<
        Map<number, { name: string; description: string | null }>
    >(new Map());

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

    // Distinct komt_van values - only from closed items
    const distinctKomtVanValues = $derived.by(() => {
        const values = new Set<string>();
        allClosedItems.forEach((item) => {
            if (item.komt_van) {
                values.add(item.komt_van);
            }
        });
        return Array.from(values).sort();
    });

    // Komt van options - only show values from closed items
    const komtVanOptions = $derived.by((): SelectOption[] => {
        const options: SelectOption[] = distinctKomtVanValues.map((email) => ({
            value: email,
            label: email,
        }));
        // Add "Onbekend" option only if there are items with null komt_van
        const hasNullKomtVan = allClosedItems.some((item) => !item.komt_van);
        if (hasNullKomtVan) {
            options.unshift({ value: "__null__", label: "Onbekend" });
        }
        return options;
    });

    // Task type options - only show types that exist in closed items
    const taskTypeOptions = $derived.by((): SelectOption[] => {
        const types = new Set<string>();
        allClosedItems.forEach((item) => {
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

    // User options for assignee filter - only show users that have closed items
    const userOptions = $derived.by((): SelectOption[] => {
        // Extract all unique assignee_id and owner_id values from closed items
        const assigneeIds = new Set<string>();
        allClosedItems.forEach((item) => {
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

        // Filter users to only include those with closed items
        const options: SelectOption[] = users
            .filter((user: PocketBaseUser) => assigneeIds.has(user.id))
            .map((user: PocketBaseUser) => ({
                value: user.id,
                label: formatUserName(user),
            }));

        // Add "Niet toegewezen" option only if there are items without assignee
        const hasUnassignedItems = allClosedItems.some(
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
    const projectOptions = $derived.by((): SelectOption[] => {
        return projects.map((project: Project) => ({
            value: String(project.id),
            label: project.name,
        }));
    });

    // Tags options - extract unique tags from closed items
    const tagOptions = $derived.by((): SelectOption[] => {
        const tagSet = new Set<string>();
        allClosedItems.forEach((item) => {
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
            return allClosedItems.some((item) => {
                const itemDeadline = item.deadline || item.due_date;
                if (!itemDeadline) return false;
                const deadlineDate = new Date(itemDeadline);
                deadlineDate.setHours(0, 0, 0, 0);
                return deadlineDate >= today && deadlineDate <= endDate;
            });
        };

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

    const currentUserId = getCurrentUserId();

    // Count active filters
    const activeFilterCount = $derived.by(() => {
        let count = 0;

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

        // Tags filter
        if (filterTags.length > 0) count++;

        // Priority filter
        if (filterPriority.length > 0) count++;

        return count;
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

    // Helper function to parse comma-separated URL param values
    function parseUrlParam(param: string | null): string[] {
        if (!param) return [];
        return param
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
    }

    onMount(async () => {
        // Load all closed items for filtering/searching
        await loadAllClosedItems();

        // Load process tasks (if not in SSR data)
        await loadProcessTasks();

        // Load project memberships
        await loadProjectMemberships();

        // Refresh AOS after page loads to detect elements already in viewport
        if (browser) {
            setTimeout(async () => {
                await refreshAOS();
            }, 500);
        }
    });

    async function loadAllClosedItems() {
        navigationStore.startPageLoading();
        const userId = getCurrentUserId();

        const result = await taskService.getClosedUnifiedItems(userId);

        if (result.success) {
            allClosedItems = result.value;
            // Update closedItems to show last 50 initially
            closedItems = allClosedItems.slice(0, 50);
            totalCount = allClosedItems.length;
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }

        initialLoadComplete = true;
        navigationStore.stopPageLoading();
    }

    async function loadUsers() {
        const result = await pocketbaseService.getAllUsers();
        if (result.success) {
            users = result.value;
        }
    }

    async function loadProjects() {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return;
        const result = await projectService.getProjectsForUser(currentUserId);
        if (result.success) {
            projects = result.value;
        }
    }

    async function loadProjectMemberships() {
        const currentUserId = $authStore?.user?.id;
        if (!currentUserId) return;

        // Fetch membership for each project
        for (const project of projects) {
            try {
                const response = await fetch(
                    `/api/projects/${project.id}/members`,
                );
                if (response.ok) {
                    const members = await response.json();
                    const userMembership = members.find(
                        (m: any) => m.user_id === currentUserId,
                    );
                    projectMemberships.set(project.id, {
                        isMember: !!userMembership,
                        isOwner: userMembership?.is_owner || false,
                    });
                } else {
                    projectMemberships.set(project.id, {
                        isMember: false,
                        isOwner: false,
                    });
                }
            } catch (err) {
                projectMemberships.set(project.id, {
                    isMember: false,
                    isOwner: false,
                });
            }
        }
    }

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

    async function loadProcessTasks() {
        // Load all process tasks to get names and descriptions
        const result = await queryTableResult<{
            id: number;
            name: string;
            description: string | null;
        }>("_bpm_process_tasks", {
            order: "id.asc",
        });
        if (result.success) {
            const taskMap = new Map<
                number,
                { name: string; description: string | null }
            >();
            result.value.data.forEach((task) => {
                taskMap.set(task.id, {
                    name: task.name,
                    description: task.description,
                });
            });
            processTasks = taskMap;
        }
    }

    function openEditDrawer(item: UnifiedBacklogItem) {
        // Check if user can access this item's project
        if (item.project_id && !canAccessProject(item.project_id)) {
            toastStore.add("You do not have access to this project", "error");
            return;
        }

        // Navigate based on item type - closed items are read-only
        if (item.type === "case_task" && item.case_id) {
            // Navigate to case detail for case tasks with readonly param
            goto(`/cases/${item.case_id}?readonly=true`);
        } else {
            // Navigate to work item detail page for work items with readonly param
            goto(`/work/${item.id}?readonly=true`);
        }
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
            kanban_status: item.kanban_status || "afgesloten",
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

    // Filter closed items based on search query and filters
    const filteredClosedItems = $derived.by(() => {
        let items = allClosedItems;

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

        // Filter by deadline
        if (filterDeadline) {
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
                            // Search case names for those cases
                            if (item.type !== "case_task" || !item.case_id)
                                return false;

                            const caseItem = caseMap.get(item.case_id);
                            if (!caseItem) return false;

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

    // Sync filter state from URL params (reactive to URL changes)
    $effect(() => {
        // Don't sync from URL if user is actively typing
        if (isTyping) return;

        const urlParams = $page.url.searchParams;
        updatingFromUrl = true;

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
        } finally {
            updatingFromUrl = false;
        }
    });

    // Sync temporary filters with applied filters when drawer opens
    $effect(() => {
        if (searchDrawerOpen) {
            tempSearchQuery = searchQuery;
            tempSearchScope = searchScope;
            tempFilterAssignee = [...filterAssignee];
            tempFilterTaskType = [...filterTaskType];
            tempFilterKomtVan = [...filterKomtVan];
            tempFilterDeadline = filterDeadline;
            tempFilterProject = filterProject;
            tempFilterTags = [...filterTags];
            tempFilterPriority = [...filterPriority];
        }
    });

    // Apply filters function - called when "Tonen" button is clicked
    async function applyFilters() {
        searchQuery = tempSearchQuery;
        searchScope = tempSearchScope;
        filterAssignee = [...tempFilterAssignee];
        filterTaskType = [...tempFilterTaskType];
        filterKomtVan = [...tempFilterKomtVan];
        filterDeadline = tempFilterDeadline;
        filterProject = tempFilterProject;
        filterTags = [...tempFilterTags];
        filterPriority = [...tempFilterPriority];
        currentPage = 1; // Reset to first page

        // Build URL with all filter params (excluding drawer)
        const params: string[] = [];

        // Update search query
        if (searchQuery) {
            params.push(`search=${encodeURIComponent(searchQuery)}`);
        }

        // Update search scope
        if (searchScope !== "alle") {
            params.push(`scope=${searchScope}`);
        }

        // Update assignee filter
        if (filterAssignee.length > 0) {
            params.push(`assignee=${filterAssignee.join(",")}`);
        }

        // Update task type filter
        if (filterTaskType.length > 0) {
            params.push(`taskType=${filterTaskType.join(",")}`);
        }

        // Update komt van filter
        if (filterKomtVan.length > 0) {
            params.push(
                `komtVan=${filterKomtVan.map((v) => encodeURIComponent(v)).join(",")}`,
            );
        }

        // Update deadline filter
        if (filterDeadline) {
            params.push(`deadline=${filterDeadline}`);
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

    function handleResetFilters() {
        // Reset temporary filters
        tempSearchQuery = "";
        tempSearchScope = "alle";
        tempFilterAssignee = [];
        tempFilterTaskType = [];
        tempFilterKomtVan = [];
        tempFilterDeadline = null;
        tempFilterProject = null;
        tempFilterTags = [];
        tempFilterPriority = [];

        // Apply the reset (immediately apply empty filters)
        searchQuery = "";
        searchScope = "alle";
        filterAssignee = [];
        filterTaskType = [];
        filterKomtVan = [];
        filterDeadline = null;
        filterProject = null;
        filterTags = [];
        filterPriority = [];
        currentPage = 1; // Reset to first page

        // Reset filters by navigating to URL without them
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.delete("search");
        urlParams.delete("scope");
        urlParams.delete("assignee");
        urlParams.delete("taskType");
        urlParams.delete("komtVan");
        urlParams.delete("deadline");

        const queryString = urlParams.toString();
        const newUrl = queryString ? `?${queryString}` : $page.url.pathname;
        goto(newUrl, { replaceState: true, noScroll: true });
    }

    // Pagination state - 50 items per page
    const itemsPerPage = 50;
    let currentPage = $state(1);

    // Calculate total pages
    const totalPages = $derived(
        Math.ceil(filteredClosedItems.length / itemsPerPage),
    );

    // Get paginated items for current page
    const paginatedItems = $derived.by(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredClosedItems.slice(startIndex, endIndex);
    });

    // Reset to page 1 when filters change
    $effect(() => {
        // Watch filteredClosedItems length changes
        void filteredClosedItems.length;
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

    // Calculate total hours from filtered items
    const totalHours = $derived.by(() => {
        return filteredClosedItems.reduce(
            (sum, item) => sum + (item.uren || 0),
            0,
        );
    });

    // Format active filters as subtitle
    const activeFiltersSubtitle = $derived.by(() => {
        const filters: string[] = [];

        // Search query
        if (searchQuery && searchQuery.trim()) {
            filters.push(`Zoek: "${searchQuery}"`);
        }

        // Assignee filter
        if (filterAssignee.length > 0) {
            const assigneeNames = filterAssignee
                .map((id) => {
                    if (id === "__unassigned__") return "Niet toegewezen";
                    const user = users.find((u: PocketBaseUser) => u.id === id);
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
            const komtVanLabels = filterKomtVan.map((kv) =>
                kv === "__null__" ? "Onbekend" : kv,
            );
            filters.push(`Komt van: ${komtVanLabels.join(", ")}`);
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
</script>

<svelte:head>
    <title>Archief - Afgesloten Taken</title>
</svelte:head>

<div class="h-full overflow-y-auto">
    <div class="container mx-auto px-4 py-8 max-w-[90vw]">
        <div class="space-y-6">
            <!-- Navigation Card with Search -->
            <NavCard
                title="Archief"
                subtitle={initialLoadComplete
                    ? `${filteredClosedItems.length} taken in ${totalHours} uur${activeFiltersSubtitle ? ` • ${activeFiltersSubtitle}` : ""}`
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
            />

            {#if !initialLoadComplete}
                <!-- Loading state is handled by global loader -->
            {:else if allClosedItems.length === 0}
                <div class="text-center py-12">
                    <p class="text-zinc-500">Geen afgesloten taken gevonden</p>
                </div>
            {:else if filteredClosedItems.length === 0}
                <div class="text-center py-12">
                    <p class="text-zinc-500">
                        Geen items gevonden met de huidige filters
                    </p>
                </div>
            {:else}
                <!-- Closed Items - Work Items and Case Tasks as Cards -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch"
                    data-aos-id-closed-cards
                >
                    {#each paginatedItems as item, index (item.type + "-" + item.id)}
                        {@const planningItem = convertToPlanningItem(item)}
                        {@const hasAccess = item.project_id
                            ? canAccessProject(item.project_id)
                            : true}
                        <div
                            class="h-full"
                            data-aos="fade-up"
                            data-aos-anchor="[data-aos-id-closed-cards]"
                            data-aos-delay={index * 50}
                        >
                            <WorkItemCard
                                workItem={planningItem}
                                draggable={false}
                                onclick={() => openEditDrawer(item)}
                                showStatusButtons={false}
                                disabled={!hasAccess}
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
                            totalItems={filteredClosedItems.length}
                            {itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
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
                        placeholder="Zoek in taken..."
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

            <!-- Apply Button and Selection Count -->
            <div class="mt-4 flex items-center justify-between">
                <div class="text-xs text-zinc-600">
                    {#if tempSearchQuery || tempFilterAssignee.length > 0 || tempFilterTaskType.length > 0 || tempFilterKomtVan.length > 0 || tempFilterDeadline || tempFilterProject !== null || tempFilterTags.length > 0 || tempFilterPriority.length > 0}
                        Selectie: {tempFilterAssignee.length +
                            tempFilterTaskType.length +
                            tempFilterKomtVan.length +
                            (tempFilterDeadline ? 1 : 0) +
                            (tempFilterProject !== null ? 1 : 0) +
                            tempFilterTags.length +
                            tempFilterPriority.length +
                            (tempSearchQuery ? 1 : 0)} filter{tempFilterAssignee.length +
                            tempFilterTaskType.length +
                            tempFilterKomtVan.length +
                            (tempFilterDeadline ? 1 : 0) +
                            (tempFilterProject !== null ? 1 : 0) +
                            tempFilterTags.length +
                            tempFilterPriority.length +
                            (tempSearchQuery ? 1 : 0) !==
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
