-- LLM Usage Alerts Configuration
CREATE TABLE IF NOT EXISTS llm_usage_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NULL,
  companyId INT NULL,
  alertType ENUM('usage_threshold', 'cost_threshold', 'error_rate', 'provider_failure') NOT NULL,
  threshold DECIMAL(10,2) NOT NULL,
  period ENUM('hourly', 'daily', 'weekly', 'monthly') NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  emailRecipients TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_user_alerts (userId),
  INDEX idx_company_alerts (companyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LLM Alert History
CREATE TABLE IF NOT EXISTS llm_alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alertId INT NOT NULL,
  triggeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  alertType VARCHAR(50) NOT NULL,
  threshold DECIMAL(10,2) NOT NULL,
  actualValue DECIMAL(10,2) NOT NULL,
  message TEXT,
  emailSent BOOLEAN DEFAULT FALSE,
  emailSentAt TIMESTAMP NULL,
  FOREIGN KEY (alertId) REFERENCES llm_usage_alerts(id) ON DELETE CASCADE,
  INDEX idx_triggered_at (triggeredAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LLM Cost Tracking
CREATE TABLE IF NOT EXISTS llm_cost_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usageLogId INT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  feature VARCHAR(100) NOT NULL,
  tokensUsed INT NOT NULL,
  costPerToken DECIMAL(10,8) NOT NULL,
  totalCost DECIMAL(10,4) NOT NULL,
  companyId INT NULL,
  userId INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usageLogId) REFERENCES llm_usage_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_company_cost (companyId, createdAt),
  INDEX idx_user_cost (userId, createdAt),
  INDEX idx_provider_cost (provider, createdAt),
  INDEX idx_feature_cost (feature, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LLM Fallback Configuration
CREATE TABLE IF NOT EXISTS llm_fallback_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  priority INT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  maxRetries INT DEFAULT 3,
  retryDelayMs INT DEFAULT 1000,
  healthCheckIntervalMs INT DEFAULT 60000,
  lastHealthCheck TIMESTAMP NULL,
  isHealthy BOOLEAN DEFAULT TRUE,
  failureCount INT DEFAULT 0,
  lastFailureAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_priority (priority),
  INDEX idx_priority (priority, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LLM Fallback Events Log
CREATE TABLE IF NOT EXISTS llm_fallback_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fromProvider VARCHAR(50) NOT NULL,
  toProvider VARCHAR(50) NOT NULL,
  reason TEXT,
  feature VARCHAR(100),
  success BOOLEAN NOT NULL,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (createdAt),
  INDEX idx_from_provider (fromProvider),
  INDEX idx_to_provider (toProvider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
