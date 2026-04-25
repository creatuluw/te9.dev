<script lang="ts">
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Note } from "$lib/schemas/note";
    import UserAvatar from "./UserAvatar.svelte";
    import { Check } from "lucide-svelte";
    import { formatDate } from "$lib/utils/timeUtils";
    import { formatUserName } from "$lib/utils/userUtils";

    interface Props {
        /** Note to display */
        note: Note;
        /** Users map for displaying assignees */
        users: Map<string, PocketBaseUser | null>;
        /** Callback when note is edited */
        onedit?: (note: Note) => void;
        /** Callback when checklist item is toggled */
        ontoggle?: (note: Note) => void;
    }

    let { note, users, onedit, ontoggle }: Props = $props();

    const assignees = $derived(
        note.assignee_id
            .map((id) => users.get(id))
            .filter(
                (user): user is PocketBaseUser =>
                    user !== null && user !== undefined,
            ),
    );

    const isOverdue = $derived.by(() => {
        if (!note.due_date) return false;
        const dueDate = new Date(note.due_date);
        const now = new Date();
        return dueDate < now && !note.closed;
    });

    function handleToggle(event: MouseEvent) {
        event.stopPropagation(); // Prevent card click when toggling checkbox
        if (ontoggle && note.type === "checklist_item") {
            ontoggle(note);
        }
    }

    function handleCardClick() {
        if (onedit) {
            onedit(note);
        }
    }

    function truncateText(text: string, maxLength: number = 70): string {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "...";
    }
</script>

<div
    class="border border-zinc-200 rounded-lg {note.type === 'checklist_item'
        ? 'p-3'
        : 'p-4'} shadow-xs hover:shadow-sm transition-shadow h-full flex flex-col cursor-pointer {note.closed
        ? 'opacity-60'
        : ''}"
    style:background-color={note.type === "checklist_item"
        ? "#EFFFF7"
        : "#FFF9DB"}
    onclick={handleCardClick}
    role="button"
    tabindex="0"
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
        }
    }}
>
    <!-- Header -->
    <div class="flex items-start justify-between mb-1 flex-1">
        <div class="flex-1 min-w-0 flex flex-col">
            {#if note.title}
                <h3 class="text-zinc-900 font-semibold font-inter text-sm mb-1">
                    {note.title}
                </h3>
            {/if}
            {#if note.type === "checklist_item"}
                <div class="flex items-start gap-2">
                    <button
                        onclick={handleToggle}
                        class="flex items-center justify-center flex-shrink-0 w-5 h-5 min-w-5 min-h-5 rounded border-2 mt-0.5 {note.checked
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'border-zinc-300 bg-white'} transition-colors"
                        aria-label={note.checked ? "Afvinken" : "Afvinken"}
                    >
                        {#if note.checked}
                            <Check class="w-3 h-3 flex-shrink-0" />
                        {/if}
                    </button>
                    <span
                        class="text-zinc-900 font-inter flex-1 {note.checked
                            ? 'line-through text-zinc-500'
                            : ''}"
                        style="font-size: 0.8125rem;"
                    >
                        {truncateText(note.text)}
                    </span>
                </div>
            {:else}
                <p
                    class="text-zinc-900 font-inter whitespace-pre-wrap break-words"
                    style="font-size: 0.8125rem;"
                >
                    {truncateText(note.text)}
                </p>
            {/if}
        </div>
    </div>

    <!-- Metadata -->
    <div class="flex items-center gap-2 mt-auto text-xs text-zinc-600">
        <!-- Assignees -->
        {#if assignees.length > 0}
            <div class="flex items-center gap-1">
                {#each assignees as user}
                    <UserAvatar {user} size="xs" />
                {/each}
            </div>
        {/if}

        <!-- Due date -->
        {#if note.due_date}
            <div
                class="flex items-center gap-1 {isOverdue
                    ? 'text-red-600 font-medium'
                    : ''}"
            >
                <span>{formatDate(note.due_date)}</span>
                {#if isOverdue}
                    <span class="text-red-600">(verlopen)</span>
                {/if}
            </div>
        {/if}
    </div>
</div>
