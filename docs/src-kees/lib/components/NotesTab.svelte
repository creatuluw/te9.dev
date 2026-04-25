<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import * as noteService from "$lib/services/noteService";
    import * as pocketbaseService from "$lib/services/pocketbaseService";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import type { Note, CreateNoteInput } from "$lib/schemas/note";
    import { DEFAULT_NOTE_TYPES } from "$lib/schemas/note";
    import NoteCard from "./NoteCard.svelte";
    import NoteForm from "./NoteForm.svelte";
    import Modal from "./Modal.svelte";
    import Button from "./Button.svelte";
    import ButtonGroup from "./ButtonGroup.svelte";
    import IconButton from "./IconButton.svelte";
    import Spinner from "./Spinner.svelte";
    import Label from "./Label.svelte";
    import Pagination from "./Pagination.svelte";
    import {
        Plus,
        Archive,
        ArchiveRestore,
        Edit2,
        Trash2,
    } from "lucide-svelte";
    import { getUserMessage } from "$lib/types/errors";
    import { toastStore } from "$lib/stores/toastStore";
    import { checklistStore } from "$lib/stores/checklistStore";
    import { getCurrentUserId } from "$lib/utils/userUtils";

    let dragGhost = $state<HTMLElement | null>(null);
    let dragOffset = $state<{ x: number; y: number } | null>(null);
    let isDragging = $state(false);
    let dropTargetId = $state<number | null>(null);
    let lastDropTargetEl = $state<HTMLElement | null>(null);
    const PAGE_SIZE = 20;
    let currentPage = $state(1);
    let hoverPlaceholderIndex = $state<number | null>(null);

    function makePlaceholder(draggedEl: HTMLElement): HTMLElement {
        const placeholder = document.createElement("div");
        placeholder.classList.add("placeholder");
        placeholder.style.height = `${draggedEl.offsetHeight}px`;
        placeholder.style.display = "block";
        placeholder.style.width = "100%";
        placeholder.style.border = "4px solid rgb(234, 88, 12)";
        placeholder.style.backgroundColor = "rgb(255, 237, 213)";
        placeholder.style.borderRadius = "0.5rem";
        placeholder.style.minHeight = "80px";
        return placeholder;
    }

    function movePlaceholder(event: DragEvent) {
        const list = event.currentTarget as HTMLElement;
        const draggedEl = document.getElementById("dragged-note");
        if (!draggedEl) return;

        let tasksContainer = list.querySelector(
            "[data-tasks]",
        ) as HTMLElement | null;
        if (!tasksContainer) {
            if (list.hasAttribute("data-tasks")) {
                tasksContainer = list;
            } else {
                return;
            }
        }

        const existingPlaceholder = list.querySelector(
            ".placeholder",
        ) as HTMLElement | null;

        if (existingPlaceholder) {
            const rect = existingPlaceholder.getBoundingClientRect();
            if (rect.top <= event.clientY && rect.bottom >= event.clientY) {
                return;
            }
        }

        for (const child of Array.from(tasksContainer.children)) {
            const el = child as HTMLElement;
            if (el.getBoundingClientRect().bottom >= event.clientY) {
                if (el === existingPlaceholder) return;
                existingPlaceholder?.remove();
                if (
                    el === draggedEl ||
                    el.previousElementSibling === draggedEl
                ) {
                    return;
                }
                tasksContainer.insertBefore(
                    existingPlaceholder ??
                        makePlaceholder(draggedEl as HTMLElement),
                    el,
                );
                return;
            }
        }

        existingPlaceholder?.remove();
        if (tasksContainer.lastElementChild === draggedEl) return;
        tasksContainer.append(
            existingPlaceholder ?? makePlaceholder(draggedEl as HTMLElement),
        );
    }

    function handleDragStart(event: DragEvent, noteId: number) {
        const target = event.currentTarget as HTMLElement;
        target.id = "dragged-note";
        isDragging = true;

        const ghost = target.cloneNode(true) as HTMLElement;
        ghost.id = "drag-ghost";
        ghost.className = "drag-ghost";
        ghost.style.position = "fixed";
        ghost.style.pointerEvents = "none";
        ghost.style.zIndex = "10000";
        ghost.style.opacity = "0.9";
        ghost.style.transform = "scale(1.1)";
        ghost.style.boxShadow =
            "0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)";
        ghost.style.width = `${target.offsetWidth}px`;
        ghost.style.transition = "none";

        const rect = target.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        ghost.style.left = `${event.clientX - offsetX}px`;
        ghost.style.top = `${event.clientY - offsetY}px`;

        document.body.appendChild(ghost);
        dragGhost = ghost;
        dragOffset = { x: offsetX, y: offsetY };

        let mouseX = event.clientX;
        let mouseY = event.clientY;
        function updateGhostPosition() {
            if (dragGhost && dragOffset && isDragging) {
                dragGhost.style.left = `${mouseX - dragOffset.x}px`;
                dragGhost.style.top = `${mouseY - dragOffset.y}px`;
                requestAnimationFrame(updateGhostPosition);
            }
        }
        function trackMousePosition(e: DragEvent | MouseEvent) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
        requestAnimationFrame(updateGhostPosition);
        document.addEventListener("dragover", trackMousePosition);
        document.addEventListener("drag", trackMousePosition);
        (target as any).__dragCleanup = () => {
            isDragging = false;
            document.removeEventListener("dragover", trackMousePosition);
            document.removeEventListener("drag", trackMousePosition);
            if (dragGhost && document.body.contains(dragGhost)) {
                document.body.removeChild(dragGhost);
            }
            dragGhost = null;
            dragOffset = null;
        };
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            // Set both a custom and a standard MIME type for broader browser support
            event.dataTransfer.setData("note", String(noteId));
            event.dataTransfer.setData("text/plain", String(noteId));
            const emptyImg = document.createElement("img");
            emptyImg.src =
                "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            event.dataTransfer.setDragImage(emptyImg, 0, 0);
        }
    }

    function handleDragEnd(event: DragEvent) {
        const target = event.currentTarget as HTMLElement;
        target.removeAttribute("id");
        if ((target as any).__dragCleanup) {
            (target as any).__dragCleanup();
        }
        document.querySelectorAll(".placeholder").forEach((p) => p.remove());
    }

    function handleDragOver(event: DragEvent) {
        // Always allow dropping; improves compatibility across browsers
        event.preventDefault();
        movePlaceholder(event);
    }

    function handleDragLeave(event: DragEvent) {
        const list = event.currentTarget as HTMLElement;
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (list.contains(relatedTarget)) return;
        const placeholder = list.querySelector(".placeholder");
        placeholder?.remove();
        dropTargetId = null;
        if (lastDropTargetEl) {
            lastDropTargetEl.classList.remove("drop-target");
            lastDropTargetEl = null;
        }
    }

    function handleCardDragOver(event: DragEvent, noteId: number) {
        event.preventDefault();
        const el = event.currentTarget as HTMLElement;
        if (lastDropTargetEl && lastDropTargetEl !== el) {
            lastDropTargetEl.classList.remove("drop-target");
        }
        el.classList.add("drop-target");
        lastDropTargetEl = el;
        dropTargetId = noteId;
    }

    function handleCardDragLeave(event: DragEvent) {
        const el = event.currentTarget as HTMLElement;
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (el.contains(relatedTarget)) return;
        el.classList.remove("drop-target");
        if (lastDropTargetEl === el) {
            lastDropTargetEl = null;
        }
    }

    function handlePlaceholderDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        const el = event.currentTarget as HTMLElement;
        el.classList.add("drop-target");
        hoverPlaceholderIndex = index;
    }

    function handlePlaceholderDragLeave(event: DragEvent) {
        const el = event.currentTarget as HTMLElement;
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (el.contains(relatedTarget)) return;
        el.classList.remove("drop-target");
        hoverPlaceholderIndex = null;
    }

    async function handleDropOnPlaceholder(event: DragEvent, index: number) {
        event.preventDefault();
        const draggedEl = document.getElementById(
            "dragged-note",
        ) as HTMLElement | null;
        if (!draggedEl) return;
        const draggedId = parseInt(
            draggedEl.getAttribute("data-note-id") || "0",
            10,
        );
        const itemsExcludingDragged = canvasNotes.filter(
            (n) => n.id !== draggedId,
        );
        const slotAbsoluteIndex = pageStartIndex + index;
        const clampedIndex = Math.min(
            Math.max(0, slotAbsoluteIndex),
            itemsExcludingDragged.length,
        );
        const newOrder = [...itemsExcludingDragged];
        const draggedNote = canvasNotes.find((n) => n.id === draggedId);
        if (!draggedNote) return;
        newOrder.splice(clampedIndex, 0, draggedNote);

        const updatedNotes: Note[] = notes.map((n) => {
            const idx = newOrder.findIndex((x) => x.id === n.id);
            if (idx !== -1) {
                return { ...n, order_index: idx } as Note;
            }
            return n;
        });
        notes = updatedNotes;

        if ((draggedEl as any).__dragCleanup) {
            (draggedEl as any).__dragCleanup();
        }
        document.querySelectorAll(".placeholder").forEach((p) => p.remove());
        const newLocation = document.querySelector(
            `[data-note-id="${draggedId}"]`,
        ) as HTMLElement | null;
        newLocation?.removeAttribute("id");
        hoverPlaceholderIndex = null;

        try {
            const orders = newOrder.map((n, i) => ({
                id: n.id,
                order_index: i,
            }));
            const { reorderNotes } = await import("$lib/services/noteService");
            const result = await reorderNotes(entityType, entityId, orders);
            if (result.success) {
                toastStore.add("Item verplaatst", "success");
            } else {
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (error) {
            toastStore.add("Fout bij opslaan van volgorde", "error");
        }
    }

    async function handleDropOnCard(
        event: DragEvent,
        targetId: number,
        displayNotes: Note[],
    ) {
        event.preventDefault();
        const draggedEl = document.getElementById(
            "dragged-note",
        ) as HTMLElement | null;
        if (!draggedEl) return;
        const draggedId = parseInt(
            draggedEl.getAttribute("data-note-id") || "0",
            10,
        );
        const itemsExcludingDragged = displayNotes.filter(
            (n) => n.id !== draggedId,
        );
        let targetIndex = itemsExcludingDragged.findIndex(
            (n) => n.id === targetId,
        );
        if (targetIndex < 0) targetIndex = itemsExcludingDragged.length;

        const newOrder = [...itemsExcludingDragged];
        const draggedNote = displayNotes.find((n) => n.id === draggedId);
        if (!draggedNote) return;
        newOrder.splice(targetIndex, 0, draggedNote);

        const updatedNotes: Note[] = notes.map((n) => {
            const idx = newOrder.findIndex((x) => x.id === n.id);
            if (idx !== -1) {
                return { ...n, order_index: idx } as Note;
            }
            return n;
        });
        notes = updatedNotes;

        if ((draggedEl as any).__dragCleanup) {
            (draggedEl as any).__dragCleanup();
        }
        document.querySelectorAll(".placeholder").forEach((p) => p.remove());
        const newLocation = document.querySelector(
            `[data-note-id="${draggedId}"]`,
        ) as HTMLElement | null;
        newLocation?.removeAttribute("id");
        if (lastDropTargetEl) {
            lastDropTargetEl.classList.remove("drop-target");
            lastDropTargetEl = null;
        }
        dropTargetId = null;

        try {
            const orders = newOrder.map((n, index) => ({
                id: n.id,
                order_index: index,
            }));
            const { reorderNotes } = await import("$lib/services/noteService");
            const result = await reorderNotes(entityType, entityId, orders);
            if (result.success) {
                toastStore.add("Item verplaatst", "success");
            } else {
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (error) {
            console.error("Error persisting note order", error);
            toastStore.add("Fout bij opslaan van volgorde", "error");
        }
    }

    async function handleDrop(event: DragEvent, displayNotes: Note[]) {
        event.preventDefault();
        const listElement = event.currentTarget as HTMLElement;
        const draggedEl = document.getElementById(
            "dragged-note",
        ) as HTMLElement | null;
        if (!draggedEl) return;
        const placeholder = listElement.querySelector(
            ".placeholder",
        ) as HTMLElement | null;
        if (!placeholder) return;
        let tasksContainer = listElement.querySelector(
            "[data-tasks]",
        ) as HTMLElement | null;
        if (!tasksContainer) {
            // If current target is the tasks container itself
            if (listElement.hasAttribute("data-tasks")) {
                tasksContainer = listElement;
            } else {
                return;
            }
        }

        const draggedId = parseInt(
            draggedEl.getAttribute("data-note-id") || "0",
            10,
        );
        const itemsExcludingDragged = displayNotes.filter(
            (n) => n.id !== draggedId,
        );

        let targetIndex = 0;
        for (const child of Array.from(tasksContainer.children)) {
            if (child === placeholder) break;
            if (
                child !== draggedEl &&
                !child.classList.contains("placeholder")
            ) {
                targetIndex++;
            }
        }
        if (!tasksContainer.contains(placeholder)) {
            targetIndex = itemsExcludingDragged.length;
        }

        const newOrder = [...itemsExcludingDragged];
        const draggedNote = displayNotes.find((n) => n.id === draggedId);
        if (!draggedNote) return;
        newOrder.splice(targetIndex, 0, draggedNote);

        const updatedNotes: Note[] = notes.map((n) => {
            const idx = newOrder.findIndex((x) => x.id === n.id);
            if (idx !== -1) {
                return { ...n, order_index: idx } as Note;
            }
            return n;
        });
        notes = updatedNotes;

        if ((draggedEl as any).__dragCleanup) {
            (draggedEl as any).__dragCleanup();
        }
        placeholder.remove();
        const newLocation = document.querySelector(
            `[data-note-id="${draggedId}"]`,
        ) as HTMLElement | null;
        newLocation?.removeAttribute("id");

        try {
            const orders = newOrder.map((n, index) => ({
                id: n.id,
                order_index: index,
            }));
            const { reorderNotes } = await import("$lib/services/noteService");
            const result = await reorderNotes(entityType, entityId, orders);
            if (result.success) {
                toastStore.add("Item verplaatst", "success");
            } else {
                toastStore.add(getUserMessage(result.error), "error");
            }
        } catch (error) {
            console.error("Error persisting note order", error);
            toastStore.add("Fout bij opslaan van volgorde", "error");
        }
    }

    interface Props {
        /** Entity type */
        entityType: "project" | "case" | "task" | "process";
        /** Entity ID */
        entityId: number;
    }

    let { entityType, entityId }: Props = $props();

    let notes = $state<Note[]>([]);
    let loading = $state(true);
    let users = $state<Map<string, PocketBaseUser | null>>(new Map());
    let mounted = $state(false);

    // Get the active tab from URL - only apply filters when tab=notities
    // Note: We only treat it as "notities" when explicitly set, not when tab param is missing
    const activeTab = $derived.by(() => {
        const url = $page.url;
        const tabParam = url.searchParams.get("tab");
        return tabParam; // null if not set, meaning we're on the default tab (not notities)
    });

    // Get filter states from URL parameters (only active when tab=notities)
    // Access $page.url to ensure reactivity
    const showHuidig = $derived.by(() => {
        // Only apply huidig filter when on notities tab
        if (activeTab !== "notities") return true;
        const url = $page.url;
        const huidigParam = url.searchParams.get("huidig");
        // Default to true if not specified
        return huidigParam === null || huidigParam === "true";
    });

    const showArchief = $derived.by(() => {
        // Only apply archief filter when on notities tab
        if (activeTab !== "notities") return false;
        const url = $page.url;
        const archiefParam = url.searchParams.get("archief");
        return archiefParam === "true";
    });

    const showChecks = $derived.by(() => {
        // Only apply checks filter when on notities tab
        if (activeTab !== "notities") return true;
        const url = $page.url;
        const checksParam = url.searchParams.get("checks");
        return checksParam === null || checksParam === "true";
    });

    const showNotes = $derived.by(() => {
        // Only apply notes filter when on notities tab
        if (activeTab !== "notities") return true;
        const url = $page.url;
        const notesParam = url.searchParams.get("notes");
        return notesParam === null || notesParam === "true";
    });

    const selectedNoteId = $derived.by(() => {
        const url = $page.url;
        const noteIdParam = url.searchParams.get("note_id");
        return noteIdParam ? parseInt(noteIdParam, 10) : null;
    });

    const canvasNotes = $derived.by(() => {
        const showChecksValue = showChecks;
        const showNotesValue = showNotes;
        const showHuidigValue = showHuidig;
        const showArchiefValue = showArchief;
        const arr = notes.filter((n: Note) => {
            const typeOk =
                n.type === "checklist_item" ? showChecksValue : showNotesValue;
            const isH =
                !n.closed && !(n.type === "checklist_item" ? n.checked : false);
            const isA =
                n.closed || (n.type === "checklist_item" ? n.checked : false);
            const stateOk =
                (showHuidigValue && isH) || (showArchiefValue && isA);
            return typeOk && stateOk;
        });
        arr.sort((a: any, b: any) => {
            const ai = (a as any).order_index ?? null;
            const bi = (b as any).order_index ?? null;
            if (ai !== null && bi !== null) return ai - bi;
            if (ai !== null) return -1;
            if (bi !== null) return 1;
            return (
                new Date((b as any).created_at).getTime() -
                new Date((a as any).created_at).getTime()
            );
        });
        return arr;
    });

    const canvasCount = $derived(canvasNotes.length);
    const totalPages = $derived(
        Math.max(1, Math.ceil(canvasNotes.length / PAGE_SIZE)),
    );
    const pageStartIndex = $derived((currentPage - 1) * PAGE_SIZE);
    const pageNotes = $derived(
        canvasNotes.slice(pageStartIndex, pageStartIndex + PAGE_SIZE),
    );
    const placeholderSlots = $derived(
        currentPage === 1 ? Math.max(0, PAGE_SIZE - pageNotes.length) : 0,
    );
    let availableTypes = $state<string[]>([]);
    let formModalOpen = $state(false);
    let editingNote = $state<Note | null>(null);
    let creatingType = $state<string | null>(null);
    let deleteModalOpen = $state(false);
    let deletingNote = $state<Note | null>(null);
    let deleting = $state(false);
    let previewOpen = $state(false);
    let previewNote = $state<Note | null>(null);

    // Clear preview note when modal closes (including backdrop clicks)
    $effect(() => {
        if (!previewOpen && previewNote) {
            previewNote = null;
        }
    });

    // Clear note_id from URL when form modal closes
    $effect(() => {
        if (!formModalOpen && mounted) {
            clearNoteIdFromUrl();
        }
    });

    // Clear note_id from URL when delete modal closes
    $effect(() => {
        if (!deleteModalOpen && mounted && !deleting) {
            clearNoteIdFromUrl();
        }
    });

    // Get source URL for notes
    const sourceUrl = $derived(() => {
        if (typeof window === "undefined") return "";
        return window.location.pathname + window.location.search;
    });

    // Auto-open modal when note_id is in URL
    $effect(() => {
        if (
            mounted &&
            !formModalOpen &&
            !editingNote &&
            !deleting &&
            !previewOpen
        ) {
            const noteId = selectedNoteId;
            if (noteId) {
                const note = notes.find((n) => n.id === noteId);
                if (note) {
                    editingNote = note;
                    formModalOpen = true;
                }
            }
        }
    });

    // Group notes by type
    const notesByType = $derived.by(() => {
        const grouped: Record<string, Note[]> = {};
        for (const note of notes) {
            if (!grouped[note.type]) {
                grouped[note.type] = [];
            }
            grouped[note.type].push(note);
        }
        // Sort notes within each type: order_index asc when present, fallback to created_at desc
        for (const type in grouped) {
            grouped[type].sort((a, b) => {
                const ai = (a as any).order_index ?? null;
                const bi = (b as any).order_index ?? null;
                if (ai !== null && bi !== null) {
                    return ai - bi;
                }
                if (ai !== null) return -1;
                if (bi !== null) return 1;
                return (
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                );
            });
        }
        return grouped;
    });

    // Get all unique types (default + custom), excluding reminder
    const allTypes = $derived.by(() => {
        const typeSet = new Set<string>();
        // Add default types, excluding reminder
        for (const type of DEFAULT_NOTE_TYPES) {
            if (type !== "reminder") {
                typeSet.add(type);
            }
        }
        // Add types from notes, excluding reminder
        for (const note of notes) {
            if (note.type !== "reminder") {
                typeSet.add(note.type);
            }
        }
        return Array.from(typeSet).sort();
    });

    // Separate checklist and notes for layout
    const checklistType = $derived(() => {
        return allTypes.find((type) => type === "checklist_item") || null;
    });

    const noteTypes = $derived(() => {
        return allTypes.filter((type) => type !== "checklist_item");
    });

    onMount(async () => {
        // Only set default filter states when explicitly on notities tab
        // When tab param is null/missing, we're on the default tab (not notities)
        const currentUrl = new URL($page.url);
        const tabParam = currentUrl.searchParams.get("tab");
        const isNotitiesTab = tabParam === "notities";

        let urlChanged = false;

        if (isNotitiesTab) {
            // Set default filter states on initial load (huidig=true, archief=false)
            if (!currentUrl.searchParams.has("huidig")) {
                currentUrl.searchParams.set("huidig", "true");
                urlChanged = true;
            }
            if (currentUrl.searchParams.get("archief") === "true") {
                currentUrl.searchParams.delete("archief");
                urlChanged = true;
            }
            if (!currentUrl.searchParams.has("checks")) {
                currentUrl.searchParams.set("checks", "true");
                urlChanged = true;
            }
            if (!currentUrl.searchParams.has("notes")) {
                currentUrl.searchParams.set("notes", "true");
                urlChanged = true;
            }
        } else {
            // On other tabs, remove these parameters to avoid confusion
            if (
                currentUrl.searchParams.has("huidig") ||
                currentUrl.searchParams.has("checks") ||
                currentUrl.searchParams.has("notes") ||
                currentUrl.searchParams.has("archief")
            ) {
                currentUrl.searchParams.delete("huidig");
                currentUrl.searchParams.delete("checks");
                currentUrl.searchParams.delete("notes");
                currentUrl.searchParams.delete("archief");
                urlChanged = true;
            }
        }

        if (urlChanged) {
            await goto(currentUrl.pathname + currentUrl.search, {
                replaceState: true,
                noScroll: true,
            });
        }

        await Promise.all([loadNotes(), loadUsers()]);
        mounted = true;
    });

    // Reload notes when filter states change (after initial mount)
    $effect(() => {
        if (mounted) {
            // Access all filter states to ensure reactivity
            const huidigState = showHuidig;
            const archiefState = showArchief;
            const checksState = showChecks;
            const notesState = showNotes;
            // Note: We don't need to reload notes from server, just ensure reactivity
            // The canvasNotes derived value will automatically update
        }
    });

    // Clean up URL when not on notities tab
    $effect(() => {
        (async () => {
            if (mounted && activeTab !== "notities") {
                const url = new URL($page.url);
                let urlChanged = false;

                // Remove these parameters when not on notities tab
                if (
                    url.searchParams.has("huidig") ||
                    url.searchParams.has("checks") ||
                    url.searchParams.has("notes") ||
                    url.searchParams.has("archief")
                ) {
                    url.searchParams.delete("huidig");
                    url.searchParams.delete("checks");
                    url.searchParams.delete("notes");
                    url.searchParams.delete("archief");
                    urlChanged = true;
                }

                if (urlChanged) {
                    await goto(url.pathname + url.search, {
                        replaceState: true,
                        noScroll: true,
                    });
                }
            }
        })();
    });

    async function loadNotes() {
        loading = true;
        try {
            // Load all notes (both active and archived) since we filter client-side
            const result = await noteService.getNotesByEntity(
                entityType,
                entityId,
                true,
            );
            if (result.success) {
                notes = result.value;
                // Update available types
                const typesResult = await noteService.getNoteTypes(
                    entityType,
                    entityId,
                );
                if (typesResult.success) {
                    availableTypes = typesResult.value;
                }
                await autoArchiveOldNotes();
            } else {
                toastStore.add(getUserMessage(result.error), "error");
                notes = [];
            }
        } catch (error) {
            console.error("Error loading notes:", error);
            toastStore.add("Fout bij laden van notities", "error");
            notes = [];
        } finally {
            loading = false;
        }

        async function autoArchiveOldNotes() {
            const now = Date.now();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const toArchive = notes.filter(
                (n) =>
                    n.type !== "checklist_item" &&
                    !n.closed &&
                    !!(n as any).created_at &&
                    new Date((n as any).created_at).getTime() <=
                        now - THIRTY_DAYS_MS,
            );
            if (toArchive.length === 0) return;
            for (const n of toArchive) {
                try {
                    const res = await noteService.closeNote(n.id);
                    if ((res as any)?.success !== false) {
                        n.closed = true;
                    }
                } catch {}
            }
        }
    }

    async function loadUsers() {
        try {
            const result = await pocketbaseService.getAllUsers();
            if (result.success) {
                const userMap = new Map<string, PocketBaseUser | null>();
                for (const user of result.value) {
                    userMap.set(user.id, user);
                }
                users = userMap;
            }
        } catch (error) {
            console.error("Error loading users:", error);
        }
    }

    async function handleCreateNote(data: CreateNoteInput) {
        const result = await noteService.createNote({
            ...data,
            source_url: sourceUrl(),
        });

        if (result.success) {
            toastStore.add("Notitie aangemaakt", "success");
            formModalOpen = false;
            editingNote = null;
            creatingType = null;
            await loadNotes();
            // Refresh checklist count if this is a checklist item
            if (data.type === "checklist_item") {
                checklistStore.refresh();
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    async function handleUpdateNote(data: CreateNoteInput) {
        if (!editingNote) return;

        const wasChecklistItem = editingNote.type === "checklist_item";
        const result = await noteService.updateNote(editingNote.id, {
            text: data.text,
            type: data.type,
            assignee_id: data.assignee_id,
            due_date: data.due_date,
            checked: data.checked,
        });

        if (result.success) {
            toastStore.add("Notitie bijgewerkt", "success");
            formModalOpen = false;
            editingNote = null;
            await loadNotes();
            // Refresh checklist count if this was or is now a checklist item
            if (wasChecklistItem || data.type === "checklist_item") {
                checklistStore.refresh();
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    async function handleFormSubmit(data: CreateNoteInput) {
        if (editingNote) {
            await handleUpdateNote(data);
        } else {
            await handleCreateNote(data);
        }
    }

    function handleEdit(note: Note) {
        editingNote = note;
        formModalOpen = true;
        const url = new URL($page.url);
        url.searchParams.set("note_id", String(note.id));
        goto(url.pathname + url.search, { replaceState: true, noScroll: true });
    }

    function handleDeleteClick(note: Note) {
        deletingNote = note;
        deleteModalOpen = true;
    }

    async function handleDeleteConfirm() {
        if (!deletingNote) return;

        const wasChecklistItem = deletingNote.type === "checklist_item";
        deleting = true;
        const result = await noteService.deleteNote(deletingNote.id);

        if (result.success) {
            toastStore.add("Notitie verwijderd", "success");
            deleteModalOpen = false;
            deletingNote = null;
            await loadNotes();
            // Refresh checklist count if this was a checklist item
            if (wasChecklistItem) {
                checklistStore.refresh();
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
        deleting = false;
    }

    async function handleToggleChecked(note: Note) {
        const result = await noteService.toggleNoteChecked(note.id);
        if (result.success) {
            await loadNotes();
            // Refresh checklist count if this is a checklist item
            if (note.type === "checklist_item") {
                checklistStore.refresh();
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    function handleCreateClick(type: string) {
        creatingType = type;
        editingNote = null;
        formModalOpen = true;
    }

    async function handleCloseNote(note: Note) {
        const result = await noteService.closeNote(note.id);
        if (result.success) {
            toastStore.add("Notitie gearchiveerd", "success");
            await loadNotes();
            // Refresh checklist count if this is a checklist item
            if (note.type === "checklist_item") {
                checklistStore.refresh();
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    async function handleReopenNote(note: Note) {
        const result = await noteService.reopenNote(note.id);
        if (result.success) {
            toastStore.add("Notitie heropend", "success");
            await loadNotes();
            // Refresh checklist count if this is a checklist item
            if (note.type === "checklist_item") {
                checklistStore.refresh();
            }
        } else {
            toastStore.add(getUserMessage(result.error), "error");
        }
    }

    async function clearNoteIdFromUrl() {
        const url = new URL($page.url);
        const hasNoteId = url.searchParams.has("note_id");

        if (hasNoteId) {
            url.searchParams.delete("note_id");
            await goto(url.pathname + url.search, {
                replaceState: true,
                noScroll: true,
            });
        }
    }
</script>

<div class="flex flex-col h-full">
    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Spinner size="lg" />
        </div>
    {:else}
        <!-- Unified Canvas: Checklist + Notes together -->
        <div class="flex-1 flex flex-col overflow-hidden w-full">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <h4
                        class="text-sm font-semibold text-zinc-900 font-aspekta"
                    >
                        Canvas
                    </h4>
                    <span
                        class="text-xs text-zinc-600 bg-white px-2 py-0.5 rounded-full"
                        >{canvasCount}</span
                    >
                </div>
                <div class="flex items-center gap-3">
                    <ButtonGroup size="sm" class="scale-90">
                        <Button
                            variant={showChecks ? "default" : "secondary"}
                            class="button-group-item text-xs px-2 py-1"
                            onclick={async () => {
                                const url = new URL($page.url);
                                const currentValue =
                                    url.searchParams.get("checks");
                                // Toggle: if null or 'true', set to 'false'; if 'false', set to 'true'
                                const newValue =
                                    currentValue === null ||
                                    currentValue === "true"
                                        ? "false"
                                        : "true";
                                url.searchParams.set("checks", newValue);
                                await goto(url.pathname + url.search, {
                                    replaceState: true,
                                    noScroll: true,
                                });
                            }}
                        >
                            Checks
                        </Button>
                        <Button
                            variant={showNotes ? "default" : "secondary"}
                            class="button-group-item text-xs px-2 py-1"
                            onclick={async () => {
                                const url = new URL($page.url);
                                const currentValue =
                                    url.searchParams.get("notes");
                                // Toggle: if null or 'true', set to 'false'; if 'false', set to 'true'
                                const newValue =
                                    currentValue === null ||
                                    currentValue === "true"
                                        ? "false"
                                        : "true";
                                url.searchParams.set("notes", newValue);
                                await goto(url.pathname + url.search, {
                                    replaceState: true,
                                    noScroll: true,
                                });
                            }}
                        >
                            Notes
                        </Button>
                    </ButtonGroup>
                    <ButtonGroup size="sm" class="scale-90">
                        <Button
                            variant={showHuidig ? "default" : "secondary"}
                            class="button-group-item text-xs px-2 py-1"
                            onclick={async () => {
                                const url = new URL($page.url);
                                const currentValue =
                                    url.searchParams.get("huidig");
                                // Toggle: if null or 'true', set to 'false'; if 'false', set to 'true'
                                const newValue =
                                    currentValue === null ||
                                    currentValue === "true"
                                        ? "false"
                                        : "true";
                                url.searchParams.set("huidig", newValue);
                                await goto(url.pathname + url.search, {
                                    replaceState: true,
                                    noScroll: true,
                                });
                            }}
                        >
                            Huidig
                        </Button>
                        <Button
                            variant={showArchief ? "default" : "secondary"}
                            class="button-group-item text-xs px-2 py-1"
                            onclick={async () => {
                                const url = new URL($page.url);
                                const currentValue =
                                    url.searchParams.get("archief");
                                // Toggle: if 'true', delete; otherwise set to 'true'
                                if (currentValue === "true") {
                                    url.searchParams.delete("archief");
                                } else {
                                    url.searchParams.set("archief", "true");
                                }
                                await goto(url.pathname + url.search, {
                                    replaceState: true,
                                    noScroll: true,
                                });
                            }}
                        >
                            Archief
                        </Button>
                    </ButtonGroup>
                    <IconButton
                        icon={Plus}
                        variant="ghost"
                        size="sm"
                        onclick={() => handleCreateClick("note")}
                        tooltip="Notitie toevoegen"
                    />
                </div>
            </div>

            <div class="w-full overflow-y-auto pb-2">
                <div class="grid grid-cols-5 gap-2" data-tasks>
                    {#each pageNotes as note (note.id)}
                        <div
                            role="button"
                            tabindex="0"
                            draggable="true"
                            data-note-id={note.id}
                            class="task draggable-task h-full flex flex-col equal-height-card"
                            class:drop-target={dropTargetId === note.id}
                            ondragstart={(e) => handleDragStart(e, note.id)}
                            ondragend={handleDragEnd}
                            ondragover={(e) => handleCardDragOver(e, note.id)}
                            ondragleave={handleCardDragLeave}
                            ondrop={(e) =>
                                handleDropOnCard(e, note.id, canvasNotes)}
                        >
                            <NoteCard
                                {note}
                                {users}
                                onedit={handleEdit}
                                ontoggle={handleToggleChecked}
                            />
                        </div>
                    {/each}
                    {#if currentPage === 1 && placeholderSlots > 0}
                        {#each Array(placeholderSlots) as _, idx}
                            <div
                                class="border-2 border-dashed border-zinc-300 rounded-lg min-h-[84px] bg-white flex items-center justify-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
                                class:drop-target={hoverPlaceholderIndex ===
                                    idx}
                                ondragover={(e) =>
                                    handlePlaceholderDragOver(e, idx)}
                                ondragleave={handlePlaceholderDragLeave}
                                ondrop={(e) =>
                                    handleDropOnPlaceholder(
                                        e,
                                        pageNotes.length + idx,
                                    )}
                                onclick={idx === 0
                                    ? () => handleCreateClick("note")
                                    : undefined}
                                role={idx === 0 ? "button" : undefined}
                                tabindex={idx === 0 ? 0 : undefined}
                                onkeydown={idx === 0
                                    ? (e) => {
                                          if (
                                              e.key === "Enter" ||
                                              e.key === " "
                                          ) {
                                              e.preventDefault();
                                              handleCreateClick("note");
                                          }
                                      }
                                    : undefined}
                            >
                                {#if idx === 0}
                                    <Plus class="w-6 h-6 text-zinc-400" />
                                {/if}
                            </div>
                        {/each}
                    {/if}
                </div>
                {#if totalPages > 1}
                    <div class="mt-4">
                        <Pagination
                            {currentPage}
                            totalItems={canvasNotes.length}
                            itemsPerPage={PAGE_SIZE}
                            onPageChange={(page) => {
                                currentPage = page;
                            }}
                        />
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<!-- Preview Note Modal -->
<Modal
    bind:open={previewOpen}
    title={previewNote && previewNote.type === "checklist_item"
        ? "Check"
        : "Notitie"}
    size="sm"
    closeOnBackdropClick={true}
>
    {#if previewNote}
        <div class="space-y-3">
            <p class="text-sm text-zinc-900 whitespace-pre-wrap break-words">
                {previewNote.text}
            </p>
            <div class="flex items-center justify-end gap-2">
                {#if previewNote && previewNote.type !== "checklist_item" && !previewNote.closed}
                    <IconButton
                        icon={Archive}
                        variant="ghost"
                        size="sm"
                        onclick={() => {
                            const n = previewNote;
                            if (n) {
                                previewOpen = false;
                                handleCloseNote(n);
                            }
                        }}
                        tooltip="Markeren als gelezen"
                    />
                {/if}
                <IconButton
                    icon={Edit2}
                    variant="ghost"
                    size="sm"
                    onclick={() => {
                        const n = previewNote;
                        if (n) {
                            previewOpen = false;
                            handleEdit(n);
                        }
                    }}
                    tooltip="Bewerken"
                />
                <IconButton
                    icon={Trash2}
                    variant="danger"
                    size="sm"
                    onclick={() => {
                        const n = previewNote;
                        if (n) {
                            previewOpen = false;
                            handleDeleteClick(n);
                        }
                    }}
                    tooltip="Verwijderen"
                />
            </div>
        </div>
    {/if}
</Modal>

<!-- Create/Edit Note Modal -->
<Modal
    bind:open={formModalOpen}
    title={editingNote ? "Notitie bewerken" : "Nieuwe notitie"}
    size="custom"
    customWidth="960px"
    maxContentHeight="80vh"
    closeOnBackdropClick={false}
    ondelete={editingNote
        ? () => handleDeleteClick(editingNote as Note)
        : undefined}
>
    <NoteForm
        note={editingNote}
        entity={entityType}
        {entityId}
        availableTypes={allTypes}
        defaultType={creatingType || "note"}
        onsubmit={handleFormSubmit}
        oncancel={() => {
            formModalOpen = false;
            editingNote = null;
            creatingType = null;
        }}
    />
</Modal>

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="Notitie verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deleting}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u deze notitie wilt verwijderen?
        </p>
        <p class="text-sm text-zinc-500">
            Deze actie kan niet ongedaan worden gemaakt.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={() => {
                    deleteModalOpen = false;
                    deletingNote = null;
                }}
                disabled={deleting}
            >
                Annuleren
            </Button>
            <button
                onclick={handleDeleteConfirm}
                disabled={deleting}
                class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {deleting ? "Verwijderen..." : "Verwijderen"}
            </button>
        </div>
    </div>
</Modal>

<style>
    :global(.drop-target) {
        border: 4px solid rgb(234 88 12) !important;
        border-radius: 0.5rem !important;
        background-color: rgb(255 237 213) !important;
        box-shadow:
            0 0 0 2px rgb(234 88 12),
            inset 0 0 0 1px rgb(249 115 22) !important;
    }

    :global(.equal-height-card) {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    :global(.equal-height-card .text-sm) {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    :global(.equal-height-card .text-sm p) {
        flex: 1;
    }

    .grid {
        align-items: start;
    }

    .grid > div {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
</style>
