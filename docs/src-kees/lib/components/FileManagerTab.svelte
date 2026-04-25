<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { navigationStore } from "$lib/stores/navigationStore";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import * as minioService from "$lib/services/minioService";
    import Button from "./Button.svelte";
    import Spinner from "./Spinner.svelte";
    import IconButton from "./IconButton.svelte";
    import Modal from "./Modal.svelte";
    import Drawer from "./Drawer.svelte";
    import Markdown from "./Markdown.svelte";
    import AddShortcutModal from "./AddShortcutModal.svelte";
    import {
        File,
        Trash2,
        Plus,
        ExternalLink,
        FileText,
        BookmarkPlus,
    } from "lucide-svelte";

    interface Props {
        /** Entity type: process, case, task, or project */
        entityType: "process" | "case" | "task" | "project";
        /** Entity ID */
        entityId: number;
        /** Current attachments (array of file URLs) */
        attachments: string[];
        /** Callback when attachments change */
        onAttachmentsChange: (attachments: string[]) => void;
        /** Whether the component is in readonly mode */
        readonly?: boolean;
    }

    let {
        entityType,
        entityId,
        attachments,
        onAttachmentsChange,
        readonly = false,
    }: Props = $props();

    let uploading = $state(false);
    let deleting = $state(false);
    let deleteModalOpen = $state(false);
    let fileToDelete = $state<string | null>(null);
    let fileInput = $state<HTMLInputElement | undefined>(undefined);
    let markdownDrawerOpen = $state(false);
    let markdownContent = $state<string>("");
    let markdownFileName = $state<string>("");
    let loadingMarkdown = $state(false);
    let currentFileUrl = $state<string | null>(null);
    let syncingFromUrl = $state(false);
    let addShortcutModalOpen = $state(false);
    let presignedUrls = $state<Map<string, string>>(new Map());

    // Get file parameter from URL
    const fileParam = $derived($page.url.searchParams.get("file"));

    // Update URL with file parameter
    function updateUrlWithFile(fileUrl: string | null) {
        // Don't update URL if we're currently syncing from URL to avoid loops
        if (syncingFromUrl) return;

        const url = new URL($page.url);
        // Remove existing file parameter
        url.searchParams.delete("file");

        if (fileUrl) {
            // Extract encoded filename from the URL (already encoded, don't decode it)
            try {
                const urlObj = new URL(fileUrl);
                const pathParts = urlObj.pathname.split("/");
                const encodedFilename =
                    pathParts[pathParts.length - 1] || "Bestand";
                // Use the already-encoded filename to avoid double-encoding
                url.searchParams.set("file", encodedFilename);
            } catch {
                // Fallback: use the file URL as-is
                url.searchParams.set("file", fileUrl);
            }
        }

        goto(url.pathname + url.search, { replaceState: true, noScroll: true });
    }

    // Extract file key from URL for deletion
    function getFileKeyFromUrl(url: string): string {
        try {
            // URLs are presigned URLs, we need to extract the key
            // Format: https://endpoint/bucket/key?signature or https://endpoint/bucket/key
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split("/").filter(Boolean); // Remove empty strings

            // Pathname format: /bucket/key or bucket/key
            // We need everything after the bucket name
            if (pathParts.length >= 2) {
                // Remove bucket name (first part), keep the rest as the key
                return pathParts.slice(1).join("/");
            }

            // Fallback: try to extract from full URL string
            // Look for patterns like processes/29/filename or cases/121/filename or projects/1/filename
            const match = url.match(
                /(?:processes|cases|tasks|projects)\/\d+\/[^?]+/,
            );
            return match ? match[0] : pathParts.join("/") || url;
        } catch {
            // If URL parsing fails, try to extract from the URL string
            // Look for patterns like processes/29/filename or cases/121/filename or projects/1/filename
            const match = url.match(
                /(?:processes|cases|tasks|projects)\/\d+\/[^?]+/,
            );
            return match ? match[0] : url;
        }
    }

    // Get folder path for entity
    function getEntityFolder(): string {
        const folderMap = {
            process: "processes",
            case: "cases",
            task: "tasks",
            project: "projects",
        };
        return `${folderMap[entityType]}/${entityId}`;
    }

    async function handleFileUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        uploading = true;
        navigationStore.startPageLoading();

        const folder = getEntityFolder();
        const fileArray = Array.from(files);
        const newUrls: string[] = [];

        try {
            // Upload each file
            for (const file of fileArray) {
                const result = await minioService.uploadFile(
                    file,
                    folder,
                    entityId,
                );
                if (result.success) {
                    newUrls.push(result.value.url!);
                } else {
                    console.error("Error uploading file:", result.error);
                    toastStore.add(
                        `Fout bij uploaden van ${file.name}: ${getUserMessage(result.error)}`,
                        "error",
                    );
                }
            }

            if (newUrls.length > 0) {
                const updatedAttachments = [...attachments, ...newUrls];
                onAttachmentsChange(updatedAttachments);
                toastStore.add(
                    `${newUrls.length} bestand(en) succesvol geüpload`,
                    "success",
                );
            }
        } catch (error) {
            console.error("Error uploading files:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het uploaden",
                "error",
            );
        } finally {
            uploading = false;
            navigationStore.stopPageLoading();
            // Reset file input
            if (fileInput) {
                fileInput.value = "";
            }
        }
    }

    function handleAddFileClick() {
        fileInput?.click();
    }

    function handleFileInputChange(event: Event) {
        const target = event.target as HTMLInputElement;
        handleFileUpload(target.files);
    }

    function handleDeleteClick(url: string) {
        fileToDelete = url;
        deleteModalOpen = true;
    }

    function cancelDelete() {
        deleteModalOpen = false;
        fileToDelete = null;
    }

    async function confirmDelete() {
        if (!fileToDelete) return;

        deleting = true;
        navigationStore.startPageLoading();

        try {
            const fileKey = getFileKeyFromUrl(fileToDelete);
            const result = await minioService.deleteFile(fileKey, entityId);

            if (result.success) {
                const updatedAttachments = attachments.filter(
                    (url) => url !== fileToDelete,
                );
                onAttachmentsChange(updatedAttachments);
                toastStore.add("Bestand succesvol verwijderd", "success");
                deleteModalOpen = false;
                fileToDelete = null;
            } else {
                console.error("Error deleting file:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het verwijderen",
                "error",
            );
        } finally {
            deleting = false;
            navigationStore.stopPageLoading();
        }
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

    function getFileNameFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split("/");
            const filename = pathParts[pathParts.length - 1] || "Bestand";
            // Decode URL-encoded characters (e.g., %20 -> space, %28 -> (, %29 -> ))
            return decodeURIComponent(filename);
        } catch {
            // Fallback: extract filename from URL string
            const match = url.match(/([^/]+)(?:\?|$)/);
            if (match) {
                try {
                    return decodeURIComponent(match[1]);
                } catch {
                    return match[1];
                }
            }
            return "Bestand";
        }
    }

    // Get encoded filename for URL (to avoid double encoding)
    function getEncodedFileName(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split("/");
            const filename = pathParts[pathParts.length - 1] || "Bestand";
            // Return filename as-is (already URL-encoded from storage)
            return filename;
        } catch {
            // Fallback: extract filename from URL string
            const match = url.match(/([^/]+)(?:\?|$)/);
            return match ? match[1] : "Bestand";
        }
    }

    async function openFile(fileKey: string) {
        // Generate fresh presigned URL to avoid expiration errors
        const presignedUrl = await minioService.getPresignedUrlForFile(fileKey);
        window.open(presignedUrl, "_blank");
    }

    // Check if file is a markdown file
    function isMarkdownFile(url: string): boolean {
        const filename = getFileNameFromUrl(url).toLowerCase();
        return filename.endsWith(".md") || filename.endsWith(".markdown");
    }

    // Open markdown file in drawer
    async function openMarkdownFile(fileKey: string) {
        const filename = getFileNameFromUrl(fileKey);
        currentFileUrl = fileKey;
        markdownFileName = filename;
        markdownDrawerOpen = true;
        loadingMarkdown = true;
        markdownContent = "";

        // Update URL with file parameter (pass full file URL to extract encoded filename)
        updateUrlWithFile(fileKey);

        try {
            // Generate fresh presigned URL to avoid expiration errors
            const presignedUrl =
                await minioService.getPresignedUrlForFile(fileKey);
            const response = await fetch(presignedUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }
            const text = await response.text();
            markdownContent = text;
        } catch (error) {
            console.error("Error fetching markdown file:", error);
            toastStore.add("Fout bij laden van markdown bestand", "error");
            markdownContent = "Fout bij laden van bestand.";
        } finally {
            loadingMarkdown = false;
        }
    }

    // Get presigned URL for display (cached for performance)
    async function getPresignedUrl(fileKey: string): Promise<string> {
        // Check if we already have a cached URL (less than 50 minutes old)
        const cachedUrl = presignedUrls.get(fileKey);
        if (cachedUrl) {
            return cachedUrl;
        }

        // Generate fresh presigned URL
        const presignedUrl = await minioService.getPresignedUrlForFile(fileKey);

        // Cache it
        presignedUrls = new Map(presignedUrls).set(fileKey, presignedUrl);

        return presignedUrl;
    }

    // Clear presigned URL cache when attachments change
    $effect(() => {
        // Clear cache when attachments array changes
        presignedUrls = new Map();
    });

    function closeMarkdownDrawer() {
        markdownDrawerOpen = false;
        markdownContent = "";
        markdownFileName = "";
        currentFileUrl = null;
        // Remove file parameter from URL
        updateUrlWithFile(null);
    }

    // Auto-open file when URL parameter is present
    $effect(() => {
        const fileFromUrl = fileParam;

        // If no file parameter and drawer is open, close it
        if (!fileFromUrl) {
            if (markdownDrawerOpen) {
                syncingFromUrl = true;
                markdownDrawerOpen = false;
                markdownContent = "";
                markdownFileName = "";
                currentFileUrl = null;
                setTimeout(() => {
                    syncingFromUrl = false;
                }, 100);
            }
            return;
        }

        // Find file in attachments that matches filename
        const matchingFile = attachments.find((url) => {
            const filename = getFileNameFromUrl(url);
            return (
                filename === fileFromUrl ||
                decodeURIComponent(filename) === decodeURIComponent(fileFromUrl)
            );
        });

        if (matchingFile) {
            // Only open if it's a markdown file and not already the current file
            if (
                isMarkdownFile(matchingFile) &&
                matchingFile !== currentFileUrl
            ) {
                syncingFromUrl = true;
                openMarkdownFile(matchingFile!);
                setTimeout(() => {
                    syncingFromUrl = false;
                }, 100);
            }
        } else if (markdownDrawerOpen && currentFileUrl) {
            // If file from URL doesn't exist in attachments, close drawer
            const currentFilename = getFileNameFromUrl(currentFileUrl);
            if (currentFilename !== fileFromUrl) {
                syncingFromUrl = true;
                closeMarkdownDrawer();
                setTimeout(() => {
                    syncingFromUrl = false;
                }, 100);
            }
        }
    });
</script>

<div class="space-y-4">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-zinc-900 font-aspekta">
            Bestanden ({attachments.length})
        </h3>
        {#if !readonly}
            <div class="flex items-center gap-2">
                {#if uploading}
                    <div class="flex items-center gap-2 text-sm text-zinc-600">
                        <Spinner size="sm" />
                        <span>Uploaden...</span>
                    </div>
                {/if}
                <input
                    bind:this={fileInput}
                    type="file"
                    multiple
                    class="sr-only"
                    onchange={handleFileInputChange}
                    disabled={uploading || deleting}
                />
                <IconButton
                    icon={Plus}
                    variant="default"
                    size="default"
                    onclick={handleAddFileClick}
                    disabled={uploading || deleting}
                    tooltip="Bestand toevoegen"
                />
            </div>
        {/if}
    </div>

    <!-- Files List Section -->
    <div>
        {#if attachments.length === 0}
            <div class="text-center py-12 text-zinc-500 font-inter">
                <p class="text-sm">Nog geen bestanden geüpload</p>
            </div>
        {:else}
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
                                Type
                            </th>
                            <th
                                class="px-4 py-3 text-right text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta"
                            >
                                Acties
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-zinc-200">
                        {#each attachments as fileKey (fileKey)}
                            {@const filename = getFileNameFromUrl(fileKey)}
                            {@const isMarkdown = isMarkdownFile(fileKey)}
                            <tr class="hover:bg-zinc-50">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <File class="w-5 h-5 text-zinc-400" />
                                        <button
                                            onclick={() => openFile(fileKey)}
                                            class="text-sm font-medium text-blue-600 hover:text-blue-800 font-inter"
                                            title="Bestand openen"
                                        >
                                            {filename}
                                        </button>
                                        {#if isMarkdown}
                                            <button
                                                onclick={() =>
                                                    openMarkdownFile(fileKey)}
                                                class="text-xs text-zinc-500 hover:text-zinc-700 font-inter flex items-center gap-1 underline"
                                                title="Markdown bekijken"
                                            >
                                                <FileText class="w-3 h-3" />
                                                Bekijk
                                            </button>
                                        {/if}
                                    </div>
                                </td>
                                <td
                                    class="px-4 py-3 text-sm text-zinc-600 font-inter"
                                >
                                    {filename.split(".").pop()?.toUpperCase() ||
                                        "-"}
                                </td>
                                <td class="px-4 py-3">
                                    <div
                                        class="flex items-center justify-end gap-1"
                                    >
                                        <IconButton
                                            icon={ExternalLink}
                                            variant="ghost"
                                            size="sm"
                                            onclick={() => openFile(fileKey)}
                                            tooltip="Bestand openen"
                                        />
                                        {#if !readonly}
                                            <IconButton
                                                icon={Trash2}
                                                variant="ghost"
                                                size="sm"
                                                onclick={() =>
                                                    handleDeleteClick(fileKey)}
                                                tooltip="Bestand verwijderen"
                                                disabled={deleting}
                                            />
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="Bestand verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u het bestand "{fileToDelete
                ? getFileNameFromUrl(fileToDelete)
                : ""}" wilt verwijderen?
        </p>
        <p class="text-sm text-zinc-500">
            Deze actie kan niet ongedaan worden gemaakt.
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

<!-- Markdown Viewer Drawer -->
<Drawer
    bind:open={markdownDrawerOpen}
    position="right"
    class="w-[70vw]"
    onclose={closeMarkdownDrawer}
>
    <div class="h-full flex flex-col">
        <!-- Header -->
        <div
            class="flex items-center justify-between pb-4 border-b border-zinc-200 mb-4"
        >
            <h2 class="text-xl font-semibold text-zinc-900 font-aspekta">
                {markdownFileName}
            </h2>
            <IconButton
                icon={BookmarkPlus}
                variant="ghost"
                tooltip="Snelkoppeling toevoegen"
                tooltipPosition="left"
                onclick={() => (addShortcutModalOpen = true)}
            />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            {#if loadingMarkdown}
                <div class="flex items-center justify-center py-12">
                    <Spinner size="sm" />
                </div>
            {:else if markdownContent}
                <div class="prose prose-zinc max-w-none">
                    <Markdown content={markdownContent} />
                </div>
            {:else}
                <div class="text-center py-12 text-zinc-500 font-inter">
                    <p>Geen inhoud beschikbaar</p>
                </div>
            {/if}
        </div>
    </div>
</Drawer>

<!-- Add Shortcut Modal -->
<Modal
    bind:open={addShortcutModalOpen}
    title="Snelkoppeling toevoegen"
    size="md"
>
    <AddShortcutModal
        pageTitle={markdownFileName || "Markdown bestand"}
        currentUrl={$page.url.pathname + $page.url.search}
        onclose={() => (addShortcutModalOpen = false)}
    />
</Modal>
