<script lang="ts">
    import type { UnifiedPlanningItem } from "$lib/services/taskService";
    import UserAvatar from "./UserAvatar.svelte";
    import ButtonGroup from "./ButtonGroup.svelte";
    import Button from "./Button.svelte";
    import Label from "./Label.svelte";
    import Tooltip from "./Tooltip.svelte";
    import { getUserForAttribution } from "$lib/utils/userUtils";
    import type { PocketBaseUser } from "$lib/services/pocketbaseService";
    import {
        Calendar,
        Clock,
        TriangleAlert,
        SquarePen,
        CheckCircle2,
        Lock,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import * as taskService from "$lib/services/taskService";
    import * as caseService from "$lib/services/caseService";
    import * as noteService from "$lib/services/noteService";
    import { toastStore } from "$lib/stores/toastStore";
    import { getUserMessage } from "$lib/types/errors";
    import confetti from "canvas-confetti";
    import { untrack } from "svelte";

    /**
     * WorkItemCard component props
     *
     * Card component for displaying work items and case tasks in kanban board.
     */
    interface Props {
        /**
         * Unified planning item (work item or case task) data to display
         */
        workItem: UnifiedPlanningItem;

        /**
         * Whether the card is draggable
         * @default true
         */
        draggable?: boolean;

        /**
         * Click handler for the card
         */
        onclick?: (workItem: UnifiedPlanningItem) => void;

        /**
         * Click handler for the edit icon button
         * If not provided, defaults to opening the quick edit drawer
         */
        oneditclick?: (workItem: UnifiedPlanningItem) => void;

        /**
         * Callback fired when work item is deleted
         * Use this to refresh the parent's work item list
         */
        ondelete?: (workItem: UnifiedPlanningItem) => void;

        /**
         * Whether to show status buttons (Gepland/Ad-hoc)
         * @default false
         */
        showStatusButtons?: boolean;

        /**
         * Callback fired when status button is clicked
         */
        onstatuschange?: (status: "gepland" | "ad-hoc") => void;

        /**
         * Whether the card is disabled (read-only, no interaction allowed)
         * @default false
         */
        disabled?: boolean;

        /**
         * Optional map of user ID to user data for efficient lookups
         * If provided, will use this instead of making API calls
         */
        userMap?: Map<string, PocketBaseUser>;

        /**
         * Additional CSS classes
         */
        class?: string;
    }

    let {
        workItem,
        draggable = true,
        onclick,
        oneditclick,
        ondelete,
        showStatusButtons = false,
        onstatuschange,
        disabled = false,
        userMap,
        class: className = "",
    }: Props = $props();

    let assignees = $state<PocketBaseUser[]>([]);
    let loadingAssignees = $state(false);
    let checklistCount = $state<{ checked: number; total: number } | null>(
        null,
    );
    let loadingChecklist = $state(false);

    // Get user IDs (assignee_id array for work items, owner_id/assignee_id for case tasks)
    const userIds = $derived.by(() => {
        if (workItem.type === "work_item") {
            // For work items, assignee_id should be an array
            if (Array.isArray(workItem.assignee_id)) {
                // Filter out empty strings, null, undefined
                return workItem.assignee_id.filter(
                    (id) => id && typeof id === "string" && id.trim() !== "",
                );
            } else if (
                workItem.assignee_id &&
                typeof workItem.assignee_id === "string" &&
                workItem.assignee_id.trim() !== ""
            ) {
                // Backward compatibility: single string value
                return [workItem.assignee_id];
            }
            return [];
        } else {
            // Case tasks: use owner_id or assignee_id (backward compatibility)
            const ownerId = workItem.owner_id;
            const assigneeId = (workItem as any).assignee_id;
            if (Array.isArray(assigneeId)) {
                // Filter out empty strings, null, undefined
                return assigneeId.filter(
                    (id) => id && typeof id === "string" && id.trim() !== "",
                );
            } else if (
                assigneeId &&
                typeof assigneeId === "string" &&
                assigneeId.trim() !== ""
            ) {
                return [assigneeId];
            } else if (
                ownerId &&
                typeof ownerId === "string" &&
                ownerId.trim() !== ""
            ) {
                return [ownerId];
            }
            return [];
        }
    });

    // Track previous userIds to prevent unnecessary re-runs
    // Use regular variable (not $state) since we only read it, don't need reactivity
    let previousUserIdsString = "";

    // Use $derived when userMap is available (no side effects, more efficient)
    // According to Context7: use $derived for computed values, $effect only for side effects
    const assigneesFromMap = $derived.by(() => {
        if (!userMap || userIds.length === 0) {
            return null; // Signal that we need to fetch from API
        }

        const loadedAssignees: PocketBaseUser[] = [];
        for (const userId of userIds) {
            const user = userMap.get(userId);
            if (user) {
                loadedAssignees.push(user);
            }
        }

        // Commented out: verbose WorkItemCard success logs (keep errors)
        // if (import.meta.env.DEV && loadedAssignees.length > 0) {
        // 	const itemType = workItem.type;
        // 	const itemId = workItem.id;
        // 	console.log('[WorkItemCard] Using userMap for', itemType, itemId, 'users:', loadedAssignees.length);
        // }

        return loadedAssignees;
    });

    // Use assignees from map if available (synchronous, no API call)
    // Only use $effect for API fetching when userMap is NOT available
    $effect(() => {
        // If userMap provides assignees, use them directly (no API call needed)
        const mapAssignees = assigneesFromMap;
        if (mapAssignees !== null) {
            assignees = mapAssignees;
            loadingAssignees = false;
            return; // Skip API fetch
        }

        // userMap not available - fetch from API (side effect)
        // Create stable string representation of userIds
        const userIdsString = userIds.slice().sort().join(",");

        // Read previous value without creating reactive dependency
        const previous = untrack(() => previousUserIdsString);
        const currentAssignees = untrack(() => assignees);

        // Skip if userIds haven't actually changed
        if (userIdsString === previous && currentAssignees.length > 0) {
            return;
        }

        previousUserIdsString = userIdsString;
        let cancelled = false;

        if (userIds.length > 0) {
            // Fetch from API (userMap not available)
            if (import.meta.env.DEV) {
                const itemType = workItem.type;
                const itemId = workItem.id;
                const userIdsArray = Array.from(userIds);
                console.log(
                    "[WorkItemCard] Loading users for",
                    itemType,
                    itemId,
                    "user_ids:",
                    userIdsArray,
                );
            }
            loadingAssignees = true;
            Promise.all(userIds.map((id) => getUserForAttribution(id)))
                .then((users) => {
                    // Only update if effect hasn't been cancelled
                    if (!cancelled) {
                        if (import.meta.env.DEV) {
                            console.log(
                                "[WorkItemCard] Users loaded:",
                                users.filter((u) => u).length,
                            );
                        }
                        assignees = users.filter(
                            (u) => u !== null,
                        ) as PocketBaseUser[];
                        loadingAssignees = false;
                    }
                })
                .catch((error) => {
                    // Ignore cancellation errors (expected when effect runs again)
                    const errorMessage =
                        error?.message || error?.toString() || "";
                    const isCancelled =
                        errorMessage.includes("autocancelled") ||
                        errorMessage.includes("aborted") ||
                        errorMessage.includes("signal is aborted");

                    if (isCancelled) {
                        if (import.meta.env.DEV) {
                            console.log(
                                "[WorkItemCard] Request cancelled (expected)",
                            );
                        }
                        return;
                    }

                    // Only update if effect hasn't been cancelled
                    if (!cancelled) {
                        console.error(
                            "[WorkItemCard] Error loading users:",
                            error,
                        );
                        assignees = [];
                        loadingAssignees = false;
                    }
                });
        } else {
            assignees = [];
            loadingAssignees = false;
        }

        // Cleanup function: mark as cancelled when effect runs again
        return () => {
            cancelled = true;
        };
    });

    // Load checklist items count for this work item
    $effect(() => {
        // Track workItem.id and type to make effect reactive
        const itemId = workItem.id;
        const itemType = workItem.type;
        let cancelled = false;

        // Only load for work items (not case tasks)
        if (itemType !== "work_item") {
            checklistCount = null;
            return;
        }

        // Reset state for this item
        checklistCount = null;

        async function loadChecklistCount() {
            if (cancelled) return;

            loadingChecklist = true;
            try {
                // Get all checklist items for this task
                const result = await noteService.getNotesByType(
                    "task",
                    itemId,
                    "checklist_item",
                    true,
                );

                if (cancelled) return;

                if (result.success) {
                    const checklistItems = result.value;
                    const checked = checklistItems.filter(
                        (item) => item.checked,
                    ).length;
                    const total = checklistItems.length;

                    if (total > 0) {
                        checklistCount = { checked, total };
                        if (import.meta.env.DEV) {
                            console.log(
                                "[WorkItemCard] Loaded checklist count for task",
                                itemId,
                                ":",
                                checked,
                                "/",
                                total,
                            );
                        }
                    } else {
                        checklistCount = null;
                    }
                } else {
                    checklistCount = null;
                    if (import.meta.env.DEV) {
                        console.error(
                            "[WorkItemCard] Error loading checklist for task",
                            itemId,
                            ":",
                            result.error,
                        );
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "[WorkItemCard] Error loading checklist count for task",
                        itemId,
                        ":",
                        error,
                    );
                    checklistCount = null;
                }
            } finally {
                if (!cancelled) {
                    loadingChecklist = false;
                }
            }
        }

        // Load immediately
        loadChecklistCount();

        return () => {
            cancelled = true;
        };
    });

    function formatDate(dateString: string | null | undefined): string {
        if (!dateString) return "Geen datum";
        const date = new Date(dateString);
        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
        });
    }

    // Get date to display (due_date for work items, deadline for case tasks)
    const displayDate = $derived(
        workItem.type === "work_item" ? workItem.due_date : workItem.deadline,
    );

    // Check if deadline is today (same day, not completed)
    const isToday = $derived.by(() => {
        if (!displayDate || workItem.kanban_status === "afgerond") return false;
        const deadline = new Date(displayDate);
        const now = new Date();

        // Compare year, month, and day only (ignore time)
        const deadlineDate = new Date(
            deadline.getFullYear(),
            deadline.getMonth(),
            deadline.getDate(),
        );
        const todayDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );

        return deadlineDate.getTime() === todayDate.getTime();
    });

    // Check if item is overdue (deadline date is BEFORE today AND kanban_status !== 'afgerond')
    // Note: Items due today are NOT overdue - they show in orange instead
    const isOverdue = $derived.by(() => {
        if (!displayDate || isToday || workItem.kanban_status === "afgerond")
            return false;
        const deadline = new Date(displayDate);
        const now = new Date();

        // Compare year, month, and day only (ignore time)
        const deadlineDate = new Date(
            deadline.getFullYear(),
            deadline.getMonth(),
            deadline.getDate(),
        );
        const todayDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );

        // Item is overdue if deadline date is before today (not including today)
        return deadlineDate.getTime() < todayDate.getTime();
    });

    // Check if item is "planbaar" (has assignee_id/owner_id, deadline/due_date, and uren)
    const isPlanbaar = $derived.by(() => {
        // Check for assignee: userIds must have at least one valid (non-empty) user ID
        const hasAssignee =
            userIds.length > 0 && userIds.some((id) => id && id.trim() !== "");
        // Check for deadline/due_date: must have a valid date
        const hasDeadline = !!(workItem.deadline || workItem.due_date);
        // Check for hours: must have a valid number > 0
        const hasUren = !!(workItem.uren && workItem.uren > 0);
        return hasAssignee && hasDeadline && hasUren;
    });

    // Check if user can interact with this item (based on project access)
    const canInteract = $derived(workItem.canInteract !== false && !disabled);

    // Check if this is a help-type card
    const isHelpType = $derived(workItem.task_type === "help");

    // Check if date is outside the current week
    const isOutsideCurrentWeek = $derived.by(() => {
        if (!displayDate) return false;

        // Only show warning for items on the kanban (not in backlog)
        if (!workItem.kanban_status || workItem.kanban_status === "backlog")
            return false;

        const itemDate = new Date(displayDate);
        const now = new Date();

        // Get start of week (Monday)
        const startOfWeek = new Date(now);
        const dayOfWeek = startOfWeek.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, otherwise go to Monday
        startOfWeek.setDate(now.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // Get end of week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Check if itemDate is outside the current week
        return itemDate < startOfWeek || itemDate > endOfWeek;
    });

    function handleClick() {
        if (onclick) {
            onclick(workItem);
        }
    }

    async function handleEditClick(event: MouseEvent) {
        event.stopPropagation(); // Prevent card click from firing

        // Use custom handler if provided
        if (oneditclick) {
            oneditclick(workItem);
            return;
        }

        // Default behavior: open quick edit drawer
        const urlParams = new URLSearchParams($page.url.searchParams);
        if (workItem.type === "work_item") {
            urlParams.set("drawer", "workitem");
            urlParams.set("workItemId", String(workItem.id));
        } else if (workItem.type === "case_task") {
            urlParams.set("drawer", "casetask");
            urlParams.set("caseTaskId", String(workItem.id));
        }
        await goto(`?${urlParams.toString()}`, { noScroll: true });
    }

    let closingTask = $state(false);
    let pendingStatus = $state<"gepland" | "ad-hoc" | null>(null);

    // Clear pending status when workItem status actually changes
    $effect(() => {
        if (pendingStatus && workItem.status === pendingStatus) {
            // Status has been updated, clear pending
            pendingStatus = null;
        }
    });

    async function handleStatusChange(status: "gepland" | "ad-hoc") {
        // Set pending status to show orange feedback
        pendingStatus = status;

        // After a short delay, call the actual status change
        setTimeout(() => {
            if (onstatuschange) {
                onstatuschange(status);
            }
        }, 500);
    }

    async function handleCloseTask(event: MouseEvent) {
        event.stopPropagation(); // Prevent card click from firing

        if (closingTask) return;

        closingTask = true;

        try {
            // Get button position for confetti origin
            const button = event.currentTarget as HTMLButtonElement;
            const rect = button.getBoundingClientRect();

            // Calculate origin relative to viewport
            const originX = (rect.left + rect.width / 2) / window.innerWidth;
            const originY = (rect.top + rect.height / 2) / window.innerHeight;

            // Close the task based on type
            let result;
            if (workItem.type === "work_item") {
                result = await taskService.closeWorkItem(workItem.id);
            } else {
                result = await caseService.updateCaseTask(workItem.id, {
                    closed: true,
                });
            }

            if (result.success) {
                // Trigger confetti blasting to the left! 🎉
                confetti({
                    particleCount: 100,
                    angle: 180, // Point left
                    spread: 55,
                    origin: { x: originX, y: originY },
                    startVelocity: 45,
                    gravity: 0.8,
                    ticks: 200,
                    colors: [
                        "#10b981",
                        "#34d399",
                        "#6ee7b7",
                        "#a7f3d0",
                        "#d1fae5",
                    ],
                });

                // Call ondelete to refresh the list (this will hide the closed task)
                if (ondelete) {
                    ondelete(workItem);
                }

                toastStore.add("Taak afgesloten! 🎉", "success");
            } else {
                toastStore.add(getUserMessage(result.error), "error");
            }
        } finally {
            closingTask = false;
        }
    }
</script>

<div
    class="rounded-lg shadow-xs border transition-all relative group overflow-hidden flex flex-col h-full {className}"
    class:border-zinc-200={!isPlanbaar &&
        canInteract &&
        workItem.status !== "ad-hoc"}
    class:border-green-200={isPlanbaar &&
        canInteract &&
        workItem.status !== "ad-hoc"}
    class:border-red-200={canInteract && workItem.status === "ad-hoc"}
    class:border-zinc-300={!canInteract}
    class:hover:border-zinc-300={!isPlanbaar &&
        canInteract &&
        workItem.status !== "ad-hoc"}
    class:hover:border-green-300={isPlanbaar &&
        canInteract &&
        workItem.status !== "ad-hoc"}
    class:hover:border-red-300={canInteract && workItem.status === "ad-hoc"}
    class:hover:shadow-sm={canInteract}
    style="transition-property: box-shadow, border-color, border-radius;"
    class:opacity-60={!canInteract}
    class:cursor-not-allowed={!canInteract}
    class:bg-white={assignees.length > 0 || loadingAssignees}
    class:bg-zinc-50={assignees.length === 0 && !loadingAssignees}
    class:cursor-pointer={!draggable && onclick && canInteract}
    role={draggable
        ? "button"
        : !draggable && onclick && canInteract
          ? "button"
          : undefined}
    {...draggable
        ? { tabindex: -1 }
        : !draggable && onclick && canInteract
          ? { tabindex: 0 }
          : {}}
    onclick={canInteract ? handleClick : undefined}
    onkeydown={(e) => {
        if (
            (e.key === "Enter" || e.key === " ") &&
            !draggable &&
            onclick &&
            canInteract
        ) {
            e.preventDefault();
            handleClick();
        }
    }}
>
    {#if !canInteract}
        <!-- Lock icon for disabled items (private project) -->
        <div
            class="absolute top-2 right-2 z-10"
            aria-label="Private project - no access"
        >
            <Tooltip text="Private project - no access" position="left">
                <Lock size={16} class="text-zinc-400" />
            </Tooltip>
        </div>
    {:else}
        <!-- Status indicator dot (top-right) -->
        <div
            class="absolute top-2 right-2 w-3 h-3 rounded-full z-10 transition-opacity group-hover:opacity-0"
            class:bg-red-500={workItem.status === "ad-hoc" && !isHelpType}
            class:bg-orange-500={workItem.status !== "ad-hoc" &&
                workItem.type === "case_task" &&
                !isHelpType}
            class:bg-zinc-900={workItem.status !== "ad-hoc" &&
                workItem.type === "work_item" &&
                !isHelpType}
            style={isHelpType && canInteract
                ? "background-color: #59A3FF;"
                : ""}
            aria-label={workItem.status === "ad-hoc"
                ? "Ad-hoc"
                : isHelpType
                  ? "Help"
                  : workItem.type === "case_task"
                    ? "Case task"
                    : "Work item"}
        ></div>

        <!-- Edit icon button (appears on hover, overlaps status dot) -->
        <button
            type="button"
            class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            onclick={handleEditClick}
            aria-label="Bewerken"
        >
            <SquarePen
                size={16}
                class={isHelpType && canInteract
                    ? ""
                    : workItem.status === "ad-hoc"
                      ? "text-red-500"
                      : workItem.type === "case_task"
                        ? "text-orange-500"
                        : "text-zinc-900"}
                style={isHelpType && canInteract ? "color: #59A3FF;" : ""}
            />
        </button>
    {/if}

    <div
        {draggable}
        role={draggable ? "button" : undefined}
        ondragstart={(e) => {
            if (draggable) {
                e.dataTransfer?.setData(
                    "text/plain",
                    JSON.stringify({ type: workItem.type, id: workItem.id }),
                );
                e.dataTransfer!.effectAllowed = "move";
            }
        }}
        class="p-3 flex flex-col flex-grow"
    >
        <!-- Title with avatars in front -->
        <div class="flex items-start gap-2 mb-2">
            {#if assignees.length > 0}
                <div class="flex-shrink-0 flex items-center">
                    {#if assignees.length > 1}
                        <!-- Show "1+" when multiple assignees -->
                        <div
                            class="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs text-zinc-600 font-medium border-2 border-white"
                        >
                            1+
                        </div>
                    {:else}
                        <!-- Show single avatar when only one assignee -->
                        <div class="relative">
                            <UserAvatar
                                user={assignees[0]}
                                size="sm"
                                showName={false}
                                isAdHoc={workItem.status === "ad-hoc"}
                            />
                        </div>
                    {/if}
                </div>
            {:else if loadingAssignees}
                <div
                    class="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center"
                >
                    <div class="text-xs text-zinc-400">...</div>
                </div>
            {:else}
                <div
                    class="flex-shrink-0 w-6 h-6 rounded-full border border-red-500 bg-zinc-200 flex items-center justify-center text-zinc-700 text-xs font-medium"
                >
                    X
                </div>
            {/if}
            <h4
                class="text-sm font-semibold text-zinc-900 line-clamp-2 flex-1 pr-8"
            >
                {#if workItem.type === "case_task" && workItem.case_name}
                    <span class="text-zinc-600 font-normal"
                        >{workItem.case_name} &rarr;
                    </span>
                {/if}
                {workItem.subject || "Geen titel"}
            </h4>
        </div>

        <!-- Date/Hours and Status Buttons on same row -->
        <div class="flex items-center justify-between gap-2 mb-2">
            <!-- Left side: Dates, hours, Planbaar label, and Checklist count -->
            <div
                class="flex items-center gap-2 text-xs text-zinc-600 flex-wrap"
            >
                {#if displayDate}
                    <div class="flex items-center gap-1">
                        <Calendar size={12} />
                        <span
                            class:font-bold={isOverdue || isToday}
                            class:text-red-600={isOverdue}
                            style={isToday ? "color: #FFA100;" : ""}
                        >
                            {formatDate(displayDate)}
                        </span>
                    </div>
                {/if}
                {#if workItem.uren}
                    <div class="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{workItem.uren}u</span>
                    </div>
                {/if}
                {#if isPlanbaar}
                    <Label
                        variant="success"
                        class="rounded-full text-[8px] px-0.5 py-[1px]"
                        >OK</Label
                    >
                {/if}
                {#if checklistCount && checklistCount.total > 0}
                    {@const isIncomplete =
                        workItem.kanban_status === "afgerond" &&
                        checklistCount.checked !== checklistCount.total}
                    <Tooltip
                        text="{checklistCount.checked} van {checklistCount.total} checklist items afgerond"
                        position="left"
                    >
                        <span
                            class="cursor-help {isIncomplete
                                ? 'font-bold text-red-600 border border-red-600 rounded px-1.5 py-0.5'
                                : 'text-zinc-600'}"
                        >
                            {checklistCount.checked}/{checklistCount.total}
                        </span>
                    </Tooltip>
                {/if}
            </div>

            <!-- Right side: Status Buttons -->
            <div class="flex items-center gap-2">
                {#if showStatusButtons && onstatuschange && workItem.kanban_status === "backlog" && isPlanbaar}
                    {@const geplandPending = pendingStatus === "gepland"}
                    {@const adhocPending = pendingStatus === "ad-hoc"}
                    <div
                        class="flex justify-start"
                        role="presentation"
                        onclick={(e) => e.stopPropagation()}
                    >
                        <ButtonGroup>
                            <Button
                                type="button"
                                variant={geplandPending
                                    ? "default"
                                    : workItem.status === "gepland"
                                      ? "default"
                                      : "secondary"}
                                size="sm"
                                class="button-group-item text-xs transition-colors {geplandPending
                                    ? '!bg-orange-500 hover:!bg-orange-600 !text-white'
                                    : ''}"
                                onclick={() => handleStatusChange("gepland")}
                            >
                                Gepland
                            </Button>
                            <Button
                                type="button"
                                variant={adhocPending
                                    ? "default"
                                    : workItem.status === "ad-hoc"
                                      ? "default"
                                      : "secondary"}
                                size="sm"
                                class="button-group-item text-xs transition-colors {adhocPending
                                    ? '!bg-orange-500 hover:!bg-orange-600 !text-white'
                                    : ''}"
                                onclick={() => handleStatusChange("ad-hoc")}
                            >
                                Ad-hoc
                            </Button>
                        </ButtonGroup>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Close button for completed tasks (afgerond status) -->
    {#if workItem.kanban_status === "afgerond" && canInteract}
        <Tooltip text="Taak afsluiten" position="right">
            <button
                type="button"
                class="absolute bottom-2 right-2 z-10 transition-all hover:scale-110"
                class:text-green-500={!closingTask}
                class:text-zinc-400={closingTask}
                class:opacity-50={closingTask}
                onclick={handleCloseTask}
                disabled={closingTask}
                aria-label="Taak afsluiten"
            >
                <CheckCircle2 size={20} />
            </button>
        </Tooltip>
    {:else if isOutsideCurrentWeek && canInteract}
        <!-- Warning indicator for dates outside current week (bottom-right) -->
        <Tooltip
            text="Datum buiten deze week"
            position="left"
            class="absolute bottom-2 right-2 text-zinc-400 z-10 !cursor-help"
        >
            <TriangleAlert size={16} />
        </Tooltip>
    {/if}
</div>
