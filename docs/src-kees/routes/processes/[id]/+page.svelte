<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Tabs, Modal, IconButton } from "$lib/components";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import FileManagerTab from "$lib/components/FileManagerTab.svelte";
    import MessagesTab from "$lib/components/MessagesTab.svelte";
    import NotesTab from "$lib/components/NotesTab.svelte";
    import { Pencil, Trash2 } from "lucide-svelte";
    import * as processService from "$lib/services/processService";
    import type {
        Process,
        ProcessStep,
        ProcessTask,
    } from "$lib/services/processService";
    import { toastStore } from "$lib/stores/toastStore";
    import { breadcrumbStore } from "$lib/stores/breadcrumbStore";
    import { getUserMessage } from "$lib/types/errors";

    const processId = $derived(Number($page.params.id));
    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "basic");
    const currentPath = $derived($page.url.pathname);
    const breadcrumbPath = $derived(`/processes/${processId}`);

    let name = $state("");
    let description = $state("");
    let completionDays = $state(30);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let processAttachments = $state<string[]>([]);

    // Steps and tasks state
    let steps = $state<(ProcessStep & { tasks: ProcessTask[] })[]>([]);
    let loadingSteps = $state(false);
    let errorSteps = $state<string | null>(null);
    let showAddStep = $state(false);
    let showAddStepAfterIndex = $state<number | null>(null); // null = add at end, number = insert after this index
    let showAddTask = $state<number | null>(null);
    let showAddTaskFromPrevious = $state<{
        stepId: number;
        fromTaskId: number;
    } | null>(null);
    let editingStep = $state<number | null>(null);
    let editingTask = $state<number | null>(null);

    // Confirmation modal state
    let confirmDeleteStepModalOpen = $state(false);
    let confirmDeleteTaskModalOpen = $state(false);
    let stepToDelete = $state<number | null>(null);
    let taskToDelete = $state<number | null>(null);

    // Drag-and-drop state
    let dragGhost = $state<HTMLElement | null>(null);
    let dragOffset = $state<{ x: number; y: number } | null>(null);
    let isDragging = $state(false);
    let dropTargetStepId = $state<number | null>(null);
    let dropTargetTaskId = $state<number | null>(null);
    let dragOverTaskIndex = $state<number | null>(null);
    let dragOverStepIndex = $state<number | null>(null);
    let draggedTask = $state<HTMLElement | null>(null);

    // Step form fields
    let stepName = $state("");
    let stepDescription = $state("");
    let stepStartDaysOffset = $state(0);
    let stepCompletionDays = $state(7);

    // Task form fields
    let taskName = $state("");
    let taskDescription = $state("");
    let taskRole = $state("");
    let taskStartOffsetDays = $state(0);
    let taskDeadlineDays = $state(3);
    let taskUren = $state<number | null>(null);
    let taskCriteria = $state("");

    const totalSteps = $derived(steps.length);
    const totalTasks = $derived(
        steps.reduce((sum, step) => sum + step.tasks.length, 0),
    );

    // Calculate deadline date if case started today
    const deadlineDate = $derived.by(() => {
        const today = new Date();
        const deadline = new Date(today);
        deadline.setDate(today.getDate() + completionDays);
        return {
            startDate: formatDate(today),
            endDate: formatDate(deadline),
        };
    });

    // Calculate total hours for a step based on its tasks
    function calculateStepHours(
        step: ProcessStep & { tasks: ProcessTask[] },
    ): number {
        return step.tasks.reduce((sum, task) => {
            return sum + (task.uren ?? 0);
        }, 0);
    }

    // Organize tasks hierarchically based on dependencies
    function organizeTasks(
        tasks: ProcessTask[],
    ): Array<ProcessTask & { children: ProcessTask[]; level: number }> {
        console.log("📦 [organizeTasks] Called with", tasks.length, "tasks");
        if (tasks.length === 0) {
            console.log("⚠️ [organizeTasks] No tasks to organize!");
            return [];
        }

        console.log(
            "📦 [organizeTasks] Tasks:",
            tasks.map((t) => ({
                id: t.id,
                name: t.name,
                step_order: t.step_order,
                order_index: t.order_index,
            })),
        );

        // Sort by step_order (task order within step) instead of order_index
        // Use safe defaults if fields are undefined/null
        let sortedTasks: ProcessTask[];
        try {
            sortedTasks = [...tasks].sort((a, b) => {
                const aOrder = a.step_order ?? a.order_index ?? 0;
                const bOrder = b.step_order ?? b.order_index ?? 0;
                return aOrder - bOrder;
            });
        } catch (err) {
            console.error("❌ [organizeTasks] Error sorting tasks:", err);
            // Return original tasks if sorting fails
            return tasks.map((t) => ({ ...t, children: [], level: 0 }));
        }

        console.log(
            "📦 [organizeTasks] After sort:",
            sortedTasks.map((t) => ({
                id: t.id,
                name: t.name,
                step_order: t.step_order,
                order_index: t.order_index,
            })),
        );

        const taskMap = new Map<number, TaskNode>();
        const rootTasks: TaskNode[] = [];

        // First pass: create all task nodes
        for (const task of sortedTasks) {
            taskMap.set(task.id, { ...task, children: [], level: 0 });
        }

        // Second pass: build hierarchy
        for (const task of sortedTasks) {
            const node = taskMap.get(task.id)!;
            if (task.from_task_id) {
                const parent = taskMap.get(task.from_task_id);
                if (parent) {
                    parent.children.push(node);
                    node.level = parent.level + 1;
                } else {
                    // Parent not found, treat as root
                    rootTasks.push(node);
                }
            } else {
                rootTasks.push(node);
            }
        }

        // Flatten the hierarchy for display (maintaining order)
        type TaskNode = ProcessTask & { children: TaskNode[]; level: number };
        const flattened: TaskNode[] = [];
        function traverse(nodes: TaskNode[]) {
            for (const node of nodes) {
                flattened.push(node);
                if (node.children.length > 0) {
                    traverse(node.children);
                }
            }
        }
        traverse(rootTasks);

        return flattened;
    }

    // Helper function for pluralization
    function pluralize(
        count: number,
        singular: string,
        plural: string,
    ): string {
        return count === 1 ? singular : plural;
    }

    // Format a date as "d mmm yyyy"
    function formatDate(date: Date): string {
        const day = date.getDate();
        const months = [
            "jan",
            "feb",
            "mrt",
            "apr",
            "mei",
            "jun",
            "jul",
            "aug",
            "sep",
            "okt",
            "nov",
            "dec",
        ];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    // Calculate start and end dates for a step (using today as reference)
    function calculateStepDates(step: ProcessStep): {
        startDate: string;
        endDate: string;
    } {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() + step.start_days_offset);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + step.completion_days);

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        };
    }

    // Calculate the absolute start day for a task (from step start)
    function getTaskAbsoluteStartDay(
        step: ProcessStep,
        task: ProcessTask,
    ): number {
        if (task.from_task_id) {
            return task.start_offset_days || 0;
        }
        return step.start_days_offset + (task.start_offset_days || 0);
    }

    // Calculate the duration of a task
    function getTaskDuration(step: ProcessStep, task: ProcessTask): number {
        if (task.from_task_id) {
            return task.deadline_days || 0;
        }
        return task.deadline_days - (task.start_offset_days || 0);
    }

    // Calculate the absolute deadline day for a task (from process start)
    function getTaskAbsoluteDeadlineDay(
        step: ProcessStep,
        task: ProcessTask,
    ): number {
        const absoluteStart = getTaskAbsoluteStartDay(step, task);
        const duration = getTaskDuration(step, task);
        return absoluteStart + duration;
    }

    // Calculate the step's deadline day (from process start)
    function getStepDeadlineDay(step: ProcessStep): number {
        return step.start_days_offset + step.completion_days;
    }

    // Check if a task exceeds the step's deadline
    function taskExceedsStepDeadline(
        step: ProcessStep,
        task: ProcessTask,
    ): boolean {
        const taskAbsoluteDeadline = getTaskAbsoluteDeadlineDay(step, task);
        const stepDeadline = getStepDeadlineDay(step);
        return taskAbsoluteDeadline > stepDeadline;
    }

    // Check if a task exceeds the process completion days
    function taskExceedsCompletionDays(
        step: ProcessStep,
        task: ProcessTask,
    ): boolean {
        const absoluteDeadline = getTaskAbsoluteDeadlineDay(step, task);
        return absoluteDeadline > completionDays;
    }

    // Get all tasks that exceed completion days
    const tasksExceedingCompletionDays = $derived(
        steps.flatMap((step) =>
            step.tasks
                .filter((task) => taskExceedsCompletionDays(step, task))
                .map((task) => ({
                    step,
                    task,
                    absoluteDeadline: getTaskAbsoluteDeadlineDay(step, task),
                })),
        ),
    );

    // Calculate start and end dates for a task within a step (using today as reference)
    function calculateTaskDates(
        step: ProcessStep,
        task: ProcessTask,
    ): { startDate: string; endDate: string } {
        const today = new Date();
        const taskStartDays = getTaskAbsoluteStartDay(step, task);
        const taskDuration = getTaskDuration(step, task);

        const startDate = new Date(today);
        startDate.setDate(today.getDate() + taskStartDays);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + taskDuration);

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        };
    }

    // Define tabs
    const tabs = [
        { id: "basic", label: "Algemeen" },
        { id: "structure", label: "Stappen" },
        { id: "files", label: "Bestanden" },
        { id: "messages", label: "Berichten" },
        { id: "notities", label: "Notities" },
        { id: "timeline", label: "Tijdslijn" },
        { id: "help", label: "Help" },
    ];

    onMount(async () => {
        const id = Number($page.params.id);
        if (!id || isNaN(id)) {
            error = "Ongeldig proces-ID";
            loading = false;
            return;
        }
        await loadProcess(id);
        await loadSteps(id);
    });

    onDestroy(() => {
        // Clear breadcrumb entity name when leaving the page
        breadcrumbStore.clearEntityName(breadcrumbPath);
    });

    async function loadProcess(id: number) {
        error = null;
        loading = true;
        try {
            const result = await processService.getProcessById(id);
            if (result.success) {
                const data = result.value;
                name = data.process.name;
                description = data.process.description || "";
                completionDays = data.process.completion_days;
                processAttachments = data.process.bijlagen || [];
                // Set entity name in breadcrumb store
                breadcrumbStore.setEntityName(
                    breadcrumbPath,
                    data.process.name,
                );
            } else {
                console.error("Error loading process:", result.error);
                error = getUserMessage(result.error);
            }
        } catch (err) {
            console.error("Error loading process:", err);
            error = "Fout bij laden van proces";
        } finally {
            loading = false;
        }
    }

    async function loadSteps(id: number) {
        loadingSteps = true;
        errorSteps = null;
        try {
            const result = await processService.getProcessById(id);
            if (result.success) {
                const data = result.value;
                console.log(
                    "📊 [loadSteps] Loaded",
                    data.steps.length,
                    "steps",
                );
                data.steps.forEach((step, i) => {
                    console.log(
                        `📋 [loadSteps] Step ${i}: ${step.name} (${step.id}) with ${step.tasks.length} tasks`,
                    );
                    step.tasks.forEach((task, j) => {
                        console.log(
                            `  ↳ Task ${j}: ${task.name} (${task.id}) - step_order: ${task.step_order}, order_index: ${task.order_index}`,
                        );
                    });
                });
                steps = data.steps;
            } else {
                console.error("Error loading steps:", result.error);
                errorSteps = "Fout bij laden van stappen";
            }
        } catch (err) {
            console.error("Error loading steps:", err);
            errorSteps = "Fout bij laden van stappen";
        } finally {
            loadingSteps = false;
        }
    }

    async function handleSubmit() {
        if (!name.trim()) {
            error = "Voer een procesnaam in";
            return;
        }
        error = null;
        loading = true;

        try {
            const result = await processService.updateProcess(processId, {
                name: name.trim(),
                description: description.trim() || undefined,
                completion_days: completionDays,
            });
            if (result.success) {
                toastStore.add("Proces succesvol bijgewerkt", "success");
            } else {
                console.error("Error updating process:", result.error);
                error = getUserMessage(result.error);
            }
        } catch (err) {
            console.error("Error saving process:", err);
            error =
                err instanceof Error
                    ? err.message
                    : "Fout bij opslaan van proces";
        } finally {
            loading = false;
        }
    }

    // Step management functions
    async function addStep() {
        // Validate input
        if (!processId) {
            errorSteps = "Proces-ID ontbreekt";
            toastStore.add("Proces-ID ontbreekt", "error");
            return;
        }

        if (!stepName.trim()) {
            errorSteps = "Voer een stapnaam in";
            toastStore.add("Voer een stapnaam in", "error");
            return;
        }

        // Determine insertion position
        const insertAfterIndex = showAddStepAfterIndex;
        let orderIndex: number;
        let calculatedStartOffset: number;

        if (insertAfterIndex === null) {
            // Adding at the end
            orderIndex = steps.length;
            const previousStepEnd =
                steps.length > 0
                    ? steps[steps.length - 1].start_days_offset +
                      steps[steps.length - 1].completion_days
                    : 0;
            calculatedStartOffset = previousStepEnd + stepStartDaysOffset;
        } else {
            // Inserting between steps
            orderIndex = insertAfterIndex + 1;
            const previousStep = steps[insertAfterIndex];
            const previousStepEnd =
                previousStep.start_days_offset + previousStep.completion_days;
            calculatedStartOffset = previousStepEnd + stepStartDaysOffset;

            // Update order_index for all subsequent steps
            const stepsToUpdate = steps.slice(insertAfterIndex + 1);
            for (const step of stepsToUpdate) {
                const updateResult = await processService.updateStep(step.id, {
                    order_index: step.order_index + 1,
                });
                if (!updateResult.success) {
                    console.error(
                        "Error updating step order:",
                        updateResult.error,
                    );
                    // Continue anyway, but log the error
                }
            }
        }

        loadingSteps = true;
        errorSteps = null;
        try {
            const result = await processService.addStepToProcess({
                process_id: processId,
                name: stepName.trim(),
                description: stepDescription.trim() || undefined,
                order_index: orderIndex,
                start_days_offset: calculatedStartOffset,
                completion_days: stepCompletionDays,
            });
            if (result.success) {
                const newStep = result.value;
                // Immediately add the step to local state for instant UI update
                if (insertAfterIndex === null) {
                    // Add at end
                    steps = [...steps, { ...newStep, tasks: [] }];
                } else {
                    // Insert at position
                    steps = [
                        ...steps.slice(0, insertAfterIndex + 1),
                        { ...newStep, tasks: [] },
                        ...steps.slice(insertAfterIndex + 1).map((step) => ({
                            ...step,
                            order_index: step.order_index + 1,
                        })),
                    ];
                }
                resetStepForm();
                showAddStep = false;
                toastStore.add("Stap succesvol toegevoegd", "success");
                // Refresh in background to ensure data consistency
                loadSteps(processId).catch(console.error);
            } else {
                console.error("Error adding step:", result.error);
                errorSteps = getUserMessage(result.error);
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (err) {
            console.error("Error adding step:", err);
            errorSteps = "Fout bij toevoegen van stap";
            toastStore.add("Fout bij toevoegen van stap", "error");
        } finally {
            loadingSteps = false;
        }
    }

    async function updateStep(stepId: number) {
        if (!stepName.trim()) return;

        loadingSteps = true;
        try {
            const result = await processService.updateStep(stepId, {
                name: stepName.trim(),
                description: stepDescription.trim() || undefined,
                start_days_offset: stepStartDaysOffset,
                completion_days: stepCompletionDays,
            });
            if (result.success) {
                await loadSteps(processId);
                resetStepForm();
                editingStep = null;
            } else {
                console.error("Error updating step:", result.error);
                errorSteps = getUserMessage(result.error);
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (err) {
            console.error("Error updating step:", err);
            errorSteps = "Fout bij bijwerken van stap";
            toastStore.add("Fout bij bijwerken van stap", "error");
        } finally {
            loadingSteps = false;
        }
    }

    function openDeleteStepModal(stepId: number) {
        stepToDelete = stepId;
        confirmDeleteStepModalOpen = true;
    }

    async function confirmDeleteStep() {
        if (!stepToDelete) return;

        loadingSteps = true;
        confirmDeleteStepModalOpen = false;
        try {
            const result = await processService.deleteStep(stepToDelete);
            if (result.success) {
                await loadSteps(processId);
                toastStore.add("Stap succesvol verwijderd", "success");
            } else {
                console.error("Error deleting step:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
                errorSteps = getUserMessage(result.error);
            }
        } catch (err) {
            console.error("Error deleting step:", err);
            toastStore.add("Fout bij verwijderen van stap", "error");
            errorSteps = "Fout bij verwijderen van stap";
        } finally {
            loadingSteps = false;
            stepToDelete = null;
        }
    }

    function cancelDeleteStep() {
        confirmDeleteStepModalOpen = false;
        stepToDelete = null;
    }

    async function addTask(stepId: number) {
        // Validate input
        if (!taskName.trim()) {
            errorSteps = "Voer een taaknaam in";
            toastStore.add("Voer een taaknaam in", "error");
            return;
        }

        const step = steps.find((s) => s.id === stepId);
        if (!step) return;

        // Determine if this is a dependent task
        const fromPrevious = showAddTaskFromPrevious;
        const isFromPrevious =
            fromPrevious !== null && fromPrevious.stepId === stepId;
        const fromTaskId = isFromPrevious ? fromPrevious.fromTaskId : undefined;

        // For dependent tasks: calculate absolute offset from step start (parent's absolute deadline)
        let calculatedStartOffsetDays = taskStartOffsetDays;
        let calculatedDeadlineDays = taskDeadlineDays;

        if (fromTaskId) {
            const parentTask = step.tasks.find((t) => t.id === fromTaskId);
            if (parentTask) {
                // Calculate parent's absolute deadline day (from step start)
                const parentAbsoluteDeadline = getTaskAbsoluteDeadlineDay(
                    step,
                    parentTask,
                );
                calculatedStartOffsetDays = parentAbsoluteDeadline;
            }
        }

        // Validation for dependent tasks: duration must be at least 1 day
        if (fromTaskId && taskDeadlineDays < 1) {
            errorSteps = `Duur moet minimaal 1 dag zijn voor afhankelijke taken.`;
            toastStore.add(
                `Duur moet minimaal 1 dag zijn voor afhankelijke taken.`,
                "error",
            );
            return;
        }

        // Validation for non-dependent tasks: deadline must be >= start offset
        if (!fromTaskId && calculatedDeadlineDays < calculatedStartOffsetDays) {
            errorSteps = `Deadline (${calculatedDeadlineDays}d) moet minimaal gelijk zijn aan de start offset (${calculatedStartOffsetDays}d vanaf stap start)`;
            toastStore.add(
                `Deadline (${calculatedDeadlineDays}d) moet minimaal gelijk zijn aan de start offset (${calculatedStartOffsetDays}d vanaf stap start)`,
                "error",
            );
            return;
        }

        const orderIndex = step.tasks.length;
        loadingSteps = true;
        errorSteps = null;
        try {
            // Convert invalid number to null for uren, but allow 0 as valid value
            let urenValue: number | null = null;
            if (taskUren !== null && taskUren !== undefined) {
                const numValue = Number(taskUren);
                if (!isNaN(numValue) && numValue >= 0) {
                    urenValue = numValue;
                }
            }

            const result = await processService.addTaskToStep({
                step_id: stepId,
                name: taskName.trim(),
                description: taskDescription.trim() || undefined,
                role: taskRole.trim() || undefined,
                order_index: orderIndex,
                start_offset_days: calculatedStartOffsetDays,
                deadline_days: calculatedDeadlineDays,
                from_task_id: fromTaskId,
                uren: urenValue ?? undefined,
                criteria: taskCriteria.trim() || undefined,
                links: [],
            });
            if (result.success) {
                const newTask = result.value;
                // Immediately add the task to local state for instant UI update
                steps = steps.map((step) => {
                    if (step.id === stepId) {
                        return {
                            ...step,
                            tasks: [...step.tasks, newTask],
                        };
                    }
                    return step;
                });
                resetTaskForm();
                showAddTask = null;
                showAddTaskFromPrevious = null;
                toastStore.add("Taak succesvol toegevoegd", "success");
                // Refresh in background to ensure data consistency
                loadSteps(processId).catch(console.error);
            } else {
                console.error("Error adding task:", result.error);
                errorSteps = getUserMessage(result.error);
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (err) {
            console.error("Error adding task:", err);
            errorSteps = "Fout bij toevoegen van taak";
            toastStore.add("Fout bij toevoegen van taak", "error");
        } finally {
            loadingSteps = false;
        }
    }

    async function updateTask(taskId: number) {
        if (!taskName.trim()) return;

        // Find the task and step to check if it's dependent
        let task: ProcessTask | undefined;
        let step: (ProcessStep & { tasks: ProcessTask[] }) | undefined;
        for (const s of steps) {
            task = s.tasks.find((t) => t.id === taskId);
            if (task) {
                step = s;
                break;
            }
        }

        // For dependent tasks: calculate absolute offset from step start (parent's absolute deadline)
        let calculatedStartOffsetDays = taskStartOffsetDays;
        let calculatedDeadlineDays = taskDeadlineDays;

        if (task?.from_task_id && step) {
            const parentTask = step.tasks.find(
                (t) => t.id === task.from_task_id,
            );
            if (parentTask) {
                const parentAbsoluteDeadline = getTaskAbsoluteDeadlineDay(
                    step,
                    parentTask,
                );
                calculatedStartOffsetDays = parentAbsoluteDeadline;
            }
        }

        // Validation for dependent tasks: duration must be at least 1 day
        if (task?.from_task_id && taskDeadlineDays < 1) {
            errorSteps = `Duur moet minimaal 1 dag zijn voor afhankelijke taken.`;
            toastStore.add(
                `Duur moet minimaal 1 dag zijn voor afhankelijke taken.`,
                "error",
            );
            return;
        }

        // Validation for non-dependent tasks: deadline must be >= start offset
        if (
            !task?.from_task_id &&
            calculatedDeadlineDays < calculatedStartOffsetDays
        ) {
            errorSteps = `Deadline (${calculatedDeadlineDays}d) moet minimaal gelijk zijn aan de start offset (${calculatedStartOffsetDays}d)`;
            toastStore.add(
                `Deadline (${calculatedDeadlineDays}d) moet minimaal gelijk zijn aan de start offset (${calculatedStartOffsetDays}d)`,
                "error",
            );
            return;
        }

        loadingSteps = true;
        errorSteps = null;
        try {
            // Convert invalid number to null for uren, but allow 0 as valid value
            let urenValue: number | null = null;
            if (taskUren !== null && taskUren !== undefined) {
                const numValue = Number(taskUren);
                if (!isNaN(numValue) && numValue >= 0) {
                    urenValue = numValue;
                }
            }

            const result = await processService.updateTask(taskId, {
                name: taskName.trim(),
                description: taskDescription.trim() || undefined,
                role: taskRole.trim() || undefined,
                start_offset_days: calculatedStartOffsetDays,
                deadline_days: calculatedDeadlineDays,
                uren: urenValue,
                criteria: taskCriteria.trim() || undefined,
            });
            if (result.success) {
                await loadSteps(processId);
                resetTaskForm();
                editingTask = null;
            } else {
                console.error("Error updating task:", result.error);
                errorSteps = getUserMessage(result.error);
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (err) {
            console.error("Error updating task:", err);
            errorSteps = "Fout bij bijwerken van taak";
            toastStore.add("Fout bij bijwerken van taak", "error");
        } finally {
            loadingSteps = false;
        }
    }

    function openDeleteTaskModal(taskId: number) {
        taskToDelete = taskId;
        confirmDeleteTaskModalOpen = true;
    }

    async function confirmDeleteTask() {
        if (!taskToDelete) return;

        loadingSteps = true;
        confirmDeleteTaskModalOpen = false;
        try {
            const result = await processService.deleteTask(taskToDelete);
            if (result.success) {
                await loadSteps(processId);
                toastStore.add("Taak succesvol verwijderd", "success");
            } else {
                console.error("Error deleting task:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
                errorSteps = getUserMessage(result.error);
            }
        } catch (err) {
            console.error("Error deleting task:", err);
            toastStore.add("Fout bij verwijderen van taak", "error");
            errorSteps = "Fout bij verwijderen van taak";
        } finally {
            loadingSteps = false;
            taskToDelete = null;
        }
    }

    function cancelDeleteTask() {
        confirmDeleteTaskModalOpen = false;
        taskToDelete = null;
    }

    function startEditStep(step: ProcessStep) {
        editingStep = step.id;
        stepName = step.name;
        stepDescription = step.description || "";
        stepStartDaysOffset = step.start_days_offset;
        stepCompletionDays = step.completion_days;
    }

    function startEditTask(task: ProcessTask) {
        editingTask = task.id;
        taskName = task.name;
        taskDescription = task.description || "";
        taskRole = task.role || "";

        // For dependent tasks: always use 0 offset (child tasks always start immediately after parent)
        if (task.from_task_id) {
            taskStartOffsetDays = 0;
            taskDeadlineDays = task.deadline_days || 0;
        } else {
            // For non-dependent tasks, values are absolute from step start
            taskStartOffsetDays = task.start_offset_days || 0;
            taskDeadlineDays = task.deadline_days;
        }
        taskUren = task.uren ?? null;
        taskCriteria = task.criteria || "";
    }

    function resetStepForm() {
        stepName = "";
        stepDescription = "";
        stepStartDaysOffset = 0;
        stepCompletionDays = 7;
        // Note: Don't reset showAddStepAfterIndex here - it's set by the button click
        // and should only be reset when closing the form (via Cancel button or after submission)
    }

    function resetTaskForm() {
        taskName = "";
        taskDescription = "";
        taskRole = "";
        taskStartOffsetDays = 0;
        taskDeadlineDays = 3;
        taskUren = null;
        taskCriteria = "";
    }

    function startAddTaskFromPrevious(stepId: number, fromTaskId: number) {
        const step = steps.find((s) => s.id === stepId);
        if (!step) return;

        const parentTask = step.tasks.find((t) => t.id === fromTaskId);
        if (!parentTask) return;

        resetTaskForm();
        taskStartOffsetDays = 0;
        taskDeadlineDays = 3;
        showAddTaskFromPrevious = { stepId, fromTaskId };
        showAddTask = null;
    }

    function updateTaskDeadlineFromDuration(duration: number) {
        if (showAddTaskFromPrevious || editingTask) {
            const task = editingTask
                ? steps
                      .flatMap((s) => s.tasks)
                      .find((t) => t.id === editingTask)
                : null;
            if (task?.from_task_id || showAddTaskFromPrevious) {
                taskDeadlineDays = duration;
            } else {
                taskDeadlineDays = taskStartOffsetDays + duration;
            }
        } else {
            taskDeadlineDays = taskStartOffsetDays + duration;
        }
    }

    async function handleClose() {
        await goto("/processes");
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

    // Move placeholder to show where item will be dropped
    function movePlaceholder(event: DragEvent) {
        if (!isDragging || !draggedTask) return;

        const tasksContainer = event.currentTarget as HTMLElement;
        const placeholder = document.querySelector(
            ".placeholder",
        ) as HTMLElement | null;

        // Don't move placeholder if not dragging over the container
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
                // Don't change if insertion point is already the placeholder
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

    async function handleDragStart(
        event: DragEvent,
        taskId: number,
        stepId: number,
        _taskIndex: number,
    ) {
        console.log(
            "🚀 [DRAG START] taskId:",
            taskId,
            "stepId:",
            stepId,
            "_taskIndex:",
            _taskIndex,
        );
        const target = event.currentTarget as HTMLElement;
        const task = steps
            .find((s) => s.id === stepId)
            ?.tasks.find((t) => t.id === taskId);
        const taskIndex = task?.step_order ?? task?.order_index ?? _taskIndex;

        console.log(
            "📊 [DRAG START] Task found:",
            task,
            "calculated taskIndex:",
            taskIndex,
        );

        // Set ID on dragged task (MDN pattern)
        target.id = "dragging-task";
        draggedTask = target;
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

        // Run cleanup if stored
        if ((target as any).__dragCleanup) {
            (target as any).__dragCleanup();
        }

        // Remove all placeholders
        document.querySelectorAll(".placeholder").forEach((placeholder) => {
            placeholder.remove();
        });

        dropTargetStepId = null;
        dropTargetTaskId = null;
        dragOverTaskIndex = null;
        dragOverStepIndex = null;

        console.log(
            "🧹 [DRAG END] Cleanup complete - dropped?",
            dropTargetTaskId !== null,
        );
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

        let insertionIndex: number;

        console.log("📥 [DROP CONTAINER] Preserved drag state:", {
            dropTargetTaskId: preservedDropTargetTaskId,
            dragOverTaskIndex: preservedDragOverTaskIndex,
            dragOverStepIndex: preservedDragOverStepIndex,
        });

        // Find placeholder to determine actual insertion position
        // This handles drops in empty spaces between tasks
        const step = steps.find((s) => s.id === targetStepId);
        if (!step) {
            console.log("❌ [DROP CONTAINER] Step not found:", targetStepId);
            return;
        }

        const taskIdStr = event.dataTransfer?.getData("task/task-id");
        const sourceStepIdStr = event.dataTransfer?.getData("task/step-id");
        const sourceTaskIndexStr =
            event.dataTransfer?.getData("task/task-index");

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

        // CRITICAL: Validate that dataTransfer matches current step
        // If sourceStepId doesn't match targetStepId, dataTransfer is stale
        if (sourceStepId !== targetStepId) {
            console.log(
                "⚠️ [DROP CONTAINER] Stale dataTransfer detected - source and target steps differ",
            );
            console.log(
                "⚠️ [DROP CONTAINER] sourceStepId:",
                sourceStepId,
                "targetStepId:",
                targetStepId,
            );
            // Use fallback: insert at end if no placeholder, or use placeholder position
            const placeholderElement = document.querySelector(
                ".placeholder",
            ) as HTMLElement | null;
            if (placeholderElement) {
                const siblings = Array.from(
                    placeholderElement.parentElement?.children || [],
                ) as HTMLElement[];
                const taskElements = siblings.filter((el) =>
                    el.hasAttribute("data-task-id"),
                );
                const placeholderIndex =
                    taskElements.indexOf(placeholderElement);
                insertionIndex =
                    placeholderIndex !== -1
                        ? placeholderIndex
                        : step.tasks.length;
                console.log(
                    "🎯 [DROP CONTAINER] Fallback: Using placeholder index:",
                    insertionIndex,
                );
            } else {
                insertionIndex = step.tasks.length;
                console.log(
                    "🎯 [DROP CONTAINER] Fallback: No placeholder, inserting at end (index:",
                    insertionIndex,
                    ")",
                );
            }
        } else {
            // Same step - validate taskId to ensure we're processing correct drag
            const taskInStep = step.tasks.find((t) => t.id === taskId);
            if (!taskInStep) {
                console.log(
                    "⚠️ [DROP CONTAINER] Task",
                    taskId,
                    "not found in target step",
                );
                // Fallback to end of step
                insertionIndex = step.tasks.length;
                console.log(
                    "🎯 [DROP CONTAINER] Fallback: Task not in step, inserting at end",
                );
            } else {
                // Task is in step - check if position makes sense
                const currentTaskIndex =
                    taskInStep.step_order ?? taskInStep.order_index;
                console.log(
                    "✅ [DROP CONTAINER] Task validated:",
                    taskId,
                    "at current index:",
                    currentTaskIndex,
                );
            }
        }

        const isCrossStepMove = sourceStepId !== targetStepId;
        // Try to use preserved drag state first (hovering over specific task)
        if (
            preservedDropTargetTaskId !== null &&
            preservedDragOverTaskIndex !== null
        ) {
            insertionIndex = preservedDragOverTaskIndex;
            console.log(
                "🎯 [DROP CONTAINER] Using preserved hover position:",
                insertionIndex,
            );
        } else {
            // No hover position - use placeholder or default to end
            const placeholderElement = document.querySelector(
                ".placeholder",
            ) as HTMLElement | null;
            if (placeholderElement) {
                const siblings = Array.from(
                    placeholderElement.parentElement?.children || [],
                ) as HTMLElement[];
                const taskElements = siblings.filter((el) =>
                    el.hasAttribute("data-task-id"),
                );
                const placeholderIndex =
                    taskElements.indexOf(placeholderElement);
                insertionIndex =
                    placeholderIndex !== -1
                        ? placeholderIndex
                        : step.tasks.length;
                console.log(
                    "🎯 [DROP CONTAINER] Using placeholder index:",
                    insertionIndex,
                );
            } else {
                insertionIndex = step.tasks.length;
                console.log(
                    "🎯 [DROP CONTAINER] No placeholder, inserting at end:",
                    insertionIndex,
                );
            }
        }
        console.log("🔄 [DROP CONTAINER] isCrossStepMove:", isCrossStepMove);

        let allTaskOrders: {
            id: number;
            step_order: number;
            step_id?: number | null;
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
                ...step.tasks.slice(0, insertionIndex),
                draggedTaskObj,
                ...step.tasks.slice(insertionIndex),
            ];
            const targetOrders = targetNewTasks.map((t, i) => ({
                id: t.id,
                step_order: i,
            }));

            allTaskOrders = [
                ...sourceOrders,
                ...targetOrders.map((o) => ({ ...o, step_id: targetStepId })),
            ];
        } else {
            const tasksExcludingDragged = step.tasks.filter(
                (t) => t.id !== taskId,
            );
            const draggedTaskObj = step.tasks.find((t) => t.id === taskId);
            if (!draggedTaskObj) return;

            const newOrder = [
                ...tasksExcludingDragged.slice(0, insertionIndex),
                draggedTaskObj,
                ...tasksExcludingDragged.slice(insertionIndex),
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

        console.log("📦 [DROP CONTAINER] Calling reorderProcessTasks with:", {
            taskId,
            sourceStepId,
            targetStepId: isCrossStepMove ? targetStepId : null,
            targetStepOrder:
                allTaskOrders.find((o) => o.id === taskId)?.step_order || 0,
            allTaskOrders,
        });

        const { reorderProcessTasks } =
            await import("$lib/services/caseService");
        const result = await reorderProcessTasks(
            taskId,
            sourceStepId,
            isCrossStepMove ? targetStepId : null,
            allTaskOrders.find((o) => o.id === taskId)?.step_order || 0,
            allTaskOrders,
        );

        console.log("📬 [DROP CONTAINER] reorderProcessTasks result:", result);

        if (result.success) {
            console.log(
                "✅ [DROP CONTAINER] Reorder successful - showing toast and reloading steps",
            );
            toastStore.add("Taak verplaatst", "success");
            await loadSteps(processId);
        } else {
            console.log("❌ [DROP CONTAINER] Reorder failed:", result.error);
            toastStore.add("Fout bij verplaatsen van taak", "error");
        }

        // Clear drag state (handleDragEnd might have already done this, but ensure it's cleared)
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
        );
        if (event.dataTransfer?.types.includes("task")) {
            event.preventDefault();
            // Get the data to see which task is being dragged
            const draggedTaskIdStr =
                event.dataTransfer?.getData("task/task-id");
            const draggedTaskId = draggedTaskIdStr
                ? Number(draggedTaskIdStr)
                : null;

            // Only update state if we're hovering over a different task
            // CRITICAL: Don't update state if hovering over the dragged task itself
            const isDifferentTask = draggedTaskId !== taskId;

            if (
                isDifferentTask &&
                (dropTargetTaskId !== taskId || dragOverTaskIndex !== taskIndex)
            ) {
                dropTargetTaskId = taskId;
                dragOverTaskIndex = taskIndex;
                console.log(
                    "✅ [DRAG OVER] dropTargetTaskId updated to:",
                    taskId,
                    "dragOverTaskIndex set to:",
                    taskIndex,
                );
            }
            movePlaceholder(event);
        } else {
            console.log(
                '❌ [DRAG OVER] Event dataTransfer does not include "task" type',
            );
        }
    }

    function handleTaskDragLeave(event: DragEvent) {
        // Don't clear drag state - it may be needed when dropping on the container
        // Only clear if actually leaving the step (handled in handleStepDragLeave)
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

        // Remove all placeholders (already cleaned up in handleDragEnd, but double-check)
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

            const draggedTask = sourceStep.tasks.find((t) => t.id === taskId);
            if (!draggedTask) return;

            const sourceTasksExcluding = sourceStep.tasks.filter(
                (t) => t.id !== taskId,
            );
            const sourceNewTasks = [...sourceTasksExcluding, draggedTask];

            const targetNewTasks = [...targetStep.tasks, draggedTask];

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
            const draggedTask = step.tasks.find((t) => t.id === taskId);
            if (!draggedTask) return;

            console.log("🔧 [DROP] Before reordering:", {
                taskId,
                sourceTaskIndex,
                targetTaskIndex,
                tasksExcluding: tasksExcludingDragged.map((t) => t.id),
                draggedTaskId: draggedTask.id,
            });

            let insertIndex = tasksExcludingDragged.length;
            if (targetTaskIndex !== sourceTaskIndex) {
                if (targetTaskIndex < sourceTaskIndex) {
                    insertIndex = targetTaskIndex;
                } else {
                    insertIndex = targetTaskIndex + 1;
                }
            }

            console.log("🔧 [DROP] Calculated insertIndex:", insertIndex);

            const newOrder = [...tasksExcludingDragged];
            newOrder.splice(insertIndex, 0, draggedTask);

            console.log(
                "🔧 [DROP] After splice, newOrder:",
                newOrder.map((t) => ({ id: t.id, name: t.name })),
            );

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
        console.log(
            "📦 [DROP] Detailed allTaskOrders:",
            JSON.stringify(
                allTaskOrders.map((o) => ({
                    id: o.id,
                    step_order: o.step_order,
                })),
            ),
        );

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
                "✅ [DROP] Reorder successful - showing toast and reloading steps",
            );
            toastStore.add("Taak verplaatst", "success");
            await loadSteps(processId);
        } else {
            console.log("❌ [DROP] Reorder failed:", result.error);
            toastStore.add("Fout bij verplaatsen van taak", "error");
        }

        dropTargetStepId = null;
        dropTargetTaskId = null;
    }
</script>

<div
    class="container mx-auto px-4 max-w-[90vw] h-full flex flex-col overflow-hidden"
>
    {#if error && !name}
        <div class="flex flex-col items-center justify-center py-12">
            <div class="text-red-600 mb-4">{error}</div>
            <Button onclick={() => goto("/processes")}
                >Terug naar processen</Button
            >
        </div>
    {:else}
        <div class="flex flex-col flex-1 min-h-0 pt-8 pb-8">
            <!-- Header -->
            <div class="mb-6 pb-4 border-b border-zinc-200 flex-shrink-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h2
                            class="text-2xl font-bold text-zinc-900 font-aspekta"
                        >
                            {name || "Proces"}
                        </h2>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="secondary" onclick={handleClose}
                            >Terug naar processen</Button
                        >
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
                                id="process-basic-form"
                                onsubmit={(e) => {
                                    e.preventDefault();
                                    handleSubmit();
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

                                    {#if loading}
                                        <div
                                            class="flex items-center justify-center py-12"
                                        >
                                            <Spinner size="lg" />
                                        </div>
                                    {:else}
                                        <div class="space-y-6">
                                            <div>
                                                <label
                                                    for="name"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Sjabloonnaam <span
                                                        class="text-red-500"
                                                        >*</span
                                                    >
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    bind:value={name}
                                                    required
                                                    disabled={loading}
                                                    class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                    placeholder="bijv. Medewerker Onboarding"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    for="description"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Beschrijving
                                                </label>
                                                <textarea
                                                    id="description"
                                                    bind:value={description}
                                                    rows="4"
                                                    disabled={loading}
                                                    class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                    placeholder="Beschrijf waar dit proces voor is..."
                                                ></textarea>
                                            </div>

                                            <div>
                                                <label
                                                    for="completionDays"
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Voltooiingsdagen <span
                                                        class="text-red-500"
                                                        >*</span
                                                    >
                                                </label>
                                                <input
                                                    id="completionDays"
                                                    type="number"
                                                    bind:value={completionDays}
                                                    min="1"
                                                    required
                                                    disabled={loading}
                                                    class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                />
                                                <p
                                                    class="text-xs text-zinc-500 mt-1"
                                                >
                                                    Het aantal dagen waarbinnen
                                                    dit proces normaal gesproken
                                                    voltooid moet worden.
                                                </p>
                                                <div
                                                    class="text-xs text-zinc-500 mt-1.5 flex gap-3"
                                                >
                                                    <span
                                                        >Duur: {completionDays}d</span
                                                    >
                                                    <span>•</span>
                                                    <span
                                                        >{deadlineDate.startDate}
                                                        - {deadlineDate.endDate}</span
                                                    >
                                                </div>
                                                {#if tasksExceedingCompletionDays.length > 0}
                                                    <div
                                                        class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-sm text-yellow-800 text-xs"
                                                    >
                                                        <div
                                                            class="font-medium mb-1"
                                                        >
                                                            ⚠️ Waarschuwing
                                                        </div>
                                                        <p>
                                                            {pluralize(
                                                                tasksExceedingCompletionDays.length,
                                                                "Een taak heeft",
                                                                `${tasksExceedingCompletionDays.length} taken hebben`,
                                                            )} een deadline die verder
                                                            ligt dan {completionDays}
                                                            dagen. Pas de voltooiingsdagen
                                                            aan of wijzig de deadlines
                                                            in de structuur tab.
                                                        </p>
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </div>

                                <!-- Footer Actions for Basic Info (Fixed) -->
                                <div
                                    class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white mt-auto"
                                >
                                    <div class="flex justify-start gap-3">
                                        {#if !loading}
                                            <Button
                                                type="submit"
                                                form="process-basic-form"
                                                disabled={loading}
                                            >
                                                Wijzigingen Opslaan
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                type="button"
                                                onclick={handleClose}
                                                disabled={loading}
                                            >
                                                Annuleren
                                            </Button>
                                        {/if}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <!-- Messages Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0"
                            style:display={activeTab === "messages"
                                ? "flex"
                                : "none"}
                        >
                            <MessagesTab
                                entityType="process"
                                entityId={processId}
                                entityName={name}
                            />
                        </div>
                        <!-- Notities Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0"
                            style:display={activeTab === "notities"
                                ? "flex"
                                : "none"}
                        >
                            <NotesTab
                                entityType="process"
                                entityId={processId}
                            />
                        </div>
                        <!-- Files Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "files"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <FileManagerTab
                                    entityType="process"
                                    entityId={processId}
                                    attachments={processAttachments}
                                    onAttachmentsChange={async (
                                        newAttachments,
                                    ) => {
                                        processAttachments = newAttachments;
                                        const result =
                                            await processService.updateProcess(
                                                processId,
                                                {
                                                    bijlagen: newAttachments,
                                                },
                                            );
                                        if (result.success) {
                                            toastStore.add(
                                                "Bestanden bijgewerkt",
                                                "success",
                                            );
                                        } else {
                                            toastStore.add(
                                                getUserMessage(result.error),
                                                "error",
                                            );
                                        }
                                    }}
                                />
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
                        <!-- Help/Explanation Tab -->
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
                                            Wat zijn Stappen?
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Een <strong
                                                    class="text-zinc-900"
                                                    >stap</strong
                                                > is een fase in uw proces. Stappen
                                                worden in volgorde uitgevoerd en helpen
                                                u het proces te organiseren in logische
                                                delen.
                                            </p>
                                            <div class="space-y-2">
                                                <h4
                                                    class="text-sm font-medium text-zinc-900"
                                                >
                                                    Voorbeeld:
                                                </h4>
                                                <ul
                                                    class="list-disc list-inside text-sm text-zinc-700 space-y-1 ml-2"
                                                >
                                                    <li>
                                                        Stap 1: "Intake en
                                                        Documentatie"
                                                    </li>
                                                    <li>
                                                        Stap 2: "Training en
                                                        Begeleiding"
                                                    </li>
                                                    <li>
                                                        Stap 3: "Evaluatie en
                                                        Afronding"
                                                    </li>
                                                </ul>
                                            </div>
                                            <div
                                                class="mt-4 pt-3 border-t border-zinc-200"
                                            >
                                                <h4
                                                    class="text-xs font-semibold text-zinc-900 mb-2"
                                                >
                                                    Velden bij het aanmaken van
                                                    een stap:
                                                </h4>
                                                <ul
                                                    class="space-y-2 text-xs text-zinc-700"
                                                >
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Stapnaam:</strong
                                                        > Een korte, duidelijke naam
                                                        voor deze fase
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Beschrijving:</strong
                                                        > Optioneel - uitgebreide
                                                        uitleg van wat deze stap inhoudt
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Start na (dagen):</strong
                                                        > Het aantal dagen na het
                                                        starten van het proces voordat
                                                        deze stap begint (bijv. 0
                                                        = direct, 7 = na een week)
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Voltooiing (dagen):</strong
                                                        > Het aantal dagen dat deze
                                                        stap normaal gesproken duurt
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Wat zijn Taken?
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Een <strong
                                                    class="text-zinc-900"
                                                    >taak</strong
                                                > is een specifieke actie die binnen
                                                een stap moet worden uitgevoerd. Taken
                                                zijn concrete acties die gedaan moeten
                                                worden om een stap te voltooien.
                                            </p>
                                            <div class="space-y-2">
                                                <h4
                                                    class="text-sm font-medium text-zinc-900"
                                                >
                                                    Voorbeeld:
                                                </h4>
                                                <p
                                                    class="text-xs text-zinc-600 mb-2"
                                                >
                                                    Binnen de stap "Intake en
                                                    Documentatie" kunt u taken
                                                    hebben zoals:
                                                </p>
                                                <ul
                                                    class="list-disc list-inside text-sm text-zinc-700 space-y-1 ml-2"
                                                >
                                                    <li>
                                                        Taak: "Paspoort
                                                        kopiëren"
                                                    </li>
                                                    <li>
                                                        Taak: "Contract
                                                        ondertekenen"
                                                    </li>
                                                    <li>
                                                        Taak: "Werkplek
                                                        voorbereiden"
                                                    </li>
                                                </ul>
                                            </div>
                                            <div
                                                class="mt-4 pt-3 border-t border-zinc-200"
                                            >
                                                <h4
                                                    class="text-xs font-semibold text-zinc-900 mb-2"
                                                >
                                                    Velden bij het aanmaken van
                                                    een taak:
                                                </h4>
                                                <ul
                                                    class="space-y-2 text-xs text-zinc-700"
                                                >
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Taaknaam:</strong
                                                        > Een korte, actiegerichte
                                                        naam (bijv. "Contract opstellen")
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Beschrijving:</strong
                                                        > Optioneel - gedetailleerde
                                                        instructies over wat er moet
                                                        gebeuren
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Rol:</strong
                                                        > Optioneel - wie verantwoordelijk
                                                        is voor deze taak (bijv. "Manager",
                                                        "HR")
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Deadline (dagen):</strong
                                                        > Het aantal dagen na het
                                                        starten van de stap dat deze
                                                        taak voltooid moet zijn
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Uren:</strong
                                                        > Optioneel - geschatte benodigde
                                                        tijd voor deze taak
                                                    </li>
                                                    <li>
                                                        <strong
                                                            class="text-zinc-900"
                                                            >Criteria:</strong
                                                        > Optioneel - voorwaarden
                                                        waaraan moet worden voldaan
                                                        om de taak als voltooid te
                                                        beschouwen
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Taakafhankelijkheden
                                        </h3>
                                        <div
                                            class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Taken kunnen <strong
                                                    class="text-zinc-900"
                                                    >afhankelijk</strong
                                                > zijn van andere taken. Dit betekent
                                                dat een taak pas kan starten nadat
                                                een andere taak is voltooid.
                                            </p>
                                            <div class="space-y-2">
                                                <h4
                                                    class="text-sm font-medium text-zinc-900"
                                                >
                                                    Hoe werkt het?
                                                </h4>
                                                <ul
                                                    class="list-disc list-inside text-sm text-zinc-700 space-y-1 ml-2"
                                                >
                                                    <li>
                                                        Klik op <span
                                                            class="text-orange-600 font-medium"
                                                            >"+ Taak vanaf:
                                                            [Taaknaam]"</span
                                                        > na een taak om een afhankelijke
                                                        taak te maken
                                                    </li>
                                                    <li>
                                                        De nieuwe taak start
                                                        automatisch na de
                                                        deadline van de
                                                        ouder-taak
                                                    </li>
                                                    <li>
                                                        Afhankelijke taken
                                                        worden visueel
                                                        geïndenteerd met een
                                                        pijl (→) en border
                                                    </li>
                                                    <li>
                                                        Ouder-taken hebben een
                                                        border om aan te geven
                                                        dat ze afhankelijke
                                                        taken hebben
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Process Structure Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "structure"
                                ? "flex"
                                : "none"}
                        >
                            {#if errorSteps}
                                <div
                                    class="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
                                >
                                    {errorSteps}
                                </div>
                            {/if}

                            {#if tasksExceedingCompletionDays.length > 0}
                                <div
                                    class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-sm text-yellow-800 text-sm"
                                >
                                    <div class="font-medium mb-1">
                                        ⚠️ Waarschuwing: Taken overschrijden
                                        voltooiingsdagen
                                    </div>
                                    <p class="text-xs mb-2">
                                        {pluralize(
                                            tasksExceedingCompletionDays.length,
                                            "taak",
                                            "taken",
                                        )}
                                        {tasksExceedingCompletionDays.length ===
                                        1
                                            ? "heeft"
                                            : "hebben"} een deadline die verder ligt
                                        dan de {completionDays} voltooiingsdagen die
                                        in de basisinformatie zijn ingesteld:
                                    </p>
                                    <ul
                                        class="text-xs list-disc list-inside space-y-1"
                                    >
                                        {#each tasksExceedingCompletionDays as { step, task, absoluteDeadline }}
                                            <li>
                                                <strong>{task.name}</strong> (in
                                                "{step.name}"): deadline op dag {absoluteDeadline},
                                                maar proces eindigt op dag {completionDays}
                                            </li>
                                        {/each}
                                    </ul>
                                    <p class="text-xs mt-2 italic">
                                        Tip: Pas de voltooiingsdagen aan in de
                                        basisinformatie tab of wijzig de
                                        deadlines van deze taken.
                                    </p>
                                </div>
                            {/if}

                            {#if loadingSteps && steps.length === 0}
                                <div
                                    class="flex items-center justify-center py-12"
                                >
                                    <Spinner size="lg" />
                                </div>
                            {:else}
                                <div
                                    class="flex-1 overflow-y-auto space-y-4 pb-4"
                                >
                                    {#each steps as step, stepIndex (step.id)}
                                        <!-- Step Card -->
                                        <div
                                            class="bg-white border border-zinc-200 rounded-lg p-4 overflow-visible"
                                            data-step-index={stepIndex}
                                        >
                                            {#if editingStep === step.id}
                                                <!-- Edit Step Form -->
                                                <div class="space-y-3">
                                                    <div>
                                                        <label
                                                            for={`edit-step-name-${step.id}`}
                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                            >Stapnaam</label
                                                        >
                                                        <input
                                                            id={`edit-step-name-${step.id}`}
                                                            type="text"
                                                            bind:value={
                                                                stepName
                                                            }
                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            for={`step-desc-${step.id}`}
                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                            >Beschrijving</label
                                                        >
                                                        <textarea
                                                            id={`step-desc-${step.id}`}
                                                            bind:value={
                                                                stepDescription
                                                            }
                                                            rows="2"
                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                        ></textarea>
                                                    </div>
                                                    <div
                                                        class="grid grid-cols-2 gap-3"
                                                    >
                                                        <div>
                                                            <label
                                                                for={`step-start-${step.id}`}
                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                >Start offset
                                                                (dagen)</label
                                                            >
                                                            <input
                                                                id={`step-start-${step.id}`}
                                                                type="number"
                                                                bind:value={
                                                                    stepStartDaysOffset
                                                                }
                                                                min="0"
                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label
                                                                for={`step-completion-${step.id}`}
                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                >Voltooiing
                                                                (dagen)</label
                                                            >
                                                            <input
                                                                id={`step-completion-${step.id}`}
                                                                type="number"
                                                                bind:value={
                                                                    stepCompletionDays
                                                                }
                                                                min="1"
                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div class="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onclick={(e) => {
                                                                e.stopPropagation();
                                                                updateStep(
                                                                    step.id,
                                                                );
                                                            }}
                                                            disabled={loadingSteps}
                                                        >
                                                            Opslaan
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onclick={(e) => {
                                                                e.stopPropagation();
                                                                editingStep =
                                                                    null;
                                                                resetStepForm();
                                                            }}
                                                        >
                                                            Annuleren
                                                        </Button>
                                                    </div>
                                                </div>
                                            {:else}
                                                <!-- Step Display -->
                                                {@const stepHours =
                                                    calculateStepHours(step)}
                                                {@const stepDates =
                                                    calculateStepDates(step)}
                                                {@const stepDurationDays =
                                                    step.completion_days}
                                                {@const stepPercentage =
                                                    completionDays > 0
                                                        ? Math.round(
                                                              (stepDurationDays /
                                                                  completionDays) *
                                                                  100,
                                                          )
                                                        : 0}
                                                <div
                                                    class="flex justify-between items-start mb-3"
                                                >
                                                    <div class="flex-1">
                                                        <h3
                                                            class="text-base font-semibold text-zinc-900"
                                                        >
                                                            {stepIndex + 1}. {step.name}
                                                            <span
                                                                class="text-xs font-normal text-zinc-500 ml-2"
                                                            >
                                                                ({stepDurationDays}d,
                                                                {stepPercentage}%)
                                                            </span>
                                                        </h3>
                                                        {#if step.description}
                                                            <p
                                                                class="text-xs text-zinc-600 mt-1"
                                                            >
                                                                {step.description}
                                                            </p>
                                                        {/if}
                                                        <div
                                                            class="text-xs text-zinc-500 mt-1 flex gap-3"
                                                        >
                                                            <span
                                                                >Start: +{step.start_days_offset}d,
                                                                Voltooiing: {step.completion_days}d</span
                                                            >
                                                            <span>•</span>
                                                            <span
                                                                >{stepDates.startDate}
                                                                - {stepDates.endDate}</span
                                                            >
                                                            {#if stepHours > 0}
                                                                <span>•</span>
                                                                <span
                                                                    class="font-medium text-zinc-700"
                                                                    >{stepHours} uur
                                                                    totaal</span
                                                                >
                                                            {/if}
                                                        </div>
                                                    </div>
                                                    <div class="flex gap-1">
                                                        <IconButton
                                                            icon={Pencil}
                                                            size="sm"
                                                            variant="ghost"
                                                            tooltip="Stap bewerken"
                                                            tooltipPosition="left"
                                                            onclick={() =>
                                                                startEditStep(
                                                                    step,
                                                                )}
                                                            disabled={loadingSteps}
                                                        />
                                                        <IconButton
                                                            icon={Trash2}
                                                            size="sm"
                                                            variant="danger"
                                                            tooltip="Stap verwijderen"
                                                            tooltipPosition="left"
                                                            onclick={() =>
                                                                openDeleteStepModal(
                                                                    step.id,
                                                                )}
                                                            disabled={loadingSteps}
                                                        />
                                                    </div>
                                                </div>

                                                <!-- Tasks -->
                                                <div
                                                    class="ml-4 space-y-2 border-l-2 border-zinc-200 pl-3"
                                                    ondragover={(e) =>
                                                        handleDragOver(
                                                            e,
                                                            step.id,
                                                            stepIndex,
                                                        )}
                                                    ondragleave={handleDragLeave}
                                                    ondrop={(e) =>
                                                        handleDropOnContainer(
                                                            e,
                                                            step.id,
                                                            stepIndex,
                                                        )}
                                                >
                                                    {#each organizeTasks(step.tasks) as task (task.id)}
                                                        {#if editingTask === task.id}
                                                            {@const isDependentTaskEdit =
                                                                task.from_task_id !==
                                                                    null &&
                                                                task.from_task_id !==
                                                                    undefined}
                                                            {@const parentTaskEdit =
                                                                isDependentTaskEdit
                                                                    ? step.tasks.find(
                                                                          (t) =>
                                                                              t.id ===
                                                                              task.from_task_id,
                                                                      )
                                                                    : null}
                                                            {@const calculatedAbsoluteStart =
                                                                (() => {
                                                                    if (
                                                                        isDependentTaskEdit &&
                                                                        parentTaskEdit
                                                                    ) {
                                                                        const parentEndDays =
                                                                            step.start_days_offset +
                                                                            parentTaskEdit.deadline_days;
                                                                        return (
                                                                            parentEndDays +
                                                                            taskStartOffsetDays
                                                                        );
                                                                    }
                                                                    return (
                                                                        step.start_days_offset +
                                                                        taskStartOffsetDays
                                                                    );
                                                                })()}
                                                            {@const calculatedAbsoluteDeadline =
                                                                (() => {
                                                                    if (
                                                                        isDependentTaskEdit &&
                                                                        parentTaskEdit
                                                                    ) {
                                                                        return (
                                                                            calculatedAbsoluteStart +
                                                                            taskDeadlineDays
                                                                        );
                                                                    }
                                                                    return (
                                                                        step.start_days_offset +
                                                                        taskDeadlineDays
                                                                    );
                                                                })()}
                                                            <!-- Edit Task Form -->
                                                            <div
                                                                class="bg-zinc-50 rounded-sm p-3 space-y-2"
                                                            >
                                                                <div
                                                                    class="grid grid-cols-2 gap-2"
                                                                >
                                                                    <div>
                                                                        <label
                                                                            for={`task-name-${task.id}`}
                                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                                            >Taaknaam</label
                                                                        >
                                                                        <div
                                                                            class="relative"
                                                                        >
                                                                            <input
                                                                                id={`task-name-${task.id}`}
                                                                                type="text"
                                                                                bind:value={
                                                                                    taskName
                                                                                }
                                                                                class="w-full px-2 py-1.5 pr-10 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                            />
                                                                            <span
                                                                                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none {taskName.length >
                                                                                40
                                                                                    ? 'text-red-600'
                                                                                    : 'text-zinc-600'}"
                                                                                >{taskName.length}/55</span
                                                                            >
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            for={`task-role-${task.id}`}
                                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                                            >Rol</label
                                                                        >
                                                                        <input
                                                                            id={`task-role-${task.id}`}
                                                                            type="text"
                                                                            bind:value={
                                                                                taskRole
                                                                            }
                                                                            placeholder="Bijv. Manager, HR, etc."
                                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        for={`task-desc-${task.id}`}
                                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                                        >Beschrijving</label
                                                                    >
                                                                    <textarea
                                                                        id={`task-desc-${task.id}`}
                                                                        bind:value={
                                                                            taskDescription
                                                                        }
                                                                        rows="2"
                                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                    ></textarea>
                                                                </div>
                                                                {#if isDependentTaskEdit}
                                                                    <div>
                                                                        <label
                                                                            for={`task-deadline-${task.id}`}
                                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                                            >Duur
                                                                            (dagen)</label
                                                                        >
                                                                        <input
                                                                            id={`task-deadline-${task.id}`}
                                                                            type="number"
                                                                            bind:value={
                                                                                taskDeadlineDays
                                                                            }
                                                                            min="1"
                                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                        />
                                                                    </div>
                                                                {:else}
                                                                    <div
                                                                        class="grid grid-cols-2 gap-2"
                                                                    >
                                                                        <div>
                                                                            <label
                                                                                for={`task-deadline-${task.id}`}
                                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                                >Deadline
                                                                                (dagen)</label
                                                                            >
                                                                            <input
                                                                                id={`task-deadline-${task.id}`}
                                                                                type="number"
                                                                                bind:value={
                                                                                    taskDeadlineDays
                                                                                }
                                                                                min={calculatedAbsoluteStart -
                                                                                    step.start_days_offset}
                                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                {/if}
                                                                {#if isDependentTaskEdit}
                                                                    {#if taskDeadlineDays < 1}
                                                                        <p
                                                                            class="text-xs text-red-700 mt-1"
                                                                        >
                                                                            ⚠️
                                                                            Duur
                                                                            moet
                                                                            minimaal
                                                                            1
                                                                            dag
                                                                            zijn
                                                                        </p>
                                                                    {:else if calculatedAbsoluteDeadline > completionDays}
                                                                        <p
                                                                            class="text-xs text-yellow-700 mt-1"
                                                                        >
                                                                            ⚠️
                                                                            Deadline
                                                                            op
                                                                            dag {calculatedAbsoluteDeadline}
                                                                            overschrijdt
                                                                            proceslimiet
                                                                            van {completionDays}
                                                                            dagen
                                                                        </p>
                                                                    {/if}
                                                                {:else if taskDeadlineDays < calculatedAbsoluteStart - step.start_days_offset}
                                                                    <p
                                                                        class="text-xs text-red-700 mt-1"
                                                                    >
                                                                        ⚠️
                                                                        Deadline
                                                                        ({taskDeadlineDays}d)
                                                                        moet
                                                                        minimaal
                                                                        gelijk
                                                                        zijn aan
                                                                        de start
                                                                        ({calculatedAbsoluteStart -
                                                                            step.start_days_offset}d
                                                                        vanaf
                                                                        stap
                                                                        start)
                                                                    </p>
                                                                {:else if calculatedAbsoluteDeadline > completionDays}
                                                                    <p
                                                                        class="text-xs text-yellow-700 mt-1"
                                                                    >
                                                                        ⚠️
                                                                        Deadline
                                                                        op dag {calculatedAbsoluteDeadline}
                                                                        overschrijdt
                                                                        proceslimiet
                                                                        van {completionDays}
                                                                        dagen
                                                                    </p>
                                                                {/if}
                                                                <div
                                                                    class="grid grid-cols-2 gap-2"
                                                                >
                                                                    <div>
                                                                        <label
                                                                            for={`task-uren-${task.id}`}
                                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                                            >Uren</label
                                                                        >
                                                                        <input
                                                                            id={`task-uren-${task.id}`}
                                                                            type="number"
                                                                            bind:value={
                                                                                taskUren
                                                                            }
                                                                            min="0"
                                                                            step="0.1"
                                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="flex gap-2"
                                                                >
                                                                    <Button
                                                                        size="sm"
                                                                        onclick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            updateTask(
                                                                                task.id,
                                                                            );
                                                                        }}
                                                                        disabled={loadingSteps}
                                                                    >
                                                                        Opslaan
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onclick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            editingTask =
                                                                                null;
                                                                            resetTaskForm();
                                                                        }}
                                                                    >
                                                                        Annuleren
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        {:else}
                                                            <!-- Task Display -->
                                                            {@const taskDates =
                                                                calculateTaskDates(
                                                                    step,
                                                                    task,
                                                                )}
                                                            {@const isDependentTask =
                                                                task.from_task_id !==
                                                                    null &&
                                                                task.from_task_id !==
                                                                    undefined}
                                                            {@const parentTask =
                                                                isDependentTask
                                                                    ? step.tasks.find(
                                                                          (t) =>
                                                                              t.id ===
                                                                              task.from_task_id,
                                                                      )
                                                                    : null}
                                                            {@const isParentTask =
                                                                step.tasks.some(
                                                                    (t) =>
                                                                        t.from_task_id ===
                                                                        task.id,
                                                                )}
                                                            {@const exceedsStepDeadline =
                                                                taskExceedsStepDeadline(
                                                                    step,
                                                                    task,
                                                                )}
                                                            {@const exceedsCompletionDays =
                                                                taskExceedsCompletionDays(
                                                                    step,
                                                                    task,
                                                                )}
                                                            {@const absoluteDeadline =
                                                                getTaskAbsoluteDeadlineDay(
                                                                    step,
                                                                    task,
                                                                )}
                                                            {@const stepDeadline =
                                                                getStepDeadlineDay(
                                                                    step,
                                                                )}
                                                            {@const taskIndex =
                                                                task.step_order ??
                                                                task.order_index}
                                                            {@const displayStartOffset =
                                                                isDependentTask &&
                                                                parentTask
                                                                    ? step.start_days_offset +
                                                                      parentTask.deadline_days +
                                                                      (task.start_offset_days ||
                                                                          0) -
                                                                      step.start_days_offset
                                                                    : task.start_offset_days ||
                                                                      0}
                                                            {@const taskDuration =
                                                                getTaskDuration(
                                                                    step,
                                                                    task,
                                                                )}
                                                            <div
                                                                data-task-id={task.id}
                                                                class:dragging={isDragging}
                                                                class="rounded-sm px-4 py-2 flex justify-between items-start overflow-visible relative {isDependentTask
                                                                    ? 'ml-6 border-l-2 border-zinc-300'
                                                                    : ''} {isParentTask
                                                                    ? 'border'
                                                                    : ''} {exceedsCompletionDays
                                                                    ? 'bg-yellow-50 border-yellow-300 border-2'
                                                                    : exceedsStepDeadline
                                                                      ? 'bg-orange-50 border-orange-300 border-2'
                                                                      : 'bg-zinc-50'}"
                                                                style={isParentTask &&
                                                                !exceedsCompletionDays &&
                                                                !exceedsStepDeadline
                                                                    ? "border-color: #D3D3D3; border-width: 1px;"
                                                                    : ""}
                                                                draggable="true"
                                                                ondragstart={(
                                                                    e,
                                                                ) =>
                                                                    handleDragStart(
                                                                        e,
                                                                        task.id,
                                                                        step.id,
                                                                        taskIndex,
                                                                    )}
                                                                ondragend={handleDragEnd}
                                                                ondragover={(
                                                                    e,
                                                                ) =>
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
                                                                <div
                                                                    class="flex-1"
                                                                >
                                                                    <div
                                                                        class="text-sm font-medium text-zinc-900 flex items-center gap-2 flex-wrap"
                                                                    >
                                                                        <span
                                                                            >{task.name}</span
                                                                        >
                                                                        {#if isDependentTask}
                                                                            <span
                                                                                class="text-zinc-500 text-xs font-normal"
                                                                                >→</span
                                                                            >
                                                                            {#if parentTask}
                                                                                <span
                                                                                    class="text-xs text-zinc-500 font-normal italic"
                                                                                    >(na:
                                                                                    {parentTask.name})</span
                                                                                >
                                                                            {/if}
                                                                        {/if}
                                                                        {#if exceedsStepDeadline}
                                                                            <span
                                                                                class="text-xs text-orange-700 font-medium bg-orange-100 px-2 py-0.5 rounded"
                                                                                >⚠️
                                                                                Overschrijdt
                                                                                stapdeadline</span
                                                                            >
                                                                        {/if}
                                                                        {#if exceedsCompletionDays}
                                                                            <span
                                                                                class="text-xs text-yellow-700 font-medium bg-yellow-100 px-2 py-0.5 rounded"
                                                                                >⚠️
                                                                                Overschrijdt
                                                                                proceslimiet</span
                                                                            >
                                                                        {/if}
                                                                    </div>
                                                                    {#if task.description}
                                                                        <p
                                                                            class="text-xs text-zinc-600 mt-0.5"
                                                                        >
                                                                            {task.description}
                                                                        </p>
                                                                    {/if}
                                                                    <div
                                                                        class="text-xs mt-1 flex gap-3 flex-wrap"
                                                                    >
                                                                        {#if displayStartOffset > 0 || (isDependentTask && displayStartOffset === 0)}
                                                                            <span
                                                                                class={exceedsCompletionDays
                                                                                    ? "text-yellow-700"
                                                                                    : exceedsStepDeadline
                                                                                      ? "text-orange-700"
                                                                                      : "text-zinc-500"}
                                                                                >Start:
                                                                                +{displayStartOffset}d,
                                                                                Duur:
                                                                                {taskDuration}d</span
                                                                            >
                                                                        {:else if task.start_offset_days > 0}
                                                                            <span
                                                                                class={exceedsCompletionDays
                                                                                    ? "text-yellow-700"
                                                                                    : exceedsStepDeadline
                                                                                      ? "text-orange-700"
                                                                                      : "text-zinc-500"}
                                                                                >Start:
                                                                                +{task.start_offset_days}d,
                                                                                Duur:
                                                                                {taskDuration}d</span
                                                                            >
                                                                        {:else}
                                                                            <span
                                                                                class={exceedsCompletionDays
                                                                                    ? "text-yellow-700"
                                                                                    : exceedsStepDeadline
                                                                                      ? "text-orange-700"
                                                                                      : "text-zinc-500"}
                                                                                >Duur:
                                                                                {taskDuration}d</span
                                                                            >
                                                                        {/if}
                                                                        <span
                                                                            class={exceedsCompletionDays
                                                                                ? "text-yellow-700"
                                                                                : exceedsStepDeadline
                                                                                  ? "text-orange-700"
                                                                                  : "text-zinc-500"}
                                                                            >•</span
                                                                        >
                                                                        <span
                                                                            class={exceedsCompletionDays
                                                                                ? "text-yellow-700"
                                                                                : exceedsStepDeadline
                                                                                  ? "text-orange-700"
                                                                                  : "text-zinc-500"}
                                                                            >{taskDates.startDate}
                                                                            - {taskDates.endDate}</span
                                                                        >
                                                                        {#if exceedsStepDeadline}
                                                                            <span
                                                                                class="text-orange-700"
                                                                                >•</span
                                                                            >
                                                                            <span
                                                                                class="text-orange-700 font-medium"
                                                                                >Deadline:
                                                                                dag
                                                                                {absoluteDeadline}
                                                                                (staplimiet:
                                                                                {stepDeadline}d)</span
                                                                            >
                                                                        {/if}
                                                                        {#if exceedsCompletionDays}
                                                                            <span
                                                                                class="text-yellow-700"
                                                                                >•</span
                                                                            >
                                                                            <span
                                                                                class="text-yellow-700 font-medium"
                                                                                >Deadline:
                                                                                dag
                                                                                {absoluteDeadline}
                                                                                (proceslimiet:
                                                                                {completionDays}d)</span
                                                                            >
                                                                        {/if}
                                                                        {#if task.uren !== null && task.uren !== undefined}
                                                                            <span
                                                                                class={exceedsCompletionDays
                                                                                    ? "text-yellow-700"
                                                                                    : exceedsStepDeadline
                                                                                      ? "text-orange-700"
                                                                                      : "text-zinc-500"}
                                                                                >•</span
                                                                            >
                                                                            <span
                                                                                class={exceedsCompletionDays
                                                                                    ? "text-yellow-700"
                                                                                    : exceedsStepDeadline
                                                                                      ? "text-orange-700"
                                                                                      : "text-zinc-500"}
                                                                                >{task.uren}
                                                                                uur</span
                                                                            >
                                                                        {/if}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="flex gap-1"
                                                                >
                                                                    <IconButton
                                                                        icon={Pencil}
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        tooltip="Taak bewerken"
                                                                        tooltipPosition="left"
                                                                        onclick={() =>
                                                                            startEditTask(
                                                                                task,
                                                                            )}
                                                                        disabled={loadingSteps}
                                                                    />
                                                                    <IconButton
                                                                        icon={Trash2}
                                                                        size="sm"
                                                                        variant="danger"
                                                                        tooltip="Taak verwijderen"
                                                                        tooltipPosition="left"
                                                                        onclick={() =>
                                                                            openDeleteTaskModal(
                                                                                task.id,
                                                                            )}
                                                                        disabled={loadingSteps}
                                                                    />
                                                                </div>
                                                                {#if showAddTask !== step.id && (showAddTaskFromPrevious?.stepId !== step.id || showAddTaskFromPrevious?.fromTaskId !== task.id)}
                                                                    <button
                                                                        type="button"
                                                                        onclick={() =>
                                                                            startAddTaskFromPrevious(
                                                                                step.id,
                                                                                task.id,
                                                                            )}
                                                                        class="absolute bottom-2 right-2 group text-xs text-orange-600 hover:text-zinc-900 transition-colors whitespace-nowrap"
                                                                    >
                                                                        + Taak
                                                                        vanaf: {task.name}<span
                                                                            class="inline opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                                                            >→</span
                                                                        >
                                                                    </button>
                                                                {/if}
                                                            </div>

                                                            <!-- Show "+ Taak vanaf" button after each task -->
                                                            {#if showAddTaskFromPrevious?.stepId === step.id && showAddTaskFromPrevious?.fromTaskId === task.id}
                                                                <!-- Add Task From Previous Form -->
                                                                {@const parentTask =
                                                                    step.tasks.find(
                                                                        (t) =>
                                                                            t.id ===
                                                                            task.id,
                                                                    )}
                                                                {@const parentEndDays =
                                                                    parentTask
                                                                        ? step.start_days_offset +
                                                                          parentTask.deadline_days
                                                                        : 0}
                                                                {@const childStartDays =
                                                                    parentEndDays +
                                                                    taskStartOffsetDays}
                                                                {@const taskDuration =
                                                                    taskDeadlineDays}
                                                                {@const absoluteDeadline =
                                                                    childStartDays +
                                                                    taskDuration}
                                                                <div
                                                                    class="bg-zinc-50 rounded-sm p-3 space-y-2 border border-zinc-300 mt-2"
                                                                >
                                                                    <div
                                                                        class="text-xs text-zinc-600 mb-2"
                                                                    >
                                                                        Deze
                                                                        taak
                                                                        start
                                                                        na: {task.name}
                                                                    </div>
                                                                    <div
                                                                        class="grid grid-cols-2 gap-2"
                                                                    >
                                                                        <div>
                                                                            <label
                                                                                for={`new-task-name-prev-${task.id}`}
                                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                                >Taaknaam</label
                                                                            >
                                                                            <div
                                                                                class="relative"
                                                                            >
                                                                                <input
                                                                                    id={`new-task-name-prev-${task.id}`}
                                                                                    type="text"
                                                                                    bind:value={
                                                                                        taskName
                                                                                    }
                                                                                    placeholder="Nieuwe taak..."
                                                                                    class="w-full px-2 py-1.5 pr-10 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                                />
                                                                                <span
                                                                                    class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none {taskName.length >
                                                                                    40
                                                                                        ? 'text-red-600'
                                                                                        : 'text-zinc-600'}"
                                                                                    >{taskName.length}/55</span
                                                                                >
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label
                                                                                for={`new-task-role-prev-${task.id}`}
                                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                                >Rol</label
                                                                            >
                                                                            <input
                                                                                id={`new-task-role-prev-${task.id}`}
                                                                                type="text"
                                                                                bind:value={
                                                                                    taskRole
                                                                                }
                                                                                placeholder="Bijv. Manager, HR, etc."
                                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            for={`new-task-desc-prev-${task.id}`}
                                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                                            >Beschrijving</label
                                                                        >
                                                                        <textarea
                                                                            id={`new-task-desc-prev-${task.id}`}
                                                                            bind:value={
                                                                                taskDescription
                                                                            }
                                                                            rows="2"
                                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"

                                                                        ></textarea>
                                                                    </div>
                                                                    <div
                                                                        class="grid grid-cols-2 gap-2"
                                                                    >
                                                                        <div>
                                                                            <label
                                                                                for={`new-task-duration-${task.id}`}
                                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                                >Duur
                                                                                (dagen)</label
                                                                            >
                                                                            <input
                                                                                id={`new-task-duration-${task.id}`}
                                                                                type="number"
                                                                                value={taskDuration}
                                                                                oninput={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateTaskDeadlineFromDuration(
                                                                                        Number(
                                                                                            (
                                                                                                e.target as HTMLInputElement
                                                                                            )
                                                                                                .value,
                                                                                        ),
                                                                                    )}
                                                                                min="1"
                                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label
                                                                                for={`new-task-uren-prev-${task.id}`}
                                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                                >Uren</label
                                                                            >
                                                                            <input
                                                                                id={`new-task-uren-prev-${task.id}`}
                                                                                type="number"
                                                                                bind:value={
                                                                                    taskUren
                                                                                }
                                                                                min="0"
                                                                                step="0.1"
                                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="text-xs text-zinc-500"
                                                                    >
                                                                        Start:
                                                                        dag {childStartDays},
                                                                        Einde:
                                                                        dag {absoluteDeadline}
                                                                    </div>
                                                                    {#if absoluteDeadline > completionDays}
                                                                        <div
                                                                            class="p-2 bg-yellow-50 border border-yellow-200 rounded-sm text-xs text-yellow-700"
                                                                        >
                                                                            ⚠️
                                                                            Deadline
                                                                            op
                                                                            dag {absoluteDeadline}
                                                                            overschrijdt
                                                                            proceslimiet
                                                                            van {completionDays}
                                                                            dagen
                                                                        </div>
                                                                    {/if}
                                                                    <div
                                                                        class="flex gap-2"
                                                                    >
                                                                        <Button
                                                                            size="sm"
                                                                            onclick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                addTask(
                                                                                    step.id,
                                                                                );
                                                                            }}
                                                                            disabled={loadingSteps}
                                                                        >
                                                                            Taak
                                                                            vanaf:
                                                                            {task.name}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            onclick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                showAddTaskFromPrevious =
                                                                                    null;
                                                                                resetTaskForm();
                                                                            }}
                                                                        >
                                                                            Annuleren
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            {/if}
                                                        {/if}
                                                    {/each}

                                                    <!-- Add Task Form -->
                                                    {#if showAddTask === step.id}
                                                        {@const absoluteDeadline =
                                                            step.start_days_offset +
                                                            taskDeadlineDays}
                                                        <div
                                                            class="bg-zinc-50 rounded-sm p-3 space-y-2 border border-zinc-300"
                                                        >
                                                            <div
                                                                class="grid grid-cols-2 gap-2"
                                                            >
                                                                <div>
                                                                    <label
                                                                        for={`new-task-name-${step.id}`}
                                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                                        >Taaknaam</label
                                                                    >
                                                                    <div
                                                                        class="relative"
                                                                    >
                                                                        <input
                                                                            id={`new-task-name-${step.id}`}
                                                                            type="text"
                                                                            bind:value={
                                                                                taskName
                                                                            }
                                                                            placeholder="Nieuwe taak..."
                                                                            class="w-full px-2 py-1.5 pr-10 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                        />
                                                                        <span
                                                                            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-600 pointer-events-none"
                                                                            >{taskName.length}/55</span
                                                                        >
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        for={`new-task-role-${step.id}`}
                                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                                        >Rol</label
                                                                    >
                                                                    <input
                                                                        id={`new-task-role-${step.id}`}
                                                                        type="text"
                                                                        bind:value={
                                                                            taskRole
                                                                        }
                                                                        placeholder="Bijv. Manager, HR, etc."
                                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label
                                                                    for={`new-task-desc-${step.id}`}
                                                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                                                    >Beschrijving</label
                                                                >
                                                                <textarea
                                                                    id={`new-task-desc-${step.id}`}
                                                                    bind:value={
                                                                        taskDescription
                                                                    }
                                                                    rows="2"
                                                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                ></textarea>
                                                            </div>
                                                            <div
                                                                class="grid grid-cols-2 gap-2"
                                                            >
                                                                <div>
                                                                    <label
                                                                        for={`new-task-deadline-${step.id}`}
                                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                                        >Deadline
                                                                        (dagen)</label
                                                                    >
                                                                    <input
                                                                        id={`new-task-deadline-${step.id}`}
                                                                        type="number"
                                                                        bind:value={
                                                                            taskDeadlineDays
                                                                        }
                                                                        min="1"
                                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                    />
                                                                    {#if absoluteDeadline > completionDays}
                                                                        <p
                                                                            class="text-xs text-yellow-700 mt-1"
                                                                        >
                                                                            ⚠️
                                                                            Deadline
                                                                            op
                                                                            dag {absoluteDeadline}
                                                                            overschrijdt
                                                                            proceslimiet
                                                                            van {completionDays}
                                                                            dagen
                                                                        </p>
                                                                    {/if}
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        for={`new-task-uren-${step.id}`}
                                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                                        >Uren</label
                                                                    >
                                                                    <input
                                                                        id={`new-task-uren-${step.id}`}
                                                                        type="number"
                                                                        bind:value={
                                                                            taskUren
                                                                        }
                                                                        min="0"
                                                                        step="0.1"
                                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="flex gap-2"
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    onclick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        addTask(
                                                                            step.id,
                                                                        );
                                                                    }}
                                                                    disabled={loadingSteps}
                                                                >
                                                                    Nieuwe taak
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onclick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        showAddTask =
                                                                            null;
                                                                        resetTaskForm();
                                                                    }}
                                                                >
                                                                    Annuleren
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    {:else}
                                                        <div class="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onclick={() => {
                                                                    showAddTask =
                                                                        step.id;
                                                                    showAddTaskFromPrevious =
                                                                        null;
                                                                }}
                                                                class="group text-xs text-orange-600 hover:text-zinc-900 py-1 transition-colors"
                                                            >
                                                                + Nieuwe taak<span
                                                                    class="inline opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                                                    >→</span
                                                                >
                                                            </button>
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>

                                        <!-- Insert Step Button (after each step) -->
                                        {#if showAddStepAfterIndex !== stepIndex && !showAddStep}
                                            <div
                                                class="mt-2 flex justify-center"
                                            >
                                                <button
                                                    type="button"
                                                    onclick={async () => {
                                                        showAddStepAfterIndex =
                                                            stepIndex;
                                                        showAddStep = true;
                                                        resetStepForm();
                                                        // Force DOM update
                                                        await tick();
                                                    }}
                                                    class="text-xs text-zinc-500 hover:text-zinc-900 py-2 px-3 border border-dashed border-zinc-300 rounded-sm hover:border-zinc-400 transition-colors"
                                                >
                                                    + Stap hier toevoegen
                                                </button>
                                            </div>
                                        {/if}

                                        <!-- Add Step Form (show after this step if inserting here) -->
                                        {#if showAddStep && showAddStepAfterIndex === stepIndex}
                                            {@const insertAfterIndex =
                                                showAddStepAfterIndex}
                                            {@const previousStep =
                                                insertAfterIndex !== null
                                                    ? steps[insertAfterIndex]
                                                    : steps.length > 0
                                                      ? steps[steps.length - 1]
                                                      : null}
                                            {@const previousStepEnd =
                                                previousStep
                                                    ? previousStep.start_days_offset +
                                                      previousStep.completion_days
                                                    : 0}
                                            {@const calculatedStartOffset =
                                                previousStepEnd +
                                                stepStartDaysOffset}
                                            <div
                                                class="bg-white border border-zinc-300 rounded-lg p-4 space-y-3"
                                                data-form-after-step={stepIndex}
                                            >
                                                <form
                                                    onsubmit={(e) => {
                                                        e.preventDefault();
                                                        addStep();
                                                    }}
                                                >
                                                    <h4
                                                        class="text-sm font-semibold text-zinc-900"
                                                    >
                                                        Nieuwe Stap
                                                    </h4>
                                                    <div>
                                                        <label
                                                            for="new-step-name-{stepIndex}"
                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                        >
                                                            Stapnaam <span
                                                                class="text-red-500"
                                                                >*</span
                                                            >
                                                        </label>
                                                        <input
                                                            id="new-step-name-{stepIndex}"
                                                            type="text"
                                                            bind:value={
                                                                stepName
                                                            }
                                                            placeholder="Bijv. Documentatie voorbereiden"
                                                            required
                                                            disabled={loadingSteps}
                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            for="new-step-desc-{stepIndex}"
                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                            >Beschrijving</label
                                                        >
                                                        <textarea
                                                            id="new-step-desc-{stepIndex}"
                                                            bind:value={
                                                                stepDescription
                                                            }
                                                            rows="2"
                                                            disabled={loadingSteps}
                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                        ></textarea>
                                                    </div>
                                                    <div
                                                        class="grid grid-cols-3 gap-3"
                                                    >
                                                        <div>
                                                            <label
                                                                for="new-step-calculated-{stepIndex}"
                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                >Start vanaf
                                                                proces (dagen)</label
                                                            >
                                                            <input
                                                                id="new-step-calculated-{stepIndex}"
                                                                type="number"
                                                                value={calculatedStartOffset}
                                                                disabled
                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm bg-zinc-100 text-zinc-600 cursor-not-allowed"
                                                                title="Berekend: vorige stap eindigt op dag {previousStepEnd}, start na +{stepStartDaysOffset} dagen"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label
                                                                for="new-step-start-{stepIndex}"
                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                >Start na
                                                                (dagen)</label
                                                            >
                                                            <input
                                                                id="new-step-start-{stepIndex}"
                                                                type="number"
                                                                bind:value={
                                                                    stepStartDaysOffset
                                                                }
                                                                disabled={loadingSteps}
                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                                placeholder="0"
                                                                title="Aantal dagen na vorige stap (gebruik negatief om eerder te starten)"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label
                                                                for="new-step-completion-{stepIndex}"
                                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                                >Voltooiing
                                                                (dagen)</label
                                                            >
                                                            <input
                                                                id="new-step-completion-{stepIndex}"
                                                                type="number"
                                                                bind:value={
                                                                    stepCompletionDays
                                                                }
                                                                min="1"
                                                                required
                                                                disabled={loadingSteps}
                                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                            />
                                                        </div>
                                                    </div>
                                                    {#if previousStep}
                                                        <div
                                                            class="text-xs text-zinc-600 bg-blue-50 border border-blue-200 rounded-sm p-2 mt-3 mb-3"
                                                        >
                                                            <strong>Tip:</strong
                                                            >
                                                            {insertAfterIndex !==
                                                            null
                                                                ? "De stap hierboven"
                                                                : "De vorige stap"}
                                                            eindigt op dag {previousStepEnd}.
                                                            {#if stepStartDaysOffset >= 0}
                                                                Deze stap start {stepStartDaysOffset}
                                                                {stepStartDaysOffset ===
                                                                1
                                                                    ? "dag"
                                                                    : "dagen"} later
                                                                op dag {calculatedStartOffset}.
                                                            {:else}
                                                                Deze stap start {Math.abs(
                                                                    stepStartDaysOffset,
                                                                )}
                                                                {Math.abs(
                                                                    stepStartDaysOffset,
                                                                ) === 1
                                                                    ? "dag"
                                                                    : "dagen"} eerder
                                                                op dag {calculatedStartOffset}
                                                                (parallel met vorige
                                                                stap).
                                                            {/if}
                                                        </div>
                                                    {/if}
                                                    <div class="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            type="submit"
                                                            disabled={loadingSteps}
                                                        >
                                                            {loadingSteps
                                                                ? "Toevoegen..."
                                                                : "Stap Toevoegen"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            type="button"
                                                            onclick={(e) => {
                                                                e.stopPropagation();
                                                                showAddStep = false;
                                                                showAddStepAfterIndex =
                                                                    null;
                                                                resetStepForm();
                                                            }}
                                                            disabled={loadingSteps}
                                                        >
                                                            Annuleren
                                                        </Button>
                                                    </div>
                                                </form>
                                            </div>
                                        {/if}
                                    {/each}

                                    <!-- Add Step Form (at the end if not inserting between steps) -->
                                    {#if showAddStep && showAddStepAfterIndex === null}
                                        {@const insertAfterIndex = null}
                                        {@const previousStep =
                                            steps.length > 0
                                                ? steps[steps.length - 1]
                                                : null}
                                        {@const previousStepEnd = previousStep
                                            ? previousStep.start_days_offset +
                                              previousStep.completion_days
                                            : 0}
                                        {@const calculatedStartOffset =
                                            previousStepEnd +
                                            stepStartDaysOffset}
                                        <form
                                            onsubmit={(e) => {
                                                e.preventDefault();
                                                addStep();
                                            }}
                                            class="bg-white border border-zinc-300 rounded-lg p-4 space-y-3"
                                        >
                                            <h4
                                                class="text-sm font-semibold text-zinc-900"
                                            >
                                                Nieuwe Stap
                                            </h4>
                                            <div>
                                                <label
                                                    for="new-step-name-end"
                                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                                >
                                                    Stapnaam <span
                                                        class="text-red-500"
                                                        >*</span
                                                    >
                                                </label>
                                                <input
                                                    id="new-step-name-end"
                                                    type="text"
                                                    bind:value={stepName}
                                                    placeholder="Bijv. Documentatie voorbereiden"
                                                    required
                                                    disabled={loadingSteps}
                                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    for="new-step-desc-end"
                                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                                    >Beschrijving</label
                                                >
                                                <textarea
                                                    id="new-step-desc-end"
                                                    bind:value={stepDescription}
                                                    rows="2"
                                                    disabled={loadingSteps}
                                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                ></textarea>
                                            </div>
                                            <div class="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label
                                                        for="new-step-calculated-end"
                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                        >Start vanaf proces
                                                        (dagen)</label
                                                    >
                                                    <input
                                                        id="new-step-calculated-end"
                                                        type="number"
                                                        value={calculatedStartOffset}
                                                        disabled
                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm bg-zinc-100 text-zinc-600 cursor-not-allowed"
                                                        title="Berekend: vorige stap eindigt op dag {previousStepEnd}, start na +{stepStartDaysOffset} dagen"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        for="new-step-start-end"
                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                        >Start na (dagen)</label
                                                    >
                                                    <input
                                                        id="new-step-start-end"
                                                        type="number"
                                                        bind:value={
                                                            stepStartDaysOffset
                                                        }
                                                        disabled={loadingSteps}
                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                        placeholder="0"
                                                        title="Aantal dagen na vorige stap (gebruik negatief om eerder te starten)"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        for="new-step-completion-end"
                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                        >Voltooiing (dagen)</label
                                                    >
                                                    <input
                                                        id="new-step-completion-end"
                                                        type="number"
                                                        bind:value={
                                                            stepCompletionDays
                                                        }
                                                        min="1"
                                                        required
                                                        disabled={loadingSteps}
                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                            {#if previousStep}
                                                <div
                                                    class="text-xs text-zinc-600 bg-blue-50 border border-blue-200 rounded-sm p-2 mt-3 mb-3"
                                                >
                                                    <strong>Tip:</strong> De
                                                    vorige stap eindigt op dag {previousStepEnd}.
                                                    {#if stepStartDaysOffset >= 0}
                                                        Deze stap start {stepStartDaysOffset}
                                                        {stepStartDaysOffset ===
                                                        1
                                                            ? "dag"
                                                            : "dagen"} later op dag
                                                        {calculatedStartOffset}.
                                                    {:else}
                                                        Deze stap start {Math.abs(
                                                            stepStartDaysOffset,
                                                        )}
                                                        {Math.abs(
                                                            stepStartDaysOffset,
                                                        ) === 1
                                                            ? "dag"
                                                            : "dagen"} eerder op dag
                                                        {calculatedStartOffset} (parallel
                                                        met vorige stap).
                                                    {/if}
                                                </div>
                                            {/if}
                                            <div class="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    type="submit"
                                                    disabled={loadingSteps}
                                                >
                                                    {loadingSteps
                                                        ? "Toevoegen..."
                                                        : "Stap Toevoegen"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    type="button"
                                                    onclick={(e) => {
                                                        e.stopPropagation();
                                                        showAddStep = false;
                                                        showAddStepAfterIndex =
                                                            null;
                                                        resetStepForm();
                                                    }}
                                                    disabled={loadingSteps}
                                                >
                                                    Annuleren
                                                </Button>
                                            </div>
                                        </form>
                                    {:else if !showAddStep}
                                        <button
                                            type="button"
                                            onclick={() => {
                                                showAddStepAfterIndex = null;
                                                showAddStep = true;
                                                resetStepForm();
                                            }}
                                            class="w-full py-3 border-2 border-dashed border-zinc-300 rounded-lg text-sm text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                                        >
                                            + Nieuwe Stap Toevoegen
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/snippet}
            </Tabs>
        </div>
    {/if}
</div>

<!-- Delete Step Confirmation Modal -->
<Modal
    bind:open={confirmDeleteStepModalOpen}
    title="Stap verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={loadingSteps}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u het zeker? Dit zal alle taken in deze stap verwijderen.
        </p>
        <p class="text-sm text-zinc-500">
            Deze actie kan niet ongedaan worden gemaakt.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={cancelDeleteStep}
                disabled={loadingSteps}
            >
                Annuleren
            </Button>
            <button
                onclick={confirmDeleteStep}
                disabled={loadingSteps}
                class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loadingSteps ? "Verwijderen..." : "Verwijderen"}
            </button>
        </div>
    </div>
</Modal>

<style>
    /* Grab cursor - inspired by the drag-me example */
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
