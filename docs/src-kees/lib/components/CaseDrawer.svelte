<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Drawer } from "$lib/components";
    import Button from "$lib/components/Button.svelte";
    import UserSelector from "$lib/components/UserSelector.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import DatePicker from "$lib/components/DatePicker.svelte";
    import * as processService from "$lib/services/processService";
    import * as caseService from "$lib/services/caseService";
    import * as projectService from "$lib/services/projectService";
    import type { Process } from "$lib/services/processService";
    import type { Case } from "$lib/services/caseService";
    import type { Project } from "$lib/services/projectService";
    import FileUpload from "./FileUpload.svelte";
    import * as minioService from "$lib/services/minioService";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import { createLoadingManager } from "$lib/utils/loadingState";
    import { navigationState } from "$lib/stores/navigationStore.svelte";
    import Spinner from "./Spinner.svelte";

    /**
     * CaseDrawer component props
     *
     * Drawer component for creating a new case from a process template.
     * Opens when URL param `drawer=case` is present.
     */
    interface Props {
        /**
         * Callback fired when a new case is successfully created
         * @param caseData - The created case data
         * @example
         * ```typescript
         * <CaseDrawer
         *   oncreated={(caseData) => {
         *     console.log('Case created:', caseData);
         *     refreshCases();
         *   }}
         * />
         * ```
         */
        oncreated?: (caseData: Case) => void;

        /**
         * Pre-loaded users list (optional, will load from API if not provided)
         * Passing this prevents UserSelector from making an API call
         */
        users?: any[];
    }

    let { oncreated, users: usersProp }: Props = $props();

    // Derive state from URL params
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const processIdParam = $derived($page.url.searchParams.get("processId"));

    const isOpen = $derived(drawerParam === "case");
    const processId = $derived(processIdParam ? Number(processIdParam) : null);

    let processes = $state<Process[]>([]);
    let projects = $state<Project[]>([]);
    let selectedProcessId = $state<number | null>(null);
    let selectedProjectId = $state<number | null>(null);
    let caseName = $state("");
    let startDate = $state(new Date().toISOString().split("T")[0]);
    let ownerId = $state<string | null>(null);
    let processDetails = $state<{
        stepCount: number;
        taskCount: number;
    } | null>(null);
    let error = $state<string | null>(null);
    let createdCaseId = $state<number | null>(null);
    let caseAttachments = $state<string[]>([]);
    let isSubmitting = $state(false);

    // Use centralized loading manager for multiple loading states
    const loading = createLoadingManager("CaseDrawer");

    // Check if component is currently loading (any operation)
    const isComponentLoading = $derived.by(() => {
        return (
            navigationState.componentLoading["CaseDrawer:initial"] ||
            navigationState.componentLoading["CaseDrawer:submit"] ||
            navigationState.componentLoading["CaseDrawer:files"]
        );
    });

    // Convert processes to SelectOption format
    const processOptions = $derived.by((): SelectOption[] => {
        return processes.map((process) => ({
            value: process.id.toString(),
            label: process.name,
        }));
    });

    // Convert projects to SelectOption format
    const projectOptions = $derived.by((): SelectOption[] => {
        return projects.map((project) => ({
            value: project.id.toString(),
            label: project.name,
        }));
    });

    // Track if we've loaded processes to prevent infinite loops
    let hasLoadedProcesses = $state(false);
    let isLoadingProcesses = $state(false);
    let previousIsOpen = $state(false);

    // Load processes when drawer opens - only react to isOpen changes
    $effect(() => {
        const currentIsOpen = isOpen;

        // Only run when isOpen actually changes, not on every reactive update
        if (currentIsOpen === previousIsOpen) {
            return; // Skip if isOpen hasn't changed
        }

        previousIsOpen = currentIsOpen;

        if (currentIsOpen) {
            // Only load if we don't already have processes and we're not currently loading
            if (
                processes.length === 0 &&
                !isLoadingProcesses &&
                !hasLoadedProcesses
            ) {
                isLoadingProcesses = true;
                hasLoadedProcesses = true; // Set immediately to prevent re-runs
                loading.start("initial");

                // Add timeout to prevent infinite hanging
                const timeoutId = setTimeout(() => {
                    loading.stop("initial");
                    isLoadingProcesses = false;
                    if (processes.length === 0) {
                        error =
                            "Timeout bij laden van processen. Probeer het opnieuw.";
                        hasLoadedProcesses = false; // Allow retry
                    }
                }, 30000); // 30 second timeout

                Promise.all([loadProcesses(), loadProjects()])
                    .then(() => {
                        clearTimeout(timeoutId);
                        // If processId is provided, use it as the selected process
                        if (processId) {
                            selectedProcessId = processId;
                            loadProcessDetails(processId);
                        } else {
                            // Reset form for create mode
                            selectedProcessId = null;
                            selectedProjectId = null;
                            caseName = "";
                            startDate = new Date().toISOString().split("T")[0];
                            ownerId = null;
                            processDetails = null;
                            error = null;
                            caseAttachments = [];
                            createdCaseId = null;
                            isSubmitting = false;
                        }
                    })
                    .catch((err) => {
                        clearTimeout(timeoutId);
                        error =
                            "Fout bij laden van processen. Probeer het opnieuw.";
                        hasLoadedProcesses = false; // Allow retry on error
                    })
                    .finally(() => {
                        clearTimeout(timeoutId);
                        loading.stop("initial");
                        isLoadingProcesses = false;
                    });
            }
        } else {
            // Reset state when drawer closes
            loading.stop("initial");
            isLoadingProcesses = false;
            hasLoadedProcesses = false; // Reset so it can load again when reopened
            projects = []; // Clear projects when drawer closes
            isSubmitting = false; // Reset submitting state
        }
    });

    async function loadProcesses() {
        try {
            const result = await processService.getAllProcesses();
            if (result.success) {
                processes = result.value;
                error = null; // Clear any previous errors
            } else {
                error = "Fout bij laden van processen. Probeer het opnieuw.";
                processes = [];
            }
        } catch (err) {
            error = "Fout bij laden van processen. Probeer het opnieuw.";
            processes = [];
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
        } catch (err) {
            console.error("Error loading projects:", err);
            projects = [];
        }
    }

    async function loadProcessDetails(id: number) {
        const result = await processService.getProcessStats(id);
        if (result.success) {
            processDetails = result.value;
        } else {
            console.error("Error loading process details:", result.error);
            processDetails = null;
        }
    }

    async function handleProcessChange(value: string | string[] | null) {
        const strValue = Array.isArray(value) ? (value[0] ?? null) : value;
        selectedProcessId = strValue ? parseInt(strValue) : null;
        if (selectedProcessId) {
            await loadProcessDetails(selectedProcessId);
        } else {
            processDetails = null;
        }
    }

    async function handleSubmit() {
        if (!selectedProcessId || !caseName.trim()) {
            error = "Selecteer een proces en voer een casenaam in";
            return;
        }
        error = null;
        isSubmitting = true; // Set immediately for instant feedback
        loading.start("submit");

        try {
            const processResult =
                await processService.getProcessById(selectedProcessId);
            if (!processResult.success) {
                console.error("Error loading process:", processResult.error);
                error = "Fout bij laden van proces";
                isSubmitting = false;
                loading.stop("submit");
                return;
            }

            // Capture the current URL as the source
            const sourceUrl = window.location.href;

            const createCaseResult = await caseService.createCaseFromProcess(
                {
                    ...processResult.value.process,
                    steps: processResult.value.steps,
                },
                {
                    name: caseName.trim(),
                    start_date: startDate,
                    owner_id: ownerId || undefined,
                    process_id: selectedProcessId,
                    project_id: selectedProjectId || undefined,
                    source: sourceUrl,
                    bijlagen: caseAttachments,
                } as any,
            );

            if (!createCaseResult.success) {
                console.error("Error creating case:", createCaseResult.error);
                error = "Fout bij aanmaken van case";
                isSubmitting = false;
                loading.stop("submit");
                return;
            }

            // Store created case ID and attachments for file management
            const createdCase = createCaseResult.value;
            createdCaseId = createdCase.id;
            caseAttachments = createdCase.bijlagen || [];

            // Call oncreated callback - parent handles navigation
            // Don't clean up URL here since parent will navigate away
            if (oncreated) {
                await oncreated(createdCase);
            }
        } catch (err) {
            console.error("Exception in handleSubmit:", err);
            error =
                "Er is een onverwachte fout opgetreden. Probeer het opnieuw.";
            isSubmitting = false;
        } finally {
            isSubmitting = false;
            loading.stop("submit");
        }
    }

    async function handleFileUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        loading.start("files");
        const fileArray = Array.from(files);
        const newUrls: string[] = [];

        try {
            // Use MinIO for file uploads (same as FileManagerTab)
            const folder = createdCaseId ? `cases/${createdCaseId}` : undefined;

            // Upload each file
            for (const file of fileArray) {
                const result = await minioService.uploadFile(
                    file,
                    folder,
                    createdCaseId ?? undefined,
                );
                if (!result.success) {
                    console.error("Error uploading file:", result.error);
                    toastStore.add(
                        `Fout bij uploaden van ${file.name}: ${getUserMessage(result.error)}`,
                        "error",
                    );
                } else if (result.value.url) {
                    newUrls.push(result.value.url);
                }
            }

            if (newUrls.length > 0) {
                caseAttachments = [...caseAttachments, ...newUrls];

                // Update case with new attachments if case already exists
                if (createdCaseId) {
                    const updateResult = await caseService.updateCase(
                        createdCaseId,
                        {
                            bijlagen: caseAttachments,
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
                    // For new cases, just add to local state - will be saved when case is created
                    toastStore.add(
                        `${newUrls.length} bestand(en) geüpload`,
                        "success",
                    );
                }
            }
        } catch (error) {
            console.error("Error uploading files:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het uploaden",
                "error",
            );
        } finally {
            loading.stop("files");
        }
    }

    function removeAttachment(url: string) {
        caseAttachments = caseAttachments.filter((a) => a !== url);
        // Update case with removed attachment if case already exists
        if (createdCaseId) {
            caseService
                .updateCase(createdCaseId, {
                    bijlagen: caseAttachments,
                })
                .then((result) => {
                    if (result.success) {
                        toastStore.add("Bestand verwijderd", "success");
                    } else {
                        toastStore.add(getUserMessage(result.error), "error");
                    }
                });
        } else {
            // For new cases, just update local state - will be saved when case is created
            toastStore.add("Bestand verwijderd", "success");
        }
    }

    async function handleClose() {
        // Reset submitting state
        isSubmitting = false;
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
        <!-- Header -->
        <div class="mb-6 pb-4 border-b border-zinc-200 flex-shrink-0">
            <h2 class="text-2xl font-bold text-zinc-900 font-aspekta">
                Nieuwe Case Aanmaken
            </h2>
            <p class="text-zinc-600 text-sm mt-2">
                Selecteer een processjabloon en vul de details in om een nieuwe
                case aan te maken.
            </p>
        </div>

        <!-- Form Content (Scrollable) -->
        <form
            id="case-form"
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

            <div class="space-y-6">
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <label
                            for="process"
                            class="block text-sm font-medium text-zinc-900"
                        >
                            Proces <span class="text-red-500">*</span>
                        </label>
                        {#if processDetails && selectedProcessId}
                            <div class="flex items-center gap-2">
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                    {processDetails.stepCount} stap{processDetails.stepCount !==
                                    1
                                        ? "pen"
                                        : ""}
                                </span>
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                                >
                                    {processDetails.taskCount}
                                    {processDetails.taskCount !== 1
                                        ? "taken"
                                        : "taak"}
                                </span>
                            </div>
                        {/if}
                    </div>
                    <Select
                        value={selectedProcessId?.toString() || null}
                        options={processOptions}
                        placeholder="Selecteer een proces..."
                        disabled={isComponentLoading}
                        onchange={handleProcessChange}
                        class="w-full"
                        searchable={true}
                    />
                    <p class="text-sm text-zinc-500 mt-2">
                        Bij het aanmaken worden automatisch alle stappen en
                        taken van het sjabloon opgenomen.
                    </p>
                </div>

                <div>
                    <label
                        for="caseName"
                        class="block text-sm font-medium text-zinc-900 mb-2"
                    >
                        Casenaam <span class="text-red-500">*</span>
                    </label>
                    <input
                        id="caseName"
                        type="text"
                        bind:value={caseName}
                        required
                        disabled={isComponentLoading}
                        class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                        placeholder="bijv. Onboarding voor Jan Jansen"
                    />
                </div>

                <div>
                    <label
                        for="startDate"
                        class="block text-sm font-medium text-zinc-900 mb-2"
                    >
                        Startdatum <span class="text-red-500">*</span>
                    </label>
                    <DatePicker
                        id="startDate"
                        bind:value={startDate}
                        required
                        disabled={isComponentLoading}
                        placeholder="Selecteer een datum..."
                        class="w-full"
                    />
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
                            bind:selectedUserId={ownerId}
                            users={usersProp}
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
                            value={selectedProjectId?.toString() || null}
                            options={projectOptions}
                            onchange={(value) => {
                                const strValue = Array.isArray(value)
                                    ? (value[0] ?? null)
                                    : value;
                                selectedProjectId = strValue
                                    ? parseInt(strValue)
                                    : null;
                            }}
                            placeholder="Project toewijzen (optioneel)..."
                            disabled={isComponentLoading}
                            class="w-full"
                            searchable={true}
                        />
                    </div>
                </div>

                <div role="group" aria-label="Bijlagen">
                    <div class="block text-sm font-medium text-zinc-900 mb-2">
                        Bijlagen
                    </div>
                    <FileUpload
                        variant="drag-drop"
                        multiple
                        onchange={handleFileUpload}
                        disabled={isComponentLoading}
                    />

                    {#if caseAttachments.length > 0}
                        <div class="mt-3 space-y-2">
                            {#each caseAttachments as url}
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
                                        onclick={() => removeAttachment(url)}
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
        </form>

        <!-- Footer Actions (Fixed) -->
        <div class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white">
            <div class="flex justify-start gap-3">
                <Button type="submit" form="case-form" disabled={isSubmitting}>
                    {#if isSubmitting}
                        <div class="flex items-center gap-2">
                            <Spinner size="sm" />
                            <span>Case aanmaken...</span>
                        </div>
                    {:else}
                        Case Aanmaken
                    {/if}
                </Button>
                <Button
                    variant="secondary"
                    type="button"
                    onclick={handleClose}
                    disabled={isSubmitting}
                >
                    Annuleren
                </Button>
            </div>
        </div>
    </div>
</Drawer>
