<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import CheckboxGroup, {
        type CheckboxOption,
    } from "$lib/components/CheckboxGroup.svelte";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import Tabs from "$lib/components/Tabs.svelte";
    import SubscriptionsTab from "$lib/components/SubscriptionsTab.svelte";
    import McpServerTab from "$lib/components/McpServerTab.svelte";
    import * as userPreferencesService from "$lib/services/userPreferencesService";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import { Lock, Eye, EyeOff } from "lucide-svelte";

    let loading = $state(true);
    let saving = $state(false);
    let notificationMethods = $state<string[]>(["in-app"]);

    // Password change state
    let currentPassword = $state("");
    let newPassword = $state("");
    let confirmPassword = $state("");
    let showCurrentPassword = $state(false);
    let showNewPassword = $state(false);
    let showConfirmPassword = $state(false);
    let changingPassword = $state(false);
    let passwordErrors = $state<Record<string, string>>({});

    const notificationOptions: CheckboxOption[] = [
        { id: "in-app", label: "In-app berichten", value: "in-app" },
        { id: "email", label: "E-mail notificaties", value: "email" },
    ];

    const tabs = [
        { id: "account", label: "Account" },
        { id: "subscriptions", label: "Abonnementen" },
        { id: "mcp", label: "MCP Server" },
    ];

    let activeTab = $derived(
        ["account", "subscriptions", "mcp"].includes(
            $page.url.searchParams.get("tab") || "",
        )
            ? $page.url.searchParams.get("tab")!
            : "account",
    );

    function handleTabChange(tabId: string) {
        goto(`?tab=${tabId}`, { keepFocus: true, noScroll: true });
    }

    onMount(async () => {
        await loadPreferences();
    });

    async function loadPreferences() {
        loading = true;
        try {
            const auth = authStore.getAuth();
            if (auth?.user?.id) {
                const result = await userPreferencesService.getUserPreferences(
                    auth.user.id,
                );
                if (result.success) {
                    // Use the methods from the database, or default to ['in-app'] if empty
                    notificationMethods = result.value.notification_methods || [
                        "in-app",
                    ];
                } else {
                    console.error("Error loading preferences:", result.error);
                }
            }
        } catch (error) {
            console.error("Error loading preferences:", error);
        } finally {
            loading = false;
        }
    }

    async function handleSavePreferences() {
        saving = true;
        try {
            const auth = authStore.getAuth();
            if (!auth?.user?.id) {
                toastStore.add(
                    "Je moet ingelogd zijn om voorkeuren op te slaan",
                    "error",
                );
                return;
            }

            const result = await userPreferencesService.updateUserPreferences(
                auth.user.id,
                notificationMethods,
            );

            if (result.success) {
                toastStore.add("Voorkeuren opgeslagen", "success");
                notificationMethods = result.value.notification_methods;
            } else {
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (error) {
            console.error("Error saving preferences:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het opslaan",
                "error",
            );
        } finally {
            saving = false;
        }
    }

    function handleNotificationChange(
        event: Event & { currentTarget: HTMLInputElement },
    ) {
        const checked = event.currentTarget.checked;
        const value = event.currentTarget.value;

        if (checked) {
            if (!notificationMethods.includes(value)) {
                notificationMethods = [...notificationMethods, value];
            }
        } else {
            notificationMethods = notificationMethods.filter(
                (m) => m !== value,
            );
        }
    }

    async function handleChangePassword() {
        // Reset errors
        passwordErrors = {};

        // Validation
        if (!currentPassword) {
            passwordErrors.currentPassword = "Huidig wachtwoord is verplicht";
        }
        if (!newPassword) {
            passwordErrors.newPassword = "Nieuw wachtwoord is verplicht";
        } else if (newPassword.length < 8) {
            passwordErrors.newPassword =
                "Nieuw wachtwoord moet minimaal 8 karakters bevatten";
        }
        if (!confirmPassword) {
            passwordErrors.confirmPassword = "Bevestig je nieuwe wachtwoord";
        } else if (newPassword !== confirmPassword) {
            passwordErrors.confirmPassword = "Wachtwoorden komen niet overeen";
        }

        if (Object.keys(passwordErrors).length > 0) {
            return;
        }

        changingPassword = true;
        try {
            const auth = authStore.getAuth();
            if (!auth?.token) {
                toastStore.add(
                    "Je moet ingelogd zijn om je wachtwoord te wijzigen",
                    "error",
                );
                return;
            }

            const response = await fetch("/api/auth/password/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toastStore.add("Wachtwoord succesvol gewijzigd", "success");
                // Clear form
                currentPassword = "";
                newPassword = "";
                confirmPassword = "";
                passwordErrors = {};
            } else {
                toastStore.add(
                    result.error || "Er is een fout opgetreden",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toastStore.add(
                "Er is een fout opgetreden bij het wijzigen van je wachtwoord",
                "error",
            );
        } finally {
            changingPassword = false;
        }
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <div class="mb-8">
        <h1
            class="text-3xl font-bold font-aspekta text-zinc-900 tracking-tight antialiased mb-2"
        >
            Mijn account
        </h1>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Spinner size="lg" />
        </div>
    {:else}
        <Tabs {tabs} {activeTab} ontabchange={handleTabChange}>
            {#snippet children({ activeTab })}
                {#if activeTab === "account"}
                    <div
                        class="max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <!-- Password Change -->
                        <div
                            class="bg-white border border-zinc-200 rounded-lg p-6"
                        >
                            <h2
                                class="text-xl font-semibold font-aspekta text-zinc-900 mb-4"
                            >
                                Wachtwoord wijzigen
                            </h2>
                            <p class="text-sm text-zinc-600 mb-6 font-inter">
                                Wijzig je wachtwoord om je account veilig te
                                houden.
                            </p>

                            <form
                                class="space-y-4"
                                onsubmit={(e) => {
                                    e.preventDefault();
                                    handleChangePassword();
                                }}
                            >
                                <!-- Current Password -->
                                <div>
                                    <label
                                        for="current-password"
                                        class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta"
                                    >
                                        Huidig wachtwoord
                                    </label>
                                    <div class="relative">
                                        <div
                                            class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none"
                                        >
                                            <Lock
                                                class="w-4 h-4 {passwordErrors.currentPassword
                                                    ? 'text-red-500'
                                                    : 'text-zinc-400'}"
                                            />
                                        </div>
                                        <input
                                            id="current-password"
                                            type={showCurrentPassword
                                                ? "text"
                                                : "password"}
                                            bind:value={currentPassword}
                                            disabled={changingPassword}
                                            class="w-full pl-9 pr-9 py-1.5 border {passwordErrors.currentPassword
                                                ? 'border-red-300'
                                                : 'border-zinc-300'} rounded-sm focus:outline-none focus:ring-2 focus:border-transparent {passwordErrors.currentPassword
                                                ? 'focus:ring-red-500'
                                                : 'focus:ring-blue-500'} disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter"
                                            placeholder="Voer je huidige wachtwoord in"
                                        />
                                        <button
                                            type="button"
                                            onclick={() =>
                                                (showCurrentPassword =
                                                    !showCurrentPassword)}
                                            class="absolute inset-y-0 right-0 pr-2.5 flex items-center"
                                            disabled={changingPassword}
                                        >
                                            {#if showCurrentPassword}
                                                <EyeOff
                                                    class="w-4 h-4 text-zinc-400 hover:text-zinc-600"
                                                />
                                            {:else}
                                                <Eye
                                                    class="w-4 h-4 text-zinc-400 hover:text-zinc-600"
                                                />
                                            {/if}
                                        </button>
                                    </div>
                                    {#if passwordErrors.currentPassword}
                                        <p
                                            class="mt-0.5 text-xs text-red-600 font-inter"
                                        >
                                            {passwordErrors.currentPassword}
                                        </p>
                                    {/if}
                                </div>

                                <!-- New Password -->
                                <div>
                                    <label
                                        for="new-password"
                                        class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta"
                                    >
                                        Nieuw wachtwoord
                                    </label>
                                    <div class="relative">
                                        <div
                                            class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none"
                                        >
                                            <Lock
                                                class="w-4 h-4 {passwordErrors.newPassword
                                                    ? 'text-red-500'
                                                    : 'text-zinc-400'}"
                                            />
                                        </div>
                                        <input
                                            id="new-password"
                                            type={showNewPassword
                                                ? "text"
                                                : "password"}
                                            bind:value={newPassword}
                                            disabled={changingPassword}
                                            class="w-full pl-9 pr-9 py-1.5 border {passwordErrors.newPassword
                                                ? 'border-red-300'
                                                : 'border-zinc-300'} rounded-sm focus:outline-none focus:ring-2 focus:border-transparent {passwordErrors.newPassword
                                                ? 'focus:ring-red-500'
                                                : 'focus:ring-blue-500'} disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter"
                                            placeholder="Voer je nieuwe wachtwoord in"
                                        />
                                        <button
                                            type="button"
                                            onclick={() =>
                                                (showNewPassword =
                                                    !showNewPassword)}
                                            class="absolute inset-y-0 right-0 pr-2.5 flex items-center"
                                            disabled={changingPassword}
                                        >
                                            {#if showNewPassword}
                                                <EyeOff
                                                    class="w-4 h-4 text-zinc-400 hover:text-zinc-600"
                                                />
                                            {:else}
                                                <Eye
                                                    class="w-4 h-4 text-zinc-400 hover:text-zinc-600"
                                                />
                                            {/if}
                                        </button>
                                    </div>
                                    {#if passwordErrors.newPassword}
                                        <p
                                            class="mt-0.5 text-xs text-red-600 font-inter"
                                        >
                                            {passwordErrors.newPassword}
                                        </p>
                                    {:else}
                                        <p
                                            class="mt-0.5 text-xs text-zinc-500 font-inter"
                                        >
                                            Minimaal 8 karakters
                                        </p>
                                    {/if}
                                </div>

                                <!-- Confirm Password -->
                                <div>
                                    <label
                                        for="confirm-password"
                                        class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta"
                                    >
                                        Bevestig nieuw wachtwoord
                                    </label>
                                    <div class="relative">
                                        <div
                                            class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none"
                                        >
                                            <Lock
                                                class="w-4 h-4 {passwordErrors.confirmPassword
                                                    ? 'text-red-500'
                                                    : 'text-zinc-400'}"
                                            />
                                        </div>
                                        <input
                                            id="confirm-password"
                                            type={showConfirmPassword
                                                ? "text"
                                                : "password"}
                                            bind:value={confirmPassword}
                                            disabled={changingPassword}
                                            class="w-full pl-9 pr-9 py-1.5 border {passwordErrors.confirmPassword
                                                ? 'border-red-300'
                                                : 'border-zinc-300'} rounded-sm focus:outline-none focus:ring-2 focus:border-transparent {passwordErrors.confirmPassword
                                                ? 'focus:ring-red-500'
                                                : 'focus:ring-blue-500'} disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter"
                                            placeholder="Bevestig je nieuwe wachtwoord"
                                        />
                                        <button
                                            type="button"
                                            onclick={() =>
                                                (showConfirmPassword =
                                                    !showConfirmPassword)}
                                            class="absolute inset-y-0 right-0 pr-2.5 flex items-center"
                                            disabled={changingPassword}
                                        >
                                            {#if showConfirmPassword}
                                                <EyeOff
                                                    class="w-4 h-4 text-zinc-400 hover:text-zinc-600"
                                                />
                                            {:else}
                                                <Eye
                                                    class="w-4 h-4 text-zinc-400 hover:text-zinc-600"
                                                />
                                            {/if}
                                        </button>
                                    </div>
                                    {#if passwordErrors.confirmPassword}
                                        <p
                                            class="mt-0.5 text-xs text-red-600 font-inter"
                                        >
                                            {passwordErrors.confirmPassword}
                                        </p>
                                    {/if}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={changingPassword}
                                >
                                    {changingPassword
                                        ? "Wachtwoord wijzigen..."
                                        : "Wachtwoord wijzigen"}
                                </Button>
                            </form>
                        </div>

                        <!-- Notification Preferences -->
                        <div
                            class="bg-white border border-zinc-200 rounded-lg p-6"
                        >
                            <h2
                                class="text-xl font-semibold font-aspekta text-zinc-900 mb-4"
                            >
                                Notificatievoorkeuren
                            </h2>
                            <p class="text-sm text-zinc-600 mb-6 font-inter">
                                Kies hoe je notificaties wilt ontvangen. Deze
                                voorkeuren worden ook gebruikt als standaard
                                voor nieuwe abonnementen.
                            </p>

                            <CheckboxGroup
                                name="notification-methods"
                                legend="Notificatiemethoden"
                                description="Selecteer hoe je notificaties wilt ontvangen"
                                options={notificationOptions}
                                value={notificationMethods}
                                onchange={handleNotificationChange}
                                layout="horizontal"
                                class="mb-6"
                            />

                            <Button
                                onclick={handleSavePreferences}
                                disabled={saving}
                            >
                                {saving ? "Opslaan..." : "Voorkeuren opslaan"}
                            </Button>
                        </div>
                    </div>
                {:else if activeTab === "subscriptions"}
                    <SubscriptionsTab />
                {:else if activeTab === "mcp"}
                    <McpServerTab />
                {/if}
            {/snippet}
        </Tabs>
    {/if}
</div>
