<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { goto, invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import type { PageData } from "./$types";
    import * as caseService from "$lib/services/caseService";
    import * as processService from "$lib/services/processService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import { formatDate } from "$lib/services/deadlineService";
    import { formatUserName, getCurrentUserId } from "$lib/utils/userUtils";
    import { translateStatus } from "$lib/utils/statusTranslations";
    import { queryTableResult, getRowByIdResult } from "$lib/utils/postgrest";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import { caseStore } from "$lib/stores/caseStore";
    import { processStore } from "$lib/stores/processStore";
    import type { Case, CaseTask } from "$lib/services/caseService";
    import type { Process } from "$lib/services/processService";
    import type { Project } from "$lib/services/projectService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import Button from "$lib/components/Button.svelte";
    import UserSelector from "$lib/components/UserSelector.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import Label from "$lib/components/Label.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import SearchInput, {
        type SearchSuggestion,
    } from "$lib/components/SearchInput.svelte";
    import Toggle from "$lib/components/Toggle.svelte";
    import CaseDrawer from "$lib/components/CaseDrawer.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import NavCard from "$lib/components/NavCard.svelte";
    import { Drawer } from "$lib/components";
    import {
        NotepadText,
        Eraser,
        Clock,
        ClipboardList,
        CheckCircle2,
        AlertCircle,
        Search,
        Plus,
    } from "lucide-svelte";
    import { refreshAOS } from "$lib/utils/aosKit";
    import { browser } from "$app/environment";

    // Get SSR data from page
    let { data }: { data: PageData } = $props();

    // Use SSR data immediately for instant render
    let allCases = $state<Case[]>(data.cases || []);
    let processes = $state<Process[]>(data.processes || []);
    let allProcesses: Process[] = $state(data.allProcesses || []); // Includes archived processes
    let users: PocketBaseUser[] = $state(data.users || []);
    let projects = $state<Project[]>(data.projects || []);
    let userId = $state(data.userId || "");
    let isAdmin = $state(data.isAdmin || false);

    // Initialize filters from SSR data
    let searchQuery: string = $state(data.filters?.search || "");
    let searchScope = $state(data.filters?.scope || "alle");
    let selectedProcesses: number[] = $state(data.filters?.processes || []);
    let selectedProjects: number[] = $state(data.filters?.projects || []);
    let selectedStatuses: string[] = $state(data.filters?.statuses || []);
    let selectedOwners: string[] = $state(data.filters?.owners || []);

    // Use stores for reactive updates (after SSR)
    const caseStoreData = $state<{ cases: Case[]; loading: boolean }>(
        caseStore.getValue(),
    );
    console.log(
        "[CASES LIST] Store data on init. Cases count:",
        caseStoreData.cases.length,
    );
    console.log(
        "[CASES LIST] Store case IDs:",
        caseStoreData.cases.map((c) => c.id),
    );

    // Prioritize store data over SSR data if store has cases (store is more up-to-date after deletions)
    if (caseStoreData.cases.length > 0) {
        console.log(
            "[CASES LIST] Using store data (has",
            caseStoreData.cases.length,
            "cases)",
        );
        allCases = caseStoreData.cases;
        console.log(
            "[CASES LIST] allCases set to store data. Count:",
            allCases.length,
        );
        console.log(
            "[CASES LIST] allCases IDs:",
            allCases.map((c) => c.id),
        );
    } else {
        console.log("[CASES LIST] Using SSR data (store empty)");
    }

    caseStore.subscribe((storeData) => {
        console.log(
            "[CASES LIST] Store subscription fired. Cases count:",
            storeData.cases.length,
        );
        console.log(
            "[CASES LIST] Store case IDs:",
            storeData.cases.map((c) => c.id),
        );
        caseStoreData.cases = storeData.cases;
        caseStoreData.loading = storeData.loading;
        // Update local state from store (for real-time updates)
        // Always use store data when available (it's more up-to-date)
        if (storeData.cases.length > 0) {
            console.log(
                "[CASES LIST] Updating allCases from store subscription",
            );
            allCases = storeData.cases;
            console.log(
                "[CASES LIST] allCases updated. Count:",
                allCases.length,
            );
            console.log(
                "[CASES LIST] allCases IDs:",
                allCases.map((c) => c.id),
            );
        }
    });

    const processStoreData = $state(processStore.getValue());
    processStore.subscribe((storeData) => {
        processStoreData.processes = storeData.processes;
        processStoreData.loading = storeData.loading;
        // Update local state from store (for real-time updates)
        processes = storeData.processes;
    });

    // Derive loading state from stores
    const loading = $derived(caseStoreData.loading || processStoreData.loading);

    // Note: searchQuery, searchScope, selectedProcesses, selectedStatuses, and selectedOwners
    // are already initialized from SSR data above

    // Case tasks section
    let showTasksView = $state(false);
    let caseTasks = $state<CaseTask[]>([]);
    let taskCaseMap = $state<Map<number, Case>>(new Map());
    let taskProcessTaskMap = $state<Map<number, any>>(new Map()); // Map case_task_id -> process task
    let showOnlyMyTasks = $state(true);
    const currentUserId = getCurrentUserId();

    // Derive search drawer state from URL params
    const searchDrawerOpen = $derived(
        $page.url.searchParams.get("drawer") === "search",
    );

    // Temporary filter state (before applying)
    let tempSearchQuery = $state("");
    let tempSearchScope = $state("alle");
    let tempSelectedProcesses: number[] = $state([]);
    let tempSelectedProjects: number[] = $state([]);
    let tempSelectedStatuses: string[] = $state([]);
    let tempSelectedOwners: string[] = $state([]);

    // Convert processes to SelectOption format
    const processOptions = $derived.by((): SelectOption[] => {
        const options = processes.map((process) => ({
            value: process.id.toString(),
            label: process.name,
        }));
        console.log("[Cases] processOptions derived:", options.length, options);
        return options;
    });

    // Convert projects to SelectOption format
    const projectOptions = $derived.by((): SelectOption[] => {
        const options = projects.map((project) => ({
            value: project.id.toString(),
            label: project.name,
        }));
        console.log("[Cases] projectOptions derived:", options.length, options);
        return options;
    });

    // Derived values for display - show first selected or count
    const selectedProcessDisplay = $derived.by(() => {
        if (selectedProcesses.length === 0) return null;
        if (selectedProcesses.length === 1) {
            const process = processes.find(
                (p) => p.id === selectedProcesses[0],
            );
            return process?.id.toString() || null;
        }
        // For multiple, show first one (user can still toggle)
        const process = processes.find((p) => p.id === selectedProcesses[0]);
        return process?.id.toString() || null;
    });

    const selectedStatusDisplay = $derived.by(() => {
        if (selectedStatuses.length === 0) return null;
        if (selectedStatuses.length === 1) return selectedStatuses[0];
        // For multiple, show first one
        return selectedStatuses[0];
    });

    const selectedOwnerDisplay = $derived.by(() => {
        if (selectedOwners.length === 0) return null;
        if (selectedOwners.length === 1) return selectedOwners[0];
        // For multiple, show first one
        return selectedOwners[0];
    });

    // Labels showing selection counts
    const processLabel = $derived.by(() => {
        if (selectedProcesses.length === 0) return "Alle Processen";
        if (selectedProcesses.length === 1) {
            const process = processes.find(
                (p) => p.id === selectedProcesses[0],
            );
            return process?.name || "Alle Processen";
        }
        return `${selectedProcesses.length} processen geselecteerd`;
    });

    const statusLabel = $derived.by(() => {
        if (selectedStatuses.length === 0) return "Alle Statussen";
        if (selectedStatuses.length === 1) {
            const option = statusOptions.find(
                (opt) => opt.value === selectedStatuses[0],
            );
            return option?.label || "Alle Statussen";
        }
        return `${selectedStatuses.length} statussen geselecteerd`;
    });

    const ownerLabel = $derived.by(() => {
        if (selectedOwners.length === 0) return "Alle Eigenaren";
        if (selectedOwners.length === 1) {
            const user = users.find((u) => u.id === selectedOwners[0]);
            return user
                ? user.name || user.username || user.email
                : "Alle Eigenaren";
        }
        return `${selectedOwners.length} eigenaren geselecteerd`;
    });

    // Status options
    const statusOptions: SelectOption[] = [
        { value: "gepland", label: "Gepland" },
        { value: "mee_bezig", label: "Mee bezig" },
        { value: "afgerond", label: "Afgerond" },
        { value: "overdue", label: "Te laat" },
    ];

    // Generate search suggestions from all cases
    const searchSuggestions = $derived.by((): SearchSuggestion[] => {
        return allCases.map((caseItem) => {
            const process = allProcesses.find(
                (p) => p.id === caseItem.process_id,
            );
            const project = projects.find((p) => p.id === caseItem.project_id);
            const processName = process?.name || "Onbekend";
            const projectName = project?.name ? ` · ${project.name}` : "";
            const statusName = translateStatus(caseItem.status);
            return {
                value: caseItem.name,
                label: caseItem.name,
                metadata: `${processName}${projectName} · ${statusName}`,
            };
        });
    });

    // Filter cases based on search query and other filters
    const filteredCases = $derived.by(() => {
        let filtered = allCases;

        // Safety check: ensure selectedProjects is defined before using it
        if (!selectedProjects) return allCases;

        // Apply search filter with scope
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((caseItem) => {
                const process = allProcesses.find(
                    (p) => p.id === caseItem.process_id,
                );
                const project = projects.find(
                    (p) => p.id === caseItem.project_id,
                );
                const owner = users.find((u) => u.id === caseItem.owner_id);
                const ownerName = formatUserName(owner).toLowerCase();

                // Define search scope matching function
                const matchesInScope = (scope: string): boolean => {
                    switch (scope) {
                        case "alle":
                            // Search in all fields
                            return (
                                caseItem.name.toLowerCase().includes(query) ||
                                process?.name.toLowerCase().includes(query) ||
                                project?.name.toLowerCase().includes(query) ||
                                false ||
                                ownerName.includes(query) ||
                                translateStatus(caseItem.status)
                                    .toLowerCase()
                                    .includes(query)
                            );

                        case "cases":
                            // Search in case name only
                            return caseItem.name.toLowerCase().includes(query);

                        case "processen":
                            // Search in process names
                            return (
                                process?.name.toLowerCase().includes(query) ||
                                false
                            );

                        case "personen":
                            // Search in owner names
                            return ownerName.includes(query);

                        case "projecten":
                            // For cases page, search in project names
                            return (
                                project?.name.toLowerCase().includes(query) ||
                                false
                            );

                        case "taken":
                            // Cases don't have direct task info, search in case name
                            return caseItem.name.toLowerCase().includes(query);

                        default:
                            return false;
                    }
                };

                return matchesInScope(searchScope);
            });
        }

        // Apply process filter - support multiple processes
        if (selectedProcesses.length > 0) {
            filtered = filtered.filter((c) =>
                selectedProcesses.includes(c.process_id),
            );
        }

        // Apply project filter - support multiple projects
        if (selectedProjects && selectedProjects.length > 0) {
            filtered = filtered.filter(
                (c) => c.project_id && selectedProjects.includes(c.project_id),
            );
        }

        // Apply status filter - support multiple statuses
        if (selectedStatuses.length > 0) {
            filtered = filtered.filter((c) =>
                selectedStatuses.includes(c.status),
            );
        }

        // Apply owner filter - support multiple owners
        if (selectedOwners.length > 0) {
            filtered = filtered.filter(
                (c) => c.owner_id && selectedOwners.includes(c.owner_id),
            );
        }

        // Safety check: ensure selectedProjects exists before search drawer renders
        if (!selectedProjects) {
            selectedProjects = [];
        }

        // Sort by start_date first (ascending), then by completion_deadline (ascending)
        filtered = [...filtered].sort((a, b) => {
            // Compare start dates
            const startDateA = new Date(a.start_date).getTime();
            const startDateB = new Date(b.start_date).getTime();
            if (startDateA !== startDateB) {
                return startDateA - startDateB;
            }
            // If start dates are equal, compare completion deadlines
            const endDateA = new Date(a.completion_deadline).getTime();
            const endDateB = new Date(b.completion_deadline).getTime();
            return endDateA - endDateB;
        });

        return filtered;
    });

    // Helper function to parse comma-separated URL param values
    function parseUrlParam(param: string | null): string[] {
        if (!param) return [];
        return param
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
    }

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

        // Update process filter (comma-separated, no encoding needed for IDs)
        if (selectedProcesses.length > 0) {
            params.push(`process=${selectedProcesses.join(",")}`);
        }

        // Update status filter (comma-separated, no encoding needed for status values)
        if (selectedStatuses.length > 0) {
            params.push(`status=${selectedStatuses.join(",")}`);
        }

        // Update owner filter (comma-separated, no encoding needed for user IDs)
        if (selectedOwners.length > 0) {
            params.push(`owner=${selectedOwners.join(",")}`);
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

            // Read process filter
            const processParam = parseUrlParam(urlParams.get("process"));
            const processIds = processParam
                .map((p) => parseInt(p))
                .filter((id) => !isNaN(id));
            const currentProcessIds = [...selectedProcesses].sort();
            const newProcessIds = [...processIds].sort();
            if (
                JSON.stringify(currentProcessIds) !==
                JSON.stringify(newProcessIds)
            ) {
                selectedProcesses = processIds;
            }

            // Read status filter
            const statusParam = parseUrlParam(urlParams.get("status"));
            const currentStatuses = [...selectedStatuses].sort();
            const newStatuses = [...statusParam].sort();
            if (
                JSON.stringify(currentStatuses) !== JSON.stringify(newStatuses)
            ) {
                selectedStatuses = statusParam;
            }

            // Read owner filter
            const ownerParam = parseUrlParam(urlParams.get("owner"));
            const currentOwners = [...selectedOwners].sort();
            const newOwners = [...ownerParam].sort();
            if (JSON.stringify(currentOwners) !== JSON.stringify(newOwners)) {
                selectedOwners = ownerParam;
            }
        } finally {
            updatingFromUrl = false;
        }
    });

    onMount(() => {
        console.log("[CASES LIST] onMount called");
        console.log("[CASES LIST] SSR cases count:", data.cases.length);
        console.log(
            "[CASES LIST] SSR case IDs:",
            (data.cases as Case[]).map((c) => c.id),
        );

        // Initialize stores with SSR data (if not already initialized)
        // But prioritize store data if it exists (it's more up-to-date after deletions)
        const storeCases = caseStore.getValue().cases;
        console.log(
            "[CASES LIST] Store cases in onMount. Count:",
            storeCases.length,
        );
        console.log(
            "[CASES LIST] Store case IDs in onMount:",
            storeCases.map((c) => c.id),
        );

        if (storeCases.length === 0 && data.cases.length > 0) {
            // Skip initializing with SSR data if store is empty but SSR has cases
            // This indicates we just deleted a case and SSR data is stale
            // The store will be refreshed via polling, so we'll get fresh data
            console.log(
                "[CASES LIST] Skipping SSR initialization - store empty means cases were deleted",
            );
            allCases = [];
        } else if (storeCases.length > 0) {
            // Store has data - use it immediately (it's more up-to-date)
            console.log("[CASES LIST] Store has data, using it instead of SSR");
            allCases = storeCases;
            console.log(
                "[CASES LIST] allCases set in onMount. Count:",
                allCases.length,
            );
            console.log(
                "[CASES LIST] allCases IDs in onMount:",
                allCases.map((c) => c.id),
            );
        } else {
            console.log("[CASES LIST] Both store and SSR are empty");
        }

        if (
            processStore.getValue().processes.length === 0 &&
            data.processes.length > 0
        ) {
            processStore.initialize(data.processes);
        }

        // Load all processes including archived (if not in SSR data)
        if (allProcesses.length === 0) {
            void loadAllProcessesIncludingArchived();
        }

        // Start polling for both cases and processes (background sync)
        caseStore.startPolling(30000);
        processStore.startPolling(30000);

        // Handle visibility changes
        if (typeof document !== "undefined") {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    caseStore.stopPolling();
                    processStore.stopPolling();
                } else {
                    caseStore.startPolling(30000);
                    processStore.startPolling(30000);
                    // Refresh data when tab becomes visible
                    caseStore.refresh();
                    processStore.refresh();
                }
            };
            document.addEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );

            // Refresh AOS after page loads to detect elements already in viewport
            if (browser) {
                setTimeout(async () => {
                    await refreshAOS();
                }, 500);
            }

            return () => {
                document.removeEventListener(
                    "visibilitychange",
                    handleVisibilityChange,
                );
            };
        }
    });

    onDestroy(() => {
        // Stop polling when component is destroyed
        caseStore.stopPolling();
        processStore.stopPolling();
    });

    async function loadUsers() {
        try {
            const result = await pocketbaseService.getAllUsers();
            if (result.success) {
                users = result.value;
            } else {
                console.error("Error loading users:", result.error);
                users = [];
            }
        } catch (error) {
            console.error("Error loading users:", error);
            users = [];
        }
    }

    async function loadAllProcessesIncludingArchived() {
        try {
            const result =
                await processService.getAllProcessesIncludingArchived();
            if (result.success) {
                allProcesses = result.value;
            } else {
                console.error("Error loading all processes:", result.error);
                allProcesses = [];
            }
        } catch (error) {
            console.error("Error loading all processes:", error);
            allProcesses = [];
        }
    }

    function handleProcessChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempSelectedProcesses = value
                .map((v) => parseInt(v))
                .filter((id) => !isNaN(id));
        } else if (value === null) {
            tempSelectedProcesses = [];
        } else {
            const processId = parseInt(value);
            if (!isNaN(processId)) {
                // Toggle process: if already selected, remove it; otherwise add it
                if (tempSelectedProcesses.includes(processId)) {
                    tempSelectedProcesses = tempSelectedProcesses.filter(
                        (id) => id !== processId,
                    );
                } else {
                    tempSelectedProcesses = [
                        ...tempSelectedProcesses,
                        processId,
                    ];
                }
            }
        }
    }

    function handleStatusChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempSelectedStatuses = value;
        } else if (value === null) {
            tempSelectedStatuses = [];
        } else {
            // Toggle status: if already selected, remove it; otherwise add it
            if (tempSelectedStatuses.includes(value)) {
                tempSelectedStatuses = tempSelectedStatuses.filter(
                    (s) => s !== value,
                );
            } else {
                tempSelectedStatuses = [...tempSelectedStatuses, value];
            }
        }
    }

    function handleSearchChange(value: string) {
        tempSearchQuery = value;
    }

    function handleSearchScopeChange(value: string) {
        tempSearchScope = value;
    }

    function handleProjectChange(value: string | null | string[]) {
        if (Array.isArray(value)) {
            tempSelectedProjects = value
                .map((v) => parseInt(v))
                .filter((id) => !isNaN(id));
        } else if (value === null) {
            tempSelectedProjects = [];
        } else {
            const projectId = parseInt(value);
            if (!isNaN(projectId)) {
                if (tempSelectedProjects.includes(projectId)) {
                    tempSelectedProjects = tempSelectedProjects.filter(
                        (id) => id !== projectId,
                    );
                } else {
                    tempSelectedProjects = [...tempSelectedProjects, projectId];
                }
            }
        }
    }

    function handleOwnerChange(value: string | null) {
        if (value === null) {
            tempSelectedOwners = [];
        } else {
            tempSelectedOwners = [value];
        }
    }

    // Read project filter from URL on load
    function readProjectsFromURL() {
        const projectParam = $page.url.searchParams.get("project");
        if (projectParam) {
            tempSelectedProjects = projectParam
                .split(",")
                .map((p) => parseInt(p))
                .filter((id) => !isNaN(id));
        }
    }

    // Initialize project filter from URL using reactive statement
    $effect(() => {
        if (!selectedProjects || selectedProjects.length === 0) {
            readProjectsFromURL();
        }
    });

    function getProcess(caseItem: Case): Process | null {
        return allProcesses.find((p) => p.id === caseItem.process_id) || null;
    }

    function getProject(caseItem: Case): Project | null {
        if (!caseItem.project_id) return null;
        return projects.find((p) => p.id === caseItem.project_id) || null;
    }

    function isProjectAccessible(caseItem: Case): boolean {
        // Admins can access all projects
        if (isAdmin) return true;

        // No project means always accessible
        if (!caseItem.project_id) return true;

        // Public projects are always accessible
        const project = getProject(caseItem);
        if (project && !project.is_private) return true;

        // For private projects, check if user is a member
        // Note: Since we filtered projects in server load, if project exists
        // in projects array, user is already verified to have access
        return project !== null;
    }

    function isProcessArchived(process: Process | null): boolean {
        return process?.status === "archived";
    }

    function isTaskAccessible(task: CaseTask): boolean {
        // Admins can access all tasks
        if (isAdmin) return true;

        // Get the case associated with this task
        const caseData = getCaseForTask(task);
        if (!caseData) return true; // No case means always accessible

        // No project means always accessible
        if (!caseData.project_id) return true;

        // Get the project for this case
        const project = projects.find((p) => p.id === caseData.project_id);

        // Public projects are always accessible
        if (project && !project.is_private) return true;

        // For private projects, check if user is a member
        // Note: Since we filtered projects in server load, if project exists
        // in projects array, user is already verified to have access
        return project !== null;
    }

    function getOwnerName(ownerId?: string): string {
        if (!ownerId) return "Niet toegewezen";
        const user = users.find((u) => u.id === ownerId);
        return formatUserName(user);
    }

    function getOwner(ownerId?: string): PocketBaseUser | null {
        if (!ownerId) return null;
        return users.find((u) => u.id === ownerId) || null;
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "afgerond":
                return "bg-green-100 text-green-800";
            case "mee_bezig":
                return "bg-blue-100 text-blue-800";
            case "overdue":
                return "bg-red-100 text-red-800";
            case "gepland":
            default:
                return "bg-zinc-100 text-zinc-800";
        }
    }

    function getStatusBorderColor(status: string): string {
        switch (status) {
            case "afgerond":
                return "border-green-200";
            case "mee_bezig":
                return "border-blue-200";
            case "overdue":
                return "border-red-200";
            case "gepland":
            default:
                return "border-zinc-200";
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case "afgerond":
                return CheckCircle2;
            case "mee_bezig":
                return ClipboardList;
            case "overdue":
                return AlertCircle;
            case "gepland":
            default:
                return Clock;
        }
    }

    function getStatusIconColor(status: string): string {
        switch (status) {
            case "afgerond":
                return "text-green-600";
            case "mee_bezig":
                return "text-blue-600";
            case "overdue":
                return "text-red-600";
            case "gepland":
            default:
                return "text-zinc-600";
        }
    }

    function getStatusIconBgColor(status: string): string {
        switch (status) {
            case "afgerond":
                return "bg-green-100";
            case "mee_bezig":
                return "bg-blue-100";
            case "overdue":
                return "bg-red-100";
            case "gepland":
            default:
                return "bg-zinc-100";
        }
    }

    // Case tasks functions - from unified _bpm_tasks table
    async function loadCaseTasks() {
        const ownerFilter = showOnlyMyTasks ? currentUserId : null;

        // Query _bpm_tasks with task_type filter for process tasks
        const filter: Record<string, string> = {
            task_type: "eq.process",
        };
        if (ownerFilter) {
            filter.assignee_id = `eq.${ownerFilter}`;
        }

        const result = await queryTableResult<any>("_bpm_tasks", {
            filter: Object.keys(filter).length > 0 ? filter : undefined,
            order: "created_at.desc",
        });

        if (result.success) {
            caseTasks = result.value.data;

            // Only fetch case and process task names for display (simplified)
            const caseStepIds = [
                ...new Set(caseTasks.map((t) => t.case_step_id)),
            ];
            const taskIds = [...new Set(caseTasks.map((t) => t.task_id))];

            // Fetch case steps to get case IDs
            if (caseStepIds.length > 0) {
                const caseStepsResult = await queryTableResult<any>(
                    "_bpm_case_steps",
                    {
                        filter: { id: `in.(${caseStepIds.join(",")})` },
                    },
                );

                if (caseStepsResult.success) {
                    const allCaseIds = [
                        ...new Set(
                            caseStepsResult.value.data.map(
                                (s: any) => s.case_id,
                            ),
                        ),
                    ];

                    // Fetch cases
                    if (allCaseIds.length > 0) {
                        const casesResult = await queryTableResult<Case>(
                            "_bpm_cases",
                            {
                                filter: { id: `in.(${allCaseIds.join(",")})` },
                            },
                        );

                        if (casesResult.success) {
                            // Create map: case_step_id -> case
                            for (const step of caseStepsResult.value.data) {
                                const caseData = casesResult.value.data.find(
                                    (c) => c.id === step.case_id,
                                );
                                if (caseData) {
                                    caseTasks
                                        .filter(
                                            (t) => t.case_step_id === step.id,
                                        )
                                        .forEach((t) => {
                                            taskCaseMap.set(t.id, caseData);
                                        });
                                }
                            }
                        }
                    }
                }
            }

            // Fetch process task names
            if (taskIds.length > 0) {
                const processTasksResult = await queryTableResult<any>(
                    "_bpm_process_tasks",
                    {
                        filter: { id: `in.(${taskIds.join(",")})` },
                    },
                );

                if (processTasksResult.success) {
                    for (const processTask of processTasksResult.value.data) {
                        caseTasks
                            .filter((t) => t.task_id === processTask.id)
                            .forEach((t) => {
                                taskProcessTaskMap.set(t.id, processTask);
                            });
                    }
                }
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
            caseTasks = [];
        }
    }

    function toggleTasksView() {
        showTasksView = !showTasksView;
        // Don't call loadCaseTasks() here - let the effect handle it
    }

    function toggleTaskFilter() {
        showOnlyMyTasks = !showOnlyMyTasks;
        loadCaseTasks();
    }

    function getCaseForTask(task: CaseTask): Case | null {
        return taskCaseMap.get(task.id) || null;
    }

    function getProcessTaskName(task: CaseTask): string {
        const processTask = taskProcessTaskMap.get(task.id);
        return processTask?.name || `Taak #${task.task_id}`;
    }

    function handleTaskClick(task: CaseTask) {
        const caseData = getCaseForTask(task);
        if (caseData) {
            goto(`/cases/${caseData.id}`);
        }
    }

    // Load tasks when view changes
    $effect(() => {
        if (showTasksView) {
            loadCaseTasks();
        }
    });

    async function openCaseDrawer() {
        // Use goto with replaceState and invalidateAll: false to prevent full reload
        // This should open the drawer immediately without blocking
        try {
            await goto("?drawer=case", {
                replaceState: true,
                noScroll: true,
                keepFocus: true,
                invalidateAll: false,
            });
        } catch (error) {
            // If navigation fails, update URL manually as fallback
            if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("drawer", "case");
                window.history.replaceState({}, "", url.toString());
                // Force SvelteKit to recognize the URL change
                window.dispatchEvent(new PopStateEvent("popstate"));
            }
        }
    }

    async function handleCaseCreated(caseData: Case) {
        // Invalidate SSR cache and refresh store
        await invalidate("cases");
        await caseStore.refresh(undefined, false);
        // Refresh case store (silent refresh)
        await caseStore.refresh(undefined, false);
        // Navigate to newly created case
        await goto(`/cases/${caseData.id}`);
    }

    // Count active filters
    const activeFilterCount = $derived.by(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (selectedProcesses.length > 0) count++;
        if (selectedStatuses.length > 0) count++;
        if (selectedOwners.length > 0) count++;
        return count;
    });

    // Sync temporary filters with applied filters when drawer opens
    $effect(() => {
        if (searchDrawerOpen) {
            tempSearchQuery = searchQuery;
            tempSearchScope = searchScope;
            tempSelectedProcesses = [...selectedProcesses];
            tempSelectedStatuses = [...selectedStatuses];
            tempSelectedOwners = [...selectedOwners];
        }
    });

    // Apply filters function - called when "Tonen" button is clicked
    async function applyFilters() {
        searchQuery = tempSearchQuery;
        searchScope = tempSearchScope;
        selectedProcesses = [...tempSelectedProcesses];
        selectedProjects = [...tempSelectedProjects];
        selectedStatuses = [...tempSelectedStatuses];
        selectedOwners = [...tempSelectedOwners];

        // Build URL with all filter params (excluding drawer)
        const params: string[] = [];

        // Update search query
        if (searchQuery) {
            params.push(`search=${encodeURIComponent(searchQuery)}`);
        }

        // Update search scope
        if (searchScope !== "ale") {
            params.push(`scope=${searchScope}`);
        }

        // Update process filter
        if (selectedProcesses.length > 0) {
            params.push(`process=${selectedProcesses.join(",")}`);
        }

        // Update project filter
        if (selectedProjects.length > 0) {
            params.push(`project=${selectedProjects.join(",")}`);
        }

        // Update status filter
        if (selectedStatuses.length > 0) {
            params.push(`status=${selectedStatuses.join(",")}`);
        }

        // Update owner filter
        if (selectedOwners.length > 0) {
            params.push(`owner=${selectedOwners.join(",")}`);
        }

        const queryString = params.length > 0 ? `?${params.join("&")}` : "";
        const newUrl = `${$page.url.pathname}${queryString}`;
        await goto(newUrl, { replaceState: true, noScroll: true });
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

    function handleResetFilters() {
        // Reset temporary filters
        tempSearchQuery = "";
        tempSearchScope = "ale";
        tempSelectedProcesses = [];
        tempSelectedProjects = [];
        tempSelectedStatuses = [];
        tempSelectedOwners = [];

        // Apply the reset
        searchQuery = "";
        searchScope = "ale";
        selectedProcesses = [];
        selectedProjects = [];
        selectedStatuses = [];
        selectedOwners = [];

        // Update URL to reflect cleared filters
        updateUrlFromFilters();
    }

    // Temporary labels for drawer
    const tempProcessLabel = $derived.by(() => {
        if (tempSelectedProcesses.length === 0) return "Alle Processen";
        if (tempSelectedProcesses.length === 1) {
            const process = processes.find(
                (p) => p.id === tempSelectedProcesses[0],
            );
            return process?.name || "Alle Processen";
        }
        return `${tempSelectedProcesses.length} processen geselecteerd`;
    });

    const tempProjectLabel = $derived.by(() => {
        if (tempSelectedProjects.length === 0) return "Alle Projecten";
        if (tempSelectedProjects.length === 1) {
            const project = projects.find(
                (p) => p.id === tempSelectedProjects[0],
            );
            return project?.name || "Alle Projecten";
        }
        return `${tempSelectedProjects.length} projecten geselecteerd`;
    });

    const tempStatusLabel = $derived.by(() => {
        if (tempSelectedStatuses.length === 0) return "Alle Statussen";
        if (tempSelectedStatuses.length === 1) {
            const option = statusOptions.find(
                (opt) => opt.value === tempSelectedStatuses[0],
            );
            return option?.label || "Alle Statussen";
        }
        return `${tempSelectedStatuses.length} statussen geselecteerd`;
    });

    const tempOwnerLabel = $derived.by(() => {
        if (tempSelectedOwners.length === 0) return "Alle Eigenaren";
        if (tempSelectedOwners.length === 1) {
            const user = users.find((u) => u.id === tempSelectedOwners[0]);
            return user
                ? user.name || user.username || user.email
                : "Alle Eigenaren";
        }
        return `${tempSelectedOwners.length} eigenaren geselecteerd`;
    });
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <div class="mb-6">
        <NavCard
            title="Cases"
            subtitle={!loading
                ? `${filteredCases.length} case${filteredCases.length !== 1 ? "s" : ""} gevonden`
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
                    <IconButton
                        icon={Plus}
                        variant="default"
                        onclick={openCaseDrawer}
                        tooltip="Nieuwe case maken"
                    />
                </div>
            {/snippet}
        </NavCard>
    </div>

    {#if showTasksView}
        <!-- Case Tasks View -->
        <div class="mb-6 flex items-center gap-2">
            <span class="text-sm text-zinc-700">Alleen mijn taken</span>
            <Toggle checked={showOnlyMyTasks} onchange={toggleTaskFilter} />
        </div>

        {#if caseTasks.length === 0}
            <div
                class="text-center py-12 bg-white rounded-lg border border-zinc-200"
            >
                <p class="text-zinc-500">Geen taken gevonden</p>
            </div>
        {:else}
            <div class="mb-6">
                <div class="text-zinc-600">
                    {caseTasks.length} taak{caseTasks.length !== 1 ? "en" : ""} gevonden
                </div>
            </div>

            <!-- Case Tasks Grid - From unified _bpm_tasks table -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                data-aos-id-case-tasks
            >
                {#each caseTasks as task, index (task.id)}
                    {@const taskAssigneeIds = Array.isArray(
                        (task as any).assignee_id,
                    )
                        ? (task as any).assignee_id
                        : (task as any).assignee_id
                          ? [(task as any).assignee_id]
                          : task.owner_id
                            ? [task.owner_id]
                            : []}
                    {@const isAccessible = isTaskAccessible(task)}
                    {@const cardClasses = isAccessible
                        ? "bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer p-4 relative group"
                        : "bg-zinc-50 rounded-lg border border-zinc-200 opacity-60 cursor-not-allowed p-4 relative"}
                    <div
                        class={cardClasses}
                        onclick={() => isAccessible && handleTaskClick(task)}
                        role={isAccessible ? "button" : "presentation"}
                        tabindex={isAccessible ? 0 : -1}
                        data-aos="fade-up"
                        data-aos-anchor="[data-aos-id-case-tasks]"
                        data-aos-delay={index * 50}
                    >
                        <!-- Task Name (from _bpm_process_tasks via task_id) -->
                        <div
                            class="flex items-start justify-between gap-2 mb-2"
                        >
                            <h3
                                class="text-base font-semibold text-zinc-900 line-clamp-2 flex-1"
                            >
                                {getProcessTaskName(task)}
                            </h3>
                            {#if isAccessible}
                                <div
                                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Tooltip text="Naar pagina">
                                        <IconButton
                                            icon={NotepadText}
                                            size="sm"
                                            variant="ghost"
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                goto(`/page/task/${task.id}`);
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            {/if}
                        </div>

                        <!-- Case Info (from _bpm_case_steps -> _bpm_cases) -->
                        {#if getCaseForTask(task)}
                            <div
                                class="text-sm text-zinc-600 mb-2 font-inter"
                                style="font-style: normal; font-variant: normal;"
                            >
                                {getCaseForTask(task)?.name || "Onbekende case"}
                            </div>
                        {/if}

                        <!-- Status -->
                        <div class="mb-2">
                            <span
                                class="px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(
                                    task.status,
                                )}"
                            >
                                {translateStatus(task.status)}
                            </span>
                        </div>

                        <!-- Kanban Status -->
                        {#if (task as any).kanban_status}
                            <div class="mb-2">
                                <span
                                    class="px-2 py-0.5 rounded text-xs text-zinc-600 bg-zinc-50"
                                >
                                    {(task as any).kanban_status}
                                </span>
                            </div>
                        {/if}

                        <!-- Owners (from _bpm_tasks.assignee_id array or owner_id for backward compatibility) -->
                        {#if taskAssigneeIds.length > 0}
                            <div class="mt-2 flex flex-wrap gap-1 items-center">
                                {#each taskAssigneeIds.slice(0, 3) as assigneeId}
                                    <UserAvatar
                                        user={users.find(
                                            (u) => u.id === assigneeId,
                                        ) || null}
                                        size="sm"
                                        showName={true}
                                    />
                                {/each}
                                {#if taskAssigneeIds.length > 3}
                                    <span class="text-xs text-zinc-500"
                                        >+{taskAssigneeIds.length - 3}</span
                                    >
                                {/if}
                            </div>
                        {:else}
                            <span class="text-xs text-zinc-500"
                                >Niet toegewezen</span
                            >
                        {/if}

                        <!-- Deadline -->
                        {#if task.deadline}
                            <div class="mt-2 text-xs text-zinc-600">
                                Deadline: {new Date(
                                    task.deadline,
                                ).toLocaleDateString("nl-NL", {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </div>
                        {/if}

                        <!-- Hours -->
                        {#if (task as any).uren}
                            <div class="mt-2 text-xs text-zinc-600">
                                {(task as any).uren}u
                            </div>
                        {/if}

                        <!-- Started/Completed timestamps -->
                        {#if (task as any).started_at}
                            <div class="mt-1 text-xs text-zinc-500">
                                Gestart: {new Date(
                                    (task as any).started_at,
                                ).toLocaleDateString("nl-NL", {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </div>
                        {/if}
                        {#if (task as any).completed_at}
                            <div class="mt-1 text-xs text-green-600">
                                Voltooid: {new Date(
                                    (task as any).completed_at,
                                ).toLocaleDateString("nl-NL", {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    {:else}
        <!-- Cases List -->
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            data-aos-id-cases
        >
            {#each filteredCases as caseItem, index (caseItem.id)}
                {@const StatusIcon = getStatusIcon(caseItem.status)}
                {@const isAccessible = isProjectAccessible(caseItem)}
                {@const cardClasses = isAccessible
                    ? "bg-white rounded-lg border hover:shadow-sm transition-all cursor-pointer flex flex-col group"
                    : "bg-zinc-50 rounded-lg border-zinc-200 opacity-60 cursor-not-allowed flex flex-col"}
                {@const borderClasses = isAccessible
                    ? getStatusBorderColor(caseItem.status)
                    : "border-zinc-200"}
                <div
                    class="{cardClasses} {borderClasses}"
                    onclick={() =>
                        isAccessible && goto(`/cases/${caseItem.id}`)}
                    role={isAccessible ? "button" : "presentation"}
                    tabindex={isAccessible ? 0 : -1}
                    data-aos="fade-up"
                    data-aos-anchor="[data-aos-id-cases]"
                    data-aos-delay={index * 50}
                >
                    <!-- Header -->
                    <div
                        class="px-4 pt-4 pb-3 border-b border-zinc-100 relative"
                    >
                        <div class="absolute top-2 right-2">
                            <div
                                class="p-1.5 {getStatusIconBgColor(
                                    caseItem.status,
                                )} rounded-lg group-hover:opacity-80 transition-opacity"
                            >
                                <StatusIcon
                                    class="w-4 h-4 {getStatusIconColor(
                                        caseItem.status,
                                    )}"
                                />
                            </div>
                        </div>
                        <div class="mb-0.5 pr-8">
                            <h3
                                class="text-base font-semibold text-zinc-900 tracking-tight leading-tight font-inter"
                                style="font-style: normal; font-variant: normal;"
                            >
                                {caseItem.name}
                            </h3>
                        </div>
                        <div class="flex flex-col gap-1 text-xs text-zinc-600">
                            {#if getProcess(caseItem)}
                                <div class="flex items-center gap-2">
                                    <span class="truncate"
                                        >{getProcess(caseItem)?.name}</span
                                    >
                                    {#if isProcessArchived(getProcess(caseItem))}
                                        <Label variant="default"
                                            >Gearchiveerd</Label
                                        >
                                    {/if}
                                </div>
                            {:else}
                                <div>Onbekend Proces</div>
                            {/if}
                            {#if getProject(caseItem)}
                                <div class="flex items-center gap-1">
                                    <span class="truncate font-medium"
                                        >{getProject(caseItem)?.name}</span
                                    >
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Details section -->
                    <div class="px-4 py-3 flex-1">
                        <div
                            class="flex items-center justify-between gap-3 text-xs"
                        >
                            <div class="flex items-center gap-1.5">
                                <span class="text-zinc-500">Start</span>
                                <span class="text-zinc-900 font-medium"
                                    >{formatDate(caseItem.start_date)}</span
                                >
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-zinc-500">Eind</span>
                                <span class="text-zinc-900 font-medium"
                                    >{formatDate(
                                        caseItem.completion_deadline,
                                    )}</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Footer with owner and status -->
                    <div
                        class="px-4 py-3 border-t border-zinc-100 bg-zinc-50 rounded-b-lg"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                {#if caseItem.owner_id}
                                    <UserAvatar
                                        user={getOwner(caseItem.owner_id)}
                                        size="sm"
                                        showName={true}
                                        nameClass="text-xs"
                                    />
                                {:else}
                                    <span class="text-xs text-zinc-500"
                                        >Niet toegewezen</span
                                    >
                                {/if}
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <span
                                    class="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap {getStatusColor(
                                        caseItem.status,
                                    )}"
                                >
                                    {translateStatus(caseItem.status)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        {#if filteredCases.length === 0}
            <div
                class="text-center py-12 bg-white rounded-lg border border-zinc-200"
            >
                <p class="text-zinc-500 mb-4">Geen cases gevonden.</p>
            </div>
        {/if}
    {/if}
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
                        suggestions={searchSuggestions}
                        placeholder="Zoek cases..."
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

                <!-- Process Filter -->
                <div class="lg:col-span-1 relative z-[60]">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Proces
                        {#if tempSelectedProcesses.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempSelectedProcesses.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempSelectedProcesses.map((p) =>
                            p.toString(),
                        )}
                        options={processOptions}
                        placeholder={tempProcessLabel}
                        onchange={handleProcessChange}
                        isActive={tempSelectedProcesses.length > 0}
                        class="w-full"
                        searchable={true}
                    />
                </div>

                <!-- Project Filter -->
                <div class="lg:col-span-1 relative z-[60]">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Project
                        {#if tempSelectedProjects.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempSelectedProjects.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempSelectedProjects.map((p) =>
                            p.toString(),
                        )}
                        options={projectOptions}
                        placeholder={tempProjectLabel}
                        onchange={handleProjectChange}
                        isActive={tempSelectedProjects.length > 0}
                        class="w-full"
                        searchable={true}
                    />
                </div>

                <!-- Status Filter -->
                <div class="lg:col-span-1 relative z-[60]">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Status
                        {#if tempSelectedStatuses.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempSelectedStatuses.length})</span
                            >
                        {/if}
                    </div>
                    <Select
                        multiple={true}
                        selectedValues={tempSelectedStatuses}
                        options={statusOptions}
                        placeholder={tempStatusLabel}
                        onchange={handleStatusChange}
                        isActive={tempSelectedStatuses.length > 0}
                        class="w-full"
                        searchable={true}
                    />
                </div>

                <!-- Owner Filter -->
                <div class="lg:col-span-1 relative z-[60]">
                    <div class="block text-sm font-medium text-zinc-700 mb-1">
                        Eigenaar
                        {#if tempSelectedOwners.length > 1}
                            <span class="ml-2 text-xs text-zinc-500"
                                >({tempSelectedOwners.length})</span
                            >
                        {/if}
                    </div>
                    <UserSelector
                        {users}
                        selectedUserId={tempSelectedOwners.length === 1
                            ? (tempSelectedOwners[0] ?? null)
                            : null}
                        onSelectedUserIdChange={handleOwnerChange}
                        placeholder={tempOwnerLabel ?? ""}
                        class="w-full"
                    />
                </div>
            </div>

            <!-- Apply Button and Selection Count -->
            <div class="mt-4 flex items-center justify-between">
                <div class="text-xs text-zinc-600">
                    {#if tempSearchQuery || tempSelectedProcesses.length > 0 || tempSelectedProjects.length > 0 || tempSelectedStatuses.length > 0 || tempSelectedOwners.length > 0}
                        Selectie: {(tempSearchQuery ? 1 : 0) +
                            tempSelectedProcesses.length +
                            tempSelectedProjects.length +
                            tempSelectedStatuses.length +
                            tempSelectedOwners.length} filter{(tempSearchQuery
                            ? 1
                            : 0) +
                            tempSelectedProcesses.length +
                            tempSelectedProjects.length +
                            tempSelectedStatuses.length +
                            tempSelectedOwners.length !==
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

<!-- Drawer -->
<CaseDrawer oncreated={handleCaseCreated} {users} />
