<script lang="ts">
    import { onMount } from "svelte";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import Select, { type SelectOption } from "./Select.svelte";
    import { useLoadingState } from "$lib/utils/loadingState";

    let loadedUsers: PocketBaseUser[] = $state([]);
    let isLoading = $state(false);
    const { startLoading, stopLoading } = useLoadingState("UserSelector");

    /**
     * UserSelector component props
     *
     * Component for selecting a user from a list. Automatically loads users if not provided.
     */
    interface Props {
        /**
         * Selected user ID (bindable)
         * @default null
         * @example
         * ```typescript
         * <UserSelector bind:selectedUserId={userId} />
         * ```
         */
        selectedUserId: string | null;

        /**
         * Callback fired when selected user changes (alternative to bind:)
         * @param userId - Selected user ID (null if cleared)
         */
        onSelectedUserIdChange?: (userId: string | null) => void;

        /**
         * Placeholder text
         * @default 'Selecteer een gebruiker...'
         */
        placeholder?: string;

        /**
         * Additional CSS classes
         */
        class?: string;

        /**
         * Pre-populated users list (if not provided, loads from API)
         * @example
         * ```typescript
         * <UserSelector users={preloadedUsers} />
         * ```
         */
        users?: PocketBaseUser[];
    }

    let {
        selectedUserId = $bindable(),
        onSelectedUserIdChange,
        placeholder = "Selecteer een gebruiker...",
        class: className = "",
        users: usersProp,
    }: Props = $props();

    // Internal state for when using callback pattern (not bind)
    // When using bind:, this will sync with selectedUserId automatically
    // When using callback pattern, we need to sync manually
    let internalValue = $state<string | null>(selectedUserId);

    // Sync internal value with prop when prop changes
    // This handles both patterns:
    // - bind: pattern: when parent updates the bound variable externally
    // - callback pattern: when parent updates the prop (e.g., after data reload)
    $effect(() => {
        // Only update if different to avoid unnecessary re-renders
        if (internalValue !== selectedUserId) {
            internalValue = selectedUserId;
        }
    });

    // Derive users from either prop or loaded users
    // If usersProp is explicitly provided and not empty, use it and react to changes
    // If usersProp is undefined or empty array, use loadedUsers (component will load them)
    const users = $derived.by(() => {
        // Access usersProp to make it reactive
        const prop = usersProp;
        // If prop is undefined or empty array, use loaded users
        if (prop === undefined || (Array.isArray(prop) && prop.length === 0)) {
            return loadedUsers;
        }
        return prop;
    });

    // Convert users to SelectOption format
    const userOptions = $derived.by((): SelectOption[] => {
        if (!Array.isArray(users)) {
            return [];
        }
        const options = users.map((user) => ({
            value: user.id,
            label: getUserDisplayName(user),
        }));
        return options;
    });

    onMount(async () => {
        // Always load users first if prop is undefined or empty array
        if (
            usersProp === undefined ||
            (Array.isArray(usersProp) && usersProp.length === 0)
        ) {
            await loadUsers();
        } else {
            // Even if users are provided, ensure we're not in loading state
            isLoading = false;
        }
    });

    // Watch for changes in usersProp - if it becomes populated, use it and clear loading state
    $effect(() => {
        const prop = usersProp;
        // If prop changes from empty to populated, the derived will automatically update
        if (prop !== undefined && Array.isArray(prop) && prop.length > 0) {
            // If users are provided via prop, ensure we're not in loading state
            isLoading = false;
        }
    });

    async function loadUsers() {
        // Don't load if we already have users from prop
        if (
            usersProp !== undefined &&
            Array.isArray(usersProp) &&
            usersProp.length > 0
        ) {
            isLoading = false;
            return;
        }

        isLoading = true;
        startLoading();
        try {
            const result = await pocketbaseService.getAllUsers();
            if (result.success) {
                loadedUsers = result.value;
            } else {
                loadedUsers = [];
            }
        } catch (error) {
            loadedUsers = [];
        } finally {
            isLoading = false;
            stopLoading();
        }
    }

    function handleChange(value: string | string[] | null) {
        // Normalize array to single value (this is a single-select component)
        const normalizedValue = Array.isArray(value)
            ? value.length > 0
                ? value[0]
                : null
            : value;
        internalValue = normalizedValue;
        // Update bindable prop if using bind: pattern
        // This will automatically sync back to parent's bound variable
        selectedUserId = normalizedValue;
        // Call callback if using callback pattern
        // This allows parent to handle the update when not using bind:
        if (onSelectedUserIdChange) {
            onSelectedUserIdChange(normalizedValue);
        }
    }

    function getUserDisplayName(user: PocketBaseUser): string {
        return user.name || user.username || user.email || "Unknown";
    }
</script>

<Select
    bind:value={internalValue}
    options={userOptions}
    placeholder={isLoading ? "Gebruikers laden..." : placeholder}
    loading={isLoading}
    disabled={isLoading}
    onchange={handleChange}
    class={className}
    searchable={true}
/>
