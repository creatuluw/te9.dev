<script lang="ts">
    import type { ComponentType } from "svelte";
    import IconButton from "./IconButton.svelte";
    import { Plus } from "lucide-svelte";

    /**
     * Speed dial position on screen
     */
    type SpeedDialPosition =
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
        | "top-center"
        | "bottom-center"
        | "left-center"
        | "right-center";

    /**
     * Speed dial menu alignment
     */
    type SpeedDialAlignment = "vertical" | "horizontal";

    /**
     * Speed dial trigger type
     */
    type SpeedDialTrigger = "hover" | "click";

    /**
     * Tooltip position type
     */
    type TooltipPos = "top" | "bottom" | "left" | "right";

    /**
     * Speed dial item interface
     *
     * @example
     * ```typescript
     * const item: SpeedDialItem = {
     *   icon: Plus,
     *   label: 'Add',
     *   onclick: () => handleAdd(),
     *   variant: 'primary'
     * };
     * ```
     */
    export interface SpeedDialItem {
        /**
         * Icon component for the item
         */
        icon: ComponentType;

        /**
         * Tooltip label for the item
         */
        label: string;

        /**
         * Click handler for the item
         * @param event - Mouse event
         */
        onclick?: (event: MouseEvent) => void;

        /**
         * Button variant color
         * @default 'default'
         */
        variant?: "default" | "primary" | "success" | "danger";
    }

    /**
     * SpeedDial component props
     *
     * Floating action button with expandable menu of actions.
     */
    interface Props {
        /**
         * Array of speed dial menu items
         * @example
         * ```typescript
         * <SpeedDial
         *   items={[
         *     { icon: Plus, label: 'Add Case', onclick: () => addCase() },
         *     { icon: Edit, label: 'Edit', onclick: () => edit() }
         *   ]}
         * />
         * ```
         */
        items: SpeedDialItem[];

        /**
         * Position of the speed dial on screen
         * @default 'bottom-right'
         */
        position?: SpeedDialPosition;

        /**
         * Alignment of menu items (vertical or horizontal)
         * @default 'vertical'
         */
        alignment?: SpeedDialAlignment;

        /**
         * Trigger type: hover or click to open
         * @default 'click'
         */
        trigger?: SpeedDialTrigger;

        /**
         * Custom trigger button icon (defaults to Plus)
         */
        triggerIcon?: ComponentType;

        /**
         * Trigger button size
         * @default 'default'
         */
        size?: "default" | "sm" | "lg";

        /**
         * Trigger button variant color
         * @default 'primary'
         */
        triggerVariant?: "default" | "primary" | "success" | "danger";

        /**
         * Positioning type: fixed (viewport) or absolute (container)
         * @default 'fixed'
         */
        positioning?: "fixed" | "absolute";

        /**
         * Additional CSS classes
         */
        class?: string;
    }

    let {
        items,
        position = "bottom-right",
        alignment = "vertical",
        trigger = "click",
        triggerIcon,
        size = "default",
        triggerVariant = "primary",
        positioning = "fixed",
        class: className = "",
    }: Props = $props();

    let isOpen = $state(false);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let containerElement: HTMLElement | null = $state(null);
    let menuElement: HTMLElement | null = $state(null);
    let triggerElement: HTMLElement | null = $state(null);

    function toggle() {
        isOpen = !isOpen;
    }

    function show() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        isOpen = true;
    }

    function hide() {
        timeoutId = setTimeout(() => {
            isOpen = false;
            timeoutId = null;
        }, 150);
    }

    function handleItemClick(item: SpeedDialItem, event: MouseEvent) {
        if (item.onclick) {
            item.onclick(event);
        }
        if (trigger === "click") {
            isOpen = false;
        }
    }

    /**
     * Calculate available space for tooltip positioning
     * Returns estimated space in pixels for each direction
     */
    function getAvailableSpace(element: HTMLElement): {
        top: number;
        bottom: number;
        left: number;
        right: number;
    } {
        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        return {
            top: rect.top,
            bottom: viewportHeight - rect.bottom,
            left: rect.left,
            right: viewportWidth - rect.right,
        };
    }

    /**
     * Smart tooltip position for menu items
     * Determines best position based on alignment, speed dial position, and available space
     */
    function getItemTooltipPosition(element: HTMLElement | null): TooltipPos {
        if (!element) {
            // Fallback to intelligent default based on configuration
            return getDefaultItemTooltipPosition();
        }

        const space = getAvailableSpace(element);
        const align = effectiveAlignment();
        const minSpace = 120; // Minimum space needed for tooltip (approx 100px tooltip + 20px padding)

        // For horizontal alignment: check left/right space
        if (align === "horizontal") {
            // Right side positions (items expand left) → prefer left tooltip, fallback to right
            if (
                position === "top-right" ||
                position === "bottom-right" ||
                position === "right-center"
            ) {
                if (space.left >= minSpace) {
                    return "left";
                }
                if (space.right >= minSpace) {
                    return "right";
                }
                // If neither side has space, prefer left (away from edge)
                return "left";
            }
            // Left side positions (items expand right) → prefer right tooltip, fallback to left
            if (
                position === "top-left" ||
                position === "bottom-left" ||
                position === "left-center"
            ) {
                if (space.right >= minSpace) {
                    return "right";
                }
                if (space.left >= minSpace) {
                    return "left";
                }
                // If neither side has space, prefer right (away from edge)
                return "right";
            }
        }

        // For vertical alignment: check top/bottom space
        if (align === "vertical") {
            // Top positions (items expand down) → prefer bottom tooltip, fallback to top
            if (
                position === "top-left" ||
                position === "top-right" ||
                position === "top-center"
            ) {
                if (space.bottom >= minSpace) {
                    return "bottom";
                }
                if (space.top >= minSpace) {
                    return "top";
                }
                // If neither side has space, prefer bottom (away from edge)
                return "bottom";
            }
            // Bottom positions (items expand up) → prefer top tooltip, fallback to bottom
            if (
                position === "bottom-left" ||
                position === "bottom-right" ||
                position === "bottom-center"
            ) {
                if (space.top >= minSpace) {
                    return "top";
                }
                if (space.bottom >= minSpace) {
                    return "bottom";
                }
                // If neither side has space, prefer top (away from edge)
                return "top";
            }
            // Center positions (items expand down) → prefer bottom tooltip, fallback to top
            if (position === "left-center" || position === "right-center") {
                if (space.bottom >= minSpace) {
                    return "bottom";
                }
                if (space.top >= minSpace) {
                    return "top";
                }
                return "bottom";
            }
        }

        // Fallback to default
        return getDefaultItemTooltipPosition();
    }

    /**
     * Default tooltip position for menu items based on configuration
     * Used as fallback when element is not available
     */
    function getDefaultItemTooltipPosition(): TooltipPos {
        const align = effectiveAlignment();

        if (align === "horizontal") {
            // Right side positions → tooltip on left (away from screen edge)
            if (
                position === "top-right" ||
                position === "bottom-right" ||
                position === "right-center"
            ) {
                return "left";
            }
            // Left side positions → tooltip on right (away from screen edge)
            if (
                position === "top-left" ||
                position === "bottom-left" ||
                position === "left-center"
            ) {
                return "right";
            }
        }

        if (align === "vertical") {
            // Top positions → tooltip on bottom (away from screen edge)
            if (
                position === "top-left" ||
                position === "top-right" ||
                position === "top-center"
            ) {
                return "bottom";
            }
            // Bottom positions → tooltip on top (away from screen edge)
            if (
                position === "bottom-left" ||
                position === "bottom-right" ||
                position === "bottom-center"
            ) {
                return "top";
            }
            // Center positions → tooltip on bottom
            if (position === "left-center" || position === "right-center") {
                return "bottom";
            }
        }

        return "left"; // Ultimate fallback
    }

    /**
     * Smart tooltip position for trigger button
     * Determines best position based on speed dial position and available space
     */
    function getTriggerTooltipPosition(
        element: HTMLElement | null,
    ): TooltipPos {
        if (!element) {
            // Fallback to intelligent default based on position
            return getDefaultTriggerTooltipPosition();
        }

        const space = getAvailableSpace(element);
        const minSpace = 120;

        // Right side positions → prefer left tooltip (away from edge), fallback to right
        if (
            position === "top-right" ||
            position === "bottom-right" ||
            position === "right-center"
        ) {
            if (space.left >= minSpace) {
                return "left";
            }
            if (space.right >= minSpace) {
                return "right";
            }
            return "left";
        }

        // Left side positions → prefer right tooltip (away from edge), fallback to left
        if (
            position === "top-left" ||
            position === "bottom-left" ||
            position === "left-center"
        ) {
            if (space.right >= minSpace) {
                return "right";
            }
            if (space.left >= minSpace) {
                return "left";
            }
            return "right";
        }

        // Center positions → prefer bottom tooltip (away from edge), fallback to top
        if (position === "top-center" || position === "bottom-center") {
            if (position === "top-center") {
                // Top center → prefer bottom
                if (space.bottom >= minSpace) {
                    return "bottom";
                }
                if (space.top >= minSpace) {
                    return "top";
                }
                return "bottom";
            } else {
                // Bottom center → prefer top
                if (space.top >= minSpace) {
                    return "top";
                }
                if (space.bottom >= minSpace) {
                    return "bottom";
                }
                return "top";
            }
        }

        // Fallback to default
        return getDefaultTriggerTooltipPosition();
    }

    /**
     * Default tooltip position for trigger button based on position
     * Used as fallback when element is not available
     */
    function getDefaultTriggerTooltipPosition(): TooltipPos {
        // Right side positions → tooltip on left (away from screen edge)
        if (
            position === "top-right" ||
            position === "bottom-right" ||
            position === "right-center"
        ) {
            return "left";
        }
        // Left side positions → tooltip on right (away from screen edge)
        if (
            position === "top-left" ||
            position === "bottom-left" ||
            position === "left-center"
        ) {
            return "right";
        }
        // Top center → tooltip on bottom
        if (position === "top-center") {
            return "bottom";
        }
        // Bottom center → tooltip on top
        if (position === "bottom-center") {
            return "top";
        }

        return "left"; // Ultimate fallback
    }

    // Position classes for the container
    const positionClasses = $derived(() => {
        switch (position) {
            case "top-left":
                return "top-6 left-6";
            case "top-right":
                return "top-6 right-6";
            case "bottom-left":
                return "bottom-6 left-6";
            case "bottom-right":
                return "bottom-6 right-6";
            case "top-center":
                return "top-6 left-1/2 -translate-x-1/2";
            case "bottom-center":
                return "bottom-6 left-1/2 -translate-x-1/2";
            case "left-center":
                return "top-1/2 -translate-y-1/2 left-6";
            case "right-center":
                return "top-1/2 -translate-y-1/2 right-6";
        }
    });

    // Determine effective alignment based on position
    // Behavior:
    // - Right side (top-right, bottom-right, right-center) → horizontal, children to the left (same row)
    // - Left side (top-left, bottom-left, left-center) → horizontal, children to the right (same row)
    // - Center (top-center, bottom-center) → vertical, children above/below (centered)
    // - If alignment is explicitly set, respect it
    const effectiveAlignment = $derived(() => {
        // If alignment is explicitly set to vertical, use it regardless of position
        if (alignment === "vertical") {
            return "vertical";
        }
        // Right side positions → horizontal (children expand left)
        if (
            position === "top-right" ||
            position === "bottom-right" ||
            position === "right-center"
        ) {
            return "horizontal";
        }
        // Left side positions → horizontal (children expand right)
        if (
            position === "top-left" ||
            position === "bottom-left" ||
            position === "left-center"
        ) {
            return "horizontal";
        }
        // Center positions → vertical (children above/below, centered)
        if (position === "top-center" || position === "bottom-center") {
            return "vertical";
        }
        // Fallback to default alignment
        return alignment;
    });

    // Menu container alignment classes
    const menuAlignmentClasses = $derived(() => {
        if (effectiveAlignment() === "horizontal") {
            return "flex-row gap-2";
        }
        return "flex-col gap-2";
    });

    // Menu container position classes based on alignment and position
    // Perfectly aligns menu items with trigger button
    const menuPositionClasses = $derived(() => {
        const align = effectiveAlignment();

        if (align === "horizontal") {
            // When horizontal, position on same row - perfectly aligned vertically
            switch (position) {
                case "top-left":
                case "bottom-left":
                case "left-center":
                    // Position to the right of trigger - expand right, perfectly aligned vertically
                    return "left-full ml-2 top-1/2 -translate-y-1/2";
                case "top-right":
                case "bottom-right":
                case "right-center":
                    // Position to the left of trigger - expand left, perfectly aligned vertically
                    return "right-full mr-2 top-1/2 -translate-y-1/2";
            }
        } else {
            // When vertical, position above or below trigger - perfectly aligned horizontally
            switch (position) {
                case "top-left":
                case "top-right":
                case "top-center":
                    // Position below trigger, perfectly centered horizontally
                    return "top-full mt-2 left-1/2 -translate-x-1/2";
                case "bottom-left":
                case "bottom-right":
                case "bottom-center":
                    // Position above trigger, perfectly centered horizontally
                    return "bottom-full mb-2 left-1/2 -translate-x-1/2";
                case "left-center":
                case "right-center":
                    // For side centers with vertical alignment, position below, centered
                    return "top-full mt-2 left-1/2 -translate-x-1/2";
            }
        }
    });

    // Map trigger variant to IconButton variant
    const triggerIconButtonVariant = $derived(() => {
        if (triggerVariant === "danger") return "danger";
        return "default";
    });

    // All buttons use the same size
    const buttonSize = $derived(() => {
        switch (size) {
            case "sm":
                return "sm";
            case "lg":
                return "lg";
            default:
                return "default";
        }
    });

    // Map SpeedDial variant to IconButton variant
    const iconButtonVariant = (variant?: string) => {
        if (variant === "danger") return "danger";
        return "default";
    };

    // Dynamic tooltip text based on state and trigger type
    const triggerTooltip = $derived(() => {
        // When hover trigger and open, don't show tooltip
        if (trigger === "hover" && isOpen) {
            return undefined;
        }
        // When click trigger and open, show close tooltip
        if (trigger === "click" && isOpen) {
            return "Close actions menu";
        }
        // Default: show open tooltip
        return "Open actions menu";
    });

    // Get the actual button element from the trigger wrapper
    const triggerButtonElement = $derived(() => {
        if (!triggerElement) return null;
        return triggerElement.querySelector("button") as HTMLElement | null;
    });

    // Dynamic tooltip position for trigger button (stored in state to allow updates on resize)
    let triggerTooltipPosition: TooltipPos = $state(
        getDefaultTriggerTooltipPosition(),
    );

    // Update trigger tooltip position when element becomes available
    $effect(() => {
        const button = triggerButtonElement();
        if (button) {
            triggerTooltipPosition = getTriggerTooltipPosition(button);
        } else {
            triggerTooltipPosition = getDefaultTriggerTooltipPosition();
        }
    });

    // Store tooltip positions for menu items (calculated when menu opens)
    let itemTooltipPositions: Map<number, TooltipPos> = $state(new Map());

    // Function to update item tooltip positions
    function updateItemTooltipPositions() {
        if (!isOpen || !menuElement) return;

        const newPositions = new Map<number, TooltipPos>();

        // Find all button elements within the menu container
        const buttons = menuElement.querySelectorAll("button");
        buttons.forEach((button, index) => {
            if (index < items.length) {
                newPositions.set(
                    index,
                    getItemTooltipPosition(button as HTMLElement),
                );
            }
        });

        itemTooltipPositions = newPositions;
    }

    // Update item tooltip positions when menu opens or elements change
    $effect(() => {
        if (!isOpen || !menuElement) return;

        // Calculate positions for all items after a short delay to ensure elements are rendered
        setTimeout(() => {
            updateItemTooltipPositions();
        }, 50);
    });

    // Function to update trigger tooltip position
    function updateTriggerTooltipPosition() {
        const button = triggerButtonElement();
        if (button) {
            triggerTooltipPosition = getTriggerTooltipPosition(button);
        }
    }

    // Update tooltip positions on window resize
    $effect(() => {
        function handleResize() {
            updateItemTooltipPositions();
            updateTriggerTooltipPosition();
        }

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleResize, true);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleResize, true);
        };
    });

    // Function to get tooltip position for a specific item index
    function getItemTooltipPos(index: number): TooltipPos {
        return (
            itemTooltipPositions.get(index) ?? getDefaultItemTooltipPosition()
        );
    }
</script>

<div
    bind:this={containerElement}
    class="{positioning === 'absolute'
        ? 'absolute'
        : 'fixed'} {positionClasses()} z-50 {className}"
    role="group"
    onmouseenter={trigger === "hover" ? show : undefined}
    onmouseleave={trigger === "hover" ? hide : undefined}
>
    <div class="relative group">
        <!-- Menu Items -->
        <div
            bind:this={menuElement}
            class="absolute flex {menuAlignmentClasses()} {menuPositionClasses()} transition-opacity duration-200 {isOpen
                ? 'opacity-100 visible'
                : 'opacity-0 invisible pointer-events-none'}"
        >
            {#each items as item, index (item.label)}
                {@const itemTooltipPos = getItemTooltipPos(index)}
                <IconButton
                    icon={item.icon}
                    iconSize={20}
                    variant={iconButtonVariant(item.variant)}
                    size={buttonSize()}
                    onclick={(e) => handleItemClick(item, e)}
                    tooltip={item.label}
                    tooltipPosition={itemTooltipPos}
                />
            {/each}
        </div>

        <!-- Trigger Button -->
        {#if triggerIcon}
            <div bind:this={triggerElement} class="inline-flex">
                <IconButton
                    icon={triggerIcon}
                    variant={triggerIconButtonVariant()}
                    size={buttonSize()}
                    onclick={trigger === "click" ? toggle : undefined}
                    tooltip={triggerTooltip()}
                    tooltipPosition={triggerTooltipPosition}
                    class="transition-all {isOpen
                        ? '!bg-zinc-100 !border-zinc-900 dark:!bg-zinc-800 dark:!border-zinc-100'
                        : ''} {isOpen && trigger === 'hover'
                        ? 'rotate-45'
                        : ''}"
                />
            </div>
        {:else}
            <div bind:this={triggerElement} class="inline-flex">
                <IconButton
                    icon={Plus}
                    variant={triggerIconButtonVariant()}
                    size={buttonSize()}
                    onclick={trigger === "click" ? toggle : undefined}
                    tooltip={triggerTooltip()}
                    tooltipPosition={triggerTooltipPosition}
                    class="transition-all {isOpen
                        ? '!bg-zinc-100 !border-zinc-900 dark:!bg-zinc-800 dark:!border-zinc-100 [&_svg]:rotate-45'
                        : '[&_svg]:transition-transform'}"
                />
            </div>
        {/if}
    </div>
</div>
