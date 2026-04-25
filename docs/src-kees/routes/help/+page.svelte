<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Tabs, { type TabItem } from "$lib/components/Tabs.svelte";
    import Button from "$lib/components/Button.svelte";
    import FileUpload from "$lib/components/FileUpload.svelte";
    import KomtVanInput from "$lib/components/KomtVanInput.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import {
        File as FileIcon,
        ExternalLink,
        NotebookTabs,
        ChevronDown,
    } from "lucide-svelte";
    import * as taskService from "$lib/services/taskService";
    import * as magicLinkService from "$lib/services/magicLinkService";
    import * as minioService from "$lib/services/minioService";
    import * as eventLogService from "$lib/services/eventLogService";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { Task } from "$lib/schemas/task";
    import {
        getUserForAttribution,
        formatUserName,
    } from "$lib/utils/userUtils";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import HelpTicketDetailsDrawer from "$lib/components/HelpTicketDetailsDrawer.svelte";
    import FileList from "$lib/components/FileList.svelte";

    // LocalStorage key for magic token
    const MAGIC_TOKEN_STORAGE_KEY = "help_magic_token";

    // Tab management via URL params
    const activeTab = $derived.by(() => {
        const tabParam = $page.url.searchParams.get("tab");
        return tabParam === "bekijken" ? "bekijken" : "indienen";
    });

    const tokenParam = $derived($page.url.searchParams.get("token"));

    // Helper function to get token from URL or localStorage
    function getCurrentToken(): string | null {
        if (tokenParam) {
            return tokenParam;
        }
        // Check localStorage if no token in URL
        if (typeof window !== "undefined") {
            return localStorage.getItem(MAGIC_TOKEN_STORAGE_KEY);
        }
        return null;
    }

    const tabs: TabItem[] = [
        { id: "indienen", label: "Indienen" },
        { id: "bekijken", label: "Bekijken" },
    ];

    // Tab: Indienen (Submit) - Form fields
    let subject = $state("");
    let watGaJeDoen = $state("");
    let komtVan = $state("");
    let attachments = $state<
        Array<{ url: string; name: string; size: number }>
    >([]);
    let uploadingFiles = $state(false);
    let fileUploadKey = $state(0);
    let saving = $state(false);
    let fieldErrors = $state<Record<string, string>>({});
    let submitSuccess = $state(false);

    // Tab: Bekijken (View) - Email and tickets
    let email = $state("");
    let requestingLink = $state(false);
    let linkRequested = $state(false);
    let loadingTickets = $state(false);
    let tickets = $state<Task[]>([]);
    let ticketError = $state<string | null>(null);
    let ticketAssignees = $state<Map<number, PocketBaseUser | null>>(new Map());
    let hasToken = $state(false); // Track if we have a valid token (from URL or localStorage)
    let expandedAttachments = $state<Set<number>>(new Set()); // Track which tickets have expanded attachments

    // Handle tab change
    async function handleTabChange(tabId: string) {
        const url = new URL($page.url);
        url.searchParams.set("tab", tabId);
        // Remove token from URL when switching tabs (unless going to bekijken with token)
        // Note: localStorage token will still be used when switching back to bekijken
        if (tabId === "indienen") {
            url.searchParams.delete("token");
        }
        await goto(url.pathname + url.search, { noScroll: true });
    }

    // Validate email format
    function isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Handle file upload
    async function handleFileUpload(files: globalThis.FileList | null) {
        if (!files || files.length === 0) return;

        uploadingFiles = true;
        const fileArray = Array.from(files);
        const newAttachments: Array<{
            url: string;
            name: string;
            size: number;
        }> = [];

        try {
            for (const file of fileArray) {
                const result = await minioService.uploadFile(file);
                if (result.success && result.value.url) {
                    newAttachments.push({
                        url: result.value.url,
                        name: file.name,
                        size: file.size,
                    });
                } else if (!result.success) {
                    toastStore.add(
                        `Fout bij uploaden van ${file.name}: ${getUserMessage(result.error)}`,
                        "error",
                    );
                }
            }

            if (newAttachments.length > 0) {
                attachments = [...attachments, ...newAttachments];
                fileUploadKey += 1;
                toastStore.add(
                    `${newAttachments.length} bestand(en) geüpload`,
                    "success",
                );
            }
        } catch (error) {
            console.error("Upload failed:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het uploaden",
                "error",
            );
        }

        uploadingFiles = false;
    }

    // Extract MinIO object key from a permanent URL
    // Format: https://endpoint/bucket/key or http://endpoint/bucket/key
    function getFileKeyFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split("/").filter(Boolean);
            // Pathname format: /bucket/key — remove bucket name (first part), keep the rest as key
            if (pathParts.length >= 2) {
                return pathParts.slice(1).join("/");
            }
            return pathParts.join("/") || url;
        } catch {
            return url;
        }
    }

    async function removeAttachment(url: string) {
        // Delete from MinIO first
        const key = getFileKeyFromUrl(url);
        const result = await minioService.deleteFile(key);
        if (!result.success) {
            console.error("Error deleting file from MinIO:", result.error);
            toastStore.add(
                `Fout bij verwijderen van bestand: ${getUserMessage(result.error)}`,
                "error",
            );
            // Still remove from list even if MinIO delete fails
        }
        attachments = attachments.filter((a) => a.url !== url);
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    // Handle form submission
    async function handleSubmit() {
        saving = true;
        fieldErrors = {};
        submitSuccess = false;

        // Validate required fields
        if (!subject.trim()) {
            fieldErrors.subject = "Onderwerp is verplicht";
            saving = false;
            return;
        }

        if (!komtVan.trim() || !isValidEmail(komtVan)) {
            fieldErrors.komtVan = "Een geldig e-mailadres is verplicht";
            saving = false;
            return;
        }

        // Create work item
        // Note: assignee_id is explicitly set to empty array for help requests
        // Managers will assign these tasks later in the process
        const data = {
            subject: subject.trim(),
            wat_ga_je_doen: watGaJeDoen.trim() || null,
            komt_van: komtVan.trim(),
            bijlagen: attachments.map((a) => a.url),
            tags: ["help"],
            task_type: "help" as const,
            priority: "normaal" as const,
            status: "backlog" as const,
            kanban_status: "gepland" as const,
            assignee_id: [] as string[], // Empty array - managers assign later
            project_id: null,
            source: typeof window !== "undefined" ? window.location.href : null,
        };

        const result = await taskService.createWorkItem(data);

        if (result.success) {
            submitSuccess = true;

            // Log help page submission event
            const workItemId = result.value.id;
            const sourceUrl =
                typeof window !== "undefined"
                    ? window.location.href
                    : "/help?tab=indienen";

            eventLogService
                .logEvent("help_request_submitted", "work_item", workItemId, {
                    newValues: {
                        subject: result.value.subject,
                        status: result.value.status,
                        kanban_status: result.value.kanban_status,
                        komt_van: result.value.komt_van,
                        has_attachments:
                            (result.value.bijlagen?.length || 0) > 0,
                        attachment_count: result.value.bijlagen?.length || 0,
                    },
                    metadata: {
                        source: "help_page",
                        has_description: !!result.value.wat_ga_je_doen,
                        tags: result.value.tags || [],
                    },
                    sourceUrl,
                })
                .catch(console.error);

            // Reset form
            subject = "";
            watGaJeDoen = "";
            komtVan = "";
            attachments = [];
            fieldErrors = {};
            toastStore.add("Uw verzoek is ingediend!", "success");
        } else {
            toastStore.add(getUserMessage(result.error), "error");
            fieldErrors = { general: getUserMessage(result.error) };
        }

        saving = false;
    }

    // Handle request magic link
    async function handleRequestLink() {
        if (!email.trim() || !isValidEmail(email)) {
            ticketError = "Voer een geldig e-mailadres in";
            return;
        }

        requestingLink = true;
        ticketError = null;
        linkRequested = false;

        // Clear any existing token when requesting new link
        if (typeof window !== "undefined") {
            localStorage.removeItem(MAGIC_TOKEN_STORAGE_KEY);
        }
        hasToken = false; // Reset token state

        try {
            const response = await fetch("/help/api/generate-link", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error(
                    "[Help Page] API error:",
                    response.status,
                    result,
                );
                console.error(
                    "[Help Page] Error details:",
                    JSON.stringify(result, null, 2),
                );
            }

            if (result.success) {
                linkRequested = true;
                toastStore.add(
                    result.message ||
                        "Er is een link naar uw e-mailadres gestuurd",
                    "success",
                );
            } else {
                const errorMsg = result.error || "Er is een fout opgetreden";
                ticketError = errorMsg;
                toastStore.add(errorMsg, "error");
                console.error("[Help Page] Request failed:", errorMsg);
            }
        } catch (error) {
            console.error("[Help Page] Error requesting link:", error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Netwerkfout: Er is een fout opgetreden bij het aanvragen van de link";
            ticketError = errorMsg;
            toastStore.add(errorMsg, "error");
        }

        requestingLink = false;
    }

    // Load tickets when token is present (from URL or localStorage)
    $effect(() => {
        const currentToken = getCurrentToken();
        hasToken = !!currentToken;

        if (activeTab === "bekijken" && currentToken) {
            (async () => {
                loadingTickets = true;
                ticketError = null;

                // Validate token and get email
                const validationResult =
                    await magicLinkService.validateMagicLink(currentToken);

                if (validationResult.success) {
                    const emailFromToken = validationResult.value;

                    // Store or update token in localStorage if it came from URL (email link)
                    // This replaces any existing token with the new one from the email link
                    if (tokenParam && typeof window !== "undefined") {
                        localStorage.setItem(
                            MAGIC_TOKEN_STORAGE_KEY,
                            currentToken,
                        );
                    }

                    // Always store the email when token is valid (for drawer access)
                    if (typeof window !== "undefined") {
                        localStorage.setItem(
                            "help_magic_email",
                            emailFromToken,
                        );
                    }

                    // Fetch tickets for this email
                    const ticketsResult =
                        await magicLinkService.getTicketsByEmail(
                            emailFromToken,
                        );

                    if (ticketsResult.success) {
                        tickets = ticketsResult.value;
                        email = emailFromToken; // Set email for display

                        // Load assignees for all tickets
                        const assigneesMap = new Map<
                            number,
                            PocketBaseUser | null
                        >();
                        for (const ticket of ticketsResult.value) {
                            if (ticket.assignee_id) {
                                const assignee = await getUserForAttribution(
                                    Array.isArray(ticket.assignee_id)
                                        ? ticket.assignee_id[0]
                                        : ticket.assignee_id,
                                );
                                assigneesMap.set(ticket.id, assignee);
                            } else {
                                assigneesMap.set(ticket.id, null);
                            }
                        }
                        ticketAssignees = assigneesMap;
                        hasToken = true; // Token is valid
                    } else {
                        ticketError = getUserMessage(ticketsResult.error);
                        tickets = [];
                        ticketAssignees = new Map();
                    }
                } else {
                    // Token is invalid or expired
                    const errorMessage = getUserMessage(validationResult.error);

                    // Clear localStorage if token is expired
                    if (typeof window !== "undefined") {
                        localStorage.removeItem(MAGIC_TOKEN_STORAGE_KEY);
                    }

                    // Show appropriate error message
                    if (
                        errorMessage.includes("verlopen") ||
                        errorMessage.includes("expired")
                    ) {
                        ticketError =
                            "Deze link is verlopen. Vraag een nieuwe link aan.";
                    } else {
                        ticketError = errorMessage;
                    }

                    tickets = [];
                    ticketAssignees = new Map();
                    hasToken = false; // Token is invalid
                }

                loadingTickets = false;
            })();
        } else if (activeTab === "bekijken" && !currentToken) {
            // Reset state when no token
            tickets = [];
            ticketError = null;
            linkRequested = false;
            ticketAssignees = new Map();
            hasToken = false;
            expandedAttachments = new Set();
        }
    });

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString("nl-NL", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getStatusLabel(status: string): string {
        const statusMap: Record<string, string> = {
            backlog: "Backlog",
            gepland: "Gepland",
            "ad-hoc": "Ad-hoc",
        };
        return statusMap[status] || status;
    }

    function getKanbanStatusLabel(
        kanbanStatus: string,
        status: string,
    ): string {
        // If status is backlog, show "Nog op te pakken"
        if (status === "backlog") {
            return "Nog op te pakken";
        }

        // Otherwise, show the kanban_status label
        const statusMap: Record<string, string> = {
            backlog: "Backlog",
            gepland: "Gepland",
            mee_bezig: "Mee bezig",
            in_review: "In review",
            afgerond: "Afgerond",
            overdue: "Te laat",
        };
        return statusMap[kanbanStatus] || kanbanStatus;
    }

    function openFile(url: string) {
        window.open(url, "_blank");
    }
</script>

<svelte:head>
    <title>Hulp & Support - Business Process Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
        <h1 class="text-3xl font-semibold text-zinc-900 font-aspekta mb-2">
            Hulp & Support
        </h1>
        <p class="text-zinc-600">
            Dien een verzoek in of bekijk de status van uw ingediende verzoeken
        </p>
    </div>

    <Tabs {tabs} {activeTab} ontabchange={handleTabChange}>
        {#snippet children({ activeTab }: { activeTab: string })}
            {#if activeTab === "indienen"}
                <!-- Tab: Indienen (Submit) -->
                <div class="space-y-6">
                    {#if submitSuccess}
                        <div
                            class="p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <p class="text-green-800 font-medium">
                                Uw verzoek is succesvol ingediend!
                            </p>
                            <p class="text-green-700 text-sm mt-1">
                                Wilt u de status bekijken?
                                <button
                                    type="button"
                                    onclick={() => handleTabChange("bekijken")}
                                    class="underline font-medium"
                                >
                                    Ga naar het tabblad "Bekijken"
                                </button>
                            </p>
                        </div>
                    {/if}

                    <form
                        onsubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        class="space-y-6"
                    >
                        <!-- Subject -->
                        <div>
                            <label
                                for="subject"
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Onderwerp <span class="text-red-500">*</span>
                            </label>
                            <input
                                id="subject"
                                type="text"
                                bind:value={subject}
                                required
                                disabled={saving}
                                class="w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-2 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm {fieldErrors.subject
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-zinc-300 focus:ring-zinc-500'}"
                                placeholder="Geef een onderwerp voor uw verzoek..."
                                maxlength="255"
                            />
                            {#if fieldErrors.subject}
                                <p class="mt-1 text-sm text-red-600">
                                    {fieldErrors.subject}
                                </p>
                            {/if}
                        </div>

                        <!-- Je vraag of verzoek (wat_ga_je_doen) -->
                        <div>
                            <label
                                for="wat-ga-je-doen"
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Je vraag of verzoek:
                            </label>
                            <textarea
                                id="wat-ga-je-doen"
                                bind:value={watGaJeDoen}
                                rows="5"
                                disabled={saving}
                                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm"
                                placeholder="Beschrijf uw vraag of verzoek..."
                            ></textarea>
                        </div>

                        <!-- Je emailadres (komt_van) -->
                        <div>
                            <label
                                for="komt-van"
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Je emailadres <span class="text-red-500">*</span
                                >
                            </label>
                            <KomtVanInput
                                id="komt-van"
                                bind:value={komtVan}
                                disabled={saving}
                                placeholder="naam@hoipippeloi.nl"
                                maxSuggestions={10}
                            />
                            {#if fieldErrors.komtVan}
                                <p class="mt-1 text-sm text-red-600">
                                    {fieldErrors.komtVan}
                                </p>
                            {/if}
                        </div>

                        <!-- Bijlagen -->
                        <div role="group" aria-label="Bijlagen">
                            <div
                                class="block text-sm font-medium text-zinc-900 mb-2"
                            >
                                Bijlagen
                            </div>
                            {#key fileUploadKey}
                                <div
                                    class="[&>div>div]:!py-6 [&>div>div]:!px-4"
                                >
                                    <FileUpload
                                        variant="drag-drop"
                                        multiple
                                        onchange={handleFileUpload as (
                                            files: globalThis.FileList | null,
                                        ) => void}
                                        disabled={uploadingFiles || saving}
                                    />
                                </div>
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
                                                    <p
                                                        class="text-xs text-zinc-500 font-inter"
                                                    >
                                                        {formatFileSize(
                                                            attachment.size,
                                                        )}
                                                    </p>
                                                </div>
                                            </a>
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    removeAttachment(
                                                        attachment.url,
                                                    )}
                                                disabled={saving}
                                                class="ml-2 rounded-md p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
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

                        {#if fieldErrors.general}
                            <div
                                class="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm"
                            >
                                {fieldErrors.general}
                            </div>
                        {/if}

                        <div class="pt-4 border-t border-zinc-200">
                            <Button
                                type="submit"
                                disabled={saving || uploadingFiles}
                            >
                                {saving
                                    ? "Verzoek indienen..."
                                    : "Verzoek indienen"}
                            </Button>
                        </div>
                    </form>
                </div>
            {:else if activeTab === "bekijken"}
                <!-- Tab: Bekijken (View) -->
                <div class="space-y-6">
                    {#if hasToken || ticketError || loadingTickets}
                        <!-- Show tickets/loading/error when token is present (from URL or localStorage) or when there's an error -->
                        {#if loadingTickets}
                            <div class="flex items-center justify-center py-12">
                                <div class="text-center">
                                    <div
                                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-4"
                                    ></div>
                                    <p class="text-zinc-600">
                                        Tickets laden...
                                    </p>
                                </div>
                            </div>
                        {:else if ticketError}
                            <div
                                class="p-4 bg-red-50 border border-red-200 rounded-lg"
                            >
                                <p class="text-red-800 font-medium">Fout</p>
                                <p class="text-red-700 text-sm mt-1">
                                    {ticketError}
                                </p>
                                <button
                                    type="button"
                                    onclick={() => {
                                        // Clear token from URL and localStorage
                                        const url = new URL($page.url);
                                        url.searchParams.delete("token");
                                        if (typeof window !== "undefined") {
                                            localStorage.removeItem(
                                                MAGIC_TOKEN_STORAGE_KEY,
                                            );
                                        }
                                        // Reset state
                                        ticketError = null;
                                        hasToken = false;
                                        goto(url.pathname + url.search);
                                    }}
                                    class="mt-3 text-sm text-red-800 underline"
                                >
                                    Vraag een nieuwe link aan
                                </button>
                            </div>
                        {:else if tickets.length === 0}
                            <div
                                class="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-center"
                            >
                                <p class="text-zinc-600">
                                    U heeft nog geen ingediende verzoeken.
                                </p>
                            </div>
                        {:else}
                            <div>
                                <p class="text-sm text-zinc-600 mb-4">
                                    U heeft {tickets.length} verzoek{tickets.length ===
                                    1
                                        ? ""
                                        : "en"} ingediend.
                                </p>
                                <div class="space-y-4">
                                    {#each tickets as ticket}
                                        <div
                                            class="border border-zinc-200 rounded-lg p-6 bg-white"
                                        >
                                            <div
                                                class="flex items-start justify-between mb-3"
                                            >
                                                <h3
                                                    class="text-lg font-semibold text-zinc-900 font-aspekta"
                                                >
                                                    {ticket.subject ||
                                                        "Geen onderwerp"}
                                                </h3>
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <span
                                                        class="px-2 py-1 text-xs font-medium rounded-sm bg-zinc-100 text-zinc-700"
                                                    >
                                                        {getKanbanStatusLabel(
                                                            ticket.kanban_status,
                                                            ticket.status,
                                                        )}
                                                    </span>
                                                    {#if ticket.deadline}
                                                        <span
                                                            class="px-2 py-1 text-xs font-medium rounded-sm bg-amber-100 text-amber-800"
                                                        >
                                                            {new Date(
                                                                ticket.deadline,
                                                            ).toLocaleDateString(
                                                                "nl-NL",
                                                                {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                },
                                                            )}
                                                        </span>
                                                    {/if}
                                                    <IconButton
                                                        icon={NotebookTabs}
                                                        size="sm"
                                                        variant="ghost"
                                                        tooltip="Taak details bekijken"
                                                        onclick={() => {
                                                            const url = new URL(
                                                                $page.url,
                                                            );
                                                            url.searchParams.set(
                                                                "drawer",
                                                                "help-ticket",
                                                            );
                                                            url.searchParams.set(
                                                                "workItemId",
                                                                ticket.id.toString(),
                                                            );
                                                            goto(
                                                                url.pathname +
                                                                    url.search,
                                                                {
                                                                    noScroll: true,
                                                                },
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {#if ticketAssignees.get(ticket.id)}
                                                <div
                                                    class="mb-3 flex items-center gap-2"
                                                >
                                                    <span
                                                        class="text-sm text-zinc-600 font-inter"
                                                        >Toegewezen aan:</span
                                                    >
                                                    <UserAvatar
                                                        user={ticketAssignees.get(
                                                            ticket.id,
                                                        )!}
                                                        size="sm"
                                                        showName={true}
                                                    />
                                                </div>
                                            {/if}

                                            {#if ticket.wat_ga_je_doen}
                                                <p
                                                    class="text-zinc-700 mb-3 whitespace-pre-wrap"
                                                >
                                                    {ticket.wat_ga_je_doen}
                                                </p>
                                            {/if}

                                            {#if ticket.bijlagen && Array.isArray(ticket.bijlagen) && ticket.bijlagen.length > 0 && ticket.bijlagen.some((url) => url && url.trim() !== "")}
                                                <div
                                                    class="mt-3 pt-3 border-t border-zinc-200"
                                                >
                                                    <button
                                                        type="button"
                                                        onclick={() => {
                                                            const newExpanded =
                                                                new Set(
                                                                    expandedAttachments,
                                                                );
                                                            if (
                                                                newExpanded.has(
                                                                    ticket.id,
                                                                )
                                                            ) {
                                                                newExpanded.delete(
                                                                    ticket.id,
                                                                );
                                                            } else {
                                                                newExpanded.add(
                                                                    ticket.id,
                                                                );
                                                            }
                                                            expandedAttachments =
                                                                newExpanded;
                                                        }}
                                                        class="w-full flex items-center justify-between text-sm font-medium text-zinc-900 hover:text-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1 rounded-sm px-1 py-1 -mx-1"
                                                        aria-expanded={expandedAttachments.has(
                                                            ticket.id,
                                                        )}
                                                    >
                                                        <span
                                                            >Bijlagen ({ticket.bijlagen.filter(
                                                                (url) =>
                                                                    url &&
                                                                    url.trim() !==
                                                                        "",
                                                            ).length})</span
                                                        >
                                                        <ChevronDown
                                                            size={16}
                                                            class="text-zinc-500 transition-transform duration-200 {expandedAttachments.has(
                                                                ticket.id,
                                                            )
                                                                ? 'rotate-180'
                                                                : ''}"
                                                        />
                                                    </button>
                                                    <div
                                                        class="overflow-hidden transition-all duration-200"
                                                        class:max-h-0={!expandedAttachments.has(
                                                            ticket.id,
                                                        )}
                                                        class:max-h-[1000px]={expandedAttachments.has(
                                                            ticket.id,
                                                        )}
                                                    >
                                                        <div class="pt-2">
                                                            <FileList
                                                                files={ticket.bijlagen.filter(
                                                                    (url) =>
                                                                        url &&
                                                                        url.trim() !==
                                                                            "",
                                                                )}
                                                                title=""
                                                                onopen={(url) =>
                                                                    openFile(
                                                                        url,
                                                                    )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}

                                            <p
                                                class="text-xs text-zinc-500 mt-4"
                                            >
                                                Ingediend op {formatDate(
                                                    ticket.created_at,
                                                )}
                                            </p>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {:else}
                        <!-- Show email input form when no token -->
                        <div class="w-full">
                            {#if linkRequested}
                                <div
                                    class="p-4 bg-green-50 border border-green-200 rounded-lg w-full"
                                >
                                    <p class="text-green-800 font-medium">
                                        Link verzonden!
                                    </p>
                                    <p class="text-green-700 text-sm mt-1">
                                        Controleer uw inbox ({email}) voor de
                                        toegangslink. De link is 24 uur geldig.
                                    </p>
                                </div>
                            {:else}
                                <div class="space-y-4 w-full">
                                    <div>
                                        <label
                                            for="email"
                                            class="block text-sm font-medium text-zinc-900 mb-2"
                                        >
                                            E-mailadres
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            bind:value={email}
                                            required
                                            disabled={requestingLink}
                                            class="w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-2 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm {ticketError
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-zinc-300 focus:ring-zinc-500'}"
                                            placeholder="naam@hoipippeloi.nl"
                                        />
                                        {#if ticketError}
                                            <p
                                                class="mt-1 text-sm text-red-600"
                                            >
                                                {ticketError}
                                            </p>
                                        {/if}
                                        <p class="mt-2 text-xs text-zinc-500">
                                            Voer uw e-mailadres in om een
                                            toegangslink te ontvangen voor het
                                            bekijken van uw verzoeken.
                                        </p>
                                    </div>

                                    <Button
                                        onclick={handleRequestLink}
                                        disabled={requestingLink}
                                    >
                                        {requestingLink
                                            ? "Link aanvragen..."
                                            : "Toegangslink aanvragen"}
                                    </Button>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}
        {/snippet}
    </Tabs>
</div>

<!-- Help Ticket Details Drawer (Read-only) -->
<HelpTicketDetailsDrawer />
