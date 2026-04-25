<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Drawer from "./Drawer.svelte";
    import type { TabItem } from "./Tabs.svelte";
    import Label from "./Label.svelte";
    import UserAvatar from "./UserAvatar.svelte";
    import Rating from "./Rating.svelte";
    import {
        getUserForAttribution,
        formatUserName,
        getCurrentUserId,
    } from "$lib/utils/userUtils";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import * as taskService from "$lib/services/taskService";
    import type {
        UnifiedPlanningItem,
        UnifiedBacklogItem,
    } from "$lib/services/taskService";
    import * as projectService from "$lib/services/projectService";
    import {
        Calendar,
        Clock,
        Tag,
        FileText,
        Users,
        Target,
        TrendingUp,
        Copy,
        ExternalLink,
    } from "lucide-svelte";
    import FileList from "./FileList.svelte";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { Task } from "$lib/schemas/task";
    import type { Project } from "$lib/schemas/project";
    import { taskStore } from "$lib/stores/taskStore";
    import { taskState } from "$lib/stores/taskStore.svelte";
    import { onMount } from "svelte";
    import Textarea from "./Textarea.svelte";
    import Select, { type SelectOption } from "./Select.svelte";
    import DatePicker from "./DatePicker.svelte";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import TagInput from "./TagInput.svelte";
    import KomtVanInput from "./KomtVanInput.svelte";
    import Spinner from "./Spinner.svelte";
    import IconButton from "./IconButton.svelte";

    /**
     * WorkItemDetailsDrawer component props
     *
     * Editable drawer for viewing and editing work item details.
     * Opens when URL param `drawer=workitem` is present.
     */
    interface Props {
        /**
         * Work item ID to display (optional if using URL params)
         */
        workItemId?: number | null;

        /**
         * Whether the drawer is open (optional if using URL params)
         */
        open?: boolean;

        /**
         * Callback when drawer is closed
         */
        onclose?: () => void;
    }

    let {
        workItemId: propWorkItemId = null,
        open: propIsOpen = $bindable(false),
        onclose,
    }: Props = $props();

    // Derive state from URL params
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const workItemIdParam = $derived($page.url.searchParams.get("workItemId"));
    const drawerTabParam = $derived($page.url.searchParams.get("drawerTab"));

    // Use URL params if available, otherwise fall back to props
    const isOpen = $derived.by(() => {
        const url = $page.url;
        const param = url.searchParams.get("drawer");
        return param === "workitem" || propIsOpen;
    });
    const workItemId = $derived(
        workItemIdParam ? Number(workItemIdParam) : propWorkItemId,
    );
    const activeTab = $derived(drawerTabParam || "details");

    // Tab configuration
    const tabs: TabItem[] = [
        { id: "details", label: "Details" },
        { id: "berichten", label: "Berichten" },
        { id: "bestanden", label: "Bestanden" },
    ];

    // Handle tab change
    async function handleTabChange(tabId: string) {
        const url = new URL($page.url);
        if (tabId === "details") {
            url.searchParams.delete("drawerTab");
        } else {
            url.searchParams.set("drawerTab", tabId);
        }
        await goto(url.pathname + url.search, { noScroll: true });
    }

    let workItem = $state<Task | null>(null);
    let assignees = $state<PocketBaseUser[]>([]);
    let project = $state<Project | null>(null);
    let loading = $state(false);
    let saving = $state(false);

    // Form fields
    let assigneeIds = $state<string[]>([]);
    let selectedProjectId = $state<string | null>(null);
    let subject = $state("");
    let voorWie = $state("");
    let watGaJeDoen = $state("");
    let waarom = $state("");
    let dueDate = $state<string | null>(null);
    let tags = $state<string[]>([]);
    let komtVan = $state("");
    let uren = $state<string>("");
    let relevantie = $state<number | null>(null);
    let attachments = $state<string[]>([]);
    let status = $state<"backlog" | "gepland" | "ad-hoc">("backlog");
    let kanbanStatus = $state<string>("gepland");

    // Auto-save state
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let initialValuesLoaded = $state(false);
    let initialValues: any = null;
    let lastWorkItemId = $state<number | null>(null);

    // Users and projects for select dropdowns
    let users = $state<PocketBaseUser[]>([]);
    let projects = $state<Project[]>([]);
    let usersLoading = $state(false);

    // Handle drawer close - remove URL params if using URL-based state
    function handleClose() {
        // Clear any pending save
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }

        if (drawerParam === "workitem") {
            // Remove drawer params from URL
            const url = new URL($page.url);
            url.searchParams.delete("drawer");
            url.searchParams.delete("workItemId");
            goto(url.pathname + url.search, { noScroll: true });
        } else {
            // Use prop-based state
            propIsOpen = false;
        }
        if (onclose) {
            onclose();
        }
    }

    // Load work item details when drawer opens or workItemId changes
    $effect(() => {
        (async () => {
            if (isOpen && workItemId) {
                // First ensure users are loaded, then load work item
                if (users.length === 0 && !usersLoading) {
                    await loadUsersAndProjects();
                }
                await loadWorkItem();
            } else if (!isOpen) {
                workItem = null;
                assignees = [];
                project = null;
                initialValuesLoaded = false;
                initialValues = null;
                usersLoading = false;
                lastWorkItemId = null;
            }
        })();
    });

    async function loadWorkItem() {
        if (!workItemId) return;

        loading = true;
        const result = await taskService.getWorkItemById(workItemId);
        if (result.success) {
            workItem = result.value;

            // Load assignees
            if (
                workItem.assignee_id &&
                Array.isArray(workItem.assignee_id) &&
                workItem.assignee_id.length > 0
            ) {
                const assigneePromises = workItem.assignee_id.map((id) =>
                    getUserForAttribution(id),
                );
                const assigneeResults = await Promise.all(assigneePromises);
                assignees = assigneeResults.filter(
                    (u) => u !== null,
                ) as PocketBaseUser[];
            } else if (
                workItem.assignee_id &&
                typeof workItem.assignee_id === "string"
            ) {
                // Backward compatibility: single assignee_id as string
                const assignee = await getUserForAttribution(
                    workItem.assignee_id,
                );
                assignees = assignee ? [assignee] : [];
            }

            // Load project
            if (workItem.project_id) {
                const projectResult = await projectService.getProjectById(
                    workItem.project_id,
                );
                if (projectResult.success) {
                    project = projectResult.value;
                }
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
        loading = false;
    }

    // Load users and projects for dropdowns
    async function loadUsersAndProjects() {
        // Load users first and wait for completion before enabling select
        usersLoading = true;
        try {
            const usersResult = await pocketbaseService.getAllUsers();
            if (usersResult.success) {
                users = usersResult.value;
            }
        } finally {
            usersLoading = false;
        }

        // Load projects in parallel (doesn't block select)
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
            const projectsResult =
                await projectService.getProjectsForUser(currentUserId);
            if (projectsResult.success) {
                projects = projectsResult.value;
            }
        }
    }

    // Note: Users are now loaded in the work item effect to ensure they're ready before form initialization

    // Initialize form from work item
    // This effect runs when workItem changes, and also when users finish loading
    $effect(() => {
        if (workItem) {
            // Access users and usersLoading to make this reactive to their changes
            const usersReady = !usersLoading;
            const isNewWorkItem = workItem.id !== lastWorkItemId;

            // Only reset state when work item actually changes
            if (isNewWorkItem) {
                lastWorkItemId = workItem.id;

                // Clear any pending save when work item changes
                if (saveTimeout) {
                    clearTimeout(saveTimeout);
                    saveTimeout = null;
                }

                // Reset initial values loaded flag when work item changes
                initialValuesLoaded = false;
                initialValues = null;
            }

            // Only set assigneeIds if users are loaded (to prevent showing placeholder when assignee exists)
            // This ensures the Select component can immediately display the selected users
            // This will run when users finish loading even if workItem hasn't changed
            if (usersReady) {
                assigneeIds = Array.isArray(workItem.assignee_id)
                    ? workItem.assignee_id
                    : workItem.assignee_id
                      ? [workItem.assignee_id]
                      : [];

                // Debug: Log assignee data
                if (import.meta.env.DEV) {
                    console.log(
                        "[WorkItemDetailsDrawer] Work item assignee_id:",
                        workItem.assignee_id,
                    );
                    console.log(
                        "[WorkItemDetailsDrawer] Set assigneeIds to:",
                        $state.snapshot(assigneeIds),
                    );
                }
            }

            // Only set other fields when work item changes (not when users load)
            if (isNewWorkItem) {
                selectedProjectId = workItem.project_id
                    ? String(workItem.project_id)
                    : null;
                subject = workItem.subject ?? "";
                voorWie = workItem.voor_wie_is_het ?? "";
                watGaJeDoen = workItem.wat_ga_je_doen ?? "";
                waarom = workItem.waarom_doe_je_het ?? "";

                // Convert deadline to due_date format
                const workItemAny = workItem as any;
                if (workItemAny.deadline) {
                    const deadlineStr = String(workItemAny.deadline);
                    const dateMatch = deadlineStr.match(/^(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        dueDate = dateMatch[1];
                    } else {
                        const date = new Date(deadlineStr);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0",
                        );
                        const day = String(date.getDate()).padStart(2, "0");
                        dueDate = `${year}-${month}-${day}`;
                    }
                } else if (workItem.deadline) {
                    dueDate = workItem.deadline;
                } else {
                    dueDate = null;
                }

                uren = workItem.uren ? String(workItem.uren) : "";
                komtVan = workItem.komt_van ?? "";
                tags = workItem.tags || [];
                relevantie = workItem.relevantie || null;
                attachments = workItem.bijlagen || [];
                status = workItem.status as "backlog" | "gepland" | "ad-hoc";
                kanbanStatus = workItem.kanban_status || "gepland";
            }

            // Store initial values after a short delay
            setTimeout(() => {
                initialValues = {
                    assigneeIds: [...assigneeIds],
                    selectedProjectId,
                    subject,
                    voorWie,
                    watGaJeDoen,
                    waarom,
                    dueDate,
                    uren,
                    komtVan,
                    tags: [...tags],
                    relevantie,
                    status,
                    kanbanStatus,
                };
                initialValuesLoaded = true;
            }, 100);
        }
    });

    // Check if form has changed
    function hasFormChanged(): boolean {
        if (!initialValues) return false;

        const arraysEqual = (a: string[], b: string[]) =>
            a.length === b.length && a.every((val, idx) => val === b[idx]);

        const assigneesChanged =
            JSON.stringify(assigneeIds.sort()) !==
            JSON.stringify((initialValues.assigneeIds || []).sort());
        return (
            assigneesChanged ||
            selectedProjectId !== initialValues.selectedProjectId ||
            subject !== initialValues.subject ||
            voorWie !== initialValues.voorWie ||
            watGaJeDoen !== initialValues.watGaJeDoen ||
            waarom !== initialValues.waarom ||
            dueDate !== initialValues.dueDate ||
            uren !== initialValues.uren ||
            komtVan !== initialValues.komtVan ||
            !arraysEqual(tags, initialValues.tags) ||
            relevantie !== initialValues.relevantie ||
            status !== initialValues.status ||
            kanbanStatus !== initialValues.kanbanStatus
        );
    }

    // Save work item
    async function saveWorkItem() {
        if (!workItem || !initialValuesLoaded || saving || !hasFormChanged())
            return;

        const currentWorkItemId = workItem.id;
        saving = true;

        const emptyToNull = (val: string): string | null =>
            val.trim() === "" ? null : val.trim();
        const parseNumber = (
            val: string | number | null | undefined,
        ): number | null => {
            if (val == null) return null;
            if (typeof val === "number") {
                return isNaN(val) || val < 0 ? null : val;
            }
            if (typeof val === "string") {
                const trimmed = val.trim();
                if (trimmed === "") return null;
                const parsed = parseFloat(trimmed);
                return isNaN(parsed) || parsed < 0 ? null : parsed;
            }
            return null;
        };
        const parseProjectId = (val: string | null): number | null => {
            if (!val || val.trim() === "") return null;
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? null : parsed;
        };

        const data = {
            project_id: parseProjectId(selectedProjectId),
            assignee_id: assigneeIds.length > 0 ? assigneeIds : [],
            subject: subject.trim() || undefined,
            voor_wie_is_het: emptyToNull(voorWie),
            wat_ga_je_doen: emptyToNull(watGaJeDoen),
            waarom_doe_je_het: emptyToNull(waarom),
            due_date: dueDate && dueDate.trim() !== "" ? dueDate : null,
            tags: (tags || []).filter((tag) => tag && tag.trim() !== ""),
            komt_van: emptyToNull(komtVan),
            uren: parseNumber(uren),
            bijlagen: (attachments || []).filter(
                (url) => url && url.trim() !== "",
            ),
            relevantie:
                relevantie && relevantie >= 1 && relevantie <= 5
                    ? relevantie
                    : null,
            status: status,
            kanban_status: kanbanStatus || null,
        };

        const result = await taskService.updateWorkItem(workItem.id, data);
        if (result.success) {
            console.log(
                "[WorkItemDetailsDrawer] Update successful, result.value:",
                result.value,
            );
            toastStore.add("Werk item bijgewerkt", "success");

            // Update initial values to match current values
            if (initialValues) {
                initialValues = {
                    assigneeIds: [...assigneeIds],
                    selectedProjectId,
                    subject,
                    voorWie,
                    watGaJeDoen,
                    waarom,
                    dueDate,
                    uren,
                    komtVan,
                    tags: [...tags],
                    relevantie,
                    status,
                    kanbanStatus,
                };
            }

            // Update store optimistically with returned data for immediate UI update
            const updatedItem = result.value[0] || result.value;
            console.log(
                "[WorkItemDetailsDrawer] Updated item from API:",
                updatedItem,
            );
            console.log(
                "[WorkItemDetailsDrawer] Updated item assignee_id:",
                updatedItem?.assignee_id,
            );

            if (updatedItem) {
                // Update the reactive store state immediately
                const planningIdx = taskState.planningItems.findIndex(
                    (item) => item.id === currentWorkItemId,
                );
                const backlogIdx = taskState.backlogItems.findIndex(
                    (item) => item.id === currentWorkItemId,
                );

                console.log(
                    "[WorkItemDetailsDrawer] Found item in store - planningIdx:",
                    planningIdx,
                    "backlogIdx:",
                    backlogIdx,
                );
                console.log(
                    "[WorkItemDetailsDrawer] Current taskState.planningItems.length:",
                    taskState.planningItems.length,
                );
                console.log(
                    "[WorkItemDetailsDrawer] Current taskState.backlogItems.length:",
                    taskState.backlogItems.length,
                );

                if (planningIdx >= 0) {
                    const oldItem = taskState.planningItems[planningIdx];
                    console.log(
                        "[WorkItemDetailsDrawer] Old planning item assignee_id:",
                        oldItem?.assignee_id,
                    );
                    // Create new array to ensure reactivity
                    taskState.planningItems = taskState.planningItems.map(
                        (item, idx) => {
                            if (idx === planningIdx) {
                                const merged = {
                                    ...item,
                                    ...updatedItem,
                                } as unknown as UnifiedPlanningItem;
                                console.log(
                                    "[WorkItemDetailsDrawer] Merged planning item assignee_id:",
                                    merged.assignee_id,
                                );
                                return merged;
                            }
                            return item;
                        },
                    );
                    console.log(
                        "[WorkItemDetailsDrawer] Updated taskState.planningItems.length:",
                        taskState.planningItems.length,
                    );
                }
                if (backlogIdx >= 0) {
                    const oldItem = taskState.backlogItems[backlogIdx];
                    console.log(
                        "[WorkItemDetailsDrawer] Old backlog item assignee_id:",
                        oldItem?.assignee_id,
                    );
                    // Create new array to ensure reactivity
                    taskState.backlogItems = taskState.backlogItems.map(
                        (item, idx) => {
                            if (idx === backlogIdx) {
                                const merged = {
                                    ...item,
                                    ...updatedItem,
                                } as unknown as UnifiedBacklogItem;
                                console.log(
                                    "[WorkItemDetailsDrawer] Merged backlog item assignee_id:",
                                    merged.assignee_id,
                                );
                                return merged;
                            }
                            return item;
                        },
                    );
                    console.log(
                        "[WorkItemDetailsDrawer] Updated taskState.backlogItems.length:",
                        taskState.backlogItems.length,
                    );
                }

                if (planningIdx < 0 && backlogIdx < 0) {
                    console.warn(
                        "[WorkItemDetailsDrawer] Item not found in either planning or backlog store!",
                    );
                }
            } else {
                console.warn(
                    "[WorkItemDetailsDrawer] No updated item returned from API",
                );
            }

            await loadWorkItem();

            // Refresh the work item store to update kanban board
            // Use null to refresh ALL items (work page shows all items, not filtered by assignee)
            console.log(
                "[WorkItemDetailsDrawer] Refreshing store with getPlanningItems(null)...",
            );
            const refreshedPlanning = await taskStore.getPlanningItems(null);
            console.log(
                "[WorkItemDetailsDrawer] Refreshed planning items:",
                refreshedPlanning.length,
                "items",
            );
            if (refreshedPlanning.length > 0) {
                const refreshedItem = refreshedPlanning.find(
                    (item) => item.id === currentWorkItemId,
                );
                console.log(
                    "[WorkItemDetailsDrawer] Refreshed item assignee_id:",
                    refreshedItem?.assignee_id,
                );
            }

            console.log(
                "[WorkItemDetailsDrawer] Refreshing store with getBacklogItems(null)...",
            );
            const refreshedBacklog = await taskStore.getBacklogItems(null);
            console.log(
                "[WorkItemDetailsDrawer] Refreshed backlog items:",
                refreshedBacklog.length,
                "items",
            );
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }

        saving = false;
    }

    // Auto-save when form fields change (only on details tab)
    $effect(() => {
        // Only auto-save if initial values are loaded and we're on the details tab
        if (!initialValuesLoaded || activeTab !== "details" || !workItem) {
            if (saveTimeout) {
                clearTimeout(saveTimeout);
                saveTimeout = null;
            }
            return;
        }

        // Access all form fields to track changes
        void assigneeIds;
        void selectedProjectId;
        void subject;
        void voorWie;
        void watGaJeDoen;
        void waarom;
        void dueDate;
        void uren;
        void komtVan;
        void tags;
        void relevantie;
        void status;
        void kanbanStatus;

        // Clear existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        // Debounce the save operation
        saveTimeout = setTimeout(() => {
            saveWorkItem();
            saveTimeout = null;
        }, 1000); // Wait 1 second after user stops typing

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (saveTimeout) {
                clearTimeout(saveTimeout);
                saveTimeout = null;
            }
        };
    });

    function formatDate(dateString: string | null): string {
        if (!dateString) return "Geen datum";
        const date = new Date(dateString);
        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            backlog: "Backlog",
            gepland: "Gepland",
            "ad-hoc": "Ad-hoc",
        };
        return labels[status] || status;
    }

    /**
     * Generate next sequence number for subject
     * - If subject has "(2)" already, return "(3)"
     * - If subject has "(3)" already, return "(4)"
     * - Otherwise, return "(2)"
     */
    function generateNextSubject(currentSubject: string): string {
        // Check if there's already a sequence number like (2), (3), etc.
        const sequenceMatch = currentSubject.match(/\((\d+)\)(?=\s*$)/);

        if (sequenceMatch) {
            // Has a sequence number, increment it
            const currentNum = parseInt(sequenceMatch[1], 10);
            const nextNum = currentNum + 1;
            // Replace the existing sequence with the new one
            return currentSubject.replace(sequenceMatch[0], `(${nextNum})`);
        } else {
            // No sequence number yet, add (2)
            return `${currentSubject} (2)`;
        }
    }

    /**
     * Handle duplicate task click
     * Opens BacklogDrawer with all data duplicated and subject incremented
     */
    async function handleDuplicateTask() {
        if (!workItem) return;

        const nextSubject = generateNextSubject(workItem.subject || "");

        // Build URL params for opening BacklogDrawer in duplicate mode
        const params = new URLSearchParams();
        params.set("drawer", "workitem");
        params.set("duplicate", "true");

        // Encode the duplicate data
        const duplicateData = {
            subject: nextSubject,
            voor_wie: workItem.voor_wie_is_het,
            wat_ga_je_doen: workItem.wat_ga_je_doen,
            waarom_doe_je_het: workItem.waarom_doe_je_het,
            assignee_id: Array.isArray(workItem.assignee_id)
                ? workItem.assignee_id
                : workItem.assignee_id
                  ? [workItem.assignee_id]
                  : [],
            project_id: workItem.project_id,
            due_date: workItem.deadline
                ? new Date(workItem.deadline).toISOString().split("T")[0]
                : null,
            tags: workItem.tags || [],
            komt_van: workItem.komt_van,
            uren: workItem.uren ? String(workItem.uren) : "",
            relevantie: workItem.relevantie,
            priority: (workItem as any).priority || "normaal",
            status: "backlog",
            kanban_status: "backlog",
            case_step_id: workItem.case_step_id,
            task_id: workItem.task_id,
        };

        console.log(
            "[WorkItemDetailsDrawer] Storing duplicate data in sessionStorage:",
            duplicateData,
        );

        // Store duplicate data in sessionStorage for BacklogDrawer to pick up
        sessionStorage.setItem(
            "duplicate-task-data",
            JSON.stringify(duplicateData),
        );

        // Navigate to open BacklogDrawer
        await goto(`?${params.toString()}`, { noScroll: true });
    }

    function getKanbanStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            backlog: "Backlog",
            gepland: "Gepland",
            mee_bezig: "Mee bezig",
            in_review: "In review",
            afgerond: "Afgerond",
            overdue: "Te laat",
        };
        return labels[status] || status;
    }

    // User select options
    const userOptions = $derived(
        users.map((u) => ({
            value: u.id,
            label: u.name || u.email || u.username || u.id,
        })),
    );

    // Get selected assignee names for display
    const selectedAssigneeNames = $derived.by(() => {
        return assigneeIds
            .map((id) => {
                const user = users.find((u) => u.id === id);
                return user ? formatUserName(user) : null;
            })
            .filter((name): name is string => name !== null);
    });

    // Project select options
    const projectOptions = $derived(
        projects.map((p) => ({
            value: String(p.id),
            label: p.name,
        })),
    );

    // Status options
    const statusOptions = [
        { value: "backlog", label: "Backlog" },
        { value: "gepland", label: "Gepland" },
        { value: "ad-hoc", label: "Ad-hoc" },
    ];

    // Kanban status options
    const kanbanStatusOptions = [
        { value: "gepland", label: "Gepland" },
        { value: "mee_bezig", label: "Mee bezig" },
        { value: "in_review", label: "In review" },
        { value: "afgerond", label: "Afgerond" },
    ];
</script>

<Drawer
    open={isOpen}
    position="right"
    class="w-[95vw] md:w-[66vw]"
    onclose={handleClose}
>
    <div class="flex flex-col h-full">
        {#if loading}
            <div class="flex-1 flex items-center justify-center">
                <Spinner size="sm" />
            </div>
        {:else if workItem}
            <div class="flex flex-col h-full">
                <!-- Title Header -->
                <div class="flex-shrink-0 pb-4 border-b border-zinc-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2
                                class="text-2xl font-semibold text-zinc-900 font-aspekta"
                            >
                                Taak bewerken
                            </h2>
                            <p class="text-sm text-zinc-600 mt-1">
                                Wijzig de details van de taak
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <IconButton
                                icon={ExternalLink}
                                variant="ghost"
                                size="default"
                                tooltip="Open volledige pagina"
                                tooltipPosition="left"
                                onclick={() => goto(`/work/${workItemId}`)}
                            />
                            <IconButton
                                icon={Copy}
                                variant="ghost"
                                size="default"
                                tooltip="Dupliceren"
                                tooltipPosition="left"
                                onclick={handleDuplicateTask}
                            />
                        </div>
                    </div>
                </div>

                <div class="flex-shrink-0 border-b border-zinc-200">
                    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                        {#each tabs as tab}
                            <button
                                type="button"
                                onclick={() => handleTabChange(tab.id)}
                                class="whitespace-nowrap py-4 px-1 border-b font-medium text-sm transition relative"
                                class:border-zinc-900={activeTab === tab.id}
                                class:text-zinc-900={activeTab === tab.id}
                                class:border-transparent={activeTab !== tab.id}
                                class:text-zinc-500={activeTab !== tab.id}
                                class:hover:text-zinc-900={activeTab !== tab.id}
                                class:hover:border-zinc-300={activeTab !==
                                    tab.id}
                                class:z-20={activeTab === tab.id}
                                aria-current={activeTab === tab.id
                                    ? "page"
                                    : undefined}
                            >
                                {tab.label}
                            </button>
                        {/each}
                    </nav>
                </div>
                <div class="flex-1 overflow-y-auto p-6">
                    {#if activeTab === "details"}
                        <!-- Details Tab -->
                        <div class="space-y-6">
                            <!-- Subject/Title -->
                            <div>
                                <label
                                    for="subject"
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Onderwerp
                                </label>
                                <div class="relative">
                                    <input
                                        id="subject"
                                        type="text"
                                        bind:value={subject}
                                        placeholder="Voer onderwerp in..."
                                        class="w-full px-3 py-2 pr-12 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
                                    />
                                    <span
                                        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none {subject.length >
                                        40
                                            ? 'text-red-600'
                                            : 'text-zinc-600'}"
                                        >{subject.length}/55</span
                                    >
                                </div>
                            </div>

                            <!-- Wat ga je doen -->
                            <div>
                                <label
                                    for="wat-ga-je-doen"
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Wat ga je doen
                                </label>
                                <Textarea
                                    id="wat-ga-je-doen"
                                    bind:value={watGaJeDoen}
                                    placeholder="Beschrijf wat je gaat doen..."
                                    rows={3}
                                    class="w-full"
                                />
                            </div>

                            <!-- Grid: Waarom doe je het and Voor wie is het -->
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Waarom doe je het -->
                                <div>
                                    <label
                                        for="waarom"
                                        class="block text-sm font-medium text-zinc-700 mb-1"
                                    >
                                        Waarom doe je het
                                    </label>
                                    <Textarea
                                        id="waarom"
                                        bind:value={waarom}
                                        placeholder="Beschrijf waarom je dit doet..."
                                        rows={3}
                                        class="w-full"
                                    />
                                </div>

                                <!-- Voor wie is het -->
                                <div>
                                    <label
                                        for="voor-wie"
                                        class="block text-sm font-medium text-zinc-700 mb-1"
                                    >
                                        Voor wie is het
                                    </label>
                                    <input
                                        id="voor-wie"
                                        type="text"
                                        bind:value={voorWie}
                                        placeholder="Voor wie is dit werk..."
                                        class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
                                    />
                                </div>
                            </div>

                            <!-- Grid: Assignee, Project, Due Date, Hours -->
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Assignee -->
                                <div>
                                    <label
                                        for="assignee"
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Toegewezen aan
                                    </label>
                                    <Select
                                        bind:selectedValues={assigneeIds}
                                        multiple={true}
                                        options={userOptions}
                                        placeholder={usersLoading
                                            ? "Gebruikers laden..."
                                            : "Selecteer gebruikers..."}
                                        disabled={usersLoading}
                                        loading={usersLoading}
                                        class="w-full"
                                    />
                                </div>

                                <!-- Project -->
                                <div>
                                    <label
                                        for="project"
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Project
                                    </label>
                                    <Select
                                        bind:value={selectedProjectId}
                                        options={[
                                            {
                                                value: "",
                                                label: "Geen project",
                                            },
                                            ...projectOptions,
                                        ]}
                                        class="w-full"
                                    />
                                </div>

                                <!-- Due Date -->
                                <div>
                                    <label
                                        for="due-date"
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Vervaldatum
                                    </label>
                                    <DatePicker
                                        id="due-date"
                                        bind:value={dueDate}
                                    />
                                </div>

                                <!-- Hours -->
                                <div>
                                    <label
                                        for="uren"
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Uren
                                    </label>
                                    <input
                                        id="uren"
                                        type="number"
                                        bind:value={uren}
                                        placeholder="0"
                                        min="0"
                                        step="0.1"
                                        class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
                                    />
                                </div>
                            </div>

                            <!-- Assignee labels (only show when more than 1 assignee) -->
                            {#if selectedAssigneeNames.length > 1}
                                <div class="w-full flex flex-wrap gap-2 mt-2">
                                    {#each selectedAssigneeNames as name}
                                        <Label>{name}</Label>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Status -->
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        for="status"
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Status
                                    </label>
                                    <Select
                                        bind:value={status}
                                        options={statusOptions}
                                        class="w-full"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="kanban-status"
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Kanban Status
                                    </label>
                                    <Select
                                        bind:value={kanbanStatus}
                                        options={kanbanStatusOptions}
                                        class="w-full"
                                    />
                                </div>
                            </div>

                            <!-- Tags -->
                            <div>
                                <label
                                    for="tags"
                                    class="block text-sm font-medium text-zinc-700 mb-2"
                                >
                                    Tags
                                </label>
                                <TagInput
                                    id="tags"
                                    bind:tags
                                    placeholder="Voeg tags toe..."
                                    class="w-full"
                                />
                            </div>

                            <!-- Relevantie -->
                            <div>
                                <label
                                    class="block text-sm font-medium text-zinc-700 mb-2"
                                >
                                    Relevantie
                                </label>
                                <Rating
                                    rating={relevantie ?? undefined}
                                    max={5}
                                    size="default"
                                    onchange={(val) => {
                                        relevantie = val ?? null;
                                    }}
                                />
                            </div>

                            <!-- Komt van -->
                            <div>
                                <label
                                    for="komt-van"
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Komt van (e-mailadres)
                                </label>
                                <KomtVanInput
                                    id="komt-van"
                                    bind:value={komtVan}
                                    placeholder="email@example.com"
                                    maxSuggestions={10}
                                />
                            </div>

                            <!-- Save indicator -->
                            {#if saving}
                                <div
                                    class="flex items-center gap-2 text-sm text-zinc-500"
                                >
                                    <Spinner size="xs" />
                                    <span>Opslaan...</span>
                                </div>
                            {/if}

                            <!-- Timestamps -->
                            {#if workItem}
                                <div class="pt-4 border-t border-zinc-200">
                                    <div
                                        class="grid grid-cols-2 gap-4 text-xs text-zinc-500"
                                    >
                                        <div>
                                            <span class="font-medium"
                                                >Aangemaakt:</span
                                            >
                                            <span class="ml-1">
                                                {workItem.created_at
                                                    ? new Date(
                                                          workItem.created_at,
                                                      ).toLocaleString("nl-NL")
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="font-medium"
                                                >Bijgewerkt:</span
                                            >
                                            <span class="ml-1">
                                                {workItem.updated_at
                                                    ? new Date(
                                                          workItem.updated_at,
                                                      ).toLocaleString("nl-NL")
                                                    : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else if activeTab === "berichten"}
                        <!-- Berichten Tab -->
                        <div class="space-y-6">
                            <div class="text-center py-12 text-zinc-500">
                                <p class="text-sm">
                                    Berichten functionaliteit komt binnenkort
                                    beschikbaar.
                                </p>
                            </div>
                        </div>
                    {:else if activeTab === "bestanden"}
                        <!-- Bestanden Tab -->
                        <div class="space-y-6">
                            {#if workItem.bijlagen && workItem.bijlagen.length > 0}
                                <FileList
                                    files={workItem.bijlagen}
                                    title="Bijlagen"
                                />
                            {:else}
                                <div class="text-center py-12 text-zinc-500">
                                    <p class="text-sm">
                                        Geen bijlagen beschikbaar.
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center py-12 text-zinc-500">
                    Geen taak geselecteerd
                </div>
            </div>
        {/if}
    </div>
</Drawer>
