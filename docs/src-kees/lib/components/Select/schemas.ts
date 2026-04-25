/**
 * Zod schemas for Select component props validation
 * 
 * These schemas can be used for runtime validation of Select component props,
 * particularly useful in development mode or for form builders.
 */
import { z } from 'zod';

/**
 * Select option schema
 */
export const SelectOptionSchema = z.object({
	value: z.string(),
	label: z.string(),
	disabled: z.boolean().optional(),
});

/**
 * Complete Select props schema
 * 
 * @example
 * ```typescript
 * import { SelectPropsSchema } from '$lib/components/Select/schemas';
 * 
 * // Validate props at runtime
 * const validation = SelectPropsSchema.safeParse(props);
 * if (!validation.success) {
 *   console.error('Invalid Select props:', validation.error);
 * }
 * ```
 */
export const SelectPropsSchema = z.object({
	options: z.array(SelectOptionSchema),
	value: z.string().nullable().optional(),
	placeholder: z.string().optional(),
	disabled: z.boolean().optional(),
	loading: z.boolean().optional(),
	class: z.string().optional(),
	onchange: z.function().optional(),
}).passthrough();

export type SelectProps = z.infer<typeof SelectPropsSchema>;
export type SelectOption = z.infer<typeof SelectOptionSchema>;

