<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import MessageInput from "./MessageInput.svelte";
    import Spinner from "./Spinner.svelte";
    import UserAvatar from "./UserAvatar.svelte";
    import Tooltip from "./Tooltip.svelte";
    import * as messageService from "$lib/services/messageService";
    import { getUserMessage } from "$lib/types/errors";
    import { toastStore } from "$lib/stores/toastStore";
    import { getCurrentUserId } from "$lib/utils/userUtils";
    import {
        getUserForAttribution,
        formatUserName,
    } from "$lib/utils/userUtils";
    import { formatTime, formatDate } from "$lib/utils/timeUtils";
    import type { Message } from "$lib/schemas/message";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import { Download, Edit2, Trash2, Bell, BellOff } from "lucide-svelte";
    import ImageViewerModal from "./ImageViewerModal.svelte";
    import IconButton from "./IconButton.svelte";
    import Modal from "./Modal.svelte";
    import Button from "./Button.svelte";
    import SearchBar from "./SearchBar.svelte";
    import {
        buildSearchQuery,
        type SearchParams,
    } from "$lib/utils/searchHelpers";

    /**
     * MessagesTab component props
     */
    interface Props {
        /**
         * Entity type (project, case, task, process)
         */
        entityType?: string;

        /**
         * Entity ID
         */
        entityId?: number;

        /**
         * Entity name (for subscription display)
         */
        entityName?: string;
    }

    let { entityType, entityId, entityName }: Props = $props();

    let messages = $state<Message[]>([]);
    let loading = $state(true);
    let senders = $state<Map<string, PocketBaseUser | null>>(new Map());
    let searchQuery = $state("");
    let selectedSenderId = $state<string | null>(null);
    let contentArea: HTMLDivElement | null = $state(null);
    let currentUserId = $state<string | null>(null);
    let msgSidebarOpen = $state(true);
    let imageViewerOpen = $state(false);
    let selectedImageUrl = $state<string | null>(null);
    let selectedImageName = $state<string | null>(null);
    let editingMessageId = $state<number | null>(null);
    let editingMessage = $state<Message | null>(null);
    let deleteModalOpen = $state(false);
    let deletingMessageId = $state<number | null>(null);
    let deleting = $state(false);

    // Subscription state
    let isSubscribed = $state(false);
    let subscriptionLoading = $state(false);
    let subscriptionChecked = $state(false);
    let subscribeModalOpen = $state(false);
    let subscribeInApp = $state(true);
    let subscribeEmail = $state(false);
    let currentChannel = $state<string>("in-app");

    // Full-text search state
    let searchResults = $state<Message[]>([]);
    let searchActive = $state(false);

    // Get unique senders from messages
    let uniqueSenders = $derived.by(() => {
        const senderMap = new Map<
            string,
            {
                user: PocketBaseUser | null;
                senderEmail: string | null;
                unreadCount: number;
                lastMessage: Date;
            }
        >();

        for (const msg of messages) {
            // Use sender_user_id if available, otherwise use sender_email as identifier
            const senderKey =
                msg.sender_user_id || msg.sender_email || "unknown";
            if (senderKey === "unknown") continue;

            const existing = senderMap.get(senderKey);
            const msgDate = new Date(msg.created_at);
            const unreadCount = !msg.in_app_read ? 1 : 0;

            if (!existing) {
                senderMap.set(senderKey, {
                    user: msg.sender_user_id
                        ? senders.get(msg.sender_user_id) || null
                        : null,
                    senderEmail: msg.sender_email || null,
                    unreadCount: unreadCount,
                    lastMessage: msgDate,
                });
            } else {
                // Update unread count
                if (unreadCount > 0) {
                    existing.unreadCount += unreadCount;
                }
                // Update last message date if this is newer
                if (msgDate > existing.lastMessage) {
                    existing.lastMessage = msgDate;
                    if (msg.sender_user_id) {
                        existing.user = senders.get(msg.sender_user_id) || null;
                    }
                    if (msg.sender_email) {
                        existing.senderEmail = msg.sender_email;
                    }
                }
            }
        }

        // Convert to array and sort by last message date (newest first)
        return Array.from(senderMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
    });

    // Filter senders by search query
    let filteredSenders = $derived.by(() => {
        if (!searchQuery.trim()) return uniqueSenders;

        const query = searchQuery.toLowerCase();
        return uniqueSenders.filter(({ user, senderEmail }) => {
            if (user) {
                const name = formatUserName(user).toLowerCase();
                const email = (user.email || "").toLowerCase();
                return name.includes(query) || email.includes(query);
            }
            // If no user, search by sender email
            if (senderEmail) {
                return senderEmail.toLowerCase().includes(query);
            }
            return false;
        });
    });

    // Filter messages: use search results when search is active, otherwise all messages
    // Also filter by selected sender when a sender is selected
    let displayedMessages = $derived.by(() => {
        let result = searchActive ? searchResults : messages;
        if (selectedSenderId) {
            result = result.filter(
                (msg) => msg.sender_user_id === selectedSenderId,
            );
        }
        return result;
    });

    onMount(() => {
        async function init() {
            currentUserId = getCurrentUserId();
            await loadMessages();
            await checkSubscription();
        }
        init();
    });

    async function checkSubscription() {
        if (!entityType || !entityId || !currentUserId) {
            subscriptionChecked = true;
            return;
        }
        try {
            const response = await fetch(
                `/api/subscriptions/${entityType}/${entityId}`,
            );
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    isSubscribed = result.data !== null;
                    if (result.data?.notification_channel) {
                        currentChannel = result.data.notification_channel;
                    }
                }
            }
        } catch (error) {
            console.error("Error checking subscription:", error);
        } finally {
            subscriptionChecked = true;
        }
    }

    function openSubscribeModal() {
        if (isSubscribed) {
            // Pre-check based on current channel
            if (currentChannel === "in-app") {
                subscribeInApp = true;
                subscribeEmail = false;
            } else if (currentChannel === "email") {
                subscribeInApp = false;
                subscribeEmail = true;
            } else if (currentChannel === "both") {
                subscribeInApp = true;
                subscribeEmail = true;
            }
        } else {
            // Defaults for new subscription
            subscribeInApp = true;
            subscribeEmail = false;
        }
        subscribeModalOpen = true;
    }

    async function handleSubscribeConfirm() {
        if (!entityType || !entityId || !currentUserId) return;
        if (!subscribeInApp && !subscribeEmail) return;

        // Determine channel from checkboxes
        let notification_channel: string;
        if (subscribeInApp && subscribeEmail) {
            notification_channel = "both";
        } else if (subscribeInApp) {
            notification_channel = "in-app";
        } else {
            notification_channel = "email";
        }

        subscriptionLoading = true;
        try {
            if (isSubscribed) {
                // Update existing subscription channel
                const response = await fetch("/api/subscriptions", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        entity_type: entityType,
                        entity_id: entityId,
                        notification_channel,
                    }),
                });
                const result = await response.json();
                if (result.success) {
                    currentChannel = notification_channel;
                    toastStore.add("Abonnement bijgewerkt", "success");
                } else {
                    toastStore.add("Fout bij bijwerken abonnement", "error");
                }
            } else {
                // Create new subscription
                const response = await fetch("/api/subscriptions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        entity_type: entityType,
                        entity_id: entityId,
                        entity_name: entityName,
                        notification_channel,
                    }),
                });
                const result = await response.json();
                if (result.success) {
                    isSubscribed = true;
                    currentChannel = notification_channel;
                    toastStore.add("Geabonneerd op berichten", "success");
                } else {
                    toastStore.add("Fout bij abonneren", "error");
                }
            }
        } catch (error) {
            toastStore.add("Er is een fout opgetreden", "error");
        } finally {
            subscriptionLoading = false;
            subscribeModalOpen = false;
        }
    }

    async function handleUnsubscribe() {
        if (!entityType || !entityId || !currentUserId) return;
        subscriptionLoading = true;
        try {
            const response = await fetch("/api/subscriptions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity_type: entityType,
                    entity_id: entityId,
                }),
            });
            const result = await response.json();
            if (result.success) {
                isSubscribed = false;
                currentChannel = "in-app";
                toastStore.add("Abonnement opgezegd", "success");
            } else {
                toastStore.add("Fout bij opzeggen abonnement", "error");
            }
        } catch (error) {
            toastStore.add("Er is een fout opgetreden", "error");
        } finally {
            subscriptionLoading = false;
            subscribeModalOpen = false;
        }
    }

    // Scroll to last message when messages tab is opened
    $effect(() => {
        // Check if messages tab is active (tab=messages in URL)
        const tabParam = $page.url.searchParams.get("tab");
        const isMessagesTabActive = tabParam === "messages";

        // Only scroll if:
        // 1. Messages tab is active
        // 2. Messages are loaded (not loading)
        // 3. There are messages to display
        // 4. Content area is available
        // 5. No hash is present (hash takes priority - user wants specific message)
        if (
            isMessagesTabActive &&
            !loading &&
            displayedMessages.length > 0 &&
            contentArea
        ) {
            const hash =
                typeof window !== "undefined" ? window.location.hash : "";
            // Only auto-scroll if no hash is present (hash means user wants to see specific message)
            if (!hash || !hash.startsWith("#message-")) {
                // Use requestAnimationFrame + setTimeout to ensure tab is fully visible and DOM is ready
                const timeoutId = setTimeout(() => {
                    if (contentArea) {
                        // Scroll to bottom to show last message
                        contentArea.scrollTop = contentArea.scrollHeight;
                    }
                }, 200); // Delay to ensure tab is fully visible and rendered

                return () => clearTimeout(timeoutId);
            }
        }
    });

    async function loadMessages() {
        loading = true;
        try {
            if (!entityType || !entityId) {
                messages = [];
                senders = new Map();
                return;
            }

            const result =
                await messageService.getMessagesByEntity({ entityType, entityId });
            if (result.success) {
                const sortedMessages = result.value.sort(
                    (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime(),
                );
                messages = sortedMessages;

                const senderIds = new Set<string>();
                for (const msg of sortedMessages) {
                    if (msg.sender_user_id) {
                        senderIds.add(msg.sender_user_id);
                    }
                }

                const newSenders = new Map<string, PocketBaseUser | null>();
                for (const senderId of senderIds) {
                    const user = await getUserForAttribution(senderId);
                    newSenders.set(senderId, user);
                }

                senders = newSenders;

                setTimeout(() => {
                    if (contentArea) {
                        contentArea.scrollTop = contentArea.scrollHeight;
                    }
                }, 100);
            } else {
                toastStore.add(getUserMessage(result.error), "error");
                messages = [];
                senders = new Map();
            }
        } catch (error) {
            messages = [];
            senders = new Map();
        } finally {
            loading = false;
        }
    }

    async function handleMessageSubmit() {
        // Reload messages immediately after sending/updating
        await loadMessages();
        // If we were editing, cancel edit mode
        if (editingMessageId !== null) {
            cancelEdit();
        }
        // Scroll to bottom after new message
        setTimeout(() => {
            if (contentArea) {
                contentArea.scrollTop = contentArea.scrollHeight;
            }
        }, 100);
    }

    /**
     * Handle search from SearchBar component.
     * Calls /api/messages/search endpoint and updates searchResults.
     * If params are empty, resets to normal message display.
     */
    async function handleSearch(params: SearchParams) {
        if (!params.q || params.q.trim() === "") {
            searchActive = false;
            searchResults = [];
            return;
        }

        searchActive = true;
        loading = true;

        try {
            const query = buildSearchQuery(params);
            const response = await fetch(`/api/messages/search${query}`);
            const data = await response.json();

            if (data.success) {
                searchResults = data.data.messages;
            } else {
                toastStore.add(data.error || "Zoeken mislukt", "error");
                searchResults = [];
            }
        } catch (error) {
            toastStore.add("Er is een fout opgetreden bij het zoeken", "error");
            searchResults = [];
        } finally {
            loading = false;
        }
    }

    function shouldShowDateSeparator(index: number): boolean {
        if (index === 0) return true;

        const currentMsg = displayedMessages[index];
        const previousMsg = displayedMessages[index - 1];

        const currentDate = new Date(currentMsg.created_at);
        const previousDate = new Date(previousMsg.created_at);

        currentDate.setHours(0, 0, 0, 0);
        previousDate.setHours(0, 0, 0, 0);

        return currentDate.getTime() !== previousDate.getTime();
    }

    function isImageFile(url: string): boolean {
        const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".svg",
        ];
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some((ext) => lowerUrl.includes(ext));
    }

    function getFilename(url: string): string {
        // Extract filename from URL, removing query parameters
        const urlWithoutQuery = url.split("?")[0];
        const filename = urlWithoutQuery.split("/").pop() || url;
        return filename;
    }

    function openImageViewer(url: string) {
        selectedImageUrl = url;
        selectedImageName = getFilename(url);
        imageViewerOpen = true;
    }

    function closeImageViewer() {
        imageViewerOpen = false;
        selectedImageUrl = null;
        selectedImageName = null;
    }

    function startEdit(message: Message) {
        editingMessageId = message.id;
        editingMessage = message;
        // Scroll to bottom to show the input field
        setTimeout(() => {
            if (contentArea) {
                contentArea.scrollTop = contentArea.scrollHeight;
            }
        }, 100);
    }

    function cancelEdit() {
        editingMessageId = null;
        editingMessage = null;
    }

    function openDeleteModal(messageId: number) {
        deletingMessageId = messageId;
        deleteModalOpen = true;
    }

    function cancelDelete() {
        deleteModalOpen = false;
        deletingMessageId = null;
    }

    async function confirmDelete() {
        if (!deletingMessageId) return;

        deleting = true;
        const messageId = deletingMessageId;

        const result = await messageService.deleteMessage(messageId);

        if (result.success) {
            await loadMessages();
            toastStore.add("Bericht verwijderd", "success");
            cancelDelete();
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }

        deleting = false;
    }

    function renderMessageText(
        text: string | null | undefined,
        references: Array<{
            type: string;
            id: number | string;
            name: string;
        }> = [],
    ): string {
        if (!text) return "";

        // Replace @mentions with placeholders first (before HTML escaping)
        const mentionPlaceholders: Map<string, string> = new Map();
        let placeholderIndex = 0;
        let processedText = text;

        // Process known references first
        if (references && references.length > 0) {
            for (const ref of references) {
                // Escape special regex characters in the name
                const escapedName = ref.name.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&",
                );
                const mentionPattern = new RegExp(
                    `@${escapedName}(?![\\w])`,
                    "gi",
                );
                processedText = processedText.replace(
                    mentionPattern,
                    (match) => {
                        const placeholder = `__MENTION_PLACEHOLDER_${placeholderIndex++}__`;
                        mentionPlaceholders.set(placeholder, match);
                        return placeholder;
                    },
                );
            }
        }

        // Also catch any @mentions that might not be in references (fallback)
        // Match @ followed by word characters and spaces (common name pattern)
        // Only match if not already replaced by a placeholder
        const generalMentionPattern = /@[\w\s]+(?=\s|$|,|\.|!|\?|;|:)/g;
        processedText = processedText.replace(
            generalMentionPattern,
            (match) => {
                // Only process if this position doesn't contain a placeholder
                if (!match.includes("__MENTION_PLACEHOLDER_")) {
                    const placeholder = `__MENTION_PLACEHOLDER_${placeholderIndex++}__`;
                    mentionPlaceholders.set(placeholder, match);
                    return placeholder;
                }
                return match;
            },
        );

        // Now escape HTML and convert newlines to <br>
        let html = processedText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br />");

        // Replace placeholders with styled spans (dotted underline)
        for (const [placeholder, mention] of mentionPlaceholders.entries()) {
            const escapedMention = mention
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            html = html.replace(
                placeholder,
                `<span style="text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;">${escapedMention}</span>`,
            );
        }

        return html;
    }

    function getSenderName(msg: Message): string {
        if (msg.sender_user_id) {
            const sender = senders.get(msg.sender_user_id);
            if (sender) {
                return formatUserName(sender);
            }
        }
        return msg.sender_email || "Onbekend";
    }

    function isCurrentUser(msg: Message): boolean {
        return msg.sender_user_id === currentUserId;
    }
</script>

<div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
    <div class="flex-1 flex min-h-0 w-full relative overflow-hidden">
        <!-- Sidebar backdrop (mobile only) -->
        {#if msgSidebarOpen}
            <div
                class="fixed inset-0 bg-gray-900/30 z-10 md:hidden transition-opacity duration-200"
                onclick={() => (msgSidebarOpen = false)}
                aria-hidden="true"
            ></div>
        {/if}

        <!-- Messages sidebar -->
        <div
            id="messages-sidebar"
            class="absolute z-20 top-0 bottom-0 w-full md:w-auto md:static md:top-auto md:bottom-auto -mr-px md:translate-x-0 transition-transform duration-200 ease-in-out {msgSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full'} flex-shrink-0"
        >
            <div
                class="h-full bg-white dark:bg-gray-800 overflow-x-hidden overflow-y-auto no-scrollbar border-r border-gray-200 dark:border-gray-700/60 md:w-[18rem] xl:w-[20rem]"
            >
                <!-- Search and people list -->
                <div class="px-3 py-4">
                    <!-- Full-text message search -->
                    <div class="mb-4">
                        <SearchBar onSearch={handleSearch} />
                    </div>

                    <!-- Sender filter search form -->
                    <form
                        class="relative mb-4"
                        onsubmit={(e) => e.preventDefault()}
                    >
                        <label for="msg-search" class="sr-only">Zoeken</label>
                        <input
                            id="msg-search"
                            class="form-input w-full pl-9 bg-white dark:bg-gray-800"
                            type="search"
                            placeholder="Zoeken…"
                            bind:value={searchQuery}
                        />
                        <button
                            class="absolute inset-0 right-auto group"
                            type="submit"
                            aria-label="Zoeken"
                        >
                            <svg
                                class="shrink-0 fill-current text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 ml-3 mr-2"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
                                />
                                <path
                                    d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
                                />
                            </svg>
                        </button>
                    </form>

                    <!-- People list -->
                    <div>
                        <div
                            class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3"
                        >
                            Deelnemers
                        </div>
                        <ul class="space-y-1">
                            {#if filteredSenders.length === 0}
                                <li
                                    class="text-sm text-gray-500 dark:text-gray-400 py-2"
                                >
                                    Geen deelnemers gevonden
                                </li>
                            {:else}
                                {#each filteredSenders as sender}
                                    <li>
                                        <button
                                            class="flex items-center justify-between w-full p-2 rounded-lg transition {selectedSenderId ===
                                            sender.id
                                                ? 'bg-violet-500/12 dark:bg-violet-500/24'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}"
                                            onclick={() => {
                                                selectedSenderId =
                                                    selectedSenderId ===
                                                    sender.id
                                                        ? null
                                                        : sender.id;
                                                msgSidebarOpen = false; // Close sidebar on mobile after selection
                                                if (contentArea) {
                                                    contentArea.scrollTop =
                                                        contentArea.scrollHeight;
                                                }
                                            }}
                                        >
                                            <div
                                                class="flex items-center truncate min-w-0"
                                            >
                                                <UserAvatar
                                                    user={sender.user}
                                                    size="sm"
                                                />
                                                <span
                                                    class="text-sm font-medium text-gray-800 dark:text-gray-100 ml-2 truncate"
                                                >
                                                    {sender.user
                                                        ? formatUserName(
                                                              sender.user,
                                                          )
                                                        : sender.senderEmail ||
                                                          "Onbekend"}
                                                </span>
                                            </div>
                                            {#if sender.unreadCount > 0}
                                                <div
                                                    class="flex items-center ml-2"
                                                >
                                                    <span
                                                        class="text-xs inline-flex font-medium text-white rounded-full text-center leading-5 px-2"
                                                        class:bg-[#FF6900]={sender.user !==
                                                            null}
                                                        style={sender.user ===
                                                        null
                                                            ? "background-color: #59A3FF;"
                                                            : ""}
                                                    >
                                                        {sender.unreadCount}
                                                    </span>
                                                </div>
                                            {/if}
                                        </button>
                                    </li>
                                {/each}
                            {/if}
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Messages body -->
        <div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
            <!-- Subscription toggle header -->
            {#if entityType && entityId && currentUserId && subscriptionChecked}
                <div
                    class="flex items-center justify-end px-4 sm:px-6 md:px-5 pt-2"
                >
                    <button
                        type="button"
                        onclick={openSubscribeModal}
                        disabled={subscriptionLoading}
                        class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition {isSubscribed
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'} disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isSubscribed
                            ? "Abonnement beheren"
                            : "Abonneren op berichten"}
                    >
                        {#if subscriptionLoading}
                            <svg
                                class="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                    fill="none"
                                />
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                        {:else if isSubscribed}
                            <Bell size={16} />
                        {:else}
                            <BellOff size={16} />
                        {/if}
                        <span class="hidden sm:inline"
                            >{isSubscribed ? "Geabonneerd" : "Abonneren"}</span
                        >
                    </button>
                </div>
            {/if}

            <!-- Body -->
            <div
                bind:this={contentArea}
                class="flex-1 overflow-y-auto px-4 sm:px-6 md:px-5 py-6 relative min-h-0 w-full"
            >
                <!-- Mobile sidebar toggle button -->
                <button
                    class="md:hidden fixed top-20 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-500"
                    onclick={() => (msgSidebarOpen = !msgSidebarOpen)}
                    aria-controls="messages-sidebar"
                    aria-expanded={msgSidebarOpen}
                >
                    <span class="sr-only">Toggle sidebar</span>
                    <svg
                        class="w-5 h-5 fill-current"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect x="4" y="5" width="16" height="2" />
                        <rect x="4" y="11" width="16" height="2" />
                        <rect x="4" y="17" width="16" height="2" />
                    </svg>
                </button>
                {#if loading}
                    <div class="flex items-center justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                {:else if displayedMessages.length === 0}
                    <div
                        class="text-center py-12 text-gray-500 dark:text-gray-400"
                    >
                        <p class="text-sm">Geen berichten gevonden.</p>
                    </div>
                {:else}
                    {#each displayedMessages as message, index (message.id)}
                        {@const messageContent = (
                            message.message_text ??
                            message.body ??
                            ""
                        ).trim()}
                        {#if shouldShowDateSeparator(index)}
                            <!-- Date separator -->
                            <div class="flex justify-center my-5">
                                <div
                                    class="inline-flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 font-medium px-2.5 py-1 bg-white dark:bg-gray-700 shadow-xs rounded-full"
                                >
                                    {formatDate(message.created_at)}
                                </div>
                            </div>
                        {/if}

                        <!-- Chat message -->
                        <div
                            id="message-{message.id}"
                            class="flex items-start mb-4 last:mb-0 group {isCurrentUser(
                                message,
                            )
                                ? 'justify-end'
                                : 'justify-start'}"
                        >
                            {#if !isCurrentUser(message)}
                                <Tooltip
                                    text={message.sender_email || "Onbekend"}
                                >
                                    <UserAvatar
                                        user={senders.get(
                                            message.sender_user_id || "",
                                        ) || null}
                                        size="md"
                                        class="rounded-full mr-4 shrink-0"
                                    />
                                </Tooltip>
                            {/if}

                            {#if isCurrentUser(message)}
                                <!-- Edit/Delete buttons (shown on hover, positioned left of bubble) -->
                                <div
                                    class="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity order-1 shrink-0"
                                >
                                    <IconButton
                                        icon={Edit2}
                                        variant="ghost"
                                        size="sm"
                                        onclick={() => startEdit(message)}
                                        class="bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                    />
                                    <IconButton
                                        icon={Trash2}
                                        variant="ghost"
                                        size="sm"
                                        onclick={() =>
                                            openDeleteModal(message.id)}
                                        class="bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition"
                                    />
                                </div>
                            {/if}

                            <div
                                class="max-w-[70%] {isCurrentUser(message)
                                    ? 'order-2'
                                    : ''}"
                            >
                                <div
                                    class="text-sm px-3 py-2 rounded-lg mb-1 {isCurrentUser(
                                        message,
                                    )
                                        ? 'bg-[#FF6900] text-white rounded-tr-none'
                                        : 'bg-[#777] text-white rounded-tl-none'}"
                                >
                                    {#if !isCurrentUser(message)}
                                        <div class="font-medium mb-1">
                                            {getSenderName(message)}
                                        </div>
                                    {/if}

                                    {#if messageContent}
                                        <div
                                            class="whitespace-pre-wrap break-words text-white"
                                        >
                                            {@html renderMessageText(
                                                messageContent,
                                                message.references || [],
                                            )}
                                        </div>
                                    {/if}

                                    {#if message.attachments && message.attachments.length > 0}
                                        <div class="mt-2 space-y-2">
                                            {#each message.attachments as attachment}
                                                {#if isImageFile(attachment)}
                                                    <div
                                                        class="flex items-start"
                                                    >
                                                        <button
                                                            type="button"
                                                            class="rounded-lg shadow-xs max-w-[240px] max-h-[180px] object-cover cursor-pointer hover:opacity-90 transition p-0 border-0 bg-transparent"
                                                            onclick={() =>
                                                                openImageViewer(
                                                                    attachment,
                                                                )}
                                                            aria-label="Open image in viewer"
                                                        >
                                                            <img
                                                                src={attachment}
                                                                alt="Bijlage"
                                                                class="rounded-lg max-w-[240px] max-h-[180px] object-cover"
                                                            />
                                                        </button>
                                                        <button
                                                            class="p-1.5 rounded-full border border-gray-200 dark:border-gray-700/60 ml-4 hover:bg-white dark:hover:bg-gray-800 transition"
                                                            onclick={() =>
                                                                window.open(
                                                                    attachment,
                                                                    "_blank",
                                                                )}
                                                        >
                                                            <span
                                                                class="sr-only"
                                                                >Downloaden</span
                                                            >
                                                            <Download
                                                                class="w-4 h-4 text-gray-400 dark:text-gray-500"
                                                            />
                                                        </button>
                                                    </div>
                                                {:else}
                                                    <a
                                                        href={attachment}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="inline-flex items-center gap-2 px-3 py-2 bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-700/70 rounded-lg text-sm transition"
                                                    >
                                                        <Download
                                                            class="w-4 h-4"
                                                        />
                                                        <span
                                                            >{getFilename(
                                                                attachment,
                                                            )}</span
                                                        >
                                                    </a>
                                                {/if}
                                            {/each}
                                        </div>
                                    {/if}
                                </div>

                                <div
                                    class="flex items-center justify-between {isCurrentUser(
                                        message,
                                    )
                                        ? 'flex-row-reverse'
                                        : ''}"
                                >
                                    <div
                                        class="text-xs text-gray-500 dark:text-gray-400 font-medium"
                                    >
                                        {formatTime(message.created_at)}
                                    </div>
                                    {#if isCurrentUser(message) && message.in_app_read}
                                        <svg
                                            class="w-3 h-3 shrink-0 fill-current text-gray-400 dark:text-gray-500"
                                            viewBox="0 0 12 12"
                                        >
                                            <path
                                                d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z"
                                            />
                                        </svg>
                                    {/if}
                                </div>
                            </div>

                            {#if isCurrentUser(message)}
                                <Tooltip
                                    text={message.sender_email || "Onbekend"}
                                >
                                    <UserAvatar
                                        user={senders.get(
                                            message.sender_user_id || "",
                                        ) || null}
                                        size="md"
                                        class="rounded-full ml-4 order-3 shrink-0"
                                    />
                                </Tooltip>
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="flex-shrink-0 mt-auto border-t border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900"
            >
                <div
                    class="relative flex items-center justify-between px-4 sm:px-6 md:px-5 h-16"
                >
                    <MessageInput
                        {entityType}
                        {entityId}
                        onSubmit={handleMessageSubmit}
                        placeholder="Aa"
                        {editingMessageId}
                        initialText={editingMessage
                            ? (
                                  editingMessage.message_text ??
                                  editingMessage.body ??
                                  ""
                              ).trim()
                            : ""}
                        initialAttachments={editingMessage?.attachments || []}
                        onCancelEdit={cancelEdit}
                    />
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Image Viewer Modal -->
{#if selectedImageUrl}
    <ImageViewerModal
        bind:open={imageViewerOpen}
        imageUrl={selectedImageUrl}
        imageName={selectedImageName || undefined}
        onClose={closeImageViewer}
    />
{/if}

<!-- Subscribe Modal -->
<Modal
    open={subscribeModalOpen}
    title={isSubscribed ? "Abonnement beheren" : "Abonneren op berichten"}
    size="sm"
    onclose={() => (subscribeModalOpen = false)}
>
    <div class="space-y-4">
        <p class="text-sm text-zinc-600 font-inter">
            {isSubscribed
                ? "Beheer hoe je notificaties ontvangt voor dit item."
                : "Kies hoe je notificaties wilt ontvangen."}
        </p>
        <div class="space-y-3">
            <label class="flex items-start gap-3 cursor-pointer group">
                <input
                    type="checkbox"
                    bind:checked={subscribeInApp}
                    class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                />
                <div>
                    <span
                        class="text-sm font-medium text-zinc-700 group-hover:text-zinc-900"
                        >In-app notificaties</span
                    >
                    <p class="text-xs text-zinc-500">
                        Berichten verschijnen in het Updates tabblad
                    </p>
                </div>
            </label>
            <label class="flex items-start gap-3 cursor-pointer group">
                <input
                    type="checkbox"
                    bind:checked={subscribeEmail}
                    class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                />
                <div>
                    <span
                        class="text-sm font-medium text-zinc-700 group-hover:text-zinc-900"
                        >E-mail notificaties</span
                    >
                    <p class="text-xs text-zinc-500">
                        Ontvang een e-mail bij elk nieuw bericht
                    </p>
                </div>
            </label>
        </div>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            {#if isSubscribed}
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={handleUnsubscribe}
                    disabled={subscriptionLoading}
                >
                    {#if subscriptionLoading}
                        <span class="flex items-center gap-2"
                            ><Spinner size="xs" /> Opslaan...</span
                        >
                    {:else}
                        Opzeggen
                    {/if}
                </Button>
            {/if}
            <Button
                variant="default"
                size="sm"
                onclick={handleSubscribeConfirm}
                disabled={subscriptionLoading ||
                    (!subscribeInApp && !subscribeEmail)}
            >
                {#if subscriptionLoading}
                    <span class="flex items-center gap-2"
                        ><Spinner size="xs" /> Opslaan...</span
                    >
                {:else}
                    {isSubscribed ? "Opslaan" : "Abonneren"}
                {/if}
            </Button>
        </div>
    </div>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="Bericht verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u dit bericht wilt verwijderen?
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
