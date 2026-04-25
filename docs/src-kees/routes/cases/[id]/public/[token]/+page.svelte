<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import type { PageData } from "./$types";
    import type { Case } from "$lib/services/caseService";
    import { formatDate } from "$lib/services/deadlineService";
    import { translateStatus } from "$lib/utils/statusTranslations";
    import FileManagerTab from "$lib/components/FileManagerTab.svelte";
    import NotesTab from "$lib/components/NotesTab.svelte";
    import { Tabs } from "$lib/components";

    let { data }: { data: PageData } = $props();
    let caseData = $derived(data.caseData?.case as Case | null);
    let ownerName = $derived(data.ownerName as string | null);

    const tabs = [
        { id: "stappen", label: "Stappen" },
        { id: "files", label: "Bestanden" },
        { id: "notes", label: "Notities" },
    ];

    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "stappen");
</script>

<svelte:head>
    <title>{caseData?.name || "Case"} - Publiek</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    {#if !caseData}
        <div class="text-center py-12">
            <p class="text-zinc-500">Case niet gevonden</p>
        </div>
    {:else}
        <div class="mb-6 pb-4 border-b border-zinc-200">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h1 class="text-2xl font-bold text-zinc-900 font-aspekta">
                        {caseData.name}
                    </h1>
                    <p class="text-sm text-zinc-500 mt-2">Publiek gedeeld</p>
                </div>
            </div>
        </div>

        <Tabs
            {tabs}
            activeTab={activeTabFromUrl}
            class="flex-1 flex flex-col min-h-0"
            ontabchange={async (tabId) => {
                const url = new URL($page.url);
                url.searchParams.set("tab", tabId);
                await goto(url.pathname + url.search, { noScroll: true });
            }}
        >
            {#snippet children({ activeTab }: { activeTab: string })}
                <div class="flex-1 flex flex-col min-h-0 pt-6">
                    {#if activeTab === "overview"}
                        <div class="space-y-6">
                            <!-- Case Name -->
                            <div>
                                <h3
                                    class="text-sm font-semibold text-zinc-700 mb-2"
                                >
                                    Casenaam
                                </h3>
                                <p class="text-zinc-900">{caseData.name}</p>
                            </div>

                            <!-- Details Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Startdatum -->
                                {#if caseData.start_date}
                                    <div>
                                        <h3
                                            class="text-sm font-semibold text-zinc-700 mb-2"
                                        >
                                            Startdatum
                                        </h3>
                                        <p class="text-zinc-900">
                                            {formatDate(caseData.start_date)}
                                        </p>
                                    </div>
                                {/if}

                                <!-- Deadline -->
                                {#if caseData.completion_deadline}
                                    <div>
                                        <h3
                                            class="text-sm font-semibold text-zinc-700 mb-2"
                                        >
                                            Deadline
                                        </h3>
                                        <p class="text-zinc-900">
                                            {formatDate(
                                                caseData.completion_deadline,
                                            )}
                                        </p>
                                    </div>
                                {/if}

                                <!-- Status -->
                                {#if caseData.status}
                                    <div>
                                        <h3
                                            class="text-sm font-semibold text-zinc-700 mb-2"
                                        >
                                            Status
                                        </h3>
                                        <p class="text-zinc-900">
                                            {translateStatus(caseData.status)}
                                        </p>
                                    </div>
                                {/if}

                                <!-- Eigenaar -->
                                {#if ownerName}
                                    <div>
                                        <h3
                                            class="text-sm font-semibold text-zinc-700 mb-2"
                                        >
                                            Eigenaar
                                        </h3>
                                        <p class="text-zinc-900">{ownerName}</p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {:else if activeTab === "files"}
                        <FileManagerTab
                            entityType="case"
                            entityId={caseData.id}
                            attachments={caseData.bijlagen || []}
                            readonly={true}
                            onAttachmentsChange={() => {}}
                        />
                    {:else if activeTab === "notes"}
                        <NotesTab entityType="case" entityId={caseData.id} />
                    {/if}
                </div>
            {/snippet}
        </Tabs>
    {/if}
</div>
