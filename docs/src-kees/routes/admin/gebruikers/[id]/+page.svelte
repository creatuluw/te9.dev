<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { breadcrumbStore } from "$lib/stores/breadcrumbStore";
    import type { User, Role } from "$lib/schemas/auth";
    import {
        ArrowLeft,
        Save,
        X,
        Shield,
        Upload,
        Trash2,
        Link,
        Plus,
    } from "lucide-svelte";
    import Button from "$lib/components/Button.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Label from "$lib/components/Label.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Toggle from "$lib/components/Toggle.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import { navigationStore } from "$lib/stores/navigationStore";
    import { toastStore } from "$lib/stores/toastStore";
    import * as minioService from "$lib/services/minioService";

    let user = $state<(User & { roles: Role[] }) | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let allRoles = $state<Role[]>([]);
    let selectedRoleIds = $state<string[]>([]);
    let editingRoles = $state(false);
    let savingRoles = $state(false);
    let sysadminLoading = $state(false);
    let avatarUploading = $state(false);
    let togglingStatus = $state(false);
    let avatarFileInput = $state<HTMLInputElement | null>(null);

    // Delete modal state
    let deleteModalOpen = $state(false);
    let deleting = $state(false);
    let deletionReason = $state("");

    // Add role state
    let showAddRoleDropdown = $state(false);
    let selectedRoleToAdd = $state<string | null>(null);
    let addingRole = $state(false);
    let removingRole = $state(false);

    const userId = $derived($page.params.id);
    const currentPath = $derived($page.url.pathname);
    const isCurrentUser = $derived.by(() => {
        return userId === $authStore?.user?.id;
    });

    onMount(async () => {
        await Promise.all([loadUser(), loadAllRoles()]);
    });

    onDestroy(() => {
        // Clear breadcrumb entity name when leaving the page
        breadcrumbStore.clearEntityName(currentPath);
    });

    async function loadUser() {
        if (!userId) return;

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

            const response = await fetch(`/api/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();

            if (result.success) {
                user = result.data;
                if (!user) return;
                selectedRoleIds = user.roles?.map((r) => String(r.id)) || [];
                // Set entity name in breadcrumb store
                breadcrumbStore.setEntityName(
                    currentPath,
                    user.name || user.username || user.email,
                );
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het laden van de gebruiker";
            }
        } catch (err) {
            error = "Er ging iets mis bij het laden van de gebruiker";
            console.error("Load user error:", err);
        }

        loading = false;
        navigationStore.stopPageLoading();
    }

    async function loadAllRoles() {
        try {
            const token = $authStore?.token;
            if (!token) return;

            const response = await fetch("/api/auth/roles", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                allRoles = result.data;
            }
        } catch (err) {
            console.error("Load roles error:", err);
        }
    }

    async function toggleUserStatus() {
        if (!user) return;

        // Prevent users from deactivating themselves
        if (isCurrentUser && user.is_active) {
            toastStore.add("Je kunt jezelf niet deactiveren", "error");
            return;
        }

        const action = user.is_active ? "deactivate" : "activate";
        const wasActive = user.is_active;

        // Set loading state immediately
        togglingStatus = true;

        try {
            // Get authentication token
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geauthenticeerd";
                return;
            }

            const response = await fetch(
                `/api/users/${user.id}?action=${action}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );
            const result = await response.json();

            if (result.success) {
                await loadUser();
                toastStore.add(
                    wasActive
                        ? "Gebruiker gedeactiveerd"
                        : "Gebruiker geactiveerd",
                    "success",
                );
            } else {
                const errorMsg =
                    result.error ||
                    `Er ging iets mis bij het ${wasActive ? "deactiveren" : "activeren"} van de gebruiker`;
                error = errorMsg;
                toastStore.add(errorMsg, "error");
            }
        } catch (err) {
            const errorMsg = `Er ging iets mis bij het ${wasActive ? "deactiveren" : "activeren"} van de gebruiker`;
            error = errorMsg;
            toastStore.add(errorMsg, "error");
            console.error("Toggle user status error:", err);
        } finally {
            togglingStatus = false;
        }
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

    function startEditingRoles() {
        editingRoles = true;
        selectedRoleIds = user?.roles?.map((r) => String(r.id)) || [];
    }

    function cancelEditingRoles() {
        editingRoles = false;
        selectedRoleIds = user?.roles?.map((r) => String(r.id)) || [];
    }

    async function saveRoles() {
        if (!user) return;

        savingRoles = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(`/api/users/${user.id}/roles`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    role_ids: selectedRoleIds.map((id) => Number(id)),
                }),
            });

            const result = await response.json();

            if (result.success) {
                await loadUser();
                editingRoles = false;
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het opslaan van rollen";
            }
        } catch (err) {
            error = "Er ging iets mis bij het opslaan van rollen";
            console.error("Save roles error:", err);
        }

        savingRoles = false;
    }

    const roleOptions = $derived.by<SelectOption[]>(() => {
        return allRoles.map((role) => ({
            value: String(role.id),
            label: role.name,
            disabled: false,
        }));
    });

    async function handleToggleSysadmin(checked: boolean) {
        if (!user) return;

        sysadminLoading = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ is_sysadmin: checked }),
            });

            const result = await response.json();

            if (result.success) {
                await loadUser();
                toastStore.add(
                    checked
                        ? "Systeembeheerder rechten toegekend"
                        : "Systeembeheerder rechten ingetrokken",
                    "success",
                );
            } else {
                error =
                    result.error ||
                    "Er ging iets mis bij het bijwerken van de systeembeheerder status";
            }
        } catch (err) {
            error =
                "Er ging iets mis bij het bijwerken van de systeembeheerder status";
            console.error("Toggle sysadmin error:", err);
        }

        sysadminLoading = false;
    }

    function handleAvatarClick() {
        avatarFileInput?.click();
    }

    async function handleAvatarSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (!files || files.length === 0 || !user) return;

        const file = files[0];

        // Validate image type
        if (!file.type.startsWith("image/")) {
            toastStore.add("Alleen afbeeldingen zijn toegestaan", "error");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toastStore.add("Afbeelding mag maximaal 5MB zijn", "error");
            return;
        }

        avatarUploading = true;
        error = null;

        try {
            // Upload to MinIO
            const uploadResult = await minioService.uploadFile(file, "avatars");

            if (!uploadResult.success || !uploadResult.value.url) {
                error = "Fout bij uploaden van avatar";
                toastStore.add("Fout bij uploaden van avatar", "error");
                return;
            }

            const avatarUrl = uploadResult.value.url;

            // Update user with new avatar URL
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ avatar: avatarUrl }),
            });

            const result = await response.json();

            if (result.success) {
                await loadUser();
                toastStore.add("Avatar succesvol bijgewerkt", "success");
            } else {
                const errorMsg =
                    result.error ||
                    "Er ging iets mis bij het bijwerken van de avatar";
                error = errorMsg;
                toastStore.add(errorMsg, "error");
            }
        } catch (err) {
            const errorMsg = "Er ging iets mis bij het uploaden van de avatar";
            error = errorMsg;
            toastStore.add(errorMsg, "error");
            console.error("Avatar upload error:", err);
        } finally {
            avatarUploading = false;
            // Reset file input
            if (avatarFileInput) {
                avatarFileInput.value = "";
            }
        }
    }

    function openDeleteModal() {
        deleteModalOpen = true;
        deletionReason = "";
    }

    function closeDeleteModal() {
        deleteModalOpen = false;
        deletionReason = "";
    }

    async function handleDeleteUser() {
        if (!user) return;

        // Prevent users from deleting themselves
        if (isCurrentUser) {
            toastStore.add("Je kunt jezelf niet verwijderen", "error");
            return;
        }

        deleting = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                deleting = false;
                return;
            }

            const response = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reason: deletionReason || undefined,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toastStore.add("Gebruiker succesvol verwijderd", "success");
                closeDeleteModal();
                // Redirect to users list
                await goto("/admin/gebruikers");
            } else {
                const errorMsg =
                    result.error ||
                    "Er ging iets mis bij het verwijderen van de gebruiker";
                error = errorMsg;
                toastStore.add(errorMsg, "error");
            }
        } catch (err) {
            const errorMsg =
                "Er ging iets mis bij het verwijderen van de gebruiker";
            error = errorMsg;
            toastStore.add(errorMsg, "error");
            console.error("Delete user error:", err);
        } finally {
            deleting = false;
        }
    }

    async function handleAddRole() {
        if (!user || !selectedRoleToAdd || selectedRoleToAdd === "") return;

        addingRole = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(`/api/admin/users/${user.id}/roles`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role_id: Number(selectedRoleToAdd) }),
            });

            const result = await response.json();

            if (result.success) {
                await loadUser();
                toastStore.add("Rol succesvol toegewezen", "success");
                showAddRoleDropdown = false;
                selectedRoleToAdd = null;
            } else {
                const errorMsg =
                    result.error ||
                    "Er ging iets mis bij het toewijzen van de rol";
                error = errorMsg;
                toastStore.add(errorMsg, "error");
            }
        } catch (err) {
            const errorMsg = "Er ging iets mis bij het toewijzen van de rol";
            error = errorMsg;
            toastStore.add(errorMsg, "error");
            console.error("Add role error:", err);
        } finally {
            addingRole = false;
        }
    }

    async function handleRemoveRole(roleId: number) {
        if (!user) return;

        removingRole = true;
        error = null;

        try {
            const token = $authStore?.token;
            if (!token) {
                error = "Niet geautoriseerd";
                return;
            }

            const response = await fetch(
                `/api/admin/users/${user.id}/roles?role_id=${roleId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const result = await response.json();

            if (result.success) {
                await loadUser();
                toastStore.add("Rol succesvol verwijderd", "success");
            } else {
                const errorMsg =
                    result.error ||
                    "Er ging iets mis bij het verwijderen van de rol";
                error = errorMsg;
                toastStore.add(errorMsg, "error");
            }
        } catch (err) {
            const errorMsg = "Er ging iets mis bij het verwijderen van de rol";
            error = errorMsg;
            toastStore.add(errorMsg, "error");
            console.error("Remove role error:", err);
        } finally {
            removingRole = false;
        }
    }

    // Get unassigned roles for the add role dropdown
    const unassignedRoles = $derived.by(() => {
        if (!user || !allRoles) return [];
        const assignedRoleIds = user.roles?.map((r) => r.id) || [];
        return allRoles.filter((r) => !assignedRoleIds.includes(r.id));
    });

    const unassignedRoleOptions = $derived.by<SelectOption[]>(() => {
        return unassignedRoles.map((role) => ({
            value: String(role.id),
            label: role.name,
            disabled: false,
        }));
    });
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <!-- Back button -->
    <button
        onclick={() => goto("/admin/gebruikers")}
        class="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-6 transition"
    >
        <ArrowLeft class="w-4 h-4" />
        Terug naar gebruikers
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
    {:else if user}
        <!-- User header -->
        <div
            class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6 mb-6"
        >
            <div class="flex items-start justify-between">
                <div class="flex items-start gap-4">
                    <div class="-mt-1 flex flex-col items-center gap-3">
                        <button
                            type="button"
                            onclick={handleAvatarClick}
                            disabled={avatarUploading}
                            class="relative group cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            title="Klik om avatar te wijzigen"
                        >
                            {#if user.avatar}
                                <div
                                    class="w-16 h-16 rounded-full border-2 border-zinc-200 group-hover:border-zinc-400 transition-colors overflow-hidden bg-zinc-100 relative"
                                >
                                    <img
                                        src={user.avatar}
                                        alt={user.name ||
                                            user.username ||
                                            "Avatar"}
                                        class="absolute inset-0 w-full h-full object-cover"
                                        style="object-position: center;"
                                    />
                                </div>
                            {:else}
                                <div
                                    class="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-medium text-zinc-700 border-2 border-zinc-200 group-hover:border-zinc-400 transition-colors"
                                >
                                    {user.name || user.username || user.email
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
                            {#if avatarUploading}
                                <div
                                    class="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-full"
                                >
                                    <Spinner size="sm" />
                                </div>
                            {:else}
                                <div
                                    class="absolute inset-0 flex items-center justify-center bg-zinc-900/0 group-hover:bg-zinc-900/50 rounded-full transition-colors"
                                >
                                    <Upload
                                        class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            {/if}
                        </button>
                        <input
                            type="file"
                            bind:this={avatarFileInput}
                            accept="image/*"
                            onchange={handleAvatarSelect}
                            class="hidden"
                        />

                        <!-- Sysadmin Toggle -->
                        <div class="flex flex-col items-center gap-2">
                            <label class="text-xs text-zinc-600 font-medium"
                                >Systeembeheerder</label
                            >
                            <Toggle
                                checked={(user as any).is_sysadmin ?? false}
                                disabled={sysadminLoading}
                                ariaLabel="Systeembeheerder status"
                                onchange={(e) =>
                                    handleToggleSysadmin(
                                        e.currentTarget.checked,
                                    )}
                            />
                        </div>
                    </div>
                    <div>
                        <h1
                            class="text-2xl font-aspekta font-semibold text-zinc-900 tracking-tight antialiased mb-1"
                        >
                            {user.name || user.username || user.email}
                        </h1>
                        {#if user.username && user.name}
                            <p class="text-zinc-600 mb-2">@{user.username}</p>
                        {/if}
                        <div class="flex items-center gap-2">
                            {#if user.is_active}
                                <Label variant="success">Actief</Label>
                            {:else}
                                <Label variant="default">Inactief</Label>
                            {/if}
                            {#if user.email_verified}
                                <Label variant="success"
                                    >Email geverifieerd</Label
                                >
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <Button
                        variant={user.is_active ? "secondary" : "default"}
                        onclick={toggleUserStatus}
                        disabled={(isCurrentUser && user.is_active) ||
                            togglingStatus}
                    >
                        {#if togglingStatus}
                            <Spinner size="sm" />
                            {user.is_active ? "Deactiveren..." : "Activeren..."}
                        {:else}
                            {user.is_active ? "Deactiveren" : "Activeren"}
                        {/if}
                    </Button>

                    <button
                        type="button"
                        onclick={openDeleteModal}
                        disabled={isCurrentUser}
                        class="p-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                        title={isCurrentUser
                            ? "Je kunt jezelf niet verwijderen"
                            : "Gebruiker permanent verwijderen"}
                    >
                        <Trash2 class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- User details -->
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6"
            >
                <h2
                    class="text-lg font-aspekta font-semibold text-zinc-900 mb-4"
                >
                    Gebruikersgegevens
                </h2>
                <dl class="space-y-3">
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">Email</dt>
                        <dd class="mt-1 text-sm text-zinc-900">{user.email}</dd>
                    </div>
                    {#if user.bio}
                        <div>
                            <dt class="text-sm font-medium text-zinc-500">
                                Bio
                            </dt>
                            <dd class="mt-1 text-sm text-zinc-900">
                                {user.bio}
                            </dd>
                        </div>
                    {/if}
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">
                            Aangemaakt
                        </dt>
                        <dd class="mt-1 text-sm text-zinc-900">
                            {formatDate(user.created_at)}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">
                            Laatste wijziging
                        </dt>
                        <dd class="mt-1 text-sm text-zinc-900">
                            {formatDate(user.updated_at)}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-zinc-500">
                            Laatste login
                        </dt>
                        <dd class="mt-1 text-sm text-zinc-900">
                            {formatDate(user.last_login_at)}
                        </dd>
                    </div>
                </dl>
            </div>

            <!-- Roles -->
            <div
                class="bg-white rounded-lg border border-zinc-200 shadow-xs p-6"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2
                        class="text-lg font-aspekta font-semibold text-zinc-900"
                    >
                        Rollen
                    </h2>
                    {#if !editingRoles && unassignedRoles.length > 0}
                        <IconButton
                            icon={Plus}
                            variant="ghost"
                            size="sm"
                            tooltip="Rol toevoegen"
                            onclick={() =>
                                (showAddRoleDropdown = !showAddRoleDropdown)}
                            disabled={addingRole || removingRole}
                        />
                    {/if}
                </div>

                <!-- Add role dropdown -->
                {#if showAddRoleDropdown && !editingRoles}
                    <div
                        class="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-4"
                    >
                        <label
                            class="block text-sm font-medium text-zinc-700 mb-2"
                        >
                            Selecteer een rol om toe te voegen
                        </label>
                        <div class="flex gap-2">
                            <Select
                                options={unassignedRoleOptions}
                                bind:value={selectedRoleToAdd}
                                placeholder="Kies een rol..."
                                class="flex-1"
                            />
                            <Button
                                onclick={handleAddRole}
                                disabled={addingRole ||
                                    !selectedRoleToAdd ||
                                    selectedRoleToAdd === ""}
                                size="sm"
                            >
                                {addingRole ? "Toevoegen..." : "Toevoegen"}
                            </Button>
                            <Button
                                variant="ghost"
                                onclick={() => {
                                    showAddRoleDropdown = false;
                                    selectedRoleToAdd = null;
                                }}
                                disabled={addingRole}
                                size="sm"
                            >
                                <X class="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                {/if}

                {#if editingRoles}
                    <div class="space-y-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-zinc-700 mb-2"
                            >
                                Selecteer rollen
                            </label>
                            <Select
                                options={roleOptions}
                                bind:selectedValues={selectedRoleIds}
                                multiple={true}
                                placeholder="Selecteer rollen..."
                            />
                        </div>
                        <div class="flex gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                onclick={saveRoles}
                                disabled={savingRoles}
                            >
                                <Save class="w-4 h-4" />
                                {savingRoles ? "Opslaan..." : "Opslaan"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={cancelEditingRoles}
                                disabled={savingRoles}
                            >
                                <X class="w-4 h-4" />
                                Annuleren
                            </Button>
                        </div>
                    </div>
                {:else if user.roles && user.roles.length > 0}
                    <div class="space-y-2">
                        {#each user.roles as role}
                            <div
                                class="flex items-center justify-between p-3 bg-zinc-50 rounded-sm border border-zinc-200"
                            >
                                <div>
                                    <div class="font-medium text-zinc-900">
                                        {role.name}
                                    </div>
                                    {#if role.description}
                                        <div class="text-sm text-zinc-600">
                                            {role.description}
                                        </div>
                                    {/if}
                                </div>
                                <div class="flex items-center gap-2">
                                    <Tooltip text="Ga naar rol" position="left">
                                        <button
                                            type="button"
                                            onclick={() =>
                                                goto(
                                                    `/admin/rollen/${role.id}`,
                                                )}
                                            class="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors"
                                            aria-label="Ga naar rol {role.name}"
                                        >
                                            <Link class="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                    <IconButton
                                        icon={Trash2}
                                        variant="danger"
                                        size="sm"
                                        tooltip="Rol verwijderen"
                                        onclick={() =>
                                            handleRemoveRole(role.id)}
                                        disabled={removingRole || addingRole}
                                    />
                                    {#if role.is_system}
                                        <Label variant="default">Systeem</Label>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-zinc-600 text-sm">Geen rollen toegewezen</p>
                {/if}
            </div>
        </div>
    {:else}
        <div
            class="text-center py-12 bg-white rounded-lg border border-zinc-200"
        >
            <p class="text-zinc-500">Gebruiker niet gevonden</p>
        </div>
    {/if}
</div>

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="Gebruiker permanent verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-900 font-medium mb-2">
                ⚠️ Let op: Deze actie is permanent
            </p>
            <p class="text-red-800 text-sm">
                Deze gebruiker wordt verplaatst naar de verwijderde gebruikers
                tabel. Alle werk, cases en taken gekoppeld aan deze gebruiker
                blijven behouden in het systeem.
            </p>
        </div>

        {#if user}
            <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <p class="text-sm text-zinc-600 mb-1">
                    Te verwijderen gebruiker:
                </p>
                <p class="font-medium text-zinc-900">
                    {user.name || user.username || user.email}
                </p>
                <p class="text-sm text-zinc-600">{user.email}</p>
            </div>
        {/if}

        <div>
            <label
                for="deletion-reason"
                class="block text-sm font-medium text-zinc-700 mb-2"
            >
                Reden voor verwijdering (optioneel)
            </label>
            <textarea
                id="deletion-reason"
                bind:value={deletionReason}
                disabled={deleting}
                placeholder="Bijvoorbeeld: Op verzoek van gebruiker, GDPR verwijdering, etc."
                rows="3"
                class="w-full px-3 py-2 border border-zinc-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            ></textarea>
        </div>

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
                onclick={handleDeleteUser}
                disabled={deleting}
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
