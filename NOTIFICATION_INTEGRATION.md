# Notification Integration Guide

## Overview

HotGigs platform now includes a comprehensive notification system that sends real-time alerts to Slack and Microsoft Teams webhooks. This system integrates with key platform features including budget management, application tracking, and interview scheduling.

## Features

### 1. Centralized Notification Dispatcher

The notification dispatcher (`server/services/notificationDispatcher.ts`) provides a unified interface for sending notifications to configured Slack/Teams webhooks with:

- **Multi-provider support**: Send to both Slack and Teams simultaneously
- **Automatic retry logic**: Exponential backoff for failed deliveries
- **Delivery tracking**: All notifications logged to database with status and timing
- **Error handling**: Graceful degradation if webhooks fail

### 2. Budget Alert Notifications

Automatically sends notifications when companies approach or exceed AI budget limits:

- **80% threshold warning**: Alert when 80% of monthly budget is used
- **Budget exceeded**: Critical alert when limit is reached
- **AI features paused**: Notification when AI features are automatically disabled
- **Grace period tracking**: Shows remaining time before automatic pause

**Integration Point**: `server/services/budgetEnforcement.ts`

### 3. Application Status Change Notifications

Sends alerts when application statuses are updated:

- **Status transitions**: Notifies when applications move between stages
- **Candidate information**: Includes candidate name and job title
- **Recruiter tracking**: Shows who made the change
- **Real-time updates**: Sent immediately when status changes

**Integration Point**: `server/routers.ts` - `updateStatus` procedure

### 4. Interview Reminder Notifications

Automated cron jobs send interview reminders:

- **24-hour reminders**: Sent once per day for interviews in 23-24 hours
- **1-hour reminders**: Sent every 15 minutes for interviews in 45-60 minutes
- **Meeting details**: Includes candidate name, job title, and interview time
- **Duplicate prevention**: Tracks sent reminders to avoid spam

**Integration Point**: `server/services/interviewReminderCron.ts`

## Setup Instructions

### 1. Database Setup

The notification system requires two new database tables. They have been created automatically:

- `integration_settings`: Stores Slack/Teams webhook configurations
- `notification_delivery_logs`: Tracks all notification deliveries

### 2. Configure Webhooks

#### For Slack:

1. Go to your Slack workspace settings
2. Navigate to "Apps" → "Incoming Webhooks"
3. Create a new webhook for your desired channel
4. Copy the webhook URL
5. Add to HotGigs via Integration Settings page

#### For Microsoft Teams:

1. Open your Teams channel
2. Click "..." → "Connectors" → "Incoming Webhook"
3. Configure the webhook and copy the URL
4. Add to HotGigs via Integration Settings page

### 3. Initialize Company Budgets

Run the budget initialization script to set default $500/month limits for all companies:

```bash
cd /home/ubuntu/hotgigs-platform
node scripts/initialize-budgets.mjs
```

This will:
- Create budget entries for all companies without budgets
- Set monthly limit to $500
- Set alert threshold to 80%
- Set grace period to 24 hours

### 4. Start Interview Reminder Cron

The interview reminder cron jobs start automatically when the server starts. No manual configuration needed.

## API Endpoints

### Integration Settings Management

**Get all integrations for a company:**
```typescript
trpc.integrationSettings.getByCompany.useQuery({ companyId: 1 })
```

**Create new integration:**
```typescript
trpc.integrationSettings.create.useMutation({
  companyId: 1,
  provider: "slack",
  webhookUrl: "https://hooks.slack.com/services/...",
  notificationTypes: ["budget_alert", "application_status", "interview_reminder"]
})
```

**Update integration:**
```typescript
trpc.integrationSettings.update.useMutation({
  id: 1,
  isActive: true,
  notificationTypes: ["budget_alert"]
})
```

**Delete integration:**
```typescript
trpc.integrationSettings.delete.useMutation({ id: 1 })
```

**Test webhook:**
```typescript
trpc.integrationSettings.testWebhook.useMutation({
  webhookUrl: "https://hooks.slack.com/services/...",
  provider: "slack"
})
```

### Budget Management

**Get budget status:**
```typescript
trpc.budgetManagement.getBudgetStatus.useQuery({ companyId: 1 })
```

**Update budget limit:**
```typescript
trpc.budgetManagement.updateBudget.useMutation({
  companyId: 1,
  monthlyLimit: 1000,
  alertThreshold: 80,
  gracePeriodHours: 24
})
```

**Enable budget override:**
```typescript
trpc.budgetManagement.enableOverride.useMutation({
  companyId: 1,
  reason: "Special project requires additional AI usage"
})
```

**Initialize default budgets:**
```typescript
trpc.budgetManagement.initializeDefaultBudgets.useMutation()
```

### Notification Delivery Logs

**Get delivery logs:**
```typescript
trpc.integrationSettings.getDeliveryLogs.useQuery({
  integrationId: 1,
  limit: 50
})
```

## Notification Types

### Budget Alert

**Trigger**: Budget threshold reached or exceeded

**Payload Example**:
```json
{
  "type": "budget_alert",
  "companyId": 1,
  "title": "⚠️ Budget Alert: 80% Threshold Reached",
  "message": "Your company has used 82.5% of the monthly AI budget ($412.50 of $500.00).",
  "severity": "warning",
  "metadata": {
    "currentSpending": 412.50,
    "monthlyLimit": 500.00,
    "percentageUsed": 82.5,
    "alertType": "warning"
  }
}
```

### Application Status Change

**Trigger**: Application status updated by recruiter

**Payload Example**:
```json
{
  "type": "application_status",
  "companyId": 1,
  "title": "📋 Application Status Updated",
  "message": "John Doe's application for \"Senior Developer\" changed from reviewing to interviewing by Jane Smith.",
  "severity": "info",
  "metadata": {
    "candidateName": "John Doe",
    "jobTitle": "Senior Developer",
    "oldStatus": "reviewing",
    "newStatus": "interviewing",
    "recruiterName": "Jane Smith"
  }
}
```

### Interview Reminder

**Trigger**: Automated cron job (24h or 1h before interview)

**Payload Example**:
```json
{
  "type": "interview_reminder",
  "companyId": 1,
  "title": "🔔 Interview Reminder",
  "message": "Interview with John Doe for \"Senior Developer\" is scheduled in 1 hour (2025-12-18 15:00:00).",
  "severity": "warning",
  "metadata": {
    "candidateName": "John Doe",
    "jobTitle": "Senior Developer",
    "interviewTime": "2025-12-18T15:00:00Z",
    "hoursUntil": 1
  }
}
```

## Notification Formats

### Slack Format

Notifications are sent to Slack using the Block Kit format with:
- Color-coded attachments based on severity
- Structured fields for metadata
- Action buttons (where applicable)

### Teams Format

Notifications are sent to Teams using the Adaptive Card format with:
- Color-coded cards based on severity
- Fact sets for metadata
- Action buttons (where applicable)

## Error Handling

The notification system includes comprehensive error handling:

1. **Webhook failures**: Logged to database with error message
2. **Network timeouts**: Automatic retry with exponential backoff
3. **Invalid webhooks**: Caught and logged without breaking main flow
4. **Missing configurations**: Gracefully skipped with console log

## Monitoring

### Delivery Logs

All notification attempts are logged to `notification_delivery_logs` table with:
- Integration ID
- Notification type
- Status (delivered/failed)
- Error message (if failed)
- Delivery time in milliseconds
- Full payload (JSON)
- Timestamp

### Console Logs

The system provides detailed console logging:
```
[NotificationDispatcher] No active integrations for company 1
[NotificationDispatcher] Failed to send to slack: Webhook URL invalid
[InterviewReminderCron] Found 3 interviews for 24h reminders
[InterviewReminderCron] Sent 24h reminder for interview 42
```

## Troubleshooting

### Notifications not sending

1. **Check webhook configuration**: Verify webhook URL is correct and active
2. **Check integration status**: Ensure `isActive` is true
3. **Check delivery logs**: Look for error messages in database
4. **Check console logs**: Server logs show detailed error information
5. **Test webhook**: Use `testWebhook` API to verify webhook works

### Duplicate notifications

1. **Check cron job timing**: Ensure cron jobs aren't running too frequently
2. **Check reminder flags**: Verify `candidateReminder24hSent` and `candidateReminder1hSent` are being set
3. **Check database**: Look for duplicate entries in delivery logs

### Budget alerts not triggering

1. **Check budget configuration**: Verify company has budget entry in database
2. **Check spending tracking**: Ensure `trackSpending` is being called after AI operations
3. **Check alert threshold**: Verify `alertThreshold` is set correctly (default 80%)
4. **Check last alert time**: System prevents duplicate alerts within 24 hours

## Best Practices

1. **Test webhooks before deployment**: Use `testWebhook` API to verify configuration
2. **Monitor delivery logs**: Regularly check for failed deliveries
3. **Set appropriate thresholds**: Adjust budget alert threshold based on company needs
4. **Configure notification types**: Only enable relevant notification types per integration
5. **Use multiple channels**: Configure both Slack and Teams for redundancy
6. **Review grace periods**: Adjust grace period hours based on business requirements

## Future Enhancements

Potential improvements for the notification system:

1. **Email fallback**: Send email if webhook delivery fails
2. **SMS notifications**: Add SMS support for critical alerts
3. **Notification preferences**: Allow users to customize notification frequency
4. **Digest mode**: Batch notifications into daily/weekly digests
5. **Rich formatting**: Add charts and graphs to notifications
6. **Two-way integration**: Allow actions from Slack/Teams to update HotGigs
7. **Custom templates**: Allow companies to customize notification templates
8. **Notification scheduling**: Allow users to set quiet hours

## Support

For issues or questions about the notification system:

1. Check the delivery logs in the database
2. Review server console logs for error messages
3. Test webhooks using the `testWebhook` API
4. Verify integration settings in the admin panel
5. Contact platform support with log details

## Technical Architecture

### Service Layer

- `notificationDispatcher.ts`: Core notification delivery service
- `budgetEnforcement.ts`: Budget tracking and alert logic
- `interviewReminderCron.ts`: Automated interview reminder cron jobs
- `slackNotifications.ts`: Slack-specific formatting and delivery
- `teamsNotifications.ts`: Teams-specific formatting and delivery

### Data Layer

- `integration_settings`: Webhook configurations per company
- `notification_delivery_logs`: Delivery tracking and audit trail
- `company_budgets`: Budget limits and spending tracking
- `interviews`: Interview scheduling with reminder flags

### Router Layer

- `budgetManagement.ts`: Budget configuration and monitoring endpoints
- `integrationSettings.ts`: Webhook management endpoints
- `routers.ts`: Application status update integration

### Cron Layer

- Interview reminder cron jobs run automatically on server start
- 24-hour reminders: Every 60 minutes
- 1-hour reminders: Every 15 minutes
