<!--
	AnimateOnScroll Component

	A reusable wrapper component for AOS scroll-triggered animations.
	Similar to tidy-html's data-aos attributes but as a Svelte component.

	@example
	```svelte
	<AnimateOnScroll animation="fade-up" delay={100}>
		<div>This will animate when scrolled into view</div>
	</AnimateOnScroll>
	```
-->

<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { refreshAOS } from "$lib/utils/aosKit";

    interface Props {
        /**
         * AOS animation type
         * @default 'fade-up'
         */
        animation?:
            | "fade"
            | "fade-up"
            | "fade-down"
            | "fade-left"
            | "fade-right"
            | "fade-up-right"
            | "fade-up-left"
            | "fade-down-right"
            | "fade-down-left"
            | "zoom-in"
            | "zoom-in-up"
            | "zoom-in-down"
            | "zoom-in-left"
            | "zoom-in-right"
            | "zoom-out"
            | "zoom-out-up"
            | "zoom-out-down"
            | "zoom-out-right"
            | "zoom-out-left"
            | "slide-up"
            | "slide-down"
            | "slide-left"
            | "slide-right"
            | "flip-left"
            | "flip-right"
            | "flip-up"
            | "flip-down";

        /**
         * Animation delay in milliseconds
         * @default 0
         */
        delay?: number;

        /**
         * Animation duration in milliseconds
         * @default undefined (uses AOS default)
         */
        duration?: number;

        /**
         * Animation easing function
         * @default undefined (uses AOS default)
         */
        easing?: string;

        /**
         * AOS anchor for synchronized animations
         */
        anchor?: string;

        /**
         * Additional CSS classes
         */
        class?: string;
    }

    let {
        animation = "fade-up",
        delay = 0,
        duration,
        easing,
        anchor,
        class: className = "",
        children,
    }: Props & { children?: import("svelte").Snippet } = $props();
    let element: HTMLElement = $state<any>(null);

    onMount(async () => {
        if (browser && element) {
            // Set data-aos attributes
            element.setAttribute("data-aos", animation);

            if (delay > 0) {
                element.setAttribute("data-aos-delay", delay.toString());
            }

            if (duration) {
                element.setAttribute("data-aos-duration", duration.toString());
            }

            if (easing) {
                element.setAttribute("data-aos-easing", easing);
            }

            if (anchor) {
                element.setAttribute("data-aos-anchor", anchor);
            }

            // Refresh AOS to detect this element
            await refreshAOS();
        }
    });
</script>

<div bind:this={element} class={className}>
    {@render children?.()}
</div>
