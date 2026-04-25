/**
 * AOS (Animate On Scroll) Integration for SvelteKit
 *
 * Provides scroll-triggered animations for elements similar to tidy-html template.
 * Based on AOS library: https://michalsnik.github.io/aos/
 */

import { browser } from "$app/environment";

/**
 * AOS configuration options
 */
interface AosOptions {
  /** Animation happens only once - when scrolling down */
  once?: boolean;
  /** Disable AOS on certain devices */
  disable?: "phone" | "tablet" | "mobile" | false;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Easing function name */
  easing?: string;
  /** Offset (in px) from the original trigger point */
  offset?: number;
  /** Default delay in milliseconds */
  delay?: number;
  /** Anchor element, whose offset will be counted to trigger point */
  anchorPlacement?: string;
  /** Anchor offset - offset in px from anchor */
  anchorOffset?: number;
  /** Disable AOS on certain screen widths */
  disableClassName?: string;
  /** Class applied on animation */
  animatedClassName?: string;
  /** Class applied when animation starts */
  initClassName?: string;
}

/**
 * Initialize AOS with configuration
 * Should be called once in the root layout
 *
 * @param options - AOS configuration options
 * @example
 * ```typescript
 * import { initAOS } from '$lib/utils/aosKit';
 *
 * onMount(() => {
 *   if (browser) {
 *     initAOS({
 *       once: true,
 *       disable: 'phone',
 *       duration: 500,
 *       easing: 'ease-out-cubic'
 *     });
 *   }
 * });
 * ```
 */
export async function initAOS(options?: AosOptions): Promise<void> {
  if (!browser) return;

  try {
    // Dynamic import to avoid SSR issues
    const AOS = await import("aos");

    // Import AOS CSS
    await import("aos/dist/aos.css");

    // Initialize with default or custom options
    // Use lower offset to detect elements already in viewport
    const finalOptions = {
      once: true, // Animation happens only once
      disable: "phone", // Disable on mobile for better performance
      duration: 500,
      easing: "ease-out-cubic",
      offset: 0, // Lower offset to detect elements already in viewport
      delay: 0,
      ...options,
    };

    AOS.init(finalOptions);

    // Refresh multiple times to ensure elements already in viewport are detected
    // First refresh after a short delay
    setTimeout(() => {
      AOS.refresh();
    }, 100);

    // Second refresh after DOM is fully ready
    setTimeout(() => {
      AOS.refresh();
    }, 500);
  } catch (error) {
    console.error("Failed to initialize AOS:", error);
  }
}

/**
 * Refresh AOS animations
 * Useful after dynamically adding content
 */
export async function refreshAOS(): Promise<void> {
  if (!browser) return;

  try {
    const AOS = await import("aos");
    AOS.refresh();
  } catch (error) {
    console.error("Failed to refresh AOS:", error);
  }
}

/**
 * Refresh AOS animations (hard refresh)
 * Useful when DOM structure changes significantly
 */
export async function refreshHardAOS(): Promise<void> {
  if (!browser) return;

  try {
    const AOS = await import("aos");
    AOS.refreshHard();
  } catch (error) {
    console.error("Failed to hard refresh AOS:", error);
  }
}
