<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import Button from "./Button.svelte";
    import IconButton from "./IconButton.svelte";
    import MentionAutocomplete from "./MentionAutocomplete.svelte";
    import Spinner from "./Spinner.svelte";
    import { Paperclip, X, Send, CornerDownLeft } from "lucide-svelte";
    import * as minioService from "$lib/services/minioService";
    import * as messageService from "$lib/services/messageService";
    import { getUserMessage } from "$lib/types/errors";
    import { toastStore } from "$lib/stores/toastStore";
    import type { SearchResult } from "$lib/utils/entitySearch";
    import {
        createReplyState,
        type ReplyState,
    } from "$lib/composables/useReplyState";

    /**
     * MessageInput component props
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
         * Callback when message is submitted
         */
        onSubmit?: () => void;

        /**
         * Placeholder text
         */
        placeholder?: string;

        /**
         * Message ID if editing (will update instead of create)
         */
        editingMessageId?: number | null;

        /**
         * Initial message text (for editing)
         */
        initialText?: string;

        /**
         * Initial attachments (for editing)
         */
        initialAttachments?: string[];

        /**
         * Callback when edit is cancelled
         */
        onCancelEdit?: () => void;

        /**
         * Message ID being replied to (optional, for threaded replies)
         */
        replyToId?: number | null;

        /**
         * Callback when reply is cleared (cancelled)
         */
        onClearReply?: () => void;
    }

    let {
        entityType,
        entityId,
        onSubmit,
        placeholder = "Typ je bericht...",
        editingMessageId = null,
        initialText = "",
        initialAttachments = [],
        onCancelEdit,
        replyToId = null,
        onClearReply,
    }: Props = $props();

    let messageText = $state("");
    let attachments = $state<string[]>([]);
    let uploadingFiles = $state(false);
    let sending = $state(false);
    let fileInput: HTMLInputElement | null = $state(null);
    let textareaRef: HTMLInputElement | null = $state(null);
    let mentionQuery = $state("");
    let mentionPosition = $state<{ top: number; left: number } | null>(null);
    let showMentionAutocomplete = $state(false);
    let cursorPosition = $state(0);

    // Store selected mentions with their user IDs
    // Format: Map<mentionText, { userId: string, name: string, type: string }>
    let selectedMentions = $state<
        Map<string, { userId: string; name: string; type: string }>
    >(new Map());

    // Reply state management via composable
    const replyState: ReplyState = createReplyState();

    // Update state when initial values change (for editing)
    $effect(() => {
        if (editingMessageId !== null && initialText) {
            messageText = initialText;
            attachments = [...initialAttachments];
        } else if (editingMessageId === null) {
            // Clear when not editing
            messageText = "";
            attachments = [];
        }
    });

    // Sync replyToId prop into reply state
    $effect(() => {
        if (replyToId !== null && replyToId !== undefined) {
            replyState.setReplyTo(replyToId);
        } else {
            replyState.clearReply();
        }
    });

    // Derived state for button disabled status
    let isDisabled = $derived(
        (!messageText.trim() && attachments.length === 0) ||
            uploadingFiles ||
            sending,
    );
    let isEditing = $derived(editingMessageId !== null);
    let isReplying = $derived(replyState.isReplying);

    function handleTextareaInput(event: Event) {
        const target = event.target as HTMLInputElement;
        messageText = target.value;
        cursorPosition = target.selectionStart || 0;

        // Check for @mention trigger
        const textBeforeCursor = messageText.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if we're still typing the mention (no space or punctuation after @)
            if (!textAfterAt.match(/[\s.,!?;:]/)) {
                mentionQuery = textAfterAt;

                // Set initial position immediately (will be updated in next tick)
                if (textareaRef) {
                    const rect = textareaRef.getBoundingClientRect();
                    // Position above the input field (estimate dropdown height ~256px for max-h-64)
                    const estimatedDropdownHeight = 256;
                    const top =
                        rect.top + window.scrollY - estimatedDropdownHeight - 5;
                    const left = rect.left + window.scrollX + 10;
                    mentionPosition = { top, left };
                } else {
                    // Fallback position if ref is not available
                    mentionPosition = { top: 100, left: 100 };
                }

                showMentionAutocomplete = true;

                // Update position in next tick to ensure accurate positioning
                setTimeout(() => {
                    if (textareaRef && showMentionAutocomplete) {
                        const rect = textareaRef.getBoundingClientRect();
                        // Position above the input field
                        const estimatedDropdownHeight = 256;
                        const top =
                            rect.top +
                            window.scrollY -
                            estimatedDropdownHeight -
                            5;
                        const left = rect.left + window.scrollX + 10;
                        mentionPosition = { top, left };
                    }
                }, 0);
            } else {
                showMentionAutocomplete = false;
                mentionQuery = "";
                mentionPosition = null;
            }
        } else {
            showMentionAutocomplete = false;
            mentionQuery = "";
            mentionPosition = null;
        }
    }

    function handleMentionSelect(result: SearchResult) {
        if (!textareaRef) return;

        const textBeforeCursor = messageText.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

            // Only store user mentions (not projects, cases, etc.)
            if (result.type === "user" && result.id) {
                const mentionText = `@${result.name}`;
                selectedMentions.set(mentionText, {
                    userId: result.id as string,
                    name: result.name,
                    type: result.type,
                });
            }

            const newText =
                messageText.substring(0, lastAtIndex) +
                `@${result.name} ` +
                messageText.substring(cursorPosition);

            messageText = newText;
            showMentionAutocomplete = false;
            mentionQuery = "";

            // Focus back on textarea
            setTimeout(() => {
                if (textareaRef) {
                    const newPosition = lastAtIndex + result.name.length + 2; // +2 for @ and space
                    textareaRef.focus();
                    textareaRef.setSelectionRange(newPosition, newPosition);
                }
            }, 0);
        }
    }

    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            handleFileUpload(target.files);
        }
    }

    async function handleFileUpload(files: FileList) {
        if (files.length === 0) return;

        uploadingFiles = true;
        const fileArray = Array.from(files);
        const newUrls: string[] = [];

        try {
            const folder = entityId ? `messages/${entityId}` : "messages";

            for (const file of fileArray) {
                const result = await minioService.uploadFile(
                    file,
                    folder,
                    entityId,
                );
                if (result.success) {
                    if (result.value.url) {
                        newUrls.push(result.value.url);
                    }
                } else {
                    toastStore.add(
                        `Fout bij uploaden van ${file.name}: ${getUserMessage(result.error)}`,
                        "error",
                    );
                }
            }

            if (newUrls.length > 0) {
                attachments = [...attachments, ...newUrls];
                toastStore.add(
                    `${newUrls.length} bestand(en) geüpload`,
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
            uploadingFiles = false;
            if (fileInput) {
                fileInput.value = "";
            }
        }
    }

    function removeAttachment(index: number) {
        attachments = attachments.filter((_, i) => i !== index);
    }

    async function handleSubmit() {
        if (!messageText.trim() && attachments.length === 0) {
            return;
        }

        if (sending) return; // Prevent double submission

        // If editing, update the message instead of creating a new one
        if (isEditing && editingMessageId !== null) {
            sending = true;
            const result = await messageService.updateMessage(
                editingMessageId,
                {
                    message_text: messageText.trim(),
                    attachments,
                },
            );

            if (result.success) {
                messageText = "";
                attachments = [];
                showMentionAutocomplete = false;
                mentionQuery = "";
                toastStore.add("Bericht bijgewerkt", "success");
                onSubmit?.();
                onCancelEdit?.();
            } else {
                console.error("Error updating message:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
            }
            sending = false;
            return;
        }

        // Get current page URL as source
        const source =
            typeof window !== "undefined"
                ? window.location.pathname + window.location.search
                : "";

        // Build references from selected mentions
        const references: Array<{
            type: "user" | "project" | "case" | "task" | "process";
            id: string;
            name: string;
        }> = [];
        for (const [mentionText, mentionData] of selectedMentions.entries()) {
            // Check if this mention is still in the message text
            if (messageText.includes(mentionText)) {
                references.push({
                    type: mentionData.type as
                        | "user"
                        | "project"
                        | "case"
                        | "task"
                        | "process",
                    id: mentionData.userId,
                    name: mentionData.name,
                });
            }
        }

        // Build base message data
        const baseMessageData = {
            message_text: messageText.trim() || "(Geen tekst)",
            source,
            attachments,
            entity_type: entityType,
            entity_id: entityId,
            // Pass pre-resolved references to skip searching
            preResolvedReferences:
                references.length > 0 ? references : undefined,
        };

        // Resolve thread context if replying to a message
        let threadContext = null;
        if (replyState.isReplying) {
            threadContext = await replyState.getThreadContext(source);
        }

        // Merge thread context into message data when available
        const messageData = {
            ...baseMessageData,
            ...(replyState.replyToId !== null
                ? { parent_message_id: replyState.replyToId }
                : {}),
            ...(threadContext
                ? {
                      conversation_id: threadContext.conversation_id,
                      thread_depth: threadContext.thread_depth,
                      thread_path: threadContext.thread_path,
                  }
                : {}),
        };

        // Store message data for error recovery
        const messageTextToSend = messageText.trim() || "(Geen tekst)";
        const attachmentsToSend = [...attachments];

        // Clear input immediately for better UX
        messageText = "";
        attachments = [];
        selectedMentions.clear(); // Clear stored mentions
        showMentionAutocomplete = false;
        mentionQuery = "";
        replyState.clearReply(); // Clear reply state
        sending = true;

        if (import.meta.env.DEV) {
            console.log("Creating message with data:", messageData);
        }

        try {
            const result = await messageService.createMessage(messageData);

            if (result.success) {
                if (import.meta.env.DEV) {
                    console.log("Message created successfully:", result.value);
                }
                // Call onSubmit after message is created so it can reload and show the new message
                onSubmit?.();
            } else {
                console.error("Error creating message:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
                // Restore input on error
                messageText = messageTextToSend;
                attachments = attachmentsToSend;
            }
        } catch (error) {
            console.error("Exception creating message:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het verzenden",
                "error",
            );
            // Restore input on error
            messageText = messageTextToSend;
            attachments = attachmentsToSend;
        } finally {
            sending = false;
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        // Submit on Ctrl+Enter or Cmd+Enter
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
        }

        // Close autocomplete on Escape
        if (event.key === "Escape" && showMentionAutocomplete) {
            showMentionAutocomplete = false;
            mentionQuery = "";
        }

        // Cancel reply on Escape when not in autocomplete
        if (
            event.key === "Escape" &&
            !showMentionAutocomplete &&
            replyState.isReplying
        ) {
            replyState.clearReply();
            onClearReply?.();
        }
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
</script>

<div class="relative w-full">
    <!-- Reply indicator bar (shown above input when replying) -->
    {#if isReplying}
        <div
            class="flex items-center gap-2 px-3 py-1.5 mb-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-t-lg text-sm text-blue-700 dark:text-blue-300"
        >
            <CornerDownLeft class="w-4 h-4 shrink-0" />
            <span class="truncate">
                Beantwoorden op bericht <span class="font-semibold"
                    >#{replyState.replyToId}</span
                >
            </span>
            <button
                type="button"
                onclick={() => {
                    replyState.clearReply();
                    onClearReply?.();
                }}
                class="ml-auto shrink-0 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition"
                aria-label="Annuleer reactie"
            >
                <X class="w-4 h-4" />
            </button>
        </div>
    {/if}

    <div class="relative flex items-center w-full">
        <!-- Plus button -->
        <label
            class="shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 mr-3 cursor-pointer"
        >
            <input
                bind:this={fileInput}
                type="file"
                multiple
                class="hidden"
                onchange={handleFileSelect}
                disabled={uploadingFiles}
            />
            <span class="sr-only">Toevoegen</span>
            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path
                    d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12C23.98 5.38 18.62.02 12 0zm6 13h-5v5h-2v-5H6v-2h5V6h2v5h5v2z"
                />
            </svg>
        </label>

        <!-- Message input -->
        <form
            class="grow flex"
            onsubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
        >
            <div class="grow mr-3 relative">
                <label for="message-input" class="sr-only"
                    >Typ een bericht</label
                >
                <input
                    id="message-input"
                    bind:this={textareaRef}
                    bind:value={messageText}
                    oninput={handleTextareaInput}
                    onkeydown={handleKeyDown}
                    {placeholder}
                    disabled={uploadingFiles}
                    class="form-input w-full bg-gray-100 dark:bg-gray-800 border-transparent dark:border-transparent focus:bg-white dark:focus:bg-gray-800 placeholder-gray-500"
                    type="text"
                />

                <!-- Mention autocomplete -->
                {#if showMentionAutocomplete && mentionPosition}
                    <MentionAutocomplete
                        query={mentionQuery}
                        position={mentionPosition}
                        onSelect={handleMentionSelect}
                        onClose={() => {
                            showMentionAutocomplete = false;
                            mentionQuery = "";
                            mentionPosition = null;
                        }}
                    />
                {/if}
            </div>

            <!-- Cancel button (when editing) -->
            {#if isEditing}
                <Button
                    type="button"
                    variant="secondary"
                    onclick={() => {
                        messageText = "";
                        attachments = [];
                        onCancelEdit?.();
                    }}
                    class="whitespace-nowrap mr-2"
                >
                    Annuleren
                </Button>
            {/if}

            <!-- Send/Update button -->
            <button
                type="submit"
                disabled={isDisabled}
                class="btn whitespace-nowrap {isDisabled
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-[#FF6900] text-white hover:bg-[#E55A00]'}"
            >
                {#if sending}
                    <span class="inline-flex items-center gap-2">
                        <Spinner size="xs" />
                        Verzenden...
                    </span>
                {:else}
                    {isEditing ? "Bijwerken →" : "Verzenden →"}
                {/if}
            </button>
        </form>

        <!-- Attachments preview (shown above input when present) -->
        {#if attachments.length > 0}
            <div
                class="absolute bottom-full left-0 right-0 mb-2 px-4 space-y-2"
            >
                {#each attachments as attachment, index}
                    <div
                        class="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                        {#if isImageFile(attachment)}
                            <img
                                src={attachment}
                                alt="Preview"
                                class="w-12 h-12 object-cover rounded"
                            />
                        {:else}
                            <div
                                class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
                            >
                                <Paperclip
                                    class="w-5 h-5 text-gray-500 dark:text-gray-400"
                                />
                            </div>
                        {/if}
                        <div class="flex-1 min-w-0">
                            <p
                                class="text-xs text-gray-600 dark:text-gray-400 truncate"
                            >
                                {getFilename(attachment)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onclick={() => removeAttachment(index)}
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        >
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
