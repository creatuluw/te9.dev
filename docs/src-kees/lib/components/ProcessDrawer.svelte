<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Drawer, Tabs, Modal, IconButton } from "$lib/components";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import { Pencil, Trash2 } from "lucide-svelte";
    import * as processService from "$lib/services/processService";
    import type {
        Process,
        ProcessStep,
        ProcessTask,
    } from "$lib/services/processService";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import FileUpload from "./FileUpload.svelte";
    import * as minioService from "$lib/services/minioService";

    /**
     * ProcessDrawer component props
     *
     * Drawer component for creating or editing process templates.
     * Opens when URL param `drawer=process` is present.
     */
    interface Props {
        /**
         * Callback fired when a new process is successfully created
         * @param process - The created process data
         * @example
         * ```typescript
         * <ProcessDrawer
         *   oncreated={(process) => {
         *     refreshProcesses();
         *   }}
         * />
         * ```
         */
        oncreated?: (process: Process) => void;

        /**
         * Callback fired when a process is successfully updated
         * @param process - The updated process data
         * @example
         * ```typescript
         * <ProcessDrawer
         *   onupdated={(process) => {
         *     refreshProcesses();
         *   }}
         * />
         * ```
         */
        onupdated?: (process: Process) => void;
    }

    let { oncreated, onupdated }: Props = $props();

    // Derive state from URL params
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const processIdParam = $derived($page.url.searchParams.get("processId"));
    const tabParam = $derived($page.url.searchParams.get("tab"));

    const isOpen = $derived(drawerParam === "process");
    const processId = $derived(processIdParam ? Number(processIdParam) : null);
    const activeTabFromUrl = $derived(tabParam || "basic");

    let name = $state("");
    let description = $state("");
    let completionDays = $state(30);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let processAttachments = $state<string[]>([]);
    let uploadingFiles = $state(false);

    // Steps and tasks state
    let steps = $state<(ProcessStep & { tasks: ProcessTask[] })[]>([]);
    let loadingSteps = $state(false);
    let errorSteps = $state<string | null>(null);
    let showAddStep = $state(false);
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

    const isEditMode = $derived(processId !== null && processId !== undefined);
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
        const sortedTasks = [...tasks].sort(
            (a, b) => a.order_index - b.order_index,
        );
        const taskMap = new Map<
            number,
            ProcessTask & { children: ProcessTask[]; level: number }
        >();
        const rootTasks: Array<
            ProcessTask & { children: ProcessTask[]; level: number }
        > = [];

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
        const flattened: Array<
            ProcessTask & { children: ProcessTask[]; level: number }
        > = [];
        function traverse(nodes: any[]) {
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
    // For dependent tasks, start_offset_days is stored as absolute from step start (parent's absolute deadline)
    // For non-dependent tasks, start_offset_days is relative to step start
    function getTaskAbsoluteStartDay(
        step: ProcessStep,
        task: ProcessTask,
    ): number {
        if (task.from_task_id) {
            // For dependent tasks, start_offset_days is stored as absolute from step start
            // This is the parent's absolute deadline day, calculated when the task was created
            return task.start_offset_days || 0;
        }
        // Non-dependent task: start_offset_days is relative to step start
        return step.start_days_offset + (task.start_offset_days || 0);
    }

    // Calculate the duration of a task
    function getTaskDuration(step: ProcessStep, task: ProcessTask): number {
        if (task.from_task_id) {
            // For dependent tasks, deadline_days is stored as duration
            return task.deadline_days || 0;
        }
        // For non-dependent tasks, duration = deadline_days - start_offset_days
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

    // Get all tasks that exceed their step deadline
    const tasksExceedingStepDeadline = $derived(
        steps.flatMap((step) =>
            step.tasks
                .filter((task) => taskExceedsStepDeadline(step, task))
                .map((task) => ({
                    step,
                    task,
                    taskAbsoluteDeadline: getTaskAbsoluteDeadlineDay(
                        step,
                        task,
                    ),
                    stepDeadline: getStepDeadlineDay(step),
                })),
        ),
    );

    // Calculate start and end dates for a task within a step (using today as reference)
    function calculateTaskDates(
        step: ProcessStep,
        task: ProcessTask,
    ): { startDate: string; endDate: string } {
        const today = new Date();

        // Use the recursive functions to get absolute start day and duration
        // This correctly handles nested dependencies
        const taskStartDays = getTaskAbsoluteStartDay(step, task);
        const taskDuration = getTaskDuration(step, task);

        const startDate = new Date(today);
        startDate.setDate(today.getDate() + taskStartDays);

        // End date: start + duration (consistent with step date calculation)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + taskDuration);

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        };
    }

    // Define tabs - only show structure tab when editing
    const tabs = $derived(
        isEditMode
            ? [
                  { id: "basic", label: "Basisinformatie" },
                  { id: "structure", label: "Proces stappen" },
                  { id: "help", label: "Uitleg" },
              ]
            : [{ id: "basic", label: "Basisinformatie" }],
    );

    // Track state to prevent infinite loops
    let previousIsOpen = $state(false);
    let previousProcessId = $state<number | null>(null);
    let hasLoadedProcess = $state(false);

    // Load process data when editing - only react to isOpen/processId changes
    $effect(() => {
        const currentIsOpen = isOpen;
        const currentProcessId = processId;

        // Only run when isOpen or processId actually changes
        if (
            currentIsOpen === previousIsOpen &&
            currentProcessId === previousProcessId
        ) {
            return; // Skip if nothing changed
        }

        previousIsOpen = currentIsOpen;
        previousProcessId = currentProcessId;

        if (
            currentIsOpen &&
            isEditMode &&
            currentProcessId &&
            !hasLoadedProcess
        ) {
            hasLoadedProcess = true;
            loadProcess(currentProcessId);
            loadSteps(currentProcessId);
        } else if (currentIsOpen && !isEditMode) {
            // Reset form for create mode
            hasLoadedProcess = false;
            name = "";
            description = "";
            completionDays = 30;
            error = null;
            steps = [];
            processAttachments = [];
            resetStepForm();
            resetTaskForm();
        } else if (!currentIsOpen) {
            // Reset when drawer closes
            hasLoadedProcess = false;
        }
    });

    async function loadProcess(id: number) {
        error = null;
        try {
            const result = await processService.getProcessById(id);
            if (result.success) {
                const data = result.value;
                name = data.process.name;
                description = data.process.description || "";
                completionDays = data.process.completion_days;
                processAttachments = data.process.bijlagen || [];
            } else {
                error = "Fout bij laden van proces";
                hasLoadedProcess = false; // Allow retry on error
            }
        } catch (err) {
            error = "Fout bij laden van proces";
            hasLoadedProcess = false; // Allow retry on error
        }
    }

    async function loadSteps(id: number) {
        loadingSteps = true;
        errorSteps = null;
        try {
            const result = await processService.getProcessById(id);
            if (result.success) {
                const data = result.value;
                steps = data.steps;
            } else {
                errorSteps = "Fout bij laden van stappen";
            }
        } catch (err) {
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
            let process: Process;

            if (isEditMode && processId) {
                const result = await processService.updateProcess(processId, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    completion_days: completionDays,
                    bijlagen: processAttachments,
                } as any);
                if (result.success) {
                    const updatedProcess = result.value[0];
                    if (updatedProcess) {
                        onupdated?.(updatedProcess);
                    }
                } else {
                    error = "Fout bij opslaan van proces";
                    loading = false;
                    return;
                }
            } else {
                const result = await processService.createProcess({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    completion_days: completionDays,
                });
                if (result.success) {
                    process = result.value;
                    processAttachments = process.bijlagen || [];
                    if (oncreated) {
                        await oncreated(process);
                    }

                    // If creating new process and not redirected by callback, update URL to include processId so user can add steps/tasks
                    if (
                        process.id &&
                        $page.url.pathname !== "/processes/" + process.id
                    ) {
                        const url = new URL($page.url);
                        url.searchParams.set("drawer", "process");
                        url.searchParams.set(
                            "processId",
                            process.id.toString(),
                        );
                        await goto(url.pathname + url.search, {
                            noScroll: true,
                        });
                        await loadSteps(process.id);
                    }
                } else {
                    error = "Fout bij opslaan van proces";
                    loading = false;
                    return;
                }
            }

            loading = false;
            // Don't auto-close drawer - let user close it when needed
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Fout bij opslaan van proces";
            loading = false;
        }
    }

    // Step management functions
    async function addStep() {
        if (!processId || !stepName.trim()) return;

        const orderIndex = steps.length;

        // Calculate the actual start offset based on previous step's end
        const previousStepEnd =
            steps.length > 0
                ? steps[steps.length - 1].start_days_offset +
                  steps[steps.length - 1].completion_days
                : 0;
        const calculatedStartOffset = previousStepEnd + stepStartDaysOffset;

        loadingSteps = true;
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
                await loadSteps(processId);
                resetStepForm();
                showAddStep = false;
                const processResult =
                    await processService.getProcessById(processId);
                if (processResult.success) {
                    onupdated?.(processResult.value.process);
                }
            } else {
                errorSteps = "Fout bij toevoegen van stap";
            }
        } catch (err) {
            errorSteps = "Fout bij toevoegen van stap";
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
                await loadSteps(processId!);
                resetStepForm();
                editingStep = null;
                const processResult = await processService.getProcessById(
                    processId!,
                );
                if (processResult.success) {
                    onupdated?.(processResult.value.process);
                }
            } else {
                errorSteps = "Fout bij bijwerken van stap";
            }
        } catch (err) {
            errorSteps = "Fout bij bijwerken van stap";
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
                await loadSteps(processId!);
                const processResult = await processService.getProcessById(
                    processId!,
                );
                if (processResult.success) {
                    onupdated?.(processResult.value.process);
                }
                toastStore.add("Stap succesvol verwijderd", "success");
            } else {
                toastStore.add("Fout bij verwijderen van stap", "error");
                errorSteps = "Fout bij verwijderen van stap";
            }
        } catch (err) {
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
        if (!taskName.trim()) return;

        const step = steps.find((s) => s.id === stepId);
        if (!step) return;

        // Determine if this is a dependent task
        const isFromPrevious =
            showAddTaskFromPrevious !== null &&
            showAddTaskFromPrevious.stepId === stepId;
        const fromTaskId = isFromPrevious
            ? showAddTaskFromPrevious!.fromTaskId
            : undefined;

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
                // For dependent tasks, start_offset_days is stored as absolute from step start
                // This is the parent's absolute deadline + any additional offset (currently always 0 for display)
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
        try {
            const result = await processService.addTaskToStep({
                step_id: stepId,
                name: taskName.trim(),
                description: taskDescription.trim() || undefined,
                role: taskRole.trim() || undefined,
                order_index: orderIndex,
                start_offset_days: calculatedStartOffsetDays,
                deadline_days: calculatedDeadlineDays,
                from_task_id: fromTaskId,
                uren: taskUren ?? undefined,
                criteria: taskCriteria.trim() || undefined,
                links: [],
            });
            if (result.success) {
                await loadSteps(processId!);
                resetTaskForm();
                showAddTask = null;
                showAddTaskFromPrevious = null;
                const processResult = await processService.getProcessById(
                    processId!,
                );
                if (processResult.success) {
                    onupdated?.(processResult.value.process);
                }
            } else {
                errorSteps = "Fout bij toevoegen van taak";
            }
        } catch (err) {
            errorSteps = "Fout bij toevoegen van taak";
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
                // Calculate parent's absolute deadline day (from step start)
                const parentAbsoluteDeadline = getTaskAbsoluteDeadlineDay(
                    step,
                    parentTask,
                );
                // For dependent tasks, start_offset_days is stored as absolute from step start
                // This is the parent's absolute deadline + any additional offset (currently always 0 for display)
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
            const result = await processService.updateTask(taskId, {
                name: taskName.trim(),
                description: taskDescription.trim() || undefined,
                role: taskRole.trim() || undefined,
                start_offset_days: calculatedStartOffsetDays,
                deadline_days: calculatedDeadlineDays,
                uren: taskUren ?? undefined,
                criteria: taskCriteria.trim() || undefined,
            });
            if (result.success) {
                await loadSteps(processId!);
                resetTaskForm();
                editingTask = null;
                const processResult = await processService.getProcessById(
                    processId!,
                );
                if (processResult.success) {
                    onupdated?.(processResult.value.process);
                }
            } else {
                errorSteps = "Fout bij bijwerken van taak";
            }
        } catch (err) {
            errorSteps = "Fout bij bijwerken van taak";
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
                await loadSteps(processId!);
                const processResult = await processService.getProcessById(
                    processId!,
                );
                if (processResult.success) {
                    onupdated?.(processResult.value.process);
                }
                toastStore.add("Taak succesvol verwijderd", "success");
            } else {
                toastStore.add("Fout bij verwijderen van taak", "error");
                errorSteps = "Fout bij verwijderen van taak";
            }
        } catch (err) {
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
        // deadline_days = duration (already stored correctly)
        if (task.from_task_id) {
            // For dependent tasks, always set start offset to 0 (field is hidden, value not editable)
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

        // Find the parent task
        const parentTask = step.tasks.find((t) => t.id === fromTaskId);
        if (!parentTask) return;

        // For dependent tasks:
        // - start_offset_days = offset from parent end (default 0)
        // - deadline_days = duration (default 3 days)

        // Reset form and set default values for dependent task
        resetTaskForm();
        taskStartOffsetDays = 0; // Default: start immediately after parent (0 days offset)
        taskDeadlineDays = 3; // Default: 3 day duration
        showAddTaskFromPrevious = { stepId, fromTaskId };
        showAddTask = null;
    }

    function updateTaskDeadlineFromDuration(duration: number) {
        // For dependent tasks: deadline_days is duration, so set it directly
        // For non-dependent tasks: deadline = start_offset + duration
        if (showAddTaskFromPrevious || editingTask) {
            const task = editingTask
                ? steps
                      .flatMap((s) => s.tasks)
                      .find((t) => t.id === editingTask)
                : null;
            if (task?.from_task_id || showAddTaskFromPrevious) {
                // Dependent task: duration is stored directly in deadline_days
                taskDeadlineDays = duration;
            } else {
                // Non-dependent task: deadline = start_offset + duration
                taskDeadlineDays = taskStartOffsetDays + duration;
            }
        } else {
            // Default for non-dependent tasks
            taskDeadlineDays = taskStartOffsetDays + duration;
        }
    }

    async function handleFileUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        uploadingFiles = true;
        const fileArray = Array.from(files);
        const newUrls: string[] = [];

        try {
            // Use MinIO for file uploads
            const folder = processId ? `processes/${processId}` : undefined;

            // Upload each file
            for (const file of fileArray) {
                const result = await minioService.uploadFile(
                    file,
                    folder,
                    processId ?? undefined,
                );
                if (result.success && result.value.url) {
                    newUrls.push(result.value.url);
                } else if (!result.success) {
                    toastStore.add(
                        `Fout bij uploaden van ${file.name}: ${getUserMessage(result.error)}`,
                        "error",
                    );
                }
            }

            if (newUrls.length > 0) {
                processAttachments = [...processAttachments, ...newUrls];

                // Update process with new attachments if process already exists
                if (processId) {
                    const updateResult = await processService.updateProcess(
                        processId,
                        {
                            bijlagen: processAttachments,
                        },
                    );
                    if (updateResult.success) {
                        toastStore.add(
                            `${newUrls.length} bestand(en) geüpload`,
                            "success",
                        );
                    } else {
                        toastStore.add(
                            getUserMessage(updateResult.error),
                            "error",
                        );
                    }
                } else {
                    // For new processes, just add to local state - will be saved when process is created
                    toastStore.add(
                        `${newUrls.length} bestand(en) geüpload`,
                        "success",
                    );
                }
            }
        } catch (error) {
            toastStore.add(
                "Er is een fout opgetreden bij het uploaden",
                "error",
            );
        }

        uploadingFiles = false;
    }

    function removeAttachment(url: string) {
        processAttachments = processAttachments.filter((a) => a !== url);
        // Update process with removed attachment
        if (processId) {
            processService
                .updateProcess(processId, {
                    bijlagen: processAttachments,
                })
                .then((result) => {
                    if (result.success) {
                        toastStore.add("Bestand verwijderd", "success");
                    } else {
                        toastStore.add(getUserMessage(result.error), "error");
                    }
                });
        }
    }

    async function handleClose() {
        resetStepForm();
        resetTaskForm();
        showAddStep = false;
        showAddTask = null;
        showAddTaskFromPrevious = null;
        editingStep = null;
        editingTask = null;

        // Reset modal states
        confirmDeleteStepModalOpen = false;
        confirmDeleteTaskModalOpen = false;
        stepToDelete = null;
        taskToDelete = null;

        // Remove drawer params from URL
        const url = new URL($page.url);
        url.searchParams.delete("drawer");
        url.searchParams.delete("processId");
        url.searchParams.delete("tab");
        await goto(url.pathname + url.search, { noScroll: true });
    }
</script>

<Drawer
    open={isOpen}
    position="right"
    class="w-[95vw] md:w-[66vw]"
    onclose={handleClose}
>
    <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="mb-6 pb-4 border-b border-zinc-200 flex-shrink-0">
            <h2 class="text-2xl font-bold text-zinc-900 font-aspekta">
                {isEditMode
                    ? `Proces Bewerken${name ? `: ${name}` : ""}`
                    : "Nieuw Proces Aanmaken"}
            </h2>
            <p class="text-zinc-600 text-sm mt-2">
                {isEditMode
                    ? "Wijzig de basisinformatie en structuur van dit processjabloon."
                    : "Maak een herbruikbaar processjabloon. Definieer daarna stappen en taken."}
            </p>
        </div>

        <!-- Tabs (only show tabs when editing) -->
        {#if isEditMode && tabs.length > 1}
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
                        {#if activeTab === "basic"}
                            <!-- Basic Info Tab -->
                            <div class="flex-1 flex flex-col min-h-0">
                                <form
                                    id="process-basic-form"
                                    onsubmit={(e) => {
                                        e.preventDefault();
                                        handleSubmit();
                                    }}
                                    class="flex-1 overflow-y-auto pb-6"
                                >
                                    {#if error}
                                        <div
                                            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
                                        >
                                            {error}
                                        </div>
                                    {/if}

                                    {#if loading}{:else}
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

                                            <div
                                                role="group"
                                                aria-label="Bijlagen"
                                            >
                                                <div
                                                    class="block text-sm font-medium text-zinc-900 mb-2"
                                                >
                                                    Bijlagen
                                                </div>
                                                <FileUpload
                                                    variant="drag-drop"
                                                    multiple
                                                    onchange={handleFileUpload}
                                                    disabled={uploadingFiles}
                                                />

                                                {#if processAttachments.length > 0}
                                                    <div class="mt-3 space-y-2">
                                                        {#each processAttachments as url}
                                                            <div
                                                                class="flex items-center justify-between p-2 bg-zinc-50 rounded border border-zinc-200"
                                                            >
                                                                <a
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener"
                                                                    class="text-sm text-zinc-700 hover:text-zinc-900 truncate flex-1"
                                                                >
                                                                    {url
                                                                        .split(
                                                                            "/",
                                                                        )
                                                                        .pop()}
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onclick={() =>
                                                                        removeAttachment(
                                                                            url,
                                                                        )}
                                                                    class="ml-2 text-red-600 hover:text-red-700 text-sm"
                                                                >
                                                                    Verwijderen
                                                                </button>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </form>

                                <!-- Footer Actions for Basic Info (Fixed) -->
                                <div
                                    class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white"
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
                            </div>
                        {:else if activeTab === "help"}
                            <!-- Help/Explanation Tab -->
                            <div class="flex-1 flex flex-col min-h-0">
                                <div
                                    class="flex-1 overflow-y-auto space-y-6 pb-4"
                                >
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
                                                    worden in volgorde uitgevoerd
                                                    en helpen u het proces te organiseren
                                                    in logische delen.
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
                                                            Stap 3: "Evaluatie
                                                            en Afronding"
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div
                                                    class="mt-4 pt-3 border-t border-zinc-200"
                                                >
                                                    <h4
                                                        class="text-xs font-semibold text-zinc-900 mb-2"
                                                    >
                                                        Velden bij het aanmaken
                                                        van een stap:
                                                    </h4>
                                                    <ul
                                                        class="space-y-2 text-xs text-zinc-700"
                                                    >
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Stapnaam:</strong
                                                            > Een korte, duidelijke
                                                            naam voor deze fase
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Beschrijving:</strong
                                                            > Optioneel - uitgebreide
                                                            uitleg van wat deze stap
                                                            inhoudt
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Start na
                                                                (dagen):</strong
                                                            > Het aantal dagen na
                                                            het starten van het proces
                                                            voordat deze stap begint
                                                            (bijv. 0 = direct, 7 =
                                                            na een week)
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Voltooiing
                                                                (dagen):</strong
                                                            > Het aantal dagen dat
                                                            deze stap normaal gesproken
                                                            duurt
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
                                                    > is een specifieke actie die
                                                    binnen een stap moet worden uitgevoerd.
                                                    Taken zijn concrete acties die
                                                    gedaan moeten worden om een stap
                                                    te voltooien.
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
                                                        Binnen de stap "Intake
                                                        en Documentatie" kunt u
                                                        taken hebben zoals:
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
                                                        Velden bij het aanmaken
                                                        van een taak:
                                                    </h4>
                                                    <ul
                                                        class="space-y-2 text-xs text-zinc-700"
                                                    >
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Taaknaam:</strong
                                                            > Een korte, actiegerichte
                                                            naam (bijv. "Contract
                                                            opstellen")
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Beschrijving:</strong
                                                            > Optioneel - gedetailleerde
                                                            instructies over wat er
                                                            moet gebeuren
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Rol:</strong
                                                            > Optioneel - wie verantwoordelijk
                                                            is voor deze taak (bijv.
                                                            "Manager", "HR")
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Deadline
                                                                (dagen):</strong
                                                            > Het aantal dagen na
                                                            het starten van de stap
                                                            dat deze taak voltooid
                                                            moet zijn
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Uren:</strong
                                                            > Optioneel - geschatte
                                                            benodigde tijd voor deze
                                                            taak
                                                        </li>
                                                        <li>
                                                            <strong
                                                                class="text-zinc-900"
                                                                >Criteria:</strong
                                                            > Optioneel - voorwaarden
                                                            waaraan moet worden voldaan
                                                            om de taak als voltooid
                                                            te beschouwen
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
                                                            Ouder-taken hebben
                                                            een border om aan te
                                                            geven dat ze
                                                            afhankelijke taken
                                                            hebben
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div
                                                    class="mt-4 pt-3 border-t border-blue-200 bg-white rounded-sm p-3"
                                                >
                                                    <p
                                                        class="text-xs font-medium text-zinc-900 mb-2"
                                                    >
                                                        Visuele indicatoren:
                                                    </p>
                                                    <ul
                                                        class="space-y-1.5 text-xs text-zinc-700"
                                                    >
                                                        <li
                                                            class="flex items-start gap-2"
                                                        >
                                                            <span
                                                                class="font-semibold text-zinc-900"
                                                                >Border rond
                                                                taak:</span
                                                            >
                                                            <span
                                                                >Deze taak heeft
                                                                één of meer
                                                                afhankelijke
                                                                taken</span
                                                            >
                                                        </li>
                                                        <li
                                                            class="flex items-start gap-2"
                                                        >
                                                            <span
                                                                class="font-semibold text-zinc-900"
                                                                >→ (pijl):</span
                                                            >
                                                            <span
                                                                >Deze taak is
                                                                afhankelijk van
                                                                een andere taak</span
                                                            >
                                                        </li>
                                                        <li
                                                            class="flex items-start gap-2"
                                                        >
                                                            <span
                                                                class="font-semibold text-zinc-900"
                                                                >Indentatie:</span
                                                            >
                                                            <span
                                                                >Afhankelijke
                                                                taken zijn naar
                                                                rechts
                                                                ingesprongen om
                                                                de hiërarchie te
                                                                tonen</span
                                                            >
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div
                                                    class="mt-3 text-xs bg-blue-100 border border-blue-300 rounded-sm p-2"
                                                >
                                                    <p
                                                        class="font-medium text-zinc-900 mb-1"
                                                    >
                                                        💡 Tip:
                                                    </p>
                                                    <p class="text-zinc-700">
                                                        Gebruik afhankelijkheden
                                                        om sequentiële taken te
                                                        modelleren.
                                                        Bijvoorbeeld: "Email
                                                        versturen" → "Checken of
                                                        email gelezen is" →
                                                        "Opvolging indien nodig"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3
                                                class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                            >
                                                Hoe werkt het samen?
                                            </h3>
                                            <div
                                                class="bg-blue-50 border border-blue-200 rounded-lg p-4"
                                            >
                                                <div
                                                    class="space-y-2 text-sm text-zinc-700"
                                                >
                                                    <p class="leading-relaxed">
                                                        Een <strong
                                                            class="text-zinc-900"
                                                            >proces</strong
                                                        >
                                                        bestaat uit één of meerdere
                                                        <strong
                                                            class="text-zinc-900"
                                                            >stappen</strong
                                                        >. Elke stap kan
                                                        meerdere
                                                        <strong
                                                            class="text-zinc-900"
                                                            >taken</strong
                                                        >
                                                        bevatten. Taken kunnen ook
                                                        <strong
                                                            class="text-zinc-900"
                                                            >afhankelijk</strong
                                                        > zijn van andere taken binnen
                                                        dezelfde stap.
                                                    </p>
                                                    <div
                                                        class="mt-3 text-xs bg-white border border-blue-200 rounded-sm p-3"
                                                    >
                                                        <p
                                                            class="font-medium text-zinc-900 mb-1"
                                                        >
                                                            Voorbeeld
                                                            processtructuur:
                                                        </p>
                                                        <div
                                                            class="space-y-1 text-zinc-700 ml-2 font-mono text-xs"
                                                        >
                                                            <p>
                                                                📋 <strong
                                                                    >Proces:</strong
                                                                > Medewerker Onboarding
                                                            </p>
                                                            <p class="ml-4">
                                                                └─ 📍 <strong
                                                                    >Stap 1:</strong
                                                                > Intake (start dag
                                                                0, duurt 5 dagen)
                                                            </p>
                                                            <p class="ml-8">
                                                                ├─ ✓ Taak:
                                                                Contract
                                                                opstellen
                                                                (deadline: 1
                                                                dag)
                                                            </p>
                                                            <p class="ml-12">
                                                                │ └─ → Taak:
                                                                Contract laten
                                                                ondertekenen
                                                                (na: Contract
                                                                opstellen)
                                                            </p>
                                                            <p class="ml-8">
                                                                ├─ ✓ Taak:
                                                                Account aanmaken
                                                                (deadline: 2
                                                                dagen)
                                                            </p>
                                                            <p class="ml-8">
                                                                └─ ✓ Taak:
                                                                Welkomstpakket
                                                                verzenden
                                                                (deadline: 3
                                                                dagen)
                                                            </p>
                                                            <p class="ml-4">
                                                                └─ 📍 <strong
                                                                    >Stap 2:</strong
                                                                > Training (start
                                                                dag 5, duurt 10 dagen)
                                                            </p>
                                                            <p class="ml-8">
                                                                ├─ ✓ Taak:
                                                                Introductiesessie
                                                                plannen
                                                                (deadline: 1
                                                                dag)
                                                            </p>
                                                            <p class="ml-8">
                                                                └─ ✓ Taak:
                                                                Cursusmateriaal
                                                                doorlopen
                                                                (deadline: 7
                                                                dagen)
                                                            </p>
                                                        </div>
                                                        <p
                                                            class="text-xs text-zinc-600 mt-2 italic"
                                                        >
                                                            Let op: Taken met
                                                            een pijl (→) zijn
                                                            afhankelijk van de
                                                            taak erboven.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3
                                                class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                            >
                                                Tips voor het aanmaken
                                            </h3>
                                            <div
                                                class="bg-zinc-50 border border-zinc-200 rounded-lg p-4"
                                            >
                                                <ul
                                                    class="space-y-2 text-sm text-zinc-700"
                                                >
                                                    <li
                                                        class="flex items-start gap-2"
                                                    >
                                                        <span
                                                            class="text-orange-600 font-bold mt-0.5"
                                                            >•</span
                                                        >
                                                        <span
                                                            >Begin met het
                                                            toevoegen van
                                                            stappen in logische
                                                            volgorde</span
                                                        >
                                                    </li>
                                                    <li
                                                        class="flex items-start gap-2"
                                                    >
                                                        <span
                                                            class="text-orange-600 font-bold mt-0.5"
                                                            >•</span
                                                        >
                                                        <span
                                                            >Voeg daarna taken
                                                            toe aan elke stap
                                                            voor concrete acties</span
                                                        >
                                                    </li>
                                                    <li
                                                        class="flex items-start gap-2"
                                                    >
                                                        <span
                                                            class="text-orange-600 font-bold mt-0.5"
                                                            >•</span
                                                        >
                                                        <span
                                                            >Gebruik duidelijke,
                                                            actiegerichte namen
                                                            (bijv. "Document
                                                            uploaden" in plaats
                                                            van "Documentatie")</span
                                                        >
                                                    </li>
                                                    <li
                                                        class="flex items-start gap-2"
                                                    >
                                                        <span
                                                            class="text-orange-600 font-bold mt-0.5"
                                                            >•</span
                                                        >
                                                        <span
                                                            >Houd deadlines
                                                            realistisch - taken
                                                            moeten binnen de
                                                            duur van de stap
                                                            passen</span
                                                        >
                                                    </li>
                                                    <li
                                                        class="flex items-start gap-2"
                                                    >
                                                        <span
                                                            class="text-orange-600 font-bold mt-0.5"
                                                            >•</span
                                                        >
                                                        <span
                                                            >Gebruik <span
                                                                class="text-orange-600 font-medium"
                                                                >"+ Taak vanaf"</span
                                                            > om sequentiële taken
                                                            te maken die na elkaar
                                                            moeten worden uitgevoerd</span
                                                        >
                                                    </li>
                                                    <li
                                                        class="flex items-start gap-2"
                                                    >
                                                        <span
                                                            class="text-orange-600 font-bold mt-0.5"
                                                            >•</span
                                                        >
                                                        <span
                                                            >Let op de visuele
                                                            hiërarchie: taken
                                                            met een border zijn
                                                            ouder-taken,
                                                            ingesprongen taken
                                                            zijn afhankelijk</span
                                                        >
                                                    </li>
                                                    <li
                                                        class="flex items-start gap-2"
                                                    >
                                                        <span
                                                            class="text-orange-600 font-bold mt-0.5"
                                                            >•</span
                                                        >
                                                        <span
                                                            >Plan de volgorde
                                                            van taken zorgvuldig
                                                            - afhankelijke taken
                                                            starten automatisch
                                                            na de deadline van
                                                            hun ouder-taak</span
                                                        >
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div>
                                            <h3
                                                class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                            >
                                                Veelgestelde vragen
                                            </h3>
                                            <div
                                                class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-4"
                                            >
                                                <div>
                                                    <h4
                                                        class="text-sm font-medium text-zinc-900 mb-1"
                                                    >
                                                        Kunnen taken parallel
                                                        worden uitgevoerd?
                                                    </h4>
                                                    <p
                                                        class="text-xs text-zinc-700 text-xs"
                                                    >
                                                        Ja, taken zonder
                                                        afhankelijkheid kunnen
                                                        parallel worden
                                                        uitgevoerd. Alleen taken
                                                        met een "+ Taak vanaf"
                                                        relatie worden
                                                        sequentieel uitgevoerd.
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4
                                                        class="text-sm font-medium text-zinc-900 mb-1"
                                                    >
                                                        Hoe verwijder ik een
                                                        taak met afhankelijke
                                                        taken?
                                                    </h4>
                                                    <p
                                                        class="text-xs text-zinc-700 text-xs"
                                                    >
                                                        Wanneer u een ouder-taak
                                                        verwijdert, worden de
                                                        afhankelijke taken
                                                        automatisch
                                                        onafhankelijk gemaakt
                                                        (ze worden niet
                                                        verwijderd).
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4
                                                        class="text-sm font-medium text-zinc-900 mb-1"
                                                    >
                                                        Kan ik een
                                                        taakafhankelijkheid
                                                        later wijzigen?
                                                    </h4>
                                                    <p
                                                        class="text-xs text-zinc-700 text-xs"
                                                    >
                                                        Ja, u kunt taken
                                                        bewerken en de
                                                        afhankelijkheid wijzigen
                                                        door de taak te
                                                        verwijderen en opnieuw
                                                        aan te maken met "+ Taak
                                                        vanaf" of door de taak
                                                        te bewerken.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {:else if activeTab === "structure"}
                            <!-- Process Structure Tab -->
                            <div class="flex-1 flex flex-col min-h-0">
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
                                                : "hebben"} een deadline die verder
                                            ligt dan de {completionDays} voltooiingsdagen
                                            die in de basisinformatie zijn ingesteld:
                                        </p>
                                        <ul
                                            class="text-xs list-disc list-inside space-y-1"
                                        >
                                            {#each tasksExceedingCompletionDays as { step, task, absoluteDeadline }}
                                                <li>
                                                    <strong>{task.name}</strong>
                                                    (in "{step.name}"): deadline
                                                    op dag {absoluteDeadline},
                                                    maar proces eindigt op dag {completionDays}
                                                </li>
                                            {/each}
                                        </ul>
                                        <p class="text-xs mt-2 italic">
                                            Tip: Pas de voltooiingsdagen aan in
                                            de basisinformatie tab of wijzig de
                                            deadlines van deze taken.
                                        </p>
                                    </div>
                                {/if}

                                {#if loadingSteps && steps.length === 0}{:else}
                                    <div
                                        class="flex-1 overflow-y-auto space-y-4 pb-4"
                                    >
                                        {#each steps as step, stepIndex (step.id)}
                                            <div
                                                class="bg-white border border-zinc-200 rounded-lg p-4 overflow-visible"
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
                                                                    >Start
                                                                    offset
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
                                                                onclick={(
                                                                    e,
                                                                ) => {
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
                                                                onclick={(
                                                                    e,
                                                                ) => {
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
                                                        calculateStepHours(
                                                            step,
                                                        )}
                                                    {@const stepDates =
                                                        calculateStepDates(
                                                            step,
                                                        )}
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
                                                                    <span
                                                                        >•</span
                                                                    >
                                                                    <span
                                                                        class="font-medium text-zinc-700"
                                                                        >{stepHours}
                                                                        uur totaal</span
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
                                                                              (
                                                                                  t,
                                                                              ) =>
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
                                                                            // For dependent tasks: parent ends at step.start + parent.deadline_days
                                                                            // Child starts at: parent end + start_offset_days (offset from parent end)
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
                                                                            // For dependent tasks: deadline input is duration, so absolute deadline = start + duration
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
                                                                            <div
                                                                            >
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
                                                                                dag
                                                                                {calculatedAbsoluteDeadline}
                                                                                overschrijdt
                                                                                proceslimiet
                                                                                van
                                                                                {completionDays}
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
                                                                            zijn
                                                                            aan
                                                                            de
                                                                            start
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
                                                                            op
                                                                            dag {calculatedAbsoluteDeadline}
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
                                                                              (
                                                                                  t,
                                                                              ) =>
                                                                                  t.id ===
                                                                                  task.from_task_id,
                                                                          )
                                                                        : null}
                                                                {@const taskDuration =
                                                                    (() => {
                                                                        if (
                                                                            isDependentTask &&
                                                                            parentTask
                                                                        ) {
                                                                            // For dependent tasks: deadline_days is stored as duration (not absolute)
                                                                            return (
                                                                                task.deadline_days ||
                                                                                0
                                                                            );
                                                                        }
                                                                        // For non-dependent tasks, duration is deadline_days - start_offset_days
                                                                        return Math.max(
                                                                            0,
                                                                            task.deadline_days -
                                                                                (task.start_offset_days ||
                                                                                    0),
                                                                        );
                                                                    })()}
                                                                {@const displayStartOffset =
                                                                    (() => {
                                                                        if (
                                                                            isDependentTask
                                                                        ) {
                                                                            // For dependent tasks: always display 0 (starts from parent end)
                                                                            // The actual start_offset_days value is still used for calculations
                                                                            return 0;
                                                                        }
                                                                        // For non-dependent tasks, show offset from step start
                                                                        return (
                                                                            task.start_offset_days ||
                                                                            0
                                                                        );
                                                                    })()}
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
                                                                <div
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
                                                                                -
                                                                                {taskDates.endDate}</span
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
                                                                            +
                                                                            Taak
                                                                            vanaf:
                                                                            {task.name}<span
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
                                                                            (
                                                                                t,
                                                                            ) =>
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
                                                                            <div
                                                                            >
                                                                                <label
                                                                                    for={`new-task-name-prev-${task.id}`}
                                                                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                                                                    >Taaknaam</label
                                                                                >
                                                                                <input
                                                                                    id={`new-task-name-prev-${task.id}`}
                                                                                    type="text"
                                                                                    bind:value={
                                                                                        taskName
                                                                                    }
                                                                                    placeholder="Nieuwe taak..."
                                                                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                                />
                                                                            </div>
                                                                            <div
                                                                            >
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
                                                                            <div
                                                                            >
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
                                                                            <div
                                                                            >
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
                                                                                dag
                                                                                {absoluteDeadline}
                                                                                overschrijdt
                                                                                proceslimiet
                                                                                van
                                                                                {completionDays}
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
                                                                        <input
                                                                            id={`new-task-name-${step.id}`}
                                                                            type="text"
                                                                            bind:value={
                                                                                taskName
                                                                            }
                                                                            placeholder="Nieuwe taak..."
                                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                                        />
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
                                                                                dag
                                                                                {absoluteDeadline}
                                                                                overschrijdt
                                                                                proceslimiet
                                                                                van
                                                                                {completionDays}
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
                                                                        Nieuwe
                                                                        taak
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
                                                            <div
                                                                class="flex gap-2"
                                                            >
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
                                                                    + Nieuwe
                                                                    taak<span
                                                                        class="inline opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                                                        >→</span
                                                                    >
                                                                </button>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/each}

                                        <!-- Add Step Form -->
                                        {#if showAddStep}
                                            {@const previousStepEnd =
                                                steps.length > 0
                                                    ? steps[steps.length - 1]
                                                          .start_days_offset +
                                                      steps[steps.length - 1]
                                                          .completion_days
                                                    : 0}
                                            {@const calculatedStartOffset =
                                                previousStepEnd +
                                                stepStartDaysOffset}
                                            <div
                                                class="bg-white border border-zinc-300 rounded-lg p-4 space-y-3"
                                            >
                                                <h4
                                                    class="text-sm font-semibold text-zinc-900"
                                                >
                                                    Nieuwe Stap
                                                </h4>
                                                <div>
                                                    <label
                                                        for="new-step-name"
                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                        >Stapnaam</label
                                                    >
                                                    <input
                                                        id="new-step-name"
                                                        type="text"
                                                        bind:value={stepName}
                                                        placeholder="Bijv. Documentatie voorbereiden"
                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        for="new-step-desc"
                                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                                        >Beschrijving</label
                                                    >
                                                    <textarea
                                                        id="new-step-desc"
                                                        bind:value={
                                                            stepDescription
                                                        }
                                                        rows="2"
                                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                    ></textarea>
                                                </div>
                                                <div
                                                    class="grid grid-cols-3 gap-3"
                                                >
                                                    <div>
                                                        <label
                                                            for="new-step-calculated"
                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                            >Start vanaf proces
                                                            (dagen)</label
                                                        >
                                                        <input
                                                            id="new-step-calculated"
                                                            type="number"
                                                            value={calculatedStartOffset}
                                                            disabled
                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm bg-zinc-100 text-zinc-600 cursor-not-allowed"
                                                            title="Berekend: vorige stap eindigt op dag {previousStepEnd}, start na +{stepStartDaysOffset} dagen"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            for="new-step-start"
                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                            >Start na (dagen)</label
                                                        >
                                                        <input
                                                            id="new-step-start"
                                                            type="number"
                                                            bind:value={
                                                                stepStartDaysOffset
                                                            }
                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                            placeholder="0"
                                                            title="Aantal dagen na vorige stap (gebruik negatief om eerder te starten)"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            for="new-step-completion"
                                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                                            >Voltooiing (dagen)</label
                                                        >
                                                        <input
                                                            id="new-step-completion"
                                                            type="number"
                                                            bind:value={
                                                                stepCompletionDays
                                                            }
                                                            min="1"
                                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                        />
                                                    </div>
                                                </div>
                                                {#if steps.length > 0}
                                                    <div
                                                        class="text-xs text-zinc-600 bg-blue-50 border border-blue-200 rounded-sm p-2 mt-3 mb-3"
                                                    >
                                                        <strong>Tip:</strong> De
                                                        vorige stap eindigt op
                                                        dag {previousStepEnd}.
                                                        {#if stepStartDaysOffset >= 0}
                                                            Deze stap start {stepStartDaysOffset}
                                                            {stepStartDaysOffset ===
                                                            1
                                                                ? "dag"
                                                                : "dagen"} later op
                                                            dag {calculatedStartOffset}.
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
                                                            (parallel met vorige stap).
                                                        {/if}
                                                    </div>
                                                {/if}
                                                <div class="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onclick={(e) => {
                                                            e.stopPropagation();
                                                            addStep();
                                                        }}
                                                        disabled={loadingSteps}
                                                    >
                                                        Stap Toevoegen
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onclick={(e) => {
                                                            e.stopPropagation();
                                                            showAddStep = false;
                                                            resetStepForm();
                                                        }}
                                                    >
                                                        Annuleren
                                                    </Button>
                                                </div>
                                            </div>
                                        {:else}
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    (showAddStep = true)}
                                                class="w-full py-3 border-2 border-dashed border-zinc-300 rounded-lg text-sm text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                                            >
                                                + Nieuwe Stap Toevoegen
                                            </button>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/snippet}
            </Tabs>
        {:else}
            <!-- No tabs - just the form (create mode) -->
            <form
                id="process-create-form"
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                class="flex-1 flex flex-col"
            >
                <div class="flex-1 overflow-y-auto pb-6">
                    {#if error}
                        <div
                            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
                        >
                            {error}
                        </div>
                    {/if}

                    <div class="space-y-6">
                        <div>
                            <label
                                for="name"
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Sjabloonnaam <span class="text-red-500">*</span>
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
                                Voltooiingsdagen <span class="text-red-500"
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
                            <p class="text-xs text-zinc-500 mt-1">
                                Het aantal dagen waarbinnen dit proces normaal
                                gesproken voltooid moet worden.
                            </p>
                        </div>

                        <div role="group" aria-label="Bijlagen">
                            <div
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Bijlagen
                            </div>
                            <FileUpload
                                variant="drag-drop"
                                multiple
                                onchange={handleFileUpload}
                                disabled={uploadingFiles}
                            />

                            {#if processAttachments.length > 0}
                                <div class="mt-3 space-y-2">
                                    {#each processAttachments as url}
                                        <div
                                            class="flex items-center justify-between p-2 bg-zinc-50 rounded border border-zinc-200"
                                        >
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener"
                                                class="text-sm text-zinc-700 hover:text-zinc-900 truncate flex-1"
                                            >
                                                {url.split("/").pop()}
                                            </a>
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    removeAttachment(url)}
                                                class="ml-2 text-red-600 hover:text-red-700 text-sm"
                                            >
                                                Verwijderen
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Footer Actions (Fixed) -->
                <div
                    class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white"
                >
                    <div class="flex justify-start gap-3">
                        <Button type="submit" disabled={loading}>
                            {#if loading}
                                <Spinner size="sm" />
                            {:else}
                                Proces Aanmaken
                            {/if}
                        </Button>
                        <Button
                            variant="secondary"
                            type="button"
                            onclick={handleClose}
                            disabled={loading}
                        >
                            Annuleren
                        </Button>
                    </div>
                </div>
            </form>
        {/if}
    </div>
</Drawer>

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

<!-- Delete Task Confirmation Modal -->
<Modal
    bind:open={confirmDeleteTaskModalOpen}
    title="Taak verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={loadingSteps}
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
                onclick={cancelDeleteTask}
                disabled={loadingSteps}
            >
                Annuleren
            </Button>
            <button
                onclick={confirmDeleteTask}
                disabled={loadingSteps}
                class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loadingSteps ? "Verwijderen..." : "Verwijderen"}
            </button>
        </div>
    </div>
</Modal>
