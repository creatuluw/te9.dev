<script lang="ts">
    import { onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Tabs } from "$lib/components";
    import WorkItemCard from "$lib/components/WorkItemCard.svelte";
    import BacklogDrawer from "$lib/components/BacklogDrawer.svelte";
    import CaseTaskDrawer from "$lib/components/CaseTaskDrawer.svelte";
    import FileManagerTab from "$lib/components/FileManagerTab.svelte";
    import MessagesTab from "$lib/components/MessagesTab.svelte";
    import NotesTab from "$lib/components/NotesTab.svelte";
    import ProjectMemberManager from "$lib/components/ProjectMemberManager.svelte";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import * as taskService from "$lib/services/taskService";
    import * as caseService from "$lib/services/caseService";
    import { toastStore } from "$lib/stores/toastStore";
    import { breadcrumbStore } from "$lib/stores/breadcrumbStore";
    import { authStore } from "$lib/stores/authStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { Project } from "$lib/schemas/project";
    import PublicSharingToggle from "$lib/components/PublicSharingToggle.svelte";
    import { hasPermission } from "$lib/utils/authGuard";
    import type {
        UnifiedBacklogItem,
        UnifiedPlanningItem,
    } from "$lib/services/taskService";
    import type { ProjectTaskStats } from "$lib/services/dashboardService";
    // MembershipInfo is not exported from projectMemberService, define locally
    type MembershipInfo = { isMember: boolean; isOwner: boolean };
    import {
        Archive,
        Clock,
        ListTodo,
        CheckCircle2,
        AlertCircle,
    } from "lucide-svelte";
    import { useRealtime } from "$lib/hooks/useRealtime.svelte";

    interface ProjectData {
        project: Project | null;
        taskStats: ProjectTaskStats | null;
        membership: MembershipInfo;
        tasks: UnifiedBacklogItem[];
        _version: string;
        errors: { project: any; tasks: any };
        projectId: number;
        timestamp: number;
        user: { id: string; is_sysadmin: boolean } | null;
    }

    const { data }: { data: ProjectData } = $props();

    const projectId = $derived(data.projectId);
    const currentPath = $derived($page.url.pathname);
    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "overview");

    interface RealtimeProjectData {
        project: Project | null;
        taskStats: ProjectTaskStats | null;
        membership: MembershipInfo;
        tasks: UnifiedBacklogItem[];
    }

    let currentVersion = $state(data._version);
    let currentData = $state<RealtimeProjectData>({
        project: data.project,
        taskStats: data.taskStats,
        membership: data.membership,
        tasks: data.tasks,
    });

    const realtime = useRealtime<RealtimeProjectData>(
        `project:${projectId}`,
        async () => {
            const res = await fetch(`/api/realtime/project/${projectId}`, {
                headers: { "If-None-Match": currentVersion },
            });
            if (res.status === 304) {
                return { data: currentData, etag: currentVersion };
            }
            const json = await res.json();
            currentData = json.data;
            currentVersion = json._version;
            return { data: json.data, etag: json._version };
        },
        {
            initialData: currentData,
            initialVersion: currentVersion,
            interval: 10000,
        },
    );

    let drawerOpen = $state(false);

    const project = $derived(realtime.data?.project ?? null);
    const taskStats = $derived(realtime.data?.taskStats ?? null);
    const membership = $derived(
        realtime.data?.membership ?? { isMember: false, isOwner: false },
    );
    const unifiedBacklogItems = $derived(realtime.data?.tasks ?? []);
    const loading = $derived(realtime.loading && !realtime.data);
    const loadingStats = $derived(false);
    const loadingTasks = $derived(false);
    const isProjectMember = $derived(membership.isMember);
    const isProjectOwner = $derived(membership.isOwner);
    const projectAttachments = $derived(project?.bijlagen ?? []);

    if (project?.name) {
        breadcrumbStore.setEntityName(currentPath, project.name);
    }

    onDestroy(() => {
        breadcrumbStore.clearEntityName(currentPath);
    });

    function handleOpenDrawer() {
        drawerOpen = true;
    }

    function handleCloseDrawer() {
        drawerOpen = false;
    }

    async function handleItemSaved(item: any) {
        if ($page.url.pathname === "/") {
            await goto(`/work/${item.id}`);
        } else {
            drawerOpen = false;
            await handleCloseTaskDrawer();
            await realtime.refresh();
        }
    }

    async function handleOpenTaskDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.set("drawer", "workitem");
        urlParams.set("projectId", String(projectId));
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    async function handleCloseTaskDrawer() {
        const urlParams = new URLSearchParams($page.url.searchParams);
        urlParams.delete("drawer");
        urlParams.delete("projectId");
        urlParams.delete("workItemId");
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    function openEditDrawer(item: UnifiedBacklogItem) {
        window.open(`/work/${item.id}`, "_blank");
    }

    function convertToPlanningItem(
        item: UnifiedBacklogItem,
    ): UnifiedPlanningItem {
        return {
            id: item.id,
            type: item.type,
            task_type: item.task_type,
            subject: item.subject,
            assignee_id: item.assignee_id,
            owner_id: item.owner_id,
            due_date: item.due_date,
            deadline: item.deadline,
            uren: item.uren,
            tags: item.tags,
            status: item.status,
            kanban_status: item.kanban_status || "gepland",
            relevantie: item.relevantie,
            voor_wie_is_het: item.voor_wie_is_het,
            wat_ga_je_doen: item.wat_ga_je_doen,
            waarom_doe_je_het: item.waarom_doe_je_het,
            komt_van: item.komt_van,
            bijlagen: item.bijlagen || null,
            created_at: item.created_at,
            updated_at: item.updated_at,
            case_id: item.case_id || null,
            case_name: item.case_name || null,
            case_step_id: item.case_step_id,
            name: item.task_name || null,
            description: null,
            criteria: null,
            order_index: null,
        } as UnifiedPlanningItem;
    }

    async function moveToPlanning(
        item: UnifiedBacklogItem,
        status: "gepland" | "ad-hoc",
    ) {
        const optimisticId = realtime.updateLocal((current) => ({
            ...current,
            tasks: current.tasks.filter(
                (i) => !(i.id === item.id && i.type === item.type),
            ),
        }));

        const toastMessage =
            item.type === "work_item"
                ? "Item verplaatst naar planning"
                : "Taak verplaatst naar planning";
        toastStore.add(toastMessage, "success");

        try {
            if (item.type === "work_item") {
                const result = await taskService.moveWorkItemToPlanning(
                    item.id,
                    status,
                );
                if (!result.success) {
                    realtime.rollback(optimisticId);
                    toastStore.clear();
                    toastStore.add(getUserMessage(result.error), "error");
                    console.error(
                        "Error moving work item to planning:",
                        result.error,
                    );
                }
            } else if (item.type === "case_task") {
                const result = await caseService.moveCaseTaskToPlanning(
                    item.id,
                    status,
                );
                if (!result.success) {
                    realtime.rollback(optimisticId);
                    toastStore.clear();
                    toastStore.add(getUserMessage(result.error), "error");
                    console.error(
                        "Error moving case task to planning:",
                        result.error,
                    );
                }
            }
        } catch (error) {
            console.error("Unexpected error moving item to planning:", error);
            realtime.rollback(optimisticId);
            toastStore.clear();
            toastStore.add("Er is een onverwachte fout opgetreden", "error");
        }
    }

    async function handleMembershipUpdate() {
        await realtime.refresh();
    }

    async function handleAttachmentsChange(newAttachments: string[]) {
        const result = await fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bijlagen: newAttachments }),
        });
        if (result.ok) {
            toastStore.add("Bestanden bijgewerkt", "success");
            await realtime.refresh();
        } else {
            const error = await result.json();
            toastStore.add(
                error.error || "Fout bij bijwerken bestanden",
                "error",
            );
        }
    }

    const tabs = [
        { id: "overview", label: "Overzicht" },
        { id: "tasks", label: "Taken" },
        { id: "members", label: "Leden" },
        { id: "files", label: "Bestanden" },
        { id: "messages", label: "Berichten" },
        { id: "notities", label: "Notities" },
        { id: "timeline", label: "Tijdslijn" },
        { id: "instellingen", label: "Instellingen" },
        { id: "help", label: "Help" },
    ];
</script>

<svelte:head>
    <title>{project?.name || "Project"} - Projecten</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    {#if loading}
        <div class="fixed inset-0 flex items-center justify-center">
            <Spinner size="xl" />
        </div>
    {:else if !project}
        <div class="text-center py-12">
            <p class="text-zinc-500">Project niet gevonden</p>
        </div>
    {:else}
        <div class="flex flex-col" style="height: calc(100vh - 8rem);">
            <!-- Header -->
            <div class="mb-6 pb-4 border-b border-zinc-200 flex-shrink-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h2
                            class="text-2xl font-bold text-zinc-900 font-aspekta"
                        >
                            {project.name}
                        </h2>
                        {#if project.description}
                            <p class="text-zinc-600 font-inter mt-2">
                                {project.description}
                            </p>
                        {/if}
                    </div>
                    <div class="flex gap-2 items-center">
                        <Button onclick={handleOpenDrawer}
                            >Nieuw item toevoegen</Button
                        >
                        <Button
                            variant="secondary"
                            onclick={() => goto("/projects")}
                            >Terug naar Projecten</Button
                        >
                    </div>
                </div>
            </div>

            <!-- Tabs -->
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
                        <!-- Overview Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "overview"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <!-- Task Status Cards -->
                                {#if taskStats}
                                    <div>
                                        <h2
                                            class="text-xl font-semibold text-zinc-900 mb-4"
                                        >
                                            Taken
                                        </h2>
                                        <div
                                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
                                        >
                                            <!-- Backlog Tasks Card -->
                                            <button
                                                onclick={() =>
                                                    goto(
                                                        `/work-items?status=backlog&project=${projectId}`,
                                                    )}
                                                class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
                                            >
                                                <div
                                                    class="absolute top-6 right-6"
                                                >
                                                    <div
                                                        class="p-2 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition-colors"
                                                    >
                                                        <Archive
                                                            class="w-5 h-5 text-zinc-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <div
                                                        class="text-sm text-zinc-600 mb-1"
                                                    >
                                                        Backlog
                                                    </div>
                                                    <div
                                                        class="text-2xl font-bold text-zinc-900"
                                                    >
                                                        {taskStats.backlogTasks}
                                                    </div>
                                                </div>
                                                <p
                                                    class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                                                >
                                                    Taken in de backlog
                                                </p>
                                            </button>

                                            <!-- Pending Tasks Card -->
                                            <button
                                                onclick={() =>
                                                    goto(
                                                        `/work-items?status=gepland&project=${projectId}`,
                                                    )}
                                                class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6 hover:shadow-sm hover:border-zinc-300 transition-all text-left group relative"
                                            >
                                                <div
                                                    class="absolute top-6 right-6"
                                                >
                                                    <div
                                                        class="p-2 bg-zinc-100 rounded-lg group-hover:bg-zinc-200 transition-colors"
                                                    >
                                                        <Clock
                                                            class="w-5 h-5 text-zinc-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <div
                                                        class="text-sm text-zinc-600 mb-1"
                                                    >
                                                        Gepland
                                                    </div>
                                                    <div
                                                        class="text-2xl font-bold text-zinc-900"
                                                    >
                                                        {taskStats.pendingTasks}
                                                    </div>
                                                </div>
                                                <p
                                                    class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                                                >
                                                    Taken die nog moeten
                                                    beginnen
                                                </p>
                                            </button>

                                            <!-- Active Tasks Card -->
                                            <button
                                                onclick={() =>
                                                    goto(
                                                        `/work-items?status=mee_bezig,in_review&project=${projectId}`,
                                                    )}
                                                class="bg-white rounded-lg shadow-xs border border-blue-200 p-6 hover:shadow-sm hover:border-blue-300 transition-all text-left group relative"
                                            >
                                                <div
                                                    class="absolute top-6 right-6"
                                                >
                                                    <div
                                                        class="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors"
                                                    >
                                                        <ListTodo
                                                            class="w-5 h-5 text-blue-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <div
                                                        class="text-sm text-blue-600 mb-1"
                                                    >
                                                        In behandeling
                                                    </div>
                                                    <div
                                                        class="text-2xl font-bold text-blue-900"
                                                    >
                                                        {taskStats.activeTasksCount}
                                                    </div>
                                                </div>
                                                <p
                                                    class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                                                >
                                                    Taken die nu actief zijn
                                                </p>
                                            </button>

                                            <!-- Completed Tasks Card -->
                                            <button
                                                onclick={() =>
                                                    goto(
                                                        `/work-items?status=afgerond&project=${projectId}`,
                                                    )}
                                                class="bg-white rounded-lg shadow-xs border border-green-200 p-6 hover:shadow-sm hover:border-green-300 transition-all text-left group relative"
                                            >
                                                <div
                                                    class="absolute top-6 right-6"
                                                >
                                                    <div
                                                        class="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors"
                                                    >
                                                        <CheckCircle2
                                                            class="w-5 h-5 text-green-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <div
                                                        class="text-sm text-green-600 mb-1"
                                                    >
                                                        Afgerond
                                                    </div>
                                                    <div
                                                        class="text-2xl font-bold text-green-900"
                                                    >
                                                        {taskStats.completedTasksCount}
                                                    </div>
                                                </div>
                                                <p
                                                    class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                                                >
                                                    Taken die succesvol zijn
                                                    afgerond
                                                </p>
                                            </button>

                                            <!-- Overdue Tasks Card -->
                                            <button
                                                onclick={() =>
                                                    goto(
                                                        `/work-items?status=overdue&project=${projectId}`,
                                                    )}
                                                class="bg-white rounded-lg shadow-xs border border-red-200 p-6 hover:shadow-sm hover:border-red-300 transition-all text-left group relative"
                                            >
                                                <div
                                                    class="absolute top-6 right-6"
                                                >
                                                    <div
                                                        class="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors"
                                                    >
                                                        <AlertCircle
                                                            class="w-5 h-5 text-red-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <div
                                                        class="text-sm text-red-600 mb-1"
                                                    >
                                                        Te laat
                                                    </div>
                                                    <div
                                                        class="text-2xl font-bold text-red-900"
                                                    >
                                                        {taskStats.overdueTasks}
                                                    </div>
                                                </div>
                                                <p
                                                    class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                                                >
                                                    Taken die de deadline hebben
                                                    overschreden
                                                </p>
                                            </button>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <!-- Tasks Tab - All Work Items (same as backlog) -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "tasks"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-shrink-0 mb-4">
                                <Button onclick={handleOpenTaskDrawer}
                                    >Nieuwe taak toevoegen</Button
                                >
                            </div>
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                {#if unifiedBacklogItems.length === 0}
                                    <div
                                        class="text-center py-12 bg-white rounded-lg border border-zinc-200"
                                    >
                                        <p class="text-zinc-500">
                                            Geen taken voor dit project
                                        </p>
                                    </div>
                                {:else}
                                    <!-- Backlog Items - Work Items as Cards (same as /work/backlog) -->
                                    <div
                                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch"
                                    >
                                        {#each unifiedBacklogItems as item (item.type + "-" + item.id)}
                                            {@const planningItem =
                                                convertToPlanningItem(item)}
                                            <div class="h-full">
                                                <WorkItemCard
                                                    workItem={planningItem}
                                                    draggable={false}
                                                    ondelete={() =>
                                                        realtime.refresh()}
                                                    onclick={() =>
                                                        openEditDrawer(item)}
                                                    showStatusButtons={true}
                                                    onstatuschange={(status) =>
                                                        moveToPlanning(
                                                            item,
                                                            status,
                                                        )}
                                                />
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <!-- Members Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "members"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                {#if project}
                                    <ProjectMemberManager
                                        {projectId}
                                        currentUserId={data.user?.id || ""}
                                        isOwner={data.user?.is_sysadmin ||
                                            isProjectOwner}
                                        onupdate={handleMembershipUpdate}
                                    />
                                {/if}
                            </div>
                        </div>
                        <!-- Files Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "files"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                {#if project}
                                    <FileManagerTab
                                        entityType="project"
                                        entityId={projectId}
                                        attachments={projectAttachments}
                                        onAttachmentsChange={handleAttachmentsChange}
                                    />
                                {/if}
                            </div>
                        </div>
                        <!-- Messages Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0"
                            style:display={activeTab === "messages"
                                ? "flex"
                                : "none"}
                        >
                            <MessagesTab
                                entityType="project"
                                entityId={projectId}
                                entityName={project?.name}
                            />
                        </div>
                        <!-- Notities Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0"
                            style:display={activeTab === "notities"
                                ? "flex"
                                : "none"}
                        >
                            <NotesTab
                                entityType="project"
                                entityId={projectId}
                            />
                        </div>
                        <!-- Timeline Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "timeline"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <div class="text-center py-12 text-zinc-500">
                                    <p class="text-sm">
                                        Tijdslijn functionaliteit komt
                                        binnenkort beschikbaar.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <!-- Instellingen Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "instellingen"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <div
                                    class="bg-white border border-zinc-200 rounded-lg p-6"
                                >
                                    <h3
                                        class="text-lg font-semibold text-zinc-900 font-aspekta mb-6"
                                    >
                                        Instellingen
                                    </h3>
                                    <div class="space-y-6">
                                        {#if hasPermission("/projects/[id]", "write")}
                                            <div>
                                                <h4
                                                    class="text-sm font-medium text-zinc-700 mb-4"
                                                >
                                                    Delen
                                                </h4>
                                                <PublicSharingToggle
                                                    entityType="project"
                                                    entityId={projectId}
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Help Tab -->
                        <div
                            class="flex-1 flex flex-col min-h-0 pt-6"
                            style:display={activeTab === "help"
                                ? "flex"
                                : "none"}
                        >
                            <div class="flex-1 overflow-y-auto space-y-6 pb-4">
                                <div class="space-y-4">
                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Project Overzicht
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Het <strong
                                                    class="text-zinc-900"
                                                    >Overzicht</strong
                                                > tabblad toont alle statistieken
                                                en work items van dit project. Hier
                                                kunt u de voortgang volgen en taken
                                                beheren.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Taken
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Het <strong
                                                    class="text-zinc-900"
                                                    >Taken</strong
                                                > tabblad toont alle work items (taken)
                                                die aan dit project zijn gekoppeld.
                                                U kunt hier taken bekijken en beheren.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3
                                            class="text-lg font-semibold text-zinc-900 font-aspekta mb-3"
                                        >
                                            Bestanden
                                        </h3>
                                        <div
                                            class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3"
                                        >
                                            <p
                                                class="text-sm text-zinc-700 leading-relaxed"
                                            >
                                                Het <strong
                                                    class="text-zinc-900"
                                                    >Bestanden</strong
                                                > tabblad maakt het mogelijk om bestanden
                                                te uploaden en te beheren die aan
                                                dit project zijn gekoppeld.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/snippet}
            </Tabs>
        </div>
    {/if}
</div>

<!-- Backlog Drawer with pre-filled project ID (controlled by URL or drawerOpen prop) -->
<BacklogDrawer
    isOpen={drawerOpen}
    onsaved={handleItemSaved}
    onClose={handleCloseTaskDrawer}
/>

<!-- Case Task Drawer -->
<CaseTaskDrawer onsaved={handleItemSaved} />
