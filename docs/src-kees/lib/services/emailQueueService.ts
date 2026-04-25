/**
 * Email queue service - Manages email delivery queue with exponential backoff and dead letter handling
 *
 * Provides reliable email delivery through a queue system with:
 * - Exponential backoff retries (2min → 8min → 32min)
 * - Dead letter handling after max attempts (3)
 * - Event logging for audit trail (EC-2)
 * - Status tracking for admin dashboard
 *
 * All methods return Result<T, AppError> for consistent error handling.
 */

import {
  insertRowResult,
  queryTableResult,
  updateRowsResult,
} from "$lib/utils/postgrest";
import { sendEmail } from "./emailService";
import { logEvent } from "./eventLogService";
import { checkQueueOverflow, sortQueueByFIFO } from "$lib/utils/queueMonitor";
import { ok, err, type Result } from "$lib/types/result";
import type { AppError } from "$lib/types/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Represents a row in the _bpm_email_queue table
 */
export interface EmailQueueEntry {
  id: number;
  message_id: number;
  email_data: EmailQueuePayload;
  status: "pending" | "processing" | "sent" | "failed" | "dead";
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Email data payload stored in the queue
 */
export interface EmailQueuePayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  messageId?: number;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

/**
 * Queue status counts for admin dashboard
 */
export interface QueueStatus {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  dead: number;
}

/**
 * Result of processing the queue
 */
export interface ProcessQueueResult {
  processed: number;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Calculate the retry delay in milliseconds using exponential backoff.
 *
 * Formula: 2 * 4^attempts minutes
 * - Attempt 0: 2 minutes  (120,000ms)
 * - Attempt 1: 8 minutes  (480,000ms)
 * - Attempt 2: 32 minutes (1,920,000ms)
 *
 * @param attempts - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempts: number): number {
  return 2 * Math.pow(4, attempts) * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Queue helpers
// ---------------------------------------------------------------------------

/**
 * Get the current count of pending jobs in the queue.
 * Used by enqueue() to check overflow threshold.
 *
 * @returns Number of pending jobs, or 0 on error (fail-open)
 */
async function getPendingCount(): Promise<number> {
  try {
    const queryResult = await queryTableResult<{ status: string }>(
      "_bpm_email_queue",
      {
        select: "status",
        filter: { status: "eq.pending" },
      },
    );

    if (!queryResult.success) {
      return 0; // Fail-open: don't block enqueue on query failure
    }

    return queryResult.value.data.length;
  } catch {
    return 0; // Fail-open: don't block enqueue on exception
  }
}

// ---------------------------------------------------------------------------
// Queue operations
// ---------------------------------------------------------------------------

/**
 * Enqueue an email for delivery.
 *
 * Inserts into _bpm_email_queue with status='pending', attempts=0, max_attempts=3.
 * The email will be picked up by the next processQueue() call.
 *
 * @param messageId - Internal message ID for tracking
 * @param emailData - Email payload to send
 * @returns Result containing the created queue entry or error
 */
export async function enqueue(
  messageId: number,
  emailData: EmailQueuePayload,
): Promise<Result<EmailQueueEntry, AppError>> {
  const now = new Date().toISOString();

  // EC-2: Check for queue overflow — log warning but do NOT block enqueue
  const pendingCount = await getPendingCount();
  const overflow = checkQueueOverflow(pendingCount);
  if (overflow.isOverThreshold && overflow.warning) {
    console.warn(`[emailQueueService] ${overflow.warning}`);
  }

  const result = await insertRowResult<EmailQueueEntry>("_bpm_email_queue", {
    message_id: messageId,
    email_data: emailData,
    status: "pending",
    attempts: 0,
    max_attempts: 3,
    next_attempt_at: now,
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value);
}

/**
 * Process pending and failed jobs in the queue.
 *
 * Picks up jobs where status IN ('pending','failed') AND next_attempt_at <= now().
 * For each job:
 * 1. Attempts to send the email via emailService
 * 2. On success: marks as 'sent'
 * 3. On failure: increments attempts
 *    - If attempts >= max_attempts: marks as 'dead' and logs event (EC-2)
 *    - Otherwise: marks as 'failed' with exponential backoff for next retry
 *
 * @returns Result containing the count of processed jobs or error
 */
export async function processQueue(): Promise<
  Result<ProcessQueueResult, AppError>
> {
  // Query for pending/failed jobs that are ready to be processed
  const now = new Date().toISOString();
  const queryResult = await queryTableResult<EmailQueueEntry>(
    "_bpm_email_queue",
    {
      filter: {
        status: "in.(pending,failed)",
        next_attempt_at: `lte.${now}`,
      },
    },
  );

  if (!queryResult.success) {
    return err(queryResult.error);
  }

  const rawJobs = queryResult.value.data;

  // EC-2: Process FIFO — oldest next_attempt_at first
  const jobs = sortQueueByFIFO(rawJobs);
  let processed = 0;

  for (const job of jobs) {
    // Attempt to send the email
    const sendResult = await sendEmail(job.email_data);

    if (sendResult.success) {
      // Success: mark as sent
      const updateResult = await updateRowsResult<EmailQueueEntry>(
        "_bpm_email_queue",
        { id: `eq.${job.id}` },
        { status: "sent" },
      );

      if (!updateResult.success) {
        console.error(
          `[emailQueueService] Failed to update job ${job.id} to 'sent':`,
          updateResult.error,
        );
      }
    } else {
      // Failure: increment attempts
      const newAttempts = job.attempts + 1;
      const errorMessage = sendResult.error?.message || "Unknown error";

      if (newAttempts >= job.max_attempts) {
        // Max attempts reached: mark as dead and log event (EC-2)
        const updateResult = await updateRowsResult<EmailQueueEntry>(
          "_bpm_email_queue",
          { id: `eq.${job.id}` },
          {
            status: "dead",
            attempts: newAttempts,
          },
        );

        if (!updateResult.success) {
          console.error(
            `[emailQueueService] Failed to update job ${job.id} to 'dead':`,
            updateResult.error,
          );
        }

        // Log dead letter event (EC-2)
        await logEvent("email_dead_letter", "email_queue", job.id, {
          metadata: {
            message_id: job.message_id,
            error: errorMessage,
          },
        }).catch((e) => {
          console.error(
            "[emailQueueService] Failed to log dead letter event:",
            e,
          );
        });
      } else {
        // Retry with exponential backoff
        const delay = calculateRetryDelay(job.attempts);
        const nextAttempt = new Date(Date.now() + delay).toISOString();

        const updateResult = await updateRowsResult<EmailQueueEntry>(
          "_bpm_email_queue",
          { id: `eq.${job.id}` },
          {
            status: "failed",
            attempts: newAttempts,
            next_attempt_at: nextAttempt,
          },
        );

        if (!updateResult.success) {
          console.error(
            `[emailQueueService] Failed to update job ${job.id} for retry:`,
            updateResult.error,
          );
        }
      }
    }

    processed++;
  }

  return ok({ processed });
}

/**
 * Get queue status counts grouped by status for admin dashboard.
 *
 * @returns Result containing counts for each status (pending, processing, sent, failed, dead)
 */
export async function getQueueStatus(): Promise<Result<QueueStatus, AppError>> {
  // Query all rows selecting only status column for counting
  // Supports both individual rows and pre-aggregated { status, count } rows
  const queryResult = await queryTableResult<{
    status: string;
    count?: number;
  }>("_bpm_email_queue", {
    select: "status",
  });

  if (!queryResult.success) {
    return err(queryResult.error);
  }

  // Aggregate counts by status
  const rows = queryResult.value.data;
  const counts: QueueStatus = {
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    dead: 0,
  };

  for (const row of rows) {
    const status = row.status as keyof QueueStatus;
    if (status in counts) {
      counts[status] += row.count ?? 1;
    }
  }

  return ok(counts);
}

/**
 * Re-queue a dead letter for immediate processing.
 *
 * Resets the job status to 'pending', attempts to 0, and sets next_attempt_at to now.
 * This allows administrators to manually retry failed emails.
 *
 * @param queueId - ID of the queue entry to retry
 * @returns Result containing the updated queue entry or error
 */
export async function retryFailed(
  queueId: number,
): Promise<Result<EmailQueueEntry, AppError>> {
  const now = new Date().toISOString();

  const result = await updateRowsResult<EmailQueueEntry>(
    "_bpm_email_queue",
    { id: `eq.${queueId}` },
    {
      status: "pending",
      attempts: 0,
      next_attempt_at: now,
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  // Return the first updated entry
  const entries = result.value;
  if (entries.length === 0) {
    return err(
      new Error(`Queue entry ${queueId} not found`) as unknown as AppError,
    );
  }

  return ok(entries[0]);
}
