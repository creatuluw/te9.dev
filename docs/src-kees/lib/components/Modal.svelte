<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { Snippet } from "svelte";
    import { Trash2 } from "lucide-svelte";

    /**
     * Modal size variants
     * - sm: Small modal (max-width: 24rem)
     * - md: Medium modal (max-width: 28rem, default)
     * - lg: Large modal (max-width: 32rem)
     * - custom: Use custom width from customWidth prop
     */
    type ModalSize = "sm" | "md" | "lg" | "custom";

    /**
     * Modal component props
     */
    interface Props {
        /**
         * Whether the modal is open
         * @default false
         */
        open?: boolean;

        /**
         * Modal title text (displayed in header)
         */
        title?: string;

        /**
         * Modal size variant
         * @default 'md'
         */
        size?: ModalSize;

        /**
         * Whether clicking the backdrop closes the modal
         * @default true
         */
        closeOnBackdropClick?: boolean;

        /**
         * Additional CSS classes for the modal container
         */
        class?: string;

        /**
         * Children snippet
         */
        children?: Snippet;

        /**
         * Callback fired when modal is closed
         * @example
         * ```typescript
         * <Modal open={isOpen} onclose={() => setIsOpen(false)}>
         *   <p>Modal content</p>
         * </Modal>
         * ```
         */
        onclose?: () => void;

        /**
         * Whether the modal is in a loading state
         * Shows a loading spinner overlay after 2 seconds
         * @default false
         */
        loading?: boolean;

        /**
         * Custom width for the modal (used when size is 'custom')
         * Can be any valid CSS width value (e.g., '40vw', '600px', '80%')
         * @example '40vw'
         */
        customWidth?: string;

        /**
         * Maximum height for modal content area
         * Content will scroll if it exceeds this height
         * Can be any valid CSS height value (e.g., '60vh', '500px')
         * @example '60vh'
         */
        maxContentHeight?: string;

        /**
         * Callback fired when delete button is clicked
         * If provided, a delete icon button will be shown in the header
         */
        ondelete?: () => void;
    }

    let {
        open: isOpen = $bindable(false),
        title,
        size = "md",
        closeOnBackdropClick = true,
        class: className = "",
        children,
        onclose,
        loading = false,
        customWidth,
        maxContentHeight,
        ondelete,
    }: Props = $props();

    function handleBackdropClick(event: MouseEvent) {
        if (!closeOnBackdropClick) return;
        const target = event.target as HTMLElement;
        if (
            target === event.currentTarget ||
            target.classList.contains("z-modal-backdrop")
        ) {
            closeModal();
        }
    }

    function closeModal() {
        isOpen = false;
        onclose?.();
    }

    function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape" && isOpen) {
            closeModal();
        }
    }

    function getSizeClasses(size: ModalSize): string {
        const sizes: Record<ModalSize, string> = {
            sm: "max-w-sm",
            md: "max-w-md",
            lg: "max-w-lg",
            custom: "", // No default max-width for custom
        };
        return sizes[size];
    }

    function getCustomStyles(): string {
        let styles = "";
        if (size === "custom" && customWidth) {
            styles += `width: ${customWidth}; `;
        }
        return styles;
    }

    function getContentStyles(): string {
        let styles = "";
        if (maxContentHeight) {
            styles += `max-height: ${maxContentHeight}; overflow-y: auto; `;
        }
        return styles;
    }

    onMount(() => {
        if (typeof window !== "undefined") {
            document.addEventListener("keydown", handleEscape);
            // Prevent body scroll when modal is open
            if (isOpen) {
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
                document.body.classList.add("modal-open");
            }
        }
    });

    onDestroy(() => {
        if (typeof window !== "undefined") {
            document.removeEventListener("keydown", handleEscape);
            document.body.classList.remove("modal-open");
            document.body.style.removeProperty("--scrollbar-width");
        }
    });

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
        if (typeof document !== "undefined") {
            if (isOpen) {
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
                document.body.classList.add("modal-open");
            } else {
                document.body.classList.remove("modal-open");
                document.body.style.removeProperty("--scrollbar-width");
            }
        }
    });
</script>

{#if isOpen}
    <div
        class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-modal"
        onclick={handleBackdropClick}
        onkeydown={(e) => {
            if (e.key === "Escape") {
                handleBackdropClick(e as any);
            }
        }}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
    >
        <!-- Backdrop -->
        <div
            class="absolute inset-0 bg-zinc-900/50 transition-opacity pointer-events-auto z-modal-backdrop"
            class:opacity-100={isOpen}
        ></div>

        <!-- Modal -->
        <div
            class="relative bg-white rounded-md shadow-xl w-full pointer-events-auto transform transition-all z-modal {getSizeClasses(
                size,
            )} {className}"
            style={getCustomStyles()}
        >
            <!-- Header -->
            {#if title}
                <div
                    class="flex items-center justify-between px-6 py-4 border-b border-zinc-200"
                >
                    <h2
                        id="modal-title"
                        class="text-lg font-semibold text-zinc-900"
                    >
                        {title}
                    </h2>
                    <div class="flex items-center gap-2">
                        {#if ondelete}
                            <button
                                type="button"
                                onclick={ondelete}
                                class="text-zinc-400 hover:text-red-600 transition-colors modal-delete-button"
                                aria-label="Delete"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        {/if}
                        <button
                            type="button"
                            onclick={closeModal}
                            class="text-zinc-400 hover:text-zinc-900 transition"
                            aria-label="Close modal"
                        >
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Content -->
            <div class="px-6 py-4" style={getContentStyles()}>
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}

<style>
    :global(.modal-delete-button:hover svg) {
        color: rgb(220 38 38) !important;
        stroke: currentColor;
    }
</style>
