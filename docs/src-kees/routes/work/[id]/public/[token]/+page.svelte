<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import type { PageData } from "./$types";
    import type { Task } from "$lib/schemas/task";
    import FileManagerTab from "$lib/components/FileManagerTab.svelte";
    import NotesTab from "$lib/components/NotesTab.svelte";
    import TaskLayout from "$lib/components/TaskLayout.svelte";
    import { Tabs } from "$lib/components";

    let { data }: { data: PageData } = $props();
    let workItem = $derived(data.workItem as Task | null);
    let assigneeName = $derived(data.assigneeName as string | null);
    let projectName = $derived(data.projectName as string | null);

    const tabs = [
        { id: "overview", label: "Overzicht" },
        { id: "files", label: "Bestanden" },
        { id: "notes", label: "Notities" },
    ];

    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "overview");
</script>

<svelte:head>
    <title>{workItem?.subject || "Werk item"} - Publiek</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    {#if !workItem}
        <div class="text-center py-12">
            <p class="text-zinc-500">Werk item niet gevonden</p>
        </div>
    {:else}
        <div class="mb-6 pb-4 border-b border-zinc-200">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h1 class="text-2xl font-bold text-zinc-900 font-aspekta">
                        {workItem.subject || "Werk item"}
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
                <div class="flex-1 flex flex-col min-h-0">
                    {#if activeTab === "overview"}
                        {#if workItem}
                            <TaskLayout
                                {workItem}
                                {assigneeName}
                                {projectName}
                            />
                        {/if}
                    {:else if activeTab === "files"}
                        <div class="py-4 sm:py-6">
                            <div
                                class="mx-4 max-w-2xl px-2 lg:max-w-7xl lg:px-2"
                            >
                                <FileManagerTab
                                    entityType="task"
                                    entityId={workItem.id}
                                    attachments={workItem.bijlagen || []}
                                    onAttachmentsChange={() => {}}
                                    readonly={true}
                                />
                            </div>
                        </div>
                    {:else if activeTab === "notes"}
                        <div class="py-4 sm:py-6">
                            <div class="max-w-2xl px-2 lg:max-w-7xl lg:px-2">
                                <NotesTab
                                    entityType="task"
                                    entityId={workItem.id}
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            {/snippet}
        </Tabs>
    {/if}
</div>
