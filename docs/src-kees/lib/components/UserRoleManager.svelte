<script lang="ts">
    import { Plus, X, Shield } from "lucide-svelte";
    import Button from "./Button.svelte";
    import type { UserWithRoles } from "$lib/services/userManagementService";
    import type { Role } from "$lib/schemas/auth";

    interface Props {
        /** User data */
        user: UserWithRoles;

        availableRoles: Role[];

        /** Assign role handler */
        onassign: (roleId: number) => void | Promise<void>;

        /** Remove role handler */
        onremove: (roleId: number) => void | Promise<void>;

        /** Loading state */
        loading?: boolean;

        /** Additional CSS classes */
        class?: string;
    }

    let {
        user,
        availableRoles,
        onassign,
        onremove,
        loading = false,
        class: className = "",
    }: Props = $props();

    let showAddDropdown = $state(false);
    let selectedRoleId = $state<number | null>(null);
    let roleToRemove = $state<Role | null>(null);
    let showConfirmDialog = $state(false);

    // Get unassigned roles
    const unassignedRoles = $derived.by(() => {
        const assignedRoleIds = user.roles.map((r) => r.id);
        return availableRoles.filter((r) => !assignedRoleIds.includes(r.id));
    });

    // Get permissions for a role (placeholder, ideally from role object)
    function getRolePermissions(role: Role): string {
        return role.description || "Geen beschrijving";
    }

    function handleAssign() {
        if (selectedRoleId !== null) {
            onassign(selectedRoleId);
            selectedRoleId = null;
            showAddDropdown = false;
        }
    }

    function confirmRemoveRole(role: Role) {
        roleToRemove = role;
        showConfirmDialog = true;
    }

    function cancelRemoveRole() {
        roleToRemove = null;
        showConfirmDialog = false;
    }

    function handleRemoveRole() {
        if (roleToRemove) {
            onremove(roleToRemove.id);
            showConfirmDialog = false;
            roleToRemove = null;
        }
    }
</script>

<div class="user-role-manager {className}">
    <div class="flex items-center justify-between mb-4">
        <h3
            class="text-lg font-aspekta font-semibold text-zinc-900 flex items-center gap-2"
        >
            <Shield class="w-5 h-5" />
            Rollen
        </h3>
        {#if unassignedRoles.length > 0}
            <Button
                size="sm"
                onclick={() => (showAddDropdown = !showAddDropdown)}
                disabled={loading}
            >
                <Plus class="w-4 h-4" />
                Rol toevoegen
            </Button>
        {/if}
    </div>

    <!-- Add role dropdown -->
    {#if showAddDropdown}
        <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-4">
            <label
                for="role-select"
                class="block text-sm font-medium text-zinc-700 mb-2"
            >
                Selecteer een rol
            </label>
            <div class="flex gap-2">
                <select
                    id="role-select"
                    bind:value={selectedRoleId}
                    class="flex-1 px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading}
                >
                    <option value={null}>-- Kies een rol --</option>
                    {#each unassignedRoles as role}
                        <option value={role.id}>{role.name}</option>
                    {/each}
                </select>
                <Button
                    onclick={handleAssign}
                    disabled={loading || selectedRoleId === null}
                    size="sm"
                >
                    Toevoegen
                </Button>
                <Button
                    variant="ghost"
                    onclick={() => {
                        showAddDropdown = false;
                        selectedRoleId = null;
                    }}
                    disabled={loading}
                    size="sm"
                >
                    Annuleren
                </Button>
            </div>
        </div>
    {/if}

    <!-- Assigned roles list -->
    {#if user.roles.length > 0}
        <div class="space-y-2">
            {#each user.roles as role}
                <div
                    class="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
                        >
                            <Shield class="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <div
                                class="font-medium text-zinc-900 flex items-center gap-2"
                            >
                                {role.name}
                                {#if role.is_system}
                                    <span
                                        class="text-xs px-2 py-0.5 rounded bg-zinc-200 text-zinc-700"
                                    >
                                        Systeem
                                    </span>
                                {/if}
                            </div>
                            {#if role.description}
                                <p class="text-sm text-zinc-600">
                                    {getRolePermissions(role as Role)}
                                </p>
                            {/if}
                        </div>
                    </div>
                    {#if !role.is_system}
                        <button
                            type="button"
                            onclick={() => confirmRemoveRole(role as Role)}
                            disabled={loading}
                            class="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Rol verwijderen"
                            aria-label="Rol verwijderen"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    {:else}
                        <span class="text-xs text-zinc-400 italic px-2"
                            >Systeem</span
                        >
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <div class="text-center py-8 text-zinc-500">
            <Shield class="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p class="text-sm">Geen rollen toegewezen</p>
            <p class="text-xs">
                Voeg een rol toe om rechten te geven aan deze gebruiker
            </p>
        </div>
    {/if}

    <!-- Confirmation Dialog -->
    {#if showConfirmDialog && roleToRemove}
        <div
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold text-zinc-900 mb-2">
                    Rol verwijderen
                </h3>
                <p class="text-zinc-600 mb-6">
                    Weet je zeker dat je de rol <span
                        class="font-medium text-zinc-900"
                        >{roleToRemove.name}</span
                    > wilt verwijderen van deze gebruiker? De gebruiker verliest direct
                    toegang tot functionaliteiten die deze rol vereisen.
                </p>
                <div class="flex justify-end gap-3">
                    <button
                        onclick={cancelRemoveRole}
                        class="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Annuleren
                    </button>
                    <button
                        onclick={handleRemoveRole}
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Verwijderen
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
