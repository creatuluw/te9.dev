<script lang="ts">
    import { Drawer, Button } from "$lib/components";
    import { X, Code, List } from "lucide-svelte";
    import type { Typebot } from "$lib/schemas/typebot";
    import { parseTypebotStructure } from "$lib/services/typebotService";

    interface Props {
        open?: boolean;
        typebotData?: Typebot;
        onclose?: () => void;
    }

    let {
        open: isOpen = $bindable(false),
        typebotData,
        onclose,
    }: Props = $props();

    let activeTab = $state<"structure" | "json">("structure");

    function closeDrawer() {
        isOpen = false;
        onclose?.();
    }

    const jsonString = $derived.by(() => {
        if (!typebotData) return "";
        try {
            return JSON.stringify(typebotData, null, 2);
        } catch {
            return "Invalid JSON";
        }
    });

    const structure = $derived.by(() => {
        if (!typebotData) return null;
        return parseTypebotStructure(typebotData);
    });

    function getBlockTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            text: "Tekst",
            textInput: "Tekst invoer",
            numberInput: "Nummer invoer",
            emailInput: "E-mail invoer",
            urlInput: "URL invoer",
            phoneNumberInput: "Telefoonnummer invoer",
            dateInput: "Datum invoer",
            choice: "Keuze",
            pictureChoice: "Afbeelding keuze",
            rating: "Beoordeling",
            fileInput: "Bestand upload",
            payment: "Betaling",
            condition: "Voorwaarde",
            setVariable: "Variabele instellen",
            code: "Code",
            webhook: "Webhook",
            wait: "Wachten",
            jump: "Springen",
            abTest: "A/B Test",
            redirect: "Doorverwijzen",
        };
        return labels[type] || type;
    }
</script>

<Drawer
    open={isOpen}
    position="right"
    class="w-[90vw] max-w-4xl"
    onclose={closeDrawer}
>
    <div class="h-full flex flex-col">
        <!-- Header -->
        <div
            class="flex items-center justify-between p-6 border-b border-zinc-200"
        >
            <h2 class="text-lg font-semibold text-zinc-900 font-aspekta">
                Typebot Details
            </h2>
            <Button variant="ghost" size="sm" onclick={closeDrawer}>
                <X class="h-4 w-4" />
            </Button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-zinc-200">
            <button
                type="button"
                onclick={() => (activeTab = "structure")}
                class="flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 {activeTab ===
                'structure'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900'}"
            >
                <List class="h-4 w-4 inline-block mr-2" />
                Structuur
            </button>
            <button
                type="button"
                onclick={() => (activeTab = "json")}
                class="flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 {activeTab ===
                'json'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900'}"
            >
                <Code class="h-4 w-4 inline-block mr-2" />
                JSON
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto p-6">
            {#if activeTab === "structure"}
                {#if structure}
                    <div class="space-y-4">
                        <!-- Groups -->
                        {#if structure.groups.length > 0}
                            <div class="space-y-4">
                                {#each structure.groups as group, index}
                                    <div
                                        class="bg-white border border-zinc-200 rounded-lg"
                                    >
                                        <details class="group">
                                            <summary
                                                class="flex items-center justify-between p-4 cursor-pointer list-none"
                                            >
                                                <span
                                                    class="font-medium text-zinc-900 font-aspekta"
                                                >
                                                    {group.title ||
                                                        `Groep ${index + 1}`}
                                                </span>
                                                <svg
                                                    class="h-5 w-5 text-zinc-400 transition-transform group-open:rotate-90"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </summary>
                                            <div class="px-4 pb-4 space-y-3">
                                                {#each group.blocks as block}
                                                    <div
                                                        class="bg-zinc-50 border border-zinc-200 rounded-lg p-3"
                                                    >
                                                        <div
                                                            class="flex items-center gap-2 mb-2"
                                                        >
                                                            <span
                                                                class="text-xs font-medium text-zinc-600 bg-white px-2 py-1 rounded"
                                                            >
                                                                {getBlockTypeLabel(
                                                                    block.type,
                                                                )}
                                                            </span>
                                                        </div>
                                                        {#if block.content?.richText}
                                                            {#each block.content.richText as item}
                                                                {#if item.type === "p"}
                                                                    <p
                                                                        class="text-sm text-zinc-700"
                                                                    >
                                                                        {#each item.children || [] as child}
                                                                            {child.text ||
                                                                                ""}
                                                                        {/each}
                                                                    </p>
                                                                {/if}
                                                            {/each}
                                                        {:else if block.content?.plainText}
                                                            <p
                                                                class="text-sm text-zinc-700"
                                                            >
                                                                {block.content
                                                                    .plainText}
                                                            </p>
                                                        {:else if block.content?.html}
                                                            <div
                                                                class="text-sm text-zinc-700"
                                                            >
                                                                {@html block
                                                                    .content
                                                                    .html}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        </details>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <p class="text-zinc-600">Geen groepen gevonden</p>
                        {/if}

                        <!-- Variables -->
                        {#if structure.variables.length > 0}
                            <div class="mt-6">
                                <h4
                                    class="text-md font-semibold text-zinc-900 font-aspekta mb-3"
                                >
                                    Variabelen
                                </h4>
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-2"
                                >
                                    {#each structure.variables as variable}
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-3"
                                        >
                                            <div
                                                class="font-medium text-zinc-900"
                                            >
                                                {variable.name}
                                            </div>
                                            {#if variable.type}
                                                <div
                                                    class="text-sm text-zinc-600"
                                                >
                                                    {variable.type}
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <p class="text-zinc-600">Geen structuur beschikbaar</p>
                {/if}
            {:else}
                <!-- JSON Tab -->
                {#if jsonString}
                    <pre
                        class="bg-zinc-50 rounded-lg p-4 overflow-x-auto text-sm font-pt-mono text-zinc-900 border border-zinc-200"><code
                            >{jsonString}</code
                        ></pre>
                {:else}
                    <p class="text-zinc-600">Geen data beschikbaar</p>
                {/if}
            {/if}
        </div>
    </div>
</Drawer>
