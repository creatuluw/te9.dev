<script lang="ts">
    import type { Snippet } from "svelte";

    /**
     * Button variant style
     * - default: Primary button with dark background
     * - secondary: Secondary button with white background and subtle gray border
     * - ghost: Transparent button with hover effect
     * - outline: Outlined button with border
     * - danger: Destructive action button with red styling
     */
    type ButtonVariant =
        | "default"
        | "secondary"
        | "ghost"
        | "outline"
        | "danger";

    /**
     * Button size
     * - default: Standard button size
     * - sm: Small button size
     */
    type ButtonSize = "default" | "sm";

    /**
     * Button component props
     */
    interface Props {
        /**
         * Visual variant for the button
         * @default 'default'
         */
        variant?: ButtonVariant;

        /**
         * Button size
         * @default 'default'
         */
        size?: ButtonSize;

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
         * Make button full width
         * @default false
         */
        fullWidth?: boolean;

        /**
         * Additional CSS classes
         */
        class?: string;

        /**
         * Children snippet
         */
        children?: Snippet;

        /**
         * Click event handler
         * @param event - Mouse event
         * @example
         * ```typescript
         * <Button onclick={(e) => console.log('clicked')}>Click me</Button>
         * ```
         */
        onclick?: (event: MouseEvent) => void;

        /**
         * HTML form attribute - associates the button with a form by id
         * @example
         * ```typescript
         * <Button type="submit" form="my-form">Submit</Button>
         * ```
         */
        form?: string;
    }

    let {
        variant = "default",
        size = "default",
        disabled = false,
        type = "button",
        fullWidth = false,
        class: className = "",
        children,
        onclick,
        form,
        ...restProps
    }: Props = $props();
</script>

<button
    {type}
    {form}
    {disabled}
    {onclick}
    class:btn={size === "default"}
    class:btn-sm={size === "sm"}
    class:w-full={fullWidth}
    class:text-zinc-100={variant === "default"}
    class:bg-[#444]={variant === "default"}
    class:hover:bg-[#000]={variant === "default" && !disabled}
    class:text-zinc-600={variant === "secondary" || variant === "ghost"}
    class:bg-white={variant === "secondary"}
    class:border={variant === "secondary" || variant === "outline"}
    class:border-zinc-300={variant === "secondary" || variant === "outline"}
    class:hover:text-zinc-900={(variant === "secondary" ||
        variant === "ghost") &&
        !disabled}
    class:hover:border-zinc-400={variant === "secondary" && !disabled}
    class:hover:bg-zinc-100={(variant === "secondary" ||
        variant === "outline" ||
        variant === "ghost") &&
        !disabled}
    class:text-zinc-900={variant === "outline"}
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
    class={className}
    {...restProps}
>
    {@render children?.()}
</button>
