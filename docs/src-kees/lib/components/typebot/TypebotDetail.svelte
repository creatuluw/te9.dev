<script lang="ts">
    import { Button } from "$lib/components";
    import { ExternalLink, Code, Mail, ChevronRight } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import type { Typebot } from "$lib/schemas/typebot";
    import { parseTypebotStructure } from "$lib/services/typebotService";
    import { toastStore } from "$lib/stores/toastStore";
    import TypebotJsonDrawer from "./TypebotJsonDrawer.svelte";

    interface Props {
        typebot: Typebot;
        onclose?: () => void;
        jsonDrawerOpen?: boolean;
        onJsonDrawerChange?: (open: boolean) => void;
    }

    let {
        typebot,
        onclose,
        jsonDrawerOpen = false,
        onJsonDrawerChange,
    }: Props = $props();

    const structure = $derived(parseTypebotStructure(typebot));
    const viewerUrl = "https://viewer-production-a3fa.up.railway.app";
    const previewUrl = $derived(
        typebot.publicId ? `${viewerUrl}/${typebot.publicId}` : null,
    );

    function openSendPage() {
        if (!typebot.publicId) {
            toastStore.add(
                "Deze typebot heeft geen public ID en kan niet worden gedeeld",
                "error",
            );
            return;
        }
        goto(`/tools/typebot/send?id=${typebot.id}`);
    }

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

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
        <div>
            <h2 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                {typebot.name}
            </h2>
            {#if !typebot.publicId}
                <div class="mt-2">
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                        Geen public ID
                    </span>
                </div>
            {/if}
        </div>
        <div class="flex items-center gap-2">
            {#if previewUrl}
                <Button
                    variant="outline"
                    onclick={() => window.open(previewUrl, "_blank")}
                >
                    Preview
                    <ExternalLink class="h-4 w-4 ml-2" />
                </Button>
            {/if}
            <Button variant="ghost" onclick={() => onJsonDrawerChange?.(true)}>
                <Code class="h-4 w-4 mr-2" />
                JSON
            </Button>
            {#if typebot.publicId}
                <Button onclick={openSendPage}>
                    <Mail class="h-4 w-4 mr-2" />
                    Verstuur naar medewerkers
                </Button>
            {/if}
        </div>
    </div>

    <!-- Structure -->
    <div class="space-y-4">
        <h3 class="text-lg font-semibold text-zinc-900 font-aspekta">
            Structuur
        </h3>

        <!-- Groups -->
        {#if structure.groups.length > 0}
            <div class="space-y-4">
                {#each structure.groups as group, index}
                    <div class="bg-white border border-zinc-200 rounded-lg">
                        <details class="group">
                            <summary
                                class="flex items-center justify-between p-4 cursor-pointer list-none"
                            >
                                <span
                                    class="font-medium text-zinc-900 font-aspekta"
                                >
                                    {group.title || `Groep ${index + 1}`}
                                </span>
                                <ChevronRight
                                    class="h-5 w-5 text-zinc-400 transition-transform group-open:rotate-90"
                                />
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
                                                {getBlockTypeLabel(block.type)}
                                            </span>
                                        </div>
                                        {#if block.content?.richText}
                                            {#each block.content.richText as item}
                                                {#if item.type === "p"}
                                                    <p
                                                        class="text-sm text-zinc-700"
                                                    >
                                                        {#each item.children || [] as child}
                                                            {child.text || ""}
                                                        {/each}
                                                    </p>
                                                {/if}
                                            {/each}
                                        {:else if block.content?.plainText}
                                            <p class="text-sm text-zinc-700">
                                                {block.content.plainText}
                                            </p>
                                        {:else if block.content?.html}
                                            <div class="text-sm text-zinc-700">
                                                {@html block.content.html}
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
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {#each structure.variables as variable}
                        <div
                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-3"
                        >
                            <div class="font-medium text-zinc-900">
                                {variable.name}
                            </div>
                            {#if variable.type}
                                <div class="text-sm text-zinc-600">
                                    {variable.type}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    <!-- Drawers/Modals -->
    <TypebotJsonDrawer
        open={jsonDrawerOpen}
        typebotData={typebot}
        onclose={() => onJsonDrawerChange?.(false)}
    />
</div>
