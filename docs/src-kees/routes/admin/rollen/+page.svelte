<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { authStore } from "$lib/stores/authStore";
    import type { Role, Permission } from "$lib/schemas/auth";
    import { Plus, Pencil, Trash2, Shield, Key, Users } from "lucide-svelte";
    import Button from "$lib/components/Button.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Label from "$lib/components/Label.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import Drawer from "$lib/components/Drawer.svelte";
    import PermissionTree from "$lib/components/PermissionTree.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import { navigationStore } from "$lib/stores/navigationStore";

    let roles = $state<Role[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Modal state
    let showCreateModal = $state(false);
    let showEditModal = $state(false);
    let showDeleteModal = $state(false);
    let showDefaultRoleConfirmModal = $state(false);
    let selectedRole = $state<Role | null>(null);
    let pendingDefaultRoleId = $state<number | null>(null);

    // URL Drawer state
    const drawerParam = $derived($page.url.searchParams.get("drawer"));
    const roleIdParam = $derived($page.url.searchParams.get("roleId"));
    const isPermissionsDrawerOpen = $derived(drawerParam === "permissions");

    // Form state
    let formName = $state("");
    let formDescription = $state("");
    let formLoading = $state(false);

    // Permissions state
    let allPermissions = $state<Permission[]>([]);
    let rolePermissions = $state<number[]>([]);
    let permissionsLoading = $state(false);
    let userCounts = $state<Record<number, number>>({});
    let defaultRoleId = $state<number | null>(null);
    let settingDefault = $state(false);

    // Tab state for permissions drawer
    let activePermissionTab = $state<"huidig" | "wijzig">("huidig");

    // Permission removal state
    let showRemovePermissionModal = $state(false);
    let permissionToRemove = $state<number | null>(null);
    let removingPermission = $state(false);

    // Check if user is admin
    const authData = $derived($authStore);
    const isAdmin = $derived.by(() => {
        if (!authData?.roles) return false;
        return authData.roles.some(
            (role) => role.name.toLowerCase() === "admin",
        );
    });

    onMount(async () => {
        // Redirect if not admin
        if (!isAdmin) {
            goto("/");
            return;
        }

        await Promise.all([loadRoles(), loadPermissions(), loadUserCounts()]);
    });

    // Sync selectedRole with URL params
    $effect(() => {
        if (isPermissionsDrawerOpen && roleIdParam && roles.length > 0) {
            const roleId = parseInt(roleIdParam);
            const role = roles.find((r) => r.id === roleId);
            if (role && (!selectedRole || selectedRole.id !== roleId)) {
                selectedRole = role;
                loadRolePermissions(role);
            }
        } else if (
            !isPermissionsDrawerOpen &&
            selectedRole &&
            !showEditModal &&
            !showDeleteModal
        ) {
            // Only clear selectedRole if we're not using it for other modals
            // But wait, other modals set selectedRole explicitly.
            // Let's be careful not to clear it if another modal is open using it.
            // Actually, the other modals don't use URL params, so they manage selectedRole manually.
            // If we close the drawer, we should probably clear selectedRole if it was set by the drawer.
            // However, since selectedRole is shared, we need to be careful.
            // For now, let's just rely on the open functions to set it.
            // But if we navigate back, we want to ensure the drawer opens.
        }
    });

    async function loadRoles() {
        loading = true;
        navigationStore.startPageLoading();
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch("/api/auth/roles", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                roles = result.data;
                // Update default role ID after loading roles
                const defaultRole = roles.find((r) => r.is_default);
                if (defaultRole) {
                    defaultRoleId = defaultRole.id;
                } else {
                    defaultRoleId = null;
                }
            } else {
                error =
                    result.error || "Er ging iets mis bij het laden van rollen";
            }
        } catch (err) {
            error = "Er ging iets mis bij het laden van rollen";
            console.error("Load roles error:", err);
        }

        loading = false;
        navigationStore.stopPageLoading();
    }

    function openCreateModal() {
        formName = "";
        formDescription = "";
        showCreateModal = true;
    }

    function openEditModal(role: Role) {
        if (role.is_system) {
            error = "Systeem rollen kunnen niet worden bewerkt";
            return;
        }
        selectedRole = role;
        formName = role.name;
        formDescription = role.description || "";
        showEditModal = true;
    }

    function openDeleteModal(role: Role) {
        if (role.is_system) {
            error = "Systeem rollen kunnen niet worden verwijderd";
            return;
        }
        selectedRole = role;
        showDeleteModal = true;
    }

    async function createRole() {
        if (!formName.trim()) {
            error = "Naam is verplicht";
            return;
        }

        formLoading = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const payload: Record<string, string> = {
                name: formName.trim(),
            };

            // Only include description if it's not empty
            const trimmedDescription = formDescription.trim();
            if (trimmedDescription) {
                payload.description = trimmedDescription;
            }

            const response = await fetch("/api/auth/roles", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                await loadRoles();
                showCreateModal = false;
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het aanmaken van de rol";
            }
        } catch (err) {
            error = "Er ging iets mis bij het aanmaken van de rol";
            console.error("Create role error:", err);
        }

        formLoading = false;
    }

    async function updateRole() {
        if (!selectedRole) return;
        if (!formName.trim()) {
            error = "Naam is verplicht";
            return;
        }

        formLoading = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const payload: Record<string, string> = {
                name: formName.trim(),
            };

            // Only include description if it's not empty
            const trimmedDescription = formDescription.trim();
            if (trimmedDescription) {
                payload.description = trimmedDescription;
            }

            const response = await fetch(`/api/auth/roles/${selectedRole.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                await loadRoles();
                showEditModal = false;
                selectedRole = null;
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het bijwerken van de rol";
            }
        } catch (err) {
            error = "Er ging iets mis bij het bijwerken van de rol";
            console.error("Update role error:", err);
        }

        formLoading = false;
    }

    async function deleteRole() {
        if (!selectedRole) return;

        formLoading = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(`/api/auth/roles/${selectedRole.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (result.success) {
                await loadRoles();
                showDeleteModal = false;
                selectedRole = null;
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het verwijderen van de rol";
            }
        } catch (err) {
            error = "Er ging iets mis bij het verwijderen van de rol";
            console.error("Delete role error:", err);
        }

        formLoading = false;
    }

    async function loadPermissions() {
        try {
            const token = $authStore?.token;
            if (!token) return;

            const response = await fetch("/api/auth/permissions", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                allPermissions = result.data;
            }
        } catch (err) {
            console.error("Load permissions error:", err);
        }
    }

    async function loadUserCounts() {
        try {
            const token = $authStore?.token;
            if (!token) return;

            const response = await fetch("/api/auth/roles/user-counts", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                userCounts = result.data;
            }
        } catch (err) {
            console.error("Load user counts error:", err);
        }
    }

    function openDefaultRoleConfirmModal(roleId: number) {
        // Don't show confirmation if clicking the already selected role
        if (roleId === defaultRoleId) return;

        pendingDefaultRoleId = roleId;
        showDefaultRoleConfirmModal = true;
    }

    function cancelDefaultRoleChange() {
        showDefaultRoleConfirmModal = false;
        pendingDefaultRoleId = null;
    }

    async function confirmDefaultRoleChange() {
        if (!pendingDefaultRoleId || settingDefault) return;

        settingDefault = true;
        error = null;
        showDefaultRoleConfirmModal = false;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                settingDefault = false;
                return;
            }

            const response = await fetch("/api/auth/roles/set-default", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roleId: pendingDefaultRoleId }),
            });

            const result = await response.json();

            if (result.success) {
                defaultRoleId = pendingDefaultRoleId;
                // Reload roles to get updated is_default flags
                await loadRoles();
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het instellen van de standaard rol";
            }
        } catch (err) {
            error = "Er ging iets mis bij het instellen van de standaard rol";
            console.error("Set default role error:", err);
        }

        pendingDefaultRoleId = null;
        settingDefault = false;
    }

    function openPermissionsDrawer(role: Role) {
        const url = new URL($page.url);
        url.searchParams.set("drawer", "permissions");
        url.searchParams.set("roleId", role.id.toString());
        goto(url.pathname + url.search, { noScroll: true });
    }

    function closePermissionsDrawer() {
        const url = new URL($page.url);
        url.searchParams.delete("drawer");
        url.searchParams.delete("roleId");
        goto(url.pathname + url.search, { noScroll: true });
        selectedRole = null;
    }

    async function loadRolePermissions(role: Role) {
        permissionsLoading = true;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(
                `/api/auth/roles/${role.id}/permissions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const result = await response.json();

            if (result.success) {
                rolePermissions = result.data.map((p: Permission) => p.id);
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het laden van permissies";
            }
        } catch (err) {
            error = "Er ging iets mis bij het laden van permissies";
            console.error("Load role permissions error:", err);
        }

        permissionsLoading = false;
    }

    async function saveRolePermissions() {
        if (!selectedRole) return;

        formLoading = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(
                `/api/auth/roles/${selectedRole.id}/permissions`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ permission_ids: rolePermissions }),
                },
            );

            const result = await response.json();

            if (result.success) {
                closePermissionsDrawer();
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het opslaan van permissies";
            }
        } catch (err) {
            error = "Er ging iets mis bij het opslaan van permissies";
            console.error("Save role permissions error:", err);
        }

        formLoading = false;
    }

    function handlePermissionChange(selectedIds: number[]) {
        rolePermissions = selectedIds;
    }

    function openRemovePermissionModal(permissionId: number) {
        permissionToRemove = permissionId;
        showRemovePermissionModal = true;
    }

    function cancelRemovePermission() {
        showRemovePermissionModal = false;
        permissionToRemove = null;
    }

    async function confirmRemovePermission() {
        if (!selectedRole || permissionToRemove === null) return;

        removingPermission = true;
        showRemovePermissionModal = false;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            // Remove permission from rolePermissions array
            const updatedPermissions = rolePermissions.filter(
                (id) => id !== permissionToRemove,
            );
            rolePermissions = updatedPermissions;

            // Save updated permissions to server
            const response = await fetch(
                `/api/auth/roles/${selectedRole.id}/permissions`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        permission_ids: updatedPermissions,
                    }),
                },
            );

            const result = await response.json();

            if (result.success) {
                // Reload role permissions to ensure consistency
                await loadRolePermissions(selectedRole);
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het verwijderen van de permissie";
            }
        } catch (err) {
            error = "Er ging iets mis bij het verwijderen van de permissie";
            console.error("Remove permission error:", err);
        }

        removingPermission = false;
        permissionToRemove = null;
    }

    // Get full permission objects for current role
    const currentRolePermissions = $derived.by(() => {
        return allPermissions.filter((p) => rolePermissions.includes(p.id));
    });
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1
                class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2"
            >
                Rollen
            </h1>
            <p class="text-zinc-600">Beheer gebruikersrollen en hun rechten</p>
        </div>
        <Button onclick={openCreateModal}>
            <Plus class="w-4 h-4" />
            Nieuwe rol
        </Button>
    </div>

    <!-- Error message -->
    {#if error}
        <div
            class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6"
        >
            {error}
        </div>
    {/if}

    <!-- Loading state -->
    {#if loading}
        <div class="fixed inset-0 flex items-center justify-center">
            <Spinner size="xl" />
        </div>
    {:else}
        <!-- Roles grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {#each roles as role}
                <div
                    class="bg-white rounded-lg shadow-xs border border-zinc-200 p-4 hover:shadow-sm hover:border-zinc-300 transition-all group relative"
                >
                    <!-- Header: Role name, icon, and actions in one row -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-2 flex-1 min-w-0">
                            <div
                                class="p-1.5 bg-zinc-100 rounded-md group-hover:bg-zinc-200 transition-colors flex-shrink-0"
                            >
                                <Shield class="w-4 h-4 text-zinc-600" />
                            </div>
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                <h3
                                    class="text-base font-aspekta font-semibold text-zinc-900 truncate"
                                >
                                    {role.name}
                                </h3>
                                {#if role.is_system}
                                    <Label
                                        variant="default"
                                        class="flex-shrink-0 text-xs"
                                        >Systeem</Label
                                    >
                                {/if}
                            </div>
                        </div>
                        <!-- Action buttons - compact -->
                        <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                            <IconButton
                                icon={Key}
                                variant="ghost"
                                size="sm"
                                onclick={() => openPermissionsDrawer(role)}
                                tooltip="Beheer permissies"
                                tooltipPosition="top"
                            />
                            {#if !role.is_system}
                                <IconButton
                                    icon={Pencil}
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => openEditModal(role)}
                                    tooltip="Bewerken"
                                    tooltipPosition="top"
                                />
                                <IconButton
                                    icon={Trash2}
                                    variant="danger"
                                    size="sm"
                                    onclick={() => openDeleteModal(role)}
                                    tooltip={(userCounts[role.id] ?? 0) > 0
                                        ? `Kan niet verwijderen: ${userCounts[role.id]} gebruiker${userCounts[role.id] !== 1 ? "s" : ""} gekoppeld`
                                        : "Verwijderen"}
                                    tooltipPosition="top"
                                    disabled={(userCounts[role.id] ?? 0) > 0}
                                />
                            {/if}
                        </div>
                    </div>

                    <!-- Stats and description in one row -->
                    <div class="flex items-start gap-4 mb-3">
                        <!-- User count - compact -->
                        <div class="flex items-baseline gap-1.5 flex-shrink-0">
                            <Users class="w-3.5 h-3.5 text-zinc-400" />
                            <span class="text-lg font-bold text-zinc-900"
                                >{userCounts[role.id] ?? 0}</span
                            >
                            <span class="text-xs text-zinc-500">gebruikers</span
                            >
                        </div>

                        <!-- Description - compact, truncated -->
                        {#if role.description}
                            <p
                                class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors flex-1 min-w-0 overflow-hidden"
                                style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; max-height: 2.8em;"
                            >
                                {role.description}
                            </p>
                        {:else}
                            <p
                                class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors flex-1 min-w-0 overflow-hidden"
                                style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; max-height: 2.8em;"
                            >
                                Rol voor gebruikersbeheer
                            </p>
                        {/if}
                    </div>

                    <!-- Default role radio button - compact -->
                    <div
                        class="pt-2 border-t border-zinc-100 rounded-md px-2.5 py-1.5 transition-colors {defaultRoleId ===
                        role.id
                            ? 'bg-green-50'
                            : ''}"
                    >
                        <div class="flex items-center gap-2">
                            <input
                                type="radio"
                                name="default-role"
                                checked={defaultRoleId === role.id}
                                onclick={(e) => {
                                    e.preventDefault();
                                    openDefaultRoleConfirmModal(role.id);
                                }}
                                disabled={settingDefault}
                                class="w-3.5 h-3.5 text-blue-600 border-zinc-300 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                            <span class="text-xs text-zinc-700 select-none">
                                {defaultRoleId === role.id
                                    ? "Standaard rol"
                                    : "Instellen als standaard rol"}
                            </span>
                        </div>
                        {#if defaultRoleId === role.id}
                            <p class="text-xs text-zinc-500 mt-1 ml-5">
                                Nieuwe gebruikers krijgen deze rol bij
                                registratie
                            </p>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Create Role Modal -->
<Modal
    open={showCreateModal}
    onclose={() => (showCreateModal = false)}
    title="Nieuwe rol aanmaken"
>
    <div class="space-y-4">
        <div>
            <label
                for="create-name"
                class="block text-sm font-medium text-zinc-700 mb-2"
            >
                Naam *
            </label>
            <input
                id="create-name"
                type="text"
                bind:value={formName}
                class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bijvoorbeeld: Manager"
            />
        </div>

        <div>
            <label
                for="create-description"
                class="block text-sm font-medium text-zinc-700 mb-2"
            >
                Beschrijving
            </label>
            <textarea
                id="create-description"
                bind:value={formDescription}
                rows="3"
                class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Beschrijving van de rol..."
            ></textarea>
        </div>

        <div class="flex gap-2 justify-end pt-4">
            <Button
                variant="ghost"
                onclick={() => (showCreateModal = false)}
                disabled={formLoading}
            >
                Annuleren
            </Button>
            <Button onclick={createRole} disabled={formLoading}>
                {formLoading ? "Aanmaken..." : "Aanmaken"}
            </Button>
        </div>
    </div>
</Modal>

<!-- Edit Role Modal -->
<Modal
    open={showEditModal}
    onclose={() => (showEditModal = false)}
    title="Rol bewerken"
>
    <div class="space-y-4">
        <div>
            <label
                for="edit-name"
                class="block text-sm font-medium text-zinc-700 mb-2"
            >
                Naam *
            </label>
            <input
                id="edit-name"
                type="text"
                bind:value={formName}
                class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <div>
            <label
                for="edit-description"
                class="block text-sm font-medium text-zinc-700 mb-2"
            >
                Beschrijving
            </label>
            <textarea
                id="edit-description"
                bind:value={formDescription}
                rows="3"
                class="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
        </div>

        <div class="flex gap-2 justify-end pt-4">
            <Button
                variant="ghost"
                onclick={() => (showEditModal = false)}
                disabled={formLoading}
            >
                Annuleren
            </Button>
            <Button onclick={updateRole} disabled={formLoading}>
                {formLoading ? "Opslaan..." : "Opslaan"}
            </Button>
        </div>
    </div>
</Modal>

<!-- Delete Role Modal -->
<Modal
    open={showDeleteModal}
    onclose={() => (showDeleteModal = false)}
    title="Rol verwijderen"
>
    <div class="space-y-4">
        {#if selectedRole && (userCounts[selectedRole.id] ?? 0) > 0}
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p class="text-orange-900 font-medium mb-2">
                    ⚠️ Kan niet verwijderen
                </p>
                <p class="text-orange-800 text-sm">
                    Deze rol heeft <strong>{userCounts[selectedRole.id]}</strong
                    >
                    gebruiker{userCounts[selectedRole.id] !== 1 ? "s" : ""} gekoppeld.
                    Verwijder eerst alle gebruikers van deze rol voordat je de rol
                    kunt verwijderen.
                </p>
            </div>
        {:else}
            <p class="text-zinc-700">
                Weet je zeker dat je de rol <strong>{selectedRole?.name}</strong
                > wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </p>
        {/if}

        <div class="flex gap-2 justify-end pt-4">
            <Button
                variant="ghost"
                onclick={() => (showDeleteModal = false)}
                disabled={formLoading}
            >
                Annuleren
            </Button>
            <Button
                variant="secondary"
                onclick={deleteRole}
                disabled={formLoading ||
                    !!(selectedRole && (userCounts[selectedRole.id] ?? 0) > 0)}
            >
                {formLoading ? "Verwijderen..." : "Verwijderen"}
            </Button>
        </div>
    </div>
</Modal>

<!-- Default Role Confirmation Modal -->
<Modal
    bind:open={showDefaultRoleConfirmModal}
    title="Standaard rol instellen"
    size="md"
    closeOnBackdropClick={false}
    loading={settingDefault}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u <strong
                >{roles.find((r) => r.id === pendingDefaultRoleId)?.name ||
                    ""}</strong
            > wilt instellen als standaard rol?
        </p>
        <p class="text-sm text-zinc-500">
            Nieuwe gebruikers krijgen automatisch deze rol bij registratie. De
            huidige standaard rol wordt vervangen.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={cancelDefaultRoleChange}
                disabled={settingDefault}
            >
                Annuleren
            </Button>
            <button
                onclick={confirmDefaultRoleChange}
                disabled={settingDefault}
                class="px-4 py-2 bg-green-600 text-white rounded-sm shadow-xs hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {settingDefault ? "Instellen..." : "Bevestigen"}
            </button>
        </div>
    </div>
</Modal>

<!-- Manage Permissions Drawer -->
<Drawer
    open={isPermissionsDrawerOpen}
    onclose={closePermissionsDrawer}
    position="right"
    class="w-[95vw] md:w-[66vw]"
>
    <div class="space-y-4">
        <!-- Title -->
        <div class="mb-6">
            <h2
                class="text-2xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-2"
            >
                Permissies beheren: {selectedRole?.name || ""}
            </h2>
        </div>

        <!-- Tabs -->
        <div class="border-b border-zinc-200 mb-6">
            <div class="flex gap-8">
                <button
                    onclick={() => (activePermissionTab = "huidig")}
                    class="pb-3 px-1 border-b-2 transition-colors {activePermissionTab ===
                    'huidig'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-zinc-600 hover:text-zinc-900'}"
                >
                    Huidig
                </button>
                <button
                    onclick={() => (activePermissionTab = "wijzig")}
                    class="pb-3 px-1 border-b-2 transition-colors {activePermissionTab ===
                    'wijzig'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-zinc-600 hover:text-zinc-900'}"
                >
                    Wijzig
                </button>
            </div>
        </div>

        {#if permissionsLoading}
            <div class="flex items-center justify-center py-12">
                <div class="text-zinc-500">Laden...</div>
            </div>
        {:else if activePermissionTab === "huidig"}
            <!-- Huidig tab: Show current permissions -->
            {#if currentRolePermissions.length === 0}
                <div class="text-center py-12 text-zinc-500">
                    Geen permissies toegewezen aan deze rol.
                </div>
            {:else}
                <div class="space-y-2">
                    {#each currentRolePermissions as permission}
                        <div
                            class="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors"
                        >
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-zinc-900 mb-1">
                                    {permission.route}
                                </div>
                                <div class="text-sm text-zinc-600">
                                    Acties: {Array.isArray(permission.actions)
                                        ? permission.actions.join(", ")
                                        : permission.actions}
                                </div>
                            </div>
                            <IconButton
                                icon={Trash2}
                                variant="danger"
                                size="sm"
                                onclick={() =>
                                    openRemovePermissionModal(permission.id)}
                                tooltip="Permissie verwijderen"
                                tooltipPosition="top"
                            />
                        </div>
                    {/each}
                </div>
            {/if}
        {:else if activePermissionTab === "wijzig"}
            <!-- Wijzig tab: Add permissions (existing functionality) -->
            <p class="text-sm text-zinc-600 mb-4">
                Selecteer de permissies die deze rol moet hebben. Gebruikers met
                deze rol krijgen automatisch toegang tot de geselecteerde routes
                en acties.
            </p>
            <PermissionTree
                permissions={allPermissions}
                selectedPermissions={rolePermissions}
                onchange={handlePermissionChange}
                showActions={true}
            />

            <div
                class="flex gap-2 justify-end pt-4 border-t border-zinc-200 mt-6"
            >
                <Button
                    variant="ghost"
                    onclick={closePermissionsDrawer}
                    disabled={formLoading}
                >
                    Annuleren
                </Button>
                <Button onclick={saveRolePermissions} disabled={formLoading}>
                    {formLoading ? "Opslaan..." : "Permissies opslaan"}
                </Button>
            </div>
        {/if}
    </div>
</Drawer>

<!-- Remove Permission Confirmation Modal -->
<Modal
    bind:open={showRemovePermissionModal}
    title="Permissie verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={removingPermission}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u deze permissie wilt verwijderen uit de rol?
        </p>
        <p class="text-sm text-zinc-500">
            Gebruikers met deze rol zullen geen toegang meer hebben tot deze
            route en acties.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={cancelRemovePermission}
                disabled={removingPermission}
            >
                Annuleren
            </Button>
            <button
                onclick={confirmRemovePermission}
                disabled={removingPermission}
                class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {removingPermission ? "Verwijderen..." : "Verwijderen"}
            </button>
        </div>
    </div>
</Modal>
