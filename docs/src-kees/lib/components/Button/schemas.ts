/**
 * Zod schemas for Button component props validation
 * 
 * These schemas can be used for runtime validation of Button component props,
 * particularly useful in development mode or for form builders.
 */
import { z } from 'zod';

/**
 * Button variant schema
 */
export const ButtonVariantSchema = z.enum(['default', 'secondary', 'ghost', 'outline']);

/**
 * Button size schema
 */
export const ButtonSizeSchema = z.enum(['default', 'sm']);

/**
 * Button HTML type schema
 */
export const ButtonTypeSchema = z.enum(['button', 'submit', 'reset']);

/**
 * Complete Button props schema
 * 
 * @example
 * ```typescript
 * import { ButtonPropsSchema } from '$lib/components/Button/schemas';
 * 
 * // Validate props at runtime
 * const validation = ButtonPropsSchema.safeParse(props);
 * if (!validation.success) {
 *   console.error('Invalid Button props:', validation.error);
 * }
 * ```
 */
export const ButtonPropsSchema = z.object({
	variant: ButtonVariantSchema.optional(),
	size: ButtonSizeSchema.optional(),
	disabled: z.boolean().optional(),
	type: ButtonTypeSchema.optional(),
	fullWidth: z.boolean().optional(),
	class: z.string().optional(),
	onclick: z.function().optional(),
}).passthrough(); // Allow additional props to pass through

export type ButtonProps = z.infer<typeof ButtonPropsSchema>;

