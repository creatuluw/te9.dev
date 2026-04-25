<script lang="ts">
    import { Mail, User, Lock, Eye, EyeOff } from "lucide-svelte";
    import Button from "./Button.svelte";
    import Drawer from "./Drawer.svelte";
    import type { UserWithRoles } from "$lib/services/userManagementService";

    interface Props {
        /** Whether the drawer is open */
        open: boolean;

        /** Drawer close handler */
        onclose: () => void;

        /** User to edit (undefined for create mode) */
        user?: UserWithRoles | null;

        /** Submit handler - receives form data */
        onsubmit: (data: any) => void | Promise<void>;

        /** Loading state */
        loading?: boolean;

        /** Error message */
        error?: string | null;
    }

    let {
        open,
        onclose,
        user = null,
        onsubmit,
        loading = false,
        error = null,
    }: Props = $props();

    // Form state
    let email = $state("");
    let firstName = $state("");
    let lastName = $state("");
    let password = $state("");
    let isActive = $state(true);
    let showPassword = $state(false);

    // Mode
    const isEditMode = $derived(user !== null && user !== undefined);
    const title = $derived(
        isEditMode ? "Gebruiker bewerken" : "Nieuwe gebruiker uitnodigen",
    );

    // Initialize form when user changes
    $effect(() => {
        if (user) {
            email = user.email;
            firstName = user.first_name;
            lastName = user.last_name;
            password = "";
            isActive = user.is_active;
        } else {
            // Reset form - only email for create mode
            email = "";
            firstName = "";
            lastName = "";
            password = "";
            isActive = true;
        }
    });

    // Generate random password
    function generatePassword() {
        const length = 12;
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += charset.charAt(
                Math.floor(Math.random() * charset.length),
            );
        }
        password = result;
        showPassword = true;
    }

    function handleSubmit(e: Event) {
        e.preventDefault();

        if (isEditMode) {
            // Edit mode: send all fields
            const data: any = {
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                is_active: isActive,
            };

            // Only include password if it's set
            if (password.trim()) {
                data.password = password.trim();
            }

            onsubmit(data);
        } else {
            // Create mode: only send email (invitation will be sent)
            onsubmit({ email: email.trim() });
        }
    }
</script>

<Drawer {open} {onclose}>
    <div class="flex flex-col h-full">
        <div class="mb-6 pb-4 border-b border-zinc-200">
            <h2 class="text-2xl font-bold text-zinc-900 font-aspekta">
                {title}
            </h2>
        </div>
        <form onsubmit={handleSubmit} class="space-y-6">
            {#if error}
                <div
                    class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm"
                >
                    {error}
                </div>
            {/if}

            <!-- Email -->
            <div>
                <label
                    for="user-email"
                    class="block text-sm font-medium text-zinc-700 mb-2"
                >
                    Email *
                </label>
                <div class="relative">
                    <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                        <Mail class="w-5 h-5 text-zinc-400" />
                    </div>
                    <input
                        id="user-email"
                        type="email"
                        bind:value={email}
                        required
                        class="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="gebruiker@voorbeeld.nl"
                        disabled={loading}
                    />
                </div>
                {#if !isEditMode}
                    <p class="text-xs text-zinc-500 mt-1">
                        De gebruiker ontvangt een e-mail met een link om zijn
                        account aan te maken.
                    </p>
                {/if}
            </div>

            {#if isEditMode}
                <!-- First Name -->
                <div>
                    <label
                        for="user-first-name"
                        class="block text-sm font-medium text-zinc-700 mb-2"
                    >
                        Voornaam *
                    </label>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <User class="w-5 h-5 text-zinc-400" />
                        </div>
                        <input
                            id="user-first-name"
                            type="text"
                            bind:value={firstName}
                            required
                            class="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Jan"
                            disabled={loading}
                        />
                    </div>
                </div>

                <!-- Last Name -->
                <div>
                    <label
                        for="user-last-name"
                        class="block text-sm font-medium text-zinc-700 mb-2"
                    >
                        Achternaam *
                    </label>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <User class="w-5 h-5 text-zinc-400" />
                        </div>
                        <input
                            id="user-last-name"
                            type="text"
                            bind:value={lastName}
                            required
                            class="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="de Vries"
                            disabled={loading}
                        />
                    </div>
                </div>

                <!-- Password -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <label
                            for="user-password"
                            class="block text-sm font-medium text-zinc-700"
                        >
                            Wachtwoord
                        </label>
                        <button
                            type="button"
                            onclick={generatePassword}
                            class="text-xs text-blue-600 hover:text-blue-800"
                            disabled={loading}
                        >
                            Genereer wachtwoord
                        </button>
                    </div>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <Lock class="w-5 h-5 text-zinc-400" />
                        </div>
                        <input
                            id="user-password"
                            type={showPassword ? "text" : "password"}
                            bind:value={password}
                            class="w-full pl-10 pr-10 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Laat leeg om niet te wijzigen"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onclick={() => (showPassword = !showPassword)}
                            class="absolute inset-y-0 right-0 pr-3 flex items-center"
                            disabled={loading}
                        >
                            {#if showPassword}
                                <EyeOff
                                    class="w-5 h-5 text-zinc-400 hover:text-zinc-600"
                                />
                            {:else}
                                <Eye
                                    class="w-5 h-5 text-zinc-400 hover:text-zinc-600"
                                />
                            {/if}
                        </button>
                    </div>
                    <p class="text-xs text-zinc-500 mt-1">
                        Laat leeg om het huidige wachtwoord te behouden
                    </p>
                </div>

                <!-- Active Status -->
                <div>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={isActive}
                            class="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                            disabled={loading}
                        />
                        <span class="text-sm text-zinc-700"
                            >Actief (gebruiker kan inloggen)</span
                        >
                    </label>
                </div>
            {/if}

            <!-- Actions -->
            <div class="flex gap-2 justify-end pt-4 border-t border-zinc-200">
                <Button
                    type="button"
                    variant="ghost"
                    onclick={onclose}
                    disabled={loading}
                >
                    Annuleren
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading
                        ? "Opslaan..."
                        : isEditMode
                          ? "Wijzigingen opslaan"
                          : "Uitnodiging versturen"}
                </Button>
            </div>
        </form>
    </div>
</Drawer>
