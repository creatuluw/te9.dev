/**
 * TinyTalk integration utilities
 * 
 * Helper functions for integrating TinyTalk AI chatbot with forms
 */

export interface FormFieldInfo {
	id: string;
	name: string;
	type: string;
	label: string;
	placeholder: string;
	value: string;
	required: boolean;
}

export interface FormContext {
	fields: FormFieldInfo[];
	formTitle?: string;
	userNotes?: string;
}

/**
 * Extract form field metadata from a form element
 * 
 * @param formSelector - CSS selector or form element
 * @returns Form context with field information
 * 
 * @example
 * ```typescript
 * const context = extractFormContext('#workitem-form');
 * console.log(context.fields); // Array of field info
 * ```
 */
export function extractFormContext(
	formSelector: string | HTMLFormElement
): FormContext {
	if (typeof window === 'undefined') {
		return { fields: [] };
	}

	const form =
		typeof formSelector === 'string'
			? document.querySelector<HTMLFormElement>(formSelector)
			: formSelector;

	if (!form) {
		return { fields: [] };
	}

	const fields: FormFieldInfo[] = [];

	// Get form title from heading or form element
	const formTitle =
		form.getAttribute('aria-label') ||
		form.querySelector('h2, h3')?.textContent?.trim() ||
		'';

	// Extract all form fields
	const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
		'input, textarea, select'
	);

	inputs.forEach((input) => {
		const id = input.id || '';
		const name = input.name || '';
		const type = input.type || (input.tagName === 'TEXTAREA' ? 'textarea' : 'select');
		
		// Find label
		let label = '';
		if (id) {
			const labelElement = form.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
			label = labelElement?.textContent?.trim() || '';
		}
		
		// If no label found by for attribute, check if input is inside a label
		if (!label && input.parentElement?.tagName === 'LABEL') {
			label = input.parentElement.textContent?.trim() || '';
		}

		// Get placeholder
		const placeholder =
			input.getAttribute('placeholder') ||
			(input as HTMLInputElement).placeholder ||
			'';

		// Get current value
		const value = input.value || '';

		// Check if required
		const required =
			input.hasAttribute('required') ||
			input.getAttribute('aria-required') === 'true' ||
			false;

		fields.push({
			id,
			name,
			type,
			label: label || id || name,
			placeholder,
			value,
			required
		});
	});

	return {
		fields,
		formTitle
	};
}

/**
 * Format form context as a readable string for AI
 * 
 * @param context - Form context from extractFormContext
 * @param userNotes - Additional user notes/context
 * @returns Formatted string for AI understanding
 * 
 * @example
 * ```typescript
 * const context = extractFormContext('#workitem-form');
 * const prompt = formatContextForAI(context, 'This is for a new feature request');
 * ```
 */
export function formatContextForAI(
	context: FormContext,
	userNotes?: string
): string {
	const parts: string[] = [];

	parts.push('You are helping to fill out a form.');

	if (context.formTitle) {
		parts.push(`\nForm: ${context.formTitle}`);
	}

	if (context.fields.length > 0) {
		parts.push('\nForm Fields:');
		context.fields.forEach((field) => {
			const info: string[] = [];
			info.push(`- ${field.label || field.id || field.name} (${field.type})`);
			
			if (field.placeholder) {
				info.push(`  Placeholder: "${field.placeholder}"`);
			}
			
			if (field.value) {
				info.push(`  Current value: "${field.value}"`);
			}
			
			if (field.required) {
				info.push(`  [Required]`);
			}

			parts.push(info.join(' '));
		});
	}

	if (userNotes) {
		parts.push(`\nUser Notes/Context:\n${userNotes}`);
	}

	return parts.join('\n');
}

/**
 * Get TinyTalk bot ID from environment
 */
export function getTinyTalkBotId(): string | null {
	if (typeof window === 'undefined') return null;
	return import.meta.env.PUBLIC_TINYTALK_BOT_ID || null;
}

/**
 * Check if TinyTalk is configured
 */
export function isTinyTalkConfigured(): boolean {
	return !!getTinyTalkBotId();
}

