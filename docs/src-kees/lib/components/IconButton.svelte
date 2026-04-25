<script lang="ts">
    import type { ComponentType } from "svelte";
    import Tooltip from "./Tooltip.svelte";

    /**
     * Icon button variant styles
     * - default: Standard icon button with hover effect
     * - ghost: Transparent background with hover effect
     * - danger: Red color scheme for destructive actions
     */
    type IconButtonVariant = "default" | "ghost" | "danger";

    /**
     * Icon button size
     * - default: Standard size (p-2, icon 18px)
     * - sm: Small size (p-1.5, icon 16px)
     * - lg: Large size (p-3, icon 22px)
     */
    type IconButtonSize = "default" | "sm" | "lg";

    /**
     * IconButton component props
     */
    interface Props {
        /**
         * Icon component from lucide-svelte or similar
         * @example
         * ```typescript
         * import { Plus } from 'lucide-svelte';
         * <IconButton icon={Plus} />
         * ```
         */
        icon: ComponentType;

        /**
         * Custom icon size in pixels (overrides size-based default)
         */
        iconSize?: number;

        /**
         * Visual variant for the button
         * @default 'default'
         */
        variant?: IconButtonVariant;

        /**
         * Button size (affects padding and icon size)
         * @default 'default'
         */
        size?: IconButtonSize;

        /**
         * Disable the button
         * @default false
         */
        disabled?: boolean;

        /**
         * HTML button type attribute
         * @default 'button'
         */
        type?: "button" | "submit" | "reset";

        /**
         * Additional CSS classes
         */
        class?: string;

        /**
         * Tooltip text (enables tooltip wrapper)
         */
        tooltip?: string;

        /**
         * Tooltip position
         * @default 'top'
         */
        tooltipPosition?: "top" | "bottom" | "left" | "right";

        /**
         * Click event handler
         * @param event - Mouse event
         * @example
         * ```typescript
         * <IconButton
         *   icon={Trash}
         *   onclick={() => handleDelete()}
         * />
         * ```
         */
        onclick?: (event: MouseEvent) => void;
    }

    let {
        icon,
        iconSize,
        variant = "default",
        size = "default",
        disabled = false,
        type = "button",
        class: className = "",
        tooltip,
        tooltipPosition = "top",
        onclick,
        ...restProps
    }: Props = $props();

    // Size-based icon sizes
    const defaultIconSize = $derived(
        iconSize !== undefined
            ? iconSize
            : size === "sm"
              ? 16
              : size === "lg"
                ? 22
                : 18,
    );

    // Variant styles
    const variantClasses = $derived(() => {
        switch (variant) {
            case "ghost":
                return "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100";
            case "danger":
                return "text-red-600 hover:text-red-700 hover:bg-red-50";
            default:
                return "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100";
        }
    });

    // Size classes
    const sizeClasses = $derived(() => {
        switch (size) {
            case "sm":
                return "p-1.5";
            case "lg":
                return "p-3";
            default:
                return "p-2";
        }
    });
</script>

{#if tooltip}
    {@const IconComponent = icon}
    <Tooltip text={tooltip} position={tooltipPosition}>
        <button
            {type}
            {disabled}
            {onclick}
            class="inline-flex items-center justify-center rounded transition-colors {sizeClasses()} {variantClasses()} {disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'} {className}"
            {...restProps}
        >
            <IconComponent size={defaultIconSize} />
        </button>
    </Tooltip>
{:else}
    {@const IconComponent = icon}
    <button
        {type}
        {disabled}
        {onclick}
        class="inline-flex items-center justify-center rounded transition-colors {sizeClasses()} {variantClasses()} {disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'} {className}"
        {...restProps}
    >
        <IconComponent size={defaultIconSize} />
    </button>
{/if}
