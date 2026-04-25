<script lang="ts">
    import type { Message, EntityReference } from "$lib/schemas/message";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import ImageViewerModal from "./ImageViewerModal.svelte";
    import IconButton from "./IconButton.svelte";
    import { Check, MailOpen, Download, File, Reply } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import * as messageService from "$lib/services/messageService";
    import { getUserMessage } from "$lib/types/errors";
    import { toastStore } from "$lib/stores/toastStore";
    import { formatUserName } from "$lib/utils/userUtils";
    import * as userUtils from "$lib/utils/userUtils";
    import { formatRelativeTime } from "$lib/utils/timeUtils";

    /**
     * FlatMessage component props
     * Renders a single message without threading indentation,
     * matching the existing MessageList item style.
     */
    interface Props {
        /** The message to display */
        message: Message;
        /** Optional callback when message is marked as read/unread */
        onMarkRead?: (messageId: number) => void;
        /** Callback when user clicks reply */
        onReply?: (messageId: number) => void;
    }

    let { message, onMarkRead, onReply }: Props = $props();

    let sender = $state<PocketBaseUser | null>(null);
    let selectedImage = $state<string | null>(null);
    let selectedImageName = $state<string | null>(null);
    let imageViewerOpen = $state(false);

    // Load sender information
    $effect(() => {
        async function loadSender() {
            if (message.sender_user_id) {
                sender = await userUtils.getUserForAttribution(
                    message.sender_user_id,
                );
            }
        }
        loadSender();
    });

    const messageText = $derived.by(() => {
        // Prefer message_text (plain text), fallback to body
        if (message.message_text && message.message_text.trim()) {
            return message.message_text;
        }
        if (message.body && message.body.trim()) {
            // If body contains HTML tags, strip them for display
            const htmlRegex = /<[^>]*>/g;
            if (htmlRegex.test(message.body)) {
                const tempDiv =
                    typeof document !== "undefined"
                        ? document.createElement("div")
                        : null;
                if (tempDiv) {
                    tempDiv.innerHTML = message.body;
                    return tempDiv.textContent || tempDiv.innerText || "";
                }
                return message.body
                    .replace(htmlRegex, "")
                    .replace(/&nbsp;/g, " ")
                    .trim();
            }
            return message.body;
        }
        return "";
    });

    const senderName = $derived(() => {
        if (message.sender_user_id && sender) {
            return formatUserName(sender);
        }
        return message.sender_email || "Onbekend";
    });

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

    function renderMessageText(
        text: string,
        references: EntityReference[] = [],
        sourceUrl?: string | null,
    ): string {
        if (!text) return "";

        // Replace @mentions with placeholders first (before HTML escaping)
        const mentionPlaceholders: Map<
            string,
            { mention: string; ref?: EntityReference }
        > = new Map();
        let placeholderIndex = 0;
        let processedText = text;

        // Process known references first
        if (references && references.length > 0) {
            for (const ref of references) {
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
                        mentionPlaceholders.set(placeholder, {
                            mention: match,
                            ref,
                        });
                        return placeholder;
                    },
                );
            }
        }

        // Also catch any @mentions that might not be in references (fallback)
        const generalMentionPattern = /@[\w\s]+(?=\s|$|,|\.|!|\?|;|:)/g;
        processedText = processedText.replace(
            generalMentionPattern,
            (match) => {
                if (!match.includes("__MENTION_PLACEHOLDER_")) {
                    const placeholder = `__MENTION_PLACEHOLDER_${placeholderIndex++}__`;
                    mentionPlaceholders.set(placeholder, { mention: match });
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

        // Replace placeholders with styled spans
        for (const [placeholder, data] of mentionPlaceholders.entries()) {
            const escapedMention = data.mention
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            if (sourceUrl) {
                html = html.replace(
                    placeholder,
                    `<span class="text-indigo-600 font-medium cursor-pointer hover:underline" style="text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;" data-source-url="${sourceUrl.replace(/"/g, "&quot;")}">${escapedMention}</span>`,
                );
            } else if (data.ref) {
                html = html.replace(
                    placeholder,
                    `<span class="text-indigo-600 font-medium cursor-pointer hover:underline" style="text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;" data-mention-type="${data.ref.type}" data-mention-id="${data.ref.id}">${escapedMention}</span>`,
                );
            } else {
                html = html.replace(
                    placeholder,
                    `<span style="text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;">${escapedMention}</span>`,
                );
            }
        }

        return html;
    }

    function handleMessageTextClick(event: MouseEvent | KeyboardEvent) {
        const target = event.target as HTMLElement;

        // Priority: if source URL is available, navigate to source
        if (target.dataset.sourceUrl) {
            goto(target.dataset.sourceUrl);
            return;
        }

        // Fallback: navigate to mentioned entity
        if (target.dataset.mentionType && target.dataset.mentionId) {
            const mentionId = target.dataset.mentionId;
            const mentionType = target.dataset.mentionType;
            const mentionName = target.textContent?.replace("@", "") || "";

            const id = /^\d+$/.test(mentionId) ? Number(mentionId) : mentionId;

            const ref: EntityReference = {
                type: mentionType as
                    | "project"
                    | "case"
                    | "task"
                    | "process"
                    | "user",
                id,
                name: mentionName,
            };
            handleMentionClick(ref);
        }
    }

    async function markAsRead(id: number) {
        const result = await messageService.markMessageAsRead(id);
        if (result.success) {
            onMarkRead?.(id);
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    async function markAsUnread(id: number) {
        const result = await messageService.markMessageAsUnread(id);
        if (result.success) {
            onMarkRead?.(id);
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
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

    function handleReplyClick() {
        onReply?.(message.id);
    }
</script>

<div
    class="border border-zinc-200 rounded-lg p-4 {!message.in_app_read
        ? 'bg-blue-50/50 border-blue-200'
        : ''}"
>
    <div class="flex items-start justify-between gap-4 mb-3">
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-semibold text-zinc-900 font-aspekta">
                    {senderName()}
                </span>
                {#if !message.in_app_read}
                    <span
                        class="inline-block px-2 py-0.5 rounded text-xs font-medium font-inter bg-blue-100 text-blue-800"
                    >
                        Nieuw
                    </span>
                {/if}
            </div>
            {#if message.subject && message.subject.trim() && message.subject !== "(Geen tekst)"}
                <div
                    class="text-sm font-medium text-zinc-800 font-aspekta mb-1"
                >
                    {message.subject}
                </div>
            {/if}
            <time class="text-xs text-zinc-500 font-inter">
                {formatRelativeTime(message.created_at)}
            </time>
        </div>
        <div class="flex gap-1">
            <IconButton
                icon={Reply}
                tooltip="Beantwoorden"
                variant="ghost"
                size="sm"
                onclick={handleReplyClick}
            />
            {#if !message.in_app_read}
                <IconButton
                    icon={Check}
                    tooltip="Markeer als gelezen"
                    onclick={() => markAsRead(message.id)}
                />
            {:else}
                <IconButton
                    icon={MailOpen}
                    tooltip="Markeer als ongelezen"
                    onclick={() => markAsUnread(message.id)}
                />
            {/if}
        </div>
    </div>

    {#if messageText.trim()}
        <div
            class="text-sm text-zinc-700 font-inter leading-relaxed mb-3 whitespace-pre-wrap break-words"
            role="button"
            tabindex={0}
            onclick={handleMessageTextClick}
            onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleMessageTextClick(e);
                }
            }}
        >
            {@html renderMessageText(
                messageText,
                message.references || [],
                message.source,
            )}
        </div>
    {:else}
        <div class="text-sm text-zinc-500 font-inter italic mb-3">
            (Geen tekst)
        </div>
    {/if}

    {#if message.references && message.references.length > 0}
        <div class="mt-2 flex flex-wrap gap-2">
            <span class="text-xs text-zinc-500 font-inter">Vermeldingen:</span>
            {#each message.references as ref}
                <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-inter bg-zinc-100 text-zinc-700"
                >
                    @{ref.name}
                    <span class="text-zinc-400">({ref.type})</span>
                </span>
            {/each}
        </div>
    {/if}

    {#if message.source}
        <div class="mt-2">
            <a
                href={message.source}
                class="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition"
            >
                <svg
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                </svg>
                <span>Verzonden vanaf {message.source}</span>
            </a>
        </div>
    {/if}

    {#if message.attachments && message.attachments.length > 0}
        <div class="mt-3 space-y-2">
            {#each message.attachments as attachment}
                {#if isImageFile(attachment)}
                    <div class="relative">
                        <button
                            type="button"
                            class="max-w-full max-h-64 rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition p-0 border-0 bg-transparent"
                            onclick={() => openImageViewer(attachment)}
                            aria-label="Open image in viewer"
                        >
                            <img
                                src={attachment}
                                alt="Attachment"
                                class="max-w-full max-h-64 rounded-lg"
                            />
                        </button>
                    </div>
                {:else}
                    <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm text-zinc-700 transition"
                    >
                        <File class="w-4 h-4" />
                        <span>{attachment.split("/").pop()}</span>
                        <Download class="w-4 h-4" />
                    </a>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<ImageViewerModal
    bind:open={imageViewerOpen}
    imageUrl={selectedImage || ""}
    imageName={selectedImageName || undefined}
    onClose={closeImageViewer}
/>
