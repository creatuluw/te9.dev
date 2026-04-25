<script lang="ts">
    import { onMount, tick } from "svelte";
    import { browser } from "$app/environment";
    import {
        Send,
        Loader2,
        Bot,
        Plus,
        User,
        Info,
        FolderOpen,
        ListChecks,
        RefreshCw,
        Building2,
        MessageSquare,
        UserCircle,
        Shield,
        Share2,
    } from "lucide-svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import Markdown from "$lib/components/Markdown.svelte";
    import * as llmGateway from "$lib/services/llmGatewayService";
    import type { ChatMessage } from "$lib/services/llmGatewayService";
    import {
        loadKnowledgeBase,
        buildSystemPrompt,
        getKnowledgeBaseStatus,
    } from "$lib/services/knowledgeBaseService";

    const STORAGE_KEY = "sjoerd_chat_history";
    const MAX_HISTORY_MESSAGES = 100;

    const WELCOME_MESSAGE =
        "Hallo! Ik ben **Sjoerd**, je AI-assistent voor Hoi Pippeloi. Stel me een vraag!";

    const WELCOME_SYSTEM_CONTEXT =
        "Hallo! Ik ben Sjoerd, je AI-assistent voor de applicatie Hoi Pippeloi (kees.pippeloi.nl). Ik draai op het Qwen3.5-2B model. Antwoord altijd in het Nederlands, beknopt en helder. Je kunt vragen stellen over: cases (aanmaken, bekijken, filteren, beheren), werk & taken (plannen, toewijzen, volgen), processen (templates, stappen, workflows), projecten (organiseren, leden, extern delen), berichten (communicatie binnen team), en account (profiel, instellingen, rollen). Stel me een vraag!";

    interface SerializedMessage {
        text: string;
        isBot: boolean;
        timestamp: string;
    }

    interface SjoerdHistory {
        messages: SerializedMessage[];
        conversationHistory: ChatMessage[];
        lastUpdated: string;
    }

    let messages = $state<
        Array<{ text: string; isBot: boolean; timestamp: Date }>
    >([]);
    let currentMessage = $state("");
    let sending = $state(false);
    let streamingText = $state("");
    let conversationHistory = $state<ChatMessage[]>([]);
    let contextLoaded = $state(false);
    let contextError = $state("");
    let gatewayHealthy = $state<boolean | null>(null);
    let kbStatus = $state<{ loaded: boolean; chunkCount: number } | null>(null);
    let chatContainer: HTMLDivElement | undefined = $state();
    let inputEl: HTMLTextAreaElement | undefined = $state();
    let historyLoaded = $state(false);
    let infoModalOpen = $state(false);

    const LLM_MODEL = "unsloth/Qwen3.5-2B-GGUF";

    const TOPIC_SUGGESTIONS: Array<{
        icon: typeof FolderOpen;
        title: string;
        examples: string;
    }> = [
        {
            icon: FolderOpen,
            title: "Cases",
            examples: "Hoe maak ik een case? Hoe filter ik cases?",
        },
        {
            icon: ListChecks,
            title: "Werk & taken",
            examples: "Hoe plan ik werk? Hoe wijs ik een taak toe?",
        },
        {
            icon: RefreshCw,
            title: "Processen",
            examples: "Wat zijn proces-templates? Hoe werken stappen?",
        },
        {
            icon: Building2,
            title: "Projecten",
            examples: "Hoe organiseer ik een project? Hoe voeg ik leden toe?",
        },
        {
            icon: MessageSquare,
            title: "Berichten",
            examples: "Hoe stuur ik een bericht? Hoe werkt de inbox?",
        },
        {
            icon: UserCircle,
            title: "Account",
            examples: "Hoe wijzig ik mijn profiel? Welke rollen zijn er?",
        },
        {
            icon: Shield,
            title: "Inloggen & beveiliging",
            examples: "Hoe log ik in? Wat is twee-factor authenticatie?",
        },
        {
            icon: Share2,
            title: "Extern delen",
            examples:
                "Hoe deel ik met externe gebruikers? Hoe werkt uitnodigen?",
        },
    ];

    function loadPersistedHistory(): SjoerdHistory | null {
        if (!browser) return null;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }

    function persistHistory() {
        if (!browser || !historyLoaded) return;
        try {
            const history: SjoerdHistory = {
                messages: messages.map((m) => ({
                    text: m.text,
                    isBot: m.isBot,
                    timestamp: m.timestamp.toISOString(),
                })),
                conversationHistory,
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === "QuotaExceededError"
            ) {
                const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
                const history: SjoerdHistory = {
                    messages: trimmed.map((m) => ({
                        text: m.text,
                        isBot: m.isBot,
                        timestamp: m.timestamp.toISOString(),
                    })),
                    conversationHistory:
                        conversationHistory.slice(-MAX_HISTORY_MESSAGES),
                    lastUpdated: new Date().toISOString(),
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            }
        }
    }

    function clearPersistedHistory() {
        if (!browser) return;
        localStorage.removeItem(STORAGE_KEY);
    }

    onMount(async () => {
        // Check gateway health and load knowledge base in parallel
        const [healthResult] = await Promise.allSettled([
            llmGateway.checkHealth(),
            loadKnowledgeBase(),
        ]);

        if (healthResult.status === "fulfilled" && healthResult.value.success) {
            gatewayHealthy = healthResult.value.value.healthy;
        } else {
            gatewayHealthy = false;
        }

        const status = getKnowledgeBaseStatus();
        kbStatus = { loaded: status.loaded, chunkCount: status.chunkCount };

        contextLoaded = true;

        const saved = loadPersistedHistory();
        if (saved && saved.messages.length > 0) {
            messages = saved.messages.map((m) => ({
                text: m.text,
                isBot: m.isBot,
                timestamp: new Date(m.timestamp),
            }));
            conversationHistory = saved.conversationHistory;
        } else {
            messages = [
                {
                    text: WELCOME_MESSAGE,
                    isBot: true,
                    timestamp: new Date(),
                },
            ];
            conversationHistory = [
                {
                    role: "assistant",
                    content: WELCOME_SYSTEM_CONTEXT,
                },
            ];
        }

        historyLoaded = true;
    });

    function scrollToBottom() {
        if (chatContainer) {
            requestAnimationFrame(() => {
                chatContainer!.scrollTop = chatContainer!.scrollHeight;
            });
        }
    }

    function typeIntoInput(text: string) {
        currentMessage = "";
        inputEl?.focus();
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                currentMessage += text[i];
                i++;
            } else {
                clearInterval(interval);
            }
        }, 25);
    }

    async function sendMessage() {
        if (!currentMessage.trim() || sending) return;

        const userMessage = currentMessage.trim();
        currentMessage = "";
        sending = true;

        messages = [
            ...messages,
            { text: userMessage, isBot: false, timestamp: new Date() },
        ];

        conversationHistory = [
            ...conversationHistory,
            { role: "user", content: userMessage },
        ];

        scrollToBottom();

        try {
            // Build system prompt with knowledge base context
            const kbContext = await buildSystemPrompt(
                userMessage,
                conversationHistory,
            );

            const messagesPayload: ChatMessage[] = [
                {
                    role: "system",
                    content: kbContext.context,
                },
                ...conversationHistory,
            ];

            const result = await llmGateway.sendChatCompletion({
                messages: messagesPayload,
                model: LLM_MODEL,
                temperature: 0.7,
            });

            if (!result.success) {
                streamingText = "";
                messages = [
                    ...messages,
                    {
                        text: "Sorry, er ging iets mis bij het verbinden met de LLM. Probeer het opnieuw.",
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];
                sending = false;
                scrollToBottom();
                return;
            }

            streamingText = "";
            let botResponse = "";

            await llmGateway.processStream(result.value, (chunk) => {
                if (chunk.content) {
                    botResponse += chunk.content;
                    streamingText = botResponse;
                    scrollToBottom();
                }
            });

            if (botResponse) {
                streamingText = "";
                messages = [
                    ...messages,
                    {
                        text: botResponse,
                        isBot: true,
                        timestamp: new Date(),
                    },
                ];
                conversationHistory = [
                    ...conversationHistory,
                    { role: "assistant", content: botResponse },
                ];
            }
        } catch {
            streamingText = "";
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
            streamingText = "";
            scrollToBottom();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function clearChat() {
        clearPersistedHistory();
        messages = [
            {
                text: WELCOME_MESSAGE,
                isBot: true,
                timestamp: new Date(),
            },
        ];
        conversationHistory = [
            {
                role: "assistant",
                content: WELCOME_SYSTEM_CONTEXT,
            },
        ];
    }

    $effect(() => {
        if (historyLoaded && messages.length > 0) {
            const timeoutId = setTimeout(persistHistory, 500);
            return () => clearTimeout(timeoutId);
        }
    });
</script>

<svelte:head>
    <title>Sjoerd - Hoi Pippeloi</title>
</svelte:head>

<div class="flex flex-col h-[calc(100vh-8rem)] max-w-6xl mx-auto">
    <div
        class="flex items-center justify-between px-4 py-3 border-b border-zinc-200"
    >
        <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
                <Bot class="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h1 class="text-lg font-semibold text-zinc-900">Sjoerd</h1>
                <p class="text-xs text-zinc-500">
                    AI-assistent &middot; {contextLoaded
                        ? !gatewayHealthy
                            ? "Gateway onbereikbaar"
                            : kbStatus?.loaded
                              ? `Qwen3.5-2B · Online · ${kbStatus.chunkCount} chunks`
                              : "Qwen3.5-2B · Online"
                        : contextError || "Laden..."}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-1">
            <IconButton
                icon={Info}
                variant="ghost"
                tooltip="Wat kan ik vragen?"
                onclick={() => (infoModalOpen = true)}
            />
            <IconButton
                icon={Plus}
                variant="ghost"
                tooltip="Nieuwe sessie"
                onclick={clearChat}
            />
        </div>
    </div>

    <div
        bind:this={chatContainer}
        class="flex-1 overflow-y-auto px-6 py-6 space-y-5"
    >
        {#each messages as message, idx}
            <div class="flex gap-3 {message.isBot ? '' : 'flex-row-reverse'}">
                <div class="shrink-0 mt-0.5">
                    {#if message.isBot}
                        <div
                            class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
                        >
                            <Bot class="w-4 h-4 text-blue-600" />
                        </div>
                    {:else}
                        <div
                            class="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center"
                        >
                            <User class="w-4 h-4 text-zinc-600" />
                        </div>
                    {/if}
                </div>
                <div
                    class="{message.isBot
                        ? 'max-w-[95%]'
                        : 'max-w-[85%]'} rounded-2xl px-4 py-2.5 text-sm leading-relaxed {message.isBot
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'bg-blue-600 text-white'}"
                >
                    {#if message.isBot}
                        <Markdown content={message.text} />
                        {#if idx === 0}
                            <button
                                onclick={() => (infoModalOpen = true)}
                                class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                                <Info class="w-3.5 h-3.5" />
                                Wat kan ik vragen?
                            </button>
                        {/if}
                    {:else}
                        {message.text}
                    {/if}
                </div>
            </div>
        {/each}

        {#if sending && !streamingText}
            <div class="flex gap-3">
                <div class="shrink-0 mt-0.5">
                    <div
                        class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
                    >
                        <Bot class="w-4 h-4 text-blue-600" />
                    </div>
                </div>
                <div
                    class="bg-zinc-100 rounded-2xl px-4 py-3 text-sm text-zinc-400 flex items-center gap-2"
                >
                    <Loader2 class="w-4 h-4 animate-spin" />
                    Informatie opzoeken...
                </div>
            </div>
        {/if}
        {#if sending && streamingText}
            <div class="flex gap-3">
                <div class="shrink-0 mt-0.5">
                    <div
                        class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
                    >
                        <Bot class="w-4 h-4 text-blue-600" />
                    </div>
                </div>
                <div
                    class="max-w-[95%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-zinc-100 text-zinc-900"
                >
                    <span class="whitespace-pre-wrap">{streamingText}</span>
                </div>
            </div>
        {/if}
    </div>

    <div class="px-4 py-3">
        <form
            onsubmit={(e) => {
                e.preventDefault();
                sendMessage();
            }}
        >
            <div
                class="chat-input-wrapper flex items-start gap-3 bg-zinc-50 rounded-2xl p-3"
            >
                <textarea
                    bind:this={inputEl}
                    bind:value={currentMessage}
                    onkeydown={handleKeydown}
                    placeholder="Stel een vraag over de applicatie..."
                    rows="2"
                    class="chat-input flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-sm"
                    oninput={() => {
                        if (inputEl) {
                            inputEl.style.height = "auto";
                            inputEl.style.height =
                                Math.min(inputEl.scrollHeight, 200) + "px";
                        }
                    }}
                ></textarea>
                <button
                    type="submit"
                    disabled={!currentMessage.trim() || sending}
                    class="shrink-0 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {#if sending}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <Send class="w-4 h-4" />
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>

<Modal
    title="Wat kan ik Sjoerd vragen?"
    bind:open={infoModalOpen}
    size="custom"
    customWidth="66rem"
    maxContentHeight="70vh"
>
    <div class="space-y-3">
        <p class="text-sm text-zinc-600">
            Sjoerd kent de Hoi Pippeloi applicatie en kan je helpen met uitleg,
            stappenplannen en tips. Klik op een onderwerp om direct een vraag in
            te vullen.
        </p>
        <div class="grid grid-cols-2 gap-2">
            {#each TOPIC_SUGGESTIONS as topic}
                <div
                    class="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-50 hover:bg-blue-50 transition-colors cursor-pointer"
                    onclick={() => {
                        const question = topic.examples.split("?")[0] + "?";
                        infoModalOpen = false;
                        typeIntoInput(question);
                    }}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            const question = topic.examples.split("?")[0] + "?";
                            infoModalOpen = false;
                            typeIntoInput(question);
                        }
                    }}
                >
                    <div
                        class="shrink-0 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"
                    >
                        <topic.icon class="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div class="min-w-0">
                        <p
                            class="text-sm font-medium text-zinc-900 leading-tight"
                        >
                            {topic.title}
                        </p>
                        <p class="text-xs text-zinc-500 truncate">
                            {topic.examples}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</Modal>

<style>
    .chat-input-wrapper {
        border: 1.5px dashed rgb(205 205 205);
        transition:
            border-color 0.15s,
            border-style 0.15s;
    }

    .chat-input-wrapper:focus-within {
        border: 1.5px solid rgb(175 175 180) !important;
    }

    .chat-input {
        color: black !important;
        -webkit-text-fill-color: black !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        background: transparent !important;
    }

    .chat-input::placeholder {
        color: rgb(161 161 170) !important;
        -webkit-text-fill-color: rgb(161 161 170) !important;
        opacity: 1 !important;
    }

    .chat-input:focus {
        color: black !important;
        -webkit-text-fill-color: black !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        background: transparent !important;
    }

    .chat-input::selection {
        background: rgb(219 234 254);
    }
</style>
