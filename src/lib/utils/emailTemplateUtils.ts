/**
 * Email template utilities - Template rendering with {{variable}} substitution
 */

/**
 * Simple template rendering with variable substitution.
 * Supports {{variable}} syntax — replaces all occurrences with provided values.
 *
 * @param template - HTML template string containing {{variable}} placeholders
 * @param data - Key-value pairs to substitute into the template
 * @returns Rendered HTML string with placeholders replaced
 *
 * @example
 * ```typescript
 * const html = renderTemplate('<h1>Hello {{name}}</h1>', { name: 'World' });
 * // => '<h1>Hello World</h1>'
 * ```
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
	let rendered = template;

	Object.keys(data).forEach((key) => {
		const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
		rendered = rendered.replace(regex, String(data[key] ?? ''));
	});

	return rendered;
}

/**
 * Strip HTML tags to create a plain text version of an email.
 *
 * @param html - HTML content
 * @returns Plain text with HTML tags removed and entities decoded
 */
export function generatePlainText(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		.replace(/<\/h[1-6]>/gi, '\n\n')
		.replace(/<\/li>/gi, '\n')
		.replace(/<\/tr>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&mdash;/g, '—')
		.replace(/&ndash;/g, '–')
		.replace(/&lsquo;/g, '\u2018')
		.replace(/&rsquo;/g, '\u2019')
		.replace(/&ldquo;/g, '\u201C')
		.replace(/&rdquo;/g, '\u201D')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}
