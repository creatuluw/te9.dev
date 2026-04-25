<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { goto, invalidate } from "$app/navigation";
    import { Tabs } from "$lib/components";
    import * as caseService from "$lib/services/caseService";
    import * as processService from "$lib/services/processService";
    import * as taskService from "$lib/services/taskService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import * as projectService from "$lib/services/projectService";
    import { formatDate, formatDateTime } from "$lib/services/deadlineService";
    import {
        formatUserName,
        getUserForAttribution,
    } from "$lib/utils/userUtils";
    import { translateStatus } from "$lib/utils/statusTranslations";
    import { breadcrumbStore } from "$lib/stores/breadcrumbStore";
    import {
        caseStore,
        removeCase,
        stopPolling,
        startPolling,
    } from "$lib/stores/caseStore";
    import { persistentCache } from "$lib/utils/persistentCache";
    import type { Case, CaseStep, CaseTask } from "$lib/services/caseService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Project } from "$lib/services/projectService";
    import Button from "$lib/components/Button.svelte";
    import UserSelector from "$lib/components/UserSelector.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Label from "$lib/components/Label.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import BacklogDrawer from "$lib/components/BacklogDrawer.svelte";
    import CaseTaskDrawer from "$lib/components/CaseTaskDrawer.svelte";
    import ArchivedTasksDrawer from "$lib/components/ArchivedTasksDrawer.svelte";
    import FileManagerTab from "$lib/components/FileManagerTab.svelte";
    import MessagesTab from "$lib/components/MessagesTab.svelte";
    import NotesTab from "$lib/components/NotesTab.svelte";
    import DatePicker from "$lib/components/DatePicker.svelte";
    import { Trash2, Plus, List, Archive } from "lucide-svelte";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import PublicSharingToggle from "$lib/components/PublicSharingToggle.svelte";
    import { hasPermission, isSysadmin } from "$lib/utils/authGuard";
    import { getCurrentUserId } from "$lib/utils/userUtils";
    import {
        startPageLoading,
        stopPageLoading,
        navigationState,
    } from "$lib/stores/navigationStore.svelte";

    type EnrichedCaseTask = CaseTask & {
        assignee_id?: string[];
        uren?: number | null;
    };
    let caseData = $state<Case | null>(null);
    let steps = $state<(CaseStep & { tasks: EnrichedCaseTask[] })[]>([]);
    let users = $state<PocketBaseUser[]>([]);
    let projects = $state<Project[]>([]);
    let caseAttachments = $state<string[]>([]);
    let processName = $state<string | null>(null);
    const isLoading = $derived(navigationState.isLoading);

    const caseId = $derived(Number($page.params.id));
    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "basic");
    const currentPath = $derived($page.url.pathname);
    let error = $state<string | null>(null);

    // Basic info editing state
    let editingName = $state("");
    let editingStartDate = $state("");
    let editingOwnerId = $state<string | null>(null);
    let editingProjectId = $state<number | null>(null);
    let savingBasicInfo = $state(false);

    // Delete modal state
    let deleteModalOpen = $state(false);
    let deleting = $state(false);

    // Archive modal state
    let archiveModalOpen = $state(false);
    let archiving = $state(false);
    let taskToArchive = $state<{
        id: number;
        stepIndex: number;
        taskIndex: number;
    } | null>(null);

    // Delete task modal state
    let deleteTaskModalOpen = $state(false);
    let deletingTask = $state(false);
    let taskToDelete = $state<{
        id: number;
        stepIndex: number;
        taskIndex: number;
    } | null>(null);

    // Manual task drawer URL parameters
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const stepIdParam = $derived($page.url.searchParams.get("step_id"));
    const taskIdParam = $derived($page.url.searchParams.get("task_id"));
    const isTaskDrawerOpen = $derived.by(() => {
        return drawerParam === "task-drawer";
    });
    const selectedStepId = $derived.by(() => {
        return stepIdParam ? Number(stepIdParam) : null;
    });
    const selectedTaskId = $derived.by(() => {
        return taskIdParam ? Number(taskIdParam) : null;
    });

    // Drag-and-drop state
    let dragGhost = $state<HTMLElement | null>(null);
    let dragOffset = $state<{ x: number; y: number } | null>(null);
    let isDragging = $state(false);
    let dropTargetStepId = $state<number | null>(null);
    let dropTargetTaskId = $state<number | null>(null);
    let dragOverTaskIndex = $state<number | null>(null);
    let dragOverStepIndex = $state<number | null>(null);
    let draggedTask = $state<HTMLElement | null>(null);
    let draggedTaskId = $state<number | null>(null);

    onMount(async () => {
        await Promise.all([loadCase(), loadUsers(), loadProjects()]);
    });

    onDestroy(() => {
        // Clear breadcrumb entity name when leaving the page
        breadcrumbStore.clearEntityName(currentPath);
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

    async function loadProjects() {
        try {
            const result = await projectService.getAllProjects();
            if (result.success) {
                projects = result.value;
            } else {
                console.error("Error loading projects:", result.error);
                projects = [];
            }
        } catch (error) {
            console.error("Error loading projects:", error);
            projects = [];
        }
    }

    async function loadCase() {
        startPageLoading();
        error = null;
        try {
            if (!caseId || isNaN(caseId)) {
                error = `Ongeldig case ID: ${$page.params.id}`;
                return;
            }
            const result = await caseService.getCaseById(caseId);
            if (result.success) {
                const data = result.value;
                caseData = data.case;
                steps = data.steps as (CaseStep & {
                    tasks: EnrichedCaseTask[];
                })[];
                caseAttachments = data.case.bijlagen || [];
                // Initialize editing state
                editingName = data.case.name;
                editingStartDate = data.case.start_date;
                editingOwnerId = data.case.owner_id || null;
                editingProjectId = data.case.project_id || null;

                // Fetch process name
                if (data.case.process_id) {
                    const processResult = await processService.getProcessById(
                        data.case.process_id,
                    );
                    if (processResult.success) {
                        processName = processResult.value.process.name;
                    }
                }

                // Set entity name in breadcrumb store with process name prefix
                const displayName = processName
                    ? `${processName}: ${data.case.name}`
                    : data.case.name;
                breadcrumbStore.setEntityName(currentPath, displayName);
            } else {
                error =
                    getUserMessage(result.error) || "Fout bij laden van case";
                console.error("Error loading case:", result.error);
            }
        } finally {
            stopPageLoading();
        }
    }

    async function loadCaseSilently() {
        // Same as loadCase but without showing the spinner
        error = null;
        try {
            if (!caseId || isNaN(caseId)) {
                error = `Ongeldig case ID: ${$page.params.id}`;
                return;
            }
            const result = await caseService.getCaseById(caseId);
            if (result.success) {
                const data = result.value;
                caseData = data.case;
                steps = data.steps as (CaseStep & {
                    tasks: EnrichedCaseTask[];
                })[];
                caseAttachments = data.case.bijlagen || [];
                // Initialize editing state
                editingName = data.case.name;
                editingStartDate = data.case.start_date;
                editingOwnerId = data.case.owner_id || null;
                editingProjectId = data.case.project_id || null;

                // Fetch process name
                if (data.case.process_id) {
                    const processResult = await processService.getProcessById(
                        data.case.process_id,
                    );
                    if (processResult.success) {
                        processName = processResult.value.process.name;
                    }
                }

                // Set entity name in breadcrumb store with process name prefix
                const displayName = processName
                    ? `${processName}: ${data.case.name}`
                    : data.case.name;
                breadcrumbStore.setEntityName(currentPath, displayName);
            } else {
                // Don't set error for silent reload - just log it
                console.error("Error silently loading case:", result.error);
            }
        } catch (err) {
            // Don't set error for silent reload - just log it
            console.error("Error silently loading case:", err);
        }
    }

    async function completeTask(
        caseTaskId: number,
        taskId: number,
        caseStepId: number,
    ) {
        if (confirm("Deze taak als voltooid markeren?")) {
            try {
                const result = await caseService.updateCaseTaskKanbanStatus(
                    caseTaskId,
                    "afgerond",
                );
                if (result.success) {
                    await loadCase();
                } else {
                    console.error("Error completing task:", result.error);
                    alert("Fout bij voltooien van taak");
                }
            } catch (error) {
                console.error("Error completing task:", error);
                alert("Fout bij voltooien van taak");
            }
        }
    }

    async function archiveTask(caseTaskId: number) {
        // Find the task in the steps
        let stepIndex = -1;
        let taskIndex = -1;

        for (let i = 0; i < steps.length; i++) {
            const taskIdx = steps[i].tasks.findIndex(
                (t) => t.id === caseTaskId,
            );
            if (taskIdx !== -1) {
                stepIndex = i;
                taskIndex = taskIdx;
                break;
            }
        }

        if (stepIndex === -1 || taskIndex === -1) {
            console.error("Task not found:", caseTaskId);
            return;
        }

        taskToArchive = { id: caseTaskId, stepIndex, taskIndex };
        archiveModalOpen = true;
    }

    function cancelArchive() {
        archiveModalOpen = false;
        taskToArchive = null;
    }

    async function confirmArchive() {
        if (!taskToArchive) return;

        const { id: caseTaskId, stepIndex, taskIndex } = taskToArchive;
        const task = steps[stepIndex].tasks[taskIndex];

        archiving = true;

        try {
            const response = await fetch(
                `/api/cases/${caseId}/tasks/${caseTaskId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "archive" }),
                },
            );
            const data = await response.json();
            if (data.success) {
                // Optimistically remove task from UI - create new arrays to ensure reactivity
                steps = steps.map((step, idx) => {
                    if (idx === stepIndex) {
                        return {
                            ...step,
                            tasks: step.tasks.filter(
                                (t) => t.id !== caseTaskId,
                            ),
                        };
                    }
                    return step;
                });
                toastStore.add("Taak gearchiveerd", "success");
                archiveModalOpen = false;
                taskToArchive = null;
            } else {
                console.error("Error archiving task:", data.error);
                alert(data.error || "Fout bij archiveren van taak");
            }
        } catch (error) {
            console.error("Error archiving task:", error);
            alert("Fout bij archiveren van taak");
        } finally {
            archiving = false;
        }
    }

    // Check if a task can be deleted (process type with 'ad-hoc' tag)
    function canDeleteTask(task: any) {
        return task?.task_type === "process" && task?.tags?.includes("ad-hoc");
    }

    function handleDeleteTaskClick(taskId: number, event: MouseEvent) {
        event.stopPropagation();

        // Find the task in the steps
        let stepIndex = -1;
        let taskIndex = -1;

        for (let i = 0; i < steps.length; i++) {
            const taskIdx = steps[i].tasks.findIndex((t) => t.id === taskId);
            if (taskIdx !== -1) {
                stepIndex = i;
                taskIndex = taskIdx;
                break;
            }
        }

        if (stepIndex === -1 || taskIndex === -1) {
            console.error("Task not found:", taskId);
            return;
        }

        const task = steps[stepIndex].tasks[taskIndex];
        if (!canDeleteTask(task)) {
            toastStore.add(
                "Alleen ad-hoc taken kunnen worden verwijderd",
                "error",
            );
            return;
        }

        taskToDelete = { id: taskId, stepIndex, taskIndex };
        deleteTaskModalOpen = true;
    }

    function cancelDeleteTask() {
        deleteTaskModalOpen = false;
        taskToDelete = null;
    }

    async function confirmDeleteTask() {
        if (!taskToDelete) return;

        const { id: taskId, stepIndex, taskIndex } = taskToDelete;
        const task = steps[stepIndex].tasks[taskIndex];

        deletingTask = true;

        try {
            const response = await fetch(
                `/api/cases/${caseId}/tasks/${taskId}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Error deleting task:",
                    response.status,
                    errorText,
                );
                toastStore.add(
                    errorText || "Fout bij verwijderen van taak",
                    "error",
                );
                return;
            }

            const data = await response.json();
            if (data.success) {
                // Optimistically remove task from UI - create new arrays to ensure reactivity
                steps = steps.map((step, idx) => {
                    if (idx === stepIndex) {
                        return {
                            ...step,
                            tasks: step.tasks.filter((t) => t.id !== taskId),
                        };
                    }
                    return step;
                });
                toastStore.add("Taak verwijderd", "success");
                deleteTaskModalOpen = false;
                taskToDelete = null;
            } else {
                console.error("Error deleting task:", data.error);
                toastStore.add(
                    data.error || "Fout bij verwijderen van taak",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            toastStore.add("Fout bij verwijderen van taak", "error");
        } finally {
            deletingTask = false;
        }
    }

    async function assignCaseOwner(userId: string | null) {
        if (!caseData) return;
        try {
            console.log(
                "Assigning case owner:",
                userId,
                "to case:",
                $state.snapshot(caseData)?.id,
            );
            const updateData = { owner_id: userId === null ? null : userId };
            console.log("Update data:", updateData);
            const result = await caseService.updateCase(
                caseData.id,
                updateData,
            );
            console.log("Update result:", result);
            if (result.success) {
                // Update local state directly
                caseData = {
                    ...caseData,
                    owner_id: userId === null ? undefined : userId,
                };
                const userName = userId ? getUserName(userId) : "Niemand";
                toastStore.add(
                    `Case eigenaar gewijzigd naar ${userName}`,
                    "success",
                );
            } else {
                console.error("Error assigning case owner:", result.error);
                toastStore.add("Fout bij toewijzen van eigenaar", "error");
            }
        } catch (error) {
            console.error("Error assigning case owner:", error);
            toastStore.add("Fout bij toewijzen van eigenaar", "error");
        }
    }

    async function assignStepOwner(stepId: number, userId: string | null) {
        // Optimistic update: update local state immediately
        const stepIndex = steps.findIndex((s) => s.id === stepId);
        if (stepIndex !== -1) {
            const previousOwnerId = steps[stepIndex].owner_id;
            steps[stepIndex] = {
                ...steps[stepIndex],
                owner_id: userId || undefined,
            };

            try {
                console.log(
                    "Assigning step owner:",
                    userId,
                    "to step:",
                    stepId,
                );
                const updateData = {
                    owner_id: userId === null ? null : userId,
                };
                console.log("Update data:", updateData);
                const result = await caseService.updateCaseStep(
                    stepId,
                    updateData,
                );
                console.log("Update result:", result);
                if (result.success) {
                    // Silently reload case data without showing spinner
                    await loadCaseSilently();
                    const userName = userId ? getUserName(userId) : "Niemand";
                    toastStore.add(
                        `Stap eigenaar gewijzigd naar ${userName}`,
                        "success",
                    );
                } else {
                    // Revert optimistic update on error
                    steps[stepIndex] = {
                        ...steps[stepIndex],
                        owner_id: previousOwnerId,
                    };
                    console.error("Error assigning step owner:", result.error);
                    toastStore.add(getUserMessage(result.error), "error");
                }
            } catch (error) {
                // Revert optimistic update on error
                steps[stepIndex] = {
                    ...steps[stepIndex],
                    owner_id: previousOwnerId,
                };
                console.error("Error assigning step owner:", error);
                toastStore.add("Fout bij toewijzen van eigenaar", "error");
            }
        }
    }

    async function assignTaskOwners(taskId: number, userIds: string[]) {
        // Optimistic update: update local state immediately
        let taskToUpdate: CaseTask | null = null;
        let stepIndex = -1;
        let taskIndex = -1;
        let previousAssigneeIds: string[] = [];

        for (let i = 0; i < steps.length; i++) {
            const taskIdx = steps[i].tasks.findIndex((t) => t.id === taskId);
            if (taskIdx !== -1) {
                taskToUpdate = steps[i].tasks[taskIdx];
                stepIndex = i;
                taskIndex = taskIdx;
                previousAssigneeIds = getTaskAssigneeIds(taskToUpdate);
                // Update local state optimistically
                steps[i].tasks[taskIndex] = {
                    ...steps[i].tasks[taskIndex],
                    assignee_id: userIds.length > 0 ? userIds : [],
                };
                break;
            }
        }

        if (!taskToUpdate) {
            console.error("[assignTaskOwners] Task not found:", taskId);
            return;
        }

        try {
            console.log(
                "[assignTaskOwners] Assigning task owners:",
                userIds,
                "to task:",
                taskId,
            );

            // Update assignees directly via the junction table
            const { setTaskAssignees } =
                await import("$lib/services/taskAssigneeService");
            const setAssigneesResult = await setTaskAssignees(taskId, userIds);

            if (!setAssigneesResult.success) {
                // Revert optimistic update on error
                if (stepIndex !== -1 && taskIndex !== -1) {
                    steps[stepIndex].tasks[taskIndex] = {
                        ...steps[stepIndex].tasks[taskIndex],
                        assignee_id:
                            previousAssigneeIds.length > 0
                                ? previousAssigneeIds
                                : [],
                    };
                }
                console.error(
                    "[assignTaskOwners] Failed to set assignees:",
                    setAssigneesResult.error,
                );
                toastStore.add(
                    getUserMessage(setAssigneesResult.error),
                    "error",
                );
                return;
            }

            // Invalidate cache
            if (taskToUpdate?.case_step_id) {
                const { getRowByIdResult } =
                    await import("$lib/utils/postgrest");
                const { requestCache } =
                    await import("$lib/utils/requestCache");
                const stepResult = await getRowByIdResult(
                    "_bpm_case_steps",
                    taskToUpdate.case_step_id,
                );
                if (stepResult.success) {
                    requestCache.invalidateEntity(
                        "case",
                        stepResult.value.case_id,
                    );
                    requestCache.invalidate("workitems");
                }
            }

            console.log(
                "[assignTaskOwners] Update successful, silently reloading case...",
            );
            // Silently reload case data without showing spinner
            await loadCaseSilently();
            console.log("[assignTaskOwners] Case reloaded");

            // Show success toast message
            const count = userIds.length;
            if (count === 0) {
                toastStore.add("Alle toewijzingen verwijderd", "success");
            } else if (count === 1) {
                const userName = getUserName(userIds[0]);
                toastStore.add(`Taak toegewezen aan ${userName}`, "success");
            } else {
                toastStore.add(
                    `Taak toegewezen aan ${count} personen`,
                    "success",
                );
            }
        } catch (error) {
            // Revert optimistic update on error
            if (stepIndex !== -1 && taskIndex !== -1) {
                steps[stepIndex].tasks[taskIndex] = {
                    ...steps[stepIndex].tasks[taskIndex],
                    assignee_id:
                        previousAssigneeIds.length > 0
                            ? previousAssigneeIds
                            : [],
                };
            }
            console.error(
                "[assignTaskOwners] Exception assigning task owners:",
                error,
            );
            toastStore.add("Fout bij toewijzen van eigenaren", "error");
        }
    }

    function getUserName(userId?: string): string {
        if (!userId) return "Niet toegewezen";
        const user = users.find((u) => u.id === userId);
        return formatUserName(user);
    }

    // Convert users to SelectOption format for multi-select
    const userSelectOptions = $derived.by((): SelectOption[] => {
        return users.map((user) => ({
            value: user.id,
            label: formatUserName(user),
        }));
    });

    // Convert projects to SelectOption format
    const projectSelectOptions = $derived.by((): SelectOption[] => {
        return projects.map((project) => ({
            value: project.id.toString(),
            label: project.name,
        }));
    });

    // Get assignee IDs from task (from enriched assignee_id array or fallback to owner_id)
    function getTaskAssigneeIds(task: any): string[] {
        // Check if task has assignee_id array (from enrichment)
        if (
            task.assignee_id &&
            Array.isArray(task.assignee_id) &&
            task.assignee_id.length > 0
        ) {
            return task.assignee_id;
        }
        // Fallback to owner_id if available
        if (task.owner_id) {
            return [task.owner_id];
        }
        return [];
    }

    function getUser(userId?: string): PocketBaseUser | null {
        if (!userId) return null;
        return users.find((u) => u.id === userId) || null;
    }

    // Get assignee names for a task
    function getTaskAssigneeNames(task: any): string[] {
        const assigneeIds = getTaskAssigneeIds(task);
        return assigneeIds
            .map((id) => {
                const user = users.find((u) => u.id === id);
                return user ? formatUserName(user) : null;
            })
            .filter((name): name is string => name !== null);
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "active":
                return "bg-blue-100 text-blue-800";
            case "overdue":
                return "bg-red-100 text-red-800";
            default:
                return "bg-zinc-100 text-zinc-800";
        }
    }

    // Check if current user can delete this case
    // Can delete if: case owner, case creator, or sysadmin
    const canDeleteCase = $derived(() => {
        if (!caseData) return false;
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return false;

        // Sysadmins can always delete
        if (isSysadmin()) return true;

        // Case owner can delete
        if (caseData.owner_id === currentUserId) return true;

        // Case creator can delete
        if (caseData.created_by === currentUserId) return true;

        return false;
    });

    // Get tooltip text for delete button
    const deleteButtonTooltip = $derived(() => {
        if (canDeleteCase()) {
            return "Case verwijderen";
        }
        return "Alleen de case eigenaar of de gebruiker die de case heeft aangemaakt kan deze verwijderen";
    });

    function handleDeleteClick(event: MouseEvent) {
        event.stopPropagation();
        if (!canDeleteCase()) {
            return; // Don't open modal if user can't delete
        }
        deleteModalOpen = true;
    }

    function cancelDelete() {
        deleteModalOpen = false;
    }

    async function confirmDelete() {
        if (!caseData) return;

        const deletedCaseId = caseData.id;
        console.log("[DELETE] Starting deletion of case:", deletedCaseId);

        deleting = true;
        try {
            const result = await caseService.deleteCase(deletedCaseId);
            if (result.success) {
                console.log(
                    "[DELETE] Case deleted successfully:",
                    deletedCaseId,
                );

                // Optimistically remove case from store for immediate UI update
                removeCase(deletedCaseId);
                console.log(
                    "[DELETE] Removed case from store. Store now has:",
                    caseStore.getValue().cases.length,
                    "cases",
                );
                console.log(
                    "[DELETE] Store case IDs:",
                    caseStore.getValue().cases.map((c) => c.id),
                );

                // Invalidate persistent cache to prevent stale data
                persistentCache.invalidate("cases");
                console.log("[DELETE] Invalidated persistent cache");

                // Invalidate SvelteKit load function cache to force fresh data on navigation
                await invalidate("cases");
                await invalidate("/cases");
                console.log("[DELETE] Invalidated SvelteKit cache");

                // Stop polling to allow navigation to complete cleanly
                stopPolling();
                console.log("[DELETE] Stopped polling");

                // NOTE: Do NOT call caseStore.refresh() here!
                // This would fetch from server and could return stale cached data,
                // bringing back the deleted case. The cases list page will
                // fetch fresh data on mount instead.
                console.log(
                    "[DELETE] Skipping store refresh to avoid cache race condition",
                );

                // Navigate to cases list - load function will rerun with fresh data
                console.log("[DELETE] Navigating to /cases...");
                await goto("/cases");
                console.log("[DELETE] Navigation complete");
            } else {
                console.error("[DELETE] Error deleting case:", result.error);
                alert("Fout bij verwijderen van case");
                deleting = false;
            }
        } catch (error) {
            console.error("[DELETE] Exception deleting case:", error);
            alert("Fout bij verwijderen van case");
            deleting = false;
        }
    }

    async function handleAddManualTaskToStep(stepId: number) {
        const url = new URL($page.url);
        url.searchParams.set("drawer", "task-drawer");
        url.searchParams.set("step_id", String(stepId));
        url.searchParams.delete("task_id");
        await goto(url.pathname + url.search, { noScroll: true });
    }

    async function handleAddManualTaskToTask(stepId: number, taskId: number) {
        const url = new URL($page.url);
        url.searchParams.set("drawer", "task-drawer");
        url.searchParams.set("step_id", String(stepId));
        url.searchParams.set("task_id", String(taskId));
        await goto(url.pathname + url.search, { noScroll: true });
    }

    async function handleDrawerClose() {
        // URL params are cleared by BacklogDrawer's handleClose
        // This handler is for any additional cleanup needed
    }

    async function handleWorkItemSaved() {
        // Reload case to show the new manual task
        await loadCase();
        // Clear URL parameters to close drawer
        await handleDrawerClose();
    }

    async function openCaseTaskDrawer(taskId: number) {
        // Navigate to open the CaseTaskDrawer with the task ID
        const url = new URL($page.url);
        url.searchParams.set("drawer", "casetask");
        url.searchParams.set("caseTaskId", String(taskId));
        await goto(url.pathname + url.search, { noScroll: true });
    }

    async function handleSaveBasicInfo() {
        if (!caseData) return;

        savingBasicInfo = true;
        error = null;

        try {
            const result = await caseService.updateCase(caseData.id, {
                name: editingName.trim(),
                owner_id: editingOwnerId || undefined,
                project_id: editingProjectId || undefined,
            });

            if (result.success) {
                // Update start_date separately if changed (might need different handling)
                if (editingStartDate !== caseData.start_date) {
                    // Note: start_date might not be directly updatable, but we'll try
                    // If the API doesn't support it, this will fail gracefully
                    const dateResult = await caseService.updateCase(
                        caseData.id,
                        {
                            // start_date is typically not updatable after creation, but we'll attempt it
                        } as any,
                    );
                }

                toastStore.add("Case informatie bijgewerkt", "success");
                await loadCase();
            } else {
                error = getUserMessage(result.error);
                toastStore.add(error, "error");
            }
        } catch (err) {
            console.error("Error saving basic info:", err);
            error = "Fout bij opslaan van case informatie";
            toastStore.add(error, "error");
        } finally {
            savingBasicInfo = false;
        }
    }

    // Define tabs
    const tabs = [
        { id: "basic", label: "Algemeen" },
        { id: "stappen", label: "Stappen" },
        { id: "files", label: "Bestanden" },
        { id: "messages", label: "Berichten" },
        { id: "notities", label: "Notities" },
        { id: "timeline", label: "Tijdslijn" },
        { id: "instellingen", label: "Instellingen" },
        { id: "help", label: "Help" },
    ];

    async function handleDragStart(
        event: DragEvent,
        taskId: number,
        stepId: number,
        taskIndex: number,
    ) {
        console.log(
            "🚀 [DRAG START] taskId:",
            taskId,
            "stepId:",
            stepId,
            "taskIndex:",
            taskIndex,
        );
        const target = event.currentTarget as HTMLElement;

        // Set ID on dragged task (MDN pattern)
        target.id = "dragging-task";
        draggedTask = target;
        draggedTaskId = taskId;
        isDragging = true;

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

        // Store cleanup function for dragend
        (target as any).__dragCleanup = () => {
            isDragging = false;
            document.removeEventListener("dragover", trackMousePosition);
            document.removeEventListener("drag", trackMousePosition);
            if (dragGhost && document.body.contains(dragGhost)) {
                document.body.removeChild(dragGhost);
            }
            dragGhost = null;
            dragOffset = null;
        };

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("task/task-id", String(taskId));
            event.dataTransfer.setData("task/step-id", String(stepId));
            event.dataTransfer.setData("task/task-index", String(taskIndex));
            event.dataTransfer.setData("text/plain", String(taskId));
            console.log("📤 [DRAG START] Data set:", {
                "task/task-id": taskId,
                "task/step-id": stepId,
                "task/task-index": taskIndex,
            });
            // Custom type to identify a task drag (MDN pattern)
            event.dataTransfer.setData("task", "");

            const emptyImg = document.createElement("img");
            emptyImg.src =
                "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            event.dataTransfer.setDragImage(emptyImg, 0, 0);
        }
    }

    function handleDragEnd(event: DragEvent) {
        console.log("🏁 [DRAG END] Called");
        const target = event.currentTarget as HTMLElement;
        // Remove ID attribute (MDN pattern)
        target.removeAttribute("id");
        draggedTask = null;
        draggedTaskId = null;

        // Run cleanup if stored
        if ((target as any).__dragCleanup) {
            (target as any).__dragCleanup();
        }

        dropTargetStepId = null;
        dropTargetTaskId = null;
        dragOverTaskIndex = null;
        dragOverStepIndex = null;

        console.log(
            "🧹 [DRAG END] Cleanup complete - dropped?",
            dropTargetTaskId !== null,
        );
    }

    // Function to create placeholder element
    function makePlaceholder(draggedEl: HTMLElement): HTMLElement {
        const placeholder = document.createElement("div");
        placeholder.className = "placeholder";
        placeholder.style.width = `${draggedEl.offsetWidth}px`;
        placeholder.style.height = `${draggedEl.offsetHeight}px`;
        placeholder.style.marginBottom = "8px";
        placeholder.style.background = "#e5e7eb";
        placeholder.style.borderRadius = "6px";
        placeholder.style.border = "2px dashed #94a3b8";
        // CRITICAL: pointer-events: none allows drop events to pass through placeholder to task elements
        placeholder.style.pointerEvents = "none";
        return placeholder;
    }

    // Find tasks container from any element in it
    function getTasksContainer(element: HTMLElement): HTMLElement | null {
        let current = element;
        while (current) {
            if (current.classList.contains("space-y-2")) {
                return current;
            }
            current = current.parentElement as HTMLElement;
        }
        return null;
    }

    // Move placeholder to show where item will be dropped
    function movePlaceholder(event: DragEvent) {
        if (!isDragging || !draggedTask) return;

        const tasksContainer = getTasksContainer(
            event.currentTarget as HTMLElement,
        );
        if (!tasksContainer) return;

        const placeholder = document.querySelector(
            ".placeholder",
        ) as HTMLElement | null;

        // Don't move placeholder if not dragging over container
        const containerRect = tasksContainer.getBoundingClientRect();
        if (
            event.clientY < containerRect.top ||
            event.clientY > containerRect.bottom ||
            event.clientX < containerRect.left ||
            event.clientX > containerRect.right
        ) {
            return;
        }

        // Find the first task that is not fully above the cursor
        for (const task of Array.from(tasksContainer.children)) {
            const taskElement = task as HTMLElement;
            if (taskElement.getBoundingClientRect().bottom >= event.clientY) {
                // Don't change if insertion point is already placeholder
                if (taskElement === placeholder) return;

                // Remove existing placeholder before inserting at new position
                placeholder?.remove();

                // Don't show placeholder if dropping at original position
                if (
                    taskElement === draggedTask ||
                    taskElement.previousElementSibling === draggedTask
                ) {
                    return;
                }

                // Insert placeholder at this position
                tasksContainer.insertBefore(
                    placeholder ?? makePlaceholder(draggedTask),
                    taskElement,
                );
                return;
            }
        }

        // All tasks are above cursor, insert at end
        placeholder?.remove();
        if (tasksContainer.lastElementChild === draggedTask) return;
        tasksContainer.append(placeholder ?? makePlaceholder(draggedTask));
    }

    function handleDragOver(
        event: DragEvent,
        stepId: number,
        stepIndex: number,
    ) {
        // Test for custom type we set in dragstart
        if (event.dataTransfer?.types.includes("task")) {
            event.preventDefault();
            dragOverStepIndex = stepIndex;
            movePlaceholder(event);
        }
    }

    function handleDragLeave(event: DragEvent) {
        const list = event.currentTarget as HTMLElement;
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (list.contains(relatedTarget)) return;

        dragOverStepIndex = null;
    }

    async function handleDropOnContainer(
        event: DragEvent,
        targetStepId: number,
        targetStepIndex: number,
    ) {
        console.log("🎉 [DROP CONTAINER] Called with:", {
            targetStepId,
            targetStepIndex,
        });
        event.preventDefault();
        event.stopPropagation();

        // CRITICAL: Capture drag state BEFORE handleDragEnd clears it
        const preservedDropTargetTaskId = dropTargetTaskId;
        const preservedDragOverTaskIndex = dragOverTaskIndex;
        const preservedDragOverStepIndex = dragOverStepIndex;

        console.log("📥 [DROP CONTAINER] Preserved drag state:", {
            dropTargetTaskId: preservedDropTargetTaskId,
            dragOverTaskIndex: preservedDragOverTaskIndex,
            dragOverStepIndex: preservedDragOverStepIndex,
        });

        // Remove all placeholders
        document.querySelectorAll(".placeholder").forEach((placeholder) => {
            placeholder.remove();
        });

        const taskIdStr = event.dataTransfer?.getData("task/task-id");
        const sourceStepIdStr = event.dataTransfer?.getData("task/step-id");
        const sourceTaskIndexStr =
            event.dataTransfer?.getData("task/task-index");

        console.log("📥 [DROP CONTAINER] Data retrieved from dataTransfer:", {
            taskId: taskIdStr,
            sourceStepId: sourceStepIdStr,
            sourceTaskIndex: sourceTaskIndexStr,
        });

        if (
            !taskIdStr ||
            !sourceStepIdStr ||
            sourceTaskIndexStr === undefined
        ) {
            console.log("❌ [DROP CONTAINER] Invalid data - returning early");
            return;
        }

        const taskId = Number(taskIdStr);
        const sourceStepId = Number(sourceStepIdStr);
        const sourceTaskIndex = Number(sourceTaskIndexStr);

        // Use preserved drag state (don't use global vars that might be cleared by handleDragEnd)
        const finalTargetTaskId = preservedDropTargetTaskId;
        const finalTargetTaskIndex =
            preservedDragOverTaskIndex !== null
                ? preservedDragOverTaskIndex
                : (steps.find((s) => s.id === targetStepId)?.tasks.length ??
                      0) - 1;

        console.log("📊 [DROP CONTAINER] Parsed values:", {
            taskId,
            sourceStepId,
            sourceTaskIndex,
            targetStepId,
            finalTargetTaskId,
            finalTargetTaskIndex,
        });

        // Delegate to handleDropOnTask if we have a target task
        if (finalTargetTaskId !== null && finalTargetTaskIndex !== null) {
            await handleDropOnTask(
                event,
                finalTargetTaskId,
                targetStepId,
                finalTargetTaskIndex,
            );
            return;
        }

        // Otherwise, use placeholder position or append to end of step
        const step = steps.find((s) => s.id === targetStepId);
        if (!step) {
            console.log("❌ [DROP CONTAINER] Step not found:", targetStepId);
            return;
        }

        // Find placeholder position to determine insertion point
        const tasksContainer = event.currentTarget as HTMLElement;
        const placeholder = tasksContainer.querySelector(
            ".placeholder",
        ) as HTMLElement | null;
        let insertPosition = step.tasks.length;
        if (placeholder) {
            const children = Array.from(tasksContainer.children);
            insertPosition = children.indexOf(placeholder);
            console.log(
                "📍 [DROP CONTAINER] Placeholder found at position:",
                insertPosition,
            );
        }

        const isCrossStepMove = sourceStepId !== targetStepId;

        console.log(
            "🔄 [DROP CONTAINER] isCrossStepMove:",
            isCrossStepMove,
            "insertPosition:",
            insertPosition,
        );

        let allTaskOrders: {
            id: number;
            step_order: number;
            case_step_id?: number | null;
        }[] = [];

        if (isCrossStepMove) {
            const sourceStep = steps.find((s) => s.id === sourceStepId);
            if (!sourceStep) return;

            const draggedTaskObj = sourceStep.tasks.find(
                (t) => t.id === taskId,
            );
            if (!draggedTaskObj) return;

            const sourceTasksExcluding = sourceStep.tasks.filter(
                (t) => t.id !== taskId,
            );
            const sourceOrders = sourceTasksExcluding.map((t, i) => ({
                id: t.id,
                step_order: i,
            }));

            const targetNewTasks = [
                ...step.tasks.slice(0, insertPosition),
                draggedTaskObj,
                ...step.tasks.slice(insertPosition),
            ];
            const targetOrders = targetNewTasks.map((t, i) => ({
                id: t.id,
                step_order: i,
            }));

            allTaskOrders = [
                ...sourceOrders,
                ...targetOrders.map((o) => ({
                    ...o,
                    case_step_id: targetStepId,
                })),
            ];
        } else {
            const tasksExcludingDragged = step.tasks.filter(
                (t) => t.id !== taskId,
            );
            const draggedTaskObj = step.tasks.find((t) => t.id === taskId);
            if (!draggedTaskObj) return;

            const newOrder = [
                ...tasksExcludingDragged.slice(0, insertPosition),
                draggedTaskObj,
                ...tasksExcludingDragged.slice(insertPosition),
            ];

            allTaskOrders = newOrder.map((t, i) => ({
                id: t.id,
                step_order: i,
            }));
        }

        if (allTaskOrders.length === 0) {
            console.log(
                "❌ [DROP CONTAINER] allTaskOrders is empty - returning early",
            );
            return;
        }

        console.log("📦 [DROP CONTAINER] Calling reorderStepTasks with:", {
            taskId,
            sourceStepId,
            targetStepId: isCrossStepMove ? targetStepId : null,
            targetStepOrder:
                allTaskOrders.find((o) => o.id === taskId)?.step_order || 0,
            allTaskOrders,
        });

        const { reorderStepTasks } = await import("$lib/services/caseService");
        const result = await reorderStepTasks(
            taskId,
            sourceStepId,
            isCrossStepMove ? targetStepId : null,
            allTaskOrders.find((o) => o.id === taskId)?.step_order || 0,
            allTaskOrders,
        );

        console.log("📬 [DROP CONTAINER] reorderStepTasks result:", result);

        if (result.success) {
            console.log(
                "✅ [DROP CONTAINER] Reorder successful - showing toast and reloading case",
            );
            toastStore.add("Taak verplaatst", "success");
            await loadCase();
        } else {
            console.log("❌ [DROP CONTAINER] Reorder failed:", result.error);
            toastStore.add("Fout bij verplaatsen van taak", "error");
        }

        // Clear drag state (handleDragEnd might have already done this, but ensure it's cleared)
        draggedTaskId = null;
        dropTargetStepId = null;
        dropTargetTaskId = null;
        dragOverTaskIndex = null;
        dragOverStepIndex = null;
    }

    function handleTaskDragOver(
        event: DragEvent,
        taskId: number,
        stepId: number,
        taskIndex: number,
    ) {
        console.log(
            "🎯 [DRAG OVER] taskId:",
            taskId,
            "stepId:",
            stepId,
            "taskIndex:",
            taskIndex,
            "draggedTaskId:",
            draggedTaskId,
        );
        if (event.dataTransfer?.types.includes("task")) {
            event.preventDefault();

            // Skip if dragging over the same task
            if (taskId === draggedTaskId) {
                console.log(
                    "⏭️ [DRAG OVER] Skipping - dragging over same task",
                );
                return;
            }

            dropTargetTaskId = taskId;
            dragOverTaskIndex = taskIndex;
            console.log(
                "✅ [DRAG OVER] dropTargetTaskId set to:",
                taskId,
                "dragOverTaskIndex set to:",
                taskIndex,
            );
            movePlaceholder(event);
        } else {
            console.log(
                '❌ [DRAG OVER] Event dataTransfer does not include "task" type',
            );
        }
    }

    function handleTaskDragLeave(event: DragEvent) {
        dropTargetTaskId = null;
        dragOverTaskIndex = null;
    }

    async function handleDropOnTask(
        event: DragEvent,
        targetTaskId: number,
        targetStepId: number,
        targetTaskIndex: number,
    ) {
        console.log("🎉 [DROP] Called with:", {
            targetTaskId,
            targetStepId,
            targetTaskIndex,
        });
        event.preventDefault();
        event.stopPropagation();

        // Remove all placeholders
        document.querySelectorAll(".placeholder").forEach((placeholder) => {
            placeholder.remove();
        });

        const taskIdStr = event.dataTransfer?.getData("task/task-id");
        const sourceStepIdStr = event.dataTransfer?.getData("task/step-id");
        const sourceTaskIndexStr =
            event.dataTransfer?.getData("task/task-index");

        console.log("📥 [DROP] Data retrieved from dataTransfer:", {
            taskId: taskIdStr,
            sourceStepId: sourceStepIdStr,
            sourceTaskIndex: sourceTaskIndexStr,
        });

        if (
            !taskIdStr ||
            !sourceStepIdStr ||
            sourceTaskIndexStr === undefined
        ) {
            console.log("❌ [DROP] Invalid data - returning early");
            return;
        }

        const taskId = Number(taskIdStr);
        const sourceStepId = Number(sourceStepIdStr);
        const sourceTaskIndex = Number(sourceTaskIndexStr);

        console.log("📊 [DROP] Parsed values:", {
            taskId,
            sourceStepId,
            sourceTaskIndex,
            targetStepId,
            targetTaskIndex,
        });

        const isCrossStepMove = sourceStepId !== targetStepId;

        console.log("🔄 [DROP] isCrossStepMove:", isCrossStepMove);

        let allTaskOrders: {
            id: number;
            step_order: number;
            case_step_id?: number | null;
        }[] = [];

        if (isCrossStepMove) {
            const sourceStep = steps.find((s) => s.id === sourceStepId);
            const targetStep = steps.find((s) => s.id === targetStepId);

            if (!sourceStep || !targetStep) return;

            const draggedTaskObj = sourceStep.tasks.find(
                (t) => t.id === taskId,
            );
            if (!draggedTaskObj) return;

            const sourceTasksExcluding = sourceStep.tasks.filter(
                (t) => t.id !== taskId,
            );
            const sourceNewTasks = [...sourceTasksExcluding];

            const targetNewTasks = [
                ...targetStep.tasks.slice(0, targetTaskIndex),
                draggedTaskObj,
                ...targetStep.tasks.slice(targetTaskIndex),
            ];

            const sourceOrders = sourceNewTasks.map((t, i) => ({
                id: t.id,
                step_order: i,
            }));

            const targetOrders = targetNewTasks.map((t, i) => ({
                id: t.id,
                step_order: i,
            }));

            allTaskOrders = [
                ...sourceOrders,
                ...targetOrders.map((o) => ({
                    ...o,
                    case_step_id: targetStepId,
                })),
            ];
        } else {
            const step = steps.find((s) => s.id === targetStepId);
            if (!step) return;

            const tasksExcludingDragged = step.tasks.filter(
                (t) => t.id !== taskId,
            );
            const draggedTaskObj = step.tasks.find((t) => t.id === taskId);
            if (!draggedTaskObj) return;

            let insertIndex = tasksExcludingDragged.length;
            if (targetTaskIndex !== sourceTaskIndex) {
                if (targetTaskIndex < sourceTaskIndex) {
                    insertIndex = targetTaskIndex;
                } else {
                    insertIndex = targetTaskIndex + 1;
                }
            }

            const newOrder = [
                ...tasksExcludingDragged.slice(0, insertIndex),
                draggedTaskObj,
                ...tasksExcludingDragged.slice(insertIndex),
            ];

            allTaskOrders = newOrder.map((t, i) => ({
                id: t.id,
                step_order: i,
            }));
        }

        if (allTaskOrders.length === 0) {
            console.log("❌ [DROP] allTaskOrders is empty - returning early");
            return;
        }

        console.log("📦 [DROP] Calling reorderStepTasks with:", {
            taskId,
            sourceStepId,
            targetStepId: isCrossStepMove ? targetStepId : null,
            targetStepOrder:
                allTaskOrders.find((o) => o.id === taskId)?.step_order || 0,
            allTaskOrders,
        });

        const { reorderStepTasks } = await import("$lib/services/caseService");
        const result = await reorderStepTasks(
            taskId,
            sourceStepId,
            isCrossStepMove ? targetStepId : null,
            allTaskOrders.find((o) => o.id === taskId)?.step_order || 0,
            allTaskOrders,
        );

        console.log("📬 [DROP] reorderStepTasks result:", result);

        if (result.success) {
            console.log(
                "✅ [DROP] Reorder successful - showing toast and reloading case",
            );
            toastStore.add("Taak verplaatst", "success");
            await loadCase();
        } else {
            console.log("❌ [DROP] Reorder failed:", result.error);
            toastStore.add("Fout bij verplaatsen van taak", "error");
        }

        dropTargetStepId = null;
        dropTargetTaskId = null;
    }
</script>

{#if error && !caseData}
    <div class="container mx-auto px-4 py-8 max-w-[90vw]">
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <div class="text-red-600 mb-4">{error}</div>
                <Button onclick={() => goto("/cases")}>Terug naar Cases</Button>
            </div>
        </div>
    </div>
{:else if caseData}
    <div class="h-full overflow-hidden flex flex-col">
        <div
            class="container mx-auto px-4 flex-1 flex flex-col min-h-0 overflow-hidden max-w-[90vw]"
        >
            <!-- Header -->
            <div class="pt-8 pb-4 mb-6 border-b border-zinc-200 flex-shrink-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h2
                            class="text-2xl font-bold text-zinc-900 font-aspekta"
                        >
                            {processName
                                ? `${processName}: ${caseData.name}`
                                : caseData.name}
                        </h2>
                    </div>
                    <div class="flex gap-2 items-center">
                        <Button
                            variant="secondary"
                            onclick={() => goto("/cases")}
                            >Terug naar Cases</Button
                        >
                        <Tooltip text="Bekijk backlog">
                            <IconButton
                                icon={List}
                                variant="default"
                                onclick={() => goto("/work/backlog")}
                            />
                        </Tooltip>
                        <Tooltip text="Gearchiveerde taken">
                            <IconButton
                                icon={Archive}
                                variant="default"
                                onclick={() =>
                                    goto(`?drawer=archived-tasks`, {
                                        noScroll: true,
                                    })}
                            />
                        </Tooltip>
                        <Tooltip text={deleteButtonTooltip()}>
                            <IconButton
                                icon={Trash2}
                                variant="danger"
                                onclick={handleDeleteClick}
                                disabled={!canDeleteCase()}
                            />
                        </Tooltip>
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
                    url.searchParams.set("tab", tabId);
                    await goto(url.pathname + url.search, { noScroll: true });
                }}
            >
                {#snippet children({ activeTab }: { activeTab: string })}
                    <div class="flex-1 flex flex-col min-h-0">
                        <!-- Basic Info Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "basic"
                                ? "flex"
                                : "none"}
                        >
                            <form
                                id="case-basic-form"
                                onsubmit={(e) => {
                                    e.preventDefault();
                                    handleSaveBasicInfo();
                                }}
                                class="flex-1 flex flex-col min-h-0"
                            >
                                <div class="pb-6">
                                    {#if error}
                                        <div
                                            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
                                        >
                                            {error}
                                        </div>
                                    {/if}

                                    {#if caseData}
                                        <div class="space-y-6">
                                            <!-- Case Info Display -->
                                            <div
                                                class="bg-zinc-50 border border-zinc-200 rounded-lg p-4"
                                            >
                                                <div
                                                    class="flex items-center gap-4 text-sm text-zinc-600"
                                                >
                                                    <span
                                                        >Gestart: {formatDate(
                                                            caseData.start_date,
                                                        )}</span
                                                    >
                                                    <span>•</span>
                                                    <span
                                                        >Deadline: {formatDate(
                                                            caseData.completion_deadline,
                                                        )}</span
                                                    >
                                                    <span>•</span>
                                                    <span
                                                        class="px-3 py-1 rounded-full text-xs font-medium {getStatusColor(
                                                            caseData.status,
                                                        )}"
                                                    >
                                                        {translateStatus(
                                                            caseData.status,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    for="name"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Casenaam <span
                                                        class="text-red-500"
                                                        >*</span
                                                    >
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    bind:value={editingName}
                                                    required
                                                    disabled={savingBasicInfo}
                                                    class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                    placeholder="bijv. Onboarding voor Jan Jansen"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    for="startDate"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Startdatum
                                                </label>
                                                <DatePicker
                                                    id="startDate"
                                                    bind:value={
                                                        editingStartDate
                                                    }
                                                    disabled={true}
                                                    class="w-full"
                                                />
                                                <p
                                                    class="text-xs text-zinc-500 mt-1"
                                                >
                                                    De startdatum kan niet
                                                    worden gewijzigd na het
                                                    aanmaken van de case.
                                                </p>
                                            </div>

                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label
                                                        for="owner"
                                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                                    >
                                                        Case Eigenaar
                                                    </label>
                                                    <UserSelector
                                                        {users}
                                                        selectedUserId={editingOwnerId}
                                                        onSelectedUserIdChange={(
                                                            userId,
                                                        ) =>
                                                            (editingOwnerId =
                                                                userId)}
                                                        placeholder="Case eigenaar toewijzen (optioneel)..."
                                                        class="w-full"
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
                                                        value={editingProjectId?.toString() ||
                                                            null}
                                                        options={projectSelectOptions}
                                                        onchange={(value) =>
                                                            (editingProjectId =
                                                                typeof value ===
                                                                    "string" &&
                                                                value
                                                                    ? parseInt(
                                                                          value,
                                                                      )
                                                                    : null)}
                                                        placeholder="Project toewijzen (optioneel)..."
                                                        disabled={savingBasicInfo}
                                                        class="w-full"
                                                        searchable={true}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    {/if}
                                </div>

                                <!-- Footer Actions for Basic Info (Fixed) -->
                                <div
                                    class="flex-shrink-0 py-4 border-t border-zinc-200 bg-white mt-auto"
                                >
                                    <div class="flex justify-start gap-3">
                                        {#if !savingBasicInfo && caseData}
                                            <Button
                                                type="submit"
                                                form="case-basic-form"
                                                disabled={savingBasicInfo}
                                            >
                                                Wijzigingen Opslaan
                                            </Button>
                                        {/if}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <!-- Overview Tab - Same style as structure tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "stappen"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-4 pb-4">
                                {#each steps as step, stepIndex (step.id)}
                                    {@const totalTasks = step.tasks.length}
                                    {@const completedTasks = step.tasks.filter(
                                        (t) =>
                                            (t.status as string) ===
                                            "completed",
                                    ).length}
                                    {@const totalHours = step.tasks.reduce(
                                        (sum, task) => sum + (task.uren ?? 0),
                                        0,
                                    )}
                                    <div
                                        class="bg-white border border-zinc-200 rounded-lg p-4"
                                    >
                                        <div
                                            class="flex justify-between items-start mb-3"
                                        >
                                            <div class="flex-1">
                                                <h3
                                                    class="text-base font-semibold text-zinc-900"
                                                >
                                                    {stepIndex + 1}. {step.name ||
                                                        `Stap ${stepIndex + 1}`}
                                                </h3>
                                                {#if step.start_date || step.completion_deadline || totalHours > 0 || totalTasks > 0}
                                                    <div
                                                        class="text-xs text-zinc-500 mt-1 flex items-center gap-3"
                                                    >
                                                        {#if step.start_date}
                                                            <span
                                                                >Start: {new Date(
                                                                    step.start_date,
                                                                ).toLocaleDateString(
                                                                    "nl-NL",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                        year: "numeric",
                                                                    },
                                                                )}</span
                                                            >
                                                        {/if}
                                                        {#if step.start_date && step.completion_deadline}
                                                            <span
                                                                class="flex items-center"
                                                                >•</span
                                                            >
                                                        {/if}
                                                        {#if step.completion_deadline}
                                                            <span
                                                                >Deadline: {new Date(
                                                                    step.completion_deadline,
                                                                ).toLocaleDateString(
                                                                    "nl-NL",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                        year: "numeric",
                                                                    },
                                                                )}</span
                                                            >
                                                        {/if}
                                                        {#if totalHours > 0}
                                                            {#if step.start_date || step.completion_deadline}
                                                                <span
                                                                    class="flex items-center"
                                                                    >•</span
                                                                >
                                                            {/if}
                                                            <span
                                                                >{totalHours}u</span
                                                            >
                                                        {/if}
                                                        {#if totalTasks > 0}
                                                            {#if step.start_date || step.completion_deadline || totalHours > 0}
                                                                <span
                                                                    class="flex items-center"
                                                                    >•</span
                                                                >
                                                            {/if}
                                                            <span
                                                                >{completedTasks}/{totalTasks}
                                                                taken</span
                                                            >
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <span
                                                    class="px-2 py-1 rounded text-xs font-medium {getStatusColor(
                                                        step.status,
                                                    )}"
                                                >
                                                    {translateStatus(
                                                        step.status,
                                                    )}
                                                </span>
                                                <UserSelector
                                                    {users}
                                                    selectedUserId={step.owner_id ||
                                                        null}
                                                    onSelectedUserIdChange={(
                                                        userId,
                                                    ) =>
                                                        assignStepOwner(
                                                            step.id,
                                                            userId,
                                                        )}
                                                    placeholder="Stap eigenaar..."
                                                    class="w-52 text-sm"
                                                />
                                                <Tooltip
                                                    text="Handmatige taak toevoegen aan deze stap"
                                                >
                                                    <IconButton
                                                        icon={Plus}
                                                        variant="ghost"
                                                        size="sm"
                                                        onclick={() =>
                                                            handleAddManualTaskToStep(
                                                                step.id,
                                                            )}
                                                    />
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <!-- Tasks -->
                                        <div
                                            class="ml-4 space-y-2 border-l-2 border-zinc-200 pl-3"
                                            ondragover={(e) =>
                                                handleDragOver(
                                                    e,
                                                    stepIndex,
                                                    -1,
                                                )}
                                            ondragleave={handleDragLeave}
                                            ondrop={(e) =>
                                                handleDropOnContainer(
                                                    e,
                                                    step.id,
                                                    stepIndex,
                                                )}
                                        >
                                            {#each step.tasks as task, taskIndex (task.id)}
                                                <div
                                                    class:dragging={isDragging}
                                                    class="rounded-sm px-4 py-2 flex justify-between items-start bg-zinc-50 {(task.status as string) ===
                                                    'active'
                                                        ? 'border-blue-300 bg-blue-50 border-2'
                                                        : (task.status as string) ===
                                                            'completed'
                                                          ? 'border-green-300 bg-green-50 border-2'
                                                          : 'border border-zinc-200'}"
                                                    draggable="true"
                                                    ondragstart={(e) =>
                                                        handleDragStart(
                                                            e,
                                                            task.id,
                                                            step.id,
                                                            taskIndex,
                                                        )}
                                                    ondragend={handleDragEnd}
                                                    ondragover={(e) =>
                                                        handleTaskDragOver(
                                                            e,
                                                            task.id,
                                                            step.id,
                                                            taskIndex,
                                                        )}
                                                    ondragleave={handleTaskDragLeave}
                                                    ondrop={(e) =>
                                                        handleDropOnTask(
                                                            e,
                                                            task.id,
                                                            step.id,
                                                            taskIndex,
                                                        )}
                                                >
                                                    <div class="flex-1">
                                                        <div
                                                            class="text-sm font-medium text-zinc-900 flex items-center gap-2 flex-wrap"
                                                        >
                                                            <span
                                                                class="cursor-pointer text-blue-600 hover:text-[#FE6C2D] transition-colors"
                                                                onclick={() =>
                                                                    openCaseTaskDrawer(
                                                                        task.id,
                                                                    )}
                                                                >{(task as any)
                                                                    .subject ||
                                                                    task.name ||
                                                                    `Taak ${task.id}`}</span
                                                            >
                                                            <span
                                                                class="text-zinc-500 text-xs font-normal"
                                                                >|</span
                                                            >
                                                            <span
                                                                class="px-2 py-0.5 rounded text-xs font-medium {getStatusColor(
                                                                    task.status,
                                                                )}"
                                                            >
                                                                {translateStatus(
                                                                    task.status,
                                                                )}
                                                            </span>
                                                        </div>
                                                        {#if task.deadline || (task as any).uren}
                                                            <div
                                                                class="text-xs text-zinc-500 mt-1 flex items-center gap-2"
                                                            >
                                                                {#if task.deadline}
                                                                    <span
                                                                        >Deadline:
                                                                        {new Date(
                                                                            task.deadline,
                                                                        ).toLocaleDateString(
                                                                            "nl-NL",
                                                                            {
                                                                                day: "2-digit",
                                                                                month: "2-digit",
                                                                                year: "numeric",
                                                                            },
                                                                        )}</span
                                                                    >
                                                                {/if}
                                                                {#if (task as any).uren}
                                                                    <span
                                                                        >{#if task.deadline}•{/if}
                                                                        {(
                                                                            task as any
                                                                        )
                                                                            .uren}u</span
                                                                    >
                                                                {/if}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                    <div
                                                        class="flex flex-col gap-2"
                                                    >
                                                        <div
                                                            class="flex gap-2 items-center"
                                                        >
                                                            <Select
                                                                options={userSelectOptions}
                                                                selectedValues={getTaskAssigneeIds(
                                                                    task,
                                                                )}
                                                                multiple={true}
                                                                onchange={(
                                                                    values,
                                                                ) => {
                                                                    const userIds =
                                                                        Array.isArray(
                                                                            values,
                                                                        )
                                                                            ? values
                                                                            : values
                                                                              ? [
                                                                                    values,
                                                                                ]
                                                                              : [];
                                                                    assignTaskOwners(
                                                                        task.id,
                                                                        userIds,
                                                                    );
                                                                }}
                                                                placeholder="Toewijzen..."
                                                                class="w-44 text-sm"
                                                            />
                                                            <Tooltip
                                                                text="Handmatige taak toevoegen gerelateerd aan deze taak"
                                                            >
                                                                <IconButton
                                                                    icon={Plus}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onclick={() =>
                                                                        handleAddManualTaskToTask(
                                                                            step.id,
                                                                            task.task_id,
                                                                        )}
                                                                />
                                                            </Tooltip>
                                                            {#if canDeleteTask(task)}
                                                                <Tooltip
                                                                    text="Verwijderen"
                                                                >
                                                                    <IconButton
                                                                        icon={Trash2}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onclick={(
                                                                            e,
                                                                        ) =>
                                                                            handleDeleteTaskClick(
                                                                                task.id,
                                                                                e,
                                                                            )}
                                                                    />
                                                                </Tooltip>
                                                            {/if}
                                                            <Tooltip
                                                                text="Archiveren"
                                                            >
                                                                <IconButton
                                                                    icon={Archive}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onclick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        archiveTask(
                                                                            task.id,
                                                                        );
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                            {#if (task.status as string) === "active"}
                                                                <Button
                                                                    size="sm"
                                                                    onclick={() =>
                                                                        completeTask(
                                                                            task.id,
                                                                            task.task_id,
                                                                            step.id,
                                                                        )}
                                                                >
                                                                    Voltooien
                                                                </Button>
                                                            {/if}
                                                        </div>
                                                        <!-- Assignee labels (only show when more than 1 assignee) -->
                                                        {#if getTaskAssigneeNames(task).length > 1}
                                                            <div
                                                                class="w-full flex flex-wrap gap-2"
                                                            >
                                                                {#each getTaskAssigneeNames(task) as name}
                                                                    <Label
                                                                        >{name}</Label
                                                                    >
                                                                {/each}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                        <!-- Messages Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 overflow-hidden"
                            style:display={activeTab === "messages"
                                ? "flex"
                                : "none"}
                        >
                            <MessagesTab
                                entityType="case"
                                entityId={caseId}
                                entityName={caseData?.name}
                            />
                        </div>
                        <!-- Notities Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 overflow-hidden"
                            style:display={activeTab === "notities"
                                ? "flex"
                                : "none"}
                        >
                            <NotesTab entityType="case" entityId={caseId} />
                        </div>
                        <!-- Files Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "files"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                {#if caseData}
                                    <FileManagerTab
                                        entityType="case"
                                        entityId={caseId}
                                        attachments={caseAttachments}
                                        onAttachmentsChange={async (
                                            newAttachments,
                                        ) => {
                                            caseAttachments = newAttachments;
                                            const result =
                                                await caseService.updateCase(
                                                    caseId,
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
                                        {#if hasPermission("/cases/[id]", "write")}
                                            <div>
                                                <h4
                                                    class="text-sm font-medium text-zinc-700 mb-4"
                                                >
                                                    Delen
                                                </h4>
                                                <PublicSharingToggle
                                                    entityType="case"
                                                    entityId={caseId}
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
                                            Case Stappen
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Het <strong
                                                    class="text-zinc-900"
                                                    >Stappen</strong
                                                > tabblad toont alle stappen en taken
                                                van deze case. Hier kunt u de voortgang
                                                volgen en taken beheren.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Stappen en Taken
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Elke case bestaat uit <strong
                                                    class="text-zinc-900"
                                                    >stappen</strong
                                                >
                                                die op hun beurt
                                                <strong class="text-zinc-900"
                                                    >taken</strong
                                                > bevatten. U kunt eigenaren toewijzen
                                                aan cases, stappen en taken.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/snippet}
            </Tabs>
        </div>
    </div>
{/if}

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="Case verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u deze case wilt verwijderen?
        </p>
        <p class="text-sm text-zinc-500">
            Deze actie kan niet ongedaan worden gemaakt. Alle stappen en taken
            van deze case worden ook verwijderd.
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

<!-- Archive Confirmation Modal -->
{#if taskToArchive}
    <Modal
        bind:open={archiveModalOpen}
        title="Taak archiveren"
        size="md"
        closeOnBackdropClick={false}
        loading={archiving}
    >
        <div class="space-y-4">
            <p class="text-zinc-600">
                Weet u zeker dat u deze taak wilt archiveren?
            </p>
            <p class="text-sm text-zinc-500">
                De taak wordt verplaatst naar het archief en is nog steeds
                zichtbaar via de 'Gearchiveerde taken' knop.
            </p>
            <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
                <Button
                    variant="secondary"
                    onclick={cancelArchive}
                    disabled={archiving}
                >
                    Annuleren
                </Button>
                <button
                    onclick={confirmArchive}
                    disabled={archiving}
                    class="px-4 py-2 bg-zinc-700 text-white rounded-sm shadow-xs hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {archiving ? "Archiveren..." : "Archiveren"}
                </button>
            </div>
        </div>
    </Modal>
{/if}

<!-- Delete Task Confirmation Modal -->
{#if taskToDelete}
    <Modal
        bind:open={deleteTaskModalOpen}
        title="Taak verwijderen"
        size="md"
        closeOnBackdropClick={false}
        loading={deletingTask}
    >
        <div class="space-y-4">
            <p class="text-zinc-600">
                Weet u zeker dat u deze taak wilt verwijderen?
            </p>
            <p class="text-sm text-zinc-500">
                Deze actie kan niet ongedaan worden gemaakt. De taak wordt
                definitief verwijderd.
            </p>
            <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
                <Button
                    variant="secondary"
                    onclick={cancelDeleteTask}
                    disabled={deletingTask}
                >
                    Annuleren
                </Button>
                <button
                    onclick={confirmDeleteTask}
                    disabled={deletingTask}
                    class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {deletingTask ? "Verwijderen..." : "Verwijderen"}
                </button>
            </div>
        </div>
    </Modal>
{/if}

<!-- Manual Task Drawer -->
<BacklogDrawer
    isOpen={isTaskDrawerOpen}
    onClose={handleDrawerClose}
    onsaved={handleWorkItemSaved}
    initialCaseStepId={selectedStepId}
    initialTaskId={selectedTaskId}
/>

<!-- Archived Tasks Drawer -->
<ArchivedTasksDrawer {caseId} onrestored={loadCase} />

<!-- Case Task Drawer -->
<CaseTaskDrawer onsaved={loadCase} />

<style>
    /* Grab cursor for draggable tasks */
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
    :global([draggable="true"]:active),
    :global(.dragging),
    :global(#dragging-task) {
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
    :global([draggable="true"]:hover:not(.dragging):not(#dragging-task)) {
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.06) !important;
    }

    /* Grayed out dragged task (MDN pattern) */
    :global(.dragging),
    :global(#dragging-task) {
        opacity: 0.5 !important;
        transform: scale(0.95) !important;
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
    }

    /* Drag ghost that follows cursor */
    :global(.drag-ghost) {
        transition: none !important;
        will-change: transform, top, left;
    }

    /* Placeholder styling (MDN pattern) - BOLD and clearly visible drop indicator */
    :global(.placeholder) {
        border: 4px solid rgb(234 88 12) !important; /* orange-600 - BOLD solid border */
        border-radius: 0.5rem; /* rounded-lg */
        background-color: rgb(
            255 237 213
        ) !important; /* orange-100 - visible background */
        margin-bottom: 0.5rem !important; /* space-y-2 */
        pointer-events: none !important; /* Prevent placeholder from interfering with drag events */
        min-height: 80px !important; /* Ensure minimum visible height */
        width: 100% !important; /* Full width like cards */
        box-sizing: border-box !important; /* Include border in width calculation */
        opacity: 1 !important; /* Fully opaque */
        position: relative !important;
        display: block !important;
        box-shadow:
            0 0 0 2px rgb(234 88 12),
            inset 0 0 0 1px rgb(249 115 22) !important; /* Double border effect for visibility */
        animation: placeholder-pulse 1.5s ease-in-out infinite;
    }

    /* Pulse animation to draw attention to drop zone */
    @keyframes placeholder-pulse {
        0%,
        100% {
            border-color: rgb(234 88 12); /* orange-600 */
            background-color: rgb(255 237 213); /* orange-100 */
            box-shadow:
                0 0 0 2px rgb(234 88 12),
                inset 0 0 0 1px rgb(249 115 22);
        }
        50% {
            border-color: rgb(194 65 12); /* orange-700 - darker on pulse */
            background-color: rgb(254 215 170); /* orange-200 - darker */
            box-shadow:
                0 0 0 3px rgb(194 65 12),
                inset 0 0 0 1px rgb(234 88 12);
        }
    }

    /* Smooth transitions for card movements (optimistic UI) */
    /* Disabled during drag for instant updates - transitions only apply when not dragging */
    :global([draggable="true"]:not(.dragging):not(#dragging-task)) {
        transition:
            transform 0.2s ease-out,
            opacity 0.2s ease-out;
    }

    /* No transition during drag - instant update like toast */
    :global([draggable="true"].dragging),
    :global([draggable="true"]#dragging-task) {
        transition: none !important;
    }

    /* Ensure nested interactive elements show pointer */
    :global([draggable="true"] button),
    :global([draggable="true"] [type="button"]),
    :global([draggable="true"] a),
    :global([draggable="true"] input),
    :global([draggable="true"] select),
    :global([draggable="true"] textarea),
    :global([draggable="true"] [data-button]),
    :global([draggable="true"] [data-clickable="true"]),
    :global([draggable="true"] button *),
    :global([draggable="true"] a *) {
        cursor: pointer !important;
    }
</style>
