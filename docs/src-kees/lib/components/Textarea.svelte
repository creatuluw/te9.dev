<script lang="ts">
	/**
	 * Textarea component props
	 * 
	 * A styled textarea component that matches the design system.
	 */
	interface Props {
		/**
		 * Textarea value (bindable)
		 * @default ''
		 * @example
		 * ```typescript
		 * <Textarea bind:value={text} />
		 * ```
		 */
		value?: string;

		/**
		 * Placeholder text
		 * @default ''
		 */
		placeholder?: string;

		/**
		 * Number of rows (height)
		 * @default 3
		 */
		rows?: number;

		/**
		 * Disable the textarea
		 * @default false
		 */
		disabled?: boolean;

		/**
		 * Make field required
		 * @default false
		 */
		required?: boolean;

		/**
		 * HTML input id attribute
		 */
		id?: string;

		/**
		 * HTML input name attribute
		 */
		name?: string;

		/**
		 * Maximum length of input
		 */
		maxlength?: number;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Change event handler
		 * @param value - Current textarea value
		 */
		onchange?: (value: string) => void;

		/**
		 * Input event handler (fires on every keystroke)
		 * @param event - Native input event
		 */
		oninput?: (event: Event) => void;
	}

	let {
		value: textValue = $bindable(''),
		placeholder = '',
		rows = 3,
		disabled = false,
		required = false,
		id,
		name,
		maxlength,
		class: className = '',
		onchange,
		oninput
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		textValue = target.value;
		if (onchange) {
			onchange(textValue);
		}
		if (oninput) {
			oninput(event);
		}
	}
</script>

<textarea
	{id}
	{name}
	bind:value={textValue}
	{placeholder}
	{rows}
	{disabled}
	{required}
	{maxlength}
	oninput={handleInput}
	class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm {className}"
></textarea>

