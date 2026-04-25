<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Drawer } from "$lib/components";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import FileUpload from "./FileUpload.svelte";
    import * as projectService from "$lib/services/projectService";
    import * as minioService from "$lib/services/minioService";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { Project } from "$lib/services/projectService";

    /**
     * ProjectDrawer component props
     *
     * Drawer component for creating or editing projects.
     * Opens when URL param `drawer=project` is present.
     */
    interface Props {
        /**
         * Callback fired when a new project is successfully created
         * @param project - The created project data
         */
        oncreated?: (project: Project) => void;

        /**
         * Callback fired when a project is successfully updated
         * @param project - The updated project data
         */
        onupdated?: (project: Project) => void;
    }

    let { oncreated, onupdated }: Props = $props();

    // Derive state from URL params
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const projectIdParam = $derived($page.url.searchParams.get("projectId"));

    const isOpen = $derived(drawerParam === "project");
    const projectId = $derived(projectIdParam ? Number(projectIdParam) : null);

    let name = $state("");
    let description = $state("");
    let isPrivate = $state(false);
    let loading = $state(false);
    let error = $state<string | null>(null);

    // Attachment type with metadata
    type Attachment = {
        url: string;
        name: string;
        size: number | null; // Size in bytes, null for existing attachments
    };

    let attachments = $state<Attachment[]>([]);
    let uploadingFiles = $state(false);
    let fileUploadKey = $state(0); // Key to reset FileUpload component after upload

    const isEditMode = $derived(projectId !== null && projectId !== undefined);

    // Load project data when editing
    $effect(() => {
        if (isOpen && isEditMode && projectId) {
            loadProject(projectId);
        } else if (isOpen && !isEditMode) {
            // Reset form for create mode
            name = "";
            description = "";
            isPrivate = false;
            error = null;
            attachments = [];
        }
    });

    async function loadProject(id: number) {
        error = null;
        try {
            const result = await projectService.getProjectById(id);
            if (result.success) {
                const project = result.value;
                name = project.name;
                description = project.description || "";
                isPrivate = project.is_private || false;
                // Load attachments
                const bijlagenUrls = project.bijlagen || [];
                attachments = bijlagenUrls.map((url) => ({
                    url,
                    name: url.split("/").pop() || url,
                    size: null, // Size not available for existing attachments
                }));
            } else {
                console.error("Error loading project:", result.error);
                error = "Fout bij laden van project";
            }
        } catch (err) {
            console.error("Error loading project:", err);
            error = "Fout bij laden van project";
        } finally {
        }
    }

    async function handleSubmit() {
        if (!name.trim()) {
            error = "Voer een projectnaam in";
            return;
        }
        error = null;
        loading = true;

        try {
            let project: Project;
            const bijlagenUrls = (attachments || [])
                .map((a) => a.url)
                .filter((url) => url && url.trim() !== "");

            if (isEditMode && projectId) {
                const result = await projectService.updateProject(projectId, {
                    name: name.trim(),
                    description: description.trim() || null,
                    is_private: isPrivate,
                    bijlagen: bijlagenUrls.length > 0 ? bijlagenUrls : null,
                });
                if (result.success) {
                    project = result.value[0];
                    onupdated?.(project);
                } else {
                    console.error("Error updating project:", result.error);
                    error = "Fout bij opslaan van project";
                    loading = false;
                    return;
                }
            } else {
                // Create project via API (which handles user ID automatically)
                try {
                    const response = await fetch("/api/projects", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: name.trim(),
                            description: description.trim() || undefined,
                            status: "active",
                            is_private: isPrivate,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                            errorData.error || "Failed to create project",
                        );
                    }

                    project = await response.json();

                    // Update project with attachments if any were uploaded
                    if (bijlagenUrls.length > 0) {
                        const updateResult = await projectService.updateProject(
                            project.id,
                            {
                                bijlagen: bijlagenUrls,
                            },
                        );
                        if (!updateResult.success) {
                            console.error(
                                "Error updating project attachments:",
                                updateResult.error,
                            );
                        }
                    }
                    if (oncreated) {
                        await oncreated(project);
                    }
                } catch (err: any) {
                    console.error("Error creating project:", err);
                    error = err.message || "Fout bij aanmaken van project";
                    loading = false;
                    return;
                }
            }

            loading = false;
            // Close drawer after successful save (unless redirected by callback)
            if ($page.url.pathname !== "/projects/" + project.id) {
                await handleClose();
            }
        } catch (err) {
            console.error("Error saving project:", err);
            error =
                err instanceof Error
                    ? err.message
                    : "Fout bij opslaan van project";
            loading = false;
        }
    }

    async function handleClose() {
        // Remove drawer params from URL
        const url = new URL($page.url);
        url.searchParams.delete("drawer");
        url.searchParams.delete("projectId");
        await goto(url.pathname + url.search, { noScroll: true });
    }

    /**
     * Format file size in bytes to human-readable format
     */
    function formatFileSize(bytes: number | null): string {
        if (bytes === null) return "";
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    async function handleFileUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        uploadingFiles = true;
        const fileArray = Array.from(files);

        if (import.meta.env.DEV) {
            console.log(
                "[ProjectDrawer] Uploading files:",
                fileArray.map((f) => f.name),
            );
        }

        // Use MinIO for file uploads
        // Upload to projects folder if we have a project ID, otherwise upload without folder
        // Files will be moved to the correct folder when the project is created
        const folder = projectId ? `projects/${projectId}` : undefined;
        const entityId = projectId ?? undefined;
        const newAttachments: Attachment[] = [];

        try {
            // Upload each file
            for (const file of fileArray) {
                const result = await minioService.uploadFile(
                    file,
                    folder,
                    entityId,
                );
                if (result.success) {
                    if (result.value.url) {
                        newAttachments.push({
                            url: result.value.url,
                            name: file.name,
                            size: file.size,
                        });
                    }
                } else {
                    console.error(
                        "[ProjectDrawer] Error uploading file:",
                        result.error,
                    );
                    toastStore.add(
                        `Fout bij uploaden van ${file.name}: ${getUserMessage(result.error)}`,
                        "error",
                    );
                }
            }

            if (newAttachments.length > 0) {
                if (import.meta.env.DEV) {
                    console.log(
                        "[ProjectDrawer] Upload successful, attachments:",
                        newAttachments,
                    );
                }
                attachments = [...attachments, ...newAttachments];
                // Reset FileUpload component to clear its internal selected files
                fileUploadKey += 1;

                // Update project with new attachments if project already exists
                if (projectId) {
                    const bijlagenUrls = (attachments || [])
                        .map((a) => a.url)
                        .filter((url) => url && url.trim() !== "");
                    const updateResult = await projectService.updateProject(
                        projectId,
                        {
                            bijlagen:
                                bijlagenUrls.length > 0 ? bijlagenUrls : null,
                        },
                    );
                    if (updateResult.success) {
                        toastStore.add(
                            `${newAttachments.length} bestand(en) geüpload`,
                            "success",
                        );
                    } else {
                        toastStore.add(
                            getUserMessage(updateResult.error),
                            "error",
                        );
                    }
                } else {
                    // For new projects, just add to local state - will be saved when project is created
                    toastStore.add(
                        `${newAttachments.length} bestand(en) geüpload`,
                        "success",
                    );
                }
            }
        } catch (error) {
            console.error("[ProjectDrawer] Upload failed:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het uploaden",
                "error",
            );
        }

        uploadingFiles = false;
    }

    async function removeAttachment(url: string) {
        attachments = attachments.filter((a) => a.url !== url);

        // Update project with remaining attachments if project already exists
        if (projectId) {
            const bijlagenUrls = (attachments || [])
                .map((a) => a.url)
                .filter((url) => url && url.trim() !== "");
            const updateResult = await projectService.updateProject(projectId, {
                bijlagen: bijlagenUrls.length > 0 ? bijlagenUrls : null,
            });
            if (!updateResult.success) {
                console.error(
                    "[ProjectDrawer] Error removing attachment:",
                    updateResult.error,
                );
                toastStore.add(getUserMessage(updateResult.error), "error");
                // Reload project to restore attachments
                await loadProject(projectId);
            }
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
        <!-- Header -->
        <div class="mb-6 pb-4 border-b border-zinc-200">
            <h2 class="text-2xl font-bold text-zinc-900 font-aspekta">
                {isEditMode
                    ? `Project Bewerken${name ? `: ${name}` : ""}`
                    : "Nieuw Project Aanmaken"}
            </h2>
            <p class="text-zinc-600 text-sm mt-2">
                {isEditMode
                    ? "Wijzig de informatie van dit project."
                    : "Maak een nieuw project aan om werkitems te organiseren."}
            </p>
        </div>

        <!-- Form -->
        <form
            onsubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
            class="flex-1 flex flex-col overflow-hidden"
        >
            <div class="flex-1 overflow-y-auto pb-6">
                {#if error}
                    <div
                        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
                    >
                        {error}
                    </div>
                {/if}

                {#if loading && isEditMode}{:else}
                    <div class="space-y-6">
                        <div>
                            <label
                                for="name"
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Projectnaam <span class="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                bind:value={name}
                                required
                                disabled={loading}
                                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                placeholder="bijv. Website Redesign"
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
                                rows="6"
                                disabled={loading}
                                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                                placeholder="Beschrijf het doel en de scope van dit project..."
                            ></textarea>
                        </div>

                        <!-- Privacy Toggle -->
                        <div>
                            <div class="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="is-private"
                                    bind:checked={isPrivate}
                                    disabled={loading}
                                    class="mt-1 w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div class="flex-1">
                                    <label
                                        for="is-private"
                                        class="block text-sm font-medium text-zinc-900 cursor-pointer"
                                    >
                                        Privé Project
                                    </label>
                                    <p class="text-xs text-zinc-600 mt-1">
                                        Alleen projectleden kunnen taken en
                                        cases van dit project zien en bewerken.
                                        Niet-leden zien items in een
                                        uitgeschakelde staat voor
                                        verantwoording.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Attachments -->
                        <div role="group" aria-label="Bijlagen">
                            <div
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Bijlagen
                            </div>
                            {#key fileUploadKey}
                                <FileUpload
                                    variant="drag-drop"
                                    multiple
                                    onchange={handleFileUpload}
                                    disabled={uploadingFiles || loading}
                                />
                            {/key}

                            {#if attachments.length > 0}
                                <div class="mt-4 space-y-2">
                                    {#each attachments as attachment}
                                        <div
                                            class="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2"
                                        >
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener"
                                                class="flex items-center gap-2 flex-1 min-w-0"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                    class="size-5 text-zinc-400 shrink-0"
                                                >
                                                    <path
                                                        d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z"
                                                    />
                                                </svg>
                                                <div class="flex-1 min-w-0">
                                                    <p
                                                        class="text-sm font-medium text-zinc-900 truncate font-aspekta"
                                                    >
                                                        {attachment.name}
                                                    </p>
                                                    {#if attachment.size !== null}
                                                        <p
                                                            class="text-xs text-zinc-500 font-inter"
                                                        >
                                                            {formatFileSize(
                                                                attachment.size,
                                                            )}
                                                        </p>
                                                    {/if}
                                                </div>
                                            </a>
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    removeAttachment(
                                                        attachment.url,
                                                    )}
                                                disabled={loading}
                                                class="ml-2 rounded-md p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Verwijder bestand"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    class="size-4"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Footer Actions (Fixed) -->
            <div class="flex-shrink-0 pt-4 border-t border-zinc-200 bg-white">
                <div class="flex justify-start gap-3">
                    <Button
                        type="button"
                        onclick={handleSubmit}
                        disabled={loading || uploadingFiles}
                    >
                        {#if loading}
                            <Spinner size="sm" />
                        {:else}
                            {isEditMode
                                ? "Wijzigingen Opslaan"
                                : "Project Aanmaken"}
                        {/if}
                    </Button>
                    <Button
                        variant="secondary"
                        type="button"
                        onclick={handleClose}
                        disabled={loading || uploadingFiles}
                    >
                        Annuleren
                    </Button>
                </div>
            </div>
        </form>
    </div>
</Drawer>
