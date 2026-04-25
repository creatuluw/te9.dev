<script lang="ts">
    import { onMount } from "svelte";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Note, CreateNoteInput } from "$lib/schemas/note";
    import Select, { type SelectOption } from "./Select.svelte";
    import DatePicker from "./DatePicker.svelte";
    import Button from "./Button.svelte";
    import Label from "./Label.svelte";

    interface Props {
        /** Note to edit (if editing) */
        note?: Note | null;
        /** Entity type */
        entity: "project" | "case" | "task" | "process";
        /** Entity ID */
        entityId: number;
        /** Available note types */
        availableTypes: string[];
        /** Default note type */
        defaultType?: string;
        /** Callback when form is submitted */
        onsubmit: (data: CreateNoteInput) => Promise<void>;
        /** Callback when form is cancelled */
        oncancel?: () => void;
        /** Whether form is in loading state */
        loading?: boolean;
    }

    let {
        note = null,
        entity,
        entityId,
        availableTypes,
        defaultType = "note",
        onsubmit,
        oncancel,
        loading = false,
    }: Props = $props();

    let users = $state<PocketBaseUser[]>([]);
    let loadingUsers = $state(false);

    // Form state
    let title = $state(note?.title || "");
    let text = $state(note?.text || "");
    let type = $state(note?.type || defaultType);
    let assigneeIds = $state<string[]>(note?.assignee_id || []);
    let dueDate = $state<string | null>(
        note?.due_date
            ? new Date(note.due_date).toISOString().split("T")[0]
            : null,
    );
    let checked = $state(note?.checked || false);
    let customTypeInput = $state("");
    let showCustomTypeInput = $state(false);

    onMount(async () => {
        await loadUsers();
    });

    async function loadUsers() {
        loadingUsers = true;
        try {
            const result = await pocketbaseService.getAllUsers();
            if (result.success) {
                users = result.value;
            }
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            loadingUsers = false;
        }
    }

    const userOptions: SelectOption[] = $derived(
        users.map((user) => ({
            value: user.id,
            label: user.name || user.username || user.email || "Unknown",
        })),
    );

    const typeOptions: SelectOption[] = $derived([
        ...availableTypes.map((t) => ({ value: t, label: t })),
        { value: "__custom__", label: "+ Nieuw type..." },
    ]);

    function handleTypeChange(value: string | null) {
        if (value === "__custom__") {
            showCustomTypeInput = true;
            type = "";
        } else if (value) {
            type = value;
            showCustomTypeInput = false;
        }
    }

    function handleCustomTypeConfirm() {
        if (customTypeInput.trim()) {
            type = customTypeInput.trim();
            showCustomTypeInput = false;
            customTypeInput = "";
        }
    }

    async function handleSubmit() {
        if (!text.trim() || !type.trim()) {
            return;
        }

        const sourceUrl =
            typeof window !== "undefined"
                ? window.location.pathname + window.location.search
                : "";

        await onsubmit({
            entity,
            entity_id: entityId,
            type,
            title: title.trim() || null,
            text: text.trim(),
            assignee_id: assigneeIds,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            checked,
        });
    }

    function handleCancel() {
        if (oncancel) {
            oncancel();
        }
    }
</script>

<div class="space-y-4">
    <!-- Title input -->
    <div>
        <Label>Titel</Label>
        <input
            id="note-title"
            type="text"
            bind:value={title}
            placeholder="Voer titel in..."
            class="w-full px-3 py-2 border border-zinc-300 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={loading}
        />
    </div>

    <!-- Text input -->
    <div>
        <Label>Omschrijving</Label>
        <textarea
            id="note-text"
            bind:value={text}
            placeholder="Voer notitie tekst in..."
            class="w-full px-3 py-2 border border-zinc-300 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows="10"
            disabled={loading}
        />
    </div>

    <!-- Type selector, Assignees, and Due date on one row -->
    <div class="grid grid-cols-3 gap-4">
        <div>
            <Label>Type</Label>
            {#if showCustomTypeInput}
                <div class="flex gap-2">
                    <input
                        type="text"
                        bind:value={customTypeInput}
                        placeholder="Nieuw type naam..."
                        class="flex-1 px-3 py-2 border border-zinc-300 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                handleCustomTypeConfirm();
                            } else if (e.key === "Escape") {
                                showCustomTypeInput = false;
                                customTypeInput = "";
                            }
                        }}
                        disabled={loading}
                    />
                    <Button
                        variant="default"
                        size="sm"
                        onclick={handleCustomTypeConfirm}
                        disabled={loading}
                    >
                        Bevestig
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => {
                            showCustomTypeInput = false;
                            customTypeInput = "";
                        }}
                        disabled={loading}
                    >
                        Annuleren
                    </Button>
                </div>
            {:else}
                <Select
                    options={typeOptions}
                    value={type}
                    onchange={(value) =>
                        handleTypeChange(value as string | null)}
                    placeholder="Selecteer type..."
                    disabled={loading}
                    openAbove={true}
                />
            {/if}
        </div>

        <div>
            <Label>Toegewezen aan</Label>
            <Select
                options={userOptions}
                selectedValues={assigneeIds}
                multiple={true}
                onchange={(values) => {
                    assigneeIds = (values as string[]) || [];
                }}
                placeholder="Selecteer gebruikers..."
                disabled={loading || loadingUsers}
                loading={loadingUsers}
                openAbove={true}
            />
        </div>

        <div>
            <Label>Vervaldatum (optioneel)</Label>
            <DatePicker
                bind:value={dueDate}
                placeholder="Selecteer datum..."
                disabled={loading}
            />
        </div>
    </div>

    <!-- Checked (for checklist items) -->
    {#if type === "checklist_item"}
        <div class="flex items-center gap-2">
            <input
                type="checkbox"
                bind:checked
                disabled={loading}
                class="w-4 h-4 text-orange-600 border-zinc-300 rounded focus:ring-orange-500"
            />
            <Label class="!mb-0">Afgevinkt</Label>
        </div>
    {/if}

    <!-- Actions -->
    <div class="flex gap-2 justify-end pt-4 border-t border-zinc-200">
        {#if oncancel}
            <Button
                variant="secondary"
                onclick={handleCancel}
                disabled={loading}
            >
                Annuleren
            </Button>
        {/if}
        <Button
            variant="default"
            onclick={handleSubmit}
            disabled={loading || !text.trim() || !type.trim()}
        >
            {loading ? "Opslaan..." : note ? "Bijwerken" : "Aanmaken"}
        </Button>
    </div>
</div>
