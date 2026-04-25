<script lang="ts">
    import {
        Send,
        Loader2,
        MessageSquare,
        ClipboardList,
        Trash2,
    } from "lucide-svelte";
    import Button from "./Button.svelte";
    import Markdown from "./Markdown.svelte";
    import Tooltip from "./Tooltip.svelte";
    import WorkItemCard from "./WorkItemCard.svelte";
    import IconButton from "./IconButton.svelte";
    import * as tinyTalkService from "$lib/services/tinyTalkService";
    import type {
        ChatMessage,
        ChatIntention,
    } from "$lib/services/tinyTalkService";
    import * as taskByChatService from "$lib/services/taskByChatService";
    import { toastStore } from "$lib/stores/toastStore";
    import type { Task } from "$lib/schemas/task";
    import type { UnifiedPlanningItem } from "$lib/services/taskService";
    import { browser } from "$app/environment";
    import {
        loadChatHistory,
        saveChatHistory,
        clearChatHistory,
        shouldSuggestClearingHistory,
    } from "$lib/utils/chatHistory";
    import { taskStore } from "$lib/stores/taskStore";
    import * as taskService from "$lib/services/taskService";

    type ChatMode = "chat" | "task";

    /**
     * ChatDrawer component props
     *
     * Placeholder chat interface drawer component.
     */
    interface Props {
        /**
         * Additional CSS classes
         */
        class?: string;

        /**
         * Current chat mode (from URL)
         */
        mode?: ChatMode;

        /**
         * Callback to notify parent of mode changes (for drawer width adjustment and URL update)
         */
        onmodechange?: (mode: ChatMode) => void;
    }

    let {
        class: className = "",
        mode: propMode,
        onmodechange,
    }: Props = $props();

    // Get bot ID from environment
    const tinyBotId = import.meta.env.PUBLIC_TINYTALK_BOT_ID || "";

    // Chat mode: 'chat' for general assistance, 'task' for task creation
    // Use prop mode if provided (from URL), otherwise default to 'chat'
    let chatMode = $state<ChatMode>(propMode || "chat");

    // Track if we're updating from prop to prevent infinite loops
    let isUpdatingFromProp = $state(false);

    // Sync with prop mode changes (from URL) - only when prop actually changes
    $effect(() => {
        if (propMode && propMode !== chatMode) {
            isUpdatingFromProp = true;
            chatMode = propMode;
            // Reset flag after a microtask to allow other effects to run
            queueMicrotask(() => {
                isUpdatingFromProp = false;
            });
        }
    });

    // Chat messages - will be initialized based on mode
    let messages = $state<
        Array<{ text: string; isBot: boolean; timestamp: Date }>
    >([]);
    let currentMessage = $state("");
    let sending = $state(false);
    let creatingTasks = $state(false);

    // Conversation history for TinyTalk API
    let conversationHistory = $state<ChatMessage[]>([]);

    // Created tasks in task mode
    let createdTasks = $state<Task[]>([]);

    // Track if we should suggest clearing history
    let shouldSuggestClear = $state(false);

    // Track if we're waiting for clarification
    let waitingForClarification = $state(false);
    let pendingClarificationQuestions = $state<string[]>([]);

    // Track deletion confirmation
    let pendingDeletion = $state<{
        taskId: number;
        taskSubject: string;
    } | null>(null);

    // Track deletion clarification (when asking which task to delete)
    let waitingForDeletionClarification = $state(false);

    // Track created task IDs for update detection
    let createdTaskIds = $derived(createdTasks.map((t) => t.id));

    // Sort tasks by update timestamp (most recently updated first)
    const sortedCreatedTasks = $derived.by(() => {
        return [...createdTasks].sort((a, b) => {
            const aTime = a.updated_at
                ? new Date(a.updated_at).getTime()
                : a.created_at
                  ? new Date(a.created_at).getTime()
                  : 0;
            const bTime = b.updated_at
                ? new Date(b.updated_at).getTime()
                : b.created_at
                  ? new Date(b.created_at).getTime()
                  : 0;
            return bTime - aTime; // Most recently updated first
        });
    });

    // Track if history has been loaded to prevent infinite loops
    let historyLoaded = $state(false);
    let isLoadingHistory = $state(false);

    /**
     * Load chat history from localStorage
     */
    function loadHistory() {
        if (!browser || isLoadingHistory || historyLoaded) return;

        isLoadingHistory = true;
        try {
            const history = loadChatHistory();
            if (history) {
                // Restore mode
                chatMode = history.mode;

                // Restore messages (convert timestamps back to Date objects)
                messages = history.messages.map((msg) => ({
                    text: msg.text,
                    isBot: msg.isBot,
                    timestamp: new Date(msg.timestamp),
                })) as Array<{ text: string; isBot: boolean; timestamp: Date }>;

                // Restore conversation history
                conversationHistory = history.conversationHistory;

                // Restore created tasks
                createdTasks = history.createdTasks || [];

                // Check if we should suggest clearing
                shouldSuggestClear = shouldSuggestClearingHistory();
            }
            historyLoaded = true;
        } finally {
            isLoadingHistory = false;
        }
    }

    /**
     * Save chat history to localStorage
     */
    function saveHistory() {
        if (!browser || isLoadingHistory) return; // Don't save while loading

        saveChatHistory({
            mode: chatMode,
            messages,
            conversationHistory,
            createdTasks,
        });

        // Check if we should suggest clearing after saving
        shouldSuggestClear = shouldSuggestClearingHistory();
    }

    /**
     * Clear chat history
     */
    function clearHistory() {
        if (!browser) return;

        clearChatHistory();
        messages = [];
        conversationHistory = [];
        createdTasks = [];
        shouldSuggestClear = false;

        // Re-initialize with welcome message
        initializeMessages();

        toastStore.add("Chat geschiedenis gewist", "success", 3000);
    }

    /**
     * Initialize messages based on current mode
     */
    function initializeMessages() {
        if (chatMode === "task") {
            messages = [
                {
                    text: 'Hallo! Ik ben je **AI-assistent voor taken**. Ik help je met het aanmaken van taken.\n\n**Voorbeelden:**\n- "Maak een taak: nieuwe login pagina bouwen voor klanten, deadline 15 februari"\n- "Ik moet 3 taken maken: dashboard updaten, API integratie, bug fixen"\n\nBeschrijf gewoon wat je nodig hebt en ik maak de taken voor je aan!',
                    isBot: true,
                    timestamp: new Date(),
                },
            ];
            conversationHistory = [
                {
                    role: "assistant",
                    content:
                        "Hallo! Ik ben je AI-assistent voor taken. Ik help je met het aanmaken van taken. Beschrijf gewoon wat je nodig hebt en ik maak de taken voor je aan!",
                },
            ];
        } else {
            messages = [
                {
                    text: "Hallo! Ik ben je **AI-assistent**. Hoe kan ik je helpen?\n\nJe kunt markdown gebruiken in je berichten.",
                    isBot: true,
                    timestamp: new Date(),
                },
            ];
            conversationHistory = [
                {
                    role: "assistant",
                    content:
                        "Hallo! Ik ben je AI-assistent. Hoe kan ik je helpen?\n\nJe kunt markdown gebruiken in je berichten.",
                },
            ];
        }
    }

    // Load history on mount (only once)
    $effect(() => {
        if (browser && !historyLoaded) {
            loadHistory();
            // If no history loaded, initialize with welcome message
            // Use a small delay to ensure loadHistory completes first
            setTimeout(() => {
                if (messages.length === 0 && !isLoadingHistory) {
                    initializeMessages();
                }
            }, 100);
        }
    });

    // Save history when messages, conversation, tasks, or mode change
    // Only save after history has been loaded to prevent saving during initial load
    $effect(() => {
        if (
            browser &&
            historyLoaded &&
            !isLoadingHistory &&
            (messages.length > 0 || createdTasks.length > 0)
        ) {
            // Debounce saves to avoid too frequent localStorage writes
            const timeoutId = setTimeout(() => {
                saveHistory();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    });

    // Notify parent of mode changes - only when mode changes from user interaction (not from prop)
    $effect(() => {
        // Don't notify if we're updating from prop (to prevent infinite loops)
        if (!isUpdatingFromProp && chatMode !== propMode) {
            onmodechange?.(chatMode);
        }
    });

    // Listen for task updates from taskStore
    $effect(() => {
        if (!browser || createdTaskIds.length === 0) return;

        const unsubscribe = taskStore.subscribe((storeData) => {
            // Check if any of our created tasks were updated
            const updatedTasks: Task[] = [];
            let hasUpdates = false;

            // Check planning items
            for (const planningItem of storeData.planningItems) {
                if (
                    createdTaskIds.includes(planningItem.id) &&
                    planningItem.type === "work_item"
                ) {
                    // Find the original task
                    const originalTask = createdTasks.find(
                        (t) => t.id === planningItem.id,
                    );
                    if (originalTask) {
                        // Check if anything changed
                        const changed =
                            originalTask.subject !== planningItem.subject ||
                            originalTask.voor_wie_is_het !==
                                planningItem.voor_wie_is_het ||
                            originalTask.wat_ga_je_doen !==
                                planningItem.wat_ga_je_doen ||
                            originalTask.waarom_doe_je_het !==
                                planningItem.waarom_doe_je_het ||
                            originalTask.deadline !== planningItem.deadline ||
                            originalTask.uren !== planningItem.uren ||
                            originalTask.status !== planningItem.status ||
                            originalTask.kanban_status !==
                                planningItem.kanban_status;

                        if (changed) {
                            // Convert UnifiedPlanningItem to WorkItem
                            const updatedWorkItem: Task = {
                                ...originalTask,
                                subject: planningItem.subject,
                                voor_wie_is_het:
                                    planningItem.voor_wie_is_het || null,
                                wat_ga_je_doen:
                                    planningItem.wat_ga_je_doen || null,
                                waarom_doe_je_het:
                                    planningItem.waarom_doe_je_het || null,
                                deadline: planningItem.deadline || null,
                                uren: planningItem.uren || null,
                                status: planningItem.status,
                                kanban_status: planningItem.kanban_status,
                                updated_at: new Date().toISOString(),
                            };

                            updatedTasks.push(updatedWorkItem);
                            hasUpdates = true;
                        }
                    }
                }
            }

            // Check backlog items
            for (const backlogItem of storeData.backlogItems) {
                if (
                    createdTaskIds.includes(backlogItem.id) &&
                    backlogItem.type === "work_item"
                ) {
                    const originalTask = createdTasks.find(
                        (t) => t.id === backlogItem.id,
                    );
                    if (originalTask) {
                        const changed =
                            originalTask.subject !== backlogItem.subject ||
                            originalTask.voor_wie_is_het !==
                                backlogItem.voor_wie_is_het ||
                            originalTask.wat_ga_je_doen !==
                                backlogItem.wat_ga_je_doen ||
                            originalTask.waarom_doe_je_het !==
                                backlogItem.waarom_doe_je_het ||
                            originalTask.deadline !== backlogItem.deadline ||
                            originalTask.uren !== backlogItem.uren ||
                            originalTask.status !== backlogItem.status ||
                            originalTask.kanban_status !==
                                backlogItem.kanban_status;

                        if (changed) {
                            const updatedWorkItem: Task = {
                                ...originalTask,
                                subject: backlogItem.subject,
                                voor_wie_is_het:
                                    backlogItem.voor_wie_is_het || null,
                                wat_ga_je_doen:
                                    backlogItem.wat_ga_je_doen || null,
                                waarom_doe_je_het:
                                    backlogItem.waarom_doe_je_het || null,
                                deadline: backlogItem.deadline || null,
                                uren: backlogItem.uren || null,
                                status: backlogItem.status || "",
                                kanban_status: backlogItem.kanban_status || "",
                                updated_at: new Date().toISOString(),
                            };

                            updatedTasks.push(updatedWorkItem);
                            hasUpdates = true;
                        }
                    }
                }
            }

            if (hasUpdates) {
                // Notify AI about updates before updating the array
                for (const updatedTask of updatedTasks) {
                    const originalTask = createdTasks.find(
                        (t) => t.id === updatedTask.id,
                    );
                    if (originalTask) {
                        const changes: string[] = [];
                        if (originalTask.subject !== updatedTask.subject) {
                            changes.push(
                                `onderwerp: "${originalTask.subject}" → "${updatedTask.subject}"`,
                            );
                        }
                        if (originalTask.deadline !== updatedTask.deadline) {
                            changes.push(
                                `deadline: ${originalTask.deadline || "geen"} → ${updatedTask.deadline || "geen"}`,
                            );
                        }
                        if (originalTask.uren !== updatedTask.uren) {
                            changes.push(
                                `uren: ${originalTask.uren || "geen"} → ${updatedTask.uren || "geen"}`,
                            );
                        }
                        if (originalTask.status !== updatedTask.status) {
                            changes.push(
                                `status: ${originalTask.status} → ${updatedTask.status}`,
                            );
                        }
                        if (
                            originalTask.kanban_status !==
                            updatedTask.kanban_status
                        ) {
                            changes.push(
                                `kanban status: ${originalTask.kanban_status} → ${updatedTask.kanban_status}`,
                            );
                        }

                        if (changes.length > 0) {
                            const updateMessage = `📝 **Taak bijgewerkt:** "${updatedTask.subject}"\n\nWijzigingen:\n${changes.map((c) => `- ${c}`).join("\n")}`;

                            messages = [
                                ...messages,
                                {
                                    text: updateMessage,
                                    isBot: true,
                                    timestamp: new Date(),
                                },
                            ];

                            conversationHistory = [
                                ...conversationHistory,
                                {
                                    role: "assistant",
                                    content: `De taak "${updatedTask.subject}" is bijgewerkt: ${changes.join(", ")}`,
                                },
                            ];
                        }
                    }
                }

                // Update created tasks array after notifying AI
                createdTasks = createdTasks.map((task) => {
                    const updated = updatedTasks.find(
                        (ut) => ut.id === task.id,
                    );
                    return updated || task;
                });
            }
        });

        return unsubscribe;
    });

    async function sendMessage() {
        if (!currentMessage.trim() || sending || !tinyBotId) {
            if (!tinyBotId) {
                // Show error if bot ID not configured
                messages = [
                    ...messages,
                    {
                        text: "⚠️ TinyTalk bot ID niet geconfigureerd. Stel PUBLIC_TINYTALK_BOT_ID in je .env bestand in.",
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];
            }
            return;
        }

        const userMessage = currentMessage.trim();
        currentMessage = "";
        sending = true;

        // Add user message to chat
        const userMsg = {
            text: userMessage,
            isBot: false,
            timestamp: new Date(),
        };
        messages = [...messages, userMsg];

        // Check for deletion confirmation first (before intention detection)
        if (
            chatMode === "task" &&
            pendingDeletion &&
            !waitingForDeletionClarification
        ) {
            const userMessageLower = userMessage.toLowerCase().trim();
            const confirmed =
                userMessageLower === "ja" ||
                userMessageLower === "bevestig" ||
                userMessageLower === "yes" ||
                userMessageLower === "ok" ||
                userMessageLower === "verwijder";
            const cancelled =
                userMessageLower === "nee" ||
                userMessageLower === "no" ||
                userMessageLower === "annuleer" ||
                userMessageLower === "cancel";

            if (confirmed) {
                // Delete the task(s)
                await deleteTask(
                    pendingDeletion.taskId,
                    pendingDeletion.taskSubject,
                );
                pendingDeletion = null;
                sending = false;
                return;
            } else if (cancelled) {
                // Cancel deletion
                messages = [
                    ...messages,
                    {
                        text: `✅ Verwijdering geannuleerd. De ${(pendingDeletion as any)?.taskIds?.length > 1 ? "taken" : "taak"} **"${pendingDeletion.taskSubject}"** ${(pendingDeletion as any)?.taskIds?.length > 1 ? "blijven" : "blijft"} behouden.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `Verwijdering geannuleerd. De ${(pendingDeletion as any)?.taskIds?.length > 1 ? "taken" : "taak"} "${pendingDeletion.taskSubject}" ${(pendingDeletion as any)?.taskIds?.length > 1 ? "blijven" : "blijft"} behouden.`,
                    },
                ];

                pendingDeletion = null;
                sending = false;
                return;
            } else {
                // Unclear response, ask again
                messages = [
                    ...messages,
                    {
                        text: `Ik begrijp het niet helemaal. Wil je de ${(pendingDeletion as any)?.taskIds?.length > 1 ? "taken" : "taak"} **"${pendingDeletion.taskSubject}"** verwijderen?\n\nBeantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `Wil je de ${(pendingDeletion as any)?.taskIds?.length > 1 ? "taken" : "taak"} "${pendingDeletion.taskSubject}" verwijderen? Beantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                    },
                ];

                sending = false;
                return;
            }
        }

        // Check if we're waiting for deletion clarification first
        if (
            chatMode === "task" &&
            waitingForDeletionClarification &&
            createdTasks.length > 0
        ) {
            // Add user message to conversation history
            conversationHistory = [
                ...conversationHistory,
                { role: "user", content: userMessage },
            ];

            // User is responding to "which task to delete" question
            const selectedTasks = parseTaskSelection(userMessage, createdTasks);

            if (selectedTasks.length === 0) {
                // Couldn't parse selection, ask again
                const taskList = createdTasks
                    .map((t, idx) => `${idx + 1}. ${t.subject}`)
                    .join("\n");
                messages = [
                    ...messages,
                    {
                        text: `Ik begrijp het niet helemaal. Welke taak wil je verwijderen?\n\n${taskList}\n\nGeef het nummer (bijv. "1" of "1 en 2") of de naam van de taak op.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `Ik begrijp het niet helemaal. Welke taak wil je verwijderen? Geef het nummer of de naam van de taak op.`,
                    },
                ];

                sending = false;
                return;
            }

            // If only one task selected, ask for confirmation
            if (selectedTasks.length === 1) {
                const task = selectedTasks[0];
                pendingDeletion = {
                    taskId: task.id,
                    taskSubject: task.subject || "",
                };
                waitingForDeletionClarification = false;

                messages = [
                    ...messages,
                    {
                        text: `🗑️ **Taak verwijderen?**\n\nWil je de taak **"${task.subject || ""}"** verwijderen?\n\nBeantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `Wil je de taak "${task.subject || ""}" verwijderen? Beantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                    },
                ];

                sending = false;
                return;
            }

            // Multiple tasks selected, ask for confirmation for all
            const taskList = selectedTasks
                .map((t) => `- ${t.subject}`)
                .join("\n");
            messages = [
                ...messages,
                {
                    text: `🗑️ **Meerdere taken verwijderen?**\n\nWil je de volgende taken verwijderen?\n\n${taskList}\n\nBeantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                    isBot: true,
                    timestamp: new Date(),
                },
            ];

            conversationHistory = [
                ...conversationHistory,
                {
                    role: "assistant",
                    content: `Wil je deze ${selectedTasks.length} taken verwijderen? Beantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                },
            ];

            // Store multiple tasks for deletion
            pendingDeletion = {
                taskId: selectedTasks[0].id, // Store first one, we'll handle multiple in deleteTask
                taskSubject: selectedTasks
                    .map((t) => t.subject || "")
                    .join(", "),
            };
            // Store all task IDs in a custom property
            (pendingDeletion as any).taskIds = selectedTasks.map((t) => t.id);
            waitingForDeletionClarification = false;

            sending = false;
            return;
        }

        // In task mode, detect intention first and route accordingly
        if (
            chatMode === "task" &&
            !creatingTasks &&
            !pendingDeletion &&
            !waitingForDeletionClarification
        ) {
            // Add user message to conversation history first (needed for intention detection)
            conversationHistory = [
                ...conversationHistory,
                { role: "user", content: userMessage },
            ];

            try {
                // Detect user intention using TinyTalk
                const intentionResult =
                    await tinyTalkService.detectChatIntention({
                        messages: conversationHistory.slice(-5), // Use last 5 messages for context
                        botId: tinyBotId,
                        temperature: 0.3,
                    });

                if (intentionResult.success) {
                    const intention = intentionResult.value;

                    // Route based on detected intention
                    if (intention.type === "create_task") {
                        // Extract and create tasks
                        const handled = await createTasksFromConversation();
                        if (handled) {
                            sending = false;
                            return; // Tasks handled
                        }
                        // If not handled, continue to general chat
                    } else if (intention.type === "delete_task") {
                        // Handle deletion
                        await handleTaskDeletion(intention.taskSubject);
                        sending = false;
                        return; // Deletion handled
                    } else if (intention.type === "update_task") {
                        // Handle task update (future feature)
                        // For now, fall through to general chat
                    }
                    // For general_chat or unclear, continue to general chat below
                } else {
                    // Intention detection failed, log but continue with normal chat
                    console.warn(
                        "[ChatDrawer] Intention detection failed:",
                        intentionResult.error,
                    );
                    // Continue to general chat below
                }
            } catch (error) {
                // Intention detection threw an error, log but continue with normal chat
                console.error("[ChatDrawer] Error detecting intention:", error);
                // Continue to general chat below
            }
        } else {
            // Add user message to conversation history (if not in task mode or already added)
            conversationHistory = [
                ...conversationHistory,
                { role: "user", content: userMessage },
            ];
        }

        try {
            // Send to TinyTalk API
            const result = await tinyTalkService.sendChatCompletion({
                botId: tinyBotId,
                messages: conversationHistory,
                temperature: 0.7,
            });

            if (!result.success) {
                messages = [
                    ...messages,
                    {
                        text: "Sorry, er ging iets mis bij het verbinden met de AI. Probeer het opnieuw.",
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];
                return;
            }

            // Process streaming response
            let botResponse = "";
            let isFirstChunk = true;

            await tinyTalkService.processStream(result.value, (chunk) => {
                if (chunk.content) {
                    botResponse += chunk.content;

                    if (isFirstChunk) {
                        // Create new bot message
                        messages = [
                            ...messages,
                            {
                                text: botResponse,
                                isBot: true,
                                timestamp: new Date(),
                            },
                        ];
                        isFirstChunk = false;
                    } else {
                        // Update last message
                        messages = messages.map((msg, idx) =>
                            idx === messages.length - 1
                                ? { ...msg, text: botResponse }
                                : msg,
                        );
                    }
                }
            });

            // Add assistant response to conversation history
            if (botResponse) {
                conversationHistory = [
                    ...conversationHistory,
                    { role: "assistant", content: botResponse },
                ];
            }

            // Check if bot should suggest clearing history
            if (shouldSuggestClearingHistory() && !shouldSuggestClear) {
                shouldSuggestClear = true;
                // Add a hint message from the bot
                setTimeout(() => {
                    messages = [
                        ...messages,
                        {
                            text: "💡 **Tip:** Je chat geschiedenis wordt groot. Overweeg om de geschiedenis te wissen voor betere prestaties. Gebruik de prullenbak knop in de header.",
                            isBot: true,
                            timestamp: new Date(),
                        },
                    ];
                    conversationHistory = [
                        ...conversationHistory,
                        {
                            role: "assistant",
                            content:
                                "💡 Tip: Je chat geschiedenis wordt groot. Overweeg om de geschiedenis te wissen voor betere prestaties. Gebruik de prullenbak knop in de header.",
                        },
                    ];
                }, 1000);
            }

            // In task mode, handle task extraction (if not already handled by intention routing)
            if (chatMode === "task" && !creatingTasks && !pendingDeletion) {
                if (waitingForClarification) {
                    // User responded to clarification question, re-extract after a short delay
                    setTimeout(() => {
                        createTasksFromConversation();
                    }, 500);
                } else {
                    // Normal flow - try to extract and create tasks
                    createTasksFromConversation();
                }
            }
        } catch (error) {
            console.error("[ChatDrawer] Error sending message:", error);
            messages = [
                ...messages,
                {
                    text: "Sorry, er ging iets mis. Probeer het opnieuw.",
                    isBot: true,
                    timestamp: new Date(),
                },
            ];
        } finally {
            sending = false;
        }
    }

    /**
     * Handle task deletion based on task subject
     */
    async function handleTaskDeletion(taskSubject?: string) {
        let taskToDelete: Task | undefined;

        if (taskSubject && taskSubject.trim() !== "") {
            // Find the task to delete by subject (only from created tasks)
            // Normalize both strings for better matching (remove spaces, special chars)
            const normalize = (str: string) =>
                str
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .replace(/[^a-z0-9]/g, "");
            const deleteSubjectNormalized = normalize(taskSubject);

            taskToDelete = createdTasks.find((t) => {
                const taskSubjectNormalized = normalize(t.subject || "");
                const taskSubj = t.subject || "";
                // Check if normalized strings match or contain each other
                return (
                    taskSubjectNormalized.includes(deleteSubjectNormalized) ||
                    deleteSubjectNormalized.includes(taskSubjectNormalized) ||
                    // Also check original strings for partial matches
                    taskSubj
                        .toLowerCase()
                        .includes(taskSubject.toLowerCase()) ||
                    taskSubject.toLowerCase().includes(taskSubj.toLowerCase())
                );
            });
        }

        // If no specific task mentioned and there's only one task, delete that one
        if (!taskToDelete && createdTasks.length === 1) {
            taskToDelete = createdTasks[0];
        }

        // If still no task found but there are multiple tasks, ask which one
        if (!taskToDelete && createdTasks.length > 1) {
            waitingForDeletionClarification = true;
            const taskList = createdTasks
                .map((t, idx) => `${idx + 1}. ${t.subject || ""}`)
                .join("\n");
            messages = [
                ...messages,
                {
                    text: `Welke taak wil je verwijderen?\n\n${taskList}\n\nGeef het nummer (bijv. "1" of "1 en 2") of de naam van de taak op.`,
                    isBot: true,
                    timestamp: new Date(),
                },
            ];

            conversationHistory = [
                ...conversationHistory,
                {
                    role: "assistant",
                    content: `Welke taak wil je verwijderen? Geef het nummer of de naam van de taak op.`,
                },
            ];

            return; // Waiting for clarification
        }

        if (taskToDelete) {
            // Ask for confirmation
            pendingDeletion = {
                taskId: taskToDelete.id,
                taskSubject: taskToDelete.subject || "",
            };

            messages = [
                ...messages,
                {
                    text: `🗑️ **Taak verwijderen?**\n\nWil je de taak **"${taskToDelete.subject || ""}"** verwijderen?\n\nBeantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                    isBot: true,
                    timestamp: new Date(),
                },
            ];

            conversationHistory = [
                ...conversationHistory,
                {
                    role: "assistant",
                    content: `Wil je de taak "${taskToDelete.subject || ""}" verwijderen? Beantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                },
            ];
        } else {
            // Task not found in created tasks
            messages = [
                ...messages,
                {
                    text: `❌ Ik kan de taak "${taskSubject || "opgegeven"}" niet vinden in de aangemaakte taken. Ik kan alleen taken verwijderen die ik zelf heb aangemaakt in deze chat sessie.`,
                    isBot: true,
                    timestamp: new Date(),
                },
            ];

            conversationHistory = [
                ...conversationHistory,
                {
                    role: "assistant",
                    content: `Ik kan de taak "${taskSubject || "opgegeven"}" niet vinden in de aangemaakte taken. Ik kan alleen taken verwijderen die ik zelf heb aangemaakt in deze chat sessie.`,
                },
            ];
        }
    }

    /**
     * Parse task selection from user input
     * Handles: "1", "2", "1 en 2", "beide", "alle", task names, etc.
     */
    function parseTaskSelection(input: string, tasks: Task[]): Task[] {
        const normalized = input.toLowerCase().trim();
        const selected: Task[] = [];

        // Handle "beide" (both) when there are 2 tasks
        if (normalized === "beide" && tasks.length === 2) {
            return tasks;
        }

        // Handle "alle" (all)
        if (normalized === "alle" || normalized === "all") {
            return tasks;
        }

        // Extract numbers from input (e.g., "1", "1 en 2", "1, 2", "1 en 2 en 3")
        const numberPattern = /\d+/g;
        const numbers = input.match(numberPattern);

        if (numbers) {
            for (const numStr of numbers) {
                const num = parseInt(numStr, 10);
                if (num >= 1 && num <= tasks.length) {
                    const task = tasks[num - 1]; // Convert to 0-based index
                    if (!selected.find((t) => t.id === task.id)) {
                        selected.push(task);
                    }
                }
            }
        }

        // If no numbers found, try to match by task name
        if (selected.length === 0) {
            const normalize = (str: string) =>
                str
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .replace(/[^a-z0-9]/g, "");
            const inputNormalized = normalize(input);

            for (const task of tasks) {
                const taskSubjectNormalized = normalize(task.subject || "");
                const taskSubj = task.subject || "";
                if (
                    taskSubjectNormalized.includes(inputNormalized) ||
                    inputNormalized.includes(taskSubjectNormalized) ||
                    taskSubj.toLowerCase().includes(input.toLowerCase()) ||
                    input.toLowerCase().includes(taskSubj.toLowerCase())
                ) {
                    if (!selected.find((t) => t.id === task.id)) {
                        selected.push(task);
                    }
                }
            }
        }

        return selected;
    }

    /**
     * Delete a task that was created in this chat session
     */
    async function deleteTask(taskId: number, taskSubject: string) {
        // Check if we need to delete multiple tasks
        const pendingDeletionAny = pendingDeletion as any;
        const taskIds = pendingDeletionAny?.taskIds || [taskId];

        if (taskIds.length > 1) {
            // Delete multiple tasks
            let successCount = 0;
            let failCount = 0;

            for (const id of taskIds) {
                const task = createdTasks.find((t) => t.id === id);
                if (task) {
                    const result = await taskService.deleteWorkItem(id);
                    if (result.success) {
                        successCount++;
                        createdTasks = createdTasks.filter((t) => t.id !== id);
                    } else {
                        failCount++;
                    }
                }
            }

            // Show result message
            if (successCount > 0) {
                messages = [
                    ...messages,
                    {
                        text: `✅ **${successCount} ${successCount === 1 ? "taak" : "taken"} verwijderd**\n\n${successCount === taskIds.length ? "Alle geselecteerde taken zijn succesvol verwijderd." : `${successCount} van ${taskIds.length} taken zijn verwijderd.`}`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `${successCount} ${successCount === 1 ? "taak is" : "taken zijn"} succesvol verwijderd.`,
                    },
                ];

                toastStore.add(
                    `${successCount} ${successCount === 1 ? "taak" : "taken"} verwijderd`,
                    "success",
                    3000,
                );
            }

            if (failCount > 0) {
                messages = [
                    ...messages,
                    {
                        text: `❌ Er ging iets mis bij het verwijderen van ${failCount} ${failCount === 1 ? "taak" : "taken"}.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                toastStore.add(
                    `Fout bij verwijderen ${failCount} ${failCount === 1 ? "taak" : "taken"}`,
                    "error",
                    5000,
                );
            }

            pendingDeletion = null;
            return;
        }

        // Single task deletion (original logic)
        try {
            const result = await taskService.deleteWorkItem(taskId);

            if (result.success) {
                // Remove from created tasks
                createdTasks = createdTasks.filter((t) => t.id !== taskId);

                // Show success message
                messages = [
                    ...messages,
                    {
                        text: `✅ **Taak verwijderd**\n\nDe taak **"${taskSubject}"** is succesvol verwijderd.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `De taak "${taskSubject}" is succesvol verwijderd.`,
                    },
                ];

                toastStore.add("Taak verwijderd", "success", 3000);
            } else {
                // Show error
                messages = [
                    ...messages,
                    {
                        text: `❌ Er ging iets mis bij het verwijderen van de taak **"${taskSubject}"**. Probeer het opnieuw.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `Er ging iets mis bij het verwijderen van de taak "${taskSubject}".`,
                    },
                ];

                toastStore.add("Fout bij verwijderen taak", "error", 5000);
            }
        } catch (error) {
            console.error("[ChatDrawer] Error deleting task:", error);
            messages = [
                ...messages,
                {
                    text: `❌ Er ging iets mis bij het verwijderen van de taak **"${taskSubject}"**.`,
                    isBot: true,
                    timestamp: new Date(),
                },
            ];

            toastStore.add("Fout bij verwijderen taak", "error", 5000);
        }
    }

    /**
     * Extract and create tasks from the conversation
     * Can run before or after bot response depending on context
     * @returns true if extraction was successful and handled (deletion or task creation), false otherwise
     */
    async function createTasksFromConversation(): Promise<boolean> {
        if (creatingTasks || !tinyBotId) return false;

        creatingTasks = true;

        try {
            // Use the full conversation history for better context
            // But filter to only include recent relevant messages (last 10 messages)
            const recentMessages = conversationHistory.slice(-10);

            if (recentMessages.length === 0) {
                creatingTasks = false;
                return false;
            }

            // Extract tasks from chat
            const extractionResult =
                await taskByChatService.extractTasksFromChat(
                    recentMessages,
                    tinyBotId,
                );

            if (!extractionResult.success) {
                // Silently fail - don't interrupt the chat experience
                console.warn(
                    "[ChatDrawer] Failed to extract tasks:",
                    extractionResult.error,
                );
                creatingTasks = false;
                return false;
            }

            const extraction = extractionResult.value;

            // Check for deletion request FIRST (before checking tasks)
            if (extraction.deleteRequest) {
                const deleteReq = extraction.deleteRequest;

                let taskToDelete: Task | undefined;

                // If taskSubject is specified, try to match it
                if (
                    deleteReq.taskSubject &&
                    deleteReq.taskSubject.trim() !== ""
                ) {
                    // Find the task to delete by subject (only from created tasks)
                    // Normalize both strings for better matching (remove spaces, special chars)
                    const normalize = (str: string) =>
                        str
                            .toLowerCase()
                            .replace(/\s+/g, "")
                            .replace(/[^a-z0-9]/g, "");
                    const deleteSubjectNormalized = normalize(
                        deleteReq.taskSubject || "",
                    );

                    taskToDelete = createdTasks.find((t) => {
                        const taskSubjectNormalized = normalize(
                            t.subject || "",
                        );
                        const tSubj = t.subject || "";
                        // Check if normalized strings match or contain each other
                        return (
                            taskSubjectNormalized.includes(
                                deleteSubjectNormalized,
                            ) ||
                            deleteSubjectNormalized.includes(
                                taskSubjectNormalized,
                            ) ||
                            // Also check original strings for partial matches
                            tSubj
                                .toLowerCase()
                                .includes(
                                    deleteReq.taskSubject?.toLowerCase() || "",
                                ) ||
                            (
                                deleteReq.taskSubject?.toLowerCase() || ""
                            ).includes(tSubj.toLowerCase())
                        );
                    });
                }

                // If no specific task mentioned and there's only one task, delete that one
                if (!taskToDelete && createdTasks.length === 1) {
                    taskToDelete = createdTasks[0];
                }

                // If still no task found but there are multiple tasks, ask which one
                if (!taskToDelete && createdTasks.length > 1) {
                    const taskList = createdTasks
                        .map((t, idx) => `${idx + 1}. ${t.subject || ""}`)
                        .join("\n");
                    messages = [
                        ...messages,
                        {
                            text: `Welke taak wil je verwijderen?\n\n${taskList}\n\nGeef het nummer of de naam van de taak op.`,
                            isBot: true,
                            timestamp: new Date(),
                        },
                    ];

                    conversationHistory = [
                        ...conversationHistory,
                        {
                            role: "assistant",
                            content: `Welke taak wil je verwijderen? Geef het nummer of de naam van de taak op.`,
                        },
                    ];

                    creatingTasks = false;
                    return true; // Handled - waiting for clarification
                }

                if (taskToDelete) {
                    // Ask for confirmation
                    pendingDeletion = {
                        taskId: taskToDelete.id,
                        taskSubject: taskToDelete.subject || "",
                    };

                    messages = [
                        ...messages,
                        {
                            text: `🗑️ **Taak verwijderen?**\n\nWil je de taak **"${taskToDelete.subject || ""}"** verwijderen?\n\nBeantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                            isBot: true,
                            timestamp: new Date(),
                        },
                    ];

                    conversationHistory = [
                        ...conversationHistory,
                        {
                            role: "assistant",
                            content: `Wil je de taak "${taskToDelete.subject || ""}" verwijderen? Beantwoord met "ja" of "bevestig" om te verwijderen, of "nee" om te annuleren.`,
                        },
                    ];

                    creatingTasks = false;
                    return true; // Deletion request handled
                } else {
                    // Task not found in created tasks
                    messages = [
                        ...messages,
                        {
                            text: `❌ Ik kan de taak "${deleteReq.taskSubject}" niet vinden in de aangemaakte taken. Ik kan alleen taken verwijderen die ik zelf heb aangemaakt in deze chat sessie.`,
                            isBot: true,
                            timestamp: new Date(),
                        },
                    ];

                    conversationHistory = [
                        ...conversationHistory,
                        {
                            role: "assistant",
                            content: `Ik kan de taak "${deleteReq.taskSubject}" niet vinden in de aangemaakte taken. Ik kan alleen taken verwijderen die ik zelf heb aangemaakt in deze chat sessie.`,
                        },
                    ];

                    creatingTasks = false;
                    return true; // Handled (even though task not found)
                }
            }

            // If clarification is needed, ask questions
            if (
                extraction.needsClarification &&
                extraction.clarificationQuestions &&
                extraction.clarificationQuestions.length > 0
            ) {
                waitingForClarification = true;
                pendingClarificationQuestions =
                    extraction.clarificationQuestions;

                // Add clarification questions as bot messages
                const questionsText = extraction.clarificationQuestions
                    .map((q, idx) => `${idx + 1}. ${q}`)
                    .join("\n\n");

                // Check if we already asked these questions (avoid duplicates)
                const lastMessage = messages[messages.length - 1];
                const alreadyAsked =
                    lastMessage?.isBot &&
                    lastMessage.text.includes(
                        "heb ik nog wat informatie nodig",
                    );

                if (!alreadyAsked) {
                    messages = [
                        ...messages,
                        {
                            text: `Om de taak compleet te maken, heb ik nog wat informatie nodig:\n\n${questionsText}\n\nKun je deze vragen beantwoorden?`,
                            isBot: true,
                            timestamp: new Date(),
                        },
                    ];

                    conversationHistory = [
                        ...conversationHistory,
                        {
                            role: "assistant",
                            content: `Om de taak compleet te maken, heb ik nog wat informatie nodig:\n\n${questionsText}\n\nKun je deze vragen beantwoorden?`,
                        },
                    ];
                }

                creatingTasks = false;
                return true; // Handled - waiting for clarification
            }

            // Create tasks
            const createResult =
                await taskByChatService.createTasksFromExtracted(
                    extraction.tasks,
                );

            if (createResult.success && createResult.value.length > 0) {
                const taskCount = createResult.value.length;
                const taskText = taskCount === 1 ? "taak" : "taken";

                // Add created tasks to the list
                createdTasks = [...createdTasks, ...createResult.value];

                // Show success toast
                toastStore.add(
                    `✅ ${taskCount} ${taskText} succesvol aangemaakt!`,
                    "success",
                    5000,
                );

                // Add confirmation message to the chat
                const taskDetails = createResult.value
                    .map((t) => {
                        const details: string[] = [`**${t.subject || ""}**`];
                        if (t.voor_wie_is_het)
                            details.push(`Voor: ${t.voor_wie_is_het}`);
                        if (t.deadline)
                            details.push(
                                `Deadline: ${new Date(t.deadline).toLocaleDateString("nl-NL")}`,
                            );
                        if (t.uren) details.push(`Uren: ${t.uren}`);
                        return details.join(" | ");
                    })
                    .join("\n\n");

                messages = [
                    ...messages,
                    {
                        text: `✅ **Taak compleet!** Ik heb ${taskCount} ${taskText} voor je aangemaakt:\n\n${taskDetails}\n\nDe taken staan nu in het taken paneel rechts.`,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];

                // Add to conversation history
                conversationHistory = [
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: `✅ Taak compleet! Ik heb ${taskCount} ${taskText} voor je aangemaakt: ${createResult.value.map((t) => t.subject).join(", ")}`,
                    },
                ];

                // Clear waiting state
                waitingForClarification = false;
                pendingClarificationQuestions = [];

                creatingTasks = false;
                return true; // Tasks created successfully
            } else if (!createResult.success) {
                // Show error toast
                toastStore.add(
                    "Er ging iets mis bij het aanmaken van de taken. Probeer het opnieuw.",
                    "error",
                    5000,
                );
                creatingTasks = false;
                return false;
            }

            // No tasks to create
            creatingTasks = false;
            return false;
        } catch (error) {
            console.error(
                "[ChatDrawer] Error in createTasksFromConversation:",
                error,
            );
            creatingTasks = false;
            return false;
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function formatTime(date: Date): string {
        return new Intl.DateTimeFormat("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }
</script>

<div class="flex flex-col h-full w-full min-w-0 overflow-hidden">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-zinc-200 bg-white p-4">
        <div class="flex items-center justify-between">
            <div class="flex-1">
                <h2 class="text-xl font-semibold text-zinc-900 font-aspekta">
                    Chat Assistant
                </h2>
                <p class="text-sm text-zinc-600 mt-1">
                    AI-assistent voor hulp en vragen
                </p>
            </div>
            <div class="flex items-center gap-2 ml-4">
                <!-- Chat Mode Button -->
                <Tooltip text="Chat modus">
                    <button
                        type="button"
                        onclick={() => {
                            chatMode = "chat";
                            onmodechange?.("chat");
                            if (messages.length === 0) {
                                initializeMessages();
                            }
                        }}
                        class="p-2 rounded-sm transition-colors {chatMode ===
                        'chat'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}"
                        title="Chat modus"
                    >
                        <MessageSquare class="w-5 h-5" />
                    </button>
                </Tooltip>

                <!-- Task Mode Button -->
                <Tooltip text="Taak modus">
                    <button
                        type="button"
                        onclick={() => {
                            chatMode = "task";
                            onmodechange?.("task");
                            if (messages.length === 0) {
                                initializeMessages();
                            }
                        }}
                        class="p-2 rounded-sm transition-colors {chatMode ===
                        'task'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}"
                        title="Taak modus"
                    >
                        <ClipboardList class="w-5 h-5" />
                    </button>
                </Tooltip>

                <!-- Clear History Button -->
                <Tooltip text="Chat geschiedenis wissen">
                    <IconButton
                        icon={Trash2}
                        size="sm"
                        variant="ghost"
                        onclick={() => {
                            if (
                                confirm(
                                    "Weet je zeker dat je de chat geschiedenis wilt wissen? Dit kan niet ongedaan worden gemaakt.",
                                )
                            ) {
                                clearHistory();
                            }
                        }}
                        class="p-2"
                    />
                </Tooltip>
            </div>
        </div>
        {#if !tinyBotId}
            <p class="text-xs text-yellow-600 mt-2 bg-yellow-50 p-2 rounded">
                ⚠️ TinyTalk bot ID niet geconfigureerd. Stel
                PUBLIC_TINYTALK_BOT_ID in je .env bestand in.
            </p>
        {/if}
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden min-w-0">
        <!-- Chat Messages Area - Fixed width in both modes -->
        <div
            class="w-[30vw] flex-shrink-0 overflow-y-auto p-4 space-y-4 bg-zinc-50 min-w-0 {chatMode ===
            'task'
                ? 'border-r border-zinc-200'
                : ''}"
        >
            {#each messages as message (message.timestamp.getTime())}
                <div
                    class="flex {message.isBot
                        ? 'justify-start'
                        : 'justify-end'}"
                >
                    <div
                        class="max-w-[80%] flex gap-2 {message.isBot
                            ? 'flex-row'
                            : 'flex-row-reverse'}"
                    >
                        <!-- Avatar -->
                        <div
                            class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center {message.isBot
                                ? 'bg-zinc-200'
                                : 'bg-zinc-900'}"
                        >
                            {#if message.isBot}
                                <svg
                                    class="w-5 h-5 text-zinc-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            {:else}
                                <svg
                                    class="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            {/if}
                        </div>

                        <!-- Message Bubble -->
                        <div class="flex flex-col gap-1">
                            <div
                                class="px-4 py-2 rounded-lg {message.isBot
                                    ? 'bg-white border border-zinc-200 text-zinc-900'
                                    : 'bg-zinc-900 text-white'}"
                            >
                                {#if message.text}
                                    <Markdown
                                        content={message.text}
                                        class={message.isBot
                                            ? "text-zinc-900"
                                            : "text-white"}
                                    />
                                {:else}
                                    <p class="text-sm">(Geen bericht)</p>
                                {/if}
                            </div>
                            <span
                                class="text-xs text-zinc-500 {message.isBot
                                    ? 'text-left'
                                    : 'text-right'}"
                            >
                                {formatTime(message.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Task Panel (only shown in task mode) -->
        {#if chatMode === "task"}
            <div
                class="w-[375px] max-w-[375px] min-w-[375px] flex-shrink-0 border-l border-r border-zinc-200 bg-white flex flex-col overflow-hidden"
                style="width: 375px; max-width: 375px; min-width: 375px; box-sizing: border-box; overflow-y: hidden;"
            >
                <!-- Task Panel Header -->
                <div class="flex-shrink-0 border-b border-zinc-200 p-4">
                    <h3
                        class="text-lg font-semibold text-zinc-900 font-aspekta"
                    >
                        Aangemaakte taken
                    </h3>
                    <p class="text-xs text-zinc-600 mt-1">
                        {createdTasks.length}
                        {createdTasks.length === 1 ? "taak" : "taken"}
                    </p>
                </div>

                <!-- Task List -->
                <div
                    class="flex-1 overflow-y-auto p-4 space-y-3 min-w-0 box-border task-list-scrollable"
                    style="scrollbar-width: thin; scrollbar-color: rgb(212 212 212) transparent; height: 0;"
                >
                    {#if createdTasks.length === 0}
                        <div class="text-center text-zinc-500 text-sm py-8">
                            <ClipboardList
                                class="w-12 h-12 mx-auto mb-3 text-zinc-300"
                            />
                            <p>Nog geen taken aangemaakt</p>
                            <p class="text-xs mt-1">
                                Beschrijf je taken in de chat
                            </p>
                        </div>
                    {:else}
                        {#each sortedCreatedTasks as task (task.id)}
                            {@const unifiedItem: UnifiedPlanningItem = {
								type: 'work_item',
								id: task.id,
								task_type: task.task_type,
								subject: task.subject || '',
								voor_wie_is_het: task.voor_wie_is_het,
								wat_ga_je_doen: task.wat_ga_je_doen,
								waarom_doe_je_het: task.waarom_doe_je_het,
								deadline: task.deadline,
								uren: task.uren,
								tags: task.tags || [],
								relevantie: task.relevantie,
								status: task.status,
								kanban_status: task.kanban_status,
								assignee_id: (task.assignee_id && task.assignee_id.length > 0) ? task.assignee_id[0] : null,
								project_id: task.project_id,
								created_at: task.created_at,
								updated_at: task.updated_at
							}}
                            <div
                                class="bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all min-w-0 overflow-hidden flex-shrink-0"
                                style="width: 100%; max-width: 100%; box-sizing: border-box;"
                            >
                                <WorkItemCard
                                    workItem={unifiedItem}
                                    draggable={false}
                                    disabled={false}
                                    class="!w-full !min-w-0 !max-w-full !h-auto"
                                    onclick={(item) => {
                                        // Open task detail page in new tab
                                        window.open(
                                            `/work/${item.id}`,
                                            "_blank",
                                        );
                                    }}
                                />
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/if}
    </div>

    <!-- Input Area -->
    <div class="flex-shrink-0 border-t border-zinc-200 bg-white p-4">
        <div class="relative">
            <textarea
                bind:value={currentMessage}
                onkeydown={handleKeyPress}
                placeholder="Typ je bericht..."
                rows="2"
                disabled={sending || !tinyBotId}
                class="w-full px-3 py-2 pr-12 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent text-sm resize-none disabled:bg-zinc-100 disabled:cursor-not-allowed"
            ></textarea>
            <button
                type="button"
                onclick={sendMessage}
                disabled={!currentMessage.trim() || sending || !tinyBotId}
                class="absolute right-2 bottom-3 p-2 bg-zinc-900 text-white rounded-sm hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                title="Verstuur bericht"
            >
                {#if sending}
                    <Loader2 class="w-4 h-4 animate-spin" />
                {:else}
                    <Send class="w-4 h-4" />
                {/if}
            </button>
        </div>
    </div>
</div>

<style>
    .task-list-scrollable::-webkit-scrollbar {
        width: 8px;
    }

    .task-list-scrollable::-webkit-scrollbar-track {
        background: transparent;
    }

    .task-list-scrollable::-webkit-scrollbar-thumb {
        background: rgb(212 212 212);
        border-radius: 4px;
    }

    .task-list-scrollable::-webkit-scrollbar-thumb:hover {
        background: rgb(180 180 180);
    }
</style>
