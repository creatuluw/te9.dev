/**
 * Mention parser utility - Extract and resolve @mentions from text
 */

import type { EntityReference } from '$lib/schemas/message';

/**
 * Mention found in text
 */
export interface Mention {
	/**
	 * Type of mention (user or entity)
	 */
	type: 'user' | 'entity';
	
	/**
	 * Mentioned name (without @)
	 */
	name: string;
	
	/**
	 * Position in text where mention starts
	 */
	position: number;
	
	/**
	 * Full mention text including @
	 */
	fullText: string;
}

/**
 * Parse @mentions from text
 * 
 * Pattern: @EntityName (case-insensitive, supports spaces)
 * 
 * @param text - Text to parse for @mentions
 * @returns Array of mentions found in text
 * 
 * @example
 * ```typescript
 * const mentions = parseMentions('Hello @John Doe and @Project Alpha');
 * // Returns:
 * // [
 * //   { type: 'entity', name: 'John Doe', position: 6, fullText: '@John Doe' },
 * //   { type: 'entity', name: 'Project Alpha', position: 25, fullText: '@Project Alpha' }
 * // ]
 * ```
 */
export function parseMentions(text: string): Mention[] {
	const mentions: Mention[] = [];
	
	// Pattern: @ followed by one or more word characters, spaces, or hyphens
	// Stops at:
	// 1. Punctuation (.,!?;:)
	// 2. A space followed by a lowercase word that's not a name particle (de, van, der, etc.)
	//    This handles "@Kees de Tester hoi" -> stops at "hoi" (lowercase, not a name particle)
	// 3. End of string
	// Name particles: de, van, der, den, te, ter, op, aan, etc.
	const nameParticles = ['de', 'van', 'der', 'den', 'te', 'ter', 'op', 'aan', 'het', 'een'];
	const mentionRegex = /@([\w\s-]+?)(?=[.,!?;:]|\s+(?![A-Z]|de\s|van\s|der\s|den\s|te\s|ter\s|op\s|aan\s|het\s|een\s)[a-z]|$)/g;
	
	let match;
	while ((match = mentionRegex.exec(text)) !== null) {
		const name = match[1].trim();
		if (name.length > 0) {
			mentions.push({
				type: 'entity', // Will be resolved later
				name,
				position: match.index,
				fullText: match[0]
			});
		}
	}
	
	return mentions;
}

/**
 * Resolve mentions to entity references
 * 
 * Takes parsed mentions and resolves entity names to IDs by searching
 * across all entity types (users, projects, cases, tasks, processes).
 * 
 * @param mentions - Array of parsed mentions
 * @param entitySearchFn - Function to search entities by name
 * @returns Promise resolving to array of entity references
 * 
 * @example
 * ```typescript
 * const mentions = parseMentions('Hello @John Doe');
 * const references = await resolveMentions(mentions, searchEntities);
 * // Returns: [{ type: 'user', id: 'user123', name: 'John Doe' }]
 * ```
 */
export async function resolveMentions(
	mentions: Mention[],
	entitySearchFn: (query: string) => Promise<{ type: string; id: number | string; name: string }[]>
): Promise<EntityReference[]> {
	const references: EntityReference[] = [];
	const uniqueNames = new Set(mentions.map(m => m.name.toLowerCase()));
	
	if (import.meta.env.DEV) {
		console.log(`[resolveMentions] Resolving ${uniqueNames.size} unique mentions:`, Array.from(uniqueNames));
	}
	
	// Resolve each unique mention
	for (const name of uniqueNames) {
		try {
			const results = await entitySearchFn(name);
			
			if (import.meta.env.DEV) {
				console.log(`[resolveMentions] Search for "${name}" returned ${results.length} results:`, results);
			}
			
			if (results.length > 0) {
				// Prioritize exact matches and user matches
				// First, try to find an exact name match (case-insensitive)
				let match = results.find(r => r.name.toLowerCase() === name.toLowerCase());
				
				// If no exact match, prioritize users (for @mentions, users are most common)
				if (!match) {
					match = results.find(r => r.type === 'user');
				}
				
				// If still no match, just take the first result
				if (!match) {
					match = results[0];
				}
				
				references.push({
					type: match.type as 'project' | 'case' | 'task' | 'process' | 'user',
					id: match.id,
					name: match.name
				});
				
				if (import.meta.env.DEV) {
					console.log(`[resolveMentions] Resolved "${name}" to:`, { type: match.type, id: match.id, name: match.name });
				}
			} else {
				if (import.meta.env.DEV) {
					console.warn(`[resolveMentions] No results found for mention "${name}"`);
				}
			}
		} catch (error) {
			console.error(`[resolveMentions] Error resolving mention "${name}":`, error);
			// Continue with other mentions even if one fails
		}
	}
	
	if (import.meta.env.DEV) {
		console.log(`[resolveMentions] Resolved ${references.length} references:`, references);
	}
	
	return references;
}

/**
 * Replace @mentions in text with formatted links
 * 
 * @param text - Original text with @mentions
 * @param references - Resolved entity references
 * @param formatLink - Function to format mention as link (returns HTML or plain text)
 * @returns Text with @mentions replaced by formatted links
 * 
 * @example
 * ```typescript
 * const text = 'Hello @John Doe';
 * const refs = [{ type: 'user', id: '123', name: 'John Doe' }];
 * const formatted = replaceMentions(text, refs, (ref) => `<a href="/users/${ref.id}">@${ref.name}</a>`);
 * // Returns: 'Hello <a href="/users/123">@John Doe</a>'
 * ```
 */
export function replaceMentions(
	text: string,
	references: EntityReference[],
	formatLink: (ref: EntityReference) => string
): string {
	let result = text;
	const mentions = parseMentions(text);
	
	// Replace mentions in reverse order to preserve positions
	for (let i = mentions.length - 1; i >= 0; i--) {
		const mention = mentions[i];
		const ref = references.find(r => 
			r.name.toLowerCase() === mention.name.toLowerCase()
		);
		
		if (ref) {
			const link = formatLink(ref);
			result = result.slice(0, mention.position) + 
			         link + 
			         result.slice(mention.position + mention.fullText.length);
		}
	}
	
	return result;
}

