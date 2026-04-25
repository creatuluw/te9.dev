<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { searchUsersOnly } from "$lib/utils/userSearch";
    import type { SearchResult } from "$lib/utils/entitySearch";
    import Spinner from "./Spinner.svelte";

    /**
     * MentionAutocomplete component props
     */
    interface Props {
        /**
         * Search query (without @)
         */
        query: string;

        /**
         * Position where dropdown should appear
         */
        position?: { top: number; left: number };

        /**
         * Callback when entity is selected
         */
        onSelect?: (result: SearchResult) => void;

        /**
         * Callback when dropdown should close
         */
        onClose?: () => void;
    }

    let { query, position, onSelect, onClose }: Props = $props();

    let results = $state<SearchResult[]>([]);
    let loading = $state(false);
    let selectedIndex = $state(0);

    // Search users only when query changes
    $effect(() => {
        async function searchUsers() {
            loading = true;
            try {
                // searchUsersOnly returns only users — no projects, cases, tasks, or processes
                const searchQuery = query?.trim() || "";
                const searchResults = await searchUsersOnly(
                    searchQuery,
                    searchQuery.length > 0 ? 10 : 20,
                );
                results = searchResults;
                selectedIndex = 0; // Reset selection
            } catch (error) {
                console.error("Error searching users:", error);
                results = [];
            } finally {
                loading = false;
            }
        }
        searchUsers();
    });

    function handleSelect(result: SearchResult) {
        onSelect?.(result);
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (results.length === 0) return;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                selectedIndex = (selectedIndex + 1) % results.length;
                break;
            case "ArrowUp":
                event.preventDefault();
                selectedIndex =
                    selectedIndex === 0
                        ? results.length - 1
                        : selectedIndex - 1;
                break;
            case "Enter":
                event.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case "Escape":
                event.preventDefault();
                onClose?.();
                break;
        }
    }

    onMount(() => {
        if (typeof document !== "undefined") {
            document.addEventListener("keydown", handleKeyDown);
        }
    });

    onDestroy(() => {
        if (typeof document !== "undefined") {
            document.removeEventListener("keydown", handleKeyDown);
        }
    });

    function getEntityTypeLabel(type: string): string {
        switch (type) {
            case "user":
                return "Gebruiker";
            default:
                return type;
        }
    }
</script>

{#if query !== undefined}
    <div
        class="fixed z-50 bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto min-w-[300px]"
        style={position
            ? `top: ${position.top}px; left: ${position.left}px;`
            : "display: none;"}
    >
        {#if loading}
            <div class="p-4 flex items-center justify-center">
                <Spinner size="sm" />
            </div>
        {:else if results.length === 0}
            <div class="p-4 text-sm text-zinc-500 text-center">
                Geen resultaten gevonden
            </div>
        {:else}
            {#each results as result, index}
                <button
                    type="button"
                    onclick={() => handleSelect(result)}
                    class="w-full px-4 py-2 text-left hover:bg-zinc-50 transition flex items-start gap-3 {selectedIndex ===
                    index
                        ? 'bg-zinc-50'
                        : ''}"
                >
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-zinc-900 truncate">
                            {result.name}
                        </div>
                        {#if result.subtitle}
                            <div class="text-xs text-zinc-500 truncate mt-0.5">
                                {result.subtitle}
                            </div>
                        {/if}
                    </div>
                    <div class="text-xs text-zinc-400 mt-0.5 flex-shrink-0">
                        {getEntityTypeLabel(result.type)}
                    </div>
                </button>
            {/each}
        {/if}
    </div>
{/if}
