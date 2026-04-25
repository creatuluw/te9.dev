<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import Spinner from "./Spinner.svelte";
    import UserAvatar from "./UserAvatar.svelte";
    import {
        formatRelativeTime,
        formatTime,
        formatDate,
    } from "$lib/utils/timeUtils";
    import { formatUserName } from "$lib/utils/userUtils";
    import type { Message } from "$lib/schemas/message";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import { getUserForAttribution } from "$lib/utils/userUtils";
    import {
        File,
        Download,
        Link as LinkIcon,
        Filter,
        Bell,
        Inbox,
        Check,
        CheckCircle,
        Loader2,
    } from "lucide-svelte";
    import { toastStore } from "$lib/stores/toastStore";
    import { messageStore } from "$lib/stores/messageStore";

    // Entity type badge colors
    const entityColors: Record<string, string> = {
        process: "bg-blue-100 text-blue-800",
        case: "bg-green-100 text-green-800",
        work: "bg-orange-100 text-orange-800",
        task: "bg-orange-100 text-orange-800",
        project: "bg-purple-100 text-purple-800",
    };

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

    const entityTypeOptions = [
        { value: "process", label: "Processen" },
        { value: "case", label: "Cases" },
        { value: "work", label: "Werkitems" },
        { value: "task", label: "Werkitems" },
        { value: "project", label: "Projecten" },
    ];

    interface Props {}

    let {} = $props();

    let messages = $state<Message[]>([]);
    let readIds = $state<Record<number, boolean>>({});
    let entityNames = $state<Record<string, string>>({});
    let loading = $state(true);
    let hasSubscriptions = $state(false);
    let filterEntityType = $state<string | null>(null);
    let senders = $state<Map<string, PocketBaseUser | null>>(new Map());

    let unreadCount = $derived(
        messages.filter((m) => !readIds[m.id]).length,
    );

    async function markAsRead(messageId: number) {
        try {
            const response = await fetch("/api/subscriptions/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message_id: messageId }),
            });
            const result = await response.json();
            if (result.success) {
                readIds[messageId] = true;
                messageStore.refresh();
            }
        } catch (error) {
            console.error("Error marking message as read:", error);
        }
    }

    let markingAllAsRead = $state(false);

    async function markAllAsRead() {
        if (markingAllAsRead) return;
        markingAllAsRead = true;
        try {
            const response = await fetch("/api/subscriptions/messages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            const result = await response.json();
            if (result.success) {
                const newReadIds: Record<number, boolean> = {};
                for (const m of messages) {
                    newReadIds[m.id] = true;
                }
                readIds = newReadIds;
                messageStore.refresh();
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        } finally {
            markingAllAsRead = false;
        }
    }

    // Filter messages by entity type
    let filteredMessages = $derived(() => {
        if (!filterEntityType) return messages;
        return messages.filter(
            (m) => getEntityTypeFromSource(m.source) === filterEntityType,
        );
    });

    // Available entity types in current messages (for filter buttons)
    let availableEntityTypes = $derived(() => {
        const types = new Set<string>();
        for (const m of messages) {
            const type = getEntityTypeFromSource(m.source);
            if (type) types.add(type);
        }
        return [...types].sort();
    });

    onMount(async () => {
        await loadMessages();
    });

    async function loadMessages() {
        loading = true;
        try {
            const auth = authStore.getAuth();
            if (!auth?.user?.id) return;

            // Fetch subscriptions and messages in parallel
            const [messagesRes, subsRes] = await Promise.all([
                fetch("/api/subscriptions/messages"),
                fetch("/api/subscriptions"),
            ]);

            if (!messagesRes.ok || !subsRes.ok) {
                toastStore.add("Fout bij het laden van updates", "error");
                return;
            }

            const messagesResult = await messagesRes.json();
            const subsResult = await subsRes.json();

            if (messagesResult.success) {
                const data = messagesResult.data;
                messages = data.messages || [];
                const idsArr: number[] = data.readIds || [];
                const idsMap: Record<number, boolean> = {};
                for (const id of idsArr) idsMap[id] = true;
                readIds = idsMap;
                entityNames = data.entityNames || {};
            }

            if (subsResult.success) {
                const subs: Array<{ entity_type: string; entity_id: number }> =
                    subsResult.data || [];
                hasSubscriptions = subs.length > 0;
            }
        } catch (error) {
            console.error("Error loading subscription messages:", error);
            toastStore.add("Fout bij het laden van updates", "error");
        } finally {
            loading = false;
        }
    }

    // Load sender info when messages change
    $effect(() => {
        const senderIds = new Set<string>();
        for (const msg of messages) {
            if (msg.sender_user_id) senderIds.add(msg.sender_user_id);
        }
        for (const senderId of senderIds) {
            if (!senders.has(senderId)) {
                senders.set(senderId, null);
                senders = new Map(senders);
                getUserForAttribution(senderId).then((user) => {
                    senders.set(senderId, user);
                    senders = new Map(senders);
                });
            }
        }
    });

    function resolveEntityType(
        message: Message,
    ): string | null {
        if (message.entity_type) {
            if (
                message.entity_type === "task" ||
                message.entity_type === "work"
            )
                return "work";
            return message.entity_type;
        }
        return getEntityTypeFromSource(message.source);
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
            const key = `${type}:${id}`;
            if (entityNames[key]) return entityNames[key];
            if (message.entity_type && message.entity_type !== type) {
                const rawKey = `${message.entity_type}:${id}`;
                if (entityNames[rawKey]) return entityNames[rawKey];
            }
            return `${entityLabels[type] || type} #${id}`;
        }
        if (!message.source) return null;
        const match = message.source.match(
            /\/(processes|cases|work-items|work|projects)\/(\d+)/,
        );
        if (!match) return null;
        const rawType = match[1] === "work-items" ? "work" : match[1];
        const fallbackId = match[2];
        const key = `${rawType}:${fallbackId}`;
        if (entityNames[key]) return entityNames[key];
        const resolvedType = getEntityTypeFromSource(message.source);
        return resolvedType
            ? `${entityLabels[resolvedType] || resolvedType} #${fallbackId}`
            : `#${fallbackId}`;
    }

    function getEntityTypeFromSource(
        source: string | null | undefined,
    ): string | null {
        if (!source) return null;
        if (source.includes("/processes/")) return "process";
        if (source.includes("/cases/")) return "case";
        if (source.includes("/work-items/") || source.includes("/work/"))
            return "work";
        if (source.includes("/projects/")) return "project";
        return null;
    }

    function getMessageText(message: Message): string {
        // Prefer plain text message_text, fall back to stripping HTML from body
        if (message.message_text) return message.message_text;
        if (!message.body) return "";
        // Strip HTML tags for display
        return message.body.replace(/<[^>]*>/g, "").trim();
    }

    function isImageFile(url: string): boolean {
        const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".svg",
            ".bmp",
        ];
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some((ext) => lowerUrl.includes(ext));
    }

    function getFileName(url: string): string {
        const parts = url.split("/");
        return parts[parts.length - 1] || "bestand";
    }
</script>

<div class="flex flex-col h-full">
    {#if loading}
        <!-- Loading state -->
        <div class="flex items-center justify-center py-20">
            <Spinner size="lg" />
        </div>
    {:else if messages.length === 0 && !hasSubscriptions}
        <!-- Empty state: No subscriptions -->
        <div class="text-center py-16 px-4">
            <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-4"
            >
                <Bell size={28} class="text-zinc-400" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-900 font-aspekta mb-2">
                Geen abonnementen
            </h3>
            <p class="text-sm text-zinc-500 font-inter max-w-md mx-auto">
                Je bent nog niet geabonneerd op berichten. Ga naar een proces,
                case, of werkitem en klik op de bel om updates te ontvangen.
            </p>
        </div>
    {:else if filteredMessages().length === 0}
        <!-- Empty state: Has subscriptions but no messages (or filter returns nothing) -->
        <div class="text-center py-16 px-4">
            <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-4"
            >
                <Inbox size={28} class="text-zinc-400" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-900 font-aspekta mb-2">
                {#if filterEntityType}
                    Geen berichten gevonden
                {:else}
                    Nog geen updates
                {/if}
            </h3>
            <p class="text-sm text-zinc-500 font-inter max-w-md mx-auto">
                {#if filterEntityType}
                    Er zijn geen berichten voor het geselecteerde filter.
                {:else}
                    Er zijn nog geen berichten op je geabonneerde entiteiten.
                {/if}
            </p>
        </div>
    {:else}
        <!-- Filter bar -->
        {#if availableEntityTypes().length > 1}
            <div class="flex items-center gap-2 mb-4 px-1">
                <Filter size={16} class="text-zinc-400 shrink-0" />
                <button
                    class="px-3 py-1.5 rounded-full text-xs font-medium font-inter transition-colors {!filterEntityType
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}"
                    onclick={() => (filterEntityType = null)}
                >
                    Alles
                </button>
                {#each entityTypeOptions as option}
                    {#if availableEntityTypes().includes(option.value)}
                        <button
                            class="px-3 py-1.5 rounded-full text-xs font-medium font-inter transition-colors {filterEntityType ===
                            option.value
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}"
                            onclick={() => (filterEntityType = option.value)}
                        >
                            {option.label}
                        </button>
                    {/if}
                {/each}
            </div>
        {/if}

        <!-- Mark all as read button -->
        {#if unreadCount > 0}
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

        <!-- Messages list -->
        <div class="space-y-1">
            {#each filteredMessages() as message (message.id)}
                {@const sender = message.sender_user_id
                    ? senders.get(message.sender_user_id)
                    : null}
                {@const entityType = resolveEntityType(message)}
                {@const entityUrl = resolveEntityUrl(message)}
                {@const entityName = resolveEntityName(message)}
                {@const text = getMessageText(message)}

                <div
                    class="group rounded-lg border {!readIds[message.id]
                        ? 'border-blue-100 bg-blue-50/40'
                        : 'border-zinc-100 bg-white'} hover:border-zinc-200 p-4 transition-colors relative"
                >
                    <div class="flex gap-3">
                        <!-- Unread dot + avatar -->
                        <div class="shrink-0 mt-0.5 relative">
                            <UserAvatar user={sender ?? null} size="sm" />
                            {#if !readIds[message.id]}
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
                                        class="text-sm font-medium {!readIds[message.id]
                                            ? 'text-zinc-900'
                                            : 'text-zinc-700'} font-inter shrink-0"
                                    >
                                        {sender
                                            ? formatUserName(sender)
                                            : message.sender_email ||
                                              "Onbekend"}
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

                                <!-- Relative time + mark read action -->
                                <div class="flex items-center gap-2 shrink-0">
                                    {#if !readIds[message.id]}
                                        <button
                                            type="button"
                                            onclick={() =>
                                                markAsRead(message.id)}
                                            class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-blue-600 rounded transition-all"
                                            title="Markeer als gelezen"
                                        >
                                            <Check size={14} />
                                        </button>
                                    {/if}
                                    <time
                                        datetime={message.created_at}
                                        class="text-xs text-zinc-400 font-inter whitespace-nowrap"
                                        title={formatDate(message.created_at) +
                                            " " +
                                            formatTime(message.created_at)}
                                    >
                                        {formatRelativeTime(message.created_at)}
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
                                                    class="max-h-48 max-w-full object-cover"
                                                    loading="lazy"
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
                                                <span class="truncate"
                                                    >{getFileName(
                                                        attachment,
                                                    )}</span
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
</div>
