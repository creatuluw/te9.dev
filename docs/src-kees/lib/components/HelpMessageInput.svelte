<script lang="ts">
    import Spinner from "./Spinner.svelte";
    import { Paperclip, X, Send } from "lucide-svelte";
    import * as minioService from "$lib/services/minioService";
    import * as messageService from "$lib/services/messageService";
    import { getUserMessage } from "$lib/types/errors";
    import { toastStore } from "$lib/stores/toastStore";

    interface Props {
        entityType?: string;
        entityId?: number;
        senderEmail: string;
        onSubmit?: () => void;
        placeholder?: string;
    }

    let {
        entityType,
        entityId,
        senderEmail,
        onSubmit,
        placeholder = "Typ je bericht...",
    }: Props = $props();

    let messageText = $state("");
    let attachments = $state<string[]>([]);
    let uploadingFiles = $state(false);
    let sending = $state(false);
    let fileInput: HTMLInputElement | null = $state(null);

    let isDisabled = $derived(
        (!messageText.trim() && attachments.length === 0) ||
            uploadingFiles ||
            sending,
    );

    async function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            await handleFileUpload(target.files);
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

        if (sending) return;

        if (!senderEmail || !senderEmail.includes("@")) {
            toastStore.add("Email adres is niet beschikbaar", "error");
            return;
        }

        const source =
            typeof window !== "undefined"
                ? window.location.pathname + window.location.search
                : "";

        const messageData = {
            message_text: messageText.trim() || "(Geen tekst)",
            source,
            attachments,
            entity_type: entityType,
            entity_id: entityId,
            senderEmail,
        };

        const messageTextToSend = messageText.trim() || "(Geen tekst)";
        const attachmentsToSend = [...attachments];

        messageText = "";
        attachments = [];
        sending = true;

        if (import.meta.env.DEV) {
            console.log("Creating help message with data:", messageData);
        }

        try {
            const result =
                await messageService.createMessageFromEmail(messageData);

            if (result.success) {
                if (import.meta.env.DEV) {
                    console.log(
                        "Help message created successfully:",
                        result.value,
                    );
                }
                onSubmit?.();
            } else {
                console.error("Error creating help message:", result.error);
                toastStore.add(getUserMessage(result.error), "error");
                messageText = messageTextToSend;
                attachments = attachmentsToSend;
            }
        } catch (error) {
            console.error("Exception creating help message:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het verzenden",
                "error",
            );
            messageText = messageTextToSend;
            attachments = attachmentsToSend;
        } finally {
            sending = false;
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
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
        const urlWithoutQuery = url.split("?")[0];
        const filename = urlWithoutQuery.split("/").pop() || url;
        return filename;
    }
</script>

<div class="relative flex items-center w-full">
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
        <span class="sr-only">Bestand toevoegen</span>
        <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path
                d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6 13h-5v5h-2v-5H6v-2h5V6h2v5h5v2z"
            />
        </svg>
    </label>

    <form
        class="grow flex"
        onsubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}
    >
        <div class="grow mr-3 relative">
            <label for="help-message-input" class="sr-only"
                >Typ een bericht</label
            >
            <input
                id="help-message-input"
                bind:value={messageText}
                onkeydown={handleKeyDown}
                {placeholder}
                disabled={uploadingFiles}
                class="form-input w-full bg-gray-100 dark:bg-gray-800 border-transparent dark:border-transparent focus:bg-white dark:focus:bg-gray-800 placeholder-gray-500"
                type="text"
            />
        </div>

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
                    <span class="text-sm text-gray-600">Verzenden...</span>
                </span>
            {:else}
                <span class="text-sm font-medium">Verzenden →</span>
            {/if}
        </button>
    </form>

    {#if attachments.length > 0}
        <div class="absolute bottom-full left-0 right-0 mb-2 px-4 space-y-2">
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
