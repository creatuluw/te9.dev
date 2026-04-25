/**
 * Attachment Helpers - Pure functions for attachment URL handling (EC-6)
 *
 * Messages with many attachments store only URLs in the JSONB column.
 * Email notifications include links (not embedded files).
 * SSE push events include attachment metadata.
 *
 * All functions are pure — no side effects, easy to test.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * SSE attachment metadata for real-time push events
 */
export interface SSEAttachment {
  url: string;
  filename: string;
  isImage: boolean;
}

/**
 * Result of validating an attachments array
 */
export interface ValidationResult {
  valid: boolean;
  urls: string[];
}

// ---------------------------------------------------------------------------
// Image extension detection
// ---------------------------------------------------------------------------

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

/**
 * Check if a URL points to an image file based on its extension.
 *
 * Extracted from MessageList.svelte (and 7 other components) into a
 * shared utility to avoid duplication and ensure consistent behaviour.
 *
 * @param url - URL string to check
 * @returns true if the URL has an image file extension
 */
export function isImageFile(url: string): boolean {
  const lowerUrl = url.toLowerCase();

  // Strip query parameters and fragments to get the clean path
  const pathOnly = lowerUrl.split("?")[0].split("#")[0];

  return IMAGE_EXTENSIONS.some((ext) => pathOnly.endsWith(ext));
}

// ---------------------------------------------------------------------------
// Attachment validation
// ---------------------------------------------------------------------------

/**
 * Validate that all attachments are proper URL strings.
 *
 * EC-6: Messages with many attachments store only URLs.
 * This function verifies that every entry in the attachments array
 * is a non-empty string with an http(s):// scheme.
 *
 * No limit on the number of URLs — supports 10+ attachments.
 *
 * @param attachments - Array of attachment strings to validate
 * @returns Validation result with `valid` flag and the `urls` array
 */
export function validateAttachments(attachments: string[]): ValidationResult {
  if (attachments.length === 0) {
    return { valid: true, urls: [] };
  }

  for (const item of attachments) {
    // Must be a string
    if (typeof item !== "string") {
      return { valid: false, urls: [] };
    }

    // Must be non-empty
    if (item.length === 0) {
      return { valid: false, urls: [] };
    }

    // Must be a full URL with http(s) scheme
    if (!item.startsWith("http://") && !item.startsWith("https://")) {
      return { valid: false, urls: [] };
    }
  }

  return { valid: true, urls: [...attachments] };
}

// ---------------------------------------------------------------------------
// Filename extraction
// ---------------------------------------------------------------------------

/**
 * Extract the filename from a URL path.
 *
 * Handles URLs with query parameters and fragments.
 * Returns the last path segment (e.g., "report.pdf" from
 * "https://cdn.example.com/files/reports/Q4/report.pdf?token=abc").
 *
 * @param url - Full URL string
 * @returns Filename from the URL path
 */
function extractFilename(url: string): string {
  try {
    // Remove query parameters and fragments
    const pathOnly = url.split("?")[0].split("#")[0];

    // Get the last segment of the path
    const segments = pathOnly.split("/");
    const lastSegment = segments[segments.length - 1];

    // Return the last segment, or the full pathOnly if something went wrong
    return lastSegment || pathOnly;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Email attachment formatting
// ---------------------------------------------------------------------------

/**
 * Format attachments as HTML links for email notifications.
 *
 * EC-6: Email notifications include links, not embedded files.
 * Returns an HTML unordered list with anchor tags pointing to each attachment.
 * No `<img>` embedding, no base64 data — just clickable links.
 *
 * @param attachments - Array of attachment URL strings
 * @returns HTML string with `<ul>/<li>/<a>` structure, or empty string for no attachments
 */
export function formatEmailAttachments(attachments: string[]): string {
  if (attachments.length === 0) {
    return "";
  }

  const items = attachments.map((url) => {
    const filename = extractFilename(url);
    return `<li><a href="${url}">${filename}</a></li>`;
  });

  return `<ul>${items.join("")}</ul>`;
}

// ---------------------------------------------------------------------------
// SSE attachment formatting
// ---------------------------------------------------------------------------

/**
 * Format attachments as SSE metadata objects.
 *
 * EC-6: SSE push includes metadata (url, filename, isImage).
 * Used when pushing `message.new` events through the SSE connection manager.
 *
 * @param attachments - Array of attachment URL strings
 * @returns Array of SSEAttachment metadata objects
 */
export function formatSSEAttachments(attachments: string[]): SSEAttachment[] {
  return attachments.map((url) => ({
    url,
    filename: extractFilename(url),
    isImage: isImageFile(url),
  }));
}
