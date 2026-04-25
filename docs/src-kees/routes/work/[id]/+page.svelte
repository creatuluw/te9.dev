<script lang="ts">
    import { onMount, onDestroy, untrack } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Tabs } from "$lib/components";
    import * as taskService from "$lib/services/taskService";
    import * as caseService from "$lib/services/caseService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import * as taskAssigneeService from "$lib/services/taskAssigneeService";
    import { getRowByIdResult, deleteRowsResult } from "$lib/utils/postgrest";
    import { navigationStore } from "$lib/stores/navigationStore";
    import { breadcrumbStore } from "$lib/stores/breadcrumbStore";
    import { toastStore } from "$lib/stores/toastStore";
    import { checklistStore } from "$lib/stores/checklistStore";
    import { taskStore } from "$lib/stores/taskStore";
    import { caseStore } from "$lib/stores/caseStore";
    import { getUserMessage } from "$lib/types/errors";
    import CaseTaskEditForm from "$lib/components/CaseTaskEditForm.svelte";
    import type { CaseTask } from "$lib/schemas/case";
    import type { Case } from "$lib/schemas/case";
    import type { Process } from "$lib/schemas/process";
    import type { Task } from "$lib/schemas/task";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import Button from "$lib/components/Button.svelte";
    import ButtonGroup from "$lib/components/ButtonGroup.svelte";
    import DatePicker from "$lib/components/DatePicker.svelte";
    import KomtVanInput from "$lib/components/KomtVanInput.svelte";
    import TagInput from "$lib/components/TagInput.svelte";
    import Rating from "$lib/components/Rating.svelte";
    import { formatUserName, getCurrentUserId } from "$lib/utils/userUtils";
    import { authStore } from "$lib/stores/authStore";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Label from "$lib/components/Label.svelte";
    import FileUpload from "$lib/components/FileUpload.svelte";
    import FileManagerTab from "$lib/components/FileManagerTab.svelte";
    import MessagesTab from "$lib/components/MessagesTab.svelte";
    import NotesTab from "$lib/components/NotesTab.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import { Trash2 } from "lucide-svelte";
    import * as eventLogService from "$lib/services/eventLogService";
    import * as projectService from "$lib/services/projectService";
    import * as minioService from "$lib/services/minioService";
    import type { Project } from "$lib/schemas/project";
    import PublicSharingToggle from "$lib/components/PublicSharingToggle.svelte";
    import { hasPermission } from "$lib/utils/authGuard";
    import * as projectMemberService from "$lib/services/projectMemberService";

    const workItemId = $derived(Number($page.params.id));
    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "overview");
    const currentPath = $derived($page.url.pathname);
    const readonlyParam = $derived(
        $page.url.searchParams.get("readonly") === "true",
    );

    let taskData = $state<any>(null);
    let taskType = $state<"work_item" | "case_task" | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Delete modal state
    let deleteModalOpen = $state(false);
    let deleting = $state(false);

    // For case tasks
    let caseTask = $state<CaseTask | null>(null);
    let taskCase = $state<Case | null>(null);
    let taskProcess = $state<Process | null>(null);

    // For work items
    let workItem = $state<Task | null>(null);

    // Get users from server-side load (avoids 431 header size issues)
    // Users are loaded server-side to avoid JWT token header size limitations
    let users = $state<PocketBaseUser[]>($page.data.users || []);
    let projects = $state<Project[]>([]);

    // Sync with server data when it changes
    $effect(() => {
        const serverUsers = $page.data.users || [];
        if (serverUsers.length > 0) {
            users = serverUsers;
        }
    });

    // Update checklist store when work item ID changes
    $effect(() => {
        if (workItemId && !isNaN(workItemId)) {
            console.log(
                "[work/[id]] Setting checklist store work item ID:",
                workItemId,
            );
            checklistStore.setWorkItemId(workItemId);
        } else {
            console.log("[work/[id]] Invalid work item ID:", workItemId);
        }
    });

    onMount(async () => {
        await Promise.all([loadTask(), loadProjects()]);
        // Users are loaded server-side - no need for client-side call
    });

    onDestroy(() => {
        // Clear breadcrumb entity name when leaving the page
        breadcrumbStore.clearEntityName(currentPath);
        // Clear checklist store when leaving the page
        checklistStore.setWorkItemId(null);
    });

    async function loadUsers() {
        try {
            const result = await pocketbaseService.getAllUsers();
            if (result.success) {
                users = result.value;
                console.log("[work/[id]] Loaded users:", users.length);
            } else {
                console.error("[work/[id]] Error loading users:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
                users = [];
            }
        } catch (error) {
            console.error("[work/[id]] Unexpected error loading users:", error);
            toastStore.add("Fout bij laden van gebruikers", "error");
            users = [];
        }
    }

    async function loadProjects() {
        try {
            const currentUserId = getCurrentUserId();
            if (!currentUserId) return;
            const result =
                await projectService.getProjectsForUser(currentUserId);
            if (result.success) {
                projects = result.value;
            }
        } catch (error) {
            console.error("Error loading projects:", error);
        }
    }

    async function loadTask() {
        loading = true;
        navigationStore.startPageLoading();
        error = null;

        if (!workItemId || isNaN(workItemId)) {
            error = `Ongeldig werk item ID: ${$page.params.id}`;
            loading = false;
            navigationStore.stopPageLoading();
            return;
        }

        // Get task from unified _bpm_tasks table
        const taskResult = await getRowByIdResult<any>(
            "_bpm_tasks",
            workItemId,
        );
        if (!taskResult.success) {
            error = "Werk item niet gevonden";
            toastStore.add(getUserMessage(taskResult.error), "error");
            loading = false;
            navigationStore.stopPageLoading();
            return;
        }

        taskData = taskResult.value;

        // Check project access control (client-side fallback)
        if (taskData.project_id) {
            const userId = $authStore?.user?.id;
            const isSysadmin = $authStore?.user?.is_sysadmin === true;

            // Sysadmins can access everything
            if (!isSysadmin) {
                const canAccess = await projectMemberService.canAccessProject(
                    taskData.project_id,
                    userId,
                );
                if (!canAccess) {
                    error =
                        "Je hebt geen toegang tot dit werk item. Dit item behoort tot een privé project waarvan je geen lid bent.";
                    toastStore.add("Geen toegang tot dit werk item", "error");
                    loading = false;
                    navigationStore.stopPageLoading();
                    return;
                }
            }
        }

        taskType = taskData.task_type === "process" ? "case_task" : "work_item";

        if (taskType === "case_task") {
            await loadCaseTask();
        } else {
            await loadWorkItem();
        }

        loading = false;
        navigationStore.stopPageLoading();
    }

    // Check if task is closed (read-only)
    const isReadOnly = $derived.by(() => {
        // Check URL param first (for closed page navigation)
        if (readonlyParam) return true;
        // Check if task is closed
        if (taskData?.closed === true) return true;
        return false;
    });

    async function loadCaseTask() {
        if (!taskData) return;

        // Load attachments from bijlagen field
        attachments = taskData.bijlagen || [];

        // Enrich with assignees from junction table
        const assigneesResult =
            await taskAssigneeService.getTaskAssignees(workItemId);
        const assigneeIds = assigneesResult.success
            ? assigneesResult.value
            : [];

        // Map assignee_id array to owner_id (first assignee for backward compatibility)
        const mappedCaseTask = {
            ...taskData,
            assignee_id: assigneeIds, // Include assignee_id array
            owner_id:
                assigneeIds.length > 0
                    ? assigneeIds[0]
                    : taskData.owner_id || null, // Map first assignee to owner_id
        };

        // Enrich with process task data (name, description, criteria)
        if (taskData.task_id) {
            const processTaskResult = await getRowByIdResult(
                "_bpm_process_tasks",
                taskData.task_id,
            );
            if (processTaskResult.success) {
                const processTask = processTaskResult.value;
                caseTask = {
                    ...mappedCaseTask,
                    name: processTask.name,
                    description: processTask.description,
                    criteria: processTask.criteria,
                    order_index: processTask.order_index,
                    links: processTask.links,
                    deadline_days: processTask.deadline_days,
                } as CaseTask;
                // Set entity name in breadcrumb store
                if (processTask.name) {
                    breadcrumbStore.setEntityName(
                        currentPath,
                        processTask.name,
                    );
                }
            } else {
                caseTask = mappedCaseTask as CaseTask;
                // Set entity name from taskData if available
                if (taskData.name) {
                    breadcrumbStore.setEntityName(currentPath, taskData.name);
                }
            }
        } else {
            caseTask = mappedCaseTask as CaseTask;
            // Set entity name from taskData if available
            if (taskData.name) {
                breadcrumbStore.setEntityName(currentPath, taskData.name);
            }
        }

        // Load case information via case_step_id
        if (taskData.case_step_id) {
            const caseStepResult = await getRowByIdResult<any>(
                "_bpm_case_steps",
                taskData.case_step_id,
            );
            if (caseStepResult.success) {
                const caseStep = caseStepResult.value;

                // Load case
                const caseResult = await getRowByIdResult<Case>(
                    "_bpm_cases",
                    caseStep.case_id,
                );
                if (caseResult.success) {
                    taskCase = caseResult.value;

                    // Load process from case
                    const processResult = await getRowByIdResult<Process>(
                        "_bpm_processes",
                        taskCase.process_id,
                    );
                    if (processResult.success) {
                        taskProcess = processResult.value;
                    }
                }
            }
        }
    }

    async function loadWorkItem() {
        if (!taskData) return;

        // Load attachments from bijlagen field (similar to loadCaseTask)
        attachments = taskData.bijlagen || [];

        const result = await taskService.getWorkItemById(workItemId);
        if (result.success) {
            workItem = result.value;
            // Set entity name in breadcrumb store
            if (workItem.subject) {
                breadcrumbStore.setEntityName(currentPath, workItem.subject);
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    async function handleCaseTaskSaved(savedTask: CaseTask) {
        toastStore.add("Taak bijgewerkt", "success");
        await loadTask();
    }

    function handleCaseTaskCancelled() {
        // Navigate back to backlog when cancelled
        goto("/work/backlog");
    }

    function handleDeleteClick(event: MouseEvent) {
        event.stopPropagation();
        deleteModalOpen = true;
    }

    function cancelDelete() {
        deleteModalOpen = false;
    }

    async function confirmDelete() {
        if (!taskData) return;

        deleting = true;
        try {
            let result;

            if (taskType === "work_item") {
                // Use taskService for work items
                result = await taskService.deleteWorkItem(workItemId);
            } else if (taskType === "case_task") {
                // Delete case task directly from _bpm_tasks table
                // Get task data before deletion for logging
                const currentTask = taskData;

                result = await deleteRowsResult("_bpm_tasks", {
                    id: `eq.${workItemId}`,
                });

                // Log case task deletion event if successful
                if (result.success && currentTask) {
                    await eventLogService
                        .logEvent(
                            "case_task_deleted",
                            "case_task",
                            workItemId,
                            {
                                oldValues: currentTask,
                                sourceUrl: "case_task_deletion",
                            },
                        )
                        .catch(console.error);
                }
            } else {
                toastStore.add("Onbekend type taak", "error");
                deleting = false;
                return;
            }

            if (result.success) {
                toastStore.add("Taak verwijderd", "success");

                // Refresh stores to immediately update lists
                if (taskType === "work_item") {
                    // Refresh work item store for work items
                    await taskStore.getPlanningItems(null, false);
                    await taskStore.getBacklogItems(null, false);
                } else if (taskType === "case_task") {
                    // Refresh case store for case tasks (they appear in cases list)
                    await caseStore.refresh(undefined, false);
                }

                // Navigate back to the previous page
                if (typeof window !== "undefined" && document.referrer) {
                    try {
                        const referrerUrl = new URL(document.referrer);
                        const currentUrl = new URL(window.location.href);
                        // Only navigate back if referrer is from the same origin and different page
                        if (
                            referrerUrl.origin === currentUrl.origin &&
                            referrerUrl.pathname !== currentUrl.pathname
                        ) {
                            await goto(
                                referrerUrl.pathname + referrerUrl.search,
                            );
                            deleting = false;
                            return;
                        }
                    } catch (e) {
                        // Invalid referrer URL, fall through to history.back()
                    }
                }
                // Fallback: use browser history to go back
                if (typeof window !== "undefined") {
                    window.history.back();
                } else {
                    await goto("/work");
                }
                deleting = false;
            } else {
                console.error("Error deleting task:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
                deleting = false;
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            toastStore.add("Fout bij verwijderen van taak", "error");
            deleting = false;
        }
    }

    // Subscribe to checklist store for badge count
    let checklistOpenCount = $state(0);
    checklistStore.subscribe((state) => {
        checklistOpenCount = state.openCount;
    });

    // Define tabs with badge support
    const tabs = $derived.by(() => [
        { id: "overview", label: "Overzicht" },
        { id: "files", label: "Bestanden" },
        { id: "messages", label: "Berichten" },
        {
            id: "notities",
            label: "Notities",
            badgeCount: checklistOpenCount > 0 ? checklistOpenCount : undefined,
        },
        { id: "timeline", label: "Tijdslijn" },
        { id: "instellingen", label: "Instellingen" },
        { id: "help", label: "Help" },
    ]);

    // Work item form state
    let assigneeId = $state<string[]>([]);
    let selectedProjectId = $state<string | null>(null);
    let subject = $state("");
    let voorWie = $state("");
    let watGaJeDoen = $state("");
    let waarom = $state("");
    let dueDate = $state<string | null>(null);
    let uren = $state<string>("");
    let komtVan = $state("");
    let tags = $state<string[]>([]);
    let relevantie = $state<number | null>(null);
    let priority = $state<"laag" | "normaal" | "hoog">("normaal");
    let attachments = $state<string[]>([]);
    let status = $state<"backlog" | "gepland" | "ad-hoc">("backlog");
    let kanbanStatus = $state<
        | "backlog"
        | "gepland"
        | "mee_bezig"
        | "in_review"
        | "afgerond"
        | "overdue"
    >("gepland");
    let saving = $state(false);
    let uploadingFiles = $state(false);

    // Track initial values to prevent saving on initial load
    let initialValuesLoaded = $state(false);

    // Store initial values to compare against
    let initialValues = $state<{
        assigneeId: string[];
        selectedProjectId: string | null;
        subject: string;
        voorWie: string;
        watGaJeDoen: string;
        waarom: string;
        dueDate: string | null;
        uren: string;
        komtVan: string;
        tags: string[];
        relevantie: number | null;
        priority: "laag" | "normaal" | "hoog";
        status: "backlog" | "gepland" | "ad-hoc";
        kanbanStatus:
            | "backlog"
            | "gepland"
            | "mee_bezig"
            | "in_review"
            | "afgerond"
            | "overdue";
    } | null>(null);

    const projectOptions = $derived.by(() => {
        const opts: SelectOption[] = [{ value: "", label: "Geen project" }];
        for (const project of projects) {
            opts.push({ value: String(project.id), label: project.name });
        }
        return opts;
    });

    const userOptions = $derived(
        users.map((u) => ({
            value: u.id,
            label: u.name || u.email || u.username || "Unknown User",
        })),
    );

    // Get selected assignee names for display
    const selectedAssigneeNames = $derived.by(() => {
        return assigneeId
            .map((id) => {
                const user = users.find((u) => u.id === id);
                return user ? formatUserName(user) : null;
            })
            .filter((name): name is string => name !== null);
    });

    // Initialize work item form
    // Track the last work item ID and updated_at to detect when work item is reloaded
    let lastWorkItemId = $state<number | null>(null);
    let lastWorkItemUpdatedAt = $state<string | null>(null);

    $effect(() => {
        if (!workItem) return;
        const w = workItem;

        // Get the work item ID and updated_at without tracking reactivity
        const currentId = untrack(() => w.id);
        const currentUpdatedAt = untrack(() => (w as any).updated_at || null);

        // Only skip initialization if it's the same work item with the same updated_at AND initial values are already loaded
        // This allows re-initialization when the work item is reloaded after a save
        if (
            currentId === lastWorkItemId &&
            currentUpdatedAt === lastWorkItemUpdatedAt &&
            initialValuesLoaded
        ) {
            return;
        }

        // If it's a different work item or not yet initialized, proceed
        const isNewWorkItem =
            currentId !== lastWorkItemId ||
            currentUpdatedAt !== lastWorkItemUpdatedAt;

        if (isNewWorkItem) {
            lastWorkItemId = currentId;
            lastWorkItemUpdatedAt = currentUpdatedAt;

            // Reset initial values loaded flag when work item changes
            initialValuesLoaded = false;
            initialValues = null;
        }

        // Use untrack to read values without causing reactivity loops
        untrack(() => {
            // Handle assignee_id as array (new format) or single value (legacy)
            // Ensure all values are strings to match Select option values
            const assigneeIdValue = Array.isArray(w.assignee_id)
                ? w.assignee_id
                : w.assignee_id
                  ? [w.assignee_id]
                  : [];

            assigneeId = assigneeIdValue.map((id) => String(id));
            selectedProjectId = w.project_id ? String(w.project_id) : null;
            subject = w.subject ?? "";
            voorWie = w.voor_wie_is_het ?? "";
            watGaJeDoen = w.wat_ga_je_doen ?? "";
            waarom = w.waarom_doe_je_het ?? "";

            // Convert deadline (ISO datetime) to due_date (YYYY-MM-DD) format
            // The database stores deadline, but the form needs due_date format
            // Extract date part directly to avoid timezone conversion issues
            const workItemAny = w as any;
            if (workItemAny.deadline) {
                const deadlineStr = String(workItemAny.deadline);
                // Extract YYYY-MM-DD from the datetime string (handles both date-only and datetime formats)
                const dateMatch = deadlineStr.match(/^(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    dueDate = dateMatch[1];
                } else {
                    // Fallback: parse as date and extract date part in local timezone
                    const date = new Date(deadlineStr);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    dueDate = `${year}-${month}-${day}`;
                }
            } else if (workItemAny.due_date) {
                dueDate = workItemAny.due_date;
            } else {
                dueDate = null;
            }

            uren = w.uren ? String(w.uren) : "";
            komtVan = w.komt_van ?? "";
            tags = w.tags || [];
            relevantie = w.relevantie || null;
            priority = (w as any).priority || "normaal";
            attachments = w.bijlagen || [];
            status = w.status as "backlog" | "gepland" | "ad-hoc";
            kanbanStatus =
                (w.kanban_status as
                    | "backlog"
                    | "gepland"
                    | "mee_bezig"
                    | "in_review"
                    | "afgerond"
                    | "overdue") || "gepland";
        });

        // Only set up timeout if initial values aren't already loaded
        if (!initialValuesLoaded) {
            // Store initial values snapshot after a short delay to prevent saving on initial load
            const timeoutId = setTimeout(() => {
                initialValues = {
                    assigneeId: [...assigneeId],
                    selectedProjectId,
                    subject,
                    voorWie,
                    watGaJeDoen,
                    waarom,
                    dueDate,
                    uren,
                    komtVan,
                    tags: [...tags], // Create a copy of the array
                    relevantie,
                    priority,
                    status,
                    kanbanStatus,
                };
                initialValuesLoaded = true;
            }, 500);

            return () => {
                clearTimeout(timeoutId);
            };
        }
    });

    function hasFormChanged(): boolean {
        if (!initialValues) return false;
        const iv = initialValues;

        // Compare arrays by converting to strings (simple comparison)
        const tagsEqual =
            JSON.stringify(tags.sort()) === JSON.stringify(iv.tags.sort());

        // Compare arrays by checking length and contents
        const assigneesChanged =
            assigneeId.length !== iv.assigneeId.length ||
            !assigneeId.every((id, index) => id === iv.assigneeId[index]);

        return (
            assigneesChanged ||
            selectedProjectId !== iv.selectedProjectId ||
            subject !== iv.subject ||
            voorWie !== iv.voorWie ||
            watGaJeDoen !== iv.watGaJeDoen ||
            waarom !== iv.waarom ||
            dueDate !== iv.dueDate ||
            uren !== iv.uren ||
            komtVan !== iv.komtVan ||
            !tagsEqual ||
            relevantie !== iv.relevantie ||
            priority !== iv.priority ||
            status !== iv.status ||
            kanbanStatus !== iv.kanbanStatus
        );
    }

    // Reactive derived value to track form changes
    // Access all form fields to ensure reactivity
    const hasChanges = $derived.by(() => {
        if (!initialValuesLoaded || !initialValues) {
            return false;
        }
        const iv = initialValues;

        // Access all form fields to track changes reactively
        const currentAssigneeId = assigneeId;
        const currentSelectedProjectId = selectedProjectId;
        const currentSubject = subject;
        const currentVoorWie = voorWie;
        const currentWatGaJeDoen = watGaJeDoen;
        const currentWaarom = waarom;
        const currentDueDate = dueDate;
        const currentUren = uren;
        const currentKomtVan = komtVan;
        const currentTags = tags;
        const currentRelevantie = relevantie;
        const currentPriority = priority;
        const currentStatus = status;
        const currentKanbanStatus = kanbanStatus;

        // Compare arrays by converting to strings (simple comparison)
        const tagsEqual =
            JSON.stringify(currentTags.sort()) ===
            JSON.stringify(iv.tags.sort());

        // Compare arrays by checking length and contents
        const assigneesChanged =
            currentAssigneeId.length !== iv.assigneeId.length ||
            !currentAssigneeId.every(
                (id, index) => id === iv.assigneeId[index],
            );

        return (
            assigneesChanged ||
            currentSelectedProjectId !== iv.selectedProjectId ||
            currentSubject !== iv.subject ||
            currentVoorWie !== iv.voorWie ||
            currentWatGaJeDoen !== iv.watGaJeDoen ||
            currentWaarom !== iv.waarom ||
            currentDueDate !== iv.dueDate ||
            currentUren !== iv.uren ||
            currentKomtVan !== iv.komtVan ||
            !tagsEqual ||
            currentRelevantie !== iv.relevantie ||
            currentPriority !== iv.priority ||
            currentStatus !== iv.status ||
            currentKanbanStatus !== iv.kanbanStatus
        );
    });

    async function saveWorkItem() {
        if (!workItem || !initialValuesLoaded || saving) {
            return;
        }

        const formChanged = hasFormChanged();
        if (!formChanged) {
            toastStore.add("Geen wijzigingen om op te slaan", "info");
            return;
        }

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
            assignee_id: assigneeId.length > 0 ? assigneeId : [],
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
            priority: priority,
            status: status,
            kanban_status: kanbanStatus || null,
        };

        try {
            const result = await taskService.updateWorkItem(workItem.id, data);
            if (result.success) {
                // Update work item with the returned data (avoids full reload)
                const updatedWorkItem = result.value[0];
                if (updatedWorkItem) {
                    // Update the work item and the tracking variable to prevent initialization effect from resetting form
                    const newUpdatedAt =
                        (updatedWorkItem as any).updated_at || null;
                    workItem = updatedWorkItem;
                    // Update the tracking variable so initialization effect doesn't reset form values
                    lastWorkItemUpdatedAt = newUpdatedAt;
                }

                // Update initial values to match current values to prevent unnecessary saves
                if (initialValues) {
                    initialValues = {
                        assigneeId: [...assigneeId],
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
                        priority,
                        status,
                        kanbanStatus,
                    };
                }

                // Show toast message for successful save
                toastStore.add("Werk item bijgewerkt", "success");
            } else {
                console.error("[Save] Save failed:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (error) {
            console.error("[Save] Unexpected error during save:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het opslaan",
                "error",
            );
        } finally {
            saving = false;
        }
    }

    async function handleFileUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        uploadingFiles = true;
        const fileArray = Array.from(files);
        const newUrls: string[] = [];

        try {
            // Use MinIO for file uploads (same as FileManagerTab)
            const folder = workItemId ? `tasks/${workItemId}` : undefined;

            // Upload each file
            for (const file of fileArray) {
                const result = await minioService.uploadFile(
                    file,
                    folder,
                    workItemId,
                );
                if (result.success && result.value.url) {
                    // Store permanent URL (MinIO service now generates permanent URLs)
                    newUrls.push(result.value.url);
                } else if (!result.success) {
                    console.error("Error uploading file:", result.error);
                    toastStore.add(
                        `Fout bij uploaden van ${file.name}: ${getUserMessage(result.error)}`,
                        "error",
                    );
                }
            }

            if (newUrls.length > 0) {
                attachments = [...attachments, ...newUrls];
                toastStore.add(
                    `${newUrls.length} bestand(en) geüpload`,
                    "success",
                );
            }
        } catch (error) {
            console.error("Error uploading files:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het uploaden",
                "error",
            );
        }

        uploadingFiles = false;
    }

    function removeAttachment(fileIdentifier: string) {
        attachments = attachments.filter((a) => a !== fileIdentifier);
    }
</script>

<svelte:head>
    <title>Werk Item {workItemId} - Ons Werk</title>
</svelte:head>

{#if error && !taskData}
    <div class="container mx-auto px-4 py-8 max-w-[90vw]">
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <div class="text-red-600 mb-4">{error}</div>
                <Button onclick={() => goto("/work/backlog")}
                    >Terug naar Backlog</Button
                >
            </div>
        </div>
    </div>
{:else if taskData}
    <div
        class="container mx-auto px-4 max-w-[90vw] h-full flex flex-col overflow-hidden"
    >
        <div class="flex flex-col flex-1 min-h-0 pt-8 pb-8">
            <!-- Header -->
            <div class="mb-6 pb-4 border-b border-zinc-200 flex-shrink-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <h2
                                class="text-2xl font-bold text-zinc-900 font-aspekta"
                            >
                                {taskData.subject ||
                                    caseTask?.name ||
                                    `Item ${workItemId}`}
                            </h2>
                        </div>
                        {#if taskType === "case_task" && taskCase}
                            <div class="text-sm text-zinc-600">
                                Case: <a
                                    href="/cases/{taskCase.id}?tab=stappen"
                                    class="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    {taskCase.name}
                                </a>
                            </div>
                        {/if}
                    </div>
                    <div class="flex gap-2 items-center">
                        {#if isReadOnly}
                            <div
                                class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
                            >
                                ✓ Afgesloten (alleen lezen)
                            </div>
                        {/if}
                        <Button
                            variant="secondary"
                            onclick={() => goto("/work/backlog")}
                            >Terug naar Backlog</Button
                        >
                        {#if !isReadOnly}
                            <Tooltip text="Taak verwijderen">
                                <IconButton
                                    icon={Trash2}
                                    variant="danger"
                                    onclick={handleDeleteClick}
                                />
                            </Tooltip>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <Tabs
                {tabs}
                activeTab={activeTabFromUrl}
                class="flex-1 flex flex-col min-h-0"
                ontabchange={async (tabId) => {
                    const url = new URL($page.url);
                    const currentTab = url.searchParams.get("tab");

                    if (currentTab !== tabId) {
                        url.searchParams.set("tab", tabId);
                        await goto(url.pathname + url.search, {
                            noScroll: true,
                        });
                    }
                }}
            >
                {#snippet children({ activeTab }: { activeTab: string })}
                    <div class="flex-1 flex flex-col min-h-0">
                        <!-- Overview Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "overview"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                {#if taskType === "case_task" && caseTask}
                                    <!-- Case Task Form -->
                                    <div
                                        class="bg-white border border-zinc-200 rounded-lg p-6"
                                    >
                                        <CaseTaskEditForm
                                            {caseTask}
                                            case={taskCase}
                                            process={taskProcess}
                                            onsaved={handleCaseTaskSaved}
                                            oncancelled={handleCaseTaskCancelled}
                                            readonly={isReadOnly}
                                        />
                                    </div>
                                {:else if taskType === "work_item" && workItem}
                                    <!-- Work Item Form -->
                                    <div
                                        class="bg-white border border-zinc-200 rounded-lg p-6"
                                    >
                                        <div class="space-y-6">
                                            <!-- Subject -->
                                            <div>
                                                <label
                                                    for="subject"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Onderwerp
                                                </label>
                                                <div class="relative">
                                                    <input
                                                        id="subject"
                                                        type="text"
                                                        bind:value={subject}
                                                        readonly={isReadOnly}
                                                        disabled={isReadOnly}
                                                        class="w-full px-3 py-2 pr-12 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm {isReadOnly
                                                            ? 'bg-zinc-50 cursor-not-allowed'
                                                            : ''}"
                                                        placeholder="Onderwerp van de taak"
                                                        required
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

                                            <!-- Status and Kanban Status Button Groups in one row -->
                                            <div class="grid grid-cols-2 gap-0">
                                                <div>
                                                    <label
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Status
                                                    </label>
                                                    <ButtonGroup size="sm">
                                                        <Button
                                                            type="button"
                                                            variant={status ===
                                                            "backlog"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    status =
                                                                        "backlog";
                                                                    kanbanStatus =
                                                                        "backlog";
                                                                }
                                                            }}
                                                        >
                                                            Backlog
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={status ===
                                                            "gepland"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    status =
                                                                        "gepland";
                                                                    kanbanStatus =
                                                                        "gepland";
                                                                }
                                                            }}
                                                        >
                                                            Gepland
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={status ===
                                                            "ad-hoc"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    status =
                                                                        "ad-hoc";
                                                                    kanbanStatus =
                                                                        "gepland";
                                                                }
                                                            }}
                                                        >
                                                            Ad-hoc
                                                        </Button>
                                                    </ButtonGroup>
                                                </div>

                                                <div>
                                                    <label
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Kanban status
                                                    </label>
                                                    <ButtonGroup
                                                        size="sm"
                                                        class="w-full"
                                                    >
                                                        <Button
                                                            type="button"
                                                            variant={kanbanStatus ===
                                                            "backlog"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    kanbanStatus =
                                                                        "backlog";
                                                                    status =
                                                                        "backlog";
                                                                }
                                                            }}
                                                        >
                                                            Backlog
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={kanbanStatus ===
                                                            "gepland"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    kanbanStatus =
                                                                        "gepland";
                                                                }
                                                            }}
                                                        >
                                                            Gepland
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={kanbanStatus ===
                                                            "mee_bezig"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    kanbanStatus =
                                                                        "mee_bezig";
                                                                }
                                                            }}
                                                        >
                                                            Mee bezig
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={kanbanStatus ===
                                                            "in_review"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    kanbanStatus =
                                                                        "in_review";
                                                                }
                                                            }}
                                                        >
                                                            In review
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={kanbanStatus ===
                                                            "afgerond"
                                                                ? "default"
                                                                : "secondary"}
                                                            class="button-group-item"
                                                            disabled={isReadOnly}
                                                            onclick={() => {
                                                                if (
                                                                    !isReadOnly
                                                                ) {
                                                                    kanbanStatus =
                                                                        "afgerond";
                                                                }
                                                            }}
                                                        >
                                                            Afgerond
                                                        </Button>
                                                    </ButtonGroup>
                                                </div>
                                            </div>

                                            <!-- Toegewezen aan, Due date, Uren, Priority in one row -->
                                            <div class="grid grid-cols-4 gap-4">
                                                <div>
                                                    <label
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Toegewezen aan
                                                    </label>
                                                    <Select
                                                        options={userOptions}
                                                        bind:selectedValues={
                                                            assigneeId
                                                        }
                                                        multiple={true}
                                                        placeholder="Selecteer gebruikers..."
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        for="dueDate"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Due date
                                                    </label>
                                                    <DatePicker
                                                        id="dueDate"
                                                        bind:value={dueDate}
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        for="uren"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Uren
                                                    </label>
                                                    <input
                                                        id="uren"
                                                        type="number"
                                                        bind:value={uren}
                                                        min="0"
                                                        step="0.5"
                                                        readonly={isReadOnly}
                                                        disabled={isReadOnly}
                                                        class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm {isReadOnly
                                                            ? 'bg-zinc-50 cursor-not-allowed'
                                                            : ''}"
                                                        placeholder="0.0"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        for="priority"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Prioriteit
                                                    </label>
                                                    <Select
                                                        options={[
                                                            {
                                                                value: "laag",
                                                                label: "Laag",
                                                            },
                                                            {
                                                                value: "normaal",
                                                                label: "Normaal",
                                                            },
                                                            {
                                                                value: "hoog",
                                                                label: "Hoog",
                                                            },
                                                        ]}
                                                        bind:value={priority}
                                                        placeholder="Selecteer prioriteit..."
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                            </div>

                                            <!-- Assignee labels (only show when more than 1 assignee) -->
                                            {#if selectedAssigneeNames.length > 1}
                                                <div
                                                    class="w-full flex flex-wrap gap-2 mt-2"
                                                >
                                                    {#each selectedAssigneeNames as name}
                                                        <Label>{name}</Label>
                                                    {/each}
                                                </div>
                                            {/if}

                                            <!-- Komt van (e-mailadres) and Project in one row -->
                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label
                                                        for="komtVan"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Komt van (e-mailadres)
                                                    </label>
                                                    <KomtVanInput
                                                        id="komtVan"
                                                        bind:value={komtVan}
                                                        disabled={saving ||
                                                            isReadOnly}
                                                        placeholder="email@example.com"
                                                        maxSuggestions={10}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        for="project"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Project
                                                    </label>
                                                    <Select
                                                        options={projectOptions}
                                                        bind:value={
                                                            selectedProjectId
                                                        }
                                                        placeholder="Selecteer project..."
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                            </div>

                                            <!-- Voor wie is het -->
                                            <div>
                                                <label
                                                    for="voorWie"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Voor wie is het
                                                </label>
                                                <input
                                                    id="voorWie"
                                                    type="text"
                                                    bind:value={voorWie}
                                                    readonly={isReadOnly}
                                                    disabled={isReadOnly}
                                                    class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm {isReadOnly
                                                        ? 'bg-zinc-50 cursor-not-allowed'
                                                        : ''}"
                                                    placeholder="Voor wie is deze taak"
                                                />
                                            </div>

                                            <!-- Wat ga je doen and Waarom doe je het in one row -->
                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label
                                                        for="watGaJeDoen"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Wat ga je doen
                                                    </label>
                                                    <textarea
                                                        id="watGaJeDoen"
                                                        bind:value={watGaJeDoen}
                                                        rows="4"
                                                        readonly={isReadOnly}
                                                        disabled={isReadOnly}
                                                        class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm {isReadOnly
                                                            ? 'bg-zinc-50 cursor-not-allowed'
                                                            : ''}"
                                                        placeholder="Beschrijf wat je gaat doen"
                                                    ></textarea>
                                                </div>
                                                <div>
                                                    <label
                                                        for="waarom"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Waarom doe je het
                                                    </label>
                                                    <textarea
                                                        id="waarom"
                                                        bind:value={waarom}
                                                        rows="4"
                                                        readonly={isReadOnly}
                                                        disabled={isReadOnly}
                                                        class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm {isReadOnly
                                                            ? 'bg-zinc-50 cursor-not-allowed'
                                                            : ''}"
                                                        placeholder="Beschrijf waarom je dit doet"
                                                    ></textarea>
                                                </div>
                                            </div>

                                            <!-- Tags -->
                                            <div role="group" aria-label="Tags">
                                                <div
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Tags
                                                </div>
                                                <TagInput
                                                    bind:tags
                                                    readonly={isReadOnly}
                                                />
                                            </div>

                                            <!-- Bijdrage aan resultaten (1-5 sterren) -->
                                            <div>
                                                <label
                                                    for="relevantie"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Bijdrage aan resultaten
                                                </label>
                                                <Rating
                                                    rating={relevantie || 0}
                                                    max={5}
                                                    onchange={(r) =>
                                                        (relevantie = r)}
                                                    size="default"
                                                    readonly={isReadOnly}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <!-- Messages Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0"
                            style:display={activeTab === "messages"
                                ? "flex"
                                : "none"}
                        >
                            <MessagesTab
                                entityType="task"
                                entityId={workItemId}
                                entityName={subject}
                            />
                        </div>
                        <!-- Notities Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0"
                            style:display={activeTab === "notities"
                                ? "flex"
                                : "none"}
                        >
                            <NotesTab entityType="task" entityId={workItemId} />
                        </div>
                        <!-- Files Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "files"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                {#if taskType === "work_item" && workItem}
                                    <FileManagerTab
                                        entityType="task"
                                        entityId={workItemId}
                                        {attachments}
                                        readonly={isReadOnly}
                                        onAttachmentsChange={async (
                                            newAttachments,
                                        ) => {
                                            if (isReadOnly) return;
                                            attachments = newAttachments;
                                            // Update work item with new attachments
                                            const result =
                                                await taskService.updateWorkItem(
                                                    workItemId,
                                                    {
                                                        bijlagen:
                                                            newAttachments,
                                                        assignee_id:
                                                            workItem?.assignee_id ??
                                                            [],
                                                    } as any,
                                                );
                                            if (result.success) {
                                                toastStore.add(
                                                    "Bestanden bijgewerkt",
                                                    "success",
                                                );
                                            } else {
                                                toastStore.add(
                                                    getUserMessage(
                                                        result.error,
                                                    ),
                                                    "error",
                                                );
                                            }
                                        }}
                                    />
                                {:else if taskType === "case_task" && caseTask}
                                    <FileManagerTab
                                        entityType="task"
                                        entityId={workItemId}
                                        {attachments}
                                        readonly={isReadOnly}
                                        onAttachmentsChange={async (
                                            newAttachments,
                                        ) => {
                                            if (isReadOnly) return;
                                            attachments = newAttachments;
                                            // Update case task with new attachments
                                            // Case tasks are stored in _bpm_tasks table
                                            const { updateRowsResult } =
                                                await import("$lib/utils/postgrest");
                                            const result =
                                                await updateRowsResult(
                                                    "_bpm_tasks",
                                                    { id: `eq.${workItemId}` },
                                                    {
                                                        bijlagen:
                                                            newAttachments,
                                                    },
                                                );
                                            if (result.success) {
                                                toastStore.add(
                                                    "Bestanden bijgewerkt",
                                                    "success",
                                                );
                                                // Reload task data
                                                await loadTask();
                                            } else {
                                                toastStore.add(
                                                    getUserMessage(
                                                        result.error,
                                                    ),
                                                    "error",
                                                );
                                            }
                                        }}
                                    />
                                {:else}
                                    <div
                                        class="text-center py-12 text-zinc-500"
                                    >
                                        <p class="text-sm">Geen taak geladen</p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <!-- Timeline Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "timeline"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <div class="text-center py-12 text-zinc-500">
                                    <p class="text-sm">
                                        Tijdslijn functionaliteit komt
                                        binnenkort beschikbaar.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <!-- Instellingen Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "instellingen"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <div
                                    class="bg-white border border-zinc-200 rounded-lg p-6"
                                >
                                    <h3
                                        class="text-lg font-semibold text-zinc-900 font-aspekta mb-6"
                                    >
                                        Instellingen
                                    </h3>
                                    <div class="space-y-6">
                                        {#if hasPermission("/work/[id]", "write")}
                                            <div>
                                                <h4
                                                    class="text-sm font-medium text-zinc-700 mb-4"
                                                >
                                                    Delen
                                                </h4>
                                                <PublicSharingToggle
                                                    entityType="work"
                                                    entityId={workItemId}
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Help Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "help"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <div class="space-y-4">
                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Werk Item Overzicht
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Het <strong
                                                    class="text-zinc-900"
                                                    >Overzicht</strong
                                                > tabblad toont alle details van dit
                                                werk item. Hier kunt u de informatie
                                                bewerken en de voortgang volgen.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Bewerken
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                U kunt alle velden bewerken door
                                                op de <strong
                                                    class="text-zinc-900"
                                                    >Bijwerken</strong
                                                > knop te klikken na het wijzigen
                                                van de gegevens.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/snippet}
            </Tabs>

            <!-- Fixed Footer with Bijwerken Button (only for work items on overview tab, not readonly) -->
            {#if taskType === "work_item" && workItem && activeTabFromUrl === "overview" && !isReadOnly}
                <div
                    class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white"
                >
                    <div class="flex justify-between items-center">
                        <div class="flex gap-3">
                            <Button
                                onclick={saveWorkItem}
                                disabled={saving ||
                                    !initialValuesLoaded ||
                                    !hasChanges}
                            >
                                {saving ? "Opslaan..." : "Bijwerken"}
                            </Button>
                        </div>
                        {#if initialValuesLoaded && hasChanges && !saving}
                            <span class="text-sm text-zinc-500"
                                >Niet-opgeslagen wijzigingen</span
                            >
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="Taak verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u deze taak wilt verwijderen?
        </p>
        <p class="text-sm text-zinc-500">
            Deze actie kan niet ongedaan worden gemaakt.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={cancelDelete}
                disabled={deleting}
            >
                Annuleren
            </Button>
            <button
                onclick={confirmDelete}
                disabled={deleting}
                class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {deleting ? "Verwijderen..." : "Verwijderen"}
            </button>
        </div>
    </div>
</Modal>
