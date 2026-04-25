<script lang="ts">
    import type { Snippet } from "svelte";
    import { tick } from "svelte";
    import { onMount, onDestroy } from "svelte";
    import {
        computePosition,
        autoUpdate,
        offset,
        flip,
        shift,
        type Placement,
    } from "@floating-ui/dom";

    /**
     * Tooltip position relative to trigger element
     */
    type TooltipPosition = "top" | "bottom" | "left" | "right" | "auto";

    interface Props {
        text: string;
        position?: TooltipPosition;
        class?: string;
        delay?: number;
        children?: Snippet;
    }

    let {
        text,
        position = "top",
        class: className = "",
        delay = 200,
        children,
        ...restProps
    }: Props = $props();

    let visible = $state(false);
    let timeoutId: number | null = null;
    let triggerElement: HTMLElement | null = $state(null);
    let tooltipElement: HTMLElement | null = $state(null);
    let cleanupAutoUpdate: (() => void) | null = null;
    let docMoveHandler: ((e: MouseEvent) => void) | null = null;
    let docDownHandler: ((e: MouseEvent) => void) | null = null;
    let autoDismissTimeoutId: number | null = null;

    /**
     * Check if AOS animations are complete for the element and its parents
     */
    function isAOSComplete(element: HTMLElement): boolean {
        let current: HTMLElement | null = element;

        while (current && current !== document.body) {
            if (current.hasAttribute("data-aos")) {
                // AOS adds 'aos-animate' class when animation completes
                if (!current.classList.contains("aos-animate")) {
                    return false;
                }
            }
            current = current.parentElement;
        }

        return true;
    }

    /**
     * Wait for AOS animations to complete (with timeout)
     */
    async function waitForAOSComplete(
        element: HTMLElement,
        maxWait = 500,
    ): Promise<void> {
        if (isAOSComplete(element)) {
            return;
        }

        const startTime = Date.now();

        return new Promise((resolve) => {
            const checkComplete = () => {
                if (isAOSComplete(element)) {
                    resolve();
                    return;
                }

                if (Date.now() - startTime > maxWait) {
                    // Timeout - proceed anyway
                    resolve();
                    return;
                }

                requestAnimationFrame(checkComplete);
            };

            requestAnimationFrame(checkComplete);
        });
    }

    /**
     * Get the actual reference element (button) from the wrapper
     */
    function getReferenceElement(): HTMLElement {
        if (!triggerElement) return triggerElement!;

        // Find the actual interactive element (button) inside the wrapper
        const firstChild = triggerElement.firstElementChild as HTMLElement;
        if (firstChild) {
            if (
                firstChild.tagName === "BUTTON" ||
                firstChild.getAttribute("role") === "button"
            ) {
                return firstChild;
            }
        }

        return triggerElement;
    }

    /**
     * Update tooltip position using Floating UI
     * Based on Floating UI documentation: https://floating-ui.com/docs/computePosition
     */
    function updatePosition() {
        if (!triggerElement || !tooltipElement) return;

        const referenceElement = getReferenceElement();
        if (!referenceElement) return;

        // Convert position to Floating UI placement
        const placement: Placement = position === "auto" ? "top" : position;

        computePosition(referenceElement, tooltipElement, {
            placement,
            strategy: "fixed",
            middleware: [
                offset(8), // 8px spacing
                flip(), // Flip to opposite side if not enough space
                shift({ padding: 8 }), // Shift to keep within viewport
            ],
        })
            .then(({ x, y }) => {
                // Apply position using Object.assign as per Floating UI docs
                Object.assign(tooltipElement!.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                });
            })
            .catch((error) => {
                // Silently fail if positioning fails
                console.debug("Tooltip positioning error:", error);
            });
    }

    async function show() {
        timeoutId = window.setTimeout(async () => {
            if (!triggerElement) return;

            // Wait for AOS animations to complete
            await waitForAOSComplete(triggerElement, 500);

            // Wait for DOM to settle
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve(undefined);
                    });
                });
            });

            await tick();

            // Show the tooltip
            visible = true;

            if (!tooltipElement) {
                const el = document.createElement("div");
                el.className =
                    "fixed z-tooltip px-2 py-1 text-xs text-zinc-100 bg-zinc-900 rounded shadow-sm pointer-events-none whitespace-nowrap";
                el.setAttribute("role", "tooltip");
                el.textContent = text;
                document.body.appendChild(el);
                tooltipElement = el;
            } else {
                tooltipElement.textContent = text;
            }

            // Initial position update
            updatePosition();

            // Set up auto-update for scroll/resize
            // Based on Floating UI docs: https://floating-ui.com/docs/autoUpdate
            if (triggerElement && tooltipElement) {
                const referenceElement = getReferenceElement();
                if (referenceElement) {
                    cleanupAutoUpdate = autoUpdate(
                        referenceElement,
                        tooltipElement,
                        updatePosition,
                    );
                }
            }
            // Global listeners to hide immediately when not hovering trigger
            if (typeof document !== "undefined") {
                docMoveHandler = (e: MouseEvent) => {
                    if (!triggerElement) return;
                    const path = (e as any).composedPath
                        ? (e as any).composedPath()
                        : [];
                    const inside =
                        (path && path.includes(triggerElement)) ||
                        triggerElement.contains(e.target as Node);
                    if (!inside) hide();
                };
                docDownHandler = () => hide();
                document.addEventListener("mousemove", docMoveHandler);
                document.addEventListener("mousedown", docDownHandler);
            }

            // Auto-dismiss after 1 second on tablet screens (768-1399px)
            if (
                typeof window !== "undefined" &&
                window.innerWidth >= 768 &&
                window.innerWidth < 1400
            ) {
                autoDismissTimeoutId = window.setTimeout(() => {
                    hide();
                }, 1000);
            }
        }, delay);
    }

    function hide() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        if (autoDismissTimeoutId !== null) {
            clearTimeout(autoDismissTimeoutId);
            autoDismissTimeoutId = null;
        }

        if (cleanupAutoUpdate) {
            cleanupAutoUpdate();
            cleanupAutoUpdate = null;
        }

        visible = false;
        if (tooltipElement && tooltipElement.parentNode) {
            tooltipElement.parentNode.removeChild(tooltipElement);
            tooltipElement = null;
        }
        if (typeof document !== "undefined") {
            if (docMoveHandler)
                document.removeEventListener("mousemove", docMoveHandler);
            if (docDownHandler)
                document.removeEventListener("mousedown", docDownHandler);
            docMoveHandler = null;
            docDownHandler = null;
        }
    }

    onDestroy(() => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        if (autoDismissTimeoutId !== null) {
            clearTimeout(autoDismissTimeoutId);
        }
        if (cleanupAutoUpdate) {
            cleanupAutoUpdate();
        }
        if (tooltipElement && tooltipElement.parentNode) {
            tooltipElement.parentNode.removeChild(tooltipElement);
            tooltipElement = null;
        }
        if (typeof document !== "undefined") {
            if (docMoveHandler)
                document.removeEventListener("mousemove", docMoveHandler);
            if (docDownHandler)
                document.removeEventListener("mousedown", docDownHandler);
            docMoveHandler = null;
            docDownHandler = null;
        }
    });
</script>

<span
    bind:this={triggerElement}
    class="inline-flex items-center justify-center {className}"
    onmouseenter={show}
    onmouseleave={hide}
    onfocus={show}
    onblur={hide}
    {...restProps}
>
    {@render children?.()}
</span>
