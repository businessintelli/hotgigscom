/**
 * Messaging System Backend Service
 * Handles real-time chat between recruiters and candidates
 */

import { getDb } from "./db";
const db = getDb();
import {
  conversations,
  messages,
  messageAttachments,
  messageTemplates,
  typingIndicators,
  users,
  recruiters,
  candidates,
} from "../drizzle/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { storagePut } from "./storage";

/**
 * Create or get existing conversation between recruiter and candidate
 */
export async function getOrCreateConversation(params: {
  recruiterId: number;
  candidateId: number;
  applicationId?: number;
  jobId?: number;
  subject?: string;
}): Promise<number> {
  const { recruiterId, candidateId, applicationId, jobId, subject } = params;

  // Check if conversation already exists
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.recruiterId, recruiterId),
        eq(conversations.candidateId, candidateId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new conversation
  const [newConversation] = await db
    .insert(conversations)
    .values({
      recruiterId,
      candidateId,
      applicationId,
      jobId,
      subject,
      lastMessageAt: new Date(),
    })
    .$returningId();

  return newConversation.id;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(params: {
  conversationId: number;
  senderId: number;
  senderType: "recruiter" | "candidate";
  content: string;
  attachments?: Array<{
    fileName: string;
    fileData: Buffer;
    mimeType: string;
  }>;
}): Promise<number> {
  const { conversationId, senderId, senderType, content, attachments } = params;

  // Insert message
  const [newMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId,
      senderType,
      content,
      isRead: false,
    })
    .$returningId();

  const messageId = newMessage.id;

  // Upload and attach files if provided
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      const fileKey = `messages/${conversationId}/${messageId}/${Date.now()}-${attachment.fileName}`;
      const { url } = await storagePut(fileKey, attachment.fileData, attachment.mimeType);

      await db.insert(messageAttachments).values({
        messageId,
        fileName: attachment.fileName,
        fileUrl: url,
        fileKey,
        fileSize: attachment.fileData.length,
        mimeType: attachment.mimeType,
      });
    }
  }

  // Update conversation's lastMessageAt
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return messageId;
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: number): Promise<void> {
  await db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(messages.id, messageId));
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(params: {
  conversationId: number;
  userId: number;
}): Promise<void> {
  const { conversationId, userId } = params;

  await db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, userId)
      )
    );
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(params: {
  userId: number;
  userType: "recruiter" | "candidate";
}): Promise<number> {
  const { userId, userType } = params;

  // Get all conversations for this user
  const userConversations = await db
    .select()
    .from(conversations)
    .where(
      userType === "recruiter"
        ? eq(conversations.recruiterId, userId)
        : eq(conversations.candidateId, userId)
    );

  if (userConversations.length === 0) return 0;

  const conversationIds = userConversations.map(c => c.id);

  // Count unread messages NOT sent by this user
  const unreadMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.isRead, false),
        // Message is in one of user's conversations
        or(...conversationIds.map(id => eq(messages.conversationId, id)))
      )
    );

  // Filter out messages sent by the user themselves
  return unreadMessages.filter(m => m.senderId !== userId).length;
}

/**
 * Update typing indicator
 */
export async function updateTypingIndicator(params: {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}): Promise<void> {
  const { conversationId, userId, isTyping } = params;

  // Check if indicator exists
  const existing = await db
    .select()
    .from(typingIndicators)
    .where(
      and(
        eq(typingIndicators.conversationId, conversationId),
        eq(typingIndicators.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(typingIndicators)
      .set({ isTyping, updatedAt: new Date() })
      .where(eq(typingIndicators.id, existing[0].id));
  } else {
    // Create new
    await db.insert(typingIndicators).values({
      conversationId,
      userId,
      isTyping,
    });
  }
}

/**
 * Create message template
 */
export async function createMessageTemplate(params: {
  recruiterId: number;
  templateName: string;
  subject?: string;
  content: string;
  category?: string;
  isPublic?: boolean;
}): Promise<number> {
  const { recruiterId, templateName, subject, content, category, isPublic } = params;

  const [newTemplate] = await db
    .insert(messageTemplates)
    .values({
      recruiterId,
      templateName,
      subject,
      content,
      category,
      isPublic: isPublic || false,
      usageCount: 0,
    })
    .$returningId();

  return newTemplate.id;
}

/**
 * Apply template variables to content
 */
export function applyTemplateVariables(params: {
  template: string;
  variables: Record<string, string>;
}): string {
  const { template, variables } = params;

  let result = template;
  
  // Replace {{variable}} with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: number): Promise<void> {
  const template = await db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.id, templateId))
    .limit(1);

  if (template.length > 0) {
    await db
      .update(messageTemplates)
      .set({ usageCount: template[0].usageCount + 1 })
      .where(eq(messageTemplates.id, templateId));
  }
}
