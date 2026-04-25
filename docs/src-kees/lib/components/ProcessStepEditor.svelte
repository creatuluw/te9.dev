<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Drawer } from "$lib/components";
    import Button from "$lib/components/Button.svelte";
    import * as processService from "$lib/services/processService";
    import type {
        Process,
        ProcessStep,
        ProcessTask,
    } from "$lib/services/processService";

    /**
     * ProcessStepEditor component props
     *
     * Drawer component for editing process steps and tasks.
     * Opens when URL param `drawer=steps` is present.
     */
    interface Props {
        /**
         * Callback fired when steps/tasks are updated
         * @example
         * ```typescript
         * <ProcessStepEditor
         *   onupdated={() => {
         *     refreshProcess();
         *   }}
         * />
         * ```
         */
        onupdated?: () => void;
    }

    let { onupdated }: Props = $props();

    // Derive state from URL params
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const processIdParam = $derived($page.url.searchParams.get("processId"));

    const isOpen = $derived(drawerParam === "steps");
    const processId = $derived(processIdParam ? Number(processIdParam) : null);

    let process = $state<Process | null>(null);
    let steps = $state<(ProcessStep & { tasks: ProcessTask[] })[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let showAddStep = $state(false);
    let showAddTask = $state<number | null>(null);
    let editingStep = $state<number | null>(null);
    let editingTask = $state<number | null>(null);

    // Step form fields
    let stepName = $state("");
    let stepDescription = $state("");
    let stepStartDaysOffset = $state(0);
    let stepCompletionDays = $state(7);

    // Task form fields
    let taskName = $state("");
    let taskDescription = $state("");
    let taskDeadlineDays = $state(3);
    let taskCriteria = $state("");

    const totalSteps = $derived(steps.length);
    const totalTasks = $derived(
        steps.reduce((sum, step) => sum + step.tasks.length, 0),
    );

    // Load process data when drawer opens
    $effect(() => {
        if (isOpen && processId) {
            loadProcess(processId);
        }
    });

    async function loadProcess(id: number) {
        error = null;
        loading = true;
        try {
            const result = await processService.getProcessById(id);
            if (result.success) {
                process = result.value.process;
                steps = result.value.steps;
            } else {
                error = "Proces niet gevonden";
            }
        } catch (err) {
            console.error("Error loading process:", err);
            error =
                err instanceof Error
                    ? err.message
                    : "Fout bij laden van proces";
        } finally {
            loading = false;
        }
    }

    async function addStep() {
        if (!processId || !stepName.trim()) return;

        const orderIndex = steps.length;
        try {
            await processService.addStepToProcess({
                process_id: processId,
                name: stepName.trim(),
                description: stepDescription.trim() || undefined,
                order_index: orderIndex,
                start_days_offset: stepStartDaysOffset,
                completion_days: stepCompletionDays,
            });
            await loadProcess(processId);
            resetStepForm();
            showAddStep = false;
            onupdated?.();
        } catch (err) {
            console.error("Error adding step:", err);
            error = "Fout bij toevoegen van stap";
        } finally {
        }
    }

    async function updateStep(stepId: number) {
        if (!stepName.trim()) return;
        try {
            await processService.updateStep(stepId, {
                name: stepName.trim(),
                description: stepDescription.trim() || undefined,
                start_days_offset: stepStartDaysOffset,
                completion_days: stepCompletionDays,
            });
            await loadProcess(processId!);
            resetStepForm();
            editingStep = null;
            onupdated?.();
        } catch (err) {
            console.error("Error updating step:", err);
            error = "Fout bij bijwerken van stap";
        } finally {
        }
    }

    async function deleteStep(stepId: number) {
        if (
            !confirm(
                "Weet u het zeker? Dit zal alle taken in deze stap verwijderen.",
            )
        )
            return;
        try {
            await processService.deleteStep(stepId);
            await loadProcess(processId!);
            onupdated?.();
        } catch (err) {
            console.error("Error deleting step:", err);
            error = "Fout bij verwijderen van stap";
        } finally {
        }
    }

    async function addTask(stepId: number) {
        if (!taskName.trim()) return;

        const step = steps.find((s) => s.id === stepId);
        if (!step) return;

        const orderIndex = step.tasks.length;
        try {
            await processService.addTaskToStep({
                step_id: stepId,
                name: taskName.trim(),
                description: taskDescription.trim() || undefined,
                order_index: orderIndex,
                start_offset_days: 0,
                deadline_days: taskDeadlineDays,
                criteria: taskCriteria.trim() || undefined,
            });
            await loadProcess(processId!);
            resetTaskForm();
            showAddTask = null;
            onupdated?.();
        } catch (err) {
            console.error("Error adding task:", err);
            error = "Fout bij toevoegen van taak";
        } finally {
        }
    }

    async function updateTask(taskId: number) {
        if (!taskName.trim()) return;
        try {
            await processService.updateTask(taskId, {
                name: taskName.trim(),
                description: taskDescription.trim() || undefined,
                deadline_days: taskDeadlineDays,
                criteria: taskCriteria.trim() || undefined,
            });
            await loadProcess(processId!);
            resetTaskForm();
            editingTask = null;
            onupdated?.();
        } catch (err) {
            console.error("Error updating task:", err);
            error = "Fout bij bijwerken van taak";
        } finally {
        }
    }

    async function deleteTask(taskId: number) {
        if (!confirm("Weet u zeker dat u deze taak wilt verwijderen?")) return;
        try {
            await processService.deleteTask(taskId);
            await loadProcess(processId!);
            onupdated?.();
        } catch (err) {
            console.error("Error deleting task:", err);
            error = "Fout bij verwijderen van taak";
        } finally {
        }
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
        taskDeadlineDays = task.deadline_days;
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
        taskDeadlineDays = 3;
        taskCriteria = "";
    }

    async function handleClose() {
        resetStepForm();
        resetTaskForm();
        showAddStep = false;
        showAddTask = null;
        editingStep = null;
        editingTask = null;

        // Remove drawer params from URL
        const url = new URL($page.url);
        url.searchParams.delete("drawer");
        url.searchParams.delete("processId");
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
        {#if loading && !process}{:else if error && !process}
            <div
                class="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
            >
                {error}
            </div>
        {:else if process}
            <!-- Header -->
            <div class="mb-6 pb-4 border-b border-zinc-200">
                <h2 class="text-2xl font-bold text-zinc-900 font-aspekta">
                    {process.name}
                </h2>
                <p class="text-sm text-zinc-500 mt-1">
                    Stappen en Taken Beheren
                </p>
                {#if process.description}
                    <p class="text-zinc-600 text-sm mt-2">
                        {process.description}
                    </p>
                {/if}
                <div class="mt-3 flex gap-4 text-xs text-zinc-600">
                    <span
                        ><strong>{totalSteps}</strong> stap{totalSteps !== 1
                            ? "pen"
                            : ""}</span
                    >
                    <span
                        ><strong>{totalTasks}</strong> taak{totalTasks !== 1
                            ? "en"
                            : ""}</span
                    >
                    <span
                        ><strong>{process.completion_days}</strong> dagen voltooiing</span
                    >
                </div>
            </div>

            {#if error && process}
                <div
                    class="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
                >
                    {error}
                </div>
            {/if}

            <!-- Steps List -->
            <div class="flex-1 overflow-y-auto space-y-4">
                {#each steps as step, stepIndex (step.id)}
                    <div class="bg-white border border-zinc-200 rounded-lg p-4">
                        {#if editingStep === step.id}
                            <!-- Edit Step Form -->
                            <div class="space-y-3">
                                <div>
                                    <label
                                        for="edit-step-name"
                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                        >Stapnaam</label
                                    >
                                    <input
                                        id="edit-step-name"
                                        type="text"
                                        bind:value={stepName}
                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="edit-step-description"
                                        class="block text-xs font-medium text-zinc-700 mb-1"
                                        >Beschrijving</label
                                    >
                                    <textarea
                                        id="edit-step-description"
                                        bind:value={stepDescription}
                                        rows="2"
                                        class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                    ></textarea>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label
                                            for="edit-step-start-offset"
                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                            >Start offset (dagen)</label
                                        >
                                        <input
                                            id="edit-step-start-offset"
                                            type="number"
                                            bind:value={stepStartDaysOffset}
                                            min="0"
                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            for="edit-step-completion"
                                            class="block text-xs font-medium text-zinc-700 mb-1"
                                            >Voltooiing (dagen)</label
                                        >
                                        <input
                                            id="edit-step-completion"
                                            type="number"
                                            bind:value={stepCompletionDays}
                                            min="1"
                                            class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                        />
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <Button
                                        size="sm"
                                        onclick={() => updateStep(step.id)}
                                        >Opslaan</Button
                                    >
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onclick={() => {
                                            editingStep = null;
                                            resetStepForm();
                                        }}>Annuleren</Button
                                    >
                                </div>
                            </div>
                        {:else}
                            <!-- Step Display -->
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex-1">
                                    <h3
                                        class="text-base font-semibold text-zinc-900"
                                    >
                                        {stepIndex + 1}. {step.name}
                                    </h3>
                                    {#if step.description}
                                        <p class="text-xs text-zinc-600 mt-1">
                                            {step.description}
                                        </p>
                                    {/if}
                                    <div class="text-xs text-zinc-500 mt-1">
                                        Start: +{step.start_days_offset}d,
                                        Voltooiing: {step.completion_days}d
                                    </div>
                                </div>
                                <div class="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onclick={() => startEditStep(step)}
                                    >
                                        Bewerk
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onclick={() => deleteStep(step.id)}
                                    >
                                        Verwijder
                                    </Button>
                                </div>
                            </div>

                            <!-- Tasks -->
                            <div
                                class="ml-4 space-y-2 border-l-2 border-zinc-200 pl-3"
                            >
                                {#each step.tasks as task (task.id)}
                                    {#if editingTask === task.id}
                                        <!-- Edit Task Form -->
                                        <div
                                            class="bg-zinc-50 rounded-sm p-3 space-y-2"
                                        >
                                            <div>
                                                <label
                                                    for="edit-task-name"
                                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                                    >Taaknaam</label
                                                >
                                                <input
                                                    id="edit-task-name"
                                                    type="text"
                                                    bind:value={taskName}
                                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    for="edit-task-description"
                                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                                    >Beschrijving</label
                                                >
                                                <textarea
                                                    id="edit-task-description"
                                                    bind:value={taskDescription}
                                                    rows="2"
                                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label
                                                    for="edit-task-deadline"
                                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                                    >Deadline (dagen)</label
                                                >
                                                <input
                                                    id="edit-task-deadline"
                                                    type="number"
                                                    bind:value={
                                                        taskDeadlineDays
                                                    }
                                                    min="1"
                                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                                />
                                            </div>
                                            <div class="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onclick={() =>
                                                        updateTask(task.id)}
                                                    >Opslaan</Button
                                                >
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onclick={() => {
                                                        editingTask = null;
                                                        resetTaskForm();
                                                    }}>Annuleren</Button
                                                >
                                            </div>
                                        </div>
                                    {:else}
                                        <!-- Task Display -->
                                        <div
                                            class="bg-zinc-50 rounded-sm p-2 flex justify-between items-start"
                                        >
                                            <div class="flex-1">
                                                <div
                                                    class="text-sm font-medium text-zinc-900"
                                                >
                                                    {task.name}
                                                </div>
                                                {#if task.description}
                                                    <p
                                                        class="text-xs text-zinc-600 mt-0.5"
                                                    >
                                                        {task.description}
                                                    </p>
                                                {/if}
                                                <div
                                                    class="text-xs text-zinc-500 mt-1"
                                                >
                                                    Deadline: {task.deadline_days}d
                                                </div>
                                            </div>
                                            <div class="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onclick={() =>
                                                        startEditTask(task)}
                                                >
                                                    Bewerk
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onclick={() =>
                                                        deleteTask(task.id)}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        </div>
                                    {/if}
                                {/each}

                                <!-- Add Task Form -->
                                {#if showAddTask === step.id}
                                    <div
                                        class="bg-zinc-50 rounded-sm p-3 space-y-2 border border-zinc-300"
                                    >
                                        <div>
                                            <label
                                                for="add-task-name"
                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                >Taaknaam</label
                                            >
                                            <input
                                                id="add-task-name"
                                                type="text"
                                                bind:value={taskName}
                                                placeholder="Nieuwe taak..."
                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                for="add-task-description"
                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                >Beschrijving</label
                                            >
                                            <textarea
                                                id="add-task-description"
                                                bind:value={taskDescription}
                                                rows="2"
                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label
                                                for="add-task-deadline"
                                                class="block text-xs font-medium text-zinc-700 mb-1"
                                                >Deadline (dagen)</label
                                            >
                                            <input
                                                id="add-task-deadline"
                                                type="number"
                                                bind:value={taskDeadlineDays}
                                                min="1"
                                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                            />
                                        </div>
                                        <div class="flex gap-2">
                                            <Button
                                                size="sm"
                                                onclick={() => addTask(step.id)}
                                                >Taak Toevoegen</Button
                                            >
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onclick={() => {
                                                    showAddTask = null;
                                                    resetTaskForm();
                                                }}>Annuleren</Button
                                            >
                                        </div>
                                    </div>
                                {:else}
                                    <button
                                        type="button"
                                        onclick={() => (showAddTask = step.id)}
                                        class="text-xs text-zinc-600 hover:text-zinc-900 py-1"
                                    >
                                        + Taak Toevoegen
                                    </button>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}

                <!-- Add Step Form -->
                {#if showAddStep}
                    <div
                        class="bg-white border border-zinc-300 rounded-lg p-4 space-y-3"
                    >
                        <h4 class="text-sm font-semibold text-zinc-900">
                            Nieuwe Stap
                        </h4>
                        <div>
                            <label
                                for="add-step-name"
                                class="block text-xs font-medium text-zinc-700 mb-1"
                                >Stapnaam</label
                            >
                            <input
                                id="add-step-name"
                                type="text"
                                bind:value={stepName}
                                placeholder="bijv. Documentatie voorbereiden"
                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            />
                        </div>
                        <div>
                            <label
                                for="add-step-description"
                                class="block text-xs font-medium text-zinc-700 mb-1"
                                >Beschrijving</label
                            >
                            <textarea
                                id="add-step-description"
                                bind:value={stepDescription}
                                rows="2"
                                class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            ></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    for="add-step-start-offset"
                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                    >Start offset (dagen)</label
                                >
                                <input
                                    id="add-step-start-offset"
                                    type="number"
                                    bind:value={stepStartDaysOffset}
                                    min="0"
                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                />
                            </div>
                            <div>
                                <label
                                    for="add-step-completion"
                                    class="block text-xs font-medium text-zinc-700 mb-1"
                                    >Voltooiing (dagen)</label
                                >
                                <input
                                    id="add-step-completion"
                                    type="number"
                                    bind:value={stepCompletionDays}
                                    min="1"
                                    class="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                />
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button size="sm" onclick={addStep}
                                >Stap Toevoegen</Button
                            >
                            <Button
                                size="sm"
                                variant="secondary"
                                onclick={() => {
                                    showAddStep = false;
                                    resetStepForm();
                                }}>Annuleren</Button
                            >
                        </div>
                    </div>
                {:else}
                    <button
                        type="button"
                        onclick={() => (showAddStep = true)}
                        class="w-full py-3 border-2 border-dashed border-zinc-300 rounded-lg text-sm text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                        + Nieuwe Stap Toevoegen
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</Drawer>
