<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { breadcrumbStore } from "$lib/stores/breadcrumbStore";
    import type { Role, Permission, User } from "$lib/schemas/auth";
    import {
        ArrowLeft,
        Shield,
        Users,
        Key,
        Pencil,
        Trash2,
        Link as LinkIcon,
    } from "lucide-svelte";
    import Button from "$lib/components/Button.svelte";
    import Label from "$lib/components/Label.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import { navigationStore } from "$lib/stores/navigationStore";
    import { toastStore } from "$lib/stores/toastStore";

    let role = $state<(Role & { permissions: Permission[] }) | null>(null);
    let users = $state<User[]>([]);
    let loading = $state(true);
    let usersLoading = $state(false);
    let error = $state<string | null>(null);

    // Modal state
    let showDeleteModal = $state(false);
    let deleting = $state(false);

    const roleId = $derived($page.params.id);
    const currentPath = $derived($page.url.pathname);

    onMount(async () => {
        await Promise.all([loadRole(), loadRoleUsers()]);
    });

    onDestroy(() => {
        // Clear breadcrumb entity name when leaving the page
        breadcrumbStore.clearEntityName(currentPath);
    });

    async function loadRole() {
        if (!roleId) return;

        loading = true;
        navigationStore.startPageLoading();
        error = null;

        try {
            // Get authentication token
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geauthenticeerd";
                loading = false;
                return;
            }

            const response = await fetch(`/api/auth/roles/${roleId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();

            if (result.success) {
                role = result.data;
                // Set entity name in breadcrumb store
                if (role) {
                    breadcrumbStore.setEntityName(currentPath, role.name);
                }
            } else {
                error =
                    result.error || "Er ging iets mis bij het laden van de rol";
            }
        } catch (err) {
            error = "Er ging iets mis bij het laden van de rol";
            console.error("Load role error:", err);
        }

        loading = false;
        navigationStore.stopPageLoading();
    }

    async function loadRoleUsers() {
        if (!roleId) return;

        usersLoading = true;

        try {
            const token = $authStore?.token;
            if (!token) return;

            // For now, we'll fetch all users and filter by role
            // TODO: Create a dedicated endpoint for this
            const response = await fetch("/api/users", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                // Filter users who have this role
                users = result.data.filter((user: any) =>
                    user.roles?.some((r: Role) => r.id === Number(roleId)),
                );
            }
        } catch (err) {
            console.error("Load role users error:", err);
        }

        usersLoading = false;
    }

    function formatDate(dateString?: string | null): string {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("nl-NL", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatActions(actions: any): string {
        if (Array.isArray(actions)) {
            return actions.join(", ");
        }
        if (typeof actions === "string") {
            try {
                const parsed = JSON.parse(actions);
                if (Array.isArray(parsed)) {
                    return parsed.join(", ");
                }
            } catch {
                // If not valid JSON, treat as comma-separated string
                return actions;
            }
        }
        return "";
    }

    function goToPermissionsDrawer() {
        goto(`/admin/rollen?drawer=permissions&roleId=${roleId}`);
    }

    function goToEditPage() {
        // For now, go back to roles list and open edit modal
        goto(`/admin/rollen`);
        toastStore.add("Gebruik de bewerkknop op de rol kaart", "info");
    }

    function openDeleteModal() {
        if (role?.is_system) {
            toastStore.add(
                "Systeem rollen kunnen niet worden verwijderd",
                "error",
            );
            return;
        }
        showDeleteModal = true;
    }

    function closeDeleteModal() {
        showDeleteModal = false;
    }

    async function handleDeleteRole() {
        if (!role) return;

        deleting = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                deleting = false;
                return;
            }

            const response = await fetch(`/api/auth/roles/${role.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (result.success) {
                toastStore.add("Rol succesvol verwijderd", "success");
                closeDeleteModal();
                // Redirect to roles list
                await goto("/admin/rollen");
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het verwijderen van de rol";
                toastStore.add(error!, "error");
            }
        } catch (err) {
            error = "Er ging iets mis bij het verwijderen van de rol";
            toastStore.add(error!, "error");
            console.error("Delete role error:", err);
        } finally {
            deleting = false;
        }
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <!-- Back button -->
    <button
        onclick={() => goto("/admin/rollen")}
        class="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-6 transition"
    >
        <ArrowLeft class="w-4 h-4" />
        Terug naar rollen
    </button>

    <!-- Loading state -->
    {#if loading}
        <div class="fixed inset-0 flex items-center justify-center">
            <Spinner size="xl" />
        </div>
    {:else if error}
        <!-- Error message -->
        <div
            class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6"
        >
            {error}
        </div>
    {:else if role}
        <!-- Role header -->
        <div
            class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6 mb-6"
        >
            <div class="flex items-start justify-between">
                <div class="flex items-start gap-4">
                    <div class="p-3 bg-zinc-100 rounded-lg">
                        <Shield class="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                        <h1
                            class="text-2xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-1"
                        >
                            {role.name}
                        </h1>
                        {#if role.description}
                            <p class="text-zinc-600 mb-2">{role.description}</p>
                        {/if}
                        <div class="flex items-center gap-2">
                            {#if role.is_system}
                                <Label variant="default">Systeem rol</Label>
                            {/if}
                            {#if role.is_default}
                                <Label variant="success">Standaard rol</Label>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <Button variant="secondary" onclick={goToPermissionsDrawer}>
                        <Key class="w-4 h-4" />
                        Beheer permissies
                    </Button>

                    {#if !role.is_system}
                        <Button variant="ghost" onclick={goToEditPage}>
                            <Pencil class="w-4 h-4" />
                            Bewerken
                        </Button>

                        <button
                            type="button"
                            onclick={openDeleteModal}
                            disabled={users.length > 0}
                            class="p-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                            title={users.length > 0
                                ? `Kan niet verwijderen: ${users.length} gebruiker${users.length !== 1 ? "s" : ""} gekoppeld`
                                : "Rol verwijderen"}
                        >
                            <Trash2 class="w-4 h-4" />
                        </button>
                    {/if}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Role details -->
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6"
            >
                <h2
                    class="text-lg font-aspekta font-semibold text-zinc-900 mb-4"
                >
                    Rol gegevens
                </h2>
                <dl class="space-y-3">
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">Naam</dt>
                        <dd class="mt-1 text-sm text-zinc-900">{role.name}</dd>
                    </div>
                    {#if role.description}
                        <div>
                            <dt class="text-sm font-medium text-zinc-500">
                                Beschrijving
                            </dt>
                            <dd class="mt-1 text-sm text-zinc-900">
                                {role.description}
                            </dd>
                        </div>
                    {/if}
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">
                            Aantal permissies
                        </dt>
                        <dd class="mt-1 text-sm text-zinc-900">
                            {role.permissions?.length || 0}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">
                            Aantal gebruikers
                        </dt>
                        <dd class="mt-1 text-sm text-zinc-900">
                            {users.length}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">
                            Aangemaakt
                        </dt>
                        <dd class="mt-1 text-sm text-zinc-900">
                            {formatDate(role.created_at)}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">
                            Laatste wijziging
                        </dt>
                        <dd class="mt-1 text-sm text-zinc-900">
                            {formatDate(role.updated_at)}
                        </dd>
                    </div>
                </dl>
            </div>

            <!-- Users with this role -->
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2
                        class="text-lg font-aspekta font-semibold text-zinc-900 flex items-center gap-2"
                    >
                        <Users class="w-5 h-5" />
                        Gebruikers ({users.length})
                    </h2>
                </div>

                {#if usersLoading}
                    <div class="flex items-center justify-center py-8">
                        <Spinner size="md" />
                    </div>
                {:else if users.length > 0}
                    <div class="space-y-2 max-h-[400px] overflow-y-auto">
                        {#each users as user}
                            <div
                                class="flex items-center justify-between p-3 bg-zinc-50 rounded-sm border border-zinc-200"
                            >
                                <div class="flex items-center gap-3">
                                    {#if user.avatar}
                                        <img
                                            src={user.avatar}
                                            alt={user.name ||
                                                user.username ||
                                                "Avatar"}
                                            class="w-8 h-8 rounded-full object-cover border border-zinc-200"
                                        />
                                    {:else}
                                        <div
                                            class="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-700"
                                        >
                                            {user.name ||
                                            user.username ||
                                            user.email
                                                ? (
                                                      user.name ||
                                                      user.username ||
                                                      user.email
                                                  )
                                                      .split(" ")
                                                      .map((n) => n[0])
                                                      .join("")
                                                      .substring(0, 2)
                                                      .toUpperCase()
                                                : "U"}
                                        </div>
                                    {/if}
                                    <div>
                                        <div
                                            class="font-medium text-zinc-900 text-sm"
                                        >
                                            {user.name ||
                                                user.username ||
                                                user.email}
                                        </div>
                                        <div class="text-xs text-zinc-600">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <Tooltip
                                    text="Ga naar gebruiker"
                                    position="left"
                                >
                                    <button
                                        type="button"
                                        onclick={() =>
                                            goto(
                                                `/admin/gebruikers/${user.id}`,
                                            )}
                                        class="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors"
                                        aria-label="Ga naar gebruiker {user.name ||
                                            user.username ||
                                            user.email}"
                                    >
                                        <LinkIcon class="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-zinc-600 text-sm">
                        Geen gebruikers met deze rol
                    </p>
                {/if}
            </div>
        </div>

        <!-- Permissions section -->
        {#if role.permissions && role.permissions.length > 0}
            <div
                class="mt-6 bg-white rounded-lg border border-zinc-200 shadow-xs p-6"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2
                        class="text-lg font-aspekta font-semibold text-zinc-900 flex items-center gap-2"
                    >
                        <Key class="w-5 h-5" />
                        Permissies ({role.permissions.length})
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={goToPermissionsDrawer}
                    >
                        Beheren
                    </Button>
                </div>

                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto"
                >
                    {#each role.permissions as permission}
                        <div
                            class="p-2 bg-zinc-50 rounded-sm border border-zinc-200"
                        >
                            <div class="text-xs font-medium text-zinc-900">
                                {permission.route}
                            </div>
                            {#if permission.actions}
                                <div class="text-xs text-zinc-600 mt-1">
                                    {formatActions(permission.actions)}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {:else}
        <div
            class="text-center py-12 bg-white rounded-lg border border-zinc-200"
        >
            <p class="text-zinc-500">Rol niet gevonden</p>
        </div>
    {/if}
</div>

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={showDeleteModal}
    title="Rol permanent verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        {#if users.length > 0}
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p class="text-orange-900 font-medium mb-2">
                    ⚠️ Kan niet verwijderen
                </p>
                <p class="text-orange-800 text-sm">
                    Deze rol heeft <strong>{users.length}</strong>
                    gebruiker{users.length !== 1 ? "s" : ""} gekoppeld. Verwijder
                    eerst alle gebruikers van deze rol voordat je de rol kunt verwijderen.
                </p>
            </div>
        {:else}
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-900 font-medium mb-2">
                    ⚠️ Let op: Deze actie is permanent
                </p>
                <p class="text-red-800 text-sm">
                    Deze rol wordt permanent verwijderd inclusief alle
                    permissies.
                </p>
            </div>
        {/if}

        {#if role}
            <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <p class="text-sm text-zinc-600 mb-1">Te verwijderen rol:</p>
                <p class="font-medium text-zinc-900">{role.name}</p>
                {#if role.description}
                    <p class="text-sm text-zinc-600">{role.description}</p>
                {/if}
                {#if users.length > 0}
                    <p class="text-sm text-zinc-600 mt-2">
                        <strong>{users.length}</strong>
                        gebruiker{users.length !== 1 ? "s" : ""}
                        {users.length !== 1 ? "hebben" : "heeft"} deze rol
                    </p>
                {/if}
            </div>
        {/if}

        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={closeDeleteModal}
                disabled={deleting}
            >
                Annuleren
            </Button>
            <button
                type="button"
                onclick={handleDeleteRole}
                disabled={deleting || users.length > 0}
                class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {#if deleting}
                    <Spinner size="xs" />
                    Verwijderen...
                {:else}
                    <Trash2 class="w-4 h-4" />
                    Permanent verwijderen
                {/if}
            </button>
        </div>
    </div>
</Modal>
