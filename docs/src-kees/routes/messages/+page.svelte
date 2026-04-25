<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { messageStore } from "$lib/stores/messageStore";
    import { navigationStore } from "$lib/stores/navigationStore";
    import * as messageService from "$lib/services/messageService";
    // Subscription messages are fetched via /api/subscriptions/messages (returns messages + readIds)
    import {
        formatDate,
        formatTime,
        formatRelativeTime,
    } from "$lib/utils/timeUtils";
    import {
        formatUserName,
        getUserForAttribution,
    } from "$lib/utils/userUtils";
    import type { Message } from "$lib/schemas/message";
    import type { EntityReference } from "$lib/schemas/message";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import ImageViewerModal from "$lib/components/ImageViewerModal.svelte";
    import UpdatesFeed from "$lib/components/UpdatesFeed.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import { Tabs } from "$lib/components";
    import {
        Check,
        CheckCircle,
        MailOpen,
        Download,
        File,
        Link as LinkIcon,
        ChevronDown,
        ChevronUp,
        Bell,
        Loader2,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";

    const entityDotColors: Record<string, string> = {
        process: "bg-blue-500",
        case: "bg-green-500",
        work: "bg-orange-500",
        task: "bg-orange-500",
        project: "bg-purple-500",
    };

    const entityLabels: Record<string, string> = {
        process: "Proces",
        case: "Case",
        work: "Werkitem",
        task: "Werkitem",
        project: "Project",
    };

    function resolveEntityType(message: Message): string | null {
        if (message.entity_type) {
            if (message.entity_type === "task" || message.entity_type === "work")
                return "work";
            return message.entity_type;
        }
        if (!message.source) return null;
        if (message.source.includes("/processes/")) return "process";
        if (message.source.includes("/cases/")) return "case";
        if (message.source.includes("/work-items/") || message.source.includes("/work/"))
            return "work";
        if (message.source.includes("/projects/")) return "project";
        return null;
    }

    function resolveEntityUrl(message: Message): string | null {
        if (message.entity_type && message.entity_id) {
            const type =
                message.entity_type === "task"
                    ? "work"
                    : message.entity_type;
            return `/${type}/${message.entity_id}`;
        }
        if (!message.source) return null;
        const match = message.source.match(
            /\/(processes|cases|work-items|work|projects)\/(\d+)/,
        );
        if (!match) return null;
        const route = match[1] === "work-items" ? "work" : match[1];
        return `/${route}/${match[2]}`;
    }

    function resolveEntityName(message: Message): string | null {
        const type = resolveEntityType(message);
        const id = message.entity_id;
        if (type && id) {
            return `${entityLabels[type] || type} #${id}`;
        }
        if (!message.source) return null;
        const match = message.source.match(
            /\/(processes|cases|work-items|work|projects)\/(\d+)/,
        );
        if (!match) return null;
        const rawType = match[1] === "work-items" ? "work" : match[1];
        const fallbackId = match[2];
        const resolvedType = resolveEntityType(message);
        return resolvedType
            ? `${entityLabels[resolvedType] || resolvedType} #${fallbackId}`
            : `#${fallbackId}`;
    }

    function getEntityUrl(source: string | null | undefined): string | null {
        if (!source) return null;
        const match = source.match(
            /\/(processes|cases|work-items|work|projects)\/(\d+)/,
        );
        if (!match) return null;
        const route = match[1] === "work-items" ? "work" : match[1];
        return `/${route}/${match[2]}`;
    }

    function getEntityName(source: string | null | undefined): string | null {
        if (!source) return null;
        const match = source.match(
            /\/(processes|cases|work-items|work|projects)\/(\d+)/,
        );
        if (!match) return null;
        const rawType = match[1] === "work-items" ? "work" : match[1];
        const id = match[2];
        const type = getEntityTypeFromSource(source);
        return type ? `${entityLabels[type] || type} #${id}` : `#${id}`;
    }

    let messages = $state<Message[]>([]);
    let loading = $state(true);
    let senders = $state<Map<string, PocketBaseUser | null>>(new Map());
    let feedKey = $state(0);
    let selectedImage = $state<string | null>(null);
    let selectedImageName = $state<string | null>(null);
    let imageViewerOpen = $state(false);
    let expandedMentions = $state<Set<number>>(new Set());
    let subscriptionMessages = $state<Message[]>([]);
    let subscriptionReadIds = $state<Set<number>>(new Set());

    onMount(async () => {
        await Promise.all([loadMessages(), loadSubscriptionMessages()]);
    });

    // Load sender information
    $effect(() => {
        (async () => {
            const senderIds = new Set<string>();
            for (const msg of messages) {
                if (msg.sender_user_id) {
                    senderIds.add(msg.sender_user_id);
                }
            }

            for (const senderId of senderIds) {
                if (!senders.has(senderId)) {
                    senders.set(senderId, null);
                    senders = new Map(senders);
                    const user = await getUserForAttribution(senderId);
                    senders.set(senderId, user);
                    senders = new Map(senders);
                }
            }
        })();
    });

    async function loadMessages() {
        loading = true;
        navigationStore.startPageLoading();
        try {
            const auth = authStore.getAuth();
            if (auth?.user?.id) {
                // Load messages where user is @mentioned
                const result = await messageService.getMessagesWithMentions(
                    auth.user.id,
                );
                if (result.success) {
                    messages = result.value;
                } else {
                    console.error("Error loading messages:", result.error);
                    messages = [];
                }
            } else {
                console.warn("No user ID found in auth data");
                messages = [];
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            messages = [];
        } finally {
            loading = false;
            navigationStore.stopPageLoading();
        }
    }

    async function markAsRead(id: number) {
        try {
            await messageService.markMessageAsRead(id);
            await loadMessages();
            // Refresh the message badge count
            messageStore.refresh();
        } catch (error) {
            console.error("Error marking message as read:", error);
        }
    }

    async function markAsUnread(id: number) {
        try {
            await messageService.markMessageAsUnread(id);
            await loadMessages();
            // Refresh the message badge count
            messageStore.refresh();
        } catch (error) {
            console.error("Error marking message as unread:", error);
        }
    }

    let markingAllAsRead = $state(false);

    async function markAllAsRead() {
        if (markingAllAsRead) return;
        markingAllAsRead = true;
        try {
            const auth = authStore.getAuth();
            if (auth?.user?.id) {
                await messageService.markAllMessagesAsRead(auth.user.id);
                messageStore.markUpdatesSeen();
                await fetch("/api/subscriptions/messages", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                });
                await Promise.all([loadMessages(), loadSubscriptionMessages()]);
                messageStore.refresh();
                feedKey++;
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        } finally {
            markingAllAsRead = false;
        }
    }

    const unreadMentionCount = $derived(
        messages.filter((n) => !n.in_app_read).length,
    );

    // Subscription messages are chat messages shared across all subscribers,
    // so in_app_read is NOT per-user. Read state is tracked per-user in the
    // _bpm_subscription_message_reads table, returned as readIds from the API.
    const unreadSubscriptionCount = $derived(
        subscriptionMessages.filter((m) => !subscriptionReadIds.has(m.id))
            .length,
    );

    const unreadCount = $derived(unreadMentionCount + unreadSubscriptionCount);

    async function loadSubscriptionMessages() {
        try {
            const response = await fetch("/api/subscriptions/messages");
            if (!response.ok) {
                subscriptionMessages = [];
                return;
            }
            const result = await response.json();
            if (result.success) {
                const data = result.data;
                subscriptionMessages = data.messages || [];
                subscriptionReadIds = new Set(data.readIds || []);
            } else {
                subscriptionMessages = [];
            }
        } catch (error) {
            console.error("Error loading subscription messages:", error);
            subscriptionMessages = [];
        }
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

    function getMessageText(msg: Message): string {
        // Prefer message_text (plain text), fallback to body
        if (msg.message_text && msg.message_text.trim()) {
            return msg.message_text;
        }
        if (msg.body && msg.body.trim()) {
            // If body contains HTML tags, strip them for display
            const htmlRegex = /<[^>]*>/g;
            if (htmlRegex.test(msg.body)) {
                // Contains HTML - strip tags and decode entities
                const tempDiv =
                    typeof document !== "undefined"
                        ? document.createElement("div")
                        : null;
                if (tempDiv) {
                    tempDiv.innerHTML = msg.body;
                    return tempDiv.textContent || tempDiv.innerText || "";
                }
                // Fallback: simple tag stripping
                return msg.body
                    .replace(htmlRegex, "")
                    .replace(/&nbsp;/g, " ")
                    .trim();
            }
            return msg.body;
        }
        return "";
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

    function openImageViewer(url: string) {
        selectedImage = url;
        selectedImageName = url.split("/").pop() || "image";
        imageViewerOpen = true;
    }

    function closeImageViewer() {
        imageViewerOpen = false;
        selectedImage = null;
        selectedImageName = null;
    }

    function handleMentionClick(ref: EntityReference) {
        let url = "";
        switch (ref.type) {
            case "user":
                url = `/users/${ref.id}`;
                break;
            case "project":
                url = `/projects/${ref.id}`;
                break;
            case "case":
                url = `/cases/${ref.id}`;
                break;
            case "task":
                url = `/work/${ref.id}`;
                break;
            case "process":
                url = `/processes/${ref.id}`;
                break;
        }
        if (url) {
            goto(url);
        }
    }

    function toggleMentions(messageId: number) {
        const newSet = new Set(expandedMentions);
        if (newSet.has(messageId)) {
            newSet.delete(messageId);
        } else {
            newSet.add(messageId);
        }
        expandedMentions = newSet;
    }

    // Tab configuration
    const tabs = $derived([
        {
            id: "mentions",
            label: "Mijn berichten",
            badgeCount: unreadMentionCount,
        },
        {
            id: "updates",
            label: "Updates",
            badgeCount: unreadSubscriptionCount,
        },
    ]);

    let activeTab = $derived(
        ["mentions", "updates"].includes(
            $page.url.searchParams.get("tab") || "",
        )
            ? $page.url.searchParams.get("tab")!
            : "mentions",
    );

    function handleTabChange(tabId: string) {
        goto(`?tab=${tabId}`, { keepFocus: true, noScroll: true });
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <div class="mb-8 flex justify-between items-center">
        <div>
            <h1
                class="text-3xl font-bold font-aspekta text-zinc-900 tracking-tight antialiased mb-2"
            >
                Berichten
            </h1>
            <p class="text-zinc-600 font-inter">
                U heeft {unreadCount} ongelezen bericht{unreadCount !== 1
                    ? "en"
                    : ""}
            </p>
        </div>
        {#if unreadCount > 0}
            <Button variant="secondary" onclick={markAllAsRead} disabled={markingAllAsRead}>
                {#if markingAllAsRead}
                    <Loader2 size={16} class="animate-spin" />
                {/if}
                Alles Als Gelezen Markeren
            </Button>
        {/if}
    </div>

    <Tabs {tabs} {activeTab} ontabchange={handleTabChange}>
        {#snippet children({ activeTab })}
            {#if activeTab === "mentions"}
                {#if loading}
                    <div class="flex items-center justify-center py-20">
                        <Spinner size="lg" />
                    </div>
                {:else if messages.length === 0}
                    <div class="text-center py-16 px-4">
                        <div
                            class="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center"
                        >
                            <Bell class="w-6 h-6 text-zinc-400" />
                        </div>
                        <h3
                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-2"
                        >
                            Geen berichten gevonden
                        </h3>
                        <p
                            class="text-sm text-zinc-500 font-inter max-w-md mx-auto"
                        >
                            Je hebt nog geen vermeldingen. Iemand moet je taggen
                            in een bericht.
                        </p>
                    </div>
                {:else}
                    <!-- Mark all as read button -->
                    {#if unreadMentionCount > 0}
                        <div class="flex justify-end mb-2">
                            <button
                                type="button"
                                onclick={markAllAsRead}
                                disabled={markingAllAsRead}
                                class="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 font-inter transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if markingAllAsRead}
                                    <Loader2 size={14} class="animate-spin" />
                                {:else}
                                    <CheckCircle size={14} />
                                {/if}
                                Alles als gelezen markeren
                            </button>
                        </div>
                    {/if}

                    <div class="space-y-1">
                        {#each messages as message (message.id)}
                            {@const sender = message.sender_user_id
                                ? senders.get(message.sender_user_id)
                                : null}
                            {@const unread = !message.in_app_read}
                            {@const text = getMessageText(message)}
                            {@const entityType = resolveEntityType(message)}
                            {@const entityUrl = resolveEntityUrl(message)}
                            {@const entityName = resolveEntityName(message)}

                            <div
                                class="group rounded-lg border {unread
                                    ? 'border-blue-100 bg-blue-50/40'
                                    : 'border-zinc-100 bg-white'} hover:border-zinc-200 p-4 transition-colors relative"
                            >
                                <div class="flex gap-3">
                                    <!-- Unread dot + avatar -->
                                    <div class="shrink-0 mt-0.5 relative">
                                        <UserAvatar
                                            user={sender ?? null}
                                            size="sm"
                                        />
                                        {#if unread}
                                            <span
                                                class="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white"
                                            ></span>
                                        {/if}
                                    </div>

                                    <!-- Message content -->
                                    <div class="flex-1 min-w-0">
                                        <!-- Header row: sender · entity link, time -->
                                        <div
                                            class="flex items-start justify-between gap-2 mb-1"
                                        >
                                            <div
                                                class="flex items-center gap-1.5 min-w-0"
                                            >
                                                <span
                                                    class="text-sm font-medium {unread
                                                        ? 'text-zinc-900'
                                                        : 'text-zinc-700'} font-inter shrink-0"
                                                >
                                                    {getSenderName(message)}
                                                </span>

                                                {#if entityUrl && entityName}
                                                    <span class="text-zinc-300 shrink-0">&middot;</span>
                                                    <a
                                                        href={entityUrl + '?tab=messages'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="inline-flex items-center gap-1 text-sm text-[#F94E04] hover:text-[#d44303] font-inter transition-colors min-w-0"
                                                    >
                                                        <LinkIcon size={12} class="shrink-0" />
                                                        <span class="truncate">{entityName}</span>
                                                    </a>
                                                {/if}
                                            </div>

                                            <!-- Relative time + mark read/unread -->
                                            <div
                                                class="flex items-center gap-2 shrink-0"
                                            >
                                                {#if unread}
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            markAsRead(
                                                                message.id,
                                                            )}
                                                        class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-blue-600 rounded transition-all"
                                                        title="Markeer als gelezen"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                {:else}
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            markAsUnread(
                                                                message.id,
                                                            )}
                                                        class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-600 rounded transition-all"
                                                        title="Markeer als ongelezen"
                                                    >
                                                        <MailOpen size={14} />
                                                    </button>
                                                {/if}
                                                <time
                                                    datetime={message.created_at}
                                                    class="text-xs text-zinc-400 font-inter whitespace-nowrap"
                                                    title={formatDate(
                                                        message.created_at,
                                                    ) +
                                                        " " +
                                                        formatTime(
                                                            message.created_at,
                                                        )}
                                                >
                                                    {formatRelativeTime(
                                                        message.created_at,
                                                    )}
                                                </time>
                                            </div>
                                        </div>

                                        <!-- Message text -->
                                        {#if text.trim()}
                                            <p
                                                class="text-sm text-zinc-700 font-inter whitespace-pre-wrap wrap-break-word leading-relaxed"
                                            >
                                                {text}
                                            </p>
                                        {/if}

                                        <!-- Mention references -->
                                        {#if message.references && message.references.length > 0}
                                            <div class="mt-2">
                                                <button
                                                    type="button"
                                                    onclick={() =>
                                                        toggleMentions(
                                                            message.id,
                                                        )}
                                                    class="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition font-inter"
                                                >
                                                    Vermeldingen ({message
                                                        .references.length})
                                                    {#if expandedMentions.has(message.id)}
                                                        <ChevronUp size={14} />
                                                    {:else}
                                                        <ChevronDown
                                                            size={14}
                                                        />
                                                    {/if}
                                                </button>
                                                {#if expandedMentions.has(message.id)}
                                                    <div
                                                        class="mt-1.5 flex flex-wrap gap-1.5"
                                                    >
                                                        {#each message.references as ref}
                                                            <button
                                                                type="button"
                                                                onclick={() =>
                                                                    handleMentionClick(
                                                                        ref,
                                                                    )}
                                                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-inter bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                                                            >
                                                                @{ref.name}
                                                                <span
                                                                    class="text-zinc-400"
                                                                    >({ref.type})</span
                                                                >
                                                            </button>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}

                                        <!-- Attachments -->
                                        {#if message.attachments && message.attachments.length > 0}
                                            <div class="mt-2 space-y-1.5">
                                                {#each message.attachments as attachment}
                                                    {@const isImage =
                                                        isImageFile(attachment)}
                                                    {#if isImage}
                                                        <div
                                                            class="rounded-md overflow-hidden border border-zinc-100 inline-block"
                                                        >
                                                            <img
                                                                src={attachment}
                                                                alt="Bijlage"
                                                                class="max-h-48 max-w-full object-cover cursor-pointer hover:opacity-90 transition"
                                                                loading="lazy"
                                                                onclick={() =>
                                                                    openImageViewer(
                                                                        attachment,
                                                                    )}
                                                            />
                                                        </div>
                                                    {:else}
                                                        <a
                                                            href={attachment}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            class="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 px-3 py-2 rounded-md transition-colors font-inter"
                                                        >
                                                            <File
                                                                size={14}
                                                                class="shrink-0 text-zinc-400"
                                                            />
                                                            <span
                                                                class="truncate"
                                                                >{attachment
                                                                    .split("/")
                                                                    .pop() ||
                                                                    "bestand"}</span
                                                            >
                                                            <Download
                                                                size={12}
                                                                class="shrink-0"
                                                            />
                                                        </a>
                                                    {/if}
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Entity type colored dot (bottom-right) -->
                                {#if entityType}
                                    <span
                                        class="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full {entityDotColors[
                                            entityType
                                        ] || 'bg-zinc-400'}"
                                        title={entityLabels[entityType] || entityType}
                                    ></span>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {:else if activeTab === "updates"}
                <div class="mt-4">
                    {#key feedKey}
                        <UpdatesFeed />
                    {/key}
                </div>
            {/if}
        {/snippet}
    </Tabs>
</div>

<ImageViewerModal
    bind:open={imageViewerOpen}
    imageUrl={selectedImage || ""}
    imageName={selectedImageName || undefined}
    onClose={closeImageViewer}
/>
