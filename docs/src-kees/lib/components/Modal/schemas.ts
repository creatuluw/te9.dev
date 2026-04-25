/**
 * Zod schemas for Modal component props validation
 * 
 * These schemas can be used for runtime validation of Modal component props,
 * particularly useful in development mode or for component builders.
 */
import { z } from 'zod';

/**
 * Modal size schema
 */
export const ModalSizeSchema = z.enum(['sm', 'md', 'lg']);

/**
 * Complete Modal props schema
 * 
 * @example
 * ```typescript
 * import { ModalPropsSchema } from '$lib/components/Modal/schemas';
 * 
 * // Validate props at runtime
 * const validation = ModalPropsSchema.safeParse(props);
 * if (!validation.success) {
 *   console.error('Invalid Modal props:', validation.error);
 * }
 * ```
 */
export const ModalPropsSchema = z.object({
	open: z.boolean().optional(),
	title: z.string().optional(),
	size: ModalSizeSchema.optional(),
	closeOnBackdropClick: z.boolean().optional(),
	class: z.string().optional(),
	onclose: z.function().optional(),
}).passthrough();

export type ModalProps = z.infer<typeof ModalPropsSchema>;

