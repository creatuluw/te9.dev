<script lang="ts">
    import {
        Mail,
        Calendar,
        Shield,
        CheckCircle,
        XCircle,
    } from "lucide-svelte";
    import Label from "./Label.svelte";
    import type { UserWithRoles } from "$lib/services/userManagementService";

    interface Props {
        /** User data */
        user: UserWithRoles;

        /** Click handler */
        onclick?: (user: UserWithRoles) => void;

        /** Additional CSS classes */
        class?: string;
    }

    let { user, onclick, class: className = "" }: Props = $props();

    // Format date
    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    // Get initials
    function getInitials(): string {
        // Database has 'name' field, but type expects first_name/last_name
        if ((user as any).name) {
            const nameParts = (user as any).name.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
            }
            return nameParts[0]?.charAt(0)?.toUpperCase() || "?";
        }
        if (user.first_name || user.last_name) {
            const first = user.first_name?.charAt(0) || "";
            const last = user.last_name?.charAt(0) || "";
            return `${first}${last}`.toUpperCase() || "?";
        }
        return "?";
    }

    // Get display name
    function getDisplayName(): string {
        if ((user as any).name) {
            return (user as any).name;
        }
        if (user.first_name || user.last_name) {
            return (
                `${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"
            );
        }
        return (user as any).username || user.email || "-";
    }

    // Check if onclick handler exists
    const hasOnclick = $derived(onclick !== undefined);
</script>

<div
    class="user-card bg-zinc-50 rounded-lg border border-zinc-200 p-6 transition-all hover:shadow-sm {className}"
    class:cursor-pointer={hasOnclick}
    onclick={() => onclick?.(user)}
    role={hasOnclick ? "button" : undefined}
    {...hasOnclick ? { tabindex: 0 } : {}}
    onkeydown={(e) => {
        if (hasOnclick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onclick?.(user);
        }
    }}
>
    <div class="flex items-start gap-4">
        <!-- Avatar -->
        <div class="flex-shrink-0">
            <div
                class="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center"
            >
                <span class="text-lg font-semibold text-zinc-700 font-aspekta">
                    {getInitials()}
                </span>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
            <!-- Header -->
            <div class="flex items-start justify-between mb-2">
                <div>
                    <h3
                        class="text-lg font-aspekta font-semibold text-zinc-900 truncate"
                    >
                        {getDisplayName()}
                    </h3>
                </div>
                <div class="flex items-center gap-2">
                    {#if user.is_active}
                        <Label variant="success">
                            <CheckCircle class="w-3 h-3" />
                            Actief
                        </Label>
                    {:else}
                        <Label variant="default">
                            <XCircle class="w-3 h-3" />
                            Inactief
                        </Label>
                    {/if}
                </div>
            </div>

            <!-- Email -->
            <div class="flex items-center gap-2 text-sm text-zinc-600 mb-3">
                <Mail class="w-4 h-4" />
                <span class="truncate">{user.email}</span>
            </div>

            <!-- Roles -->
            {#if user.roles && user.roles.length > 0}
                <div class="flex items-center gap-2 mb-3">
                    <Shield class="w-4 h-4 text-zinc-500" />
                    <div class="flex flex-wrap gap-1">
                        {#each user.roles as role}
                            <span
                                class="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800"
                            >
                                {role.name}
                            </span>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="flex items-center gap-2 text-sm text-zinc-500 mb-3">
                    <Shield class="w-4 h-4" />
                    <span class="italic">Geen rollen toegewezen</span>
                </div>
            {/if}

            <!-- Created date -->
            <div class="flex items-center gap-2 text-xs text-zinc-500">
                <Calendar class="w-3 h-3" />
                <span>Aangemaakt {formatDate(user.created_at)}</span>
            </div>
        </div>
    </div>
</div>

<style>
    .user-card:focus-visible {
        outline: 2px solid rgb(59 130 246);
        outline-offset: 2px;
    }
</style>
