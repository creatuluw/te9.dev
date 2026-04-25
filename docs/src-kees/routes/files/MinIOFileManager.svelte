<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { navigationStore } from "$lib/stores/navigationStore";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { MinIOFile, MinIOFolder } from "$lib/services/minioService";
    import * as minioService from "$lib/services/minioService";
    import * as caseService from "$lib/services/caseService";
    import * as processService from "$lib/services/processService";
    import { getRowByIdResult } from "$lib/utils/postgrest";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import {
        Folder,
        File,
        Trash2,
        Plus,
        Download,
        ExternalLink,
    } from "lucide-svelte";

    let { key, onFolderSelect } = $props<{
        key?: string;
        onFolderSelect?: (folderName: string) => void;
    }>();

    let files = $state<MinIOFile[]>([]);
    let folders = $state<MinIOFolder[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let creatingFolder = $state(false);
    let newFolderName = $state("");
    let currentPrefix = $state<string>("");
    let entityNames = $state<Map<string, string>>(new Map());
    let entityNamesVersion = $state(0); // Version counter to trigger reactivity

    // Delete modal state
    let deleteModalOpen = $state(false);
    let deleting = $state(false);
    let itemToDelete = $state<{
        key: string;
        name: string;
        type: "file" | "folder";
    } | null>(null);

    // Get current path from URL params
    function getPathFromUrl(): string {
        return $page.url.searchParams.get("path") || "";
    }

    // Update URL with path parameter
    function updateUrlPath(path: string) {
        if (typeof window === "undefined") return;
        urlSyncing = true;

        // Manually construct query string to avoid encoding slashes
        const existingParams = new URLSearchParams($page.url.search);
        existingParams.delete("path"); // Remove existing path param

        // Build new query string
        const params: string[] = [];

        // Add path param without encoding slashes
        if (path) {
            params.push(`path=${path}`);
        }

        // Add other existing params (like 'tab')
        existingParams.forEach((value, key) => {
            if (key !== "path") {
                params.push(`${key}=${encodeURIComponent(value)}`);
            }
        });

        const queryString = params.length > 0 ? `?${params.join("&")}` : "";
        const newUrl = `${$page.url.pathname}${queryString}`;

        goto(newUrl, { replaceState: true, noScroll: true });
        setTimeout(() => {
            urlSyncing = false;
        }, 100);
    }

    // Parse entity type and ID from folder path
    function parseEntityFromPath(path: string): {
        type: "process" | "case" | "task" | null;
        id: number | null;
    } {
        if (!path) return { type: null, id: null };

        const parts = path.split("/").filter(Boolean);
        if (parts.length === 0) return { type: null, id: null };

        const firstPart = parts[0].toLowerCase();
        if (firstPart === "processes" || firstPart === "process") {
            if (parts.length > 1) {
                const id = parseInt(parts[1]);
                if (!isNaN(id)) return { type: "process", id };
            }
        } else if (firstPart === "cases" || firstPart === "case") {
            if (parts.length > 1) {
                const id = parseInt(parts[1]);
                if (!isNaN(id)) return { type: "case", id };
            }
        } else if (firstPart === "tasks" || firstPart === "task") {
            if (parts.length > 1) {
                const id = parseInt(parts[1]);
                if (!isNaN(id)) return { type: "task", id };
            }
        }

        // Check if folder name itself is a numeric ID (e.g., "121")
        const folderName = parts[parts.length - 1];
        const numericId = parseInt(folderName);
        if (!isNaN(numericId) && parts.length === 1) {
            // Single numeric folder - could be case ID (most common)
            return { type: "case", id: numericId };
        }

        return { type: null, id: null };
    }

    // Fetch entity name by type and ID
    async function fetchEntityName(
        type: "process" | "case" | "task",
        id: number,
    ): Promise<string | null> {
        const cacheKey = `${type}_${id}`;
        if (entityNames.has(cacheKey)) {
            return entityNames.get(cacheKey) || null;
        }

        try {
            if (type === "process") {
                const result = await processService.getProcessById(id);
                if (result.success) {
                    const name = result.value.process.name;
                    entityNames.set(cacheKey, name);
                    entityNamesVersion++; // Trigger reactivity
                    return name;
                }
            } else if (type === "case") {
                const result = await caseService.getCaseById(id);
                if (result.success) {
                    const name = result.value.case.name;
                    entityNames.set(cacheKey, name);
                    entityNamesVersion++; // Trigger reactivity
                    return name;
                }
            } else if (type === "task") {
                const result = await getRowByIdResult<any>("_bpm_tasks", id);
                if (result.success) {
                    // Try to get name from process task if it's a process task
                    if (result.value.task_id) {
                        const processTaskResult = await getRowByIdResult<any>(
                            "_bpm_process_tasks",
                            result.value.task_id,
                        );
                        if (
                            processTaskResult.success &&
                            processTaskResult.value.name
                        ) {
                            const name = processTaskResult.value.name;
                            entityNames.set(cacheKey, name);
                            entityNamesVersion++; // Trigger reactivity
                            return name;
                        }
                    }
                    // Fallback to work item name
                    if (result.value.name) {
                        const name = result.value.name;
                        entityNames.set(cacheKey, name);
                        entityNamesVersion++; // Trigger reactivity
                        return name;
                    }
                }
            }
        } catch (err) {
            console.error(`Error fetching ${type} name for ID ${id}:`, err);
        }

        return null;
    }

    // Load entity names for all folders
    async function loadEntityNames() {
        const promises = folders.map(async (folder) => {
            const entityInfo = parseEntityFromPath(folder.prefix);
            if (entityInfo.type && entityInfo.id) {
                await fetchEntityName(entityInfo.type, entityInfo.id);
            }
        });
        await Promise.all(promises);
        // Trigger final reactivity update after all names are loaded
        entityNamesVersion++;
    }

    // Get display name for folder (reactive to entityNamesVersion)
    function getFolderDisplayName(folder: MinIOFolder): string {
        // Reference entityNamesVersion to trigger reactivity when names are loaded
        const _ = entityNamesVersion;

        const entityInfo = parseEntityFromPath(folder.prefix);
        if (entityInfo.type && entityInfo.id) {
            const cacheKey = `${entityInfo.type}_${entityInfo.id}`;
            const entityName = entityNames.get(cacheKey);
            if (entityName) {
                return `${folder.name} - ${entityName}`;
            }
        }
        return folder.name;
    }

    let urlSyncing = $state(false);

    onMount(() => {
        const pathFromUrl = getPathFromUrl();
        currentPrefix = pathFromUrl;
        // Add trailing slash for MinIO API if path exists
        const prefixForApi = pathFromUrl ? pathFromUrl + "/" : undefined;
        loadData(prefixForApi);
    });

    // Reload when key changes (triggered from parent)
    $effect(() => {
        if (key) {
            const pathFromUrl = getPathFromUrl();
            if (pathFromUrl !== currentPrefix) {
                currentPrefix = pathFromUrl;
                // Add trailing slash for MinIO API if path exists
                const prefixForApi = pathFromUrl
                    ? pathFromUrl + "/"
                    : undefined;
                loadData(prefixForApi);
            }
        }
    });

    // Sync URL when currentPrefix changes (but avoid loops)
    $effect(() => {
        if (!urlSyncing) {
            const urlPath = $page.url.searchParams.get("path") || "";
            if (urlPath !== currentPrefix) {
                urlSyncing = true;
                updateUrlPath(currentPrefix);
                // Reset flag after a short delay
                setTimeout(() => {
                    urlSyncing = false;
                }, 100);
            }
        }
    });

    // Watch for URL changes (browser back/forward) - reactive to page store
    $effect(() => {
        const pathFromUrl = $page.url.searchParams.get("path") || "";
        if (pathFromUrl !== currentPrefix && !urlSyncing) {
            currentPrefix = pathFromUrl;
            // Add trailing slash for MinIO API if path exists
            const prefixForApi = pathFromUrl ? pathFromUrl + "/" : undefined;
            loadData(prefixForApi);
        }
    });

    async function loadData(prefix?: string) {
        loading = true;
        error = null;
        navigationStore.startPageLoading();

        try {
            const result = await minioService.listFiles(prefix);

            if (result.success) {
                files = result.value.files;
                folders = result.value.folders;
                // Store prefix without trailing slash for URL consistency
                currentPrefix = prefix ? prefix.replace(/\/$/, "") : "";

                // Load entity names for folders
                await loadEntityNames();
            } else {
                console.error("❌ Error loading MinIO files:", result.error);
                error = getUserMessage(result.error);
                toastStore.add(error, "error");
            }
        } catch (err) {
            error = "Er is een fout opgetreden bij het laden van bestanden";
            toastStore.add(error, "error");
        } finally {
            loading = false;
            navigationStore.stopPageLoading();
        }
    }

    function handleDeleteClick(
        key: string,
        name: string,
        type: "file" | "folder",
    ) {
        itemToDelete = { key, name, type };
        deleteModalOpen = true;
    }

    function cancelDelete() {
        deleteModalOpen = false;
        itemToDelete = null;
    }

    async function confirmDelete() {
        if (!itemToDelete) return;

        deleting = true;
        navigationStore.startPageLoading();

        console.log("🗑️ Attempting to delete:", itemToDelete);

        const result = await minioService.deleteFile(itemToDelete.key);

        console.log("🗑️ Delete result:", result);

        navigationStore.stopPageLoading();

        if (result.success) {
            toastStore.add("Succesvol verwijderd uit MinIO", "success");
            loadData(currentPrefix || undefined); // Refresh the data
            deleteModalOpen = false;
            itemToDelete = null;
        } else {
            console.error("❌ Delete failed:", result.error);
            toastStore.add(getUserMessage(result.error), "error");
        }

        deleting = false;
    }

    async function handleCreateFolder() {
        if (!newFolderName.trim()) {
            toastStore.add("Voer een mapnaam in", "error");
            return;
        }

        const folderName = currentPrefix
            ? `${currentPrefix}${newFolderName.trim()}`
            : newFolderName.trim();

        navigationStore.startPageLoading();
        const result = await minioService.createFolder(folderName);
        navigationStore.stopPageLoading();

        if (result.success) {
            toastStore.add("Map succesvol aangemaakt in MinIO", "success");
            newFolderName = "";
            creatingFolder = false;
            loadData(currentPrefix || undefined); // Refresh the data
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    function navigateToFolder(folderPrefix: string) {
        // Ensure folderPrefix has trailing slash for MinIO API
        const prefixForApi = folderPrefix.endsWith("/")
            ? folderPrefix
            : folderPrefix + "/";
        // Store without trailing slash for URL
        currentPrefix = folderPrefix.replace(/\/$/, "");
        updateUrlPath(currentPrefix);
        loadData(prefixForApi);
    }

    function navigateUp() {
        if (!currentPrefix) {
            currentPrefix = "";
            updateUrlPath("");
            loadData();
            return;
        }

        const parts = currentPrefix.split("/").filter(Boolean);
        parts.pop(); // Remove last part
        const newPrefix = parts.length > 0 ? parts.join("/") : "";
        currentPrefix = newPrefix;
        updateUrlPath(newPrefix);
        // Add trailing slash for MinIO API if path exists
        const prefixForApi = newPrefix ? newPrefix + "/" : undefined;
        loadData(prefixForApi);
    }

    function formatFileSize(bytes?: number): string {
        if (!bytes) return "-";
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
        );
    }

    function formatDate(date?: Date): string {
        if (!date) return "-";
        try {
            return date.toLocaleDateString("nl-NL", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return date.toString();
        }
    }

    function openFile(file: MinIOFile) {
        if (file.url) {
            window.open(file.url, "_blank");
        }
    }

    function getBreadcrumbs(): Array<{
        name: string;
        path: string;
        displayName: string;
    }> {
        // Reference entityNamesVersion to trigger reactivity when names are loaded
        const _ = entityNamesVersion;

        if (!currentPrefix) return [];
        const parts = currentPrefix.split("/").filter(Boolean);
        return parts.map((part, index) => {
            const path = parts.slice(0, index + 1).join("/");
            const entityInfo = parseEntityFromPath(path);
            let displayName = part;

            if (entityInfo.type && entityInfo.id) {
                const cacheKey = `${entityInfo.type}_${entityInfo.id}`;
                const entityName = entityNames.get(cacheKey);
                if (entityName) {
                    displayName = `${part} - ${entityName}`;
                }
            }

            return {
                name: part,
                path,
                displayName,
            };
        });
    }

    function navigateToBreadcrumb(path: string) {
        currentPrefix = path;
        updateUrlPath(path);
        // Add trailing slash for MinIO API if path exists
        const prefixForApi = path ? path + "/" : undefined;
        loadData(prefixForApi);
    }
</script>

<div class="space-y-4">
    <!-- Breadcrumb Navigation -->
    {#if currentPrefix}
        <div class="flex items-center gap-2">
            <button
                onclick={() => {
                    currentPrefix = "";
                    updateUrlPath("");
                    loadData();
                }}
                class="text-sm text-zinc-600 hover:text-zinc-900 font-inter"
            >
                Root
            </button>
            {#each getBreadcrumbs() as crumb}
                <span class="text-zinc-400">/</span>
                <button
                    onclick={() => navigateToBreadcrumb(crumb.path)}
                    class="text-sm text-zinc-600 hover:text-zinc-900 font-inter"
                >
                    {crumb.displayName}
                </button>
            {/each}
        </div>
    {/if}

    <!-- Action Buttons -->
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium text-zinc-900 font-aspekta">
            MinIO Bestanden & Mappen
        </h3>
        <div class="flex gap-2">
            {#if currentPrefix}
                <Button variant="ghost" size="sm" onclick={navigateUp}>
                    ← Terug
                </Button>
            {/if}
            <Button
                variant="outline"
                size="sm"
                onclick={() => (creatingFolder = true)}
            >
                <Plus class="w-4 h-4 mr-2" /> Nieuwe Map
            </Button>
            <Button
                variant="outline"
                size="sm"
                onclick={() => loadData(currentPrefix || undefined)}
            >
                Vernieuwen
            </Button>
        </div>
    </div>

    {#if creatingFolder}
        <div
            class="flex gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200"
        >
            <input
                type="text"
                bind:value={newFolderName}
                placeholder="Mapnaam"
                class="flex-1 rounded-sm border border-zinc-300 px-3 py-2 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        handleCreateFolder();
                    } else if (e.key === "Escape") {
                        creatingFolder = false;
                        newFolderName = "";
                    }
                }}
                autofocus
            />
            <Button
                variant="default"
                size="sm"
                onclick={handleCreateFolder}
                disabled={!newFolderName.trim()}
            >
                Aanmaken
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onclick={() => {
                    creatingFolder = false;
                    newFolderName = "";
                }}
            >
                Annuleren
            </Button>
        </div>
    {/if}

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Spinner size="md" class="mr-2" /> Bestanden laden van MinIO...
        </div>
    {:else if error}
        <div class="text-center py-12 text-red-600 font-inter">
            {error}
        </div>
    {:else if folders.length === 0 && files.length === 0}
        <div class="text-center py-12 text-zinc-500 font-inter">
            Geen bestanden of mappen gevonden in MinIO
        </div>
    {:else}
        <!-- Folders Section -->
        {#if folders.length > 0}
            <div class="space-y-2">
                <h4 class="text-sm font-medium text-zinc-700 font-aspekta">
                    Mappen ({folders.length})
                </h4>
                <div class="border border-zinc-200 rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-zinc-200">
                        <thead class="bg-zinc-50">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                                >
                                    Naam
                                </th>
                                <th
                                    class="px-4 py-3 text-right text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                                >
                                    Acties
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-zinc-200">
                            {#each folders as folder (folder.prefix)}
                                <tr class="hover:bg-zinc-50">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <Folder
                                                class="w-5 h-5 text-blue-500"
                                            />
                                            <button
                                                onclick={() =>
                                                    navigateToFolder(
                                                        folder.prefix,
                                                    )}
                                                class="text-sm font-medium text-zinc-900 hover:text-zinc-700 font-inter"
                                            >
                                                {getFolderDisplayName(folder)}
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div
                                            class="flex items-center justify-end gap-1"
                                        >
                                            {#if onFolderSelect}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onclick={() =>
                                                        onFolderSelect?.(
                                                            folder.name,
                                                        )}
                                                    class="text-xs px-2 py-1"
                                                >
                                                    Selecteer
                                                </Button>
                                            {/if}
                                            <IconButton
                                                icon={Trash2}
                                                variant="ghost"
                                                size="sm"
                                                onclick={() =>
                                                    handleDeleteClick(
                                                        folder.prefix,
                                                        folder.name,
                                                        "folder",
                                                    )}
                                                tooltip="Map verwijderen"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}

        <!-- Files Section -->
        {#if files.length > 0}
            <div class="space-y-2">
                <h4 class="text-sm font-medium text-zinc-700 font-aspekta">
                    Bestanden ({files.length})
                </h4>
                <div class="border border-zinc-200 rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-zinc-200">
                        <thead class="bg-zinc-50">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                                >
                                    Naam
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                                >
                                    Grootte
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                                >
                                    Type
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                                >
                                    Gewijzigd
                                </th>
                                <th
                                    class="px-4 py-3 text-right text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                                >
                                    Acties
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-zinc-200">
                            {#each files as file (file.key)}
                                <tr class="hover:bg-zinc-50">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <File
                                                class="w-5 h-5 text-zinc-400"
                                            />
                                            <button
                                                onclick={() => openFile(file)}
                                                class="text-sm font-medium text-blue-600 hover:text-blue-800 font-inter"
                                                title="Bestand openen"
                                            >
                                                {file.name}
                                            </button>
                                        </div>
                                    </td>
                                    <td
                                        class="px-4 py-3 text-sm text-zinc-600 font-inter"
                                    >
                                        {formatFileSize(file.size)}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-sm text-zinc-600 font-inter"
                                    >
                                        {file.contentType || "-"}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-sm text-zinc-600 font-inter"
                                    >
                                        {formatDate(file.lastModified)}
                                    </td>
                                    <td class="px-4 py-3">
                                        <div
                                            class="flex items-center justify-end gap-1"
                                        >
                                            {#if file.url}
                                                <IconButton
                                                    icon={ExternalLink}
                                                    variant="ghost"
                                                    size="sm"
                                                    onclick={() =>
                                                        openFile(file)}
                                                    tooltip="Bestand openen"
                                                />
                                            {/if}
                                            <IconButton
                                                icon={Trash2}
                                                variant="ghost"
                                                size="sm"
                                                onclick={() =>
                                                    handleDeleteClick(
                                                        file.key,
                                                        file.name,
                                                        "file",
                                                    )}
                                                tooltip="Bestand verwijderen"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}
    {/if}
</div>

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="{itemToDelete?.type === 'folder' ? 'Map' : 'Bestand'} verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u {itemToDelete?.type === "folder"
                ? "de map"
                : "het bestand"} "{itemToDelete?.name}" wilt verwijderen uit
            MinIO?
        </p>
        {#if itemToDelete?.type === "folder"}
            <p class="text-sm text-zinc-500">
                Deze actie kan niet ongedaan worden gemaakt. Alle bestanden in
                deze map worden ook verwijderd.
            </p>
        {:else}
            <p class="text-sm text-zinc-500">
                Deze actie kan niet ongedaan worden gemaakt.
            </p>
        {/if}
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
