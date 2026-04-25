<script lang="ts">
    import { shouldShowBadge } from "$lib/utils/badgeHelpers";

    /**
     * MessageBadge - Floating notification badge for unread message count
     *
     * Positioned absolute in the top-right corner of its parent.
     * Parent must have `position: relative` (or `relative` Tailwind class).
     *
     * Design: small pill/dot with count, following iOS/Material badge patterns.
     *
     * Props:
     * - count: Number of unread messages
     *
     * Features:
     * - Hidden when count is 0
     * - Shows "9+" for counts exceeding 9
     * - Compact sizing that sits in the top-right corner of the parent
     */

    interface Props {
        /** Number of unread messages */
        count: number;
    }

    let { count = 0 }: Props = $props();

    /** Whether the badge should be visible */
    let visible = $derived(shouldShowBadge(count));

    /** Formatted display text — compact for small badge */
    let displayText = $derived(count > 99 ? "99+" : String(count));
</script>

{#if visible}
    <span
        class="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white leading-none pointer-events-none"
        aria-label="{count} ongelezen bericht{count !== 1 ? 'en' : ''}"
    >
        {displayText}
    </span>
{/if}
