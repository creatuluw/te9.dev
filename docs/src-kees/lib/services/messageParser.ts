/**
 * Message Parser - User-only mention resolution
 *
 * Core mention resolution pipeline for the messaging system.
 * Per FR-5, only type:'user' references are processed.
 * Non-user types (project/case/task/process) exist in the schema for backward compat.
 *
 * EC-7: Unresolvable mentions become plain text, no notification created.
 * EC-7b: Non-user references in preResolved are silently filtered with dev-mode warning.
 */

import type { EntityReference } from '$lib/schemas/message';
import type { AppError } from '$lib/types/errors';
import { ok, type Result } from '$lib/types/result';
import { parseMentions } from '$lib/utils/mentionParser';

/**
 * Result of parsing and resolving mentions from message text.
 */
export interface MentionParseResult {
	references: EntityReference[];
	unresolvedMentions: string[];
}

/**
 * Filter out non-user entity references from a list.
 * Per FR-5, only type:'user' references are processed by the mention pipeline.
 * Non-user types (project/case/task/process) exist in the schema for backward compat.
 * EC-7b: Non-user references are silently filtered, with dev-mode warning logged.
 *
 * @param refs - Array of entity references to filter
 * @returns Array containing only user-type references
 */
export function filterNonUserReferences(refs: EntityReference[]): EntityReference[] {
	const userOnly: EntityReference[] = [];
	const filtered: EntityReference[] = [];

	for (const ref of refs) {
		if (ref.type === 'user') {
			userOnly.push(ref);
		} else {
			filtered.push(ref);
		}
	}

	if (filtered.length > 0 && import.meta.env.DEV) {
		console.warn(
			`[messageParser] Filtered ${filtered.length} non-user entity references:`,
			filtered.map(r => ({ type: r.type, id: r.id, name: r.name }))
		);
	}

	return userOnly;
}

/**
 * Resolve parsed mentions to user-only references.
 * Uses the provided search function (which should query _auth_users).
 * If search fails for a mention, it's added to unresolvedMentions but no error is thrown.
 * EC-7: Unresolvable mentions become plain text, no notification created.
 *
 * @param mentions - Array of mention objects with name property
 * @param searchFn - Function to search users by query string
 * @returns Object with resolved user references and unresolved mention names
 */
export async function resolveUserMentions(
	mentions: Array<{ name: string }>,
	searchFn: (query: string) => Promise<Array<{ type: string; id: number | string; name: string }>>
): Promise<{ resolved: EntityReference[]; unresolved: string[] }> {
	const resolved: EntityReference[] = [];
	const unresolved: string[] = [];
	const seen = new Set<string>();

	for (const mention of mentions) {
		const key = mention.name.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);

		try {
			const results = await searchFn(key);
			if (results.length > 0) {
				// Find best match — exact name match first, then first result
				const match = results.find(r => r.name.toLowerCase() === key) || results[0];
				resolved.push({
					type: 'user',
					id: match.id,
					name: match.name
				});
			} else {
				unresolved.push(mention.name);
			}
		} catch (error) {
			// EC-7: Search failure — mention becomes plain text
			if (import.meta.env.DEV) {
				console.warn(`[messageParser] User search failed for "${mention.name}":`, error);
			}
			unresolved.push(mention.name);
		}
	}

	return { resolved, unresolved };
}

/**
 * Parse @mentions from text and resolve them to user references.
 * Main entry point for mention resolution in the messaging pipeline.
 *
 * @param text - Message text containing @mentions
 * @param preResolvedReferences - Pre-resolved references from autocomplete (optional)
 * @param userSearchFn - Function to search users (queries _auth_users)
 * @returns Result with resolved user references and any unresolved mention names
 */
export async function parseAndResolveMentions(
	text: string,
	preResolvedReferences?: EntityReference[],
	userSearchFn?: (query: string) => Promise<Array<{ type: string; id: number | string; name: string }>>
): Promise<Result<MentionParseResult, AppError>> {
	try {
		// If pre-resolved references are provided, use them directly (after filtering)
		if (preResolvedReferences && preResolvedReferences.length > 0) {
			const userOnlyRefs = filterNonUserReferences(preResolvedReferences);
			return ok({
				references: userOnlyRefs,
				unresolvedMentions: []
			});
		}

		// Parse @mentions from text
		const mentions = parseMentions(text);

		if (mentions.length === 0) {
			return ok({ references: [], unresolvedMentions: [] });
		}

		// Need a search function to resolve
		if (!userSearchFn) {
			// No search function provided — mentions remain unresolved
			return ok({
				references: [],
				unresolvedMentions: mentions.map(m => m.name)
			});
		}

		// Resolve mentions using the search function (user-only)
		const { resolved, unresolved } = await resolveUserMentions(mentions, userSearchFn);

		return ok({
			references: resolved,
			unresolvedMentions: unresolved
		});
	} catch (error) {
		// Graceful degradation — return empty references rather than failing
		return ok({
			references: [],
			unresolvedMentions: []
		});
	}
}
