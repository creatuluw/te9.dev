/**
 * Delivery Tracking Service
 *
 * Tracks delivery status for SSE push and email delivery.
 * All updates are best-effort (never throw, always return ok()).
 *
 * FR-6: Delivery Status Tracking
 */

import { ok, type Result } from '$lib/types/result';
import type { AppError } from '$lib/types/errors';
import { updateRowsResult } from '$lib/utils/postgrest';
import type { Message } from '$lib/schemas/message';

/**
 * Mark a message as delivered (successful SSE push or email send).
 * Also used for offline users — they'll see the message on next login.
 *
 * @param messageId - ID of the message to mark as delivered
 * @returns Result<boolean, AppError> — ok(true) on success, ok(false) on failure
 */
export async function markDelivered(messageId: number): Promise<Result<boolean, AppError>> {
	try {
		const result = await updateRowsResult<Message>(
			'_bpm_messages',
			{ id: `eq.${messageId}` },
			{ delivery_status: 'delivered' }
		);
		return result.success ? ok(true) : ok(false);
	} catch (error) {
		console.error('[deliveryTrackingService] Failed to mark delivered:', error);
		return ok(false);
	}
}

/**
 * Mark a message as failed (SSE push or email send failed).
 * Sets delivery_status to 'failed', stores the error message,
 * and includes delivery_attempts for tracking.
 *
 * Note: PostgREST does not support atomic increments (SET x = x + 1).
 * The delivery_attempts field is included for awareness; a proper atomic
 * increment would require an RPC/stored procedure call.
 *
 * @param messageId - ID of the message to mark as failed
 * @param errorMessage - Error description from the failed delivery attempt
 * @returns Result<boolean, AppError> — ok(true) on success, ok(false) on failure
 */
export async function markFailed(
	messageId: number,
	errorMessage: string
): Promise<Result<boolean, AppError>> {
	try {
		const result = await updateRowsResult<Message>(
			'_bpm_messages',
			{ id: `eq.${messageId}` },
			{
				delivery_status: 'failed',
				delivery_error_message: errorMessage,
				delivery_attempts: 1
			}
		);
		return result.success ? ok(true) : ok(false);
	} catch (error) {
		console.error('[deliveryTrackingService] Failed to mark failed:', error);
		return ok(false);
	}
}

/**
 * Mark a message as pending (reset for retry).
 * Used to reset a failed message back to pending state before retrying delivery.
 *
 * @param messageId - ID of the message to mark as pending
 * @returns Result<boolean, AppError> — ok(true) on success, ok(false) on failure
 */
export async function markPending(messageId: number): Promise<Result<boolean, AppError>> {
	try {
		const result = await updateRowsResult<Message>(
			'_bpm_messages',
			{ id: `eq.${messageId}` },
			{ delivery_status: 'pending' }
		);
		return result.success ? ok(true) : ok(false);
	} catch (error) {
		console.error('[deliveryTrackingService] Failed to mark pending:', error);
		return ok(false);
	}
}
