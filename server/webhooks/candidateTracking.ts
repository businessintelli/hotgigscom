import { Request, Response } from "express";
import { getDb } from "../db";
import { candidateInteractions } from "../../drizzle/schema";
import { updatePredictionWithInteraction } from "../services/predictionFeedback";

/**
 * Webhook handler for tracking calendar link clicks
 * Expected payload: { candidateId, interviewId?, linkUrl, metadata? }
 */
export async function handleCalendarLinkClick(req: Request, res: Response) {
  try {
    const { candidateId, interviewId, linkUrl, metadata } = req.body;
    
    if (!candidateId) {
      return res.status(400).json({ error: "candidateId is required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    await db.insert(candidateInteractions).values({
      candidateId: parseInt(candidateId),
      interviewId: interviewId ? parseInt(interviewId) : null,
      interactionType: "calendar_link_clicked",
      linkUrl,
      metadata: metadata ? JSON.stringify(metadata) : null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
    });

    console.log(`[Tracking] Calendar link clicked by candidate ${candidateId}`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Tracking] Calendar link click error:", error);
    return res.status(500).json({ error: "Failed to track interaction" });
  }
}

/**
 * Webhook handler for tracking interview booking confirmations
 * Expected payload: { candidateId, interviewId, applicationId?, metadata? }
 */
export async function handleInterviewBooked(req: Request, res: Response) {
  try {
    const { candidateId, interviewId, applicationId, metadata } = req.body;
    
    if (!candidateId || !interviewId) {
      return res.status(400).json({ error: "candidateId and interviewId are required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    await db.insert(candidateInteractions).values({
      candidateId: parseInt(candidateId),
      interviewId: parseInt(interviewId),
      applicationId: applicationId ? parseInt(applicationId) : null,
      interactionType: "interview_booked",
      metadata: metadata ? JSON.stringify(metadata) : null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
    });

    console.log(`[Tracking] Interview booked by candidate ${candidateId} for interview ${interviewId}`);
    
    // Update success prediction model with positive signal
    if (applicationId) {
      await updatePredictionWithInteraction(parseInt(candidateId), parseInt(applicationId), "interview_booked");
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Tracking] Interview booking error:", error);
    return res.status(500).json({ error: "Failed to track interaction" });
  }
}

/**
 * Webhook handler for tracking email interactions (opens, clicks, replies)
 * Expected payload: { candidateId, emailCampaignId?, interactionType, linkUrl?, metadata? }
 */
export async function handleEmailInteraction(req: Request, res: Response) {
  try {
    const { candidateId, emailCampaignId, interactionType, linkUrl, metadata } = req.body;
    
    if (!candidateId || !interactionType) {
      return res.status(400).json({ error: "candidateId and interactionType are required" });
    }

    const validTypes = ["email_opened", "email_clicked", "email_replied"];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({ error: "Invalid interactionType" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    await db.insert(candidateInteractions).values({
      candidateId: parseInt(candidateId),
      emailCampaignId: emailCampaignId ? parseInt(emailCampaignId) : null,
      interactionType: interactionType as "email_opened" | "email_clicked" | "email_replied",
      linkUrl: linkUrl || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
    });

    console.log(`[Tracking] Email ${interactionType} by candidate ${candidateId}`);
    
    // Update success prediction model based on engagement level
    // email_replied = strong positive signal
    // email_clicked = moderate positive signal  
    // email_opened = weak positive signal
    const applicationId = metadata?.applicationId;
    if (applicationId) {
      await updatePredictionWithInteraction(parseInt(candidateId), parseInt(applicationId), interactionType);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Tracking] Email interaction error:", error);
    return res.status(500).json({ error: "Failed to track interaction" });
  }
}

/**
 * Webhook handler for tracking interview reschedules
 * Expected payload: { candidateId, interviewId, metadata? }
 */
export async function handleInterviewRescheduled(req: Request, res: Response) {
  try {
    const { candidateId, interviewId, metadata } = req.body;
    
    if (!candidateId || !interviewId) {
      return res.status(400).json({ error: "candidateId and interviewId are required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    await db.insert(candidateInteractions).values({
      candidateId: parseInt(candidateId),
      interviewId: parseInt(interviewId),
      interactionType: "interview_rescheduled",
      metadata: metadata ? JSON.stringify(metadata) : null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
    });

    console.log(`[Tracking] Interview rescheduled by candidate ${candidateId}`);
    
    // Update success prediction - reschedule might indicate lower commitment
    // but still shows engagement vs complete no-show
    const applicationId = metadata?.applicationId;
    if (applicationId) {
      await updatePredictionWithInteraction(parseInt(candidateId), parseInt(applicationId), "interview_rescheduled");
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Tracking] Interview reschedule error:", error);
    return res.status(500).json({ error: "Failed to track interaction" });
  }
}

/**
 * Webhook handler for tracking interview cancellations
 * Expected payload: { candidateId, interviewId, metadata? }
 */
export async function handleInterviewCancelled(req: Request, res: Response) {
  try {
    const { candidateId, interviewId, metadata } = req.body;
    
    if (!candidateId || !interviewId) {
      return res.status(400).json({ error: "candidateId and interviewId are required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    await db.insert(candidateInteractions).values({
      candidateId: parseInt(candidateId),
      interviewId: parseInt(interviewId),
      interactionType: "interview_cancelled",
      metadata: metadata ? JSON.stringify(metadata) : null,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
    });

    console.log(`[Tracking] Interview cancelled by candidate ${candidateId}`);
    
    // Update success prediction - cancellation is strong negative signal
    const applicationId = metadata?.applicationId;
    if (applicationId) {
      await updatePredictionWithInteraction(parseInt(candidateId), parseInt(applicationId), "interview_cancelled");
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Tracking] Interview cancellation error:", error);
    return res.status(500).json({ error: "Failed to track interaction" });
  }
}
