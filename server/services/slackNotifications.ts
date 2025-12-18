/**
 * Slack Notifications Service
 * 
 * Sends notifications to Slack channels using incoming webhooks
 * Based on Slack API documentation: https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/
 */

export interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
    accessory?: any;
    block_id?: string;
  }>;
  thread_ts?: string; // For threaded replies
}

export interface SlackNotificationConfig {
  webhookUrl: string;
  channel?: string; // Display only, cannot override webhook channel
  enabled: boolean;
}

/**
 * Send a message to Slack via incoming webhook
 */
export async function sendSlackNotification(
  webhookUrl: string,
  message: SlackMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Slack webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    return false;
  }
}

/**
 * Send a simple text notification to Slack
 */
export async function sendSlackTextNotification(
  webhookUrl: string,
  text: string
): Promise<boolean> {
  return sendSlackNotification(webhookUrl, { text });
}

/**
 * Send a rich notification with Block Kit formatting
 */
export async function sendSlackRichNotification(
  webhookUrl: string,
  title: string,
  message: string,
  fields?: Array<{ label: string; value: string }>,
  color?: "good" | "warning" | "danger"
): Promise<boolean> {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: message,
      },
    },
  ];

  if (fields && fields.length > 0) {
    blocks.push({
      type: "section",
      fields: fields.map((field) => ({
        type: "mrkdwn",
        text: `*${field.label}*\n${field.value}`,
      })),
    });
  }

  // Add color indicator using context block
  if (color) {
    const emoji = color === "good" ? "✅" : color === "warning" ? "⚠️" : "🚨";
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${emoji} ${color.toUpperCase()}`,
        },
      ],
    });
  }

  return sendSlackNotification(webhookUrl, {
    text: title, // Fallback text for notifications
    blocks,
  });
}

/**
 * Send budget alert to Slack
 */
export async function sendBudgetAlertToSlack(
  webhookUrl: string,
  alert: {
    companyName: string;
    alertType: "warning" | "critical" | "paused" | "override";
    currentSpending: number;
    monthlyLimit: number;
    message: string;
  }
): Promise<boolean> {
  const percentageUsed = (alert.currentSpending / alert.monthlyLimit) * 100;
  const emoji = getAlertEmoji(alert.alertType);
  const color = getAlertColor(alert.alertType);

  return sendSlackRichNotification(
    webhookUrl,
    `${emoji} AI Budget Alert - ${alert.companyName}`,
    alert.message,
    [
      { label: "Current Spending", value: `$${alert.currentSpending.toFixed(2)}` },
      { label: "Monthly Limit", value: `$${alert.monthlyLimit.toFixed(2)}` },
      { label: "Usage", value: `${percentageUsed.toFixed(1)}%` },
    ],
    color
  );
}

/**
 * Send LLM usage alert to Slack
 */
export async function sendLLMUsageAlertToSlack(
  webhookUrl: string,
  alert: {
    companyName: string;
    provider: string;
    totalTokens: number;
    estimatedCost: number;
    threshold: number;
  }
): Promise<boolean> {
  return sendSlackRichNotification(
    webhookUrl,
    `⚠️ LLM Usage Alert - ${alert.companyName}`,
    `Your company has reached ${alert.threshold}% of the configured LLM usage threshold.`,
    [
      { label: "Provider", value: alert.provider },
      { label: "Total Tokens", value: alert.totalTokens.toLocaleString() },
      { label: "Estimated Cost", value: `$${alert.estimatedCost.toFixed(2)}` },
    ],
    "warning"
  );
}

/**
 * Send application status notification to Slack
 */
export async function sendApplicationStatusToSlack(
  webhookUrl: string,
  notification: {
    candidateName: string;
    jobTitle: string;
    status: string;
    recruiterName: string;
  }
): Promise<boolean> {
  return sendSlackRichNotification(
    webhookUrl,
    `📋 Application Status Update`,
    `Application status has been updated`,
    [
      { label: "Candidate", value: notification.candidateName },
      { label: "Job", value: notification.jobTitle },
      { label: "Status", value: notification.status },
      { label: "Recruiter", value: notification.recruiterName },
    ]
  );
}

/**
 * Send interview reminder to Slack
 */
export async function sendInterviewReminderToSlack(
  webhookUrl: string,
  reminder: {
    candidateName: string;
    jobTitle: string;
    interviewType: string;
    scheduledAt: Date;
    meetingLink?: string;
  }
): Promise<boolean> {
  const timeString = reminder.scheduledAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const message = reminder.meetingLink
    ? `Interview scheduled for *${reminder.candidateName}*\n<${reminder.meetingLink}|Join Meeting>`
    : `Interview scheduled for *${reminder.candidateName}*`;

  return sendSlackRichNotification(
    webhookUrl,
    `📅 Interview Reminder`,
    message,
    [
      { label: "Job", value: reminder.jobTitle },
      { label: "Type", value: reminder.interviewType },
      { label: "Time", value: timeString },
    ]
  );
}

/**
 * Send system health alert to Slack
 */
export async function sendSystemHealthAlertToSlack(
  webhookUrl: string,
  alert: {
    service: string;
    status: "degraded" | "down" | "recovered";
    message: string;
    timestamp: Date;
  }
): Promise<boolean> {
  const emoji = alert.status === "recovered" ? "✅" : alert.status === "degraded" ? "⚠️" : "🚨";
  const color = alert.status === "recovered" ? "good" : alert.status === "degraded" ? "warning" : "danger";

  return sendSlackRichNotification(
    webhookUrl,
    `${emoji} System Health Alert`,
    alert.message,
    [
      { label: "Service", value: alert.service },
      { label: "Status", value: alert.status.toUpperCase() },
      { label: "Time", value: alert.timestamp.toLocaleString() },
    ],
    color
  );
}

/**
 * Test Slack webhook connection
 */
export async function testSlackWebhook(webhookUrl: string): Promise<boolean> {
  return sendSlackTextNotification(
    webhookUrl,
    "🎉 Slack integration test successful! Your webhook is working correctly."
  );
}

// Helper functions
function getAlertEmoji(alertType: string): string {
  switch (alertType) {
    case "warning":
      return "⚠️";
    case "critical":
      return "🚨";
    case "paused":
      return "⏸️";
    case "override":
      return "✅";
    default:
      return "ℹ️";
  }
}

function getAlertColor(alertType: string): "good" | "warning" | "danger" {
  switch (alertType) {
    case "warning":
      return "warning";
    case "critical":
    case "paused":
      return "danger";
    case "override":
      return "good";
    default:
      return "warning";
  }
}
