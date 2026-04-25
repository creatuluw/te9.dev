<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import type { PageData } from "./$types";
    import type { Project } from "$lib/schemas/project";
    import FileManagerTab from "$lib/components/FileManagerTab.svelte";
    import NotesTab from "$lib/components/NotesTab.svelte";
    import { Tabs } from "$lib/components";

    let { data }: { data: PageData } = $props();
    let project = $derived(data.project as Project | null);

    const tabs = [
        { id: "overview", label: "Overzicht" },
        { id: "files", label: "Bestanden" },
        { id: "notes", label: "Notities" },
    ];

    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "overview");
</script>

<svelte:head>
    <title>{project?.name || "Project"} - Publiek</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    {#if !project}
        <div class="text-center py-12">
            <p class="text-zinc-500">Project niet gevonden</p>
        </div>
    {:else}
        <div class="mb-6 pb-4 border-b border-zinc-200">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h1 class="text-2xl font-bold text-zinc-900 font-aspekta">
                        {project.name}
                    </h1>
                    {#if project.description}
                        <p class="text-zinc-600 font-inter mt-2">
                            {project.description}
                        </p>
                    {/if}
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
                            <!-- Project Name -->
                            <div>
                                <h3
                                    class="text-sm font-semibold text-zinc-700 mb-2"
                                >
                                    Projectnaam
                                </h3>
                                <p class="text-zinc-900">{project.name}</p>
                            </div>

                            <!-- Description -->
                            {#if project.description}
                                <div>
                                    <h3
                                        class="text-sm font-semibold text-zinc-700 mb-2"
                                    >
                                        Beschrijving
                                    </h3>
                                    <p
                                        class="text-zinc-900 whitespace-pre-wrap"
                                    >
                                        {project.description}
                                    </p>
                                </div>
                            {/if}

                            <!-- Details Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Status -->
                                {#if project.status}
                                    <div>
                                        <h3
                                            class="text-sm font-semibold text-zinc-700 mb-2"
                                        >
                                            Status
                                        </h3>
                                        <p class="text-zinc-900">
                                            {project.status}
                                        </p>
                                    </div>
                                {/if}

                                <!-- Zichtbaarheid -->
                                {#if project.is_private !== undefined}
                                    <div>
                                        <h3
                                            class="text-sm font-semibold text-zinc-700 mb-2"
                                        >
                                            Zichtbaarheid
                                        </h3>
                                        <p class="text-zinc-900">
                                            {project.is_private
                                                ? "Privé"
                                                : "Openbaar"}
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {:else if activeTab === "files"}
                        <FileManagerTab
                            entityType="project"
                            entityId={project.id}
                            attachments={project.bijlagen || []}
                            onAttachmentsChange={() => {}}
                            readonly={true}
                        />
                    {:else if activeTab === "notes"}
                        <NotesTab entityType="project" entityId={project.id} />
                    {/if}
                </div>
            {/snippet}
        </Tabs>
    {/if}
</div>
