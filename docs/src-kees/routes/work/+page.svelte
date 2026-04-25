<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import Kanban from "$lib/components/Kanban.svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Button from "$lib/components/Button.svelte";
    import NavCard from "$lib/components/NavCard.svelte";
    import { Drawer, DateRangePicker } from "$lib/components";
    import BacklogDrawer from "$lib/components/BacklogDrawer.svelte";
    import CaseTaskDrawer from "$lib/components/CaseTaskDrawer.svelte";
    import { Search, Eraser, List } from "lucide-svelte";
    import { formatUserName } from "$lib/utils/userUtils";
    import type { UnifiedPlanningItem } from "$lib/services/taskService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Project } from "$lib/schemas/project";
    import type { Process } from "$lib/services/processService";
    import type { Case } from "$lib/services/caseService";
    import { taskStore } from "$lib/stores/taskStore";

    // Get SSR data from page
    let { data }: { data: PageData } = $props();

    // Use SSR data immediately for instant render
    let planningItems = $state<UnifiedPlanningItem[]>(data.planningItems || []);
    let users = $state<PocketBaseUser[]>(data.users || []);
    let projects = $state<Project[]>(data.projects || []);
    let processes = $state<Process[]>(data.processes || []);
    let cases = $state<Case[]>(data.cases || []);

    // Initialize filters from SSR data (applied filters)
    let searchQuery = $state<string>(data.filters?.search || "");

    // Derive search drawer state from URL params
    const searchDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "search",
    );
    let searchScope = $state<string>(data.filters?.scope || "alle");
    let filterAssignee = $state<string[]>(data.filters?.assignee || []);
    let filterProject = $state<number | null>(data.filters?.project || null);
    let filterProcesses = $state<number[]>(data.filters?.processes || []);
    let filterCases = $state<number[]>(data.filters?.cases || []);
    let filterDateFrom = $state<string | null>(data.filters?.dateFrom || null);
    let filterDateTo = $state<string | null>(data.filters?.dateTo || null);
    let filterTags = $state<string[]>(
        ((data.filters as Record<string, unknown>)?.tags as string[]) || [],
    );
    let filterPriority = $state<string[]>(
        ((data.filters as Record<string, unknown>)?.priority as string[]) || [],
    );

    // Temporary filter state (before applying)
    let tempSearchQuery = $state("");
    let tempSearchScope = $state("alle");
    let tempFilterAssignee = $state<string[]>([]);
    let tempFilterProject = $state<number | null>(null);
    let tempFilterProcesses = $state<number[]>([]);
    let tempFilterCases = $state<number[]>([]);
    let tempFilterDateFrom = $state<string | null>(null);
    let tempFilterDateTo = $state<string | null>(null);
    let tempFilterTags = $state<string[]>([]);
    let tempFilterPriority = $state<string[]>([]);

    // Track open state for each select to manage z-index
    let assigneeSelectOpen = $state(false);
    let projectSelectOpen = $state(false);
    let processSelectOpen = $state(false);
    let caseSelectOpen = $state(false);
    let tagsSelectOpen = $state(false);
    let prioritySelectOpen = $state(false);
    let dateRangePickerOpen = $state(false);

    // Use taskStore for reactive updates (after SSR)
    const storeData = $state(taskStore.getValue());
    taskStore.subscribe((storeData) => {
        console.log("[work/+page] Store subscription triggered");
        console.log(
            "[work/+page] Store planningItems.length:",
            storeData.planningItems.length,
        );
        console.log("[work/+page] Store loading:", storeData.loading);

        // Log assignee_id for first few items to debug
        if (storeData.planningItems.length > 0) {
            console.log(
                "[work/+page] First 3 items assignee_id:",
                storeData.planningItems.slice(0, 3).map((item) => ({
                    id: item.id,
                    assignee_id: item.assignee_id,
                    subject: item.subject,
                })),
            );
        }

        storeData.planningItems = storeData.planningItems;
        storeData.loading = storeData.loading;
        // Update local state from store (for real-time updates)
        const oldLength = planningItems.length;
        planningItems = storeData.planningItems;
        console.log(
            "[work/+page] Updated local planningItems from",
            oldLength,
            "to",
            planningItems.length,
        );

        // Log if any items have assignee_id
        const itemsWithAssignees = planningItems.filter((item) => {
            if (Array.isArray(item.assignee_id)) {
                return item.assignee_id.length > 0;
            }
            return item.assignee_id && item.assignee_id !== "";
        });
        console.log(
            "[work/+page] Items with assignees:",
            itemsWithAssignees.length,
            "out of",
            planningItems.length,
        );
    });

    // Assignee filter for Kanban - null means show all (client-side filtering handles the rest)
    const assigneeFilter = $derived(null);

    // Derive showOverdueOnly from URL
    const showOverdueOnly = $derived(
        $page.url.searchParams.get("status") === "overdue",
    );

    function handleEditPlanningItem(item: UnifiedPlanningItem) {
        // Navigate to the full page view
        goto(`/work/${item.id}`);
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

    // Note: users and projects are already loaded from SSR data

    // User options for assignee filter
    const userOptions = $derived.by((): SelectOption[] => {
        return users.map((user) => ({
            value: user.id,
            label: formatUserName(user),
        }));
    });

    // Project options for project filter
    const projectOptions = $derived.by((): SelectOption[] => {
        return projects.map((project) => ({
            value: String(project.id),
            label: project.name,
        }));
    });

    // Process options for process filter
    const processOptions = $derived.by((): SelectOption[] => {
        return processes.map((process) => ({
            value: String(process.id),
            label: process.name,
        }));
    });

    // Case options filtered by selected processes
    const caseOptions = $derived.by((): SelectOption[] => {
        let filteredCases = cases;

        // If processes are selected, filter cases by those processes
        if (filterProcesses.length > 0) {
            filteredCases = filteredCases.filter((caseItem) =>
                filterProcesses.includes(caseItem.process_id),
            );
        }

        return filteredCases.map((caseItem) => ({
            value: String(caseItem.id),
            label: caseItem.name,
        }));
    });

    // Tags options - extract unique tags from planning items
    const tagOptions = $derived.by((): SelectOption[] => {
        const tagSet = new Set<string>();
        planningItems.forEach((item) => {
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

    // Labels for filters
    const assigneeLabel = $derived.by(() => {
        if (filterAssignee.length === 0) return "Alle gebruikers";
        if (filterAssignee.length === 1) {
            const user = users.find((u) => u.id === filterAssignee[0]);
            return user ? formatUserName(user) : "Alle gebruikers";
        }
        return `${filterAssignee.length} gebruikers geselecteerd`;
    });

    const projectLabel = $derived.by(() => {
        if (!filterProject) return "Alle projecten";
        const project = projects.find((p) => p.id === filterProject);
        return project?.name || "Alle projecten";
    });

    const processLabel = $derived.by(() => {
        if (filterProcesses.length === 0) return "Alle processen";
        if (filterProcesses.length === 1) {
            const process = processes.find((p) => p.id === filterProcesses[0]);
            return process?.name || "Alle processen";
        }
        return `${filterProcesses.length} processen geselecteerd`;
    });

    const caseLabel = $derived.by(() => {
        if (filterCases.length === 0) return "Alle cases";
        if (filterCases.length === 1) {
            const caseItem = cases.find((c) => c.id === filterCases[0]);
            return caseItem?.name || "Alle cases";
        }
        return `${filterCases.length} cases geselecteerd`;
    });

    // Temporary labels for drawer (using temp state)
    const tempAssigneeLabel = $derived.by(() => {
        if (tempFilterAssignee.length === 0) return "Alle gebruikers";
        if (tempFilterAssignee.length === 1) {
            const user = users.find((u) => u.id === tempFilterAssignee[0]);
            return user ? formatUserName(user) : "Alle gebruikers";
        }
        return `${tempFilterAssignee.length} gebruikers geselecteerd`;
    });

    const tempProjectLabel = $derived.by(() => {
        if (!tempFilterProject) return "Alle projecten";
        const project = projects.find((p) => p.id === tempFilterProject);
        return project?.name || "Alle projecten";
    });

    const tempProcessLabel = $derived.by(() => {
        if (tempFilterProcesses.length === 0) return "Alle processen";
        if (tempFilterProcesses.length === 1) {
            const process = processes.find(
                (p) => p.id === tempFilterProcesses[0],
            );
            return process?.name || "Alle processen";
        }
        return `${tempFilterProcesses.length} processen geselecteerd`;
    });

    const tempCaseLabel = $derived.by(() => {
        if (tempFilterCases.length === 0) return "Alle cases";
        if (tempFilterCases.length === 1) {
            const caseItem = cases.find((c) => c.id === tempFilterCases[0]);
            return caseItem?.name || "Alle cases";
        }
        return `${tempFilterCases.length} cases geselecteerd`;
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

        // Project filter
        if (filterProject !== null) count++;

        // Assignee filter
        if (filterAssignee.length > 0) count++;

        // Process filter
        if (filterProcesses.length > 0) count++;

        // Case filter
        if (filterCases.length > 0) count++;

        // Tags filter
        if (filterTags.length > 0) count++;

        // Priority filter
        if (filterPriority.length > 0) count++;

        return count;
    });

    // Map of case_id -> { process_id } for filtering
    const casesMap = $derived.by(() => {
        const map = new Map<number, { process_id: number }>();
        cases.forEach((caseItem) => {
            map.set(caseItem.id, { process_id: caseItem.process_id });
        });
        return map;
    });

    // Filter planning items using the same logic as Kanban
    const filteredPlanningItems = $derived.by(() => {
        let filteredItems = planningItems;

        // Date range filter (applied first)
        if (filterDateFrom || filterDateTo) {
            filteredItems = filteredItems.filter((item) => {
                const deadline = item.deadline || item.due_date;
                if (!deadline) return false;

                const itemDate = new Date(deadline);
                const fromDate = filterDateFrom
                    ? new Date(filterDateFrom)
                    : null;
                const toDate = filterDateTo ? new Date(filterDateTo) : null;

                if (fromDate && itemDate < fromDate) return false;
                if (toDate && itemDate > toDate) return false;

                return true;
            });
        }

        // Filter by project
        if (filterProject !== null) {
            filteredItems = filteredItems.filter((item) => {
                return item.project_id === filterProject;
            });
        }

        // Filter by assignee
        if (filterAssignee && filterAssignee.length > 0) {
            filteredItems = filteredItems.filter((item) => {
                return filterAssignee.some((assigneeId) => {
                    if (Array.isArray(item.assignee_id)) {
                        return item.assignee_id.includes(assigneeId);
                    } else if (item.assignee_id === assigneeId) {
                        return true;
                    }
                    return item.owner_id === assigneeId;
                });
            });
        }

        // Filter by processes
        if (filterProcesses && filterProcesses.length > 0) {
            filteredItems = filteredItems.filter((item) => {
                if (item.type === "case_task" && item.case_id) {
                    const caseData = casesMap.get(item.case_id);
                    if (caseData) {
                        return filterProcesses.includes(caseData.process_id);
                    }
                    return false;
                }
                return false;
            });
        }

        // Filter by cases
        if (filterCases && filterCases.length > 0) {
            filteredItems = filteredItems.filter((item) => {
                if (item.type === "case_task" && item.case_id) {
                    return filterCases.includes(item.case_id);
                }
                return false;
            });
        }

        // Filter by tags
        if (filterTags && filterTags.length > 0) {
            filteredItems = filteredItems.filter((item) => {
                if (!item.tags || !Array.isArray(item.tags)) return false;
                return filterTags.some((tag) => item.tags?.includes(tag));
            });
        }

        // Filter by priority
        if (filterPriority && filterPriority.length > 0) {
            filteredItems = filteredItems.filter((item) => {
                const itemPriority = (item as any).priority || "normaal";
                return filterPriority.includes(itemPriority);
            });
        }

        // Filter by search query
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filteredItems = filteredItems.filter((item) => {
                const matchesInScope = (scope: string): boolean => {
                    switch (scope) {
                        case "alle":
                            const allFields = [
                                item.subject,
                                item.case_name,
                                item.name,
                                item.wat_ga_je_doen,
                                item.waarom_doe_je_het,
                                item.voor_wie_is_het,
                                item.komt_van,
                                ...((item.tags || []) as string[]),
                            ];
                            return allFields.some((field) =>
                                field?.toLowerCase().includes(query),
                            );

                        case "taken":
                            const taskFields = [
                                item.subject,
                                item.name,
                                item.wat_ga_je_doen,
                                item.waarom_doe_je_het,
                            ];
                            return taskFields.some((field) =>
                                field?.toLowerCase().includes(query),
                            );

                        case "personen":
                            const personFields = [
                                item.voor_wie_is_het,
                                item.komt_van,
                            ];
                            return personFields.some((field) =>
                                field?.toLowerCase().includes(query),
                            );

                        default:
                            return false;
                    }
                };

                return matchesInScope(searchScope);
            });
        }

        return filteredItems;
    });

    // Calculate total hours from filtered items
    const totalHours = $derived.by(() => {
        return filteredPlanningItems.reduce(
            (sum, item) => sum + (item.uren || 0),
            0,
        );
    });

    // Format date for display
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
                    const user = users.find((u) => u.id === id);
                    return user ? formatUserName(user) : "Onbekend";
                })
                .join(", ");
            filters.push(`Gebruiker: ${assigneeNames}`);
        }

        // Project filter
        if (filterProject !== null) {
            const project = projects.find((p) => p.id === filterProject);
            if (project) {
                filters.push(`Project: ${project.name}`);
            }
        }

        // Process filter
        if (filterProcesses.length > 0) {
            const processNames = filterProcesses
                .map((id) => {
                    const process = processes.find((p) => p.id === id);
                    return process?.name || "Onbekend";
                })
                .join(", ");
            filters.push(`Proces: ${processNames}`);
        }

        // Case filter
        if (filterCases.length > 0) {
            const caseNames = filterCases
                .map((id) => {
                    const caseItem = cases.find((c) => c.id === id);
                    return caseItem?.name || "Onbekend";
                })
                .join(", ");
            filters.push(`Case: ${caseNames}`);
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

        return filters.length > 0 ? filters.join(" • ") : "";
    });

    // Sync temporary filters with applied filters when drawer opens
    $effect(() => {
        if (searchDrawerOpen) {
            tempSearchQuery = searchQuery;
            tempSearchScope = searchScope;
            tempFilterAssignee = [...filterAssignee];
            tempFilterProject = filterProject;
            tempFilterProcesses = [...filterProcesses];
            tempFilterCases = [...filterCases];
            tempFilterDateFrom = filterDateFrom;
            tempFilterDateTo = filterDateTo;
            tempFilterTags = [...filterTags];
            tempFilterPriority = [...filterPriority];
        }
    });

    // Apply filters function - called when "Tonen" button is clicked
    async function applyFilters() {
        searchQuery = tempSearchQuery;
        searchScope = tempSearchScope;
        filterAssignee = [...tempFilterAssignee];
        filterProject = tempFilterProject;
        filterProcesses = [...tempFilterProcesses];
        // When processes change, clear case filter if cases are no longer valid
        if (tempFilterProcesses.length > 0) {
            tempFilterCases = tempFilterCases.filter((caseId) => {
                const caseItem = cases.find((c) => c.id === caseId);
                return (
                    caseItem &&
                    tempFilterProcesses.includes(caseItem.process_id)
                );
            });
        }
        filterCases = [...tempFilterCases];
        filterDateFrom = tempFilterDateFrom;
        filterDateTo = tempFilterDateTo;
        filterTags = [...tempFilterTags];
        filterPriority = [...tempFilterPriority];

        // Build URL with all filter params (excluding drawer)
        const params: string[] = [];

        if (filterDateFrom) {
            params.push(`dateFrom=${encodeURIComponent(filterDateFrom)}`);
        }
        if (filterDateTo) {
            params.push(`dateTo=${encodeURIComponent(filterDateTo)}`);
        }
        if (searchQuery) {
            params.push(`search=${encodeURIComponent(searchQuery)}`);
        }
        if (searchScope !== "alle") {
            params.push(`scope=${searchScope}`);
        }
        if (filterProject !== null) {
            params.push(`project=${filterProject}`);
        }
        if (filterAssignee.length > 0) {
            params.push(`assignee=${filterAssignee.join(",")}`);
        }
        if (filterProcesses.length > 0) {
            params.push(`processes=${filterProcesses.join(",")}`);
        }
        if (filterCases.length > 0) {
            params.push(`cases=${filterCases.join(",")}`);
        }
        if (filterTags.length > 0) {
            params.push(
                `tags=${filterTags.map((t) => encodeURIComponent(t)).join(",")}`,
            );
        }
        if (filterPriority.length > 0) {
            params.push(`priority=${filterPriority.join(",")}`);
        }

        const queryString = params.length > 0 ? `?${params.join("&")}` : "";
        const newUrl = `${$page.url.pathname}${queryString}`;
        await goto(newUrl, { replaceState: true, noScroll: true });
    }

    onMount(() => {
        console.log("[work/+page] onMount - SSR data:", {
            planningItemsCount: data.planningItems.length,
            errors: data.errors,
        });

        // Initialize store with SSR data (if available)
        if (data.planningItems.length > 0) {
            console.log("[work/+page] Initializing store with SSR data");
            taskStore.initialize(data.planningItems, []);
        } else {
            // If SSR data is empty, try to load from client-side
            // This handles cases where server-side load failed
            console.log(
                "[work/+page] SSR data empty, loading from client-side",
            );
            if (data.errors?.planning) {
                console.error(
                    "[work/+page] SSR planning error:",
                    data.errors.planning,
                );
            }
            taskStore
                .getPlanningItems(null, false)
                .then((items) => {
                    console.log(
                        "[work/+page] Client-side load result:",
                        items.length,
                        "items",
                    );
                    if (items.length > 0) {
                        planningItems = items;
                    }
                })
                .catch((err) => {
                    console.error(
                        "[work/+page] Error loading planning items:",
                        err,
                    );
                });
        }

        // Start polling for work items (background sync)
        taskStore.startPolling(30000, null); // /work shows all work
    });

    // Helper function to parse comma-separated URL param values
    function parseUrlParam(param: string | null): string[] {
        if (!param) return [];
        return param
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
    }

    // Helper function to build URL with current filter state
    function updateUrlFromFilters() {
        const params: string[] = [];

        // Add filter params
        if (filterDateFrom) {
            params.push(`dateFrom=${encodeURIComponent(filterDateFrom)}`);
        }
        if (filterDateTo) {
            params.push(`dateTo=${encodeURIComponent(filterDateTo)}`);
        }
        if (searchQuery) {
            params.push(`search=${encodeURIComponent(searchQuery)}`);
        }
        if (searchScope !== "alle") {
            params.push(`scope=${searchScope}`);
        }
        if (filterProject !== null) {
            params.push(`project=${filterProject}`);
        }
        if (filterAssignee.length > 0) {
            params.push(`assignee=${filterAssignee.join(",")}`);
        }
        if (filterProcesses.length > 0) {
            params.push(`processes=${filterProcesses.join(",")}`);
        }
        if (filterCases.length > 0) {
            params.push(`cases=${filterCases.join(",")}`);
        }
        if (filterTags.length > 0) {
            params.push(
                `tags=${filterTags.map((t) => encodeURIComponent(t)).join(",")}`,
            );
        }
        if (filterPriority.length > 0) {
            params.push(`priority=${filterPriority.join(",")}`);
        }

        const queryString = params.length > 0 ? `?${params.join("&")}` : "";
        const newUrl = `${$page.url.pathname}${queryString}`;
        const currentUrl = `${$page.url.pathname}${$page.url.search}`;

        if (newUrl !== currentUrl) {
            goto(newUrl, { replaceState: true, noScroll: true });
        }
    }

    function handleAssigneeChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterAssignee = value;
        } else if (value === null) {
            tempFilterAssignee = [];
        } else {
            if (tempFilterAssignee.includes(value)) {
                tempFilterAssignee = tempFilterAssignee.filter(
                    (id) => id !== value,
                );
            } else {
                tempFilterAssignee = [...tempFilterAssignee, value];
            }
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

    function handleProcessChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterProcesses = value
                .map((v) => parseInt(v))
                .filter((id) => !isNaN(id));
        } else if (value === null) {
            tempFilterProcesses = [];
        } else {
            const processId = parseInt(value);
            if (!isNaN(processId)) {
                // Toggle process: if already selected, remove it; otherwise add it
                if (tempFilterProcesses.includes(processId)) {
                    tempFilterProcesses = tempFilterProcesses.filter(
                        (id) => id !== processId,
                    );
                } else {
                    tempFilterProcesses = [...tempFilterProcesses, processId];
                }
            }
        }
        // When processes change, clear case filter if cases are no longer valid
        if (tempFilterProcesses.length > 0) {
            tempFilterCases = tempFilterCases.filter((caseId) => {
                const caseItem = cases.find((c) => c.id === caseId);
                return (
                    caseItem &&
                    tempFilterProcesses.includes(caseItem.process_id)
                );
            });
        }
    }

    function handleCaseChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempFilterCases = value
                .map((v) => parseInt(v))
                .filter((id) => !isNaN(id));
        } else if (value === null) {
            tempFilterCases = [];
        } else {
            const caseId = parseInt(value);
            if (!isNaN(caseId)) {
                // Toggle case: if already selected, remove it; otherwise add it
                if (tempFilterCases.includes(caseId)) {
                    tempFilterCases = tempFilterCases.filter(
                        (id) => id !== caseId,
                    );
                } else {
                    tempFilterCases = [...tempFilterCases, caseId];
                }
            }
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

    function handleDateRangeChange(from: string | null, to: string | null) {
        tempFilterDateFrom = from;
        tempFilterDateTo = to;
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
        tempFilterProject = null;
        tempFilterProcesses = [];
        tempFilterCases = [];
        tempFilterDateFrom = null;
        tempFilterDateTo = null;
        tempFilterTags = [];
        tempFilterPriority = [];

        // Apply the reset (immediately apply empty filters)
        searchQuery = "";
        searchScope = "alle";
        filterAssignee = [];
        filterProject = null;
        filterProcesses = [];
        filterCases = [];
        filterDateFrom = null;
        filterDateTo = null;
        filterTags = [];
        filterPriority = [];

        // Clear URL params
        goto($page.url.pathname, { replaceState: true, noScroll: true });
    }

    function handleNavigateToBacklog() {
        goto("/work/backlog");
    }
</script>

<svelte:head>
    <title
        >{showOverdueOnly ? "Te Late Taken" : "Ons Werk"} - Business Process Management</title
    >
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw] relative">
    <div class="space-y-6">
        <!-- Navigation Card with Search -->
        <NavCard
            title="Werkbord"
            subtitle={planningItems.length > 0
                ? `${filteredPlanningItems.length} taken in ${totalHours} uur${activeFiltersSubtitle ? ` • ${activeFiltersSubtitle}` : ""}`
                : undefined}
            actions={[
                {
                    icon: Search,
                    label: "Zoeken & Filteren",
                    onclick: handleOpenSearchDrawer,
                    variant: "ghost",
                    badgeCount: activeFilterCount,
                },
                {
                    icon: List,
                    label: "Bekijk backlog",
                    onclick: handleNavigateToBacklog,
                    variant: "ghost",
                },
            ]}
            class="w-full !py-3 !px-6"
        />

        <!-- Kanban Board -->
        <Kanban
            {assigneeFilter}
            {showOverdueOnly}
            onitemclick={handleEditPlanningItem}
            {searchQuery}
            {searchScope}
            {filterAssignee}
            {filterProject}
            {filterProcesses}
            {filterCases}
            {filterDateFrom}
            {filterDateTo}
        />
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
                            { value: "taken", label: "Taken" },
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

                <!-- Project Filter -->
                <div
                    class="lg:col-span-1 relative {projectSelectOpen
                        ? 'z-[200]'
                        : 'z-[110]'}"
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

                <!-- Process Filter -->
                <div
                    class="lg:col-span-1 relative {processSelectOpen
                        ? 'z-[200]'
                        : 'z-[120]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Proces
                        {#if tempFilterProcesses.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterProcesses.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterProcesses.map((p) =>
                            p.toString(),
                        )}
                        options={processOptions}
                        placeholder={tempProcessLabel}
                        onchange={handleProcessChange}
                        isActive={tempFilterProcesses.length > 0}
                        class="w-full"
                        searchable={true}
                        bind:open={processSelectOpen}
                    />
                </div>

                <!-- Case Filter -->
                <div
                    class="lg:col-span-1 relative {caseSelectOpen
                        ? 'z-[200]'
                        : 'z-[130]'}"
                >
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Case
                        {#if tempFilterCases.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempFilterCases.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempFilterCases.map((c) =>
                            c.toString(),
                        )}
                        options={caseOptions}
                        placeholder={tempCaseLabel}
                        onchange={handleCaseChange}
                        isActive={tempFilterCases.length > 0}
                        class="w-full"
                        searchable={true}
                        bind:open={caseSelectOpen}
                    />
                </div>

                <!-- Tags Filter -->
                <div
                    class="lg:col-span-1 relative {tagsSelectOpen
                        ? 'z-[200]'
                        : 'z-[140]'}"
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
                        : 'z-[150]'}"
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
                    {#if tempSearchQuery || tempFilterDateFrom || tempFilterDateTo || tempFilterAssignee.length > 0 || tempFilterProject !== null || tempFilterProcesses.length > 0 || tempFilterCases.length > 0 || tempFilterTags.length > 0 || tempFilterPriority.length > 0}
                        Selectie: {tempFilterAssignee.length +
                            (tempFilterProject !== null ? 1 : 0) +
                            tempFilterProcesses.length +
                            tempFilterCases.length +
                            tempFilterTags.length +
                            tempFilterPriority.length +
                            (tempSearchQuery ? 1 : 0) +
                            (tempFilterDateFrom || tempFilterDateTo ? 1 : 0)} filter{tempFilterAssignee.length +
                            (tempFilterProject !== null ? 1 : 0) +
                            tempFilterProcesses.length +
                            tempFilterCases.length +
                            tempFilterTags.length +
                            tempFilterPriority.length +
                            (tempSearchQuery ? 1 : 0) +
                            (tempFilterDateFrom || tempFilterDateTo ? 1 : 0) !==
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

<!-- Work Item Drawer (handles drawer=workitem&workItemId=X) -->
<BacklogDrawer />

<!-- Case Task Drawer (handles drawer=casetask&caseTaskId=X) -->
<CaseTaskDrawer />
