<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Drawer from "./Drawer.svelte";
    import type { TabItem } from "./Tabs.svelte";
    import UserAvatar from "./UserAvatar.svelte";
    import {
        getUserForAttribution,
        formatUserName,
    } from "$lib/utils/userUtils";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import * as taskService from "$lib/services/taskService";
    import * as projectService from "$lib/services/projectService";
    import { taskCache } from "$lib/utils/taskCache";
    import {
        Calendar,
        Clock,
        Tag,
        FileText,
        Users,
        Target,
        TrendingUp,
    } from "lucide-svelte";
    import FileList from "./FileList.svelte";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { Task } from "$lib/schemas/task";
    import type { Project } from "$lib/schemas/project";
    import Spinner from "./Spinner.svelte";
    import Label from "./Label.svelte";
    import HelpMessagesTab from "./HelpMessagesTab.svelte";

    interface Props {
        workItemId?: number | null;
        open?: boolean;
        onclose?: () => void;
    }

    let {
        workItemId: propWorkItemId = null,
        open: propIsOpen = $bindable(false),
        onclose,
    }: Props = $props();

    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const workItemIdParam = $derived($page.url.searchParams.get("workItemId"));
    const drawerTabParam = $derived($page.url.searchParams.get("drawerTab"));

    const isOpen = $derived.by(() => {
        const url = $page.url;
        const param = url.searchParams.get("drawer");
        return param === "help-ticket" || propIsOpen;
    });
    const workItemId = $derived(
        workItemIdParam ? Number(workItemIdParam) : propWorkItemId,
    );
    const activeTab = $derived(drawerTabParam || "details");

    // Get email from localStorage (magic link token)
    const senderEmail = $derived.by(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("help_magic_token");
            if (token) {
                // Decode email from magic link token
                try {
                    // The token format is base64 encoded email or we need to validate it
                    // For now, we'll get the email from the token validation result stored in localStorage
                    const email = localStorage.getItem("help_magic_email");
                    return email || "";
                } catch (e) {
                    console.error("Error getting email from token:", e);
                    return "";
                }
            }
        }
        return "";
    });

    const tabs: TabItem[] = [
        { id: "details", label: "Details" },
        { id: "berichten", label: "Berichten" },
        { id: "bestanden", label: "Bestanden" },
    ];

    async function handleTabChange(tabId: string) {
        const url = new URL($page.url);
        if (tabId === "details") {
            url.searchParams.delete("drawerTab");
        } else {
            url.searchParams.set("drawerTab", tabId);
        }
        await goto(url.pathname + url.search, { noScroll: true });
    }

    let workItem = $state<Task | null>(null);
    let assignees = $state<PocketBaseUser[]>([]);
    let project = $state<Project | null>(null);
    let loading = $state(false);

    $effect(() => {
        if (isOpen && workItemId) {
            loadWorkItem();
        } else if (!isOpen) {
            workItem = null;
            assignees = [];
            project = null;
        }
    });

    $effect(() => {
        if (!workItemId || !isOpen) return;

        const unsubscribe = taskCache.subscribe(workItemId, (updatedTask) => {
            if (updatedTask && workItem && updatedTask.id === workItem.id) {
                workItem = updatedTask;

                if (
                    updatedTask.assignee_id &&
                    Array.isArray(updatedTask.assignee_id) &&
                    updatedTask.assignee_id.length > 0
                ) {
                    void (async () => {
                        const assigneePromises = updatedTask.assignee_id.map(
                            (id) => getUserForAttribution(id),
                        );
                        const assigneeResults =
                            await Promise.all(assigneePromises);
                        assignees = assigneeResults.filter(
                            (u) => u !== null,
                        ) as PocketBaseUser[];
                    })();
                } else {
                    assignees = [];
                }
            }
        });

        return unsubscribe;
    });

    function handleClose() {
        if (drawerParam === "help-ticket") {
            const url = new URL($page.url);
            url.searchParams.delete("drawer");
            url.searchParams.delete("workItemId");
            url.searchParams.delete("drawerTab");
            goto(url.pathname + url.search, { noScroll: true });
        } else {
            propIsOpen = false;
        }
        if (onclose) {
            onclose();
        }
    }

    async function loadWorkItem() {
        if (!workItemId) return;

        loading = true;
        const result = await taskService.getWorkItemById(workItemId);
        if (result.success) {
            workItem = result.value;

            if (
                workItem.assignee_id &&
                Array.isArray(workItem.assignee_id) &&
                workItem.assignee_id.length > 0
            ) {
                const assigneePromises = workItem.assignee_id.map((id) =>
                    getUserForAttribution(id),
                );
                const assigneeResults = await Promise.all(assigneePromises);
                assignees = assigneeResults.filter(
                    (u) => u !== null,
                ) as PocketBaseUser[];
            } else if (
                workItem.assignee_id &&
                typeof workItem.assignee_id === "string"
            ) {
                const assignee = await getUserForAttribution(
                    workItem.assignee_id,
                );
                assignees = assignee ? [assignee] : [];
            }

            if (workItem.project_id) {
                const projectResult = await projectService.getProjectById(
                    workItem.project_id,
                );
                if (projectResult.success) {
                    project = projectResult.value;
                }
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
        loading = false;
    }

    function formatDate(dateString: string | null): string {
        if (!dateString) return "Geen datum";
        const date = new Date(dateString);
        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            backlog: "Backlog",
            gepland: "Gepland",
            "ad-hoc": "Ad-hoc",
        };
        return labels[status] || status;
    }

    function getKanbanStatusLabel(status: string, taskStatus: string): string {
        if (taskStatus === "backlog") {
            return "Nog op te pakken";
        }

        const labels: Record<string, string> = {
            backlog: "Backlog",
            gepland: "Gepland",
            mee_bezig: "Mee bezig",
            in_review: "In review",
            afgerond: "Afgerond",
            overdue: "Te laat",
        };
        return labels[status] || status;
    }
</script>

<Drawer
    open={isOpen}
    position="right"
    class="w-[95vw] md:w-[66vw]"
    onclose={handleClose}
>
    <div class="flex flex-col h-full">
        {#if loading}
            <div class="flex-1 flex items-center justify-center">
                <Spinner size="sm" />
            </div>
        {:else if workItem}
            <div class="flex flex-col h-full">
                <div class="flex-shrink-0 pb-4 border-b border-zinc-200">
                    <div>
                        <h2
                            class="text-2xl font-semibold text-zinc-900 font-aspekta"
                        >
                            Verzoek Details
                        </h2>
                        <p class="text-sm text-zinc-600 mt-1">
                            Bekijk de details van uw verzoek
                        </p>
                    </div>
                </div>

                <div class="flex-shrink-0 border-b border-zinc-200">
                    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                        {#each tabs as tab}
                            <button
                                type="button"
                                onclick={() => handleTabChange(tab.id)}
                                class="whitespace-nowrap py-4 px-1 border-b font-medium text-sm transition relative"
                                class:border-zinc-900={activeTab === tab.id}
                                class:text-zinc-900={activeTab === tab.id}
                                class:border-transparent={activeTab !== tab.id}
                                class:text-zinc-500={activeTab !== tab.id}
                                class:hover:text-zinc-900={activeTab !== tab.id}
                                class:hover:border-zinc-300={activeTab !==
                                    tab.id}
                                class:z-20={activeTab === tab.id}
                                aria-current={activeTab === tab.id
                                    ? "page"
                                    : undefined}
                            >
                                {tab.label}
                            </button>
                        {/each}
                    </nav>
                </div>

                <div class="flex-1 overflow-y-auto p-6">
                    {#if activeTab === "details"}
                        <!-- Details Tab -->
                        <div class="space-y-6">
                            <div>
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Onderwerp
                                </div>
                                <div
                                    class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 text-sm text-zinc-900"
                                >
                                    {workItem.subject || "Geen onderwerp"}
                                </div>
                            </div>

                            <div>
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Je vraag of verzoek
                                </div>
                                <div
                                    class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 text-sm text-zinc-900 whitespace-pre-wrap min-h-[75px]"
                                >
                                    {workItem.wat_ga_je_doen ||
                                        "Geen beschrijving"}
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-1"
                                    >
                                        Waarom doe je het
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 text-sm text-zinc-900 whitespace-pre-wrap min-h-[75px]"
                                    >
                                        {workItem.waarom_doe_je_het ||
                                            "Niet opgegeven"}
                                    </div>
                                </div>

                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-1"
                                    >
                                        Voor wie is het
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 text-sm text-zinc-900"
                                    >
                                        {workItem.voor_wie_is_het ||
                                            "Niet opgegeven"}
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Toegewezen aan
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 min-h-[42px] flex items-center gap-2 flex-wrap"
                                    >
                                        {#if assignees.length > 0}
                                            {#each assignees as assignee}
                                                <UserAvatar
                                                    user={assignee}
                                                    size="sm"
                                                    showName={true}
                                                />
                                            {/each}
                                        {:else}
                                            <span class="text-sm text-zinc-500"
                                                >Nog niet toegewezen</span
                                            >
                                        {/if}
                                    </div>
                                </div>

                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Project
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 min-h-[42px] flex items-center"
                                    >
                                        {#if project}
                                            <span class="text-sm text-zinc-900"
                                                >{project.name}</span
                                            >
                                        {:else}
                                            <span class="text-sm text-zinc-500"
                                                >Geen project</span
                                            >
                                        {/if}
                                    </div>
                                </div>

                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Vervaldatum
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 min-h-[42px] flex items-center"
                                    >
                                        {#if workItem.deadline}
                                            <span class="text-sm text-zinc-900"
                                                >{formatDate(
                                                    workItem.deadline,
                                                )}</span
                                            >
                                        {:else}
                                            <span class="text-sm text-zinc-500"
                                                >Geen datum</span
                                            >
                                        {/if}
                                    </div>
                                </div>

                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Uren
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 min-h-[42px] flex items-center"
                                    >
                                        {#if workItem.uren}
                                            <span class="text-sm text-zinc-900"
                                                >{workItem.uren} uur</span
                                            >
                                        {:else}
                                            <span class="text-sm text-zinc-500"
                                                >Niet opgegeven</span
                                            >
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Status
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 min-h-[42px] flex items-center"
                                    >
                                        <span class="text-sm text-zinc-900"
                                            >{getStatusLabel(
                                                workItem.status,
                                            )}</span
                                        >
                                    </div>
                                </div>

                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Voortgang
                                    </div>
                                    <div
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 min-h-[42px] flex items-center"
                                    >
                                        <span class="text-sm text-zinc-900"
                                            >{getKanbanStatusLabel(
                                                workItem.kanban_status,
                                                workItem.status,
                                            )}</span
                                        >
                                    </div>
                                </div>
                            </div>

                            {#if workItem.tags && workItem.tags.length > 0}
                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Tags
                                    </div>
                                    <div class="w-full flex flex-wrap gap-2">
                                        {#each workItem.tags as tag}
                                            <Label>{tag}</Label>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            {#if workItem.relevantie && workItem.relevantie >= 1 && workItem.relevantie <= 5}
                                <div>
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        Relevantie
                                    </div>
                                    <div class="w-full flex items-center gap-1">
                                        {#each Array(5) as _, i}
                                            <svg
                                                class="w-5 h-5 {i <
                                                workItem.relevantie!
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-zinc-300'}"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                />
                                            </svg>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <div>
                                <div
                                    class="block text-sm font-medium text-zinc-700 mb-1"
                                >
                                    Komt van (e-mailadres)
                                </div>
                                <div
                                    class="w-full px-3 py-2 border border-zinc-200 rounded-sm bg-zinc-50 text-sm text-zinc-900"
                                >
                                    {workItem.komt_van || "Niet opgegeven"}
                                </div>
                            </div>

                            {#if workItem.bijlagen && workItem.bijlagen.length > 0}
                                <div class="pt-4 border-t border-zinc-200">
                                    <div
                                        class="block text-sm font-medium text-zinc-700 mb-3"
                                    >
                                        Bijlagen ({workItem.bijlagen.length})
                                    </div>
                                    <FileList
                                        files={workItem.bijlagen}
                                        title=""
                                    />
                                </div>
                            {/if}

                            {#if workItem}
                                <div class="pt-4 border-t border-zinc-200">
                                    <div
                                        class="grid grid-cols-2 gap-4 text-xs text-zinc-500"
                                    >
                                        <div>
                                            <span class="font-medium"
                                                >Aangemaakt:</span
                                            >
                                            <span class="ml-1">
                                                {workItem.created_at
                                                    ? new Date(
                                                          workItem.created_at,
                                                      ).toLocaleString("nl-NL")
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="font-medium"
                                                >Bijgewerkt:</span
                                            >
                                            <span class="ml-1">
                                                {workItem.updated_at
                                                    ? new Date(
                                                          workItem.updated_at,
                                                      ).toLocaleString("nl-NL")
                                                    : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else if activeTab === "berichten"}
                        <!-- Berichten Tab -->
                        <div class="h-full flex flex-col">
                            {#if senderEmail}
                                <HelpMessagesTab
                                    entityType="task"
                                    entityId={workItemId ?? undefined}
                                    {senderEmail}
                                />
                            {:else}
                                <div class="text-center py-12 text-zinc-500">
                                    <p class="text-sm">
                                        Email niet geladen. Ververs de pagina.
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {:else if activeTab === "bestanden"}
                        <!-- Bestanden Tab -->
                        <div class="space-y-6">
                            {#if workItem.bijlagen && workItem.bijlagen.length > 0}
                                <FileList
                                    files={workItem.bijlagen}
                                    title="Bijlagen"
                                />
                            {:else}
                                <div class="text-center py-12 text-zinc-500">
                                    <p class="text-sm">
                                        Geen bijlagen beschikbaar.
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center py-12 text-zinc-500">
                    Geen verzoek geselecteerd
                </div>
            </div>
        {/if}
    </div>
</Drawer>
