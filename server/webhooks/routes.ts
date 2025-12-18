import { Router } from "express";
import {
  handleCalendarLinkClick,
  handleInterviewBooked,
  handleEmailInteraction,
  handleInterviewRescheduled,
  handleInterviewCancelled,
} from "./candidateTracking";

const router = Router();

/**
 * Webhook endpoints for candidate interaction tracking
 * These endpoints are called by external services (email providers, calendar tools, etc.)
 * to track candidate engagement and improve prediction models
 */

// Track calendar link clicks
router.post("/webhooks/tracking/calendar-click", handleCalendarLinkClick);

// Track interview bookings
router.post("/webhooks/tracking/interview-booked", handleInterviewBooked);

// Track email interactions (opens, clicks, replies)
router.post("/webhooks/tracking/email-interaction", handleEmailInteraction);

// Track interview reschedules
router.post("/webhooks/tracking/interview-rescheduled", handleInterviewRescheduled);

// Track interview cancellations
router.post("/webhooks/tracking/interview-cancelled", handleInterviewCancelled);

export default router;
