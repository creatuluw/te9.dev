<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import HelpMessageInput from "./HelpMessageInput.svelte";
	import Spinner from "./Spinner.svelte";
	import UserAvatar from "./UserAvatar.svelte";
	import Tooltip from "./Tooltip.svelte";
	import * as messageService from "$lib/services/messageService";
	import { getUserMessage } from "$lib/types/errors";
	import { toastStore } from "$lib/stores/toastStore";
	import { getCurrentUserId } from "$lib/utils/userUtils";
	import {
		getUserForAttribution,
		formatUserName
	} from "$lib/utils/userUtils";
	import {
		formatTime,
		formatDate
	} from "$lib/utils/timeUtils";
	import type { Message } from "$lib/schemas/message";
	import type { PocketBaseUser } from "$lib/services/pocketbaseService";
	import { Download } from "lucide-svelte";
	import ImageViewerModal from "./ImageViewerModal.svelte";

	interface Props {
		entityType?: string;
		entityId?: number;
		senderEmail: string;
	}

	let { entityType, entityId, senderEmail }: Props = $props();

	let messages = $state<Message[]>([]);
	let loading = $state(true);
	let senders = $state<Map<string, PocketBaseUser | null>>(new Map());
	let contentArea: HTMLDivElement | null = $state(null);
	let currentUserId = $state<string | null>(null);
	let imageViewerOpen = $state(false);
	let selectedImageUrl = $state<string | null>(null);
	let selectedImageName = $state<string | null>(null);

	onMount(async () => {
		currentUserId = getCurrentUserId();
		await loadMessages();
	});

	async function loadMessages() {
		loading = true;
		try {
			if (!entityType || !entityId) {
			messages = [];
			senders = new Map();
			return;
		}

		const result = await messageService.getMessagesByEntity({ entityType, entityId: entityId });
			if (result.success) {
				const sortedMessages = result.value.sort(
					(a, b) =>
						new Date(a.created_at).getTime() -
						new Date(b.created_at).getTime()
				);
				messages = sortedMessages;

				const senderIds = new Set<string>();
				for (const msg of sortedMessages) {
					if (msg.sender_user_id) {
						senderIds.add(msg.sender_user_id);
					}
					if (msg.sender_email) {
						senderIds.add(msg.sender_email);
					}
				}

				const newSenders = new Map<string, PocketBaseUser | null>();
				for (const senderId of senderIds) {
					if (senderId && !senderId.includes('@')) {
						const user = await getUserForAttribution(senderId);
						newSenders.set(senderId, user);
					} else {
						newSenders.set(senderId, null);
					}
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
		await loadMessages();
		setTimeout(() => {
			if (contentArea) {
				contentArea.scrollTop = contentArea.scrollHeight;
			}
		}, 100);
	}

	function shouldShowDateSeparator(index: number): boolean {
		if (index === 0) return true;

		const currentMsg = messages[index];
		const previousMsg = messages[index - 1];

		const currentDate = new Date(currentMsg.created_at);
		const previousDate = new Date(previousMsg.created_at);

		currentDate.setHours(0, 0, 0, 0);
		previousDate.setHours(0, 0, 0, 0);

		return currentDate.getTime() !== previousDate.getTime();
	}

	function isImageFile(url: string): boolean {
		const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
		const lowerUrl = url.toLowerCase();
		return imageExtensions.some((ext) => lowerUrl.includes(ext));
	}

	function getFilename(url: string): string {
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
		// Debug logging
		if (import.meta.env.DEV) {
			console.log('[HelpMessagesTab] isCurrentUser check:', {
				senderEmail,
				msg_sender_user_id: msg.sender_user_id,
				msg_sender_email: msg.sender_email,
				currentUserId,
				msg_source: msg.source,
				isFromHelpPage: msg.source?.includes('/help'),
				isCurrentUser: !msg.sender_user_id && msg.sender_email === senderEmail
			});
		}
		
		// Check if message is from help page (source contains "/help")
		const isFromHelpPage = msg.source?.includes('/help');
		
		// If message is from help page, only show as "current user" if email matches
		if (isFromHelpPage) {
			return msg.sender_email === senderEmail;
		}
		
		// If message is from work page, never show as "current user" for help page viewer
		return false;
	}

	function renderMessageText(
		text: string | null | undefined,
		references: Array<{ type: string; id: number | string; name: string; }> = []
	): string {
		if (!text) return "";

		// Replace @mentions with placeholders first (before HTML escaping)
		const mentionPlaceholders: Map<string, string> = new Map();
		let placeholderIndex = 0;
		let processedText = text;

		// Process known references first
		if (references && references.length > 0) {
			for (const ref of references) {
				const escapedName = ref.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const mentionPattern = new RegExp(`@${escapedName}(?![\\w])`, "gi");
				processedText = processedText.replace(mentionPattern, (match) => {
					const placeholder = `__MENTION_PLACEHOLDER_${placeholderIndex++}__`;
					mentionPlaceholders.set(placeholder, match);
					return placeholder;
				});
			}
		}

		// Also catch any @mentions that might not be in references (fallback)
		const generalMentionPattern = /@[\w\s]+(?=\s|$|,|\.|!|\?|;|:)/g;
		processedText = processedText.replace(generalMentionPattern, (match) => {
			if (!match.includes("__MENTION_PLACEHOLDER_")) {
				const placeholder = `__MENTION_PLACEHOLDER_${placeholderIndex++}__`;
				mentionPlaceholders.set(placeholder, match);
				return placeholder;
			}
			return match;
		});

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
				`<span style="text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px;">${escapedMention}</span>`
			);
		}

		return html;
	}
</script>

<div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
	<!-- Messages body -->
	<div
		bind:this={contentArea}
		class="flex-1 overflow-y-auto px-4 sm:px-6 md:px-5 py-6 relative min-h-0 w-full"
	>
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<Spinner size="lg" />
			</div>
		{:else if messages.length === 0}
			<div class="text-center py-12 text-gray-500 dark:text-gray-400">
				<p class="text-sm">Geen berichten gevonden.</p>
			</div>
		{:else}
			{#each messages as message, index (message.id)}
				{@const messageContent = (message.message_text ?? message.body ?? "").trim()}
				
				{#if shouldShowDateSeparator(index)}
					<!-- Date separator -->
					<div class="flex justify-center my-5">
						<div class="inline-flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 font-medium px-2.5 py-1 bg-white dark:bg-gray-700 shadow-xs rounded-full">
							{formatDate(message.created_at)}
						</div>
					</div>
				{/if}

				<!-- Chat message -->
				<div
					id="message-{message.id}"
					class="flex items-start mb-4 last:mb-0 group"
					class:justify-end={isCurrentUser(message)}
					class:justify-start={!isCurrentUser(message)}
				>
                    {#if !isCurrentUser(message)}
                        <UserAvatar
                            user={senders.get(message.sender_user_id || "") || null}
                            size="md"
                            class="rounded-full mr-4 shrink-0"
                            title={message.sender_email || 'Onbekend'}
                        />
                    {/if}

					<div class="max-w-[70%]" class:order-2={isCurrentUser(message)}>
						<div
							class="text-sm px-3 py-2 rounded-lg mb-1"
							class:bg-[#FF6900]={isCurrentUser(message)}
							class:text-white={isCurrentUser(message)}
							class:rounded-tr-none={isCurrentUser(message)}
							class:bg-[#777]={!isCurrentUser(message)}
							class:rounded-tl-none={!isCurrentUser(message)}
						>
							{#if !isCurrentUser(message)}
								<div class="font-medium mb-1 text-white">
									{getSenderName(message)}
								</div>
							{/if}

							{#if messageContent}
								<div class="whitespace-pre-wrap break-words text-white">
									{@html renderMessageText(messageContent, message.references || [])}
								</div>
							{/if}

							{#if message.attachments && message.attachments.length > 0}
								<div class="mt-2 space-y-2">
									{#each message.attachments as attachment}
										{#if isImageFile(attachment)}
											<div class="flex items-start">
												<button
													type="button"
													class="rounded-lg shadow-xs max-w-[240px] max-h-[180px] object-cover cursor-pointer hover:opacity-90 transition p-0 border-0 bg-transparent"
													onclick={() => openImageViewer(attachment)}
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
													onclick={() => window.open(attachment, "_blank")}
												>
													<span class="sr-only">Downloaden</span>
													<Download class="w-4 h-4 text-gray-400 dark:text-gray-500" />
												</button>
											</div>
										{:else}
											<a
												href={attachment}
												target="_blank"
												rel="noopener noreferrer"
												class="inline-flex items-center gap-2 px-3 py-2 bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-700/70 rounded-lg text-sm transition"
											>
												<Download class="w-4 h-4" />
												<span>{getFilename(attachment)}</span>
											</a>
										{/if}
									{/each}
								</div>
							{/if}
						</div>

						<div
							class="flex items-center justify-between"
							class:flex-row-reverse={isCurrentUser(message)}
						>
							<div class="text-xs text-gray-500 dark:text-gray-400 font-medium">
								{formatTime(message.created_at)}
							</div>
							{#if isCurrentUser(message) && message.in_app_read}
								<svg
									class="w-3 h-3 shrink-0 fill-current text-gray-400 dark:text-gray-500"
									viewBox="0 0 12 12"
								>
									<path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28-1.28z" />
								</svg>
							{/if}
						</div>
					</div>

					{#if isCurrentUser(message)}
						<UserAvatar
                            user={senders.get(message.sender_user_id || "") || null}
                            size="md"
                            class="rounded-full ml-4 order-3 shrink-0"
                            title={message.sender_email || 'Onbekend'}
                        />
                    {/if}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Footer -->
	<div class="flex-shrink-0 mt-auto border-t border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900">
		<div class="relative flex items-center justify-between px-4 sm:px-6 md:px-5 h-16">
			<HelpMessageInput
				{entityType}
				{entityId}
				{senderEmail}
				onSubmit={handleMessageSubmit}
				placeholder="Typ je bericht..."
			/>
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
