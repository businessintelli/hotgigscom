# LLM Management System Documentation

## Overview

The HotGigs platform includes a comprehensive LLM (Large Language Model) management system that provides cost tracking, usage alerts, and automatic provider fallback capabilities. This system is designed with role-based access control to serve both Application Admins (system-wide management) and Company Admins (company-specific monitoring).

## Features

### 1. Cost Tracking Dashboard

**Purpose**: Monitor and analyze AI spending across the platform with detailed breakdowns by provider, feature, and time period.

**Access Levels**:
- **Application Admin** (`/admin/llm-cost-tracking`): System-wide cost analytics across all companies
- **Company Admin** (`/company-admin/llm-cost-tracking`): Company-specific cost tracking and optimization tips

**Key Metrics**:
- Total spend for selected period
- Monthly cost projection based on current usage
- Average cost per request
- Total API calls/requests
- Daily cost trends (line chart)
- Cost breakdown by provider (pie chart + detailed stats)
- Cost breakdown by feature (bar chart)

**Provider Pricing** (as of December 2024):
- **Manus**: $0.0001/1K input tokens, $0.0002/1K output tokens
- **Gemini**: $0.00015/1K input tokens, $0.0006/1K output tokens
- **OpenAI**: $0.0015/1K input tokens, $0.002/1K output tokens
- **Ollama**: Self-hosted, no per-token cost

### 2. Usage Alerts System

**Purpose**: Proactive monitoring with email notifications when usage exceeds configured thresholds.

**Access Levels**:
- **Application Admin** (`/admin/llm-alerts`): Create system-wide alerts
- **Company Admin** (`/company-admin/llm-alerts`): Create company-specific alerts

**Alert Types**:
1. **Token Usage Threshold**: Trigger when token consumption exceeds limit
2. **Cost Threshold**: Trigger when spending exceeds budget
3. **Error Rate**: Trigger when API error rate exceeds percentage
4. **Provider Failure**: Trigger when provider failures exceed count

**Alert Periods**:
- Hourly
- Daily
- Weekly
- Monthly

**Alert Configuration**:
- Threshold value (tokens, dollars, percentage, or count)
- Email recipients (comma-separated list)
- Enable/disable toggle
- Scope (system-wide or company-specific)

**Alert History**:
- Timestamp of trigger
- Actual value vs threshold
- Email delivery status
- Alert message details

### 3. Provider Fallback Chain

**Purpose**: Ensure uninterrupted AI operations by automatically failing over to backup providers when the primary provider encounters errors.

**Access Level**: Application Admin only (`/admin/llm-fallback`)

**Configuration**:
- **Priority Order**: Providers are tried in ascending priority order (1 = highest)
- **Max Retries**: Number of retry attempts before moving to next provider
- **Retry Delay**: Wait time (ms) between retry attempts
- **Health Check Interval**: Frequency of automatic health checks
- **Enable/Disable**: Toggle individual providers in fallback chain

**Default Fallback Chain**:
1. Manus (Priority 1) - Platform default
2. Gemini (Priority 2) - First fallback
3. OpenAI (Priority 3) - Second fallback
4. Ollama (Priority 4) - Self-hosted fallback (disabled by default)

**Health Monitoring**:
- Real-time health status (Healthy/Unhealthy)
- Failure count tracking
- Last failure timestamp
- Automatic health checks via scheduled jobs

**Fallback Statistics**:
- Total fallback events
- Successful vs failed failovers
- Provider transition paths
- Historical trend analysis

## Database Schema

### llm_usage_alerts
Stores alert configuration for monitoring thresholds.

```sql
CREATE TABLE llm_usage_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NULL,
  companyId INT NULL,
  alertType ENUM('usage_threshold', 'cost_threshold', 'error_rate', 'provider_failure'),
  threshold DECIMAL(10,2) NOT NULL,
  period ENUM('hourly', 'daily', 'weekly', 'monthly'),
  enabled BOOLEAN DEFAULT TRUE,
  emailRecipients TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### llm_alert_history
Tracks triggered alerts and notification delivery.

```sql
CREATE TABLE llm_alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alertId INT NOT NULL,
  triggeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  alertType VARCHAR(50) NOT NULL,
  threshold DECIMAL(10,2) NOT NULL,
  actualValue DECIMAL(10,2) NOT NULL,
  message TEXT,
  emailSent BOOLEAN DEFAULT FALSE,
  emailSentAt TIMESTAMP NULL
);
```

### llm_cost_tracking
Records detailed cost information for each LLM API call.

```sql
CREATE TABLE llm_cost_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usageLogId INT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  feature VARCHAR(100) NOT NULL,
  tokensUsed INT NOT NULL,
  costPerToken DECIMAL(10,8) NOT NULL,
  totalCost DECIMAL(10,4) NOT NULL,
  companyId INT NULL,
  userId INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### llm_fallback_config
Defines provider fallback chain configuration.

```sql
CREATE TABLE llm_fallback_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  priority INT NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  maxRetries INT DEFAULT 3,
  retryDelayMs INT DEFAULT 1000,
  healthCheckIntervalMs INT DEFAULT 60000,
  lastHealthCheck TIMESTAMP NULL,
  isHealthy BOOLEAN DEFAULT TRUE,
  failureCount INT DEFAULT 0,
  lastFailureAt TIMESTAMP NULL
);
```

### llm_fallback_events
Logs all fallback events for analysis.

```sql
CREATE TABLE llm_fallback_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fromProvider VARCHAR(50) NOT NULL,
  toProvider VARCHAR(50) NOT NULL,
  reason TEXT,
  feature VARCHAR(100),
  success BOOLEAN NOT NULL,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend Services

### llmCostTracking.ts
Handles cost calculation and analytics.

**Key Functions**:
- `calculateCost()`: Calculate and store cost for LLM usage
- `getCostStats()`: Get aggregated cost statistics
- `getTotalCost()`: Get total cost for period
- `getCostByProvider()`: Provider-specific breakdown
- `getCostByFeature()`: Feature-specific breakdown
- `getDailyCostTrend()`: Time-series cost data
- `projectMonthlyCost()`: Forecast monthly spending

### llmAlertService.ts
Manages alert monitoring and triggering.

**Key Functions**:
- `checkAlerts()`: Check all active alerts against current usage
- `checkSingleAlert()`: Evaluate individual alert threshold
- `triggerAlert()`: Log alert and send notification
- `sendAlertEmail()`: Deliver email notification to recipients

**Alert Email Template**:
- Professional gradient header
- Alert details (type, threshold, period)
- Actual value vs threshold comparison
- Recommended actions
- Direct link to cost dashboard

### llmFallback.ts
Implements automatic provider failover.

**Key Functions**:
- `getFallbackChain()`: Retrieve enabled providers in priority order
- `initializeFallbackConfig()`: Set up default fallback chain
- `invokeWithFallback()`: Execute LLM call with automatic failover
- `updateProviderHealth()`: Track provider health status
- `performHealthChecks()`: Run scheduled health checks
- `getFallbackStats()`: Analyze fallback event history

**Failover Logic**:
1. Try preferred provider (if specified)
2. On failure, iterate through fallback chain by priority
3. For each provider, attempt up to `maxRetries` times
4. Wait `retryDelayMs` between retry attempts
5. Update health status after each attempt
6. Log fallback events for analysis
7. Throw error only if all providers fail

## tRPC API Endpoints

### llmManagement Router

**Alert Management**:
- `createAlert`: Create new usage alert (role-based scope)
- `getAlerts`: Retrieve user's accessible alerts
- `updateAlert`: Modify alert configuration
- `deleteAlert`: Remove alert
- `getAlertHistory`: View triggered alerts

**Cost Tracking**:
- `getCostStats`: Aggregated cost statistics
- `getTotalCost`: Total spending for period
- `getCostByProvider`: Provider breakdown
- `getCostByFeature`: Feature breakdown
- `getDailyCostTrend`: Time-series data
- `projectMonthlyCost`: Monthly forecast

**Provider Fallback** (Admin only):
- `getFallbackChain`: Current fallback configuration
- `updateFallbackConfig`: Modify provider settings
- `getFallbackStats`: Fallback event analytics
- `getProviderHealth`: Real-time health status
- `triggerHealthCheck`: Manual health check

## UI Components

### Admin Dashboards

**AdminLLMCostTracking.tsx**:
- System-wide cost overview
- Multi-provider analytics
- Feature cost breakdown
- Provider health status
- Date range filtering (7/30/90 days, 1 year)

**AdminLLMAlerts.tsx**:
- Alert configuration interface
- System-wide alert management
- Alert history with email status
- Create/edit/delete operations

**AdminLLMFallback.tsx**:
- Fallback chain visualization
- Priority-based ordering
- Provider health monitoring
- Retry configuration
- Fallback event statistics

### Company Admin Dashboards

**CompanyLLMCostTracking.tsx**:
- Company-specific cost tracking
- Usage optimization tips
- Monthly projection
- Feature-level breakdown
- Cost-saving recommendations

**CompanyLLMAlerts.tsx**:
- Company-scoped alert creation
- Budget monitoring
- Alert history for company
- Email notification management

## Integration with Existing LLM System

The LLM management system integrates seamlessly with the existing LLM infrastructure:

1. **Cost Tracking Integration**:
   - Automatically called after each `invokeLLM()` call
   - Extracts token usage from response
   - Calculates cost based on provider pricing
   - Stores record in `llm_cost_tracking` table

2. **Alert Monitoring**:
   - Background job checks alerts periodically
   - Queries cost/usage data from tracking tables
   - Compares against configured thresholds
   - Triggers email notifications when exceeded

3. **Fallback Integration**:
   - Wraps existing `invokeLLM()` function
   - Intercepts provider failures
   - Automatically retries with fallback providers
   - Logs all fallback events

## Usage Examples

### Creating a Cost Alert (Company Admin)

```typescript
// User navigates to /company-admin/llm-alerts
// Clicks "Create Alert" button
// Fills form:
{
  alertType: "cost_threshold",
  threshold: 500.00,  // $500
  period: "monthly",
  emailRecipients: "finance@company.com, manager@company.com",
  enabled: true
}
// System automatically scopes to user's company
```

### Viewing Cost Breakdown (Admin)

```typescript
// Navigate to /admin/llm-cost-tracking
// Select date range: "Last 30 days"
// View charts:
// - Daily cost trend: Line chart showing spending over time
// - Cost by provider: Pie chart with Manus, Gemini, OpenAI breakdown
// - Cost by feature: Bar chart showing resume parsing, matching, interviews
```

### Configuring Fallback Chain (Admin)

```typescript
// Navigate to /admin/llm-fallback
// Edit provider configuration:
{
  provider: "gemini",
  priority: 2,
  enabled: true,
  maxRetries: 3,
  retryDelayMs: 1000
}
// Click "Run Health Check" to verify all providers
// View fallback statistics showing successful failovers
```

## Email Notifications

Alert emails are sent using the platform's email service and include:

- **Subject**: "⚠️ LLM Usage Alert: [ALERT_TYPE]"
- **Header**: Gradient purple/pink design with alert icon
- **Body**:
  - Alert type and trigger message
  - Threshold vs actual value
  - Period and scope (system/company)
  - Recommended actions
  - Direct link to cost dashboard
- **Recipients**: Configured email addresses (comma-separated)

## Best Practices

### For Application Admins

1. **Monitor System-Wide Costs**:
   - Review cost dashboard weekly
   - Set conservative system-wide alerts
   - Analyze cost trends by provider and feature

2. **Maintain Fallback Chain**:
   - Keep at least 2 healthy providers enabled
   - Run health checks after provider configuration changes
   - Review fallback events to identify problematic providers

3. **Alert Configuration**:
   - Set multiple alert levels (warning, critical)
   - Include technical team in email recipients
   - Review alert history to tune thresholds

### For Company Admins

1. **Budget Management**:
   - Set monthly cost alerts aligned with budget
   - Review cost breakdown by feature
   - Optimize usage of expensive features

2. **Usage Optimization**:
   - Batch resume parsing instead of individual uploads
   - Use AI matching strategically for high-priority roles
   - Monitor error rates to identify integration issues

3. **Team Communication**:
   - Include relevant stakeholders in alert emails
   - Share cost reports with finance team
   - Educate team on cost-effective AI usage

## Troubleshooting

### Alerts Not Triggering

1. Check alert is enabled (`enabled = true`)
2. Verify threshold is set correctly
3. Confirm email recipients are valid
4. Check alert history for recent triggers (may be rate-limited)

### Inaccurate Cost Calculations

1. Verify provider pricing in `llmCostTracking.ts`
2. Check `llm_usage_logs` for token counts
3. Ensure `calculateCost()` is called after each LLM invocation

### Fallback Not Working

1. Check fallback chain configuration
2. Verify providers are enabled and healthy
3. Review `llm_fallback_events` for error messages
4. Run manual health check from admin dashboard

### Missing Cost Data

1. Confirm `llm_cost_tracking` records are being created
2. Check date range filter in dashboard
3. Verify company ID is correctly associated with usage
4. Review database indexes for query performance

## Future Enhancements

1. **Budget Limits**: Hard limits that pause AI features when exceeded
2. **Cost Allocation**: Distribute costs to specific departments or projects
3. **Provider Benchmarking**: Compare provider performance and cost-effectiveness
4. **Usage Forecasting**: ML-based prediction of future costs
5. **Slack/Teams Integration**: Send alerts to chat platforms
6. **Custom Alert Rules**: Complex conditions with AND/OR logic
7. **Cost Optimization Recommendations**: AI-powered suggestions to reduce spending

## Support

For questions or issues with the LLM Management system:
- **Application Admins**: Contact platform engineering team
- **Company Admins**: Contact your company's platform administrator
- **Documentation**: Refer to this guide and inline code comments
