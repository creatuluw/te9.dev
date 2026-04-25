<script lang="ts">
    import { authStore } from "$lib/stores/authStore";
    import {
        Send,
        CheckCircle,
        Eye,
        MousePointer,
        AlertTriangle,
        Ban,
        Trash2,
        X,
        ChevronLeft,
        ChevronRight,
        Mail,
    } from "lucide-svelte";
    import Spinner from "$lib/components/Spinner.svelte";

    // ---------------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------------

    interface RecentEvent {
        id: string;
        message_id: number;
        event_type: string;
        tracked_at: string;
        url?: string;
        ip_address?: string;
        user_agent?: string;
        bounce_reason?: string;
        bounce_type?: string;
    }

    interface SuppressedAddress {
        id: string;
        email: string;
        reason: string;
        bounce_type?: string;
        suppressed_at: string;
    }

    interface Props {
        data: {
            stats: Record<string, number>;
            recentEvents: RecentEvent[];
            suppressedAddresses: SuppressedAddress[];
        };
    }

    // ---------------------------------------------------------------------------
    // Page data & local state
    // ---------------------------------------------------------------------------

    let { data }: Props = $props();

    let currentPage = $state(1);
    const eventsPerPage = 25;

    let suppressedAddresses = $state(data.suppressedAddresses);
    let confirmDialogEmail = $state<string | null>(null);
    let isRemoving = $state(false);
    let actionError = $state<string | null>(null);

    // ---------------------------------------------------------------------------
    // Derived
    // ---------------------------------------------------------------------------

    let totalPages = $derived(
        Math.ceil(data.recentEvents.length / eventsPerPage),
    );

    let paginatedEvents = $derived(
        data.recentEvents.slice(
            (currentPage - 1) * eventsPerPage,
            currentPage * eventsPerPage,
        ),
    );

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Format a date string as a relative time (e.g. "2 uur geleden").
     */
    function formatRelativeTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);

        if (diffSec < 60) return "zojuist";
        if (diffMin < 60) return `${diffMin} minuten geleden`;
        if (diffHour < 24) return `${diffHour} uur geleden`;
        if (diffDay < 7)
            return `${diffDay} dag${diffDay > 1 ? "en" : ""} geleden`;
        if (diffWeek < 5)
            return `${diffWeek} week${diffWeek > 1 ? "en" : ""} geleden`;
        if (diffMonth < 12)
            return `${diffMonth} maand${diffMonth > 1 ? "en" : ""} geleden`;

        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    /**
     * Format a date string for display in tables.
     */
    function formatDateTime(dateStr: string): string {
        return new Date(dateStr).toLocaleString("nl-NL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    /**
     * Get badge color classes for an event type.
     */
    function getEventBadgeClasses(eventType: string): string {
        const map: Record<string, string> = {
            sent: "bg-blue-100 text-blue-800 border-blue-200",
            delivered: "bg-green-100 text-green-800 border-green-200",
            opened: "bg-purple-100 text-purple-800 border-purple-200",
            clicked: "bg-cyan-100 text-cyan-800 border-cyan-200",
            bounced: "bg-red-100 text-red-800 border-red-200",
            failed: "bg-orange-100 text-orange-800 border-orange-200",
            suppressed: "bg-zinc-100 text-zinc-800 border-zinc-200",
            unknown: "bg-zinc-100 text-zinc-600 border-zinc-200",
        };
        return map[eventType] || map.unknown;
    }

    /**
     * Get the stats card configuration.
     */
    function getStatCards(): {
        key: string;
        label: string;
        icon: typeof Send;
        color: string;
        bgColor: string;
        borderColor: string;
    }[] {
        return [
            {
                key: "sent",
                label: "Verzonden",
                icon: Send,
                color: "text-blue-600",
                bgColor: "bg-blue-100",
                borderColor: "border-blue-200",
            },
            {
                key: "delivered",
                label: "Bezorgd",
                icon: CheckCircle,
                color: "text-green-600",
                bgColor: "bg-green-100",
                borderColor: "border-green-200",
            },
            {
                key: "opened",
                label: "Geopend",
                icon: Eye,
                color: "text-purple-600",
                bgColor: "bg-purple-100",
                borderColor: "border-purple-200",
            },
            {
                key: "clicked",
                label: "Geklikt",
                icon: MousePointer,
                color: "text-cyan-600",
                bgColor: "bg-cyan-100",
                borderColor: "border-cyan-200",
            },
            {
                key: "bounced",
                label: "Bounced",
                icon: AlertTriangle,
                color: "text-red-600",
                bgColor: "bg-red-100",
                borderColor: "border-red-200",
            },
            {
                key: "suppressed",
                label: "Geblokkeerd",
                icon: Ban,
                color: "text-zinc-600",
                bgColor: "bg-zinc-100",
                borderColor: "border-zinc-200",
            },
        ];
    }

    /**
     * Truncate a URL for display.
     */
    function truncateUrl(
        url: string | undefined | null,
        maxLength = 40,
    ): string {
        if (!url) return "—";
        if (url.length <= maxLength) return url;
        return url.slice(0, maxLength) + "…";
    }

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    function requestRemove(email: string) {
        confirmDialogEmail = email;
        actionError = null;
    }

    function cancelRemove() {
        confirmDialogEmail = null;
        actionError = null;
    }

    async function confirmRemove() {
        if (!confirmDialogEmail) return;

        isRemoving = true;
        actionError = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                actionError =
                    "Niet geautoriseerd — probeer opnieuw in te loggen.";
                isRemoving = false;
                return;
            }

            const encodedEmail = encodeURIComponent(confirmDialogEmail);
            const response = await fetch(
                `/api/email/suppressions/${encodedEmail}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const result = await response.json();

            if (!result.success) {
                actionError =
                    result.error || "Kon suppressie niet verwijderen.";
                isRemoving = false;
                return;
            }

            // Remove locally
            suppressedAddresses = suppressedAddresses.filter(
                (s) =>
                    s.email.toLowerCase() !== confirmDialogEmail!.toLowerCase(),
            );

            confirmDialogEmail = null;
        } catch (err) {
            console.error("[email-tracking] Remove suppression error:", err);
            actionError =
                "Er ging iets mis bij het verwijderen van de suppressie.";
        }

        isRemoving = false;
    }

    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
        }
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <!-- Header -->
    <div class="mb-8">
        <h1
            class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2"
        >
            Email Tracking
        </h1>
        <p class="text-zinc-600">
            Overzicht van email tracking, bezorging en bounce suppressies
        </p>
    </div>

    <!-- Global action error -->
    {#if actionError}
        <div
            class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6"
        >
            {actionError}
        </div>
    {/if}

    <!-- ================================================================== -->
    <!-- Section 1: Stats Overview                                          -->
    <!-- ================================================================== -->
    <section class="mb-8">
        <h2
            class="text-xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-4"
        >
            Statistieken
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {#each getStatCards() as card}
                {@const count = data.stats[card.key] || 0}
                {@const Icon = card.icon}
                <div
                    class="bg-white rounded-lg shadow-xs border {card.borderColor} p-5 hover:shadow-sm transition-all"
                >
                    <div class="flex items-center justify-between mb-3">
                        <div class="p-2 {card.bgColor} rounded-lg">
                            <Icon class="w-4 h-4 {card.color}" />
                        </div>
                    </div>
                    <div class="text-2xl font-bold {card.color}">{count}</div>
                    <div class="text-sm text-zinc-500 mt-1">{card.label}</div>
                </div>
            {/each}
        </div>
    </section>

    <!-- ================================================================== -->
    <!-- Section 2: Recent Events Table                                     -->
    <!-- ================================================================== -->
    <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <h2
                class="text-xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased"
            >
                Recente Events
            </h2>
            <span class="text-sm text-zinc-500">
                {data.recentEvents.length} events totaal
            </span>
        </div>

        {#if data.recentEvents.length === 0}
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs p-8 text-center text-zinc-500"
            >
                <Mail class="w-8 h-8 mx-auto mb-3 text-zinc-300" />
                <p>Geen tracking events gevonden.</p>
            </div>
        {:else}
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden"
            >
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-zinc-200 bg-zinc-50">
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >Tijd</th
                                >
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >Message ID</th
                                >
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >Event Type</th
                                >
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >URL</th
                                >
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >IP Adres</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            {#each paginatedEvents as event (event.id)}
                                <tr
                                    class="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                                >
                                    <td
                                        class="px-4 py-3 text-zinc-700 whitespace-nowrap"
                                        title={formatDateTime(event.tracked_at)}
                                    >
                                        {formatRelativeTime(event.tracked_at)}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span
                                            class="font-mono text-xs text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded"
                                        >
                                            {event.message_id}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {getEventBadgeClasses(
                                                event.event_type,
                                            )}"
                                        >
                                            {event.event_type}
                                        </span>
                                    </td>
                                    <td
                                        class="px-4 py-3 text-zinc-600 max-w-[250px] truncate"
                                        title={event.url || ""}
                                    >
                                        {#if event.url}
                                            <a
                                                href={event.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                            >
                                                {truncateUrl(event.url)}
                                            </a>
                                        {:else}
                                            <span class="text-zinc-400">—</span>
                                        {/if}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-zinc-600 font-mono text-xs"
                                    >
                                        {event.ip_address || "—"}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                {#if totalPages > 1}
                    <div
                        class="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-zinc-50"
                    >
                        <span class="text-sm text-zinc-500">
                            Pagina {currentPage} van {totalPages}
                        </span>
                        <div class="flex items-center gap-1">
                            <button
                                onclick={() => goToPage(1)}
                                disabled={currentPage === 1}
                                class="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Eerste pagina"
                            >
                                <ChevronLeft class="w-4 h-4" />
                            </button>
                            <button
                                onclick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                class="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Vorige pagina"
                            >
                                <ChevronLeft class="w-4 h-4" />
                            </button>

                            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
                                {#if page === currentPage}
                                    <button
                                        class="px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white"
                                    >
                                        {page}
                                    </button>
                                {:else if Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages}
                                    <button
                                        onclick={() => goToPage(page)}
                                        class="px-3 py-1 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-200 transition-colors"
                                    >
                                        {page}
                                    </button>
                                {:else if Math.abs(page - currentPage) === 3}
                                    <span class="px-1 text-zinc-400">…</span>
                                {/if}
                            {/each}

                            <button
                                onclick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                class="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Volgende pagina"
                            >
                                <ChevronRight class="w-4 h-4" />
                            </button>
                            <button
                                onclick={() => goToPage(totalPages)}
                                disabled={currentPage === totalPages}
                                class="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Laatste pagina"
                            >
                                <ChevronRight class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </section>

    <!-- ================================================================== -->
    <!-- Section 3: Suppressed Addresses                                    -->
    <!-- ================================================================== -->
    <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <h2
                class="text-xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased"
            >
                Geblokkeerde Adressen
            </h2>
            <span class="text-sm text-zinc-500">
                {suppressedAddresses.length} adres{suppressedAddresses.length !==
                1
                    ? "sen"
                    : ""}
            </span>
        </div>

        {#if suppressedAddresses.length === 0}
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs p-8 text-center text-zinc-500"
            >
                <CheckCircle class="w-8 h-8 mx-auto mb-3 text-green-300" />
                <p>Geen geblokkeerde adressen.</p>
                <p class="text-xs text-zinc-400 mt-1">
                    Alle emailadressen kunnen email ontvangen.
                </p>
            </div>
        {:else}
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden"
            >
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-zinc-200 bg-zinc-50">
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >Email</th
                                >
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >Reden</th
                                >
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >Bounce Type</th
                                >
                                <th
                                    class="text-left px-4 py-3 font-medium text-zinc-600"
                                    >Geblokkeerd op</th
                                >
                                <th
                                    class="text-right px-4 py-3 font-medium text-zinc-600"
                                    >Acties</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            {#each suppressedAddresses as address (address.id)}
                                <tr
                                    class="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                                >
                                    <td class="px-4 py-3">
                                        <span
                                            class="font-mono text-xs text-zinc-700"
                                        >
                                            {address.email}
                                        </span>
                                    </td>
                                    <td
                                        class="px-4 py-3 text-zinc-600 max-w-[300px] truncate"
                                        title={address.reason}
                                    >
                                        {address.reason || "—"}
                                    </td>
                                    <td class="px-4 py-3">
                                        {#if address.bounce_type === "hard"}
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                                            >
                                                Hard
                                            </span>
                                        {:else if address.bounce_type === "soft"}
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                            >
                                                Soft
                                            </span>
                                        {:else}
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200"
                                            >
                                                Onbekend
                                            </span>
                                        {/if}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-zinc-600 whitespace-nowrap"
                                    >
                                        {formatDateTime(address.suppressed_at)}
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <button
                                            onclick={() =>
                                                requestRemove(address.email)}
                                            disabled={isRemoving &&
                                                confirmDialogEmail ===
                                                    address.email}
                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            title="Verwijder suppressie"
                                        >
                                            {#if isRemoving && confirmDialogEmail === address.email}
                                                <Spinner size="xs" />
                                            {:else}
                                                <Trash2 class="w-3.5 h-3.5" />
                                            {/if}
                                            Verwijder
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}
    </section>
</div>

<!-- ====================================================================== -->
<!-- Confirmation Dialog                                                     -->
<!-- ====================================================================== -->
{#if confirmDialogEmail}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
        onclick={cancelRemove}
        onkeydown={(e) => e.key === "Escape" && cancelRemove()}
    >
        <!-- Dialog -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-50"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-orange-100 rounded-lg">
                        <AlertTriangle class="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 class="text-lg font-semibold text-zinc-900">
                        Suppressie verwijderen
                    </h3>
                </div>
                <button
                    onclick={cancelRemove}
                    class="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <p class="text-zinc-600 mb-2">
                Weet je zeker dat je de blokkade voor dit emailadres wilt
                verwijderen?
            </p>
            <p
                class="font-mono text-sm bg-zinc-100 px-3 py-2 rounded-md text-zinc-800 mb-4 break-all"
            >
                {confirmDialogEmail}
            </p>
            <p class="text-sm text-zinc-500 mb-6">
                Na verwijdering kunnen er weer emails naar dit adres worden
                verzonden. Als het adres opnieuw bouncet, wordt het automatisch
                weer geblokkeerd.
            </p>

            {#if actionError}
                <div
                    class="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg mb-4 text-sm"
                >
                    {actionError}
                </div>
            {/if}

            <div class="flex justify-end gap-3">
                <button
                    onclick={cancelRemove}
                    disabled={isRemoving}
                    class="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                >
                    Annuleren
                </button>
                <button
                    onclick={confirmRemove}
                    disabled={isRemoving}
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                    {#if isRemoving}
                        <Spinner size="xs" />
                    {/if}
                    Verwijder blokkade
                </button>
            </div>
        </div>
    </div>
{/if}
