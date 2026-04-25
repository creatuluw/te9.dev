<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { navigationStore } from "$lib/stores/navigationStore";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import Tabs, { type TabItem } from "$lib/components/Tabs.svelte";
    import FileUpload from "$lib/components/FileUpload.svelte";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import { Plus } from "lucide-svelte";
    import * as minioService from "$lib/services/minioService";
    import type { MinIOFolder } from "$lib/services/minioService";
    import MinIOFileManager from "./MinIOFileManager.svelte";

    const tabs: TabItem[] = [
        { id: "files", label: "Bestanden" },
        { id: "upload", label: "Upload" },
    ];

    let activeTab = $state("files");
    let selectedFolder = $state<string | null>(null); // MinIO folder prefix
    let folderOptions = $state<SelectOption[]>([]);
    let loadingFolders = $state(false);
    let addFolderModalOpen = $state(false);
    let newFolderName = $state("");
    let creatingFolder = $state(false);
    let folderError = $state<string | null>(null);
    let uploading = $state(false);
    let files = $state<File[]>([]);

    // Load folders for dropdown
    async function loadFolders() {
        loadingFolders = true;
        try {
            const result = await minioService.listFiles();
            if (result.success) {
                // Convert folders to Select options
                const options: SelectOption[] = [
                    { value: "", label: "Root (geen map)" },
                ];

                result.value.folders.forEach((folder) => {
                    options.push({
                        value: folder.prefix.replace(/\/$/, ""), // Remove trailing slash
                        label: folder.name,
                    });
                });

                folderOptions = options;
            } else {
                console.error("Error loading folders:", result.error);
            }
        } catch (err) {
            console.error("Error loading folders:", err);
        } finally {
            loadingFolders = false;
        }
    }

    // Initialize tab from URL on mount
    onMount(() => {
        const urlTab = $page.url.searchParams.get("tab");
        if (urlTab && ["upload", "files"].includes(urlTab)) {
            activeTab = urlTab;
        } else {
            // Default to 'files' if no tab specified
            activeTab = "files";
        }

        // Load folders when upload tab is active
        if (activeTab === "upload") {
            loadFolders();
        }
    });

    // Reload folders when switching to upload tab
    $effect(() => {
        if (activeTab === "upload" && folderOptions.length === 0) {
            loadFolders();
        }
    });

    // Update URL when tab changes
    $effect(() => {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (activeTab !== "files") {
                // Only add tab param if not the default 'files' tab
                url.searchParams.set("tab", activeTab);
            } else {
                // Remove tab param for default 'files' tab
                url.searchParams.delete("tab");
            }
            goto(url.pathname + url.search, {
                replaceState: true,
                noScroll: true,
            });
        }
    });

    async function handleFileSelect(selectedFiles: FileList | null) {
        if (!selectedFiles || selectedFiles.length === 0) return;
        files = Array.from(selectedFiles);
    }

    async function handleUpload() {
        if (files.length === 0) {
            toastStore.add("Selecteer eerst bestanden om te uploaden", "error");
            return;
        }

        uploading = true;
        navigationStore.startPageLoading();

        try {
            const folderForUpload =
                selectedFolder && selectedFolder !== ""
                    ? selectedFolder
                    : undefined;
            const uploadPromises = files.map((file) =>
                minioService.uploadFile(file, folderForUpload),
            );

            const results = await Promise.all(uploadPromises);
            const errors = results.filter((r) => !r.success);
            const successes = results.filter((r) => r.success);

            if (successes.length > 0) {
                toastStore.add(
                    `${successes.length} bestand(en) succesvol geüpload naar MinIO`,
                    "success",
                );
                files = [];
                // Refresh file manager if it's active
                if (activeTab === "files") {
                    // MinIOFileManager will handle refresh via key change
                }
            }

            if (errors.length > 0) {
                errors.forEach((error) => {
                    if (!error.success) {
                        // Show more detailed error message
                        const errorMsg =
                            error.error.message || getUserMessage(error.error);
                        console.error("MinIO upload error:", error.error);
                        toastStore.add(errorMsg, "error");
                    }
                });
            }
        } catch (error) {
            toastStore.add(
                "Er is een fout opgetreden bij het uploaden naar MinIO",
                "error",
            );
        } finally {
            uploading = false;
            navigationStore.stopPageLoading();
        }
    }

    function handleOpenAddFolderModal() {
        newFolderName = "";
        folderError = null;
        addFolderModalOpen = true;
    }

    function handleCloseAddFolderModal() {
        addFolderModalOpen = false;
        newFolderName = "";
        folderError = null;
    }

    async function handleCreateFolder() {
        if (!newFolderName || !newFolderName.trim()) {
            folderError = "Voer een mapnaam in";
            return;
        }

        creatingFolder = true;
        folderError = null;
        navigationStore.startPageLoading();

        const result = await minioService.createFolder(newFolderName.trim());
        navigationStore.stopPageLoading();

        if (result.success) {
            toastStore.add("Map succesvol aangemaakt in MinIO", "success");
            // Reload folders to include the new one
            await loadFolders();
            // Set the newly created folder as selected
            selectedFolder = result.value.name;
            handleCloseAddFolderModal();
        } else {
            folderError = getUserMessage(result.error);
        }

        creatingFolder = false;
    }

    function handleTabChange(tabId: string) {
        activeTab = tabId;
    }

    function handleFolderSelect(folderPath: string) {
        selectedFolder = folderPath;
        activeTab = "upload";
        toastStore.add(
            `Map "${folderPath}" geselecteerd voor upload`,
            "success",
        );
        // Reload folders when switching to upload tab
        loadFolders();
    }

    function handleFolderChange(value: string | string[] | null) {
        selectedFolder = typeof value === "string" ? value : null;
    }
</script>

<svelte:head>
    <title>Bestanden Beheer - Business Process Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-zinc-900 font-aspekta">
            Bestanden Beheer
        </h1>
        <p class="text-sm text-zinc-600 mt-1 font-inter">
            Upload en beheer bestanden in uw opslag
        </p>
    </div>

    <Tabs
        {tabs}
        {activeTab}
        ontabchange={handleTabChange}
        class="flex-1 flex flex-col min-h-0"
    >
        {#snippet children({ activeTab })}
            {#if activeTab === "upload"}
                <div class="space-y-6">
                    <!-- Folder Selection -->
                    <div class="space-y-2">
                        <label
                            for="folder-select"
                            class="block text-sm font-medium text-zinc-900 font-aspekta"
                        >
                            Map (optioneel)
                        </label>
                        <div class="flex gap-2 items-start">
                            <div class="flex-1">
                                <Select
                                    options={folderOptions}
                                    bind:value={selectedFolder}
                                    placeholder="Selecteer een map..."
                                    loading={loadingFolders}
                                    onchange={handleFolderChange}
                                    class="w-full"
                                />
                            </div>
                            <IconButton
                                icon={Plus}
                                variant="ghost"
                                size="default"
                                tooltip="Nieuwe map toevoegen"
                                tooltipPosition="left"
                                onclick={handleOpenAddFolderModal}
                            />
                        </div>
                        <p class="text-xs text-zinc-500 font-inter">
                            Bestanden worden geüpload naar MinIO. Selecteer een
                            map of laat leeg voor de hoofdmap.
                        </p>
                    </div>

                    <!-- File Upload -->
                    <div class="space-y-4">
                        <FileUpload
                            variant="drag-drop"
                            multiple={true}
                            label="Selecteer bestanden"
                            description="Sleep bestanden hierheen of klik om te selecteren"
                            onchange={handleFileSelect}
                        />

                        {#if files.length > 0}
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <p
                                        class="text-sm font-medium text-zinc-900 font-aspekta"
                                    >
                                        {files.length} bestand(en) geselecteerd
                                    </p>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onclick={handleUpload}
                                        disabled={uploading}
                                    >
                                        {#if uploading}
                                            <Spinner size="sm" class="mr-2" />
                                            Uploaden...
                                        {:else}
                                            Uploaden
                                        {/if}
                                    </Button>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {:else if activeTab === "files"}
                <MinIOFileManager
                    key={activeTab}
                    onFolderSelect={handleFolderSelect}
                />
            {/if}
        {/snippet}
    </Tabs>
</div>

<!-- Add Folder Modal -->
<Modal
    bind:open={addFolderModalOpen}
    title="Nieuwe Map Aanmaken"
    size="md"
    onclose={handleCloseAddFolderModal}
>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleCreateFolder();
        }}
        class="space-y-4"
    >
        {#if folderError}
            <div
                class="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
            >
                {folderError}
            </div>
        {/if}

        <div>
            <label
                for="folder-name"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Mapnaam <span class="text-red-500">*</span>
            </label>
            <input
                id="folder-name"
                type="text"
                bind:value={newFolderName}
                required
                disabled={creatingFolder}
                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm"
                placeholder="bijv. documents"
                autofocus
            />
        </div>

        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                type="button"
                variant="secondary"
                onclick={handleCloseAddFolderModal}
                disabled={creatingFolder}
            >
                Annuleren
            </Button>
            <Button
                type="submit"
                disabled={creatingFolder || !newFolderName.trim()}
            >
                {#if creatingFolder}
                    <Spinner size="sm" class="mr-2" />
                    Aanmaken...
                {:else}
                    Aanmaken
                {/if}
            </Button>
        </div>
    </form>
</Modal>
