/**
 * Help Page Helpers - Utilities for help page user flow
 *
 * EC-5: Help page users (magic link auth, no _auth_users record) send messages
 * with sender_user_id=null. No SSE, no mentions, no threading.
 *
 * These helpers provide clear decision points for branching between
 * authenticated user paths and help page user paths.
 */

/**
 * Check if the current user is a help page user (no auth user ID).
 * Help page users authenticate via magic link but don't have an _auth_users record.
 *
 * @param userId - The user ID from auth context
 * @returns true if the user is a help page user (no valid user ID)
 */
export function isHelpPageUser(userId: string | null | undefined): boolean {
	return !userId;
}

/**
 * Build message data for a help page user message.
 * Help page user messages have sender_user_id=null and no mention resolution.
 *
 * @param email - The help page user's email address
 * @param text - The message text
 * @param source - The source URL where the message was created
 * @returns Message data object with help page user defaults
 */
export function getHelpPageMessageData(
	email: string,
	text: string,
	source: string,
) {
	return {
		sender_user_id: null as string | null,
		sender_email: email,
		message_text: text,
		source,
		type: "help" as const,
		msg_type: "in_app" as const,
		references: [] as Array<never>,
		attachments: [] as string[],
	};
}

/**
 * Check if notifications should be skipped for a given sender.
 * Help page users (sender_user_id=null) should not trigger notifications.
 *
 * @param senderUserId - The sender's user ID
 * @returns true if notifications should be skipped
 */
export function shouldSkipNotifications(
	senderUserId: string | null | undefined,
): boolean {
	return !senderUserId;
}

/**
 * Check if mention resolution should be skipped for a given sender.
 * Help page users (sender_user_id=null) cannot @mention team members.
 *
 * @param senderUserId - The sender's user ID
 * @returns true if mention resolution should be skipped
 */
export function shouldSkipMentionResolution(
	senderUserId: string | null | undefined,
): boolean {
	return !senderUserId;
}

/**
 * Get the polling interval for help page users.
 * Help page users use polling instead of SSE for message updates.
 * Shorter interval (5s) since help page interactions are typically brief.
 *
 * @returns Polling interval in milliseconds
 */
export function getHelpPagePollingInterval(): number {
	return 5000; // 5 seconds for help page users
}
