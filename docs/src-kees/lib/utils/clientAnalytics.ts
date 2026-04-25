/**
 * Client-side analytics utilities - Minimal tracking
 *
 * Tracks only: page visits (with start_time/end_time), sessions, and login events
 */

import * as analyticsService from "$lib/services/analyticsService";
import { NetworkError } from "$lib/types/errors";

export class ClientAnalytics {
  private currentUrl: string = "";
  private currentTitle: string = "";
  private currentRecordId: number | null = null;
  private sessionStartTime: number = Date.now();
  private isTrackingActive: boolean = false;
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private pageHideHandler: (() => void) | null = null;
  private wasTabHidden: boolean = false;

  /**
   * Track a page view - creates record with start_time, updates previous record with end_time
   *
   * @param url - Page URL
   * @param title - Page title
   */
  async trackPageView(url: string, title: string) {
    // If we have a previous page, update it with end_time
    if (this.currentRecordId && this.currentUrl && this.currentUrl !== url) {
      await this.updateEndTime(this.currentRecordId, false);
    }

    // If tab was hidden and is now visible again, or if URL changed, create a new record
    // Track new page visit with start_time
    const result = await analyticsService.trackPageVisitStart(url, title);
    if (result.success) {
      this.currentRecordId = result.value.id;
      this.wasTabHidden = false; // Reset flag when new record is created
    } else {
      // Only log errors in dev mode, and suppress service unavailable errors (expected when PostgREST is down)
      const statusCode =
        result.error instanceof NetworkError
          ? result.error.statusCode
          : undefined;
      const isServiceUnavailable =
        statusCode === 503 ||
        statusCode === 502 ||
        result.error?.message?.includes("Service Unavailable") ||
        result.error?.message?.includes("schema cache");

      if (!isServiceUnavailable && import.meta.env?.DEV) {
        console.warn("Analytics tracking failed (non-critical):", result.error);
      }
      this.currentRecordId = null;
    }

    // Update tracking state for new page
    this.currentUrl = url;
    this.currentTitle = title;
  }

  /**
   * Update end_time for a page visit record
   *
   * @param recordId - Analytics log record ID to update
   * @param useBeacon - Whether to use sendBeacon (for unload events)
   */
  private async updateEndTime(
    recordId: number,
    useBeacon: boolean = false,
  ): Promise<void> {
    if (useBeacon && navigator.sendBeacon) {
      // Use sendBeacon for reliable tracking during page unload
      // This is more reliable than async fetch during beforeunload
      const endpoint = "/api/analytics/end-visit";
      const formData = new FormData();
      formData.append("recordId", recordId.toString());

      const sent = navigator.sendBeacon(endpoint, formData);
      if (!sent) {
        // Fallback to regular fetch if beacon fails
        await analyticsService.trackPageVisitEnd(recordId).catch(console.error);
      }
    } else {
      // Regular async update for visibility changes and navigation
      await analyticsService.trackPageVisitEnd(recordId).catch(console.error);
    }
  }

  /**
   * Update current page visit with end_time when leaving the site
   */
  private async trackFinalPageVisit() {
    if (this.currentRecordId) {
      // Use beacon for reliable unload tracking
      await this.updateEndTime(this.currentRecordId, true);
      this.currentRecordId = null;
    }
  }

  /**
   * Handle tab visibility changes - update end_time when tab becomes hidden
   */
  private async handleVisibilityChange() {
    if (document.hidden && this.currentRecordId && !this.wasTabHidden) {
      // Tab became inactive - update end_time immediately
      await this.updateEndTime(this.currentRecordId, false).catch(
        console.error,
      );
      this.wasTabHidden = true;
    } else if (
      !document.hidden &&
      this.wasTabHidden &&
      this.currentUrl &&
      this.currentTitle
    ) {
      // Tab became visible again - create a new record to track the new viewing session
      // This ensures we capture separate viewing sessions on the same page
      this.wasTabHidden = false;
      // Create a new record for the resumed viewing session
      const result = await analyticsService.trackPageVisitStart(
        this.currentUrl,
        this.currentTitle,
      );
      if (result.success) {
        this.currentRecordId = result.value.id;
      } else {
        // Suppress service unavailable errors (expected when PostgREST is down)
        const statusCode =
          result.error instanceof NetworkError
            ? result.error.statusCode
            : undefined;
        const isServiceUnavailable =
          statusCode === 503 ||
          statusCode === 502 ||
          result.error?.message?.includes("Service Unavailable") ||
          result.error?.message?.includes("schema cache");

        if (!isServiceUnavailable && import.meta.env?.DEV) {
          console.warn(
            "Analytics tracking failed (non-critical):",
            result.error,
          );
        }
      }
    }
  }

  /**
   * Setup automatic tracking for page unload and visibility events
   */
  setupAutoTracking() {
    if (this.isTrackingActive) {
      // Already set up, don't add duplicate listeners
      return;
    }

    this.isTrackingActive = true;

    // Handle tab visibility changes (when user switches tabs or minimizes window)
    this.visibilityChangeHandler = () => {
      // Call async handler but don't await (fire and forget for event handlers)
      this.handleVisibilityChange().catch(console.error);
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);

    // Handle page unload (when user closes tab/window or navigates away)
    // Use both beforeunload and pagehide for maximum coverage
    this.beforeUnloadHandler = () => {
      // Use beacon for reliable tracking during unload
      this.trackFinalPageVisit();
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    // pagehide is more reliable than beforeunload in some browsers
    this.pageHideHandler = () => {
      this.trackFinalPageVisit();
    };
    window.addEventListener("pagehide", this.pageHideHandler);
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler,
      );
      this.visibilityChangeHandler = null;
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    if (this.pageHideHandler) {
      window.removeEventListener("pagehide", this.pageHideHandler);
      this.pageHideHandler = null;
    }
    this.isTrackingActive = false;
  }

  /**
   * Get session start time
   */
  getSessionStartTime(): number {
    return this.sessionStartTime;
  }
}

export const clientAnalytics = new ClientAnalytics();
