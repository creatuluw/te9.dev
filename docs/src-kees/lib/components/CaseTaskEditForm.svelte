<script lang="ts">
    import Button from "./Button.svelte";
    import ButtonGroup from "./ButtonGroup.svelte";
    import DatePicker from "./DatePicker.svelte";
    import Select, { type SelectOption } from "./Select.svelte";
    import Modal from "./Modal.svelte";
    import IconButton from "./IconButton.svelte";
    import Drawer from "./Drawer.svelte";
    import { Plus, Sparkles } from "lucide-svelte";
    import * as caseService from "$lib/services/caseService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import * as projectService from "$lib/services/projectService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import { getCurrentUserId, formatUserName } from "$lib/utils/userUtils";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { CaseTask } from "$lib/schemas/case";
    import type { Case } from "$lib/schemas/case";
    import type { Process } from "$lib/schemas/process";
    import type { Project } from "$lib/schemas/project";
    import type { DependencyImpact } from "$lib/services/dependencyService";
    import TinyTalkChat from "./TinyTalkChat.svelte";
    import KomtVanInput from "./KomtVanInput.svelte";
    import Spinner from "./Spinner.svelte";
    import Label from "./Label.svelte";

    /**
     * CaseTaskEditForm component props
     */
    interface Props {
        /**
         * Case task to edit (null for new task)
         */
        caseTask?: CaseTask | null;

        /**
         * Case this task belongs to (optional, for context)
         */
        case?: Case | null;

        /**
         * Process this task belongs to (optional, for context)
         */
        process?: Process | null;

        /**
         * Callback when case task is saved
         */
        onsaved?: (caseTask: CaseTask) => void;

        /**
         * Callback when form is cancelled
         */
        oncancelled?: () => void;

        /**
         * Read-only mode (for closed tasks)
         */
        readonly?: boolean;
    }

    let {
        caseTask = null,
        case: taskCase = null,
        process: taskProcess = null,
        onsaved,
        oncancelled,
        readonly = false,
    }: Props = $props();

    // Form fields
    let assigneeIds = $state<string[]>([]);
    let users = $state<PocketBaseUser[]>([]);
    let projects = $state<Project[]>([]);
    let subject = $state("");
    let status = $state<
        | "backlog"
        | "gepland"
        | "ad-hoc"
        | "pending"
        | "active"
        | "completed"
        | "overdue"
    >("backlog");
    let deadline = $state<string | null>(null);
    let uren = $state<string>("");
    let priority = $state<"laag" | "normaal" | "hoog">("normaal");
    let kanbanStatus = $state<string>("gepland");
    let komtVan = $state("");
    let selectedProjectId = $state<string | null>(null);

    // Loading states
    let saving = $state(false);
    let checkingDependencies = $state(false);

    // Form state tracking
    let initialValues = $state<{
        assigneeIds: string[];
        selectedProjectId: string | null;
        status: string;
        deadline: string | null;
        uren: string;
        priority: string;
        kanbanStatus: string;
        komtVan: string;
    } | null>(null);
    let initialValuesLoaded = $state(false);

    // Dependency warning state
    let dependencyImpacts = $state<DependencyImpact[]>([]);
    let showDependencyWarning = $state(false);
    let originalDeadline = $state<string | null>(null);

    // TinyTalk AI chat state
    let chatOpen = $state(false);

    // Project options for select
    const projectOptions = $derived.by((): SelectOption[] => {
        const opts: SelectOption[] = [{ value: "", label: "Geen project" }];
        for (const project of projects) {
            opts.push({ value: String(project.id), label: project.name });
        }
        return opts;
    });

    // Load users and projects on mount
    $effect(() => {
        loadUsers();
        loadProjects();
    });

    async function loadUsers() {
        try {
            const result = await pocketbaseService.getAllUsers();
            if (result.success) {
                users = result.value;
            } else {
                console.error(
                    "[CaseTaskEditForm] Error loading users:",
                    result.error,
                );
                users = [];
            }
        } catch (error) {
            console.error(
                "[CaseTaskEditForm] Unexpected error loading users:",
                error,
            );
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
            console.error("[CaseTaskEditForm] Error loading projects:", error);
            projects = [];
        }
    }

    // User options for assignee select
    const userOptions = $derived.by((): SelectOption[] => {
        return users.map((user) => ({
            value: user.id,
            label: formatUserName(user),
        }));
    });

    // Get selected assignee names for display
    const selectedAssigneeNames = $derived.by(() => {
        return assigneeIds
            .map((id) => {
                const user = users.find((u) => u.id === id);
                return user ? formatUserName(user) : null;
            })
            .filter((name): name is string => name !== null);
    });

    // Initialize form when caseTask changes
    $effect(() => {
        if (caseTask) {
            // Reset initial values loaded flag when task changes
            initialValuesLoaded = false;
            initialValues = null;

            // Load assignees from assignee_id array or owner_id (backward compatibility)
            const taskItem = caseTask as any;
            assigneeIds = Array.isArray(taskItem.assignee_id)
                ? taskItem.assignee_id
                : taskItem.assignee_id
                  ? [taskItem.assignee_id]
                  : caseTask.owner_id
                    ? [caseTask.owner_id]
                    : [];
            subject = caseTask.name || `Task ${caseTask.id}`;
            status = caseTask.status;
            deadline = caseTask.deadline || null;
            originalDeadline = caseTask.deadline || null; // Store original for comparison
            uren = caseTask.uren ? String(caseTask.uren) : "";
            priority = (caseTask as any).priority || "normaal";
            kanbanStatus = caseTask.kanban_status || "gepland";
            komtVan = caseTask.komt_van ?? "";
            selectedProjectId = (caseTask as any).project_id
                ? String((caseTask as any).project_id)
                : null;
            // Reset dependency warnings on new task load
            dependencyImpacts = [];
            showDependencyWarning = false;

            // Store initial values snapshot after a short delay to prevent saving on initial load
            const timeoutId = setTimeout(() => {
                initialValues = {
                    assigneeIds: [...assigneeIds],
                    selectedProjectId,
                    status,
                    deadline,
                    uren,
                    priority,
                    kanbanStatus,
                    komtVan,
                };
                initialValuesLoaded = true;
            }, 500);

            return () => {
                clearTimeout(timeoutId);
            };
        } else {
            // Reset form for new task
            resetForm();
        }
    });

    // Check for dependencies when deadline changes (debounced)
    let dependencyCheckTimeout: ReturnType<typeof setTimeout> | null = null;
    $effect(() => {
        if (!caseTask || !deadline || deadline === originalDeadline) {
            // Reset if deadline is back to original or no task
            dependencyImpacts = [];
            showDependencyWarning = false;
            return;
        }

        // Debounce dependency check to avoid too many API calls
        if (dependencyCheckTimeout) {
            clearTimeout(dependencyCheckTimeout);
        }

        dependencyCheckTimeout = setTimeout(() => {
            checkDependencies();
        }, 500); // Wait 500ms after user stops typing

        return () => {
            if (dependencyCheckTimeout) {
                clearTimeout(dependencyCheckTimeout);
            }
        };
    });

    function resetForm() {
        const currentUserId = getCurrentUserId();
        assigneeIds = currentUserId ? [currentUserId] : [];
        subject = "";
        status = "backlog";
        deadline = null;
        originalDeadline = null;
        uren = "";
        priority = "normaal";
        kanbanStatus = "gepland";
        komtVan = "";
        selectedProjectId = null;
        dependencyImpacts = [];
        showDependencyWarning = false;
        initialValues = null;
        initialValuesLoaded = false;
    }

    function hasFormChanged(): boolean {
        if (!initialValues) return false;
        const iv = initialValues;

        // Check if assigneeIds changed (compare arrays)
        const assigneesChanged =
            assigneeIds.length !== iv.assigneeIds.length ||
            !assigneeIds.every((id, index) => id === iv.assigneeIds[index]);

        return (
            assigneesChanged ||
            selectedProjectId !== iv.selectedProjectId ||
            status !== iv.status ||
            deadline !== iv.deadline ||
            uren !== iv.uren ||
            priority !== iv.priority ||
            kanbanStatus !== iv.kanbanStatus ||
            komtVan !== iv.komtVan
        );
    }

    async function checkDependencies() {
        if (!caseTask) return;

        checkingDependencies = true;
        try {
            const { analyzeTaskDependencies } =
                await import("$lib/services/dependencyService");
            const result = await analyzeTaskDependencies(caseTask.id);

            if (result.success) {
                dependencyImpacts = result.value;
                showDependencyWarning = dependencyImpacts.length > 0;
            } else {
                console.error("Failed to check dependencies:", result.error);
                dependencyImpacts = [];
                showDependencyWarning = false;
            }
        } catch (error) {
            console.error("Error checking dependencies:", error);
            dependencyImpacts = [];
            showDependencyWarning = false;
        } finally {
            checkingDependencies = false;
        }
    }

    async function saveCaseTask() {
        if (!caseTask || !initialValuesLoaded || saving || !hasFormChanged())
            return;

        saving = true;

        // Helper to convert empty strings to null
        const emptyToNull = (val: string): string | null =>
            val.trim() === "" ? null : val.trim();
        const parseNumber = (
            val: string | number | null | undefined,
        ): number | null => {
            // Handle null/undefined
            if (val == null) return null;
            // Handle number type
            if (typeof val === "number") {
                return isNaN(val) || val < 0 ? null : val;
            }
            // Handle string type
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

        // Send assignee_id as array (preferred) and owner_id for backward compatibility
        const data: any = {
            project_id: parseProjectId(selectedProjectId),
            status: status,
            assignee_id: assigneeIds.length > 0 ? assigneeIds : [],
            owner_id: assigneeIds.length > 0 ? assigneeIds[0] : null, // First assignee for backward compatibility
            uren: parseNumber(uren),
            priority: priority,
            deadline: deadline && deadline.trim() !== "" ? deadline : null,
            kanban_status: kanbanStatus || null,
            komt_van: emptyToNull(komtVan),
        };

        const result = await caseService.updateCaseTask(caseTask.id, data);
        if (result.success) {
            toastStore.add("Taak bijgewerkt", "success");

            // Update initial values to match current values to prevent unnecessary saves
            if (initialValues) {
                initialValues = {
                    assigneeIds: [...assigneeIds],
                    selectedProjectId,
                    status,
                    deadline,
                    uren,
                    priority,
                    kanbanStatus,
                    komtVan,
                };
            }

            if (onsaved) {
                onsaved(result.value[0]);
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }

        saving = false;
    }

    async function handleSubmit() {
        // Manual save via button click
        await saveCaseTask();
    }

    function handleCancel() {
        resetForm();
        chatOpen = false;
        if (oncancelled) {
            oncancelled();
        }
    }

    /**
     * Handle form filling from chat conversation
     */
    function handleFillForm(fieldData: Record<string, string>) {
        // Case tasks have limited editable fields, but we can handle basic ones
        if (fieldData.subject) {
            subject = fieldData.subject;
        }

        // Show feedback that form was filled
        if (Object.keys(fieldData).length > 0) {
            toastStore.add(
                "Formuliervelden ingevuld op basis van het gesprek",
                "success",
            );
        }
    }
</script>

<div class="flex flex-col h-full">
    <!-- Header -->
    <div class="mb-6 flex-shrink-0">
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                    {caseTask ? "Taak bewerken" : "Taak toevoegen"}
                </h2>
                <p class="text-sm text-zinc-600 mt-1">Bewerk de taak details</p>
            </div>
            <IconButton
                icon={Sparkles}
                variant="ghost"
                size="default"
                tooltip="AI Assistent - Klik om te chatten"
                tooltipPosition="left"
                onclick={() => (chatOpen = !chatOpen)}
                class={chatOpen ? "bg-zinc-100" : ""}
            />
        </div>
    </div>

    <!-- Form Content (Scrollable) -->
    <form
        id="casetask-form"
        onsubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}
        class="flex-1 overflow-y-auto space-y-6 pb-6 pointer-events-auto"
    >
        <!-- Subject (read-only from process task) -->
        <div>
            <label
                for="subject"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Taak naam
            </label>
            <input
                id="subject"
                type="text"
                bind:value={subject}
                disabled={true}
                class="w-full px-3 py-2 border border-zinc-300 rounded-sm bg-zinc-50 text-zinc-500 cursor-not-allowed text-sm"
                placeholder="Taak naam wordt bepaald door proces"
            />
            <p class="text-xs text-zinc-500 mt-1">
                Deze naam komt uit het proces en kan niet worden gewijzigd
            </p>
        </div>

        <!-- Status and Kanban Status on same row -->
        <div class="grid grid-cols-2 gap-0">
            <!-- Status Button Group -->
            <div>
                <div class="block text-sm font-medium text-zinc-900 mb-2">
                    Status
                </div>
                <ButtonGroup size="sm">
                    <Button
                        type="button"
                        variant={status === "backlog" ? "default" : "secondary"}
                        class="button-group-item"
                        disabled={readonly}
                        onclick={() => {
                            if (!readonly) status = "backlog";
                        }}
                    >
                        Backlog
                    </Button>
                    <Button
                        type="button"
                        variant={status === "gepland" ? "default" : "secondary"}
                        class="button-group-item"
                        disabled={readonly}
                        onclick={() => {
                            if (!readonly) status = "gepland";
                        }}
                    >
                        Gepland
                    </Button>
                    <Button
                        type="button"
                        variant={status === "ad-hoc" ? "default" : "secondary"}
                        class="button-group-item"
                        disabled={readonly}
                        onclick={() => {
                            if (!readonly) status = "ad-hoc";
                        }}
                    >
                        Ad-hoc
                    </Button>
                </ButtonGroup>
            </div>

            <!-- Kanban Status - Only show when status is not 'backlog' -->
            {#if status !== "backlog"}
                <div>
                    <div class="block text-sm font-medium text-zinc-900 mb-2">
                        Kanban status
                    </div>
                    <ButtonGroup size="sm" class="w-full">
                        <Button
                            type="button"
                            variant={kanbanStatus === "gepland"
                                ? "default"
                                : "secondary"}
                            class="button-group-item"
                            disabled={readonly}
                            onclick={() => {
                                if (!readonly) kanbanStatus = "gepland";
                            }}
                        >
                            Gepland
                        </Button>
                        <Button
                            type="button"
                            variant={kanbanStatus === "mee_bezig"
                                ? "default"
                                : "secondary"}
                            class="button-group-item"
                            disabled={readonly}
                            onclick={() => {
                                if (!readonly) kanbanStatus = "mee_bezig";
                            }}
                        >
                            Mee bezig
                        </Button>
                        <Button
                            type="button"
                            variant={kanbanStatus === "in_review"
                                ? "default"
                                : "secondary"}
                            class="button-group-item"
                            disabled={readonly}
                            onclick={() => {
                                if (!readonly) kanbanStatus = "in_review";
                            }}
                        >
                            In review
                        </Button>
                        <Button
                            type="button"
                            variant={kanbanStatus === "afgerond"
                                ? "default"
                                : "secondary"}
                            class="button-group-item"
                            disabled={readonly}
                            onclick={() => {
                                if (!readonly) kanbanStatus = "afgerond";
                            }}
                        >
                            Afgerond
                        </Button>
                    </ButtonGroup>
                </div>
            {/if}
        </div>

        <!-- Assignee -->
        <div>
            <div class="block text-sm font-medium text-zinc-900 mb-2">
                Toegewezen aan
            </div>
            <Select
                options={userOptions}
                selectedValues={assigneeIds}
                multiple={true}
                searchable={true}
                onchange={(values) => {
                    assigneeIds = (values as string[]) || [];
                }}
                placeholder="Selecteer gebruikers..."
                disabled={readonly}
            />
        </div>

        <!-- Assignee labels (only show when more than 1 assignee) -->
        {#if selectedAssigneeNames.length > 1}
            <div class="w-full flex flex-wrap gap-2 mt-2">
                {#each selectedAssigneeNames as name}
                    <Label>{name}</Label>
                {/each}
            </div>
        {/if}

        <!-- Deadline, Hours, and Priority -->
        <div class="grid grid-cols-3 gap-4">
            <div>
                <label
                    for="deadline"
                    class="block text-sm font-medium text-zinc-900 mb-2"
                >
                    Deadline
                </label>
                <DatePicker id="deadline" bind:value={deadline} />
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
                    step="0.1"
                    {readonly}
                    disabled={readonly}
                    class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm {readonly
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
                        { value: "laag", label: "Laag" },
                        { value: "normaal", label: "Normaal" },
                        { value: "hoog", label: "Hoog" },
                    ]}
                    bind:value={priority}
                    placeholder="Selecteer prioriteit..."
                    disabled={readonly}
                />
            </div>
        </div>

        <!-- Komt van and Project in one row -->
        <div class="grid grid-cols-2 gap-4">
            <!-- Komt van (email) -->
            <div>
                <label
                    for="komt-van"
                    class="block text-sm font-medium text-zinc-900 mb-2"
                >
                    Komt van (e-mailadres)
                </label>
                <KomtVanInput
                    id="komt-van"
                    bind:value={komtVan}
                    disabled={saving || readonly}
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
                    bind:value={selectedProjectId}
                    placeholder="Selecteer project..."
                    disabled={readonly}
                />
            </div>
        </div>

        <!-- Dependency Warning -->
        {#if showDependencyWarning && dependencyImpacts.length > 0}
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                        <svg
                            class="w-5 h-5 text-orange-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            ></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-orange-900 mb-2">
                            Deadline wijziging beïnvloedt andere taken
                        </h4>
                        <p class="text-sm text-orange-800 mb-3">
                            Het wijzigen van deze deadline kan invloed hebben op
                            de volgende taken in dezelfde stap:
                        </p>
                        <ul class="space-y-1">
                            {#each dependencyImpacts as impact}
                                <li
                                    class="text-sm text-orange-700 flex items-start gap-2"
                                >
                                    <span class="text-orange-600 mt-1">•</span>
                                    <span>
                                        <strong
                                            >{impact.dependentTaskName}</strong
                                        >
                                        <span class="text-orange-600"
                                            >- {impact.impactDescription}</span
                                        >
                                    </span>
                                </li>
                            {/each}
                        </ul>
                        {#if checkingDependencies}
                            <p class="text-xs text-orange-600 mt-2">
                                Controleren op afhankelijkheden...
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        <!-- Process Task Context (read-only) -->
        {#if caseTask}
            <div class="border-t border-zinc-200 pt-6">
                <h3 class="text-lg font-medium text-zinc-900 mb-4">
                    Proces informatie
                </h3>

                <!-- Case Information -->
                {#if taskCase}
                    <div class="mb-4">
                        <div
                            class="block text-sm font-medium text-zinc-700 mb-2"
                        >
                            Case
                        </div>
                        <div
                            class="p-3 bg-zinc-50 border border-zinc-200 rounded-sm text-sm text-zinc-600"
                        >
                            {taskCase.name}
                        </div>
                    </div>
                {/if}

                <!-- Process Information -->
                {#if taskProcess}
                    <div class="mb-4">
                        <div
                            class="block text-sm font-medium text-zinc-700 mb-2"
                        >
                            Proces
                        </div>
                        <div
                            class="p-3 bg-zinc-50 border border-zinc-200 rounded-sm text-sm text-zinc-600"
                        >
                            {taskProcess.name}
                        </div>
                    </div>
                {/if}

                {#if caseTask.description}
                    <div class="mb-4">
                        <div
                            class="block text-sm font-medium text-zinc-700 mb-2"
                        >
                            Beschrijving
                        </div>
                        <div
                            class="p-3 bg-zinc-50 border border-zinc-200 rounded-sm text-sm text-zinc-600"
                        >
                            {caseTask.description}
                        </div>
                    </div>
                {/if}

                {#if caseTask.criteria}
                    <div class="mb-4">
                        <div
                            class="block text-sm font-medium text-zinc-700 mb-2"
                        >
                            Criteria
                        </div>
                        <div
                            class="p-3 bg-zinc-50 border border-zinc-200 rounded-sm text-sm text-zinc-600"
                        >
                            {caseTask.criteria}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </form>

    <!-- Footer with Submit Buttons (Fixed) -->
    {#if !readonly}
        <div class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white">
            <div class="flex justify-between items-center">
                <div class="flex gap-3">
                    <Button
                        type="button"
                        onclick={handleSubmit}
                        disabled={saving ||
                            !initialValuesLoaded ||
                            !hasFormChanged()}
                    >
                        {saving ? "Opslaan..." : "Bijwerken"}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onclick={handleCancel}
                        disabled={saving}
                    >
                        Sluiten
                    </Button>
                </div>
                {#if initialValuesLoaded && hasFormChanged() && !saving}
                    <span class="text-sm text-zinc-500"
                        >Niet-opgeslagen wijzigingen</span
                    >
                {/if}
            </div>
        </div>
    {/if}
</div>

<!-- TinyTalk Chat Drawer (left side) -->
<Drawer
    open={chatOpen}
    position="left"
    class="w-[40%]"
    showBackdrop={false}
    onclose={() => (chatOpen = false)}
>
    <TinyTalkChat
        open={chatOpen}
        formSelector="#casetask-form"
        onFillForm={handleFillForm}
        onclose={() => (chatOpen = false)}
        class="h-full"
    />
</Drawer>
