<script lang="ts">
    import { onMount } from "svelte";
    import Spinner from "./Spinner.svelte";
    import Button from "./Button.svelte";
    import Modal from "./Modal.svelte";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import type { MessageSubscription } from "$lib/schemas/messageSubscription";
    import { Trash2, Bell, ExternalLink } from "lucide-svelte";
    import * as taskService from "$lib/services/taskService";
    import * as processService from "$lib/services/processService";
    import * as caseService from "$lib/services/caseService";
    import * as projectService from "$lib/services/projectService";

    interface Props {}

    let {} = $props();

    let subscriptions = $state<MessageSubscription[]>([]);
    let loading = $state(true);
    let confirmUnsubscribe = $state<MessageSubscription | null>(null);
    let unsubscribing = $state(false);

    const ENTITY_LABELS: Record<string, string> = {
        process: "Processen",
        case: "Cases",
        work: "Werk",
        task: "Werk",
        project: "Projecten",
    };

    const ENTITY_COLORS: Record<string, string> = {
        process: "bg-blue-100 text-blue-800",
        case: "bg-green-100 text-green-800",
        work: "bg-orange-100 text-orange-800",
        task: "bg-orange-100 text-orange-800",
        project: "bg-purple-100 text-purple-800",
    };

    const ENTITY_URLS: Record<string, string> = {
        process: "/processes",
        case: "/cases",
        work: "/work",
        task: "/work",
        project: "/projects",
    };

    let groupedSubscriptions = $derived.by(() => {
        const groups: Record<string, MessageSubscription[]> = {};
        for (const sub of subscriptions) {
            const type = sub.entity_type;
            if (!groups[type]) groups[type] = [];
            groups[type].push(sub);
        }
        return groups;
    });

    onMount(async () => {
        await loadSubscriptions();
    });

    async function loadSubscriptions() {
        loading = true;
        try {
            const response = await fetch("/api/subscriptions");
            if (!response.ok) {
                toastStore.add("Fout bij het laden van abonnementen", "error");
                return;
            }
            const result = await response.json();
            if (result.success) {
                subscriptions = result.data || [];
                await resolveEntityNames();
            }
        } catch (error) {
            console.error("Error loading subscriptions:", error);
            toastStore.add("Fout bij het laden van abonnementen", "error");
        } finally {
            loading = false;
        }
    }

    /**
     * Resolve entity names for subscriptions that have null entity_name.
     * This handles subscriptions created before entity_name was passed,
     * or entities whose name changed since subscription time.
     */
    async function resolveEntityNames() {
        const needsResolution = subscriptions.filter((s) => !s.entity_name);
        if (needsResolution.length === 0) return;

        const resolved = new Map<number, string>();

        await Promise.allSettled(
            needsResolution.map(async (sub) => {
                let name: string | null = null;

                try {
                    switch (sub.entity_type) {
                        case "process": {
                            const result = await processService.getProcessById(
                                sub.entity_id,
                            );
                            if (result.success)
                                name = result.value.process.name;
                            break;
                        }
                        case "case": {
                            const result = await caseService.getCaseById(
                                sub.entity_id,
                            );
                            if (result.success) name = result.value.case.name;
                            break;
                        }
                        case "work":
                        case "task": {
                            const result = await taskService.getWorkItemById(
                                sub.entity_id,
                            );
                            if (result.success) name = result.value.subject;
                            break;
                        }
                        case "project": {
                            const result = await projectService.getProjectById(
                                sub.entity_id,
                            );
                            if (result.success) name = result.value.name;
                            break;
                        }
                    }
                } catch {
                    // Entity might be deleted — leave name as null
                }

                if (name) resolved.set(sub.id, name);
            }),
        );

        if (resolved.size > 0) {
            subscriptions = subscriptions.map((s) => {
                const resolvedName = resolved.get(s.id);
                return resolvedName ? { ...s, entity_name: resolvedName } : s;
            });
        }
    }

    async function handleUnsubscribe() {
        if (!confirmUnsubscribe) return;
        unsubscribing = true;
        try {
            const response = await fetch("/api/subscriptions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity_type: confirmUnsubscribe.entity_type,
                    entity_id: confirmUnsubscribe.entity_id,
                }),
            });

            const result = await response.json();
            if (result.success) {
                subscriptions = subscriptions.filter(
                    (s) =>
                        !(
                            s.entity_type === confirmUnsubscribe!.entity_type &&
                            s.entity_id === confirmUnsubscribe!.entity_id
                        ),
                );
                toastStore.add("Abonnement opgezegd", "success");
            } else {
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (error) {
            toastStore.add("Fout bij het opzeggen van abonnement", "error");
        } finally {
            unsubscribing = false;
            confirmUnsubscribe = null;
        }
    }

    function getEntityUrl(sub: MessageSubscription): string {
        const base = ENTITY_URLS[sub.entity_type] || "";
        return `${base}/${sub.entity_id}`;
    }

    function getEntityName(sub: MessageSubscription): string {
        if (!sub.entity_name) return "[Verwijderd]";
        return sub.entity_name;
    }

    function handleEntityClick(sub: MessageSubscription): void {
        // Navigation handled by <a href> — no action needed
    }

    function isInAppEnabled(sub: MessageSubscription): boolean {
        return (
            sub.notification_channel === "in-app" ||
            sub.notification_channel === "both"
        );
    }

    function isEmailEnabled(sub: MessageSubscription): boolean {
        return (
            sub.notification_channel === "email" ||
            sub.notification_channel === "both"
        );
    }

    async function handleChannelToggle(
        sub: MessageSubscription,
        type: "in-app" | "email",
    ) {
        const currentInApp = isInAppEnabled(sub);
        const currentEmail = isEmailEnabled(sub);

        let newInApp = currentInApp;
        let newEmail = currentEmail;

        if (type === "in-app") newInApp = !currentInApp;
        if (type === "email") newEmail = !currentEmail;

        // Don't allow both unchecked — at least one must be on
        if (!newInApp && !newEmail) return;

        // Compute new channel
        let newChannel: "in-app" | "email" | "both";
        if (newInApp && newEmail) newChannel = "both";
        else if (newInApp) newChannel = "in-app";
        else newChannel = "email";

        try {
            const response = await fetch("/api/subscriptions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity_type: sub.entity_type,
                    entity_id: sub.entity_id,
                    notification_channel: newChannel,
                }),
            });

            const result = await response.json();
            if (result.success) {
                // Update local state optimistically
                subscriptions = subscriptions.map((s) =>
                    s.id === sub.id
                        ? { ...s, notification_channel: newChannel }
                        : s,
                );
                toastStore.add("Voorkeur bijgewerkt", "success");
            } else {
                toastStore.add("Fout bij bijwerken voorkeur", "error");
            }
        } catch {
            toastStore.add("Fout bij bijwerken voorkeur", "error");
        }
    }
</script>

{#if loading}
    <div class="flex items-center justify-center py-12">
        <Spinner size="lg" />
    </div>
{:else if subscriptions.length === 0}
    <div class="text-center py-12 text-zinc-500">
        <Bell class="w-12 h-12 mx-auto mb-4 text-zinc-300" />
        <p class="text-sm font-inter">
            Je hebt nog geen abonnementen. Ga naar een proces, case, of werkitem
            en klik op de bel om updates te ontvangen.
        </p>
    </div>
{:else}
    <div class="space-y-8">
        {#each Object.entries(groupedSubscriptions) as [entityType, subs]}
            <div>
                <h3
                    class="text-base font-semibold text-zinc-800 mb-3 font-inter"
                >
                    {ENTITY_LABELS[entityType] || entityType}
                </h3>
                <div class="space-y-2">
                    {#each subs as sub (sub.id)}
                        <div
                            class="flex items-center justify-between gap-3 p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-300 transition-colors"
                        >
                            <div class="flex items-center gap-3 min-w-0">
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap {ENTITY_COLORS[
                                        sub.entity_type
                                    ] || 'bg-zinc-100 text-zinc-800'}"
                                >
                                    {ENTITY_LABELS[sub.entity_type] ||
                                        sub.entity_type}
                                </span>
                                <a
                                    href={getEntityUrl(sub)}
                                    onclick={() => handleEntityClick(sub)}
                                    class="text-sm text-zinc-700 hover:text-[#F94E04] truncate transition-colors font-inter flex items-center gap-1"
                                >
                                    {getEntityName(sub)}
                                    <ExternalLink
                                        class="w-3 h-3 shrink-0 opacity-50"
                                    />
                                </a>
                            </div>
                            <div
                                class="flex items-center gap-3 shrink-0 ml-auto"
                            >
                                <label
                                    class="flex items-center gap-1.5 cursor-pointer"
                                    title="In-app notificaties"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isInAppEnabled(sub)}
                                        onchange={() =>
                                            handleChannelToggle(sub, "in-app")}
                                        class="h-3.5 w-3.5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span
                                        class="text-xs text-zinc-500 hidden sm:inline"
                                        >In-app</span
                                    >
                                </label>
                                <label
                                    class="flex items-center gap-1.5 cursor-pointer"
                                    title="E-mail notificaties"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isEmailEnabled(sub)}
                                        onchange={() =>
                                            handleChannelToggle(sub, "email")}
                                        class="h-3.5 w-3.5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span
                                        class="text-xs text-zinc-500 hidden sm:inline"
                                        >E-mail</span
                                    >
                                </label>
                                <button
                                    type="button"
                                    onclick={() => (confirmUnsubscribe = sub)}
                                    class="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    aria-label="Abonnement opzeggen voor {getEntityName(
                                        sub,
                                    )}"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
{/if}

<Modal
    open={confirmUnsubscribe !== null}
    title="Abonnement opzeggen"
    size="sm"
    onclose={() => (confirmUnsubscribe = null)}
>
    <p class="text-sm text-zinc-600 mb-6 font-inter">
        Weet je zeker dat je je wilt uitschrijven voor
        <strong
            >{confirmUnsubscribe
                ? getEntityName(confirmUnsubscribe)
                : ""}</strong
        >?
    </p>
    <div class="flex justify-end gap-3">
        <Button
            variant="secondary"
            size="sm"
            onclick={() => (confirmUnsubscribe = null)}
            disabled={unsubscribing}
        >
            Annuleren
        </Button>
        <Button
            variant="default"
            size="sm"
            onclick={handleUnsubscribe}
            disabled={unsubscribing}
        >
            {#if unsubscribing}
                <span class="flex items-center gap-2">
                    <Spinner size="xs" />
                    Opslaan...
                </span>
            {:else}
                Opzeggen
            {/if}
        </Button>
    </div>
</Modal>
