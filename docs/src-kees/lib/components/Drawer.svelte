<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import type { Snippet } from "svelte";

    /**
     * Drawer position/slide direction
     * - left: Slides in from left
     * - right: Slides in from right (default)
     * - top: Slides in from top
     * - bottom: Slides in from bottom
     */
    type DrawerPosition = "left" | "right" | "top" | "bottom";

    /**
     * Drawer component props
     *
     * Side panel component that slides in from the specified edge.
     */
    interface Props {
        /**
         * Whether the drawer is open
         * @default false
         */
        open?: boolean;

        /**
         * Position/direction the drawer slides from
         * @default 'right'
         */
        position?: DrawerPosition;

        /**
         * Additional CSS classes (can override default width/height)
         * @example
         * ```typescript
         * <Drawer class="w-[66vw]" open={isOpen}>
         *   Content here
         * </Drawer>
         * ```
         */
        class?: string;

        /**
         * Whether to show the backdrop overlay
         * @default true
         */
        showBackdrop?: boolean;

        /**
         * Disable overflow scrolling (allows dropdowns to extend beyond drawer)
         * @default false
         */
        disableOverflow?: boolean;

        /**
         * Children snippet
         */
        children?: Snippet;

        /**
         * Callback fired when drawer is closed
         * @example
         * ```typescript
         * <Drawer
         *   open={isOpen}
         *   onclose={() => setIsOpen(false)}
         * >
         *   Drawer content
         * </Drawer>
         * ```
         */
        onclose?: () => void;
    }

    let {
        open: isOpen = $bindable(false),
        position = "right",
        class: className = "",
        showBackdrop = true,
        disableOverflow = false,
        children,
        onclose,
    }: Props = $props();

    let isAnimating = $state(false);

    function getScrollbarWidth(): number {
        if (typeof window === "undefined") return 0;
        // Create a temporary element to measure scrollbar width
        const outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.overflow = "scroll";
        (outer.style as any).msOverflowStyle = "scrollbar";
        document.body.appendChild(outer);

        const inner = document.createElement("div");
        outer.appendChild(inner);

        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
        outer.parentNode?.removeChild(outer);

        return scrollbarWidth;
    }

    $effect(() => {
        if (isOpen) {
            // Prevent body scrolling when drawer is open
            if (typeof document !== "undefined") {
                // Only apply scrollbar compensation if page is actually scrollable
                const isScrollable =
                    document.documentElement.scrollHeight >
                    document.documentElement.clientHeight;
                if (isScrollable) {
                    const scrollbarWidth = getScrollbarWidth();
                    // Only set padding when there's actually a scrollbar width
                    if (scrollbarWidth > 0) {
                        document.body.style.setProperty(
                            "--scrollbar-width",
                            `${scrollbarWidth}px`,
                        );
                    }
                }
                document.body.classList.add("drawer-open");
            }
            tick().then(() => {
                isAnimating = true;
            });
        } else {
            // Restore body scrolling when drawer is closed
            if (typeof document !== "undefined") {
                document.body.classList.remove("drawer-open");
                document.body.style.removeProperty("--scrollbar-width");
            }
            isAnimating = false;
        }
    });

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            closeDrawer();
        }
    }

    function closeDrawer() {
        isOpen = false;
        onclose?.();
    }

    function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape" && isOpen) {
            closeDrawer();
        }
    }

    function getPositionClasses(position: DrawerPosition): string {
        const classes: Record<DrawerPosition, string> = {
            left: "left-0 top-0 bottom-0",
            right: "right-0 top-0 bottom-0",
            top: "top-0 left-0 right-0",
            bottom: "bottom-0 left-0 right-0",
        };
        return classes[position];
    }

    function getWidthClass(
        position: DrawerPosition,
        hasCustomClass: boolean,
    ): string {
        if (hasCustomClass) return "";
        if (position === "left" || position === "right") return "w-1/2";
        return "";
    }

    onMount(() => {
        if (typeof window !== "undefined") {
            document.addEventListener("keydown", handleEscape);
        }
    });

    onDestroy(() => {
        if (typeof window !== "undefined") {
            document.removeEventListener("keydown", handleEscape);
            // Restore body scrolling in case component is destroyed while open
            document.body.classList.remove("drawer-open");
            document.body.style.removeProperty("--scrollbar-width");
        }
    });
</script>

{#if isOpen}
    <div
        class="fixed inset-0 flex pointer-events-none z-drawer"
        onclick={handleBackdropClick}
        role="presentation"
    >
        <!-- Backdrop -->
        {#if showBackdrop}
            <div
                class="absolute inset-0 bg-zinc-900/50 transition-opacity pointer-events-auto z-drawer-backdrop"
                class:opacity-100={isOpen}
                role="button"
                tabindex={0}
                onclick={closeDrawer}
                onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        closeDrawer();
                    }
                }}
            ></div>
        {/if}

        <!-- Drawer -->
        <div
            data-drawer
            class="absolute bg-white shadow-xl pointer-events-auto transition-transform duration-300 z-drawer overflow-visible {getPositionClasses(
                position,
            )} {getWidthClass(position, !!className)} {className}"
            class:translate-x-0={isAnimating &&
                (position === "left" || position === "right")}
            class:translate-y-0={isAnimating &&
                (position === "top" || position === "bottom")}
            class:-translate-x-full={!isAnimating && position === "left"}
            class:translate-x-full={!isAnimating && position === "right"}
            class:-translate-y-full={!isAnimating && position === "top"}
            class:translate-y-full={!isAnimating && position === "bottom"}
            class:h-screen={position === "left" || position === "right"}
            class:h-[70vh]={!className &&
                (position === "top" || position === "bottom")}
            class:md:h-[33vh]={!className &&
                (position === "top" || position === "bottom")}
            class:w-full={position === "top" || position === "bottom"}
        >
            <!-- Close Button -->
            <button
                onclick={closeDrawer}
                class="absolute top-2 z-10 p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                class:right-2={position === "left" || position === "top"}
                class:left-2={position === "right" || position === "bottom"}
                aria-label="Close drawer"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </button>

            <div class="p-6 pt-10 h-full flex flex-col">
                <div
                    class="flex-1 {disableOverflow
                        ? 'overflow-visible'
                        : 'overflow-y-auto overflow-x-hidden'}"
                >
                    {@render children?.()}
                </div>
            </div>
        </div>
    </div>
{/if}
