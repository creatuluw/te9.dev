<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Drawer from "./Drawer.svelte";
    import CaseTaskEditForm from "./CaseTaskEditForm.svelte";
    import Spinner from "./Spinner.svelte";
    import * as caseService from "$lib/services/caseService";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { CaseTask } from "$lib/schemas/case";
    import type { Case } from "$lib/schemas/case";
    import type { Process } from "$lib/schemas/process";
    import { getRowByIdResult } from "$lib/utils/postgrest";
    import * as taskAssigneeService from "$lib/services/taskAssigneeService";
    import { requestCache } from "$lib/utils/requestCache";

    /**
     * CaseTaskDrawer component props
     *
     * Drawer component for editing case tasks.
     * Opens when URL param `drawer=casetask` is present.
     */
    interface Props {
        /**
         * Callback when case task is updated
         */
        onsaved?: (caseTask: CaseTask) => void;

        /**
         * Callback when drawer is closed
         */
        onclose?: () => void;
    }

    let { onsaved, onclose }: Props = $props();

    // Derive state from URL params
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const caseTaskIdParam = $derived($page.url.searchParams.get("caseTaskId"));

    const isOpen = $derived(drawerParam === "casetask");
    const caseTaskId = $derived(
        caseTaskIdParam ? Number(caseTaskIdParam) : null,
    );

    // Current case task being edited with related case and process
    let currentCaseTask = $state<CaseTask | null>(null);
    let currentCase = $state<Case | null>(null);
    let currentProcess = $state<Process | null>(null);
    let loadingCaseTask = $state(false);

    // Load case task when caseTaskId changes
    $effect(() => {
        if (isOpen) {
            console.log(
                "[CaseTaskDrawer] Drawer opened, caseTaskId:",
                caseTaskId,
            );
            if (caseTaskId) {
                loadCaseTask(caseTaskId);
            } else {
                currentCaseTask = null;
            }
        }
    });

    async function loadCaseTask(id: number) {
        loadingCaseTask = true;
        currentCaseTask = null;
        currentCase = null;
        currentProcess = null;

        // Get case task by ID from unified _bpm_tasks table
        const taskResult = await getRowByIdResult<CaseTask>("_bpm_tasks", id);

        if (!taskResult.success) {
            toastStore.add(getUserMessage(taskResult.error), "error");
            loadingCaseTask = false;
            return;
        }

        const caseTask = taskResult.value;

        // Enrich with assignees from junction table
        const assigneesResult = await taskAssigneeService.getTaskAssignees(id);
        const assigneeIds = assigneesResult.success
            ? assigneesResult.value
            : [];

        // Map assignee_id array to owner_id (first assignee for backward compatibility)
        const mappedCaseTask = {
            ...caseTask,
            assignee_id: assigneeIds, // Include assignee_id array
            owner_id:
                assigneeIds.length > 0
                    ? assigneeIds[0]
                    : caseTask.owner_id || null, // Map first assignee to owner_id
        };

        // Enrich with process task data (name, description, criteria)
        const processTaskResult = await getRowByIdResult(
            "_bpm_process_tasks",
            caseTask.task_id,
        );
        if (processTaskResult.success) {
            const processTask = processTaskResult.value;
            // Merge process task data into case task
            currentCaseTask = {
                ...mappedCaseTask,
                name: processTask.name,
                description: processTask.description,
                criteria: processTask.criteria,
                order_index: processTask.order_index,
                links: processTask.links,
                deadline_days: processTask.deadline_days,
            } as CaseTask;
        } else {
            // Use case task without enrichment if process task not found
            currentCaseTask = mappedCaseTask;
        }

        // Load case information via case_step_id
        if (caseTask.case_step_id) {
            const caseStepResult = await getRowByIdResult<any>(
                "_bpm_case_steps",
                caseTask.case_step_id,
            );
            if (caseStepResult.success) {
                const caseStep = caseStepResult.value;

                // Load case
                const caseResult = await getRowByIdResult<Case>(
                    "_bpm_cases",
                    caseStep.case_id,
                );
                if (caseResult.success) {
                    currentCase = caseResult.value;

                    // Load process from case
                    const processResult = await getRowByIdResult<Process>(
                        "_bpm_processes",
                        currentCase.process_id,
                    );
                    if (processResult.success) {
                        currentProcess = processResult.value;
                    }
                }
            }
        }

        loadingCaseTask = false;
    }

    async function handleCaseTaskSaved(caseTask: CaseTask) {
        if (onsaved) {
            await onsaved(caseTask);
        }
        // Always reload the case task to show updated values (including assignees)
        // The drawer is controlled by URL params, so it should stay open until explicitly closed
        if (caseTaskId) {
            // Invalidate cache to ensure fresh data
            requestCache.invalidate("workitems");
            if (caseTask.case_step_id) {
                const stepResult = await getRowByIdResult<any>(
                    "_bpm_case_steps",
                    caseTask.case_step_id,
                );
                if (stepResult.success) {
                    requestCache.invalidateEntity(
                        "case",
                        stepResult.value.case_id,
                    );
                }
            }
            // Small delay to ensure cache is invalidated
            await new Promise((resolve) => setTimeout(resolve, 100));
            await loadCaseTask(caseTaskId);
        }
    }

    function handleCaseTaskCancelled() {
        handleClose();
    }

    async function handleClose() {
        currentCaseTask = null;
        currentCase = null;
        currentProcess = null;

        // Remove drawer params from URL
        const url = new URL($page.url);
        url.searchParams.delete("drawer");
        url.searchParams.delete("caseTaskId");
        await goto(url.pathname + url.search, { noScroll: true });

        if (onclose) {
            onclose();
        }
    }
</script>

<Drawer
    open={isOpen}
    position="right"
    class="w-[95vw] md:w-[66vw]"
    onclose={handleClose}
>
    <div class="flex flex-col h-full">
        {#if loadingCaseTask}
            <div class="flex-1 flex items-center justify-center">
                <Spinner size="sm" />
            </div>
        {:else if currentCaseTask}
            <CaseTaskEditForm
                caseTask={currentCaseTask}
                case={currentCase}
                process={currentProcess}
                onsaved={handleCaseTaskSaved}
                oncancelled={handleCaseTaskCancelled}
            />
        {:else}
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <div class="text-zinc-500 mb-2">Geen taak geselecteerd</div>
                </div>
            </div>
        {/if}
    </div>
</Drawer>
